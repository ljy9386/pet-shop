// config/passport.js
const passport = require('passport');
const KakaoStrategy = require('passport-kakao').Strategy;
const NaverStrategy = require('passport-naver').Strategy;

module.exports = (passport) => {
  // ✅ Kakao 로그인 전략
  passport.use(new KakaoStrategy({
    clientID: process.env.KAKAO_CLIENT_ID,
    callbackURL: "https://miraclepet.kr/auth/kakao/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    console.log("🎯 카카오 로그인 성공:", profile._json);
    return done(null, profile);
  }));

  // ✅ Naver 로그인 전략
  passport.use(new NaverStrategy({
    clientID: process.env.NAVER_CLIENT_ID,
    clientSecret: process.env.NAVER_CLIENT_SECRET,
    callbackURL: 'https://miraclepet.kr/auth/naver/callback'
  }, (accessToken, refreshToken, profile, done) => {
    console.log("✅ NAVER PROFILE:", profile);
    const userData = {
      user_id: `naver_${profile.id}`,
      name: profile.displayName,
      email: profile.emails?.[0]?.value || '',
      provider: 'naver'
    };
    return done(null, userData);
  }));

  // ✅ 세션 처리
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });
};

// ✅ 구글 로그인 전략

const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'https://miraclepet.kr/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
  const user = {
    user_id: `google_${profile.id}`,
    name: profile.displayName || '구글회원',
    email: profile.emails?.[0]?.value || '',
    provider: 'google'
  };
  return done(null, user);
}));

