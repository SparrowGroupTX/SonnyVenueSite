/**
 * Zod validation schemas for API requests.
 * 
 * Provides type-safe validation for common request patterns like
 * month queries and date ranges.
 */
import { z } from 'zod';

/**
 * Schema for month-based availability queries.
 * Validates year (1970-2100) and month (1-12).
 */
export const MonthQuerySchema = z.object({
  year: z.coerce.number().int().min(1970).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

/**
 * Schema for date range requests.
 * Validates ISO date strings (YYYY-MM-DD format).
 * 
 * Note: endDateExclusive means the end date is NOT included in the range.
 */
export const RangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDateExclusive: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type MonthQuery = z.infer<typeof MonthQuerySchema>;
export type DateRange = z.infer<typeof RangeSchema>;


