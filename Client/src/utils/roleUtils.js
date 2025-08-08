// Utility functions for role management

/**
 * Parse comma-separated role string into array
 * @param {string|Array} roles - Comma-separated role string or array
 * @returns {Array} - Array of role names
 */
export const parseRoles = (roles) => {
  if (!roles) return [];
  if (Array.isArray(roles)) return roles;
  if (typeof roles === 'string') {
    return roles.split(',').map(role => role.trim()).filter(role => role.length > 0);
  }
  return [];
};

/**
 * Check if user has a specific role
 * @param {string|Array} roles - Comma-separated role string or array
 * @param {string} roleName - Role to check for
 * @returns {boolean} - True if user has the role
 */
export const hasRole = (roles, roleName) => {
  const roleArray = parseRoles(roles);
  return roleArray.some(role => role.toLowerCase() === roleName.toLowerCase());
};

/**
 * Check if user has any of the specified roles
 * @param {string|Array} roles - Comma-separated role string or array
 * @param {Array} roleNames - Array of roles to check for
 * @returns {boolean} - True if user has any of the roles
 */
export const hasAnyRole = (roles, roleNames) => {
  const roleArray = parseRoles(roles);
  return roleArray.some(role => 
    roleNames.some(roleName => role.toLowerCase() === roleName.toLowerCase())
  );
};

/**
 * Check if user has all of the specified roles
 * @param {string|Array} roles - Comma-separated role string or array
 * @param {Array} roleNames - Array of roles to check for
 * @returns {boolean} - True if user has all of the roles
 */
export const hasAllRoles = (roles, roleNames) => {
  const roleArray = parseRoles(roles);
  return roleNames.every(roleName => 
    roleArray.some(role => role.toLowerCase() === roleName.toLowerCase())
  );
};

/**
 * Get the primary role (first role in the array)
 * @param {string|Array} roles - Comma-separated role string or array
 * @returns {string|null} - Primary role or null if no roles
 */
export const getPrimaryRole = (roles) => {
  const roleArray = parseRoles(roles);
  if (roleArray.length === 0) return null;
  return roleArray[0];
};

/**
 * Check if user is admin
 * @param {string|Array} roles - Comma-separated role string or array
 * @returns {boolean} - True if user is admin
 */
export const isAdmin = (roles) => hasRole(roles, 'ADMIN');

/**
 * Check if user is seller
 * @param {string|Array} roles - Comma-separated role string or array
 * @returns {boolean} - True if user is seller
 */
export const isSeller = (roles) => hasRole(roles, 'SELLER');

/**
 * Check if user is regular user
 * @param {string|Array} roles - Comma-separated role string or array
 * @returns {boolean} - True if user is regular user
 */
export const isUser = (roles) => hasRole(roles, 'USER');

/**
 * Get role display name
 * @param {string} role - Role name
 * @returns {string} - Display name for the role
 */
export const getRoleDisplayName = (role) => {
  const roleMap = {
    'ADMIN': 'Administrator',
    'SELLER': 'Seller',
    'USER': 'User'
  };
  return roleMap[role] || role;
};

/**
 * Get all role display names
 * @param {string|Array} roles - Comma-separated role string or array
 * @returns {Array} - Array of display names
 */
export const getRoleDisplayNames = (roles) => {
  const roleArray = parseRoles(roles);
  return roleArray.map(role => getRoleDisplayName(role));
};

/**
 * Get role color for styling
 * @param {string} role - Role name
 * @returns {string} - CSS color class
 */
export const getRoleColor = (role) => {
  const roleColors = {
    'ADMIN': 'bg-red-100 text-red-800 border-red-200',
    'SELLER': 'bg-blue-100 text-blue-800 border-blue-200',
    'USER': 'bg-gray-100 text-gray-800 border-gray-200'
  };
  return roleColors[role?.toUpperCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
};

/**
 * Get role icon
 * @param {string} role - Role name
 * @returns {string} - Icon name or component
 */
export const getRoleIcon = (role) => {
  const roleIcons = {
    'ADMIN': '👑',
    'SELLER': '🏪',
    'USER': '👤'
  };
  return roleIcons[role?.toUpperCase()] || '👤';
};

/**
 * Format roles for display (handles both comma-separated and array formats)
 * @param {string|Array} roles - Comma-separated role string or array
 * @returns {Array} - Array of formatted role names
 */
export const formatRolesForDisplay = (roles) => {
  const roleArray = parseRoles(roles);
  return roleArray.map(role => ({
    name: role,
    displayName: getRoleDisplayName(role),
    color: getRoleColor(role),
    icon: getRoleIcon(role)
  }));
};
