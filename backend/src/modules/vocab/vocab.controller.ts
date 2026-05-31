import { Request, Response } from "express";
import { catchAsync } from "@common/utils/catchAsync";
import { VocabService } from "./vocab.service";

const vocabService = new VocabService();

export const createVocab = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const result = await vocabService.create(userId, req.body);
  res.status(201).json(result);
});

export const getVocabs = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const filter = {
    page: req.query.page ? String(req.query.page) : undefined,
    limit: req.query.limit ? String(req.query.limit) : undefined,
    keyword: req.query.keyword ? String(req.query.keyword) : undefined,
    category: req.query.category ? String(req.query.category) : undefined,
    tag: req.query.tag ? String(req.query.tag) : undefined,
  };
  const result = await vocabService.getByFilter(userId, filter);
  res.status(200).json(result);
});

export const getVocabById = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const result = await vocabService.getById(userId, req.params.id as string);
  res.status(200).json(result);
});

export const updateVocab = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const result = await vocabService.update(userId, req.params.id as string, req.body);
  res.status(200).json(result);
});

export const deleteVocab = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const result = await vocabService.delete(userId, req.params.id as string);
  res.status(200).json(result);
});

export const getVocabMetadata = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const result = await vocabService.getMetadata(userId);
  res.status(200).json(result);
});
