/**
 * npm run seed — admin, 2 trainers, 5 clients, 3 packages, sessions, 2 bookings/client.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const User = require('../models/userModel');
const Package = require('../models/packageModel');
const ClientPackage = require('../models/clientPackageModel');
const Session = require('../models/sessionModel');
const Booking = require('../models/bookingModel');
const Purchase = require('../models/purchaseModel');
const TrainerInvite = require('../models/trainerInviteModel');

const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL;
if (!mongoUri) {
  console.error('Set MONGO_URI or MONGO_URL');
  process.exit(1);
}

const PASS = 'Test1234!';

async function clear() {
  await Promise.all([
    User.deleteMany({}),
    Package.deleteMany({}),
    ClientPackage.deleteMany({}),
    Session.deleteMany({}),
    Booking.deleteMany({}),
    Purchase.deleteMany({}),
    TrainerInvite.deleteMany({}),
  ]);
}

async function run() {
  await mongoose.connect(mongoUri);
  await clear();

  const hash = await bcrypt.hash(PASS, 10);

  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@pulsed.test',
    passwordHash: hash,
    role: 'admin',
    emailVerified: true,
    phone: '+15550000001',
  });

  const trainer1 = await User.create({
    name: 'Trainer One',
    email: 'trainer1@pulsed.test',
    passwordHash: hash,
    role: 'trainer',
    emailVerified: true,
    phone: '+15550000002',
  });

  const trainer2 = await User.create({
    name: 'Trainer Two',
    email: 'trainer2@pulsed.test',
    passwordHash: hash,
    role: 'trainer',
    emailVerified: true,
    phone: '+15550000003',
  });

  const clients = [];
  for (let i = 1; i <= 5; i += 1) {
    clients.push(
      await User.create({
        name: `Client ${i}`,
        email: `client${i}@pulsed.test`,
        passwordHash: hash,
        role: 'client',
        emailVerified: true,
        phone: `+155500000${i + 3}`,
        hasSignedWaiver: {
          signedwaiver: true,
          signature: 'seed-signature',
          physicalLimits: 'none',
        },
      })
    );
  }

  const pkgMat = await Package.create({
    name: '4-Week Mat Pilates',
    description: 'Mat classes — up to 2 per week.',
    classType: 'mat_pilates',
    durationWeeks: 4,
    classesPerWeek: 2,
    totalClasses: 8,
    price: 19900,
    isActive: true,
  });

  const pkgReformer = await Package.create({
    name: '8-Week Reformer',
    description: 'One-on-one reformer sessions.',
    classType: 'reformer',
    durationWeeks: 8,
    classesPerWeek: 1,
    totalClasses: 8,
    price: 59900,
    isActive: true,
  });

  const pkgPt = await Package.create({
    name: '8-Week Personal Training',
    description: 'PT sessions — up to 2 per week.',
    classType: 'personal_training',
    durationWeeks: 8,
    classesPerWeek: 2,
    totalClasses: 16,
    price: 79900,
    isActive: true,
  });

  const now = new Date();

  function slot(dayOffset, hour, durMin) {
    const start = new Date(now);
    start.setUTCDate(start.getUTCDate() + dayOffset);
    start.setUTCHours(hour, 0, 0, 0);
    const end = new Date(start.getTime() + durMin * 60 * 1000);
    return { start, end };
  }

  const a = slot(3, 18, 60);
  const b = slot(5, 10, 60);
  const c = slot(4, 14, 60);
  const d = slot(6, 9, 90);
  const e = slot(7, 11, 90);
  const f = slot(8, 15, 60);

  const sessionMat = await Session.create({
    type: 'mat_pilates',
    isZoom: true,
    zoomLink: 'https://zoom.us/j/seed-mat',
    trainer: trainer1._id,
    startTime: a.start,
    endTime: a.end,
    maxCapacity: 4,
    status: 'scheduled',
  });

  const sessionMat2 = await Session.create({
    type: 'mat_pilates',
    isZoom: false,
    trainer: trainer1._id,
    startTime: b.start,
    endTime: b.end,
    maxCapacity: 4,
    status: 'scheduled',
  });

  const sessionReformer = await Session.create({
    type: 'reformer',
    isZoom: true,
    zoomLink: 'https://zoom.us/j/seed-ref',
    trainer: trainer2._id,
    startTime: c.start,
    endTime: c.end,
    maxCapacity: 1,
    status: 'scheduled',
  });

  const sessionReformer2 = await Session.create({
    type: 'reformer',
    isZoom: false,
    trainer: trainer2._id,
    startTime: f.start,
    endTime: f.end,
    maxCapacity: 1,
    status: 'scheduled',
  });

  const sessionPt = await Session.create({
    type: 'personal_training',
    isZoom: false,
    trainer: trainer2._id,
    startTime: d.start,
    endTime: d.end,
    maxCapacity: 10,
    status: 'scheduled',
  });

  const sessionPt2 = await Session.create({
    type: 'personal_training',
    isZoom: false,
    trainer: trainer2._id,
    startTime: e.start,
    endTime: e.end,
    maxCapacity: 10,
    status: 'scheduled',
  });

  const cpEnd = new Date(now);
  cpEnd.setUTCDate(cpEnd.getUTCDate() + 56);

  const packagesForClients = [pkgMat, pkgMat, pkgMat, pkgPt, pkgReformer];
  for (let i = 0; i < 5; i += 1) {
    const pkg = packagesForClients[i];
    const purchase = await Purchase.create({
      client: clients[i]._id,
      package: pkg._id,
      status: 'completed',
      amountPaid: pkg.price,
    });
    await ClientPackage.create({
      client: clients[i]._id,
      package: pkg._id,
      purchase: purchase._id,
      startDate: now,
      endDate: cpEnd,
      classesPerWeek: pkg.classesPerWeek,
      totalClasses: pkg.totalClasses,
      classesBooked: 0,
      status: 'active',
    });
  }

  async function confirm(clientIndex, sess) {
    const client = clients[clientIndex];
    const pkg = packagesForClients[clientIndex];
    const cp = await ClientPackage.findOne({ client: client._id, package: pkg._id });
    await Booking.create({
      client: client._id,
      session: sess._id,
      clientPackage: cp._id,
      status: 'confirmed',
    });
    await Session.updateOne({ _id: sess._id }, { $push: { enrolledClients: client._id } });
    await ClientPackage.updateOne({ _id: cp._id }, { $inc: { classesBooked: 1 } });
  }

  await confirm(0, sessionMat);
  await confirm(0, sessionMat2);
  await confirm(1, sessionMat);
  await confirm(1, sessionMat2);
  await confirm(2, sessionMat);
  await confirm(2, sessionMat2);
  await confirm(3, sessionPt);
  await confirm(3, sessionPt2);
  await confirm(4, sessionReformer);
  await confirm(4, sessionReformer2);

  console.log('Seed complete.');
  console.log('Password for all seeded users:', PASS);
  console.log('Admin:', admin.email);
  console.log('Trainers:', trainer1.email, trainer2.email);
  console.log('Clients:', clients.map((c) => c.email).join(', '));
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
