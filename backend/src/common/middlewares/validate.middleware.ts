import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiError } from '@common/utils/ApiError';

export const validate = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const errorMessage = error.details.map((details) => details.message).join(', ');
            return next(new ApiError(400, errorMessage));
        }

        req.body = value;
        next();
    };
};
