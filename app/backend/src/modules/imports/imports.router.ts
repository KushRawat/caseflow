import { Router } from 'express';

import { authenticate } from '../../middleware/auth.js';
import {
  createImportHandler,
  downloadImportErrorsHandler,
  getImportErrorsHandler,
  getImportHandler,
  listImportsHandler,
  processChunkHandler
} from './imports.controller.js';

const router = Router();

router.get('/', authenticate(), listImportsHandler);
router.post('/', authenticate(), createImportHandler);
router.get('/:id', authenticate(), getImportHandler);
router.post('/:id/chunks', authenticate(), processChunkHandler);
router.get('/:id/errors', authenticate(), getImportErrorsHandler);
router.get('/:id/errors.csv', authenticate(), downloadImportErrorsHandler);

export const importsRouter = router;
