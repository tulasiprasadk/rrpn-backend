import express from 'express';
import { models } from '../../config/database.js';
import { requireAdmin } from './middleware.js';
import { Op } from 'sequelize';

const { Blog, Admin } = models;
const router = express.Router();

// Generate slug from title
function generateSlug(title, existingId = null) {
  let baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return baseSlug;
}

// Get all blogs (admin)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) {
      where.status = status;
    }

    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { content: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Blog.findAndCountAll({
      where,
      include: [{
        model: Admin,
        as: 'author',
        attributes: ['id', 'name', 'email']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      blogs: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Get blogs error:', err);
    res.status(500).json({ error: 'Failed to load blogs' });
  }
});

// Get single blog (admin)
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const blog = await Blog.findByPk(req.params.id, {
      include: [{
        model: Admin,
        as: 'author',
        attributes: ['id', 'name', 'email']
      }]
    });

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    res.json(blog);
  } catch (err) {
    console.error('Get blog error:', err);
    res.status(500).json({ error: 'Failed to load blog' });
  }
});

// Create blog (admin)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { title, content, excerpt, featuredImage, status, tags, metaTitle, metaDescription } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    let slug = generateSlug(title);
    // Ensure unique slug
    let existing = await Blog.findOne({ where: { slug } });
    let counter = 1;
    while (existing) {
      slug = `${generateSlug(title)}-${counter}`;
      existing = await Blog.findOne({ where: { slug } });
      counter++;
    }

    const blog = await Blog.create({
      title,
      slug,
      content,
      excerpt: excerpt || content.substring(0, 200) + '...',
      featuredImage,
      authorId: req.currentAdmin.id,
      status: status || 'draft',
      tags: tags ? (Array.isArray(tags) ? tags.join(', ') : tags) : null,
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || excerpt || content.substring(0, 160),
      publishedAt: status === 'published' ? new Date() : null
    });

    res.json(blog);
  } catch (err) {
    console.error('Create blog error:', err);
    res.status(500).json({ error: 'Failed to create blog' });
  }
});

// Update blog (admin)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const blog = await Blog.findByPk(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    const { title, content, excerpt, featuredImage, status, tags, metaTitle, metaDescription } = req.body;

    const updateData = {};
    if (title !== undefined) {
      updateData.title = title;
      // Update slug if title changed
      let slug = generateSlug(title);
      let existing = await Blog.findOne({ where: { slug, id: { [Op.ne]: blog.id } } });
      let counter = 1;
      while (existing) {
        slug = `${generateSlug(title)}-${counter}`;
        existing = await Blog.findOne({ where: { slug, id: { [Op.ne]: blog.id } } });
        counter++;
      }
      updateData.slug = slug;
    }
    if (content !== undefined) updateData.content = content;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (featuredImage !== undefined) updateData.featuredImage = featuredImage;
    if (status !== undefined) {
      updateData.status = status;
      // Set publishedAt if publishing for first time
      if (status === 'published' && !blog.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }
    if (tags !== undefined) {
      updateData.tags = tags ? (Array.isArray(tags) ? tags.join(', ') : tags) : null;
    }
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription;

    await blog.update(updateData);

    res.json(blog);
  } catch (err) {
    console.error('Update blog error:', err);
    res.status(500).json({ error: 'Failed to update blog' });
  }
});

// Delete blog (admin)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const blog = await Blog.findByPk(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    await blog.destroy();
    res.json({ success: true, message: 'Blog deleted' });
  } catch (err) {
    console.error('Delete blog error:', err);
    res.status(500).json({ error: 'Failed to delete blog' });
  }
});

export default router;
