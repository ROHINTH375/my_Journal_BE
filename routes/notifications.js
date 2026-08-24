const express = require('express');
const router = express.Router();
const identify = require('../middleware/identify');
const Notification = require('../models/Notification');

router.use(identify);

// @route   GET api/notifications
// @desc    Recent notifications + unread count for the current actor
router.get('/', async (req, res) => {
  try {
    const filter = { recipientType: req.actor.type, recipient: req.actor.id };
    const [notifications, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).limit(30),
      Notification.countDocuments({ ...filter, read: false })
    ]);
    res.json({ notifications, unreadCount });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PATCH api/notifications/:id/read
router.patch('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientType: req.actor.type, recipient: req.actor.id },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ msg: 'Notification not found' });
    res.json(notification);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PATCH api/notifications/read-all
router.patch('/read-all', async (req, res) => {
  try {
    await Notification.updateMany(
      { recipientType: req.actor.type, recipient: req.actor.id, read: false },
      { read: true }
    );
    res.json({ msg: 'All notifications marked read' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
