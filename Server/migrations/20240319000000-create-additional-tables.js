'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create addresses table
    await queryInterface.createTable('addresses', {
      id: {
        type: Sequelize.STRING(36),
        primaryKey: true
      },
      user_id: {
        type: Sequelize.STRING(36),
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      street: {
        type: Sequelize.STRING,
        allowNull: false
      },
      city: {
        type: Sequelize.STRING,
        allowNull: false
      },
      pincode: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      geo_location: {
        type: Sequelize.STRING,
        allowNull: true
      },
      address_type: {
        type: Sequelize.ENUM('Home', 'Billing', 'Shipping', 'Other'),
        allowNull: false,
        defaultValue: 'Home'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create contacts table
    await queryInterface.createTable('contacts', {
      id: {
        type: Sequelize.STRING(36),
        primaryKey: true
      },
      user_id: {
        type: Sequelize.STRING(36),
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      first_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      last_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      instagram_handle: {
        type: Sequelize.STRING,
        allowNull: true
      },
      whatsapp_number: {
        type: Sequelize.STRING,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create phone_numbers table
    await queryInterface.createTable('phone_numbers', {
      id: {
        type: Sequelize.STRING(36),
        primaryKey: true
      },
      contact_id: {
        type: Sequelize.STRING(36),
        allowNull: false,
        references: {
          model: 'contacts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      number: {
        type: Sequelize.STRING,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create last_login_attempts table
    await queryInterface.createTable('last_login_attempts', {
      id: {
        type: Sequelize.STRING(36),
        primaryKey: true
      },
      user_id: {
        type: Sequelize.STRING(36),
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      login_attempts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      login_counter: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      last_login_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('last_login_attempts');
    await queryInterface.dropTable('phone_numbers');
    await queryInterface.dropTable('contacts');
    await queryInterface.dropTable('addresses');
  }
}; 