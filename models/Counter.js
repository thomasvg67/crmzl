const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  seq: { type: Number, default: 103332 }, // Start at 103332 so next will be 103333
});

const Counter = mongoose.model('Counter', counterSchema);

const getNextUserId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { id: 'userId' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return counter.seq.toString().padStart(6, '0');
};

module.exports = {
  Counter,
  getNextUserId
};
