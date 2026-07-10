import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters long' })
    .max(100, { message: 'Name cannot exceed 100 characters' })
    .trim(),
  email: z
    .string()
    .email({ message: 'Invalid email address format' })
    .trim()
    .lowercase(),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long' })
    .max(100, { message: 'Password cannot exceed 100 characters' }),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email({ message: 'Invalid email address format' })
    .trim()
    .lowercase(),
  password: z
    .string()
    .min(1, { message: 'Password is required' }),
});
