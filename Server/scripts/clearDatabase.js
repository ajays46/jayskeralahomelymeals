const { sequelize } = require('../src/models');

async function clearDatabase() {
  try {
    // Disable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    // Get all table names
    const [tables] = await sequelize.query('SHOW TABLES');
    
    // Truncate each table
    for (const table of tables) {
      const tableName = Object.values(table)[0];
      console.log(`Truncating table: ${tableName}`);
      await sequelize.query(`TRUNCATE TABLE ${tableName}`);
    }

    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('Database cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
}

clearDatabase(); 