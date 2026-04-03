const Booking = require('../models/bookingModel');
const User = require('../models/userModel');
const { sendEmail, sendSMS } = require('./notificationService');

function typeLabel(s) {
  return s.type.replace(/_/g, ' ');
}

async function run24hReminders() {
  const now = new Date();
  const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);
  const bookings = await Booking.find({
    status: 'confirmed',
    reminder24hSent: false,
  }).populate('session');

  for (const b of bookings) {
    const s = b.session;
    if (!s || s.status !== 'scheduled') continue;
    if (s.startTime < windowStart || s.startTime > windowEnd) continue;
    const user = await User.findById(b.client);
    if (!user?.email) continue;
    await sendEmail(user.email, 'sessionReminder24h', {
      name: user.name,
      type: typeLabel(s),
      startTime: s.startTime.toISOString(),
      zoomLink: s.isZoom ? s.zoomLink : '',
    }).catch(() => {});
    b.reminder24hSent = true;
    await b.save();
  }
}

async function run2hReminders() {
  const now = new Date();
  const windowStart = new Date(now.getTime() + 115 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 125 * 60 * 1000);
  const bookings = await Booking.find({
    status: 'confirmed',
    reminder2hSent: false,
  }).populate('session');

  for (const b of bookings) {
    const s = b.session;
    if (!s || s.status !== 'scheduled') continue;
    if (s.startTime < windowStart || s.startTime > windowEnd) continue;
    const user = await User.findById(b.client);
    if (!user) continue;
    await sendEmail(user.email, 'sessionReminder2h', {
      name: user.name,
      type: typeLabel(s),
      startTime: s.startTime.toISOString(),
      zoomLink: s.isZoom ? s.zoomLink : '',
    }).catch(() => {});
    await sendSMS(user.phone, 'sessionReminder2h', {
      type: typeLabel(s),
      startTime: s.startTime.toISOString(),
    });
    b.reminder2hSent = true;
    await b.save();
  }
}

/** Scaffold: extend with trainer digest query + sendEmail batch. */
async function runTrainerDailyDigest() {
  return { ok: true, message: 'Trainer daily digest scaffold — no recipients configured' };
}

module.exports = { run24hReminders, run2hReminders, runTrainerDailyDigest };
