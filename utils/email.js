const { Resend } = require('resend');

let client = null;
function getClient() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

// Throws rather than silently no-op'ing — a password reset or assignment
// notice that silently fails to send is worse than a loud 500, since the
// caller has no other way to know the email never went out.
async function sendEmail({ to, subject, html }) {
  const resend = getClient();
  if (!resend) {
    throw new Error('Email is not configured (RESEND_API_KEY missing) — cannot send this message');
  }
  const from = process.env.EMAIL_FROM;
  if (!from) {
    throw new Error('EMAIL_FROM is not configured — cannot send this message');
  }
  const { error } = await resend.emails.send({ from, to, subject, html });
  if (error) {
    throw new Error(`Resend error: ${error.message || error}`);
  }
}

function sendPasswordResetEmail(to, resetUrl) {
  return sendEmail({
    to,
    subject: 'Reset your Lattice password',
    html: `
      <p>Someone requested a password reset for this Lattice account.</p>
      <p><a href="${resetUrl}">Click here to set a new password</a>. This link expires in 1 hour.</p>
      <p>If you didn't request this, you can ignore this email.</p>
    `
  });
}

function sendReviewerAssignedEmail(to, submissionTitle, dashboardUrl) {
  return sendEmail({
    to,
    subject: 'You have been assigned a manuscript to review',
    html: `
      <p>You've been assigned to review <strong>${submissionTitle}</strong> for Lattice.</p>
      <p><a href="${dashboardUrl}">View it on your dashboard</a>.</p>
    `
  });
}

module.exports = { sendEmail, sendPasswordResetEmail, sendReviewerAssignedEmail };
