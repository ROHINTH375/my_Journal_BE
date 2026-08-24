const jwt = require('jsonwebtoken');

// Notifications are shared by Editors and Users (Authors/Reviewers), which
// live in separate collections with separate cookies. This accepts either
// and normalizes to req.actor = { type: 'Editor'|'User', id }.
module.exports = function (req, res, next) {
  const userToken = req.cookies.user_token;
  const editorToken = req.cookies.token;

  if (userToken) {
    try {
      const decoded = jwt.verify(userToken, process.env.JWT_SECRET);
      req.actor = { type: 'User', id: decoded.user.id };
      return next();
    } catch (err) {
      // fall through to try the editor cookie
    }
  }

  if (editorToken) {
    try {
      const decoded = jwt.verify(editorToken, process.env.JWT_SECRET);
      req.actor = { type: 'Editor', id: decoded.editor.id };
      return next();
    } catch (err) {
      // fall through to unauthorized
    }
  }

  return res.status(401).json({ msg: 'No token, authorization denied' });
};
