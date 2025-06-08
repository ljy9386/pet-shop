const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },
  
  email: { type: String, required: false, unique: true, sparse: true},
  name: { type: String, required: true },
  password: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  postalCode: { type: String, required: true },
  admin: { type: Boolean, default: false },
  tempPassword: String,

  // ✅ 반려동물 정보 추가
  pet: {
    name: { type: String, required: true },
    breed: { type: String, required: true },
    birth: { type: String }  // 선택 입력 가능
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);