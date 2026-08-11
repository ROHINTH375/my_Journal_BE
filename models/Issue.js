const mongoose = require('mongoose');

const IssueSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  volume: { type: Number, required: true },
  number: { type: Number, required: true },
  year: { type: Number, required: true },
  season: { type: String, required: true },
  label: { type: String, required: true },
  isCurrent: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Issue', IssueSchema);
