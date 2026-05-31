"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.VocabCache = exports.Vocabulary = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ExampleSchema = new mongoose_1.Schema({
    sentence: { type: String, required: true, trim: true },
    translation: { type: String, required: true, trim: true },
}, { _id: false });
const VocabularySchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Types.ObjectId, ref: "Users", required: true },
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
}, { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } });
VocabularySchema.index({ userId: 1, createdAt: -1 }, { name: "idx_vocab_userId_createdAt", background: true });
VocabularySchema.index({ userId: 1, category: 1 }, { name: "idx_vocab_userId_category", background: true });
VocabularySchema.index({ userId: 1, tags: 1 }, { name: "idx_vocab_userId_tags", background: true });
VocabularySchema.index({ userId: 1 }, { name: "idx_vocab_userId", background: true });
VocabularySchema.index({ correctedWord: 1 }, { name: "idx_vocab_correctedWord", background: true });
VocabularySchema.index({ category: 1 }, { name: "idx_vocab_category", background: true });
VocabularySchema.index({ tags: 1 }, { name: "idx_vocab_tags", background: true });
const VocabCacheSchema = new mongoose_1.Schema({
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
}, { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } });
VocabCacheSchema.index({ originalInput: 1 }, { name: "idx_vocab_cache_original", background: true });
VocabCacheSchema.index({ correctedWord: 1 }, { name: "idx_vocab_cache_corrected", background: true });
exports.Vocabulary = mongoose_1.default.model("Vocabulary", VocabularySchema);
exports.VocabCache = mongoose_1.default.model("VocabCache", VocabCacheSchema);
