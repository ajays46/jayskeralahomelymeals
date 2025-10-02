import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useNavigate } from 'react-router-dom';
import { Popconfirm } from 'antd';
import { 
  MdHistory, 
  MdSave, 
  MdClear, 
  MdCheckCircle, 
  MdSchedule,
  MdPeople,
  MdCompare,
  MdDelete,
  MdVisibility
} from 'react-icons/md';

/**
 * RouteHistoryManager - Simplified component for managing route history and selection
 * Features: Route history storage, route selection, save functionality, comparison navigation
 */
const RouteHistoryManager = forwardRef(({ 
  onSaveRoute, 
  onClearHistory, 
  showSuccessToast, 
  showErrorToast 
}, ref) => {
  const navigate = useNavigate();
  const [routeHistory, setRouteHistory] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [expandedRouteId, setExpandedRouteId] = useState(null);
  const [filters, setFilters] = useState({
    deliveryName: '',
    executive: '',
    location: '',
    mealType: 'breakfast' // Default to breakfast
  });

  // Load route history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('routeHistory');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setRouteHistory(parsed);
      } catch (error) {
        // Silent fallback - corrupted data, start fresh
        setRouteHistory([]);
        localStorage.removeItem('routeHistory');
      }
    }
  }, []);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    saveRouteResult: (executiveCount, routeData) => {
      const routeEntry = {
        id: Date.now(),
        executiveCount,
        timestamp: new Date(),
        routeData,
        status: 'draft'
      };
      const newHistory = [...routeHistory, routeEntry];
      setRouteHistory(newHistory);
      
      // Save to localStorage
      localStorage.setItem('routeHistory', JSON.stringify(newHistory));
      
      showSuccessToast(`Route saved with ${executiveCount} executive(s)`);
    },
    clearRouteHistory: () => {
      setRouteHistory([]);
      setSelectedRouteId(null);
      localStorage.removeItem('routeHistory');
    }
  }));

  // Save selected route
  const handleSaveSelectedRoute = async () => {
    if (!selectedRouteId) {
      showErrorToast('Please select a route first');
      return;
    }

    const selectedRoute = routeHistory.find(r => r.id === selectedRouteId);
    if (!selectedRoute) {
      showErrorToast('Selected route not found');
      return;
    }

    try {
      await onSaveRoute(selectedRoute.routeData);
      showSuccessToast(`Route with ${selectedRoute.executiveCount} executive(s) saved successfully`);
      setSelectedRouteId(null);
    } catch (error) {
      showErrorToast('Failed to save route');
    }
  };

  // Clear route history
  const clearRouteHistory = () => {
    setRouteHistory([]);
    setSelectedRouteId(null);
    localStorage.removeItem('routeHistory');
    onClearHistory();
    showSuccessToast('Route history cleared');
  };

  // Discard individual route
  const handleDiscardRoute = (routeId) => {
    if (window.confirm('Are you sure you want to discard this route? This action cannot be undone.')) {
      const updatedHistory = routeHistory.filter(route => route.id !== routeId);
      setRouteHistory(updatedHistory);
      localStorage.setItem('routeHistory', JSON.stringify(updatedHistory));
      
      if (selectedRouteId === routeId) {
        setSelectedRouteId(null);
      }
      
      showSuccessToast('Route discarded successfully');
    }
  };

  // Approve individual route
  const handleApproveRoute = async (routeId) => {
    const routeToApprove = routeHistory.find(r => r.id === routeId);
    if (!routeToApprove) {
      showErrorToast('Route not found');
      return;
    }

    try {
      // First save the route to backend
      await onSaveRoute(routeToApprove.routeData);
      
      // Then update the status to approved
      const updatedHistory = routeHistory.map(route => 
        route.id === routeId 
          ? { ...route, status: 'approved' }
          : route
      );
      setRouteHistory(updatedHistory);
      localStorage.setItem('routeHistory', JSON.stringify(updatedHistory));
      
      showSuccessToast('Route approved and saved successfully');
    } catch (error) {
      console.error('Error approving route:', error);
      showErrorToast('Failed to approve route');
    }
  };

  // Navigate to comparison page
  const navigateToComparison = () => {
    localStorage.setItem('routeHistory', JSON.stringify(routeHistory));
    navigate('/jkhm/route-comparison');
  };

  // Navigate to route view page
  const openRouteInNewTab = (route) => {
    const routeData = route.routeData;
    const routeInfo = {
      routeNumber: routeHistory.findIndex(r => r.id === route.id) + 1,
      executiveCount: route.executiveCount,
      timestamp: route.timestamp,
      status: route.status
    };

    // Save data to localStorage as backup
    localStorage.setItem('currentRouteView', JSON.stringify({
      routeData,
      routeInfo
    }));

    // Navigate to route view page
    navigate('/jkhm/route-view', {
      state: {
        routeData,
        routeInfo
      }
    });
  };

  // Generate map link for location
  const generateMapLink = (location) => {
    if (!location || !location.trim()) {
      return null;
    }
    return `https://www.google.com/maps/search/${encodeURIComponent(location.trim())}`;
  };

  // Toggle route expansion
  const toggleRouteExpansion = (routeId) => {
    setExpandedRouteId(expandedRouteId === routeId ? null : routeId);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      deliveryName: '',
      executive: '',
      location: '',
      mealType: 'breakfast' // Reset to breakfast
    });
  };

  // Render route data table
  const renderRouteDataTable = (route) => {
    const result = route.routeData?.data?.externalResponse?.result;
    if (!result) return null;

    // Filter data based on current filters
    const filteredMealData = (mealType) => {
      if (!result[mealType]) return [];
      
      return result[mealType].filter(item => {
        const matchesDeliveryName = !filters.deliveryName || 
          (item.Delivery_Name && item.Delivery_Name.toLowerCase().includes(filters.deliveryName.toLowerCase()));
        const matchesExecutive = !filters.executive || 
          (item.Executive && item.Executive.toLowerCase().includes(filters.executive.toLowerCase()));
        const matchesLocation = !filters.location || 
          (item.Location && item.Location.toLowerCase().includes(filters.location.toLowerCase()));
        
        return matchesDeliveryName && matchesExecutive && matchesLocation;
      });
    };

    const selectedMealData = filteredMealData(filters.mealType);
    const totalRoutes = result[filters.mealType]?.length || 0;

    return (
      <div className="mt-3 sm:mt-4 bg-gray-50 rounded-lg p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
          <h6 className="text-base sm:text-lg font-semibold text-gray-900">Route Details</h6>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs sm:text-sm font-medium text-gray-700">Meal Type:</label>
              <select
                value={filters.mealType}
                onChange={(e) => setFilters(prev => ({ ...prev, mealType: e.target.value }))}
                className="px-2 py-1 sm:px-3 sm:py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="all">All Meals</option>
              </select>
            </div>
            <button
              onClick={clearFilters}
              className="px-2 py-1 sm:px-3 sm:py-1 bg-gray-600 text-white text-xs sm:text-sm rounded-md hover:bg-gray-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Delivery Name</label>
            <input
              type="text"
              value={filters.deliveryName}
              onChange={(e) => setFilters(prev => ({ ...prev, deliveryName: e.target.value }))}
              placeholder="Search by delivery name..."
              className="w-full px-2 py-1 sm:px-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Executive</label>
            <input
              type="text"
              value={filters.executive}
              onChange={(e) => setFilters(prev => ({ ...prev, executive: e.target.value }))}
              placeholder="Search by executive..."
              className="w-full px-2 py-1 sm:px-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={filters.location}
              onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Search by location..."
              className="w-full px-2 py-1 sm:px-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
            />
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-3 sm:mb-4 text-xs sm:text-sm text-gray-600">
          Showing {selectedMealData.length} of {totalRoutes} routes for {filters.mealType}
        </div>

        {/* Data Table */}
        {selectedMealData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">DELIVERY NAME</th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">EXECUTIVE</th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">LOCATION</th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">PACKAGES</th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">DISTANCE (KM)</th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">TIME (MIN)</th>
                  <th className="px-2 py-2 sm:px-4 sm:py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">MAP LINK</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {selectedMealData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-2 py-2 sm:px-4 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                      {item.Delivery_Name || '-'}
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {item.Executive || '-'}
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {item.Location || '-'}
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-4 whitespace-nowrap text-center text-xs sm:text-sm text-gray-900">
                      {item.Packages || '-'}
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-4 whitespace-nowrap text-center text-xs sm:text-sm text-gray-900">
                      {item.Distance_km || '-'}
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-4 whitespace-nowrap text-center text-xs sm:text-sm text-gray-900">
                      {(() => {
                        const timeValue = item.Cumulative_Time_min || item.Time_From_Prev_Stop_min || item.Time;
                        return timeValue && timeValue !== '0' && timeValue !== 0 ? 
                          `${parseFloat(timeValue).toFixed(1)} min` : '-';
                      })()}
                    </td>
                    <td className="px-2 py-2 sm:px-4 sm:py-4 whitespace-nowrap text-center">
                      {item.Map_Link ? (
                        <a 
                          href={item.Map_Link}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
                        >
                          <span className="hidden sm:inline">View Map</span>
                          <span className="sm:hidden">Map</span>
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8 text-gray-500">
            <p className="text-xs sm:text-sm">No routes found matching your filters.</p>
            <button
              onClick={clearFilters}
              className="mt-2 px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white text-xs sm:text-sm rounded-md hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    );
  };


  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border border-slate-200 shadow-lg p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
            <MdHistory className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-800">Draft Routes</h3>
            <p className="text-xs sm:text-sm text-slate-600">Manage and approve route planning drafts</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="text-left sm:text-right">
            <div className="text-xl sm:text-2xl font-bold text-slate-800">{routeHistory.length}</div>
            <div className="text-xs sm:text-sm text-slate-600">Routes</div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            {routeHistory.length > 0 && (
              <button
                onClick={clearRouteHistory}
                className="px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center justify-center gap-2 text-xs sm:text-sm font-medium shadow-md hover:shadow-lg"
              >
                <MdClear className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Clear All Routes</span>
                <span className="sm:hidden">Clear All</span>
              </button>
            )}
            {routeHistory.length > 1 && (
              <button
                onClick={navigateToComparison}
                className="px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2 text-xs sm:text-sm font-medium shadow-md hover:shadow-lg"
              >
                <MdCompare className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Compare Routes</span>
                <span className="sm:hidden">Compare</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Route List */}
      {routeHistory.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-md">
            <MdHistory className="w-6 h-6 sm:w-8 sm:h-8 text-slate-500" />
          </div>
          <h4 className="text-base sm:text-lg font-semibold text-slate-800 mb-2">No Draft Routes Available</h4>
          <p className="text-sm sm:text-base text-slate-600 px-4">Run the route planning program to create draft routes for review and approval.</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
          {routeHistory.map((route, index) => (
            <div 
              key={route.id}
              className={`rounded-xl border transition-all duration-200 shadow-sm hover:shadow-md ${
                selectedRouteId === route.id 
                  ? 'border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg' 
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div 
                className="p-3 sm:p-4 cursor-pointer"
                onClick={() => toggleRouteExpansion(route.id)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                      <MdPeople className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="font-bold text-slate-800 text-sm sm:text-base">
                        Draft Route {index + 1}
                      </h5>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <MdPeople className="w-3 h-3 sm:w-4 sm:h-4" />
                          {route.executiveCount} Executive{route.executiveCount > 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <MdSchedule className="w-3 h-3 sm:w-4 sm:h-4" />
                          {new Date(route.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <span className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-semibold self-start shadow-sm ${
                      route.status === 'draft' 
                        ? 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border border-orange-200'
                        : route.status === 'approved'
                        ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-200'
                        : 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-200'
                    }`}>
                      {route.status}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openRouteInNewTab(route);
                        }}
                        className="px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg"
                      >
                        <MdVisibility className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">View Route</span>
                        <span className="sm:hidden">View</span>
                      </button>
                      {/* Approve Button - Hidden if any route is approved */}
                      {route.status !== 'approved' && !routeHistory.some(r => r.status === 'approved') && (
                        <Popconfirm
                          title="Approve Route"
                          description={
                            <div>
                              <p>Are you sure you want to approve this route?</p>
                              <div className="mt-2 text-xs text-gray-600">
                                <p><strong>Route:</strong> Draft Route {index + 1}</p>
                                <p><strong>Executives:</strong> {route.executiveCount}</p>
                                <p><strong>Date:</strong> {new Date(route.timestamp).toLocaleDateString()}</p>
                              </div>
                              <p className="mt-2 text-xs text-gray-500">
                                Once approved, this route will be marked as approved and ready for execution.
                              </p>
                            </div>
                          }
                          icon={<MdCheckCircle className="text-green-500" />}
                          okText="Yes, Approve"
                          cancelText="Cancel"
                          okType="primary"
                          onConfirm={() => handleApproveRoute(route.id)}
                        >
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg"
                          >
                            <MdSave className="w-3 h-3 sm:w-4 sm:h-4" />
                            Approve
                          </button>
                        </Popconfirm>
                      )}
                      
                      {/* Discard Button - Only hidden if current route is already approved */}
                      {route.status !== 'approved' && (
                        <Popconfirm
                          title="Discard Route"
                          description={
                            <div>
                              <p>Are you sure you want to discard this route?</p>
                              <div className="mt-2 text-xs text-gray-600">
                                <p><strong>Route:</strong> Draft Route {index + 1}</p>
                                <p><strong>Executives:</strong> {route.executiveCount}</p>
                                <p><strong>Date:</strong> {new Date(route.timestamp).toLocaleDateString()}</p>
                              </div>
                              <p className="mt-2 text-xs text-red-500">
                                <strong>Warning:</strong> This action cannot be undone. The route will be permanently removed.
                              </p>
                            </div>
                          }
                          icon={<MdDelete className="text-red-500" />}
                          okText="Yes, Discard"
                          cancelText="Cancel"
                          okType="danger"
                          onConfirm={() => handleDiscardRoute(route.id)}
                        >
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg"
                          >
                            <MdDelete className="w-3 h-3 sm:w-4 sm:h-4" />
                            Discard
                          </button>
                        </Popconfirm>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Expanded Route Data Table */}
              {expandedRouteId === route.id && renderRouteDataTable(route)}
            </div>
          ))}
        </div>
      )}

    </div>
  );
});

export default RouteHistoryManager;