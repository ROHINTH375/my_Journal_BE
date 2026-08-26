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
  // Structural enforcement of "research articles only" — a single-value enum
  // the client can't override, not just a UI label.
  articleType: { type: String, enum: ['research-article'], default: 'research-article' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: STATUSES, default: 'submitted' },
  referenceId: { type: String, required: true, unique: true },
  notes: [{
    by: { type: String, required: true },
    text: { type: String, required: true },
    date: { type: Date, default: Date.now }
  }],
  assignedEditor: { type: mongoose.Schema.Types.ObjectId, ref: 'Editor', default: null },
  articleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', default: null },
  submittedDate: { type: Date, default: Date.now },
  // Set once, the first time status transitions to 'accepted' — carried
  // over to the published Article's receivedDate/acceptedDate so real
  // articles can show a genuine review timeline (DOAJ recommends this).
  acceptedDate: { type: Date, default: null }
}, { timestamps: true });

SubmissionSchema.statics.STATUSES = STATUSES;

module.exports = mongoose.model('Submission', SubmissionSchema);
