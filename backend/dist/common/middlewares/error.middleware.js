"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const ApiError_1 = require("../utils/ApiError");
const logger_1 = require("../utils/logger");
const errorHandler = (err, req, res, next) => {
    let statusCode = 500;
    let message = 'Lỗi hệ thống';
    if (err instanceof ApiError_1.ApiError) {
        statusCode = err.statusCode;
        message = err.message;
    }
    else {
        logger_1.logger.error('Unhandled Server Error: %o', err);
    }
    res.status(statusCode).json({
        success: false,
        status: statusCode,
        message: message,
    });
};
exports.errorHandler = errorHandler;
