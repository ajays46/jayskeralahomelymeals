import { z } from 'zod';

/**
 * Register Validation - Form validation schemas for user registration
 * Handles registration form validation with email, phone, password, and terms agreement
 * Features: Strong password validation, email format validation, phone number validation, terms agreement
 */

export const registerSchema = z.object({
  phone: z.string()
    .min(4, 'Phone number is required')
    .regex(/^\+[0-9\s-]+$/, 'Please enter a valid phone number'),
  email: z.string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((value) => {
      if (!value) return true;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }, 'Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the Terms & Conditions' })
  })
});

export const validateField = (schema, name, value) => {
  try {
    schema.shape[name].parse(value);
    return '';
  } catch (error) {
    return error.errors[0].message;
  }
}; 