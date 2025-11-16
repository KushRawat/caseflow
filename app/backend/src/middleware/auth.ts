import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../utils/http-error.js';

export type AuthPayload = {
  sub: string;
  email: string;
  role: string;
};

export const authenticate = (allowedRoles?: string[]) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization ?? '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.replace('Bearer ', '')
      : (req.cookies?.accessToken as string | undefined);

    if (!token) {
      return next(new HttpError(401, 'Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthPayload;
      const user = await prisma.user.findUnique({ where: { id: decoded.sub } });

      if (!user) {
        return next(new HttpError(401, 'Invalid user'));
      }

      if (allowedRoles && !allowedRoles.includes(user.role)) {
        return next(new HttpError(403, 'Insufficient permissions'));
      }

      (req as Request & { user: AuthPayload }).user = {
        sub: user.id,
        email: user.email,
        role: user.role
      };

      next();
    } catch (error) {
      next(new HttpError(401, 'Invalid token', error));
    }
  };
};
