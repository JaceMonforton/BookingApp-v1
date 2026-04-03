const mongoose = require('mongoose');

const SESSION_TYPES = ['mat_pilates', 'reformer', 'personal_training'];
const SESSION_STATUSES = ['scheduled', 'cancelled', 'completed'];

const sessionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: SESSION_TYPES, required: true },
    isZoom: { type: Boolean, default: false },
    zoomLink: { type: String, default: '' },
    trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    maxCapacity: { type: Number, required: true, min: 1 },
    enrolledClients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    waitlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: SESSION_STATUSES, default: 'scheduled' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

sessionSchema.index({ trainer: 1, startTime: 1 });
sessionSchema.index({ startTime: 1, status: 1 });
sessionSchema.index({ type: 1, startTime: 1 });

sessionSchema.pre('validate', function setDefaultCapacity(next) {
  if (this.type === 'mat_pilates') {
    if (this.maxCapacity == null) this.maxCapacity = 4;
  } else if (this.type === 'reformer') {
    if (this.maxCapacity == null) this.maxCapacity = 1;
  } else if (this.type === 'personal_training') {
    const n = this.maxCapacity;
    if (n == null) this.maxCapacity = 1;
    else this.maxCapacity = Math.min(10, Math.max(1, n));
  }
  next();
});

module.exports = mongoose.model('Session', sessionSchema);
module.exports.SESSION_TYPES = SESSION_TYPES;
module.exports.SESSION_STATUSES = SESSION_STATUSES;
