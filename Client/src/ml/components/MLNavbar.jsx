/**
 * MLNavbar - MaXHub Logistics navbar (logistics-only; no Menu, Place Order, Help).
 * Used when companyPath === 'ml'. Sign In opens same AuthSlider with ML theme.
 */
import React, { useState, useEffect } from 'react';
import { MdPerson, MdDashboard, MdLogout, MdClose, MdMenu, MdEmail, MdPhone, MdAdminPanelSettings, MdAddCircle, MdList } from 'react-icons/md';
import { FaUserCircle } from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../stores/Zustand.store';
import { useCompanyBasePath, useTenant } from '../../context/TenantContext';
import { getThemeForCompany } from '../../config/tenantThemes';
import { useLogout } from '../../hooks/userHooks/useLogin';
import { Modal } from 'antd';
import { isDeliveryPartner, isCEO, isCFO, isAdmin, isDeliveryManager } from '../../utils/roleUtils';
import MLJaiceChat from './MLJaiceChat';

const MLNavbar = ({ onSignInClick }) => {
  const location = useLocation();
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
  const canUseJaice = user && (isDeliveryManager(roles) || isCEO(roles) || isCFO(roles) || isAdmin(roles));

  const isActive = (path) => {
    if (!path || path === base) return location.pathname === base || location.pathname === `${base}/`;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

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
    <>
    <nav
      className={`tenant-nav w-full z-50 fixed top-0 left-0 right-0 transition-transform duration-300 ${showNavbar ? 'translate-y-0' : '-translate-y-full'} ${
        user && userIsDeliveryPartner
          ? 'bg-transparent shadow-none md:bg-[#2d2d2d]/95 md:shadow-lg'
          : (theme.navBg || 'bg-[#2d2d2d]/95') + ' shadow-lg'
      }`}
      style={{ ['--tenant-accent']: accent, paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-5">
        <div className="flex justify-between items-center h-14 sm:h-16 md:h-20">
          <div className="flex items-center min-w-0">
            <Link to={base} className="flex items-center group gap-2 min-w-0">
              <motion.img
                src={theme.logoUrl || '/Maxhub.jpeg'}
                alt="MaXHub Logistics"
                className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 object-contain rounded-full shadow-md flex-shrink-0"
                whileTap={{ scale: 0.98 }}
              />
              <span className={`font-medium flex items-center gap-1 min-w-0 ${user && userIsDeliveryPartner ? 'text-gray-900 md:text-white' : 'text-white'}`}>
                <span
                  className={`text-base sm:text-lg md:text-xl truncate font-leagueSpartan font-bold ${user && userIsDeliveryPartner ? 'md:drop-shadow-sm' : ''}`}
                  style={{ textShadow: user && userIsDeliveryPartner ? 'none' : '1px 1px 4px rgba(0,0,0,0.4)', color: accent }}
                >
                  {theme.brandName || 'MaXHub'}
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

          {/* Hamburger: only on mobile when not delivery partner (delivery partner uses bottom nav) */}
          {!(user && userIsDeliveryPartner) && (
            <div className="md:hidden flex items-center gap-1">
              {user && (
                <motion.button
                  type="button"
                  onClick={handleLogout}
                  className="text-gray-900 focus:outline-none p-2 rounded-lg hover:bg-black/5 transition-all duration-300"
                  whileTap={{ scale: 0.95 }}
                  aria-label="Logout"
                  title="Logout"
                >
                  <MdLogout className="w-7 h-7" />
                </motion.button>
              )}
              <motion.button onClick={() => setMenuOpen(!menuOpen)} className="text-gray-900 focus:outline-none p-2 rounded-lg hover:bg-black/5 transition-all duration-300" whileTap={{ scale: 0.95 }}>
                {menuOpen ? <MdClose className="w-8 h-8" /> : <MdMenu className="w-8 h-8" />}
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMenuOpen(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="md:hidden fixed top-0 right-0 w-[min(320px,85vw)] max-w-full h-full z-50 bg-white shadow-2xl overflow-y-auto" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
              <div className="flex justify-between items-center p-4 border-b border-gray-100" style={{ background: `linear-gradient(to right, ${accent}, ${accent})`, paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
                <div className="flex items-center min-w-0">
                  <img src={theme.logoUrl || '/Maxhub.jpeg'} alt="Logo" className="w-12 h-12 object-contain rounded-full shadow-md flex-shrink-0" />
                  <span className="ml-3 font-bold text-white text-base truncate font-leagueSpartan" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.4)' }}>{theme.brandName || 'MaXHub'}</span>
                </div>
                <button onClick={() => setMenuOpen(false)} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-white rounded-xl active:bg-white/20"><MdClose className="w-6 h-6" /></button>
              </div>
              <div className="p-4 space-y-1">
                {userIsDeliveryPartner && (
                  <>
                    <Link to={`${base}/dashboard`} className="flex items-center gap-3 min-h-[48px] px-4 py-2 text-gray-700 active:bg-orange-50 rounded-xl text-base font-medium" onClick={() => setMenuOpen(false)}><MdDashboard className="text-xl flex-shrink-0" /> Dashboard</Link>
                    <Link to={`${base}/trips`} className="flex items-center gap-3 min-h-[48px] px-4 py-2 text-gray-700 active:bg-orange-50 rounded-xl text-base font-medium" onClick={() => setMenuOpen(false)}><MdList className="text-xl flex-shrink-0" /> My Trips</Link>
                    <Link to={`${base}/trips/add`} className="flex items-center gap-3 min-h-[48px] px-4 py-2 text-gray-700 active:bg-orange-50 rounded-xl text-base font-medium" onClick={() => setMenuOpen(false)}><MdAddCircle className="text-xl flex-shrink-0" /> Add Trip</Link>
                  </>
                )}
                {userIsCXO && <Link to={`${base}/cxo-dashboard`} className="flex items-center gap-3 min-h-[48px] px-4 py-2 text-gray-700 active:bg-orange-50 rounded-xl text-base font-medium" onClick={() => setMenuOpen(false)}><MdDashboard className="text-xl flex-shrink-0" /> CXO Dashboard</Link>}
                {userIsAdmin && <Link to={`${base}/admin`} className="flex items-center gap-3 min-h-[48px] px-4 py-2 text-gray-700 active:bg-orange-50 rounded-xl text-base font-medium" onClick={() => setMenuOpen(false)}><MdAdminPanelSettings className="text-xl flex-shrink-0" /> Admin</Link>}
                {user && <Link to={`${base}/profile`} className="flex items-center gap-3 min-h-[48px] px-4 py-2 text-gray-700 active:bg-orange-50 rounded-xl text-base font-medium" onClick={() => setMenuOpen(false)}><MdPerson className="text-xl flex-shrink-0" /> Profile</Link>}
                {user ? (
                  <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="flex items-center gap-3 min-h-[48px] px-4 py-2 text-gray-700 active:bg-red-50 active:text-red-600 w-full text-left rounded-xl text-base font-medium"><MdLogout className="text-xl flex-shrink-0" /> Logout</button>
                ) : (
                  <button onClick={() => { onSignInClick(); setMenuOpen(false); }} className="flex items-center gap-3 min-h-[48px] px-4 py-2 text-gray-700 active:bg-orange-50 w-full text-left rounded-xl text-base font-medium"><MdPerson className="text-xl flex-shrink-0" /> Sign In</button>
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

      {/* Jaice chat - for CXO / Delivery Manager / Admin */}
      {canUseJaice && <MLJaiceChat />}

      {/* Bottom nav - fixed to bottom of screen, mobile only, delivery partner */}
      {user && userIsDeliveryPartner && (
        <div
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]"
          style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        >
          <div className="flex items-stretch justify-around h-14 min-w-0">
            <Link
              to={`${base}/dashboard`}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 min-w-0 py-2 transition-colors ${
                isActive(`${base}/dashboard`) ? 'text-opacity-100' : 'text-gray-500'
              }`}
              style={{ color: isActive(`${base}/dashboard`) ? accent : undefined }}
            >
              <MdDashboard className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs font-medium truncate max-w-full px-0.5">Dashboard</span>
            </Link>
            <Link
              to={`${base}/trips`}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 min-w-0 py-2 transition-colors ${
                isActive(`${base}/trips`) && !location.pathname.includes('/add') ? 'text-opacity-100' : 'text-gray-500'
              }`}
              style={{
                color: isActive(`${base}/trips`) && !location.pathname.includes('/add') ? accent : undefined,
              }}
            >
              <MdList className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs font-medium truncate max-w-full px-0.5">My Trips</span>
            </Link>
            <Link
              to={`${base}/trips/add`}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 min-w-0 py-2 transition-colors ${
                location.pathname === `${base}/trips/add` ? 'text-opacity-100' : 'text-gray-500'
              }`}
              style={{ color: location.pathname === `${base}/trips/add` ? accent : undefined }}
            >
              <MdAddCircle className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs font-medium truncate max-w-full px-0.5">Add Trip</span>
            </Link>
            <Link
              to={`${base}/profile`}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 min-w-0 py-2 transition-colors ${
                isActive(`${base}/profile`) ? 'text-opacity-100' : 'text-gray-500'
              }`}
              style={{ color: isActive(`${base}/profile`) ? accent : undefined }}
            >
              <MdPerson className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs font-medium truncate max-w-full px-0.5">Profile</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 min-w-0 py-2 transition-colors text-gray-500 active:text-red-600 active:bg-red-50/50"
            >
              <MdLogout className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs font-medium truncate max-w-full px-0.5">Logout</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default MLNavbar;
