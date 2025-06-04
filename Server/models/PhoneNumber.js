const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class PhoneNumbers extends Model {
    static associate(models) {
      PhoneNumbers.belongsTo(models.Contacts, {
        foreignKey: 'contact_id',
        as: 'contact'
      });
    }
  }

  PhoneNumbers.init({
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true
    },
    contact_id: {
      type: DataTypes.STRING(36),
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
    }
  }, {
    sequelize,
    modelName: 'PhoneNumbers',
    tableName: 'phone_numbers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return PhoneNumbers;
}; 