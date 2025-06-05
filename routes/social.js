const express = require("express");
const router = express.Router();
const User = require("../models/User"); // 사용자 모델

// 소셜 가입 처리
router.post("/social-signup", async (req, res) => {
  try {
    console.log("🔥 받은 데이터:", req.body);
    const {
      name,
      postalCode,
      address,
      phone,
      pet
    } = req.body;

    if (!name || !phone || !pet?.name || !pet?.breed) {
      return res.status(400).json({ message: "필수 항목 누락" });
    }

    const timestamp = Date.now();
    if (!timestamp) {
      console.log("❗ timestamp null 에러 발생");
      return res.status(500).json({ message: "타임스탬프 오류" });
    }

    const newUser = new User({
      user_id: `social_${timestamp}`,
      password: `socialpass_${timestamp}`,
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
    console.error("소셜 가입 오류:", err);
    return res.status(500).json({ message: "서버 오류" });
  }
});

module.exports = router;