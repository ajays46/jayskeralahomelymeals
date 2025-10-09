import prisma from '../config/prisma.js';

/**
 * Financial Service - Handles financial data queries and calculations
 * Provides daily revenue analytics, order status breakdown, and payment metrics
 * Features: Revenue calculations, order analytics, payment tracking, financial reporting
 */

// Get daily revenue data (today, yesterday, this week)
export const getDailyRevenueService = async () => {
  try {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Get start of current week (Monday)
    const startOfWeek = new Date(today);
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, Monday = 1
    startOfWeek.setDate(today.getDate() - daysToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    // Format dates for database queries - create proper Date objects
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const yesterdayEnd = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1);
    
    const startOfWeekDate = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate());


    // Get today's revenue
    const todayRevenue = await prisma.order.aggregate({
      where: {
        orderDate: {
          gte: todayStart,
          lt: todayEnd
        }
      },
      _sum: {
        totalPrice: true
      }
    });

    // Get yesterday's revenue
    const yesterdayRevenue = await prisma.order.aggregate({
      where: {
        orderDate: {
          gte: yesterdayStart,
          lt: yesterdayEnd
        }
      },
      _sum: {
        totalPrice: true
      }
    });

    // Get this week's revenue
    const weekRevenue = await prisma.order.aggregate({
      where: {
        orderDate: {
          gte: startOfWeekDate
        }
      },
      _sum: {
        totalPrice: true
      }
    });

    return {
      todayRevenue: todayRevenue._sum.totalPrice || 0,
      yesterdayRevenue: yesterdayRevenue._sum.totalPrice || 0,
      weekRevenue: weekRevenue._sum.totalPrice || 0
    };
  } catch (error) {
    console.error('Error in getDailyRevenueService:', error);
    throw error;
  }
};

// Get order status breakdown for a specific period
export const getOrderStatusBreakdownService = async (period = 'today') => {
  try {
    const today = new Date();
    let startDate, endDate;

    // Set date range based on period
    switch (period) {
      case 'today':
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        break;
      case 'yesterday':
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        break;
      case 'week':
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear() + 1, 0, 1);
        break;
      case 'all':
        startDate = new Date(2020, 0, 1); // Start from a very early date
        endDate = new Date(today.getFullYear() + 1, 0, 1);
        break;
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    }

    // Get order status breakdown for the selected period
    const orderStatusData = await prisma.order.groupBy({
      by: ['status'],
      where: {
        orderDate: {
          gte: startDate,
          lt: endDate
        }
      },
      _sum: {
        totalPrice: true
      },
      _count: {
        id: true
      }
    });

    // Initialize all statuses with 0 values
    const statusBreakdown = {
      pendingRevenue: 0,
      confirmedRevenue: 0,
      deliveredRevenue: 0,
      cancelledRevenue: 0,
      pendingCount: 0,
      confirmedCount: 0,
      deliveredCount: 0,
      cancelledCount: 0
    };

    // Map the grouped data to our structure
    orderStatusData.forEach(item => {
      const revenue = item._sum.totalPrice || 0;
      const count = item._count.id || 0;

      switch (item.status) {
        case 'Pending':
          statusBreakdown.pendingRevenue = revenue;
          statusBreakdown.pendingCount = count;
          break;
        case 'Confirmed':
          statusBreakdown.confirmedRevenue = revenue;
          statusBreakdown.confirmedCount = count;
          break;
        case 'Delivered':
          statusBreakdown.deliveredRevenue = revenue;
          statusBreakdown.deliveredCount = count;
          break;
        case 'Cancelled':
          statusBreakdown.cancelledRevenue = revenue;
          statusBreakdown.cancelledCount = count;
          break;
        case 'Payment_Confirmed':
          // Treat Payment_Confirmed as Delivered for revenue purposes
          statusBreakdown.deliveredRevenue += revenue;
          statusBreakdown.deliveredCount += count;
          break;
      }
    });

    return statusBreakdown;
  } catch (error) {
    console.error('Error in getOrderStatusBreakdownService:', error);
    throw error;
  }
};

