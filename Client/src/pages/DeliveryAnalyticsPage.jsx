import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiTrendingUp, FiTrendingDown, FiBarChart2, FiPieChart, FiActivity, FiTarget, FiCalendar } from 'react-icons/fi';
import { MdLocalShipping, MdStore, MdPerson, MdAttachMoney, MdAnalytics, MdDashboard, MdAssessment, MdBusinessCenter } from 'react-icons/md';
import axiosInstance from '../api/axios';
import Navbar from '../components/Navbar';
import { SkeletonChart, SkeletonDashboard, SkeletonLoading } from '../components/Skeleton';

const DeliveryAnalyticsPage = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalSellers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeSellers: 0
  });
  const [timeRange, setTimeRange] = useState('month'); // 'week', 'month', 'quarter', 'year'
  const navigate = useNavigate();

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/admin/sellers-with-orders');
      
      if (response.data.status === 'success') {
        const sellersData = response.data.data;
        setSellers(sellersData);
        
        // Calculate comprehensive stats
        const totalOrders = sellersData.reduce((sum, seller) => sum + (seller.orderCount || 0), 0);
        const totalRevenue = sellersData.reduce((sum, seller) => sum + (seller.totalRevenue || 0), 0);
        const activeSellers = sellersData.filter(seller => seller.status === 'ACTIVE').length;
        const sellersWithOrders = sellersData.filter(seller => seller.orderCount > 0).length;
        const averageOrdersPerSeller = stats.totalSellers > 0 ? Math.round(totalOrders / sellersData.length) : 0;
        
        setStats({
          totalSellers: sellersData.length,
          totalOrders,
          totalRevenue,
          activeSellers,
          sellersWithOrders,
          averageOrdersPerSeller
        });
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setError('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getTopPerformers = () => {
    return sellers
      .filter(seller => seller.orderCount > 0)
      .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
      .slice(0, 5);
  };

  const getOrderStatusBreakdown = () => {
    const allOrders = sellers.flatMap(seller => seller.recentOrders || []);
    const statusCounts = {
      PENDING: 0,
      COMPLETED: 0,
      CANCELLED: 0
    };
    
    allOrders.forEach(order => {
      if (order.status in statusCounts) {
        statusCounts[order.status]++;
      }
    });
    
    return statusCounts;
  };

  const getRevenueTrend = () => {
    // Mock data for revenue trend - in real app, you'd fetch this from backend
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const revenue = [12000, 15000, 18000, 14000, 22000, 25000];
    
    return { months, revenue };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="pt-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <SkeletonDashboard />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Error Loading Analytics</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchAnalyticsData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const orderStatusBreakdown = getOrderStatusBreakdown();
  const topPerformers = getTopPerformers();
  const revenueTrend = getRevenueTrend();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navbar */}
      <Navbar />
      
      {/* Main Content */}
      <div className="pt-24">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/jkhm')}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Go back to home"
                >
                  <FiArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-3">
                  <MdAnalytics className="text-2xl text-blue-500" />
                  <h1 className="text-xl font-bold">Delivery Analytics Dashboard</h1>
                </div>
              </div>
              
              {/* Time Range Selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Time Range:</span>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="bg-gray-700 text-white text-sm rounded-lg px-3 py-1 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Key Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6 border border-blue-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Sellers</p>
                  <p className="text-3xl font-bold text-white">{stats.totalSellers}</p>
                  <p className="text-blue-200 text-xs mt-1">Active delivery partners</p>
                </div>
                <div className="p-3 bg-blue-500/30 rounded-full">
                  <MdStore className="text-2xl text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-6 border border-green-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Orders Placed</p>
                  <p className="text-3xl font-bold text-white">{stats.totalOrders}</p>
                  <p className="text-green-200 text-xs mt-1">Total orders this {timeRange}</p>
                </div>
                <div className="p-3 bg-green-500/30 rounded-full">
                  <FiBarChart2 className="text-2xl text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-lg p-6 border border-yellow-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Total Revenue</p>
                  <p className="text-3xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</p>
                  <p className="text-yellow-200 text-xs mt-1">Revenue generated</p>
                </div>
                <div className="p-3 bg-yellow-500/30 rounded-full">
                  <MdAttachMoney className="text-2xl text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-6 border border-purple-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Active Sellers</p>
                  <p className="text-3xl font-bold text-white">{stats.activeSellers}</p>
                  <p className="text-purple-200 text-xs mt-1">Currently active</p>
                </div>
                <div className="p-3 bg-purple-500/30 rounded-full">
                  <FiTrendingUp className="text-2xl text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Performance Metrics */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FiActivity className="text-blue-400" />
                  Performance Metrics
                </h3>
                <MdAssessment className="text-gray-400 text-xl" />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-gray-300">Active Sellers</span>
                  </div>
                  <span className="text-white font-semibold">{stats.activeSellers}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                    <span className="text-gray-300">Sellers with Orders</span>
                  </div>
                  <span className="text-white font-semibold">{stats.sellersWithOrders}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <span className="text-gray-300">Average Orders per Seller</span>
                  </div>
                  <span className="text-white font-semibold">{stats.averageOrdersPerSeller}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                    <span className="text-gray-300">Total Order Value</span>
                  </div>
                  <span className="text-green-400 font-semibold">{formatCurrency(stats.totalRevenue)}</span>
                </div>
              </div>
            </div>

            {/* Order Status Breakdown */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FiPieChart className="text-green-400" />
                  Order Status Breakdown
                </h3>
                <FiBarChart2 className="text-gray-400 text-xl" />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <span className="text-gray-300">Pending Orders</span>
                  </div>
                  <span className="text-yellow-400 font-semibold">{orderStatusBreakdown.PENDING}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-gray-300">Completed Orders</span>
                  </div>
                  <span className="text-green-400 font-semibold">{orderStatusBreakdown.COMPLETED}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <span className="text-gray-300">Cancelled Orders</span>
                  </div>
                  <span className="text-red-400 font-semibold">{orderStatusBreakdown.CANCELLED}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                    <span className="text-gray-300">Total Orders</span>
                  </div>
                  <span className="text-white font-semibold">{stats.totalOrders}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Performers */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FiTarget className="text-yellow-400" />
                Top Performing Sellers
              </h3>
              <MdBusinessCenter className="text-gray-400 text-xl" />
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Seller
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Performance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {topPerformers.map((seller, index) => (
                    <tr key={seller.id} className="hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {index === 0 && <span className="text-yellow-400 text-lg">🥇</span>}
                          {index === 1 && <span className="text-gray-400 text-lg">🥈</span>}
                          {index === 2 && <span className="text-orange-600 text-lg">🥉</span>}
                          {index > 2 && <span className="text-gray-500 text-sm">#{index + 1}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                              <MdStore className="text-white text-sm" />
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-white">
                              {seller.name || seller.email || 'Unknown Seller'}
                            </div>
                            <div className="text-sm text-gray-400">
                              {seller.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
                        {seller.orderCount || 0}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-green-400 font-medium">
                        {formatCurrency(seller.totalRevenue)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-700 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${Math.min((seller.orderCount / Math.max(...topPerformers.map(s => s.orderCount))) * 100, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-400">
                            {Math.round((seller.orderCount / Math.max(...topPerformers.map(s => s.orderCount))) * 100)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {topPerformers.length === 0 && (
              <div className="text-center py-8">
                <FiTarget className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-400">No performance data</h3>
                <p className="mt-1 text-sm text-gray-500">Performance metrics will appear once sellers start placing orders.</p>
              </div>
            )}
          </div>

          {/* Revenue Trend Chart */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FiTrendingUp className="text-green-400" />
                Revenue Trend ({timeRange})
              </h3>
              <FiCalendar className="text-gray-400 text-xl" />
            </div>
            
            <div className="h-64 flex items-end justify-between gap-2">
              {revenueTrend.revenue.map((value, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div className="text-xs text-gray-400 mb-2">{revenueTrend.months[index]}</div>
                  <div 
                    className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg transition-all duration-300 hover:from-green-500 hover:to-green-300"
                    style={{ height: `${(value / Math.max(...revenueTrend.revenue)) * 200}px` }}
                  ></div>
                  <div className="text-xs text-gray-300 mt-2">{formatCurrency(value)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryAnalyticsPage;
