import { DataTypes } from 'sequelize';

const addRoleIdToUsers = async (queryInterface) => {
    // First, get the default user role ID
    const [roles] = await queryInterface.sequelize.query(
        `SELECT id FROM roles WHERE name = 'user' LIMIT 1`
    );
    
    const defaultRoleId = roles[0]?.id;

    // Add role_id column to users table
    await queryInterface.addColumn('users', 'role_id', {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'roles',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        defaultValue: defaultRoleId // Set default role as 'user'
    });
};

const removeRoleIdFromUsers = async (queryInterface) => {
    await queryInterface.removeColumn('users', 'role_id');
};

export { addRoleIdToUsers, removeRoleIdFromUsers }; 