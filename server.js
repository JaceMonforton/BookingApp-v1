const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const cron = require('node-cron');

dotenv.config();

const stripeWebhook = require('./routes/stripeWebhook');
const authRoutes = require('./routes/authRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const packageRoutes = require('./routes/packageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const errorHandler = require('./middleware/errorHandler');
const { refreshClientPackageStatuses } = require('./services/clientPackageCron');
const { run24hReminders, run2hReminders, runTrainerDailyDigest } = require('./services/reminderJobs');

const app = express();
const PORT = process.env.PORT || 3001;
const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  })
);

app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhook);

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(errorHandler);

const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL;
if (!mongoUri) {
  console.error('Missing MONGO_URI or MONGO_URL');
  process.exit(1);
}

mongoose
  .connect(mongoUri)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    cron.schedule('5 2 * * *', () => {
      refreshClientPackageStatuses().catch((e) => console.error('clientPackage cron', e));
    });

    cron.schedule('10 * * * *', () => {
      run24hReminders().catch((e) => console.error('24h reminders', e));
    });

    cron.schedule('*/20 * * * *', () => {
      run2hReminders().catch((e) => console.error('2h reminders', e));
    });

    cron.schedule('15 8 * * *', () => {
      runTrainerDailyDigest().catch((e) => console.error('trainer digest', e));
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
