import { Router } from 'express';

import { authenticate } from '../../middleware/auth.js';
import { listUsersHandler } from './users.controller.js';

const router = Router();

router.get('/', authenticate(), listUsersHandler);

export const usersRouter = router;
