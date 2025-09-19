import React, { memo } from 'react';
import { 
  MdSearch, 
  MdFilterAlt, 
  MdClear, 
  MdReceipt 
} from 'react-icons/md';

const CustomerFilters = memo(({ 
  searchTerm, 
  setSearchTerm, 
  filters, 
  setFilters, 
  showFilters, 
  setShowFilters, 
  sortBy, 
  setSortBy, 
  clearFilters 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex flex-col gap-3">
        {/* Search Bar */}
        <div className="relative">
          <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name, phone, email, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
          />
        </div>

        {/* Filter Toggle and Sort */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                showFilters 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <MdFilterAlt className="w-4 h-4" />
              <span className="hidden xs:inline">Filters</span>
              <span className="xs:hidden">Filter</span>
              {Object.values(filters).some(Boolean) && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {Object.values(filters).filter(Boolean).length}
                </span>
              )}
            </button>
            
            {(Object.values(filters).some(Boolean) || searchTerm) && (
              <button
                onClick={clearFilters}
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MdClear className="w-4 h-4" />
                <span className="hidden xs:inline">Clear Filters</span>
                <span className="xs:hidden">Clear</span>
              </button>
            )}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm w-full sm:w-auto"
          >
            <option value="recent">Recently Added</option>
            <option value="pendingPayments">Payment Receipt Upload</option>
            <option value="hasDraft">Has Draft Orders</option>
            <option value="name">Alphabetical</option>
            <option value="orders">Order Volume</option>
            <option value="revenue">Revenue</option>
          </select>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="text"
                placeholder="Filter by phone..."
                value={filters.phoneNumber}
                onChange={(e) => setFilters(prev => ({ ...prev, phoneNumber: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                placeholder="Filter by name..."
                value={filters.name}
                onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                type="text"
                placeholder="Filter by city/street..."
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.recentlyAdded}
                  onChange={(e) => setFilters(prev => ({ ...prev, recentlyAdded: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Show only customers added in the last 30 days</span>
              </label>
            </div>

            <div className="sm:col-span-2 lg:col-span-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.pendingPayments}
                  onChange={(e) => setFilters(prev => ({ ...prev, pendingPayments: e.target.checked }))}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <MdReceipt className="w-4 h-4 text-orange-600" />
                  Show only customers with pending payment receipts
                </span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

CustomerFilters.displayName = 'CustomerFilters';

export default CustomerFilters;
