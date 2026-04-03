module.exports = function emailVerification(data) {
  const { name, link } = data;
  return {
    subject: 'Verify your email — Pulsed',
    text: `Hi ${name},\n\nVerify your email: ${link}\n`,
    html: `<p>Hi ${name},</p><p><a href="${link}">Verify your email</a></p>`,
  };
};
