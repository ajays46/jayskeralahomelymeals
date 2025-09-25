import prisma from '../config/prisma.js';
import AppError from '../utils/AppError.js';

// Create delivery items after payment confirmation
export const createDeliveryItemsAfterPaymentService = async (orderId, orderData) => {
    try {
        // Get the order to verify it exists and get user info
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                deliveryItems: true,
                deliveryAddress: true
            }
        });

        if (!order) {
            throw new AppError('Order not found', 404);
        }

        // Check if delivery items already exist
        if (order.deliveryItems && order.deliveryItems.length > 0) {
            return {
                success: true,
                message: 'Delivery items already exist for this order',
                deliveryItemsCount: order.deliveryItems.length
            };
        }

        // Double-check with a fresh query to prevent race conditions
        const existingDeliveryItemsCount = await prisma.deliveryItem.count({
            where: { orderId: orderId }
        });

        if (existingDeliveryItemsCount > 0) {
            return {
                success: true,
                message: 'Delivery items already exist for this order',
                deliveryItemsCount: existingDeliveryItemsCount
            };
        }

        // Extract data from orderData
        let {
            orderItems,
            deliveryLocations,
            skipMeals,
            selectedDates,
            orderTimes
        } = orderData;

        // Handle case where orderData might be a JSON string
        if (typeof orderData === 'string') {
            try {
                const parsedData = JSON.parse(orderData);
                orderItems = parsedData.orderItems;
                deliveryLocations = parsedData.deliveryLocations;
                skipMeals = parsedData.skipMeals;
                selectedDates = parsedData.selectedDates;
                orderTimes = parsedData.orderTimes;
            } catch (parseError) {
                throw new AppError('Invalid orderData format', 400);
            }
        }

        // Get the delivery address ID
        const deliveryAddressId = order.deliveryAddressId;
        if (!deliveryAddressId) {
            throw new AppError('No delivery address found for this order', 400);
        }

        // Get the menu item ID from order items (assuming first item is the main menu)
        const menuItemId = orderItems?.[0]?.menuItemId;
        if (!menuItemId) {
            throw new AppError('No menu item found in order', 400);
        }

        // Map order times to delivery time slots
        const timeSlotMap = {
            'Morning': 'Breakfast',
            'Noon': 'Lunch', 
            'Night': 'Dinner'
        };

        const deliveryItemsData = [];

        // Create delivery items for each selected date and each meal time
        for (const dateStr of selectedDates) {
            const deliveryDate = new Date(dateStr);
            const dateKey = dateStr; // Use the date string as key for skipMeals
            
            // Get skipped meals for this date
            const skippedMealsForDate = skipMeals?.[dateKey] || {};
            
            for (const orderTime of orderTimes) {
                const deliveryTimeSlot = timeSlotMap[orderTime];
                
                // Check if this meal is skipped
                const isSkipped = skippedMealsForDate[deliveryTimeSlot.toLowerCase()];
                
                if (!isSkipped) {
                    // Get the appropriate address for this meal time
                    let addressId = deliveryAddressId;
                    if (deliveryLocations) {
                        const mealAddress = deliveryLocations[deliveryTimeSlot.toLowerCase()];
                        if (mealAddress) {
                            addressId = mealAddress;
                        }
                    }

                    const deliveryItem = {
                        orderId: orderId,
                        userId: order.userId,
                        menuItemId: menuItemId,
                        quantity: 1, // Default quantity per meal
                        deliveryDate: deliveryDate,
                        deliveryTimeSlot: deliveryTimeSlot,
                        addressId: addressId,
                        status: 'Pending'
                    };

                    deliveryItemsData.push(deliveryItem);
                }
            }
        }

        // Create delivery items in a transaction with additional protection
        const createdDeliveryItems = await prisma.$transaction(async (tx) => {
            // Final check before creation
            const finalCheck = await tx.deliveryItem.count({
                where: { orderId: orderId }
            });

            if (finalCheck > 0) {
                throw new Error('Delivery items already exist');
            }

            if (deliveryItemsData.length > 0) {
                const items = await tx.deliveryItem.createMany({
                    data: deliveryItemsData
                });
            }

            // Update order status to indicate delivery items are created
            await tx.order.update({
                where: { id: orderId },
                data: { 
                    status: 'Confirmed',
                    updatedAt: new Date()
                }
            });

            return deliveryItemsData.length;
        });

        return {
            success: true,
            message: `Created ${deliveryItemsData.length} delivery items for ${selectedDates.length} days × ${orderTimes.length} meals`,
            deliveryItemsCount: deliveryItemsData.length,
            deliveryItems: createdDeliveryItems
        };

    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError('Failed to create delivery items', 500);
    }
};

