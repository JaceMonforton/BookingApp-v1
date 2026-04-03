const mongoose = require('mongoose');
const Booking = require('../models/bookingModel');
const Session = require('../models/sessionModel');
const ClientPackage = require('../models/clientPackageModel');
const User = require('../models/userModel');
const Package = require('../models/packageModel');
const { AppError } = require('../utils/errors');
const { getISOWeekRangeUTC } = require('../utils/isoWeek');
const { canConfirmClientOnZoom } = require('./zoomCapacityService');
const { sendEmail, sendSMS } = require('./notificationService');
const { CANCELLATION_WINDOW_HOURS } = require('../config/constants');

function sessionsOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

function packageTypeMatches(packageDoc, sessionDoc) {
  if (!packageDoc) return false;
  if (packageDoc.classType === 'all') return true;
  if (packageDoc.classType === 'zoom' && sessionDoc.isZoom) return true;
  return packageDoc.classType === sessionDoc.type;
}

async function countWeeklyConfirmedBookings(clientId, sessionStart) {
  const { start, endExclusive } = getISOWeekRangeUTC(sessionStart);
  const result = await Booking.aggregate([
    { $match: { client: new mongoose.Types.ObjectId(clientId), status: 'confirmed' } },
    {
      $lookup: {
        from: 'sessions',
        localField: 'session',
        foreignField: '_id',
        as: 'sess',
      },
    },
    { $unwind: '$sess' },
    {
      $match: {
        'sess.startTime': { $gte: start, $lt: endExclusive },
      },
    },
    { $count: 'n' },
  ]);
  return result[0]?.n || 0;
}

async function hasOverlappingConfirmedBooking(clientId, startTime, endTime) {
  const bookings = await Booking.find({
    client: clientId,
    status: 'confirmed',
  }).populate('session');
  for (const b of bookings) {
    const s = b.session;
    if (!s || s.status !== 'scheduled') continue;
    if (sessionsOverlap(startTime, endTime, s.startTime, s.endTime)) return true;
  }
  return false;
}

async function resolveClientPackage(clientId, session) {
  const cps = await ClientPackage.find({
    client: clientId,
    status: 'active',
    endDate: { $gte: session.startTime },
  }).populate('package');

  return cps.find(
    (cp) =>
      cp.classesBooked < cp.totalClasses &&
      packageTypeMatches(cp.package, session)
  );
}

function formatSessionTime(s) {
  return new Date(s.startTime).toISOString();
}

async function notifyBookingConfirmed(user, sessionDoc) {
  const startTime = formatSessionTime(sessionDoc);
  const type = sessionDoc.type.replace(/_/g, ' ');
  await sendEmail(user.email, 'bookingConfirmed', {
    name: user.name,
    type,
    startTime,
    zoomLink: sessionDoc.isZoom ? sessionDoc.zoomLink : '',
  });
  await sendSMS(user.phone, 'bookingConfirmed', { type, startTime });
}

async function notifyTrainerBooking(trainer, client, sessionDoc) {
  if (!trainer?.email) return;
  await sendEmail(trainer.email, 'trainerNewBooking', {
    trainerName: trainer.name,
    clientName: client.name,
    type: sessionDoc.type.replace(/_/g, ' '),
    startTime: formatSessionTime(sessionDoc),
  });
}

