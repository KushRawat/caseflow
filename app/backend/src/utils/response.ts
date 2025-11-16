import type { Response } from 'express';

export type SuccessPayload<T> = {
  success: true;
  message: string;
  data: T | null;
};

export const respondSuccess = <T>(
  res: Response,
  message: string,
  data?: T
): Response<SuccessPayload<T>> => {
  return res.json({ success: true, message, data: data ?? null });
};
