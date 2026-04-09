import express from 'express';
import multer from 'multer';
import { models } from '../../config/database.js';
import { requireAdmin } from './middleware.js';
import { ensureWritableDir } from '../../utils/uploadPaths.js';

const router = express.Router();
const { FeaturedAd, Ad, PlatformConfig } = models;

// setup multer to accept image uploads for admin ads
const uploadDir = ensureWritableDir('uploads', 'ads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

router.use(requireAdmin);

const CMS_AD_KEYS = ['checkout_ads', 'mega_ads_left', 'mega_ads_right', 'scrolling_ads'];
const FEATURED_PLACEMENTS = new Set(['featured_mega', 'featured_scroll']);
const LEGACY_PLACEMENTS = new Set(['public_ads']);

function parseJsonValue(value, fallback = []) {
  try {
    return JSON.parse(value);
  } catch (_err) {
    return fallback;
  }
}

async function readCmsAds(key) {
  const row = await PlatformConfig.findByPk(key);
  if (!row) return [];
  const parsed = parseJsonValue(row.value, []);
  return Array.isArray(parsed) ? parsed : [];
}

async function writeCmsAds(key, items) {
  await PlatformConfig.upsert({
    key,
    value: JSON.stringify(items),
    type: 'json',
    category: 'cms',
    description: `Advertisements for ${key}`
  });
}

function normalizeLegacyAd(row) {
  const data = row.toJSON ? row.toJSON() : row;
  return {
    id: `legacy:${data.id}`,
    sourceType: 'legacy',
    placement: data.position || 'public_ads',
    title: data.title || '',
    imageUrl: data.imageUrl || '',
    targetUrl: data.link || '',
    text: '',
    active: Boolean(data.isActive),
    rawId: data.id
  };
}

function normalizeFeaturedAd(row) {
  const data = row.toJSON ? row.toJSON() : row;
  return {
    id: `featured:${data.id}`,
    sourceType: 'featured',
    placement: data.type || 'featured',
    title: data.title || '',
    imageUrl: data.imageUrl || '',
    targetUrl: data.targetUrl || '',
    text: data.meta?.text || '',
    active: Boolean(data.active),
    rawId: data.id
  };
}

function normalizeCmsAd(item, key, index) {
  return {
    id: `cms:${key}:${index}`,
    sourceType: 'cms',
    placement: key,
    title: item.title || item.name || item.text || `${key} ${index + 1}`,
    imageUrl: item.imageUrl || item.image_url || item.image || item.url || item.src || '',
    targetUrl: item.targetUrl || item.link || item.href || '',
    text: item.text || '',
    active: Object.prototype.hasOwnProperty.call(item, 'active') ? Boolean(item.active) : true,
    rawIndex: index
  };
}

function parseAdId(value) {
  const rawId = String(value || '');
  const [sourceType, first, second] = rawId.split(':');

  if (sourceType === 'cms') {
    return { sourceType, placement: first, index: Number(second) };
  }

  if (sourceType === 'featured' || sourceType === 'legacy') {
    return { sourceType, rawId: Number(first) };
  }

  const numericId = Number(rawId);
  if (!Number.isNaN(numericId)) {
    return { sourceType: 'featured', rawId: numericId };
  }

  return { sourceType: '', rawId: null };
}

function normalizeBoolean(value, fallback = true) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value === 'false') return false;
    if (value === 'true') return true;
  }
  return fallback;
}

function resolveFeaturedType(placement, fallback = 'mega') {
  if (placement === 'featured_scroll') return 'scroll';
  if (placement === 'featured_mega') return 'mega';
  return fallback;
}

function sortAds(items) {
  return [...items].sort((a, b) => {
    if (a.sourceType !== b.sourceType) return a.sourceType.localeCompare(b.sourceType);
    if ((a.placement || '') !== (b.placement || '')) return (a.placement || '').localeCompare(b.placement || '');
    return (a.title || '').localeCompare(b.title || '');
  });
}

