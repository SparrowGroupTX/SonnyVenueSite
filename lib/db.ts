/**
 * Database client singleton for Prisma.
 * 
 * Uses a global instance in development to prevent multiple PrismaClient instances
 * during hot reloading, which can cause connection pool exhaustion.
 * 
 * In production, creates a new instance per serverless function invocation.
 */
import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient = global.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}


