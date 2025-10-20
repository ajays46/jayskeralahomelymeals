import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightOnRectangleIcon, UserIcon } from '@heroicons/react/24/outline';
import { Button } from './ui/button';
import RoleSwitcher from './RoleSwitcher';
import useAuthStore from '../stores/Zustand.store';

/**
 * AppHeader - Common header component for authenticated pages
 * Provides role switching, user info, and logout functionality
 * Features: Role switcher, user display, logout button, responsive design
 */

const AppHeader = ({ title, subtitle, showRoleSwitcher = true }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/jkhm');
  };

  return (
    <div className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500">
                  {subtitle}
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Role Switcher */}
              {showRoleSwitcher && <RoleSwitcher />}
              
              {/* User Info */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">
                      {user?.firstName || 'User'}
                    </div>
                    <div className="text-gray-500">
                      {user?.email || 'user@example.com'}
                    </div>
                  </div>
                </div>
                
                {/* Logout Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center space-x-2"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4" />
                  <span>Logout</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppHeader;
