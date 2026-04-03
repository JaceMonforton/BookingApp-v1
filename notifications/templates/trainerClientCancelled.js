module.exports = function trainerClientCancelled(data) {
  const { trainerName, clientName, type, startTime } = data;
  return {
    subject: 'Client cancelled a booking — Pulsed',
    text: `Hi ${trainerName},\n\n${clientName} cancelled: ${type} at ${startTime}.\n`,
    html: `<p>Hi ${trainerName},</p><p><strong>${clientName}</strong> cancelled: ${type} at ${startTime}.</p>`,
  };
};
