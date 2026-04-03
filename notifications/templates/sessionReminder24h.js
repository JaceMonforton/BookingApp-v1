module.exports = function sessionReminder24h(data) {
  const { name, type, startTime, zoomLink } = data;
  return {
    subject: 'Reminder: class in 24 hours — Pulsed',
    text: `Hi ${name},\n\n${type} tomorrow at ${startTime}.${zoomLink ? ` Zoom: ${zoomLink}` : ''}\n`,
    html: `<p>Hi ${name},</p><p><strong>${type}</strong> in 24h — ${startTime}.</p>${zoomLink ? `<p><a href="${zoomLink}">Zoom</a></p>` : ''}`,
  };
};
