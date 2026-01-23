import React, { useState, useEffect } from 'react';
import { FiSettings, FiSave, FiRefreshCw, FiInfo, FiAlertCircle } from 'react-icons/fi';
import { useCoordinator } from '../../hooks/deliverymanager/useCoordinator';
import { SkeletonLoading } from '../Skeleton';

/**
 * CoordinatorSettings Component
 * Manages Coordinator parameter settings for route planning validation
 * Features: View current settings, update parameters, validation feedback
 */
const CoordinatorSettings = () => {
  const {
    settings,
    descriptions,
    isLoadingSettings,
    settingsError,
    isUpdating,
    updateError,
    updateSettings,
    refetchSettings
  } = useCoordinator();

  const [formData, setFormData] = useState({
    max_time_hours: '',
    max_packages_per_driver: '',
    max_distance_km: '',
    min_confidence: ''
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [updateResult, setUpdateResult] = useState(null);

  // Initialize form data when settings are loaded
  useEffect(() => {
    if (settings && typeof settings === 'object' && Object.keys(settings).length > 0) {
      console.log('Settings received:', settings);
      const newFormData = {
        max_time_hours: typeof settings.max_time_hours === 'number' ? String(settings.max_time_hours) : (settings.max_time_hours || ''),
        max_packages_per_driver: typeof settings.max_packages_per_driver === 'number' ? String(settings.max_packages_per_driver) : (settings.max_packages_per_driver || ''),
        max_distance_km: typeof settings.max_distance_km === 'number' ? String(settings.max_distance_km) : (settings.max_distance_km || ''),
        min_confidence: typeof settings.min_confidence === 'number' ? String(settings.min_confidence) : (settings.min_confidence || '')
      };
      console.log('Setting formData to:', newFormData);
      setFormData(newFormData);
      setHasChanges(false);
      setUpdateResult(null);
    } else {
      console.log('Settings not ready:', settings);
    }
  }, [settings]);

  // Check for changes
  useEffect(() => {
    if (settings) {
      const changed = 
        parseFloat(formData.max_time_hours) !== settings.max_time_hours ||
        parseInt(formData.max_packages_per_driver) !== settings.max_packages_per_driver ||
        parseFloat(formData.max_distance_km) !== settings.max_distance_km ||
        parseFloat(formData.min_confidence) !== settings.min_confidence;
      setHasChanges(changed);
    }
  }, [formData, settings]);

  // Debug: Log settings and formData (must be before any conditional returns)
  useEffect(() => {
    console.log('Current settings:', settings);
    console.log('Current formData:', formData);
  }, [settings, formData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setUpdateResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!settings) {
      console.error('Settings not available');
      return;
    }
    
    // Build updates object with only changed fields
    const updates = {};
    const maxTimeHours = parseFloat(formData.max_time_hours);
    const maxPackages = parseInt(formData.max_packages_per_driver);
    const maxDistance = parseFloat(formData.max_distance_km);
    const minConfidence = parseFloat(formData.min_confidence);
    
    // Validate and add to updates if changed
    if (!isNaN(maxTimeHours) && maxTimeHours > 0 && maxTimeHours !== settings.max_time_hours) {
      updates.max_time_hours = maxTimeHours;
    }
    if (!isNaN(maxPackages) && maxPackages > 0 && maxPackages !== settings.max_packages_per_driver) {
      updates.max_packages_per_driver = maxPackages;
    }
    if (!isNaN(maxDistance) && maxDistance > 0 && maxDistance !== settings.max_distance_km) {
      updates.max_distance_km = maxDistance;
    }
    if (!isNaN(minConfidence) && minConfidence >= 0 && minConfidence <= 1 && minConfidence !== settings.min_confidence) {
      updates.min_confidence = minConfidence;
    }

    if (Object.keys(updates).length === 0) {
      console.log('No changes detected');
      return;
    }

    console.log('Sending updates to API:', updates);
    
    try {
      const result = await updateSettings(updates);
      console.log('Update successful:', result);
      setUpdateResult(result);
      setHasChanges(false);
      // Refetch to get updated settings
      await refetchSettings();
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const handleReset = () => {
    if (settings && typeof settings === 'object') {
      setFormData({
        max_time_hours: typeof settings.max_time_hours === 'number' ? String(settings.max_time_hours) : (settings.max_time_hours || ''),
        max_packages_per_driver: typeof settings.max_packages_per_driver === 'number' ? String(settings.max_packages_per_driver) : (settings.max_packages_per_driver || ''),
        max_distance_km: typeof settings.max_distance_km === 'number' ? String(settings.max_distance_km) : (settings.max_distance_km || ''),
        min_confidence: typeof settings.min_confidence === 'number' ? String(settings.min_confidence) : (settings.min_confidence || '')
      });
      setHasChanges(false);
      setUpdateResult(null);
    }
  };

  if (isLoadingSettings) {
    return (
      <div className="p-6">
        <SkeletonLoading />
      </div>
    );
  }

  if (settingsError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <FiAlertCircle className="text-red-500 text-xl" />
          <div>
            <h3 className="text-red-800 font-semibold">Error Loading Settings</h3>
            <p className="text-red-600 text-sm mt-1">
              {settingsError.message || 'Failed to load Coordinator settings'}
            </p>
            <button
              onClick={() => refetchSettings()}
              className="mt-2 text-sm text-red-700 hover:text-red-900 underline"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <FiSettings className="text-2xl text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Coordinator Settings</h2>
        </div>
        <p className="text-gray-600 text-sm">
          Manage route validation parameters that control route planning approval and rejection policies.
        </p>
      </div>

      {/* Current Settings Display */}
      {settings && (
        <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Current Coordinator Settings</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600 font-medium">Max Time</p>
              <p className="text-gray-800 font-semibold">{settings.max_time_hours} hours</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Max Packages</p>
              <p className="text-gray-800 font-semibold">{settings.max_packages_per_driver} per driver</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Max Distance</p>
              <p className="text-gray-800 font-semibold">{settings.max_distance_km} km</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Min Confidence</p>
              <p className="text-gray-800 font-semibold">{settings.min_confidence}</p>
            </div>
          </div>
        </div>
      )}

      {/* Update Result Display */}
      {updateResult && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-green-800 font-semibold mb-2">Settings Updated Successfully</h3>
          {updateResult.previous_settings && updateResult.current_settings && (
            <div className="mt-3 space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 font-medium mb-1">Previous Values:</p>
                  <ul className="space-y-1 text-gray-700">
                    {Object.entries(updateResult.previous_settings).map(([key, value]) => (
                      <li key={key}>
                        <span className="font-medium">{key.replace(/_/g, ' ')}:</span> {value}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-gray-600 font-medium mb-1">Current Values:</p>
                  <ul className="space-y-1 text-gray-700">
                    {Object.entries(updateResult.current_settings).map(([key, value]) => (
                      <li key={key}>
                        <span className="font-medium">{key.replace(/_/g, ' ')}:</span> {value}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-6">
          {/* Max Time Hours */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Time (hours)
              {descriptions?.max_time_hours && (
                <span className="ml-2 text-gray-500 text-xs">
                  <FiInfo className="inline mr-1" />
                  {descriptions.max_time_hours}
                </span>
              )}
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={formData.max_time_hours || ''}
              onChange={(e) => handleInputChange('max_time_hours', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              placeholder="e.g., 2.0"
            />
            {formData.max_time_hours && (
              <p className="mt-1 text-xs text-gray-500">Current value: {formData.max_time_hours} hours</p>
            )}
          </div>

          {/* Max Packages Per Driver */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Packages per Driver
              {descriptions?.max_packages_per_driver && (
                <span className="ml-2 text-gray-500 text-xs">
                  <FiInfo className="inline mr-1" />
                  {descriptions.max_packages_per_driver}
                </span>
              )}
            </label>
            <input
              type="number"
              step="1"
              min="1"
              value={formData.max_packages_per_driver || ''}
              onChange={(e) => handleInputChange('max_packages_per_driver', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              placeholder="e.g., 15"
            />
            {formData.max_packages_per_driver && (
              <p className="mt-1 text-xs text-gray-500">Current value: {formData.max_packages_per_driver} packages</p>
            )}
          </div>

          {/* Max Distance KM */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Distance (km)
              {descriptions?.max_distance_km && (
                <span className="ml-2 text-gray-500 text-xs">
                  <FiInfo className="inline mr-1" />
                  {descriptions.max_distance_km}
                </span>
              )}
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={formData.max_distance_km || ''}
              onChange={(e) => handleInputChange('max_distance_km', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              placeholder="e.g., 100.0"
            />
            {formData.max_distance_km && (
              <p className="mt-1 text-xs text-gray-500">Current value: {formData.max_distance_km} km</p>
            )}
          </div>

          {/* Min Confidence */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Min Confidence (0.0 to 1.0)
              {descriptions?.min_confidence && (
                <span className="ml-2 text-gray-500 text-xs">
                  <FiInfo className="inline mr-1" />
                  {descriptions.min_confidence}
                </span>
              )}
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={formData.min_confidence || ''}
              onChange={(e) => handleInputChange('min_confidence', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              placeholder="e.g., 0.5"
            />
            {formData.min_confidence && (
              <p className="mt-1 text-xs text-gray-500">Current value: {formData.min_confidence}</p>
            )}
            <div className="mt-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={formData.min_confidence || 0.5}
                onChange={(e) => handleInputChange('min_confidence', e.target.value)}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0.0</span>
                <span>0.5</span>
                <span>1.0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="mt-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleReset}
            disabled={!hasChanges || isUpdating}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FiRefreshCw className="text-lg" />
            Reset
          </button>
          <button
            type="submit"
            disabled={!hasChanges || isUpdating}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FiSave className="text-lg" />
            {isUpdating ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        {/* Update Error */}
        {updateError && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">
              {updateError.message || 'Failed to update settings'}
            </p>
          </div>
        )}
      </form>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FiInfo className="text-blue-600 text-xl mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">About Coordinator Settings</p>
            <p className="text-blue-700">
              These settings control the validation rules for route planning. Routes that exceed these constraints
              will be rejected or require approval. You can override these settings per-request when planning routes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoordinatorSettings;
