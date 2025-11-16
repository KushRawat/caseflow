import type { NextFunction, Request, Response } from 'express';

import { logger } from '../lib/logger.js';
import { HttpError } from '../utils/http-error.js';

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const status = err instanceof HttpError ? err.status : 500;
  const message = err instanceof HttpError ? err.message : 'Something went wrong';
  const details = err instanceof HttpError ? err.details : undefined;

  if (!(err instanceof HttpError)) {
    logger.error({ err }, 'Unhandled error');
  }

  res.status(status).json({
    success: false,
    error: message,
    details
  });
};
