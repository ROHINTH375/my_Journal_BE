const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['author', 'reviewer'], required: true },
  affiliation: { type: String, default: '' },
  country: { type: String, default: '' },
  keywords: { type: [String], default: [] },
  bio: { type: String, default: '' },
  resetTokenHash: { type: String, default: null },
  resetTokenExpires: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
