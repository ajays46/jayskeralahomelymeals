module.exports = (sequelize, DataTypes) => {
  const Auth = sequelize.define('Auth', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
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
      allowNull: true,
      defaultValue: ''
    },
    api_key: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('active', 'blocked', 'inactive'),
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
    tableName: 'auths',
    timestamps: false,
    hooks: {
      beforeCreate: async (auth) => {
        const existingAuth = await sequelize.models.Auth.findOne({
          where: { email: auth.email }
        });
        if (existingAuth) {
          throw new Error('Email already registered');
        }
      }
    }
  });

  return Auth;
}; 