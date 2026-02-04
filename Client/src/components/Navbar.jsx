import React, { useState, useEffect } from 'react';
import {
  MdRestaurant, MdRestaurantMenu, MdHelp,
  MdPerson, MdShoppingCart, MdSearch,
  MdAdminPanelSettings, MdDashboard, MdLogout, MdStore, MdCalendarToday,
  MdClose, MdMenu, MdLocalShipping, MdEmail, MdPhone
} from 'react-icons/md';
import { FaUserCircle } from 'react-icons/fa';
import useAuthStore from '../stores/Zustand.store';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'
import { useLogout } from '../hooks/userHooks/useLogin';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { isAdmin, isSeller, isDeliveryManager, isDeliveryExecutive, isCEO, isCFO } from '../utils/roleUtils';

/**
 * Navbar - Main navigation component with role-based menu and authentication
 * Handles user authentication, role-based navigation, and responsive mobile menu
 * Features: Auto-hide on scroll, role-based menu items, user dropdown, search functionality
 */
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
  const userIsDeliveryManager = isDeliveryManager(roles);
  const userIsDeliveryExecutive = isDeliveryExecutive(roles);
  const userIsCEO = isCEO(roles);
  const userIsCFO = isCFO(roles);

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
            <Link to="/jkhm" className="flex items-center group">
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
            </Link>
          </div>

          {/* Desktop Navigation - use Link for client-side navigation (no full page reload) */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/jkhm" className="text-white hover:text-[#FE8C00] transition-all duration-300 font-medium flex items-center gap-1 group">
              <MdRestaurant className="text-xl group-hover:scale-110 transition-transform duration-300" /> Home
            </Link>
            <Link to="/jkhm/menu" className="text-white hover:text-[#FE8C00] transition-all duration-300 font-medium flex items-center gap-1 group">
              <MdRestaurantMenu className="text-xl group-hover:scale-110 transition-transform duration-300" /> Menu
            </Link>
            <Link to="/jkhm/place-order" className="text-white hover:text-[#FE8C00] transition-all duration-300 font-medium flex items-center gap-1 group">
              <MdCalendarToday className="text-xl group-hover:scale-110 transition-transform duration-300" /> Place Order
            </Link>
            <Link to="/help" className="text-white hover:text-[#FE8C00] transition-all duration-300 font-medium flex items-center gap-1 group">
              <MdHelp className="text-xl group-hover:scale-110 transition-transform duration-300" /> Help
            </Link>

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
                      className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-100"
                    >
                      {/* User Info Section */}
                      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-orange-100/50">
                        <div className="flex items-center gap-2">
                          <FaUserCircle className="text-2xl text-[#FE8C00] flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-800 text-sm truncate">
                              {user?.name || user?.contacts?.[0]?.firstName 
                                ? `${user?.contacts?.[0]?.firstName || ''} ${user?.contacts?.[0]?.lastName || ''}`.trim() || user?.name || 'User'
                                : 'User'}
                            </div>
                            {user?.email && (
                              <div className="flex items-center gap-1 text-xs text-gray-600 truncate mt-1">
                                <MdEmail className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{user.email}</span>
                              </div>
                            )}
                            {user?.phone && (
                              <div className="flex items-center gap-1 text-xs text-gray-600 truncate mt-0.5">
                                <MdPhone className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{user.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* User Profile Options */}
                      <Link to="/jkhm/profile" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-[#FE8C00] transition-all duration-200" onClick={() => setUserDropdownOpen(false)}>
                        <MdPerson className="text-xl" /> Profile
                      </Link>
                      <Link to="/jkhm/customer-orders" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-[#FE8C00] transition-all duration-200" onClick={() => setUserDropdownOpen(false)}>
                        <MdRestaurantMenu className="text-xl" /> My Orders
                      </Link>


                      {/* Admin Options */}
                      {userIsAdmin && (
                        <>
                          <div className="border-t border-gray-200 my-1"></div>
                          <div className="px-4 py-1 text-xs text-gray-500 font-medium">Admin Panel</div>
                          <Link to="/jkhm/admin" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-[#FE8C00] transition-all duration-200" onClick={() => setUserDropdownOpen(false)}>
                            <MdAdminPanelSettings className="text-xl" /> Admin Dashboard
                          </Link>
                        </>
                      )}

                      {/* CEO/CFO Management Dashboard Options */}
                      {(userIsCEO || userIsCFO) && (
                        <>
                          <div className="border-t border-gray-200 my-1"></div>
                          <div className="px-4 py-1 text-xs text-gray-500 font-medium">Management Panel</div>
                          <Link to="/jkhm/management-dashboard" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-[#FE8C00] transition-all duration-200" onClick={() => setUserDropdownOpen(false)}>
                            <MdDashboard className="text-xl" /> Management Dashboard
                          </Link>
                        </>
                      )}

                      {/* Seller Options */}
                      {userIsSeller && (
                        <>
                          <div className="border-t border-gray-200 my-1"></div>
                          <div className="px-4 py-1 text-xs text-gray-500 font-medium">Seller Panel</div>
                          <Link to="/jkhm/seller/customers" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-[#FE8C00] transition-all duration-200" onClick={() => setUserDropdownOpen(false)}>
                            <MdStore className="text-xl" /> Customers List
                          </Link>
                        </>
                      )}

                      {/* Delivery Manager Options */}
                      {userIsDeliveryManager && (
                        <>
                          <div className="border-t border-gray-200 my-1"></div>
                          <div className="px-4 py-1 text-xs text-gray-500 font-medium">Delivery Panel</div>
                          <Link to="/jkhm/delivery-manager" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-[#FE8C00] transition-all duration-200" onClick={() => setUserDropdownOpen(false)}>
                            <MdLocalShipping className="text-xl" /> Delivery Manager Dashboard
                          </Link>
                        </>
                      )}

                      {/* Delivery Executive Options */}
                      {userIsDeliveryExecutive && (
                        <>
                          <div className="border-t border-gray-200 my-1"></div>
                          <div className="px-4 py-1 text-xs text-gray-500 font-medium">Delivery Panel</div>
                          <Link to="/jkhm/delivery-executive" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-[#FE8C00] transition-all duration-200" onClick={() => setUserDropdownOpen(false)}>
                            <MdLocalShipping className="text-xl" /> Delivery Executive Dashboard
                          </Link>
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
                  <Link to="/jkhm" className="flex flex-col items-center gap-1 p-3 text-gray-700 hover:text-[#FE8C00] hover:bg-orange-50 rounded-lg transition-all duration-300 group border border-gray-100 hover:border-orange-200" onClick={() => setMenuOpen(false)}>
                    <MdRestaurant className="text-xl group-hover:scale-110 transition-transform duration-300" /> 
                    <span className="font-medium text-xs text-center">Home</span>
                  </Link>
                  <Link to="/jkhm/menu" className="flex flex-col items-center gap-1 p-3 text-gray-700 hover:text-[#FE8C00] hover:bg-orange-50 rounded-lg transition-all duration-300 group border border-gray-100 hover:border-orange-200" onClick={() => setMenuOpen(false)}>
                    <MdRestaurantMenu className="text-xl group-hover:scale-110 transition-transform duration-300" /> 
                    <span className="font-medium text-xs text-center">Menu</span>
                  </Link>
                  <Link to="/jkhm/place-order" className="flex flex-col items-center gap-1 p-3 text-gray-700 hover:text-[#FE8C00] hover:bg-orange-50 rounded-lg transition-all duration-300 group border border-gray-100 hover:border-orange-200" onClick={() => setMenuOpen(false)}>
                    <MdCalendarToday className="text-xl group-hover:scale-110 transition-transform duration-300" /> 
                    <span className="font-medium text-xs text-center">Place Order</span>
                  </Link>
                </div>
              </div>

              {/* Additional Links */}
              <div className="px-4 pb-2">
                <Link to="/help" className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-[#FE8C00] hover:bg-orange-50 rounded-lg transition-all duration-300 group" onClick={() => setMenuOpen(false)}>
                  <MdHelp className="text-base group-hover:scale-110 transition-transform duration-300" /> 
                  <span className="font-medium text-sm">Help</span>
                </Link>
              </div>

                            {/* User Section */}
              {user ? (
                <div className="border-t border-gray-100 p-4 bg-gradient-to-b from-orange-50/50 to-white">
                  {/* User Info in Mobile Menu */}
                  <div className="mb-4 pb-3 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <FaUserCircle className="text-2xl text-[#FE8C00] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-800 text-sm truncate">
                          {user?.name || user?.contacts?.[0]?.firstName 
                            ? `${user?.contacts?.[0]?.firstName || ''} ${user?.contacts?.[0]?.lastName || ''}`.trim() || user?.name || 'User'
                            : 'User'}
                        </div>
                        {user?.email && (
                          <div className="flex items-center gap-1 text-xs text-gray-600 truncate mt-1">
                            <MdEmail className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </div>
                        )}
                        {user?.phone && (
                          <div className="flex items-center gap-1 text-xs text-gray-600 truncate mt-0.5">
                            <MdPhone className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{user.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <MdPerson className="text-base" />
                    My Account
                  </h3>
                  
                  {/* Primary Actions */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <Link to="/jkhm/profile" className="flex flex-col items-center gap-1 p-2 text-gray-700 hover:text-[#FE8C00] hover:bg-orange-50 rounded-lg transition-all duration-300 group border border-gray-100 hover:border-orange-200" onClick={() => setMenuOpen(false)}>
                      <MdPerson className="text-lg group-hover:scale-110 transition-transform duration-300" /> 
                      <span className="font-medium text-xs text-center">Profile</span>
                    </Link>
                    <Link to="/jkhm/customer-orders" className="flex flex-col items-center gap-1 p-2 text-gray-700 hover:text-[#FE8C00] hover:bg-orange-50 rounded-lg transition-all duration-300 group border border-gray-100 hover:border-orange-200" onClick={() => setMenuOpen(false)}>
                      <MdRestaurantMenu className="text-lg group-hover:scale-110 transition-transform duration-300" /> 
                      <span className="font-medium text-xs text-center">Orders</span>
                    </Link>
                  </div>

                  {/* Admin/Seller/Delivery Manager/CEO/CFO Options */}
                  {(userIsAdmin || userIsSeller || userIsDeliveryManager || userIsDeliveryExecutive || userIsCEO || userIsCFO) && (
                    <div className="mb-3">
                      <div className="space-y-1">
                        {(userIsCEO || userIsCFO) && (
                          <Link to="/jkhm/management-dashboard" className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-[#FE8C00] hover:bg-orange-50 rounded-lg transition-all duration-300 group" onClick={() => setMenuOpen(false)}>
                            <MdDashboard className="text-base group-hover:scale-110 transition-transform duration-300" /> 
                            <span className="font-medium text-xs">Management Dashboard</span>
                          </Link>
                        )}
                        {userIsAdmin && (
                          <Link to="/jkhm/admin" className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-[#FE8C00] hover:bg-orange-50 rounded-lg transition-all duration-300 group" onClick={() => setMenuOpen(false)}>
                            <MdAdminPanelSettings className="text-base group-hover:scale-110 transition-transform duration-300" /> 
                            <span className="font-medium text-xs">Admin</span>
                          </Link>
                        )}
                        {userIsSeller && (
                          <Link to="/jkhm/seller" className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-[#FE8C00] hover:bg-orange-50 rounded-lg transition-all duration-300 group" onClick={() => setMenuOpen(false)}>
                            <MdStore className="text-base group-hover:scale-110 transition-transform duration-300" /> 
                            <span className="text-sm font-medium">Seller</span>
                          </Link>
                        )}
                        {userIsDeliveryManager && (
                          <Link to="/jkhm/delivery-manager" className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-[#FE8C00] hover:bg-orange-50 rounded-lg transition-all duration-300 group" onClick={() => setMenuOpen(false)}>
                            <MdLocalShipping className="text-base group-hover:scale-110 transition-transform duration-300" /> 
                            <span className="font-medium text-xs">Delivery Manager</span>
                          </Link>
                        )}
                        {userIsDeliveryExecutive && (
                          <Link to="/jkhm/delivery-executive" className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-[#FE8C00] hover:bg-orange-50 rounded-lg transition-all duration-300 group" onClick={() => setMenuOpen(false)}>
                            <MdLocalShipping className="text-base group-hover:scale-110 transition-transform duration-300" /> 
                            <span className="font-medium text-xs">Delivery Executive</span>
                          </Link>
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
