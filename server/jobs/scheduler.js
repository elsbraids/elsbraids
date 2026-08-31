const cron = require('node-cron');
const { Booking } = require('../models');
const { isDatabaseReady } = require('../utils/database');
const { inMemoryStore } = require('../data/sampleData');
const { createNotification } = require('../utils/notifications');

const checkUpcomingBookings = async () => {
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowDateStr = tomorrow.toISOString().split('T')[0];

    console.log(`[scheduler] Checking for bookings on ${tomorrowDateStr}`);

    let bookings = [];
    if (isDatabaseReady()) {
      bookings = await Booking.find({
        date: tomorrowDateStr,
        status: { $in: ['Pending', 'Confirmed'] }
      }).lean();
    } else {
      bookings = inMemoryStore.bookings.filter(b => b.date === tomorrowDateStr && ['Pending', 'Confirmed'].includes(b.status));
    }

    if (bookings.length > 0) {
      console.log(`[scheduler] Found ${bookings.length} upcoming bookings. Sending reminders...`);
      for (const booking of bookings) {
        await createNotification({
          recipientType: 'Customer',
          recipientEmail: booking.email,
          type: 'Reminder',
          subject: 'Booking Reminder',
          message: `This is a reminder for your upcoming booking: ${booking.serviceName} tomorrow at ${booking.time}.`,
          relatedData: { reference: booking.reference },
        });
      }
    }
  } catch (err) {
    console.error('[scheduler] Error checking upcoming bookings:', err.message);
  }
};

// Run every hour on the hour
const startScheduler = () => {
  cron.schedule('0 * * * *', () => {
    checkUpcomingBookings();
  });
  console.log('[scheduler] node-cron scheduler started.');
};

module.exports = { startScheduler, checkUpcomingBookings };
