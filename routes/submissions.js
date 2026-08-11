const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');
const upload = require('../utils/upload');
const { uploadBuffer } = require('../utils/gridfs');

function generateReferenceId() {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `LAT-${year}-${rand}`;
}

// @route   POST api/submissions
// @desc    Submit a manuscript (multipart: manuscript file + JSON fields)
// @access  Public
router.post('/', upload.single('manuscript'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'Manuscript PDF is required' });
    }

    const { title, abstract, keywords, authors, correspondingAuthor, coverLetter } = req.body;

    if (!title || !abstract || !authors || !correspondingAuthor) {
      return res.status(400).json({ msg: 'title, abstract, authors, and correspondingAuthor are required' });
    }

    let parsedAuthors, parsedCorresponding, parsedKeywords;
    try {
      parsedAuthors = typeof authors === 'string' ? JSON.parse(authors) : authors;
      parsedCorresponding = typeof correspondingAuthor === 'string' ? JSON.parse(correspondingAuthor) : correspondingAuthor;
      parsedKeywords = keywords ? (typeof keywords === 'string' ? JSON.parse(keywords) : keywords) : [];
    } catch (err) {
      return res.status(400).json({ msg: 'authors, correspondingAuthor, and keywords must be valid JSON' });
    }

    if (!Array.isArray(parsedAuthors) || parsedAuthors.length === 0) {
      return res.status(400).json({ msg: 'At least one author is required' });
    }

    const manuscriptFileId = await uploadBuffer(req.file.buffer, req.file.originalname, req.file.mimetype);

    let referenceId = generateReferenceId();
    while (await Submission.findOne({ referenceId })) {
      referenceId = generateReferenceId();
    }

    const submission = new Submission({
      title,
      abstract,
      keywords: parsedKeywords,
      authors: parsedAuthors,
      correspondingAuthor: parsedCorresponding,
      coverLetter: coverLetter || '',
      manuscriptFileId,
      referenceId
    });

    await submission.save();

    res.status(201).json({ referenceId: submission.referenceId });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
