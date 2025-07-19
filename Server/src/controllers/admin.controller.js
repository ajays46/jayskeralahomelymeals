import prisma from '../config/prisma.js';
import AppError from '../utils/AppError.js';
import { createCompanyService, companyListService, companyDeleteService, createProductService, productListService, getProductByIdService, updateProductService, deleteProductService, getProductsByMealCategoryService, getAllActiveProductsService, getMenuItemsByDateService, createMenuService, menuListService, getMenuByIdService, updateMenuService, deleteMenuService, createMenuItemService, menuItemListService } from '../services/admin.service.js';

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

// New controller for booking page - get products by meal category
export const getProductsByMealCategory = async (req, res, next) => {
    try {
        const { mealCategory } = req.params;
        
        // Validate meal category
        const validCategories = ['breakfast', 'lunch', 'dinner'];
        if (!validCategories.includes(mealCategory.toLowerCase())) {
            throw new AppError('Invalid meal category. Must be breakfast, lunch, or dinner', 400);
        }
        
        const products = await getProductsByMealCategoryService(mealCategory);
        
        res.status(200).json({
            status: 'success',
            data: products
        });
    } catch (error) {
        next(error);
    }
}

// New controller for booking page - get all active products categorized
export const getAllActiveProducts = async (req, res, next) => {
    try {
        const categorizedProducts = await getAllActiveProductsService();
        
        res.status(200).json({
            status: 'success',
            data: categorizedProducts
        });
    } catch (error) {
        next(error);
    }
}

// New controller for booking page - get menu items by date
export const getMenuItemsByDate = async (req, res, next) => {
    try {
        const { date } = req.params;
        
        // Validate date format
        const selectedDate = new Date(date);
        if (isNaN(selectedDate.getTime())) {
            throw new AppError('Invalid date format', 400);
        }
        
        const menuData = await getMenuItemsByDateService(selectedDate);
        
        res.status(200).json({
            status: 'success',
            data: menuData
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
        if (!menuData.name || !menuData.companyId || !menuData.dayOfWeek) {
            throw new AppError('Missing required fields: name, companyId, dayOfWeek', 400);
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
        if (!menuData.name || !menuData.companyId || !menuData.dayOfWeek) {
            throw new AppError('Missing required fields: name, companyId, dayOfWeek', 400);
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
        if (!menuItemData.name || !menuItemData.productId || !menuItemData.menuId) {
            throw new AppError('Missing required fields: name, productId, menuId', 400);
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

