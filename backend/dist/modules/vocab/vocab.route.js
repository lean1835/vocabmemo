"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validate_middleware_1 = require("../../common/middlewares/validate.middleware");
const authen_middleware_1 = require("../../common/middlewares/authen.middleware");
const vocab_validation_1 = require("./vocab.validation");
const vocab_controller_1 = require("./vocab.controller");
const router = (0, express_1.Router)();
// Toàn bộ các route từ vựng bắt buộc phải đăng nhập
router.use(authen_middleware_1.authenticationMiddleware);
router.post("/", (0, validate_middleware_1.validate)(vocab_validation_1.createVocabSchema), vocab_controller_1.createVocab);
router.get("/", vocab_controller_1.getVocabs);
router.get("/metadata", vocab_controller_1.getVocabMetadata);
router.get("/review-today", vocab_controller_1.getReviewQueue);
router.get("/:id", vocab_controller_1.getVocabById);
router.put("/:id", (0, validate_middleware_1.validate)(vocab_validation_1.updateVocabSchema), vocab_controller_1.updateVocab);
router.patch("/:id/review", (0, validate_middleware_1.validate)(vocab_validation_1.reviewVocabSchema), vocab_controller_1.reviewVocab);
router.delete("/:id", vocab_controller_1.deleteVocab);
exports.default = router;
