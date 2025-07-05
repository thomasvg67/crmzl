const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { verifyToken } = require('../middleware/verifyToken');
const upload = require('../middleware/multerConfig');

router.post('/add', verifyToken,upload.single('audioFile'), contactController.addContact);
router.get('/',verifyToken, contactController.getAllContacts);
router.put('/edit/:id', verifyToken,upload.single('audioFile'), contactController.editContact);
router.delete('/delete/:id', verifyToken, contactController.deleteContact);


module.exports = router;
