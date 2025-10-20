import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import AppHeader from '../components/AppHeader';
import RoleSwitcher from '../components/RoleSwitcher';
import useAuthStore from '../stores/Zustand.store';

/**
 * RoleTestPage - Test page to demonstrate role selection and switching functionality
 * Shows current user roles, active role, and allows testing role switching
 * Features: Role display, role switching, navigation testing
 */

const RoleTestPage = () => {
  const navigate = useNavigate();
  const { user, roles, activeRole, setShowRoleSelector } = useAuthStore();

  const handleShowRoleSelector = () => {
    setShowRoleSelector(true);
  };

  const roleConfig = {
    'CEO': { color: 'bg-purple-500', title: 'CEO' },
    'CFO': { color: 'bg-green-500', title: 'CFO' },
    'ADMIN': { color: 'bg-blue-500', title: 'Admin' },
    'DELIVERY_MANAGER': { color: 'bg-orange-500', title: 'Delivery Manager' },
    'SELLER': { color: 'bg-indigo-500', title: 'Seller' },
    'DELIVERY_EXECUTIVE': { color: 'bg-teal-500', title: 'Delivery Executive' },
    'USER': { color: 'bg-gray-500', title: 'User' }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader 
        title="Role Selection Test"
        subtitle="Test the role selection and switching functionality"
        showRoleSwitcher={true}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Current User Info */}
          <Card>
            <CardHeader>
              <CardTitle>Current User Information</CardTitle>
              <CardDescription>
                Displaying current user details and role information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-lg font-semibold">{user?.firstName || 'N/A'} {user?.lastName || ''}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-lg">{user?.email || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role Information */}
          <Card>
            <CardHeader>
              <CardTitle>Role Information</CardTitle>
              <CardDescription>
                Your available roles and current active role
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Available Roles</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {roles.map((role) => {
                    const config = roleConfig[role.toUpperCase()] || { color: 'bg-gray-500', title: role };
                    const isActive = role === activeRole;
                    return (
                      <Badge 
                        key={role}
                        variant={isActive ? "default" : "secondary"}
                        className={`${config.color} ${isActive ? 'ring-2 ring-blue-500' : ''}`}
                      >
                        {config.title}
                        {isActive && ' (Active)'}
                      </Badge>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Current Active Role</label>
                <p className="text-lg font-semibold">
                  {activeRole ? roleConfig[activeRole.toUpperCase()]?.title || activeRole : 'None'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Role Switching Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Role Switching Controls</CardTitle>
              <CardDescription>
                Test the role selection and switching functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <Button onClick={handleShowRoleSelector} className="bg-blue-600 hover:bg-blue-700">
                  Show Role Selection Sidebar
                </Button>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Quick Role Switcher:</span>
                  <RoleSwitcher />
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">How to Test:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Click "Show Role Selection Sidebar" to open the full role selection interface</li>
                  <li>• Use the "Quick Role Switcher" dropdown to quickly switch between roles</li>
                  <li>• After switching roles, you'll be navigated to the appropriate dashboard</li>
                  <li>• The active role will be updated in the store and reflected in the UI</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Test */}
          <Card>
            <CardHeader>
              <CardTitle>Navigation Test</CardTitle>
              <CardDescription>
                Test navigation to different role-specific dashboards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/jkhm/management-dashboard')}
                  className="text-xs"
                >
                  Management Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/jkhm/financial-dashboard')}
                  className="text-xs"
                >
                  Financial Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/jkhm/admin')}
                  className="text-xs"
                >
                  Admin Panel
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/jkhm/seller/customers')}
                  className="text-xs"
                >
                  Seller Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/jkhm/delivery-manager')}
                  className="text-xs"
                >
                  Delivery Manager
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/jkhm/delivery-executive')}
                  className="text-xs"
                >
                  Delivery Executive
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RoleTestPage;
