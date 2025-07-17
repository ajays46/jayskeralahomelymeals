import React, { useEffect, useState } from 'react';
import AdminSlide from '../../components/AdminSlide';

const AdminPage = () => {
  const [adminData, setAdminData] = useState(null);
  const [editData, setEditData] = useState({});
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [loading, setLoading] = useState(true);
  const [pwLoading, setPwLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setTimeout(() => {
      const data = {
        name: 'Jake James',
        email: 'elani2945@walaihan.com',
        status: 'Active',
        lastLogin: 'Apr 03, 07:37 PM',
        id: 'STU21',
        address: '123 Admin Street, City, Country',
        contact: '9690987666',
        created: 'Apr 03, 10:33 AM',
        updated: 'Apr 03, 05:27 PM',
        devices: [
          {
            os: 'Desktop (Linux)',
            ip: '111.162.68.654',
            created: 'Apr 03, 07:37 PM',
            active: true,
          },
          {
            os: 'Desktop (Linux)',
            ip: '111.162.68.651',
            created: 'Apr 03, 03:31 PM',
            active: false,
          },
        ],
      };
      setAdminData(data);
      setEditData(data);
      setLoading(false);
    }, 500);
  }, []);

  const handleChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    setMessage('Saving...');
    setTimeout(() => setMessage('Profile updated!'), 800);
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    setPwLoading(true);
    setMessage('');
    if (passwords.new !== passwords.confirm) {
      setMessage('Passwords do not match!');
      setPwLoading(false);
      return;
    }
    setTimeout(() => {
      setMessage('Password updated!');
      setPwLoading(false);
      setPasswords({ current: '', new: '', confirm: '' });
    }, 1000);
  };

  if (loading || !adminData) return (
    <div className="flex min-h-screen bg-gray-900 text-gray-100">
      <AdminSlide />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-200 text-lg">Loading...</div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-100">
      {/* Sidebar on desktop */}
      <div className="hidden md:block">
        <AdminSlide />
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-3 sm:p-4 lg:p-8 overflow-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Account</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Profile Card & Devices */}
            <div className="lg:col-span-1 space-y-4 sm:space-y-6">
              {/* Profile Card */}
              <div className="bg-gray-800 rounded-lg p-4 sm:p-6 flex flex-col items-center">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(adminData.name)}`}
                  alt="Avatar"
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mb-3 sm:mb-4"
                />
                <div className="text-lg sm:text-xl font-semibold text-center">{adminData.name}</div>
                <div className="text-sm text-gray-400 text-center">{adminData.email}</div>
                <div className="flex flex-col sm:flex-row items-center gap-2 mt-2">
                  <span className="bg-green-600 text-xs px-2 py-1 rounded">
                    {adminData.status}
                  </span>
                  <span className="text-xs text-gray-400 text-center">
                    Last Login: {adminData.lastLogin}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">Id: {adminData.id}</div>
              </div>
              
              {/* Recent Devices */}
              <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
                <div className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Recent Devices</div>
                <div className="space-y-3">
                  {adminData.devices.map((device, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-gray-700 rounded p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <span className="bg-blue-600 rounded p-1 mr-2 flex-shrink-0">
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                              <rect width="16" height="16" rx="3" fill="#fff" />
                            </svg>
                          </span>
                          <span className="font-medium text-sm sm:text-base truncate">{device.os}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          IP: {device.ip}
                        </div>
                        <div className="text-xs text-gray-400">
                          Created: {device.created}
                        </div>
                      </div>
                      {!device.active && (
                        <button
                          className="bg-gray-600 text-xs px-2 py-1 rounded hover:bg-red-600 ml-2 flex-shrink-0"
                        >
                          Terminate
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Account Details & Password */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Account Details */}
              <form
                className="bg-gray-800 rounded-lg p-4 sm:p-6"
                onSubmit={handleProfileUpdate}
              >
                <h3 className="text-lg sm:text-xl font-semibold mb-4">Account Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm text-gray-400 mb-1">Address</label>
                    <input
                      className="w-full bg-gray-700 rounded p-2 sm:p-3 mt-1 text-gray-200 text-sm sm:text-base"
                      name="address"
                      value={editData.address}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm text-gray-400 mb-1">Contact Number</label>
                    <input
                      className="w-full bg-gray-700 rounded p-2 sm:p-3 mt-1 text-gray-200 text-sm sm:text-base"
                      name="contact"
                      value={editData.contact}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm text-gray-400 mb-1">Created on</label>
                    <input
                      className="w-full bg-gray-700 rounded p-2 sm:p-3 mt-1 text-gray-200 text-sm sm:text-base"
                      value={adminData.created}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm text-gray-400 mb-1">Updated on</label>
                    <input
                      className="w-full bg-gray-700 rounded p-2 sm:p-3 mt-1 text-gray-200 text-sm sm:text-base"
                      value={adminData.updated}
                      readOnly
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="mt-4 bg-blue-600 px-4 py-2 rounded text-white hover:bg-blue-700 transition-colors text-sm sm:text-base"
                >
                  Save Changes
                </button>
                {message && <div className="mt-2 text-green-400 text-sm">{message}</div>}
              </form>
              
              {/* Update Password */}
              <form
                className="bg-gray-800 rounded-lg p-4 sm:p-6"
                onSubmit={handlePasswordChange}
              >
                <h3 className="text-lg sm:text-xl font-semibold mb-4">Update Password</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm text-gray-400 mb-1">Current Password</label>
                    <input
                      type="password"
                      className="w-full bg-gray-700 rounded p-2 sm:p-3 mt-1 text-gray-200 text-sm sm:text-base"
                      placeholder="Current Password"
                      value={passwords.current}
                      onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                      required
                    />
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-xs text-gray-400 mb-2">Password Requirements</div>
                    <div className="text-xs text-gray-400 mb-1">• Letters</div>
                    <div className="text-xs text-gray-400 mb-1">• Numbers</div>
                    <div className="text-xs text-gray-400 mb-1">• Special character</div>
                    <div className="text-xs text-gray-400">• Random</div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm text-gray-400 mb-1">New Password</label>
                    <input
                      type="password"
                      className="w-full bg-gray-700 rounded p-2 sm:p-3 mt-1 text-gray-200 text-sm sm:text-base"
                      placeholder="New Password"
                      value={passwords.new}
                      onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm text-gray-400 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      className="w-full bg-gray-700 rounded p-2 sm:p-3 mt-1 text-gray-200 text-sm sm:text-base"
                      placeholder="Confirm New Password"
                      value={passwords.confirm}
                      onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      className="w-full bg-gray-600 text-gray-300 rounded p-2 sm:p-3 mt-4 hover:bg-blue-700 transition-colors text-sm sm:text-base"
                      disabled={pwLoading}
                    >
                      {pwLoading ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </div>
                {message && <div className="mt-2 text-green-400 text-sm">{message}</div>}
              </form>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile sidebar */}
      <div className="block md:hidden fixed bottom-0 left-0 w-full z-20">
        <AdminSlide isFooter />
      </div>
    </div>
  );
};

export default AdminPage;
