"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.register = void 0;
const catchAsync_1 = require("../../common/utils/catchAsync");
const auth_service_1 = require("./auth.service");
const authService = new auth_service_1.AuthService();
exports.register = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await authService.register(req.body);
    res.status(201).json(result);
});
exports.login = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await authService.login(req.body);
    res.status(200).json(result);
});
exports.getMe = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = req.user?.id;
    const result = await authService.getMe(userId);
    res.status(200).json(result);
});
