import React from 'react';
import { FiShoppingBag, FiEye, FiEyeOff, FiX, FiDownload, FiMessageCircle } from 'react-icons/fi';
import { MdStore } from 'react-icons/md';
import { Modal, message } from 'antd';

const SellersTab = ({
  sellers,
  orderFilters,
  setOrderFilters,
  showOrderFilters,
  setShowOrderFilters,
  showAllOrders,
  setShowAllOrders,
  showOrdersForSeller,
  setShowOrdersForSeller,
  defaultOrderLimit,
  expandedOrder,
  setExpandedOrder,
  deliveryItems,
  setDeliveryItems,
  loadingItems,
  setLoadingItems,
  fetchDeliveryItems,
  handleCancelOrder,
  showCancelConfirmation,
  handleCancelClick,
  handleCancelDeliveryItem,
  closeCancelItemModal,
  handleCancelAllOrdersForSeller,
  formatCurrency,
  formatDate,
  getFilteredOrders,
  getDeliveryItemStatusColor,
  renderDeliveryItems,
  confirmationModal,
  setConfirmationModal,
  handleConfirmationOK,
  handleConfirmationCancel
}) => {
  const toggleShowOrders = (sellerId) => {
    setShowOrdersForSeller(prev => ({
      ...prev,
      [sellerId]: !prev[sellerId]
    }));
  };

  const toggleShowAllOrders = (sellerId) => {
    setShowAllOrders(prev => ({
      ...prev,
      [sellerId]: !prev[sellerId]
    }));
  };

  const handleOrderExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
    if (expandedOrder !== orderId && !deliveryItems[orderId]) {
      fetchDeliveryItems(orderId);
    }
  };

  return (
    <>
      {/* Sellers Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden mb-6 sm:mb-8">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-700">
          <h2 className="text-base sm:text-lg font-semibold text-white">Sellers & Their Orders for Users</h2>
          <p className="text-gray-400 text-xs sm:text-sm">View sellers and the orders they're placing for users</p>
        </div>
        
        <div className="overflow-x-auto max-w-full">
          <table className="w-full min-w-[400px]">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[200px]">
                  Seller
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[100px]">
                  Status
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[120px]">
                  Orders Placed
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[120px]">
                  Total Value
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {sellers.map((seller) => {
                const filteredOrders = getFilteredOrders(seller);
                const totalValue = filteredOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
                
                return (
                  <tr key={seller.id} className="hover:bg-gray-700 transition-colors">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                          <MdStore className="text-white text-sm" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {seller.name || seller.email || 'Unknown Seller'}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {seller.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        seller.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {seller.status}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {filteredOrders.length}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatCurrency(totalValue)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Card */}
      {sellers.length > 0 && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Summary</h3>
              <p className="text-gray-400 text-sm">
                {sellers.length} sellers • {sellers.reduce((total, seller) => total + getFilteredOrders(seller).length, 0)} total orders
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">
                {formatCurrency(
                  sellers.reduce((total, seller) => {
                    return total + getFilteredOrders(seller).reduce((sum, order) => sum + (order.totalPrice || 0), 0);
                  }, 0)
                )}
              </p>
              <p className="text-gray-400 text-sm">Total Value</p>
            </div>
          </div>
        </div>
      )}

      {/* Seller Orders for Users Section */}
      <div className="space-y-6">
        {sellers.map((seller) => {
          const filteredOrders = getFilteredOrders(seller);
          const hasOrders = seller.recentOrders && seller.recentOrders.length > 0;
          const hasFilteredOrders = filteredOrders.length > 0;
          
          // Only show seller if they have orders OR if no filters are applied
          const shouldShowSeller = hasOrders && (hasFilteredOrders || !Object.values(orderFilters).some(filter => filter !== 'all' && filter !== ''));
          
          if (!shouldShowSeller) return null;
          
          return (
            <div key={seller.id} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-700 bg-gray-750">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                      <MdStore className="text-white text-lg" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {seller.name || seller.email || 'Unknown Seller'}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {(() => {
                          const filteredOrders = getFilteredOrders(seller);
                          const totalOrders = seller.recentOrders ? seller.recentOrders.length : 0;
                          const filteredCount = filteredOrders.length;
                          const filteredTotal = filteredOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
                          
                          return (
                            <>
                              {filteredCount} of {totalOrders} orders • {formatCurrency(filteredTotal)}
                              {Object.values(orderFilters).some(filter => filter !== 'all' && filter !== '') && (
                                <span className="text-blue-400 ml-2">(filtered)</span>
                              )}
                            </>
                          );
                        })()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                      seller.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {seller.status}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Orders content will be rendered here - this is a simplified version */}
              <div className="p-6">
                <div className="text-center py-3">
                  <div className="flex items-center justify-center gap-3">
                    <FiShoppingBag className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-400">
                      {filteredOrders.length > 0 
                        ? `${filteredOrders.length} orders` 
                        : 'No orders'
                      }
                    </span>
                    <button
                      onClick={() => toggleShowOrders(seller.id)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors flex items-center gap-1"
                    >
                      <FiEye className="w-3 h-3" />
                      Show
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      <Modal
        title={confirmationModal.title}
        open={confirmationModal.visible}
        onOk={handleConfirmationOK}
        onCancel={handleConfirmationCancel}
        okText="Yes"
        cancelText="No"
        okButtonProps={{ className: 'bg-red-600 hover:bg-red-700' }}
      >
        <p>{confirmationModal.content}</p>
      </Modal>
    </>
  );
};

export default SellersTab;
