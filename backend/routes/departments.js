const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

router.get('/count', async (req, res) => {
  try {
    console.log('====================================');
    console.log('DEPARTMENT COUNT API CALLED');

    const { count, error } = await supabase
      .from('departments')
      .select('id', {
        count: 'exact',
        head: true,
      });

    console.log('DEPARTMENT COUNT:', count);
    console.log('DEPARTMENT ERROR:', error);
    console.log('====================================');

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      count: count ?? 0,
    });

  } catch (error) {
    console.error('Unexpected department count error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to load department count',
    });
  }
});

module.exports = router;