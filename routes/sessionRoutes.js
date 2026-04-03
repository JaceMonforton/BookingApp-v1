const express = require('express');
const Session = require('../models/sessionModel');
const User = require('../models/userModel');
const { requireAuth, requireRole } = require('../middleware/requireAuth');
const { validateBody } = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { sessionCreateSchema, sessionUpdateSchema } = require('../validation/schemas');
const { cancelSessionByTrainer } = require('../services/bookingService');

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { type, trainer, from, to } = req.query;
    const q = { status: 'scheduled' };
    if (type) q.type = type;
    if (trainer) q.trainer = trainer;
    if (from || to) {
      q.startTime = {};
      if (from) q.startTime.$gte = new Date(from);
      if (to) q.startTime.$lte = new Date(to);
    }
    const sessions = await Session.find(q).populate('trainer', 'name email phone').sort({ startTime: 1 });
    return sendSuccess(res, sessions);
  })
);

router.post(
  '/',
  requireAuth,
  requireRole('trainer', 'admin'),
  validateBody(sessionCreateSchema),
  asyncHandler(async (req, res) => {
    const body = { ...req.body };
    const trainerUser = await User.findById(body.trainer);
    if (!trainerUser) throw new AppError('Trainer not found', 400);
    if (trainerUser.role !== 'trainer' && trainerUser.role !== 'admin') {
      throw new AppError('Referenced user is not a trainer', 400);
    }
    if (req.user.role === 'trainer' && String(body.trainer) !== req.user.id) {
      throw new AppError('Trainers can only create sessions for themselves', 403);
    }
    const session = await Session.create(body);
    const populated = await Session.findById(session._id).populate('trainer', 'name email phone');
    return sendSuccess(res, populated, 201);
  })
);

router.put(
  '/:id',
  requireAuth,
  requireRole('trainer', 'admin'),
  validateBody(sessionUpdateSchema),
  asyncHandler(async (req, res) => {
    const session = await Session.findById(req.params.id);
    if (!session) throw new AppError('Session not found', 404);
    if (req.user.role === 'trainer' && String(session.trainer) !== req.user.id) {
      throw new AppError('Forbidden', 403);
    }
    Object.assign(session, req.body);
    await session.save();
    const populated = await Session.findById(session._id).populate('trainer', 'name email phone');
    return sendSuccess(res, populated);
  })
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('trainer', 'admin'),
  asyncHandler(async (req, res) => {
    const session = await Session.findById(req.params.id);
    if (!session) throw new AppError('Session not found', 404);
    if (req.user.role === 'trainer' && String(session.trainer) !== req.user.id) {
      throw new AppError('Forbidden', 403);
    }
    await cancelSessionByTrainer(req.params.id);
    return sendSuccess(res, { cancelled: true });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const session = await Session.findById(req.params.id).populate('trainer', 'name email phone');
    if (!session) return sendError(res, 'Session not found', 404);
    return sendSuccess(res, session);
  })
);

module.exports = router;
