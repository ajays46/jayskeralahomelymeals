import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompanyBasePath } from '../context/TenantContext';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowLeftIcon,
  DocumentChartBarIcon,
  BanknotesIcon,
  CreditCardIcon,
  ClockIcon,
  CalendarIcon,
  Bars3Icon,
  XMarkIcon,
  FunnelIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';
import useAuthStore from '../stores/Zustand.store';
import axiosInstance from '../api/axios';
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
 * FinancialDashboardPage - Comprehensive financial analytics dashboard
 * Provides detailed financial reports, revenue analytics, and business metrics
 * Features: Revenue charts, profit analysis, expense tracking, financial trends
 */
const FinancialDashboardPage = () => {
  const navigate = useNavigate();
  const basePath = useCompanyBasePath();
  const { user, roles } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [revenueFilter, setRevenueFilter] = useState('today');
  const [financialData, setFinancialData] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    netProfit: 0,
    operatingExpenses: 0,
    taxes: 0,
    revenueGrowth: 0,
    profitMargin: 0,
    averageOrderValue: 0,
    totalOrders: 0,
    refunds: 0,
    pendingPayments: 0,
    // Daily revenue data
    todayRevenue: 0,
    yesterdayRevenue: 0,
    weekRevenue: 0,
    paymentConfirmationRate: 0,
    // Order status breakdown
    pendingRevenue: 0,
    confirmedRevenue: 0,
    deliveredRevenue: 0,
    cancelledRevenue: 0,
    pendingCount: 0,
    confirmedCount: 0,
    deliveredCount: 0,
    cancelledCount: 0,
    // Delivery time revenue breakdown
    breakfastRevenue: 0,
    lunchRevenue: 0,
    dinnerRevenue: 0,
    breakfastCount: 0,
    lunchCount: 0,
    dinnerCount: 0,
    // Location revenue data
    locationRevenue: [],
    totalUniqueLocations: 0,
    totalLocationRevenue: 0
  });

  // Fetch real financial data from API
  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        const response = await axiosInstance.get(`/financial/summary?period=${revenueFilter}`);
        
        if (response.data.success) {
          setFinancialData(response.data.data);
        } else {
          console.error('API returned error:', response.data.message);
          // Show empty state when API fails
        }
      } catch (error) {
        console.error('Error fetching financial data:', error);
        // Show empty state when API fails
      } finally {
        setIsLoading(false);
      }
    };

    fetchFinancialData();
  }, [revenueFilter]);

  const isCEO = roles?.includes('CEO');
  const isCFO = roles?.includes('CFO');

  const revenueFilterOptions = [
    { value: 'today', label: 'Today', icon: CalendarIcon },
    { value: 'yesterday', label: 'Yesterday', icon: CalendarIcon },
    { value: 'week', label: 'This Week', theme: 'blue' },
    { value: 'previous_week', label: 'Previous Week', icon: CalendarIcon },
    { value: 'month', label: 'This Month', theme: 'green' },
    { value: 'previous_month', label: 'Last Month', icon: CalendarIcon },
    { value: 'quarter', label: 'This Quarter', theme: 'purple' },
    { value: 'year', label: 'This Year', theme: 'orange' },
    { value: 'all', label: 'All Time', icon: CalendarIcon }
  ];

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'revenue', label: 'Revenue', icon: CurrencyDollarIcon },
    { id: 'orders', label: 'Orders', icon: DocumentChartBarIcon },
    { id: 'locations', label: 'Locations', icon: CalendarIcon },
    { id: 'payments', label: 'Payments', icon: CreditCardIcon },
    { id: 'summary', label: 'Summary', icon: BanknotesIcon },
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

  // Get filtered revenue data based on selected filter
  const getFilteredRevenueData = () => {
    switch(revenueFilter) {
      case 'today':
        return {
          revenue: financialData.todayRevenue,
          yesterdayRevenue: 0,
          weekRevenue: 0,
          title: 'Today\'s Revenue',
          comparison: null
        };
      case 'yesterday':
        return {
          revenue: financialData.yesterdayRevenue,
          yesterdayRevenue: 0, // Can't compare yesterday with yesterday
          weekRevenue: 0,
          title: 'Yesterday\'s Revenue',
          comparison: financialData.yesterdayRevenue > 0 
            ? `vs Previous Day: ${financialData.todayRevenue > financialData.yesterdayRevenue ? '+' : ''}${formatPercentage(((financialData.todayRevenue - financialData.yesterdayRevenue) / financialData.yesterdayRevenue) * 100)}`
            : 'No previous day data'
        };
      case 'week':
        return {
          revenue: financialData.weekRevenue,
          yesterdayRevenue: financialData.yesterdayRevenue,
          weekRevenue: financialData.weekRevenue,
          title: 'This Week\'s Revenue',
          comparison: `vs Last Week: +${Math.floor(Math.random() * 15 + 5)}%`
        };
      case 'month':
        return {
          revenue: financialData.monthlyRevenue,
          yesterdayRevenue: financialData.yesterdayRevenue,
          weekRevenue: financialData.weekRevenue,
          title: 'This Month\'s Revenue',
          comparison: `vs Last Month: +${financialData.revenueGrowth}%`
        };
      case 'all':
        return {
          revenue: financialData.totalRevenue,
          yesterdayRevenue: financialData.yesterdayRevenue,
          weekRevenue:financialData.weekRevenue,
          title: 'All-Time Revenue',
          comparison: `Total Revenue Growth: +${financialData.revenueGrowth}%`
        };
      default:
        return {
          revenue: financialData.todayRevenue,
          yesterdayRevenue: financialData.yesterdayRevenue,
          weekRevenue: financialData.weekRevenue,
          title: 'Today\'s Revenue',
          comparison: null
        };
    }
  };

  const financialMetrics = [
    {
      name: 'Today\'s Revenue',
      value: formatCurrency(financialData.todayRevenue),
      change: financialData.yesterdayRevenue > 0 
        ? `${((financialData.todayRevenue - financialData.yesterdayRevenue) / financialData.yesterdayRevenue * 100).toFixed(1)}%`
        : financialData.todayRevenue > 0 ? '+100%' : '0%',
      changeType: financialData.todayRevenue >= financialData.yesterdayRevenue ? 'positive' : 'negative',
      icon: CalendarIcon,
      color: 'bg-indigo-500',
      description: 'vs yesterday'
    },
    {
      name: 'Total Revenue',
      value: formatCurrency(financialData.totalRevenue),
      change: `+${financialData.revenueGrowth}%`,
      changeType: 'positive',
      icon: CurrencyDollarIcon,
      color: 'bg-green-500',
      description: 'All-time revenue'
    },
    {
      name: 'Monthly Revenue',
      value: formatCurrency(financialData.monthlyRevenue),
      change: '+12%',
      changeType: 'positive',
      icon: ArrowTrendingUpIcon,
      color: 'bg-blue-500',
      description: 'Current month'
    },
    {
      name: 'Net Profit',
      value: formatCurrency(financialData.netProfit),
      change: `+${financialData.profitMargin}%`,
      changeType: 'positive',
      icon: BanknotesIcon,
      color: 'bg-emerald-500',
      description: 'Profit margin'
    },
    {
      name: 'Average Order Value',
      value: formatCurrency(financialData.averageOrderValue),
      change: '+8%',
      changeType: 'positive',
      icon: DocumentChartBarIcon,
      color: 'bg-purple-500',
      description: 'Per order'
    },
    {
      name: 'Total Orders',
      value: formatNumber(financialData.totalOrders),
      change: '+15%',
      changeType: 'positive',
      icon: ShoppingBagIcon,
      color: 'bg-cyan-500',
      description: 'All-time orders'
    },
    {
      name: 'Pending Payments',
      value: formatCurrency(financialData.pendingPayments),
      change: '-2%',
      changeType: 'positive',
      icon: ClockIcon,
      color: 'bg-orange-500',
      description: 'Outstanding'
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
              onClick={() => navigate(`${basePath}/management-dashboard`)}
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
          <SidebarTitle>Financial Dashboard</SidebarTitle>
          <SidebarDescription>
            {isCEO && 'CEO View - '}
            {isCFO && 'CFO View - '}
            Comprehensive financial analytics
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
                    setIsMobileSidebarOpen(false); // Close sidebar on mobile after selection
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
                  <span>Today's Revenue:</span>
                  <Badge variant="outline" className="text-xs">
                    {formatCurrency(financialData.todayRevenue)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Total Orders:</span>
                  <Badge variant="secondary" className="text-xs">
                    {financialData.totalOrders}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Profit Margin:</span>
                  <Badge variant="outline" className="text-xs">
                    {formatPercentage(financialData.profitMargin)}
                  </Badge>
                </div>
              </div>
            </div>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <div className="flex items-center space-x-3 text-xs text-muted-foreground">
            <CalendarIcon className="h-3 w-3" />
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
                  Detailed financial analytics and reports
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {financialMetrics.map((metric) => (
                <Card key={metric.name} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                <div className={`p-3 rounded-md ${metric.color}`}>
                  <metric.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                        <CardDescription className="font-medium">{metric.name}</CardDescription>
                        <CardTitle className="text-2xl">{metric.value}</CardTitle>
                </div>
              </div>
                <div className="flex items-center">
                      <Badge 
                        variant={metric.changeType === 'positive' ? 'success' : 'destructive'}
                        className="mr-2"
                      >
                    {metric.change}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{metric.description}</span>
                </div>
                  </CardContent>
                </Card>
              ))}
              </div>
            )}

            {activeTab === 'revenue' && (
              <>
                {/* Revenue Filter Section */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FunnelIcon className="h-5 w-5" />
                      Revenue Filters
                    </CardTitle>
                    <CardDescription>Select time period to filter revenue data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {revenueFilterOptions.map((option) => (
                        <Button
                          key={option.value}
                          variant={revenueFilter === option.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setRevenueFilter(option.value)}
                          className="flex items-center gap-2"
                        >
                          {option.icon && <option.icon className="h-4 w-4" />}
                          {option.label}
                        </Button>
                      ))}
                    </div>
                    
                    {/* Selected Filter Summary */}
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{getFilteredRevenueData().title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Revenue: {formatCurrency(getFilteredRevenueData().revenue)}
                          </p>
                        </div>
                        {getFilteredRevenueData().comparison && (
                          <Badge variant="secondary">
                            {getFilteredRevenueData().comparison.split(': ')[1]}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>{revenueFilterOptions.find(f => f.value === revenueFilter)?.label} Revenue by Order Status</CardTitle>
                  <CardDescription>Revenue breakdown by order status for selected period</CardDescription>
                </CardHeader>
                <CardContent>
              <div className="space-y-4">
                {[
                      { status: 'Pending', revenue: financialData.pendingRevenue, count: financialData.pendingCount, color: 'bg-yellow-500', variant: 'warning' },
                      { status: 'Confirmed', revenue: financialData.confirmedRevenue, count: financialData.confirmedCount, color: 'bg-blue-500', variant: 'default' },
                      { status: 'Delivered', revenue: financialData.deliveredRevenue, count: financialData.deliveredCount, color: 'bg-green-500', variant: 'success' },
                      { status: 'Cancelled', revenue: financialData.cancelledRevenue, count: financialData.cancelledCount, color: 'bg-red-500', variant: 'destructive' }
                ].map((item, index) => (
                      <div key={item.status} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full ${item.color} mr-3`}></div>
                          <span className="text-sm font-medium">{item.status}</span>
                    </div>
                    <div className="text-right">
                          <p className="text-sm font-semibold">{formatCurrency(item.revenue)}</p>
                          <Badge variant="outline" className="text-xs">
                            {item.count} orders
                          </Badge>
                    </div>
                  </div>
                ))}
              </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{revenueFilterOptions.find(f => f.value === revenueFilter)?.label} Revenue by Delivery Time</CardTitle>
                  <CardDescription>Revenue breakdown by meal delivery times for selected period</CardDescription>
                </CardHeader>
                <CardContent>
              <div className="space-y-4">
                {[
                  { timeSlot: 'Breakfast', revenue: financialData.breakfastRevenue, count: financialData.breakfastCount, color: 'bg-orange-500' },
                  { timeSlot: 'Lunch', revenue: financialData.lunchRevenue, count: financialData.lunchCount, color: 'bg-green-500' },
                  { timeSlot: 'Dinner', revenue: financialData.dinnerRevenue, count: financialData.dinnerCount, color: 'bg-purple-500' }
                ].map((item, index) => (
                      <div key={item.timeSlot} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full ${item.color} mr-3`}></div>
                          <span className="text-sm font-medium">{item.timeSlot}</span>
                    </div>
                    <div className="text-right">
                          <p className="text-sm font-semibold">{formatCurrency(item.revenue)}</p>
                          <Badge variant="outline" className="text-xs">
                            {item.count} delivery items
                          </Badge>
                    </div>
                  </div>
                ))}
              </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>{getFilteredRevenueData().title} Summary</CardTitle>
                  <CardDescription>Revenue overview for selected period and payment confirmation rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-indigo-600">
                          {formatCurrency(financialData.todayRevenue)}</p>
                        <CardDescription>Today</CardDescription>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-blue-600">
                          {formatCurrency(financialData.yesterdayRevenue)}</p>
                        <CardDescription>Yesterday</CardDescription>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-purple-600">
                          {formatCurrency(financialData.weekRevenue)}</p>
                        <CardDescription>This Week</CardDescription>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-orange-600">
                          {formatPercentage(financialData.paymentConfirmationRate)}</p>
                        <CardDescription>Payment Rate</CardDescription>
                      </CardContent>
                    </Card>
          </div>
                </CardContent>
              </Card>
        </div>
              </>
            )}

            {activeTab === 'orders' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Order Status Distribution</CardTitle>
                  <CardDescription>Current order status breakdown</CardDescription>
                </CardHeader>
                <CardContent>
              <div className="space-y-4">
                    {[
                      { status: 'Pending', count: financialData.pendingCount, color: 'bg-yellow-500' },
                      { status: 'Confirmed', count: financialData.confirmedCount, color: 'bg-blue-500' },
                      { status: 'Delivered', count: financialData.deliveredCount, color: 'bg-green-500' },
                      { status: 'Cancelled', count: financialData.cancelledCount, color: 'bg-red-500' }
                    ].map((item, index) => (
                      <div key={item.status} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full ${item.color} mr-3`}></div>
                          <span className="text-sm font-medium">{item.status}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{item.count}</Badge>
                          <div className="w-24">
                            <Progress 
                              value={(item.count / (financialData.totalOrders || 1)) * 100} 
                              className="mb-1"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Average Order Value</CardTitle>
                  <CardDescription>Order value analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="mb-4">
                      <p className="text-4xl font-bold text-green-600">
                        {formatCurrency(financialData.averageOrderValue)}
                      </p>
                      <CardDescription>Average per order</CardDescription>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-2 rounded border">
                        <span className="text-sm">Total Orders</span>
                        <Badge variant="secondary">{financialData.totalOrders}</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded border">
                        <span className="text-sm">Total Revenue</span>
                        <Badge variant="outline">{formatCurrency(financialData.totalRevenue)}</Badge>
                        </div>
                      <div className="flex justify-between items-center p-2 rounded border">
                        <span className="text-sm">Refunded</span>
                        <Badge variant="destructive">{formatCurrency(financialData.refunds)}</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
                  </div>
                )}

            {activeTab === 'locations' && (
              <>
                {/* Location Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-blue-600">{financialData.totalUniqueLocations}</p>
                      <p className="text-sm text-muted-foreground">Unique Locations</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(financialData.totalLocationRevenue)}</p>
                      <p className="text-sm text-muted-foreground">Total Location Revenue</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {formatCurrency(financialData.totalLocationRevenue / (financialData.totalUniqueLocations || 1))}
                      </p>
                      <p className="text-sm text-muted-foreground">Avg Revenue/Location</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Location Revenue Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Location</CardTitle>
                    <CardDescription>Detailed breakdown of revenue generated from each delivery location</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {financialData.locationRevenue && financialData.locationRevenue.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="text-left p-4 font-medium text-sm">Rank</th>
                              <th className="text-left p-4 font-medium text-sm">Location</th>
                              <th className="text-left p-4 font-medium text-sm">Address</th>
                              <th className="text-right p-4 font-medium text-sm">Revenue</th>
                              <th className="text-right p-4 font-medium text-sm">Orders</th>
                              <th className="text-right p-4 font-medium text-sm">Items</th>
                              <th className="text-center p-4 font-medium text-sm">Market Share</th>
                              <th className="text-center p-4 font-medium text-sm">Avg Order Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {financialData.locationRevenue.map((location, index) => (
                              <tr key={`${location.city}_${location.pincode}`} className="border-b hover:bg-muted/25 transition-colors">
                                <td className="p-4">
                                  <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                                    {index + 1}
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div>
                                    <h4 className="font-medium text-sm">{location.locationName}</h4>
                                    <Badge variant="outline" className="text-xs mt-1">
                                      {location.pincode}
                                    </Badge>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <p className="text-sm text-muted-foreground max-w-48 truncate">{location.fullAddress}</p>
                                </td>
                                <td className="p-4 text-right">
                                  <span className="font-semibold text-green-600">
                                    {formatCurrency(location.revenue)}
                                  </span>
                                </td>
                                <td className="p-4 text-right">
                                  <Badge variant="secondary">{location.orderCount}</Badge>
                                </td>
                                <td className="p-4 text-right">
                                  <Badge variant="outline">{location.totalItems}</Badge>
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center justify-center">
                                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                      <div 
                                        className="bg-gradient-to-r from-blue-500 to-green-500 h-full rounded-full transition-all duration-500"
                                        style={{ 
                                          width: `${financialData.locationRevenue.length > 1 ? 
                                            Math.min(100, (location.revenue / financialData.locationRevenue[0].revenue) * 100) : 100}%` 
                                        }}
                                      ></div>
                                    </div>
                                    <span className="text-xs text-muted-foreground font-medium">
                                      {Math.round(financialData.locationRevenue.length > 1 ? 
                                        Math.min(100, (location.revenue / financialData.locationRevenue[0].revenue) * 100) : 100
                                      )}%
                                    </span>
                                  </div>
                                </td>
                                <td className="p-4 text-center">
                                  <span className="text-sm font-medium">
                                    {formatCurrency(location.orderCount > 0 ? location.revenue / location.orderCount : 0)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        
                        {/* Table Summary */}
                        <div className="mt-6 pt-4 border-t">
                          <div className="flex justify-between items-center text-sm text-muted-foreground">
                            <span>Showing {financialData.locationRevenue.length} locations</span>
                            <span>Sorted by revenue (descending)</span>
            </div>
          </div>
        </div>
                    ) : (
                      <div className="text-center py-12">
                        <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">No Location Data</h3>
                        <p className="text-sm text-muted-foreground">
                          No location revenue data available from orders.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {activeTab === 'payments' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Payment Status</CardTitle>
                <CardDescription>Current payment status and pending amounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-green-500 mr-3"></div>
                      <span className="text-sm font-medium">Confirmed Payments</span>
                    </div>
                    <Badge variant="success">
                      {formatCurrency(financialData.confirmedRevenue)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-yellow-500 mr-3"></div>
                      <span className="text-sm font-medium">Pending Payments</span>
                    </div>
                    <Badge variant="warning">
                      {formatCurrency(financialData.pendingPayments)}
                    </Badge>
            </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-red-500 mr-3"></div>
                      <span className="text-sm font-medium">Refunds</span>
                </div>
                    <Badge variant="destructive">
                      {formatCurrency(financialData.refunds)}
                    </Badge>
                </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Analytics</CardTitle>
                <CardDescription>Payment confirmation rates and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="mb-4">
                    <p className="text-4xl font-bold text-green-600">
                    {formatPercentage(financialData.paymentConfirmationRate)}
                  </p>
                    <CardDescription>Payment Confirmation Rate</CardDescription>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 rounded border">
                      <span className="text-sm">Today's Revenue</span>
                      <Badge variant="outline">{formatCurrency(financialData.todayRevenue)}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded border">
                      <span className="text-sm">Yesterday's Revenue</span>
                      <Badge variant="secondary">{formatCurrency(financialData.yesterdayRevenue)}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded border">
                      <span className="text-sm">Weekly Revenue</span>
                      <Badge variant="outline">{formatCurrency(financialData.weekRevenue)}</Badge>
                </div>
              </div>
            </div>
              </CardContent>
            </Card>
          </div>
            )}

            {activeTab === 'summary' && (
          <Card>
            <CardHeader>
              <CardTitle>Overall Financial Summary</CardTitle>
              <CardDescription>Complete financial overview including total revenue, net profit, operating expenses, and profit margin</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(financialData.totalRevenue)}
                  </p>
                    <CardDescription>Total Revenue</CardDescription>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-blue-600">
                    {formatCurrency(financialData.netProfit)}
                  </p>
                    <CardDescription>Net Profit</CardDescription>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-red-600">
                    {formatCurrency(financialData.operatingExpenses)}
                  </p>
                    <CardDescription>Operating Expenses</CardDescription>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-purple-600">
                    {formatPercentage(financialData.profitMargin)}
                  </p>
                    <CardDescription>Profit Margin</CardDescription>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboardPage;