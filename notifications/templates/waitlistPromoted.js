module.exports = function waitlistPromoted(data) {
  const { name, type, startTime, zoomLink } = data;
  return {
    subject: "You're confirmed from the waitlist — Pulsed",
    text: `Hi ${name},\n\nA spot opened — you're confirmed for ${type} at ${startTime}.${zoomLink ? ` Zoom: ${zoomLink}` : ''}\n`,
    html: `<p>Hi ${name},</p><p>You're confirmed from the waitlist for <strong>${type}</strong> at ${startTime}.</p>${zoomLink ? `<p><a href="${zoomLink}">Zoom</a></p>` : ''}`,
  };
};
