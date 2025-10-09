import prisma from '../config/prisma.js';
import AppError from '../utils/AppError.js';

/**
 * Seller Performance Dashboard Service
 * Provides comprehensive seller analytics and performance metrics
 */

// Get seller performance summary
export const getSellerPerformanceSummary = async (period = 'all') => {
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

    // Get all sellers with SELLER role
    const sellers = await prisma.user.findMany({
      include: {
        auth: {
          select: {
            email: true,
            phoneNumber: true
          }
        },
        userRoles: true,
        company: true
      },
      where: {
        userRoles: {
          some: {
            name: 'SELLER'
          }
        },
        companyId: {
          not: null
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Check if there are any customers created by sellers
    const customersCreatedBySellers = await prisma.user.count({
      where: {
        createdBy: {
          in: sellers.map(s => s.id).filter(Boolean)
        }
      }
    });

    // Let's also check all users with createdBy field
    const allUsersWithCreatedBy = await prisma.user.findMany({
      where: {
        createdBy: {
          not: null
        }
      },
      select: {
        id: true,
        createdBy: true,
        auth: {
          select: {
            email: true
          }
        }
      }
    });

    // Let's also check what orders exist
    const allOrders = await prisma.order.count();

    // Check orders from customers created by sellers
    const ordersFromCreatedCustomers = await prisma.order.findMany({
      where: {
        user: {
          createdBy: {
            in: sellers.map(s => s.id).filter(Boolean)
          }
        }
      },
      select: {
        id: true,
        userId: true,
        status: true,
        totalPrice: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            createdBy: true,
            auth: {
              select: {
                email: true
              }
            }
          }
        }
      },
      take: 5 // Just get first 5 for debugging
    });

    // If no customers are created by sellers, try alternative approach
    if (customersCreatedBySellers === 0) {
      
      // Alternative approach: Calculate based on company relationship
      // Get all customers that belong to the same companies as sellers
      const sellerCompanyIds = sellers.map(s => s.companyId).filter(Boolean);
        
      if (sellerCompanyIds.length === 0) {
        return {
          success: true,
          data: {
            totalSellers: sellers.length,
            activeSellers: sellers.filter(s => s.status === 'ACTIVE').length,
            totalOrders: 0,
            totalRevenue: 0,
            totalCustomers: 0,
            averageOrderValue: 0,
            period,
            startDate,
            endDate
          }
        };
      }

      // Get customers from same companies as sellers
      const customersFromSellerCompanies = await prisma.user.count({
        where: {
          companyId: {
            in: sellerCompanyIds
          },
          userRoles: {
            some: {
              name: 'USER'
            }
          }
        }
      });

      // Get orders from customers in seller companies
      const totalOrders = await prisma.order.count({
        where: {
          createdAt: {
            gte: startDate,
            lt: endDate
          },
          user: {
            companyId: {
              in: sellerCompanyIds
            },
            userRoles: {
              some: {
                name: 'USER'
              }
            }
          }
        }
      });

      // Get revenue from orders in seller companies
      const ordersWithRevenue = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lt: endDate
          },
          user: {
            companyId: {
              in: sellerCompanyIds
            },
            userRoles: {
              some: {
                name: 'USER'
              }
            }
          },
          status: {
            in: ['Delivered', 'Confirmed']
          }
        },
        include: {
          deliveryItems: {
            include: {
              menuItem: {
                include: {
                  prices: true
                }
              }
            }
          }
        }
      });

      const totalRevenue = ordersWithRevenue.reduce((sum, order) => {
        const orderRevenue = order.deliveryItems.reduce((orderSum, item) => {
          const price = item.menuItem.prices[0]?.totalPrice || 0;
          return orderSum + (price * item.quantity);
        }, 0);
        return sum + orderRevenue;
      }, 0);

      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      return {
        success: true,
        data: {
          totalSellers: sellers.length,
          activeSellers: sellers.filter(s => s.status === 'ACTIVE').length,
          totalOrders,
          totalRevenue,
          totalCustomers: customersFromSellerCompanies,
          averageOrderValue,
          period,
          startDate,
          endDate
        }
      };
    }

    // If we reach here, there are customers with createdBy field
    // Continue with the original logic
    const totalOrders = await prisma.order.count({
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate
        },
        user: {
          createdBy: {
            in: sellers.map(s => s.id).filter(Boolean)
          }
        }
      }
    });

    // Get total unique customers created by all sellers
    const totalUniqueCustomers = await prisma.user.count({
      where: {
        createdBy: {
          in: sellers.map(s => s.id).filter(Boolean)
        }
      }
    });

    // Get total revenue from orders of customers created by sellers
    const ordersWithRevenue = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate
        },
        user: {
          createdBy: {
            in: sellers.map(s => s.id).filter(Boolean)
          }
        },
        status: {
          in: ['Delivered', 'Confirmed']
        }
      },
      include: {
        deliveryItems: {
          include: {
            menuItem: {
              include: {
                prices: true
              }
            }
          }
        }
      }
    });

    const totalRevenue = ordersWithRevenue.reduce((sum, order) => {
      const orderRevenue = order.deliveryItems.reduce((orderSum, item) => {
        const price = item.menuItem.prices[0]?.totalPrice || 0;
        return orderSum + (price * item.quantity);
      }, 0);
      return sum + orderRevenue;
    }, 0);

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      success: true,
      data: {
        totalSellers: sellers.length,
        activeSellers: sellers.filter(s => s.status === 'ACTIVE').length,
        totalOrders,
        totalRevenue,
        totalCustomers: totalUniqueCustomers,
        averageOrderValue,
        period,
        startDate,
        endDate
      }
    };
  } catch (error) {
    console.error('Error in getSellerPerformanceSummary:', error);
    throw new AppError('Failed to get seller performance summary: ' + error.message, 500);
  }
};

