import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required'),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^[0-9+\s-]+$/, 'Please enter a valid phone number'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  agree: z.boolean()
    .refine((val) => val === true, {
      message: 'You must agree to the Terms of Service and Privacy Policy'
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