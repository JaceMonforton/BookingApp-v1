module.exports = function sessionReminder2h(data) {
  const { name, type, startTime, zoomLink } = data;
  return {
    subject: 'Class starts in 2 hours — Pulsed',
    text: `Hi ${name},\n\n${type} at ${startTime} (in ~2 hours).${zoomLink ? ` Zoom: ${zoomLink}` : ''}\n`,
    html: `<p>Hi ${name},</p><p><strong>${type}</strong> at ${startTime} (in ~2 hours).</p>${zoomLink ? `<p><a href="${zoomLink}">Zoom</a></p>` : ''}`,
  };
};
