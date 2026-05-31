"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FRONTEND_URL = exports.NODE_ENV = exports.SERVICE_NAME = exports.GEMINI_API_KEY = exports.JWT_PRIVATE_KEY = exports.MONGODB_URI = exports.PORT = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../../.env') });
exports.PORT = parseInt(process.env.PORT || '5857', 10);
exports.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vocabmemo';
exports.JWT_PRIVATE_KEY = process.env.JWT_PRIVATE_KEY || 'vocabmemo_super_secret_jwt_sign_key_987654321';
exports.GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
exports.SERVICE_NAME = process.env.SERVICE_NAME || 'vocabmemo-api';
exports.NODE_ENV = process.env.NODE_ENV || 'development';
exports.FRONTEND_URL = process.env.FRONTEND_URL || '*';
