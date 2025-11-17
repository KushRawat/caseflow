import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CaseRowInput } from '../../cases/cases.validation.js';

const INITIAL_USER = { id: 'user-1', email: 'ops@example.com' };

type CaseRecord = {
  id: string;
  caseId: string;
  applicantName: string;
  dob: string;
  email?: string | null;
  phone?: string | null;
  category: string;
  priority: string;
  status: string;
  createdById?: string | null;
};

type ImportRecord = {
  id: string;
  sourceName?: string | null;
  totalRows: number;
  successCount: number;
  failureCount: number;
  status: string;
  createdAt: Date;
  completedAt?: Date | null;
  createdById: string;
};

type MockState = {
  caseImports: Map<string, ImportRecord>;
  cases: Map<string, CaseRecord>;
  caseImportRows: Array<{
    importId: string;
    caseId: string;
    status: string;
    rawPayload: unknown;
    normalizedPayload?: CaseRowInput;
    message?: string;
    caseDbId?: string;
  }>;
  caseImportErrors: Array<{ importId: string; rowNumber: number; field: string; message: string }>;
  caseImportChunks: Map<string, { importId: string; index: number; size: number; success: number; failure: number }>;
  importAudits: Array<{ importId: string; action: string; metadata?: Record<string, unknown> | null }>;
  caseHistory: Array<{ caseId: string; actorId?: string; message: string }>;
};

const createState = (): MockState => ({
  caseImports: new Map(),
  cases: new Map(),
  caseImportRows: [],
  caseImportErrors: [],
  caseImportChunks: new Map(),
  importAudits: [],
  caseHistory: []
});

let idCounter = 1;
const nextId = () => `mock-${idCounter++}`;

const createPrismaMock = () => {
  const state = createState();

  const reset = () => {
    state.caseImports.clear();
    state.cases.clear();
    state.caseImportRows.length = 0;
    state.caseImportErrors.length = 0;
    state.caseImportChunks.clear();
    state.importAudits.length = 0;
    state.caseHistory.length = 0;
    idCounter = 1;
  };

  const caseImportModel = {
    async create({ data }: { data: Partial<ImportRecord> }) {
      const id = data.id ?? nextId();
      const record: ImportRecord = {
        id,
        sourceName: data.sourceName ?? null,
        totalRows: data.totalRows ?? 0,
        successCount: data.successCount ?? 0,
        failureCount: data.failureCount ?? 0,
        status: data.status ?? 'DRAFT',
        createdAt: data.createdAt ?? new Date(),
        completedAt: data.completedAt ?? null,
        createdById: data.createdById ?? INITIAL_USER.id
      };
      state.caseImports.set(id, record);
      return { ...record };
    },
    async count({ where }: { where: { createdById: string } }) {
      let total = 0;
      for (const record of state.caseImports.values()) {
        if (record.createdById === where.createdById) total += 1;
      }
      return total;
    },
    async findMany({
      where,
      orderBy,
      take,
      cursor,
      skip
    }: {
      where: { createdById: string };
      orderBy?: { createdAt?: 'asc' | 'desc' };
      take?: number;
      cursor?: { id: string };
      skip?: number;
      include?: unknown;
    }) {
      let records = Array.from(state.caseImports.values()).filter((record) => record.createdById === where.createdById);
      const direction = orderBy?.createdAt === 'asc' ? 1 : -1;
      records.sort((a, b) => direction * (a.createdAt.getTime() - b.createdAt.getTime()));
      if (cursor) {
        const index = records.findIndex((record) => record.id === cursor.id);
        if (index >= 0) {
          records = records.slice(index + (skip ?? 0));
        }
      }
      if (typeof take === 'number' && take >= 0) {
        records = records.slice(0, take);
      }
      return records.map((record) => ({
        ...record,
        createdBy: { id: record.createdById, email: `${record.createdById}@example.com` }
      }));
    },
    async findUnique({ where }: { where: { id: string } }) {
      const found = state.caseImports.get(where.id);
      return found ? { ...found } : null;
    },
    async findFirst({ where }: { where: Partial<ImportRecord> }) {
      for (const record of state.caseImports.values()) {
        if (where.id && record.id !== where.id) continue;
        if (where.createdById && record.createdById !== where.createdById) continue;
        return { ...record };
      }
      return null;
    },
    async update({ where, data }: { where: { id: string }; data: Record<string, unknown> }) {
      const existing = state.caseImports.get(where.id);
      if (!existing) throw new Error(`Import ${where.id} not found`);
      if (data.status) existing.status = data.status as string;
      if (data.completedAt instanceof Date) existing.completedAt = data.completedAt;
      const applyCounter = (field: 'successCount' | 'failureCount') => {
        const value = data[field];
        if (typeof value === 'number') {
          existing[field] = value;
        } else if (value && typeof value === 'object' && 'increment' in value && typeof value.increment === 'number') {
          existing[field] += value.increment;
        }
      };
      applyCounter('successCount');
      applyCounter('failureCount');
      return { ...existing };
    }
  };

  const caseModel = {
    async upsert({
      where,
      update,
      create
    }: {
      where: { caseId: string };
      update: CaseRowInput;
      create: CaseRowInput & { createdById?: string };
    }) {
      const existing = Array.from(state.cases.values()).find((record) => record.caseId === where.caseId);
      if (existing) {
        Object.assign(existing, update);
        return { ...existing };
      }
      const id = nextId();
      const record: CaseRecord = {
        id,
        caseId: create.caseId,
        applicantName: create.applicantName,
        dob: create.dob,
        email: create.email,
        phone: create.phone,
        category: create.category,
        priority: create.priority,
        status: create.status,
        createdById: create.createdById ?? null
      };
      state.cases.set(id, record);
      return { ...record };
    },
    async findUnique({ where }: { where: { caseId?: string; id?: string } }) {
      if (where.caseId) {
        const found = Array.from(state.cases.values()).find((record) => record.caseId === where.caseId);
        return found ? { ...found } : null;
      }
      if (where.id) {
        const found = state.cases.get(where.id);
        return found ? { ...found } : null;
      }
      return null;
    }
  };

  const prisma = {
    caseImport: caseImportModel,
    case: caseModel,
    caseImportRow: {
      async findFirst({ where }: { where: { importId: string; caseId: string } }) {
        return (
          state.caseImportRows.find((row) => row.importId === where.importId && row.caseId === where.caseId) ?? null
        );
      },
      async create({ data }: { data: Record<string, unknown> }) {
        state.caseImportRows.push(data as typeof state.caseImportRows[number]);
        return data;
      }
    },
    caseImportError: {
      async create({ data }: { data: Record<string, unknown> }) {
        state.caseImportErrors.push(data as typeof state.caseImportErrors[number]);
        return data;
      },
      async findMany({ where }: { where: { importId: string } }) {
        return state.caseImportErrors.filter((error) => error.importId === where.importId);
      }
    },
    caseImportChunk: {
      async upsert({ where, create, update }: { where: { importId_index: { importId: string; index: number } }; create: any; update: any }) {
        const key = `${where.importId_index.importId}:${where.importId_index.index}`;
        if (state.caseImportChunks.has(key)) {
          const chunk = state.caseImportChunks.get(key)!;
          Object.assign(chunk, update);
          return chunk;
        }
        const chunk = { ...create };
        state.caseImportChunks.set(key, chunk);
        return chunk;
      }
    },
    importAudit: {
      async create({ data }: { data: Record<string, unknown> }) {
        state.importAudits.push(data as typeof state.importAudits[number]);
        return data;
      }
    },
    caseHistory: {
      async create({ data }: { data: Record<string, unknown> }) {
        state.caseHistory.push(data as typeof state.caseHistory[number]);
        return data;
      }
    },
    $transaction: async (callback: (client: typeof prisma) => Promise<unknown>) => callback(prisma),
    __reset: reset,
    __getState: () => state
  };

  return prisma;
};

