import express from 'express';
// import { verifyToken } from '../middleware/verifyToken.js';
import { authenticateToken } from '../middleware/authHandler.js';
import { checkRole } from '../middleware/checkRole.js';
import { resolveAdminCompany } from '../middleware/resolveAdminCompany.js';
import { adminLogin } from '../controllers/auth.controller.js';
import { createCompany ,companyList, companyDelete, createProduct, productList, getProductById, updateProduct, deleteProduct, createMenu, menuList, getMenuById, updateMenu, deleteMenu, createMenuItem, menuItemList, getMenuItemById, updateMenuItem, deleteMenuItem, createMenuCategory, menuCategoryList, getMenuCategoryById, updateMenuCategory, deleteMenuCategory, createMenuItemPrice, menuItemPriceList, getMenuItemPriceById, updateMenuItemPrice, deleteMenuItemPrice, getMealsByDay, getMenusForBooking, getAllOrders, updateOrderStatus, deleteOrder, createAdminUser, getAdminUsers, addUserRoles, removeUserRoles, getOrphanedUsers, cleanupOrphanedUsers, getSellersWithOrders, getDeliveryExecutives, proxyRoutePlanning, proxyExecutiveCount, proxyRunScript, proxySendRoutes, proxyFileContent, proxySessionData, getProductQuantitiesForMenus, getActiveExecutives, updateExecutiveStatus, saveAllRoutes, getVehicles, assignVehicleToExecutive, unassignVehicleFromExecutive} from '../controllers/admin.controller.js';

const router = express.Router();

// Example of a route that requires admin role (use 'ADMIN' to match DB enum / JWT)
router.get('/dashboard',
    authenticateToken,
    checkRole('ADMIN'),
    resolveAdminCompany,
    adminLogin
);

router.post('/company-create',
    authenticateToken,
    resolveAdminCompany,
    createCompany
);

router.get('/company-list',
    authenticateToken,
    resolveAdminCompany,
    companyList
);

router.put('/company-delete',
    authenticateToken,
    resolveAdminCompany,
    companyDelete
);

router.post('/product-create',
    authenticateToken,
    resolveAdminCompany,
    createProduct
);

router.get('/product-list',
    authenticateToken,
    resolveAdminCompany,
    productList
);

router.get('/product/:productId',
    authenticateToken,
    resolveAdminCompany,
    getProductById
);

router.put('/product/:productId',
    authenticateToken,
    resolveAdminCompany,
    updateProduct
);

router.delete('/product/:productId',
    authenticateToken,
    resolveAdminCompany,
    deleteProduct
);

// Menu routes
router.post('/menu-create',
    authenticateToken,
    resolveAdminCompany,
    createMenu
);

router.get('/menu-list',
    authenticateToken,
    resolveAdminCompany,
    menuList
);

router.get('/menu/:menuId',
    authenticateToken,
    resolveAdminCompany,
    getMenuById
);

router.put('/menu/:menuId',
    authenticateToken,
    resolveAdminCompany,
    updateMenu
);

router.delete('/menu/:menuId',
    authenticateToken,
    resolveAdminCompany,
    deleteMenu
);

// Menu Item routes
router.post('/menu-item-create',
    authenticateToken,
    resolveAdminCompany,
    createMenuItem
);

router.get('/menu-item-list',
    authenticateToken,
    resolveAdminCompany,
    menuItemList
);

router.get('/menu-item/:menuItemId',
    authenticateToken,
    resolveAdminCompany,
    getMenuItemById
);

router.put('/menu-item/:menuItemId',
    authenticateToken,
    resolveAdminCompany,
    updateMenuItem
);

router.delete('/menu-item/:menuItemId',
    authenticateToken,
    resolveAdminCompany,
    deleteMenuItem
);

// Menu Category routes
router.post('/menu-category-create',
    authenticateToken,
    resolveAdminCompany,
    createMenuCategory
);

router.get('/menu-category-list',
    authenticateToken,
    resolveAdminCompany,
    menuCategoryList
);

