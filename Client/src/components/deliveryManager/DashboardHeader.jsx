import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { MdLocalShipping, MdStore } from 'react-icons/md';
import { isSeller } from '../../utils/roleUtils';
import { useCompanyBasePath } from '../../context/TenantContext';

const DashboardHeader = ({ activeTab, roles }) => {
  const navigate = useNavigate();
  const basePath = useCompanyBasePath();

  return (
    <div className="fixed top-0 left-0 right-0 h-16 sm:h-20 lg:h-24 bg-gray-800 border-b border-gray-700 z-40 flex items-center justify-between px-3 sm:px-4 lg:px-8 overflow-hidden">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 max-w-[calc(100%-2rem)]">
        <button
          onClick={() => navigate(basePath)}
          className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
          aria-label="Go back to home"
        >
          <FiArrowLeft size={18} className="sm:w-5 sm:h-5" />
        </button>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <MdLocalShipping className="text-xl sm:text-2xl text-blue-500 flex-shrink-0" />
          <h1 className="text-sm sm:text-lg lg:text-xl font-bold truncate max-w-[200px] sm:max-w-[300px] lg:max-w-[400px]">
            {activeTab === 'sellers' ? 'Sellers' : activeTab === 'orders' ? 'Orders' : 'Analytics'} Dashboard
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        {isSeller(roles) && (
          <button
            onClick={() => navigate(`${basePath}/seller/customers`)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm"
            title="Go to Customers List"
          >
            <MdStore className="w-4 h-4" />
            <span className="hidden sm:inline">Customers</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default DashboardHeader;
