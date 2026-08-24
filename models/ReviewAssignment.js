const mongoose = require('mongoose');

const STATUSES = ['invited', 'accepted', 'declined', 'completed'];
const RECOMMENDATIONS = ['accept', 'minor_revisions', 'major_revisions', 'reject'];

const ReviewAssignmentSchema = new mongoose.Schema({
  submission: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', required: true },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: STATUSES, default: 'invited' },
  recommendation: { type: String, enum: RECOMMENDATIONS, default: null },
  comments: { type: String, default: '' },
  assignedDate: { type: Date, default: Date.now },
  respondedDate: { type: Date, default: null }
}, { timestamps: true });

ReviewAssignmentSchema.index({ submission: 1, reviewer: 1 }, { unique: true });

ReviewAssignmentSchema.statics.STATUSES = STATUSES;
ReviewAssignmentSchema.statics.RECOMMENDATIONS = RECOMMENDATIONS;

module.exports = mongoose.model('ReviewAssignment', ReviewAssignmentSchema);
