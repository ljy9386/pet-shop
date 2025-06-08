const express = require("express");
const router = express.Router();
const User = require("../models/User"); // 사용자 모델
const passport = require("passport");

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

// 예시: 구글/카카오/네이버 콜백
router.get('/kakao/callback',
  passport.authenticate('kakao', { failureRedirect: '/login.html' }),
  async (req, res) => {
    const user = req.user;
    // user 정보를 localStorage에 저장하고 메인으로 이동
    res.send(`
      <script>
        localStorage.setItem("user", ${JSON.stringify(JSON.stringify(user))});
        window.location.href = "/index.html";
      </script>
    `);
  }
);

// 네이버 콜백
router.get('/naver/callback',
  passport.authenticate('naver', { failureRedirect: '/login', session: true }),
  async (req, res) => {
    const user = req.user;
    res.send(`
      <script>
        localStorage.setItem("user", ${JSON.stringify(JSON.stringify(user))});
        window.location.href = "/index.html";
      </script>
    `);
  }
);

// 구글 콜백
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: true }),
  async (req, res) => {
    const user = req.user;
    res.send(`
      <script>
        localStorage.setItem("user", ${JSON.stringify(JSON.stringify(user))});
        window.location.href = "/index.html";
      </script>
    `);
  }
);

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