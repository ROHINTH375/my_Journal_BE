const jwt = require('jsonwebtoken');

// Mirrors middleware/auth.js but reads a separate cookie ('user_token', not
// 'token') so an Editor session and an Author/Reviewer session can coexist
// in the same browser without clobbering each other.
function userAuth(req, res, next) {
  const token = req.cookies.user_token || req.header('x-user-auth-token');

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
}

// Route guard for role-specific endpoints (author-only, reviewer-only) —
// use after userAuth so req.user is already populated.
function requireRole(role) {
  return function (req, res, next) {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ msg: `This action requires the ${role} role` });
    }
    next();
  };
}

module.exports = userAuth;
module.exports.requireRole = requireRole;
