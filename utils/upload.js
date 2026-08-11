const multer = require('multer');

// Manuscripts are PDFs; memory storage because files stream straight into
// GridFS rather than touching disk (Render's filesystem is ephemeral anyway).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  }
});

module.exports = upload;
