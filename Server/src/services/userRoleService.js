import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';

/**
 * User Role Service - Handles user role management and role-based operations
 * Manages user roles, role assignments, and role-based access control
 * Features: Role management, user role assignment, role validation, multi-role support
 */

/**
 * Create a new user with roles (comma-separated format)
 * @param {Object} userData - User data
 * @param {Array} roles - Array of role names (e.g., ['USER', 'ADMIN'])
 * @returns {Object} Created user with roles
 */
export const createUserWithRoles = async (userData, roles = ['USER']) => {
  try {
    const user = await prisma.user.create({
      data: {
        ...userData,
        userRoles: {
          create: [
            {
              name: roles.join(',') // Store as comma-separated string
            }
          ]
        }
      },
      include: {
        userRoles: true,
        auth: true
      }
    });

    return user;
  } catch (error) {
    console.error('Error creating user with roles:', error);
    throw new AppError('Failed to create user with roles', 500);
  }
};

/**
 * Get user with roles in the desired format
 * @param {string} userId - User ID
 * @returns {Object} User with roles
 */
export const getUserWithRoles = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: true,
        auth: true
      }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  } catch (error) {
    console.error('Error getting user with roles:', error);
    throw error;
  }
};

/**
 * Add a role to an existing user
 * @param {string} userId - User ID
 * @param {string} roleName - Role name to add (e.g., 'ADMIN', 'SELLER')
 * @returns {Object} Updated user with roles
 */
export const addRoleToUser = async (userId, roleName) => {
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { userRoles: true }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.userRoles.length === 0) {
      // Create first role record
      const newRole = await prisma.userRole.create({
        data: {
          userId: userId,
          name: roleName
        }
      });
      return newRole;
    }

    // Get existing roles
    const existingRoleRecord = user.userRoles[0];
    const existingRoles = existingRoleRecord.name.split(',').map(r => r.trim());
    
    // Check if role already exists
    if (existingRoles.includes(roleName)) {
      throw new AppError(`User already has role: ${roleName}`, 400);
    }

    // Add new role to existing comma-separated string
    const updatedRoles = [...existingRoles, roleName];
    const updatedRole = await prisma.userRole.update({
      where: { id: existingRoleRecord.id },
      data: { name: updatedRoles.join(',') }
    });

    return updatedRole;
  } catch (error) {
    console.error('Error adding role to user:', error);
    throw error;
  }
};

/**
 * Remove a role from a user
 * @param {string} userId - User ID
 * @param {string} roleName - Role name to remove
 * @returns {Object} Updated role record
 */
export const removeRoleFromUser = async (userId, roleName) => {
  try {
    // Get user with roles
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { userRoles: true }
    });

    if (!user || user.userRoles.length === 0) {
      throw new AppError(`User does not have role: ${roleName}`, 404);
    }

    const existingRoleRecord = user.userRoles[0];
    const existingRoles = existingRoleRecord.name.split(',').map(r => r.trim());
    
    // Check if role exists
    if (!existingRoles.includes(roleName)) {
      throw new AppError(`User does not have role: ${roleName}`, 404);
    }

    // Remove role from comma-separated string
    const updatedRoles = existingRoles.filter(role => role !== roleName);
    
    if (updatedRoles.length === 0) {
      // Delete the role record if no roles left
      const deletedRole = await prisma.userRole.delete({
        where: { id: existingRoleRecord.id }
      });
      return deletedRole;
    } else {
      // Update with remaining roles
      const updatedRole = await prisma.userRole.update({
        where: { id: existingRoleRecord.id },
        data: { name: updatedRoles.join(',') }
      });
      return updatedRole;
    }
  } catch (error) {
    console.error('Error removing role from user:', error);
    throw error;
  }
};

/**
 * Update a user's roles
 * @param {string} roleId - Role ID
 * @param {Array} newRoles - Array of new role names
 * @returns {Object} Updated role
 */
export const updateUserRole = async (roleId, newRoles) => {
  try {
    const updatedRole = await prisma.userRole.update({
      where: { id: roleId },
      data: { name: newRoles.join(',') }
    });

    return updatedRole;
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

/**
 * Get all users with their roles
 * @returns {Array} Array of users with roles
 */
export const getAllUsersWithRoles = async () => {
  try {
    const users = await prisma.user.findMany({
      include: {
        userRoles: true,
        auth: true
      }
    });

    return users;
  } catch (error) {
    console.error('Error getting all users with roles:', error);
    throw new AppError('Failed to get users with roles', 500);
  }
};

/**
 * Check if user has a specific role
 * @param {string} userId - User ID
 * @param {string} roleName - Role name to check
 * @returns {boolean} True if user has the role
 */
export const userHasRole = async (userId, roleName) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { userRoles: true }
    });

    if (!user || user.userRoles.length === 0) {
      return false;
    }

    const roles = user.userRoles[0].name.split(',').map(r => r.trim());
    return roles.includes(roleName);
  } catch (error) {
    console.error('Error checking user role:', error);
    throw error;
  }
};

/**
 * Get all roles for a user
 * @param {string} userId - User ID
 * @returns {Array} Array of role names
 */
export const getUserRoles = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { userRoles: true }
    });

    if (!user || user.userRoles.length === 0) {
      return [];
    }

    const roles = user.userRoles[0].name.split(',').map(r => r.trim());
    return roles;
  } catch (error) {
    console.error('Error getting user roles:', error);
    throw error;
  }
};

/**
 * Get users by role
 * @param {string} roleName - Role name
 * @returns {Array} Array of users with the specified role
 */
export const getUsersByRole = async (roleName) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            name: {
              contains: roleName
            }
          }
        }
      },
      include: {
        userRoles: true,
        auth: true
      }
    });

    return users;
  } catch (error) {
    console.error('Error getting users by role:', error);
    throw error;
  }
};

/**
 * Get users with multiple roles
 * @param {Array} roleNames - Array of role names to check for
 * @returns {Array} Array of users with any of the specified roles
 */
export const getUsersWithAnyRole = async (roleNames) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            OR: roleNames.map(roleName => ({
              name: {
                contains: roleName
              }
            }))
          }
        }
      },
      include: {
        userRoles: true,
        auth: true
      }
    });

    return users;
  } catch (error) {
    console.error('Error getting users with any role:', error);
    throw error;
  }
};

/**
 * Get users with all specified roles
 * @param {Array} roleNames - Array of role names to check for
 * @returns {Array} Array of users with all specified roles
 */
export const getUsersWithAllRoles = async (roleNames) => {
  try {
    const allUsers = await prisma.user.findMany({
      include: {
        userRoles: true,
        auth: true
      }
    });

    // Filter users who have all specified roles
    const usersWithAllRoles = allUsers.filter(user => {
      if (user.userRoles.length === 0) return false;
      
      const userRoles = user.userRoles[0].name.split(',').map(r => r.trim());
      return roleNames.every(roleName => userRoles.includes(roleName));
    });

    return usersWithAllRoles;
  } catch (error) {
    console.error('Error getting users with all roles:', error);
    throw error;
  }
};
