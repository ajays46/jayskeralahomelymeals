import { z } from 'zod';

/**
 * Product Validation - Form validation schemas for product management
 * Handles product form validation including name, code, pricing, and inventory
 * Features: Product name validation, code format validation, pricing validation, inventory validation
 */

// Product validation schema
export const productSchema = z.object({
  // Product basic information
  productName: z.string()
    .min(1, 'Product name is required')
    .min(2, 'Product name must be at least 2 characters')
    .max(200, 'Product name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_.,&()\u0D00-\u0D7F]+$/, 'Product name contains invalid characters'),
  
  code: z.string()
    .min(1, 'Product code is required')
    .min(3, 'Product code must be at least 3 characters')
    .max(50, 'Product code must be less than 50 characters')
    .regex(/^[A-Z0-9\-_]+$/, 'Product code must contain only uppercase letters, numbers, hyphens, and underscores'),
  
  companyId: z.string()
    .min(1, 'Please select a company')
    .uuid('Invalid company ID format'),
  
  status: z.enum(['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED'], {
    errorMap: () => ({ message: 'Please select a valid status' })
  }),
  
  imageUrl: z.string()
    .optional()
    .refine((val) => {
      // If no value provided, it's valid (optional)
      if (!val || val === '') {
        return true;
      }
      // Check if it's a valid base64 image or URL
      if (val.startsWith('data:image/')) {
        return true;
      }
      if (val.startsWith('http://') || val.startsWith('https://')) {
        return true;
      }
      return false;
    }, 'Please upload a valid image file'),
  
  // Category information
  productCategoryName: z.string()
    .min(1, 'Category name is required')
    .min(2, 'Category name must be at least 2 characters')
    .max(50, 'Category name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s\-_&]+$/, 'Category name contains invalid characters'),
  
  categoryDescription: z.string()
    .max(200, 'Category description must be less than 200 characters')
    .optional(),
  
  // Price information
  price: z.string()
    .min(1, 'Price is required')
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, 'Price must be a positive number')
    .refine((val) => {
      const num = parseFloat(val);
      return num <= 999999.99;
    }, 'Price must be less than ₹10,00,000'),
  
  priceDate: z.string()
    .min(1, 'Price date is required')
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, 'Please select a valid date'),
  
  // Quantity information
  quantity: z.string()
    .min(1, 'Quantity is required')
    .refine((val) => {
      const num = parseInt(val);
      return !isNaN(num) && num >= 0;
    }, 'Quantity must be a non-negative number')
    .refine((val) => {
      const num = parseInt(val);
      return num <= 999999;
    }, 'Quantity must be less than 10,00,000'),
  
  quantityDate: z.string()
    .min(1, 'Quantity date is required')
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, 'Please select a valid date'),
});

// Validation function for individual fields
export const validateField = (schema, name, value) => {
  try {
    schema.shape[name].parse(value);
    return '';
  } catch (error) {
    return error.errors[0].message;
  }
};

// Validation function for the entire form
export const validateProductForm = (formData) => {
  try {
    productSchema.parse(formData);
    return { isValid: true, errors: {} };
  } catch (error) {
    const errors = {};
    error.errors.forEach((err) => {
      const fieldName = err.path[0];
      errors[fieldName] = err.message;
    });
    return { isValid: false, errors };
  }
};

// Custom validation for image file
export const validateImageFile = (file) => {
  const errors = [];
  
  // Check file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    errors.push('Image size must be less than 5MB');
  }
  
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    errors.push('Please upload a valid image file (JPG, PNG, GIF, or WebP)');
  }
  
  return errors;
}; 