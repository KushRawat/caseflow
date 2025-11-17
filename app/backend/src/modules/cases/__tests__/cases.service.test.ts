import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CaseFiltersInput } from '../cases.validation.js';

type CaseCategory = 'TAX' | 'LICENSE' | 'PERMIT';
type CasePriority = 'LOW' | 'MEDIUM' | 'HIGH';
type CaseStatus = 'NEW' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

type CaseRecord = {
  id: string;
  caseId: string;
  applicantName: string;
  dob: Date;
  email?: string | null;
  phone?: string | null;
  category: CaseCategory;
  priority: CasePriority;
  status: CaseStatus;
  assigneeId?: string | null;
  createdById?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type CaseHistoryRecord = {
  id: string;
  caseId: string;
  actorId?: string | null;
  message: string;
  createdAt: Date;
};

type CaseNoteRecord = {
  id: string;
  caseId: string;
  authorId?: string | null;
  body: string;
  createdAt: Date;
};

type MockState = {
  cases: Map<string, CaseRecord>;
  caseHistory: CaseHistoryRecord[];
  caseNotes: CaseNoteRecord[];
};

const createState = (): MockState => ({
  cases: new Map(),
  caseHistory: [],
  caseNotes: []
});

const createPrismaMock = () => {
  const state = createState();
  let idCounter = 1;
  const nextId = () => `case-${idCounter++}`;

  const cloneCase = (record: CaseRecord) => ({
    ...record,
    assignee: record.assigneeId ? { id: record.assigneeId, email: `${record.assigneeId}@example.com` } : null,
    createdBy: record.createdById ? { id: record.createdById, email: `${record.createdById}@example.com` } : null
  });

  const applyWhereFilter = (record: CaseRecord, where?: Record<string, any>) => {
    if (!where) return true;
    if (where.status && record.status !== where.status) return false;
    if (where.category && record.category !== where.category) return false;
    if (where.priority && record.priority !== where.priority) return false;
    if (where.assigneeId && record.assigneeId !== where.assigneeId) return false;
    if (where.createdAt) {
      if (where.createdAt.gte && record.createdAt < where.createdAt.gte) return false;
      if (where.createdAt.lte && record.createdAt > where.createdAt.lte) return false;
    }
    if (where.OR && Array.isArray(where.OR)) {
      const matchesOr = where.OR.some((clause: Record<string, any>) => {
        if (clause.caseId?.contains) {
          return record.caseId.toLowerCase().includes(clause.caseId.contains.toLowerCase());
        }
        if (clause.applicantName?.contains) {
          return record.applicantName.toLowerCase().includes(clause.applicantName.contains.toLowerCase());
        }
        return false;
      });
      if (!matchesOr) return false;
    }
    return true;
  };

  const sortRecords = (records: CaseRecord[], orderBy?: Array<Record<string, 'asc' | 'desc'>>) => {
    if (!orderBy || orderBy.length === 0) return records;
    return records.sort((a, b) => {
      for (const clause of orderBy) {
        const [field, direction] = Object.entries(clause)[0] as [keyof CaseRecord, 'asc' | 'desc'];
        const left = a[field];
        const right = b[field];
        const leftValue = left instanceof Date ? left.getTime() : left;
        const rightValue = right instanceof Date ? right.getTime() : right;
        if (leftValue === rightValue) continue;
        const factor = direction === 'asc' ? 1 : -1;
        return leftValue > rightValue ? factor : -factor;
      }
      return 0;
    });
  };

  const caseModel = {
    async findMany({
      where,
      orderBy,
      take,
      cursor,
      skip
    }: {
      where?: Record<string, any>;
      orderBy?: Array<Record<string, 'asc' | 'desc'>>;
      take?: number;
      cursor?: { id: string };
      skip?: number;
    }) {
      let records = Array.from(state.cases.values()).filter((record) => applyWhereFilter(record, where));
      records = sortRecords(records, orderBy);
      if (cursor) {
        const index = records.findIndex((record) => record.id === cursor.id);
        if (index >= 0) {
          records = records.slice(index + (skip ?? 0));
        }
      }
      if (typeof take === 'number') {
        records = records.slice(0, take);
      }
      return records.map(cloneCase);
    },
    async count({ where }: { where?: Record<string, any> }) {
      return Array.from(state.cases.values()).filter((record) => applyWhereFilter(record, where)).length;
    },
    async findUnique({ where }: { where: { id?: string; caseId?: string } }) {
      let record: CaseRecord | undefined;
      if (where.id) {
        record = state.cases.get(where.id);
      } else if (where.caseId) {
        record = Array.from(state.cases.values()).find((item) => item.caseId === where.caseId);
      }
      if (!record) return null;
      const history = state.caseHistory
        .filter((entry) => entry.caseId === record!.id)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const notes = state.caseNotes
        .filter((note) => note.caseId === record!.id)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map((note) => ({
          ...note,
          author: note.authorId ? { id: note.authorId, email: `${note.authorId}@example.com` } : null
        }));
      return {
        ...cloneCase(record),
        history,
        notes
      };
    },
    async upsert({
      where,
      create,
      update
    }: {
      where: { caseId: string };
      create: Partial<CaseRecord> & { caseId: string };
      update: Partial<CaseRecord>;
    }) {
      const existing = Array.from(state.cases.values()).find((record) => record.caseId === where.caseId);
      if (existing) {
        Object.assign(existing, update, { updatedAt: new Date() });
        return cloneCase(existing);
      }
      const id = create.id ?? nextId();
      const now = new Date();
      const record: CaseRecord = {
        id,
        applicantName: create.applicantName ?? 'Unknown',
        dob: create.dob ?? now,
        email: create.email ?? null,
        phone: create.phone ?? null,
        category: (create.category ?? 'TAX') as CaseCategory,
        priority: (create.priority ?? 'LOW') as CasePriority,
        status: (create.status ?? 'NEW') as CaseStatus,
        caseId: create.caseId,
        assigneeId: create.assigneeId ?? null,
        createdById: create.createdById ?? null,
        createdAt: create.createdAt ?? now,
        updatedAt: create.updatedAt ?? now
      };
      state.cases.set(id, record);
      return cloneCase(record);
    },
    async update({ where, data }: { where: { id: string }; data: Partial<CaseRecord> }) {
      const record = state.cases.get(where.id);
      if (!record) {
        throw new Error(`Case ${where.id} not found`);
      }
      Object.assign(record, data, { updatedAt: new Date() });
      return cloneCase(record);
    }
  };

  const caseHistoryModel = {
    async create({ data }: { data: Omit<CaseHistoryRecord, 'id' | 'createdAt'> & { createdAt?: Date } }) {
      const record: CaseHistoryRecord = {
        id: nextId(),
        createdAt: data.createdAt ?? new Date(),
        caseId: data.caseId,
        actorId: data.actorId ?? null,
        message: data.message
      };
      state.caseHistory.push(record);
      return record;
    }
  };

  const caseNoteModel = {
    async create({ data }: { data: Omit<CaseNoteRecord, 'id' | 'createdAt'> & { createdAt?: Date } }) {
      const record: CaseNoteRecord = {
        id: nextId(),
        caseId: data.caseId,
        authorId: data.authorId ?? null,
        body: data.body,
        createdAt: data.createdAt ?? new Date()
      };
      state.caseNotes.push(record);
      return record;
    }
  };

  return {
    case: caseModel,
    caseHistory: caseHistoryModel,
    caseNote: caseNoteModel,
    $transaction: async <T>(callback: (tx: { case: typeof caseModel; caseHistory: typeof caseHistoryModel; caseNote: typeof caseNoteModel }) => Promise<T>) =>
      callback({ case: caseModel, caseHistory: caseHistoryModel, caseNote: caseNoteModel }),
    __reset() {
      state.cases.clear();
      state.caseHistory.length = 0;
      state.caseNotes.length = 0;
      idCounter = 1;
    },
    __seedCase(overrides: Partial<CaseRecord> & { caseId: string }) {
      const now = overrides.createdAt ?? new Date();
      const record: CaseRecord = {
        id: overrides.id ?? nextId(),
        caseId: overrides.caseId,
        applicantName: overrides.applicantName ?? 'Test Applicant',
        dob: overrides.dob ?? now,
        email: overrides.email ?? null,
        phone: overrides.phone ?? null,
        category: (overrides.category ?? 'TAX') as CaseCategory,
        priority: (overrides.priority ?? 'LOW') as CasePriority,
        status: (overrides.status ?? 'NEW') as CaseStatus,
        assigneeId: overrides.assigneeId ?? null,
        createdById: overrides.createdById ?? null,
        createdAt: now,
        updatedAt: overrides.updatedAt ?? now
      };
      state.cases.set(record.id, record);
      return record;
    },
    __getState: () => state
  };
};

vi.mock('../../../lib/prisma.js', () => {
  const prisma = createPrismaMock();
  return { prisma };
});

const { prisma } = await import('../../../lib/prisma.js');
const { casesService } = await import('../cases.service.js');

type PrismaMock = ReturnType<typeof createPrismaMock> & {
  __reset: () => void;
  __seedCase: (overrides: Partial<CaseRecord> & { caseId: string }) => CaseRecord;
  __getState: () => MockState;
};

const prismaMock = prisma as PrismaMock;

describe('casesService', () => {
  beforeEach(() => {
    prismaMock.__reset();
  });

  it('paginates and filters cases by status and search term', async () => {
    const timestamps = ['2024-03-10', '2024-03-11', '2024-03-12'];
    timestamps.forEach((date, index) => {
      prismaMock.__seedCase({
        caseId: `C-10${index}`,
        applicantName: `Applicant ${index}`,
        status: 'NEW',
        createdAt: new Date(date)
      });
    });
    prismaMock.__seedCase({
      caseId: 'C-999',
      applicantName: 'Closed Case',
      status: 'COMPLETED',
      createdAt: new Date('2024-02-01')
    });

    const filters: CaseFiltersInput = {
      limit: 2,
      cursor: undefined,
      status: 'NEW',
      search: 'Applicant',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };

    const firstPage = await casesService.list(filters);

    expect(firstPage.cases).toHaveLength(2);
    expect(firstPage.cases.map((c) => c.caseId)).toEqual(['C-102', 'C-101']);
    expect(firstPage.hasNext).toBe(true);
    expect(firstPage.nextCursor).toBe(firstPage.cases[1].id);

    const secondPage = await casesService.list({ ...filters, cursor: firstPage.nextCursor ?? undefined });
    expect(secondPage.cases).toHaveLength(1);
    expect(secondPage.cases[0].caseId).toBe('C-100');
    expect(secondPage.hasNext).toBe(false);
    expect(secondPage.total).toBe(3);
  });

  it('updates a case, records history, and stores inline notes', async () => {
    const record = prismaMock.__seedCase({
      caseId: 'C-500',
      applicantName: 'Status Test',
      status: 'NEW',
      priority: 'LOW'
    });

    const updated = await casesService.update(
      record.id,
      { status: 'IN_PROGRESS', priority: 'HIGH', notes: 'Follow up needed' },
      'admin-1'
    );

    expect(updated.status).toBe('IN_PROGRESS');
    expect(updated.priority).toBe('HIGH');

    const state = prismaMock.__getState();
    expect(state.caseHistory).toHaveLength(1);
    expect(state.caseHistory[0].message).toContain('Status changed from NEW to IN_PROGRESS');
    expect(state.caseNotes).toHaveLength(1);
    expect(state.caseNotes[0].body).toBe('Follow up needed');
    expect(state.caseNotes[0].caseId).toBe(record.id);
  });
});
