const mongoose = require('mongoose');

const scrmBrdSchema = new mongoose.Schema({
  lstName: { type: String, required: true },

  crtdOn: { type: Date, default: Date.now },
  crtdBy: { type: String },
  crtdIp: { type: String },

  updtOn: { type: Date },
  updtBy: { type: String },
  updtIp: { type: String },

  dltOn: { type: Date },
  dltBy: { type: String },
  dltIp: { type: String },
  dltSts: { type: Boolean, default: false },

  sts: { type: Boolean, default: true }
});

module.exports = mongoose.model('ScrmBrd', scrmBrdSchema);