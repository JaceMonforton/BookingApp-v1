const nodemailer = require('nodemailer');
const twilio = require('twilio');
const { STUDIO_NAME } = require('../config/constants');

const emailTemplates = {
  emailVerification: require('../notifications/templates/emailVerification'),
  passwordReset: require('../notifications/templates/passwordReset'),
  sessionReminder24h: require('../notifications/templates/sessionReminder24h'),
  sessionReminder2h: require('../notifications/templates/sessionReminder2h'),
  bookingConfirmed: require('../notifications/templates/bookingConfirmed'),
  bookingCancelled: require('../notifications/templates/bookingCancelled'),
  sessionCancelledByTrainer: require('../notifications/templates/sessionCancelledByTrainer'),
  waitlistPromoted: require('../notifications/templates/waitlistPromoted'),
  packagePurchased: require('../notifications/templates/packagePurchased'),
  trainerNewBooking: require('../notifications/templates/trainerNewBooking'),
  trainerClientCancelled: require('../notifications/templates/trainerClientCancelled'),
  paymentFailed: require('../notifications/templates/paymentFailed'),
};

let mailTransporter;
function getMailer() {
  if (mailTransporter) return mailTransporter;
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) return null;
  mailTransporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 587),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS || '',
    },
  });
  return mailTransporter;
}

let twilioClient;
function getTwilio() {
  if (twilioClient !== undefined) return twilioClient;
  if (!process.env.TWILIO_SID || !process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = null;
    return null;
  }
  twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
  return twilioClient;
}

function smsBody(template, data) {
  switch (template) {
    case 'bookingConfirmed':
      return `${STUDIO_NAME}: Booked ${data.type} at ${data.startTime}.`;
    case 'sessionReminder2h':
      return `${STUDIO_NAME}: ${data.type} starts in 2h (${data.startTime}).`;
    case 'sessionCancelledByTrainer':
      return `${STUDIO_NAME}: Your ${data.type} class ${data.startTime} was cancelled.`;
    case 'waitlistPromoted':
      return `${STUDIO_NAME}: You're in! ${data.type} at ${data.startTime}.`;
    case 'paymentFailed':
      return `${STUDIO_NAME}: Payment failed. Check your email.`;
    default:
      return `${STUDIO_NAME}: ${data.message || 'Notification'}`;
  }
}

async function sendEmail(to, template, data) {
  const fn = emailTemplates[template];
  if (!fn) {
    console.warn('Unknown email template:', template);
    return;
  }
  const { subject, html, text } = fn(data);
  const transport = getMailer();
  if (!transport) {
    console.warn('Email not configured; skipping send to', to);
    return;
  }
  await transport.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    text,
    html,
  });
}

async function sendSMS(to, template, data) {
  if (!to || !/^\+[1-9]\d{1,14}$/.test(to.replace(/\s/g, ''))) {
    return;
  }
  const client = getTwilio();
  if (!client) return;
  const body = smsBody(template, data);
  try {
    await client.messages.create({
      body,
      from: process.env.TWILIO_FROM,
      to: to.replace(/\s/g, ''),
    });
  } catch (e) {
    console.error('Twilio SMS failed:', e.message);
  }
}

module.exports = { sendEmail, sendSMS, emailTemplates, smsBody };
