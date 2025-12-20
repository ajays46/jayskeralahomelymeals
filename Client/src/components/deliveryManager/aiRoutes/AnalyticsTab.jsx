import React from 'react';
import { FiBarChart2 } from 'react-icons/fi';

/**
 * AnalyticsTab - Component for route analytics
 * Placeholder for future analytics dashboard
 */
const AnalyticsTab = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <FiBarChart2 className="text-purple-400 text-xl" />
        <h2 className="text-xl font-bold text-white">Route Analytics</h2>
      </div>
      
      {/* Analytics Placeholder */}
      <div className="bg-gray-700/50 rounded-lg p-8 border border-gray-600 text-center">
        <FiBarChart2 className="text-4xl text-gray-500 mx-auto mb-3" />
        <p className="text-gray-400">Analytics dashboard coming soon</p>
        <p className="text-xs text-gray-500 mt-1">
          View route performance, driver efficiency, and delivery metrics
        </p>
      </div>
    </div>
  );
};

export default AnalyticsTab;

