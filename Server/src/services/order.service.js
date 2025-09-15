import prisma from '../config/prisma.js';
import { increaseProductQuantitiesService } from './inventory.service.js';

// Create a new order
export const createOrderService = async (orderData) => {
  try {
    const {
      userId,
      orderDate,
      orderTimes,
      orderItems,
      deliveryAddressId,
      deliveryLocations,
      selectedDates,
      orderMode,
      menuId,
      menuName,
      skipMeals
    } = orderData;

    // Create the order
    const order = await prisma.order.create({
      data: {
        userId: userId,
        orderDate: new Date(orderDate),
        orderTimes: JSON.stringify(orderTimes),
        totalPrice: 0, // Will be calculated later
        deliveryAddressId: deliveryAddressId,
        status: 'Pending'
      }
    });

    // Create delivery items for each selected date
    const deliveryItems = [];
    let skippedMealsCount = 0;
    
    for (const date of selectedDates) {
      // Handle both Date objects and date strings
      let dateStr;
      if (date instanceof Date) {
        dateStr = date.toISOString().split('T')[0];
      } else if (typeof date === 'string') {
        dateStr = date;
      } else {
        console.error('Invalid date format:', date);
        continue;
      }
      
      for (const item of orderItems) {
        // Check if this meal type is skipped for this date
        if (skipMeals && skipMeals[dateStr] && skipMeals[dateStr][item.mealType]) {
          // Skip this meal for this date - don't create delivery item
          skippedMealsCount++;
          continue;
        }
        
        // Map meal type to delivery time slot
        let deliveryTimeSlot = 'Breakfast'; // Default
        
        if (item.mealType === 'breakfast') deliveryTimeSlot = 'Breakfast';
        else if (item.mealType === 'lunch') deliveryTimeSlot = 'Lunch';
        else if (item.mealType === 'dinner') deliveryTimeSlot = 'Dinner';
        else deliveryTimeSlot = 'Breakfast'; // Fallback default
        
        // Use meal-specific address if available, otherwise use primary address
        let itemAddressId = deliveryAddressId;
        if (deliveryLocations && deliveryLocations[item.mealType]) {
          itemAddressId = deliveryLocations[item.mealType];
        }
        
        const deliveryItem = await prisma.deliveryItem.create({
          data: {
            orderId: order.id,
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            deliveryDate: new Date(dateStr),
            deliveryTimeSlot: deliveryTimeSlot,
            addressId: itemAddressId,
            userId: userId,
            status: 'Pending'
          }
        });
        deliveryItems.push(deliveryItem);
      }
    }

    // Remove the duplicate inventory reduction - it's handled in payment service
    // This prevents double inventory reduction for the same order

    return {
      order,
      deliveryItems
    };
  } catch (error) {
    throw new Error(`Failed to create order: ${error.message}`);
  }
};

// Get order by ID
export const getOrderByIdService = async (orderId) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        deliveryItems: {
          include: {
            menuItem: true,
            deliveryAddress: true
          }
        },
        deliveryAddress: true,
        user: {
          include: {
            contacts: {
              include: {
                phoneNumbers: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Parse orderTimes to extract selectedDates
    let selectedDates = [];
    if (order.orderTimes) {
      try {
        const orderTimes = JSON.parse(order.orderTimes);
        // Extract unique dates from delivery items
        const dates = new Set();
        order.deliveryItems.forEach(item => {
          if (item.deliveryDate) {
            dates.add(item.deliveryDate);
          }
        });
        selectedDates = Array.from(dates).sort();
      } catch (parseError) {
        console.warn('Failed to parse orderTimes:', parseError);
      }
    }

    // Add selectedDates and other useful fields to the order object
    return {
      ...order,
      selectedDates: selectedDates,
      menuName: order.deliveryItems?.[0]?.menuItem?.menu?.name || 'Unknown Menu'
    };
  } catch (error) {
    throw new Error(`Failed to get order: ${error.message}`);
  }
};

// Get orders by user ID
export const getOrdersByUserIdService = async (userId) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        deliveryItems: {
          include: {
            menuItem: true
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
    throw new Error(`Failed to get user orders: ${error.message}`);
  }
};

// Cancel an order
export const cancelOrderService = async (orderId, userId, userRoles = []) => {
  try {
    // Get the order with delivery items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        deliveryItems: {
          include: {
            menuItem: true
          }
        }
      }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Check if user has permission to cancel this order
    // Allow sellers to cancel any order, customers can only cancel their own orders
    const isSeller = userRoles && userRoles.includes('SELLER');
    if (!isSeller && order.userId !== userId) {
      throw new Error('You do not have permission to cancel this order');
    }

    // Check if order can be cancelled
    if (order.status === 'Delivered' || order.status === 'Cancelled') {
      throw new Error('Cannot cancel an order that is already delivered or cancelled');
    }

    // Use a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update order status to cancelled
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { 
          status: 'Cancelled',
          updatedAt: new Date()
        }
      });

      // Cancel all delivery items for this order
      await tx.deliveryItem.updateMany({
        where: { orderId: orderId },
        data: { 
          status: 'Cancelled',
          updatedAt: new Date()
        }
      });

      return updatedOrder;
    });

    // After successfully cancelling the order, restore product quantities
    try {
      const restorationResult = await increaseProductQuantitiesService(order.deliveryItems);
    } catch (restorationError) {
      console.error('⚠️ Warning: Failed to restore product quantities:', restorationError.message);
      // Don't fail the order cancellation if quantity restoration fails
      // The order is already cancelled, but we log the warning
    }

    return result;
  } catch (error) {
    throw new Error(`Failed to cancel order: ${error.message}`);
  }
};
