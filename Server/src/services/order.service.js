import prisma from '../config/prisma.js';

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
        
        // Map meal type to delivery time slot
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

    return order;
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
