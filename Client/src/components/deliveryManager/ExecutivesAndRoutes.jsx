import React, { useState, useEffect } from 'react';
import { FiUsers, FiMapPin, FiZap, FiMaximize2, FiMinimize2, FiCloud } from 'react-icons/fi';
import IndividualExecutiveLocation from './IndividualExecutiveLocation';
import AllExecutivesLocation from './AllExecutivesLocation';
import AIRouteOptimization from './AIRouteOptimization';
import WeatherTab from './WeatherTab';

/**
 * ExecutivesAndRoutes Component
 * Main component for managing delivery executives and their locations
 * Features:
 * - Tabbed interface for different views
 * - Individual executive location tracking
 * - All executives location overview
 * - AI Route Optimization
 * - Fullscreen mode
 */
const ExecutivesAndRoutes = ({ isFullscreen = false, onToggleFullscreen }) => {
  const [activeViewTab, setActiveViewTab] = useState('ai-routes'); // 'individual', 'all', 'ai-routes', or 'weather'
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle tab change with animation
  const handleTabChange = (tab) => {
    setIsAnimating(true);
    setTimeout(() => {
      setActiveViewTab(tab);
      setTimeout(() => setIsAnimating(false), 50);
    }, 150);
  };

  // Add fade-in animation style
  useEffect(() => {
    if (typeof document !== 'undefined' && !document.getElementById('tab-fade-animation')) {
      const style = document.createElement('style');
      style.id = 'tab-fade-animation';
      style.textContent = `
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .tab-content-fade {
          animation: fadeIn 0.3s ease-out;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const handleFullscreenToggle = () => {
    if (onToggleFullscreen) {
      onToggleFullscreen(!isFullscreen);
    }
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-gray-900 overflow-y-auto' : 'bg-gray-800 rounded-lg border border-gray-700 mb-8 shadow-lg'} ${isFullscreen ? 'p-6' : 'p-4'}`}>
      <div className={`flex items-center justify-between ${isFullscreen ? 'mb-6' : 'mb-4'}`}>
        <h3 className={`${isFullscreen ? 'text-xl' : 'text-base'} font-semibold text-white flex items-center gap-2`}>
          <div className="p-1.5 bg-blue-500/20 rounded-lg">
            <FiUsers className="text-blue-400 text-base" />
          </div>
          <span>Executives & Routes</span>
        </h3>
        <button
          onClick={handleFullscreenToggle}
          className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? (
            <>
              <FiMinimize2 className="w-4 h-4" />
              <span className="hidden sm:inline">Exit Fullscreen</span>
            </>
          ) : (
            <>
              <FiMaximize2 className="w-4 h-4" />
              <span className="hidden sm:inline">Fullscreen</span>
            </>
          )}
        </button>
      </div>

      {/* Compact Tabs for switching between views */}
      <div className="mb-4">
        <div className="bg-gray-700/50 rounded-lg p-1 flex gap-1.5 border border-gray-600">
          <button
            onClick={() => handleTabChange('ai-routes')}
            className={`relative flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ease-out ${
              activeViewTab === 'ai-routes'
                ? 'bg-yellow-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-gray-600/50'
            }`}
          >
            <FiZap className={`text-sm transition-all duration-200 ${
              activeViewTab === 'ai-routes' ? 'text-white' : ''
            }`} />
            <span className="text-xs sm:text-sm">AI Routes</span>
          </button>
          <button
            onClick={() => handleTabChange('weather')}
            className={`relative flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ease-out ${
              activeViewTab === 'weather'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-gray-600/50'
            }`}
          >
            <FiCloud className={`text-sm transition-all duration-200 ${
              activeViewTab === 'weather' ? 'text-white' : ''
            }`} />
            <span className="text-xs sm:text-sm">Weather</span>
          </button>
          <button
            onClick={() => handleTabChange('individual')}
            className={`relative flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ease-out ${
              activeViewTab === 'individual'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-gray-600/50'
            }`}
          >
            <FiUsers className={`text-sm transition-all duration-200 ${
              activeViewTab === 'individual' ? 'text-white' : ''
            }`} />
            <span className="text-xs sm:text-sm">Individual Executive</span>
          </button>
          <button
            onClick={() => handleTabChange('all')}
            className={`relative flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ease-out ${
              activeViewTab === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-gray-600/50'
            }`}
          >
            <FiMapPin className={`text-sm transition-all duration-200 ${
              activeViewTab === 'all' ? 'text-white' : ''
            }`} />
            <span className="text-xs sm:text-sm">All Executives</span>
          </button>
        </div>
      </div>

      {/* Tab Content with fade animation */}
      <div className="relative">
        <div
          key={activeViewTab}
          className={`tab-content-fade ${isAnimating ? 'opacity-0' : 'opacity-100'}`}
        >
          {activeViewTab === 'ai-routes' && (
            <React.Suspense fallback={
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading AI Route Optimization...</p>
              </div>
            }>
              <AIRouteOptimization />
            </React.Suspense>
          )}
          {activeViewTab === 'weather' && <WeatherTab />}
          {activeViewTab === 'individual' && <IndividualExecutiveLocation />}
          {activeViewTab === 'all' && <AllExecutivesLocation />}
        </div>
      </div>
    </div>
  );
};

export default ExecutivesAndRoutes;

