const mongoose = require('mongoose');

const ROLES = ['client', 'trainer', 'admin'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, default: 'client' },
    phone: { type: String, default: '' },
    stripeCustomerId: { type: String, default: '' },
    emailVerified: { type: Boolean, default: false },
    refreshTokens: [{ type: String }],
    inviteToken: { type: String, default: '' },
    emailVerificationToken: { type: String, default: '' },
    emailVerificationExpires: { type: Date },
    passwordResetToken: { type: String, default: '' },
    passwordResetExpires: { type: Date },
    hasSignedWaiver: {
      signedwaiver: { type: Boolean, default: false },
      emergencyContactInfo: {
        emergencyContactName: String,
        emergencyContactEmailorPhone: String,
      },
      physicalLimits: { type: String, default: 'none' },
      signature: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

userSchema.index({ emailVerificationToken: 1 });
userSchema.index({ passwordResetToken: 1 });

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;
