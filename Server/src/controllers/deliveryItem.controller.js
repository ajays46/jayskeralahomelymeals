import { 
    createDeliveryItemsAfterPaymentService,
    getDeliveryItemsByOrderService, 
    updateDeliveryItemStatusService 
} from '../services/deliveryItem.service.js';

// Create delivery items after payment confirmation
export const createDeliveryItemsAfterPayment = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.userId;
        const orderData = req.body; // Contains orderItems, deliveryLocations, skipMeals, selectedDates, orderTimes

        const result = await createDeliveryItemsAfterPaymentService(orderId, orderData);
        console.log(result,"result");

        res.status(201).json({
            success: true,
            message: result.message,
            data: {
                deliveryItemsCount: result.deliveryItemsCount,
                orderId: orderId
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get delivery items for an order
export const getDeliveryItemsByOrder = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.userId;

        const deliveryItems = await getDeliveryItemsByOrderService(orderId, userId);

        res.status(200).json({
            success: true,
            data: deliveryItems
        });
    } catch (error) {
        next(error);
    }
};

// Update delivery item status
export const updateDeliveryItemStatus = async (req, res, next) => {
    try {
        const { deliveryItemId } = req.params;
        const { status } = req.body;
        const userId = req.user.userId;

        const updatedDeliveryItem = await updateDeliveryItemStatusService(deliveryItemId, userId, status);

        res.status(200).json({
            success: true,
            message: 'Delivery item status updated successfully',
            data: updatedDeliveryItem
        });
    } catch (error) {
        next(error);
    }
};
