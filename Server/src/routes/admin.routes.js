import express from 'express';
// import { verifyToken } from '../middleware/verifyToken.js';
import { authenticateToken } from '../middleware/authHandler.js';
import { checkRole } from '../middleware/checkRole.js';
import { adminLogin } from '../controllers/auth.controller.js';
import { createCompany ,companyList, companyDelete, createProduct, productList, getProductById, updateProduct, deleteProduct, createMenu, menuList, getMenuById, updateMenu, deleteMenu, createMenuItem, menuItemList, getMenuItemById, updateMenuItem, deleteMenuItem, createMenuCategory, menuCategoryList, getMenuCategoryById, updateMenuCategory, deleteMenuCategory, createMenuItemPrice, menuItemPriceList, getMenuItemPriceById, updateMenuItemPrice, deleteMenuItemPrice, getMealsByDay, getMenusForBooking, getAllOrders, updateOrderStatus, deleteOrder, createAdminUser, getAdminUsers, getOrphanedUsers, cleanupOrphanedUsers, getSellersWithOrders, getDeliveryExecutives, proxyRoutePlanning, proxyExecutiveCount, proxyRunScript, proxySendRoutes, proxyFileContent, proxySessionData, getProductQuantitiesForMenus} from '../controllers/admin.controller.js';

const router = express.Router();

// Example of a route that requires admin role
router.get('/dashboard',
    authenticateToken,
    checkRole('admin', 'seller'),
    adminLogin
);

router.post('/company-create',
    authenticateToken,
    // checkRole('admin/'),
    createCompany
);

router.get('/company-list',
    // authenticateToken,
    // checkRole('admin'),
    companyList
);

router.put('/company-delete',
    authenticateToken,
    // checkRole('admin'),
    companyDelete
);

router.post('/product-create',
    authenticateToken,
    // checkRole('admin'),
    createProduct
);

router.get('/product-list',
    // authenticateToken,
    // checkRole('admin'),
    productList
);

router.get('/product/:productId',
    // authenticateToken,
    // checkRole('admin'),
    getProductById
);

router.put('/product/:productId',
    // authenticateToken,
    // checkRole('admin'),
    updateProduct
);

router.delete('/product/:productId',
    // authenticateToken,
    // checkRole('admin'),
    deleteProduct
);

// Menu routes
router.post('/menu-create',
    // authenticateToken,
    // checkRole('admin'),
    createMenu
);

router.get('/menu-list',
    // authenticateToken,
    // checkRole('admin'),
    menuList
);

router.get('/menu/:menuId',
    // authenticateToken,
    // checkRole('admin'),
    getMenuById
);

router.put('/menu/:menuId',
    // authenticateToken,
    // checkRole('admin'),
    updateMenu
);

router.delete('/menu/:menuId',
    // authenticateToken,
    // checkRole('admin'),
    deleteMenu
);

// Menu Item routes
router.post('/menu-item-create',
    // authenticateToken,
    // checkRole('admin'),
    createMenuItem
);

router.get('/menu-item-list',
    // authenticateToken,
    // checkRole('admin'),
    menuItemList
);

router.get('/menu-item/:menuItemId',
    // authenticateToken,
    // checkRole('admin'),
    getMenuItemById
);

router.put('/menu-item/:menuItemId',
    // authenticateToken,
    // checkRole('admin'),
    updateMenuItem
);

router.delete('/menu-item/:menuItemId',
    // authenticateToken,
    // checkRole('admin'),
    deleteMenuItem
);

// Menu Category routes
router.post('/menu-category-create',
    // authenticateToken,
    // checkRole('admin'),
    createMenuCategory
);

router.get('/menu-category-list',
    // authenticateToken,
    // checkRole('admin'),
    menuCategoryList
);

router.get('/menu-category/:menuCategoryId',
    // authenticateToken,
    // checkRole('admin'),
    getMenuCategoryById
);

router.put('/menu-category/:menuCategoryId',
    // authenticateToken,
    // checkRole('admin'),
    updateMenuCategory
);

