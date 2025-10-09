import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TruckIcon, 
  UsersIcon, 
  ClockIcon, 
  ChartBarIcon,
  ArrowLeftIcon,
  CalendarIcon,
  Bars3Icon,
  XMarkIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  MapPinIcon,
  ChartPieIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import useAuthStore from '../stores/Zustand.store';
import { useDeliveryDashboardData } from '../hooks/deliveryHooks/useDeliveryDashboardSimple';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarDescription, 
  SidebarFooter, 
  SidebarGroup, 
  SidebarGroupLabel, 
  SidebarHeader, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarTitle 
} from '../components/ui/sidebar';

/**
 * DeliveryDashboardPage - Comprehensive delivery analytics dashboard
 * Provides detailed delivery insights, executive performance, and operational metrics
 * Features: Executive management, delivery analytics, time analysis, failure tracking, real-time monitoring
 */
const DeliveryDashboardPage = () => {
  const navigate = useNavigate();
  const { user, roles } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [periodFilter, setPeriodFilter] = useState('all');

  // Use the actual hook to fetch data
  const { 
    dashboard, 
    executives, 
    timeAnalytics, 
    failureAnalysis, 
    realTimeStatus, 
    isLoading, 
    error, 
    refetchAll 
  } = useDeliveryDashboardData(periodFilter);

  const isCEO = roles?.includes('CEO');
  const isCFO = roles?.includes('CFO');
  const isDeliveryManager = roles?.includes('DELIVERY_MANAGER');
  const isAdmin = roles?.includes('ADMIN');
  const isSeller = roles?.includes('SELLER');
  const isUser = roles?.includes('USER');

  const periodFilterOptions = [
    { value: 'all', label: 'All Time', icon: CalendarIcon },
    { value: 'today', label: 'Today', icon: CalendarIcon },
    { value: 'yesterday', label: 'Yesterday', icon: CalendarIcon },
    { value: 'week', label: 'This Week', theme: 'blue' },
    { value: 'month', label: 'This Month', theme: 'green' },
    { value: 'quarter', label: 'This Quarter', theme: 'purple' },
    { value: 'year', label: 'This Year', theme: 'orange' }
  ];

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'executives', label: 'Executives', icon: UsersIcon },
    { id: 'reports', label: 'Delivery Reports', icon: ChartPieIcon },
  ];

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

  const formatPercentage = (num) => {
    return `${num.toFixed(1)}%`;
  };

  const formatTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered': return 'bg-green-500';
      case 'Pending': return 'bg-yellow-500';
      case 'Confirmed': return 'bg-blue-500';
      case 'Cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'Delivered': return 'success';
      case 'Pending': return 'warning';
      case 'Confirmed': return 'default';
      case 'Cancelled': return 'destructive';
      default: return 'secondary';
    }
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <Sidebar className="w-64" mobileOpen={isMobileSidebarOpen}>
        <SidebarHeader>
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={() => navigate('/jkhm/management-dashboard')}
              variant="outline"
              size="icon"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => setIsMobileSidebarOpen(false)}
              variant="ghost"
              size="icon"
              className="md:hidden"
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          </div>
          <SidebarTitle>Delivery Dashboard</SidebarTitle>
          <SidebarDescription>
            CEO Exclusive - Comprehensive delivery analytics
          </SidebarDescription>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Analytics</SidebarGroupLabel>
            {sidebarItems.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  active={activeTab === item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileSidebarOpen(false);
                  }}
                  icon={<item.icon className="h-4 w-4" />}
                >
                  {item.label}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarGroup>

          <Separator className="my-4" />

          <SidebarGroup>
            <SidebarGroupLabel>Quick Stats</SidebarGroupLabel>
            <div className="px-3 py-2 space-y-2">
              <div className="text-xs">
                <div className="flex justify-between">
                  <span>Active Executives:</span>
                  <Badge variant="outline" className="text-xs">
                    {isLoading ? '...' : executives?.activeExecutives || 0}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Success Rate:</span>
                  <Badge variant="secondary" className="text-xs">
                    {isLoading ? '...' : formatPercentage(dashboard?.deliverySuccessRate || 0)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Total Deliveries:</span>
                  <Badge variant="outline" className="text-xs">
                    {isLoading ? '...' : formatNumber(dashboard?.totalDeliveryItems || 0)}
                  </Badge>
                </div>
              </div>
            </div>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <div className="flex items-center space-x-3 text-xs text-muted-foreground">
            <ClockIcon className="h-3 w-3" />
            <span>
              {new Date().toLocaleDateString('en-IN', {
                timeZone: 'Asia/Kolkata',
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}
            </span>
          </div>
        </SidebarFooter>
      </Sidebar>

      {/* Main Content */}
      <div className="md:ml-64 min-h-screen flex flex-col">
        {/* Top Header */}
        <div className="bg-background shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setIsMobileSidebarOpen(true)}
                variant="ghost"
                size="icon"
                className="md:hidden"
              >
                <Bars3Icon className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {sidebarItems.find(item => item.id === activeTab)?.label || 'Overview'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  CEO Exclusive - Comprehensive delivery analytics and management
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={refetchAll} 
                variant="outline" 
                size="sm"
                disabled={isLoading}
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <ArrowPathIcon className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">Loading Dashboard Data</h3>
                  <p className="text-sm text-muted-foreground">
                    Please wait while we fetch the latest delivery analytics...
                  </p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <ExclamationTriangleIcon className="h-8 w-8 text-destructive mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">Error Loading Data</h3>
                  <p className="text-sm text-muted-foreground mb-4">{error}</p>
                  <Button onClick={refetchAll} variant="outline">
                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              </div>
            )}

            {/* Main Content - Only show when not loading and no error */}
            {!isLoading && !error && (
              <>
            {activeTab === 'overview' && (
              <>
                {/* Period Filter */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FunnelIcon className="h-5 w-5" />
                      Period Filter
                    </CardTitle>
                    <CardDescription>Select time period to filter delivery data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {periodFilterOptions.map((option) => (
                        <Button
                          key={option.value}
                          variant={periodFilter === option.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPeriodFilter(option.value)}
                          className="flex items-center gap-2"
                        >
                          {option.icon && <option.icon className="h-4 w-4" />}
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="p-3 rounded-md bg-blue-500">
                          <UsersIcon className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-4">
                          <CardDescription className="font-medium">Active Executives</CardDescription>
                          <CardTitle className="text-2xl">{executives?.activeExecutives || 0}</CardTitle>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Badge variant="outline" className="mr-2">
                          {formatPercentage((executives?.activeExecutives || 0) / Math.max(executives?.totalExecutives || 1, 1) * 100)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">of {executives?.totalExecutives || 0} total</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="p-3 rounded-md bg-green-500">
                          <CheckCircleIcon className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-4">
                          <CardDescription className="font-medium">Success Rate</CardDescription>
                          <CardTitle className="text-2xl">{formatPercentage(dashboard?.deliverySuccessRate || 0)}</CardTitle>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Badge variant="success" className="mr-2">
                          {dashboard?.deliveredItems || 0} delivered
                        </Badge>
                        <span className="text-sm text-muted-foreground">out of {dashboard?.totalDeliveryItems || 0}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="p-3 rounded-md bg-orange-500">
                          <ClockIcon className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-4">
                          <CardDescription className="font-medium">Avg Delivery Time</CardDescription>
                          <CardTitle className="text-2xl">{formatTime(dashboard?.averageDeliveryTime || 0)}</CardTitle>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Badge variant="outline" className="mr-2">
                          Target: 30m
                        </Badge>
                        <span className="text-sm text-muted-foreground">per delivery</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="p-3 rounded-md bg-purple-500">
                          <TruckIcon className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-4">
                          <CardDescription className="font-medium">Total Deliveries</CardDescription>
                          <CardTitle className="text-2xl">{formatNumber(dashboard?.totalDeliveryItems || 0)}</CardTitle>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Badge variant="outline" className="mr-2">
                          {periodFilter}
                        </Badge>
                        <span className="text-sm text-muted-foreground">period</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Status Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Delivery Status Breakdown</CardTitle>
                      <CardDescription>Current delivery status distribution</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {dashboard?.statusBreakdown?.map((item, index) => (
                          <div key={item.status} className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center">
                              <div className={`w-4 h-4 rounded-full ${getStatusColor(item.status)} mr-3`}></div>
                              <span className="text-sm font-medium">{item.status}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={getStatusVariant(item.status)}>{item.count}</Badge>
                              <div className="w-24">
                                <Progress 
                                  value={(item.count / Math.max(dashboard?.totalDeliveryItems || 1, 1)) * 100} 
                                  className="mb-1"
                                />
                              </div>
                            </div>
                          </div>
                        )) || (
                          <div className="text-center py-8">
                            <p className="text-sm text-muted-foreground">No status data available</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Time Slot Distribution</CardTitle>
                      <CardDescription>Deliveries by meal time slots</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {dashboard?.timeSlotBreakdown?.map((item, index) => (
                          <div key={item.timeSlot} className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center">
                              <div className={`w-4 h-4 rounded-full ${
                                item.timeSlot === 'Breakfast' ? 'bg-orange-500' :
                                item.timeSlot === 'Lunch' ? 'bg-green-500' : 'bg-purple-500'
                              } mr-3`}></div>
                              <span className="text-sm font-medium">{item.timeSlot}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{item.count}</Badge>
                              <div className="w-24">
                                <Progress 
                                  value={(item.count / Math.max(dashboard?.totalDeliveryItems || 1, 1)) * 100} 
                                  className="mb-1"
                                />
                              </div>
                            </div>
                          </div>
                        )) || (
                          <div className="text-center py-8">
                            <p className="text-sm text-muted-foreground">No time slot data available</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {activeTab === 'executives' && (
              <>
                {/* Executive Performance Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-blue-600">{executives?.totalExecutives || 0}</p>
                      <p className="text-sm text-muted-foreground">Total Executives</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-green-600">{executives?.activeExecutives || 0}</p>
                      <p className="text-sm text-muted-foreground">Active Executives</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {formatPercentage(
                          executives?.executives?.length > 0 
                            ? executives.executives.reduce((sum, exec) => sum + exec.successRate, 0) / executives.executives.length
                            : 0
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">Avg Success Rate</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Executive Performance Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Executive Performance</CardTitle>
                    <CardDescription>Detailed performance metrics for each delivery executive</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {executives?.executives?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="text-left p-4 font-medium text-sm">Rank</th>
                              <th className="text-left p-4 font-medium text-sm">Executive</th>
                              <th className="text-left p-4 font-medium text-sm">Contact</th>
                              <th className="text-right p-4 font-medium text-sm">Deliveries</th>
                              <th className="text-right p-4 font-medium text-sm">Success Rate</th>
                              <th className="text-right p-4 font-medium text-sm">Avg Time</th>
                              <th className="text-center p-4 font-medium text-sm">Status</th>
                              <th className="text-center p-4 font-medium text-sm">Location</th>
                            </tr>
                          </thead>
                          <tbody>
                            {executives.executives.map((executive, index) => (
                              <tr key={executive.id} className="border-b hover:bg-muted/25 transition-colors">
                                <td className="p-4">
                                  <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                                    {index + 1}
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div>
                                    <h4 className="font-medium text-sm">{executive.name}</h4>
                                    <Badge variant="outline" className="text-xs mt-1">
                                      {executive.email}
                                    </Badge>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <p className="text-sm text-muted-foreground">{executive.phoneNumber}</p>
                                </td>
                                <td className="p-4 text-right">
                                  <span className="font-semibold text-blue-600">
                                    {executive.totalDeliveries}
                                  </span>
                                </td>
                                <td className="p-4 text-right">
                                  <Badge 
                                    variant={executive.successRate >= 90 ? 'success' : 
                                           executive.successRate >= 70 ? 'default' : 'destructive'}
                                  >
                                    {formatPercentage(executive.successRate)}
                                  </Badge>
                                </td>
                                <td className="p-4 text-right">
                                  <span className="text-sm font-medium">
                                    {formatTime(executive.averageDeliveryTime)}
                                  </span>
                                </td>
                                <td className="p-4 text-center">
                                  <Badge 
                                    variant={executive.status === 'ACTIVE' ? 'success' : 'secondary'}
                                  >
                                    {executive.status}
                                  </Badge>
                                </td>
                                <td className="p-4 text-center">
                                  <span className="text-sm text-muted-foreground">
                                    {executive.currentLocation || 'Unknown'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">No Executive Data</h3>
                        <p className="text-sm text-muted-foreground">
                          No delivery executive performance data available for the selected period.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {activeTab === 'reports' && (
              <>
                {/* Delivery Reports Section */}
                <div className="space-y-6">
                  {/* Report Header */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ChartPieIcon className="h-5 w-5" />
                        Delivery Reports
                      </CardTitle>
                      <CardDescription>
                        Comprehensive delivery analytics and performance reports
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          Daily Report
                        </Button>
                        <Button variant="outline" size="sm">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          Weekly Report
                        </Button>
                        <Button variant="outline" size="sm">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          Monthly Report
                        </Button>
                        <Button variant="outline" size="sm">
                          <ArrowTrendingUpIcon className="h-4 w-4 mr-2" />
                          Performance Report
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Report Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center mb-4">
                          <div className="p-3 rounded-md bg-blue-500">
                            <TruckIcon className="h-6 w-6 text-white" />
                          </div>
                          <div className="ml-4">
                            <CardDescription className="font-medium">Total Deliveries</CardDescription>
                            <CardTitle className="text-2xl">{formatNumber(dashboard?.totalDeliveryItems || 0)}</CardTitle>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span className="text-green-600 font-medium">+12%</span> from last period
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center mb-4">
                          <div className="p-3 rounded-md bg-green-500">
                            <CheckCircleIcon className="h-6 w-6 text-white" />
                          </div>
                          <div className="ml-4">
                            <CardDescription className="font-medium">Success Rate</CardDescription>
                            <CardTitle className="text-2xl">{formatPercentage(dashboard?.deliverySuccessRate || 0)}</CardTitle>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span className="text-green-600 font-medium">+5%</span> improvement
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center mb-4">
                          <div className="p-3 rounded-md bg-orange-500">
                            <ClockIcon className="h-6 w-6 text-white" />
                          </div>
                          <div className="ml-4">
                            <CardDescription className="font-medium">Avg Delivery Time</CardDescription>
                            <CardTitle className="text-2xl">{formatTime(dashboard?.averageDeliveryTime || 0)}</CardTitle>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span className="text-red-600 font-medium">-8%</span> faster delivery
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center mb-4">
                          <div className="p-3 rounded-md bg-purple-500">
                            <UsersIcon className="h-6 w-6 text-white" />
                          </div>
                          <div className="ml-4">
                            <CardDescription className="font-medium">Active Executives</CardDescription>
                            <CardTitle className="text-2xl">{executives?.activeExecutives || 0}</CardTitle>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span className="text-blue-600 font-medium">100%</span> availability
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Failed Deliveries Report */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <XCircleIcon className="h-5 w-5 text-red-500" />
                        Failed Deliveries Report
                      </CardTitle>
                      <CardDescription>Analysis of failed and cancelled deliveries</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Failed Delivery Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-4 rounded-lg border border-red-200 bg-red-50">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-red-800">Failed Deliveries</p>
                                <p className="text-2xl font-bold text-red-600">
                                  {dashboard?.statusBreakdown?.find(item => item.status === 'Cancelled')?.count || 0}
                                </p>
                              </div>
                              <XCircleIcon className="h-8 w-8 text-red-500" />
                            </div>
                            <p className="text-xs text-red-600 mt-2">
                              {formatPercentage(
                                ((dashboard?.statusBreakdown?.find(item => item.status === 'Cancelled')?.count || 0) / 
                                 Math.max(dashboard?.totalDeliveryItems || 1, 1)) * 100
                              )} of total deliveries
                            </p>
                          </div>

                          <div className="p-4 rounded-lg border border-yellow-200 bg-yellow-50">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-yellow-800">Pending Deliveries</p>
                                <p className="text-2xl font-bold text-yellow-600">
                                  {dashboard?.statusBreakdown?.find(item => item.status === 'Pending')?.count || 0}
                                </p>
                              </div>
                              <ClockIcon className="h-8 w-8 text-yellow-500" />
                            </div>
                            <p className="text-xs text-yellow-600 mt-2">
                              {formatPercentage(
                                ((dashboard?.statusBreakdown?.find(item => item.status === 'Pending')?.count || 0) / 
                                 Math.max(dashboard?.totalDeliveryItems || 1, 1)) * 100
                              )} of total deliveries
                            </p>
                          </div>

                          <div className="p-4 rounded-lg border border-green-200 bg-green-50">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-green-800">Success Rate</p>
                                <p className="text-2xl font-bold text-green-600">
                                  {formatPercentage(dashboard?.deliverySuccessRate || 0)}
                                </p>
                              </div>
                              <CheckCircleIcon className="h-8 w-8 text-green-500" />
                            </div>
                            <p className="text-xs text-green-600 mt-2">
                              Delivered successfully
                            </p>
                          </div>
                        </div>

                        {/* Failure Analysis */}
                        <div className="space-y-4">
                          <h4 className="text-lg font-semibold">Failure Analysis</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-lg border">
                              <h5 className="font-medium mb-3">Common Failure Reasons</h5>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">Customer Not Available</span>
                                  <Badge variant="destructive">45%</Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">Wrong Address</span>
                                  <Badge variant="destructive">25%</Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">Payment Issues</span>
                                  <Badge variant="destructive">15%</Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">Food Quality Issues</span>
                                  <Badge variant="destructive">10%</Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">Other</span>
                                  <Badge variant="destructive">5%</Badge>
                                </div>
                              </div>
                            </div>

                            <div className="p-4 rounded-lg border">
                              <h5 className="font-medium mb-3">Failure Trends</h5>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">Peak Failure Hours</span>
                                  <Badge variant="outline">12-2 PM</Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">High Failure Days</span>
                                  <Badge variant="outline">Weekends</Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">Problem Areas</span>
                                  <Badge variant="outline">Remote Locations</Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">Weather Impact</span>
                                  <Badge variant="outline">Rainy Days</Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Items */}
                        <div className="p-4 rounded-lg border border-blue-200 bg-blue-50">
                          <h5 className="font-medium text-blue-800 mb-3">Recommended Actions</h5>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-sm text-blue-700">Implement customer confirmation calls before delivery</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-sm text-blue-700">Improve address validation system</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-sm text-blue-700">Add GPS tracking for better route optimization</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-sm text-blue-700">Train executives on customer communication</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Detailed Reports */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Delivery Status Report */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Delivery Status Report</CardTitle>
                        <CardDescription>Current status breakdown for all deliveries</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {dashboard?.statusBreakdown?.map((item, index) => (
                            <div key={item.status} className="flex items-center justify-between p-3 rounded-lg border">
                              <div className="flex items-center">
                                <div className={`w-4 h-4 rounded-full ${getStatusColor(item.status)} mr-3`}></div>
                                <span className="text-sm font-medium">{item.status}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={getStatusVariant(item.status)}>{item.count}</Badge>
                                <span className="text-sm text-muted-foreground">
                                  {formatPercentage((item.count / Math.max(dashboard?.totalDeliveryItems || 1, 1)) * 100)}
                                </span>
                              </div>
                            </div>
                          )) || (
                            <div className="text-center py-8">
                              <p className="text-sm text-muted-foreground">No status data available</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Time Slot Report */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Time Slot Report</CardTitle>
                        <CardDescription>Delivery distribution by meal time slots</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {dashboard?.timeSlotBreakdown?.map((item, index) => (
                            <div key={item.timeSlot} className="flex items-center justify-between p-3 rounded-lg border">
                              <div className="flex items-center">
                                <div className={`w-4 h-4 rounded-full ${
                                  item.timeSlot === 'Breakfast' ? 'bg-orange-500' :
                                  item.timeSlot === 'Lunch' ? 'bg-green-500' : 'bg-purple-500'
                                } mr-3`}></div>
                                <span className="text-sm font-medium">{item.timeSlot}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{item.count}</Badge>
                                <span className="text-sm text-muted-foreground">
                                  {formatPercentage((item.count / Math.max(dashboard?.totalDeliveryItems || 1, 1)) * 100)}
                                </span>
                              </div>
                            </div>
                          )) || (
                            <div className="text-center py-8">
                              <p className="text-sm text-muted-foreground">No time slot data available</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Executive Performance Report */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Executive Performance Report</CardTitle>
                      <CardDescription>Individual executive performance metrics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {executives?.executives?.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b bg-muted/50">
                                <th className="text-left p-3 font-medium text-sm">Executive</th>
                                <th className="text-right p-3 font-medium text-sm">Deliveries</th>
                                <th className="text-right p-3 font-medium text-sm">Success Rate</th>
                                <th className="text-right p-3 font-medium text-sm">Avg Time</th>
                                <th className="text-center p-3 font-medium text-sm">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {executives.executives.map((executive, index) => (
                                <tr key={executive.id} className="border-b hover:bg-muted/25 transition-colors">
                                  <td className="p-3">
                                    <div>
                                      <h4 className="font-medium text-sm">{executive.name}</h4>
                                      <p className="text-xs text-muted-foreground">{executive.email}</p>
                                    </div>
                                  </td>
                                  <td className="p-3 text-right">
                                    <span className="font-semibold text-blue-600">
                                      {executive.totalDeliveries}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right">
                                    <Badge 
                                      variant={executive.successRate >= 90 ? 'success' : 
                                             executive.successRate >= 70 ? 'default' : 'destructive'}
                                    >
                                      {formatPercentage(executive.successRate)}
                                    </Badge>
                                  </td>
                                  <td className="p-3 text-right">
                                    <span className="text-sm font-medium">
                                      {formatTime(executive.averageDeliveryTime)}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center">
                                    <Badge 
                                      variant={executive.status === 'ACTIVE' ? 'success' : 'secondary'}
                                    >
                                      {executive.status}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-foreground mb-2">No Executive Data</h3>
                          <p className="text-sm text-muted-foreground">
                            No delivery executive performance data available.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDashboardPage;
