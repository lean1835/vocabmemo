"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticationMiddleware = void 0;
const token_1 = require("../utils/token");
const ApiError_1 = require("../utils/ApiError");
const authenticationMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(new ApiError_1.ApiError(401, 'Vui lòng đăng nhập để tiếp tục.'));
        }
        const token = authHeader.split(' ')[1];
        const decoded = (0, token_1.verifyToken)(token);
        req.user = {
            id: decoded.userId,
        };
        next();
    }
    catch (error) {
        next(new ApiError_1.ApiError(401, 'Token không hợp lệ hoặc đã hết hạn.'));
    }
};
exports.authenticationMiddleware = authenticationMiddleware;
