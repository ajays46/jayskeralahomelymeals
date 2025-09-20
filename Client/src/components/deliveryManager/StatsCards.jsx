import React from 'react';
import { FiShoppingBag, FiTrendingUp, FiUsers } from 'react-icons/fi';
import { MdStore, MdAttachMoney } from 'react-icons/md';

const StatsCards = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
      <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-gray-400 text-xs sm:text-sm font-medium">Total Sellers</p>
            <p className="text-xl sm:text-2xl font-bold text-white">{stats.totalSellers}</p>
          </div>
          <div className="p-2 sm:p-3 bg-blue-500/20 rounded-full flex-shrink-0">
            <MdStore className="text-xl sm:text-2xl text-blue-500" />
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-gray-400 text-xs sm:text-sm font-medium">Orders Placed</p>
            <p className="text-xl sm:text-2xl font-bold text-white">{stats.totalOrders}</p>
          </div>
          <div className="p-2 sm:p-3 bg-green-500/20 rounded-full flex-shrink-0">
            <FiShoppingBag className="text-xl sm:text-2xl text-green-500" />
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-gray-400 text-xs sm:text-sm font-medium">Total Revenue</p>
            <p className="text-xl sm:text-2xl font-bold text-white">₹{stats.totalRevenue?.toLocaleString() || '0'}</p>
          </div>
          <div className="p-2 sm:p-3 bg-yellow-500/20 rounded-full flex-shrink-0">
            <MdAttachMoney className="text-xl sm:text-2xl text-yellow-500" />
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-gray-400 text-xs sm:text-sm font-medium">Active Sellers</p>
            <p className="text-xl sm:text-2xl font-bold text-white">{stats.activeSellers}</p>
          </div>
          <div className="p-2 sm:p-3 bg-purple-500/20 rounded-full flex-shrink-0">
            <FiUsers className="text-xl sm:text-2xl text-purple-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;
