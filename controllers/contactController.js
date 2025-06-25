const Contact = require('../models/Contact');
const FdBack = require('../models/FdBack');

exports.addContact = async (req, res) => {
  try {
    const ip = req.ip;
    const user = req.headers['x-user'] || 'system';
    const { fdback, ...contactData } = req.body;

    const contact = new Contact({
      ...contactData,
      crtdOn: new Date(),
      crtdBy: user,
      crtdIp: ip
    });

    const savedContact = await contact.save();

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
};

exports.getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find({ dltSts: '0' });
    res.json(contacts);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.editContact = async (req, res) => {
  try {
    const ip = req.ip;
    const user = req.headers['x-user'] || 'system';
    const { fdback, ...contactData } = req.body;

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
};

exports.deleteContact = async (req, res) => {
  try {
    const ip = req.ip;
    const deleted = await Contact.findByIdAndUpdate(
      req.params.id,
      {
        dltOn: new Date(),
        dltBy: req.headers['x-user'] || 'system',
        dltIp: ip,
        dltSts: '1'
      },
      { new: true }
    );
    res.json(deleted);
  } catch (err) {
    res.status(500).send(err.message);
  }
};
