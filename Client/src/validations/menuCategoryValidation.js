import { z } from 'zod';

// Menu Category validation schema
export const menuCategorySchema = z.object({
  // Menu Category basic information
  name: z.string()
    .min(1, 'Menu category name is required')
    .min(2, 'Menu category name must be at least 2 characters')
    .max(255, 'Menu category name must be less than 255 characters')
    .regex(/^[a-zA-Z0-9\s\-_.,&()\u0D00-\u0D7F]+$/, 'Menu category name contains invalid characters'),
  
  description: z.string()
    .min(1, 'Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters'),
  
  companyId: z.string()
    .min(1, 'Please select a company')
    .uuid('Invalid company ID format'),
  
  menuId: z.string()
    .min(1, 'Please select a menu')
    .uuid('Invalid menu ID format'),
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
export const validateMenuCategoryForm = (formData) => {
  try {
    menuCategorySchema.parse(formData);
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