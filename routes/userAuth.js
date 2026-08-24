const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Submission = require('../models/Submission');
const ReviewAssignment = require('../models/ReviewAssignment');
const userAuth = require('../middleware/userAuth');
const { requireRole } = userAuth;
const KEYWORDS = require('../config/keywords');
const { sendPasswordResetEmail } = require('../utils/email');
const { notify } = require('../utils/notify');

const ROLES = ['author', 'reviewer'];
const MAX_KEYWORDS = 8;

function setUserCookie(res, token) {
  res.cookie('user_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 4 * 24 * 60 * 60 * 1000
  });
}

function signUserToken(user) {
  return new Promise((resolve, reject) => {
    const payload = { user: { id: user.id, role: user.role } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '4d' }, (err, token) => {
      if (err) reject(err);
      else resolve(token);
    });
  });
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    affiliation: user.affiliation,
    country: user.country,
    keywords: user.keywords,
    bio: user.bio
  };
}

function validateKeywords(keywords) {
  if (!Array.isArray(keywords)) return 'keywords must be an array';
  if (keywords.length > MAX_KEYWORDS) return `Select at most ${MAX_KEYWORDS} keywords`;
  const invalid = keywords.filter((k) => !KEYWORDS.includes(k));
  if (invalid.length) return `Unknown keyword(s): ${invalid.join(', ')}`;
  return null;
}

// @route   GET api/users/keywords
// @desc    The canonical keyword list, for the registration/profile forms
// @access  Public
router.get('/keywords', (req, res) => {
  res.json({ keywords: KEYWORDS, max: MAX_KEYWORDS });
});

// @route   POST api/users/register
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, affiliation, country, keywords, bio } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ msg: 'name, email, password, and role are required' });
    }
    if (!ROLES.includes(role)) {
      return res.status(400).json({ msg: `role must be one of ${ROLES.join(', ')}` });
    }
    if (password.length < 8) {
      return res.status(400).json({ msg: 'Password must be at least 8 characters' });
    }
    const keywordError = validateKeywords(keywords || []);
    if (keywordError) return res.status(400).json({ msg: keywordError });

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ msg: 'An account with that email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = new User({
      name, email, password: hashed, role,
      affiliation: affiliation || '', country: country || '',
      keywords: keywords || [], bio: bio || ''
    });
    await user.save();

    const token = await signUserToken(user);
    setUserCookie(res, token);
    res.status(201).json({ user: publicUser(user) });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/users/login
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ msg: 'Email and password are required' });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const token = await signUserToken(user);
    setUserCookie(res, token);
    res.json({ user: publicUser(user) });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/users/logout
router.post('/logout', (req, res) => {
  res.cookie('user_token', '', {
    httpOnly: true,
    secure: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    expires: new Date(0)
  });
  res.json({ msg: 'Logged out successfully' });
});

// @route   GET api/users/me
router.get('/me', userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(publicUser(user));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PATCH api/users/me
// @desc    Update profile — name, affiliation, country, keywords, bio
router.patch('/me', userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const { name, affiliation, country, keywords, bio } = req.body;

    if (keywords !== undefined) {
      const keywordError = validateKeywords(keywords);
      if (keywordError) return res.status(400).json({ msg: keywordError });
      user.keywords = keywords;
    }
    if (name !== undefined) user.name = name;
    if (affiliation !== undefined) user.affiliation = affiliation;
    if (country !== undefined) user.country = country;
    if (bio !== undefined) user.bio = bio;

    await user.save();
    res.json(publicUser(user));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PATCH api/users/me/password
// @desc    Change password while logged in (requires current password)
router.patch('/me/password', userAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ msg: 'currentPassword and newPassword are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ msg: 'New password must be at least 8 characters' });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Current password is incorrect' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    res.json({ msg: 'Password updated' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/users/password/forgot
// @access  Public
router.post('/password/forgot', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ msg: 'Email is required' });

  // Always the same response regardless of whether the account exists, so
  // this endpoint can't be used to enumerate registered emails.
  const generic = { msg: 'If an account exists for that email, a reset link has been sent.' };

  try {
    const user = await User.findOne({ email });
    if (!user) return res.json(generic);

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;
    await sendPasswordResetEmail(email, resetUrl);

    res.json(generic);
  } catch (err) {
    console.error(err.message);
    // Loud failure on purpose (see utils/email.js) — a reset request that
    // silently didn't send is worse than a visible error.
    res.status(500).json({ msg: err.message || 'Could not send reset email' });
  }
});

// @route   POST api/users/password/reset
// @access  Public
router.post('/password/reset', async (req, res) => {
  const { email, token, newPassword } = req.body;
  if (!email || !token || !newPassword) {
    return res.status(400).json({ msg: 'email, token, and newPassword are required' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ msg: 'Password must be at least 8 characters' });
  }
  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      email,
      resetTokenHash: tokenHash,
      resetTokenExpires: { $gt: new Date() }
    });
    if (!user) return res.status(400).json({ msg: 'That reset link is invalid or has expired' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetTokenHash = null;
    user.resetTokenExpires = null;
    await user.save();

    res.json({ msg: 'Password reset — you can now log in' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/users/me/submissions
// @access  Author only
router.get('/me/submissions', userAuth, requireRole('author'), async (req, res) => {
  try {
    const submissions = await Submission.find({ author: req.user.id }).sort({ submittedDate: -1 });
    res.json(submissions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/users/me/assignments
// @access  Reviewer only
router.get('/me/assignments', userAuth, requireRole('reviewer'), async (req, res) => {
  try {
    const assignments = await ReviewAssignment.find({ reviewer: req.user.id })
      .populate('submission')
      .sort({ assignedDate: -1 });
    res.json(assignments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PATCH api/users/me/assignments/:id
// @desc    Submit a recommendation + comments, marks the assignment complete
// @access  Reviewer only
router.patch('/me/assignments/:id', userAuth, requireRole('reviewer'), async (req, res) => {
  try {
    const assignment = await ReviewAssignment.findOne({ _id: req.params.id, reviewer: req.user.id })
      .populate('submission');
    if (!assignment) return res.status(404).json({ msg: 'Assignment not found' });

    const { recommendation, comments } = req.body;
    const validRecs = ReviewAssignment.RECOMMENDATIONS;
    if (!recommendation || !validRecs.includes(recommendation)) {
      return res.status(400).json({ msg: `recommendation must be one of ${validRecs.join(', ')}` });
    }

    assignment.recommendation = recommendation;
    assignment.comments = comments || '';
    assignment.status = 'completed';
    assignment.respondedDate = new Date();
    await assignment.save();

    if (assignment.submission?.assignedEditor) {
      await notify({
        io: req.app.get('io'),
        recipientType: 'Editor',
        recipient: assignment.submission.assignedEditor,
        type: 'review_completed',
        title: 'A reviewer submitted their recommendation',
        body: `${assignment.submission.title}: ${recommendation.replace('_', ' ')}`,
        link: `/admin/submission?id=${assignment.submission._id}`
      });
    }

    res.json(assignment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
