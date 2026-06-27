const mysql = require('mysql2');
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10
});
db.connect(err => {
  if (err) console.error(err);
  else console.log('DB connected!');
});

module.exports = db;
