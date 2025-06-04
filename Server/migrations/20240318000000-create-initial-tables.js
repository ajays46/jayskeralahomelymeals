'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create auths table
    await queryInterface.createTable('auths', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      phone_number: {
        type: Sequelize.STRING,
        allowNull: false
      },
      api_key: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('active', 'blocked', 'inactive'),
        defaultValue: 'active'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Create companies table
    await queryInterface.createTable('companies', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('active', 'blocked', 'inactive'),
        defaultValue: 'active'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Create users table
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true
      },
      company_id: {
        type: Sequelize.STRING,
        references: {
          model: 'companies',
          key: 'id'
        }
      },
      auth_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'auths',
          key: 'id'
        }
      },
      status: {
        type: Sequelize.ENUM('active', 'blocked', 'inactive'),
        defaultValue: 'active'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Create sessions table
    await queryInterface.createTable('sessions', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      access_token: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order
    await queryInterface.dropTable('sessions');
    await queryInterface.dropTable('users');
    await queryInterface.dropTable('companies');
    await queryInterface.dropTable('auths');
  }
}; 