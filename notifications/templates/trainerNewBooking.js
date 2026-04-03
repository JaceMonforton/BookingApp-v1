module.exports = function trainerNewBooking(data) {
  const { trainerName, clientName, type, startTime } = data;
  return {
    subject: 'New booking on your session — Pulsed',
    text: `Hi ${trainerName},\n\n${clientName} booked ${type} at ${startTime}.\n`,
    html: `<p>Hi ${trainerName},</p><p><strong>${clientName}</strong> booked ${type} at ${startTime}.</p>`,
  };
};
