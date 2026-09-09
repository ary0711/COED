const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');

dotenv.config();

const router = express.Router();

require('./cron');

const app = express();

app.use(cors());
app.use(express.json());
app.use(helmet());


// ============================================================
// ROUTES
// ============================================================

app.use('/api/auth', require('./routes/auth'));

app.use('/api/reports', require('./routes/reports'));

app.use(
  '/api/calendar-events',
  require('./routes/calendarEvents')
);

app.use(
  '/api/announcements',
  require('./routes/announcements')
);

app.use(
  '/api/students',
  require('./routes/student')
);

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

app.use(
  '/api/accounts',
  require('./routes/accounts')
);

app.use(
  '/api/me',
  require('./routes/me')
);

app.use(
  '/api/departments',
  require('./routes/departments')
);

app.use(
  '/api/academic-records/documents',
  require('./routes/academicDocuments')
);

app.use(
  '/api/deans-list',
  require('./routes/deansList')
);

app.use(
  '/api/faculty',
  require('./routes/facultyDirectory')
);

app.use(
  '/api/notifications',
  require('./routes/notifications')
);


// ============================================================
// CONTACT EMAIL REPLY
// ============================================================
//
// This allows the Dean/Admin dashboard to send a reply
// directly to the email address submitted through the
// public Contact Page.
//
// Frontend:
// POST http://localhost:5000/api/contact/reply
//
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
// STUDENT COUNT
// ============================================================
//
// NOTE:
// This is your existing student-count route.
// It is kept here as requested.
//
// ============================================================

router.get(
  '/student-count',
  async (req, res) => {
    try {
      console.log(
        '===================================='
      );

      console.log(
        'STUDENT COUNT API CALLED'
      );

      const {
        data,
        count,
        error,
      } = await supabase
        .from('profiles')
        .select(
          'id, full_name, role, status',
          {
            count: 'exact',
          }
        )
        .eq(
          'role',
          'student'
        )
        .eq(
          'status',
          'active'
        );

      console.log(
        'STUDENT DATA:',
        data
      );

      console.log(
        'STUDENT COUNT:',
        count
      );

      console.log(
        'STUDENT ERROR:',
        error
      );

      console.log(
        '===================================='
      );

      if (error) {
        return res.status(500).json({
          success: false,
          message: error.message,
        });
      }

      return res.json({
        success: true,
        count:
          count ??
          data?.length ??
          0,
      });

    } catch (error) {

      console.error(
        'Unexpected student count error:',
        error
      );

      return res.status(500).json({
        success: false,
        message:
          'Failed to load student count',
      });
    }
  }
);


// ============================================================
// SERVER
// ============================================================

const PORT =
  process.env.PORT || 5000;

app.listen(
  PORT,
  () => {
    console.log(
      `Server running on port ${PORT}`
    );
  }
);


// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;