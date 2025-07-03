const ScrmBrd = require('../models/ScrmBrd');
const ScrmBrdTsk = require('../models/ScrmBrdTsk');

// Get all lists with their tasks
exports.getScrumBoard = async (req, res) => {
  try {
    const lists = await ScrmBrd.find({ dltSts: false }).sort({ crtdOn: -1 }).lean();
    const listIds = lists.map((list) => list._id);
    const tasks = await ScrmBrdTsk.find({ listId: { $in: listIds }, dltSts: false }).sort({ crtdOn: -1 }).lean();

    const result = lists.map((list) => ({
      id: list._id,
      title: list.lstName,
      tasks: tasks
        .filter((task) => task.listId.toString() === list._id.toString())
        .map((t) => ({
          id: t._id,
          title: t.tskName,
          text: t.tskDesc,
          date: t.crtdOn?.toLocaleDateString('en-GB'),
          type: 'simple',
        }))
    }));

    res.json(result);
  } catch (err) {
    console.error('Error fetching Scrum Board:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add a new list
exports.addList = async (req, res) => {
  try {
    const userId = req.user?.uId || 'system';
    const ip = req.ip;

    const newList = new ScrmBrd({
      lstName: req.body.lstName,
      crtdBy: userId,
      crtdIp: ip,
    });
    await newList.save();
    res.json({ message: 'List added successfully', list: newList });
  } catch (err) {
    res.status(500).json({ message: 'Add list failed' });
  }
};

// Edit list
exports.editList = async (req, res) => {
  try {
    const userId = req.user?.uId || 'system';
    const ip = req.ip;

    const updated = await ScrmBrd.findByIdAndUpdate(
      req.params.id,
      {
        lstName: req.body.lstName,
        updtBy: userId,
        updtOn: new Date(),
        updtIp: ip,
      },
      { new: true }
    );
    res.json({ message: 'List updated', list: updated });
  } catch (err) {
    res.status(500).json({ message: 'Update list failed' });
  }
};

// Delete list (soft delete)
exports.deleteList = async (req, res) => {
  try {
    const userId = req.user?.uId || 'system';
    const ip = req.ip;

    const deleted = await ScrmBrd.findByIdAndUpdate(
      req.params.id,
      {
        dltSts: true,
        dltBy: userId,
        dltOn: new Date(),
        dltIp: ip,
      },
      { new: true }
    );
    await ScrmBrdTsk.updateMany({ listId: req.params.id }, {
      dltSts: true,
      dltBy: userId,
      dltOn: new Date(),
      dltIp: ip,
    });
    res.json({ message: 'List deleted', list: deleted });
  } catch (err) {
    res.status(500).json({ message: 'Delete list failed' });
  }
};

// Add task
exports.addTask = async (req, res) => {
  try {
    const userId = req.user?.uId || 'system';
    const ip = req.ip;

    const task = new ScrmBrdTsk({
      tskName: req.body.tskName,
      tskDesc: req.body.tskDesc,
      listId: req.body.listId,
      crtdBy: userId,
      crtdIp: ip,
    });
    await task.save();
    res.json({ message: 'Task added', task });
  } catch (err) {
    res.status(500).json({ message: 'Add task failed' });
  }
};

// Edit task
exports.editTask = async (req, res) => {
  try {
    const userId = req.user?.uId || 'system';
    const ip = req.ip;

    const updated = await ScrmBrdTsk.findByIdAndUpdate(
      req.params.id,
      {
        tskName: req.body.tskName,
        tskDesc: req.body.tskDesc,
        updtBy: userId,
        updtOn: new Date(),
        updtIp: ip,
      },
      { new: true }
    );
    res.json({ message: 'Task updated', task: updated });
  } catch (err) {
    res.status(500).json({ message: 'Edit task failed' });
  }
};

// Delete task (soft delete)
exports.deleteTask = async (req, res) => {
  try {
    const userId = req.user?.uId || 'system';
    const ip = req.ip;

    const deleted = await ScrmBrdTsk.findByIdAndUpdate(
      req.params.id,
      {
        dltSts: true,
        dltBy: userId,
        dltOn: new Date(),
        dltIp: ip,
      },
      { new: true }
    );
    res.json({ message: 'Task deleted', task: deleted });
  } catch (err) {
    res.status(500).json({ message: 'Delete task failed' });
  }
};

// Clear all tasks in a list
exports.clearTasksFromList = async (req, res) => {
  try {
    const userId = req.user?.uId || 'system';
    const ip = req.ip;

    await ScrmBrdTsk.updateMany(
      { listId: req.params.id, dltSts: false },
      {
        dltSts: true,
        dltBy: userId,
        dltOn: new Date(),
        dltIp: ip,
      }
    );
    res.json({ message: 'All tasks cleared successfully' });
  } catch (err) {
    console.error('Error clearing tasks:', err);
    res.status(500).json({ message: 'Clear tasks failed' });
  }
};
