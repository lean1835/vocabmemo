"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VocabService = void 0;
const mongoose_1 = require("mongoose");
const vocab_model_1 = require("./vocab.model");
const ApiError_1 = require("../../common/utils/ApiError");
const gemini_service_1 = require("../../common/utils/gemini.service");
const logger_1 = require("../../common/utils/logger");
const srs_algorithm_1 = require("../../common/utils/srs-algorithm");
const auth_model_1 = __importDefault(require("../auth/auth.model"));
const geminiService = new gemini_service_1.GeminiService();
class VocabService {
    static memoryCache = new Map();
    async create(userId, payload) {
        const { isManual } = payload;
        if (isManual) {
            const { correctedWord, pronunciationUK = "", pronunciationUS = "", partOfSpeech = "noun", meaningVi, meaningEn = "", examples = [], synonyms = [], level = "B1", category = "General", source = "", tags = [] } = payload;
            const cleanWord = correctedWord.trim();
            const imageUrl = "";
            const newVocab = await vocab_model_1.Vocabulary.create({
                userId: new mongoose_1.Types.ObjectId(userId),
                originalInput: cleanWord,
                correctedWord: cleanWord,
                pronunciationUK,
                pronunciationUS,
                partOfSpeech,
                meaningVi,
                meaningEn,
                examples: examples.filter((item) => item?.sentence?.trim() || item?.translation?.trim()),
                synonyms,
                level,
                category,
                source,
                tags,
                imageUrl,
            });
            const streakResult = await this.updateUserStreak(userId);
            return {
                success: true,
                message: "Lưu từ vựng thủ công thành công",
                data: newVocab,
                streakUpdated: streakResult.updated,
                streakCount: streakResult.streakCount
            };
        }
        const { originalInput, source, tags: userTags = [], aiModel } = payload;
        const cleanInput = originalInput.trim();
        const cacheKey = cleanInput.toLowerCase();
        // 1. Kiểm tra xem từ/câu này đã từng được AI phân tích trong RAM hay DB chưa
        let cache = VocabService.memoryCache.get(cacheKey);
        if (!cache) {
            cache = await vocab_model_1.VocabCache.findOne({ originalInput: cacheKey }).lean();
            if (cache) {
                VocabService.memoryCache.set(cacheKey, cache);
            }
        }
        let imageUrl = "";
        if (cache) {
            logger_1.logger.info(`[AI Cache Hit] Tìm thấy kết quả phân tích cao cấp cho từ/câu: "${cleanInput}"`);
            const analysis = {
                correctedWord: cache.correctedWord,
                pronunciationUK: cache.pronunciationUK,
                pronunciationUS: cache.pronunciationUS,
                partOfSpeech: cache.partOfSpeech,
                meaningVi: cache.meaningVi,
                meaningEn: cache.meaningEn,
                examples: cache.examples,
                synonyms: cache.synonyms,
                level: cache.level,
                category: cache.category,
                tags: cache.tags,
            };
            // Ghép tags người dùng nhập + tags AI tự phân loại (giữ giá trị unique)
            const aiTags = analysis.tags || [];
            const mergedTags = Array.from(new Set([...userTags, ...aiTags]));
            // Tạo record từ vựng cá nhân cho User với isAnalyzing: false
            const newVocab = await vocab_model_1.Vocabulary.create({
                userId: new mongoose_1.Types.ObjectId(userId),
                originalInput: cleanInput,
                correctedWord: analysis.correctedWord || cleanInput,
                pronunciationUK: analysis.pronunciationUK || "",
                pronunciationUS: analysis.pronunciationUS || "",
                partOfSpeech: analysis.partOfSpeech || "noun",
                meaningVi: analysis.meaningVi || "",
                meaningEn: analysis.meaningEn || "",
                examples: analysis.examples || [],
                synonyms: analysis.synonyms || [],
                level: analysis.level || "B2",
                category: analysis.category || "General",
                source: source || "",
                tags: mergedTags,
                imageUrl,
                isAnalyzing: false,
            });
            const streakResult = await this.updateUserStreak(userId);
            return {
                success: true,
                message: "Lưu từ vựng thành công (Tải từ bộ nhớ đệm)",
                data: newVocab,
                streakUpdated: streakResult.updated,
                streakCount: streakResult.streakCount
            };
        }
        // cache miss: Gọi Gemini AI phân tích đồng bộ
        try {
            logger_1.logger.info(`[AI Calling] Bắt đầu gọi Gemini API phân tích cho: "${cleanInput}"`);
            const analysis = await geminiService.analyzeVocabulary(cleanInput, aiModel);
            // Lưu kết quả vào Cache dùng chung
            const cacheData = {
                originalInput: cacheKey,
                correctedWord: analysis.word || cleanInput,
                pronunciationUK: analysis.pronunciationUK || "",
                pronunciationUS: analysis.pronunciationUS || "",
                partOfSpeech: analysis.partOfSpeech || "noun",
                meaningVi: analysis.meaningVi || "",
                meaningEn: analysis.meaningEn || "",
                examples: analysis.examples || [],
                synonyms: analysis.synonyms || [],
                level: analysis.level || "B2",
                category: analysis.category || "General",
                tags: analysis.tags || [],
                imageUrl: "",
            };
            try {
                await vocab_model_1.VocabCache.create(cacheData);
                VocabService.memoryCache.set(cacheKey, cacheData);
            }
            catch (cacheErr) {
                logger_1.logger.error("[AI Cache] Lỗi khi lưu bộ nhớ đệm VocabCache: " + cacheErr.message);
            }
            const aiTags = analysis.tags || [];
            const mergedTags = Array.from(new Set([...userTags, ...aiTags]));
            // Tạo bản ghi chính thức và lưu luôn
            const newVocab = await vocab_model_1.Vocabulary.create({
                userId: new mongoose_1.Types.ObjectId(userId),
                originalInput: cleanInput,
                correctedWord: analysis.word || cleanInput,
                pronunciationUK: analysis.pronunciationUK || "",
                pronunciationUS: analysis.pronunciationUS || "",
                partOfSpeech: analysis.partOfSpeech || "noun",
                meaningVi: analysis.meaningVi || "",
                meaningEn: analysis.meaningEn || "",
                examples: analysis.examples || [],
                synonyms: analysis.synonyms || [],
                level: analysis.level || "B2",
                category: analysis.category || "General",
                source: source || "",
                tags: mergedTags,
                imageUrl: "",
                isAnalyzing: false,
            });
            const streakResult = await this.updateUserStreak(userId);
            return {
                success: true,
                message: "Lưu từ vựng thành công",
                data: newVocab,
                streakUpdated: streakResult.updated,
                streakCount: streakResult.streakCount
            };
        }
        catch (err) {
            logger_1.logger.error(`[AI Error] Lỗi khi phân tích cho "${cleanInput}": ` + err.message);
            // Cơ chế khôi phục khẩn cấp bằng Local Fallback khi gặp lỗi nghiêm trọng
            try {
                logger_1.logger.info(`[AI Emergency] Kích hoạt Local Fallback cho: "${cleanInput}"`);
                const fallbackAnalysis = geminiService["generateLocalFallback"](cleanInput);
                const aiTags = fallbackAnalysis.tags || [];
                const mergedTags = Array.from(new Set([...userTags, ...aiTags]));
                const newVocab = await vocab_model_1.Vocabulary.create({
                    userId: new mongoose_1.Types.ObjectId(userId),
                    originalInput: cleanInput,
                    correctedWord: fallbackAnalysis.word || cleanInput,
                    pronunciationUK: fallbackAnalysis.pronunciationUK || "",
                    pronunciationUS: fallbackAnalysis.pronunciationUS || "",
                    partOfSpeech: fallbackAnalysis.partOfSpeech || "noun",
                    meaningVi: fallbackAnalysis.meaningVi || "",
                    meaningEn: fallbackAnalysis.meaningEn || "",
                    examples: fallbackAnalysis.examples || [],
                    synonyms: fallbackAnalysis.synonyms || [],
                    level: fallbackAnalysis.level || "B2",
                    category: fallbackAnalysis.category || "General",
                    source: source || "",
                    tags: mergedTags,
                    imageUrl: "",
                    isAnalyzing: false,
                });
                const streakResult = await this.updateUserStreak(userId);
                return {
                    success: true,
                    message: "Lưu từ vựng thành công (Dữ liệu dự phòng)",
                    data: newVocab,
                    streakUpdated: streakResult.updated,
                    streakCount: streakResult.streakCount
                };
            }
            catch (fallbackErr) {
                logger_1.logger.error("[AI Emergency] Thất bại khi áp dụng Local Fallback: " + fallbackErr.message);
                throw new ApiError_1.ApiError(500, "Không thể phân tích từ vựng này. Vui lòng thử lại sau.");
            }
        }
    }
    async getByFilter(userId, filter) {
        const page = Math.max(1, parseInt(filter.page || "1", 10));
        const limit = Math.max(1, parseInt(filter.limit || "10", 10));
        const skip = (page - 1) * limit;
        const query = { userId: new mongoose_1.Types.ObjectId(userId) };
        if (filter.keyword) {
            const keywordRegex = { $regex: filter.keyword, $options: "i" };
            query.$or = [
                { originalInput: keywordRegex },
                { correctedWord: keywordRegex },
                { meaningVi: keywordRegex },
                { meaningEn: keywordRegex },
            ];
        }
        if (filter.category) {
            query.category = filter.category;
        }
        if (filter.tag) {
            query.tags = filter.tag;
        }
        const aggregateQuery = [
            { $match: query },
            { $sort: { createdAt: -1 } }
        ];
        const [records, docCounter] = await Promise.all([
            vocab_model_1.Vocabulary.aggregate([
                ...aggregateQuery,
                { $skip: skip },
                { $limit: limit },
            ]),
            vocab_model_1.Vocabulary.aggregate([...aggregateQuery, { $count: "count" }]),
        ]);
        const count = docCounter[0]?.count || 0;
        return {
            success: true,
            message: "Lấy danh sách từ vựng thành công",
            data: records,
            meta: {
                totalItems: count,
                itemCount: records.length,
                itemsPerPage: limit,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
            },
        };
    }
    async getById(userId, vocabId) {
        const record = await vocab_model_1.Vocabulary.findOne({
            _id: new mongoose_1.Types.ObjectId(vocabId),
            userId: new mongoose_1.Types.ObjectId(userId),
        }).lean();
        if (!record) {
            throw new ApiError_1.ApiError(404, "Không tìm thấy từ vựng này trong kho của bạn");
        }
        return {
            success: true,
            message: "Lấy chi tiết từ vựng thành công",
            data: record,
        };
    }
    async update(userId, vocabId, payload) {
        const record = await vocab_model_1.Vocabulary.findOneAndUpdate({
            _id: new mongoose_1.Types.ObjectId(vocabId),
            userId: new mongoose_1.Types.ObjectId(userId),
        }, { $set: payload }, { new: true });
        if (!record) {
            throw new ApiError_1.ApiError(404, "Không tìm thấy từ vựng này để cập nhật");
        }
        return {
            success: true,
            message: "Cập nhật từ vựng thành công",
            data: record,
        };
    }
    async delete(userId, vocabId) {
        const record = await vocab_model_1.Vocabulary.findOneAndDelete({
            _id: new mongoose_1.Types.ObjectId(vocabId),
            userId: new mongoose_1.Types.ObjectId(userId),
        });
        if (!record) {
            throw new ApiError_1.ApiError(404, "Không tìm thấy từ vựng này để xóa");
        }
        return {
            success: true,
            message: "Xóa từ vựng thành công",
            data: null,
        };
    }
    async getMetadata(userId) {
        const userObjectId = new mongoose_1.Types.ObjectId(userId);
        const [categoriesResult, tagsResult] = await Promise.all([
            vocab_model_1.Vocabulary.distinct("category", { userId: userObjectId }),
            vocab_model_1.Vocabulary.distinct("tags", { userId: userObjectId }),
        ]);
        return {
            success: true,
            message: "Lấy metadata thành công",
            data: {
                categories: categoriesResult.filter(Boolean),
                tags: tagsResult.filter(Boolean),
            },
        };
    }
    async getReviewQueue(userId) {
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999); // Lấy đến hết ngày hôm nay
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0); // Đầu ngày hôm nay
        const records = await vocab_model_1.Vocabulary.find({
            userId: new mongoose_1.Types.ObjectId(userId),
            $or: [
                { "srs.nextReviewDate": { $lte: endOfToday } },
                { "srs.nextReviewDate": { $exists: false } },
                { createdAt: { $gte: startOfToday } } // Giữ các từ tạo mới hôm nay luôn nằm trong danh sách học
            ],
        })
            .select("-srs.history") // Projection tối ưu hiệu năng loại bỏ history
            .sort({ "srs.nextReviewDate": 1 }) // Ôn những từ đến hạn trước
            .lean();
        return {
            success: true,
            message: "Lấy danh sách ôn tập hôm nay thành công",
            data: records,
        };
    }
    async reviewVocab(userId, vocabId, rating) {
        const record = await vocab_model_1.Vocabulary.findOne({
            _id: new mongoose_1.Types.ObjectId(vocabId),
            userId: new mongoose_1.Types.ObjectId(userId),
        });
        if (!record) {
            throw new ApiError_1.ApiError(404, "Không tìm thấy từ vựng này trong kho của bạn");
        }
        const currentRepetition = record.srs?.repetition ?? 0;
        const currentInterval = record.srs?.interval ?? 0;
        const currentEasiness = record.srs?.easiness ?? 2.5;
        const result = (0, srs_algorithm_1.calculateSM2)({
            repetition: currentRepetition,
            interval: currentInterval,
            easiness: currentEasiness,
            rating,
        });
        // Cập nhật các thông số SRS và lịch sử ôn tập
        record.srs = {
            repetition: result.repetition,
            interval: result.interval,
            easiness: result.easiness,
            nextReviewDate: result.nextReviewDate,
            history: [
                ...(record.srs?.history || []),
                {
                    reviewDate: new Date(),
                    rating,
                    prevInterval: currentInterval,
                    nextInterval: result.interval,
                },
            ],
        };
        // Tự động cập nhật chuỗi Streak khi học viên ôn tập từ vựng
        const streakResult = await this.updateUserStreak(userId);
        await record.save();
        return {
            success: true,
            message: "Đánh giá từ vựng thành công",
            data: record,
            streakUpdated: streakResult.updated,
            streakCount: streakResult.streakCount,
        };
    }
    async updateUserStreak(userId) {
        try {
            const user = await auth_model_1.default.findById(userId);
            if (!user)
                return { updated: false, streakCount: 0 };
            // Lấy ngày hôm nay ở múi giờ Việt Nam (UTC+7)
            const tzDate = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
            const todayStr = tzDate.toISOString().slice(0, 10); // "YYYY-MM-DD"
            // Lấy ngày hôm qua ở múi giờ Việt Nam (UTC+7)
            const yesterdayDate = new Date(new Date().getTime() - 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000);
            const yesterdayStr = yesterdayDate.toISOString().slice(0, 10); // "YYYY-MM-DD"
            const lastActive = user.lastActiveDate || "";
            if (lastActive === todayStr) {
                // Đã học hôm nay rồi, giữ nguyên streak
                return { updated: false, streakCount: user.streakCount || 0 };
            }
            else if (lastActive === yesterdayStr) {
                // Học liên tiếp ngày hôm qua, cộng thêm 1 ngày vào streak
                user.streakCount = (user.streakCount || 0) + 1;
                user.lastActiveDate = todayStr;
                await user.save();
                logger_1.logger.info(`[Streak Active] User ${user.username} increased streak to ${user.streakCount} days.`);
                return { updated: true, streakCount: user.streakCount };
            }
            else {
                // Bị đứt streak hoặc là từ đầu tiên, bắt đầu chu kỳ streak mới = 1
                user.streakCount = 1;
                user.lastActiveDate = todayStr;
                await user.save();
                logger_1.logger.info(`[Streak Start] User ${user.username} started new streak (1 day).`);
                return { updated: true, streakCount: user.streakCount };
            }
        }
        catch (err) {
            logger_1.logger.error("Lỗi khi cập nhật streak của User: " + err.message);
            return { updated: false, streakCount: 0 };
        }
    }
}
exports.VocabService = VocabService;
