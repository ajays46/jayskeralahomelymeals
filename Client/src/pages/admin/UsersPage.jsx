import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSlide from '../../components/AdminSlide';
import { FiArrowLeft, FiUser, FiMail, FiPhone, FiLock, FiPlus, FiHome } from 'react-icons/fi';
import { useCompanyList, useUserRoles, useAdminUsers, useCreateAdminUser } from '../../hooks/adminHook/adminHook';

/**
 * UsersPage - Simple admin user management page
 * 
 * Features:
 * - Create new users with specific roles and contact information
 * - View created users in a simple list
 * 
 * Backend Integration:
 * - Companies: Fetched using useCompanyList admin hook
 * - Roles: Fetched using useUserRoles admin hook
 * - Users: Fetched using useAdminUsers admin hook
 * - User Creation: Uses useCreateAdminUser admin hook
 */

const UsersPage = () => {
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Fetch companies and roles
  const { data: companyList, isLoading: loadingCompanies, refetch: fetchCompanies } = useCompanyList();
  const companies = companyList?.data || companyList || [];

  const { data: rolesData, isLoading: loadingRoles } = useUserRoles();
  const availableRoles = rolesData?.data || [];

  // Fetch users from backend
  const { data: usersData, isLoading: loadingUsers, refetch: fetchUsers, error: usersError } = useAdminUsers();
  const users = usersData?.data || [];

  // User creation mutation
  const { mutate: createUser, isPending: isCreatingUser } = useCreateAdminUser();

  // Create user form state
  const [createUserForm, setCreateUserForm] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: '',
    roles: [], // Multiple roles support
    companyId: '',
    // Contact information
    firstName: '',
    lastName: ''
  });

  const [createUserErrors, setCreateUserErrors] = useState({});

  // Create user handlers
  const handleCreateUserInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setCreateUserForm(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (createUserErrors[name]) {
      setCreateUserErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [createUserErrors]);

  // Handle role checkbox changes
  const handleRoleChange = useCallback((roleValue) => {
    setCreateUserForm(prev => {
      const currentRoles = prev.roles || [];
      const newRoles = currentRoles.includes(roleValue)
        ? currentRoles.filter(role => role !== roleValue)
        : [...currentRoles, roleValue];
      
      return {
        ...prev,
        roles: newRoles
      };
    });
    
    // Clear role error when user selects roles
    if (createUserErrors.roles) {
      setCreateUserErrors(prev => ({ ...prev, roles: '' }));
    }
  }, [createUserErrors]);

  const validateCreateUserForm = useCallback(() => {
    const errors = {};

    if (!createUserForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(createUserForm.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!createUserForm.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(createUserForm.phone.replace(/\s/g, ''))) {
      errors.phone = 'Please enter a valid phone number';
    }

    if (!createUserForm.password) {
      errors.password = 'Password is required';
    } else if (createUserForm.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (!createUserForm.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (createUserForm.password !== createUserForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Validate roles - either single role or multiple roles
    if (!createUserForm.role && (!createUserForm.roles || createUserForm.roles.length === 0)) {
      errors.roles = 'Please select at least one role';
    }

    if (!createUserForm.companyId) {
      errors.companyId = 'Please select a company';
    }

    // Contact validation
    if (!createUserForm.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!createUserForm.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }



    setCreateUserErrors(errors);
    return Object.keys(errors).length === 0;
  }, [createUserForm]);

  const handleCreateUser = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateCreateUserForm()) {
      return;
    }

    // Create user data for the API
    const userData = {
      email: createUserForm.email,
      phone: createUserForm.phone,
      password: createUserForm.password,
      companyId: createUserForm.companyId,
      // Send multiple roles if available, otherwise single role
      ...(createUserForm.roles && createUserForm.roles.length > 0 
        ? { roles: createUserForm.roles }
        : { role: createUserForm.role }
      ),
      // Contact information
      contact: {
        firstName: createUserForm.firstName,
        lastName: createUserForm.lastName,
        phoneNumbers: [
          {
            type: 'PRIMARY',
            number: createUserForm.phone
          }
        ]
      }
    };

    // Call the API to create user
    createUser(userData);
    
    // Reset form
    setCreateUserForm({
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      role: '',
      roles: [],
      companyId: '',
      firstName: '',
      lastName: ''
    });
    setCreateUserErrors({});
    
    // Hide the form after successful creation
    setShowCreateForm(false);
  }, [createUserForm, validateCreateUserForm, createUser]);

  const toggleCreateForm = useCallback(() => {
    setShowCreateForm(prev => !prev);
    if (!showCreateForm) {
      // Reset form when opening
      setCreateUserForm({
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: '',
        roles: [],
        companyId: '',
        firstName: '',
        lastName: ''
      });
      setCreateUserErrors({});
    }
  }, [showCreateForm]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <AdminSlide />
      </div>

      {/* Main content */}
      <div className="md:ml-14 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/jkhm/admin')}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Go back to admin dashboard"
              >
                <FiArrowLeft size={20} />
              </button>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Users Management</h1>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={fetchUsers}
                  disabled={loadingUsers}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <FiHome size={16} />
                  {loadingUsers ? 'Refreshing...' : 'Refresh Users'}
                </button>
                <button
                  onClick={toggleCreateForm}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <FiPlus size={16} />
                  {showCreateForm ? 'Hide Form' : 'Create User'}
                </button>
              </div>
            </div>
            <p className="text-gray-400 text-sm sm:text-base">
              Create and manage users in the system
            </p>
          </div>

          {/* Create User Form */}
          {showCreateForm && (
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FiUser size={20} />
                Create New User
              </h2>
              
              <form onSubmit={handleCreateUser} className="space-y-6">
                {/* Basic Information */}
                <div className="border-b border-gray-600 pb-6">
                  <h3 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
                    <FiMail size={18} />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={createUserForm.email}
                      onChange={handleCreateUserInputChange}
                      className={`w-full px-3 py-2 bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white ${
                        createUserErrors.email ? 'border-red-500' : 'border-gray-600'
                      }`}
                      placeholder="Enter email address"
                    />
                    {createUserErrors.email && (
                      <p className="text-red-400 text-sm mt-1">{createUserErrors.email}</p>
                    )}
            </div>
            
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={createUserForm.phone}
                      onChange={handleCreateUserInputChange}
                      className={`w-full px-3 py-2 bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white ${
                        createUserErrors.phone ? 'border-red-500' : 'border-gray-600'
                      }`}
                      placeholder="Enter phone number"
                    />
                    {createUserErrors.phone && (
                      <p className="text-red-400 text-sm mt-1">{createUserErrors.phone}</p>
                    )}
              </div>
            </div>
            
                {/* Authentication */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Password *
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={createUserForm.password}
                      onChange={handleCreateUserInputChange}
                      className={`w-full px-3 py-2 bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white ${
                        createUserErrors.password ? 'border-red-500' : 'border-gray-600'
                      }`}
                      placeholder="Enter password"
                    />
                    {createUserErrors.password && (
                      <p className="text-red-400 text-sm mt-1">{createUserErrors.password}</p>
                    )}
            </div>
            
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={createUserForm.confirmPassword}
                      onChange={handleCreateUserInputChange}
                      className={`w-full px-3 py-2 bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white ${
                        createUserErrors.confirmPassword ? 'border-red-500' : 'border-gray-600'
                      }`}
                      placeholder="Confirm password"
                    />
                    {createUserErrors.confirmPassword && (
                      <p className="text-red-400 text-sm mt-1">{createUserErrors.confirmPassword}</p>
                    )}
            </div>
          </div>
                </div>

                {/* Role and Company */}
                <div className="border-t border-gray-600 pt-6 mt-6">
                  <h3 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
                    <FiHome size={18} />
                    Role & Company Assignment
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      User Roles * (Select one or more)
                    </label>
                    <div className="space-y-2">
                      {availableRoles.map(role => (
                        <label key={role.value} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            value={role.value}
                            checked={createUserForm.roles?.includes(role.value) || false}
                            onChange={() => handleRoleChange(role.value)}
                            disabled={loadingRoles}
                            className={`w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 ${
                              loadingRoles ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          />
                          <span className="text-sm text-gray-300">{role.label}</span>
                        </label>
                      ))}
                    </div>
                    {createUserErrors.roles && (
                      <p className="text-red-400 text-sm mt-1">{createUserErrors.roles}</p>
                    )}
                    {createUserForm.roles && createUserForm.roles.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-400">
                          Selected: {createUserForm.roles.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Company *
                    </label>
              <select
                      name="companyId"
                      value={createUserForm.companyId}
                      onChange={handleCreateUserInputChange}
                      disabled={loadingCompanies}
                      className={`w-full px-3 py-2 bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white ${
                        createUserErrors.companyId ? 'border-red-500' : 'border-gray-600'
                      } ${loadingCompanies ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <option value="">
                        {loadingCompanies ? 'Loading companies...' : 'Select a company'}
                      </option>
                      {companies.map(company => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                ))}
              </select>
                    {createUserErrors.companyId && (
                      <p className="text-red-400 text-sm mt-1">{createUserErrors.companyId}</p>
                    )}
            </div>
          </div>
                </div>

                {/* Contact Information */}
                <div className="border-t border-gray-600 pt-6 mt-6">
                  <h3 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
                    <FiUser size={18} />
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={createUserForm.firstName}
                        onChange={handleCreateUserInputChange}
                        className={`w-full px-3 py-2 bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white ${
                          createUserErrors.firstName ? 'border-red-500' : 'border-gray-600'
                        }`}
                        placeholder="Enter first name"
                      />
                      {createUserErrors.firstName && (
                        <p className="text-red-400 text-sm mt-1">{createUserErrors.firstName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={createUserForm.lastName}
                        onChange={handleCreateUserInputChange}
                        className={`w-full px-3 py-2 bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white ${
                          createUserErrors.lastName ? 'border-red-500' : 'border-gray-600'
                        }`}
                        placeholder="Enter last name"
                      />
                      {createUserErrors.lastName && (
                        <p className="text-red-400 text-sm mt-1">{createUserErrors.lastName}</p>
                      )}
                    </div>
                  </div>

                </div>

                

                {/* Form Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isCreatingUser}
                    className={`flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                      isCreatingUser ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isCreatingUser ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Creating User...
                      </>
                    ) : (
                      <>
                        <FiUser size={16} />
                        Create User
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={toggleCreateForm}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Users List */}
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">System Users ({users.length})</h2>
            </div>
            
            {loadingUsers ? (
              <div className="p-8 text-center text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-lg">Loading users...</p>
              </div>
            ) : usersError ? (
              <div className="p-8 text-center text-red-400">
                <FiUser size={48} className="mx-auto mb-4 text-red-600" />
                <p className="text-lg font-semibold">Error Loading Users</p>
                <p className="text-sm mb-4">{usersError.message}</p>
                <button
                  onClick={fetchUsers}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <FiUser size={48} className="mx-auto mb-4 text-gray-600" />
                <p className="text-lg">No users found</p>
                <p className="text-sm">Click "Create User" to add your first user</p>
              </div>
            ) : (
            <div className="overflow-x-auto">
                <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Contact
                    </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Role
                    </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Company
                    </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Status
                    </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Created By
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-700 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                                <span className="text-sm font-medium text-white">
                                  {user.contact?.firstName && user.contact?.lastName 
                                    ? `${user.contact.firstName[0]}${user.contact.lastName[0]}`
                                    : user.name?.split(' ').map(n => n[0]).join('') || 'U'
                                  }
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-white">
                                {user.contact?.firstName && user.contact?.lastName 
                                  ? `${user.contact.firstName} ${user.contact.lastName}`
                                  : user.name || 'Unknown User'
                                }
                              </div>

                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-300">
                            <div className="flex items-center gap-2">
                              <FiMail className="text-gray-400" size={14} />
                              {user.email}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <FiPhone className="text-gray-400" size={14} />
                              {user.phone}
                            </div>

                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {user.roles && user.roles.length > 0 ? (
                              user.roles.map((role, index) => (
                                <span 
                                  key={index}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                                >
                                  {role}
                                </span>
                              ))
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                {user.primaryRole || 'USER'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-300">{user.company}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.status === 'ACTIVE' 
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : user.status === 'BLOCKED'
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-300">
                            {user.createdBy || 'Unknown'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-300">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile footer navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <AdminSlide isFooter={true} />
      </div>
    </div>
  );
};

export default UsersPage;
