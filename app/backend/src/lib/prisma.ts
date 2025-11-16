import { PrismaClient } from '@prisma/client';

const prismaGlobal = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  prismaGlobal.prisma ||
  new PrismaClient({
    log: [{ emit: 'event', level: 'error' }, { emit: 'event', level: 'warn' }]
  });

if (process.env.NODE_ENV !== 'production') {
  prismaGlobal.prisma = prisma;
}

export type Prisma = typeof prisma;
