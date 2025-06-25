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
      role: 'employee',
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
      { expiresIn: '1h' }
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


// ✅ Backend Route (Controller)
exports.getPaginatedUsers = async (req, res) => {
  try {
    const draw = parseInt(req.query.draw) || 1;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const validSortFields = ['name', 'uname', 'email', 'ph', 'job', 'sts', '_id'];
    const sortBy = validSortFields.includes(req.query.sortBy) ? req.query.sortBy : '_id';
    const sortDir = req.query.sortDir === 'asc' ? 1 : -1;

    const query = search
     ? {
      $and: [
        { dltSts: { $ne: '1' } },
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { uname: { $regex: search, $options: 'i' } },
            { email: { $regex: encrypt(search), $options: 'i' } }
          ]
        }
      ]
    }
  : { dltSts: { $ne: '1' } };

    const recordsTotal = await User.countDocuments({});
    const recordsFiltered = await User.countDocuments(query);

    const users = await User.find(query)
      .sort({ [sortBy]: sortDir })
      .skip(skip)
      .limit(limit);

    const data = users.map((user) => ({
      uId: user.uId,
      name: user.name,
      email: user.email ? decrypt(user.email) : '',
      ph: user.ph ? decrypt(user.ph) : '',
      avtr: user.avtr,
      job: user.job,
      sts: user.sts ?? 0 // Default to Approved
    }));

    res.json({
      draw,
      recordsTotal,
      recordsFiltered,
      data
    });
  } catch (err) {
    console.error('Error fetching paginated users:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findOne({ uId: req.params.id }).lean(); // ✅ FIXED LINE
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({
      ...user,
      email: decrypt(user.email),
      ph: decrypt(user.ph)
    });
  } catch (err) {
    console.error('Error in getUserById:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.updateUserById = async (req, res) => {
  try {
    const {
      name, job, dob, bio, email, ph, loc, country,
      address, website, education, workExp, socials, skills
    } = req.body;

    const parsedEducation = JSON.parse(education || '[]');
    const parsedWorkExp = JSON.parse(workExp || '[]');
    const parsedSocials = JSON.parse(socials || '{}');
    const parsedSkills = JSON.parse(skills || '[]');

    const updatePayload = {
      name, job, dob: dob ? new Date(dob) : null, bio, loc, country,
      address, website,
      email: email ? encrypt(email) : undefined,
      ph: ph ? encrypt(ph) : undefined,
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

const updatedUser = await User.findOneAndUpdate({ uId: req.params.id }, updatePayload, { new: true });
    if (!updatedUser) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ message: 'User updated successfully', user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.softDeleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const update = {
      dltSts: '1',
      dltOn: new Date(),
      dltBy: req.user.uname,
      dltIp: req.ip
    };

    const deletedUser = await User.findOneAndUpdate(
      { uId: userId },
      update,
      { new: true }
    );

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User marked as deleted', user: deletedUser });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
