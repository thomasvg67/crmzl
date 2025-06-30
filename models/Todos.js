const mongoose = require('mongoose');

const todosSchema = new mongoose.Schema({
  task: String,
  description: String,
  start_date: Date,
  task_done: Number,
  important: Number,
  created_by: String,
  priority : String,
  createdOn: { type: Date, default: Date.now },
  updatedOn: { type: Date, default: Date.now },
  deletedOn: { type: Date, default: Date.now },
  dlt_sts: Number, 
});

module.exports = mongoose.model('Todos', todosSchema);