import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { createRolesTable } from '../migrations/20240320_create_roles_table.js';
import { addRoleIdToUsers } from '../migrations/20240320_add_role_id_to_users.js';

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

async function runMigrations() {
    try {
        await sequelize.authenticate();
        console.log('Database connection established.');

        // Run migrations
        console.log('Creating roles table...');
        await createRolesTable(sequelize.getQueryInterface());
        console.log('Roles table created successfully.');

        console.log('Adding role_id to users table...');
        await addRoleIdToUsers(sequelize.getQueryInterface());
        console.log('Role_id column added successfully.');

        console.log('All migrations completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigrations(); 