// Get detailed seller performance data
export const getSellerPerformanceDetails = async (period = 'all') => {
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

    // Get all sellers with SELLER role
    const sellers = await prisma.user.findMany({
      include: {
        auth: {
          select: {
            email: true,
            phoneNumber: true
          }
        },
        userRoles: true,
        company: true
      },
      where: {
        userRoles: {
          some: {
            name: 'SELLER'
          }
        },
        companyId: {
          not: null
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get performance data for each seller (only those with valid companyId)
        const sellersWithPerformance = await Promise.all(
          sellers.map(async (seller) => {
            // Get order statistics for this seller (orders from customers created by this seller)
            const sellerOrders = await prisma.order.count({
              where: {
                createdAt: {
                  gte: startDate,
                  lt: endDate
                },
                user: {
                  createdBy: seller.id
                }
              }
            });

            // Get total revenue from orders of customers created by this seller
            const ordersWithRevenue = await prisma.order.findMany({
              where: {
                createdAt: {
                  gte: startDate,
                  lt: endDate
                },
                user: {
                  createdBy: seller.id
                },
                status: {
                  in: ['Delivered', 'Confirmed']
                }
              },
              include: {
                deliveryItems: {
                  include: {
                    menuItem: {
                      include: {
                        prices: true
                      }
                    }
                  }
                }
              }
            });

            // Calculate total revenue from orders
            const totalRevenue = ordersWithRevenue.reduce((sum, order) => {
              const orderRevenue = order.deliveryItems.reduce((orderSum, item) => {
                const price = item.menuItem.prices[0]?.totalPrice || 0;
                return orderSum + (price * item.quantity);
              }, 0);
              return sum + orderRevenue;
            }, 0);

            // Get customer count (customers created by this seller)
            const customerCount = await prisma.user.count({
              where: {
                createdBy: seller.id
              }
            });

        // Mock rating - replace with actual rating system
        const averageRating = 4.0 + Math.random() * 1.0; // 4.0 to 5.0

        return {
          id: seller.id,
          name: seller.auth?.email?.split('@')[0]?.replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || seller.company?.name || 'Unknown Seller',
          email: seller.auth?.email || 'No email',
          phoneNumber: seller.auth?.phoneNumber || 'No phone',
          status: seller.status,
          totalOrders: sellerOrders,
          totalRevenue: totalRevenue,
          customerCount: customerCount,
          averageRating: Math.round(averageRating * 10) / 10,
          joinDate: seller.createdAt,
          lastActive: seller.updatedAt
        };
      })
    );

    // Sort by performance (revenue)
    sellersWithPerformance.sort((a, b) => b.totalRevenue - a.totalRevenue);

    return {
      success: true,
      data: {
        sellers: sellersWithPerformance,
        totalSellers: sellersWithPerformance.length,
        activeSellers: sellersWithPerformance.filter(s => s.status === 'ACTIVE').length,
        period,
        startDate,
        endDate
      }
    };
  } catch (error) {
    console.error('Error in getSellerPerformanceDetails:', error);
    throw new AppError('Failed to get seller performance details: ' + error.message, 500);
  }
};

// Get top performing sellers
export const getTopPerformingSellers = async (period = 'all', limit = 5) => {
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

    // Get all sellers with SELLER role
    const sellers = await prisma.user.findMany({
      include: {
        auth: {
          select: {
            email: true,
            phoneNumber: true
          }
        },
        userRoles: true,
        company: true
      },
      where: {
        userRoles: {
          some: {
            name: 'SELLER'
          }
        },
        companyId: {
          not: null
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get performance data for each seller
    const sellersWithPerformance = await Promise.all(
      sellers.map(async (seller) => {
        // Get order statistics for this seller (orders from customers created by this seller)
        const sellerOrders = await prisma.order.count({
          where: {
            createdAt: {
              gte: startDate,
              lt: endDate
            },
            user: {
              createdBy: seller.id
            }
          }
        });

        // Get total revenue from orders of customers created by this seller
        const ordersWithRevenue = await prisma.order.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lt: endDate
            },
            user: {
              createdBy: seller.id
            },
            status: {
              in: ['Delivered', 'Confirmed']
            }
          },
          include: {
            deliveryItems: {
              include: {
                menuItem: {
                  include: {
                    prices: true
                  }
                }
              }
            }
          }
        });

        // Calculate total revenue from orders
        const totalRevenue = ordersWithRevenue.reduce((sum, order) => {
          const orderRevenue = order.deliveryItems.reduce((orderSum, item) => {
            const price = item.menuItem.prices[0]?.totalPrice || 0;
            return orderSum + (price * item.quantity);
          }, 0);
          return sum + orderRevenue;
        }, 0);

        // Get customer count (customers created by this seller)
        const customerCount = await prisma.user.count({
          where: {
            createdBy: seller.id
          }
        });

        // Mock rating - replace with actual rating system
        const averageRating = 4.0 + Math.random() * 1.0; // 4.0 to 5.0

        return {
          id: seller.id,
          name: seller.auth?.email?.split('@')[0]?.replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || seller.company?.name || 'Unknown Seller',
          orders: sellerOrders,
          revenue: totalRevenue,
          customers: customerCount,
          rating: Math.round(averageRating * 10) / 10
        };
      })
    );

    // Sort by revenue and take top performers
    const topPerformers = sellersWithPerformance
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);

    return {
      success: true,
      data: {
        topPerformers,
        period,
        startDate,
        endDate
      }
    };
  } catch (error) {
    console.error('Error in getTopPerformingSellers:', error);
    throw new AppError('Failed to get top performing sellers: ' + error.message, 500);
  }
};
