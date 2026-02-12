import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { models } from '../../config/database.js';
import { requireAdmin } from './middleware.js';

const router = express.Router();
const { FeaturedAd } = models;

// setup multer to accept image uploads for admin ads
const uploadDir = path.join(path.resolve(), 'uploads', 'ads');
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

router.use(requireAdmin);

router.get('/', async (req, res) => {
  try {
    const rows = await FeaturedAd.findAll({ order: [['type','ASC'], ['weight','DESC'], ['id','DESC']] });
    res.json(rows);
  } catch (err) {
    console.error('Admin: list featured ads', err);
    res.status(500).json({ error: 'Failed' });
  }
});

router.post('/', upload.single('image'), async (req, res) => {
  try {
    const payload = req.body || {};
    if (req.file) {
      payload.imageUrl = `/uploads/ads/${req.file.filename}`;
    }
    const created = await FeaturedAd.create(payload);
    res.json({ ok: true, id: created.id });
  } catch (err) {
    console.error('Admin: create featured ad', err);
    res.status(500).json({ error: 'Failed' });
  }
});

router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const upd = req.body || {};
    if (req.file) upd.imageUrl = `/uploads/ads/${req.file.filename}`;
    const row = await FeaturedAd.findByPk(id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    await row.update(upd);
    res.json({ ok: true });
  } catch (err) {
    console.error('Admin: update featured ad', err);
    res.status(500).json({ error: 'Failed' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const row = await FeaturedAd.findByPk(id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    await row.destroy();
    res.json({ ok: true });
  } catch (err) {
    console.error('Admin: delete featured ad', err);
    res.status(500).json({ error: 'Failed' });
  }
});

export default router;
