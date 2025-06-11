import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Auth extends Model {}

Auth.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
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
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended'),
    defaultValue: 'active'
  }
}, {
  sequelize,
  modelName: 'Auth',
  tableName: 'auths',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default Auth;