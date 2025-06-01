// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const path = require('path');

require('./config/passport')(passport);

const authRouter = require('./routes/auth');
const userRouter = require('./routes/user');
const socialRoutes = require('./routes/social');
const kakaoPayRouter = require('./routes/kakaoPay'); // ✅ 카카오페이 라우터 추가
const adminRoutes = require('./routes/admin');       // ✅ 관리자 라우터 추가

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// 라우터 연결
app.use('/api', socialRoutes);
app.use('/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/kakao', kakaoPayRouter);
app.use('/api/admin', adminRoutes); // ✅ 관리자 API 연결

// 정적 파일 서빙
app.use(express.static(path.join(__dirname, 'public')));

// 기본 라우터
app.get('/', (req, res) => {
  res.send('✅ 서버 정상 작동 중');
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`🌐 Server running at http://localhost:${PORT}`);
});
