'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create roles table
    await queryInterface.createTable('roles', {
      id: {
        type: Sequelize.STRING(36),
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true
      },
      permissions: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: '{}'
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

    // Add unique index on name after table creation
    await queryInterface.addIndex('roles', ['name'], {
      unique: true,
      name: 'roles_name_unique'
    });

    // Insert default roles
    const roles = [
      {
        id: uuidv4(),
        name: 'user',
        description: 'Regular user with basic access',
        permissions: JSON.stringify({}),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'seller',
        description: 'Seller with product management access',
        permissions: JSON.stringify({
          manage_products: true,
          manage_orders: true
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'admin',
        description: 'Administrator with full access',
        permissions: JSON.stringify({
          manage_users: true,
          manage_products: true,
          manage_orders: true,
          manage_roles: true
        }),
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('roles', roles);

    // Get the default user role ID
    const [userRole] = await queryInterface.sequelize.query(
      'SELECT id FROM roles WHERE name = "user" LIMIT 1'
    );

    // Add role_id column to users table
    await queryInterface.addColumn('users', 'role_id', {
      type: Sequelize.STRING(36),
      allowNull: false,
      references: {
        model: 'roles',
        key: 'id'
      },
      defaultValue: userRole[0].id
    });

    // Remove the old role column
    await queryInterface.removeColumn('users', 'role');
  },

  down: async (queryInterface, Sequelize) => {
    // Add back the role column
    await queryInterface.addColumn('users', 'role', {
      type: Sequelize.ENUM('user', 'seller', 'admin'),
      allowNull: false,
      defaultValue: 'user'
    });

    // Remove the role_id column
    await queryInterface.removeColumn('users', 'role_id');

    // Drop the roles table
    await queryInterface.dropTable('roles');
  }
}; 