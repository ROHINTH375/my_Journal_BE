const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipientType: { type: String, enum: ['User', 'Editor'], required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'recipientType' },
  type: { type: String, required: true },
  title: { type: String, required: true },
  body: { type: String, default: '' },
  link: { type: String, default: '' },
  read: { type: Boolean, default: false }
}, { timestamps: true });

NotificationSchema.index({ recipientType: 1, recipient: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
