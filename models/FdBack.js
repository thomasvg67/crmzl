// models/FdBack.js

const mongoose = require('mongoose');

const fdBackSchema = new mongoose.Schema({
  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    required: true
  },
  fdback: { type: String, required: true },
  crtdOn: { type: Date, default: Date.now },
  crtdBy: { type: String },
  crtdIp: { type: String }
});

module.exports = mongoose.model('FdBack', fdBackSchema);
