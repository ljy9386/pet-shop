// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
require('./config/passport')(passport); // ✅ 함수 호출 형태로 설정 연결

const authRouter = require('./routes/auth');
const userRouter = require('./routes/user');

const app = express();

// 파서
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//소셜 라우터 연결
const socialRoutes = require('./routes/social');
app.use("/", socialRoutes);

// 세션
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your_fallback_secret',
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// DB 연결
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error('❗️ MONGO_URI 환경변수가 설정되지 않았습니다. .env 파일을 확인하세요.');
  process.exit(1);
}
mongoose
  .connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB connected (DB: miracledb)'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// 라우터
app.use('/auth', authRouter);
app.use('/api/user', userRouter);

// 정적 파일
app.use(express.static(path.join(__dirname, 'public')));

// 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Server running at http://localhost:${PORT}`);
});
