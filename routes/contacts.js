const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const FdBack = require('../models/FdBack');

// Add a contact
router.post('/add', async (req, res) => {
  try {
    const ip = req.ip;
    const user = req.headers['x-user'] || 'system';

    // Destructure fdback and exclude from contact save
    const { fdback, ...contactData } = req.body;

    const contact = new Contact({
      ...contactData,
      crtdOn: new Date(),
      crtdBy: user,
      crtdIp: ip
    });

    const savedContact = await contact.save();

    // Save review separately if provided
    if (fdback && fdback.trim() !== '') {
      const feedback = new FdBack({
        contactId: savedContact._id,
        fdback,
        crtdOn: new Date(),
        crtdBy: user,
        crtdIp: ip
      });

      await feedback.save();
    }

    res.json(savedContact);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Get all contacts
router.get('/', async (req, res) => {
  try {
    const contacts = await Contact.find({ dltSts: '0' });
    res.json(contacts);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Edit a contact
router.put('/edit/:id', async (req, res) => {
  try {
    const ip = req.ip;
    const user = req.headers['x-user'] || 'system';

    const { fdback, ...contactData } = req.body;

    // Update contact (excluding fdback)
    const updated = await Contact.findByIdAndUpdate(
      req.params.id,
      {
        ...contactData,
        updtOn: new Date(),
        updtBy: user,
        updtIp: ip
      },
      { new: true }
    );

    // Save new review if provided
    if (fdback && fdback.trim() !== '') {
      const feedback = new FdBack({
        contactId: req.params.id,
        fdback,
        crtdOn: new Date(),
        crtdBy: user,
        crtdIp: ip
      });
      await feedback.save();
    }

    res.json(updated);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Delete a contact
router.delete('/delete/:id', async (req, res) => {
  try {
    const ip = req.ip;
    const deleted = await Contact.findByIdAndUpdate(
      req.params.id,
      {
        dltOn: new Date(),
        dltBy: req.headers['x-user'] || 'system',
        dltIp: ip,
        dltSts: '1'  // Soft delete
      },
      { new: true }
    );
    res.json(deleted);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// GET feedbacks for a contact
router.get('/feedbacks/:contactId', async (req, res) => {
  try {
    const feedbacks = await FdBack.find({ contactId: req.params.contactId })
      .sort({ crtdOn: -1 });
    res.json(feedbacks);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
