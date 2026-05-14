import { z } from 'zod';

/**
 * Register Validation - Form validation schemas for user registration
 * Handles registration form validation with email, phone, password, and terms agreement
 * Features: Strong password validation, email format validation, phone number validation, terms agreement
 */

export const PASSWORD_MIN_LENGTH = 12;

export const getPasswordChecks = (password = '') => {
  const value = String(password);
  return {
    minLength: value.length >= PASSWORD_MIN_LENGTH,
    hasUppercase: /[A-Z]/.test(value),
    hasLowercase: /[a-z]/.test(value),
    hasNumber: /[0-9]/.test(value),
    hasSpecialChar: /[^A-Za-z0-9]/.test(value),
    noSpaces: !/\s/.test(value)
  };
};

export const isStrongPassword = (password = '') => {
  const checks = getPasswordChecks(password);
  return Object.values(checks).every(Boolean);
};

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
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
    .refine((value) => !/\s/.test(value), 'Password cannot contain spaces'),
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