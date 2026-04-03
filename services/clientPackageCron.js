const ClientPackage = require('../models/clientPackageModel');

async function refreshClientPackageStatuses() {
  const now = new Date();
  await ClientPackage.updateMany(
    { status: 'active', endDate: { $lt: now } },
    { $set: { status: 'expired' } }
  );
  await ClientPackage.updateMany(
    { status: 'active', $expr: { $gte: ['$classesBooked', '$totalClasses'] } },
    { $set: { status: 'exhausted' } }
  );
}

module.exports = { refreshClientPackageStatuses };
