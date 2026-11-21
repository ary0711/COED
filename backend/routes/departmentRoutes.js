const express = require('express');
const supabase = require('../supabaseClient');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

/* =========================================
   VERIFY DEPARTMENT PAGE EDITOR
========================================= */

async function requireDepartmentEditor(req, res, next) {
  try {
    const userIds = [
      req.user?.profileId,
      req.user?.userId
    ].filter(Boolean);

    if (!userIds.length) {
      return res.status(401).json({
        error: 'Authenticated user profile is missing.'
      });
    }

    let profile = null;

    for (const id of [...new Set(userIds)]) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        profile = data;
        break;
      }
    }

    if (!profile) {
      return res.status(403).json({
        error: 'User profile was not found.'
      });
    }

    // Adjust this list if your database uses different role names.
    const allowedRoles = [
      'admin',
      'dean',
      'college_dean',
      'department_chair'
    ];

    if (!allowedRoles.includes(profile.role)) {
      return res.status(403).json({
        error: 'You are not authorized to edit Department Page content.'
      });
    }

    req.departmentEditor = profile;
    next();

  } catch (error) {
    console.error('DEPARTMENT AUTH ERROR:', error);

    return res.status(500).json({
      error: 'Unable to verify Department Page permissions.'
    });
  }
}

router.use(authenticate);
router.use(requireDepartmentEditor);

/* =========================================
   SAVE DEPARTMENT PAGE
========================================= */

router.post('/save', async (req, res) => {
  try {
    const {
      departmentContent,
      colleges
    } = req.body;

    const results = [];

    // Save Department Page content
    if (departmentContent !== undefined) {
      if (
        !departmentContent ||
        typeof departmentContent !== 'object' ||
        Array.isArray(departmentContent)
      ) {
        return res.status(400).json({
          error: 'Invalid departmentContent format.'
        });
      }

      const updates = Object.entries(departmentContent).map(
        ([section_name, values]) => ({
          section_name,
          title: values?.title ?? '',
          description: values?.description ?? '',
          content: values?.content ?? ''
        })
      );

      if (updates.length > 0) {
        const { error } = await supabase
          .from('department_page_content')
          .upsert(updates, {
            onConflict: 'section_name'
          });

        if (error) throw error;

        results.push('Department content saved.');
      }
    }

    // Save college records
    if (colleges !== undefined) {
      if (!Array.isArray(colleges)) {
        return res.status(400).json({
          error: 'Colleges must be an array.'
        });
      }

      if (colleges.length > 0) {
        // Save only the columns belonging to the colleges table.
        // Nested programs and program_faculty are separate tables.
        const collegeRecords = colleges.map((college) => {
          const {
            programs,
            ...collegeFields
          } = college;

          return collegeFields;
        });

        const { error } = await supabase
          .from('colleges')
          .upsert(collegeRecords);

        if (error) throw error;

        results.push('College records saved.');
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Department Page saved successfully.',
      results
    });

  } catch (error) {
    console.error('DEPARTMENT SAVE ERROR:', error);

    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to save Department Page.'
    });
  }
});
/* =========================================
   ADD PROGRAM FACULTY
========================================= */

router.post('/program-faculty', async (req, res) => {
  try {
    const {
      program_id,
      faculty_name,
      position
    } = req.body;

    if (!program_id || !faculty_name?.trim()) {
      return res.status(400).json({
        error: 'Program ID and faculty name are required.'
      });
    }

    // Verify that the program exists.
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('id')
      .eq('id', program_id)
      .maybeSingle();

    if (programError) throw programError;

    if (!program) {
      return res.status(404).json({
        error: 'The selected program was not found.'
      });
    }

    const { data, error } = await supabase
      .from('program_faculty')
      .insert({
        program_id,
        faculty_name: faculty_name.trim(),
        position: (position || '').trim()
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: 'Faculty added successfully.',
      data
    });

  } catch (error) {
    console.error('ADD PROGRAM FACULTY ERROR:', error);

    return res.status(500).json({
      error: error.message || 'Failed to add faculty.'
    });
  }
});


/* =========================================
   UPDATE PROGRAM FACULTY
========================================= */

router.patch('/program-faculty/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { faculty_name, position } = req.body;

    const updates = {};

    if (typeof faculty_name === 'string') {
      updates.faculty_name = faculty_name.trim();
    }

    if (typeof position === 'string') {
      updates.position = position.trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'No valid faculty fields were provided.'
      });
    }

    const { data, error } = await supabase
      .from('program_faculty')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        error: 'Faculty record was not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Faculty updated successfully.',
      data
    });

  } catch (error) {
    console.error('UPDATE PROGRAM FACULTY ERROR:', error);

    return res.status(500).json({
      error: error.message || 'Failed to update faculty.'
    });
  }
});


/* =========================================
   DELETE PROGRAM FACULTY
========================================= */

router.delete('/program-faculty/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('program_faculty')
      .delete()
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        error: 'Faculty record was not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Faculty deleted successfully.'
    });

  } catch (error) {
    console.error('DELETE PROGRAM FACULTY ERROR:', error);

    return res.status(500).json({
      error: error.message || 'Failed to delete faculty.'
    });
  }
});
module.exports = router;