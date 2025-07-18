import React, { useState } from 'react';
import { FaHome, FaRegChartBar, FaUsers, FaClipboardList, FaRegSquare, FaUser, FaBuilding, FaPlus, FaList, FaGlobe, FaUtensils, FaChevronDown, FaChevronUp } from 'react-icons/fa'; 
import { useNavigate, useLocation } from 'react-router-dom';

const AdminSlide = ({ isFooter = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { icon: FaHome, path: '/admin', title: 'Dashboard', color: 'hover:bg-blue-200' },
    { icon: FaGlobe, path: '/jkhm', title: 'Website Home', color: 'hover:bg-emerald-200' },
    { icon: FaRegChartBar, path: '/admin/analytics', title: 'Analytics', color: 'hover:bg-purple-200' },
    { icon: FaUsers, path: '/admin/users', title: 'Users', color: 'hover:bg-green-200' },
    { icon: FaClipboardList, path: '/admin/menu-items-table', title: 'Menu Items Table', color: 'hover:bg-yellow-200' },
    { icon: FaPlus, path: '/admin/add-product', title: 'Add Product', color: 'hover:bg-red-200' },
    { icon: FaList, path: '/admin/products', title: 'View Products', color: 'hover:bg-teal-200' },
    { icon: FaBuilding, path: '/admin/company-create', title: 'Create Company', color: 'hover:bg-orange-200' },
  ];

  const menuSubItems = [
    { icon: FaPlus, path: '/admin/add-menu', title: 'Add Menu', color: 'hover:bg-indigo-200' },
    { icon: FaList, path: '/admin/menu-items', title: 'Add Menu Item', color: 'hover:bg-pink-200' },
  ];

  const containerClasses = isFooter 
    ? "flex justify-around items-center w-full h-16 bg-[#232328] px-4 border-t border-gray-700"
    : "flex flex-col justify-between items-center h-screen w-14 bg-[#232328] py-6 fixed left-0 top-0 z-50";

  const buttonClasses = isFooter
    ? "flex items-center justify-center w-10 h-10 rounded-full bg-white text-[#232328] transition-all duration-200"
    : "flex items-center justify-center w-10 h-10 rounded-full bg-white text-[#232328] transition-all duration-200";

  const toggleMenu = () => {
    setIsMenuExpanded(!isMenuExpanded);
  };

  return (
    <div className={containerClasses}>
      {!isFooter && (
        <div className="flex flex-col gap-3 lg:gap-4 mt-6 px-1 h-[calc(100vh-160px)] overflow-y-auto">
          {navItems.map((item, index) => (
            <button
              key={index}
              className={`${buttonClasses} ${item.color} ${isActive(item.path) ? 'ring-2 ring-blue-500 bg-blue-100' : ''} flex-shrink-0`}
              title={item.title}
              onClick={() => navigate(item.path)}
            >
              <item.icon size={18} className="lg:w-5 lg:h-5" />
            </button>
          ))}
          
          {/* Menu Toggle Button */}
          <div className="flex flex-col gap-1">
            <button
              className={`${buttonClasses} hover:bg-indigo-200 ${isMenuExpanded ? 'ring-2 ring-blue-500 bg-blue-100' : ''} flex-shrink-0`}
              title="Menu Management"
              onClick={toggleMenu}
            >
              <FaUtensils size={18} className="lg:w-5 lg:h-5" />
            </button>
            
            {/* Menu Sub Items */}
            {isMenuExpanded && (
              <div className="flex flex-col gap-1 ml-2">
                {menuSubItems.map((item, index) => (
                  <button
                    key={index}
                    className={`${buttonClasses} ${item.color} ${isActive(item.path) ? 'ring-2 ring-blue-500 bg-blue-100' : ''} flex-shrink-0 w-8 h-8`}
                    title={item.title}
                    onClick={() => navigate(item.path)}
                  >
                    <item.icon size={14} className="lg:w-4 lg:h-4" />
                  </button>
                ))}
              </div>
            )}
          </div>
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
          
          {/* Menu Toggle for Footer */}
          <div className="relative">
            <button
              className={`${buttonClasses} hover:bg-indigo-200 ${isMenuExpanded ? 'ring-2 ring-blue-500 bg-blue-100' : ''}`}
              title="Menu Management"
              onClick={toggleMenu}
            >
              <FaUtensils size={18} />
            </button>
            
            {/* Menu Sub Items for Footer */}
            {isMenuExpanded && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 flex flex-col gap-1">
                {menuSubItems.map((item, index) => (
                  <button
                    key={index}
                    className={`${buttonClasses} ${item.color} ${isActive(item.path) ? 'ring-2 ring-blue-500 bg-blue-100' : ''} w-8 h-8`}
                    title={item.title}
                    onClick={() => navigate(item.path)}
                  >
                    <item.icon size={14} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {!isFooter && (
        <div className="mb-6 flex-shrink-0">
          <button 
            className="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-white text-[#232328] hover:bg-gray-200 transition-all duration-200"
            title="Profile"
            onClick={() => navigate('/admin')}
          >
            <FaUser size={20} className="lg:w-6 lg:h-6" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminSlide;
