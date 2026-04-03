const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || '');
const Package = require('../models/packageModel');
const Purchase = require('../models/purchaseModel');
const ClientPackage = require('../models/clientPackageModel');
const User = require('../models/userModel');
const { requireAuth, requireRole } = require('../middleware/requireAuth');
const { validateBody } = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { packageCreateSchema, purchaseSchema } = require('../validation/schemas');
const { classesRemainingThisWeek } = require('../services/bookingService');

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const packages = await Package.find({ isActive: true }).sort({ name: 1 });
    return sendSuccess(res, packages);
  })
);

router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  validateBody(packageCreateSchema),
  asyncHandler(async (req, res) => {
    const pkg = await Package.create(req.body);
    return sendSuccess(res, pkg, 201);
  })
);

router.put(
  '/:id',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const pkg = await Package.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!pkg) return sendError(res, 'Package not found', 404);
    return sendSuccess(res, pkg);
  })
);

router.get(
  '/my-packages',
  requireAuth,
  requireRole('client'),
  asyncHandler(async (req, res) => {
    const cps = await ClientPackage.find({ client: req.user.id }).populate('package').sort({ endDate: -1 });
    const now = new Date();
    const data = await Promise.all(
      cps.map(async (cp) => {
        const classesRemainingThisWeekVal = await classesRemainingThisWeek(req.user.id, cp, now);
        return {
          ...cp.toObject(),
          classesRemainingThisWeek: classesRemainingThisWeekVal,
          totalRemainingClasses: Math.max(0, cp.totalClasses - cp.classesBooked),
        };
      })
    );
    return sendSuccess(res, data);
  })
);

router.post(
  '/purchase',
  requireAuth,
  requireRole('client'),
  validateBody(purchaseSchema),
  asyncHandler(async (req, res) => {
    if (!process.env.STRIPE_SECRET_KEY) throw new AppError('Stripe is not configured', 503);
    const pkg = await Package.findById(req.body.packageId);
    if (!pkg || !pkg.isActive) throw new AppError('Package not found', 404);
    if (!pkg.stripePriceId) throw new AppError('Package is not available for online purchase yet', 400);

    const user = await User.findById(req.user.id);
    const purchase = await Purchase.create({
      client: user._id,
      package: pkg._id,
      status: 'pending',
      amountPaid: pkg.price,
    });

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: String(user._id) },
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: customerId,
      line_items: [{ price: pkg.stripePriceId, quantity: 1 }],
      success_url: `${clientUrl}/dashboard?purchase=success`,
      cancel_url: `${clientUrl}/packages?purchase=cancelled`,
      metadata: {
        purchaseId: String(purchase._id),
        userId: String(user._id),
        packageId: String(pkg._id),
      },
    });

    purchase.stripeSessionId = checkoutSession.id;
    await purchase.save();

    return sendSuccess(res, { url: checkoutSession.url, sessionId: checkoutSession.id });
  })
);

module.exports = router;
