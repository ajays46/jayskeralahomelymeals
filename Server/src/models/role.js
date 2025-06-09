import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Role extends Model {}

Role.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.ENUM('user', 'seller', 'admin'),
    allowNull: false,
    unique: true
  }
}, {
  sequelize,
  modelName: 'Role',
  tableName: 'roles',
  timestamps: false
});

export default Role;
