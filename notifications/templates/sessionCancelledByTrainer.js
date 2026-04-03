module.exports = function sessionCancelledByTrainer(data) {
  const { name, type, startTime } = data;
  return {
    subject: 'Class cancelled — Pulsed',
    text: `Hi ${name},\n\nYour ${type} session on ${startTime} was cancelled by the studio.\n`,
    html: `<p>Hi ${name},</p><p>Your <strong>${type}</strong> session on ${startTime} was cancelled.</p>`,
  };
};
