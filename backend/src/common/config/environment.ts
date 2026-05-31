import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

export const PORT: number = parseInt(process.env.PORT || '5857', 10);
export const MONGODB_URI: string = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vocabmemo';
export const JWT_PRIVATE_KEY: string = process.env.JWT_PRIVATE_KEY || 'vocabmemo_super_secret_jwt_sign_key_987654321';
export const GEMINI_API_KEY: string = process.env.GEMINI_API_KEY || '';
export const SERVICE_NAME: string = process.env.SERVICE_NAME || 'vocabmemo-api';
export const NODE_ENV: string = process.env.NODE_ENV || 'development';
export const FRONTEND_URL: string = process.env.FRONTEND_URL || '*';
