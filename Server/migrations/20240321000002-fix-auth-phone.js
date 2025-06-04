'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, update any NULL values to empty string
    await queryInterface.sequelize.query(
      'UPDATE auths SET phone_number = "" WHERE phone_number IS NULL'
    );

    // Then modify the column to be NOT NULL with default empty string
    await queryInterface.changeColumn('auths', 'phone_number', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: ''
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('auths', 'phone_number', {
      type: Sequelize.STRING,
      allowNull: true
    });
  }
}; 