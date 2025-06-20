const express = require('express');
const router = express.Router();
const Note = require('../models/Note');

// Create Note
router.post('/add', async (req, res) => {
  const { title, desc } = req.body;

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  try {
    const newNote = new Note({
      title,
      desc ,
      isFav: false,
      tag: "",
      crtdOn: new Date(),
      crtdBy: 'admin', // You can replace this with req.user.email when you use JWT
      crtdIp: ip,
      nSts: 0,
      dltSts: 0,
    });

    await newNote.save();
    res.status(201).json({
      success: true,
      message: 'Note saved successfully',
      note: newNote,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to save note',
    });
  }
});


// Get All Notes
router.get('/', async (req, res) => {
  try {
    const notes = await Note.find().sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// Update tag
router.put('/tag/:id', async (req, res) => {
  try {
    const { tag } = req.body;
    await Note.findByIdAndUpdate(req.params.id, { tag });
    res.json({ success: true, message: "Tag updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update tag" });
  }
});

// Favourite option
router.put('/fav/:id', async (req, res) => {
  try {
    const { isFav } = req.body;
    await Note.findByIdAndUpdate(req.params.id, { isFav });
    res.json({ success: true, message: "Favourite status updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update favourite status" });
  }
});

//delete
router.delete('/:id', async (req, res) => {
  try {
    await Note.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Note deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error deleting note" });
  }
});

module.exports = router;

