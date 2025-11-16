import { Router } from 'express';

import { prisma } from '../../lib/prisma.js';
import { respondSuccess } from '../../utils/response.js';

const router = Router();

router.get('/', async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  respondSuccess(res, 'Healthy', { status: 'ok', timestamp: new Date().toISOString() });
});

export const healthRouter = router;
