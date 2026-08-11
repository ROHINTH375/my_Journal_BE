const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { getBucket } = require('../utils/gridfs');

// @route   GET api/files/:id
// @desc    Stream a stored file (manuscript or published PDF) by id
// @access  Public
router.get('/:id', async (req, res) => {
  let fileId;
  try {
    fileId = new mongoose.Types.ObjectId(req.params.id);
  } catch (err) {
    return res.status(400).json({ msg: 'Invalid file id' });
  }

  try {
    const files = await getBucket().find({ _id: fileId }).toArray();
    if (!files.length) {
      return res.status(404).json({ msg: 'File not found' });
    }
    const file = files[0];
    const safeFilename = String(file.filename || 'file').replace(/["\r\n]/g, '');
    res.set('Content-Type', file.contentType || 'application/octet-stream');
    res.set('Content-Disposition', `inline; filename="${safeFilename}"`);
    getBucket().openDownloadStream(fileId).on('error', () => res.status(404).end()).pipe(res);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
