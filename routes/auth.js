const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Editor = require('../models/Editor');
const auth = require('../middleware/auth');

function setTokenCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: true, // required for cross-origin cookies (GitHub Pages -> Render)
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 4 * 24 * 60 * 60 * 1000
  });
}

// @route   POST api/auth/login
// @desc    Authenticate editor & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ msg: 'Email and password are required' });
  }

  try {
    const editor = await Editor.findOne({ email });
    if (!editor) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, editor.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const payload = { editor: { id: editor.id, role: editor.role } };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '4d' }, (err, token) => {
      if (err) throw err;
      setTokenCookie(res, token);
      res.json({ token, editor: { id: editor.id, name: editor.name, email: editor.email, role: editor.role } });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/logout
// @desc    Clear the auth cookie
// @access  Public
router.post('/logout', (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    secure: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    expires: new Date(0)
  });
  res.json({ msg: 'Logged out successfully' });
});

// @route   GET api/auth/me
// @desc    Get the current editor
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const editor = await Editor.findById(req.editor.id).select('-password');
    if (!editor) {
      return res.status(404).json({ msg: 'Editor not found' });
    }
    res.json(editor);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
