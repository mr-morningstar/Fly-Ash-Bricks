'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');

const { stream } = require('./core/logger/winston.logger');
const { errorHandler } = require('./core/middlewares/errorHandler.middleware');
const { apiLimiter } = require('./core/middlewares/rateLimit.middleware');
const { ApiResponse } = require('./core/responses/ApiResponse');

// Import routes
const authRoutes = require('./routes/auth.routes');
const labourRoutes = require('./routes/labour.routes');
const groupRoutes = require('./routes/group.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const productionRoutes = require('./routes/production.routes');
const billingRoutes = require('./routes/billing.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const publicSiteRoutes = require('./routes/publicSite.routes');
const userRoutes = require('./routes/user.routes');
const settingsRoutes = require('./routes/settings.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const materialInwardRoutes = require('./routes/materialInward.routes');
const tripRoutes = require('./routes/trip.routes');
const driverRoutes = require('./routes/driver.routes');
const reportRoutes = require('./routes/report.routes');
const wagesRoutes = require('./routes/wages.routes');

const app = express();

// Trust Render/Heroku reverse proxy
app.set('trust proxy', 1);

// 1. Security Headers
app.use(helmet());

// 2. CORS configurations - Allow both localhost and 127.0.0.1 on any port
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  // Capacitor Android WebView origins
  'capacitor://localhost',
  'http://localhost',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Allow any local loopback dev origin
      if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  })
);

// 3. Body parsers & Cookie parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// 4. Data Sanitsation (SQL/NoSQL inject + XSS)
app.use(mongoSanitize());
app.use(xss());

// 5. Morgan logging piped to Winston
app.use(morgan('combined', { stream }));

// 6. Serve static uploads (Photos, avatars, invoices)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 7. General API Limiter (applied to routes below)
app.use('/api', apiLimiter);

// 8. Health check
app.get('/api/health', (req, res) => {
  return ApiResponse.Ok(res, { status: 'healthy', date: new Date() }, 'API is fully operational.');
});

// 9. API Routes registration
app.use('/api/auth', authRoutes);
app.use('/api/labours', labourRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/public', publicSiteRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/material-inward', materialInwardRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/wages', wagesRoutes);
app.use('/api/reports', reportRoutes);

// 10. 404 Route not found
app.use('*', (req, res, next) => {
  const { AppError } = require('./utils/appError');
  next(new AppError(`Endpoint '${req.originalUrl}' not found on this server.`, 404));
});

// 11. Global Error handler (must be last)
app.use(errorHandler);

module.exports = app;
