const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/verifyToken');
const userController = require('../controllers/userController');
const upload = require('../middleware/multerConfig');


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
router.get('/paginated', verifyToken, userController.getPaginatedUsers);
router.put('/:id', verifyToken, upload.fields([
  { name: "imageFile", maxCount: 1 },
  { name: "pdfFile", maxCount: 1 }
]), userController.updateUserById);
router.put('/:id/delete', verifyToken, userController.softDeleteUser);
router.get('/verify/:id', userController.verifyUser);
router.get('/assignable', verifyToken, userController.getAssignableUsers);
router.get('/:id', verifyToken, userController.getUserById);

module.exports = router;
