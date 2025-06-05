'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('roles', [
      {
        id: uuidv4(),
        name: 'user',
        description: 'Regular user',
        permissions: JSON.stringify({
          read: ['own_profile', 'own_company'],
          write: ['own_profile']
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'seller',
        description: 'Seller user',
        permissions: JSON.stringify({
          read: ['own_profile', 'own_company', 'products'],
          write: ['own_profile', 'products']
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'admin',
        description: 'Administrator',
        permissions: JSON.stringify({
          read: ['*'],
          write: ['*']
        }),
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('roles', null, {});
  }
}; 