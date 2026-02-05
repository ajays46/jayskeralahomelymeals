import prisma from '../config/prisma.js';
import AppError from '../utils/AppError.js';
import { createCompanyService, companyListService, companyDeleteService, createProductService, productListService, getProductByIdService, updateProductService, deleteProductService, createMenuService, menuListService, getMenuByIdService, updateMenuService, deleteMenuService, createMenuItemService, menuItemListService, getMenuItemByIdService, updateMenuItemService, deleteMenuItemService, createMenuCategoryService, menuCategoryListService, getMenuCategoryByIdService, updateMenuCategoryService, deleteMenuCategoryService, createMenuItemPriceService, menuItemPriceListService, getMenuItemPriceByIdService, updateMenuItemPriceService, deleteMenuItemPriceService, getMealsByDayService, getMenusForBookingService, getAllOrdersService, updateOrderStatusService, deleteOrderService, getProductQuantitiesForMenusService, getVehiclesService, assignVehicleToExecutiveService, unassignVehicleFromExecutiveService } from '../services/admin.service.js';
import bcrypt from 'bcryptjs';
import { generateApiKey } from '../utils/helpers.js';
import { logInfo, logError, LOG_CATEGORIES } from '../utils/criticalLogger.js';

/**
 * Admin Controller - Handles all admin-related API endpoints and business logic
 * Features: Company management, product management, menu management, user management, order management, analytics
 */

export const createCompany = async (req, res, next) => {
    try {
        // Only super admin (companyId === null) can create companies
        if (req.adminCompanyId != null) {
            throw new AppError('Only super admin can create companies', 403);
        }
        const { name, address } = req.body;
      
        const company = await createCompanyService({ name, address });
        res.status(201).json({
            status: 'success',
            data: company
        });
    } catch (error) {
        next(error);
    }
}

export const companyList = async (req, res, next) => {
    try {
        const adminCompanyId = req.adminCompanyId;
        const companies = await companyListService(adminCompanyId);
        res.status(200).json({
            status: 'success',
            data: companies
        });
    } catch (error) {
        next(error);
    }
}

export const companyDelete = async (req, res, next) => {
    try {
        const { id } = req.body;
        if (req.adminCompanyId != null && id !== req.adminCompanyId) {
            throw new AppError('You can only delete your own company', 403);
        }
        const company = await companyDeleteService(id);
        res.status(200).json({
            status: 'success',
            data: company
        });
    } catch (error) {
        next(error);
    }
}

export const createProduct = async (req, res, next) => {
    try {
        const productData = req.body;
        
        // Validate required fields
        if (!productData.productName || !productData.code || !productData.companyId) {
            throw new AppError('Missing required fields: productName, code, companyId', 400);
        }
        // Company-scoped admin can only create for their company
        if (req.adminCompanyId != null && productData.companyId !== req.adminCompanyId) {
            throw new AppError('You can only create products for your company', 403);
        }

        // Check if product code already exists
        const existingProduct = await prisma.product.findUnique({
            where: { code: productData.code }
        });

        if (existingProduct) {
            throw new AppError('Product with this code already exists', 400);
        }

        // Check if company exists
        const company = await prisma.company.findUnique({
            where: { id: productData.companyId }
        });

        if (!company) {
            throw new AppError('Company not found', 404);
        }

        const product = await createProductService(productData);
        
        res.status(201).json({
            status: 'success',
            message: 'Product created successfully',
            data: product
        });
    } catch (error) {
        next(error);
    }
}

export const productList = async (req, res, next) => {
    try {
        const adminCompanyId = req.adminCompanyId;
        const products = await productListService(adminCompanyId);
        res.status(200).json({
            status: 'success',
            data: products
        });
    } catch (error) {
        next(error);
    }
}

export const getProductById = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const product = await getProductByIdService(productId);
        if (req.adminCompanyId != null && product.companyId !== req.adminCompanyId) {
            throw new AppError('You do not have access to this product', 403);
        }
        res.status(200).json({
            status: 'success',
            data: product
        });
    } catch (error) {
        next(error);
    }
}

export const updateProduct = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const productData = req.body;
        
        // Validate required fields
        if (!productData.productName || !productData.code || !productData.companyId) {
            throw new AppError('Missing required fields: productName, code, companyId', 400);
        }
        if (req.adminCompanyId != null && productData.companyId !== req.adminCompanyId) {
            throw new AppError('You can only update products for your company', 403);
        }
        const existing = await getProductByIdService(productId);
        if (req.adminCompanyId != null && existing.companyId !== req.adminCompanyId) {
            throw new AppError('You do not have access to this product', 403);
        }

        const product = await updateProductService(productId, productData);
        
        res.status(200).json({
            status: 'success',
            message: 'Product updated successfully',
            data: product
        });
    } catch (error) {
        next(error);
    }
}

export const deleteProduct = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const existing = await getProductByIdService(productId);
        if (req.adminCompanyId != null && existing.companyId !== req.adminCompanyId) {
            throw new AppError('You do not have access to this product', 403);
        }
        const deletedProduct = await deleteProductService(productId);
        
        res.status(200).json({
            status: 'success',
            message: 'Product deleted successfully',
            data: deletedProduct
        });
    } catch (error) {
        next(error);
    }
}

// Menu controllers
export const createMenu = async (req, res, next) => {
    try {
        const menuData = req.body;
        
        // Validate required fields
        if (!menuData.name || !menuData.companyId) {
            throw new AppError('Missing required fields: name, companyId', 400);
        }
        if (req.adminCompanyId != null && menuData.companyId !== req.adminCompanyId) {
            throw new AppError('You can only create menus for your company', 403);
        }

        const menu = await createMenuService(menuData);
        
        res.status(201).json({
            status: 'success',
            message: 'Menu created successfully',
            data: menu
        });
    } catch (error) {
        next(error);
    }
}

export const menuList = async (req, res, next) => {
    try {
        const adminCompanyId = req.adminCompanyId;
        const menus = await menuListService(adminCompanyId);
        res.status(200).json({
            status: 'success',
            data: menus
        });
    } catch (error) {
        next(error);
    }
}

export const getMenuById = async (req, res, next) => {
    try {
        const { menuId } = req.params;
        const menu = await getMenuByIdService(menuId);
        if (req.adminCompanyId != null && menu.companyId !== req.adminCompanyId) {
            throw new AppError('You do not have access to this menu', 403);
        }
        res.status(200).json({
            status: 'success',
            data: menu
        });
    } catch (error) {
        next(error);
    }
}

export const updateMenu = async (req, res, next) => {
    try {
        const { menuId } = req.params;
        const menuData = req.body;
        
        // Validate required fields
        if (!menuData.name || !menuData.companyId) {
            throw new AppError('Missing required fields: name, companyId', 400);
        }
        if (req.adminCompanyId != null && menuData.companyId !== req.adminCompanyId) {
            throw new AppError('You can only update menus for your company', 403);
        }
        const existingMenu = await getMenuByIdService(menuId);
        if (req.adminCompanyId != null && existingMenu.companyId !== req.adminCompanyId) {
            throw new AppError('You do not have access to this menu', 403);
        }

        const menu = await updateMenuService(menuId, menuData);
        
        res.status(200).json({
            status: 'success',
            message: 'Menu updated successfully',
            data: menu
        });
    } catch (error) {
        next(error);
    }
}

