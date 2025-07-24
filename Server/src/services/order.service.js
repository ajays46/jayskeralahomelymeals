import prisma from '../config/prisma.js';
import AppError from '../utils/AppError.js';

// Create a new order
export const createOrderService = async (userId, orderData) => {
    try {
        const { 
            orderDate, 
            orderTimes, 
            orderItems, 
            deliveryAddressId,
            deliveryLocations, // New field for multiple delivery locations
            deliverySchedule, // New field for detailed delivery information
            linkedRecurringOrderId 
        } = orderData;

        // Validate required fields
        if (!orderDate || !orderTimes || !orderItems || orderItems.length === 0) {
            throw new AppError('Order date, times, and items are required', 400);
        }

        // Validate order times
        const validOrderTimes = ['Morning', 'Noon', 'Night'];
        if (!orderTimes.every(time => validOrderTimes.includes(time))) {
            throw new AppError('Invalid order time. Must be Morning, Noon, or Night', 400);
        }

        // Validate order date (must be today or future)
        const orderDateObj = new Date(orderDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (orderDateObj < today) {
            throw new AppError('Order date cannot be in the past', 400);
        }

        // Calculate total price and validate menu items
        let totalPrice = 0;
        const validatedOrderItems = [];

        for (const item of orderItems) {
            const { menuItemId, quantity } = item;

            if (!menuItemId || !quantity || quantity <= 0) {
                throw new AppError('Invalid menu item or quantity', 400);
            }

            // Get menu item with price
            const menuItem = await prisma.menuItem.findUnique({
                where: { id: menuItemId },
                include: {
                    prices: {
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    }
                }
            });

            if (!menuItem) {
                throw new AppError(`Menu item with ID ${menuItemId} not found`, 404);
            }

            if (!menuItem.prices || menuItem.prices.length === 0) {
                throw new AppError(`No price found for menu item ${menuItem.name}`, 400);
            }

            const itemPrice = menuItem.prices[0].totalPrice;
            const itemTotal = itemPrice * quantity;
            totalPrice += itemTotal;

            validatedOrderItems.push({
                menuItemId,
                quantity,
                total: itemTotal
            });
        }

        // Validate delivery schedule if provided
        let validatedDeliverySchedule = null;
        if (deliverySchedule) {
            try {
                // Validate delivery schedule structure
                const schedule = typeof deliverySchedule === 'string' ? JSON.parse(deliverySchedule) : deliverySchedule;
                
                // Extract all address IDs from the schedule
                const addressIds = [];
                Object.values(schedule).forEach(mealData => {
                    if (mealData.deliveryAddressId) {
                        addressIds.push(mealData.deliveryAddressId);
                    }
                });
                
                // Validate all addresses exist and belong to user
                if (addressIds.length > 0) {
                    const uniqueAddressIds = [...new Set(addressIds)];
                    const addresses = await prisma.address.findMany({
                        where: {
                            id: { in: uniqueAddressIds },
                            userId: userId
                        }
                    });

                    if (addresses.length !== uniqueAddressIds.length) {
                        throw new AppError('One or more delivery addresses not found or do not belong to user', 404);
                    }
                }
                
                validatedDeliverySchedule = JSON.stringify(schedule);
            } catch (error) {
                throw new AppError('Invalid delivery schedule format', 400);
            }
        }

        // Validate delivery locations if provided (for backward compatibility)
        if (deliveryLocations) {
            const addressIds = Object.values(deliveryLocations).filter(id => id); // Filter out null/undefined values
            
            if (addressIds.length > 0) {
                // Get unique address IDs (in case same address is used for multiple meal times)
                const uniqueAddressIds = [...new Set(addressIds)];
                
                const addresses = await prisma.address.findMany({
                    where: {
                        id: { in: uniqueAddressIds },
                        userId: userId
                    }
                });

                if (addresses.length !== uniqueAddressIds.length) {
                    throw new AppError('One or more delivery addresses not found or do not belong to user', 404);
                }
            }
        }

        // Validate single delivery address if provided
        if (deliveryAddressId) {
            const address = await prisma.address.findFirst({
                where: {
                    id: deliveryAddressId,
                    userId: userId
                }
            });

            if (!address) {
                throw new AppError('Delivery address not found or does not belong to user', 404);
            }
        }

        // Create order with transaction
        const order = await prisma.$transaction(async (tx) => {
            // Create the order
            const newOrder = await tx.order.create({
                data: {
                    userId,
                    orderDate: orderDateObj,
                    orderTimes: JSON.stringify(orderTimes), // Store as JSON string
                    totalPrice,
                    deliveryAddressId,
                    deliverySchedule: validatedDeliverySchedule, // Store detailed delivery schedule
                    linkedRecurringOrderId,
                    status: 'Pending'
                }
            });

            // Create order items
            const orderItemsData = validatedOrderItems.map(item => ({
                orderId: newOrder.id,
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                total: item.total
            }));

            await tx.orderItem.createMany({
                data: orderItemsData
            });

            // Return order with items
            return await tx.order.findUnique({
                where: { id: newOrder.id },
                include: {
                    orderItems: {
                        include: {
                            menuItem: {
                                include: {
                                    product: true,
                                    menu: true
                                }
                            }
                        }
                    },
                    deliveryAddress: true
                }
            });
        });

        return order;
    } catch (error) {
        console.error('Create order service error:', error);
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError('Failed to create order', 500);
    }
};

// Get all orders for a user
export const getUserOrdersService = async (userId, filters = {}) => {
    try {
        const { status, startDate, endDate, orderTime } = filters;

        const whereClause = {
            userId: userId
        };

        // Add status filter
        if (status) {
            whereClause.status = status;
        }

        // Add date range filter
        if (startDate || endDate) {
            whereClause.orderDate = {};
            if (startDate) {
                whereClause.orderDate.gte = new Date(startDate);
            }
            if (endDate) {
                whereClause.orderDate.lte = new Date(endDate);
            }
        }

        // Add order time filter
        if (orderTime) {
            whereClause.orderTimes = {
                contains: orderTime
            };
        }

        const orders = await prisma.order.findMany({
            where: whereClause,
            include: {
                orderItems: {
                    include: {
                        menuItem: {
                            include: {
                                product: true,
                                menu: true
                            }
                        }
                    }
                },
                deliveryAddress: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return orders;
    } catch (error) {
        console.error('Get user orders service error:', error);
        throw new AppError('Failed to retrieve orders', 500);
    }
};

// Get a specific order by ID
export const getOrderByIdService = async (userId, orderId) => {
    try {
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                userId: userId
            },
            include: {
                orderItems: {
                    include: {
                        menuItem: {
                            include: {
                                product: true,
                                menu: true
                            }
                        }
                    }
                },
                deliveryAddress: true,
                linkedRecurringOrder: {
                    include: {
                        orderItems: {
                            include: {
                                menuItem: {
                                    include: {
                                        product: true,
                                        menu: true
                                    }
                                }
                            }
                        }
                    }
                },
                recurringOrders: {
                    include: {
                        orderItems: {
                            include: {
                                menuItem: {
                                    include: {
                                        product: true,
                                        menu: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!order) {
            throw new AppError('Order not found', 404);
        }

        return order;
    } catch (error) {
        console.error('Get order by ID service error:', error);
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError('Failed to retrieve order', 500);
    }
};

// Update order status
export const updateOrderStatusService = async (userId, orderId, status) => {
    try {
        const validStatuses = ['Pending', 'Confirmed', 'Cancelled', 'Delivered', 'Payment_Confirmed'];
        
        if (!validStatuses.includes(status)) {
            throw new AppError('Invalid order status', 400);
        }

        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                userId: userId
            }
        });

        if (!order) {
            throw new AppError('Order not found', 404);
        }

        // Prevent status changes for delivered orders
        if (order.status === 'Delivered' && status !== 'Delivered') {
            throw new AppError('Cannot change status of delivered order', 400);
        }

        const updatedOrder = await prisma.order.update({
            where: {
                id: orderId
            },
            data: {
                status: status
            },
            include: {
                orderItems: {
                    include: {
                        menuItem: {
                            include: {
                                product: true,
                                menu: true
                            }
                        }
                    }
                },
                deliveryAddress: true
            }
        });

        return updatedOrder;
    } catch (error) {
        console.error('Update order status service error:', error);
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError('Failed to update order status', 500);
    }
};

// Cancel order
export const cancelOrderService = async (userId, orderId) => {
    try {
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                userId: userId
            }
        });

        if (!order) {
            throw new AppError('Order not found', 404);
        }

        // Check if order can be cancelled
        if (order.status === 'Delivered') {
            throw new AppError('Cannot cancel delivered order', 400);
        }

        if (order.status === 'Cancelled') {
            throw new AppError('Order is already cancelled', 400);
        }

        const updatedOrder = await prisma.order.update({
            where: {
                id: orderId
            },
            data: {
                status: 'Cancelled'
            },
            include: {
                orderItems: {
                    include: {
                        menuItem: {
                            include: {
                                product: true,
                                menu: true
                            }
                        }
                    }
                },
                deliveryAddress: true
            }
        });

        return updatedOrder;
    } catch (error) {
        console.error('Cancel order service error:', error);
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError('Failed to cancel order', 500);
    }
};

// Get orders by date range (for delivery management)
export const getOrdersByDateRangeService = async (startDate, endDate, filters = {}) => {
    try {
        const { status, orderTime, userId } = filters;

        const whereClause = {
            orderDate: {
                gte: new Date(startDate),
                lte: new Date(endDate)
            }
        };

        // Add status filter
        if (status) {
            whereClause.status = status;
        }

        // Add order time filter
        if (orderTime) {
            whereClause.orderTimes = {
                contains: orderTime
            };
        }

        // Add user filter
        if (userId) {
            whereClause.userId = userId;
        }

        const orders = await prisma.order.findMany({
            where: whereClause,
            include: {
                orderItems: {
                    include: {
                        menuItem: {
                            include: {
                                product: true,
                                menu: true
                            }
                        }
                    }
                },
                deliveryAddress: true,
                user: {
                    include: {
                        auth: true
                    }
                }
            },
            orderBy: [
                { orderDate: 'asc' },
                { createdAt: 'asc' }
            ]
        });

        return orders;
    } catch (error) {
        console.error('Get orders by date range service error:', error);
        throw new AppError('Failed to retrieve orders by date range', 500);
    }
};

// Get delivery schedules for AI routing
export const getDeliverySchedulesForRoutingService = async (date) => {
    try {
        const orders = await prisma.order.findMany({
            where: {
                orderDate: new Date(date),
                status: {
                    in: ['Pending', 'Confirmed']
                }
            },
            select: {
                id: true,
                userId: true,
                orderDate: true,
                orderTimes: true,
                deliverySchedule: true,
                deliveryAddress: {
                    select: {
                        id: true,
                        street: true,
                        housename: true,
                        city: true,
                        pincode: true,
                        geoLocation: true
                    }
                }
            },
            orderBy: [
                { orderDate: 'asc' },
                { createdAt: 'asc' }
            ]
        });

        // Parse delivery schedules and format for AI routing
        const routingData = orders.map(order => {
            const deliverySchedule = order.deliverySchedule ? JSON.parse(order.deliverySchedule) : null;
            
            return {
                orderId: order.id,
                userId: order.userId,
                orderDate: order.orderDate,
                orderTimes: JSON.parse(order.orderTimes),
                deliverySchedule: deliverySchedule,
                primaryDeliveryAddress: order.deliveryAddress
            };
        });

        return routingData;
    } catch (error) {
        console.error('Get delivery schedules for routing service error:', error);
        throw new AppError('Failed to retrieve delivery schedules for routing', 500);
    }
}; 