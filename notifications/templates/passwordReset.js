module.exports = function passwordReset(data) {
  const { name, link } = data;
  return {
    subject: 'Reset your password — Pulsed',
    text: `Hi ${name},\n\nReset password: ${link}\n`,
    html: `<p>Hi ${name},</p><p><a href="${link}">Reset password</a></p>`,
  };
};
