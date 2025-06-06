'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('auths', 'phone_number', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('auths', 'phone_number', {
      type: Sequelize.STRING,
      allowNull: false
    });
  }
}; 