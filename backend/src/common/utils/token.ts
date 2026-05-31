import jwt from 'jsonwebtoken';
import { JWT_PRIVATE_KEY } from '@config/environment';

export interface ITokenPayload {
    userId: string;
}

export const generateToken = (payload: ITokenPayload): string => {
    return jwt.sign(payload, JWT_PRIVATE_KEY, { expiresIn: '7d' });
};

export const verifyToken = (token: string): ITokenPayload => {
    return jwt.verify(token, JWT_PRIVATE_KEY) as ITokenPayload;
};
