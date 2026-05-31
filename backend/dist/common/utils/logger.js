"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = require("winston");
const environment_1 = require("../config/environment");
const logFormat = winston_1.format.combine(winston_1.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.format.errors({ stack: true }), winston_1.format.splat(), winston_1.format.json());
exports.logger = (0, winston_1.createLogger)({
    level: environment_1.NODE_ENV === 'production' ? 'warn' : 'debug',
    format: logFormat,
    defaultMeta: { service: environment_1.SERVICE_NAME },
    transports: [
        new winston_1.transports.Console({
            format: winston_1.format.combine(winston_1.format.colorize(), winston_1.format.printf(({ timestamp, level, message, stack }) => {
                return `[${timestamp}] ${level}: ${message}${stack ? `\n${stack}` : ''}`;
            })),
        }),
    ],
});