router.get('/menu-category/:menuCategoryId',
    authenticateToken,
    resolveAdminCompany,
    getMenuCategoryById
);

router.put('/menu-category/:menuCategoryId',
    authenticateToken,
    resolveAdminCompany,
    updateMenuCategory
);

router.delete('/menu-category/:menuCategoryId',
    authenticateToken,
    resolveAdminCompany,
    deleteMenuCategory
);

// Menu Item Price routes
router.post('/menu-item-price-create',
    authenticateToken,
    resolveAdminCompany,
    createMenuItemPrice
);

router.get('/menu-item-price-list',
    authenticateToken,
    resolveAdminCompany,
    menuItemPriceList
);

router.get('/menu-item-price/:menuItemPriceId',
    authenticateToken,
    resolveAdminCompany,
    getMenuItemPriceById
);

router.put('/menu-item-price/:menuItemPriceId',
    authenticateToken,
    resolveAdminCompany,
    updateMenuItemPrice
);

router.delete('/menu-item-price/:menuItemPriceId',
    authenticateToken,
    resolveAdminCompany,
    deleteMenuItemPrice
);

// Meals route
router.get('/meals',
    authenticateToken,
    resolveAdminCompany,
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
    authenticateToken,
    resolveAdminCompany,
    getAllOrders
);

router.put('/orders/:orderId/status',
    authenticateToken,
    resolveAdminCompany,
    updateOrderStatus
);

router.delete('/orders/:orderId',
    authenticateToken,
    resolveAdminCompany,
    deleteOrder
);

// Admin User Management routes
router.post('/users/create',
    authenticateToken,
    checkRole('ADMIN'),
    resolveAdminCompany,
    createAdminUser
);

router.get('/users/list',
    authenticateToken,
    checkRole('ADMIN'),
    resolveAdminCompany,
    getAdminUsers
);

// User role management routes
router.post('/users/:userId/roles',
    authenticateToken,
    checkRole('ADMIN'),
    resolveAdminCompany,
    addUserRoles
);

router.delete('/users/:userId/roles',
    authenticateToken,
    checkRole('ADMIN'),
    resolveAdminCompany,
    removeUserRoles
);

// Utility routes for orphaned users
router.get('/users/orphaned',
    authenticateToken,
    resolveAdminCompany,
    getOrphanedUsers
);

router.delete('/users/orphaned',
    authenticateToken,
    resolveAdminCompany,
    cleanupOrphanedUsers
);

// Delivery Manager Dashboard Routes
router.get('/sellers-with-orders',
    authenticateToken,
    resolveAdminCompany,
    getSellersWithOrders
);

router.get('/delivery-executives',
    authenticateToken,
    resolveAdminCompany,
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
    authenticateToken,
    resolveAdminCompany,
    getProductQuantitiesForMenus
);

// Active executives route
router.get('/active-executives',
    authenticateToken,
    // checkRole('admin', 'delivery_manager'), // Temporarily disabled for testing
    getActiveExecutives
);

// Update executive status route
router.post('/update-executive-status',
    authenticateToken,
    // checkRole('admin', 'delivery_manager'), // Temporarily disabled for testing
    updateExecutiveStatus
);

// Save all routes route
router.post('/save-all-routes',
    authenticateToken,
    // checkRole('admin', 'delivery_manager'), // Temporarily disabled for testing
    saveAllRoutes
);

// Vehicles routes
router.get('/vehicles',
    authenticateToken,
    // checkRole('admin', 'delivery_manager'), // Temporarily disabled for testing
    getVehicles
);

router.post('/vehicles/assign',
    authenticateToken,
    // checkRole('admin', 'delivery_manager'), // Temporarily disabled for testing
    assignVehicleToExecutive
);

router.post('/vehicles/unassign',
    authenticateToken,
    // checkRole('admin', 'delivery_manager'), // Temporarily disabled for testing
    unassignVehicleFromExecutive
);

export default router; 