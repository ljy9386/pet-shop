// db.js
const sqlite3 = require("sqlite3").verbose();

// users.db라는 이름의 SQLite 데이터베이스 파일 생성 (없으면 새로 만듦)
const db = new sqlite3.Database("users.db");

db.serialize(() => {
  // users 테이블 생성: id, username, email, password
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT
    )`,
    (err) => {
      if (err) {
        console.error("테이블 생성 실패:", err.message);
      } else {
        console.log("users 테이블 생성(또는 이미 존재) 완료!");
      }
    }
  );
});

module.exports = db;