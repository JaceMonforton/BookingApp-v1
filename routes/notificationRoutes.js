const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/response');
const { sendEmail, sendSMS } = require('../services/notificationService');

const router = express.Router();

router.post(
  '/test',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
      return sendError(res, 'Not available in production', 403);
    }
    await sendEmail(req.body.email || 'test@example.com', 'emailVerification', {
      name: 'Test',
      link: 'https://example.com',
    });
    await sendSMS(req.body.phone || '+10000000000', 'bookingConfirmed', {
      type: 'Test',
      startTime: new Date().toISOString(),
    });
    return sendSuccess(res, { sent: true });
  })
);

module.exports = router;
