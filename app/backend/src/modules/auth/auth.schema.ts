import { z } from 'zod';

export const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const registerSchema = credentialsSchema.extend({
  role: z.enum(['ADMIN', 'OPERATOR']).default('OPERATOR')
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10)
});

export type CredentialsInput = z.infer<typeof credentialsSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
