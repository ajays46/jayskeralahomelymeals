const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class LastLoginAttempts extends Model {
    static associate(models) {
      LastLoginAttempts.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  }

  LastLoginAttempts.init({
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
    login_attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    login_counter: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'LastLoginAttempts',
    tableName: 'last_login_attempts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return LastLoginAttempts;
}; 