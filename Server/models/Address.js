const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Addresses extends Model {
    static associate(models) {
      Addresses.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  }

  Addresses.init({
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true
    },
    user_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    street: {
      type: DataTypes.STRING,
      allowNull: false
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false
    },
    pincode: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    geo_location: {
      type: DataTypes.STRING,
      allowNull: true
    },
    address_type: {
      type: DataTypes.ENUM('Home', 'Billing', 'Shipping', 'Other'),
      allowNull: false,
      defaultValue: 'Home'
    }
  }, {
    sequelize,
    modelName: 'Addresses',
    tableName: 'addresses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Addresses;
}; 