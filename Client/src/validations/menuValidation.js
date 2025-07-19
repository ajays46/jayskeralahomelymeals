import { z } from 'zod';

// Menu validation schema
export const menuSchema = z.object({
  // Menu basic information
  name: z.string()
    .min(1, 'Menu name is required')
    .min(2, 'Menu name must be at least 2 characters')
    .max(255, 'Menu name must be less than 255 characters')
    .regex(/^[a-zA-Z0-9\s\-_.,&()\u0D00-\u0D7F]+$/, 'Menu name contains invalid characters'),
  
  companyId: z.string()
    .min(1, 'Please select a company')
    .uuid('Invalid company ID format'),
  
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'], {
    errorMap: () => ({ message: 'Please select a valid day of the week' })
  }),
  
  status: z.enum(['ACTIVE', 'INACTIVE', 'DRAFT', 'PUBLISHED'], {
    errorMap: () => ({ message: 'Please select a valid status' })
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
export const validateMenuForm = (formData) => {
  try {
    menuSchema.parse(formData);
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