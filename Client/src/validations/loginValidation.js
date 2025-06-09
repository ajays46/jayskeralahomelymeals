import { z } from 'zod';
import { ZodError } from 'zod';

export const loginSchema = z.object({
  identifier: z.string()
    .min(1, 'Email or phone is required'),
  password: z.string()
    .min(1, 'Password is required')
});

export const validateField = (schema, name, value) => {
  try {
    schema.shape[name].parse(value);
    return '';
  } catch (error) {
    if (error instanceof ZodError && error.errors[0]) {
      return error.errors[0].message;
    }
    return 'Invalid input';
  }
};
