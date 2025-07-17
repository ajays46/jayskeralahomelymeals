import prisma from '../config/prisma.js';
import AppError from '../utils/AppError.js';
import { createCompanyService, companyListService, companyDeleteService, createProductService, productListService, getProductByIdService, updateProductService, deleteProductService, getProductsByMealCategoryService, getAllActiveProductsService } from '../services/admin.service.js';

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
        console.log('Available companies:', companies);
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
        console.log(productData.companyId,"productData.companyId");
        // console.log('Received product data:', productData);
        
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
        console.log('Looking for company with ID:', productData.companyId);
        const company = await prisma.company.findUnique({
            where: { id: productData.companyId }
        });

        // console.log('Found company:', company);

        if (!company) {
            throw new AppError('Company not found', 404);
        }

        const product = await createProductService(productData);
        // console.log(product,"product");
        
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
        // console.log('Available products:', products.length);
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

