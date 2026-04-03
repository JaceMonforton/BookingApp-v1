const mongoose = require('mongoose');

const CP_STATUSES = ['active', 'expired', 'exhausted'];

const clientPackageSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    package: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', required: true },
    purchase: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    classesPerWeek: { type: Number, required: true },
    totalClasses: { type: Number, required: true },
    classesBooked: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: CP_STATUSES, default: 'active' },
  },
  { timestamps: true }
);

clientPackageSchema.index({ client: 1, status: 1 });
clientPackageSchema.index({ endDate: 1, status: 1 });

module.exports = mongoose.model('ClientPackage', clientPackageSchema);
module.exports.CP_STATUSES = CP_STATUSES;
