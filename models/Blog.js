export default (sequelize, DataTypes) => {
  return sequelize.define('Blog', {
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    excerpt: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Short summary for preview'
    },
    featuredImage: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'URL to featured image'
    },
    authorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Admin ID who created the blog'
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived'),
      defaultValue: 'draft'
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    views: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    tags: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Comma-separated tags'
    },
    metaTitle: {
      type: DataTypes.STRING,
      allowNull: true
    },
    metaDescription: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'blogs',
    timestamps: true,
    indexes: [
      { fields: ['slug'] },
      { fields: ['status'] },
      { fields: ['authorId'] }
    ]
  });
};
