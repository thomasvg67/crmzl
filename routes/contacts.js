const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

router.post('/add', contactController.addContact);
router.get('/', contactController.getAllContacts);
router.put('/edit/:id', contactController.editContact);
router.delete('/delete/:id', contactController.deleteContact);

module.exports = router;
