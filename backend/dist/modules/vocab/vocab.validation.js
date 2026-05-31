"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateVocabSchema = exports.createVocabSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createVocabSchema = joi_1.default.object({
    isManual: joi_1.default.boolean().optional(),
    originalInput: joi_1.default.string().when("isManual", {
        is: true,
        then: joi_1.default.string().optional().allow(""),
        otherwise: joi_1.default.string().required().messages({
            "string.empty": "Dữ liệu nhập vào không được để trống",
            "any.required": "Từ hoặc câu nhập vào là bắt buộc",
        })
    }),
    correctedWord: joi_1.default.string().when("isManual", {
        is: true,
        then: joi_1.default.string().required().messages({
            "string.empty": "Từ vựng không được để trống",
            "any.required": "Từ vựng là bắt buộc",
        }),
        otherwise: joi_1.default.string().optional()
    }),
    meaningVi: joi_1.default.string().when("isManual", {
        is: true,
        then: joi_1.default.string().required().messages({
            "string.empty": "Nghĩa tiếng Việt không được để trống",
            "any.required": "Nghĩa tiếng Việt là bắt buộc",
        }),
        otherwise: joi_1.default.string().optional()
    }),
    meaningEn: joi_1.default.string().allow("").optional(),
    pronunciationUK: joi_1.default.string().allow("").optional(),
    pronunciationUS: joi_1.default.string().allow("").optional(),
    partOfSpeech: joi_1.default.string().allow("").optional(),
    level: joi_1.default.string().allow("").optional(),
    category: joi_1.default.string().allow("").optional(),
    source: joi_1.default.string().allow("").optional(),
    tags: joi_1.default.array().items(joi_1.default.string()).optional(),
    synonyms: joi_1.default.array().items(joi_1.default.string()).optional(),
    examples: joi_1.default.array().items(joi_1.default.object({
        sentence: joi_1.default.string().required(),
        translation: joi_1.default.string().required()
    })).optional(),
    aiModel: joi_1.default.string().allow("").optional()
});
exports.updateVocabSchema = joi_1.default.object({
    meaningVi: joi_1.default.string().allow("").optional(),
    meaningEn: joi_1.default.string().allow("").optional(),
    partOfSpeech: joi_1.default.string().allow("").optional(),
    pronunciationUK: joi_1.default.string().allow("").optional(),
    pronunciationUS: joi_1.default.string().allow("").optional(),
    level: joi_1.default.string().allow("").optional(),
    category: joi_1.default.string().allow("").optional(),
    synonyms: joi_1.default.array().items(joi_1.default.string()).optional(),
    source: joi_1.default.string().allow("").optional(),
    tags: joi_1.default.array().items(joi_1.default.string()).optional(),
    isDifficult: joi_1.default.boolean().optional(),
});
