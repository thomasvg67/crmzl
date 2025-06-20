const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { getNextUserId } = require('../models/Counter');
const { encrypt } = require('../routes/encrypt');
const { decrypt } = require('../routes/encrypt');
const jwt = require('jsonwebtoken');
const  { verifyToken }  = require('../middleware/verifyToken')

const JWT_SECRET = process.env.JWT_SECRET;

// Create a dummy admin if not exists
router.get('/create-admin', async (req, res) => {
  try {
    const existing = await User.findOne({ uname: 'admin' });
    if (existing) {
      return res.status(400).json({ message: 'Admin user already exists' });
    }

    const hashedPwd = await bcrypt.hash('Admin@123', 10);
    const nextUId = await getNextUserId();

    const admin = new User({
        uId: nextUId,
      uname: 'admin',
      name: 'Administrator',
      email:  encrypt('admin@example.com'),
      ph: encrypt('9876543210'),
      pwd: hashedPwd,
      role: 'admin',
      crtdBy: 'system',
      crtdIp: req.ip
    });

    await admin.save();
    res.json({ message: 'Admin user created successfully', user: admin });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Username: admin

// Email: admin@example.com

// Password: Admin@123 (hashed)

// Role: admin

//user creation
router.post('/create', verifyToken, async (req, res) => {
  const { uname, pwd, name, email, ph, ...rest } = req.body;

  try {
    const exists = await User.findOne({ uname });
    if (exists) return res.status(400).json({ message: 'Username already exists' });

    const hashedPwd = await bcrypt.hash(pwd, 10);
    const nextUId = await getNextUserId();

    const newUser = new User({
      uId: nextUId,
      uname,
      pwd: hashedPwd,
      name,
      email: encrypt(email),
      ph: encrypt(ph),
      role: 'staff',
      crtdBy: req.user.uname,
      crtdIp: req.ip,
      ...rest
    });

    await newUser.save();
    res.json({ message: 'User created', user: newUser });
  } catch (err) {
    console.error('❌ User creation error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});



router.post('/login', async (req, res) => {
  const { uname, password } = req.body;

  try {
    const user = await User.findOne({ uname });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.pwd);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, uname: user.uname, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token, user: { uId: user.uId, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

//my profile
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ uname: req.user.uname });

    if (!user) {
      console.error('❌ User not found for uname:', req.user.uname);
      return res.status(404).json({ message: 'User not found' });
    }

    // Attempt to decrypt
    let decryptedEmail, decryptedPh;
    try {
      decryptedEmail = decrypt(user.email);
      decryptedPh = decrypt(user.ph);
    } catch (decryptionError) {
      console.error('❌ Decryption error:', decryptionError.message);
      return res.status(500).json({ message: 'Decryption failed' });
    }

    res.json({
      uId: user.uId,
      name: user.name,
      uname: user.uname,
      email: decryptedEmail,
      ph: decryptedPh,
      role: user.role,
      avtr: user.avtr,
      job: user.job || '',
      dob: user.dob,
      loc: user.loc || '',
      bio: user.bio || '',
      address: user.address || '',
  country: user.country || '',
  website: user.website || '',
   socials: user.socials ,
     skills: user.skills || [],
  education: user.education,
  workExp: user.workExp
    });
  } catch (err) {
    console.error('❌ Server error in /me:', err.message);
    res.status(500).send('Server error');
  }
});

// PUT /api/users/update-profile
router.put('/update-profile', verifyToken, async (req, res) => {
  const { name, job, dob, bio, email, ph, loc, country, address, website, education, workExp, socials , skills } = req.body;

  try {
    const updated = await User.findOneAndUpdate(
      { uname: req.user.uname },
      {
        name: name,
        job: job,
        dob: new Date(dob),
        bio: bio,
        email: encrypt(email),
ph: encrypt(ph),
loc: loc,
country: country,
  address : address,
  website: website,
  socials,
  skills,
  education,
  workExp,
        updtOn: new Date(),
        updtBy: req.user.uname
      },
      { new: true }
    );

    res.json({ message: 'Profile updated', user: updated });
  } catch (err) {
    console.error('Update failed:', err.message);
    res.status(500).json({ message: 'Update failed' });
  }
});

//change password
router.post('/change-password', verifyToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  try {
    const user = await User.findOne({ uname: req.user.uname });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(oldPassword, user.pwd);
    if (!isMatch) return res.status(401).json({ message: 'Incorrect old password' });

    const hashedPwd = await bcrypt.hash(newPassword, 10);
    user.pwd = hashedPwd;
    user.updtOn = new Date();
    user.updtBy = req.user.uname;

    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('❌ Error changing password:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
