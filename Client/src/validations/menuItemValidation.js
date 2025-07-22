import { z } from 'zod';

export const menuItemSchema = z.object({
  name: z.string()
    .min(1, 'Menu item name is required')
    .min(2, 'Menu item name must be at least 2 characters')
    .max(255, 'Menu item name must be less than 255 characters'),
  productId: z.string()
    .min(1, 'Product selection is required'),
  menuId: z.string()
    .min(1, 'Menu selection is required'),
  foodType: z.enum(['VEG', 'NON_VEG'], {
    required_error: 'Food type is required',
    invalid_type_error: 'Food type must be either VEG or NON_VEG',
  }),
});

export const validateMenuItemForm = (data) => {
  try {
    menuItemSchema.parse(data);
    return { success: true, errors: {} };
  } catch (error) {
    const errors = {};
    error.errors.forEach((err) => {
      errors[err.path[0]] = err.message;
    });
    return { success: false, errors };
  }
};

export const validateField = (schema, fieldName, value) => {
  try {
    schema.pick({ [fieldName]: true }).parse({ [fieldName]: value });
    return '';
  } catch (error) {
    const fieldError = error.errors.find(err => err.path[0] === fieldName);
    return fieldError ? fieldError.message : '';
  }
};

