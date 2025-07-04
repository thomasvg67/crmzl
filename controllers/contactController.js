// controllers/contactController.js

const Alert = require('../models/Alert');
const Contact = require('../models/Contact');
const FdBack = require('../models/FdBack');

function getISTDayRange() {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const now = new Date();
  const istNow = new Date(now.getTime() + istOffset);

  const startOfToday = new Date(istNow);
  startOfToday.setHours(0, 0, 0, 0);
  startOfToday.setTime(startOfToday.getTime() - istOffset);

  const endOfToday = new Date(istNow);
  endOfToday.setHours(23, 59, 59, 999);
  endOfToday.setTime(endOfToday.getTime() - istOffset);

  return { startOfToday, endOfToday };
}



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

      const { startOfToday, endOfToday } = getISTDayRange();


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

     const search = req.query.search || "";
    if (search.trim() !== "") {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { ph: { $regex: search, $options: "i" } },
        { loc: { $regex: search, $options: "i" } }
      ];
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [contacts, total] = await Promise.all([
      Contact.find(query).sort({crtdOn:-1}).skip(skip).limit(limit),
      Contact.countDocuments(query)
    ]);

    res.json({
      contacts,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
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
      
      const { startOfToday, endOfToday } = getISTDayRange();


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
