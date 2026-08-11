const mongoose = require('mongoose');
const AuthorSchema = require('./AuthorSchema');

const ArticleSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  authors: { type: [AuthorSchema], required: true },
  abstract: { type: String, required: true },
  abstractExcerpt: { type: String, required: true },
  keywords: { type: [String], default: [] },
  doi: { type: String, default: '' },
  issue: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true },
  articleNumber: { type: Number, required: true },
  pages: { type: String, required: true },
  publishedDate: { type: Date, required: true },
  fileId: { type: mongoose.Schema.Types.ObjectId, default: null }
}, { timestamps: true });

ArticleSchema.index({ issue: 1, articleNumber: 1 }, { unique: true });

module.exports = mongoose.model('Article', ArticleSchema);
