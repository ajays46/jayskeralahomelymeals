import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronDownIcon,
  UserIcon, 
  CogIcon, 
  TruckIcon, 
  ShoppingBagIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import useAuthStore from '../stores/Zustand.store';
import { getDashboardRoute } from '../utils/roleBasedRouting';

/**
 * RoleSwitcher - Component for switching between user roles in the navigation
 * Displays current role and allows switching to other available roles
 * Features: Role switching, role indicators, dropdown menu, navigation
 */

const roleConfig = {
  'CEO': {
    icon: ChartBarIcon,
    title: 'CEO',
    color: 'bg-purple-500',
    shortName: 'CEO'
  },
  'CFO': {
    icon: CurrencyDollarIcon,
    title: 'CFO',
    color: 'bg-green-500',
    shortName: 'CFO'
  },
  'ADMIN': {
    icon: CogIcon,
    title: 'Admin',
    color: 'bg-blue-500',
    shortName: 'Admin'
  },
  'DELIVERY_MANAGER': {
    icon: TruckIcon,
    title: 'Delivery Manager',
    color: 'bg-orange-500',
    shortName: 'DM'
  },
  'SELLER': {
    icon: ShoppingBagIcon,
    title: 'Seller',
    color: 'bg-indigo-500',
    shortName: 'Seller'
  },
  'DELIVERY_EXECUTIVE': {
    icon: TruckIcon,
    title: 'Delivery Executive',
    color: 'bg-teal-500',
    shortName: 'DE'
  },
  'USER': {
    icon: UserIcon,
    title: 'User',
    color: 'bg-gray-500',
    shortName: 'User'
  }
};

const RoleSwitcher = () => {
  const navigate = useNavigate();
  const { roles, activeRole, switchRole } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  // Filter out roles that don't have configuration and exclude current active role
  const availableRoles = roles.filter(role => 
    roleConfig[role.toUpperCase()] && role !== activeRole
  );

  const handleRoleSwitch = (newRole) => {
    switchRole(newRole);
    setIsOpen(false);
    
    // Navigate to the new role's dashboard
    // Pass all user roles so getDashboardRoute can check if user has CXO roles
    const dashboardRoute = getDashboardRoute([newRole], roles);
    navigate(dashboardRoute);
  };

  const currentRoleConfig = activeRole ? roleConfig[activeRole.toUpperCase()] : null;
  const CurrentIcon = currentRoleConfig?.icon || UserIcon;

  if (roles.length <= 1) {
    return null; // Don't show switcher if user has only one role
  }

  return (
    <div className="relative">
      {/* Current Role Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2"
      >
        <div className={`p-1 rounded ${currentRoleConfig?.color || 'bg-gray-500'}`}>
          <CurrentIcon className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-medium">
          {currentRoleConfig?.shortName || 'Role'}
        </span>
        <ChevronDownIcon className="h-4 w-4 text-gray-500" />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
              Switch Role
            </div>
            
            <div className="space-y-1">
              {availableRoles.map((role) => {
                const config = roleConfig[role.toUpperCase()];
                const IconComponent = config.icon;
                
                return (
                  <button
                    key={role}
                    onClick={() => handleRoleSwitch(role)}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <div className={`p-1 rounded ${config.color}`}>
                      <IconComponent className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {config.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        Switch to {config.title} dashboard
                      </div>
                    </div>
                    <ArrowPathIcon className="h-4 w-4 text-gray-400" />
                  </button>
                );
              })}
            </div>

            {/* Info */}
            <div className="mt-3 px-3 py-2 bg-blue-50 rounded-md">
              <div className="flex items-start space-x-2">
                <div className="p-1 rounded-full bg-blue-100">
                  <ArrowPathIcon className="h-3 w-3 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-blue-900">
                    Role Switching
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    You can switch between roles anytime. Your session will continue with the new role's permissions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default RoleSwitcher;
