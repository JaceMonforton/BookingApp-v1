const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const TrainerInvite = require('../models/trainerInviteModel');
const { validateBody } = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/requireAuth');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { randomToken, hashToken } = require('../utils/tokens');
const { signAccessToken, issueRefreshToken, rotateRefreshToken, revokeRefreshToken } = require('../utils/authTokens');
const { sendEmail } = require('../services/notificationService');
const {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  trainerInviteSchema,
  profileUpdateSchema,
} = require('../validation/schemas');

const router = express.Router();
const REFRESH_COOKIE = 'pulsed_refresh';

function cookieOpts(maxAgeMs) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: maxAgeMs,
    path: '/',
  };
}

function publicUser(u) {
  if (!u) return null;
  const o = u.toObject ? u.toObject() : { ...u };
  delete o.passwordHash;
  delete o.refreshTokens;
  delete o.emailVerificationToken;
  delete o.passwordResetToken;
  return o;
}

router.post(
  '/signup',
  validateBody(signupSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password, inviteToken } = req.body;
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) throw new AppError('Email already registered', 400);

    let role = 'client';
    let consumedInvite = null;
    if (inviteToken) {
      const inv = await TrainerInvite.findOne({
        token: inviteToken,
        expiresAt: { $gt: new Date() },
        consumedAt: null,
      });
      if (!inv) throw new AppError('Invalid or expired invite', 400);
      role = 'trainer';
      consumedInvite = inv;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verifyToken = randomToken(24);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      emailVerified: false,
      emailVerificationToken: hashToken(verifyToken),
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      inviteToken: inviteToken || '',
    });

    if (consumedInvite) {
      consumedInvite.consumedAt = new Date();
      consumedInvite.consumedBy = user._id;
      await consumedInvite.save();
    }

    const apiBase = process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 3001}`;
    const link = `${apiBase}/api/auth/verify-email/${verifyToken}`;
    await sendEmail(user.email, 'emailVerification', { name: user.name, link }).catch(() => {});

    const accessToken = signAccessToken(user);
    const { raw, maxAgeMs } = await issueRefreshToken(user._id, false);
    res.cookie(REFRESH_COOKIE, raw, cookieOpts(maxAgeMs));

    return sendSuccess(res, { user: publicUser(user), accessToken, emailVerificationSent: true }, 201);
  })
);

router.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password, remember } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) throw new AppError('Invalid email or password', 401);
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new AppError('Invalid email or password', 401);

    const accessToken = signAccessToken(user);
    const { raw, maxAgeMs } = await issueRefreshToken(user._id, !!remember);
    res.cookie(REFRESH_COOKIE, raw, cookieOpts(maxAgeMs));

    return sendSuccess(res, { user: publicUser(user), accessToken });
  })
);

router.post(
  '/logout',
  requireAuth,
  asyncHandler(async (req, res) => {
    const raw = req.cookies?.[REFRESH_COOKIE];
    await revokeRefreshToken(req.user.id, raw);
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
    return sendSuccess(res, { ok: true });
  })
);

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const raw = req.cookies?.[REFRESH_COOKIE];
    if (!raw) return sendError(res, 'No refresh token', 401);
    const h = hashToken(raw);
    const user = await User.findOne({ refreshTokens: h });
    if (!user) {
      res.clearCookie(REFRESH_COOKIE, { path: '/' });
      return sendError(res, 'Invalid refresh token', 401);
    }
    const { raw: newRaw, maxAgeMs } = await rotateRefreshToken(user._id, raw, false);
    res.cookie(REFRESH_COOKIE, newRaw, cookieOpts(maxAgeMs));
    const accessToken = signAccessToken(user);
    return sendSuccess(res, { accessToken, user: publicUser(user) });
  })
);

router.get(
  '/verify-email/:token',
  asyncHandler(async (req, res) => {
    const token = req.params.token;
    const h = hashToken(token);
    const user = await User.findOne({
      emailVerificationToken: h,
      emailVerificationExpires: { $gt: new Date() },
    });
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    if (!user) {
      return res.redirect(`${clientUrl}/login?verified=0`);
    }
    user.emailVerified = true;
    user.emailVerificationToken = '';
    user.emailVerificationExpires = undefined;
    await user.save();
    return res.redirect(`${clientUrl}/login?verified=1`);
  })
);

router.post(
  '/forgot-password',
  validateBody(forgotPasswordSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email.toLowerCase() });
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    if (user) {
      const raw = randomToken(24);
      user.passwordResetToken = hashToken(raw);
      user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();
      const link = `${clientUrl}/login?reset=${raw}`;
      await sendEmail(user.email, 'passwordReset', { name: user.name, link }).catch(() => {});
    }
    return sendSuccess(res, { ok: true });
  })
);

router.post(
  '/reset-password/:token',
  validateBody(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    const h = hashToken(req.params.token);
    const user = await User.findOne({
      passwordResetToken: h,
      passwordResetExpires: { $gt: new Date() },
    });
    if (!user) throw new AppError('Invalid or expired reset link', 400);
    user.passwordHash = await bcrypt.hash(req.body.password, 10);
    user.passwordResetToken = '';
    user.passwordResetExpires = undefined;
    user.refreshTokens = [];
    await user.save();
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
    return sendSuccess(res, { ok: true });
  })
);

router.post(
  '/trainer-invite',
  requireAuth,
  requireRole('admin'),
  validateBody(trainerInviteSchema),
  asyncHandler(async (req, res) => {
    const days = req.body.expiresInDays || 7;
    const token = randomToken(32);
    const inv = await TrainerInvite.create({
      token,
      createdBy: req.user.id,
      expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
    });
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    return sendSuccess(res, {
      token: inv.token,
      expiresAt: inv.expiresAt,
      signupUrl: `${clientUrl}/login?tab=signup&invite=${inv.token}`,
    });
  })
);

router.get(
  '/trainers',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const trainers = await User.find({ role: 'trainer' }).select('name email _id').lean();
    return sendSuccess(res, trainers);
  })
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) return sendError(res, 'User not found', 404);
    return sendSuccess(res, publicUser(user));
  })
);

router.put(
  '/profile',
  requireAuth,
  validateBody(profileUpdateSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) return sendError(res, 'User not found', 404);
    if (req.body.name !== undefined) user.name = req.body.name.trim();
    if (req.body.phone !== undefined) user.phone = req.body.phone.trim();
    await user.save();
    return sendSuccess(res, publicUser(user));
  })
);

router.get('/google', (req, res) => {
  return sendSuccess(res, {
    scaffold: true,
    message: 'Google OAuth not configured. Add GOOGLE_CLIENT_ID and callback URL to enable.',
  });
});

router.get('/google/callback', (req, res) => {
  return sendError(res, 'Google OAuth not configured', 501);
});

router.put(
  '/waiver',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { signature, emergencyContactName, emergencyContactEmailorPhone, physicalLimits } = req.body;
    if (!signature) throw new AppError('Signature required', 400);
    const user = await User.findById(req.user.id);
    if (!user) throw new AppError('User not found', 404);
    if (user.hasSignedWaiver?.signedwaiver) throw new AppError('Waiver already signed', 400);
    user.hasSignedWaiver = user.hasSignedWaiver || {};
    user.hasSignedWaiver.signedwaiver = true;
    user.hasSignedWaiver.signature = signature;
    user.hasSignedWaiver.emergencyContactInfo = {
      emergencyContactName: emergencyContactName || '',
      emergencyContactEmailorPhone: emergencyContactEmailorPhone || '',
    };
    user.hasSignedWaiver.physicalLimits = physicalLimits || 'none';
    await user.save();
    return sendSuccess(res, publicUser(user));
  })
);

module.exports = router;
