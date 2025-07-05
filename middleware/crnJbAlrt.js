// cron/dailyAlerts.js

const cron = require("node-cron");
const Contact = require("../models/Contact");
const Alert = require("../models/Alert");

const createDailyAlerts = () => {
  cron.schedule("1 0 * * *", async () => {
    console.log("[CRON] Running daily alerts check...");

    try {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      // find all contacts with nxtAlrt today
      const contacts = await Contact.find({
        nxtAlrt: { $gte: startOfToday, $lte: endOfToday },
        dltSts: 0
      });

      for (const contact of contacts) {
        // see if an alert already exists
        const existingAlert = await Alert.findOne({
          contactId: contact._id,
          dltSts: 0
        });

        if (!existingAlert) {
          await Alert.create({
            contactId: contact._id,
            alertTime: contact.nxtAlrt,
            subject: contact.subject || `Reminder for ${contact.name}`,
            status: 0,
            assignedTo: contact.assignedTo,
            crtdOn: new Date(),
            crtdBy: "cronjob",
            crtdIp: "127.0.0.1"
          });
          console.log(`Created alert for contact: ${contact.name}`);
        }
      }

    } catch (err) {
      console.error("[CRON] Error in dailyAlerts job:", err);
    }
  }, {
    timezone: "Asia/Kolkata"  // adjust to your timezone
  });
};

module.exports = createDailyAlerts;
