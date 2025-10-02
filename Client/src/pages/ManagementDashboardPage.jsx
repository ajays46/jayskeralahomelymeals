import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  UsersIcon, 
  CurrencyDollarIcon, 
  TruckIcon,
  BuildingOfficeIcon,
  DocumentChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import useAuthStore from '../stores/Zustand.store';

/**
 * ManagementDashboardPage - Executive dashboard for CEO and CFO roles
 * Provides high-level business metrics, analytics, and management tools
 * Features: Financial overview, operational metrics, user management, system health
 */
const ManagementDashboardPage = () => {
  const { user, roles } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalRevenue: 0,
    totalUsers: 0,
    totalOrders: 0,
    activeDeliveryExecutives: 0,
    pendingOrders: 0,
    completedOrders: 0,
    monthlyGrowth: 0,
    systemHealth: 'Good'
  });

  // Mock data - replace with actual API calls
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setDashboardData({
          totalRevenue: 1250000,
          totalUsers: 2500,
          totalOrders: 8500,
          activeDeliveryExecutives: 45,
          pendingOrders: 120,
          completedOrders: 8380,
          monthlyGrowth: 15.5,
          systemHealth: 'Good'
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const isCEO = roles?.includes('CEO');
  const isCFO = roles?.includes('CFO');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const statsCards = [
    {
      name: 'Total Revenue',
      value: formatCurrency(dashboardData.totalRevenue),
      change: `+${dashboardData.monthlyGrowth}%`,
      changeType: 'positive',
      icon: CurrencyDollarIcon,
      color: 'bg-green-500',
      description: 'Monthly revenue growth'
    },
    {
      name: 'Total Users',
      value: formatNumber(dashboardData.totalUsers),
      change: '+12%',
      changeType: 'positive',
      icon: UsersIcon,
      color: 'bg-blue-500',
      description: 'Active registered users'
    },
    {
      name: 'Total Orders',
      value: formatNumber(dashboardData.totalOrders),
      change: '+8%',
      changeType: 'positive',
      icon: DocumentChartBarIcon,
      color: 'bg-purple-500',
      description: 'All-time orders'
    },
    {
      name: 'Active Delivery Executives',
      value: dashboardData.activeDeliveryExecutives,
      change: '+3',
      changeType: 'positive',
      icon: TruckIcon,
      color: 'bg-orange-500',
      description: 'Currently active'
    }
  ];

  const quickActions = [
    {
      name: 'Financial Reports',
      description: 'View detailed financial analytics',
      icon: ChartBarIcon,
      href: '#',
      availableFor: ['CEO', 'CFO']
    },
    {
      name: 'User Management',
      description: 'Manage users and permissions',
      icon: UsersIcon,
      href: '#',
      availableFor: ['CEO', 'CFO']
    },
    {
      name: 'Company Settings',
      description: 'Configure company-wide settings',
      icon: BuildingOfficeIcon,
      href: '#',
      availableFor: ['CEO']
    },
    {
      name: 'System Health',
      description: 'Monitor system performance',
      icon: ExclamationTriangleIcon,
      href: '#',
      availableFor: ['CEO', 'CFO']
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'order',
      message: 'New high-value order received',
      time: '2 minutes ago',
      amount: '₹2,500'
    },
    {
      id: 2,
      type: 'user',
      message: 'New user registration',
      time: '5 minutes ago',
      user: 'John Doe'
    },
    {
      id: 3,
      type: 'delivery',
      message: 'Delivery completed successfully',
      time: '10 minutes ago',
      location: 'Kochi'
    },
    {
      id: 4,
      type: 'payment',
      message: 'Payment processed',
      time: '15 minutes ago',
      amount: '₹1,200'
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Management Dashboard
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Welcome back, {user?.firstName || 'Executive'}! 
                  {isCEO && ' (Chief Executive Officer)'}
                  {isCFO && ' (Chief Financial Officer)'}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-gray-600">System Status: {dashboardData.systemHealth}</span>
                </div>
                <ClockIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {new Date().toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: 'short'
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((card) => (
            <div key={card.name} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-md ${card.color}`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{card.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center">
                  <span className={`text-sm font-medium ${
                    card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {card.change}
                  </span>
                  <span className="ml-2 text-sm text-gray-500">{card.description}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {quickActions
                    .filter(action => action.availableFor.some(role => roles?.includes(role)))
                    .map((action) => (
                      <button
                        key={action.name}
                        className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex items-center">
                          <action.icon className="h-5 w-5 text-gray-400" />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{action.name}</p>
                            <p className="text-sm text-gray-500">{action.description}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.message}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500">{activity.time}</span>
                          {activity.amount && (
                            <span className="text-xs font-medium text-green-600">{activity.amount}</span>
                          )}
                          {activity.user && (
                            <span className="text-xs text-gray-500">• {activity.user}</span>
                          )}
                          {activity.location && (
                            <span className="text-xs text-gray-500">• {activity.location}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Metrics for CFO */}
        {isCFO && (
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Financial Overview</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(dashboardData.totalRevenue * 0.8)}
                    </p>
                    <p className="text-sm text-gray-500">Net Profit</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(dashboardData.totalRevenue * 0.15)}
                    </p>
                    <p className="text-sm text-gray-500">Operating Expenses</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {formatCurrency(dashboardData.totalRevenue * 0.05)}
                    </p>
                    <p className="text-sm text-gray-500">Taxes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagementDashboardPage;
