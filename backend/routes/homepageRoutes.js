
const express = require('express');
const supabase = require('../supabaseClient');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// Only authorized administrators and deans can save homepage content.

async function requireHomepageEditor(req, res, next) {
  try {
    const userId = req.user?.userId;
    const profileId = req.user?.profileId;

    // Check both IDs from your existing JWT.
    const candidateIds = [...new Set(
      [profileId, userId].filter(Boolean)
    )];

    if (candidateIds.length === 0) {
      console.error('Homepage authorization: JWT has no user/profile ID.');

      return res.status(401).json({
        error: 'Your login token does not contain a valid user ID.',
      });
    }

    let profile = null;

    // Try each ID separately so a mismatch does not block authorization.
    for (const id of candidateIds) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Profile lookup error:', error);

        return res.status(500).json({
          error: 'Unable to verify your account permissions.',
        });
      }

      if (data) {
        profile = data;
        break;
      }
    }

    console.log('Homepage authorization check:', {
      tokenUserId: userId,
      tokenProfileId: profileId,
      databaseProfileId: profile?.id,
      databaseRole: profile?.role,
    });

    if (!profile) {
      return res.status(403).json({
        error: 'Your account does not have a matching profile.',
      });
    }

    const role = String(profile.role || '')
      .trim()
      .toLowerCase();

    if (!['admin', 'dean'].includes(role)) {
      return res.status(403).json({
        error: `Your current account role (${role || 'unknown'}) cannot edit homepage content.`,
      });
    }

    req.homepageEditor = profile;
    next();

  } catch (error) {
    console.error('Homepage authorization error:', error);

    return res.status(500).json({
      error: 'Homepage authorization failed.',
    });
  }
}


// Convert a Base64 data URL and upload it to Supabase Storage.
async function uploadAnnouncementImage(imageData) {
  const match = imageData.match(
    /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/
  );

  if (!match) {
    throw new Error('Invalid announcement image format.');
  }

  const contentType = match[1];
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, 'base64');

  if (!buffer.length || buffer.length > 5 * 1024 * 1024) {
    throw new Error('Announcement images must be smaller than 5 MB.');
  }

  const extensions = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };

  const extension = extensions[contentType];
  const fileName =
    `announcements/${Date.now()}-${require('crypto').randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from('announcements')
    .upload(fileName, buffer, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Announcement image upload failed: ${uploadError.message}`);
  }

  const { data } = supabase.storage
    .from('announcements')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

// POST /api/homepage/save
router.post('/save', authenticate, requireHomepageEditor, async (req, res) => {
  try {
    const {
      homeContent = {},
      stats = [],
      features = [],
      announcements = [],
    } = req.body || {};

    if (
      !homeContent ||
      typeof homeContent !== 'object' ||
      Array.isArray(homeContent) ||
      !Array.isArray(stats) ||
      !Array.isArray(features) ||
      !Array.isArray(announcements)
    ) {
      return res.status(400).json({
        error: 'Invalid homepage data format.',
      });
    }

    // 1. Save homepage content.
    const contentUpdates = Object.entries(homeContent).map(
      ([section_name, values]) => ({
        section_name,
        ...values,
      })
    );

    if (contentUpdates.length) {
      const { error } = await supabase
        .from('homepage_content')
        .upsert(contentUpdates, {
          onConflict: 'section_name',
        });

      if (error) {
        throw new Error(`Homepage content: ${error.message}`);
      }
    }

    // 2. Save homepage statistics.
    if (stats.length) {
      const { error } = await supabase
        .from('homepage_stats')
        .upsert(stats);

      if (error) {
        throw new Error(`Homepage statistics: ${error.message}`);
      }
    }

    // 3. Update existing homepage features.
    for (const feature of features) {
      if (!feature.id) {
        throw new Error('A homepage feature is missing its ID.');
      }

      const { data, error } = await supabase
        .from('homepage_features')
        .update({
          title: feature.title,
          description: feature.description,
          icon: feature.icon,
        })
        .eq('id', feature.id)
        .select('id');

      if (error) {
        throw new Error(`Homepage feature: ${error.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error(`Homepage feature ${feature.id} was not found.`);
      }
    }

    // 4. Upload new announcement images and prepare records.
    const processedAnnouncements = await Promise.all(
      announcements.map(async (announcement) => {
        let imageUrl = announcement.image_url || null;

        if (
          typeof imageUrl === 'string' &&
          imageUrl.startsWith('data:image/')
        ) {
          imageUrl = await uploadAnnouncementImage(imageUrl);
        }

        return {
          id: announcement.id,
          title: announcement.title,
          description: announcement.description,
          color: announcement.color,
          image_url: imageUrl,
          announcement_date: announcement.announcement_date,
          sort_order: announcement.sort_order,
        };
      })
    );

    // 5. Save announcement records.
    if (processedAnnouncements.length) {
      const { error } = await supabase
        .from('homepage_announcements')
        .upsert(processedAnnouncements);

      if (error) {
        throw new Error(`Homepage announcements: ${error.message}`);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Homepage and announcements saved successfully.',
    });
  } catch (error) {
    console.error('Homepage save failed:', error);

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to save homepage.',
    });
  }
});
// POST /api/homepage/upload-hero-image
router.post(
  '/upload-hero-image',
  authenticate,
  requireHomepageEditor,
  async (req, res) => {
    try {
      const { image } = req.body || {};

      if (typeof image !== 'string') {
        return res.status(400).json({
          error: 'No image was provided.',
        });
      }

      const match = image.match(
        /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/
      );

      if (!match) {
        return res.status(400).json({
          error: 'Only JPG, PNG, and WEBP images are supported.',
        });
      }

      const contentType = match[1];
      const buffer = Buffer.from(match[2], 'base64');

      if (!buffer.length || buffer.length > 5 * 1024 * 1024) {
        return res.status(400).json({
          error: 'The image must be smaller than 5 MB.',
        });
      }

      const extensions = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
      };

      const fileName =
        `hero/hero-${Date.now()}-${require('crypto').randomUUID()}.${extensions[contentType]}`;

      const { error: uploadError } = await supabase.storage
        .from('landing-page-images')
        .upload(fileName, buffer, {
          contentType,
          upsert: false,
        });

      if (uploadError) {
        console.error('Hero image upload error:', uploadError);

        return res.status(500).json({
          error: `Image upload failed: ${uploadError.message}`,
        });
      }

      const { data } = supabase.storage
        .from('landing-page-images')
        .getPublicUrl(fileName);

      return res.status(200).json({
        success: true,
        imageUrl: data.publicUrl,
        message: 'Hero image uploaded successfully.',
      });
    } catch (error) {
      console.error('Hero image upload failed:', error);

      return res.status(500).json({
        error: error.message || 'Failed to upload hero image.',
      });
    }
  }
);
module.exports = router;
