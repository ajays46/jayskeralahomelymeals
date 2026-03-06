/**
 * MLNavbar - MaXHub Logistics navbar (logistics-only; no Menu, Place Order, Help).
 * Used when companyPath === 'ml'. Sign In opens same AuthSlider with ML theme.
 */
import React, { useState, useEffect } from 'react';
import { MdPerson, MdDashboard, MdLogout, MdClose, MdMenu, MdEmail, MdPhone, MdAdminPanelSettings, MdAddCircle, MdList } from 'react-icons/md';
import { FaUserCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../stores/Zustand.store';
import { useCompanyBasePath, useTenant } from '../../context/TenantContext';
import { getThemeForCompany } from '../../config/tenantThemes';
import { useLogout } from '../../hooks/userHooks/useLogin';
import { Modal } from 'antd';
import { isDeliveryPartner, isCEO, isCFO, isAdmin } from '../../utils/roleUtils';

const MLNavbar = ({ onSignInClick }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const user = useAuthStore((state) => state.user);
  const roles = useAuthStore((state) => state.roles);
  const logoutMutation = useLogout();
  const base = useCompanyBasePath();
  const tenant = useTenant();
  const theme = tenant?.theme ?? getThemeForCompany(null, null);
  const accent = theme.accentColor || theme.primaryColor || '#E85D04';

  const userIsDeliveryPartner = isDeliveryPartner(roles);
  const userIsCXO = isCEO(roles) || isCFO(roles);
  const userIsAdmin = isAdmin(roles);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > lastScrollY && window.scrollY > 50) setShowNavbar(false);
      else setShowNavbar(true);
      setLastScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : 'unset';
  }, [menuOpen]);

  const handleLogout = () => {
    setUserDropdownOpen(false);
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logoutMutation.mutate();
    setShowLogoutConfirm(false);
  };

  return (
    <nav
      className={`tenant-nav ${theme.navBg || 'bg-[#2d2d2d]/90'} shadow-md w-full z-50 fixed top-0 left-0 transition-transform duration-300 ${showNavbar ? 'translate-y-0' : '-translate-y-full'}`}
      style={{ ['--tenant-accent']: accent }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-3">
        <div className="flex justify-between items-center h-20 lg:h-24">
          <div className="flex items-center">
            <Link to={base} className="flex items-center group">
              <motion.img
                src={theme.logoUrl || '/Maxhub.jpeg'}
                alt="MaXHub Logistics"
                className="w-16 h-16 lg:w-20 lg:h-20 object-contain rounded-full shadow-lg group-hover:scale-105 transition-transform duration-300"
                whileHover={{ rotate: 5 }}
              />
              <span className="text-white font-medium flex items-center gap-1 ml-3">
                <span className="text-lg sm:text-xl md:text-[26px] tracking-wider whitespace-nowrap font-leagueSpartan font-black" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.5)', color: accent }}>
                  {theme.brandName || 'MaXHub Logistics'}
                </span>
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            {userIsDeliveryPartner && (
              <>
                <Link to={`${base}/dashboard`} className="text-white hover:opacity-90 transition-all duration-300 font-medium flex items-center gap-1 group">
                  <MdDashboard className="text-xl group-hover:scale-110 transition-transform duration-300" /> Dashboard
                </Link>
                <Link to={`${base}/trips`} className="text-white hover:opacity-90 transition-all duration-300 font-medium flex items-center gap-1 group">
                  <MdList className="text-xl group-hover:scale-110 transition-transform duration-300" /> My Trips
                </Link>
                <Link to={`${base}/trips/add`} className="text-white hover:opacity-90 transition-all duration-300 font-medium flex items-center gap-1 group">
                  <MdAddCircle className="text-xl group-hover:scale-110 transition-transform duration-300" /> Add Trip
                </Link>
              </>
            )}
            {userIsCXO && (
              <Link to={`${base}/cxo-dashboard`} className="text-white hover:opacity-90 transition-all duration-300 font-medium flex items-center gap-1 group">
                <MdDashboard className="text-xl group-hover:scale-110 transition-transform duration-300" /> CXO Dashboard
              </Link>
            )}
            {userIsAdmin && (
              <Link to={`${base}/admin`} className="text-white hover:opacity-90 transition-all duration-300 font-medium flex items-center gap-1 group">
                <MdAdminPanelSettings className="text-xl group-hover:scale-110 transition-transform duration-300" /> Admin
              </Link>
            )}

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="text-white font-medium flex items-center gap-2 hover:opacity-90 cursor-pointer transition-all duration-300 group"
                >
                  <FaUserCircle className="text-2xl group-hover:scale-110 transition-transform duration-300" />
                  <span>{user.name?.split(' ')[0] || 'User'}</span>
                </button>
                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-100"
                    >
                      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-orange-100/50">
                        <div className="flex items-center gap-2">
                          <FaUserCircle className="text-2xl flex-shrink-0" style={{ color: accent }} />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-800 text-sm truncate">
                              {user?.name || user?.contacts?.[0]?.firstName ? `${user?.contacts?.[0]?.firstName || ''} ${user?.contacts?.[0]?.lastName || ''}`.trim() || user?.name || 'User' : 'User'}
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
                      <Link to={`${base}/profile`} className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-orange-50 transition-all duration-200" style={{ ['--tw-text-opacity']: 1 }} onClick={() => setUserDropdownOpen(false)}>
                        <MdPerson className="text-xl" /> Profile
                      </Link>
                      {userIsAdmin && (
                        <Link to={`${base}/admin`} className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-orange-50 transition-all duration-200" onClick={() => setUserDropdownOpen(false)}>
                          <MdAdminPanelSettings className="text-xl" /> Admin
                        </Link>
                      )}
                      <div className="border-t border-gray-200 my-1" />
                      <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 w-full text-left transition-all duration-200">
                        <MdLogout className="text-xl" /> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button onClick={onSignInClick} className="text-white hover:opacity-90 transition-all duration-300 font-medium flex items-center gap-1 group">
                <MdPerson className="text-xl group-hover:scale-110 transition-transform duration-300" /> Sign In
              </button>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <motion.button onClick={() => setMenuOpen(!menuOpen)} className="text-white focus:outline-none p-2 rounded-lg hover:bg-white/10 transition-all duration-300" whileTap={{ scale: 0.95 }}>
              {menuOpen ? <MdClose className="w-8 h-8" /> : <MdMenu className="w-8 h-8" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMenuOpen(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="md:hidden fixed top-0 right-0 w-80 h-screen z-50 bg-white shadow-2xl overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-gray-100" style={{ background: `linear-gradient(to right, ${accent}, ${accent})` }}>
                <div className="flex items-center">
                  <img src={theme.logoUrl || '/Maxhub.jpeg'} alt="Logo" className="w-14 h-14 object-contain rounded-full shadow-lg" />
                  <span className="ml-3 font-bold text-white text-lg font-leagueSpartan" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.5)' }}>{theme.brandName || 'MaXHub Logistics'}</span>
                </div>
                <button onClick={() => setMenuOpen(false)} className="text-white p-2 rounded-full hover:bg-white/20"><MdClose className="w-6 h-6" /></button>
              </div>
              <div className="p-4 space-y-2">
                {userIsDeliveryPartner && (
                  <>
                    <Link to={`${base}/dashboard`} className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-orange-50 rounded-lg" onClick={() => setMenuOpen(false)}><MdDashboard /> Dashboard</Link>
                    <Link to={`${base}/trips`} className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-orange-50 rounded-lg" onClick={() => setMenuOpen(false)}><MdList /> My Trips</Link>
                    <Link to={`${base}/trips/add`} className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-orange-50 rounded-lg" onClick={() => setMenuOpen(false)}><MdAddCircle /> Add Trip</Link>
                  </>
                )}
                {userIsCXO && <Link to={`${base}/cxo-dashboard`} className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-orange-50 rounded-lg" onClick={() => setMenuOpen(false)}><MdDashboard /> CXO Dashboard</Link>}
                {userIsAdmin && <Link to={`${base}/admin`} className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-orange-50 rounded-lg" onClick={() => setMenuOpen(false)}><MdAdminPanelSettings /> Admin</Link>}
                {user && <Link to={`${base}/profile`} className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-orange-50 rounded-lg" onClick={() => setMenuOpen(false)}><MdPerson /> Profile</Link>}
                {user ? (
                  <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 w-full text-left rounded-lg"><MdLogout /> Logout</button>
                ) : (
                  <button onClick={() => { onSignInClick(); setMenuOpen(false); }} className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-orange-50 rounded-lg w-full text-left"><MdPerson /> Sign In</button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Modal
        title="Confirm Logout"
        open={showLogoutConfirm}
        onOk={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
        okText="Yes, Logout"
        cancelText="Cancel"
        okType="danger"
        centered
        maskClosable={false}
      >
        <p className="pt-2">Are you sure you want to logout? You will need to sign in again to access your account.</p>
      </Modal>
    </nav>
  );
};

export default MLNavbar;
