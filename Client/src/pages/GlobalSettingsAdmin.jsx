import React, { useState, useEffect } from 'react';
import { 
  MdSettings, 
  MdSave, 
  MdRefresh, 
  MdEdit, 
  MdAdd, 
  MdDelete,
  MdInfo,
  MdCheckCircle,
  MdError,
  MdRestaurant,
  MdSchedule,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp
} from 'react-icons/md';
import axiosInstance from '../api/axios.js';

const GlobalSettingsAdmin = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Menu settings state - now dynamic
  const [menuSettings, setMenuSettings] = useState({});
  
  // New menu category form state
  const [newMenuCategory, setNewMenuCategory] = useState({
    name: '',
    keywords: '',
    autoDays: 1,
    selectionType: 'consecutive'
  });
  
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Delivery settings state
  const [deliverySettings, setDeliverySettings] = useState({
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner'
  });
  
  // UI state
  const [activeTab, setActiveTab] = useState('menu');
  const [expandedSections, setExpandedSections] = useState({
    menu: true,
    delivery: false
  });

  // Load settings and convert to user-friendly format
  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load menu type detection settings
      const menuResponse = await axiosInstance.get('/global-settings/menu_type_detection');
      const menuData = menuResponse.data.data || {};
      
      // Convert to user-friendly format
      const formattedMenuSettings = {};
      Object.keys(menuData).forEach(key => {
        formattedMenuSettings[key] = {
          keywords: Array.isArray(menuData[key].keywords) 
            ? menuData[key].keywords.join(', ') 
            : menuData[key].keywords || '',
          autoDays: menuData[key].autoDays || 0,
          selectionType: menuData[key].selectionType || 'consecutive'
        };
      });
      setMenuSettings(formattedMenuSettings);
      
      // Load delivery time slots
      const deliveryResponse = await axiosInstance.get('/global-settings/delivery_time_slots');
      const deliveryData = deliveryResponse.data.data || {};
      setDeliverySettings(deliveryData);
      
    } catch (error) {
      console.error('Failed to load settings:', error);
      setError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Save menu settings
  const saveMenuSettings = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      // Convert back to API format
      const apiFormat = {};
      Object.keys(menuSettings).forEach(key => {
        apiFormat[key] = {
          keywords: menuSettings[key].keywords.split(',').map(k => k.trim()).filter(k => k),
          autoDays: parseInt(menuSettings[key].autoDays) || 0,
          selectionType: menuSettings[key].selectionType || 'consecutive'
        };
      });

      await axiosInstance.put('/global-settings/menu_type_detection', {
        value: apiFormat,
        description: 'Menu type detection patterns and settings',
        category: 'menu'
      });

      setMessage({ type: 'success', text: 'Menu settings saved successfully!' });
    } catch (error) {
      console.error('Failed to save menu settings:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || error.message 
      });
    } finally {
      setSaving(false);
    }
  };

  // Save delivery settings
  const saveDeliverySettings = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      await axiosInstance.put('/global-settings/delivery_time_slots', {
        value: deliverySettings,
        description: 'Delivery time slot mapping',
        category: 'delivery'
      });

      setMessage({ type: 'success', text: 'Delivery settings saved successfully!' });
    } catch (error) {
      console.error('Failed to save delivery settings:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || error.message 
      });
    } finally {
      setSaving(false);
    }
  };

  // Update menu setting
  const updateMenuSetting = (menuType, field, value) => {
    setMenuSettings(prev => ({
      ...prev,
      [menuType]: {
        ...prev[menuType],
        [field]: value
      }
    }));
  };

  // Update delivery setting
  const updateDeliverySetting = (mealType, value) => {
    setDeliverySettings(prev => ({
      ...prev,
      [mealType]: value
    }));
  };

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Add new menu category
  const addMenuCategory = () => {
    if (!newMenuCategory.name.trim()) {
      setMessage({ type: 'error', text: 'Please enter a category name' });
      return;
    }

    const categoryKey = newMenuCategory.name.toLowerCase().replace(/\s+/g, '_');
    
    if (menuSettings[categoryKey]) {
      setMessage({ type: 'error', text: 'Category already exists' });
      return;
    }

    setMenuSettings(prev => ({
      ...prev,
      [categoryKey]: {
        keywords: newMenuCategory.keywords,
        autoDays: newMenuCategory.autoDays,
        selectionType: newMenuCategory.selectionType
      }
    }));

    // Reset form
    setNewMenuCategory({
      name: '',
      keywords: '',
      autoDays: 1,
      selectionType: 'consecutive'
    });
    setShowAddForm(false);
    setMessage({ type: 'success', text: `Added "${newMenuCategory.name}" category successfully! Remember to save your changes.` });
  };

  // Remove menu category
  const removeMenuCategory = (categoryKey) => {
    if (window.confirm(`Are you sure you want to remove the "${categoryKey}" category?`)) {
      setMenuSettings(prev => {
        const newSettings = { ...prev };
        delete newSettings[categoryKey];
        return newSettings;
      });
      setMessage({ type: 'success', text: `Removed "${categoryKey}" category successfully! Remember to save your changes.` });
    }
  };

  // Get category display name
  const getCategoryDisplayName = (key) => {
    return key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
  };

  // Get category icon
  const getCategoryIcon = (key) => {
    const icons = {
      monthly: '📅',
      weekly: '📆',
      weekday: '🏢',
      daily: '🌅',
      custom: '🎨',
      seasonal: '🍂',
      special: '⭐'
    };
    return icons[key] || '📝';
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading global settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <MdError className="h-6 w-6 text-red-600 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-red-800">Error Loading Settings</h3>
                <p className="text-red-600 mt-1">{error}</p>
              </div>
            </div>
            <button
              onClick={loadSettings}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center"
            >
              <MdRefresh className="h-4 w-4 mr-2" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MdSettings className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Application Settings</h1>
                <p className="text-gray-600">Configure how your application behaves</p>
              </div>
            </div>
            <button
              onClick={loadSettings}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <MdRefresh className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-center ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <MdCheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <MdError className="h-5 w-5 mr-2" />
            )}
            {message.text}
          </div>
        )}

        {/* Menu Settings Section */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div 
            className="p-6 cursor-pointer border-b border-gray-200"
            onClick={() => toggleSection('menu')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MdRestaurant className="h-6 w-6 text-green-600 mr-3" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Menu Auto-Selection</h2>
                  <p className="text-gray-600">Configure how many days to auto-select for different menu types</p>
                </div>
              </div>
              {expandedSections.menu ? (
                <MdKeyboardArrowUp className="h-6 w-6 text-gray-400" />
              ) : (
                <MdKeyboardArrowDown className="h-6 w-6 text-gray-400" />
              )}
            </div>
          </div>

          {expandedSections.menu && (
            <div className="p-6 space-y-6">
              {/* Dynamic Menu Categories */}
              {Object.keys(menuSettings).map((categoryKey) => (
                <div key={categoryKey} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {getCategoryIcon(categoryKey)} {getCategoryDisplayName(categoryKey)} Menu
                    </h3>
                    <button
                      onClick={() => removeMenuCategory(categoryKey)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      title="Remove this category"
                    >
                      <MdDelete className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Keywords (separated by commas)
                      </label>
                      <input
                        type="text"
                        value={menuSettings[categoryKey]?.keywords || ''}
                        onChange={(e) => updateMenuSetting(categoryKey, 'keywords', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={`${categoryKey}, ${categoryKey} menu`}
                      />
                      <p className="text-xs text-gray-500 mt-1">Words that identify {categoryKey} menus</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Auto-select Days
                      </label>
                      <input
                        type="number"
                        value={menuSettings[categoryKey]?.autoDays || 1}
                        onChange={(e) => updateMenuSetting(categoryKey, 'autoDays', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="1"
                        max="365"
                      />
                      <p className="text-xs text-gray-500 mt-1">Number of days to select</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Selection Type
                      </label>
                      <select
                        value={menuSettings[categoryKey]?.selectionType || 'consecutive'}
                        onChange={(e) => updateMenuSetting(categoryKey, 'selectionType', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="consecutive">Consecutive Days</option>
                        <option value="weekdays_only">Weekdays Only</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">How to select dates</p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add New Category Form */}
              {showAddForm && (
                <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 bg-blue-50">
                  <h3 className="text-lg font-medium text-blue-900 mb-4">➕ Add New Menu Category</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category Name
                      </label>
                      <input
                        type="text"
                        value={newMenuCategory.name}
                        onChange={(e) => setNewMenuCategory(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Seasonal, Custom, Special"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Keywords (separated by commas)
                      </label>
                      <input
                        type="text"
                        value={newMenuCategory.keywords}
                        onChange={(e) => setNewMenuCategory(prev => ({ ...prev, keywords: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="seasonal, custom, special"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Auto-select Days
                      </label>
                      <input
                        type="number"
                        value={newMenuCategory.autoDays}
                        onChange={(e) => setNewMenuCategory(prev => ({ ...prev, autoDays: parseInt(e.target.value) || 1 }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="1"
                        max="365"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Selection Type
                      </label>
                      <select
                        value={newMenuCategory.selectionType}
                        onChange={(e) => setNewMenuCategory(prev => ({ ...prev, selectionType: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="consecutive">Consecutive Days</option>
                        <option value="weekdays_only">Weekdays Only</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex space-x-3 mt-4">
                    <button
                      onClick={addMenuCategory}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                    >
                      <MdAdd className="h-4 w-4 mr-2" />
                      Add Category
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Add New Category Button */}
              {!showAddForm && (
                <div className="text-center">
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center mx-auto"
                  >
                    <MdAdd className="h-5 w-5 mr-2" />
                    Add New Menu Category
                  </button>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={saveMenuSettings}
                  disabled={saving}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                >
                  <MdSave className="h-5 w-5 mr-2" />
                  {saving ? 'Saving...' : 'Save Menu Settings'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Delivery Settings Section */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div 
            className="p-6 cursor-pointer border-b border-gray-200"
            onClick={() => toggleSection('delivery')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MdSchedule className="h-6 w-6 text-purple-600 mr-3" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Delivery Time Slots</h2>
                  <p className="text-gray-600">Map meal types to delivery time slots</p>
                </div>
              </div>
              {expandedSections.delivery ? (
                <MdKeyboardArrowUp className="h-6 w-6 text-gray-400" />
              ) : (
                <MdKeyboardArrowDown className="h-6 w-6 text-gray-400" />
              )}
            </div>
          </div>

          {expandedSections.delivery && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Breakfast Time Slot
                  </label>
                  <select
                    value={deliverySettings.breakfast}
                    onChange={(e) => updateDeliverySetting('breakfast', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Morning">Morning</option>
                    <option value="AM">AM</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lunch Time Slot
                  </label>
                  <select
                    value={deliverySettings.lunch}
                    onChange={(e) => updateDeliverySetting('lunch', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Lunch">Lunch</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dinner Time Slot
                  </label>
                  <select
                    value={deliverySettings.dinner}
                    onChange={(e) => updateDeliverySetting('dinner', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Dinner">Dinner</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={saveDeliverySettings}
                  disabled={saving}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                >
                  <MdSave className="h-5 w-5 mr-2" />
                  {saving ? 'Saving...' : 'Save Delivery Settings'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <MdInfo className="h-6 w-6 text-blue-600 mr-3 mt-1" />
            <div>
              <h3 className="text-lg font-medium text-blue-800">How This Works</h3>
              <div className="text-blue-700 mt-2 space-y-2">
                <p><strong>Dynamic Menu Categories:</strong> Add unlimited menu types (Monthly, Weekly, Daily, Seasonal, Custom, etc.) - all configurable!</p>
                <p><strong>Menu Auto-Selection:</strong> When customers select a menu with keywords you specify, the system will automatically select the number of days you configure.</p>
                <p><strong>Selection Types:</strong> Choose between consecutive days or weekdays only for each category.</p>
                <p><strong>Delivery Time Slots:</strong> These determine when deliveries are scheduled for each meal type.</p>
                <p><strong>Keywords:</strong> Separate multiple keywords with commas. The system will look for these words in menu names.</p>
                <p><strong>⚠️ Important:</strong> After adding or modifying categories, remember to click "Save Menu Settings" to save your changes to the database.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSettingsAdmin;
