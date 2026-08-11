const mongoose = require('mongoose');

// Embedded subdocument schema, shared by Article and Submission.
const AuthorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  affiliation: { type: String, required: true },
  country: { type: String, required: true },
  email: { type: String }
}, { _id: false });

module.exports = AuthorSchema;
