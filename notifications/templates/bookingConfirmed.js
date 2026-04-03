module.exports = function bookingConfirmed(data) {
  const { name, type, startTime, zoomLink } = data;
  const zoom = zoomLink ? `\nZoom: ${zoomLink}` : '';
  return {
    subject: 'Booking confirmed — Pulsed',
    text: `Hi ${name},\n\nYou're booked for ${type} at ${startTime}.${zoom}\n`,
    html: `<p>Hi ${name},</p><p>Booked: <strong>${type}</strong> at ${startTime}.</p>${zoomLink ? `<p><a href="${zoomLink}">Join Zoom</a></p>` : ''}`,
  };
};
