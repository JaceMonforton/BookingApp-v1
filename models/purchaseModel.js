const mongoose = require('mongoose');

const PURCHASE_STATUSES = ['pending', 'completed', 'refunded'];

const purchaseSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    package: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', required: true },
    stripeSessionId: { type: String, default: '' },
    stripePaymentIntentId: { type: String, default: '' },
    amountPaid: { type: Number, default: 0 },
    status: { type: String, enum: PURCHASE_STATUSES, default: 'pending' },
  },
  { timestamps: true }
);

purchaseSchema.index({ client: 1, status: 1 });
purchaseSchema.index({ stripeSessionId: 1 });

module.exports = mongoose.model('Purchase', purchaseSchema);
module.exports.PURCHASE_STATUSES = PURCHASE_STATUSES;
