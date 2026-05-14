import { z } from 'zod';

/**
 * Register Validation - Form validation schemas for user registration
 * Handles registration form validation with email, phone, password, and terms agreement
 * Features: Strong password validation, email format validation, phone number validation, terms agreement
 */

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_POLICY_MESSAGE = `Password must be at least ${PASSWORD_MIN_LENGTH} characters and include uppercase, lowercase, number, and special character (no spaces).`;

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

const hasValidPhoneDigits = (value = '') => {
  const digitsOnly = String(value || '').replace(/\D/g, '');
  return digitsOnly.length >= 10;
};

const isEmailIdentifier = (value = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ''));
const isPhoneLikeIdentifier = (value = '') => /^\+?[0-9\s-]+$/.test(String(value || ''));

export const registerSchema = z.object({
  identifier: z.string()
    .trim()
    .min(1, 'Email or phone number is required')
    .superRefine((value, ctx) => {
      if (isEmailIdentifier(value)) return;
      if (isPhoneLikeIdentifier(value)) {
        if (!hasValidPhoneDigits(value)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Phone number must contain at least 10 digits'
          });
        }
        return;
      }
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please enter a valid email or phone number'
      });
    }),
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