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
        // Database connection established

        // Creating roles table
        await up(sequelize.getQueryInterface());
        // Roles table created successfully

        process.exit(0);
    } catch (error) {
        // Migration failed
        process.exit(1);
    }
}

runMigration(); 