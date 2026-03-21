import { Op } from 'sequelize';
import { models, sequelize } from '../config/database.js';

const { Category, Product } = models;

const allowedCategories = [
  { name: 'Groceries', icon: '🛒' },
  { name: 'Flowers', icon: '🌸' },
  { name: 'Local Services', icon: '🛠️' },
  { name: 'Pet Services', icon: '🐾' },
  { name: 'Consultancy', icon: '💼' },
  { name: 'Crackers', icon: '🎆' },
];

const normalize = (value) => (value || '').replace(/\s+/g, '').toLowerCase();

async function ensureAllowedCategories() {
  const existing = await Category.findAll();
  const byName = new Map(existing.map((c) => [normalize(c.name), c]));
  const allowedIds = new Set();

  for (const entry of allowedCategories) {
    const key = normalize(entry.name);
    const found = byName.get(key);
    if (found) {
      await found.update({ icon: entry.icon });
      allowedIds.add(found.id);
    } else {
      const created = await Category.create(entry);
      allowedIds.add(created.id);
    }
  }

  return allowedIds;
}

async function prune() {
  try {
    await sequelize.sync();

    const allowedIds = await ensureAllowedCategories();

    // Detach products from removed categories to avoid FK constraints.
    const allowedList = Array.from(allowedIds);
    if (allowedList.length) {
      await Product.update(
        { CategoryId: null },
        { where: { CategoryId: { [Op.notIn]: allowedList } } }
      );
    }

    // Remove categories not in allowed list.
    if (allowedList.length) {
      await Category.destroy({
        where: {
          id: { [Op.notIn]: allowedList }
        }
      });
    }

    console.log('✅ Pruned categories to allowed list');
    process.exit(0);
  } catch (err) {
    console.error('❌ Prune categories failed:', err.message || err);
    process.exit(1);
  }
}

prune();
