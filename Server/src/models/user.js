const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.belongsTo(models.Auth, { foreignKey: 'auth_id', as: 'auth' });
      User.belongsTo(models.Company, { foreignKey: 'company_id', as: 'company' });
      User.belongsTo(models.Role, { foreignKey: 'role_id', as: 'role' });
      User.hasMany(models.Address, { foreignKey: 'user_id', as: 'addresses' });
      User.hasMany(models.Contact, { foreignKey: 'user_id', as: 'contacts' });
      User.hasMany(models.Session, { foreignKey: 'user_id', as: 'sessions' });
    }
  }

  User.init({
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false
    },
    company_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: {
        model: 'companies',
        key: 'id'
      }
    },
    auth_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: {
        model: 'auths',
        key: 'id'
      }
    },
    role_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: {
        model: 'roles',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('active', 'Blocked', 'inactive'),
      defaultValue: 'active'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: false
  });

  return User;
}; 