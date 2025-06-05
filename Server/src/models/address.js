const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Address extends Model {
    static associate(models) {
      Address.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
      Address.hasMany(models.Company, {
        foreignKey: 'address_id',
        as: 'companies'
      });
    }
  }

  Address.init({
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false
    },
    user_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
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
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Address',
    tableName: 'addresses',
    timestamps: false
  });

  return Address;
}; 