import { Request, Response, NextFunction } from 'express';

const trimInPlace = (obj: any): void => {
    if (!obj || typeof obj !== 'object') return;
    Object.keys(obj).forEach((key) => {
        if (typeof obj[key] === 'string') {
            obj[key] = obj[key].trim();
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            trimInPlace(obj[key]);
        }
    });
};

export const trimRequest = (req: Request, res: Response, next: NextFunction): void => {
    if (req.body) trimInPlace(req.body);
    if (req.query) trimInPlace(req.query);
    if (req.params) trimInPlace(req.params);
    next();
};
