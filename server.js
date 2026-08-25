const dns = require('dns');
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const { Server: SocketIOServer } = require('socket.io');

dotenv.config();

// The local/VPN DNS resolver can fail to answer the SRV+TXT queries that
// mongodb+srv:// needs (seen as ETIMEOUT on queryTxt), even though the
// hostname otherwise resolves fine. Point Node at public resolvers so the
// Atlas SRV lookup succeeds regardless of the host's default DNS setup.
dns.setServers(['8.8.8.8', '1.1.1.1']);

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
  'https://journalwebsite1904-one.vercel.app',
  'http://localhost:3000'
].filter(Boolean);

// Shared by the REST CORS middleware and the Socket.IO CORS check below, so
// the two surfaces can't drift out of sync.
function isOriginAllowed(origin) {
  return (
    !origin ||
    allowedOrigins.includes(origin) ||
    origin.startsWith('http://localhost') ||
    origin.startsWith('http://127.0.0.1') ||
    // Preview deployments get random *.vercel.app subdomains per build —
    // allow the whole subdomain rather than chasing each one.
    /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)
  );
}

app.use(cors({
  origin: function (origin, callback) {
    if (isOriginAllowed(origin)) {
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
app.use('/api/users', require('./routes/userAuth'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/issues', require('./routes/issues'));
app.use('/api/files', require('./routes/files'));
app.use('/api/submissions', require('./routes/submissions'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/notifications', require('./routes/notifications'));

// Catches multer errors (bad file type, too large) and the CORS rejection
// thrown in the origin callback above, so they come back as JSON instead of
// Express's default HTML error page / stack trace.
app.use((err, req, res, next) => {
  if (!err) return next();
  console.error(err.message);
  res.status(400).json({ msg: err.message || 'Request error' });
});

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => callback(null, isOriginAllowed(origin)),
    credentials: true
  }
});

// Authenticate the socket using the same JWT cookies the REST API reads —
// either an Editor ('token') or a User ('user_token') session — then join a
// room keyed exactly the way utils/notify.js addresses notifications:
// `${recipientType.toLowerCase()}:${id}`.
io.use((socket, next) => {
  try {
    const cookies = cookie.parse(socket.handshake.headers.cookie || '');
    if (cookies.user_token) {
      const decoded = jwt.verify(cookies.user_token, process.env.JWT_SECRET);
      socket.data.room = `user:${decoded.user.id}`;
    } else if (cookies.token) {
      const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET);
      socket.data.room = `editor:${decoded.editor.id}`;
    } else {
      return next(new Error('Unauthorized'));
    }
    next();
  } catch (err) {
    next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  socket.join(socket.data.room);
});

app.set('io', io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
