import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiX } from 'react-icons/fi';
import { MdPeople, MdHistory, MdSave, MdClear, MdCheckCircle, MdSchedule, MdExpandMore, MdExpandLess } from 'react-icons/md';
import { showSuccessToast, showErrorToast } from '../utils/toastConfig.jsx';

/**
 * RouteComparisonPage - Dedicated page for comparing route planning results
 * Shows two tables side by side without navigation bar
 * Features: Full-screen comparison, table selection, save functionality
 */
const RouteComparisonPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [routeHistory, setRouteHistory] = useState([]);
  const [leftRoute, setLeftRoute] = useState(null);
  const [rightRoute, setRightRoute] = useState(null);
  const [leftTableTab, setLeftTableTab] = useState('breakfast');
  const [rightTableTab, setRightTableTab] = useState('breakfast');
  const [leftFilters, setLeftFilters] = useState({ deliveryName: '', executive: '', location: '' });
  const [rightFilters, setRightFilters] = useState({ deliveryName: '', executive: '', location: '' });

  // Load route history from localStorage or props
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

  // Save route history to localStorage
  const saveRouteHistory = (history) => {
    localStorage.setItem('routeHistory', JSON.stringify(history));
    setRouteHistory(history);
  };

  // Clear route history
  const clearRouteHistory = () => {
    localStorage.removeItem('routeHistory');
    setRouteHistory([]);
    setLeftRoute(null);
    setRightRoute(null);
    showSuccessToast('Route history cleared');
  };

  // Set left route
  const setLeftRouteHandler = (route) => {
    setLeftRoute(route);
    setLeftTableTab('breakfast');
    setLeftFilters({ deliveryName: '', executive: '', location: '' });
  };

  // Set right route
  const setRightRouteHandler = (route) => {
    setRightRoute(route);
    setRightTableTab('breakfast');
    setRightFilters({ deliveryName: '', executive: '', location: '' });
  };

  // Clear filters for left table
  const clearLeftFilters = () => {
    setLeftFilters({ deliveryName: '', executive: '', location: '' });
  };

  // Clear filters for right table
  const clearRightFilters = () => {
    setRightFilters({ deliveryName: '', executive: '', location: '' });
  };

  // Render route planning table
  const renderRouteTable = (route, side) => {
    if (!route?.routeData?.data?.externalResponse?.result) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>No route planning data available</p>
        </div>
      );
    }

    const result = route.routeData.data.externalResponse.result;
    const currentTab = side === 'left' ? leftTableTab : rightTableTab;
    const filters = side === 'left' ? leftFilters : rightFilters;
    const setTab = side === 'left' ? setLeftTableTab : setRightTableTab;
    const setFilter = side === 'left' ? setLeftFilters : setRightFilters;
    const clearFilter = side === 'left' ? clearLeftFilters : clearRightFilters;

    const availableTabs = ['breakfast', 'lunch', 'dinner'].filter(mealType => 
      result[mealType] && result[mealType].length > 0
    );

    if (availableTabs.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          <p>No route data available for any meal type</p>
        </div>
      );
    }

    const currentTabData = result[currentTab] || [];
    const filteredData = currentTabData.filter(item => {
      const deliveryNameMatch = !filters.deliveryName || 
        (item.Delivery_Name && item.Delivery_Name.toLowerCase().includes(filters.deliveryName.toLowerCase()));
      const executiveMatch = !filters.executive || 
        (item.Executive && item.Executive.toLowerCase().includes(filters.executive.toLowerCase()));
      const locationMatch = !filters.location || 
        (item.Location && item.Location.toLowerCase().includes(filters.location.toLowerCase()));
      
      return deliveryNameMatch && executiveMatch && locationMatch;
    });

    return (
      <div className="h-full flex flex-col">
        {/* Table Header */}
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <MdPeople className="w-4 h-4 text-blue-500" />
            Route {routeHistory.findIndex(r => r.id === route.id) + 1} - {route.executiveCount} Executive(s)
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            {new Date(route.timestamp).toLocaleString()}
          </p>
        </div>

        {/* Controls */}
        <div className="p-3 space-y-2">
          {/* Date Display */}
          {currentTabData.length > 0 && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs">
              <span className="text-blue-600">📅</span>
              <span className="text-blue-800 font-medium ml-1">
                {currentTabData[0]?.Date || 'N/A'}
              </span>
            </div>
          )}

          {/* Meal Type Selector */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Meal:</label>
            <select
              value={currentTab}
              onChange={(e) => setTab(e.target.value)}
              className="w-full px-2 py-1 text-xs text-gray-900 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {availableTabs.map((mealType) => (
                <option key={mealType} value={mealType}>
                  {mealType.charAt(0).toUpperCase() + mealType.slice(1)} ({result[mealType].length})
                </option>
              ))}
            </select>
          </div>

          {/* Filters */}
          <div className="bg-gray-50 p-2 rounded border border-gray-200">
            <h4 className="text-xs font-semibold text-gray-700 mb-1">🔍 Filter</h4>
            <div className="space-y-1">
              <input
                type="text"
                placeholder="Name..."
                value={filters.deliveryName}
                onChange={(e) => setFilter(prev => ({ ...prev, deliveryName: e.target.value }))}
                className="w-full px-2 py-1 text-xs text-gray-900 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Executive..."
                value={filters.executive}
                onChange={(e) => setFilter(prev => ({ ...prev, executive: e.target.value }))}
                className="w-full px-2 py-1 text-xs text-gray-900 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Location..."
                value={filters.location}
                onChange={(e) => setFilter(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-2 py-1 text-xs text-gray-900 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-between items-center mt-1">
              <button
                onClick={clearFilter}
                className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Clear
              </button>
              <div className="text-xs text-gray-500">
                {filteredData.length}/{currentTabData.length}
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full divide-y divide-gray-200 text-xs table-fixed">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-center py-2 px-1 font-semibold text-gray-700 text-xs uppercase tracking-wider w-8">#</th>
                <th className="text-left py-2 px-1 font-semibold text-gray-700 text-xs uppercase tracking-wider">Name</th>
                <th className="text-center py-2 px-1 font-semibold text-gray-700 text-xs uppercase tracking-wider w-20">Exec</th>
                <th className="text-left py-2 px-1 font-semibold text-gray-700 text-xs uppercase tracking-wider">Location</th>
                <th className="text-center py-2 px-1 font-semibold text-gray-700 text-xs uppercase tracking-wider w-12">Pkgs</th>
                <th className="text-center py-2 px-1 font-semibold text-gray-700 text-xs uppercase tracking-wider w-12">Dist</th>
                <th className="text-center py-2 px-1 font-semibold text-gray-700 text-xs uppercase tracking-wider w-12">Time (Min)</th>
                <th className="text-center py-2 px-1 font-semibold text-gray-700 text-xs uppercase tracking-wider w-12">Map</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="py-2 px-1 text-gray-900 font-medium text-xs text-center">
                    <span className="inline-flex items-center justify-center w-3 h-3 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                      {item.Stop_No || '-'}
                    </span>
                  </td>
                  <td className="py-2 px-1 text-gray-900 font-semibold text-xs">
                    <div className="truncate" title={item.Delivery_Name}>
                      {item.Delivery_Name || '-'}
                    </div>
                  </td>
                  <td className="py-2 px-1 text-center">
                    <span className={`inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium ${
                      item.Executive === 'Unassigned' || !item.Executive
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {item.Executive || 'Unassigned'}
                    </span>
                  </td>
                  <td className="py-2 px-1 text-gray-900 text-xs">
                    <div className="truncate" title={item.Location}>
                      {item.Location || '-'}
                    </div>
                  </td>
                  <td className="py-2 px-1 text-center text-gray-900 text-xs font-medium">
                    {item.Packages || '0'}
                  </td>
                  <td className="py-2 px-1 text-center text-gray-900 text-xs">
                    {item.Distance_From_Prev_Stop_km ? parseFloat(item.Distance_From_Prev_Stop_km).toFixed(1) : '0.0'}
                  </td>
                  <td className="py-2 px-1 text-center text-gray-900 text-xs">
                    {(() => {
                      // Check for Cumulative_Time_min first, then Time_From_Prev_Stop_min
                      const timeValue = item.Cumulative_Time_min || item.Time_From_Prev_Stop_min || item.Time;
                      return timeValue && timeValue !== '0' && timeValue !== 0 ? 
                        `${parseFloat(timeValue).toFixed(1)} min` : '-';
                    })()}
                  </td>
                  <td className="py-2 px-1 text-center">
                    {item.Map_Link ? (
                      <a
                        href={item.Map_Link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        View
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

        {/* Table Footer */}
        <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center space-x-3">
              <span className="font-medium">
                {filteredData.length}/{currentTabData.length} routes
              </span>
              <span className="text-gray-400">•</span>
              <span>
                Pkgs: {filteredData.reduce((sum, item) => sum + (parseInt(item.Packages) || 0), 0)}
              </span>
              <span className="text-gray-400">•</span>
              <span>
                Dist: {filteredData.reduce((sum, item) => sum + (parseFloat(item.Distance_From_Prev_Stop_km) || 0), 0).toFixed(1)}km
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/jkhm/delivery-manager?tab=routeManagement')}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MdHistory className="w-6 h-6 text-blue-500" />
            Route Comparison
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {routeHistory.length} routes available
          </span>
          <button
            onClick={clearRouteHistory}
            className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center gap-1"
          >
            <MdClear className="w-4 h-4" />
            Clear All
          </button>
        </div>
      </div>

      {/* Route Selection Controls */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-6">
          {/* Left Route Selection */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Left Table</label>
            <select
              value={leftRoute?.id || ''}
              onChange={(e) => {
                const route = routeHistory.find(r => r.id === parseInt(e.target.value));
                setLeftRouteHandler(route);
              }}
              className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select left route...</option>
              {routeHistory.map((route, index) => (
                <option key={route.id} value={route.id}>
                  Route {index + 1} - {route.executiveCount} Executive(s)
                </option>
              ))}
            </select>
          </div>

          {/* Right Route Selection */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Right Table</label>
            <select
              value={rightRoute?.id || ''}
              onChange={(e) => {
                const route = routeHistory.find(r => r.id === parseInt(e.target.value));
                setRightRouteHandler(route);
              }}
              className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select right route...</option>
              {routeHistory.map((route, index) => (
                <option key={route.id} value={route.id}>
                  Route {index + 1} - {route.executiveCount} Executive(s)
                </option>
              ))}
            </select>
          </div>

          {/* Quick Route Selection */}
          <div className="w-64">
            <label className="block text-sm font-medium text-gray-700 mb-2">Quick Select</label>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {routeHistory.map((route, index) => (
                <div
                  key={route.id}
                  className={`p-2 border rounded cursor-pointer transition-colors text-xs ${
                    leftRoute?.id === route.id || rightRoute?.id === route.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    if (leftRoute?.id === route.id) {
                      setLeftRoute(null);
                    } else if (rightRoute?.id === route.id) {
                      setRightRoute(null);
                    } else if (!leftRoute) {
                      setLeftRouteHandler(route);
                    } else if (!rightRoute) {
                      setRightRouteHandler(route);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      Route {index + 1} - {route.executiveCount} Exec
                    </span>
                    <div className="flex items-center gap-1">
                      {leftRoute?.id === route.id && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">L</span>
                      )}
                      {rightRoute?.id === route.id && (
                        <span className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded">R</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Tables */}
      <div className="flex-1 flex">
        {/* Left Table */}
        <div className="flex-1 border-r border-gray-200">
          {leftRoute ? (
            renderRouteTable(leftRoute, 'left')
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MdPeople className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Select a route for the left table</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Table */}
        <div className="flex-1">
          {rightRoute ? (
            renderRouteTable(rightRoute, 'right')
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MdPeople className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Select a route for the right table</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RouteComparisonPage;
