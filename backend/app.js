const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const db = require('./db');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const checkAuth = require('./auth.js');
const fetch = require('node-fetch');
const path = require('path');
const app = express();
const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');

/* ===== Middlewares ===== */
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(bodyParser.json());
app.use(cookieParser());

db.connect(err => {
  if (err) {
    console.error('خطأ في الاتصال بقاعدة البيانات:', err);
    return;
  }
  console.log('MySQL connected!');
});

/* ===== توليد ID فريد ===== */
function generateUniqueUserID(callback) {
  function attempt() {
    const userID = Math.floor(1000000 + Math.random() * 9000000);
    db.query(
      'SELECT user_id FROM users WHERE user_id = ?',
      [userID],
      (err, result) => {
        if (err) return callback(err);
        if (result.length > 0) attempt();
        else callback(null, userID);
      }
    );
  }
  attempt();
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'fors4ty@gmail.com',       // بريدك الشخصي
    pass: 'dxclowehkvybxwdd'      // الباسورد الطويل الذي حصلت عليه
  }
});

const codes = {};   // لتخزين الأكواد المؤقتة: { email: { code, expiresAt } }
const tokens = {};  // لتخزين التوكن المؤقت لتغيير كلمة السر: { token: email }

// توليد كود 4 أرقام
function generateCode() {
  return Math.floor(1000 + Math.random() * 9000);
}

// توليد توكن مؤقت
function generateToken() {
  return Math.random().toString(36).substring(2, 12);
}

// 1️⃣ إرسال الكود
app.post('/send-code', (req, res) => {
  const { email } = req.body;
  db.query('SELECT * FROM users WHERE email=?', [email], (err, result) => {
    if (err || result.length === 0)
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    const code = generateCode();
    const expiresAt = Date.now() + 2 * 60 * 1000; // 2 دقيقة
    db.query('DELETE FROM reset_codes WHERE expires_at < ?', [Date.now()]);
    db.query(
      'REPLACE INTO reset_codes (email, code, expires_at) VALUES (?, ?, ?)',
      [email, code, expiresAt],
      (err) => {
        if (err) return res.status(500).json({ message: 'خطأ في قاعدة البيانات' });
        transporter.sendMail({
          from: '"Forsaty" <fors4ty@gmail.com>',
          to: email,
          subject: `رمز التحقق الخاص بك: ${code}`,
          text: `هذا الرمز صالح لمدة دقيقتين فقط. إذا لم تطلبه، تجاهل هذه الرسالة.`
        }, (err) => {
          if (err) return res.status(500).json({ message: 'تعذر إرسال البريد' });
          res.json({ message: 'تم إرسال الكود' });
        });
      }
    );
  });
});

// 2️⃣ التحقق من الكود
app.post('/verify-code', (req, res) => {
  const { email, code } = req.body;
  db.query('DELETE FROM reset_codes WHERE expires_at < ?', [Date.now()]);
  db.query('SELECT * FROM reset_codes WHERE email=?', [email], (err, rows) => {
    if (err || rows.length === 0)
      return res.status(400).json({ message: 'لا يوجد كود صالح' });
    const record = rows[0];
    if (parseInt(code) !== record.code)
      return res.status(400).json({ message: 'الرمز غير صحيح' });
    if (Date.now() > record.expires_at)
      return res.status(400).json({ message: 'انتهت صلاحية الكود' });
    db.query('DELETE FROM reset_codes WHERE email=?', [email]);
    const token = generateToken();
    tokens[token] = email;
    res.json({ message: 'تم التحقق بنجاح', token });
  });
});

// 3️⃣ تغيير كلمة السر باستخدام التوكن المؤقت
app.post('/reset-password', async (req, res) => {
  const { email, newPassword, token } = req.body;
  if (!tokens[token] || tokens[token] !== email) {
    return res.status(403).json({ success: false, message: 'توكن غير صالح أو انتهت صلاحيته' });
  }
  const hashed = await bcrypt.hash(newPassword, 10);
  db.query('UPDATE users SET password=? WHERE email=?', [hashed, email], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'خطأ في تحديث كلمة السر' });
    delete tokens[token]; // حذف التوكن بعد الاستخدام
    res.json({ success: true, message: 'تم تغيير كلمة السر بنجاح' });
  });
});

/* ===== AUTH / ME ===== */
app.get('/auth/me', async (req, res) => {
  try {
    const user = await checkAuth(req, db); // تحقق من الكوكي والJWT
    if (!user) return res.json({ success: false, user: null });
    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.json({ success: false, user: null });
  }
});

