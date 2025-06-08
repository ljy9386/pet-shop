const express = require("express");
const router = express.Router();
const User = require("../models/User"); // 사용자 모델
const passport = require("passport");
const axios = require("axios");

// 소셜 가입 처리
router.post("/social-signup", async (req, res) => {
  try {
    console.log("🔥 받은 데이터:", req.body);
    const {
      user_id,
      name,
      postalCode,
      address,
      phone,
      pet
    } = req.body;

    if (!user_id || !name || !phone || !pet?.name || !pet?.breed) {
      return res.status(400).json({ message: "필수 항목 누락" });
    }

    const newUser = new User({
      user_id,
      password: '',
      name,
      postalCode,
      address,
      phone,
      provider: user_id.startsWith('kakao_') ? 'kakao' : 
                user_id.startsWith('google_') ? 'google' : 
                user_id.startsWith('naver_') ? 'naver' : 'local',
      pet: {
        name: pet.name,
        breed: pet.breed,
        birth: pet.birth
      }
    });

    console.log("🧾 저장할 유저:", newUser);
    await newUser.save();

    return res.status(200).json({ message: "가입 성공" });
  } catch (err) {
    console.error("❌ 소셜 가입 오류:", {
      message: err.message,
      stack: err.stack,
      name: err.name,
      code: err.code
    });
    return res.status(500).json({ 
      message: "서버 오류", 
      error: err.message,
      code: err.code 
    });
  }
});

// 기존 소셜 유저 정보 업데이트 (추가입력 저장용)
router.post("/social-update", async (req, res) => {
  try {
    const {
      user_id,
      name,
      phone,
      address,
      postalCode,
      pet
    } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: "user_id 누락" });
    }

    const updatedUser = await User.findOneAndUpdate(
      { user_id },
      {
        $set: {
          name,
          phone,
          address,
          postalCode,
          pet
        }
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "유저 없음" });
    }

    console.log("✅ 소셜 추가정보 저장 완료:", updatedUser.user_id);
    return res.status(200).json({ message: "추가정보 저장 완료" });

  } catch (err) {
    console.error("❌ 추가정보 저장 에러:", err);
    return res.status(500).json({ message: "서버 오류" });
  }
});

// 소셜 유저 존재 여부 확인 API
router.get("/social-user-exists/:user_id", async (req, res) => {
  const { user_id } = req.params;
  const user = await User.findOne({ user_id });
  if (user) {
    console.log(`✅ 유저 있음: ${user_id}`);
  } else {
    console.log(`❌ 유저 없음: ${user_id}`);
  }
  res.json({ exists: !!user });
});

// 카카오 로그인
router.get("/kakao", async (req, res) => {
  try {
    console.log("🔑 카카오 로그인 시작");
    const redirectUri = "https://miraclepet.kr/api/social/kakao/callback";
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.KAKAO_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code`;
    console.log("🔗 카카오 인증 URL:", kakaoAuthUrl);
    res.json({ url: kakaoAuthUrl });
  } catch (err) {
    console.error("❌ 카카오 로그인 에러:", err);
    res.status(500).json({ message: "카카오 로그인 처리 중 오류가 발생했습니다." });
  }
});

// 카카오 로그인 콜백
router.get("/kakao/callback", async (req, res) => {
  try {
    console.log("📥 카카오 콜백 수신:", req.query);
    const { code } = req.query;
    if (!code) {
      console.log("❌ 인증 코드 누락");
      return res.redirect("/login?error=인증 코드가 없습니다.");
    }

    // 카카오 토큰 받기
    const tokenResponse = await axios.post(
      "https://kauth.kakao.com/oauth/token",
      {
        grant_type: "authorization_code",
        client_id: process.env.KAKAO_CLIENT_ID,
        redirect_uri: "https://miraclepet.kr/api/social/kakao/callback",
        code,
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
        },
      }
    );

    const { access_token } = tokenResponse.data;
    console.log("✅ 카카오 토큰 획득");

    // 카카오 사용자 정보 가져오기
    const userResponse = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const kakaoUser = userResponse.data;
    console.log("✅ 카카오 사용자 정보:", kakaoUser);

    // 사용자 정보 구성
    const userData = {
      user_id: `kakao_${kakaoUser.id}`,
      name: kakaoUser.properties.nickname,
      email: kakaoUser.kakao_account.email,
      provider: "kakao"
    };

    // 사용자 찾기 또는 생성
    let user = await User.findOne({ user_id: userData.user_id });
    if (!user) {
      console.log("👤 새 사용자 생성");
      user = await User.create(userData);
    }

    console.log("👤 최종 사용자 정보:", user);

    // 세션에 사용자 정보 저장
    req.session.user = {
      user_id: user.user_id,
      name: user.name,
      provider: user.provider,
      isLoggedIn: true
    };
    req.session.isLoggedIn = true;

    // 세션 저장
    req.session.save((err) => {
      if (err) {
        console.error("❌ 세션 저장 실패:", err);
        return res.redirect("/login?error=세션 저장 실패");
      }
      console.log("✅ 세션 저장 성공:", req.session);
    });

    // 로그인 페이지로 리다이렉트
    const encodedUserData = encodeURIComponent(JSON.stringify(userData));
    console.log("🔄 로그인 페이지로 리다이렉트:", `/login?userData=${encodedUserData}`);
    res.redirect(`/login?userData=${encodedUserData}`);
  } catch (err) {
    console.error("❌ 카카오 콜백 에러:", err);
    res.redirect("/login?error=카카오 로그인 처리 중 오류가 발생했습니다.");
  }
});

// 구글 로그인 콜백
router.get("/google/callback", async (req, res) => {
  try {
    console.log("📥 구글 콜백 수신");
    const { code } = req.query;
    if (!code) {
      console.log("❌ 인증 코드 누락");
      return res.redirect("/login?error=인증 코드가 없습니다.");
    }

    // 구글 토큰 받기
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: "https://miraclepet.kr/api/social/google/callback",
        grant_type: "authorization_code",
      }
    );

    const { access_token } = tokenResponse.data;
    console.log("✅ 구글 토큰 획득");

    // 구글 사용자 정보 가져오기
    const userResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const googleUser = userResponse.data;
    console.log("✅ 구글 사용자 정보:", googleUser);

    // 사용자 정보 구성
    const userData = {
      user_id: `google_${googleUser.id}`,
      name: googleUser.name,
      email: googleUser.email,
      provider: "google"
    };

    // 사용자 찾기 또는 생성
    let user = await User.findOne({ user_id: userData.user_id });
    if (!user) {
      console.log("👤 새 사용자 생성");
      user = await User.create(userData);
    }

    // 로그인 페이지로 리다이렉트
    const encodedUserData = encodeURIComponent(JSON.stringify(userData));
    res.redirect(`/login?userData=${encodedUserData}`);
  } catch (err) {
    console.error("❌ 구글 콜백 에러:", err);
    res.redirect("/login?error=구글 로그인 처리 중 오류가 발생했습니다.");
  }
});

// user_id로 유저 정보 반환 API
router.get('/user/get/:user_id', async (req, res) => {
  const { user_id } = req.params;
  const user = await User.findOne({ user_id });
  if (!user) {
    return res.status(404).json({ message: '유저 없음' });
  }
  res.json(user);
});

module.exports = router;