const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { verifyToken } = require('../middleware/verifyToken');

router.get('/today', verifyToken, alertController.getTodayAlerts);
router.put('/snooze1d/:id', verifyToken, alertController.snoozeOneDay); 
router.put('/edit/:id', verifyToken, alertController.editAlert);

// router.post('/add', verifyToken, alertController.addAlert);
// router.get('/', verifyToken, alertController.getAllAlerts);
// router.delete('/delete/:id', verifyToken, alertController.deleteAlert);
// router.put('/snooze/:id', verifyToken, alertController.snoozeAlert);
// router.delete('/:id', verifyToken, alertController.deleteAlert);
// router.put('/complete/:id', verifyToken, alertController.completeAlert);

module.exports = router;
