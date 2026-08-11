const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Get token from cookie (or fallback to header for curl/Postman testing)
  const token = req.cookies.token || req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.editor = decoded.editor;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