// Get delivery items for an order
export const getDeliveryItemsByOrderService = async (orderId, userId) => {
    try {
        const deliveryItems = await prisma.deliveryItem.findMany({
            where: {
                orderId: orderId,
                userId: userId
            },
            include: {
                menuItem: {
                    include: {
                        product: true,
                        menu: true
                    }
                },
                deliveryAddress: true,
                order: {
                    select: {
                        id: true,
                        orderDate: true,
                        orderTimes: true,
                        totalPrice: true,
                        status: true
                    }
                }
            },
            orderBy: {
                deliveryDate: 'asc',
                deliveryTimeSlot: 'asc'
            }
        });

        return deliveryItems;
    } catch (error) {
        console.error('Get delivery items service error:', error);
        throw new AppError('Failed to retrieve delivery items', 500);
    }
};

// Update delivery item status
export const updateDeliveryItemStatusService = async (deliveryItemId, userId, status) => {
    try {
        const validStatuses = ['Pending', 'Confirmed', 'Delivered', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            throw new AppError('Invalid delivery item status', 400);
        }

        // First, get the user to check their role
        const user = await prisma.user.findFirst({
            where: { id: userId },
            include: {
                userRoles: true
            }
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Check if user is admin or delivery manager
        const isAdmin = user.userRoles.some(ur => 
            ur.name === 'ADMIN' || ur.name === 'DELIVERY_MANAGER'
        );

        // Find the delivery item
        const deliveryItem = await prisma.deliveryItem.findFirst({
            where: {
                id: deliveryItemId,
                ...(isAdmin ? {} : { userId: userId }) // If admin, don't restrict by userId
            }
        });

        if (!deliveryItem) {
            throw new AppError('Delivery item not found', 404);
        }

        // If not admin, verify the delivery item belongs to the user
        if (!isAdmin && deliveryItem.userId !== userId) {
            throw new AppError('You can only cancel your own delivery items', 403);
        }

        const updatedDeliveryItem = await prisma.deliveryItem.update({
            where: { id: deliveryItemId },
            data: { 
                status: status,
                updatedAt: new Date()
            },
            include: {
                menuItem: {
                    include: {
                        product: true,
                        menu: true
                    }
                },
                deliveryAddress: true
            }
        });

        return updatedDeliveryItem;
    } catch (error) {
        console.error('Update delivery item status service error:', error);
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError('Failed to update delivery item status', 500);
    }
};

// Update delivery item address
export const updateDeliveryItemAddressService = async (deliveryItemId, coordinateData) => {
    try {
        
        const { latitude, longitude } = coordinateData;

        // First find the delivery item to get its address
        const deliveryItem = await prisma.deliveryItem.findUnique({
            where: { id: deliveryItemId },
            include: {
                deliveryAddress: true
            }
        });

        if (!deliveryItem) {
            throw new AppError('Delivery item not found', 404);
        }

        if (!deliveryItem.deliveryAddress) {
            throw new AppError('No address associated with this delivery item', 404);
        }

        const addressId = deliveryItem.deliveryAddress.id;

        // Update only geo coordinates
        const updatedAddress = await prisma.address.update({
            where: { id: addressId },
            data: {
                geoLocation: `${latitude}, ${longitude}`,
                googleMapsUrl: `https://maps.google.com/?q=${latitude},${longitude}`,
                updatedAt: new Date()
            }
        });
        

        return updatedAddress;
    } catch (error) {
        console.error('💥 Update address service error:', error);
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError('Failed to update address', 500);
    }
};

// Upload delivery image
export const uploadDeliveryImageService = async (deliveryItemId, imageFile, session, date) => {
    try {
        // First find the delivery item to get its address
        const deliveryItem = await prisma.deliveryItem.findUnique({
            where: { id: deliveryItemId },
            include: {
                deliveryAddress: true
            }
        });

        if (!deliveryItem) {
            throw new AppError('Delivery item not found', 404);
        }

        if (!deliveryItem.deliveryAddress) {
            throw new AppError('No address associated with this delivery item', 404);
        }

        const addressId = deliveryItem.deliveryAddress.id;

        // Create FormData for external API using memory buffer
        const formData = new FormData();
        formData.append('image', new Blob([imageFile.buffer], { type: imageFile.mimetype }), imageFile.originalname);
        formData.append('address_id', addressId);
        formData.append('session', session);
        formData.append('date', date);

        // Send to external API using fetch
        const response = await fetch('http://13.203.227.119:5001/upload_delivery_pic', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer mysecretkey123'
            },
            body: formData,
            timeout: 30000 // 30 seconds timeout
        });

        if (!response.ok) {
            // Try to get error details from response body
            let errorDetails = '';
            try {
                const errorText = await response.text();
                errorDetails = errorText;
            } catch (e) {
                // Could not read error response body
            }
            
            throw new AppError(`External API returned ${response.status}: ${response.statusText}. Details: ${errorDetails}`, response.status);
        }

        const responseData = await response.json();
        
        if (responseData && responseData.success) {
            // Update delivery item status to Delivered
            await prisma.deliveryItem.update({
                where: {
                    id: deliveryItemId
                },
                data: {
                    status: 'Delivered',
                    updatedAt: new Date()
                }
            });

            return {
                success: true,
                message: 'Image uploaded successfully and delivery status updated',
                externalResponse: responseData,
                fileInfo: {
                    originalName: imageFile.originalname,
                    size: imageFile.size,
                    mimeType: imageFile.mimetype
                }
            };
        } else {
            throw new AppError('External API returned unsuccessful response', 500);
        }
    } catch (error) {
        console.error('💥 Upload image service error:', error);
        if (error instanceof AppError) {
            throw error;
        }
        if (error.response) {
            throw new AppError(`External API error: ${error.response.data?.message || error.message}`, error.response.status);
        }
        throw new AppError('Failed to upload image to external API', 500);
    }
};

// Get delivery item status by delivery item ID
export const getDeliveryItemStatusService = async (deliveryItemId) => {
    try {
        const deliveryItem = await prisma.deliveryItem.findUnique({
            where: {
                id: deliveryItemId
            },
            select: {
                id: true,
                status: true,
                deliveryDate: true,
                deliveryTimeSlot: true,
                updatedAt: true,
                addressId: true,
                order: {
                    select: {
                        id: true,
                        status: true,
                        orderDate: true
                    }
                }
            }
        });

        if (!deliveryItem) {
            throw new AppError('Delivery item not found', 404);
        }

        return {
            deliveryItemId: deliveryItemId,
            addressId: deliveryItem.addressId,
            status: deliveryItem.status,
            deliveryDate: deliveryItem.deliveryDate,
            deliveryTimeSlot: deliveryItem.deliveryTimeSlot,
            updatedAt: deliveryItem.updatedAt,
            orderStatus: deliveryItem.order.status,
            orderDate: deliveryItem.order.orderDate
        };
    } catch (error) {
        console.error('💥 Error in getDeliveryItemStatusService:', error);
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError('Failed to get delivery item status', 500);
    }
};
