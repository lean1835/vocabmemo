import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { trimRequest } from "@common/middlewares/trim.middleware";
import { errorHandler } from "@common/middlewares/error.middleware";
import ApiRouter from "@common/routes/index";
import { FRONTEND_URL } from "@config/environment";

const app = express();

// Cấu hình các middlewares dùng chung
app.use(
  cors({
    origin: FRONTEND_URL === "*" ? true : FRONTEND_URL.split(","),
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(trimRequest);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "VocabMemo API đang hoạt động ổn định!" });
});

// Đăng ký toàn bộ API
app.use("/api", ApiRouter);

// Middleware xử lý lỗi tập trung toàn cục
app.use(errorHandler);

export default app;
