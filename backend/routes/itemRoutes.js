const express = require('express');
const path = require('path');
const fs = require('fs');
const Item = require('../models/Item');
const auth = require('../middleware/auth');
const upload = require('../config/upload');
const { findMatches } = require('../utils/matching');

const router = express.Router();

// Browsing is public (maximizes the chance someone recognizes their item);
// only creating/editing/claiming requires login.
function optionalAuth(req, res, next) {
  const header = req.header('Authorization');
  if (!header) return next();
  const jwt = require('jsonwebtoken');
  try {
    const token = header.startsWith('Bearer ') ? header.slice(7) : header;
    req.userId = jwt.verify(token, process.env.JWT_SECRET).userId;
  } catch (e) { /* ignore invalid token on public routes */ }
  next();
}

// GET /api/items — list with filters: type, category, location, status, q (keyword), from/to date
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { type, category, status, location, q, from, to, mine } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (mine === 'true' && req.userId) filter.reportedBy = req.userId;

    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    if (q) {
      filter.$text = { $search: q };
    }

    const items = await Item.find(filter)
      .populate('reportedBy', 'name email phone')
      .populate('claimedBy', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(200);

    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/items/categories — the fixed category list, for building filter/report UI
router.get('/categories', (req, res) => {
  res.json(Item.CATEGORIES);
});

// GET /api/items/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('reportedBy', 'name email phone')
      .populate('claimedBy', 'name email phone');
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/items/:id/matches — smart suggestions from the opposite list (lost<->found)
router.get('/:id/matches', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const oppositeType = item.type === 'lost' ? 'found' : 'lost';
    const candidates = await Item.find({ type: oppositeType, status: 'open' })
      .populate('reportedBy', 'name email phone');

    const matches = findMatches(item, candidates);
    res.json(matches.map(m => ({ score: m.score, item: m.item })));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/items — create a lost or found report (multipart, up to 5 images)
router.post('/', auth, upload.array('images', 5), async (req, res) => {
  try {
    const {
      type, title, description, category, location, date,
      contactName, contactPhone, contactEmail
    } = req.body;

    if (!type || !['lost', 'found'].includes(type)) {
      return res.status(400).json({ message: 'Type must be "lost" or "found"' });
    }
    if (!title || !description || !category || !location || !date || !contactName) {
      return res.status(400).json({ message: 'Title, description, category, location, date and contact name are required' });
    }

    const images = (req.files || []).map(f => ({
      originalName: f.originalname,
      storedName: f.filename,
      mimeType: f.mimetype,
      size: f.size
    }));

    const item = await Item.create({
      type, title, description, category, location,
      date: new Date(date),
      contactName, contactPhone, contactEmail,
      images,
      reportedBy: req.userId
    });

    const populated = await item.populate('reportedBy', 'name email phone');
    res.status(201).json(populated);
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/items/:id — edit (owner only, cannot change type after creation)
router.put('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.reportedBy.toString() !== req.userId) return res.status(403).json({ message: 'Only the reporter can edit this item' });

    const editable = ['title', 'description', 'category', 'location', 'date', 'contactName', 'contactPhone', 'contactEmail'];
    editable.forEach(field => {
      if (req.body[field] !== undefined) item[field] = field === 'date' ? new Date(req.body[field]) : req.body[field];
    });

    await item.save();
    res.json(item);
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/items/:id — owner only
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.reportedBy.toString() !== req.userId) return res.status(403).json({ message: 'Only the reporter can delete this item' });

    item.images.forEach(img => {
      fs.unlink(path.join(__dirname, '..', 'uploads', img.storedName), () => {});
    });
    await item.deleteOne();
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/items/:id/claim — someone claims a "found" item as theirs
router.post('/:id/claim', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.type !== 'found') return res.status(400).json({ message: 'Only found items can be claimed' });
    if (item.status !== 'open') return res.status(400).json({ message: 'This item is no longer available to claim' });
    if (item.reportedBy.toString() === req.userId) return res.status(400).json({ message: 'You cannot claim your own report' });

    item.status = 'claimed';
    item.claimedBy = req.userId;
    item.claimNote = (req.body.note || '').slice(0, 500);
    await item.save();

    const populated = await item.populate(['reportedBy', 'claimedBy']);
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH /api/items/:id/status — owner confirms handoff ("resolved") or reopens ("open")
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.reportedBy.toString() !== req.userId) return res.status(403).json({ message: 'Only the reporter can change status' });

    const { status } = req.body;
    if (!['open', 'resolved'].includes(status)) return res.status(400).json({ message: 'Status must be "open" or "resolved"' });

    item.status = status;
    if (status === 'open') { item.claimedBy = null; item.claimNote = ''; }
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
