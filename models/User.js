const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },
  name:      { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  password:  { type: String, required: true },
  address:   { type: String, required: true },
  phone:     { type: String, required: true },
  postalCode:{ type: String, required: true },
  tempPassword: String
});

module.exports = mongoose.model('User', userSchema);