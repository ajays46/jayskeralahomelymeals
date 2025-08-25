import prisma from '../config/prisma.js';
import AppError from '../utils/AppError.js';
import { createCompanyService, companyListService, companyDeleteService, createProductService, productListService, getProductByIdService, updateProductService, deleteProductService, createMenuService, menuListService, getMenuByIdService, updateMenuService, deleteMenuService, createMenuItemService, menuItemListService, getMenuItemByIdService, updateMenuItemService, deleteMenuItemService, createMenuCategoryService, menuCategoryListService, getMenuCategoryByIdService, updateMenuCategoryService, deleteMenuCategoryService, createMenuItemPriceService, menuItemPriceListService, getMenuItemPriceByIdService, updateMenuItemPriceService, deleteMenuItemPriceService, getMealsByDayService, getMenusForBookingService, getAllOrdersService, updateOrderStatusService, deleteOrderService, getProductQuantitiesForMenusService } from '../services/admin.service.js';
import bcrypt from 'bcryptjs';
import { generateApiKey } from '../utils/helpers.js';

export const createCompany = async (req, res, next) => {
    try {
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
        const companies = await companyListService();
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
        const products = await productListService();
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
        const menus = await menuListService();
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
        const menuItems = await menuItemListService();
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
        const menuCategories = await menuCategoryListService();
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
        const menuItemPrices = await menuItemPriceListService();
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

        const mealsData = await getMealsByDayService(day);
        
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

        const orders = await getAllOrdersService(filters);
        
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
        const { email, phone, password, role, companyId } = req.body;
        // Get the admin ID from the authenticated user's JWT token
        const adminId = req.user.userId;
        
        // Validate required fields
        if (!email || !phone || !password || !role || !companyId) {
            throw new AppError('All fields are required: email, phone, password, role, companyId', 400);
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

            // 3. Create UserRole
            const userRole = await tx.userRole.create({
                data: {
                    userId: user.id,
                    name: role
                }
            });

            return {
                id: user.id,
                email: auth.email,
                phone: auth.phoneNumber,
                role: userRole.name,
                company: company.name,
                companyId: company.id,
                status: user.status,
                createdAt: user.createdAt
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
        // First, get all users with their relationships
        const users = await prisma.user.findMany({
            include: {
                auth: true,
                userRoles: true,
                company: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Filter out users without auth records and only include specific roles
        const allowedRoles = ['SELLER', 'DELIVERY_EXECUTIVE', 'DELIVERY_MANAGER'];
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
                role: user.userRoles[0]?.name || 'USER',
                company: user.company?.name || 'No Company',
                companyId: user.companyId,
                status: user.status,
                createdAt: user.createdAt,
                createdBy: user.createdBy
            }));

        res.status(200).json({
            status: 'success',
            data: transformedUsers,
            total: transformedUsers.length,
            message: `Found ${transformedUsers.length} users with valid auth records`
        });
        
    } catch (error) {
        console.error('Error fetching admin users:', error);
        
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
        // Get all users with SELLER role
        const sellers = await prisma.user.findMany({
            include: {
                auth: true,
                userRoles: true,
                company: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Filter only sellers with valid auth records
        const sellersWithOrders = await Promise.all(
            sellers
                .filter(user => {
                    // Only include users with valid auth records and SELLER role
                    if (!user.auth || !user.auth.email) return false;
                    const userRole = user.userRoles[0]?.name;
                    return userRole === 'SELLER';
                })
                .map(async (seller) => {
                    try {
                        // Fetch real orders placed by this seller for users
                        // Since sellers place orders on behalf of users, we need to find orders
                        // that are associated with this seller's company or created by this seller
                        
                        // Option 1: Get orders where the seller's company is involved
                        // Option 2: Get orders created by this seller (if there's a createdBy field)
                        // Option 3: Get orders for users that this seller manages
                        
                        // For now, let's implement Option 1: Get orders for users in the same company
                        let orders = [];
                        let totalRevenue = 0;
                        
                        if (seller.companyId) {
                            // Get users in the same company
                            const companyUsers = await prisma.user.findMany({
                                where: {
                                    companyId: seller.companyId,
                                    // Exclude the seller themselves
                                    id: { not: seller.id }
                                },
                                select: { id: true }
                            });
                            
                            const userIds = companyUsers.map(user => user.id);
                            
                            if (userIds.length > 0) {
                                // Get orders placed by these users
                                orders = await prisma.order.findMany({
                                    where: {
                                        userId: { in: userIds }
                                    },
                                    include: {
                                        user: {
                                            include: {
                                                auth: true
                                            }
                                        },
                                        deliveryItems: {
                                            include: {
                                                menuItem: {
                                                    include: {
                                                        product: true,
                                                        prices: {
                                                            where: {
                                                                companyId: seller.companyId
                                                            },
                                                            take: 1
                                                        }
                                                    }
                                                },
                                                deliveryAddress: true
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
                        }
                        
                        // If no company-based orders found, try to get any orders that might be related
                        if (orders.length === 0) {
                            // Get some sample orders to show the structure
                            // This is a fallback when no company-based orders exist
                            orders = await prisma.order.findMany({
                                take: 5,
                                include: {
                                    user: {
                                        include: {
                                            auth: true
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
                                            deliveryAddress: true
                                        }
                                    }
                                },
                                orderBy: {
                                    createdAt: 'desc'
                                }
                            });
                            
                            totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
                        }
                        
                        // Transform orders to match the expected format
                        const transformedOrders = orders.map(order => {

                            
                            return {
                                id: order.id,
                                customerName: order.user?.auth?.email?.split('@')[0] || 'User',
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
                                        address: item.deliveryAddress
                                    };
                                }) || []
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
                        console.error(`Error processing seller ${seller.id}:`, error);
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
        console.error('Error fetching sellers with orders:', error);
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
        // Get all users with DELIVERY_EXECUTIVE role
        const executives = await prisma.user.findMany({
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
        console.error('Error fetching delivery executives:', error);
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
        const response = await fetch('http://13.203.227.119:5001/trigger', {
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
        console.error('Error in route planning proxy:', error);
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
        await fetch('http://13.203.227.119:5001/executive-count', {
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
        console.error('Error in executive count proxy:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send executive count',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Proxy run script endpoint for program execution
export const proxyRunScript = async (req, res, next) => {
    try {

        
        const { executiveCount, selectedExecutives, timestamp, source, userAgent, dashboardVersion } = req.body;
        
        if (!executiveCount || executiveCount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid executive count provided'
            });
        }
        
        if (!selectedExecutives || selectedExecutives.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No executives selected for program execution'
            });
        }
        
        // Call the external run-script API
        const response = await fetch('http://13.203.227.119:5001/run-script', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer mysecretkey123',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                num_drivers: executiveCount
            })
        });
        
        if (!response.ok) {
            throw new Error(`External API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        
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
        
    } catch (error) {
        console.error('Error in program execution proxy:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to execute program',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
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
        console.error('Error fetching file content:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch file content',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Utility function to identify orphaned users (users without valid auth records)
export const getOrphanedUsers = async (req, res, next) => {
    try {
        // Find users whose authId doesn't correspond to an existing Auth record
        const allUsers = await prisma.user.findMany({
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
        console.error('Error fetching orphaned users:', error);
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

        // Find all users first
        const allUsers = await prisma.user.findMany({
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
        console.error('Error cleaning up orphaned users:', error);
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
        const productQuantities = await getProductQuantitiesForMenusService();
        
        res.status(200).json({
            status: 'success',
            data: productQuantities
        });
    } catch (error) {
        next(error);
    }
};





