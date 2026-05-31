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
const auth_model_1 = __importDefault(require("../auth/auth.model"));
const geminiService = new gemini_service_1.GeminiService();
class VocabService {
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
        // 1. Kiểm tra xem từ/câu này đã từng được AI phân tích chưa
        let cache = await vocab_model_1.VocabCache.findOne({ originalInput: cacheKey }).lean();
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
        // cache miss: Phản hồi siêu tốc chuẩn senior bằng cách tạo bản ghi tạm thời và chạy nền bất đồng bộ
        logger_1.logger.info(`[AI Cache Miss] Bắt đầu xử lý bất đồng bộ cho từ: "${cleanInput}". Tạo bản ghi giữ chỗ.`);
        const newVocab = await vocab_model_1.Vocabulary.create({
            userId: new mongoose_1.Types.ObjectId(userId),
            originalInput: cleanInput,
            correctedWord: cleanInput,
            pronunciationUK: "",
            pronunciationUS: "",
            partOfSpeech: "noun",
            meaningVi: "AI đang phân tích nghĩa...",
            meaningEn: "=AI is analyzing this vocabulary, please wait...",
            examples: [],
            synonyms: [],
            level: "B2",
            category: "General",
            source: source || "",
            tags: userTags,
            imageUrl: "",
            isAnalyzing: true,
        });
        const streakResult = await this.updateUserStreak(userId);
        // Kích hoạt background process không đồng bộ, không dùng await để giải phóng main thread ngay lập tức
        (async () => {
            try {
                logger_1.logger.info(`[Background AI] Bắt đầu gọi Gemini API phân tích cho từ: "${cleanInput}"`);
                const analysis = await geminiService.analyzeVocabulary(cleanInput, aiModel);
                // Lưu kết quả vào Cache dùng chung
                try {
                    await vocab_model_1.VocabCache.create({
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
                    });
                }
                catch (cacheErr) {
                    logger_1.logger.error("[Background AI] Lỗi khi lưu bộ nhớ đệm VocabCache: " + cacheErr.message);
                }
                const aiTags = analysis.tags || [];
                const mergedTags = Array.from(new Set([...userTags, ...aiTags]));
                // Cập nhật bản ghi chính thức
                await vocab_model_1.Vocabulary.findByIdAndUpdate(newVocab._id, {
                    $set: {
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
                        tags: mergedTags,
                        isAnalyzing: false,
                    }
                });
                logger_1.logger.info(`[Background AI] Hoàn tất cập nhật dữ liệu phân tích thành công cho: "${cleanInput}"`);
            }
            catch (err) {
                logger_1.logger.error(`[Background AI] Lỗi nghiêm trọng khi phân tích cho "${cleanInput}": ` + err.message);
                // Cơ chế khôi phục khẩn cấp bằng Local Fallback khi gặp lỗi nghiêm trọng
                try {
                    logger_1.logger.info(`[Background AI Emergency] Kích hoạt Local Fallback khẩn cấp cho từ: "${cleanInput}"`);
                    const fallbackAnalysis = geminiService["generateLocalFallback"](cleanInput);
                    const aiTags = fallbackAnalysis.tags || [];
                    const mergedTags = Array.from(new Set([...userTags, ...aiTags]));
                    await vocab_model_1.Vocabulary.findByIdAndUpdate(newVocab._id, {
                        $set: {
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
                            tags: mergedTags,
                            isAnalyzing: false,
                        }
                    });
                    logger_1.logger.info(`[Background AI Emergency] Đã khắc phục sự cố thành công bằng Local Fallback cho từ: "${cleanInput}"`);
                }
                catch (fallbackErr) {
                    logger_1.logger.error("[Background AI Emergency] Thất bại khi áp dụng Local Fallback: " + fallbackErr.message);
                    // Trường hợp xấu nhất, tắt trạng thái analyzing và ghi nhận lỗi để không bị đơ giao diện
                    await vocab_model_1.Vocabulary.findByIdAndUpdate(newVocab._id, {
                        $set: {
                            meaningVi: "Không thể phân tích từ vựng này. Vui lòng thử lại hoặc chỉnh sửa thủ công.",
                            isAnalyzing: false,
                        }
                    });
                }
            }
        })();
        return {
            success: true,
            message: "Lưu từ vựng thành công (AI đang phân tích bất đồng bộ dưới nền)",
            data: newVocab,
            streakUpdated: streakResult.updated,
            streakCount: streakResult.streakCount
        };
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