router.get('/', async (req, res) => {
  try {
    const featuredRows = FeaturedAd
      ? await FeaturedAd.findAll({ order: [['type','ASC'], ['weight','DESC'], ['id','DESC']] })
      : [];
    const legacyRows = Ad ? await Ad.findAll({ order: [['id', 'DESC']] }) : [];

    const cmsRows = await Promise.all(
      CMS_AD_KEYS.map(async (key) => {
        const items = await readCmsAds(key);
        return items.map((item, index) => normalizeCmsAd(item, key, index));
      })
    );

    res.json(sortAds([
      ...featuredRows.map(normalizeFeaturedAd),
      ...legacyRows.map(normalizeLegacyAd),
      ...cmsRows.flat()
    ]));
  } catch (err) {
    console.error('Admin: list featured ads', err);
    res.status(500).json({ error: 'Failed' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { sourceType, placement, index, rawId } = parseAdId(req.params.id);

    if (sourceType === 'cms') {
      const items = await readCmsAds(placement);
      const item = items[index];
      if (!item) {
        return res.status(404).json({ error: 'Not found' });
      }
      return res.json(normalizeCmsAd(item, placement, index));
    }

    if (sourceType === 'featured') {
      const row = FeaturedAd ? await FeaturedAd.findByPk(rawId) : null;
      if (!row) {
        return res.status(404).json({ error: 'Not found' });
      }
      return res.json(normalizeFeaturedAd(row));
    }

    if (sourceType === 'legacy') {
      const row = Ad ? await Ad.findByPk(rawId) : null;
      if (!row) {
        return res.status(404).json({ error: 'Not found' });
      }
      return res.json(normalizeLegacyAd(row));
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (err) {
    console.error('Admin: get ad', err);
    res.status(500).json({ error: 'Failed' });
  }
});

router.post('/', upload.single('image'), async (req, res) => {
  try {
    const payload = req.body || {};
    const imageUrl = req.file ? `/uploads/ads/${req.file.filename}` : payload.imageUrl || '';
    const sourceType = payload.sourceType || 'cms';
    const placement = payload.placement || 'checkout_ads';
    const active = normalizeBoolean(payload.active, true);

    if (!payload.title?.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!imageUrl) {
      return res.status(400).json({ error: 'Image is required' });
    }

    if (sourceType === 'cms') {
      if (!CMS_AD_KEYS.includes(placement)) {
        return res.status(400).json({ error: 'Invalid CMS placement' });
      }
      const items = await readCmsAds(placement);
      items.push({
        title: payload.title || '',
        image: imageUrl,
        link: payload.targetUrl || payload.link || '',
        text: payload.text || '',
        active
      });
      await writeCmsAds(placement, items);
      return res.json({ ok: true, id: `cms:${placement}:${items.length - 1}` });
    }

    if (sourceType === 'legacy') {
      if (!LEGACY_PLACEMENTS.has(placement)) {
        return res.status(400).json({ error: 'Invalid legacy placement' });
      }
      const created = await Ad.create({
        title: payload.title || '',
        imageUrl,
        link: payload.targetUrl || payload.link || '',
        position: placement || 'public_ads',
        isActive: active
      });
      return res.json({ ok: true, id: `legacy:${created.id}` });
    }

    if (!FEATURED_PLACEMENTS.has(placement)) {
      return res.status(400).json({ error: 'Invalid featured placement' });
    }
    const created = await FeaturedAd.create({
      type: resolveFeaturedType(placement, 'mega'),
      imageUrl,
      targetUrl: payload.targetUrl || payload.link || '',
      title: payload.title || '',
      active,
      meta: payload.text ? { text: payload.text } : null
    });
    res.json({ ok: true, id: `featured:${created.id}` });
  } catch (err) {
    console.error('Admin: create featured ad', err);
    res.status(500).json({ error: 'Failed' });
  }
});

router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { sourceType, placement: currentPlacement, index, rawId } = parseAdId(req.params.id);
    const upd = req.body || {};
    const imageUrl = req.file ? `/uploads/ads/${req.file.filename}` : upd.imageUrl || '';
    const active = normalizeBoolean(upd.active, true);
    const nextPlacement = upd.placement || currentPlacement || 'checkout_ads';

    if (sourceType === 'cms') {
      if (!CMS_AD_KEYS.includes(currentPlacement) || !CMS_AD_KEYS.includes(nextPlacement)) {
        return res.status(400).json({ error: 'Invalid CMS placement' });
      }
      const items = await readCmsAds(currentPlacement);
      if (!items[index]) return res.status(404).json({ error: 'Not found' });
      const nextItem = {
        ...items[index],
        title: upd.title || '',
        image: imageUrl || items[index].image || '',
        link: upd.targetUrl || upd.link || '',
        text: upd.text || '',
        active
      };
      items.splice(index, 1);
      await writeCmsAds(currentPlacement, items);

      const destinationItems = currentPlacement === nextPlacement ? items : await readCmsAds(nextPlacement);
      destinationItems.push(nextItem);
      await writeCmsAds(nextPlacement, destinationItems);
      return res.json({ ok: true });
    }

    if (sourceType === 'legacy') {
      const row = await Ad.findByPk(rawId);
      if (!row) return res.status(404).json({ error: 'Not found' });
      await row.update({
        title: upd.title || '',
        imageUrl: imageUrl || row.imageUrl,
        link: upd.targetUrl || upd.link || '',
        position: upd.placement || row.position,
        isActive: active
      });
      return res.json({ ok: true });
    }

    const row = await FeaturedAd.findByPk(rawId);
    if (!row) return res.status(404).json({ error: 'Not found' });
    await row.update({
      title: upd.title || '',
      imageUrl: imageUrl || row.imageUrl,
      targetUrl: upd.targetUrl || upd.link || '',
      active,
      type: resolveFeaturedType(nextPlacement, row.type),
      meta: upd.text ? { ...(row.meta || {}), text: upd.text } : row.meta
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Admin: update featured ad', err);
    res.status(500).json({ error: 'Failed' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { sourceType, placement, index, rawId } = parseAdId(req.params.id);

    if (sourceType === 'cms') {
      const items = await readCmsAds(placement);
      if (!items[index]) return res.status(404).json({ error: 'Not found' });
      items.splice(index, 1);
      await writeCmsAds(placement, items);
      return res.json({ ok: true });
    }

    if (sourceType === 'legacy') {
      const row = await Ad.findByPk(rawId);
      if (!row) return res.status(404).json({ error: 'Not found' });
      await row.destroy();
      return res.json({ ok: true });
    }

    const row = await FeaturedAd.findByPk(rawId);
    if (!row) return res.status(404).json({ error: 'Not found' });
    await row.destroy();
    res.json({ ok: true });
  } catch (err) {
    console.error('Admin: delete featured ad', err);
    res.status(500).json({ error: 'Failed' });
  }
});

export default router;