// Get payment confirmation rate
export const getPaymentConfirmationRateService = async () => {
  try {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Get total orders for today
    const totalOrders = await prisma.order.count({
      where: {
        orderDate: {
          gte: todayStart,
          lt: todayEnd
        }
      }
    });

    // Get confirmed payments for today
    const confirmedPayments = await prisma.payment.count({
      where: {
        paymentStatus: 'Confirmed',
        paymentDate: {
          gte: todayStart,
          lt: todayEnd
        }
      }
    });

    const paymentConfirmationRate = totalOrders > 0 ? (confirmedPayments / totalOrders) * 100 : 0;

    return {
      paymentConfirmationRate: Math.round(paymentConfirmationRate * 10) / 10, // Round to 1 decimal
      totalOrders,
      confirmedPayments
    };
  } catch (error) {
    console.error('Error in getPaymentConfirmationRateService:', error);
    throw error;
  }
};

// Get delivery time revenue breakdown for a specific period
export const getDeliveryTimeRevenueService = async (period = 'week') => {
  try {
    const today = new Date();
    let startDate, endDate;

    // Set date range based on period
    switch (period) {
      case 'today':
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        break;
      case 'yesterday':
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        break;
      case 'week':
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear() + 1, 0, 1);
        break;
      case 'all':
        startDate = new Date(2020, 0, 1); // Start from a very early date
        endDate = new Date(today.getFullYear() + 1, 0, 1);
        break;
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    }

    // Get all orders for the selected period with delivery items
    const periodOrders = await prisma.order.findMany({
      where: {
        orderDate: {
          gte: startDate,
          lt: endDate
        }
      },
      include: {
        deliveryItems: {
          select: {
            deliveryTimeSlot: true,
            quantity: true
          }
        }
      }
    });


    // Calculate revenue for each time slot
    let breakfastRevenue = 0;
    let lunchRevenue = 0;
    let dinnerRevenue = 0;
    let breakfastCount = 0;
    let lunchCount = 0;
    let dinnerCount = 0;

    // Process each order (from selected period)
    periodOrders.forEach(order => {
      const totalItemsInOrder = order.deliveryItems.reduce((sum, item) => sum + item.quantity, 0);
    
      if (totalItemsInOrder > 0) {
        // Group delivery items by time slot for this order
        const breakfastItems = order.deliveryItems
          .filter(item => item.deliveryTimeSlot === 'Breakfast')
          .reduce((sum, item) => sum + item.quantity, 0);
        
        const lunchItems = order.deliveryItems
          .filter(item => item.deliveryTimeSlot === 'Lunch')
          .reduce((sum, item) => sum + item.quantity, 0);
        
        const dinnerItems = order.deliveryItems
          .filter(item => item.deliveryTimeSlot === 'Dinner')
          .reduce((sum, item) => sum + item.quantity, 0);

        // Calculate proportional revenue
        breakfastRevenue += order.totalPrice * (breakfastItems / totalItemsInOrder);
        lunchRevenue += order.totalPrice * (lunchItems / totalItemsInOrder);
        dinnerRevenue += order.totalPrice * (dinnerItems / totalItemsInOrder);

        // Count items
        breakfastCount += breakfastItems;
        lunchCount += lunchItems;
        dinnerCount += dinnerItems;
      }
    });

    return {
      breakfastRevenue: Math.round(breakfastRevenue),
      lunchRevenue: Math.round(lunchRevenue),
      dinnerRevenue: Math.round(dinnerRevenue),
      breakfastCount,
      lunchCount,
      dinnerCount
    };
  } catch (error) {
    console.error('Error in getDeliveryTimeRevenueService:', error);
    throw new Error(`Error calculating delivery time revenue: ${error.message}`);
  }
};

