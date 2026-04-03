module.exports = function bookingCancelled(data) {
  const { name, type, startTime, late } = data;
  return {
    subject: late ? 'Late cancellation — Pulsed' : 'Booking cancelled — Pulsed',
    text: `Hi ${name},\n\n${late ? 'Late cancel — class counted toward package.' : 'Your booking was cancelled.'}\n${type} ${startTime}\n`,
    html: `<p>Hi ${name},</p><p>${late ? 'Late cancellation — this class counts toward your package.' : 'Your booking was cancelled.'}</p><p>${type} — ${startTime}</p>`,
  };
};
