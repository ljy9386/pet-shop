const express = require('express');
const router = express.Router();
const User = require('../models/User'); // ✅ 기존 모델 재사용

router.get("/check/:userId", async (req, res) => {
  const user = await User.findOne({ user_id: req.params.userId });
  res.json({ exists: !!user });
});

module.exports = router;