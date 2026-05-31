"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const trim_middleware_1 = require("./common/middlewares/trim.middleware");
const error_middleware_1 = require("./common/middlewares/error.middleware");
const index_1 = __importDefault(require("./common/routes/index"));
const environment_1 = require("./common/config/environment");
const app = (0, express_1.default)();
// Cấu hình các middlewares dùng chung
app.use((0, cors_1.default)({
    origin: environment_1.FRONTEND_URL === "*" ? true : environment_1.FRONTEND_URL.split(","),
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use(trim_middleware_1.trimRequest);
// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ success: true, message: "VocabMemo API đang hoạt động ổn định!" });
});
// Đăng ký toàn bộ API
app.use("/api", index_1.default);
// Middleware xử lý lỗi tập trung toàn cục
app.use(error_middleware_1.errorHandler);
exports.default = app;
