import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BuildingOfficeIcon, 
  UsersIcon, 
  ChartBarIcon,
  ArrowLeftIcon,
  CalendarIcon,
  Bars3Icon,
  XMarkIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  CurrencyDollarIcon,
  DocumentChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  ArrowPathIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import useAuthStore from '../stores/Zustand.store';
import { useSellerPerformanceData } from '../hooks/sellerHooks/useSellerPerformance';
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
import SellerPerformanceChart from '../components/charts/SellerPerformanceChart';

/**
 * SellerPerformanceDashboardPage - Comprehensive seller analytics dashboard
 * Provides detailed seller performance insights, order analytics, and operational metrics
 * Features: Seller management, order analytics, revenue tracking, performance monitoring
 */
const SellerPerformanceDashboardPage = () => {
  const navigate = useNavigate();
  const { user, roles } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [periodFilter, setPeriodFilter] = useState('all');

  // Use the actual hook to fetch data
  const { 
    summary, 
    sellers, 
    topPerformers, 
    isLoading, 
    error, 
    refetchAll 
  } = useSellerPerformanceData(periodFilter);

  const isCEO = roles?.includes('CEO');
  const isCFO = roles?.includes('CFO');
  const isAdmin = roles?.includes('ADMIN');

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
    { id: 'sellers', label: 'Sellers', icon: UsersIcon },
    { id: 'reports', label: 'Reports', icon: DocumentChartBarIcon },
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
          <SidebarTitle>Seller Performance</SidebarTitle>
          <SidebarDescription>
            CEO Exclusive - Comprehensive seller analytics
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
                  <span>Active Sellers:</span>
                  <Badge variant="outline" className="text-xs">
                    {isLoading ? '...' : sellers?.activeSellers || 0}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Total Revenue:</span>
                  <Badge variant="secondary" className="text-xs">
                    {isLoading ? '...' : formatCurrency(summary?.totalRevenue || 0)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Total Customers:</span>
                  <Badge variant="outline" className="text-xs">
                    {isLoading ? '...' : summary?.totalCustomers || 0}
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
                  CEO Exclusive - Comprehensive seller performance analytics
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
                  <h3 className="text-lg font-medium text-foreground mb-2">Loading Seller Data</h3>
                  <p className="text-sm text-muted-foreground">
                    Please wait while we fetch the latest seller analytics...
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
                        <CardDescription>Select time period to filter seller data</CardDescription>
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
                              <CardDescription className="font-medium">Total Sellers</CardDescription>
                              <CardTitle className="text-2xl">{summary?.totalSellers || 0}</CardTitle>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Badge variant="outline" className="mr-2">
                              {summary?.activeSellers || 0} active
                            </Badge>
                            <span className="text-sm text-muted-foreground">sellers</span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-center mb-4">
                            <div className="p-3 rounded-md bg-green-500">
                              <CurrencyDollarIcon className="h-6 w-6 text-white" />
                            </div>
                            <div className="ml-4">
                              <CardDescription className="font-medium">Total Revenue</CardDescription>
                              <CardTitle className="text-2xl">{formatCurrency(summary?.totalRevenue || 0)}</CardTitle>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Badge variant="success" className="mr-2">
                              {formatCurrency(summary?.averageOrderValue || 0)} avg
                            </Badge>
                            <span className="text-sm text-muted-foreground">per order</span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-center mb-4">
                            <div className="p-3 rounded-md bg-blue-500">
                              <DocumentChartBarIcon className="h-6 w-6 text-white" />
                            </div>
                            <div className="ml-4">
                              <CardDescription className="font-medium">Total Orders</CardDescription>
                              <CardTitle className="text-2xl">{summary?.totalOrders || 0}</CardTitle>
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

                      <Card className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-center mb-4">
                            <div className="p-3 rounded-md bg-purple-500">
                              <UsersIcon className="h-6 w-6 text-white" />
                            </div>
                            <div className="ml-4">
                              <CardDescription className="font-medium">Total Customers</CardDescription>
                              <CardTitle className="text-2xl">{summary?.totalCustomers || 0}</CardTitle>
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

                    {/* Top Performers */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Top Performing Sellers</CardTitle>
                        <CardDescription>Best performing sellers based on orders and revenue</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {topPerformers && topPerformers.length > 0 ? (
                          <div className="space-y-4">
                            {topPerformers.map((seller, index) => (
                              <div key={seller.id} className="flex items-center justify-between p-4 rounded-lg border">
                                <div className="flex items-center">
                                  <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold mr-4">
                                    {index + 1}
                                  </div>
                                  <div>
                                    <h4 className="font-medium">{seller.name}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {formatNumber(seller.orders || 0)} orders • {formatCurrency(seller.revenue || 0)} revenue • {seller.customers || 0} customers
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button variant="outline" size="sm">
                                    <EyeIcon className="h-4 w-4 mr-1" />
                                    View
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <ChartBarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-foreground mb-2">No Top Performers</h3>
                            <p className="text-sm text-muted-foreground">
                              No seller performance data available for the selected period.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Performance Charts */}
                    <SellerPerformanceChart 
                      topPerformers={topPerformers}
                      summary={summary}
                      sellers={sellers}
                      periodFilter={periodFilter}
                    />
                  </>
                )}

                {activeTab === 'sellers' && (
                  <>
                    {/* Seller Performance Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold text-blue-600">{sellers?.totalSellers || 0}</p>
                          <p className="text-sm text-muted-foreground">Total Sellers</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold text-green-600">{sellers?.activeSellers || 0}</p>
                          <p className="text-sm text-muted-foreground">Active Sellers</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold text-purple-600">
                            {formatCurrency(summary?.totalRevenue || 0)}
                          </p>
                          <p className="text-sm text-muted-foreground">Total Revenue</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Seller Performance Table */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Seller Performance</CardTitle>
                        <CardDescription>Detailed performance metrics for each seller</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {sellers?.sellers?.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="border-b bg-muted/50">
                                  <th className="text-left p-4 font-medium text-sm">Seller</th>
                                  <th className="text-left p-4 font-medium text-sm">Contact</th>
                                  <th className="text-right p-4 font-medium text-sm">Orders</th>
                                  <th className="text-right p-4 font-medium text-sm">Revenue</th>
                                  <th className="text-right p-4 font-medium text-sm">Customers</th>
                                  <th className="text-center p-4 font-medium text-sm">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sellers.sellers.map((seller, index) => (
                                  <tr key={seller.id} className="border-b hover:bg-muted/25 transition-colors">
                                    <td className="p-4">
                                      <div>
                                        <h4 className="font-medium text-sm">{seller.name}</h4>
                                      </div>
                                    </td>
                                    <td className="p-4">
                                      <div>
                                        <p className="text-sm font-medium">{seller.email}</p>
                                        <p className="text-sm text-muted-foreground">{seller.phoneNumber}</p>
                                      </div>
                                    </td>
                                    <td className="p-4 text-right">
                                      <span className="font-semibold text-blue-600">
                                        {formatNumber(seller.totalOrders)}
                                      </span>
                                    </td>
                                    <td className="p-4 text-right">
                                      <span className="font-semibold text-green-600">
                                        {formatCurrency(seller.totalRevenue)}
                                      </span>
                                    </td>
                                    <td className="p-4 text-right">
                                      <span className="font-semibold text-purple-600">
                                        {seller.customerCount || 0}
                                      </span>
                                    </td>
                                    <td className="p-4 text-center">
                                      <Badge 
                                        variant={seller.status === 'ACTIVE' ? 'success' : 'secondary'}
                                      >
                                        {seller.status}
                                      </Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <BuildingOfficeIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-foreground mb-2">No Seller Data</h3>
                            <p className="text-sm text-muted-foreground">
                              No seller performance data available for the selected period.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </>
                )}


                {activeTab === 'reports' && (
                  <>
                    {/* Seller Reports Section */}
                    <div className="space-y-6">
                      {/* Report Header */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <DocumentChartBarIcon className="h-5 w-5" />
                            Seller Reports
                          </CardTitle>
                          <CardDescription>
                            Comprehensive seller analytics and performance reports
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

                      {/* Revenue Report */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <CurrencyDollarIcon className="h-5 w-5 text-green-500" />
                            Revenue Report
                          </CardTitle>
                          <CardDescription>Seller revenue analysis and trends</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="p-4 rounded-lg border border-green-200 bg-green-50">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-green-800">Total Revenue</p>
                                    <p className="text-2xl font-bold text-green-600">
                                      {formatCurrency(summary?.totalRevenue || 0)}
                                    </p>
                                  </div>
                                  <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
                                </div>
                                <p className="text-xs text-green-600 mt-2">
                                  +15% from last period
                                </p>
                              </div>

                              <div className="p-4 rounded-lg border border-blue-200 bg-blue-50">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-blue-800">Avg Order Value</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                      {formatCurrency(summary?.averageOrderValue || 0)}
                                    </p>
                                  </div>
                                  <DocumentChartBarIcon className="h-8 w-8 text-blue-500" />
                                </div>
                                <p className="text-xs text-blue-600 mt-2">
                                  +8% improvement
                                </p>
                              </div>

                              <div className="p-4 rounded-lg border border-purple-200 bg-purple-50">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-purple-800">Top Seller</p>
                                    <p className="text-lg font-bold text-purple-600">
                                      Restaurant ABC
                                    </p>
                                  </div>
                                  <BuildingOfficeIcon className="h-8 w-8 text-purple-500" />
                                </div>
                                <p className="text-xs text-purple-600 mt-2">
                                  {formatCurrency(75000)} revenue
                                </p>
                              </div>
                            </div>
                          </div>
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

export default SellerPerformanceDashboardPage;
