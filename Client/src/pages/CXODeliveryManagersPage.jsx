import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { MdLocalShipping, MdPerson } from 'react-icons/md';
import useAuthStore from '../stores/Zustand.store';
import { useAllDeliveryManagersFromDb } from '../hooks/deliverymanager/useAllDeliveryManagersFromDb';

/**
 * CXODeliveryManagersPage - CXO (CEO/CFO) view for Delivery Manager dashboard
 * Shows only delivery managers' details (list from DB). UI matches Delivery Manager page (dark theme).
 * Rendered when a CXO user selects "Delivery Manager" from the sidebar.
 */
const CXODeliveryManagersPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const {
    data: managersResponse,
    isLoading: managersLoading,
    error: managersError,
    refetch: refetchManagers
  } = useAllDeliveryManagersFromDb({ enabled: true });

  const managers = managersResponse?.data ?? [];

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return '—';
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/jkhm');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-x-hidden">
      {/* Navbar - same style as Delivery Manager page */}
      <div className="fixed top-0 left-0 right-0 h-16 sm:h-20 lg:h-24 bg-gray-800 border-b border-gray-700 z-40 flex items-center justify-between px-3 sm:px-4 lg:px-8 overflow-hidden">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 max-w-[calc(100%-2rem)]">
          <button
            onClick={() => navigate('/jkhm')}
            className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
            aria-label="Go back to home"
          >
            <FiArrowLeft size={18} className="sm:w-5 sm:h-5" />
          </button>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <MdLocalShipping className="text-xl sm:text-2xl text-blue-500 flex-shrink-0" />
            <h1 className="text-sm sm:text-lg lg:text-xl font-bold truncate max-w-[200px] sm:max-w-[300px] lg:max-w-[400px]">
              Delivery Managers
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-all duration-200 shadow-sm"
            title="Logout"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content - same padding/layout as Delivery Manager (no sidebar) */}
      <div className="pt-16 sm:pt-20 lg:pt-24">
        <div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-full">
          {/* Delivery Managers Table - same card style as DM Sellers/Orders */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden mb-6 sm:mb-8">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-700">
              <h2 className="text-base sm:text-lg font-semibold text-white">Delivery Managers List</h2>
              <p className="text-gray-400 text-xs sm:text-sm">All delivery managers in the system</p>
            </div>

            <div className="p-4 sm:p-6">
              {managersLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-600 border-t-blue-500" />
                </div>
              ) : managersError ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-red-400">{managersError?.message || 'Failed to load delivery managers.'}</p>
                  <button
                    type="button"
                    onClick={() => refetchManagers()}
                    className="mt-3 inline-flex items-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : !managers.length ? (
                <div className="text-center py-8 sm:py-12 px-4">
                  <MdPerson className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-400">No delivery managers found</h3>
                  <p className="mt-1 text-xs sm:text-sm text-gray-500">There are no delivery managers in the system.</p>
                </div>
              ) : (
                <div className="overflow-x-auto max-w-full">
                  <table className="w-full min-w-[400px]">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 tracking-wider min-w-[40px]">#</th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 tracking-wider min-w-[120px]">Name</th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 tracking-wider min-w-[160px]">Email</th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 tracking-wider min-w-[100px]">Phone</th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 tracking-wider min-w-[120px]">Company</th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 tracking-wider min-w-[80px]">Status</th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 tracking-wider min-w-[100px]">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                      {managers.map((mgr, i) => (
                        <tr key={mgr.id ?? i} className="hover:bg-gray-700 transition-colors">
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-400">{i + 1}</td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-500 flex items-center justify-center">
                                  <MdPerson className="text-white text-sm sm:text-lg" />
                                </div>
                              </div>
                              <div className="ml-2 sm:ml-4 min-w-0 flex-1">
                                <div className="text-xs sm:text-sm font-medium text-white truncate">{mgr.name ?? '—'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-300 truncate max-w-[180px]">{mgr.email ?? '—'}</td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-300">{mgr.phoneNumber ?? '—'}</td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-300">{mgr.companyName ?? '—'}</td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              (mgr.status || '').toUpperCase() === 'ACTIVE'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {mgr.status ?? '—'}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-300">{formatDate(mgr.joinedDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CXODeliveryManagersPage;
