
const express = require('express');
const authenticate = require('../middleware/authenticate');
const supabaseAdmin = require('../supabaseAdmin');

const router = express.Router();

const ALLOWED_KEYS = ['academic_year', 'current_semester'];

// GET: Read the current academic year and semester.
router.get('/', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('system_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ALLOWED_KEYS);

    if (error) throw error;

    const settings = Object.fromEntries(
      (data || []).map(({ setting_key, setting_value }) => [
        setting_key,
        setting_value
      ])
    );

    return res.json({
      success: true,
      academicYear: settings.academic_year || '',
      semester: settings.current_semester || ''
    });
  } catch (error) {
    console.error('GET ACADEMIC SETTINGS ERROR:', error);
    return res.status(500).json({
      success: false,
      error: 'Unable to load academic settings.'
    });
  }
});

// PUT: Only the Dean can update the settings.

router.put('/', authenticate, async (req, res) => {
  try {
    const role = String(req.user?.role || '')
      .trim()
      .toLowerCase()
      .replace(/[_-]+/g, ' ');

    if (!['dean', 'college dean'].includes(role)) {
      return res.status(403).json({
        success: false,
        error: 'Only the Dean can update academic settings.',
      });
    }

    const academicYear = String(
      req.body.academicYear || ''
    ).trim();

    const semester = String(
      req.body.semester || ''
    ).trim();

    if (!/^\d{4}-\d{4}$/.test(academicYear)) {
      return res.status(400).json({
        success: false,
        error: 'Academic year must use the format YYYY-YYYY.',
      });
    }

    const [startYear, endYear] = academicYear
      .split('-')
      .map(Number);

    if (endYear !== startYear + 1) {
      return res.status(400).json({
        success: false,
        error: 'The ending year must be one year after the starting year.',
      });
    }

    const allowedSemesters = [
      'First Semester',
      'Second Semester',
      'Summer',
    ];

    if (!allowedSemesters.includes(semester)) {
      return res.status(400).json({
        success: false,
        error: 'Please select a valid semester.',
      });
    }

    const updatedBy =
      req.user?.profileId || req.user?.userId || null;

    const { data, error } = await supabaseAdmin.rpc(
      'update_academic_settings_and_advance_students',
      {
        p_academic_year: academicYear,
        p_semester: semester,
        p_updated_by: updatedBy,
      }
    );

    if (error) {
      console.error('ACADEMIC SETTINGS RPC ERROR:', error);

      return res.status(500).json({
        success: false,
        error: 'Unable to save academic settings and advance students.',
      });
    }

    return res.json({
      ...data,
      message: data.yearChanged
        ? `Academic settings saved. ${data.studentsAdvanced} student record(s) advanced to the next year level.`
        : 'Academic settings saved. No student year-level advancement was needed.',
    });
  } catch (error) {
    console.error('UPDATE ACADEMIC SETTINGS ERROR:', error);

    return res.status(500).json({
      success: false,
      error: 'Unable to save academic settings.',
    });
  }
});

module.exports = router;
