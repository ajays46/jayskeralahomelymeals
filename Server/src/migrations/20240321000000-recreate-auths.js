'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First drop the existing table if it exists
    await queryInterface.dropTable('auths').catch(() => {});

    // Create the table with proper structure
    await queryInterface.createTable('auths', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      phone_number: {
        type: Sequelize.STRING,
        allowNull: true
      },
      api_key: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'suspended'),
        defaultValue: 'active'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add unique constraints one at a time
    await queryInterface.addIndex('auths', ['email'], {
      unique: true,
      name: 'auths_email_unique'
    });

    await queryInterface.addIndex('auths', ['api_key'], {
      unique: true,
      name: 'auths_api_key_unique'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('auths');
  }
}; 