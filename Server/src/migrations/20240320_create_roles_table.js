import { DataTypes } from 'sequelize';

const createRolesTable = async (queryInterface) => {
    // Create roles table
    await queryInterface.createTable('roles', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {
            type: DataTypes.ENUM('user', 'seller', 'admin'),
            allowNull: false,
            unique: true
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    });

    // Insert default roles
    await queryInterface.bulkInsert('roles', [
        {
            id: DataTypes.UUIDV4,
            name: 'user',
            created_at: new Date(),
            updated_at: new Date()
        },
        {
            id: DataTypes.UUIDV4,
            name: 'seller',
            created_at: new Date(),
            updated_at: new Date()
        },
        {
            id: DataTypes.UUIDV4,
            name: 'admin',
            created_at: new Date(),
            updated_at: new Date()
        }
    ]);
};

const dropRolesTable = async (queryInterface) => {
    await queryInterface.dropTable('roles');
};

export { createRolesTable, dropRolesTable }; 