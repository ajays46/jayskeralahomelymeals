import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/Zustand.store';
import Navbar from '../components/Navbar';
import ChangePassword from '../components/ChangePassword';
import { 
  MdPerson, 
  MdEmail, 
  MdPhone, 
  MdLocationOn, 
  MdEdit, 
  MdSave, 
  MdCancel,
  MdHistory,
  MdFavorite,
  MdSettings,
  MdLogout,
  MdArrowBack,
  MdRestaurant,
  MdStar,
  MdAccessTime,
  MdNotifications
} from 'react-icons/md';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });

  // Mock data for orders and favorites
  const orderHistory = [
    {
      id: 1,
      orderNumber: 'ORD-2024-001',
      items: ['Classic Margherita Pizza', 'Fresh Caesar Salad'],
      total: 21.74,
      status: 'Delivered',
      date: '2024-01-15',
      rating: 5
    },
    {
      id: 2,
      orderNumber: 'ORD-2024-002',
      items: ['Chicken Biryani', 'Mango Lassi'],
      total: 20.00,
      status: 'In Progress',
      date: '2024-01-20',
      rating: null
    }
  ];

  const favoriteItems = [
    {
      id: 1,
      name: 'Classic Margherita Pizza',
      image: '/veg.png',
      price: 12.99,
      category: 'Veg'
    },
    {
      id: 2,
      name: 'Paneer Butter Masala',
      image: '/veg.png',
      price: 13.50,
      category: 'Veg'
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/jayskeralahomelymeals');
  };

  const handleSave = () => {
    // Here you would typically make an API call to update user data
    console.log('Saving user data:', editForm);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || ''
    });
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderProfileTab = () => (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Personal Information</h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#FE8C00] text-white rounded-lg hover:bg-orange-600 transition w-full sm:w-auto"
          >
            <MdEdit className="text-lg" />
            Edit Profile
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Form Fields */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <MdPerson className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={!isEditing}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FE8C00] focus:border-transparent disabled:bg-gray-50"
                placeholder="Enter your full name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <MdEmail className="absolute left-3 top-3 text-gray-400" />
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={!isEditing}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FE8C00] focus:border-transparent disabled:bg-gray-50"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <MdPhone className="absolute left-3 top-3 text-gray-400" />
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={!isEditing}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FE8C00] focus:border-transparent disabled:bg-gray-50"
                placeholder="Enter your phone number"
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Address
            </label>
            <div className="relative">
              <MdLocationOn className="absolute left-3 top-3 text-gray-400" />
              <textarea
                value={editForm.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                disabled={!isEditing}
                rows="3"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FE8C00] focus:border-transparent disabled:bg-gray-50"
                placeholder="Enter your delivery address"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={handleSave}
              className="flex items-center justify-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition w-full sm:w-auto"
            >
              <MdSave className="text-lg" />
              Save Changes
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center justify-center gap-2 px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition w-full sm:w-auto"
            >
              <MdCancel className="text-lg" />
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderOrdersTab = () => (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
      <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Order History</h3>
      <div className="space-y-4">
        {orderHistory.map((order) => (
          <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
              <div>
                <h4 className="font-semibold text-gray-800">{order.orderNumber}</h4>
                <p className="text-sm text-gray-600">{order.date}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium w-fit ${
                order.status === 'Delivered' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {order.status}
              </span>
            </div>
            <div className="mb-3">
              <p className="text-sm text-gray-600 mb-1">Items:</p>
              <p className="text-gray-800 text-sm sm:text-base">{order.items.join(', ')}</p>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-800">₹{order.total}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFavoritesTab = () => (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
      <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Favorite Items</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {favoriteItems.map((item) => (
          <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
            <div className="flex items-center space-x-3">
              <img 
                src={item.image} 
                alt={item.name} 
                className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-800 text-sm sm:text-base truncate">{item.name}</h4>
                <p className="text-sm text-gray-600 capitalize">{item.category}</p>
                <p className="font-semibold text-[#FE8C00]">₹{item.price}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
      <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Account Settings</h3>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-gray-200 rounded-lg gap-4">
          <div className="flex items-center space-x-3">
            <MdSettings className="text-2xl text-gray-600 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-gray-800">Change Password</h4>
              <p className="text-sm text-gray-600">Update your account password</p>
            </div>
          </div>
          <button 
            onClick={() => setShowChangePassword(true)}
            className="px-4 py-2 bg-[#FE8C00] text-white rounded-lg hover:bg-orange-600 transition w-full sm:w-auto"
          >
            Update
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-gray-200 rounded-lg gap-4">
          <div className="flex items-center space-x-3">
            <MdNotifications className="text-2xl text-gray-600 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-gray-800">Notification Preferences</h4>
              <p className="text-sm text-gray-600">Manage your notification settings</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-[#FE8C00] text-white rounded-lg hover:bg-orange-600 transition w-full sm:w-auto">
            Configure
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-gray-200 rounded-lg gap-4">
          <div className="flex items-center space-x-3">
            <MdLogout className="text-2xl text-red-600 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-gray-800">Logout</h4>
              <p className="text-sm text-gray-600">Sign out of your account</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition w-full sm:w-auto"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header>
        <div className='bg-[url("/banner_one.jpg")] bg-cover bg-center h-40 lg:h-[250px] flex items-center justify-center'>
          <Navbar />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/jayskeralahomelymeals')}
          className="flex items-center gap-2 text-[#FE8C00] hover:text-orange-600 mb-6 transition"
        >
          <MdArrowBack className="text-xl" />
          <span className="hidden sm:inline">Back to Home</span>
          <span className="sm:hidden">Back</span>
        </button>

        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#FE8C00] rounded-full flex items-center justify-center flex-shrink-0">
              <MdPerson className="text-xl sm:text-2xl text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 truncate">
                Welcome back, {user?.name || 'User'}!
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">Manage your profile and preferences</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 sm:mb-8 overflow-x-auto pb-2">
          {[
            { id: 'profile', label: 'Profile', icon: MdPerson },
            { id: 'orders', label: 'Orders', icon: MdHistory },
            { id: 'favorites', label: 'Favorites', icon: MdFavorite },
            { id: 'settings', label: 'Settings', icon: MdSettings }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#FE8C00] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="text-lg" />
              <span className="text-sm sm:text-base">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'orders' && renderOrdersTab()}
        {activeTab === 'favorites' && renderFavoritesTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </div>

      {/* Change Password Modal */}
      <ChangePassword 
        isOpen={showChangePassword} 
        onClose={() => setShowChangePassword(false)} 
      />
    </div>
  );
};

export default ProfilePage; 