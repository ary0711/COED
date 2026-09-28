const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const path = require('path');

dotenv.config();

const app = express();

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(helmet());

app.use('/generated', express.static(path.join(__dirname, 'generated')));

// ============================================================
// CRON
// ============================================================

require('./cron');

// ============================================================
// ROUTES
// ============================================================

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
console.log('✅ Auth routes loaded');

app.get('/api/auth/profile-test', (req, res) => {
  console.log('✅ /api/auth/profile-test reached');
  res.json({
    success: true,
    message: 'Auth route is working.'
  });
});
const researchSubmissionsRoutes = require('./routes/researchSubmissions');

app.use(
  '/api/research-submissions',
  researchSubmissionsRoutes
);
app.use('/api/students', require('./routes/student'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/calendar-events', require('./routes/calendarEvents'));
app.use('/api/announcements', require('./routes/announcements'));


app.use('/api/inquiries', require('./routes/inquiries'));
console.log('✅ Inquiry routes loaded');

app.use(
  '/api/accomplishment-reports',
  require('./routes/accomplishmentReports')
);

app.use(
  '/api/extension-reports',
  require('./routes/extensionReports')
);

app.use(
  '/api/research-submissions',
  require('./routes/researchSubmissions')
);

app.use(
  '/api/tracer-survey',
  require('./routes/tracerSurvey')
);

app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/me', require('./routes/me'));
app.use('/api/departments', require('./routes/departments'));

app.use(
  '/api/academic-records/documents',
  require('./routes/academicDocuments')
);

app.use('/api/deans-list', require('./routes/deansList'));
app.use('/api/faculty', require('./routes/facultyDirectory'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/wfh-reports', require('./routes/wfhReports'));

// ============================================================
// CONTACT EMAIL REPLY
// ============================================================

app.use(
  '/api/contact',
  require('./routes/contact')
);

// ============================================================
// PROTECTED ROUTE TEST
// ============================================================

const authenticate = require('./middleware/authenticate');

app.get(
  '/api/profile',
  authenticate,
  (req, res) => {
    res.json({
      message: 'You are logged in!',
      user: req.user,
    });
  }
);

// ============================================================
// HEALTH CHECK
// ============================================================

app.get(
  '/',
  (req, res) => {
    res.json({
      success: true,
      message: 'COED Backend API is running.',
    });
  }
);

// ============================================================
// 404 HANDLER
// ============================================================

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
  }
);

// ============================================================
// ERROR HANDLER
// ============================================================

app.use(
  (err, req, res, next) => {
    console.error('SERVER ERROR:', err);

    res.status(500).json({
      success: false,
      message:
        err.message ||
        'Internal server error',
    });
  }
);

// ============================================================
// SERVER
// ============================================================

const PORT = process.env.PORT || 5000;

app.listen(
  PORT,
  () => {
    console.log('====================================');
    console.log(`COED Backend running on port ${PORT}`);
    console.log(`http://localhost:${PORT}`);
    console.log('');
    console.log('Contact Reply API:');
    console.log(
      `POST http://localhost:${PORT}/api/contact/reply`
    );
    console.log('====================================');
  }
);