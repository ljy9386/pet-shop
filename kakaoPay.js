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
        approval_url: "https://miraclepet.kr/payment-success.html",
        cancel_url: "https://miraclepet.kr/payment-cancel.html",
        fail_url: "https://miraclepet.kr/payment-fail.html",
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
    const { pg_token, tid, userId, name, serviceType, totalAmount } = req.body;

    console.log("💬 승인 요청 데이터:", { pg_token, tid, userId, name, serviceType, totalAmount });

    // 1. 카카오페이 승인 요청
    const kakaoRes = await axios.post(
      "https://kapi.kakao.com/v1/payment/approve",
      new URLSearchParams({
        cid: "TC0ONETIME",
        tid,
        partner_order_id: "miracle_order_001",
        partner_user_id: "miracle_user_001",
        pg_token,
      }),
      {
        headers: {
          Authorization: `KakaoAK ${process.env.KAKAO_ADMIN_KEY}`,
          "Content-type": "application/x-www-form-urlencoded;charset=utf-8",
        },
      }
    );

    // 2. DB에 결제 내역 저장
    const newPayment = new Payment({
      userId,
      name,
      serviceType,
      totalAmount,
      approved: true,
      paidAt: new Date(),
    });

    await newPayment.save();

    // 3. 응답
    res.json({ success: true, data: kakaoRes.data });

  } catch (err) {
    console.error("❌ 승인 또는 저장 실패:", err.response?.data || err.message);
    res.status(500).json({ success: false, message: "결제 승인/저장 실패" });
  }
});


module.exports = router;
