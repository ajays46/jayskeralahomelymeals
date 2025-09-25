import { 
    createDeliveryItemsAfterPaymentService,
    getDeliveryItemsByOrderService,
    updateDeliveryItemStatusService,
    updateDeliveryItemAddressService,
    uploadDeliveryImageService,
    getDeliveryItemStatusService
} from '../services/deliveryItem.service.js';

// Create delivery items after payment confirmation
export const createDeliveryItemsAfterPayment = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.userId;
        const orderData = req.body; // Contains orderItems, deliveryLocations, skipMeals, selectedDates, orderTimes

        const result = await createDeliveryItemsAfterPaymentService(orderId, orderData);
      

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

// Update delivery item address
export const updateDeliveryItemAddress = async (req, res, next) => {
    try {
        
        const { deliveryItemId } = req.params;
        const { latitude, longitude } = req.body;

        if (!deliveryItemId) {
            return res.status(400).json({
                success: false,
                message: 'Delivery Item ID is required'
            });
        }

        if (latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required'
            });
        }

        const updatedAddress = await updateDeliveryItemAddressService(
            deliveryItemId, 
            { latitude, longitude }
        );

        res.status(200).json({
            success: true,
            message: 'Address updated successfully',
            data: updatedAddress
        });
    } catch (error) {
        console.error('💥 Error in updateDeliveryItemAddress controller:', error);
        next(error);
    }
};

// Upload delivery image
export const uploadDeliveryImage = async (req, res, next) => {
    try {
        const { delivery_item_id, session, date } = req.body;
        const imageFile = req.file;

        if (!imageFile) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        if (!delivery_item_id) {
            return res.status(400).json({
                success: false,
                message: 'Delivery Item ID is required'
            });
        }

        const uploadedImage = await uploadDeliveryImageService(
            delivery_item_id, 
            imageFile, 
            session,
            date
        );

        res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            data: uploadedImage
        });
    } catch (error) {
        console.error('💥 Error in uploadDeliveryImage controller:', error);
        next(error);
    }
};

// Get delivery item status by delivery item ID
export const getDeliveryItemStatus = async (req, res, next) => {
    try {
        const { deliveryItemId } = req.params;
        
        if (!deliveryItemId) {
            return res.status(400).json({
                success: false,
                message: 'Delivery Item ID is required'
            });
        }

        const deliveryItemStatus = await getDeliveryItemStatusService(deliveryItemId);
        
        res.status(200).json({
            success: true,
            message: 'Delivery item status retrieved successfully',
            data: deliveryItemStatus
        });
    } catch (error) {
        console.error('💥 Error in getDeliveryItemStatus controller:', error);
        next(error);
    }
};

