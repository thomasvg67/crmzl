const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const verifyToken = (req, res, next) => {

  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    console.log("⛔ No token provided");
    return res.status(403).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // console.log("✅ decoded token", decoded); // 👈 make sure this is here
    req.user = decoded;
    next();
  } catch (err) {
    console.error('❌ Token verification failed:', err.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
};



module.exports = { verifyToken };
