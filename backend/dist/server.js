"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("./app"));
const environment_1 = require("./common/config/environment");
const database_1 = require("./common/config/database");
const logger_1 = require("./common/utils/logger");
let server;
const bootstrap = async () => {
    try {
        // 1. Kết nối cơ sở dữ liệu MongoDB
        await (0, database_1.connectDB)();
        // 2. Khởi chạy HTTP Server
        server = app_1.default.listen(environment_1.PORT, () => {
            logger_1.logger.info(`VocabMemo Backend Server đang chạy tại http://localhost:${environment_1.PORT}`);
        });
    }
    catch (error) {
        logger_1.logger.error("Khởi chạy Server thất bại: " + error.message);
        process.exit(1);
    }
};
const gracefulShutdown = (signal) => {
    logger_1.logger.warn(`Nhận tín hiệu ${signal}. Đang đóng server nhẹ nhàng...`);
    if (server) {
        server.close(async () => {
            logger_1.logger.info("HTTP server đã đóng.");
            await mongoose_1.default.connection.close(false);
            logger_1.logger.info("Kết nối cơ sở dữ liệu MongoDB đã đóng.");
            process.exit(0);
        });
    }
    else {
        process.exit(0);
    }
};
// Đăng ký bộ xử lý lỗi unhandled và tín hiệu hệ thống
process.on("uncaughtException", (error) => {
    logger_1.logger.error("Lỗi uncaughtException: " + error.message, error);
    gracefulShutdown("UNCAUGHT_EXCEPTION");
});
process.on("unhandledRejection", (reason) => {
    logger_1.logger.error("Lỗi unhandledRejection: " + (reason?.message || reason));
    gracefulShutdown("UNHANDLED_REJECTION");
});
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
bootstrap();
