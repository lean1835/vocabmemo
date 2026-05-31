import Joi from "joi";

export const createVocabSchema = Joi.object({
  isManual: Joi.boolean().optional(),
  originalInput: Joi.string().when("isManual", {
    is: true,
    then: Joi.string().optional().allow(""),
    otherwise: Joi.string().required().messages({
      "string.empty": "Dữ liệu nhập vào không được để trống",
      "any.required": "Từ hoặc câu nhập vào là bắt buộc",
    })
  }),
  correctedWord: Joi.string().when("isManual", {
    is: true,
    then: Joi.string().required().messages({
      "string.empty": "Từ vựng không được để trống",
      "any.required": "Từ vựng là bắt buộc",
    }),
    otherwise: Joi.string().optional()
  }),
  meaningVi: Joi.string().when("isManual", {
    is: true,
    then: Joi.string().required().messages({
      "string.empty": "Nghĩa tiếng Việt không được để trống",
      "any.required": "Nghĩa tiếng Việt là bắt buộc",
    }),
    otherwise: Joi.string().optional()
  }),
  meaningEn: Joi.string().allow("").optional(),
  pronunciationUK: Joi.string().allow("").optional(),
  pronunciationUS: Joi.string().allow("").optional(),
  partOfSpeech: Joi.string().allow("").optional(),
  level: Joi.string().allow("").optional(),
  category: Joi.string().allow("").optional(),
  source: Joi.string().allow("").optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  synonyms: Joi.array().items(Joi.string()).optional(),
  examples: Joi.array().items(Joi.object({
    sentence: Joi.string().required(),
    translation: Joi.string().required()
  })).optional(),
  aiModel: Joi.string().allow("").optional()
});

export const updateVocabSchema = Joi.object({
  meaningVi: Joi.string().allow("").optional(),
  meaningEn: Joi.string().allow("").optional(),
  partOfSpeech: Joi.string().allow("").optional(),
  pronunciationUK: Joi.string().allow("").optional(),
  pronunciationUS: Joi.string().allow("").optional(),
  level: Joi.string().allow("").optional(),
  category: Joi.string().allow("").optional(),
  synonyms: Joi.array().items(Joi.string()).optional(),
  source: Joi.string().allow("").optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  isDifficult: Joi.boolean().optional(),
});