async function bookSession(clientId, sessionId) {
  const user = await User.findById(clientId);
  if (!user) throw new AppError('User not found', 404);
  if (user.role !== 'client') throw new AppError('Only clients can book classes', 403);
  if (!user.emailVerified) throw new AppError('Verify your email before booking', 403);
  if (!user.hasSignedWaiver?.signedwaiver) throw new AppError('Please sign the waiver first', 403);

  const session = await Session.findById(sessionId).populate('trainer');
  if (!session || session.status !== 'scheduled') throw new AppError('Session not found', 404);

  const cp = await resolveClientPackage(clientId, session);
  if (!cp) throw new AppError('No active package covers this class type', 400);

  const weekCount = await countWeeklyConfirmedBookings(clientId, session.startTime);
  if (weekCount >= cp.classesPerWeek) {
    throw new AppError('Weekly class limit reached for this package', 400);
  }

  const dup = await Booking.findOne({
    client: clientId,
    session: sessionId,
    status: { $in: ['confirmed', 'waitlisted'] },
  });
  if (dup) throw new AppError('Already booked or on the waitlist for this session', 400);

  if (await hasOverlappingConfirmedBooking(clientId, session.startTime, session.endTime)) {
    throw new AppError('You already have a class that overlaps this time', 400);
  }

  const zoomOk = (await canConfirmClientOnZoom(session)).ok;
  const roomInClass = session.enrolledClients.length < session.maxCapacity;
  const useWaitlist = !roomInClass || (session.isZoom && !zoomOk);

  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();
  let booking;
  try {
    if (useWaitlist) {
      [booking] = await Booking.create(
        [
          {
            client: clientId,
            session: sessionId,
            clientPackage: cp._id,
            status: 'waitlisted',
          },
        ],
        { session: mongoSession }
      );
      await Session.updateOne(
        { _id: sessionId },
        { $addToSet: { waitlist: clientId } },
        { session: mongoSession }
      );
    } else {
      [booking] = await Booking.create(
        [
          {
            client: clientId,
            session: sessionId,
            clientPackage: cp._id,
            status: 'confirmed',
          },
        ],
        { session: mongoSession }
      );
      await Session.updateOne(
        { _id: sessionId },
        { $push: { enrolledClients: clientId } },
        { session: mongoSession }
      );
      await ClientPackage.updateOne(
        { _id: cp._id },
        { $inc: { classesBooked: 1 } },
        { session: mongoSession }
      );
    }
    await mongoSession.commitTransaction();
  } catch (e) {
    await mongoSession.abortTransaction();
    throw e;
  } finally {
    mongoSession.endSession();
  }

  const freshSession = await Session.findById(sessionId).populate('trainer');
  if (!useWaitlist) {
    await notifyBookingConfirmed(user, freshSession);
    if (freshSession.trainer) {
      await notifyTrainerBooking(freshSession.trainer, user, freshSession);
    }
  }

  return { booking, waitlisted: useWaitlist };
}

async function tryPromoteWaitlist(sessionId) {
  const session = await Session.findById(sessionId);
  if (!session || session.status !== 'scheduled') return;

  let promoted = false;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const next = await Booking.findOne({
      session: sessionId,
      status: 'waitlisted',
    }).sort({ createdAt: 1 });

    if (!next) break;

    const clientId = next.client;
    const user = await User.findById(clientId);
    const cp = await ClientPackage.findById(next.clientPackage).populate('package');
    if (!user || !cp || cp.status !== 'active') {
      await Booking.updateOne({ _id: next._id }, { status: 'cancelled', cancelledAt: new Date() });
      await Session.updateOne({ _id: sessionId }, { $pull: { waitlist: clientId } });
      continue;
    }

    const s = await Session.findById(sessionId);
    const weekCount = await countWeeklyConfirmedBookings(clientId, s.startTime);
    if (weekCount >= cp.classesPerWeek) break;

    if (await hasOverlappingConfirmedBooking(clientId, s.startTime, s.endTime)) break;

    const zoomOk = (await canConfirmClientOnZoom(s)).ok;
    const room = s.enrolledClients.length < s.maxCapacity;
    if (!room || (s.isZoom && !zoomOk)) break;

    const mongoSession = await mongoose.startSession();
    mongoSession.startTransaction();
    try {
      await Booking.updateOne(
        { _id: next._id },
        { $set: { status: 'confirmed' } },
        { session: mongoSession }
      );
      await Session.updateOne(
        { _id: sessionId },
        {
          $pull: { waitlist: clientId },
          $push: { enrolledClients: clientId },
        },
        { session: mongoSession }
      );
      await ClientPackage.updateOne(
        { _id: cp._id },
        { $inc: { classesBooked: 1 } },
        { session: mongoSession }
      );
      await mongoSession.commitTransaction();
      promoted = true;
    } catch (e) {
      await mongoSession.abortTransaction();
      break;
    } finally {
      mongoSession.endSession();
    }

    const fs = await Session.findById(sessionId);
    await sendEmail(user.email, 'waitlistPromoted', {
      name: user.name,
      type: fs.type.replace(/_/g, ' '),
      startTime: formatSessionTime(fs),
      zoomLink: fs.isZoom ? fs.zoomLink : '',
    });
    await sendSMS(user.phone, 'waitlistPromoted', {
      type: fs.type.replace(/_/g, ' '),
      startTime: formatSessionTime(fs),
    });
    const tr = await User.findById(fs.trainer);
    if (tr) await notifyTrainerBooking(tr, user, fs);
    break;
  }
  return promoted;
}