/* ===== SIGNUP ===== */
app.post('/signup', async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !password) {
    return res.json({ success: false, message: 'يرجى إدخال الاسم وكلمة المرور' });
  }
  // يجب إدخال إيميل أو هاتف على الأقل
  if ((!email || email.trim() === '') && (!phone || phone.trim() === '')) {
    return res.json({ success: false, message: 'الرجاء إدخال البريد الإلكتروني أو رقم الهاتف' });
  }
  // تحقق من التكرار فقط للقيم غير الفارغة
  let query = 'SELECT * FROM users WHERE 1=0';
  let params = [];
  if (email && email.trim() !== '') {
    query += ' OR email = ?';
    params.push(email);
  }
  if (phone && phone.trim() !== '') {
    query += ' OR phone = ?';
    params.push(phone);
  }
  db.query(query, params, async (err, result) => {
    if (err) return res.json({ success: false, message: 'خطأ في قاعدة البيانات' });
    if (result.length > 0) return res.json({ success: false, message: 'المستخدم موجود مسبقًا' });
    const hashedPassword = await bcrypt.hash(password, 10);
    generateUniqueUserID((err, userID) => {
      if (err) return res.json({ success: false, message: 'فشل إنشاء معرف المستخدم' });
      db.query(
        'INSERT INTO users (name, email, phone, password, user_id) VALUES (?, ?, ?, ?, ?)',
        [name, email || "", phone || "", hashedPassword, userID],
        (err2) => {
          if (err2) return res.json({ success: false, message: 'خطأ أثناء إنشاء المستخدم' });
          // تسجيل الدخول تلقائي بعد الإنشاء
          const token = jwt.sign({ user_id: userID }, process.env.JWT_SECRET, { expiresIn: '1d' });
          res.cookie('authToken', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: 'none',
            secure: true
          });
          res.json({ success: true, message: 'تم إنشاء الحساب بنجاح' });
        }
      );
    });
  });
});

/* ===== LOGIN ===== */
app.post('/login', (req, res) => {
  const { loginValue, password, remember } = req.body;
  // لا يسمح بالقيم الفارغة لتسجيل الدخول
  if (!loginValue || loginValue.trim() === '') {
    return res.json({ success: false, message: 'يرجى إدخال البريد الإلكتروني أو رقم الهاتف' });
  }
  const expiresIn = remember ? '7d' : '1d';
  const maxAge = remember ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  let query = '';
  let params = [];
  const onlyDigits = loginValue.replace(/\s/g, '');
if (/^\d+$/.test(onlyDigits)) {
  query = 'SELECT * FROM users WHERE phone = ? OR user_id = ?';
  params = [loginValue, Number(onlyDigits)];
} else {
  query = 'SELECT * FROM users WHERE email = ? AND email <> ""';
  params = [loginValue];
}
  db.query(query, params, async (err, result) => {
    if (err) return res.json({ success: false, message: 'خطأ في قاعدة البيانات' });
    if (result.length === 0) return res.json({ success: false, message: 'المستخدم غير موجود' });
    const user = result[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.json({ success: false, message: 'كلمة المرور غير صحيحة' });
    const token = jwt.sign({ user_id: user.user_id }, process.env.JWT_SECRET, { expiresIn });
    res.cookie('authToken', token, {
      httpOnly: true,
      maxAge: maxAge,
      sameSite: 'none',
      secure: true
    });
    res.json({ success: true });
  });
});

// صفحة استقبال التوكن بعد popup
const CLIENT_ID = "1089008954789-jn5ms5urevmqe99jkk4b4247l3rrki42.apps.googleusercontent.com";
const APP_SECRET = '437aff8692a41ee85a250e923a8dc4c3';
async function downloadAvatar(url, filename) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch avatar');
  const buffer = await res.buffer();
  const savePath = path.join(__dirname, 'uploads/users', filename);
  fs.writeFileSync(savePath, buffer);
  return filename;
}

