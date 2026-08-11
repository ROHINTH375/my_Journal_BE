const express = require('express');
const router = express.Router();
const Article = require('../models/Article');
const Issue = require('../models/Issue');

function serializeArticle(article) {
  const issue = article.issue;
  return {
    slug: article.slug,
    title: article.title,
    authors: article.authors,
    abstract: article.abstract,
    abstractExcerpt: article.abstractExcerpt,
    keywords: article.keywords,
    doi: article.doi,
    issueSlug: issue ? issue.slug : null,
    articleNumber: article.articleNumber,
    pages: article.pages,
    publishedDate: article.publishedDate,
    fileUrl: article.fileId ? `/api/files/${article.fileId}` : null
  };
}

// @route   GET api/articles
// @desc    List published articles, optional ?issue=<issueSlug> filter
// @access  Public
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.issue) {
      const issue = await Issue.findOne({ slug: req.query.issue });
      if (!issue) return res.json([]);
      filter.issue = issue._id;
    }
    const articles = await Article.find(filter).populate('issue').sort({ publishedDate: -1 });
    res.json(articles.map(serializeArticle));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/articles/:slug
// @access  Public
router.get('/:slug', async (req, res) => {
  try {
    const article = await Article.findOne({ slug: req.params.slug }).populate('issue');
    if (!article) return res.status(404).json({ msg: 'Article not found' });
    res.json(serializeArticle(article));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
