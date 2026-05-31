import mongoose from "mongoose";
import app from "./app";
import { PORT } from "@config/environment";
import { connectDB } from "@config/database";
import { logger } from "@common/utils/logger";

let server: any;

const bootstrap = async () => {
  try {
    // 1. Kết nối cơ sở dữ liệu MongoDB
    await connectDB();

    // 2. Khởi chạy HTTP Server
    server = app.listen(PORT, () => {
      logger.info(`VocabMemo Backend Server đang chạy tại http://localhost:${PORT}`);
    });
  } catch (error: any) {
    logger.error("Khởi chạy Server thất bại: " + error.message);
    process.exit(1);
  }
};

const gracefulShutdown = (signal: string) => {
  logger.warn(`Nhận tín hiệu ${signal}. Đang đóng server nhẹ nhàng...`);
  if (server) {
    server.close(async () => {
      logger.info("HTTP server đã đóng.");
      await mongoose.connection.close(false);
      logger.info("Kết nối cơ sở dữ liệu MongoDB đã đóng.");
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

// Đăng ký bộ xử lý lỗi unhandled và tín hiệu hệ thống
process.on("uncaughtException", (error: Error) => {
  logger.error("Lỗi uncaughtException: " + error.message, error);
  gracefulShutdown("UNCAUGHT_EXCEPTION");
});

process.on("unhandledRejection", (reason: any) => {
  logger.error("Lỗi unhandledRejection: " + (reason?.message || reason));
  gracefulShutdown("UNHANDLED_REJECTION");
});

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

bootstrap();
