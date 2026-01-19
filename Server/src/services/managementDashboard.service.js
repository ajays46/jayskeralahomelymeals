import prisma from '../config/prisma.js';

/**
 * Management Dashboard Service - Aggregates high-level business metrics
 * Provides comprehensive dashboard data for CEO and CFO roles
 * Features: Revenue, users, orders, delivery executives, growth metrics, system health
 */

export const getManagementDashboardSummary = async () => {
  try {
    const now = new Date();
    
    // Calculate current month start and end
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    // Calculate previous month start and end
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Get total revenue (all-time)
    const totalRevenueResult = await prisma.order.aggregate({
      _sum: {
        totalPrice: true
      }
    });
    const totalRevenue = totalRevenueResult._sum.totalPrice || 0;

    // Get current month revenue
    const currentMonthRevenueResult = await prisma.order.aggregate({
      where: {
        orderDate: {
          gte: currentMonthStart,
          lte: currentMonthEnd
        }
      },
      _sum: {
        totalPrice: true
      }
    });
    const currentMonthRevenue = currentMonthRevenueResult._sum.totalPrice || 0;

    // Get previous month revenue
    const previousMonthRevenueResult = await prisma.order.aggregate({
      where: {
        orderDate: {
          gte: previousMonthStart,
          lte: previousMonthEnd
        }
      },
      _sum: {
        totalPrice: true
      }
    });
    const previousMonthRevenue = previousMonthRevenueResult._sum.totalPrice || 0;

    // Calculate monthly growth percentage
    let monthlyGrowth = 0;
    if (previousMonthRevenue > 0) {
      monthlyGrowth = ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;
    } else if (currentMonthRevenue > 0) {
      monthlyGrowth = 100; // 100% growth if no previous month data
    }

    // Get total users count (all users with auth records)
    const totalUsers = await prisma.user.count({
      where: {
        auth: {
          isNot: null
        }
      }
    });

    // Get total orders count
    const totalOrders = await prisma.order.count();

    // Get pending orders count
    const pendingOrders = await prisma.order.count({
      where: {
        status: 'Pending'
      }
    });

    // Get completed orders count (Delivered status)
    const completedOrders = await prisma.order.count({
      where: {
        status: 'Delivered'
      }
    });

    // Get active delivery executives count
    const activeDeliveryExecutives = await prisma.deliveryExecutive.count({
      where: {
        user: {
          status: 'ACTIVE'
        }
      }
    });

    // System health check (simple check - can be enhanced)
    // Check if database is responsive and recent orders exist
    const recentOrdersCheck = await prisma.order.count({
      where: {
        createdAt: {
          gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    let systemHealth = 'Good';
    if (recentOrdersCheck === 0 && totalOrders > 0) {
      // No orders in last 24 hours but orders exist - might indicate an issue
      systemHealth = 'Warning';
    } else if (totalOrders === 0 && totalUsers === 0) {
      // No data at all - system might be new or having issues
      systemHealth = 'Warning';
    }

    return {
      totalRevenue,
      totalUsers,
      totalOrders,
      activeDeliveryExecutives,
      pendingOrders,
      completedOrders,
      monthlyGrowth: Math.round(monthlyGrowth * 10) / 10, // Round to 1 decimal place
      systemHealth,
      currentMonthRevenue,
      previousMonthRevenue
    };
  } catch (error) {
    console.error('Error in getManagementDashboardSummary:', error);
    throw error;
  }
};
