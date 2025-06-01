const express = require("express");
const axios = require("axios");
const router = express.Router();
const Payment = require("../models/Payment");

router.post("/pay", async (req, res) => {
  const { item_name, total_amount } = req.body;

  try {
    const response = await axios.post(
      "https://kapi.kakao.com/v1/payment/ready",
      new URLSearchParams({
        cid: "TC0ONETIME", // 테스트용 CID
        partner_order_id: "miracle_order_001",
        partner_user_id: "miracle_user_001",
        item_name,
        quantity: 1,
        total_amount,
        vat_amount: 0,
        tax_free_amount: 0,
        approval_url: "https://miraclepet.kr/pay/success",
        cancel_url: "https://miraclepet.kr/pay/cancel",
        fail_url: "https://miraclepet.kr/pay/fail"
      }),
      {
        headers: {
          Authorization: `KakaoAK ${process.env.KAKAO_ADMIN_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
        }
      }
    );

    console.log("✅ 카카오 결제 ready 성공");
    res.json({ next_redirect_pc_url: response.data.next_redirect_pc_url });
  } catch (error) {
    console.error("❌ 카카오 결제 ready 실패:", error.response?.data || error.message);
    res.status(500).json({ error: "결제 준비 중 오류 발생" });
  }
});

router.post("/approve", async (req, res) => {
  try {
    const { userId, name, serviceType, totalAmount } = req.body;

    const newPayment = new Payment({
      userId,
      name,
      serviceType,
      totalAmount,
      approved: true,
      paidAt: new Date()
    });

    await newPayment.save();
    res.json({ success: true });
  } catch (err) {
    console.error("❌ 결제 정보 저장 오류:", err);
    res.status(500).json({ success: false, message: "DB 저장 실패" });
  }
});

module.exports = router;
