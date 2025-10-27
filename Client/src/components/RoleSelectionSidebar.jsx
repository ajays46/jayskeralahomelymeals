import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  XMarkIcon, 
  UserIcon, 
  CogIcon, 
  TruckIcon, 
  ShoppingBagIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import useAuthStore from '../stores/Zustand.store';
import { getDashboardRoute } from '../utils/roleBasedRouting';

/**
 * RoleSelectionSidebar - Component for users to select their active role when they have multiple roles
 * Displays available roles in a sidebar format with role-specific icons and descriptions
 * Features: Role selection, role switching, role-specific navigation, responsive design
 */

const roleConfig = {
  'CEO': {
    icon: ChartBarIcon,
    title: 'CEO Dashboard',
    description: 'Management overview and strategic insights',
    color: 'bg-purple-500',
    route: '/jkhm/management-dashboard'
  },
  'CFO': {
    icon: CurrencyDollarIcon,
    title: 'CFO Dashboard', 
    description: 'Financial analytics and reporting',
    color: 'bg-green-500',
    route: '/jkhm/financial-dashboard'
  },
  'ADMIN': {
    icon: CogIcon,
    title: 'Admin Panel',
    description: 'System administration and user management',
    color: 'bg-blue-500',
    route: '/jkhm/admin'
  },
  'DELIVERY_MANAGER': {
    icon: TruckIcon,
    title: 'Delivery Manager',
    description: 'Delivery operations and route management',
    color: 'bg-orange-500',
    route: '/jkhm/delivery-manager'
  },
  'SELLER': {
    icon: ShoppingBagIcon,
    title: 'Seller Dashboard',
    description: 'Customer management and order processing',
    color: 'bg-indigo-500',
    route: '/jkhm/seller/customers'
  },
  'DELIVERY_EXECUTIVE': {
    icon: TruckIcon,
    title: 'Delivery Executive',
    description: 'Delivery assignments and status updates',
    color: 'bg-teal-500',
    route: '/jkhm/delivery-executive'
  },
  'USER': {
    icon: UserIcon,
    title: 'User Dashboard',
    description: 'Personal orders and account management',
    color: 'bg-gray-500',
    route: '/jkhm'
  }
};

const RoleSelectionSidebar = ({ isOpen, onClose, userRoles = [] }) => {
  const navigate = useNavigate();
  const { setActiveRole, setUser, user } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState(null);

    // Filter out roles that don't have configuration
  const availableRoles = userRoles.filter(role => roleConfig[role.toUpperCase()]);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };

  const handleConfirmSelection = () => {
    if (selectedRole) {
      // Update the user's active role in the store
      const updatedUser = {
        ...user,
        role: selectedRole,
        roles: userRoles // Keep all roles available
      };
      
      setUser(updatedUser);
      setActiveRole(selectedRole); // Set the selected role as active
      
      // Navigate to the role-specific dashboard
      const dashboardRoute = getDashboardRoute([selectedRole]);
      navigate(dashboardRoute);
      
      // Close the sidebar
      onClose();
    }
  };

  const handleCancel = () => {
    setSelectedRole(null);
    onClose();
  };

  if (!isOpen || availableRoles.length <= 1) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="absolute left-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Select Your Role</h2>
              <p className="text-sm text-gray-500 mt-1">
                Choose which role you want to use for this session
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {availableRoles.map((role) => {
                const config = roleConfig[role.toUpperCase()];
                const IconComponent = config.icon;
                const isSelected = selectedRole === role;
                
                return (
                  <Card 
                    key={role}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      isSelected 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleRoleSelect(role)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${config.color}`}>
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg font-medium text-gray-900">
                            {config.title}
                          </CardTitle>
                          <CardDescription className="text-sm text-gray-600 mt-1">
                            {config.description}
                          </CardDescription>
                        </div>
                        {isSelected && (
                          <Badge variant="default" className="bg-blue-500">
                            Selected
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>

            {/* Info Card */}
            <Card className="mt-6 bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start space-x-2">
                  <div className="p-1 rounded-full bg-blue-100">
                    <ArrowRightIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Role Switching
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      You can switch between roles anytime from your profile menu.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <div className="border-t p-6 space-y-3">
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmSelection}
                disabled={!selectedRole}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Continue as {selectedRole ? roleConfig[selectedRole.toUpperCase()]?.title : 'Role'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionSidebar;
