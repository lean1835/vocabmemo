import { createLogger, format, transports } from 'winston';
import { NODE_ENV, SERVICE_NAME } from '@config/environment';

const logFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
);

export const logger = createLogger({
    level: NODE_ENV === 'production' ? 'warn' : 'debug',
    format: logFormat,
    defaultMeta: { service: SERVICE_NAME },
    transports: [
        new transports.Console({
            format: format.combine(
                format.colorize(),
                format.printf(({ timestamp, level, message, stack }) => {
                    return `[${timestamp}] ${level}: ${message}${stack ? `\n${stack}` : ''}`;
                }),
            ),
        }),
    ],
});
