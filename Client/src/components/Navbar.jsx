import React, { useState, useEffect } from 'react';
import {
  MdRestaurant, MdRestaurantMenu, MdHelp,
  MdContactPhone, MdPerson, MdShoppingCart, MdSearch,
  MdAdminPanelSettings, MdDashboard, MdLogout, MdStore, MdCalendarToday,
  MdClose, MdMenu
} from 'react-icons/md';
import { FaUserCircle } from 'react-icons/fa';
import useAuthStore from '../stores/Zustand.store';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'
import { useLogout } from '../hooks/userHooks/useLogin';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { isAdmin, isSeller } from '../utils/roleUtils';

const Navbar = ({ onSignInClick }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const user = useAuthStore((state) => state.user);
  const roles = useAuthStore((state) => state.roles);
  const navigate = useNavigate();
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const logoutMutation = useLogout();

  // Function to check user roles using utility functions
  const userIsAdmin = isAdmin(roles);
  const userIsSeller = isSeller(roles);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > lastScrollY && window.scrollY > 50) {
        setShowNavbar(false); // scrolling down
      } else {
        setShowNavbar(true); // scrolling up
      }
      setLastScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
    setUserDropdownOpen(false);
  };

  const confirmLogout = () => {
    logoutMutation.mutate();
    setShowLogoutConfirm(false);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [menuOpen]);

  return (
    <nav className={`bg-[#989494]/50 shadow-md w-full z-50 fixed top-0 left-0 transition-transform duration-300 ${showNavbar ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-3">
        <div className="flex justify-between items-center h-20 lg:h-24">
          {/* Logo */}
          <div className="flex items-center">
            <a href="/jkhm" className="flex items-center group">
              <motion.img
                src="/logo.png"
                alt="Logo"
                className="w-16 h-16 lg:w-20 lg:h-20 object-contain rounded-full shadow-lg group-hover:scale-105 transition-transform duration-300"
                whileHover={{ rotate: 5 }}
              />
              <span className="text-white hover:text-[#FE8C00] transition-all duration-300 font-medium flex items-center gap-1 ml-3">
                <span className="text-lg sm:text-xl md:text-[26px] text-[#FE8C00] tracking-wider whitespace-nowrap font-leagueSpartan font-black" style={{ textShadow: "2px 2px 8px rgba(0,0,0,0.5)" }}>
                  Jay's Kerala Homely Meals
                </span>
              </span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <a href="/jkhm" className="text-white hover:text-[#FE8C00] transition-all duration-300 font-medium flex items-center gap-1 group">
              <MdRestaurant className="text-xl group-hover:scale-110 transition-transform duration-300" /> Home
            </a>
            <a href="/jkhm/menu" className="text-white hover:text-[#FE8C00] transition-all duration-300 font-medium flex items-center gap-1 group">
              <MdRestaurantMenu className="text-xl group-hover:scale-110 transition-transform duration-300" /> Menu
            </a>
            <a href="/jkhm/bookings" className="text-white hover:text-[#FE8C00] transition-all duration-300 font-medium flex items-center gap-1 group">
              <MdCalendarToday className="text-xl group-hover:scale-110 transition-transform duration-300" /> Bookings
            </a>
            <a href="/help" className="text-white hover:text-[#FE8C00] transition-all duration-300 font-medium flex items-center gap-1 group">
              <MdHelp className="text-xl group-hover:scale-110 transition-transform duration-300" /> Help
            </a>

            {/* User Profile Section */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="text-white font-medium flex items-center gap-2 hover:text-[#FE8C00] cursor-pointer transition-all duration-300 group"
                >
                  <FaUserCircle className="text-2xl group-hover:scale-110 transition-transform duration-300" />
                  <span>{user.name?.split(' ')[0] || 'User'}</span>
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-100"
                    >
                      {/* User Profile Options */}
                      <a href="/jkhm/profile" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-[#FE8C00] transition-all duration-200">
                        <MdPerson className="text-xl" /> Profile
                      </a>
                                             <a href="/jkhm/orders" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-[#FE8C00] transition-all duration-200">
                         <MdRestaurantMenu className="text-xl" /> My Orders
                       </a>


                      {/* Admin Options */}
                      {userIsAdmin && (
                        <>
                          <div className="border-t border-gray-200 my-1"></div>
                          <div className="px-4 py-1 text-xs text-gray-500 font-medium">Admin Panel</div>
                          <a href="/admin" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-[#FE8C00] transition-all duration-200">
                            <MdAdminPanelSettings className="text-xl" /> Admin Dashboard
                          </a>
                        </>
                      )}

                      {/* Seller Options */}
                      {userIsSeller && (
                        <>
                          <div className="border-t border-gray-200 my-1"></div>
                          <div className="px-4 py-1 text-xs text-gray-500 font-medium">Seller Panel</div>
                          <a href="/jkhm/seller" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-[#FE8C00] transition-all duration-200">
                            <MdStore className="text-xl" /> Seller Dashboard
                          </a>
                        </>
                      )}

                      {/* Logout Option */}
                      <div className="border-t border-gray-200 my-1"></div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 w-full text-left transition-all duration-200"
                      >
                        <MdLogout className="text-xl" /> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={onSignInClick}
                className="text-white hover:text-[#FE8C00] transition-all duration-300 font-medium flex items-center gap-1 group"
              >
                <MdPerson className="text-xl group-hover:scale-110 transition-transform duration-300" /> Sign In
              </button>
            )}

            {/* Cart - Commented out
            <a href="/cart" className="text-white hover:text-[#FE8C00] transition-all duration-300 font-medium flex items-center gap-1 group relative">
              <MdShoppingCart className="text-xl group-hover:scale-110 transition-transform duration-300" /> Cart
              <span className="absolute -top-2 -right-2 bg-[#FE8C00] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">0</span>
            </a>
            */}

            {/* Search */}
            <div className="relative group">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search food..."
                className="pl-10 pr-4 py-2 text-sm rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FE8C00] focus:border-transparent text-gray-700 bg-white/90 backdrop-blur-sm transition-all duration-300 group-hover:bg-white"
              />
              <span className="absolute left-3 top-2.5 text-gray-400 group-hover:text-[#FE8C00] transition-colors duration-300">
                <MdSearch className="w-5 h-5" />
              </span>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <motion.button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-white hover:text-[#FE8C00] focus:outline-none p-2 rounded-lg hover:bg-white/10 transition-all duration-300"
              whileTap={{ scale: 0.95 }}
            >
              {menuOpen ? (
                <MdClose className="w-8 h-8" />
              ) : (
                <MdMenu className="w-8 h-8" />
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setMenuOpen(false)}
            />
            
            {/* Mobile Menu */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="md:hidden fixed top-0 right-0 w-80 h-screen z-50 bg-gradient-to-b from-white to-gray-50 shadow-2xl overflow-y-auto"
            >
              {/* Header with Logo and Close button */}
              <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gradient-to-r from-[#FE8C00] to-orange-500">
                <div className="flex items-center">
                  <img
                    src="/logo.png"
                    alt="Logo"
                    className="w-14 h-14 object-contain rounded-full shadow-lg"
                  />
                  <span className="ml-3 font-bold text-white text-lg font-leagueSpartan " style={{ textShadow: "2px 2px 8px rgba(0,0,0,0.5)" }}>
                    Jay's Kerala Homely Meals
                  </span>
                </div>
                <motion.button
                  onClick={() => setMenuOpen(false)}
                  className="text-white hover:text-gray-200 focus:outline-none p-2 rounded-full hover:bg-white/20 transition-all duration-300"
                  whileTap={{ scale: 0.95 }}
                >
                  <MdClose className="w-6 h-6" />
                </motion.button>
              </div>

              {/* Search Bar */}
              <div className="p-6 border-b border-gray-100 bg-white">
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search food..."
                    className="pl-12 pr-4 py-3 w-full rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FE8C00] focus:border-transparent text-gray-700 bg-gray-50 transition-all duration-300"
                  />
                  <span className="absolute left-4 top-3.5 text-gray-400">
                    <MdSearch className="w-5 h-5" />
                  </span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-4">
                <div className="grid grid-cols-2 gap-2">
                  <motion.a 
                    href="/jkhm" 
                    className="flex flex-col items-center gap-1 p-3 text-gray-700 hover:text-[#FE8C00] hover:bg-orange-50 rounded-lg transition-all duration-300 group border border-gray-100 hover:border-orange-200"
                    whileHover={{ y: -1, scale: 1.01 }}
                    onClick={() => setMenuOpen(false)}
                  >
                    <MdRestaurant className="text-xl group-hover:scale-110 transition-transform duration-300" /> 
                    <span className="font-medium text-xs text-center">Home</span>
                  </motion.a>
                  <motion.a 
                    href="/jkhm/menu" 
                    className="flex flex-col items-center gap-1 p-3 text-gray-700 hover:text-[#FE8C00] hover:bg-orange-50 rounded-lg transition-all duration-300 group border border-gray-100 hover:border-orange-200"
                    whileHover={{ y: -1, scale: 1.01 }}
                    onClick={() => setMenuOpen(false)}
                  >
                    <MdRestaurantMenu className="text-xl group-hover:scale-110 transition-transform duration-300" /> 
                    <span className="font-medium text-xs text-center">Menu</span>
                  </motion.a>
                  {/* Cart - Commented out
                  <motion.a 
                    href="/cart" 
                    className="flex flex-col items-center gap-1 p-3 text-gray-700 hover:text-[#FE8C00] hover:bg-orange-50 rounded-lg transition-all duration-300 group border border-gray-100 hover:border-orange-200 relative"
                    whileHover={{ y: -1, scale: 1.01 }}
                    onClick={() => setMenuOpen(false)}
                  >
                    <MdShoppingCart className="text-xl group-hover:scale-110 transition-transform duration-300" /> 
                    <span className="font-medium text-xs text-center">Cart</span>
                    <span className="absolute -top-1 -right-1 bg-[#FE8C00] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">0</span>
                  </motion.a>
                  */}
                  <motion.a 
                    href="/jkhm/bookings" 
                    className="flex flex-col items-center gap-1 p-3 text-gray-700 hover:text-[#FE8C00] hover:bg-orange-50 rounded-lg transition-all duration-300 group border border-gray-100 hover:border-orange-200"
                    whileHover={{ y: -1, scale: 1.01 }}
                    onClick={() => setMenuOpen(false)}
                  >
                    <MdCalendarToday className="text-xl group-hover:scale-110 transition-transform duration-300" /> 
                    <span className="font-medium text-xs text-center">Bookings</span>
                  </motion.a>
                </div>
              </div>

              {/* Additional Links */}
              <div className="px-4 pb-2">
                <motion.a 
                  href="/help" 
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-[#FE8C00] hover:bg-orange-50 rounded-lg transition-all duration-300 group"
                  whileHover={{ x: 3 }}
                  onClick={() => setMenuOpen(false)}
                >
                  <MdHelp className="text-base group-hover:scale-110 transition-transform duration-300" /> 
                  <span className="font-medium text-sm">Help</span>
                </motion.a>
              </div>

                            {/* User Section */}
              {user ? (
                <div className="border-t border-gray-100 p-4 bg-gradient-to-b from-orange-50/50 to-white">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <MdPerson className="text-base" />
                    My Account
                  </h3>
                  
                  {/* Primary Actions */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                                         <motion.a 
                       href="/jkhm/profile" 
                       className="flex flex-col items-center gap-1 p-2 text-gray-700 hover:text-[#FE8C00] hover:bg-orange-50 rounded-lg transition-all duration-300 group border border-gray-100 hover:border-orange-200"
                       whileHover={{ y: -1, scale: 1.01 }}
                       onClick={() => setMenuOpen(false)}
                     >
                       <MdPerson className="text-lg group-hover:scale-110 transition-transform duration-300" /> 
                       <span className="font-medium text-xs text-center">Profile</span>
                     </motion.a>
                                         <motion.a 
                       href="/jkhm/orders" 
                       className="flex flex-col items-center gap-1 p-2 text-gray-700 hover:text-[#FE8C00] hover:bg-orange-50 rounded-lg transition-all duration-300 group border border-gray-100 hover:border-orange-200"
                       whileHover={{ y: -1, scale:1.01 }}
                       onClick={() => setMenuOpen(false)}
                     >
                       <MdRestaurantMenu className="text-lg group-hover:scale-110 transition-transform duration-300" /> 
                       <span className="font-medium text-xs text-center">Orders</span>
                     </motion.a>

                  </div>

                  {/* Admin/Seller Options */}
                  {(userIsAdmin || userIsSeller) && (
                    <div className="mb-3">
                      <div className="space-y-1">
                        {userIsAdmin && (
                          <motion.a 
                            href="/admin" 
                            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-[#FE8C00] hover:bg-orange-50 rounded-lg transition-all duration-300 group"
                            whileHover={{ x: 3 }}
                            onClick={() => setMenuOpen(false)}
                          >
                            <MdAdminPanelSettings className="text-base group-hover:scale-110 transition-transform duration-300" /> 
                            <span className="font-medium text-xs">Admin</span>
                          </motion.a>
                        )}
                        {userIsSeller && (
                          <motion.a 
                            href="/jkhm/seller" 
                            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-[#FE8C00] hover:bg-orange-50 rounded-lg transition-all duration-300 group"
                            whileHover={{ x: 3 }}
                            onClick={() => setMenuOpen(false)}
                          >
                            <MdStore className="text-base group-hover:scale-110 transition-transform duration-300" /> 
                            <span className="font-medium text-xs">Seller</span>
                          </motion.a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Logout Button */}
                  <motion.button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-red-600 hover:text-white hover:bg-red-500 rounded-lg transition-all duration-300 group border border-red-200 hover:border-red-500"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <MdLogout className="text-base group-hover:scale-110 transition-transform duration-300" /> 
                    <span className="font-medium text-sm">Sign Out</span>
                  </motion.button>
                </div>
              ) : (
                <div className="border-t border-gray-100 p-4 bg-gradient-to-b from-gray-50 to-white">
                  <div className="text-center mb-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <MdPerson className="text-xl text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500 mb-2">Welcome to Jay's Kerala</p>
                  </div>
                  <motion.button
                    onClick={() => {
                      onSignInClick();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-white bg-gradient-to-r from-[#FE8C00] to-orange-500 rounded-lg font-medium hover:shadow-lg transition-all duration-300 group"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <MdPerson className="text-base group-hover:scale-110 transition-transform duration-300" /> 
                    <span className="text-sm">Sign In</span>
                  </motion.button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Custom Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div 
          className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
          style={{ minHeight: '100vh' }}
        >
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-11/12 mx-4 my-8 relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <ExclamationCircleOutlined className="text-red-600 text-xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Confirm Logout</h3>
            </div>
            <p className="text-gray-600 mb-6">Are you sure you want to logout?</p>
            <div className="flex gap-3">
              <button
                onClick={cancelLogout}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