// Get location-based revenue breakdown
export const getLocationRevenueService = async () => {
  try {
    // Get ALL orders with their delivery addresses (no date filter)
    const allOrdersWithAddresses = await prisma.order.findMany({
      where: {
        deliveryAddress: {
          isNot: null
        }
      },
      include: {
        deliveryAddress: {
          select: {
            city: true,
            street: true,
            housename: true,
            geoLocation: true,
            pincode: true
          }
        },
        deliveryItems: {
          select: {
            quantity: true
          }
        }
      }
    });


    // Group revenue by location (city + pincode combination)
    const locationRevenue = {};
    const locationOrderCount = {};

    allOrdersWithAddresses.forEach(order => {
      if (order.deliveryAddress) {
        const address = order.deliveryAddress;
        const locationKey = `${address.city || 'Unknown'}_${address.pincode || '000000'}`;
        const locationName = `${address.city || 'Unknown City'}`;
        const fullAddress = `${address.housename || ''}, ${address.street || ''}`.trim().replace(/^,\s*|,\s*$/g, '') || 'Unknown Address';

        if (!locationRevenue[locationKey]) {
          locationRevenue[locationKey] = {
            locationName,
            fullAddress,
            city: address.city || 'Unknown',
            pincode: address.pincode || '000000',
            revenue: 0,
            orderCount: 0,
            totalItems: 0
          };
          locationOrderCount[locationKey] = 0;
        }

        locationRevenue[locationKey].revenue += order.totalPrice;
        locationRevenue[locationKey].orderCount += 1;
        locationOrderCount[locationKey] += 1;
        
        // Calculate total delivery items for this location
        const totalItems = order.deliveryItems.reduce((sum, item) => sum + item.quantity, 0);
        locationRevenue[locationKey].totalItems += totalItems;
      }
    });

    // Convert to array and sort by revenue (descending)
    const sortedLocationRevenue = Object.values(locationRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10); // Top 10 locations

    return {
      locationRevenue: sortedLocationRevenue,
      totalUniqueLocations: Object.keys(locationRevenue).length,
      totalLocationRevenue: sortedLocationRevenue.reduce((sum, loc) => sum + loc.revenue, 0)
    };
  } catch (error) {
    console.error('Error in getLocationRevenueService:', error);
    throw error;
  }
};

// Get revenue data for past days
export const getPastDaysRevenueService = async () => {
  try {
    const results = [];
    const today = new Date();
    
    // Get revenue for past 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      
      const dayRevenue = await prisma.order.aggregate({
        where: {
          orderDate: {
            gte: dayStart,
            lt: dayEnd
          }
        },
        _sum: {
          totalPrice: true
        },
        _count: {
          id: true
        }
      });
      
      results.push({
        date: dayStart.toISOString().split('T')[0],
        revenue: dayRevenue._sum.totalPrice || 0,
        orderCount: dayRevenue._count.id || 0,
        dayName: dayStart.toLocaleDateString('en-US', { weekday: 'short' })
      });
    }
    
    return results;
  } catch (error) {
    console.error('Error in getPastDaysRevenueService:', error);
    throw error;
  }
};

// Get comprehensive financial summary
export const getFinancialSummaryService = async (period = 'week') => {
  try {
    // Get daily revenue data
    const dailyRevenue = await getDailyRevenueService();
    
    // Get order status breakdown for the specified period
    const orderStatusBreakdown = await getOrderStatusBreakdownService(period);
    
    // Get payment confirmation rate
    const paymentRate = await getPaymentConfirmationRateService();
    
    // Get delivery time revenue breakdown for the specified period
    const deliveryTimeRevenue = await getDeliveryTimeRevenueService(period);
    
    // Get past days revenue data
    const pastDaysRevenue = await getPastDaysRevenueService();
    
    // Get location-based revenue data
    const locationRevenue = await getLocationRevenueService();

    // Get overall financial metrics
    const totalRevenue = await prisma.order.aggregate({
      _sum: {
        totalPrice: true
      }
    });

    const monthlyRevenue = await prisma.order.aggregate({
      where: {
        orderDate: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      },
      _sum: {
        totalPrice: true
      }
    });

    const totalOrders = await prisma.order.count();
    const averageOrderValue = totalOrders > 0 ? (totalRevenue._sum.totalPrice || 0) / totalOrders : 0;

    return {
      ...dailyRevenue,
      ...orderStatusBreakdown,
      ...paymentRate,
      ...deliveryTimeRevenue,
      pastDaysRevenue,
      ...locationRevenue,
      totalRevenue: totalRevenue._sum.totalPrice || 0,
      monthlyRevenue: monthlyRevenue._sum.totalPrice || 0,
      totalOrders,
      averageOrderValue: Math.round(averageOrderValue),
      // Mock data for fields not yet implemented
      netProfit: (totalRevenue._sum.totalPrice || 0) * 0.8, // 80% profit margin
      operatingExpenses: (totalRevenue._sum.totalPrice || 0) * 0.15, // 15% operating expenses
      taxes: (totalRevenue._sum.totalPrice || 0) * 0.05, // 5% taxes
      revenueGrowth: 15.5, // Mock growth percentage
      profitMargin: 80, // Mock profit margin
      refunds: 15000, // Mock refunds
      pendingPayments: 25000 // Mock pending payments
    };
  } catch (error) {
    console.error('Error in getFinancialSummaryService:', error);
    throw error;
  }
};
