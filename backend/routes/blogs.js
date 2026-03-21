import express from 'express';
import { models } from '../config/database.js';
import { Op } from 'sequelize';

const { Blog, Admin } = models;
const router = express.Router();

// Generate slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Get all published blogs (public)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, tag, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      status: 'published'
    };

    if (tag) {
      where.tags = { [Op.like]: `%${tag}%` };
    }

    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { content: { [Op.like]: `%${search}%` } },
        { excerpt: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Blog.findAndCountAll({
      where,
      include: [{
        model: Admin,
        as: 'author',
        attributes: ['id', 'name', 'email']
      }],
      order: [['publishedAt', 'DESC']],
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

// Get single blog by slug (public)
router.get('/:slug', async (req, res) => {
  try {
    const blog = await Blog.findOne({
      where: {
        slug: req.params.slug,
        status: 'published'
      },
      include: [{
        model: Admin,
        as: 'author',
        attributes: ['id', 'name', 'email']
      }]
    });

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // Increment views
    await blog.increment('views');

    res.json(blog);
  } catch (err) {
    console.error('Get blog error:', err);
    res.status(500).json({ error: 'Failed to load blog' });
  }
});

export default router;
