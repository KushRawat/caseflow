import type { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../utils/http-error.js';
import type { CaseFiltersInput, CaseNoteInput, CaseRowInput, CaseUpdateInput } from './cases.validation.js';

export const casesService = {
  async list(filters: CaseFiltersInput) {
    const where: Prisma.CaseWhereInput = {};

    if (filters.status) where.status = filters.status;
    if (filters.category) where.category = filters.category;
    if (filters.priority) where.priority = filters.priority;
    if (filters.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters.search) {
      where.OR = [
        { caseId: { contains: filters.search, mode: 'insensitive' } },
        { applicantName: { contains: filters.search, mode: 'insensitive' } }
      ];
    }
    if (filters.from || filters.to) {
      where.createdAt = {
        gte: filters.from ? new Date(filters.from) : undefined,
        lte: filters.to ? new Date(filters.to) : undefined
      };
    }

    const take = filters.limit + 1;
    const sortBy = filters.sortBy ?? 'createdAt';
    const sortOrder = filters.sortOrder ?? 'desc';

    const orderBy: Prisma.CaseOrderByWithRelationInput = {
      [sortBy]: sortOrder
    };

    const cases = await prisma.case.findMany({
      where,
      orderBy,
      take,
      skip: filters.cursor ? 1 : 0,
      cursor: filters.cursor ? { id: filters.cursor } : undefined,
      include: {
        assignee: { select: { id: true, email: true } },
        createdBy: { select: { id: true, email: true } }
      }
    });

    let nextCursor: string | null = null;
    if (cases.length > filters.limit) {
      const next = cases.pop();
      nextCursor = next?.id ?? null;
    }

    return { cases, nextCursor };
  },

  async getById(id: string) {
    const existing = await prisma.case.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, email: true } },
        history: { orderBy: { createdAt: 'desc' } },
        notes: { orderBy: { createdAt: 'desc' }, include: { author: { select: { id: true, email: true } } } }
      }
    });

    if (!existing) {
      throw new HttpError(404, 'Case not found');
    }

    return existing;
  },

  async upsert(input: CaseRowInput, userId?: string) {
    const caseRecord = await prisma.case.upsert({
      where: { caseId: input.caseId },
      update: {
        applicantName: input.applicantName,
        dob: new Date(input.dob),
        email: input.email,
        phone: input.phone,
        category: input.category,
        priority: input.priority,
        status: input.status
      },
      create: {
        caseId: input.caseId,
        applicantName: input.applicantName,
        dob: new Date(input.dob),
        email: input.email,
        phone: input.phone,
        category: input.category,
        priority: input.priority,
        status: input.status,
        createdById: userId
      }
    });

    return caseRecord;
  },

  async update(id: string, input: CaseUpdateInput, actorId?: string) {
    const existing = await prisma.case.findUnique({ where: { id } });
    if (!existing) {
      throw new HttpError(404, 'Case not found');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.case.update({
        where: { id },
        data: {
          status: input.status ?? existing.status,
          priority: input.priority ?? existing.priority,
          assigneeId: input.assigneeId === null ? null : input.assigneeId ?? existing.assigneeId
        }
      });

      if (input.status && input.status !== existing.status) {
        await tx.caseHistory.create({
          data: {
            caseId: id,
            actorId,
            message: `Status changed from ${existing.status} to ${input.status}`
          }
        });
      }

      if (input.notes) {
        await tx.caseNote.create({
          data: { caseId: id, authorId: actorId, body: input.notes }
        });
      }

      return result;
    });

    return updated;
  },

  async addNote(id: string, input: CaseNoteInput, actorId?: string) {
    await this.getById(id);
    return prisma.caseNote.create({ data: { caseId: id, authorId: actorId, body: input.body } });
  }
};
