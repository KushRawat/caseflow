import { Router } from 'express';

import { authenticate } from '../../middleware/auth.js';
import { addCaseNoteHandler, getCaseHandler, listCasesHandler, updateCaseHandler } from './cases.controller.js';

const router = Router();

router.get('/', authenticate(), listCasesHandler);
router.get('/:id', authenticate(), getCaseHandler);
router.patch('/:id', authenticate(), updateCaseHandler);
router.post('/:id/notes', authenticate(), addCaseNoteHandler);

export const casesRouter = router;
