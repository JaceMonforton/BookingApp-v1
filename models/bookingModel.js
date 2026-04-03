const mongoose = require('mongoose');

const BOOKING_STATUSES = ['confirmed', 'cancelled', 'waitlisted', 'no_show'];

const bookingSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
    clientPackage: { type: mongoose.Schema.Types.ObjectId, ref: 'ClientPackage' },
    stripePaymentIntentId: { type: String, default: '' },
    status: { type: String, enum: BOOKING_STATUSES, required: true },
    cancelledAt: { type: Date },
    lateCancellation: { type: Boolean, default: false },
    reminder24hSent: { type: Boolean, default: false },
    reminder2hSent: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

bookingSchema.index({ client: 1, session: 1 });
bookingSchema.index({ session: 1, status: 1 });
bookingSchema.index({ client: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
module.exports.BOOKING_STATUSES = BOOKING_STATUSES;
