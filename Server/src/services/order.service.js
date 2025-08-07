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
            totalPrice = itemPrice; // Use the menu item price directly as the total

            validatedOrderItems.push({
                menuItemId,
                quantity
            });
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

        // Ensure at least one delivery address is provided (either primary or meal-specific)
        const hasPrimaryAddress = deliveryAddressId;
        const hasMealAddresses = deliveryLocations && (
            deliveryLocations.breakfast || 
            deliveryLocations.lunch || 
            deliveryLocations.dinner
        );
        
        if (!hasPrimaryAddress && !hasMealAddresses) {
            throw new AppError('At least one delivery address is required (primary or meal-specific)', 400);
        }

        // Check if this is a comprehensive menu order (like "Monthly Menu", "Weekly Menu")
        // Check if any menu item contains 'monthly', 'weekly', or 'plan' in its name
        let isComprehensiveMenu = false;
        let isDailyRates = false;
        for (const item of validatedOrderItems) {
            const menuItem = await prisma.menuItem.findUnique({
                where: { id: item.menuItemId }
            });
            if (menuItem) {
                const itemName = menuItem.name.toLowerCase();
                if (itemName.includes('monthly') || itemName.includes('weekly') || itemName.includes('plan')) {
                    isComprehensiveMenu = true;
                    break;
                }
                // Check if this is daily rates
                if (itemName.includes('daily rates') || itemName.includes('daily rate')) {
                    isDailyRates = true;
                }
            }
        }

        // Create order with transaction
        const order = await prisma.$transaction(async (tx) => {
            // Determine the primary delivery address for the order
            // Use the first available address from meal-specific addresses or fallback to deliveryAddressId
            let primaryDeliveryAddressId = deliveryAddressId;
            
            if (deliveryLocations) {
                // Try to find the first available meal-specific address
                const mealAddresses = [
                    deliveryLocations.breakfast,
                    deliveryLocations.lunch, 
                    deliveryLocations.dinner
                ].filter(addr => addr); // Remove null/undefined values
                
                if (mealAddresses.length > 0) {
                    primaryDeliveryAddressId = mealAddresses[0];
                }
            }
            
            // Create the order
            const newOrder = await tx.order.create({
                data: {
                    userId,
                    orderDate: orderDateObj,
                    orderTimes: JSON.stringify(orderTimes), // Store as JSON string
                    totalPrice,
                    deliveryAddressId: primaryDeliveryAddressId,
                    linkedRecurringOrderId,
                    status: 'Pending'
                }
            });

            // Note: Delivery items will be created after payment confirmation
            // This ensures that delivery items are only created for paid orders
            console.log('Order created successfully. Delivery items will be created after payment confirmation.');

            // Return order without delivery items (they will be created after payment)
            return await tx.order.findUnique({
                where: { id: newOrder.id },
                include: {
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
                deliveryItems: {
                    include: {
                        menuItem: {
                            include: {
                                product: true,
                                menu: true
                            }
                        },
                        deliveryAddress: true
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
                deliveryItems: {
                    include: {
                        menuItem: {
                            include: {
                                product: true,
                                menu: true
                            }
                        },
                        deliveryAddress: true
                    }
                },
                deliveryAddress: true,
                linkedRecurringOrder: {
                    include: {
                        deliveryItems: {
                            include: {
                                menuItem: {
                                    include: {
                                        product: true,
                                        menu: true
                                    }
                                },
                                deliveryAddress: true
                            }
                        }
                    }
                },
                recurringOrders: {
                    include: {
                        deliveryItems: {
                            include: {
                                menuItem: {
                                    include: {
                                        product: true,
                                        menu: true
                                    }
                                },
                                deliveryAddress: true
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
                deliveryItems: {
                    include: {
                        menuItem: {
                            include: {
                                product: true,
                                menu: true
                            }
                        },
                        deliveryAddress: true
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

// Cancel order (delete from database)
export const cancelOrderService = async (userId, orderId) => {
    try {
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                userId: userId
            },
            include: {
                deliveryItems: {
                    include: {
                        deliveryAddress: true
                    }
                },
                deliveryAddress: true
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

        // Delete the order and all related data using transaction
        const deletedOrder = await prisma.$transaction(async (tx) => {
            console.log('Starting order deletion transaction for orderId:', orderId);
            console.log('Order data:', JSON.stringify(order, null, 2));

            // Delete payments and payment receipts first (due to foreign key constraints)
            console.log('Deleting payments for order:', orderId);
            await tx.payment.deleteMany({
                where: {
                    orderId: orderId
                }
            });

            // Delete delivery items first (due to foreign key constraints)
            if (order.deliveryItems && order.deliveryItems.length > 0) {
                console.log('Deleting delivery items:', order.deliveryItems.length);
                await tx.deliveryItem.deleteMany({
                    where: {
                        orderId: orderId
                    }
                });
            } else {
                console.log('No delivery items to delete');
            }

            // Delete delivery address if it exists and has an id
            if (order.deliveryAddress && order.deliveryAddress.id) {
                console.log('Deleting delivery address:', order.deliveryAddress.id);
                await tx.deliveryAddress.delete({
                    where: {
                        id: order.deliveryAddress.id
                    }
                });
            } else {
                console.log('No delivery address to delete or address has no id');
            }

            // Delete the order
            console.log('Deleting main order');
            const deletedOrder = await tx.order.delete({
                where: {
                    id: orderId
                }
            });

            console.log('Order deletion completed successfully');
            return deletedOrder;
        });

        return { 
            id: deletedOrder.id,
            message: 'Order deleted successfully'
        };
    } catch (error) {
        console.error('Cancel order service error:', error);
        
        // If transaction fails, try a simpler approach - just update status to cancelled
        if (error.code === 'P2003' || error.message.includes('delete')) {
            console.log('Transaction failed, falling back to status update');
            try {
        const updatedOrder = await prisma.order.update({
            where: {
                id: orderId
            },
            data: {
                status: 'Cancelled'
                    }
                });
                
                return { 
                    id: updatedOrder.id,
                    message: 'Order cancelled (not deleted due to constraints)'
                };
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
                throw new AppError('Failed to cancel order', 500);
            }
        }
        
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
                deliveryItems: {
                    include: {
                        menuItem: {
                            include: {
                                product: true,
                                menu: true
                            }
                        },
                        deliveryAddress: true
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



// Calculate menu pricing for different plans
export const calculateMenuPricingService = async (menuId, orderMode) => {
    try {
        // Get menu with pricing data
        const menu = await prisma.menu.findUnique({
            where: { id: menuId },
            include: {
                menuItems: {
                    include: {
                        prices: {
                            orderBy: { createdAt: 'desc' },
                            take: 1
                        }
                    }
                }
            }
        });

        if (!menu) {
            throw new AppError('Menu not found', 404);
        }

        // Calculate meal type prices
        const mealPricing = {
            breakfast: { price: 0, items: [] },
            lunch: { price: 0, items: [] },
            dinner: { price: 0, items: [] }
        };

        // Group menu items by meal type and calculate prices
        for (const menuItem of menu.menuItems) {
            if (menuItem.prices && menuItem.prices.length > 0) {
                const price = menuItem.prices[0].totalPrice;
                
                if (menuItem.mealType === 'breakfast') {
                    mealPricing.breakfast.price += price;
                    mealPricing.breakfast.items.push({
                        id: menuItem.id,
                        name: menuItem.productName,
                        price: price
                    });
                } else if (menuItem.mealType === 'lunch') {
                    mealPricing.lunch.price += price;
                    mealPricing.lunch.items.push({
                        id: menuItem.id,
                        name: menuItem.productName,
                        price: price
                    });
                } else if (menuItem.mealType === 'dinner') {
                    mealPricing.dinner.price += price;
                    mealPricing.dinner.items.push({
                        id: menuItem.id,
                        name: menuItem.productName,
                        price: price
                    });
                }
            }
        }

        // Calculate total menu price
        const totalMenuPrice = mealPricing.breakfast.price + mealPricing.lunch.price + mealPricing.dinner.price;

        // Calculate plan-specific pricing
        const calculatedPrices = {
            singleDay: totalMenuPrice,
            sevenDayPlan: totalMenuPrice * 7,
            thirtyDayPlan: totalMenuPrice * 30
        };

        // Determine display label based on order mode and menu name
        let displayLabel = '7-Day Plan Total:';
        let displayPrice = calculatedPrices.sevenDayPlan;

        if (orderMode === 'daily-flexible') {
            displayLabel = 'Menu Items Total:';
            displayPrice = calculatedPrices.singleDay;
        } else if (menu.name?.toLowerCase().includes('monthly') || menu.name?.toLowerCase().includes('month')) {
            displayLabel = '30-Day Plan Total:';
            displayPrice = calculatedPrices.thirtyDayPlan;
        }

        return {
            menuId: menu.id,
            menuName: menu.name,
            totalMenuPrice,
            mealPricing,
            calculatedPrices,
            displayLabel,
            displayPrice
        };
    } catch (error) {
        console.error('Calculate menu pricing service error:', error);
        throw new AppError('Failed to calculate menu pricing', 500);
    }
};

// Calculate total order price with dates and skip meals
export const calculateOrderTotalService = async (menuId, selectedDates, skipMeals, orderMode, dateMenuSelections) => {
    try {
        let totalPrice = 0;
        let pricingBreakdown = {
            basePrice: 0,
            dateMultiplier: 0,
            skippedMealsDeduction: 0,
            finalTotal: 0
        };

        // For daily flexible mode
        if (orderMode === 'daily-flexible') {
            totalPrice = 0;
            
            // Calculate based on individual date-menu selections
            for (const date of selectedDates) {
                const dateStr = date.split('T')[0];
                const menuForDate = dateMenuSelections[dateStr];
                
                if (menuForDate) {
                    const menuPricing = await calculateMenuPricingService(menuForDate.id, orderMode);
                    totalPrice += menuPricing.totalMenuPrice;
                }
            }

            // Subtract skipped meals
            let skippedMealsTotal = 0;
            for (const [dateStr, skippedMealsForDate] of Object.entries(skipMeals || {})) {
                const menuForDate = dateMenuSelections[dateStr];
                if (menuForDate) {
                    const menuPricing = await calculateMenuPricingService(menuForDate.id, orderMode);
                    for (const mealType of Object.keys(skippedMealsForDate)) {
                        skippedMealsTotal += menuPricing.mealPricing[mealType]?.price || 0;
                    }
                }
            }

            totalPrice -= skippedMealsTotal;
            pricingBreakdown = {
                basePrice: totalPrice + skippedMealsTotal,
                dateMultiplier: 1,
                skippedMealsDeduction: skippedMealsTotal,
                finalTotal: totalPrice
            };
        } else {
            // For other modes (single, multiple)
            const menuPricing = await calculateMenuPricingService(menuId, orderMode);
            const dailyTotal = menuPricing.totalMenuPrice;
            
            // Calculate base price for all dates
            const basePrice = dailyTotal * selectedDates.length;
            
            // Calculate skipped meals deduction
            let skippedMealsTotal = 0;
            for (const [dateStr, skippedMealsForDate] of Object.entries(skipMeals || {})) {
                for (const mealType of Object.keys(skippedMealsForDate)) {
                    skippedMealsTotal += menuPricing.mealPricing[mealType]?.price || 0;
                }
            }

            totalPrice = basePrice - skippedMealsTotal;
            
            pricingBreakdown = {
                basePrice: dailyTotal,
                dateMultiplier: selectedDates.length,
                skippedMealsDeduction: skippedMealsTotal,
                finalTotal: totalPrice
            };
        }

        return {
            totalPrice,
            pricingBreakdown,
            selectedDatesCount: selectedDates.length,
            skipMealsCount: Object.keys(skipMeals || {}).length
        };
    } catch (error) {
        console.error('Calculate order total service error:', error);
        throw new AppError('Failed to calculate order total', 500);
    }
}; 