import React, { useState } from 'react';
import RoleBadge from './RoleBadge';
import UserRoles from './UserRoles';
import { getRoleDisplayName, getRoleFullDisplayName, getRoleColor, getRoleIcon } from '../utils/roleUtils';

const RoleDisplayTest = () => {
  const [testRoles, setTestRoles] = useState(['USER', 'ADMIN', 'SELLER']);

  const addRole = (role) => {
    if (!testRoles.includes(role)) {
      setTestRoles([...testRoles, role]);
    }
  };

  const removeRole = (role) => {
    setTestRoles(testRoles.filter(r => r !== role));
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Role Display Test</h1>
        
        {/* Single Role Badge Examples */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Single Role Badges</h2>
          <div className="flex flex-wrap gap-4 items-center">
            <RoleBadge role="ADMIN" />
            <RoleBadge role="SELLER" />
            <RoleBadge role="USER" />
            <RoleBadge role="ADMIN" showIcon={false} />
            <RoleBadge role="SELLER" size="sm" />
            <RoleBadge role="USER" size="lg" />
          </div>
        </div>

        {/* Multiple Roles Display */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Multiple Roles Display</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">Current Roles:</h3>
              <UserRoles roles={testRoles} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">Without Icons:</h3>
              <UserRoles roles={testRoles} showIcon={false} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">Small Size:</h3>
              <UserRoles roles={testRoles} size="sm" />
            </div>
          </div>
        </div>

        {/* Role Management */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Role Management</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => addRole('ADMIN')}
              className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm hover:bg-red-200 transition-colors"
            >
              + ADMIN
            </button>
            <button
              onClick={() => addRole('SELLER')}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors"
            >
              + SELLER
            </button>
            <button
              onClick={() => addRole('USER')}
              className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm hover:bg-gray-200 transition-colors"
            >
              + USER
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {testRoles.map((role) => (
              <button
                key={role}
                onClick={() => removeRole(role)}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm hover:bg-gray-300 transition-colors"
              >
                - {role}
              </button>
            ))}
          </div>
        </div>

        {/* Utility Functions Test */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Utility Functions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">Display Names:</h3>
              <div className="space-y-2">
                {testRoles.map((role) => (
                  <div key={role} className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{role}:</span>
                    <span className="font-medium">{getRoleDisplayName(role)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">Full Names:</h3>
              <div className="space-y-2">
                {testRoles.map((role) => (
                  <div key={role} className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{role}:</span>
                    <span className="font-medium">{getRoleFullDisplayName(role)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">Icons:</h3>
              <div className="space-y-2">
                {testRoles.map((role) => (
                  <div key={role} className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{role}:</span>
                    <span className="text-xl">{getRoleIcon(role)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">Colors:</h3>
              <div className="space-y-2">
                {testRoles.map((role) => (
                  <div key={role} className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{role}:</span>
                    <span className={`px-2 py-1 rounded text-xs ${getRoleColor(role)}`}>
                      {getRoleDisplayName(role)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleDisplayTest;
