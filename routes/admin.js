const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Submission = require('../models/Submission');
const Article = require('../models/Article');
const Issue = require('../models/Issue');

router.use(auth);

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// @route   GET api/admin/submissions
// @desc    List submissions, optional ?status= filter
router.get('/submissions', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const submissions = await Submission.find(filter)
      .populate('assignedEditor', 'name email')
      .sort({ submittedDate: -1 });
    res.json(submissions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/admin/submissions/:id
router.get('/submissions/:id', async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('assignedEditor', 'name email')
      .populate('articleId');
    if (!submission) return res.status(404).json({ msg: 'Submission not found' });
    res.json(submission);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PATCH api/admin/submissions/:id
// @desc    Update status, append a review note, or (re)assign an editor
router.patch('/submissions/:id', async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ msg: 'Submission not found' });

    const { status, note, assignedEditor } = req.body;

    if (status) {
      if (!Submission.STATUSES.includes(status)) {
        return res.status(400).json({ msg: `status must be one of ${Submission.STATUSES.join(', ')}` });
      }
      if (status === 'published') {
        return res.status(400).json({ msg: 'Use POST /api/admin/submissions/:id/publish to publish' });
      }
      submission.status = status;
    }

    if (note) {
      submission.notes.push({ by: req.editor.id, text: note });
    }

    if (assignedEditor !== undefined) {
      submission.assignedEditor = assignedEditor || null;
    }

    await submission.save();
    res.json(submission);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/admin/submissions/:id/publish
// @desc    Turn an accepted submission into a published Article
router.post('/submissions/:id/publish', async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ msg: 'Submission not found' });
    if (submission.status === 'published') {
      return res.status(400).json({ msg: 'Submission is already published' });
    }

    const { issueId, articleNumber, pages, doi, publishedDate, abstractExcerpt } = req.body;
    if (!issueId || !articleNumber || !pages) {
      return res.status(400).json({ msg: 'issueId, articleNumber, and pages are required' });
    }

    const issue = await Issue.findById(issueId);
    if (!issue) return res.status(400).json({ msg: 'Issue not found' });

    const baseSlug = slugify(submission.title);
    let uniqueSlug = baseSlug;
    let suffix = 2;
    while (await Article.findOne({ slug: uniqueSlug })) {
      uniqueSlug = `${baseSlug}-${suffix++}`;
    }

    const article = new Article({
      slug: uniqueSlug,
      title: submission.title,
      authors: submission.authors,
      abstract: submission.abstract,
      abstractExcerpt: abstractExcerpt || `${submission.abstract.slice(0, 220)}...`,
      keywords: submission.keywords,
      doi: doi || '',
      issue: issue._id,
      articleNumber,
      pages,
      publishedDate: publishedDate ? new Date(publishedDate) : new Date(),
      fileId: submission.manuscriptFileId
    });

    await article.save();

    submission.status = 'published';
    submission.articleId = article._id;
    await submission.save();

    res.status(201).json(article);
  } catch (err) {
    console.error(err.message);
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'That article number is already used in this issue' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/admin/issues
router.post('/issues', async (req, res) => {
  try {
    const { slug, volume, number, year, season, label, isCurrent } = req.body;
    if (!slug || !volume || !number || !year || !season || !label) {
      return res.status(400).json({ msg: 'slug, volume, number, year, season, and label are required' });
    }

    if (isCurrent) {
      await Issue.updateMany({}, { isCurrent: false });
    }

    const issue = new Issue({ slug, volume, number, year, season, label, isCurrent: !!isCurrent });
    await issue.save();
    res.status(201).json(issue);
  } catch (err) {
    console.error(err.message);
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'An issue with that slug already exists' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/admin/rebuild-site
// @desc    Trigger a GitHub Actions redeploy of the static frontend
router.post('/rebuild-site', async (req, res) => {
  const token = process.env.GITHUB_DISPATCH_TOKEN;
  const repo = process.env.GITHUB_DISPATCH_REPO || 'ROHINTH375/my_Journal_FE';
  const workflow = process.env.GITHUB_DISPATCH_WORKFLOW || 'deploy.yml';

  if (!token) {
    return res.status(501).json({ msg: 'GITHUB_DISPATCH_TOKEN is not configured on this server' });
  }

  try {
    const ghRes = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/${workflow}/dispatches`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ref: 'main' })
    });

    if (!ghRes.ok) {
      const text = await ghRes.text();
      console.error('GitHub dispatch failed:', ghRes.status, text);
      return res.status(502).json({ msg: 'Failed to trigger rebuild' });
    }

    res.json({ msg: 'Rebuild triggered' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Failed to trigger rebuild' });
  }
});

module.exports = router;