export const deleteMenu = async (req, res, next) => {
    try {
        const { menuId } = req.params;
        const existingMenu = await getMenuByIdService(menuId);
        if (req.adminCompanyId != null && existingMenu.companyId !== req.adminCompanyId) {
            throw new AppError('You do not have access to this menu', 403);
        }
        const deletedMenu = await deleteMenuService(menuId);
        
        res.status(200).json({
            status: 'success',
            message: 'Menu deleted successfully',
            data: deletedMenu
        });
    } catch (error) {
        next(error);
    }
}

// Menu Item controllers
export const createMenuItem = async (req, res, next) => {
    try {
        const menuItemData = req.body;
        
        // Validate required fields
        if (!menuItemData.name || !menuItemData.menuId) {
            throw new AppError('Missing required fields: name, menuId', 400);
        }
        if (req.adminCompanyId != null) {
            const menu = await getMenuByIdService(menuItemData.menuId);
            if (menu.companyId !== req.adminCompanyId) {
                throw new AppError('You can only add menu items to menus in your company', 403);
            }
        }

        const menuItem = await createMenuItemService(menuItemData);
        
        res.status(201).json({
            status: 'success',
            message: 'Menu item created successfully',
            data: menuItem
        });
    } catch (error) {
        next(error);
    }
}

export const menuItemList = async (req, res, next) => {
    try {
        const adminCompanyId = req.adminCompanyId;
        const menuItems = await menuItemListService(adminCompanyId);
        res.status(200).json({
            status: 'success',
            data: menuItems
        });
    } catch (error) {
        next(error);
    }
}

export const getMenuItemById = async (req, res, next) => {
    try {
        const { menuItemId } = req.params;
        const menuItem = await getMenuItemByIdService(menuItemId);
        if (req.adminCompanyId != null && menuItem.menu?.companyId !== req.adminCompanyId) {
            throw new AppError('You do not have access to this menu item', 403);
        }
        res.status(200).json({
            status: 'success',
            data: menuItem
        });
    } catch (error) {
        next(error);
    }
}

export const updateMenuItem = async (req, res, next) => {
    try {
        const { menuItemId } = req.params;
        const menuItemData = req.body;
        
        // Validate required fields
        if (!menuItemData.name || !menuItemData.menuId) {
            throw new AppError('Missing required fields: name, menuId', 400);
        }
        const existingMenuItem = await getMenuItemByIdService(menuItemId);
        if (req.adminCompanyId != null && existingMenuItem.menu?.companyId !== req.adminCompanyId) {
            throw new AppError('You do not have access to this menu item', 403);
        }
        const menu = await getMenuByIdService(menuItemData.menuId);
        if (req.adminCompanyId != null && menu.companyId !== req.adminCompanyId) {
            throw new AppError('You can only assign menu items to menus in your company', 403);
        }

        const menuItem = await updateMenuItemService(menuItemId, menuItemData);
        
        res.status(200).json({
            status: 'success',
            message: 'Menu item updated successfully',
            data: menuItem
        });
    } catch (error) {
        next(error);
    }
}

export const deleteMenuItem = async (req, res, next) => {
    try {
        const { menuItemId } = req.params;
        const existingMenuItem = await getMenuItemByIdService(menuItemId);
        if (req.adminCompanyId != null && existingMenuItem.menu?.companyId !== req.adminCompanyId) {
            throw new AppError('You do not have access to this menu item', 403);
        }
        const deletedMenuItem = await deleteMenuItemService(menuItemId);
        
        res.status(200).json({
            status: 'success',
            message: 'Menu item deleted successfully',
            data: deletedMenuItem
        });
    } catch (error) {
        next(error);
    }
}

// Menu Category controllers
export const createMenuCategory = async (req, res, next) => {
    try {
        const menuCategoryData = req.body;
        
        // Validate required fields
        if (!menuCategoryData.name || !menuCategoryData.companyId || !menuCategoryData.menuId) {
            throw new AppError('Missing required fields: name, companyId, menuId', 400);
        }
        if (req.adminCompanyId != null && menuCategoryData.companyId !== req.adminCompanyId) {
            throw new AppError('You can only create menu categories for your company', 403);
        }

        const menuCategory = await createMenuCategoryService(menuCategoryData);
        
        res.status(201).json({
            status: 'success',
            message: 'Menu category created successfully',
            data: menuCategory
        });
    } catch (error) {
        next(error);
    }
}

export const menuCategoryList = async (req, res, next) => {
    try {
        const adminCompanyId = req.adminCompanyId;
        const menuCategories = await menuCategoryListService(adminCompanyId);
        res.status(200).json({
            status: 'success',
            data: menuCategories
        });
    } catch (error) {
        next(error);
    }
}

export const getMenuCategoryById = async (req, res, next) => {
    try {
        const { menuCategoryId } = req.params;
        const menuCategory = await getMenuCategoryByIdService(menuCategoryId);
        if (req.adminCompanyId != null && menuCategory.companyId !== req.adminCompanyId) {
            throw new AppError('You do not have access to this menu category', 403);
        }
        res.status(200).json({
            status: 'success',
            data: menuCategory
        });
    } catch (error) {
        next(error);
    }
}

export const updateMenuCategory = async (req, res, next) => {
    try {
        const { menuCategoryId } = req.params;
        const menuCategoryData = req.body;
        
        // Validate required fields
        if (!menuCategoryData.name || !menuCategoryData.companyId || !menuCategoryData.menuId) {
            throw new AppError('Missing required fields: name, companyId, menuId', 400);
        }
        if (req.adminCompanyId != null && menuCategoryData.companyId !== req.adminCompanyId) {
            throw new AppError('You can only update menu categories for your company', 403);
        }
        const existingCategory = await getMenuCategoryByIdService(menuCategoryId);
        if (req.adminCompanyId != null && existingCategory.companyId !== req.adminCompanyId) {
            throw new AppError('You do not have access to this menu category', 403);
        }

        const menuCategory = await updateMenuCategoryService(menuCategoryId, menuCategoryData);
        
        res.status(200).json({
            status: 'success',
            message: 'Menu category updated successfully',
            data: menuCategory
        });
    } catch (error) {
        next(error);
    }
}

export const deleteMenuCategory = async (req, res, next) => {
    try {
        const { menuCategoryId } = req.params;
        const existingCategory = await getMenuCategoryByIdService(menuCategoryId);
        if (req.adminCompanyId != null && existingCategory.companyId !== req.adminCompanyId) {
            throw new AppError('You do not have access to this menu category', 403);
        }
        const deletedMenuCategory = await deleteMenuCategoryService(menuCategoryId);
        
        res.status(200).json({
            status: 'success',
            message: 'Menu category deleted successfully',
            data: deletedMenuCategory
        });
    } catch (error) {
        next(error);
    }
}

