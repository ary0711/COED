// routes/documentCategories.js
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const supabase = require('../supabaseClient');

function requireDeanOrAdmin(req, res, next) {
  if (req.user.role !== 'dean' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only the Dean or an Admin can perform this action.' });
  }
  next();
}

// ── GET /api/document-categories — list categories ──
router.get('/', authenticate, async (req, res) => {
  const { status } = req.query;
  const userRole = req.user.role;
  const isPrivileged = userRole === 'dean' || userRole === 'admin';

  let query = supabase
    .from('document_categories')
    .select('*')
    .order('name', { ascending: true });

  if (!isPrivileged) {
    // Non-privileged users only see active categories
    query = query.eq('is_active', true);
  } else if (status === 'active') {
    query = query.eq('is_active', true);
  } else if (status === 'inactive') {
    query = query.eq('is_active', false);
  }

  const { data, error } = await query;
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  return res.json(data ?? []);
});

// ── POST /api/document-categories — create category (Dean/Admin only) ──
router.post('/', authenticate, requireDeanOrAdmin, async (req, res) => {
  const { name, description } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Category name is required.' });
  }

  const { data, error } = await supabase
    .from('document_categories')
    .insert({
      name: name.trim(),
      description: description?.trim() || null,
      is_active: true,
      created_by: req.user.userId,
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: 'Failed to create category: ' + error.message });
  }

  return res.status(201).json(data);
});

// ── PUT /api/document-categories/:id — update category (Dean/Admin only) ──
router.put('/:id', authenticate, requireDeanOrAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Category name cannot be empty.' });
  }

  const { data, error } = await supabase
    .from('document_categories')
    .update({
      name: name.trim(),
      description: description?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: 'Failed to update category: ' + error.message });
  }

  return res.json(data);
});

// ── PATCH /api/document-categories/:id/status — toggle active/inactive status (Dean/Admin only) ──
router.patch('/:id/status', authenticate, requireDeanOrAdmin, async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  if (typeof is_active !== 'boolean') {
    return res.status(400).json({ error: 'is_active boolean status is required.' });
  }

  const { data, error } = await supabase
    .from('document_categories')
    .update({
      is_active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: 'Failed to update category status: ' + error.message });
  }

  return res.json(data);
});

module.exports = router;