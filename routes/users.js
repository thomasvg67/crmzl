const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { verifyToken } = require('../middleware/verifyToken');
const userController = require('../controllers/userController');

// Multer setup
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
  limits: { fileSize: 300 * 1024 },
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

// Routes
router.get('/create-admin', userController.createAdmin);
router.post('/create', verifyToken, userController.createUser);
router.post('/login', userController.login);
router.get('/me', verifyToken, upload.fields([
  { name: "image", maxCount: 1 },
  { name: "biodata", maxCount: 1 }
]), userController.getProfile);
router.put('/update-profile', verifyToken, upload.fields([
  { name: 'imageFile', maxCount: 1 },
  { name: 'pdfFile', maxCount: 1 }
]), userController.updateProfile);
router.post('/change-password', verifyToken, userController.changePassword);

module.exports = router;
