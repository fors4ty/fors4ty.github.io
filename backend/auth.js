const jwt = require('jsonwebtoken');
const db = require('./db');

async function checkAuth(req) {
  try {
    const token = req.cookies?.authToken;
    if (!token) return null;

    // استخدام JWT_SECRET من Render
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.user_id;

    return new Promise((resolve) => {
      db.query(
        'SELECT name, email, phone, user_id, avatar FROM users WHERE user_id = ?',
        [userId],
        (err, result) => {
          if (err || result.length === 0) return resolve(null);

          const user = result[0];

          // تعديل مسار الصورة
          if (user.avatar && !user.avatar.startsWith('fa-')) {
            user.avatar = '/' + user.avatar;
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
