import mongoose from 'mongoose';
import { MONGODB_URI } from './environment';
import { logger } from '@common/utils/logger';
import dns from 'dns';

// Fix querySrv ECONNREFUSED issues on certain network/DNS setups (e.g., node dns resolution errors)
if (MONGODB_URI.startsWith('mongodb+srv')) {
    dns.setServers(['1.1.1.1', '8.8.8.8']);
}


export const connectDB = async (): Promise<void> => {
    try {
        mongoose.set('strictQuery', true);
        await mongoose.connect(MONGODB_URI);
        logger.info('Database connection established successfully to ' + MONGODB_URI);
    } catch (error) {
        logger.error('Database connection failed:', error);
        process.exit(1);
    }
};

mongoose.connection.on('disconnected', () => {
    logger.warn('Database connection lost. Trying to reconnect...');
});

mongoose.connection.on('error', (err) => {
    logger.error('Database connection error occurred:', err);
});
