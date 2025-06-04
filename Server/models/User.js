const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class User extends Model {
    static associate(models) {
      User.belongsTo(models.Auth, {
        foreignKey: 'auth_id',
        as: 'auth'
      });
      User.belongsTo(models.Company, {
        foreignKey: 'company_id',
        as: 'company'
      });
      User.belongsTo(models.Role, {
        foreignKey: 'role_id',
        as: 'role'
      });
      User.hasMany(models.Addresses, {
        foreignKey: 'user_id',
        as: 'addresses'
      });
      User.hasMany(models.Contacts, {
        foreignKey: 'user_id',
        as: 'contacts'
      });
      User.hasOne(models.LastLoginAttempts, {
        foreignKey: 'user_id',
        as: 'login_attempts'
      });
    }
  }

  User.init({
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    auth_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: {
        model: 'auths',
        key: 'id'
      }
    },
    company_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: {
        model: 'companies',
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
      type: DataTypes.ENUM('active', 'inactive', 'blocked'),
      allowNull: false,
      defaultValue: 'active'
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return User;
};
  
