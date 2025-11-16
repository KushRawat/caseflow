import type { NextFunction, Request, Response } from 'express';

import { HttpError } from '../../utils/http-error.js';
import { respondSuccess } from '../../utils/response.js';
import { importsService } from './imports.service.js';
import { chunkPayloadSchema, createImportSchema, importFiltersSchema } from './imports.validation.js';

export const listImportsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new HttpError(401, 'Authentication required');
    const filters = importFiltersSchema.parse(req.query);
    const data = await importsService.listImports(req.user.sub, filters);
    respondSuccess(res, 'Imports fetched', data);
  } catch (error) {
    next(error);
  }
};

export const createImportHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new HttpError(401, 'Authentication required');
    const payload = createImportSchema.parse(req.body);
    const job = await importsService.createImport(req.user.sub, payload);
    respondSuccess(res.status(201), 'Import created', job);
  } catch (error) {
    next(error);
  }
};

export const processChunkHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new HttpError(401, 'Authentication required');
    const payload = chunkPayloadSchema.parse(req.body);
    const result = await importsService.processChunk(req.params.id, req.user.sub, payload);
    respondSuccess(res, 'Chunk processed', result);
  } catch (error) {
    next(error);
  }
};

export const getImportHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new HttpError(401, 'Authentication required');
    const job = await importsService.getImport(req.params.id, req.user.sub);
    if (!job) throw new HttpError(404, 'Import not found');
    respondSuccess(res, 'Import details fetched', job);
  } catch (error) {
    next(error);
  }
};

export const getImportErrorsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new HttpError(401, 'Authentication required');
    const errors = await importsService.getErrors(req.params.id, req.user.sub);
    respondSuccess(res, 'Import errors fetched', { errors });
  } catch (error) {
    next(error);
  }
};

export const downloadImportErrorsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new HttpError(401, 'Authentication required');
    const csv = await importsService.exportErrorsCsv(req.params.id, req.user.sub);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="import-${req.params.id}-errors.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};
