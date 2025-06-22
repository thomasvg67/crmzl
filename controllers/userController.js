const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getNextUserId } = require('../models/Counter');
const { encrypt, decrypt } = require('../routes/encrypt');

const JWT_SECRET = process.env.JWT_SECRET;

exports.createAdmin = async (req, res) => {
  try {
    const existing = await User.findOne({ uname: 'admin' });
    if (existing) return res.status(400).json({ message: 'Admin user already exists' });

    const hashedPwd = await bcrypt.hash('Admin@123', 10);
    const nextUId = await getNextUserId();

    const admin = new User({
      uId: nextUId,
      uname: 'admin',
      name: 'Administrator',
      email: encrypt('admin@example.com'),
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
};

exports.createUser = async (req, res) => {
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
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.login = async (req, res) => {
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
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findOne({ uname: req.user.uname });
    if (!user) return res.status(404).json({ message: 'User not found' });

    let decryptedEmail, decryptedPh;
    try {
      decryptedEmail = decrypt(user.email);
      decryptedPh = decrypt(user.ph);
    } catch (err) {
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
      socials: user.socials,
      skills: user.skills || [],
      education: user.education,
      workExp: user.workExp,
      biodata: user.biodata
    });
  } catch (err) {
    res.status(500).send('Server error');
  }
};

exports.updateProfile = async (req, res) => {
  const {
    name, job, dob, bio, email, ph, loc, country,
    address, website, education, workExp, socials, skills
  } = req.body;

  let parsedEducation = [], parsedWorkExp = [], parsedSkills = [], parsedSocials = {};
  try {
    parsedEducation = education ? JSON.parse(education) : [];
    parsedWorkExp = workExp ? JSON.parse(workExp) : [];
    parsedSkills = skills ? JSON.parse(skills) : [];
    parsedSocials = socials ? JSON.parse(socials) : {};
  } catch (err) {
    return res.status(400).json({ message: 'Invalid JSON format in education, workExp, skills, or socials.' });
  }

  try {
    const updatePayload = {
      name, job,
      dob: dob ? new Date(dob) : undefined,
      bio,
      email: email ? encrypt(email) : undefined,
      ph: ph ? encrypt(ph) : undefined,
      loc, country, address, website,
      education: parsedEducation,
      workExp: parsedWorkExp,
      socials: parsedSocials,
      skills: parsedSkills,
      updtOn: new Date(),
      updtBy: req.user.uname
    };

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
  } catch (err) {
    res.status(500).json({ message: 'Profile update failed', error: err.message });
  }
};

exports.changePassword = async (req, res) => {
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
    res.status(500).json({ message: 'Internal server error' });
  }
};
