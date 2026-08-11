const mongoose = require('mongoose');

const EditorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['editor', 'admin'], default: 'editor' }
}, { timestamps: true });

module.exports = mongoose.model('Editor', EditorSchema);
