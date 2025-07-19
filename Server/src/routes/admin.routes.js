import express from 'express';
// import { verifyToken } from '../middleware/verifyToken.js';
import { authenticateToken } from '../middleware/authHandler.js';
import { checkRole } from '../middleware/checkRole.js';
import { adminLogin } from '../controllers/auth.controller.js';
import { createCompany ,companyList, companyDelete, createProduct, productList, getProductById, updateProduct, deleteProduct, getProductsByMealCategory, getAllActiveProducts, getMenuItemsByDate, createMenu, menuList, getMenuById, updateMenu, deleteMenu, createMenuItem, menuItemList} from '../controllers/admin.controller.js';

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

// New routes for booking page
router.get('/products/meal/:mealCategory',
    // authenticateToken,
    // checkRole('admin'),
    getProductsByMealCategory
);

router.get('/products/active',
    // authenticateToken,
    // checkRole('admin'),
    getAllActiveProducts
);

router.get('/menu-items/date/:date',
    // authenticateToken,
    // checkRole('admin'),
    getMenuItemsByDate
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

export default router; 