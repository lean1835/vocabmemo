"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_model_1 = __importDefault(require("./auth.model"));
const ApiError_1 = require("../../common/utils/ApiError");
const token_1 = require("../../common/utils/token");
class AuthService {
    async register(payload) {
        const { username, email, password } = payload;
        // Check if email already exists
        const existingEmail = await auth_model_1.default.findOne({ email });
        if (existingEmail) {
            throw new ApiError_1.ApiError(400, "Email này đã được sử dụng");
        }
        // Check if username already exists
        const existingUsername = await auth_model_1.default.findOne({ username });
        if (existingUsername) {
            throw new ApiError_1.ApiError(400, "Tên đăng nhập này đã được sử dụng");
        }
        // Hash password
        const salt = await bcrypt_1.default.genSalt(10);
        const hashedPassword = await bcrypt_1.default.hash(password, salt);
        // Create user
        const newUser = await auth_model_1.default.create({
            username,
            email,
            password: hashedPassword,
        });
        const userObj = newUser.toObject();
        delete userObj.password;
        const token = (0, token_1.generateToken)({ userId: String(newUser._id) });
        return {
            success: true,
            message: "Đăng ký tài khoản thành công",
            data: {
                user: userObj,
                token,
            },
        };
    }
    async login(payload) {
        const { email, password } = payload;
        // Find user
        const user = await auth_model_1.default.findOne({ email });
        if (!user) {
            throw new ApiError_1.ApiError(401, "Email hoặc mật khẩu không chính xác");
        }
        // Verify password
        const isMatch = await bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            throw new ApiError_1.ApiError(401, "Email hoặc mật khẩu không chính xác");
        }
        const userObj = user.toObject();
        delete userObj.password;
        const token = (0, token_1.generateToken)({ userId: String(user._id) });
        return {
            success: true,
            message: "Đăng nhập thành công",
            data: {
                user: userObj,
                token,
            },
        };
    }
    async getMe(userId) {
        const user = await auth_model_1.default.findById(userId).select("-password").lean();
        if (!user) {
            throw new ApiError_1.ApiError(404, "Không tìm thấy người dùng này");
        }
        return {
            success: true,
            message: "Lấy thông tin cá nhân thành công",
            data: user,
        };
    }
}
exports.AuthService = AuthService;
