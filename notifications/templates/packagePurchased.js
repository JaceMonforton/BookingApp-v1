module.exports = function packagePurchased(data) {
  const { name, packageName, startDate, endDate, totalClasses } = data;
  return {
    subject: 'Package purchase receipt — Pulsed',
    text: `Hi ${name},\n\nThanks for purchasing ${packageName}.\nValid ${startDate} – ${endDate}.\nTotal classes: ${totalClasses}\n`,
    html: `<p>Hi ${name},</p><p>Thanks for purchasing <strong>${packageName}</strong>.</p><p>${startDate} – ${endDate}</p><p>Total classes: ${totalClasses}</p>`,
  };
};
