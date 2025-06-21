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

const multer = require('multer');
const path = require('path');



// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, 'uploads/images/');
    } else if (file.mimetype === 'application/pdf') {
      cb(null, 'uploads/pdfs/');
    } else {
      cb(new Error('Invalid file type'), false);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = Date.now() + '-' + file.fieldname + ext;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 300 * 1024 }, // 300 KB
  fileFilter: (req, file, cb) => {
    const imageTypes = ['image/jpeg', 'image/jpg'];
    const docTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    if (file.fieldname === 'imageFile') {
      if (!imageTypes.includes(file.mimetype)) {
        return cb(new Error('Only JPG/JPEG image files are allowed'));
      }
    }

    if (file.fieldname === 'pdfFile') {
      if (!docTypes.includes(file.mimetype)) {
        return cb(new Error('Only PDF or DOC/DOCX files are allowed for biodata'));
      }
    }

    cb(null, true);
  }
});


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
      { expiresIn: '10m' }
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
  workExp: user.workExp,
  biodata: user.biodata
    });
  } catch (err) {
    console.error('❌ Server error in /me:', err.message);
    res.status(500).send('Server error');
  }
});

// PUT /api/users/update-profile
router.put('/update-profile', verifyToken, upload.fields([
  { name: 'imageFile', maxCount: 1 },
  { name: 'pdfFile', maxCount: 1 }
]), async (req, res) => {
  const {
    name, job, dob, bio, email, ph, loc, country,
    address, website, education, workExp, socials, skills
  } = req.body;

  // Safely parse JSON fields
  let parsedEducation = [], parsedWorkExp = [], parsedSkills = [], parsedSocials = {};
  try {
    parsedEducation = education ? JSON.parse(education) : [];
    parsedWorkExp = workExp ? JSON.parse(workExp) : [];
    parsedSkills = skills ? JSON.parse(skills) : [];
    parsedSocials = socials ? JSON.parse(socials) : {};
  } catch (jsonErr) {
    console.error('❌ JSON parsing failed:', jsonErr.message);
    return res.status(400).json({ message: 'Invalid JSON format in education, workExp, skills, or socials.' });
  }

  try {
    const updatePayload = {
      name,
      job,
      dob: dob ? new Date(dob) : undefined,
      bio,
      email: email ? encrypt(email) : undefined,
      ph: ph ? encrypt(ph) : undefined,
      loc,
      country,
      address,
      website,
      education: parsedEducation,
      workExp: parsedWorkExp,
      socials: parsedSocials,
      skills: parsedSkills,
      updtOn: new Date(),
      updtBy: req.user.uname
    };

    // Add uploaded file paths
    if (req.files?.imageFile?.[0]) {
      updatePayload.avtr = `/uploads/images/${req.files.imageFile[0].filename}`;
    }
    if (req.files?.pdfFile?.[0]) {
      updatePayload.biodata = `/uploads/pdfs/${req.files.pdfFile[0].filename}`;
    }

    const updatedUser = await User.findOneAndUpdate(
      { uname: req.user.uname },
      updatePayload,
      { new: true }
    );

    res.json({ message: 'Profile updated', user: updatedUser });
  } catch (error) {
    console.error('❌ Profile update failed:', error.message);
    res.status(500).json({ message: 'Profile update failed', error: error.message });
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
