import { z } from 'zod';

const MIN_DATE = new Date('1900-01-01');

const isoDateString = z
  .string()
  .refine((val) => !Number.isNaN(Date.parse(val)), { message: 'Invalid date' })
  .refine((val) => {
    const date = new Date(val);
    return date >= MIN_DATE && date <= new Date();
  }, 'Date is out of range');

const phoneSchema = z
  .string()
  .optional()
  .or(z.literal('').transform(() => undefined))
  .refine((value) => {
    if (!value) return true;
    return /^\+?[1-9]\d{6,14}$/.test(value);
  }, 'Phone must be E.164');

export const caseRowSchema = z.object({
  caseId: z.string().min(1),
  applicantName: z.string().min(1),
  dob: isoDateString,
  email: z.string().email().optional().or(z.literal('').transform(() => undefined)),
  phone: phoneSchema,
  category: z.enum(['TAX', 'LICENSE', 'PERMIT']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('LOW'),
  status: z.enum(['NEW', 'IN_PROGRESS', 'COMPLETED', 'FAILED']).default('NEW')
});

export const caseFiltersSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(5),
  cursor: z.string().optional(),
  status: z.enum(['NEW', 'IN_PROGRESS', 'COMPLETED', 'FAILED']).optional(),
  category: z.enum(['TAX', 'LICENSE', 'PERMIT']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  assigneeId: z.string().optional(),
  search: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  sortBy: z.enum(['createdAt', 'priority', 'status', 'caseId']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

export const caseUpdateSchema = z.object({
  status: z.enum(['NEW', 'IN_PROGRESS', 'COMPLETED', 'FAILED']).optional(),
  assigneeId: z.string().nullable().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  notes: z.string().optional()
});

export const caseNoteSchema = z.object({
  body: z.string().min(1)
});

export type CaseRowInput = z.infer<typeof caseRowSchema>;
export type CaseFiltersInput = z.infer<typeof caseFiltersSchema>;
export type CaseUpdateInput = z.infer<typeof caseUpdateSchema>;
export type CaseNoteInput = z.infer<typeof caseNoteSchema>;
