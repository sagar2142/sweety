import { z } from 'zod';

const normaliseEmail = (value: unknown) => (typeof value === 'string' ? value.trim().toLowerCase() : value);

export const registerSchema = z.object({
  name: z
    .string({ error: 'Please enter your name.' })
    .trim()
    .min(1, 'Please enter your name.')
    .max(100, 'Name must be 100 characters or fewer.'),
  email: z.preprocess(normaliseEmail, z.email({ error: 'Please enter a valid email address.' }).max(255)),
  password: z
    .string({ error: 'Please enter a password.' })
    .min(8, 'Password must be at least 8 characters.')
    // bcrypt only uses the first 72 bytes of a password.
    .max(72, 'Password must be 72 characters or fewer.'),
});

export const loginSchema = z.object({
  email: z.preprocess(normaliseEmail, z.string({ error: 'Please enter your email.' }).min(1, 'Please enter your email.')),
  password: z.string({ error: 'Please enter your password.' }).min(1, 'Please enter your password.'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
