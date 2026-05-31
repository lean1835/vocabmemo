import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@common/utils/ApiError';
import { logger } from '@common/utils/logger';

export const errorHandler = (
    err: Error | ApiError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    let statusCode = 500;
    let message = 'Lỗi hệ thống';

    if (err instanceof ApiError) {
        statusCode = err.statusCode;
        message = err.message;
    } else {
        logger.error('Unhandled Server Error: %o', err);
    }

    res.status(statusCode).json({
        success: false,
        status: statusCode,
        message: message,
    });
};
