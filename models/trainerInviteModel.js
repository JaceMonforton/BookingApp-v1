const mongoose = require('mongoose');

const trainerInviteSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
    consumedAt: { type: Date },
    consumedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

trainerInviteSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('TrainerInvite', trainerInviteSchema);
