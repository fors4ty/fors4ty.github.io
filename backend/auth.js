// auth.js
const jwt = require('jsonwebtoken');
const db = require('./db');

async function checkAuth(req, db) {
  try {
    const token = req.cookies?.authToken; // قراءة الكوكي
    if (!token) return null;

    const decoded = jwt.verify(token, 'SECRET_KEY'); // ضع مفتاحك
    const userId = decoded.user_id;

    return new Promise((resolve) => {
      db.query(
        'SELECT name, email, phone, user_id, avatar FROM users WHERE user_id = ?',
        [userId],
        (err, result) => {
          if (err) return resolve(null);
          if (result.length === 0) return resolve(null);

          const user = result[0];

          // إذا كانت صورة، أضف مسار كامل للوصول من المتصفح
          if (user.avatar && !user.avatar.startsWith('fa-')) {
            user.avatar = '/' + user.avatar; // لأنك تستخدم: app.use('/uploads', express.static('uploads'))
          }

          resolve(user);
        }
      );
    });
  } catch (err) {
    return null;
  }
}

module.exports = checkAuth;