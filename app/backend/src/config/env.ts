import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('4000'),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL: z.string().default('2m'),
  REFRESH_TOKEN_TTL: z.string().default('7d'),
  SENTRY_DSN: z.string().optional().or(z.literal('')),
  ALLOWED_ORIGINS: z.string().default('*')
});

const rawEnv = envSchema.safeParse(process.env);

if (!rawEnv.success) {
  console.error('❌ Invalid environment configuration', rawEnv.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...rawEnv.data,
  ALLOWED_ORIGINS_LIST: rawEnv.data.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
};

export type Env = typeof env;
