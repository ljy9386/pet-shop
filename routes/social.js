const express = require("express");
const router = express.Router();
const User = require("../models/User"); // 사용자 모델

// 소셜 가입 처리
router.post("/api/social-signup", async (req, res) => {
  try {
    console.log("🔥 받은 데이터:", req.body);
    const {
      name,
      postalCode,
      address,
      phone,
      petName,
      petBreed,
      petBirth
    } = req.body;

    if (!name || !phone || !petName || !petBreed) {
      return res.status(400).json({ message: "필수 항목 누락" });
    }

    // ✅ 필수값 강제 채우기
    const dummyPassword = `socialLogin_${Date.now()}`;
    const dummyUserId = `social_${Date.now()}`;

    const timestamp = Date.now(); // 매번 다르게 만들기
    console.log("📌 timestamp 값:", timestamp);
    if (!timestamp) {
      console.log("❗ timestamp null 에러 발생");
      return res.status(500).json({ message: "타임스탬프 오류" });
    }

    const newUser = new User({
      user_id: `social_${timestamp}`, // ✅ null 안 들어가게
      ser_id: `social_${timestamp}`,
      password: `socialpass_${timestamp}`,
      email: `social_${timestamp}@dummy.com`,
      name,
      postalCode,
      address,
      phone,
      pet: {
        name: petName,
        breed: petBreed,
        birth: petBirth
      }
    });
    console.log("🧾 저장할 유저:", newUser);

    await newUser.save();

    return res.status(200).json({ message: "가입 성공" });
  } catch (err) {
    console.error("소셜 가입 오류:", err);
    return res.status(500).json({ message: "서버 오류" });
  }
});

module.exports = router;