const express = require('express');
const router = express.Router();
const Issue = require('../models/Issue');

// @route   GET api/issues
// @access  Public
router.get('/', async (req, res) => {
  try {
    const issues = await Issue.find().sort({ year: -1, number: -1 });
    res.json(issues);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/issues/current
// @access  Public
router.get('/current', async (req, res) => {
  try {
    const issue = (await Issue.findOne({ isCurrent: true })) || (await Issue.findOne().sort({ year: -1, number: -1 }));
    if (!issue) return res.status(404).json({ msg: 'No issues found' });
    res.json(issue);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/issues/:slug
// @access  Public
router.get('/:slug', async (req, res) => {
  try {
    const issue = await Issue.findOne({ slug: req.params.slug });
    if (!issue) return res.status(404).json({ msg: 'Issue not found' });
    res.json(issue);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
