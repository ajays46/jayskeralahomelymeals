import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSlide from '../../components/AdminSlide';
import { FiArrowLeft, FiSearch, FiFilter, FiEye, FiEdit, FiTrash2, FiUser, FiMail, FiPhone, FiCalendar, FiShield } from 'react-icons/fi';

const UsersPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  // Mock data - replace with actual API call
  const [users, setUsers] = useState([
    {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+91 98765 43210',
      role: 'USER',
      status: 'ACTIVE',
      createdAt: '2024-01-15',
      lastLogin: '2024-12-20',
      company: 'JKHM Foods',
      address: 'Kochi, Kerala'
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '+91 98765 43211',
      role: 'SELLER',
      status: 'ACTIVE',
      createdAt: '2024-02-20',
      lastLogin: '2024-12-19',
      company: 'Fresh Kitchen',
      address: 'Mumbai, Maharashtra'
    },
    {
      id: '3',
      name: 'Admin User',
      email: 'admin@jaykeralahm.com',
      phone: '+91 98765 43212',
      role: 'ADMIN',
      status: 'ACTIVE',
      createdAt: '2024-01-01',
      lastLogin: '2024-12-20',
      company: 'JayKeralaHM',
      address: 'Kochi, Kerala'
    },
    {
      id: '4',
      name: 'Mike Johnson',
      email: 'mike.j@example.com',
      phone: '+91 98765 43213',
      role: 'USER',
      status: 'INACTIVE',
      createdAt: '2024-03-10',
      lastLogin: '2024-11-15',
      company: 'Home Delights',
      address: 'Bangalore, Karnataka'
    },
    {
      id: '5',
      name: 'Sarah Wilson',
      email: 'sarah.w@example.com',
      phone: '+91 98765 43214',
      role: 'SELLER',
      status: 'ACTIVE',
      createdAt: '2024-04-05',
      lastLogin: '2024-12-18',
      company: 'Tasty Treats',
      address: 'Chennai, Tamil Nadu'
    }
  ]);

  // Memoized filtered and sorted users
  const filteredAndSortedUsers = useMemo(() => {
    return users
      .filter(user => {
        const matchesSearch = !searchTerm || 
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.phone.includes(searchTerm) ||
          user.company.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesRole = !filterRole || user.role === filterRole;
        const matchesStatus = !filterStatus || user.status === filterStatus;
        
        return matchesSearch && matchesRole && matchesStatus;
      })
      .sort((a, b) => {
        let aValue, bValue;
        
        switch (sortBy) {
          case 'name':
            aValue = a.name;
            bValue = b.name;
            break;
          case 'email':
            aValue = a.email;
            bValue = b.email;
            break;
          case 'role':
            aValue = a.role;
            bValue = b.role;
            break;
          case 'status':
            aValue = a.status;
            bValue = b.status;
            break;
          case 'createdAt':
            aValue = new Date(a.createdAt);
            bValue = new Date(b.createdAt);
            break;
          case 'lastLogin':
            aValue = new Date(a.lastLogin);
            bValue = new Date(b.lastLogin);
            break;
          default:
            aValue = a.name;
            bValue = b.name;
        }
        
        if (sortOrder === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
  }, [users, searchTerm, filterRole, filterStatus, sortBy, sortOrder]);

  // Memoized unique values for filters
  const uniqueRoles = useMemo(() => [...new Set(users.map(user => user.role))], [users]);
  const uniqueStatuses = useMemo(() => [...new Set(users.map(user => user.status))], [users]);

  // Event handlers
  const handleSort = useCallback((column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  }, [sortBy, sortOrder]);

  const getSortIcon = useCallback((column) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  }, [sortBy, sortOrder]);

  const handleViewUser = useCallback((user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  }, []);

  const handleEditUser = useCallback((userId) => {
    navigate(`/admin/users/${userId}/edit`);
  }, [navigate]);

  const handleDeleteUser = useCallback((userId) => {
    // Implement delete functionality
    setUsers(prev => prev.filter(user => user.id !== userId));
  }, []);

  const closeUserModal = useCallback(() => {
    setShowUserModal(false);
    setSelectedUser(null);
  }, []);

  const getRoleColor = useCallback((role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'SELLER':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'USER':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }, []);

  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'INACTIVE':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }, []);

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
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => navigate('/admin')}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Go back to admin dashboard"
              >
                <FiArrowLeft size={20} />
              </button>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Users Management</h1>
            </div>
            <p className="text-gray-400 text-sm sm:text-base">
              View and manage all users in the system
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm">Total Users</p>
                  <p className="text-2xl font-bold text-white">{users.length}</p>
                </div>
                <FiUser className="text-blue-200 text-2xl" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-200 text-sm">Active Users</p>
                  <p className="text-2xl font-bold text-white">{users.filter(u => u.status === 'ACTIVE').length}</p>
                </div>
                <FiShield className="text-green-200 text-2xl" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-sm">Sellers</p>
                  <p className="text-2xl font-bold text-white">{users.filter(u => u.role === 'SELLER').length}</p>
                </div>
                <FiUser className="text-purple-200 text-2xl" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-200 text-sm">Regular Users</p>
                  <p className="text-2xl font-bold text-white">{users.filter(u => u.role === 'USER').length}</p>
                </div>
                <FiUser className="text-orange-200 text-2xl" />
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                  aria-label="Search users"
                />
              </div>

              {/* Role Filter */}
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
              >
                <option value="">All Roles</option>
                {uniqueRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
              >
                <option value="">All Statuses</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>

              {/* Results Count */}
              <div className="flex items-center justify-end">
                <span className="text-gray-400 text-sm">
                  {filteredAndSortedUsers.length} of {users.length} users
                </span>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full" role="table" aria-label="Users table">
                <thead className="bg-gray-700">
                  <tr>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-2">
                        Name {getSortIcon('name')}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600"
                      onClick={() => handleSort('email')}
                    >
                      <div className="flex items-center gap-2">
                        Email {getSortIcon('email')}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600"
                      onClick={() => handleSort('role')}
                    >
                      <div className="flex items-center gap-2">
                        Role {getSortIcon('role')}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-2">
                        Status {getSortIcon('status')}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center gap-2">
                        Created {getSortIcon('createdAt')}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {filteredAndSortedUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-400">
                        <div className="flex flex-col items-center">
                          <FiUser size={32} className="mb-2" />
                          <p>No users found</p>
                          <p className="text-sm">Try adjusting your search or filters</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-700 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                                <span className="text-sm font-medium text-white">
                                  {user.name.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-white">{user.name}</div>
                              <div className="text-sm text-gray-400">{user.company}</div>
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
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(user.status)}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-300">
                            <div className="flex items-center gap-2">
                              <FiCalendar className="text-gray-400" size={14} />
                              {new Date(user.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              Last: {new Date(user.lastLogin).toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewUser(user)}
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                              title="View User Details"
                            >
                              <FiEye size={16} />
                            </button>
                            <button
                              onClick={() => handleEditUser(user.id)}
                              className="text-green-400 hover:text-green-300 transition-colors"
                              title="Edit User"
                            >
                              <FiEdit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                              title="Delete User"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile footer navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <AdminSlide isFooter={true} />
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <FiUser className="text-2xl" />
                  User Details
                </h2>
                <button
                  onClick={closeUserModal}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-xl font-bold text-white">
                    {selectedUser.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedUser.name}</h3>
                  <p className="text-gray-400">{selectedUser.company}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <FiMail className="text-gray-400" size={16} />
                  <span className="text-gray-300">{selectedUser.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <FiPhone className="text-gray-400" size={16} />
                  <span className="text-gray-300">{selectedUser.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <FiShield className="text-gray-400" size={16} />
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(selectedUser.role)}`}>
                    {selectedUser.role}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <FiCalendar className="text-gray-400" size={16} />
                  <span className="text-gray-300">Created: {new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-3">
                  <FiUser className="text-gray-400" size={16} />
                  <span className="text-gray-300">Last Login: {new Date(selectedUser.lastLogin).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-700">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Address</h4>
                <p className="text-gray-400">{selectedUser.address}</p>
              </div>
            </div>
            
            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => handleEditUser(selectedUser.id)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Edit User
              </button>
              <button
                onClick={closeUserModal}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
