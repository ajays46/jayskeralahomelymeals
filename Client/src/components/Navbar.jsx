import React, { useState, useEffect } from 'react';
import {
  MdRestaurant, MdRestaurantMenu, MdHelp,
  MdContactPhone, MdPerson, MdShoppingCart, MdSearch,
  MdAdminPanelSettings, MdDashboard, MdLogout, MdStore, MdCalendarToday
} from 'react-icons/md';
import { FaUserCircle } from 'react-icons/fa';
import useAuthStore from '../stores/Zustand.store';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ onSignInClick }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Function to check user roles
  const isAdmin = user?.role?.toLowerCase().includes('admin');
  const isSeller = user?.role?.toLowerCase().includes('seller');

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
    logout();
    setUserDropdownOpen(false);
    navigate('/');
  };

  return (
    <nav className={`bg-[#989494]/50 shadow-md w-full z-50 fixed top-0 left-0 transition-transform duration-300 ${showNavbar ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          {/* Logo */}
          <div className="flex items-center">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-20 h-20 object-contain rounded-full"
            />
            <span className="ml-3 font-bold font-leagueSpartan  sm:text-xl md:text-2xl text-yellow-200 whitespace-nowrap">
              Jay's Kerala Homely Meals
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <a href="/" className="text-white hover:text-[#FE8C00] transition font-medium flex items-center gap-1">
              <MdRestaurant className="text-xl" /> Home
            </a>
            <a href="/menu" className="text-white hover:text-[#FE8C00] transition font-medium flex items-center gap-1">
              <MdRestaurantMenu className="text-xl" /> Menu
            </a>
            <a href="/contact" className="text-white hover:text-[#FE8C00] transition font-medium flex items-center gap-1">
              <MdCalendarToday className="text-xl" /> Bookings
            </a>
            <a href="/help" className="text-white hover:text-[#FE8C00] transition font-medium flex items-center gap-1">
              <MdHelp className="text-xl" /> Help
            </a>
           
            {/* User Profile Section */}
            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="text-white font-medium flex items-center gap-2 hover:text-[#FE8C00] cursor-pointer"
                >
                  <FaUserCircle className="text-2xl" />
                  <span>{user.name?.split(' ')[0] || 'User'}</span>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                    {/* User Profile Options */}
                    <a href="/profile" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100">
                      <MdPerson className="text-xl" /> Profile
                    </a>
                    <a href="/orders" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100">
                      <MdRestaurantMenu className="text-xl" /> My Orders
                    </a>

                    {/* Admin Options */}
                    {isAdmin && (
                      <>
                        <div className="border-t border-gray-200 my-1"></div>
                        <div className="px-4 py-1 text-xs text-gray-500">Admin Panel</div>
                        <a href="/admin" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100">
                          <MdAdminPanelSettings className="text-xl" /> Admin Dashboard
                        </a>
                      </>
                    )}

                    {/* Seller Options */}
                    {isSeller && (
                      <>
                        <div className="border-t border-gray-200 my-1"></div>
                        <div className="px-4 py-1 text-xs text-gray-500">Seller Panel</div>
                        <a href="/seller" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100">
                          <MdStore className="text-xl" /> Seller Dashboard
                        </a>
                      </>
                    )}

                    {/* Logout Option */}
                    <div className="border-t border-gray-200 my-1"></div>
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <MdLogout className="text-xl" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={onSignInClick}
                className="text-white hover:text-[#FE8C00] transition font-medium flex items-center gap-1"
              >
                <MdPerson className="text-xl" /> Sign In
              </button>
            )}

            <a href="/cart" className="text-white hover:text-[#FE8C00] transition font-medium flex items-center gap-1">
              <MdShoppingCart className="text-xl" /> Cart
            </a>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search food..."
                className="pl-10 pr-4 py-1.5 text-sm rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FE8C00] text-gray-700 bg-white"
              />
              <span className="absolute left-3 top-2 text-gray-400">
                <MdSearch className="w-5 h-5" />
              </span>
            </div>
          </div>

          {/* Hamburger Menu */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-gray-700 hover:text-[#FE8C00] focus:outline-none"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white shadow-lg fixed top-0 left-0 w-full h-screen z-50">
          {/* Header with Logo and Close button */}
          <div className="flex justify-between items-center p-4 border-b border-gray-100">
            <div className="flex items-center">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-16 h-16 object-contain rounded-full"
              />
              <span className="ml-3 font-bold font-marcellus text-xl text-gray-800">
                Jay's Kerala Homely Meals
              </span>
            </div>
            <button
              onClick={() => setMenuOpen(false)}
              className="text-gray-700 hover:text-[#FE8C00] focus:outline-none"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search food..."
                className="pl-10 pr-4 py-2.5 w-full rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FE8C00] text-gray-700 bg-white"
              />
              <span className="absolute left-3 top-3 text-gray-400">
                <MdSearch className="w-5 h-5" />
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="px-4 py-3">
            <div className="flex flex-wrap gap-2">
              <a href="/" className="flex items-center gap-1 px-3 py-2 text-white bg-[#FE8C00] rounded-full">
                <MdRestaurant className="text-xl" /> Home
              </a>
              <a href="/menu" className="flex items-center gap-1 px-3 py-2 text-white bg-[#FE8C00] rounded-full">
                <MdRestaurantMenu className="text-xl" /> Menu
              </a>
              <a href="/contact" className="flex items-center gap-1 px-3 py-2 text-white bg-[#FE8C00] rounded-full">
                <MdCalendarToday className="text-xl" /> Bookings
              </a>
              <a href="/help" className="flex items-center gap-1 px-3 py-2 text-white bg-[#FE8C00] rounded-full">
                <MdHelp className="text-xl" /> Help
              </a>
              <a href="/contact" className="flex items-center gap-1 px-3 py-2 text-white bg-[#FE8C00] rounded-full">
                <MdCalendarToday className="text-xl" /> Contact
              </a>
              <a href="/cart" className="flex items-center gap-1 px-3 py-2 text-white bg-[#FE8C00] rounded-full">
                <MdShoppingCart className="text-xl" /> Cart
              </a>
            </div>
          </div>

          {/* User Section */}
          {user ? (
            <div className="border-t border-gray-100">
              <div className="px-4 py-3">
                <div className="flex items-center gap-2 mb-3">
                  <FaUserCircle className="text-2xl text-white" />
                  <span className="font-medium text-white">{user.name?.split(' ')[0] || 'User'}</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <a href="/profile" className="flex items-center gap-1 px-3 py-2 text-white bg-[#FE8C00] rounded-full">
                    <MdPerson className="text-xl" /> Profile
                  </a>
                  <a href="/orders" className="flex items-center gap-1 px-3 py-2 text-white bg-[#FE8C00] rounded-full">
                    <MdRestaurantMenu className="text-xl" /> Orders
                  </a>

                  {/* Admin Options */}
                  {isAdmin && (
                    <a href="/admin" className="flex items-center gap-1 px-3 py-2 text-white bg-[#FE8C00] rounded-full">
                      <MdAdminPanelSettings className="text-xl" /> Admin
                    </a>
                  )}

                  {/* Seller Options */}
                  {isSeller && (
                    <a href="/seller" className="flex items-center gap-1 px-3 py-2 text-white bg-[#FE8C00] rounded-full">
                      <MdStore className="text-xl" /> Seller
                    </a>
                  )}

                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-1 px-3 py-2 text-white bg-[#FE8C00] rounded-full"
                  >
                    <MdLogout className="text-xl" /> Logout
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-t border-gray-100 px-4 py-3">
              <button 
                onClick={onSignInClick}
                className="flex items-center gap-1 px-3 py-2 text-white bg-[#FE8C00] rounded-full"
              >
                <MdPerson className="text-xl" /> Sign In
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
