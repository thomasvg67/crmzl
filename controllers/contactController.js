// controllers/contactController.js

const Alert = require('../models/Alert');
const Contact = require('../models/Contact');
const FdBack = require('../models/FdBack');

exports.addContact = async (req, res) => {
  try {
    const ip = req.ip;
    const userId = req.user?.uId || 'system';

    const { fdback, ...contactData } = req.body;

    const contact = new Contact({
      ...contactData,
      crtdOn: new Date(),
      crtdBy: userId,
      crtdIp: ip,
      assignedTo: contactData.assignedTo || userId
    });

    const savedContact = await contact.save();

    // save feedback if present
    if (fdback && fdback.trim() !== '') {
      const feedback = new FdBack({
        contactId: savedContact._id,
        fdback,
        crtdOn: new Date(),
        crtdBy: userId,
        crtdIp: ip
      });
      await feedback.save();
    }

    // check if nxtAlrt is today and create alert
    if (contactData.nxtAlrt) {
      const nxtAlrtDate = new Date(contactData.nxtAlrt);

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      if (nxtAlrtDate >= startOfToday && nxtAlrtDate <= endOfToday) {
        await Alert.create({
          contactId: savedContact._id,
          alertTime: nxtAlrtDate,
          subject: contactData.subject || `Reminder for ${contactData.name}`,
          status: 0,
          crtdOn: new Date(),
          crtdBy: userId, 
          crtdIp: ip
        });
      }
    }

    res.json(savedContact);
  } catch (err) {
    res.status(500).send(err.message);
  }
};


exports.getAllContacts = async (req, res) => {
  try {
    const role = req.user?.role;
    const uid = req.user?.uId;
    let query = { dltSts: 0 };

    if (role !== 'adm') {
      query.assignedTo = uid;
    }

    const contacts = await Contact.find(query);
    res.json(contacts);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
};



exports.editContact = async (req, res) => {
  try {
    const ip = req.ip;
    const userId = req.user?.uId || 'system'; // consistent: store UID

    const { fdback, ...contactData } = req.body;

    const updateData = {
      ...contactData,
      updtOn: new Date(),
      updtBy: userId,
      updtIp: ip,
    };

    // Only admin can reassign
    if (req.user?.role === 'adm') {
      updateData.assignedTo = contactData.assignedTo;
    }

    const updated = await Contact.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    // handle feedback if present
    if (fdback && fdback.trim() !== '') {
      const feedback = new FdBack({
        contactId: req.params.id,
        fdback,
        crtdOn: new Date(),
        crtdBy: userId,
        crtdIp: ip
      });
      await feedback.save();
    }

   // handle alerts update logic
    if (contactData.nxtAlrt) {
      const nxtAlrtDate = new Date(contactData.nxtAlrt);
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      if (nxtAlrtDate >= startOfToday && nxtAlrtDate <= endOfToday) {
        // within today
        await Alert.updateOne(
          { contactId: req.params.id, dltSts: 0 },
          {
            contactId: req.params.id,
            alertTime: nxtAlrtDate,
            subject: contactData.subject || `Reminder for ${contactData.name}`,
            assignedTo: contactData.assignedTo || userId,
            status: 0,
            updtOn: new Date(),
            updtBy: userId,
            updtIp: ip,
          },
          { upsert: true }
        );
      } else {
        // future or past date, remove from alert table if exists
        await Alert.deleteMany({ contactId: req.params.id });
      }
    }

    res.json(updated);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.deleteContact = async (req, res) => {
  try {
    const ip = req.ip;
    const userId = req.user?.uId || 'system'; // consistent: store UID

    const deleted = await Contact.findByIdAndUpdate(
      req.params.id,
      {
        dltOn: new Date(),
        dltBy: userId,
        dltIp: ip,
        dltSts: 1
      },
      { new: true }
    );

    // mark related alerts as deleted
    await Alert.updateMany(
      { contactId: req.params.id, dltSts: 0 },
      {
        dltOn: new Date(),
        dltBy: userId,
        dltIp: ip,
        dltSts: 1
      }
    );

    res.json(deleted);
  } catch (err) {
    res.status(500).send(err.message);
  }
};
