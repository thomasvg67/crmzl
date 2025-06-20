const mongoose = require('mongoose');

const loginSchema = new mongoose.Schema({
  uname: { type: String, required: true },
  loginAt: { type: Date, default: Date.now },
  ip: String,
  agent: String, // browser/device info

  // Optional logout info
  logoutAt: Date,
  logoutReason: String
});

module.exports = mongoose.model('Login', loginSchema);
