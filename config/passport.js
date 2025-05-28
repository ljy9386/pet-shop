// config/passport.js
const KakaoStrategy = require('passport-kakao').Strategy;

module.exports = (passport) => {
  // 카카오 로그인 전략 설정
  passport.use(new KakaoStrategy({
    clientID: process.env.KAKAO_CLIENT_ID,
    callbackURL: "https://miraclepet-backend.onrender.com/auth/kakao/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    console.log("🎯 카카오 로그인 성공:", profile._json);
    return done(null, profile); // DB 저장은 추후 확장
  }));

  // 로그인 유저 세션 저장
  passport.serializeUser((user, done) => {
    done(null, user); // 전체 유저 객체를 그대로 저장
  });

  // 세션에서 유저 정보 복원
  passport.deserializeUser((user, done) => {
    done(null, user); // 복원도 그대로 전달
  });
};
