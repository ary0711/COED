const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
dotenv.config();

require('./cron');

const app = express();
app.use(cors());
app.use(express.json());
app.use(helmet());

// ── Routes ──
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/calendar-events', require('./routes/calendarEvents'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/students', require('./routes/student')); // matches your existing file: routes/student.js
app.use('/api/accomplishment-reports', require('./routes/accomplishmentReports'));
app.use('/api/extension-reports', require('./routes/extensionReports'));
app.use('/api/research-submissions', require('./routes/researchSubmissions'));
app.use('/api/tracer-survey', require('./routes/tracerSurvey'));
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/me', require('./routes/me'));
app.use('/api/academic-records/documents', require('./routes/academicDocuments'));

// Protected route test
const authenticate = require('./middleware/authenticate');
app.get('/api/profile', authenticate, (req, res) => {
  res.json({ message: 'You are logged in!', user: req.user });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

