const { Notification } = require('../models');
const { isDatabaseReady } = require('./database');
const { inMemoryStore } = require('../data/sampleData');
const { sendEmail } = require('./email');

const sendNotificationEmail = async ({ to, subject, html }) => {
  return sendEmail({ toEmail: to, subject, htmlContent: html });
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
