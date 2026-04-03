const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { randomToken, hashToken } = require('./tokens');
const {
  ACCESS_TOKEN_EXPIRES,
  REFRESH_TOKEN_DAYS,
  REMEMBER_REFRESH_TOKEN_DAYS,
} = require('../config/constants');

function signAccessToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES,
  });
}

async function issueRefreshToken(userId, remember) {
  const raw = randomToken(48);
  const hash = hashToken(raw);
  await User.findByIdAndUpdate(userId, {
    $push: {
      refreshTokens: {
        $each: [hash],
        $slice: -10,
      },
    },
  });
  const days = remember ? REMEMBER_REFRESH_TOKEN_DAYS : REFRESH_TOKEN_DAYS;
  return { raw, maxAgeMs: days * 24 * 60 * 60 * 1000 };
}

async function rotateRefreshToken(userId, oldRaw, remember) {
  const oldHash = hashToken(oldRaw);
  await User.findByIdAndUpdate(userId, { $pull: { refreshTokens: oldHash } });
  return issueRefreshToken(userId, remember);
}

async function revokeRefreshToken(userId, raw) {
  if (!raw) return;
  const h = hashToken(raw);
  await User.findByIdAndUpdate(userId, { $pull: { refreshTokens: h } });
}

module.exports = {
  signAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  hashToken,
};
