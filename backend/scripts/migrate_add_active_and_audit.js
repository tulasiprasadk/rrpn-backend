#!/usr/bin/env node
import { sequelize } from "../config/database.js";

async function run() {
  const qi = sequelize.getQueryInterface();
  try {
    // Add active column to Products
    await qi.addColumn('Products', 'active', {
      type: sequelize.constructor.DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    console.log('Added column Products.active');
  } catch (err) {
    console.warn('Could not add Products.active (maybe exists):', err.message?.split('\n')[0] || err.message);
  }

  try {
    await qi.createTable('ItemActivationAudits', {
      id: { type: sequelize.constructor.DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      ProductId: { type: sequelize.constructor.DataTypes.INTEGER, allowNull: false },
      action: { type: sequelize.constructor.DataTypes.STRING, allowNull: false },
      userId: { type: sequelize.constructor.DataTypes.INTEGER, allowNull: true },
      note: { type: sequelize.constructor.DataTypes.TEXT, allowNull: true },
      createdAt: { type: sequelize.constructor.DataTypes.DATE, allowNull: false, defaultValue: sequelize.constructor.literal('CURRENT_TIMESTAMP') }
    });
    console.log('Created table ItemActivationAudits');
  } catch (err) {
    console.warn('Could not create ItemActivationAudits (maybe exists):', err.message?.split('\n')[0] || err.message);
  }

  try {
    await qi.createTable('ActivationJobs', {
      id: { type: sequelize.constructor.DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      ProductId: { type: sequelize.constructor.DataTypes.INTEGER, allowNull: false },
      status: { type: sequelize.constructor.DataTypes.STRING, allowNull: false, defaultValue: 'pending' },
      attempts: { type: sequelize.constructor.DataTypes.INTEGER, defaultValue: 0 },
      lastError: { type: sequelize.constructor.DataTypes.TEXT, allowNull: true },
      createdAt: { type: sequelize.constructor.DataTypes.DATE, allowNull: false, defaultValue: sequelize.constructor.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: sequelize.constructor.DataTypes.DATE, allowNull: false, defaultValue: sequelize.constructor.literal('CURRENT_TIMESTAMP') }
    });
    console.log('Created table ActivationJobs');
  } catch (err) {
    console.warn('Could not create ActivationJobs (maybe exists):', err.message?.split('\n')[0] || err.message);
  }

  try {
    await qi.createTable('ProductViews', {
      id: { type: sequelize.constructor.DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      ProductId: { type: sequelize.constructor.DataTypes.INTEGER, allowNull: false },
      views: { type: sequelize.constructor.DataTypes.INTEGER, defaultValue: 0 },
      lastViewAt: { type: sequelize.constructor.DataTypes.DATE, allowNull: true }
    });
    console.log('Created table ProductViews');
  } catch (err) {
    console.warn('Could not create ProductViews (maybe exists):', err.message?.split('\n')[0] || err.message);
  }

  try {
    await qi.createTable('FeaturedAds', {
      id: { type: sequelize.constructor.DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      type: { type: sequelize.constructor.DataTypes.STRING, allowNull: false },
      imageUrl: { type: sequelize.constructor.DataTypes.STRING, allowNull: false },
      targetUrl: { type: sequelize.constructor.DataTypes.STRING, allowNull: true },
      title: { type: sequelize.constructor.DataTypes.STRING, allowNull: true },
      weight: { type: sequelize.constructor.DataTypes.INTEGER, defaultValue: 1 },
      active: { type: sequelize.constructor.DataTypes.BOOLEAN, defaultValue: true },
      scheduleFrom: { type: sequelize.constructor.DataTypes.DATE, allowNull: true },
      scheduleTo: { type: sequelize.constructor.DataTypes.DATE, allowNull: true },
      meta: { type: sequelize.constructor.DataTypes.JSON, allowNull: true },
      createdAt: { type: sequelize.constructor.DataTypes.DATE, allowNull: false, defaultValue: sequelize.constructor.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: sequelize.constructor.DataTypes.DATE, allowNull: false, defaultValue: sequelize.constructor.literal('CURRENT_TIMESTAMP') }
    });
    console.log('Created table FeaturedAds');
  } catch (err) {
    console.warn('Could not create FeaturedAds (maybe exists):', err.message?.split('\n')[0] || err.message);
  }

  console.log('Migration script finished.');
  process.exit(0);
}

run().catch((e) => {
  console.error('Migration failed:', e);
  process.exit(1);
});
