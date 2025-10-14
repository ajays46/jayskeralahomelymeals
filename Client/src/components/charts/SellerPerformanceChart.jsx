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
  Line
} from 'recharts';

/**
 * SellerPerformanceChart - Comprehensive chart component for seller performance data
 * Features: Bar chart for revenue comparison, pie chart for order distribution, line chart for trends
 */

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const SellerPerformanceChart = ({ 
  topPerformers = [], 
  summary = {}, 
  sellers = [],
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

  // Prepare data for revenue bar chart
  const revenueData = topPerformers.slice(0, 5).map((seller, index) => ({
    name: seller.name.length > 15 ? seller.name.substring(0, 15) + '...' : seller.name,
    fullName: seller.name,
    revenue: seller.revenue || 0,
    orders: seller.orders || 0,
    customers: seller.customers || 0,
    rank: index + 1
  }));

  // Prepare data for order distribution pie chart
  const orderDistributionData = [
    { name: 'Top 3 Sellers', value: topPerformers.slice(0, 3).reduce((sum, seller) => sum + (seller.orders || 0), 0), color: '#0088FE' },
    { name: 'Other Sellers', value: topPerformers.slice(3).reduce((sum, seller) => sum + (seller.orders || 0), 0), color: '#00C49F' }
  ].filter(item => item.value > 0);

  // Prepare data for revenue vs orders scatter plot
  const scatterData = topPerformers.map(seller => ({
    name: seller.name,
    revenue: seller.revenue || 0,
    orders: seller.orders || 0,
    customers: seller.customers || 0
  }));

  // Custom tooltip for bar chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{data.fullName}</p>
          <p className="text-sm text-muted-foreground">Rank: #{data.rank}</p>
          <p className="text-sm text-green-600">
            Revenue: {formatCurrency(data.revenue)}
          </p>
          <p className="text-sm text-blue-600">
            Orders: {formatNumber(data.orders)}
          </p>
          <p className="text-sm text-purple-600">
            Customers: {formatNumber(data.customers)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for pie chart
  const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{data.name}</p>
          <p className="text-sm text-blue-600">
            Orders: {formatNumber(data.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Revenue Performance Bar Chart */}
      <div className="bg-background border border-border rounded-lg p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">Top Sellers Revenue Performance</h3>
          <p className="text-sm text-muted-foreground">
            Revenue comparison for top performing sellers ({periodFilter} period)
          </p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="revenue" 
              fill="#10B981" 
              name="Revenue"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Distribution Pie Chart */}
        <div className="bg-background border border-border rounded-lg p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">Order Distribution</h3>
            <p className="text-sm text-muted-foreground">
              Orders split between top performers
            </p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={orderDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {orderDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue vs Orders Scatter Chart */}
        <div className="bg-background border border-border rounded-lg p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">Revenue vs Orders</h3>
            <p className="text-sm text-muted-foreground">
              Correlation between order count and revenue
            </p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={scatterData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="orders" 
                stroke="#9CA3AF"
                fontSize={12}
                name="Orders"
              />
              <YAxis 
                stroke="#9CA3AF"
                fontSize={12}
                tickFormatter={(value) => formatCurrency(value)}
                name="Revenue"
              />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'revenue' ? formatCurrency(value) : formatNumber(value),
                  name === 'revenue' ? 'Revenue' : 'Orders'
                ]}
                labelFormatter={(label) => `Orders: ${formatNumber(label)}`}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10B981" 
                strokeWidth={3}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                name="Revenue"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(summary.totalRevenue || 0)}</p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Orders</p>
              <p className="text-2xl font-bold">{formatNumber(summary.totalOrders || 0)}</p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-2xl">📦</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Active Sellers</p>
              <p className="text-2xl font-bold">{summary.activeSellers || 0}</p>
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

export default SellerPerformanceChart;
