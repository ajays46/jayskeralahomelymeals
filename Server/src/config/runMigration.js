import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { up } from '../migrations/create_roles_table.js';

dotenv.config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false
    }
);

async function runMigration() {
    try {
        await sequelize.authenticate();
        console.log('Database connection established.');

        console.log('Creating roles table...');
        await up(sequelize.getQueryInterface());
        console.log('Roles table created successfully!');

        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration(); 