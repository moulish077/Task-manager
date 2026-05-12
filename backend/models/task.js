const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title:    { type: String, required: true },
  priority: { type: String, enum: ['high', 'mid', 'low'], default: 'mid' },
  type:     { type: String, enum: ['feat', 'bug', 'docs'], default: 'feat' },
  status:   { type: String, enum: ['todo', 'inprogress', 'review', 'done'], default: 'todo' },
  user: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);