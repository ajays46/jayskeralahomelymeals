import React, { useState } from 'react';
import { 
  FiCloud, 
  FiCloudRain, 
  FiSun, 
  FiWind, 
  FiDroplet, 
  FiThermometer,
  FiMapPin,
  FiRefreshCw,
  FiAlertCircle,
  FiClock
} from 'react-icons/fi';
import { showSuccessToast, showErrorToast } from '../../utils/toastConfig.jsx';
import { 
  useCurrentWeather, 
  useWeatherForecast, 
  useWeatherZones 
} from '../../hooks/deliverymanager/useAIRouteOptimization';

/**
 * WeatherTab - Component for displaying weather information
 * Shows current weather conditions, forecasts, and weather alerts for delivery zones
 */
const WeatherTab = () => {
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [customLocation, setCustomLocation] = useState({ latitude: '', longitude: '' });
  const [useCustomLocation, setUseCustomLocation] = useState(false);

  // Fetch weather for all zones
  const { 
    data: zonesWeatherData, 
    isLoading: zonesLoading, 
    error: zonesError,
    refetch: refetchZonesWeather
  } = useWeatherZones({ is_active: 1 }, { enabled: true });

  // Fetch current weather for selected zone or custom location
  // API expects 'lat' and 'lng' according to documentation
  const weatherParams = useCustomLocation && customLocation.latitude && customLocation.longitude
    ? { lat: parseFloat(customLocation.latitude), lng: parseFloat(customLocation.longitude) }
    : selectedZoneId ? { zone_id: selectedZoneId } : {};
  
  const { 
    data: currentWeatherData, 
    isLoading: currentWeatherLoading,
    error: currentWeatherError,
    refetch: refetchCurrentWeather
  } = useCurrentWeather(weatherParams, { 
    enabled: !!(selectedZoneId || (useCustomLocation && customLocation.latitude && customLocation.longitude))
  });

  // Fetch weather forecast
  const { 
    data: forecastData, 
    isLoading: forecastLoading,
    error: forecastError
  } = useWeatherForecast({ ...weatherParams, days: 5 }, { 
    enabled: !!(selectedZoneId || (useCustomLocation && customLocation.latitude && customLocation.longitude))
  });

  const handleRefresh = () => {
    refetchZonesWeather();
    if (selectedZoneId || (useCustomLocation && customLocation.latitude)) {
      refetchCurrentWeather();
    }
    showSuccessToast('Weather data refreshed');
  };

  const handleLocationSearch = (e) => {
    e.preventDefault();
    if (customLocation.latitude && customLocation.longitude) {
      setUseCustomLocation(true);
      setSelectedZoneId('');
      refetchCurrentWeather();
    } else {
      showErrorToast('Please enter latitude and longitude');
    }
  };

  const handleZoneSelect = (zoneId) => {
    setSelectedZoneId(zoneId);
    setUseCustomLocation(false);
  };

  const getWeatherIcon = (weather) => {
    if (!weather) return <FiCloud className="text-gray-400" />;
    const w = weather.toLowerCase();
    if (w.includes('rain') || w.includes('drizzle')) return <FiCloudRain className="text-blue-400" />;
    if (w.includes('clear') || w.includes('sunny')) return <FiSun className="text-yellow-400" />;
    if (w.includes('cloud')) return <FiCloud className="text-gray-300" />;
    return <FiCloud className="text-gray-400" />;
  };

  const getTrafficColor = (level) => {
    if (!level) return 'text-gray-400';
    const l = level.toLowerCase();
    if (l === 'low') return 'text-green-400';
    if (l === 'medium' || l === 'moderate') return 'text-yellow-400';
    if (l === 'high') return 'text-red-400';
    return 'text-gray-400';
  };

  const isLoading = zonesLoading || currentWeatherLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FiCloud className="text-blue-400 text-xl" />
          <h2 className="text-xl font-bold text-white">Weather Information</h2>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
        >
          <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Location Selection */}
      <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FiMapPin className="text-blue-400" />
          Location Selection
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Zone Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Zone
            </label>
            <select
              value={selectedZoneId}
              onChange={(e) => handleZoneSelect(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a zone...</option>
              {zonesWeatherData?.zones_weather?.map((zone) => (
                <option key={zone.zone_id} value={zone.zone_id}>
                  {zone.zone_name || zone.zone_id}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Location */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Or Enter Custom Location
            </label>
            <form onSubmit={handleLocationSearch} className="flex gap-2">
              <input
                type="text"
                value={customLocation.latitude}
                onChange={(e) => setCustomLocation(prev => ({ ...prev, latitude: e.target.value }))}
                placeholder="Latitude"
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={customLocation.longitude}
                onChange={(e) => setCustomLocation(prev => ({ ...prev, longitude: e.target.value }))}
                placeholder="Longitude"
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {(zonesError || currentWeatherError || forecastError) && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-400">
            <FiAlertCircle className="w-5 h-5" />
            <p className="text-sm">
              {zonesError?.message || currentWeatherError?.message || forecastError?.message || 'Failed to fetch weather data'}
            </p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !zonesWeatherData && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading weather data...</p>
        </div>
      )}

      {/* Current Weather Display */}
      {currentWeatherData && (
        <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-lg p-6 border border-blue-500/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                {currentWeatherData.zone_id ? `Zone: ${currentWeatherData.zone_id}` : 'Custom Location'}
              </h3>
              <p className="text-sm text-gray-300">
                Lat: {(currentWeatherData.location?.lat || currentWeatherData.latitude)?.toFixed(4)}, Lng: {(currentWeatherData.location?.lng || currentWeatherData.longitude)?.toFixed(4)}
              </p>
            </div>
            <div className="text-6xl">
              {getWeatherIcon(currentWeatherData.weather?.condition || currentWeatherData.weather || currentWeatherData.condition)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Main Weather Info */}
            <div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-5xl font-bold text-white">
                  {(currentWeatherData.weather?.temperature || currentWeatherData.temperature)?.toFixed(1) || '--'}°
                </span>
                <span className="text-xl text-gray-300">C</span>
              </div>
              <p className="text-lg text-gray-300 mb-2 capitalize">
                {currentWeatherData.weather?.condition || currentWeatherData.weather || currentWeatherData.condition || 'N/A'}
              </p>
              <p className="text-sm text-gray-400">
                Weather: {currentWeatherData.weather?.condition || currentWeatherData.weather_main || 'N/A'}
              </p>
            </div>

            {/* Weather Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <FiDroplet className="w-4 h-4" />
                  <span className="text-xs">Humidity</span>
                </div>
                <p className="text-lg font-semibold text-white">
                  {currentWeatherData.weather?.humidity || currentWeatherData.humidity || '--'}%
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <FiWind className="w-4 h-4" />
                  <span className="text-xs">Wind Speed</span>
                </div>
                <p className="text-lg font-semibold text-white">
                  {(currentWeatherData.weather?.wind_speed || currentWeatherData.wind_speed)?.toFixed(1) || '--'} m/s
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <FiClock className="w-4 h-4" />
                  <span className="text-xs">Traffic Level</span>
                </div>
                <p className={`text-lg font-semibold ${getTrafficColor(currentWeatherData.traffic_level)}`}>
                  {currentWeatherData.traffic_level || 'N/A'}
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <FiAlertCircle className="w-4 h-4" />
                  <span className="text-xs">Delay</span>
                </div>
                <p className="text-lg font-semibold text-white">
                  {currentWeatherData.delay_minutes?.toFixed(0) || '0'} min
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weather Forecast */}
      {forecastData?.forecasts && forecastData.forecasts.length > 0 && (
        <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
          <h3 className="text-lg font-semibold text-white mb-4">Weather Forecast</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {forecastData.forecasts.slice(0, 5).map((forecast, index) => (
              <div
                key={index}
                className="bg-gray-800/50 rounded-lg p-4 border border-gray-600 hover:border-blue-500/50 transition-colors"
              >
                <div className="text-center mb-3">
                  <p className="text-sm font-medium text-white mb-1">{forecast.date}</p>
                  <p className="text-xs text-gray-400 mb-2">{forecast.session || 'All Day'}</p>
                  <div className="text-3xl mb-2 flex justify-center">
                    {getWeatherIcon(forecast.weather)}
                  </div>
                  <p className="text-xs text-gray-400 capitalize">{forecast.weather}</p>
                </div>
                <div className="text-center">
                  <span className="text-lg font-bold text-white">{forecast.temperature?.toFixed(0) || '--'}°C</span>
                </div>
                <div className="mt-2 text-center text-xs text-yellow-400">
                  +{forecast.predicted_delay_minutes?.toFixed(0) || '0'} min delay
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Zones Weather */}
      {zonesWeatherData?.zones_weather && zonesWeatherData.zones_weather.length > 0 && (
        <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <FiMapPin className="text-blue-400" />
              All Zones Weather
              <span className="text-sm font-normal text-gray-400">
                ({zonesWeatherData.count} zones)
              </span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {zonesWeatherData.zones_weather.map((zone) => (
              <div
                key={zone.zone_id}
                onClick={() => handleZoneSelect(zone.zone_id)}
                className={`bg-gray-800/50 rounded-lg p-4 border cursor-pointer transition-all ${
                  selectedZoneId === zone.zone_id 
                    ? 'border-blue-500 ring-2 ring-blue-500/30' 
                    : 'border-gray-600 hover:border-blue-500/50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-white font-semibold">{zone.zone_name || zone.zone_id}</h4>
                    <p className="text-xs text-gray-400">Priority: {zone.priority}</p>
                  </div>
                  <div className="text-2xl">
                    {getWeatherIcon(zone.weather)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-400">Temp:</span>
                    <span className="text-white ml-1">{zone.temperature?.toFixed(1) || '--'}°C</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Traffic:</span>
                    <span className={`ml-1 ${getTrafficColor(zone.traffic_level)}`}>
                      {zone.traffic_level || 'N/A'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-400">Delay:</span>
                    <span className="text-yellow-400 ml-1">
                      +{zone.delay_minutes?.toFixed(0) || '0'} min
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-2 capitalize">{zone.weather}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delivery Impact Section */}
      {currentWeatherData && (
        <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
          <h3 className="text-lg font-semibold text-white mb-4">Delivery Impact Assessment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Current Conditions</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Weather Impact:</span>
                  <span className={`font-medium ${
                    currentWeatherData.delay_minutes > 10 ? 'text-red-400' : 
                    currentWeatherData.delay_minutes > 5 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {currentWeatherData.delay_minutes > 10 ? 'High' : 
                     currentWeatherData.delay_minutes > 5 ? 'Moderate' : 'Low'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Traffic Conditions:</span>
                  <span className={`font-medium ${getTrafficColor(currentWeatherData.traffic_level)}`}>
                    {currentWeatherData.traffic_level || 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Expected Delay:</span>
                  <span className="text-white font-medium">
                    +{currentWeatherData.delay_minutes?.toFixed(0) || '0'} minutes
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Recommendations</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                {currentWeatherData.delay_minutes <= 5 && currentWeatherData.traffic_level?.toLowerCase() !== 'high' ? (
                  <>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Optimal conditions for delivery operations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      <span>No special precautions needed</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400">⚠</span>
                      <span>Monitor weather conditions closely</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-400">⚠</span>
                      <span>Consider adjusting delivery schedules</span>
                    </li>
                  </>
                )}
                {currentWeatherData.weather?.toLowerCase().includes('rain') && (
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400">⚠</span>
                    <span>Prepare for rain - ensure packages are protected</span>
                  </li>
                )}
                {currentWeatherData.traffic_level?.toLowerCase() === 'high' && (
                  <li className="flex items-start gap-2">
                    <span className="text-red-400">⚠</span>
                    <span>High traffic - allow extra time for deliveries</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* No data message */}
      {!isLoading && !zonesWeatherData?.zones_weather?.length && !currentWeatherData && (
        <div className="text-center py-12">
          <FiCloud className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No weather data available</p>
          <p className="text-sm text-gray-500 mt-2">Select a zone or enter coordinates to view weather</p>
        </div>
      )}
    </div>
  );
};

export default WeatherTab;
