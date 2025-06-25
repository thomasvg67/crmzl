const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');

// Routes
router.post('/add', noteController.addNote);
router.get('/', noteController.getAllNotes);
router.put('/tag/:id', noteController.updateTag);
router.put('/fav/:id', noteController.updateFavourite);
router.delete('/:id', noteController.deleteNote);

module.exports = router;
