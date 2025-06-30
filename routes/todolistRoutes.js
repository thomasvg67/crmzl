const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/verifyToken');
const todolistController = require('../controllers/todolistController');


// Get all todolist today
router.get('/', verifyToken, todolistController.getTodosList);

// Get all todolist pending
router.get('/pending', verifyToken, todolistController.getPendingTodosList);

// Get all trash todolist
router.get('/trash', verifyToken, todolistController.getTrashTodosList);

// Get all taskdone todolist
router.get('/taskdone', verifyToken, todolistController.getDoneTodosList);

// Get all important todolist
router.get('/important', verifyToken, todolistController.getImportantTodosList);

// Add a new todolist
router.post('/', verifyToken, todolistController.addTodolist);

// Get todolist by ID
router.get('/:id', verifyToken, todolistController.getTodolistById);

// Update a todolist by ID
router.put('/:id', verifyToken, todolistController.updateTodolist);


// Delete a todolist by ID
router.delete('/:id', verifyToken, todolistController.deleteTodolist);

//Mark a Todo as Important
router.put('/markimportant/:id', verifyToken, todolistController.updateImportanttodolist);

//Mark Todo as Task done
router.put('/taskdone/:id', verifyToken, todolistController.updateTaskdonetodolist);

//Mark Todo as Not Task done 
router.put('/taskdoneremove/:id', verifyToken, todolistController.updateTaskdoneRemovetodolist);

// Revive a todolist by ID
router.put('/revive/:id', verifyToken, todolistController.reviveTodolist);

// Permanent Delete a todolist by ID
router.delete('/permanentdelete/:id', verifyToken, todolistController.permanentdeleteTodolist);

// Create priority for a todolist by ID
router.put('/priority/:id', verifyToken, todolistController.priorityTodolist);

module.exports = router;