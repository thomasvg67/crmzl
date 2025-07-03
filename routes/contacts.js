const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { verifyToken } = require('../middleware/verifyToken');

router.post('/add', verifyToken, contactController.addContact);
router.get('/',verifyToken, contactController.getAllContacts);
router.put('/edit/:id', verifyToken, contactController.editContact);
router.delete('/delete/:id', verifyToken, contactController.deleteContact);


module.exports = router;
