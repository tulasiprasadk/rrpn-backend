import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { requireAdmin } from './middleware.js';

const router = express.Router();
router.use(requireAdmin);

const uploadDir = path.join(path.resolve(), 'uploads', 'ads');
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file required' });
  res.json({ ok: true, filename: req.file.filename, url: `/uploads/ads/${req.file.filename}` });
});

export default router;
