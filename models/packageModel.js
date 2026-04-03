const mongoose = require('mongoose');

const CLASS_TYPES = ['mat_pilates', 'reformer', 'personal_training', 'zoom', 'all'];

const packageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    classType: { type: String, enum: CLASS_TYPES, required: true },
    durationWeeks: { type: Number, required: true, min: 1 },
    classesPerWeek: { type: Number, required: true, min: 1, max: 10 },
    totalClasses: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    stripePriceId: { type: String, default: '' },
    stripeProductId: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

packageSchema.pre('validate', function deriveTotal(next) {
  this.totalClasses = this.durationWeeks * this.classesPerWeek;
  next();
});

packageSchema.index({ isActive: 1, classType: 1 });

module.exports = mongoose.model('Package', packageSchema);
module.exports.CLASS_TYPES = CLASS_TYPES;
