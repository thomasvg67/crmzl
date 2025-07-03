const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const { verifyToken } = require('../middleware/verifyToken');

router.post('/add', verifyToken, noteController.addNote);
router.get('/', verifyToken, noteController.getAllNotes);
router.put('/tag/:id', verifyToken, noteController.updateTag);
router.put('/fav/:id', verifyToken, noteController.updateFavourite);
router.delete('/:id', verifyToken, noteController.deleteNote);

module.exports = router;
