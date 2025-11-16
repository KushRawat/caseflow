import type { NextFunction, Request, Response } from 'express';

import { respondSuccess } from '../../utils/response.js';
import { usersService } from './users.service.js';

export const listUsersHandler = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await usersService.listAssignable();
    respondSuccess(res, 'Users fetched', { users });
  } catch (error) {
    next(error);
  }
};
