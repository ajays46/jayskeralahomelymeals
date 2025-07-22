import { z } from 'zod';

// Menu Item Price validation schema
export const menuItemPriceSchema = z.object({
  // Menu Item Price basic information
  companyId: z.string()
    .min(1, 'Please select a company')
    .uuid('Invalid company ID format'),
  
  menuItemId: z.string()
    .min(1, 'Please select a menu item')
    .uuid('Invalid menu item ID format'),
  
  totalPrice: z.string()
    .min(1, 'Total price is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 1, {
      message: 'Total price must be a valid number at least 1'
    })
    .refine((val) => !isNaN(Number(val)) && Number(val) <= 999999, {
      message: 'Total price must be less than 999,999'
    }),
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
export const validateMenuItemPriceForm = (formData) => {
  try {
    menuItemPriceSchema.parse(formData);
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