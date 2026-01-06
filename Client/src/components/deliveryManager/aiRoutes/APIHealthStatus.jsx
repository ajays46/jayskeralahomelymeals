import React from 'react';
import { FiCheckCircle, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

/**
 * APIHealthStatus - Component for displaying API health status
 */
const APIHealthStatus = ({ apiHealth, onRefresh }) => {
  return (
    <div className={`p-3 rounded-lg border ${
      apiHealth?.status === 'OK' 
        ? 'bg-green-900/20 border-green-500/30' 
        : apiHealth === null
        ? 'bg-yellow-900/20 border-yellow-500/30'
        : 'bg-red-900/20 border-red-500/30'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {apiHealth?.status === 'OK' ? (
            <FiCheckCircle className="text-green-400" />
          ) : (
            <FiAlertCircle className="text-red-400" />
          )}
          <span className="text-sm font-medium text-white">
            API Status: {apiHealth?.status || 'Checking...'}
          </span>
        </div>
        <button
          onClick={onRefresh}
          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
        >
          <FiRefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>
    </div>
  );
};

export default APIHealthStatus;

