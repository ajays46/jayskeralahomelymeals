import prisma from '../config/prisma.js';
import AppError from '../utils/AppError.js';

/**
 * Delivery Dashboard Service - Comprehensive delivery analytics and performance metrics
 * Provides detailed insights into delivery operations, executive performance, and delivery analytics
 * Features: Executive performance, delivery time analysis, failure tracking, location analytics
 */

// Get comprehensive delivery dashboard summary
export const getDeliveryDashboardSummary = async (period = 'all') => {
  try {
    const now = new Date();
    let startDate, endDate;

    // Calculate date range based on period
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'yesterday':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
        break;
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart, 1);
        endDate = now;
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = now;
        break;
      case 'all':
        startDate = new Date('2020-01-01'); // Far back date
        endDate = now;
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
    }

    // Get delivery executives count and status
    const totalExecutives = await prisma.deliveryExecutive.count();
    const activeExecutives = await prisma.deliveryExecutive.count({
      where: {
        user: {
          status: 'ACTIVE'
        }
      }
    });

    // Get delivery items statistics
    const totalDeliveryItems = await prisma.deliveryItem.count({
      where: {
        deliveryDate: {
          gte: startDate,
          lt: endDate
        }
      }
    });

    const deliveredItems = await prisma.deliveryItem.count({
      where: {
        deliveryDate: {
          gte: startDate,
          lt: endDate
        },
        status: 'Delivered'
      }
    });

    const pendingItems = await prisma.deliveryItem.count({
      where: {
        deliveryDate: {
          gte: startDate,
          lt: endDate
        },
        status: 'Pending'
      }
    });

    const confirmedItems = await prisma.deliveryItem.count({
      where: {
        deliveryDate: {
          gte: startDate,
          lt: endDate
        },
        status: 'Confirmed'
      }
    });

    const cancelledItems = await prisma.deliveryItem.count({
      where: {
        deliveryDate: {
          gte: startDate,
          lt: endDate
        },
        status: 'Cancelled'
      }
    });

    // Calculate delivery success rate
    const deliverySuccessRate = totalDeliveryItems > 0 
      ? (deliveredItems / totalDeliveryItems) * 100 
      : 0;

    // Get delivery time slot breakdown
    const timeSlotBreakdown = await prisma.deliveryItem.groupBy({
      by: ['deliveryTimeSlot'],
      where: {
        deliveryDate: {
          gte: startDate,
          lt: endDate
        }
      },
      _count: {
        id: true
      }
    });

    // Get delivery status breakdown
    const statusBreakdown = await prisma.deliveryItem.groupBy({
      by: ['status'],
      where: {
        deliveryDate: {
          gte: startDate,
          lt: endDate
        }
      },
      _count: {
        id: true
      }
    });

    // Get average delivery time (mock calculation - you might want to implement actual delivery time tracking)
    const averageDeliveryTime = 45; // minutes - this would be calculated from actual delivery timestamps

    // Get top performing locations
    const topLocations = await prisma.deliveryItem.groupBy({
      by: ['addressId'],
      where: {
        deliveryDate: {
          gte: startDate,
          lt: endDate
        },
        status: 'Delivered'
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });

    // Get location details for top locations
    const locationDetails = await Promise.all(
      topLocations.map(async (location) => {
        const address = await prisma.address.findUnique({
          where: { id: location.addressId },
          select: {
            city: true,
            pincode: true,
            street: true,
            housename: true
          }
        });
        return {
          addressId: location.addressId,
          deliveryCount: location._count.id,
          city: address?.city || 'Unknown',
          pincode: address?.pincode || 0,
          fullAddress: address ? `${address.housename}, ${address.street}, ${address.city}` : 'Unknown'
        };
      })
    );

    return {
      success: true,
      data: {
        // Executive metrics
        totalExecutives,
        activeExecutives,
        inactiveExecutives: totalExecutives - activeExecutives,
        
        // Delivery metrics
        totalDeliveryItems,
        deliveredItems,
        pendingItems,
        confirmedItems,
        cancelledItems,
        deliverySuccessRate: Math.round(deliverySuccessRate * 100) / 100,
        
        // Performance metrics
        averageDeliveryTime,
        
        // Breakdowns
        timeSlotBreakdown: timeSlotBreakdown.map(item => ({
          timeSlot: item.deliveryTimeSlot,
          count: item._count.id
        })),
        
        statusBreakdown: statusBreakdown.map(item => ({
          status: item.status,
          count: item._count.id
        })),
        
        // Location analytics
        topLocations: locationDetails,
        
        // Period info
        period,
        startDate,
        endDate
      }
    };
  } catch (error) {
    console.error('Error in getDeliveryDashboardSummary:', error);
    throw new AppError('Failed to get delivery dashboard summary: ' + error.message, 500);
  }
};