vi.mock('../../../lib/prisma.js', () => {
  const prisma = createPrismaMock();
  return { prisma };
});

const { prisma } = await import('../../../lib/prisma.js');
const { importsService } = await import('../imports.service.js');
const prismaMock = prisma as typeof prisma & { __reset: () => void; __getState: () => MockState };

const baseRow = (caseId: string): { rowNumber: number; data: CaseRowInput; raw: Record<string, string> } => ({
  rowNumber: 1,
  data: {
    caseId,
    applicantName: 'Jane Doe',
    dob: '1990-01-01',
    email: 'jane@example.com',
    phone: '+15551234567',
    category: 'TAX',
    priority: 'LOW',
    status: 'NEW'
  },
  raw: {}
});

describe('importsService integration', () => {
  beforeEach(() => {
    prismaMock.__reset();
  });

  it('processes a successful chunk and completes the import', async () => {
    const job = await importsService.createImport(INITIAL_USER.id, { sourceName: 'sample.csv', totalRows: 2 });

    const result = await importsService.processChunk(job.id, INITIAL_USER.id, {
      chunkIndex: 0,
      rows: [baseRow('C-1'), { ...baseRow('C-2'), rowNumber: 2 }]
    });

    expect(result.successCount).toBe(2);
    expect(result.failureCount).toBe(0);
    const state = prismaMock.__getState();
    expect(state.caseImports.get(job.id)?.status).toBe('COMPLETED');
    expect(state.caseHistory).toHaveLength(2);
    expect(state.importAudits.filter((audit) => audit.importId === job.id && audit.action === 'IMPORT_COMPLETED')).toHaveLength(1);
  });

  it('captures duplicate case IDs within a chunk and across chunks', async () => {
    const job = await importsService.createImport(INITIAL_USER.id, { sourceName: 'dupes.csv', totalRows: 3 });

    const firstChunk = await importsService.processChunk(job.id, INITIAL_USER.id, {
      chunkIndex: 0,
      rows: [baseRow('C-10'), baseRow('C-11')]
    });
    expect(firstChunk.failureCount).toBe(0);

    const duplicateRow = baseRow('C-10');
    duplicateRow.rowNumber = 3;

    const secondChunk = await importsService.processChunk(job.id, INITIAL_USER.id, {
      chunkIndex: 1,
      rows: [duplicateRow, { ...baseRow('C-12'), rowNumber: 4 }]
    });

    expect(secondChunk.successCount).toBe(1);
    expect(secondChunk.failureCount).toBe(1);
    const errors = await importsService.getErrors(job.id, INITIAL_USER.id);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('Duplicate case_id');
  });
});
