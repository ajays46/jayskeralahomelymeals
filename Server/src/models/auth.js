const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Auth extends Model {}

Auth.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  api_key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended'),
    defaultValue: 'active'
  }
}, {
  sequelize,
  modelName: 'Auth',
  tableName: 'auths',
  timestamps: true, // This will automatically add created_at and updated_at
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Auth; 