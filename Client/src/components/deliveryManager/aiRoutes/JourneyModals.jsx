import React from 'react';
import { Modal } from 'antd';
import { showErrorToast } from '../../../utils/toastConfig.jsx';

/**
 * JourneyModals - Component for start/stop journey modals
 */
export const StartJourneyModal = ({ 
  open, 
  onClose, 
  startJourneyData, 
  setStartJourneyData, 
  onStart, 
  loading 
}) => {
  return (
    <Modal
      title="Start Journey"
      open={open}
      onCancel={onClose}
      footer={null}
      className="custom-modal"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Route ID *
          </label>
          <input
            type="text"
            value={startJourneyData.route_id}
            onChange={(e) => setStartJourneyData(prev => ({ ...prev, route_id: e.target.value }))}
            placeholder="e.g., route-1-uuid"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Individual route ID from route planning</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Driver ID *
          </label>
          <input
            type="text"
            value={startJourneyData.driver_id}
            onChange={(e) => setStartJourneyData(prev => ({ ...prev, driver_id: e.target.value }))}
            placeholder="e.g., executive-user-id-1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Executive's user ID</p>
        </div>
        
        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onStart}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Starting...' : 'Start Journey'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export const StopJourneyModal = ({ 
  open, 
  onClose, 
  routeId, 
  onStop, 
  loading 
}) => {
  return (
    <Modal
      title="Stop Journey"
      open={open}
      onCancel={onClose}
      footer={null}
      className="custom-modal"
    >
      <div className="space-y-4">
        <p className="text-gray-600">
          Are you sure you want to stop tracking for route <strong>{routeId}</strong>?
        </p>
        
        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onStop}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Stopping...' : 'Stop Journey'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

