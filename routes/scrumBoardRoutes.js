// routes/scrumBoardRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/verifyToken');
const controller = require('../controllers/scrumBoardController');

// Get all lists with their tasks
router.get('/', verifyToken, controller.getScrumBoard);

// List routes
router.post('/list', verifyToken, controller.addList);
router.put('/list/:id', verifyToken, controller.editList);
router.put('/list/:id/delete', verifyToken, controller.deleteList);

// Task routes
router.post('/task', verifyToken, controller.addTask);
router.put('/task/:id', verifyToken, controller.editTask);
router.put('/task/:id/delete', verifyToken, controller.deleteTask);

// Clear all tasks in a list
router.put('/list/:id/clear-tasks', verifyToken, controller.clearTasksFromList);

module.exports = router;
