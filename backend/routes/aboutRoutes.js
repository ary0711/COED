
const express = require('express');
const crypto = require('crypto');
const supabase = require('../supabaseClient');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// ======================================================
// VERIFY CURRENT DATABASE ROLE
// ======================================================
async function requireAboutEditor(req, res, next) {
  try {
    const ids = [
      req.user?.profileId,
      req.user?.userId,
    ].filter(Boolean);

    const candidateIds = [...new Set(ids)];

    if (!candidateIds.length) {
      return res.status(401).json({
        error: 'Your login token does not contain a valid user ID.',
      });
    }

    let profile = null;

    for (const id of candidateIds) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('About profile lookup error:', error);
        return res.status(500).json({
          error: 'Unable to verify account permissions.',
        });
      }

      if (data) {
        profile = data;
        break;
      }
    }

    const role = String(profile?.role || '')
      .trim()
      .toLowerCase();

    console.log('About editor authorization:', {
      profileId: profile?.id,
      role,
    });

    if (!profile || !['admin', 'dean'].includes(role)) {
      return res.status(403).json({
        error: 'You are not authorized to edit About page content.',
      });
    }

    next();
  } catch (error) {
    console.error('About authorization error:', error);
    return res.status(500).json({
      error: 'About page authorization failed.',
    });
  }
}

// ======================================================
// SAVE ABOUT PAGE
// ======================================================
router.post(
  '/save',
  authenticate,
  requireAboutEditor,
  async (req, res) => {
    try {
      const {
        aboutContent = {},
        aboutStats = [],
        coreValues = [],
        coreValueCards = [],
        facultyMembers = [],
      } = req.body || {};

      if (
        !aboutContent ||
        typeof aboutContent !== 'object' ||
        Array.isArray(aboutContent) ||
        !Array.isArray(aboutStats) ||
        !Array.isArray(coreValues) ||
        !Array.isArray(coreValueCards) ||
        !Array.isArray(facultyMembers)
      ) {
        return res.status(400).json({
          error: 'Invalid About page data format.',
        });
      }

      // 1. About page content
      const contentUpdates = Object.entries(aboutContent).map(
        ([section_name, values]) => ({
          section_name,
          title: values.title,
          description: values.description,
          content: values.content,
          image: values.image,
          badge_number: values.badge_number,
        })
      );

      if (contentUpdates.length) {
        const { error } = await supabase
          .from('about_page_content')
          .upsert(contentUpdates, {
            onConflict: 'section_name',
          });

        if (error) {
          throw new Error(`About content: ${error.message}`);
        }
      }

      // 2. About statistics
      if (aboutStats.length) {
        const { error } = await supabase
          .from('about_statistics')
          .upsert(aboutStats);

        if (error) {
          throw new Error(`About statistics: ${error.message}`);
        }
      }

      // 3. Premier values
      if (coreValues.length) {
        const { error } = await supabase
          .from('premier_values')
          .upsert(coreValues);

        if (error) {
          throw new Error(`Premier values: ${error.message}`);
        }
      }

      // 4. Core value cards
      if (coreValueCards.length) {
        const { error } = await supabase
          .from('core_values')
          .upsert(coreValueCards);

        if (error) {
          throw new Error(`Core value cards: ${error.message}`);
        }
      }

      // 5. Faculty members
      if (facultyMembers.length) {
        const { error } = await supabase
          .from('faculty_members')
          .upsert(facultyMembers, {
            onConflict: 'id',
          });

        if (error) {
          throw new Error(`Faculty members: ${error.message}`);
        }
      }

      return res.status(200).json({
        success: true,
        message: 'About page saved successfully.',
      });
    } catch (error) {
      console.error('About page save failed:', error);

      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to save About page.',
      });
    }
  }
);

// ======================================================
// DELETE FACULTY MEMBER
// ======================================================
router.delete(
  '/faculty/:id',
  authenticate,
  requireAboutEditor,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: 'Faculty member ID is required.',
        });
      }

      const { data, error } = await supabase
        .from('faculty_members')
        .delete()
        .eq('id', id)
        .select();

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return res.status(404).json({
          error: 'Faculty member was not found.',
        });
      }

      return res.status(200).json({
        success: true,
        data,
        message: 'Faculty member deleted successfully.',
      });
    } catch (error) {
      console.error('Faculty deletion failed:', error);

      return res.status(500).json({
        error: error.message || 'Failed to delete faculty member.',
      });
    }
  }
);

// ======================================================
// UPLOAD ABOUT OR FACULTY IMAGE
// ======================================================
router.post(
  '/upload-image',
  authenticate,
  requireAboutEditor,
  async (req, res) => {
    try {
      const {
        image,
        bucket,
        folder,
        contentType,
      } = req.body || {};

      const allowedBuckets = {
        'about-images': ['history', 'about', 'mission', 'vision'],
        'faculty_images': ['faculty'],
      };

      if (
        !allowedBuckets[bucket] ||
        !allowedBuckets[bucket].includes(folder)
      ) {
        return res.status(400).json({
          error: 'Invalid image storage destination.',
        });
      }

      const match = typeof image === 'string'
        ? image.match(
            /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/
          )
        : null;

      if (!match) {
        return res.status(400).json({
          error: 'Invalid image. Use JPG, PNG, or WEBP.',
        });
      }

      const actualContentType = match[1];

      if (contentType && contentType !== actualContentType) {
        return res.status(400).json({
          error: 'Image content type does not match.',
        });
      }

      const buffer = Buffer.from(match[2], 'base64');

      if (!buffer.length || buffer.length > 5 * 1024 * 1024) {
        return res.status(400).json({
          error: 'Image must be smaller than 5 MB.',
        });
      }

      const extensions = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
      };

      const fileName =
        `${folder}/${Date.now()}-${crypto.randomUUID()}.${extensions[actualContentType]}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, buffer, {
          contentType: actualContentType,
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return res.status(200).json({
        success: true,
        imageUrl: data.publicUrl,
      });
    } catch (error) {
      console.error('About image upload failed:', error);

      return res.status(500).json({
        error: error.message || 'Image upload failed.',
      });
    }
  }
);

module.exports = router;