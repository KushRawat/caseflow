import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../utils/http-error.js';
import { normalizeRow } from './imports.helpers.js';
import type { ChunkPayloadInput, CreateImportInput, ImportFiltersInput } from './imports.validation.js';

export const importsService = {
  async listImports(userId: string, filters: ImportFiltersInput) {
    const take = filters.limit + 1;
    const rows = await prisma.caseImport.findMany({
      where: { createdById: userId },
      orderBy: { createdAt: 'desc' },
      take,
      skip: filters.cursor ? 1 : 0,
      cursor: filters.cursor ? { id: filters.cursor } : undefined
    });

    let nextCursor: string | null = null;
    if (rows.length > filters.limit) {
      const next = rows.pop();
      nextCursor = next?.id ?? null;
    }

    return { data: rows, nextCursor };
  },

  getImport(importId: string, userId: string) {
    return prisma.caseImport.findFirst({
      where: { id: importId, createdById: userId },
      include: {
        errors: true,
        chunks: { orderBy: { index: 'asc' } }
      }
    });
  },

  async getErrors(importId: string, userId: string) {
    const exists = await prisma.caseImport.findFirst({ where: { id: importId, createdById: userId } });
    if (!exists) {
      throw new HttpError(404, 'Import not found');
    }
    return prisma.caseImportError.findMany({ where: { importId }, orderBy: { rowNumber: 'asc' } });
  },

  async exportErrorsCsv(importId: string, userId: string) {
    const errors = await this.getErrors(importId, userId);
    const escapeValue = (value: string | number) => {
      const text = String(value ?? '');
      if (text.includes(',') || text.includes('"') || text.includes('\n')) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    };
    const lines = [
      ['row_number', 'field', 'message'],
      ...errors.map((error) => [error.rowNumber, error.field, error.message])
    ];
    return lines.map((line) => line.map(escapeValue).join(',')).join('\n');
  },

  async createImport(userId: string, input: CreateImportInput) {
    return prisma.caseImport.create({
      data: {
        sourceName: input.sourceName,
        totalRows: input.totalRows,
        createdById: userId,
        status: 'DRAFT'
      }
    });
  },

  async processChunk(importId: string, userId: string, payload: ChunkPayloadInput) {
    const importJob = await prisma.caseImport.findUnique({ where: { id: importId } });
    if (!importJob) {
      throw new HttpError(404, 'Import not found');
    }
    if (importJob.createdById !== userId) {
      throw new HttpError(403, 'You cannot modify this import');
    }
    if (importJob.status === 'COMPLETED' || importJob.status === 'FAILED') {
      throw new HttpError(400, 'Import already finalized');
    }

    const seenCaseIds = new Set<string>();
    let successCount = 0;
    let failureCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const row of payload.rows) {
        const rawPayload = JSON.parse(JSON.stringify(row.raw ?? row.data));
        try {
          const normalized = normalizeRow(row.data);
          if (seenCaseIds.has(normalized.caseId)) {
            throw new HttpError(400, `Duplicate case_id within chunk: ${normalized.caseId}`);
          }
          seenCaseIds.add(normalized.caseId);

          const duplicateRow = await tx.caseImportRow.findFirst({ where: { importId, caseId: normalized.caseId } });
          if (duplicateRow) {
            throw new HttpError(400, `Duplicate case_id across file: ${normalized.caseId}`);
          }

          const caseRecord = await tx.case.upsert({
            where: { caseId: normalized.caseId },
            create: {
              caseId: normalized.caseId,
              applicantName: normalized.applicantName,
              dob: new Date(normalized.dob),
              email: normalized.email,
              phone: normalized.phone,
              category: normalized.category,
              priority: normalized.priority,
              status: normalized.status,
              createdById: userId
            },
            update: {
              applicantName: normalized.applicantName,
              dob: new Date(normalized.dob),
              email: normalized.email,
              phone: normalized.phone,
              category: normalized.category,
              priority: normalized.priority,
              status: normalized.status
            }
          });

          await tx.caseImportRow.create({
            data: {
              importId,
              caseId: normalized.caseId,
              rawPayload,
              normalizedPayload: normalized,
              status: 'SUCCESS',
              caseDbId: caseRecord.id
            }
          });

          await tx.caseHistory.create({
            data: {
              caseId: caseRecord.id,
              actorId: userId,
              message: `Imported via batch ${importId}`
            }
          });

          successCount += 1;
        } catch (error) {
          const reason = error instanceof HttpError ? error.message : 'Unknown error';
          failureCount += 1;
          await tx.caseImportRow.create({
            data: {
              importId,
              caseId: row.data.caseId,
              rawPayload,
              status: 'FAILED',
              message: reason
            }
          });
          await tx.caseImportError.create({
            data: {
              importId,
              rowNumber: row.rowNumber,
              field: 'row',
              message: reason
            }
          });
        }
      }

      await tx.caseImportChunk.upsert({
        where: { importId_index: { importId, index: payload.chunkIndex } },
        update: {
          size: payload.rows.length,
          success: successCount,
          failure: failureCount,
          processedAt: new Date()
        },
        create: {
          importId,
          index: payload.chunkIndex,
          size: payload.rows.length,
          success: successCount,
          failure: failureCount,
          processedAt: new Date()
        }
      });

      await tx.caseImport.update({
        where: { id: importId },
        data: {
          status: 'PROCESSING',
          successCount: { increment: successCount },
          failureCount: { increment: failureCount }
        }
      });
    });

    const updated = await prisma.caseImport.findUnique({ where: { id: importId } });
    if (!updated) throw new HttpError(404, 'Import missing after chunk processing');

    if (updated.successCount + updated.failureCount >= updated.totalRows) {
      await prisma.caseImport.update({
        where: { id: importId },
        data: {
          status: updated.failureCount ? 'FAILED' : 'COMPLETED',
          completedAt: new Date()
        }
      });
    }

    return { successCount, failureCount };
  }
};
