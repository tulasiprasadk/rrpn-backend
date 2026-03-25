import express from 'express';
import multer from 'multer';
import { requireAdmin } from './middleware.js';
import { ensureWritableDir } from '../../utils/uploadPaths.js';

const router = express.Router();
router.use(requireAdmin);

const uploadDir = ensureWritableDir('uploads', 'ads');
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
