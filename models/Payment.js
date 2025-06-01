// Payment.js
const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  userId: String,
  name: String,
  serviceType: String,
  totalAmount: Number,
  approved: Boolean,
  paidAt: Date
});

module.exports = mongoose.model('Payment', PaymentSchema); // ✅ 이 줄 확인!
