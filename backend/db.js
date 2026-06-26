const mysql = require('mysql2');
const db = mysql.createConnection({
  host: 'localhost',
  user: 'forsaty_user',
  password: 'aSaMa199!',
  database: 'forsaty_db',
  port: 3306
});

db.connect(err => {
  if (err) console.error(err);
  else console.log('DB connected!');
});

module.exports = db;