// Get delivery executives performance details
export const getDeliveryExecutivesPerformance = async (period = 'all') => {
  try {
    const now = new Date();
    let startDate, endDate;

    // Calculate date range based on period
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
    }

    // Get all delivery executives with their performance data from User table with DELIVERY_EXECUTIVE role
    const executives = await prisma.user.findMany({
      include: {
        auth: {
          select: {
            email: true,
            phoneNumber: true
          }
        },
        userRoles: true,
        deliveryExecutive: true
      },
      where: {
        userRoles: {
          some: {
            name: 'DELIVERY_EXECUTIVE'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });


    // Return only real executive data without performance metrics
    // Since there's no executive assignment tracking in DeliveryItem table,
    // we can't show individual performance data
    const executivesWithRealData = executives.map((executive, index) => {
      return {
        id: executive.id,
        userId: executive.id,
        name: executive.auth?.email?.split('@')[0]?.replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || `Executive ${index + 1}`,
        email: executive.auth?.email || 'No email',
        phoneNumber: executive.auth?.phoneNumber || 'No phone',
        status: executive.status,
        currentLocation: executive.deliveryExecutive?.location || 'Kochi, Kerala',
        // No performance data since there's no executive assignment tracking
        totalDeliveries: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
        successRate: 0,
        averageDeliveryTime: 0
      };
    });

    return {
      success: true,
      data: {
        executives: executivesWithRealData,
        totalExecutives: executivesWithRealData.length,
        activeExecutives: executivesWithRealData.filter(e => e.status === 'ACTIVE').length,
        period,
        startDate,
        endDate
      }
    };
  } catch (error) {
    console.error('Error in getDeliveryExecutivesPerformance:', error);
    throw new AppError('Failed to get delivery executives performance: ' + error.message, 500);
  }
};

// Get delivery time variations and analytics
export const getDeliveryTimeAnalytics = async (period = 'all') => {
  try {
    const now = new Date();
    let startDate, endDate;

    // Calculate date range based on period
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
    }

    // Get delivery items with time slot analysis
    const deliveryItems = await prisma.deliveryItem.findMany({
      where: {
        deliveryDate: {
          gte: startDate,
          lt: endDate
        },
        deliveryAddress: {
          NOT: null
        }
      },
      include: {
        deliveryAddress: {
          select: {
            city: true,
            pincode: true,
            geoLocation: true
          }
        }
      },
      orderBy: [
        { deliveryDate: 'asc' }
      ]
    });

    // Analyze delivery time variations by time slot
    const timeSlotAnalysis = {
      Breakfast: { total: 0, delivered: 0, pending: 0, cancelled: 0, avgTime: 0 },
      Lunch: { total: 0, delivered: 0, pending: 0, cancelled: 0, avgTime: 0 },
      Dinner: { total: 0, delivered: 0, pending: 0, cancelled: 0, avgTime: 0 }
    };

    deliveryItems.forEach(item => {
      const timeSlot = item.deliveryTimeSlot;
      if (timeSlotAnalysis[timeSlot]) {
        timeSlotAnalysis[timeSlot].total++;
        timeSlotAnalysis[timeSlot][item.status.toLowerCase()]++;
        // Mock average time calculation
        timeSlotAnalysis[timeSlot].avgTime = 45;
      }
    });

    // Analyze delivery patterns by hour (mock data)
    const hourlyPatterns = Array.from({ length: 24 }, (_, hour) => ({
      hour: hour,
      deliveryCount: Math.floor(Math.random() * 20),
      avgDeliveryTime: 30 + Math.floor(Math.random() * 30)
    }));

    // Get delivery success rate by location
    const locationSuccessRates = await prisma.deliveryItem.groupBy({
      by: ['addressId'],
      where: {
        deliveryDate: {
          gte: startDate,
          lt: endDate
        }
      },
      _count: {
        id: true
      },
      _avg: {
        // Add actual delivery time field when available
      }
    });

    // Get location details for success rates
    const locationDetails = await Promise.all(
      locationSuccessRates.map(async (location) => {
        const address = await prisma.address.findUnique({
          where: { id: location.addressId },
          select: {
            city: true,
            pincode: true,
            street: true,
            housename: true
          }
        });

        const deliveredCount = await prisma.deliveryItem.count({
          where: {
            addressId: location.addressId,
            deliveryDate: {
              gte: startDate,
              lt: endDate
            },
            status: 'Delivered'
          }
        });

        const successRate = location._count.id > 0 
          ? (deliveredCount / location._count.id) * 100 
          : 0;

        return {
          addressId: location.addressId,
          city: address?.city || 'Unknown',
          pincode: address?.pincode || 0,
          fullAddress: address ? `${address.housename}, ${address.street}, ${address.city}` : 'Unknown',
          totalDeliveries: location._count.id,
          successfulDeliveries: deliveredCount,
          successRate: Math.round(successRate * 100) / 100,
          avgDeliveryTime: 45 // Mock data
        };
      })
    );

    // Sort by success rate
    locationDetails.sort((a, b) => b.successRate - a.successRate);

    return {
      success: true,
      data: {
        timeSlotAnalysis,
        hourlyPatterns,
        locationSuccessRates: locationDetails,
        totalDeliveries: deliveryItems.length,
        period,
        startDate,
        endDate
      }
    };
  } catch (error) {
    console.error('Error in getDeliveryTimeAnalytics:', error);
    throw new AppError('Failed to get delivery time analytics: ' + error.message, 500);
  }
};

// Get delivery failure analysis
export const getDeliveryFailureAnalysis = async (period = 'all') => {
  try {
    const now = new Date();
    let startDate, endDate;

    // Calculate date range based on period
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
    }

    // Get failed deliveries
    const failedDeliveries = await prisma.deliveryItem.findMany({
      where: {
        deliveryDate: {
          gte: startDate,
          lt: endDate
        },
        status: 'Cancelled',
        deliveryAddress: {
          NOT: null
        }
      },
      include: {
        deliveryAddress: {
          select: {
            city: true,
            pincode: true,
            street: true,
            housename: true
          }
        },
        order: {
          select: {
            id: true,
            orderDate: true,
            totalPrice: true
          }
        }
      },
      orderBy: [
        { updatedAt: 'desc' }
      ]
    });

    // Analyze failure patterns by time slot
    const failureByTimeSlot = await prisma.deliveryItem.groupBy({
      by: ['deliveryTimeSlot'],
      where: {
        deliveryDate: {
          gte: startDate,
          lt: endDate
        },
        status: 'Cancelled'
      },
      _count: {
        id: true
      }
    });

    // Analyze failure patterns by location
    const failureByLocation = await prisma.deliveryItem.groupBy({
      by: ['addressId'],
      where: {
        deliveryDate: {
          gte: startDate,
          lt: endDate
        },
        status: 'Cancelled'
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });

    // Get location details for failure analysis
    const failureLocationDetails = await Promise.all(
      failureByLocation.map(async (location) => {
        const address = await prisma.address.findUnique({
          where: { id: location.addressId },
          select: {
            city: true,
            pincode: true,
            street: true,
            housename: true
          }
        });

        return {
          addressId: location.addressId,
          city: address?.city || 'Unknown',
          pincode: address?.pincode || 0,
          fullAddress: address ? `${address.housename}, ${address.street}, ${address.city}` : 'Unknown',
          failureCount: location._count.id
        };
      })
    );

    // Calculate failure rate
    const totalDeliveries = await prisma.deliveryItem.count({
      where: {
        deliveryDate: {
          gte: startDate,
          lt: endDate
        }
      }
    });

    const failureRate = totalDeliveries > 0 
      ? (failedDeliveries.length / totalDeliveries) * 100 
      : 0;

    return {
      success: true,
      data: {
        totalFailures: failedDeliveries.length,
        failureRate: Math.round(failureRate * 100) / 100,
        failureByTimeSlot: failureByTimeSlot.map(item => ({
          timeSlot: item.deliveryTimeSlot,
          failureCount: item._count.id
        })),
        failureByLocation: failureLocationDetails,
        recentFailures: failedDeliveries.slice(0, 10).map(item => ({
          id: item.id,
          deliveryDate: item.deliveryDate,
          deliveryTimeSlot: item.deliveryTimeSlot,
          status: item.status,
          address: item.deliveryAddress ? 
            `${item.deliveryAddress.housename}, ${item.deliveryAddress.street}, ${item.deliveryAddress.city}` : 
            'Unknown',
          orderId: item.order?.id,
          orderDate: item.order?.orderDate,
          orderValue: item.order?.totalPrice
        })),
        period,
        startDate,
        endDate
      }
    };
  } catch (error) {
    console.error('Error in getDeliveryFailureAnalysis:', error);
    throw new AppError('Failed to get delivery failure analysis: ' + error.message, 500);
  }
};

// Get real-time delivery status
export const getRealTimeDeliveryStatus = async () => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    // Get today's deliveries
    const todaysDeliveries = await prisma.deliveryItem.findMany({
      where: {
        deliveryDate: {
          gte: today,
          lt: tomorrow
        },
        deliveryAddress: {
          NOT: null
        }
      },
      include: {
        deliveryAddress: {
          select: {
            city: true,
            pincode: true,
            street: true,
            housename: true
          }
        },
        order: {
          select: {
            id: true,
            totalPrice: true
          }
        }
      },
      orderBy: [
        { deliveryTimeSlot: 'asc' },
        { deliveryDate: 'asc' }
      ]
    });

    // Group by status
    const statusGroups = {
      Pending: [],
      Confirmed: [],
      Delivered: [],
      Cancelled: []
    };

    todaysDeliveries.forEach(delivery => {
      if (statusGroups[delivery.status]) {
        statusGroups[delivery.status].push(delivery);
      }
    });

    // Calculate real-time metrics
    const totalDeliveries = todaysDeliveries.length;
    const completedDeliveries = statusGroups.Delivered.length;
    const inProgressDeliveries = statusGroups.Pending.length + statusGroups.Confirmed.length;
    const failedDeliveries = statusGroups.Cancelled.length;

    const completionRate = totalDeliveries > 0 
      ? (completedDeliveries / totalDeliveries) * 100 
      : 0;

    return {
      success: true,
      data: {
        totalDeliveries,
        completedDeliveries,
        inProgressDeliveries,
        failedDeliveries,
        completionRate: Math.round(completionRate * 100) / 100,
        statusGroups,
        lastUpdated: now,
        currentTime: now
      }
    };
  } catch (error) {
    console.error('Error in getRealTimeDeliveryStatus:', error);
    throw new AppError('Failed to get real-time delivery status: ' + error.message, 500);
  }
};
