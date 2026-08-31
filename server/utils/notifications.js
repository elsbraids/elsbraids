const { Notification } = require('../models');
const { isDatabaseReady } = require('./database');
const { inMemoryStore } = require('../data/sampleData');
const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return null;
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 587),
    secure: Number(process.env.EMAIL_PORT || 587) === 465,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
  });
};

const sendNotificationEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();
  if (!transporter) return false;
  try {
    await transporter.sendMail({ from: process.env.EMAIL_FROM || process.env.EMAIL_USER, to, subject, html });
    return true;
  } catch (error) {
    console.error('[notification] Email failed:', error.message);
    return false;
  }
};

const createNotification = async ({ recipientType, recipientEmail, type, subject, message, relatedData, sendEmail = true, html = '' }) => {
  try {
    const notifData = { recipientType, recipientEmail, type, subject, message, relatedData, read: false, createdAt: new Date() };

    if (isDatabaseReady()) {
      await Notification.create(notifData);
    } else {
      notifData.id = 'notif-' + Date.now() + Math.floor(Math.random() * 1000);
      notifData.createdAt = notifData.createdAt.toISOString();
      inMemoryStore.notifications.unshift(notifData);
    }

    if (sendEmail) {
      const emailHtml = html || `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333">
          <div style="background:#5b2b45;padding:24px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:22px">EL'S BRAIDS</h1>
          </div>
          <div style="padding:28px 24px;background:#fff">
            <h2>${subject}</h2>
            <p>${message}</p>
          </div>
        </div>
      `;
      await sendNotificationEmail({ to: recipientEmail, subject, html: emailHtml });
    }
  } catch (error) {
    console.error('[notification] Failed to create notification:', error.message);
  }
};

module.exports = { createNotification, sendNotificationEmail };
