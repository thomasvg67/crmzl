const Alert = require('../models/Alert');
const Contact = require('../models/Contact');



exports.getTodayAlerts = async (req, res) => {
  try {
    const role = req.user?.role;
    const uid = req.user?.uId;

    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date();
    endOfDay.setHours(23,59,59,999);

    let query = {
      alertTime: { $gte: startOfDay, $lte: endOfDay },
      status: 0,
      dltSts: 0,
      assignedTo: uid
    };

    const alerts = await Alert.find(query).populate('contactId');
    res.json(alerts);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.editAlert = async (req, res) => {
  try {
    const ip = req.ip;
    const userId = req.user?.uId || 'system';

    const updated = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updtOn: new Date(),
        updtBy: userId,
        updtIp: ip
      },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.snoozeOneDay = async (req, res) => {
  try {
    const { id } = req.params;

    // first get the record
    const alertRecord = await Alert.findById(id);
    if (!alertRecord) {
      return res.status(404).json({ message: "Alert not found" });
    }

    // remove from alrTbl
    await Alert.findByIdAndDelete(id);

    // update contact for next day
    const contactId = alertRecord.contactId;
    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 1);

    await Contact.findByIdAndUpdate(contactId, {
      nxtAlrt: nextDay
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// exports.addAlert = async (req, res) => {
//   try {
//     const ip = req.ip;
//     const userId = req.user?.uId || 'system'; // consistent with contacts

//     const alert = new Alert({
//       ...req.body,
//       crtdOn: new Date(),
//       crtdBy: userId,
//       crtdIp: ip
//     });

//     const savedAlert = await alert.save();
//     res.json(savedAlert);
//   } catch (err) {
//     res.status(500).send(err.message);
//   }
// };

// exports.getAllAlerts = async (req, res) => {
//   try {
//     const role = req.user?.role;
//     const uid = req.user?.uId;

//     // Build the query:
//     let query = { dltSts: 0, assignedTo: uid };

//     const alerts = await Alert.find(query).populate('contactId');
//     res.json(alerts);
//   } catch (err) {
//     res.status(500).send(err.message);
//   }
// };

// exports.deleteAlert = async (req, res) => {
//   try {
//     const ip = req.ip;
//     const userId = req.user?.uId || 'system';

//     const deleted = await Alert.findByIdAndUpdate(
//       req.params.id,
//       {
//         dltOn: new Date(),
//         dltBy: userId,
//         dltIp: ip,
//         dltSts: 1
//       },
//       { new: true }
//     );
//     res.json(deleted);
//   } catch (err) {
//     res.status(500).send(err.message);
//   }
// };

// exports.loadTodayAlerts = async (req, res) => {
//   try {
//     const todayStart = new Date();
//     todayStart.setHours(0,0,0,0);
//     const todayEnd = new Date();
//     todayEnd.setHours(23,59,59,999);

//     const contacts = await Contact.find({
//       nxtAlrt: { $gte: todayStart, $lte: todayEnd }
//     });

//     // load them into alrTbl
//     await Promise.all(
//       contacts.map(async c => {
//       await Alert.updateOne(
//           { contactId: c._id },
//           {
//             contactId: c._id,
//             alertTime: c.nxtAlrt,
//             subject: c.subject || `Reminder for ${c.name}`,
//                 assignedTo: c.assignedTo || req.user?.uId || 'system', // add this
//             status: 0,
//             crtdOn: new Date(),
//             crtdBy: req.user?.uId || 'system',
//             crtdIp: req.ip
//           },
//           { upsert: true }
//         );
//       })
//     );

//     res.json({ success: true });
//   } catch(err) {
//     console.error(err);
//     res.status(500).send(err.message);
//   }
// };

// exports.snoozeAlert = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { minutes } = req.body; // 30, 60, 120
//     const newTime = new Date(Date.now() + minutes * 60000);

//     const updated = await Alert.findByIdAndUpdate(
//       id,
//       { alertTime: newTime },
//       { new: true }
//     );
//     res.json(updated);
//   } catch (err) {
//     res.status(500).send(err.message);
//   }
// };





// exports.completeAlert = async (req, res) => {
//   try {
//     await Alert.findByIdAndDelete(req.params.id);
//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).send(err.message);
//   }
// };
