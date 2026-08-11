const mongoose = require('mongoose');

// Embedded subdocument schema, shared by Article and Submission.
const AuthorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  affiliation: { type: String, required: true },
  // Optional: the public submission form doesn't collect country (only
  // name/affiliation/email); published Article authors carry it (seed data,
  // or an editor fills it in later).
  country: { type: String, default: '' },
  email: { type: String }
}, { _id: false });

module.exports = AuthorSchema;
