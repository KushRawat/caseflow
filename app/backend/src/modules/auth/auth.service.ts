import type { Role, User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import ms from 'ms';

import { env } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../utils/http-error.js';
import type { CredentialsInput, RegisterInput } from './auth.schema.js';

const HASH_ROUNDS = 10;

const signAccessToken = (user: User) =>
  jwt.sign({ sub: user.id, email: user.email, role: user.role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL
  });

const signRefreshToken = async (user: User) => {
  const jti = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + ms(env.REFRESH_TOKEN_TTL));
  await prisma.refreshToken.create({
    data: {
      token: jti,
      userId: user.id,
      expiresAt
    }
  });

  const refreshToken = jwt.sign(
    { sub: user.id, email: user.email, role: user.role, jti },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.REFRESH_TOKEN_TTL }
  );

  return refreshToken;
};

const verifyPassword = async (password: string, hashed: string) => bcrypt.compare(password, hashed);

export const authService = {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new HttpError(409, 'Email already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, HASH_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        role: input.role as Role
      }
    });

    return { id: user.id, email: user.email, role: user.role };
  },

  async login(input: CredentialsInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
      throw new HttpError(401, 'Invalid credentials');
    }

    const isValid = await verifyPassword(input.password, user.passwordHash);
    if (!isValid) {
      throw new HttpError(401, 'Invalid credentials');
    }

    const accessToken = signAccessToken(user);
    const refreshToken = await signRefreshToken(user);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role }
    };
  },

  async refresh(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as jwt.JwtPayload & {
        sub: string;
        email: string;
        role: Role;
        jti: string;
      };

      const stored = await prisma.refreshToken.findUnique({ where: { token: decoded.jti } });
      if (!stored || stored.expiresAt < new Date() || stored.revokedAt) {
        throw new HttpError(401, 'Refresh token expired');
      }

      const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
      if (!user) {
        throw new HttpError(401, 'User no longer exists');
      }

      await prisma.refreshToken.update({
        where: { token: decoded.jti },
        data: { revokedAt: new Date() }
      });

      const accessToken = signAccessToken(user);
      const nextRefreshToken = await signRefreshToken(user);

      return { accessToken, refreshToken: nextRefreshToken };
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }

      throw new HttpError(401, 'Invalid refresh token', error);
    }
  },

  async logout(refreshToken?: string) {
    if (!refreshToken) return;
    try {
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as jwt.JwtPayload & { jti: string };
      await prisma.refreshToken.update({
        where: { token: decoded.jti },
        data: { revokedAt: new Date() }
      });
    } catch {
      // ignore invalid tokens to avoid leaking info
    }
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, role: true } });
    if (!user) {
      throw new HttpError(404, 'User not found');
    }

    return user;
  }
};
