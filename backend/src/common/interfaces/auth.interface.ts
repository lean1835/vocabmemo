import { Document, Types } from 'mongoose';

export interface IUser extends Document {
    _id: Types.ObjectId;
    username: string;
    email: string;
    password?: string;
    streakCount?: number;
    lastActiveDate?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
