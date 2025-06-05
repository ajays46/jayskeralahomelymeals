const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PhoneNumber extends Model {
    static associate(models) {
      PhoneNumber.belongsTo(models.Contact, {
        foreignKey: 'contact_id',
        as: 'contact'
      });
    }
  }

  PhoneNumber.init({
    id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    contact_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'contacts',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    number: {
      type: DataTypes.STRING,
      allowNull: false
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
    modelName: 'PhoneNumber',
    tableName: 'phone_numbers',
    timestamps: false
  });

  return PhoneNumber;
}; 