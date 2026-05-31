"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVocabMetadata = exports.deleteVocab = exports.updateVocab = exports.getVocabById = exports.getVocabs = exports.createVocab = void 0;
const catchAsync_1 = require("../../common/utils/catchAsync");
const vocab_service_1 = require("./vocab.service");
const vocabService = new vocab_service_1.VocabService();
exports.createVocab = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = req.user.id;
    const result = await vocabService.create(userId, req.body);
    res.status(201).json(result);
});
exports.getVocabs = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = req.user.id;
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
exports.getVocabById = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = req.user.id;
    const result = await vocabService.getById(userId, req.params.id);
    res.status(200).json(result);
});
exports.updateVocab = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = req.user.id;
    const result = await vocabService.update(userId, req.params.id, req.body);
    res.status(200).json(result);
});
exports.deleteVocab = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = req.user.id;
    const result = await vocabService.delete(userId, req.params.id);
    res.status(200).json(result);
});
exports.getVocabMetadata = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = req.user.id;
    const result = await vocabService.getMetadata(userId);
    res.status(200).json(result);
});
