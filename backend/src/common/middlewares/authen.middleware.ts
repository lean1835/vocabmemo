import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@common/utils/token';
import { ApiError } from '@common/utils/ApiError';

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
            };
        }
    }
}

export const authenticationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(new ApiError(401, 'Vui lòng đăng nhập để tiếp tục.'));
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        req.user = {
            id: decoded.userId,
        };
        next();
    } catch (error) {
        next(new ApiError(401, 'Token không hợp lệ hoặc đã hết hạn.'));
    }
};
