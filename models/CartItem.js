<<<<<<< HEAD
// backend/models/CartItem.js
module.exports = (sequelize, DataTypes) => {
  const CartItem = sequelize.define('CartItem', {
=======
const CartItem = (sequelize, DataTypes) => {
  const CartItemModel = sequelize.define('CartItem', {
>>>>>>> 6ad866bc3b02abfaafe4c4d9ece89858474b19cd
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
  }, {
    indexes: [
      {
        unique: true,
        fields: ['customerId', 'productId']
      }
    ]
  });
<<<<<<< HEAD

  return CartItem;
};
=======
  return CartItemModel;
};

export default CartItem;
>>>>>>> 6ad866bc3b02abfaafe4c4d9ece89858474b19cd
