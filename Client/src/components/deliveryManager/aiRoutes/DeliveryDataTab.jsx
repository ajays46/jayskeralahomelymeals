import React from 'react';
import { FiPackage, FiRefreshCw } from 'react-icons/fi';

/**
 * DeliveryDataTab - Component for displaying delivery data
 * Shows delivery information in a table format with filters
 */
const DeliveryDataTab = ({ 
  deliveryData,
  availableDates,
  selectedDate,
  setSelectedDate,
  selectedSessionFilter,
  setSelectedSessionFilter,
  loading,
  onRefresh
}) => {
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <FiPackage className="text-green-400 text-xl" />
        <h2 className="text-xl font-bold text-white">Delivery Data</h2>
      </div>
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Date
          </label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableDates.map(date => (
              <option key={date.date} value={date.date}>
                {formatDate(date.date)} ({date.count} deliveries)
              </option>
            ))}
            {availableDates.length === 0 && (
              <option value={selectedDate}>{formatDate(selectedDate)}</option>
            )}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Session
          </label>
          <select
            value={selectedSessionFilter}
            onChange={(e) => setSelectedSessionFilter(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
          </select>
        </div>
        
              <div className="flex items-end">
                <button
                  onClick={onRefresh}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
      </div>
      
      {/* Delivery Data Table */}
      <DeliveryDataTable deliveryData={deliveryData} loading={loading} />
    </div>
  );
};

// Delivery Data Table Component
const DeliveryDataTable = ({ deliveryData, loading }) => {
  return (
    <div className="bg-gray-700/50 rounded-lg border border-gray-600 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Order</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Address</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Location</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Packages</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                    <span>Loading delivery data...</span>
                  </div>
                </td>
              </tr>
            ) : deliveryData.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-gray-400">
                  No delivery data found
                </td>
              </tr>
            ) : (
              deliveryData.map((delivery, index) => (
                <tr key={delivery.id || index} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-white">#{delivery.stop_order || index + 1}</td>
                  <td className="px-4 py-3 text-sm text-white">
                    {delivery.delivery_name || delivery.first_name || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {delivery.location || delivery.street || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {delivery.latitude && delivery.longitude ? (
                      <span>{delivery.latitude.toFixed(4)}, {delivery.longitude.toFixed(4)}</span>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-white">
                    {delivery.packages || delivery.quantity || 0}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      delivery.status === 'Completed' 
                        ? 'bg-green-900/30 text-green-400'
                        : delivery.status === 'Pending'
                        ? 'bg-yellow-900/30 text-yellow-400'
                        : 'bg-gray-700 text-gray-300'
                    }`}>
                      {delivery.status || 'Pending'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {deliveryData.length > 0 && (
        <div className="px-4 py-3 bg-gray-800 border-t border-gray-700">
          <p className="text-xs text-gray-400">
            Showing {deliveryData.length} delivery{deliveryData.length !== 1 ? 'ies' : ''}
          </p>
        </div>
      )}
    </div>
  );
};

export default DeliveryDataTab;

