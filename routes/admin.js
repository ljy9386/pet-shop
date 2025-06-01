// routes/admin.js
const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const User = require('../models/User'); 

router.get('/payments', async (req, res) => {
  try {
    const allPayments = await Payment.find().sort({ paidAt: -1 });
    res.json(allPayments);
  } catch (err) {
    console.error("❌ 관리자 결제내역 조회 오류:", err);
    res.status(500).json({ error: "조회 실패" });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }); // 최근 가입순
    res.json(users);
  } catch (err) {
    console.error("❌ 회원목록 조회 실패:", err);
    res.status(500).json({ error: "조회 실패" });
  }
});

module.exports = router;
