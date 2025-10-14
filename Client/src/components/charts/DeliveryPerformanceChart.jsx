import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

/**
 * DeliveryPerformanceChart - Comprehensive chart component for delivery performance data
 * Features: Bar chart for executive performance, pie chart for status distribution, area chart for trends
 */

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
const STATUS_COLORS = {
  'Delivered': '#10B981',
  'Pending': '#F59E0B', 
  'Confirmed': '#3B82F6',
  'Cancelled': '#EF4444'
};

const DeliveryPerformanceChart = ({ 
  dashboard = {}, 
  executives = {},
  timeAnalytics = {},
  periodFilter = 'all' 
}) => {
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

  // Prepare data for executive performance bar chart
  const executiveData = executives?.executives?.slice(0, 5).map((executive, index) => ({
    name: executive.name.length > 15 ? executive.name.substring(0, 15) + '...' : executive.name,
    fullName: executive.name,
    deliveries: executive.totalDeliveries || 0,
    successRate: executive.successRate || 0,
    avgTime: executive.averageDeliveryTime || 0,
    rank: index + 1
  })) || [];

  // Prepare data for status distribution pie chart
  const statusData = dashboard?.statusBreakdown?.map(item => ({
    name: item.status,
    value: item.count,
    color: STATUS_COLORS[item.status] || '#6B7280'
  })) || [];

  // Prepare data for time slot distribution
  const timeSlotData = dashboard?.timeSlotBreakdown?.map(item => ({
    timeSlot: item.timeSlot,
    count: item.count,
    color: item.timeSlot === 'Breakfast' ? '#F59E0B' : 
           item.timeSlot === 'Lunch' ? '#10B981' : '#8B5CF6'
  })) || [];

  // Prepare data for delivery trends (mock data for now)
  const trendData = [
    { day: 'Mon', delivered: 45, pending: 8, cancelled: 2 },
    { day: 'Tue', delivered: 52, pending: 6, cancelled: 1 },
    { day: 'Wed', delivered: 48, pending: 7, cancelled: 3 },
    { day: 'Thu', delivered: 55, pending: 5, cancelled: 1 },
    { day: 'Fri', delivered: 60, pending: 4, cancelled: 2 },
    { day: 'Sat', delivered: 35, pending: 12, cancelled: 4 },
    { day: 'Sun', delivered: 28, pending: 15, cancelled: 6 }
  ];

  // Custom tooltip for executive performance
  const ExecutiveTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{data.fullName}</p>
          <p className="text-sm text-muted-foreground">Rank: #{data.rank}</p>
          <p className="text-sm text-blue-600">
            Deliveries: {formatNumber(data.deliveries)}
          </p>
          <p className="text-sm text-green-600">
            Success Rate: {formatPercentage(data.successRate)}
          </p>
          <p className="text-sm text-orange-600">
            Avg Time: {formatTime(data.avgTime)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for status pie chart
  const StatusTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{data.name}</p>
          <p className="text-sm text-blue-600">
            Count: {formatNumber(data.value)}
          </p>
          <p className="text-sm text-muted-foreground">
            {formatPercentage((data.value / Math.max(dashboard?.totalDeliveryItems || 1, 1)) * 100)} of total
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for trend chart
  const TrendTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatNumber(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Executive Performance Bar Chart */}
      <div className="bg-background border border-border rounded-lg p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">Top Delivery Executives Performance</h3>
          <p className="text-sm text-muted-foreground">
            Delivery count comparison for top performing executives ({periodFilter} period)
          </p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={executiveData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="name" 
              stroke="#9CA3AF"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
              tickFormatter={(value) => formatNumber(value)}
            />
            <Tooltip content={<ExecutiveTooltip />} />
            <Legend />
            <Bar 
              dataKey="deliveries" 
              fill="#3B82F6" 
              name="Deliveries"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Pie Chart */}
        <div className="bg-background border border-border rounded-lg p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">Delivery Status Distribution</h3>
            <p className="text-sm text-muted-foreground">
              Current status breakdown of all deliveries
            </p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<StatusTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Time Slot Distribution */}
        <div className="bg-background border border-border rounded-lg p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">Time Slot Distribution</h3>
            <p className="text-sm text-muted-foreground">
              Deliveries by meal time slots
            </p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={timeSlotData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="timeSlot" 
                stroke="#9CA3AF"
                fontSize={12}
              />
              <YAxis 
                stroke="#9CA3AF"
                fontSize={12}
                tickFormatter={(value) => formatNumber(value)}
              />
              <Tooltip 
                formatter={(value) => [formatNumber(value), 'Deliveries']}
                labelFormatter={(label) => `${label} Slot`}
              />
              <Bar 
                dataKey="count" 
                fill="#10B981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Trend Chart */}
      <div className="bg-background border border-border rounded-lg p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">Weekly Delivery Trends</h3>
          <p className="text-sm text-muted-foreground">
            Daily delivery performance over the past week
          </p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="day" 
              stroke="#9CA3AF"
              fontSize={12}
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
              tickFormatter={(value) => formatNumber(value)}
            />
            <Tooltip content={<TrendTooltip />} />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="delivered" 
              stackId="1"
              stroke="#10B981" 
              fill="#10B981"
              fillOpacity={0.6}
              name="Delivered"
            />
            <Area 
              type="monotone" 
              dataKey="pending" 
              stackId="2"
              stroke="#F59E0B" 
              fill="#F59E0B"
              fillOpacity={0.6}
              name="Pending"
            />
            <Area 
              type="monotone" 
              dataKey="cancelled" 
              stackId="3"
              stroke="#EF4444" 
              fill="#EF4444"
              fillOpacity={0.6}
              name="Cancelled"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Deliveries</p>
              <p className="text-2xl font-bold">{formatNumber(dashboard?.totalDeliveryItems || 0)}</p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-2xl">🚚</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Success Rate</p>
              <p className="text-2xl font-bold">{formatPercentage(dashboard?.deliverySuccessRate || 0)}</p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Avg Time</p>
              <p className="text-2xl font-bold">{formatTime(dashboard?.averageDeliveryTime || 0)}</p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-2xl">⏱️</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Active Executives</p>
              <p className="text-2xl font-bold">{executives?.activeExecutives || 0}</p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryPerformanceChart;
