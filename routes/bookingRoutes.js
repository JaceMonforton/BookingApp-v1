const express = require('express');
const Booking = require('../models/bookingModel');
const Session = require('../models/sessionModel');
const User = require('../models/userModel');
const ClientPackage = require('../models/clientPackageModel');
const { requireAuth, requireRole } = require('../middleware/requireAuth');
const { validateBody } = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { bookSchema } = require('../validation/schemas');
const {
  bookSession,
  cancelBookingByClient,
  classesRemainingThisWeek,
  countWeeklyConfirmedBookings,
} = require('../services/bookingService');

const router = express.Router();

router.post(
  '/',
  requireAuth,
  requireRole('client'),
  validateBody(bookSchema),
  asyncHandler(async (req, res) => {
    const result = await bookSession(req.user.id, req.body.sessionId);
    const populated = await Booking.findById(result.booking._id)
      .populate('session')
      .populate('clientPackage');
    return sendSuccess(res, { booking: populated, waitlisted: result.waitlisted }, 201);
  })
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('client'),
  asyncHandler(async (req, res) => {
    const out = await cancelBookingByClient(req.params.id, req.user.id);
    return sendSuccess(res, out);
  })
);

router.get(
  '/me',
  requireAuth,
  requireRole('client'),
  asyncHandler(async (req, res) => {
    const bookings = await Booking.find({
      client: req.user.id,
      status: { $in: ['confirmed', 'waitlisted'] },
    })
      .populate({
        path: 'session',
        populate: { path: 'trainer', select: 'name email phone' },
      })
      .sort({ createdAt: -1 });
    return sendSuccess(res, bookings);
  })
);

router.get(
  '/session/:id',
  requireAuth,
  requireRole('trainer', 'admin'),
  asyncHandler(async (req, res) => {
    const session = await Session.findById(req.params.id);
    if (!session) return sendError(res, 'Session not found', 404);
    if (req.user.role === 'trainer' && String(session.trainer) !== req.user.id) {
      return sendError(res, 'Forbidden', 403);
    }
    const bookings = await Booking.find({
      session: req.params.id,
      status: { $in: ['confirmed', 'waitlisted'] },
    })
      .populate('client', 'name email phone')
      .sort({ status: 1, createdAt: 1 });
    return sendSuccess(res, { session, roster: bookings });
  })
);

module.exports = router;
