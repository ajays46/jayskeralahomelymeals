'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, remove any existing indexes
    try {
      await queryInterface.removeIndex('auths', 'auths_email_unique');
    } catch (error) {
      console.log('No existing index to remove');
    }

    // Add a unique constraint to the email column
    await queryInterface.changeColumn('auths', 'email', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the unique constraint
    await queryInterface.changeColumn('auths', 'email', {
      type: Sequelize.STRING,
      allowNull: false
    });
  }
}; 