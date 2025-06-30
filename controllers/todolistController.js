const Todos = require('../models/Todos');

// Get all Todos
exports.getTodosList = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todoslist = await Todos.find( {
      start_date: { $gte: todayStart, $lt: todayEnd },
      dlt_sts: 1,
      important: 0,
      task_done: 0
    });
    res.json(todoslist);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch todos list' });
  }
};

exports.getPendingTodosList = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todoslist = await Todos.find({
      $or: [
        { start_date: { $lt: todayStart } },
        { start_date: { $gte: todayEnd } }
      ],
      dlt_sts: 1,
      important: 0,
      task_done: 0
    });
    res.json(todoslist);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch todos list' });
  }
};

// Add Todos
exports.addTodolist = async (req, res) => {
  try {
    const {
    task,
    description,
    start_date,
    dlt_sts,
    task_done,
    important,
    created_by,
    priority
    } = req.body;

    const todos = new Todos({
        task,
        description,
        start_date,
        dlt_sts,
        task_done,
        important,
        created_by,
        priority
    });

    await todos.save();
    res.status(201).json(todos);
  } catch (err) {
    console.error("Add Todos error:", err);
    res.status(500).json({ error: "Failed to add todos" });
  }
};

// Get single todo by ID
exports.getTodolistById = async (req, res) => {
  try {
    const todos = await Todos.findById(req.params.id);
    if (!todos) {
      return res.status(404).json({ error: "Todos not found" });
    }
    res.json(todos);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch todos" });
  }
};

// delete Todo
exports.deleteTodolist = async (req, res) => {
  try {
    const todos = await Todos.findById(req.params.id);
    if (!todos) {
      return res.status(404).json({ error: "Todos not found" });
    }
    todos.dlt_sts = 0 ,
    todos.deletedOn = Date.now(),

    await todos.save();

    res.json({ message: "Todos status changed successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error deleting todo" });
  }
};

// Update Todolist by ID
exports.updateTodolist = async (req, res) => {
  try {
    const {
    task,
    description,
    start_date,
    dlt_sts,
    task_done,
    important
    } = req.body;

    // Find the todos first
    const todos = await Todos.findById(req.params.id);
    if (!todos) {
      return res.status(404).json({ error: "Todo not found" });
    }

    // Update text fields
    todos.task = task || todos.task,
    todos.description = description || todos.description,
    todos.start_date = start_date || todos.start_date,
    todos.dlt_sts = dlt_sts || todos.dlt_sts,
    todos.task_done = task_done || todos.task_done,
    todos.important = important || todos.important,
    todos.updatedOn = Date.now(),

    await todos.save();

    res.json(todos);
  } catch (err) {
    console.error("Update todos error:", err);
    res.status(500).json({ error: "Failed to update todos" });
  }
};

// Get all Trash Todos
exports.getTrashTodosList = async (req, res) => {
  try {
    const todoslist = await Todos.find({"dlt_sts": 0});
    res.json(todoslist);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trash todos list' });
  }
};

// Get all done Todos
exports.getDoneTodosList = async (req, res) => {
  try {
    const todoslist = await Todos.find({"dlt_sts": 1, "task_done" : 1});
    res.json(todoslist);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch done todos list' });
  }
};

// Get all Important Todos
exports.getImportantTodosList = async (req, res) => {
  try {
    const todoslist = await Todos.find({"dlt_sts": 1, "important" : 1});
    res.json(todoslist);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch important todos list' });
  }
};

// Mark Todo as Important
exports.updateImportanttodolist = async (req, res) => {
  try {
    const todos = await Todos.findById(req.params.id);
    if (!todos) {
      return res.status(404).json({ error: "Todos not found" });
    }
    todos.important = 1 ,
    todos.updatedOn = Date.now(),

    await todos.save();

    res.json({ message: "Todos status changed successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error changing status to important" });
  }
};

//Mark Todo as Task Done
exports.updateTaskdonetodolist = async (req, res) => {
  try {
    const todos = await Todos.findById(req.params.id);
    if (!todos) {
      return res.status(404).json({ error: "Todos not found" });
    }
    todos.task_done = 1 ,
    todos.important = 0 ,
    todos.updatedOn = Date.now(),

    await todos.save();

    res.json({ message: "Todos status changed successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error changing status to taskdone" });
  }
};

//Mark Todo as Not Task Done
exports.updateTaskdoneRemovetodolist = async (req, res) => {
  try {
    const todos = await Todos.findById(req.params.id);
    if (!todos) {
      return res.status(404).json({ error: "Todos not found" });
    }
    todos.task_done = 0 ,
    todos.updatedOn = Date.now(),

    await todos.save();

    res.json({ message: "Todos status changed successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error changing status to taskdone" });
  }
};

// Revive Todo
exports.reviveTodolist = async (req, res) => {
  try {
    const todos = await Todos.findById(req.params.id);
    if (!todos) {
      return res.status(404).json({ error: "Todos not found" });
    }
    todos.dlt_sts = 1 ,
    todos.updatedOn = Date.now(),

    await todos.save();

    res.json({ message: "Todos status changed successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error reviving todo" });
  }
};

// Permanent Delete Todo
exports.permanentdeleteTodolist = async (req, res) => {
  try {
    const deleted = await Todos.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Todo not found" });
    }
    res.json({ message: "Todo deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error deleting todo" });
  }
};

// Add Priority to Todo
exports.priorityTodolist = async (req, res) => {
  try {
    const {
    priority
    } = req.body;

    const todos = await Todos.findById(req.params.id);
    if (!todos) {
      return res.status(404).json({ error: "Todos not found" });
    }
    todos.priority = priority || todos.priority,
    todos.updatedOn = Date.now(),

    await todos.save();

    res.json({ message: "Todos priority changed successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error changing priority" });
  }
};