import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSlide from '../../components/AdminSlide';
import ConfirmationModal from '../../components/ConfirmationModal';
import { FiArrowLeft, FiEdit, FiTrash2, FiSearch, FiFilter } from 'react-icons/fi';
import { useMenuItemList, useDeleteMenuItem } from '../../hooks/adminHook/adminHook';

const MenuItemsTablePage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMealType, setFilterMealType] = useState('');

  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    menuItemId: null,
    menuItemName: ''
  });

  // API hooks
  const { data: menuItemListData, isLoading, error } = useMenuItemList();
  const { mutate: deleteMenuItem, isLoading: isDeleting, isSuccess: deleteSuccess } = useDeleteMenuItem();
  const menuItems = menuItemListData?.data || [];

  // Show success message when item is deleted
  useEffect(() => {
    if (deleteSuccess) {
      // You can add a toast notification here if you have a toast system
      console.log('Menu item deleted successfully');
    }
  }, [deleteSuccess]);

  // Filter and sort menu items
  const filteredAndSortedItems = menuItems
    .filter(item => {
      const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.product?.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.menu?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesMealType = !filterMealType || item.mealType === filterMealType;
      
      return matchesSearch && matchesMealType;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'product':
          aValue = a.product?.productName || '';
          bValue = b.product?.productName || '';
          break;
        case 'menu':
          aValue = a.menu?.name || '';
          bValue = b.menu?.name || '';
          break;

        case 'company':
          aValue = a.menu?.company?.name || '';
          bValue = b.menu?.company?.name || '';
          break;
        default:
          aValue = a.name || '';
          bValue = b.name || '';
      }
      
      if (sortOrder === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

  // Get unique values for filters
  const uniqueMealTypes = [...new Set(menuItems.map(item => item.mealType).filter(Boolean))];

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const handleEdit = (menuItemId) => {
    // Navigate to edit page
    navigate(`/admin/menu-items/${menuItemId}`);
  };

  const handleDelete = (menuItemId, menuItemName) => {
    setDeleteModal({
      isOpen: true,
      menuItemId,
      menuItemName
    });
  };

  const confirmDelete = () => {
    if (deleteModal.menuItemId) {
      deleteMenuItem(deleteModal.menuItemId);
    }
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      menuItemId: null,
      menuItemName: ''
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="hidden md:block">
          <AdminSlide />
        </div>
        <div className="md:ml-14 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading menu items...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="hidden md:block">
          <AdminSlide />
        </div>
        <div className="md:ml-14 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 mb-4">Error loading menu items</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

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
              >
                <FiArrowLeft size={20} />
              </button>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Menu Items Table</h1>
            </div>
            <p className="text-gray-400 text-sm sm:text-base">
              View and manage all menu items in a table format
            </p>
          </div>

          {/* Filters and Search */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                />
              </div>

              {/* Meal Type Filter */}
              <select
                value={filterMealType}
                onChange={(e) => setFilterMealType(e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
              >
                <option value="">All Meal Types</option>
                {uniqueMealTypes.map(mealType => (
                  <option key={mealType} value={mealType}>{mealType}</option>
                ))}
              </select>



              {/* Results Count */}
              <div className="flex items-center justify-end">
                <span className="text-gray-400 text-sm">
                  {filteredAndSortedItems.length} of {menuItems.length} items
                </span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-2">
                        Menu Item Name {getSortIcon('name')}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600"
                      onClick={() => handleSort('product')}
                    >
                      <div className="flex items-center gap-2">
                        Product {getSortIcon('product')}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600"
                      onClick={() => handleSort('menu')}
                    >
                      <div className="flex items-center gap-2">
                        Menu {getSortIcon('menu')}
                      </div>
                    </th>

                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600"
                      onClick={() => handleSort('company')}
                    >
                      <div className="flex items-center gap-2">
                        Company {getSortIcon('company')}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {filteredAndSortedItems.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-400">
                        <div className="flex flex-col items-center">
                          <FiSearch size={32} className="mb-2" />
                          <p>No menu items found</p>
                          <p className="text-sm">Try adjusting your search or filters</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedItems.map((menuItem) => (
                      <tr key={menuItem.id} className="hover:bg-gray-700 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">{menuItem.name}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-300">
                            {menuItem.product?.productName ? 
                              menuItem.product.productName.split(',')[0] : 
                              'N/A'
                            }
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-300">{menuItem.menu?.name || 'N/A'}</div>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-300">{menuItem.menu?.company?.name || 'N/A'}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-600 text-white">
                            Active
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(menuItem.id)}
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                              title="Edit"
                            >
                              <FiEdit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(menuItem.id, menuItem.name)}
                              disabled={isDeleting}
                              className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete"
                            >
                              {isDeleting ? (
                                <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <FiTrash2 size={16} />
                              )}
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title="Delete Menu Item"
        message={`Are you sure you want to delete "${deleteModal.menuItemName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default MenuItemsTablePage; 