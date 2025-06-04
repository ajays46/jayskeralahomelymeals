const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Contacts extends Model {
    static associate(models) {
      Contacts.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
      Contacts.hasMany(models.PhoneNumbers, {
        foreignKey: 'contact_id',
        as: 'phone_numbers'
      });
    }
  }

  Contacts.init({
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
    first_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    instagram_handle: {
      type: DataTypes.STRING,
      allowNull: true
    },
    whatsapp_number: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Contacts',
    tableName: 'contacts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Contacts;
}; 