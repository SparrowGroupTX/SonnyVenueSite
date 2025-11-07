import { z } from 'zod';

export const MonthQuerySchema = z.object({
  year: z.coerce.number().int().min(1970).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

export const RangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDateExclusive: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type MonthQuery = z.infer<typeof MonthQuerySchema>;
export type DateRange = z.infer<typeof RangeSchema>;


