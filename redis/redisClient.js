import IORedis from 'ioredis';
import { Queue } from 'bullmq';

// Shared Redis connection for BullMQ
export const connection = new IORedis(process.env.REDIS_URL);
export const diffQueue = new Queue('diff-processing', { connection });