// =====================
// Google OAuth
// =====================
app.post('/google-auth', async (req, res) => {
  const { access_token } = req.body;
  if (!access_token) return res.status(400).json({ success: false, message: 'لا يوجد access_token' });

  try {
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const userInfo = await googleRes.json();

    if (!userInfo.email) return res.status(401).json({ success: false, message: 'فشل التحقق من Google' });

    const email = userInfo.email;
    const name = userInfo.name || 'Google User';
    const avatarUrl = userInfo.picture || null;

    db.query('SELECT * FROM users WHERE email=?', [email], async (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'خطأ في السيرفر' });

      if (result.length > 0) {
        // مستخدم موجود -> لا نغير الصورة
        const jwtToken = jwt.sign({ user_id: result[0].user_id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.cookie('authToken', jwtToken, { httpOnly: true, sameSite: 'none', secure: true });
        return res.json({ success: true, message: 'تم تسجيل الدخول' });
      } else {
        // مستخدم جديد -> إنشاء الحساب مع الصورة
        generateUniqueUserID(async (err, userID) => {
          if (err) return res.status(500).json({ success: false, message: 'فشل إنشاء معرف المستخدم' });

          let avatarFile = '';
          if (avatarUrl) {
            const filename = `${userID}_${Date.now()}.jpg`;
            try { avatarFile = await downloadAvatar(avatarUrl, filename); } 
            catch (e) { console.error("Failed to download Google avatar:", e); }
          }

          db.query(
            'INSERT INTO users (name, email, user_id, password, phone, avatar) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, userID, '', '', avatarFile],
            (err2) => {
              if (err2) return res.status(500).json({ success: false, message: 'خطأ في قاعدة البيانات' });

              const jwtToken = jwt.sign({ user_id: userID }, process.env.JWT_SECRET, { expiresIn: '1d' });
              res.cookie('authToken', jwtToken, { httpOnly: true, sameSite: 'none', secure: true });
              return res.json({ success: true, message: 'تم إنشاء الحساب وتسجيل الدخول' });
            }
          );
        });
      }
    });
  } catch (err) {
    console.error(err);
    res.status(401).json({ success: false, message: 'خطأ Google OAuth' });
  }
});

