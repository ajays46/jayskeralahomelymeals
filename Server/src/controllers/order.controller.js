import AppError from '../utils/AppError.js';
import {
    createOrderService,
    getUserOrdersService,
    getOrderByIdService,
    updateOrderStatusService,
    cancelOrderService,
    getOrdersByDateRangeService,
    getDeliverySchedulesForRoutingService
} from '../services/order.service.js';

// Create a new order
export const createOrder = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const orderData = req.body;
        // console.log(req.body,"orderData");
        

        const order = await createOrderService(userId, orderData);
        console.log(order,"orderVIVEK");
        

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: {
                order: order
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get all orders for a user
export const getUserOrders = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const filters = {
            status: req.query.status,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            orderTime: req.query.orderTime
        };

        const orders = await getUserOrdersService(userId, filters);

        res.status(200).json({
            success: true,
            message: 'Orders retrieved successfully',
            data: {
                orders: orders
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get a specific order by ID
export const getOrderById = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const orderId = req.params.id;

        const order = await getOrderByIdService(userId, orderId);

        res.status(200).json({
            success: true,
            message: 'Order retrieved successfully',
            data: {
                order: order
            }
        });
    } catch (error) {
        next(error);
    }
};

// Update order status
export const updateOrderStatus = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const orderId = req.params.id;
        const { status } = req.body;

        if (!status) {
            return next(new AppError('Status is required', 400));
        }

        const order = await updateOrderStatusService(userId, orderId, status);

        res.status(200).json({
            success: true,
            message: 'Order status updated successfully',
            data: {
                order: order
            }
        });
    } catch (error) {
        next(error);
    }
};

// Cancel order
export const cancelOrder = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const orderId = req.params.id;

        const order = await cancelOrderService(userId, orderId);

        res.status(200).json({
            success: true,
            message: 'Order cancelled successfully',
            data: {
                order: order
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get orders by date range (for delivery management)
export const getOrdersByDateRange = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.params;
        const filters = {
            status: req.query.status,
            orderTime: req.query.orderTime,
            userId: req.query.userId
        };

        if (!startDate || !endDate) {
            return next(new AppError('Start date and end date are required', 400));
        }

        const orders = await getOrdersByDateRangeService(startDate, endDate, filters);

        res.status(200).json({
            success: true,
            message: 'Orders retrieved successfully',
            data: {
                orders: orders
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get delivery orders for a specific date and time
export const getDeliveryOrders = async (req, res, next) => {
    try {
        const { date, orderTime } = req.params;
        const filters = {
            status: req.query.status || 'Confirmed',
            orderTime: orderTime
        };

        if (!date) {
            return next(new AppError('Date is required', 400));
        }

        const orders = await getOrdersByDateRangeService(date, date, filters);

        res.status(200).json({
            success: true,
            message: 'Delivery orders retrieved successfully',
            data: {
                orders: orders
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get delivery schedules for AI routing
export const getDeliverySchedulesForRouting = async (req, res, next) => {
    try {
        const { date } = req.params;

        if (!date) {
            return next(new AppError('Date is required', 400));
        }

        const routingData = await getDeliverySchedulesForRoutingService(date);

        res.status(200).json({
            success: true,
            message: 'Delivery schedules retrieved successfully for AI routing',
            data: {
                routingData: routingData
            }
        });
    } catch (error) {
        next(error);
    }
};
