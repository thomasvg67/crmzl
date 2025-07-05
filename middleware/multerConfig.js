// middleware/multerConfig.js
const multer = require('multer');
const path = require('path');

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, 'uploads/images/');
    } else if (file.mimetype === 'application/pdf') {
      cb(null, 'uploads/pdfs/');
    } else if (file.mimetype.startsWith('audio/')) {
      cb(null, 'uploads/audio/'); // <-- add audio folder
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

// File filter configuration
const fileFilter = (req, file, cb) => {
  const imageTypes = ['image/jpeg', 'image/jpg'];
  const docTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  const audioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/x-m4a'];

  if (file.fieldname === 'imageFile' && !imageTypes.includes(file.mimetype)) {
    return cb(new Error('Only JPG/JPEG image files are allowed'));
  }

  if (file.fieldname === 'pdfFile' && !docTypes.includes(file.mimetype)) {
    return cb(new Error('Only PDF or DOC/DOCX files are allowed for biodata'));
  }

  if (file.fieldname === 'audioFile' && !audioTypes.includes(file.mimetype)) {
    return cb(new Error('Only MP3, WAV, M4A audio files are allowed'));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // allow 20 MB
  fileFilter
});

module.exports = upload;