async function cancelBookingByClient(bookingId, clientId) {
  const booking = await Booking.findById(bookingId).populate('session');
  if (!booking) throw new AppError('Booking not found', 404);
  if (String(booking.client) !== String(clientId)) throw new AppError('Forbidden', 403);
  if (booking.status === 'cancelled') throw new AppError('Already cancelled', 400);

  const session = booking.session;
  if (!session) throw new AppError('Session not found', 404);

  if (booking.status === 'waitlisted') {
    const mongoSession = await mongoose.startSession();
    mongoSession.startTransaction();
    try {
      await Booking.updateOne(
        { _id: bookingId },
        { $set: { status: 'cancelled', cancelledAt: new Date() } },
        { session: mongoSession }
      );
      await Session.updateOne(
        { _id: session._id },
        { $pull: { waitlist: clientId } },
        { session: mongoSession }
      );
      await mongoSession.commitTransaction();
    } catch (e) {
      await mongoSession.abortTransaction();
      throw e;
    } finally {
      mongoSession.endSession();
    }
    await tryPromoteWaitlist(session._id);
    return { lateCancellation: false };
  }

  const now = new Date();
  const hoursUntil = (session.startTime - now) / (1000 * 60 * 60);
  const late = hoursUntil < CANCELLATION_WINDOW_HOURS;

  const user = await User.findById(clientId);

  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();
  try {
    await Booking.updateOne(
      { _id: bookingId },
      {
        $set: {
          status: 'cancelled',
          cancelledAt: now,
          lateCancellation: late,
        },
      },
      { session: mongoSession }
    );
    await Session.updateOne(
      { _id: session._id },
      { $pull: { enrolledClients: clientId } },
      { session: mongoSession }
    );
    if (!late && booking.clientPackage) {
      await ClientPackage.updateOne(
        { _id: booking.clientPackage },
        { $inc: { classesBooked: -1 } },
        { session: mongoSession }
      );
    }
    await mongoSession.commitTransaction();
  } catch (e) {
    await mongoSession.abortTransaction();
    throw e;
  } finally {
    mongoSession.endSession();
  }

  if (user) {
    await sendEmail(user.email, 'bookingCancelled', {
      name: user.name,
      type: session.type.replace(/_/g, ' '),
      startTime: formatSessionTime(session),
      late,
    });
  }

  const trainer = await User.findById(session.trainer);
  if (trainer) {
    await sendEmail(trainer.email, 'trainerClientCancelled', {
      trainerName: trainer.name,
      clientName: user?.name || 'Client',
      type: session.type.replace(/_/g, ' '),
      startTime: formatSessionTime(session),
    });
  }

  await tryPromoteWaitlist(session._id);
  return { lateCancellation: late };
}

async function cancelSessionByTrainer(sessionId) {
  const session = await Session.findById(sessionId);
  if (!session) throw new AppError('Session not found', 404);

  const bookings = await Booking.find({
    session: sessionId,
    status: { $in: ['confirmed', 'waitlisted'] },
  }).populate('client');

  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();
  try {
    await Session.updateOne(
      { _id: sessionId },
      {
        $set: {
          status: 'cancelled',
          enrolledClients: [],
          waitlist: [],
        },
      },
      { session: mongoSession }
    );

    for (const b of bookings) {
      if (b.status === 'confirmed' && b.clientPackage) {
        await ClientPackage.updateOne(
          { _id: b.clientPackage },
          { $inc: { classesBooked: -1 } },
          { session: mongoSession }
        );
      }
      await Booking.updateOne(
        { _id: b._id },
        { $set: { status: 'cancelled', cancelledAt: new Date() } },
        { session: mongoSession }
      );
    }
    await mongoSession.commitTransaction();
  } catch (e) {
    await mongoSession.abortTransaction();
    throw e;
  } finally {
    mongoSession.endSession();
  }

  const type = session.type.replace(/_/g, ' ');
  const startTime = formatSessionTime(session);
  for (const b of bookings) {
    const c = b.client;
    if (!c?.email) continue;
    await sendEmail(c.email, 'sessionCancelledByTrainer', {
      name: c.name,
      type,
      startTime,
    });
    await sendSMS(c.phone, 'sessionCancelledByTrainer', { type, startTime });
  }
}

async function classesRemainingThisWeek(clientId, cpDoc, sessionStartForWeek) {
  const used = await countWeeklyConfirmedBookings(clientId, sessionStartForWeek || new Date());
  return Math.max(0, cpDoc.classesPerWeek - used);
}

module.exports = {
  bookSession,
  cancelBookingByClient,
  cancelSessionByTrainer,
  tryPromoteWaitlist,
  countWeeklyConfirmedBookings,
  classesRemainingThisWeek,
  packageTypeMatches,
};
