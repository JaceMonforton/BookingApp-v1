const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || '');
const Purchase = require('../models/purchaseModel');
const Package = require('../models/packageModel');
const User = require('../models/userModel');
const ClientPackage = require('../models/clientPackageModel');
const { sendEmail, sendSMS } = require('../services/notificationService');

async function handleCheckoutCompleted(session) {
  const purchaseId = session.metadata?.purchaseId;
  if (!purchaseId) return;

  const purchase = await Purchase.findById(purchaseId);
  if (!purchase || purchase.status === 'completed') return;

  purchase.status = 'completed';
  purchase.amountPaid = session.amount_total || purchase.amountPaid;
  if (session.payment_intent) {
    purchase.stripePaymentIntentId =
      typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent.id;
  }
  await purchase.save();

  const user = await User.findById(purchase.client);
  const pkg = await Package.findById(purchase.package);
  if (!user || !pkg) return;

  if (session.customer) {
    user.stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer.id;
    await user.save();
  }

  const start = new Date();
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + pkg.durationWeeks * 7);

  const cp = await ClientPackage.create({
    client: purchase.client,
    package: pkg._id,
    purchase: purchase._id,
    startDate: start,
    endDate: end,
    classesPerWeek: pkg.classesPerWeek,
    totalClasses: pkg.totalClasses,
    classesBooked: 0,
    status: 'active',
  });

  await sendEmail(user.email, 'packagePurchased', {
    name: user.name,
    packageName: pkg.name,
    startDate: cp.startDate.toISOString(),
    endDate: cp.endDate.toISOString(),
    totalClasses: cp.totalClasses,
  });
  await sendSMS(user.phone, 'bookingConfirmed', {
    type: 'Package',
    startTime: pkg.name,
  });
}

async function handlePaymentFailed(paymentIntent) {
  const customerId = paymentIntent.customer;
  if (!customerId) return;
  const user = await User.findOne({ stripeCustomerId: customerId });
  if (!user) return;
  await sendEmail(user.email, 'paymentFailed', { name: user.name });
  await sendSMS(user.phone, 'paymentFailed', { name: user.name });
}

function stripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  (async () => {
    try {
      if (event.type === 'checkout.session.completed') {
        await handleCheckoutCompleted(event.data.object);
      } else if (event.type === 'payment_intent.payment_failed') {
        await handlePaymentFailed(event.data.object);
      }
    } catch (e) {
      console.error('Stripe webhook handler error', e);
    }
  })();

  return res.status(200).json({ received: true });
}

module.exports = stripeWebhook;
