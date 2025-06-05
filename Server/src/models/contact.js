const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Contact extends Model {
    static associate(models) {
      Contact.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
      Contact.hasMany(models.PhoneNumber, {
        foreignKey: 'contact_id',
        as: 'phoneNumbers'
      });
    }
  }

  Contact.init({
    id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
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
    modelName: 'Contact',
    tableName: 'contacts',
    timestamps: false
  });

  return Contact;
}; 