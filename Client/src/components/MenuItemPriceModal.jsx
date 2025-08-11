import React, { useState, useEffect } from 'react';
import { FiX, FiEdit, FiTrash2, FiPlus } from 'react-icons/fi';
import { useMenuItemPriceList, useDeleteMenuItemPrice } from '../hooks/adminHook/adminHook';
import ConfirmationModal from './ConfirmationModal';

const MenuItemPriceModal = ({ isOpen, onClose, menuItem }) => {
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    priceId: null,
    priceValue: ''
  });

  // API hooks
  const { data: priceListData, isLoading, error } = useMenuItemPriceList();
  const { mutate: deleteMenuItemPrice, isLoading: isDeleting } = useDeleteMenuItemPrice();

  const allPrices = priceListData?.data || [];
  
  // Filter prices for the current menu item
  const menuItemPrices = allPrices.filter(price => 
    price.menuItemId === menuItem?.id
  );

  const handleDelete = (priceId, totalPrice) => {
    setDeleteModal({
      isOpen: true,
      priceId,
      priceValue: totalPrice
    });
  };

  const confirmDelete = () => {
    if (deleteModal.priceId) {
      deleteMenuItemPrice(deleteModal.priceId);
      setDeleteModal({ isOpen: false, priceId: null, priceValue: '' });
    }
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, priceId: null, priceValue: '' });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal Content */}
        <div 
          className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div>
              <h2 className="text-xl font-semibold text-white">Menu Item Prices</h2>
              <p className="text-gray-400 text-sm mt-1">
                {menuItem?.name} - {menuItem?.product?.productName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <FiX size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Loading prices...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-400 mb-4">Error loading prices</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            ) : menuItemPrices.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiPlus size={32} className="text-gray-400" />
                </div>
                <p className="text-gray-400 mb-2">No prices found for this menu item</p>
                <p className="text-gray-500 text-sm">Add pricing information to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-white mb-3">Current Prices</h3>
                  <div className="space-y-3">
                    {menuItemPrices.map((price) => (
                      <div 
                        key={price.id} 
                        className="flex items-center justify-between p-3 bg-gray-600 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <div className="text-white font-medium">
                              ₹{price.totalPrice?.toFixed(2) || '0.00'}
                            </div>
                            <div className="text-gray-300 text-sm">
                              Company ID: {price.companyId}
                            </div>
                          </div>
                          <div className="text-gray-400 text-xs mt-1">
                            Created: {new Date(price.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDelete(price.id, price.totalPrice)}
                            disabled={isDeleting}
                            className="p-2 text-red-400 hover:text-red-300 transition-colors rounded-md hover:bg-red-900/20"
                            title="Delete Price"
                          >
                            {isDeleting ? (
                              <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <FiTrash2 size={16} />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add New Price Section */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-white mb-3">Add New Price</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Use the admin panel to add new pricing for this menu item.
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      // You can navigate to the admin price creation page here
                      // navigate('/admin/menu-item-prices/create');
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <FiPlus size={16} />
                    Add New Price
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title="Delete Price"
        message={`Are you sure you want to delete the price ₹${deleteModal.priceValue}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </>
  );
};

export default MenuItemPriceModal;