// Menu Item Price controllers
export const createMenuItemPrice = async (req, res, next) => {
    try {
        const menuItemPriceData = req.body;
        
        // Validate required fields
        if (!menuItemPriceData.companyId || !menuItemPriceData.menuItemId || !menuItemPriceData.totalPrice) {
            throw new AppError('Missing required fields: companyId, menuItemId, totalPrice', 400);
        }
        if (req.adminCompanyId != null && menuItemPriceData.companyId !== req.adminCompanyId) {
            throw new AppError('You can only create menu item prices for your company', 403);
        }

        const menuItemPrice = await createMenuItemPriceService(menuItemPriceData);
        
        res.status(201).json({
            status: 'success',
            message: 'Menu item price created successfully',
            data: menuItemPrice
        });
    } catch (error) {
        next(error);
    }
}

export const menuItemPriceList = async (req, res, next) => {
    try {
        const adminCompanyId = req.adminCompanyId;
        const menuItemPrices = await menuItemPriceListService(adminCompanyId);
        res.status(200).json({
            status: 'success',
            data: menuItemPrices
        });
    } catch (error) {
        next(error);
    }
}

export const getMenuItemPriceById = async (req, res, next) => {
    try {
        const { menuItemPriceId } = req.params;
        const menuItemPrice = await getMenuItemPriceByIdService(menuItemPriceId);
        if (req.adminCompanyId != null && menuItemPrice.companyId !== req.adminCompanyId) {
            throw new AppError('You do not have access to this menu item price', 403);
        }
        res.status(200).json({
            status: 'success',
            data: menuItemPrice
        });
    } catch (error) {
        next(error);
    }
}

export const updateMenuItemPrice = async (req, res, next) => {
    try {
        const { menuItemPriceId } = req.params;
        const menuItemPriceData = req.body;
        
        // Validate required fields
        if (!menuItemPriceData.companyId || !menuItemPriceData.menuItemId || !menuItemPriceData.totalPrice) {
            throw new AppError('Missing required fields: companyId, menuItemId, totalPrice', 400);
        }
        if (req.adminCompanyId != null && menuItemPriceData.companyId !== req.adminCompanyId) {
            throw new AppError('You can only update menu item prices for your company', 403);
        }
        const existingPrice = await getMenuItemPriceByIdService(menuItemPriceId);
        if (req.adminCompanyId != null && existingPrice.companyId !== req.adminCompanyId) {
            throw new AppError('You do not have access to this menu item price', 403);
        }

        const menuItemPrice = await updateMenuItemPriceService(menuItemPriceId, menuItemPriceData);
        
        res.status(200).json({
            status: 'success',
            message: 'Menu item price updated successfully',
            data: menuItemPrice
        });
    } catch (error) {
        next(error);
    }
}

export const deleteMenuItemPrice = async (req, res, next) => {
    try {
        const { menuItemPriceId } = req.params;
        const existingPrice = await getMenuItemPriceByIdService(menuItemPriceId);
        if (req.adminCompanyId != null && existingPrice.companyId !== req.adminCompanyId) {
            throw new AppError('You do not have access to this menu item price', 403);
        }
        const deletedMenuItemPrice = await deleteMenuItemPriceService(menuItemPriceId);
        
        res.status(200).json({
            status: 'success',
            message: 'Menu item price deleted successfully',
            data: deletedMenuItemPrice
        });
    } catch (error) {
        next(error);
    }
}

// Get meals by day of the week
export const getMealsByDay = async (req, res, next) => {
    try {
        const { day } = req.query;
        
        
        // Validate day parameter
        if (!day) {
            throw new AppError('Day parameter is required', 400);
        }

        // Validate day format
        const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        if (!validDays.includes(day.toLowerCase())) {
            throw new AppError('Invalid day. Must be one of: monday, tuesday, wednesday, thursday, friday, saturday, sunday', 400);
        }

        const adminCompanyId = req.adminCompanyId ?? undefined;
        const mealsData = await getMealsByDayService(day, adminCompanyId);
        
        res.status(200).json({
            status: 'success',
            data: mealsData
        });
    } catch (error) {
        next(error);
    }
}

// Get menus with categories and menu items for booking page
export const getMenusForBooking = async (req, res, next) => {
    try {
        const menus = await getMenusForBookingService();
        
        res.status(200).json({
            status: 'success',
            data: menus
        });
    } catch (error) {
        next(error);
    }
};

// Admin Order Management
export const getAllOrders = async (req, res, next) => {
    try {
        const { status, startDate, endDate, orderTime, page = 1, limit = 10 } = req.query;
        
        const filters = {
            status,
            startDate,
            endDate,
            orderTime,
            page: parseInt(page),
            limit: parseInt(limit)
        };
        const adminCompanyId = req.adminCompanyId ?? undefined;

        const orders = await getAllOrdersService(filters, adminCompanyId);
        
        res.status(200).json({
            status: 'success',
            data: orders
        });
    } catch (error) {
        next(error);
    }
};

export const updateOrderStatus = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        
        if (!status) {
            throw new AppError('Status is required', 400);
        }

        // Company-scoped admin can only update orders for their company's users
        if (req.adminCompanyId != null) {
            const existingOrder = await prisma.order.findUnique({
                where: { id: orderId },
                include: { user: { select: { companyId: true } } }
            });
            if (!existingOrder || existingOrder.user.companyId !== req.adminCompanyId) {
                throw new AppError('You do not have access to this order', 403);
            }
        }

        const order = await updateOrderStatusService(orderId, status);
        
        res.status(200).json({
            status: 'success',
            message: 'Order status updated successfully',
            data: order
        });
    } catch (error) {
        next(error);
    }
};

export const deleteOrder = async (req, res, next) => {
    try {
        const { orderId } = req.params;

        // Company-scoped admin can only delete orders for their company's users
        if (req.adminCompanyId != null) {
            const existingOrder = await prisma.order.findUnique({
                where: { id: orderId },
                include: { user: { select: { companyId: true } } }
            });
            if (!existingOrder || existingOrder.user.companyId !== req.adminCompanyId) {
                throw new AppError('You do not have access to this order', 403);
            }
        }
        
        const deletedOrder = await deleteOrderService(orderId);
        
        res.status(200).json({
            status: 'success',
            message: 'Order deleted successfully',
            data: deletedOrder
        });
    } catch (error) {
        next(error);
    }
};

