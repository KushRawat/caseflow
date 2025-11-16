import type { NextFunction, Request, Response } from 'express';

import { respondSuccess } from '../../utils/response.js';
import { casesService } from './cases.service.js';
import { caseFiltersSchema, caseNoteSchema, caseUpdateSchema } from './cases.validation.js';

export const listCasesHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = caseFiltersSchema.parse(req.query);
    const result = await casesService.list(filters);
    respondSuccess(res, 'Cases fetched', result);
  } catch (error) {
    next(error);
  }
};

export const getCaseHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = await casesService.getById(req.params.id);
    respondSuccess(res, 'Case fetched', payload);
  } catch (error) {
    next(error);
  }
};

export const updateCaseHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = caseUpdateSchema.parse(req.body);
    const updated = await casesService.update(req.params.id, payload, req.user?.sub);
    respondSuccess(res, 'Case updated', updated);
  } catch (error) {
    next(error);
  }
};

export const addCaseNoteHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = caseNoteSchema.parse(req.body);
    const note = await casesService.addNote(req.params.id, payload, req.user?.sub);
    respondSuccess(res.status(201), 'Note added', note);
  } catch (error) {
    next(error);
  }
};
