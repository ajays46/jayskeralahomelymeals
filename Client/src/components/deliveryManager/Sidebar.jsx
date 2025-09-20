import React from 'react';
import { FiUsers, FiShoppingBag, FiBarChart2, FiActivity, FiTarget, FiShield } from 'react-icons/fi';
import { MdLocalShipping } from 'react-icons/md';

const Sidebar = ({ 
  activeTab, 
  setActiveTab, 
  sidebarOpen, 
  setSidebarOpen,
  stats 
}) => {
  const menuItems = [
    { id: 'sellers', label: 'Sellers', icon: FiUsers, count: stats.totalSellers },
    { id: 'orders', label: 'Orders', icon: FiShoppingBag, count: stats.totalOrders },
    { id: 'analytics', label: 'Analytics', icon: FiBarChart2 },
    { id: 'rootManagement', label: 'Route & Management', icon: FiActivity },
    { id: 'deliveryExecutives', label: 'Delivery Executives', icon: FiTarget },
    { id: 'admin', label: 'Admin Panel', icon: FiShield }
  ];

  return (
    <>
      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-16 sm:top-20 lg:top-24 left-0 w-64 h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] lg:h-[calc(100vh-6rem)] 
        bg-gray-800 border-r border-gray-700 z-30 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="p-4 sm:p-6 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <MdLocalShipping className="text-2xl text-blue-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Delivery Manager</h2>
                <p className="text-xs text-gray-400">Management Dashboard</p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 p-4 sm:p-6 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="text-lg" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span className={`
                      px-2 py-1 text-xs rounded-full
                      ${isActive ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-300'}
                    `}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 sm:p-6 border-t border-gray-700">
            <div className="text-center">
              <p className="text-xs text-gray-400">Version 1.0.0</p>
              <p className="text-xs text-gray-500 mt-1">Delivery Management System</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
