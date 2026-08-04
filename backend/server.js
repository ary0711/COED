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

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

//Reports
const reportsRoutes = require('./routes/reports');
app.use('/api/reports', reportsRoutes);

// Protected route test
const authenticate = require('./middleware/authenticate');
app.get('/api/profile', authenticate, (req, res) => {
  res.json({ message: 'You are logged in!', user: req.user });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Calendar events
const calendarEventsRoutes = require('./routes/calendarEvents');
app.use('/api/calendar-events', calendarEventsRoutes); 

const announcementsRoutes = require('./routes/announcements');
   app.use('/api/announcements', announcementsRoutes);

const studentsRoutes = require('./routes/students');
app.use('/api/students', studentsRoutes);

const accomplishmentReportsRoutes = require('./routes/accomplishmentReports');
app.use('/api/accomplishment-reports', accomplishmentReportsRoutes);

const extensionReportsRoutes = require('./routes/extensionReports');
app.use('/api/extension-reports', extensionReportsRoutes);