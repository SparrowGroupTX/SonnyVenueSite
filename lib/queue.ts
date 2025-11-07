import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

export const jobsQueue = new Queue('jobs', { connection });

export type JobNames = 'hold-expire' | 'reminder-email' | 'remainder-charge' | 'email-send';

export async function enqueue<T>(name: JobNames, data: T, opts?: { delayMs?: number; jobId?: string }) {
  await jobsQueue.add(name, data as any, {
    removeOnComplete: true,
    removeOnFail: false,
    delay: opts?.delayMs || 0,
    jobId: opts?.jobId,
  });
}


