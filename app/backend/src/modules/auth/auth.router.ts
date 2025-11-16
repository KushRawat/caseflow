import { Router } from 'express';

import { authenticate } from '../../middleware/auth.js';
import { loginHandler, logoutHandler, meHandler, refreshHandler, registerHandler } from './auth.controller.js';

const router = Router();

router.post('/login', loginHandler);
router.post('/refresh', refreshHandler);
router.post('/logout', logoutHandler);
router.post('/register', authenticate(['ADMIN']), registerHandler);
router.get('/me', authenticate(), meHandler);

export const authRouter = router;
