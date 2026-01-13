import express from 'express';
import { models } from "../../config/database.js";
import { requireSuperAdmin, requireAdmin } from './middleware.js';

const { PlatformConfig } = models;
const router = express.Router();

// Get all platform configs (admin only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const configs = await PlatformConfig.findAll({
      order: [['category', 'ASC'], ['key', 'ASC']]
    });
    
    const configMap = {};
    configs.forEach(config => {
      let value = config.value;
      if (config.type === 'number') {
        value = parseFloat(value);
      } else if (config.type === 'boolean') {
        value = value === 'true';
      } else if (config.type === 'json') {
        try {
          value = JSON.parse(value);
        } catch {
          value = value;
        }
      }
      configMap[config.key] = value;
    });
    
    res.json(configMap);
  } catch (err) {
    console.error('Get config error:', err);
    res.status(500).json({ error: 'Failed to load config' });
  }
});

// Get config by key (admin only)
router.get('/:key', requireAdmin, async (req, res) => {
  try {
    const config = await PlatformConfig.findByPk(req.params.key);
    if (!config) {
      return res.status(404).json({ error: 'Config not found' });
    }
    
    let value = config.value;
    if (config.type === 'number') {
      value = parseFloat(value);
    } else if (config.type === 'boolean') {
      value = value === 'true';
    } else if (config.type === 'json') {
      try {
        value = JSON.parse(value);
      } catch {
        value = value;
      }
    }
    
    res.json({ key: config.key, value, type: config.type, description: config.description, category: config.category });
  } catch (err) {
    console.error('Get config error:', err);
    res.status(500).json({ error: 'Failed to load config' });
  }
});

// Update or create config (super admin only)
router.put('/:key', requireSuperAdmin, async (req, res) => {
  try {
    const { value, type, description, category } = req.body;
    
    let stringValue = value;
    if (type === 'json') {
      stringValue = JSON.stringify(value);
    } else if (type === 'number' || type === 'boolean') {
      stringValue = String(value);
    }
    
    const [config, created] = await PlatformConfig.upsert({
      key: req.params.key,
      value: stringValue,
      type: type || 'string',
      description: description || null,
      category: category || null
    }, {
      returning: true
    });
    
    res.json({ 
      success: true, 
      message: created ? 'Config created' : 'Config updated',
      config: {
        key: config.key,
        value: config.value,
        type: config.type,
        description: config.description,
        category: config.category
      }
    });
  } catch (err) {
    console.error('Update config error:', err);
    res.status(500).json({ error: 'Failed to update config' });
  }
});

// Delete config (super admin only)
router.delete('/:key', requireSuperAdmin, async (req, res) => {
  try {
    await PlatformConfig.destroy({ where: { key: req.params.key } });
    res.json({ success: true, message: 'Config deleted' });
  } catch (err) {
    console.error('Delete config error:', err);
    res.status(500).json({ error: 'Failed to delete config' });
  }
});

export default router;
