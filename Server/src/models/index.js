import User from './user.js';
import Auth from './auth.js';
import UserRole from './userRole.js'; // ✅ Import the join table model

// Define associations

// Many-to-Many between User and Role

UserRole.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.belongsTo(Auth, { foreignKey: 'auth_id', as: 'auth' });
Auth.hasOne(User, { foreignKey: 'auth_id', as: 'user' });

export { User, Auth, UserRole };