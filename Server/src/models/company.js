const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Company extends Model {
    static associate(models) {
      Company.belongsTo(models.Address, {
        foreignKey: 'address_id',
        as: 'address'
      });
      Company.hasMany(models.User, {
        foreignKey: 'company_id',
        as: 'users'
      });
    }
  }

  Company.init({
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    address_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: {
        model: 'addresses',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
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
    modelName: 'Company',
    tableName: 'companies',
    timestamps: false
  });

  return Company;
}; 