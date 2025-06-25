const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/fdbackController');

router.get('/:contactId', feedbackController.getFeedbacksByContactId);

module.exports = router;
