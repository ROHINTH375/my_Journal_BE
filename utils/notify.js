const Notification = require('../models/Notification');

// Persists a Notification and, if a socket.io server is available (passed
// as req.app.get('io')), pushes it live to that recipient's room. Persisting
// first means the bell/dropdown still works from a fresh page load even if
// the recipient wasn't connected when the event fired.
async function notify({ io, recipientType, recipient, type, title, body = '', link = '' }) {
  const doc = await Notification.create({ recipientType, recipient, type, title, body, link });
  if (io) {
    const room = `${recipientType.toLowerCase()}:${recipient}`;
    io.to(room).emit('notification:new', doc);
  }
  return doc;
}

module.exports = { notify };
