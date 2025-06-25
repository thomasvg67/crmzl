const FdBack = require('../models/FdBack');

exports.getFeedbacksByContactId = async (req, res) => {
  try {
    const feedbacks = await FdBack.find({ contactId: req.params.contactId }).sort({ crtdOn: -1 });
    res.json(feedbacks);
  } catch (err) {
    res.status(500).send(err.message);
  }
};
