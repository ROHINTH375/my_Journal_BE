const multer = require('multer');

// Manuscripts are PDF/DOC/DOCX (matches the accept list + validation in
// submission-form.tsx); memory storage because files stream straight into
// GridFS rather than touching disk (Render's filesystem is ephemeral anyway).
const ALLOWED_MIMETYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIMETYPES.has(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF, DOC, or DOCX files are allowed'));
  }
});

module.exports = upload;