// Admin User Management
export const createAdminUser = async (req, res, next) => {
    try {
        const { email, phone, password, role, roles, companyId, contact } = req.body;
        // Get the admin ID from the authenticated user's JWT token
        const adminId = req.user.userId;
        
        // Validate required fields
        if (!email || !phone || !password || !companyId) {
            throw new AppError('All fields are required: email, phone, password, companyId', 400);
        }

        // Determine roles to assign
        let rolesToAssign = [];
        if (roles && Array.isArray(roles) && roles.length > 0) {
            // Multiple roles provided
            rolesToAssign = roles;
        } else if (role) {
            // Single role provided (backward compatibility)
            rolesToAssign = [role];
        } else {
            throw new AppError('At least one role is required', 400);
        }

        // Validate roles
        const validRoles = ['ADMIN', 'SELLER', 'USER', 'DELIVERY_EXECUTIVE', 'DELIVERY_MANAGER', 'CEO', 'CFO'];
        const invalidRoles = rolesToAssign.filter(r => !validRoles.includes(r));
        if (invalidRoles.length > 0) {
            throw new AppError(`Invalid roles: ${invalidRoles.join(', ')}. Valid roles are: ${validRoles.join(', ')}`, 400);
        }

        // Validate contact information if provided
        if (contact && (!contact.firstName || !contact.lastName)) {
            throw new AppError('Contact information requires both firstName and lastName', 400);
        }

        // Company-scoped admin can only create users for their company
        if (req.adminCompanyId != null && companyId !== req.adminCompanyId) {
            throw new AppError('You can only create users for your company', 403);
        }

        // Check if company exists
        const company = await prisma.company.findUnique({
            where: { id: companyId }
        });

        if (!company) {
            throw new AppError('Company not found', 404);
        }

        // Check if email already exists
        const existingAuth = await prisma.auth.findUnique({ 
            where: { email } 
        });
        if (existingAuth) {
            throw new AppError('Email already registered', 409);
        }

        // Check if phone number already exists
        const existingPhone = await prisma.auth.findFirst({ 
            where: { phoneNumber: phone } 
        });
        if (existingPhone) {
            throw new AppError('This phone number is already registered', 400);
        }

        // Hash password and generate API key
        const hashedPassword = await bcrypt.hash(password, 10);
        const api_key = generateApiKey();

        // Use a transaction to ensure all records are created together
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Auth record
            const auth = await tx.auth.create({
                data: {
                    email,
                    password: hashedPassword,
                    phoneNumber: phone,
                    apiKey: api_key,
                    status: 'ACTIVE'
                }
            });

            // 2. Create User record with company association
            const user = await tx.user.create({
                data: {
                    authId: auth.id,
                    status: 'ACTIVE',
                    companyId: companyId,
                    createdBy: adminId || null // Track which admin created this user
                }
            });

            // 3. Create UserRoles (multiple roles support)
            const userRoles = [];
            for (const roleName of rolesToAssign) {
                const userRole = await tx.userRole.create({
                    data: {
                        userId: user.id,
                        name: roleName
                    }
                });
                userRoles.push(userRole);
            }

            // 4. Create Contact record if contact information is provided
            let contactRecord = null;
            if (contact && contact.firstName && contact.lastName) {
                contactRecord = await tx.contact.create({
                    data: {
                        userId: user.id,
                        firstName: contact.firstName,
                        lastName: contact.lastName
                    }
                });

                // 5. Create PhoneNumber records if provided
                if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
                    for (const phoneData of contact.phoneNumbers) {
                        await tx.phoneNumber.create({
                            data: {
                                contactId: contactRecord.id,
                                type: phoneData.type || 'PRIMARY',
                                number: phoneData.number
                            }
                        });
                    }
                }
            }

            return {
                id: user.id,
                email: auth.email,
                phone: auth.phoneNumber,
                roles: userRoles.map(ur => ur.name),
                primaryRole: userRoles[0]?.name, // First role as primary for backward compatibility
                company: company.name,
                companyId: company.id,
                status: user.status,
                createdAt: user.createdAt,
                contact: contactRecord ? {
                    firstName: contactRecord.firstName,
                    lastName: contactRecord.lastName
                } : null
            };
        });

        res.status(201).json({
            status: 'success',
            message: 'User created successfully',
            data: result
        });
        
    } catch (error) {
        next(error);
    }
};

