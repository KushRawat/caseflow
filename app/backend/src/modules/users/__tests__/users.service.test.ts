import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../lib/prisma.js', async () => {
  const findMany = vi.fn().mockResolvedValue([
    { id: '2', email: 'b@example.com', role: 'OPERATOR' },
    { id: '1', email: 'a@example.com', role: 'ADMIN' }
  ]);
  return {
    prisma: {
      user: {
        findMany
      }
    }
  };
});

import { usersService } from '../users.service.js';
import { prisma } from '../../../lib/prisma.js';

describe('usersService.listAssignable', () => {
  it('returns lightweight user payload sorted by email', async () => {
    const result = await usersService.listAssignable();
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      orderBy: { email: 'asc' },
      select: { id: true, email: true, role: true }
    });
    expect(result).toEqual([
      { id: '2', email: 'b@example.com', role: 'OPERATOR' },
      { id: '1', email: 'a@example.com', role: 'ADMIN' }
    ]);
  });
});
