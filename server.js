const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

dotenv.config();

const app = express();

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000
});
app.use('/api/', limiter);

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://rohinth375.github.io',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1')
    ) {
      callback(null, true);
    } else {
      console.error('CORS blocked request from origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Strip Mongo operator keys ($, .) from user input — express-mongo-sanitize is
// skipped for the same Express 5 compatibility reason tyreshop-server dropped it.
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return;
  for (const key in obj) {
    if (key.startsWith('$')) {
      delete obj[key];
    } else if (typeof obj[key] === 'object') {
      sanitizeObject(obj[key]);
    }
  }
};
app.use((req, res, next) => {
  ['body', 'params', 'query'].forEach((k) => {
    if (req[k]) sanitizeObject(req[k]);
  });
  next();
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.log('MongoDB Connection Error:', err));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/issues', require('./routes/issues'));
app.use('/api/files', require('./routes/files'));
app.use('/api/submissions', require('./routes/submissions'));
app.use('/api/admin', require('./routes/admin'));

// Catches multer errors (bad file type, too large) and the CORS rejection
// thrown in the origin callback above, so they come back as JSON instead of
// Express's default HTML error page / stack trace.
app.use((err, req, res, next) => {
  if (!err) return next();
  console.error(err.message);
  res.status(400).json({ msg: err.message || 'Request error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