router.delete('/menu-category/:menuCategoryId',
    // authenticateToken,
    // checkRole('admin'),
    deleteMenuCategory
);

// Menu Item Price routes
router.post('/menu-item-price-create',
    // authenticateToken,
    // checkRole('admin'),
    createMenuItemPrice
);

router.get('/menu-item-price-list',
    // authenticateToken,
    // checkRole('admin'),
    menuItemPriceList
);

router.get('/menu-item-price/:menuItemPriceId',
    // authenticateToken,
    // checkRole('admin'),
    getMenuItemPriceById
);

router.put('/menu-item-price/:menuItemPriceId',
    // authenticateToken,
    // checkRole('admin'),
    updateMenuItemPrice
);

router.delete('/menu-item-price/:menuItemPriceId',
    // authenticateToken,
    // checkRole('admin'),
    deleteMenuItemPrice
);

// Meals route
router.get('/meals',
    // authenticateToken,
    // checkRole('admin'),
    getMealsByDay
);

// Menus for booking route
router.get('/menus-for-booking',
    // authenticateToken,
    // checkRole('admin'),
    getMenusForBooking
);

// Admin Order Management routes
router.get('/orders',
    // authenticateToken,
    // checkRole('admin'),
    getAllOrders
);

router.put('/orders/:orderId/status',
    // authenticateToken,
    // checkRole('admin'),
    updateOrderStatus
);

router.delete('/orders/:orderId',
    // authenticateToken,
    // checkRole('admin'),
    deleteOrder
);

// Admin User Management routes
router.post('/users/create',
    authenticateToken,
    // checkRole('admin'), // Temporarily disabled for testing
    createAdminUser
);

router.get('/users/list',
    authenticateToken,
    // checkRole('admin'), // Temporarily disabled for testing
    getAdminUsers
);

// Utility routes for debugging orphaned users
router.get('/users/orphaned',
    // authenticateToken,
    // checkRole('admin'),
    getOrphanedUsers
);

router.delete('/users/orphaned',
    // authenticateToken,
    // checkRole('admin'),
    cleanupOrphanedUsers
);

// Delivery Manager Dashboard Routes
router.get('/sellers-with-orders',
    authenticateToken,
    // checkRole('admin', 'delivery_manager'), // Temporarily disabled for testing
    getSellersWithOrders
);

router.get('/delivery-executives',
    authenticateToken,
    // checkRole('admin', 'delivery_manager'), // Temporarily disabled for testing
    getDeliveryExecutives
);

// Route planning proxy endpoint
router.post('/proxy-route-planning',
    authenticateToken,
    // checkRole('admin', 'delivery_manager'), // Temporarily disabled for testing
    proxyRoutePlanning
);

// Executive count proxy endpoint
router.post('/proxy-executive-count',
    authenticateToken,
    // checkRole('admin', 'delivery_manager'), // Temporarily disabled for testing
    proxyExecutiveCount
);

// File content proxy endpoint to avoid CORS issues
router.post('/proxy-file-content',
    authenticateToken,
    // checkRole('admin', 'delivery_manager'), // Temporarily disabled for testing
    proxyFileContent
);

// Run script proxy endpoint for program execution
router.post('/proxy-run-script',
    authenticateToken,
    // checkRole('admin', 'delivery_manager'), // Temporarily disabled for testing
    proxyRunScript
);

// Send routes proxy endpoint for WhatsApp messaging
router.post('/proxy-send-routes',
    authenticateToken,
    // checkRole('admin', 'delivery_manager'), // Temporarily disabled for testing
    proxySendRoutes
);

// Session data proxy endpoint
router.get('/proxy-session-data',
    authenticateToken,
    // checkRole('admin', 'delivery_manager'), // Temporarily disabled for testing
    proxySessionData
);

// Product quantities for menus route
router.get('/product-quantities-for-menus',
    // authenticateToken,
    // checkRole('admin'),
    getProductQuantitiesForMenus
);

export default router; 