// routes/social.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 소셜 가입(추가정보 저장) 처리
router.post('/social-signup', async (req, res) => {
  try {
    console.log('🔥 받은 데이터 (social-signup):', req.body);

    // 클라이언트에서 넘어온 모든 필드 추출
    const {
      user_id,
      email,
      ser_id,
      name,
      postalCode,
      address,
      phone,
      pet
    } = req.body;

    // 필수 값 체크
    if (!user_id || !email || !name || !phone || !pet?.name || !pet?.breed) {
      return res.status(400).json({ message: '필수 항목 누락' });
    }

    // 이미 DB에 있는 user_id인지 확인
    const existingUser = await User.findOne({ user_id });
    if (!existingUser) {
      // 이론상 여기로 오면 안됨: 기존 social-login에서 생성된 세션 정보가 있어야 함
      return res.status(404).json({ message: '유저 정보 없음' });
    }

    // DB에 추가정보 업데이트
    const updatedUser = await User.findOneAndUpdate(
      { user_id },
      {
        $set: {
          ser_id,
          email,
          name,
          postalCode,
          address,
          phone,
          pet: {
            name: pet.name,
            breed: pet.breed,
            birth: pet.birth || ''
          }
        }
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: '유저 없음' });
    }

    console.log('✅ 소셜 추가정보 저장 완료:', updatedUser.user_id);
    return res.status(200).json({ message: '추가정보 저장 완료' });
  } catch (err) {
    console.error('❌ 추가정보 저장 에러:', err);
    return res.status(500).json({ message: '서버 오류' });
  }
});

module.exports = router;
