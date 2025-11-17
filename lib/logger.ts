/**
 * Pino logger configuration.
 * 
 * Provides structured logging throughout the application.
 * In development, uses pino-pretty for human-readable output.
 * In production, outputs JSON logs for log aggregation services.
 */
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'production' ? undefined : { target: 'pino-pretty' },
});


