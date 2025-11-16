import { prisma } from '../../lib/prisma.js';

export const usersService = {
  listAssignable() {
    return prisma.user.findMany({
      orderBy: { email: 'asc' },
      select: {
        id: true,
        email: true,
        role: true
      }
    });
  }
};
