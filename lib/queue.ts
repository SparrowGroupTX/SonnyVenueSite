/**
 * BullMQ job queue setup for background job processing.
 * 
 * Handles scheduling and enqueueing of background jobs like:
 * - Hold expiration
 * - Reminder emails
 * - Remainder charge processing
 * 
 * Jobs are processed by the worker process (see workers/index.ts).
 */
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

/**
 * Main job queue instance.
 * Connects to Redis for job storage and processing.
 */
export const jobsQueue = new Queue('jobs', { connection });

/**
 * Valid job type names that can be enqueued.
 */
export type JobNames = 'hold-expire' | 'reminder-email' | 'remainder-charge' | 'email-send';

/**
 * Enqueues a job for background processing.
 * 
 * @param name - Job type name
 * @param data - Job payload data
 * @param opts - Optional configuration
 * @param opts.delayMs - Delay before job execution (milliseconds)
 * @param opts.jobId - Unique job ID (useful for preventing duplicates)
 * 
 * @example
 * // Schedule a hold expiration in 15 minutes
 * await enqueue('hold-expire', { bookingId: 'abc123' }, { delayMs: 15 * 60 * 1000 });
 */
export async function enqueue<T>(name: JobNames, data: T, opts?: { delayMs?: number; jobId?: string }) {
  await jobsQueue.add(name, data as any, {
    removeOnComplete: true, // Remove completed jobs to save memory
    removeOnFail: false, // Keep failed jobs for debugging
    delay: opts?.delayMs || 0,
    jobId: opts?.jobId,
  });
}


