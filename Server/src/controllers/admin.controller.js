import prisma from '../config/prisma.js';
import AppError from '../utils/AppError.js';
import { createCompanyService, companyListService, companyDeleteService, createProductService, productListService, getProductByIdService, updateProductService, deleteProductService, createMenuService, menuListService, getMenuByIdService, updateMenuService, deleteMenuService, createMenuItemService, menuItemListService, getMenuItemByIdService, updateMenuItemService, deleteMenuItemService, createMenuCategoryService, menuCategoryListService, getMenuCategoryByIdService, updateMenuCategoryService, deleteMenuCategoryService, createMenuItemPriceService, menuItemPriceListService, getMenuItemPriceByIdService, updateMenuItemPriceService, deleteMenuItemPriceService, getMealsByDayService, getMenusForBookingService } from '../services/admin.service.js';

export const createCompany = async (req, res, next) => {
    try {
        const { name, address_id } = req.body;
        // console.log(req.body);
        const company = await createCompanyService({ name, address_id });
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
        console.log(day,"day");
        
        
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
        
        console.log(mealsData,"mealsData");
        
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



