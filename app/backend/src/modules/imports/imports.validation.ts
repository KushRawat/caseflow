import { z } from 'zod';

import { caseRowSchema } from '../cases/cases.validation.js';

export const createImportSchema = z.object({
  sourceName: z.string().min(1),
  totalRows: z.number().int().min(1)
});

export const chunkPayloadSchema = z.object({
  chunkIndex: z.number().int().nonnegative(),
  rows: z
    .array(
      z.object({
        rowNumber: z.number().int().nonnegative(),
        data: caseRowSchema,
        raw: z.record(z.unknown()).optional()
      })
    )
    .min(1)
    .max(1000)
});

export const importFiltersSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20)
});

export type CreateImportInput = z.infer<typeof createImportSchema>;
export type ChunkPayloadInput = z.infer<typeof chunkPayloadSchema>;
export type ImportFiltersInput = z.infer<typeof importFiltersSchema>;
