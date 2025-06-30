const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
   host: "mail.zoomlabs.in", // replace with actual SMTP
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

module.exports = transporter;
