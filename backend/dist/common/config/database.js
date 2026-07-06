"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const environment_1 = require("./environment");
const logger_1 = require("../utils/logger");
const dns_1 = __importDefault(require("dns"));
// Fix querySrv ECONNREFUSED issues on certain network/DNS setups (e.g., node dns resolution errors)
if (environment_1.MONGODB_URI.startsWith('mongodb+srv')) {
    dns_1.default.setServers(['1.1.1.1', '8.8.8.8']);
}
const connectDB = async () => {
    try {
        mongoose_1.default.set('strictQuery', true);
        await mongoose_1.default.connect(environment_1.MONGODB_URI);
        logger_1.logger.info('Database connection established successfully to ' + environment_1.MONGODB_URI);
    }
    catch (error) {
        logger_1.logger.error('Database connection failed:', error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
mongoose_1.default.connection.on('disconnected', () => {
    logger_1.logger.warn('Database connection lost. Trying to reconnect...');
});
mongoose_1.default.connection.on('error', (err) => {
    logger_1.logger.error('Database connection error occurred:', err);
});
