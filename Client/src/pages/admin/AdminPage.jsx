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

  if (loading || !adminData) return <div className="p-8 text-gray-200">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-100">
      <AdminSlide />
      <div className="flex-1 p-8 overflow-auto">
        <h1 className="text-3xl font-bold mb-6">Account</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile Card & Devices */}
          <div className="md:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-gray-800 rounded-lg p-6 flex flex-col items-center">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(adminData.name)}`}
                alt="Avatar"
                className="w-20 h-20 rounded-full mb-4"
              />
              <div className="text-xl font-semibold">{adminData.name}</div>
              <div className="text-sm text-gray-400">{adminData.email}</div>
              <div className="flex items-center mt-2">
                <span className="bg-green-600 text-xs px-2 py-1 rounded mr-2">
                  {adminData.status}
                </span>
                <span className="text-xs text-gray-400">
                  Last Login: {adminData.lastLogin}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">Id: {adminData.id}</div>
            </div>
            {/* Recent Devices */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="font-semibold mb-2">Recent Devices</div>
              <div className="space-y-3">
                {adminData.devices.map((device, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-gray-700 rounded p-3"
                  >
                    <div>
                      <div className="flex items-center">
                        <span className="bg-blue-600 rounded p-1 mr-2">
                          <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                            <rect width="18" height="18" rx="3" fill="#fff" />
                          </svg>
                        </span>
                        <span className="font-medium">{device.os}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        IP Address: {device.ip}
                      </div>
                      <div className="text-xs text-gray-400">
                        Created: {device.created}
                      </div>
                    </div>
                    {!device.active && (
                      <button
                        className="bg-gray-600 text-xs px-2 py-1 rounded hover:bg-red-600"
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
          <div className="md:col-span-2 space-y-6">
            {/* Account Details */}
            <form
              className="bg-gray-800 rounded-lg p-6"
              onSubmit={handleProfileUpdate}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400">Address</label>
                  <input
                    className="w-full bg-gray-700 rounded p-2 mt-1 text-gray-200"
                    name="address"
                    value={editData.address}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400">Contact Number</label>
                  <input
                    className="w-full bg-gray-700 rounded p-2 mt-1 text-gray-200"
                    name="contact"
                    value={editData.contact}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400">Created on</label>
                  <input
                    className="w-full bg-gray-700 rounded p-2 mt-1 text-gray-200"
                    value={adminData.created}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400">Updated on</label>
                  <input
                    className="w-full bg-gray-700 rounded p-2 mt-1 text-gray-200"
                    value={adminData.updated}
                    readOnly
                  />
                </div>
              </div>
              <button
                type="submit"
                className="mt-4 bg-blue-600 px-4 py-2 rounded text-white hover:bg-blue-700"
              >
                Save Changes
              </button>
              {message && <div className="mt-2 text-green-400">{message}</div>}
            </form>
            {/* Update Password */}
            <form
              className="bg-gray-800 rounded-lg p-6"
              onSubmit={handlePasswordChange}
            >
              <div className="font-semibold mb-4">Update Password</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400">Current Password</label>
                  <input
                    type="password"
                    className="w-full bg-gray-700 rounded p-2 mt-1 text-gray-200"
                    placeholder="Current Password"
                    value={passwords.current}
                    onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                    required
                  />
                </div>
                <div className="row-span-3 md:row-span-1 md:col-span-1 md:ml-4">
                  <div className="text-xs text-gray-400 mb-2">Letters</div>
                  <div className="text-xs text-gray-400 mb-2">Numbers</div>
                  <div className="text-xs text-gray-400 mb-2">Special character</div>
                  <div className="text-xs text-gray-400">Random</div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400">New Password</label>
                  <input
                    type="password"
                    className="w-full bg-gray-700 rounded p-2 mt-1 text-gray-200"
                    placeholder="New Password"
                    value={passwords.new}
                    onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400">Confirm New Password</label>
                  <input
                    type="password"
                    className="w-full bg-gray-700 rounded p-2 mt-1 text-gray-200"
                    placeholder="Confirm New Password"
                    value={passwords.confirm}
                    onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    className="w-full bg-gray-600 text-gray-300 rounded p-2 mt-4 hover:bg-blue-700"
                    disabled={pwLoading}
                  >
                    {pwLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </div>
              {message && <div className="mt-2 text-green-400">{message}</div>}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
