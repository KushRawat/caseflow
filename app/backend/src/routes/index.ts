import { Router } from 'express';

import { authRouter } from '../modules/auth/auth.router.js';
import { casesRouter } from '../modules/cases/cases.router.js';
import { healthRouter } from '../modules/health/health.router.js';
import { importsRouter } from '../modules/imports/imports.router.js';
import { usersRouter } from '../modules/users/users.router.js';

const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/cases', casesRouter);
router.use('/imports', importsRouter);
router.use('/users', usersRouter);

export const apiRouter = router;
