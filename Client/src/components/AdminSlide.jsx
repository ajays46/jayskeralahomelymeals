import React from 'react';
import { FaHome, FaRegChartBar, FaUsers, FaClipboardList, FaRegSquare, FaUser, FaBuilding, FaPlus, FaList, FaGlobe } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';

const AdminSlide = ({ isFooter = false }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { icon: FaHome, path: '/admin', title: 'Dashboard', color: 'hover:bg-blue-200' },
    { icon: FaGlobe, path: '/jkhm', title: 'Website Home', color: 'hover:bg-emerald-200' },
    { icon: FaRegChartBar, path: '/admin/analytics', title: 'Analytics', color: 'hover:bg-purple-200' },
    { icon: FaUsers, path: '/admin/users', title: 'Users', color: 'hover:bg-green-200' },
    { icon: FaClipboardList, path: '/admin/orders', title: 'Orders', color: 'hover:bg-yellow-200' },
    { icon: FaPlus, path: '/admin/add-product', title: 'Add Product', color: 'hover:bg-red-200' },
    { icon: FaList, path: '/admin/products', title: 'View Products', color: 'hover:bg-teal-200' },
    { icon: FaRegSquare, path: '/admin/settings', title: 'Settings', color: 'hover:bg-indigo-200' },
    { icon: FaBuilding, path: '/admin/company-create', title: 'Create Company', color: 'hover:bg-orange-200' },

  ];

  const containerClasses = isFooter 
    ? "flex justify-around items-center w-full h-16 bg-[#232328] px-4 border-t border-gray-700"
    : "flex flex-col justify-between items-center h-screen w-14 bg-[#232328] py-4";

  const buttonClasses = isFooter
    ? "flex items-center justify-center w-10 h-10 rounded-full bg-white text-[#232328] transition-all duration-200"
    : "flex items-center justify-center w-10 h-10 rounded-full bg-white text-[#232328] transition-all duration-200";

  return (
    <div className={containerClasses}>
      {!isFooter && (
        <div className="flex flex-col gap-4 mt-2">
          {navItems.map((item, index) => (
            <button
              key={index}
              className={`${buttonClasses} ${item.color} ${isActive(item.path) ? 'ring-2 ring-blue-500 bg-blue-100' : ''}`}
              title={item.title}
              onClick={() => navigate(item.path)}
            >
              <item.icon size={20} />
            </button>
          ))}
        </div>
      )}
      
      {isFooter && (
        <div className="flex justify-around w-full">
          {navItems.map((item, index) => (
            <button
              key={index}
              className={`${buttonClasses} ${item.color} ${isActive(item.path) ? 'ring-2 ring-blue-500 bg-blue-100' : ''}`}
              title={item.title}
              onClick={() => navigate(item.path)}
            >
              <item.icon size={18} />
            </button>
          ))}
        </div>
      )}
      
      {!isFooter && (
        <div className="mb-2">
          <button 
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-[#232328] hover:bg-gray-200 transition-all duration-200"
            title="Profile"
            onClick={() => navigate('/admin')}
          >
            <FaUser size={22} />
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminSlide;
