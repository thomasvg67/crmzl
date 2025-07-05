// models/Contact.js

const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  occup: String,
  ph: { type: String, required: true },
  loc: String,
  subject: { type: String },
assignedTo: { type: String },
  nxtAlrt: Date,
  gmap: String,  
audio: [
  {
    file: String,
    uploadedOn: { type: Date, default: Date.now }
  }
],
  avtr: {
    type: String,
    default: 'assets/img/90x90.jpg'
  },
  crtdOn: { type: Date, default: Date.now },
  crtdBy: { type: String },
  crtdIp: { type: String },
  updtOn: { type: Date },
  updtBy: { type: String },
  updtIp: { type: String },
  dltOn: { type: Date },
  dltBy: { type: String },
  dltIp: { type: String },
  dltSts: { type: Number, default: 0 },
  sts: { type: Number, default: 0 },
});

module.exports = mongoose.model('Contact', contactSchema);
