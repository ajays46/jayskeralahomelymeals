import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { logCritical, logError, logInfo, logTransaction, logPerformance, LOG_CATEGORIES } from '../utils/criticalLogger.js';

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
  const startTime = Date.now();
  const logContext = {
    userId,
    roleName,
    timestamp: new Date().toISOString()
  };

  try {
    logInfo(LOG_CATEGORIES.USER_ROLES, 'Adding role to user', logContext);
    
    return await prisma.$transaction(async (tx) => {
      logTransaction('User Role Addition Transaction Started', {
        userId,
        roleName
      });

      // Check if user exists within transaction
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: { userRoles: true }
      });

      if (!user) {
        logError(LOG_CATEGORIES.USER_ROLES, 'User not found for role addition', logContext);
        throw new AppError('User not found', 404);
      }

      if (user.userRoles.length === 0) {
        // Create first role record atomically
        const newRole = await tx.userRole.create({
          data: {
            userId: userId,
            name: roleName
          }
        });
        
        logInfo(LOG_CATEGORIES.USER_ROLES, 'First role created for user', {
          ...logContext,
          roleId: newRole.id
        });
        
        return newRole;
      }

      // Get existing roles within transaction (prevents race conditions)
      const existingRoleRecord = user.userRoles[0];
      const existingRoles = existingRoleRecord.name.split(',').map(r => r.trim());
      
      // Check if role already exists
      if (existingRoles.includes(roleName)) {
        logError(LOG_CATEGORIES.USER_ROLES, 'User already has role', {
          ...logContext,
          existingRoles: existingRoles
        });
        throw new AppError(`User already has role: ${roleName}`, 400);
      }

      // Add new role to existing comma-separated string atomically
      const updatedRoles = [...existingRoles, roleName];
      const updatedRole = await tx.userRole.update({
        where: { id: existingRoleRecord.id },
        data: { name: updatedRoles.join(',') }
      });

      logInfo(LOG_CATEGORIES.USER_ROLES, 'Role added to user successfully', {
        ...logContext,
        roleId: updatedRole.id,
        updatedRoles: updatedRoles
      });

      return updatedRole;
    }, {
      isolationLevel: 'ReadCommitted', // Prevent dirty reads
      timeout: 10000, // 10 second timeout
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logCritical(LOG_CATEGORIES.USER_ROLES, 'Failed to add role to user', {
      ...logContext,
      error: error.message,
      code: error.code,
      duration: `${duration}ms`,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    // Handle specific transaction errors
    if (error.code === 'P2034') {
      logError(LOG_CATEGORIES.USER_ROLES, 'User role transaction timeout', {
        ...logContext,
        timeout: '10 seconds'
      });
      throw new AppError('Operation timed out, please try again', 408);
    } else if (error.code === 'P2002') {
      logError(LOG_CATEGORIES.USER_ROLES, 'User role constraint violation', {
        ...logContext,
        constraint: 'unique constraint'
      });
      throw new AppError('Role already exists or constraint violation', 409);
    } else if (error.code === 'P2025') {
      logError(LOG_CATEGORIES.USER_ROLES, 'User role record not found', {
        ...logContext,
        recordType: 'user or role'
      });
      throw new AppError('Record not found', 404);
    }
    
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
  const startTime = Date.now();
  const logContext = {
    userId,
    roleName,
    timestamp: new Date().toISOString()
  };

  try {
    logInfo(LOG_CATEGORIES.USER_ROLES, 'Removing role from user', logContext);
    
    return await prisma.$transaction(async (tx) => {
      logTransaction('User Role Removal Transaction Started', {
        userId,
        roleName
      });

      // Get user with roles within transaction
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: { userRoles: true }
      });

      if (!user || user.userRoles.length === 0) {
        logError(LOG_CATEGORIES.USER_ROLES, 'User or role not found for removal', logContext);
        throw new AppError(`User does not have role: ${roleName}`, 404);
      }

      const existingRoleRecord = user.userRoles[0];
      const existingRoles = existingRoleRecord.name.split(',').map(r => r.trim());
      
      // Check if role exists
      if (!existingRoles.includes(roleName)) {
        logError(LOG_CATEGORIES.USER_ROLES, 'User does not have specified role', {
          ...logContext,
          existingRoles: existingRoles
        });
        throw new AppError(`User does not have role: ${roleName}`, 404);
      }

      // Remove role from comma-separated string
      const updatedRoles = existingRoles.filter(role => role !== roleName);
      
      if (updatedRoles.length === 0) {
        // Delete the role record if no roles left (atomically)
        const deletedRole = await tx.userRole.delete({
          where: { id: existingRoleRecord.id }
        });
        
        logInfo(LOG_CATEGORIES.USER_ROLES, 'Last role removed, role record deleted', {
          ...logContext,
          roleId: deletedRole.id
        });
        
        return deletedRole;
      } else {
        // Update with remaining roles (atomically)
        const updatedRole = await tx.userRole.update({
          where: { id: existingRoleRecord.id },
          data: { name: updatedRoles.join(',') }
        });
        
        logInfo(LOG_CATEGORIES.USER_ROLES, 'Role removed from user successfully', {
          ...logContext,
          roleId: updatedRole.id,
          remainingRoles: updatedRoles
        });
        
        return updatedRole;
      }
    }, {
      isolationLevel: 'ReadCommitted', // Prevent dirty reads
      timeout: 10000, // 10 second timeout
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logCritical(LOG_CATEGORIES.USER_ROLES, 'Failed to remove role from user', {
      ...logContext,
      error: error.message,
      code: error.code,
      duration: `${duration}ms`,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    // Handle specific transaction errors
    if (error.code === 'P2034') {
      logError(LOG_CATEGORIES.USER_ROLES, 'User role removal transaction timeout', {
        ...logContext,
        timeout: '10 seconds'
      });
      throw new AppError('Operation timed out, please try again', 408);
    } else if (error.code === 'P2025') {
      logError(LOG_CATEGORIES.USER_ROLES, 'User role record not found', {
        ...logContext,
        recordType: 'user or role'
      });
      throw new AppError('Record not found', 404);
    } else if (error.code === 'P2003') {
      logError(LOG_CATEGORIES.USER_ROLES, 'User role foreign key constraint violation', {
        ...logContext,
        constraint: 'foreign key'
      });
      throw new AppError('Foreign key constraint violation', 409);
    }
    
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
  const startTime = Date.now();
  const logContext = {
    roleId,
    newRoles: newRoles,
    timestamp: new Date().toISOString()
  };

  try {
    logInfo(LOG_CATEGORIES.USER_ROLES, 'Updating user role', logContext);
    
    return await prisma.$transaction(async (tx) => {
      logTransaction('User Role Update Transaction Started', {
        roleId,
        newRoles: newRoles
      });

      // Check if role exists within transaction
      const existingRole = await tx.userRole.findUnique({
        where: { id: roleId }
      });

      if (!existingRole) {
        logError(LOG_CATEGORIES.USER_ROLES, 'Role not found for update', logContext);
        throw new AppError('Role not found', 404);
      }

      // Update role atomically
      const updatedRole = await tx.userRole.update({
        where: { id: roleId },
        data: { name: newRoles.join(',') }
      });

      logInfo(LOG_CATEGORIES.USER_ROLES, 'User role updated successfully', {
        ...logContext,
        oldRoles: existingRole.name,
        newRoles: newRoles.join(',')
      });

      return updatedRole;
    }, {
      isolationLevel: 'ReadCommitted', // Prevent dirty reads
      timeout: 10000, // 10 second timeout
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logCritical(LOG_CATEGORIES.USER_ROLES, 'Failed to update user role', {
      ...logContext,
      error: error.message,
      code: error.code,
      duration: `${duration}ms`,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    // Handle specific transaction errors
    if (error.code === 'P2034') {
      logError(LOG_CATEGORIES.USER_ROLES, 'User role update transaction timeout', {
        ...logContext,
        timeout: '10 seconds'
      });
      throw new AppError('Operation timed out, please try again', 408);
    } else if (error.code === 'P2025') {
      logError(LOG_CATEGORIES.USER_ROLES, 'User role record not found', {
        ...logContext,
        recordType: 'role'
      });
      throw new AppError('Role not found', 404);
    } else if (error.code === 'P2002') {
      logError(LOG_CATEGORIES.USER_ROLES, 'User role unique constraint violation', {
        ...logContext,
        constraint: 'unique constraint'
      });
      throw new AppError('Unique constraint violation', 409);
    }
    
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
