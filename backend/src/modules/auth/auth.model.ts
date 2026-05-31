import mongoose, { Schema } from 'mongoose';
import { IUser } from '@common/interfaces/auth.interface';

const UserSchema: Schema = new Schema(
    {
        username: { type: String, required: true, unique: true, trim: true },
        email: { type: String, required: true, unique: true, trim: true, lowercase: true },
        password: { type: String, required: true },
        streakCount: { type: Number, default: 0 },
        lastActiveDate: { type: String, default: "" },
    },
    { timestamps: true }
);

UserSchema.index({ email: 1 }, { name: 'idx_user_email', background: true });
UserSchema.index({ username: 1 }, { name: 'idx_user_username', background: true });

export default mongoose.model<IUser>('Users', UserSchema);
