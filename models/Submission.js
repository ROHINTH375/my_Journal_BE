const mongoose = require('mongoose');
const AuthorSchema = require('./AuthorSchema');

const STATUSES = ['submitted', 'under_review', 'revision_requested', 'accepted', 'rejected', 'published'];

const SubmissionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  abstract: { type: String, required: true },
  keywords: { type: [String], default: [] },
  authors: { type: [AuthorSchema], required: true },
  correspondingAuthor: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: '' }
  },
  coverLetter: { type: String, default: '' },
  manuscriptFileId: { type: mongoose.Schema.Types.ObjectId, required: true },
  status: { type: String, enum: STATUSES, default: 'submitted' },
  referenceId: { type: String, required: true, unique: true },
  notes: [{
    by: { type: String, required: true },
    text: { type: String, required: true },
    date: { type: Date, default: Date.now }
  }],
  assignedEditor: { type: mongoose.Schema.Types.ObjectId, ref: 'Editor', default: null },
  articleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', default: null },
  submittedDate: { type: Date, default: Date.now }
}, { timestamps: true });

SubmissionSchema.statics.STATUSES = STATUSES;

module.exports = mongoose.model('Submission', SubmissionSchema);
