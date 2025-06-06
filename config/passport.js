// config/passport.js
const passport = require('passport');
const User = require('../models/User');                       // ← User 모델 import 추가
const KakaoStrategy = require('passport-kakao').Strategy;
const NaverStrategy = require('passport-naver').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;

module.exports = (passport) => {
  // ✅ Kakao 로그인 전략
  passport.use(new KakaoStrategy({
    clientID: process.env.KAKAO_REST_API_KEY,                  // ← 환경변수에서 REST API 키를 가져오도록 수정
    callbackURL: "https://miraclepet.kr/auth/kakao/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ user_id: profile.id });
      if (!user) {
        user = await User.create({
          user_id: profile.id,
          name: profile.displayName,
          email: (profile._json.kakao_account.email || ""),
          password: `social_${Date.now()}`,
          address: "",
          phone: "",
          postalCode: "",
          pet: { name: "", breed: "", birth: "" }
        });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
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