export const getAdminUsers = async (req, res, next) => {
    try {
        // Super admin (companyId === null) sees all; company admin sees only their company's users
        const where = req.adminCompanyId != null
            ? { companyId: req.adminCompanyId }
            : {};
        const users = await prisma.user.findMany({
            where,
            include: {
                auth: true,
                userRoles: true,
                company: true,
                contacts: {
                    include: {
                        phoneNumbers: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Filter out users without auth records and only include specific roles
        const allowedRoles = ['CEO', 'CFO', 'ADMIN', 'SELLER', 'DELIVERY_EXECUTIVE', 'DELIVERY_MANAGER', 'USER'];
        const transformedUsers = users
            .filter(user => {
                // Only include users with valid auth records
                if (!user.auth || !user.auth.email) return false;
                
                // Only include users with allowed roles
                const userRole = user.userRoles[0]?.name;
                return userRole && allowedRoles.includes(userRole);
            })
            .map(user => ({
                id: user.id,
                name: user.auth?.email?.split('@')[0] || 'Unknown User', // Use email prefix as name
                email: user.auth?.email || 'No Email',
                phone: user.auth?.phoneNumber || 'No Phone',
                roles: user.userRoles.map(ur => ur.name), // All roles
                primaryRole: user.userRoles[0]?.name || 'USER', // First role as primary for backward compatibility
                company: user.company?.name || 'No Company',
                companyId: user.companyId,
                status: user.status,
                createdAt: user.createdAt,
                createdBy: user.createdBy,
                contact: user.contacts && user.contacts.length > 0 ? {
                    firstName: user.contacts[0].firstName,
                    lastName: user.contacts[0].lastName,
                    phoneNumbers: user.contacts[0].phoneNumbers
                } : null
            }));

        res.status(200).json({
            status: 'success',
            data: transformedUsers,
            total: transformedUsers.length,
            message: `Found ${transformedUsers.length} users with valid auth records`
        });
        
    } catch (error) {
        logError(LOG_CATEGORIES.SYSTEM, 'Error fetching admin users', {
            error: error.message,
            stack: error.stack
        });
        
        // Send a more user-friendly error response
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch users. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Get sellers with their orders for users
export const getSellersWithOrders = async (req, res, next) => {
    try {
        // Super admin (companyId === null) sees all; company admin sees only their company's sellers
        const where = req.adminCompanyId != null
            ? { companyId: req.adminCompanyId }
            : {};
        // Get users with SELLER role (optionally scoped by company)
        const sellers = await prisma.user.findMany({
            where,
            include: {
                auth: true,
                userRoles: true,
                company: true,
                contacts: {
                    include: {
                        phoneNumbers: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Filter only sellers with valid auth records
        const validSellers = sellers.filter(user => {
            // Only include users with valid auth records and SELLER role
            if (!user.auth || !user.auth.email) return false;
            const userRole = user.userRoles[0]?.name;
            return userRole === 'SELLER';
        });

        // Process each seller
        const sellersWithOrders = await Promise.all(
            validSellers.map(async (seller) => {
                try {
                    // Fetch real orders placed by users created by this seller
                    // Sellers create users via createContactOnly, and these users have createdBy = seller.id
                    let orders = [];
                    let totalRevenue = 0;
                    
                    // Get users created by this seller
                    const sellerUsers = await prisma.user.findMany({
                        where: {
                            createdBy: seller.id
                        },
                        select: { id: true }
                    });
                    
                    const userIds = sellerUsers.map(user => user.id);
                    
                    if (userIds.length > 0) {
                        // Get orders placed by these users
                        orders = await prisma.order.findMany({
                            where: {
                                userId: { in: userIds }
                            },
                            include: {
                                user: {
                                    include: {
                                        auth: true,
                                        contacts: {
                                            include: {
                                                phoneNumbers: true
                                            }
                                        }
                                    }
                                },
                                deliveryItems: {
                                    include: {
                                        menuItem: {
                                            include: {
                                                product: true,
                                                prices: true
                                            }
                                        },
                                        deliveryAddress: {
                                            select: {
                                                id: true,
                                                street: true,
                                                housename: true,
                                                city: true,
                                                pincode: true,
                                                geoLocation: true,
                                                googleMapsUrl: true,
                                                addressType: true
                                            }
                                        }
                                    }
                                },
                                payments: {
                                    include: {
                                        paymentReceipts: true
                                    }
                                }
                            },
                            orderBy: {
                                createdAt: 'desc'
                            },
                            take: 10 // Limit to recent 10 orders
                        });
                        // Calculate total revenue
                        totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
                    }
                    
                    // Transform orders to match the expected format
                    const transformedOrders = orders.map(order => {
                        return {
                            id: order.id,
                            customerName: order.user?.contacts?.[0]?.firstName || order.user?.auth?.email?.split('@')[0] || 'User',
                            customerPhone: order.user?.contacts?.[0]?.phoneNumbers?.[0]?.number || order.user?.auth?.phoneNumber || 'No phone',
                            customerEmail: order.user?.auth?.email || 'No email',
                            totalPrice: order.totalPrice || 0,
                            status: order.status || 'PENDING',
                            createdAt: order.createdAt,
                            deliveryItems: order.deliveryItems?.map(item => {
                                return {
                                    id: item.id,
                                    orderId: item.orderId,
                                    menuItem: {
                                        name: item.menuItem?.name || 'Unknown Item',
                                        price: item.menuItem?.prices?.[0]?.totalPrice || 0,
                                        product: item.menuItem?.product || null
                                    },
                                    quantity: item.quantity,
                                    deliveryDate: item.deliveryDate,
                                    deliveryTimeSlot: item.deliveryTimeSlot,
                                    status: item.status,
                                    address: item.deliveryAddress || null
                                };
                            }) || [],
                            paymentReceipts: order.payments?.flatMap(payment => 
                                payment.paymentReceipts?.map(receipt => ({
                                    id: receipt.id,
                                    imageUrl: receipt.receiptImageUrl,
                                    receiptUrl: payment.receiptUrl
                                })) || []
                            ) || []
                        };
                    });

                    return {
                        id: seller.id,
                        name: seller.auth.email.split('@')[0],
                        email: seller.auth.email,
                        phone: seller.auth.phoneNumber || 'No Phone',
                        role: seller.userRoles[0]?.name || 'SELLER',
                        company: seller.company?.name || 'No Company',
                        companyId: seller.companyId,
                        status: seller.status,
                        createdAt: seller.createdAt,
                        orderCount: transformedOrders.length,
                        totalRevenue: totalRevenue,
                        recentOrders: transformedOrders
                    };
                } catch (error) {
                    logError(LOG_CATEGORIES.SYSTEM, `Error processing seller ${seller.id}`, {
                        sellerId: seller.id,
                        error: error.message,
                        stack: error.stack
                    });
                    return {
                        id: seller.id,
                        name: seller.auth.email.split('@')[0],
                        email: seller.auth.email,
                        phone: seller.auth.phoneNumber || 'No Phone',
                        role: seller.userRoles[0]?.name || 'SELLER',
                        company: seller.company?.name || 'No Company',
                        companyId: seller.companyId,
                        status: seller.status,
                        createdAt: seller.createdAt,
                        orderCount: 0,
                        totalRevenue: 0,
                        recentOrders: []
                    };
                }
            })
        );

        res.status(200).json({
            status: 'success',
            data: sellersWithOrders,
            total: sellersWithOrders.length,
            message: `Found ${sellersWithOrders.length} sellers`
        });
        
    } catch (error) {
        logError(LOG_CATEGORIES.SYSTEM, 'Error fetching sellers with orders', {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch sellers with orders. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Get delivery executives
export const getDeliveryExecutives = async (req, res, next) => {
    try {
        // Super admin (companyId === null) sees all; company admin sees only their company's executives
        const where = req.adminCompanyId != null
            ? { companyId: req.adminCompanyId }
            : {};
        const executives = await prisma.user.findMany({
            where,
            include: {
                auth: true,
                userRoles: true,
                company: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Filter only delivery executives with valid auth records
        const deliveryExecutives = executives
            .filter(user => {
                // Only include users with valid auth records and DELIVERY_EXECUTIVE role
                if (!user.auth || !user.auth.email) return false;
                const userRole = user.userRoles[0]?.name;
                return userRole === 'DELIVERY_EXECUTIVE';
            })
            .map(executive => ({
                id: executive.id,
                name: executive.auth.email.split('@')[0],
                email: executive.auth.email,
                phoneNumber: executive.auth.phoneNumber || 'No phone',
                role: executive.userRoles[0]?.name || 'DELIVERY_EXECUTIVE',
                companyName: executive.company?.name || 'No Company',
                companyId: executive.companyId,
                status: executive.status,
                currentStatus: 'Available', // You might want to track this separately
                joinedDate: executive.createdAt,
                lastActive: executive.updatedAt || executive.createdAt,
                createdAt: executive.createdAt
            }));

        res.status(200).json({
            status: 'success',
            data: deliveryExecutives,
            total: deliveryExecutives.length,
            message: `Found ${deliveryExecutives.length} delivery executives`
        });
        
    } catch (error) {
        logError(LOG_CATEGORIES.SYSTEM, 'Error fetching delivery executives', {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch delivery executives. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Proxy route planning endpoint
export const proxyRoutePlanning = async (req, res, next) => {
    try {

        
        // Call the external route planning API
        const response = await fetch(`${process.env.AI_ROUTE_API}/trigger`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer mysecretkey123',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                timestamp: new Date().toISOString(),
                source: req.body.source || 'delivery-manager-dashboard',
                userAgent: req.body.userAgent || 'unknown',
                dashboardVersion: req.body.dashboardVersion || '1.0.0'
            })
        });
        
        if (!response.ok) {
            throw new Error(`External API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        res.status(200).json({
            success: true,
            message: 'Route planning initiated successfully',
            timestamp: new Date().toISOString(),
            data: {
                status: 'initiated',
                requestId: `rp-${Date.now()}`,
                externalResponse: data,
                estimatedCompletion: '5 minutes'
            }
        });
        
    } catch (error) {
        logError(LOG_CATEGORIES.SYSTEM, 'Error in route planning proxy', {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: 'Failed to initiate route planning',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Proxy executive count endpoint
export const proxyExecutiveCount = async (req, res, next) => {
    try {

        
        const { executiveCount, timestamp, source, userAgent, dashboardVersion } = req.body;
        
        if (!executiveCount || executiveCount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid executive count provided'
            });
        }
        
        // Send executive count to EC2 instance (one-way POST, no response needed)
        await fetch(`${process.env.AI_ROUTE_API}/executive-count`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer mysecretkey123',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                executiveCount: executiveCount,
                timestamp: timestamp || new Date().toISOString(),
                source: source || 'delivery-manager-dashboard',
                userAgent: userAgent || 'unknown',
                dashboardVersion: dashboardVersion || '1.0.0'
            })
        });
        
        // Don't wait for response, just confirm the request was sent
        res.status(200).json({
            success: true,
            message: 'Executive count sent to EC2 instance',
            timestamp: new Date().toISOString(),
            data: {
                status: 'sent',
                requestId: `ec-${Date.now()}`,
                executiveCount: executiveCount,
                message: 'Count sent to route planning system'
            }
        });
        
    } catch (error) {
        logError(LOG_CATEGORIES.SYSTEM, 'Error in executive count proxy', {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: 'Failed to send executive count',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Poll for results from external API
const pollForResults = async (requestId, maxAttempts = 30, intervalMs = 2000) => {
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            
            const statusResponse = await fetch(`${process.env.AI_ROUTE_API}/status/${requestId}`, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer mysecretkey123',
                    'Content-Type': 'application/json'
                }
            });
            
            if (!statusResponse.ok) {
                if (attempt === maxAttempts) {
                    throw new Error(`Status check failed after ${maxAttempts} attempts`);
                }
                await new Promise(resolve => setTimeout(resolve, intervalMs));
                continue;
            }
            
            const statusData = await statusResponse.json();
            
            // Check if processing is complete
            if (statusData.status === 'completed' || statusData.status === 'success') {
                return statusData;
            }
            
            // Check if processing failed
            if (statusData.status === 'failed' || statusData.status === 'error') {
                throw new Error(`Processing failed: ${statusData.message || 'Unknown error'}`);
            }
            
            // Still processing, wait and try again
            if (statusData.status === 'processing' || statusData.status === 'running') {
                if (attempt === maxAttempts) {
                    throw new Error(`Processing timeout after ${maxAttempts} attempts`);
                }
                await new Promise(resolve => setTimeout(resolve, intervalMs));
                continue;
            }
            
            // Unknown status
            if (attempt === maxAttempts) {
                throw new Error(`Unknown status after ${maxAttempts} attempts: ${statusData.status}`);
            }
            await new Promise(resolve => setTimeout(resolve, intervalMs));
            
        } catch (error) {
            logError(LOG_CATEGORIES.SYSTEM, `Polling attempt ${attempt} failed`, {
                attempt: attempt,
                maxAttempts: maxAttempts,
                error: error.message,
                stack: error.stack
            });
            if (attempt === maxAttempts) {
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, intervalMs));
        }
    }
    
    throw new Error(`Polling timeout after ${maxAttempts} attempts`);
};

// Proxy run script endpoint for program execution
export const proxyRunScript = async (req, res, next) => {
    try {

        
        const { executiveCount, timestamp, source, userAgent, dashboardVersion, session, executive } = req.body;
        
        if (!executiveCount || executiveCount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid executive count provided'
            });
        }

        // Prepare the request body with all required fields
        const requestBody = {
            num_drivers: executiveCount,
            session: session ,
            executive: executive ,
        };
        
        
        // Call the external run-script API
        const response = await fetch(`${process.env.AI_ROUTE_API}/run-script`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer mysecretkey123',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`External API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check if the program is running in background and needs polling
        if (data.status === 'processing' && data.requestId) {
            
            // Start polling for results
            const finalResult = await pollForResults(data.requestId);
            
            res.status(200).json({
                success: true,
                message: 'Program executed successfully',
                timestamp: new Date().toISOString(),
                data: {
                    status: 'completed',
                    requestId: data.requestId,
                    numDrivers: executiveCount,
                    externalResponse: finalResult,
                    executionTime: new Date().toISOString()
                }
            });
        } else {
            // Immediate response (not processing)
            res.status(200).json({
                success: true,
                message: 'Program executed successfully',
                timestamp: new Date().toISOString(),
                data: {
                    status: 'completed',
                    requestId: `ps-${Date.now()}`,
                    numDrivers: executiveCount,
                    externalResponse: data,
                    executionTime: new Date().toISOString()
                }
            });
        }
        
    } catch (error) {
        logError(LOG_CATEGORIES.SYSTEM, 'Error in program execution proxy', {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: 'Failed to execute program',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Proxy send routes endpoint for WhatsApp messaging
export const proxySendRoutes = async (req, res, next) => {
    try {
        const { executiveCount, timestamp, source, userAgent, dashboardVersion } = req.body;
        
        if (!executiveCount || executiveCount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid executive count provided for WhatsApp messaging'
            });
        }
        
        // Call the external send_routes API
        const response = await fetch(`${process.env.AI_ROUTE_API}/send-reports`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer mysecretkey123',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                executiveCount: executiveCount,
                timestamp: timestamp || new Date().toISOString(),
                source: source || 'delivery-manager-dashboard',
                userAgent: userAgent || 'unknown',
                dashboardVersion: dashboardVersion || '1.0.0'
            })
        });
        
        if (!response.ok) {
            throw new Error(`External API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        res.status(200).json({
            success: true,
            message: 'WhatsApp messages sent successfully',
            timestamp: new Date().toISOString(),
            data: {
                status: 'completed',
                requestId: `wr-${Date.now()}`,
                executiveCount: executiveCount,
                externalResponse: data,
                executionTime: new Date().toISOString()
            }
        });
        
    } catch (error) {
        logError(LOG_CATEGORIES.SYSTEM, 'Error in send routes proxy', {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: 'Failed to send WhatsApp messages',
            error: process.env.NODE_ENV === 'response.env' ? error.message : 'Internal server error'
        });
    }
};

// Proxy file content endpoint to avoid CORS issues
export const proxyFileContent = async (req, res, next) => {
    try {
        const { url, filename } = req.body;
        
        if (!url || !filename) {
            return res.status(400).json({
                success: false,
                message: 'URL and filename are required'
            });
        }
        

        
        // Fetch the file content from the external URL
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'text/plain,text/html,*/*',
                'User-Agent': 'JAYSKERALAHM-DeliveryManager/1.0'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }
        
        // Get the content as text
        const content = await response.text();
        

        
        res.status(200).json({
            success: true,
            message: 'File content fetched successfully',
            filename: filename,
            content: content,
            contentLength: content.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        logError(LOG_CATEGORIES.SYSTEM, 'Error fetching file content', {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch file content',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

export const proxySessionData = async (req, res, next) => {
    try {
        // Call the external delivery_data API with specific parameters
        const response = await fetch(`${process.env.AI_ROUTE_API}/delivery_data`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer mysecretkey123',
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`External API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        res.status(200).json({
            success: true,
            message: 'Delivery data fetched successfully',
            timestamp: new Date().toISOString(),
            data: {
                status: 'completed',
                requestId: `sd-${Date.now()}`,
                externalResponse: data,
                executionTime: new Date().toISOString(),
                endpoint: 'delivery_data'
            }
        });
        
    } catch (error) {
        logError(LOG_CATEGORIES.SYSTEM, 'Error in delivery data proxy', {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch delivery data',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};


// Utility function to identify orphaned users (users without valid auth records)
export const getOrphanedUsers = async (req, res, next) => {
    try {
        // Super admin sees all; company admin sees only their company's users
        const where = req.adminCompanyId != null
            ? { companyId: req.adminCompanyId }
            : {};
        const allUsers = await prisma.user.findMany({
            where,
            select: {
                id: true,
                authId: true,
                createdAt: true,
                updatedAt: true,
                status: true
            }
        });

        const orphanedUsers = [];
        
        for (const user of allUsers) {
            try {
                const auth = await prisma.auth.findUnique({
                    where: { id: user.authId }
                });
                
                if (!auth) {
                    orphanedUsers.push(user);
                }
            } catch (error) {
                // If there's an error finding the auth record, consider it orphaned
                orphanedUsers.push(user);
            }
        }

        res.status(200).json({
            status: 'success',
            data: orphanedUsers,
            count: orphanedUsers.length,
            message: `Found ${orphanedUsers.length} orphaned users without valid auth records`
        });
        
    } catch (error) {
        logError(LOG_CATEGORIES.SYSTEM, 'Error fetching orphaned users', {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch orphaned users',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Utility function to clean up orphaned users (use with caution)
export const cleanupOrphanedUsers = async (req, res, next) => {
    try {
        const { confirm } = req.body;
        
        if (confirm !== 'true') {
            return res.status(400).json({
                status: 'error',
                message: 'Confirmation required. Send { "confirm": "true" } to proceed.'
            });
        }

        // Super admin cleans all; company admin cleans only their company's users
        const where = req.adminCompanyId != null
            ? { companyId: req.adminCompanyId }
            : {};
        const allUsers = await prisma.user.findMany({
            where,
            select: {
                id: true,
                authId: true
            }
        });

        const usersToDelete = [];
        
        for (const user of allUsers) {
            try {
                const auth = await prisma.auth.findUnique({
                    where: { id: user.authId }
                });
                
                if (!auth) {
                    usersToDelete.push(user.id);
                }
            } catch (error) {
                // If there's an error finding the auth record, mark for deletion
                usersToDelete.push(user.id);
            }
        }

        if (usersToDelete.length === 0) {
            return res.status(200).json({
                status: 'success',
                message: 'No orphaned users found to clean up',
                deletedCount: 0
            });
        }

        // Delete orphaned users
        const result = await prisma.user.deleteMany({
            where: {
                id: {
                    in: usersToDelete
                }
            }
        });

        res.status(200).json({
            status: 'success',
            message: `Cleaned up ${result.count} orphaned users`,
            deletedCount: result.count
        });
        
    } catch (error) {
        logError(LOG_CATEGORIES.SYSTEM, 'Error cleaning up orphaned users', {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            status: 'error',
            message: 'Failed to clean up orphaned users',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Get product quantities for menus
export const getProductQuantitiesForMenus = async (req, res, next) => {
    try {
        const adminCompanyId = req.adminCompanyId ?? undefined;
        const productQuantities = await getProductQuantitiesForMenusService(adminCompanyId);
        
        res.status(200).json({
            status: 'success',
            data: productQuantities
        });
    } catch (error) {
        next(error);
    }
};

// Add additional roles to existing user
export const addUserRoles = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { roles } = req.body;

        if (!roles || !Array.isArray(roles) || roles.length === 0) {
            throw new AppError('Roles array is required', 400);
        }

        // Validate roles
        const validRoles = ['ADMIN', 'SELLER', 'USER', 'DELIVERY_EXECUTIVE', 'DELIVERY_MANAGER', 'CEO', 'CFO'];
        const invalidRoles = roles.filter(r => !validRoles.includes(r));
        if (invalidRoles.length > 0) {
            throw new AppError(`Invalid roles: ${invalidRoles.join(', ')}. Valid roles are: ${validRoles.join(', ')}`, 400);
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { userRoles: true }
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Company-scoped admin can only manage users in their company
        if (req.adminCompanyId != null && user.companyId !== req.adminCompanyId) {
            throw new AppError('You do not have access to this user', 403);
        }

        // Get existing role names
        const existingRoles = user.userRoles.map(ur => ur.name);
        
        // Filter out roles that already exist
        const newRoles = roles.filter(role => !existingRoles.includes(role));

        if (newRoles.length === 0) {
            return res.status(200).json({
                status: 'success',
                message: 'All specified roles already exist for this user',
                data: {
                    userId: user.id,
                    existingRoles: existingRoles,
                    newRoles: []
                }
            });
        }

        // Create new roles using createMany
        await prisma.userRole.createMany({
            data: newRoles.map(roleName => ({
                userId: user.id,
                name: roleName
            }))
        });

        // Get updated user with all roles
        const updatedUser = await prisma.user.findUnique({
            where: { id: userId },
            include: { 
                userRoles: true,
                auth: true,
                company: true
            }
        });

        res.status(200).json({
            status: 'success',
            message: `Successfully added ${newRoles.length} new role(s) to user`,
            data: {
                userId: user.id,
                email: updatedUser.auth?.email,
                allRoles: updatedUser.userRoles.map(ur => ur.name),
                addedRoles: newRoles,
                existingRoles: existingRoles
            }
        });

    } catch (error) {
        next(error);
    }
};

// Remove roles from user
export const removeUserRoles = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { roles } = req.body;

        if (!roles || !Array.isArray(roles) || roles.length === 0) {
            throw new AppError('Roles array is required', 400);
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { userRoles: true }
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Company-scoped admin can only manage users in their company
        if (req.adminCompanyId != null && user.companyId !== req.adminCompanyId) {
            throw new AppError('You do not have access to this user', 403);
        }

        // Get existing role names
        const existingRoles = user.userRoles.map(ur => ur.name);
        
        // Filter roles that actually exist
        const rolesToRemove = roles.filter(role => existingRoles.includes(role));

        if (rolesToRemove.length === 0) {
            return res.status(200).json({
                status: 'success',
                message: 'None of the specified roles exist for this user',
                data: {
                    userId: user.id,
                    existingRoles: existingRoles,
                    removedRoles: []
                }
            });
        }

        // Remove roles
        await prisma.userRole.deleteMany({
            where: {
                userId: user.id,
                name: { in: rolesToRemove }
            }
        });

        // Get updated user with remaining roles
        const updatedUser = await prisma.user.findUnique({
            where: { id: userId },
            include: { 
                userRoles: true,
                auth: true,
                company: true
            }
        });

        res.status(200).json({
            status: 'success',
            message: `Successfully removed ${rolesToRemove.length} role(s) from user`,
            data: {
                userId: user.id,
                email: updatedUser.auth?.email,
                remainingRoles: updatedUser.userRoles.map(ur => ur.name),
                removedRoles: rolesToRemove,
                previousRoles: existingRoles
            }
        });

    } catch (error) {
        next(error);
    }
};

// Fetch active executives from external API
export const getActiveExecutives = async (req, res, next) => {
    try {
        const response = await fetch(`${process.env.AI_ROUTE_API}/api/executives`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer mysecretkey123'
            }
        });
        
        if (!response.ok) {
            throw new Error(`External API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Handle different response structures from external API
        // Structure 1: { success: true, executives: [...], vehicle_choices: [...] }
        // Structure 2: { executives: [...], vehicle_choices: [...] }
        // Structure 3: [...] (direct array)
        let executivesArray = [];
        let vehicleChoicesArray = [];
        
        if (Array.isArray(data)) {
            executivesArray = data;
        } else if (Array.isArray(data.executives)) {
            executivesArray = data.executives;
            vehicleChoicesArray = data.vehicle_choices || [];
        } else if (data.data && Array.isArray(data.data)) {
            executivesArray = data.data;
            vehicleChoicesArray = data.vehicle_choices || [];
        } else if (data.success && Array.isArray(data.executives)) {
            executivesArray = data.executives;
            vehicleChoicesArray = data.vehicle_choices || [];
        }
        
        res.status(200).json({
            success: true,
            data: {
                executives: executivesArray,
                vehicle_choices: vehicleChoicesArray,
                total: executivesArray.length,
                timestamp: new Date().toISOString()
            },
            message: `Successfully fetched ${executivesArray.length} active executives`
        });
    } catch (error) {
        logError(LOG_CATEGORIES.SYSTEM, 'Error fetching active executives', {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch active executives from external API',
            error: error.message
        });
    }
};

// Update executive status via external API
export const updateExecutiveStatus = async (req, res, next) => {
    try {
        const { updates } = req.body;
        
        if (!updates || !Array.isArray(updates) || updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Updates array is required and must not be empty'
            });
        }

        // Validate each update
        for (const update of updates) {
            if (!update.user_id || !update.status) {
                return res.status(400).json({
                    success: false,
                    message: 'Each update must include user_id and status'
                });
            }
            
            if (!['ACTIVE', 'INACTIVE'].includes(update.status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Status must be either ACTIVE or INACTIVE'
                });
            }
        }

        // Send all updates to external API in a single call
        try {
            const requestBody = {
                updates: updates, // Send all updates as an array
                date: new Date().toISOString().split('T')[0], // Today's date
                action: 'bulk_status_update'
            };
            
            const response = await fetch(`${process.env.AI_ROUTE_API}/api/executives`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer mysecretkey123',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`External API responded with status: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            
            // All updates succeeded
            const results = updates.map(update => ({
                user_id: update.user_id,
                status: update.status,
                success: true,
                response: data
            }));

            return res.status(200).json({
                success: true,
                message: `Successfully updated ${updates.length} executive statuses`,
                data: {
                    results,
                    errors: [],
                    summary: {
                        total: updates.length,
                        successful: updates.length,
                        failed: 0
                    },
                    timestamp: new Date().toISOString(),
                    externalResponse: data
                }
            });

        } catch (error) {
            // Fallback: Try individual updates
            const results = [];
            const errors = [];
            
            for (const update of updates) {
                try {
                    const response = await fetch(`${process.env.AI_ROUTE_API}/api/executives`, {
                        method: 'POST',
                        headers: {
                            'Authorization': 'Bearer mysecretkey123',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            user_id: update.user_id,
                            date: update.date,
                            status: update.status
                        })
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`External API responded with status: ${response.status} - ${errorText}`);
                    }

                    const data = await response.json();
                    results.push({
                        user_id: update.user_id,
                        status: update.status,
                        success: true,
                        response: data
                    });
                } catch (individualError) {
                    errors.push({
                        user_id: update.user_id,
                        status: update.status,
                        success: false,
                        error: individualError.message
                    });
                }
            }

            const successCount = results.length;
            const errorCount = errors.length;

            return res.status(200).json({
                success: errorCount === 0,
                message: `Updated ${successCount} executives successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
                data: {
                    results,
                    errors,
                    summary: {
                        total: updates.length,
                        successful: successCount,
                        failed: errorCount
                    },
                    timestamp: new Date().toISOString()
                }
            });
        }

    } catch (error) {
        logError(LOG_CATEGORIES.SYSTEM, 'Error updating executive status', {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: 'Failed to update executive status',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Save all routes using request ID
export const saveAllRoutes = async (req, res, next) => {
    try {
        const { requestId } = req.body;
        
        if (!requestId) {
            return res.status(400).json({
                success: false,
                message: 'Request ID is required'
            });
        }

        // Call external API to save routes
        const response = await fetch(`${process.env.AI_ROUTE_API}/save-all-routes`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer mysecretkey123',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                requestId: requestId
            })
        });

        if (!response.ok) {
            throw new Error(`External API responded with status: ${response.status}`);
        }

        const data = await response.json();

        res.json({
            success: true,
            message: 'Routes saved successfully',
            data: data
        });

    } catch (error) {
        logError(LOG_CATEGORIES.SYSTEM, 'Error saving routes', {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: 'Failed to save routes',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Get vehicles
export const getVehicles = async (req, res, next) => {
    try {
        const { user_id } = req.query;
        
        const vehicles = await getVehiclesService({ user_id });
        
        res.status(200).json({
            success: true,
            data: vehicles,
            total: vehicles.length,
            message: `Found ${vehicles.length} vehicle(s)`
        });
    } catch (error) {
        logError(LOG_CATEGORIES.SYSTEM, 'Error fetching vehicles', {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch vehicles',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Assign vehicle to executive
export const assignVehicleToExecutive = async (req, res, next) => {
    try {
        const { vehicleId, userId } = req.body;
        
        if (!vehicleId || !userId) {
            return res.status(400).json({
                success: false,
                message: 'Vehicle ID and User ID are required'
            });
        }
        
        const result = await assignVehicleToExecutiveService(vehicleId, userId);
        
        res.status(200).json({
            success: result.success,
            data: result.data,
            message: result.message || 'Vehicle assigned to executive successfully'
        });
    } catch (error) {
        logError(LOG_CATEGORIES.SYSTEM, 'Error assigning vehicle to executive', {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to assign vehicle to executive',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Unassign vehicle from executive
export const unassignVehicleFromExecutive = async (req, res, next) => {
    try {
        const { vehicleId, userId } = req.body;
        
        if (!vehicleId) {
            return res.status(400).json({
                success: false,
                message: 'Vehicle ID is required'
            });
        }
        
        const result = await unassignVehicleFromExecutiveService(vehicleId, userId);
        
        res.status(200).json({
            success: result.success,
            data: result.data,
            message: result.message || 'Vehicle unassigned from executive successfully'
        });
    } catch (error) {
        logError(LOG_CATEGORIES.SYSTEM, 'Error unassigning vehicle from executive', {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to unassign vehicle from executive',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};


