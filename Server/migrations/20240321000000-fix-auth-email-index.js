'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, drop any existing indexes on the email column
    await queryInterface.removeIndex('auths', 'auths_email_unique');
    
    // Then add the new index
    await queryInterface.addIndex('auths', ['email'], {
      unique: true,
      name: 'auths_email_unique'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('auths', 'auths_email_unique');
  }
}; 