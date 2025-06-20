// encrypt.js
const crypto = require('crypto');
const CRYPTO_SECRET = process.env.CRYPTO_SECRET;

const algorithm = 'aes-256-cbc';
const key = crypto.scryptSync(CRYPTO_SECRET, 'salt', 32);
const iv = Buffer.alloc(16, 0);

const encrypt = (text) => {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

const decrypt = (text) => {
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(text, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

module.exports = { encrypt, decrypt };
