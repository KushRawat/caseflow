import type { Request, Response, NextFunction } from 'express';

import { env } from '../../config/env.js';
import { HttpError } from '../../utils/http-error.js';
import { respondSuccess } from '../../utils/response.js';
import { authService } from './auth.service.js';
import { credentialsSchema, refreshSchema, registerSchema } from './auth.schema.js';

const setCookies = (res: Response, accessToken: string, refreshToken: string) => {
  const secure = env.NODE_ENV === 'production';
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    maxAge: 1000 * 60 * 15
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    maxAge: 1000 * 60 * 60 * 24 * 7
  });
};

export const registerHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = registerSchema.parse(req.body);
    const user = await authService.register(payload);
    respondSuccess(res.status(201), 'User registered successfully', { user });
  } catch (error) {
    next(error);
  }
};

export const loginHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = credentialsSchema.parse(req.body);
    const { user, accessToken, refreshToken } = await authService.login(payload);
    setCookies(res, accessToken, refreshToken);
    respondSuccess(res, 'Signed in successfully', { user, accessToken, refreshToken });
  } catch (error) {
    next(error);
  }
};

export const refreshHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = refreshSchema.parse({ refreshToken: req.body?.refreshToken ?? req.cookies?.refreshToken });
    const tokens = await authService.refresh(payload.refreshToken);
    setCookies(res, tokens.accessToken, tokens.refreshToken);
    respondSuccess(res, 'Session refreshed', tokens);
  } catch (error) {
    next(error);
  }
};

export const logoutHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.body?.refreshToken ?? req.cookies?.refreshToken;
    await authService.logout(refreshToken);
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    respondSuccess(res.status(200), 'Signed out', null);
  } catch (error) {
    next(error);
  }
};

export const meHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, 'Not authenticated');
    }
    const user = await authService.me(req.user.sub);
    respondSuccess(res, 'Profile loaded', { user });
  } catch (error) {
    next(error);
  }
};
