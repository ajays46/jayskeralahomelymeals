import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MdArrowBack, MdPeople, MdSchedule, MdCheckCircle } from 'react-icons/md';

const RouteViewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [routeData, setRouteData] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [selectedMealType, setSelectedMealType] = useState('breakfast');
  const [filters, setFilters] = useState({
    deliveryName: '',
    executive: '',
    location: ''
  });

  useEffect(() => {
    // Get route data from location state or localStorage
    if (location.state?.routeData) {
      setRouteData(location.state.routeData);
      setRouteInfo(location.state.routeInfo);
    } else {
      // Fallback to localStorage if no state
      const savedData = localStorage.getItem('currentRouteView');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setRouteData(parsed.routeData);
        setRouteInfo(parsed.routeInfo);
      }
    }
  }, [location.state]);

  const goBack = () => {
    // Navigate back to Route & Management tab in Delivery Manager page
    navigate('/jkhm/delivery-manager?tab=routeManagement');
  };

  const generateMapLink = (location) => {
    if (!location || !location.trim()) {
      return null;
    }
    return `https://www.google.com/maps/search/${encodeURIComponent(location.trim())}`;
  };

  const clearFilters = () => {
    setFilters({
      deliveryName: '',
      executive: '',
      location: ''
    });
  };

  if (!routeData || !routeInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Route Data Found</h2>
          <p className="text-gray-600 mb-4">The route data could not be loaded.</p>
          <button
            onClick={goBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <MdArrowBack className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const result = routeData.data?.externalResponse?.result;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Simple Back Button */}
        <div className="mb-6">
          <button
            onClick={goBack}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <MdArrowBack className="w-4 h-4" />
            Go Back
          </button>
        </div>

        {/* Route Planning Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Route Planning Details</h2>
            
            {/* Meal Type Filter */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Meal Type:</label>
              <select
                value={selectedMealType}
                onChange={(e) => setSelectedMealType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="all">All Meals</option>
              </select>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">🔍 Filter Routes</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Name</label>
                <input
                  type="text"
                  value={filters.deliveryName}
                  onChange={(e) => setFilters(prev => ({ ...prev, deliveryName: e.target.value }))}
                  placeholder="Search by delivery name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Executive</label>
                <input
                  type="text"
                  value={filters.executive}
                  onChange={(e) => setFilters(prev => ({ ...prev, executive: e.target.value }))}
                  placeholder="Search by executive..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Search by location..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
          
          {!result ? (
            <p className="text-gray-500">No route data available</p>
          ) : (
            <div className="space-y-8">
              {(selectedMealType === 'all' ? ['breakfast', 'lunch', 'dinner'] : [selectedMealType]).map(mealType => {
                const mealData = result[mealType];
                if (!mealData || mealData.length === 0) return null;

                // Filter data based on current filters
                const filteredMealData = mealData.filter(item => {
                  const matchesDeliveryName = !filters.deliveryName || 
                    (item.Delivery_Name && item.Delivery_Name.toLowerCase().includes(filters.deliveryName.toLowerCase()));
                  const matchesExecutive = !filters.executive || 
                    (item.Executive && item.Executive.toLowerCase().includes(filters.executive.toLowerCase()));
                  const matchesLocation = !filters.location || 
                    (item.Location && item.Location.toLowerCase().includes(filters.location.toLowerCase()));
                  
                  return matchesDeliveryName && matchesExecutive && matchesLocation;
                });

                return (
                  <div key={mealType}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 capitalize">{mealType} Routes</h3>
                      <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                        {filteredMealData.length} of {mealData.length} routes
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">STOP #</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">DELIVERY NAME</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">EXECUTIVE</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">LOCATION</th>
                              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">PACKAGES</th>
                              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">DISTANCE (KM)</th>
                              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200"> TIME (MIN)</th>
                              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">MAP LINK</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filteredMealData.length > 0 ? (
                              filteredMealData.map((item, index) => {
                              return (
                              <tr key={index} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <div className="flex items-center justify-center">
                                    <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                                      {item.Stop_No || index + 1}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {item.Delivery_Name || '-'}
                                  </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {
                                    item.Executive === 'Unassigned' || !item.Executive
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-green-100 text-green-800'
                                  }">
                                    {item.Executive || 'Unassigned'}
                                  </span>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="text-sm text-gray-900 max-w-xs truncate" title={item.Location || '-'}>
                                    {item.Location || '-'}
                                  </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-center">
                                  {item.Packages && item.Packages !== '0' ? (
                                    <span className="inline-flex items-center justify-center w-6 h-6 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">
                                      {item.Packages}
                                    </span>
                                  ) : '-'}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                                  {item.Distance_From_Prev_Stop_km && item.Distance_From_Prev_Stop_km !== '0' ? 
                                    `${parseFloat(item.Distance_From_Prev_Stop_km).toFixed(2)} km` : '-'}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                                  {(() => {
                                    // Check for Cumulative_Time_min first, then Time_From_Prev_Stop_min
                                    const timeValue = item.Cumulative_Time_min || item.Time_From_Prev_Stop_min || item.Time;
                                    return timeValue && timeValue !== '0' && timeValue !== 0 ? 
                                      `${parseFloat(timeValue).toFixed(1)} min` : '-';
                                  })()}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-center">
                                  {item.Map_Link ? (
                                    <a 
                                      href={item.Map_Link}
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
                                    >
                                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                                      </svg>
                                      View Map
                                    </a>
                                  ) : '-'}
                                </td>
                              </tr>
                              );
                            })
                            ) : (
                              <tr>
                                <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                                  <div className="flex flex-col items-center gap-2">
                                    <p>No routes found matching your filters.</p>
                                    <button
                                      onClick={clearFilters}
                                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                                    >
                                      Clear Filters
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RouteViewPage;
