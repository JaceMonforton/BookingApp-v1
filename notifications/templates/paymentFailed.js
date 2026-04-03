module.exports = function paymentFailed(data) {
  const { name } = data;
  return {
    subject: 'Payment failed — Pulsed',
    text: `Hi ${name},\n\nYour payment could not be completed. Please try again or use another card.\n`,
    html: `<p>Hi ${name},</p><p>Your payment could not be completed.</p>`,
  };
};
