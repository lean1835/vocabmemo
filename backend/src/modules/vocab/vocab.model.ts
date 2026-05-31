import mongoose, { Schema, Types } from "mongoose";
import { IVocabulary, IVocabCache } from "@common/interfaces/vocab.interface";

const ExampleSchema = new Schema({
  sentence: { type: String, required: true, trim: true },
  translation: { type: String, required: true, trim: true },
}, { _id: false });

const VocabularySchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "Users", required: true },
    originalInput: { type: String, required: true, trim: true },
    correctedWord: { type: String, required: true, trim: true },
    pronunciation: { type: String, trim: true }, // fallback cũ
    pronunciationUK: { type: String, trim: true, default: "" },
    pronunciationUS: { type: String, trim: true, default: "" },
    partOfSpeech: { type: String, trim: true },
    meaningVi: { type: String, trim: true },
    meaningEn: { type: String, trim: true },
    examples: [ExampleSchema],
    synonyms: [{ type: String, trim: true }],
    level: { type: String, trim: true },
    category: { type: String, trim: true },
    source: { type: String, trim: true, default: "" },
    tags: [{ type: String, trim: true }],
    imageUrl: { type: String, trim: true, default: "" },
    isDifficult: { type: Boolean, default: false },
    isAnalyzing: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

VocabularySchema.index({ userId: 1, createdAt: -1 }, { name: "idx_vocab_userId_createdAt", background: true });
VocabularySchema.index({ userId: 1, category: 1 }, { name: "idx_vocab_userId_category", background: true });
VocabularySchema.index({ userId: 1, tags: 1 }, { name: "idx_vocab_userId_tags", background: true });
VocabularySchema.index({ userId: 1 }, { name: "idx_vocab_userId", background: true });
VocabularySchema.index({ correctedWord: 1 }, { name: "idx_vocab_correctedWord", background: true });
VocabularySchema.index({ category: 1 }, { name: "idx_vocab_category", background: true });
VocabularySchema.index({ tags: 1 }, { name: "idx_vocab_tags", background: true });

const VocabCacheSchema = new Schema(
  {
    originalInput: { type: String, required: true, unique: true, lowercase: true, trim: true },
    correctedWord: { type: String, required: true, trim: true },
    pronunciationUK: { type: String, trim: true, default: "" },
    pronunciationUS: { type: String, trim: true, default: "" },
    partOfSpeech: { type: String, trim: true },
    meaningVi: { type: String, trim: true },
    meaningEn: { type: String, trim: true },
    examples: [ExampleSchema],
    synonyms: [{ type: String, trim: true }],
    level: { type: String, trim: true },
    category: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
    imageUrl: { type: String, trim: true, default: "" },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

VocabCacheSchema.index({ originalInput: 1 }, { name: "idx_vocab_cache_original", background: true });
VocabCacheSchema.index({ correctedWord: 1 }, { name: "idx_vocab_cache_corrected", background: true });

export const Vocabulary = mongoose.model<IVocabulary>("Vocabulary", VocabularySchema);
export const VocabCache = mongoose.model<IVocabCache>("VocabCache", VocabCacheSchema);