// =====================
// Facebook OAuth
// =====================
app.post('/facebook-auth', async (req, res) => {
  const { access_token } = req.body;
  if (!access_token) return res.json({ success: false, message: 'لا يوجد access_token' });

  try {
    const userRes = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${access_token}`
    );
    const userData = await userRes.json();

    const email = userData.email || null;
    const name = userData.name || 'Facebook User';
    const avatarUrl = userData.picture?.data?.url || null;
    const hasRealAvatar = userData.picture?.data?.is_silhouette === false;

    if (!email) return res.json({ success: false, message: 'حساب فيسبوك بدون بريد إلكتروني' });

    db.query('SELECT * FROM users WHERE email=?', [email], async (err, result) => {
      if (err) return res.json({ success: false, message: 'DB error' });

      if (result.length > 0) {
        // مستخدم موجود -> لا نغير الصورة
        const jwtToken = jwt.sign({ user_id: result[0].user_id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.cookie('authToken', jwtToken, { httpOnly: true, sameSite: 'none', secure: true });
        return res.json({ success: true });
      } else {
        // مستخدم جديد -> إنشاء الحساب مع الصورة
        generateUniqueUserID(async (err, userID) => {
          if (err) return res.json({ success: false });

          let avatarFile = '';
          if (avatarUrl && hasRealAvatar) {
            const filename = `${userID}_${Date.now()}.jpg`;
            try { avatarFile = await downloadAvatar(avatarUrl, filename); } 
            catch (e) { console.error("Failed to download avatar:", e); }
          }

          db.query(
            'INSERT INTO users (name, email, user_id, password, phone, avatar) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, userID, '', '', avatarFile],
            (err2) => {
              if (err2) return res.json({ success: false });

              const jwtToken = jwt.sign({ user_id: userID }, process.env.JWT_SECRET, { expiresIn: '1d' });
              res.cookie('authToken', jwtToken, { httpOnly: true, sameSite: 'none', secure: true });
              return res.json({ success: true });
            }
          );
        });
      }
    });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: 'Facebook OAuth error' });
  }
});

/* ===== LOGOUT ===== */
app.post('/logout', (req, res) => {
  res.cookie('authToken', '', {
    httpOnly: true,
    expires: new Date(0), // نجعل تاريخ الكوكي منتهي
    sameSite: 'none',
    secure: true
  });
  res.json({ success: true });
});

const storage = multer.diskStorage({
  destination: 'uploads/users',
  filename: (req, file, cb) => {
    cb(null, `${req.body.userID}_${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(null, false);
  }
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.post('/update-user', upload.single('avatar_image'), (req, res) => {
  const { userID, name, email, phone, avatar_icon } = req.body;

  if (!userID || !name || (!email && !phone)) {
    return res.json({
      success: false,
      message: 'الاسم ورقم الهاتف أو البريد الإلكتروني مطلوب'
    });
  }

  // تحديد avatar الجديد
  let avatar = null;
  if (req.file) {
    avatar = req.file.filename;
  } else if (avatar_icon) {
    avatar = avatar_icon; // fa-user-ninja
  }

  // استعلام التحقق من التكرار
  let checkQuery = 'SELECT user_id FROM users WHERE user_id != ?';
  let params = [userID];
  if (email) { checkQuery += ' AND email = ?'; params.push(email); }
  if (phone) { checkQuery += ' AND phone = ?'; params.push(phone); }

  db.query(checkQuery, params, (err, result) => {
    if (err) return res.json({ success: false, message: 'خطأ في قاعدة البيانات' });
    if (result.length > 0) return res.json({ success: false, message: 'مستخدم موجود مسبقًا' });

    // حذف الصورة القديمة إذا كانت موجودة وavatar جديد ليس أيقونة
    if (avatar && req.file) {
      db.query('SELECT avatar FROM users WHERE user_id = ?', [userID], (err, rows) => {
        if (!err && rows.length && rows[0].avatar.startsWith('uploads/')) {
          fs.unlink(rows[0].avatar, () => {});
        }
      });
    }

    // تحديث المستخدم
    const query = avatar
      ? 'UPDATE users SET name=?, email=?, phone=?, avatar=? WHERE user_id=?'
      : 'UPDATE users SET name=?, email=?, phone=? WHERE user_id=?';
    const values = avatar
      ? [name, email || '', phone || '', avatar, userID]
      : [name, email || '', phone || '', userID];

    db.query(query, values, err => {
      if (err) return res.json({ success: false, message: 'فشل تحديث البيانات' });
      res.json({ success: true, avatar });
    });
  });
});

/* ===== CHANGE PASSWORD ===== */
app.post('/change-password', async (req, res) => {
  const { userID, newPassword } = req.body;
  if (!userID || !newPassword)
    return res.json({ success: false });
  const hashed = await bcrypt.hash(newPassword, 10);
  db.query(
    'UPDATE users SET password=? WHERE user_id=?',
    [hashed, userID],
    () => res.json({ success: true })
  );
});

/* ===== DELETE ACCOUNT ===== */
app.post('/delete-account', (req, res) => {
  const { userID } = req.body;
  if (!userID) return res.json({ success: false });
  db.query(
    'DELETE FROM users WHERE user_id=?',
    [userID],
    () => res.json({ success: true })
  );
});

/* ===== USERS TABLE ===== */
app.get('/users', (req, res) => {
  db.query('SELECT id, user_id, name, email, phone, avatar FROM users', (err, users) => {
    let html = 
`<!DOCTYPE html>
<html lang="ar">
<head>
<meta charset="UTF-8">
<title>Users Table</title>
<style>
  body {
    background: #0f172a;
    color: #e5e7eb;
    font-family: Arial, sans-serif;
    padding: 20px;
  }
  h2 {
    margin-bottom: 16px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    background: #020617;
    border-radius: 12px;
    overflow: hidden;
  }
  th, td {
    padding: 12px;
    text-align: center;
    border-bottom: 1px solid #1e293b;
    cursor: pointer;
    user-select: none;
    transition: background 0.5s;
  }
  th {
    background: #020617;
    color: #38bdf8;
    font-weight: bold;
    cursor: default;
  }
  tr:last-child td {
    border-bottom: none;
  }
  .copied {
    background-color: #333333 !important;
    color: #fff !important;
  }
</style>
</head>
<body>
<h2>Users</h2>
<table>
  <tr>
    <th>ID</th>
    <th>User ID</th>
    <th>Name</th>
    <th>Email</th>
    <th>Phone</th>
    <th>Avatar</th>
  </tr>`;
    users.forEach(user => {
      html += 
  `<tr>
    <td data-copy="${user.id}">${user.id}</td>
    <td data-copy="${user.user_id}">${user.user_id}</td>
    <td data-copy="${user.name}">${user.name}</td>
    <td data-copy="${user.email}">${user.email}</td>
    <td data-copy="${user.phone}">${user.phone}</td>
    <td data-copy="${user.avatar}">${user.avatar}</td>
  </tr>`;
    });
    html += 
`</table>
<script>
  const copiedCells = new Set();
  document.querySelectorAll('td[data-copy]').forEach(cell => {
    cell.addEventListener('click', () => {
      const value = cell.getAttribute('data-copy');
      if (!copiedCells.has(value)) {
        navigator.clipboard.writeText(value).then(() => {
          copiedCells.add(value);
          cell.classList.add('copied');
          setTimeout(() => cell.classList.remove('copied'), 1000);
        });
      }
    });
  });
</script>
</body>
</html>`;
    res.send(html);
  });
});

app.use(express.static(__dirname + '/../'));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

/* ===== SERVER ===== */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
