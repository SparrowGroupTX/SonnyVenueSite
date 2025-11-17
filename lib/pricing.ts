/**
 * Pricing calculation utilities.
 * 
 * Handles per-day pricing and deposit calculations based on booking policies.
 * All amounts are in cents (minor currency units).
 */
import { enumerateDates } from '@/lib/time';

/**
 * Returns the price per day in cents.
 * Defaults to $500/day (50000 cents) if not configured.
 */
export function dayPriceCents(): number {
  return Number(process.env.DAY_PRICE_CENTS || 50000); // $500/day default
}

/**
 * Calculates a quote for a date range.
 * 
 * @param startDate - Start date (inclusive) in YYYY-MM-DD format
 * @param endDateExclusive - End date (exclusive) in YYYY-MM-DD format
 * @returns Object with number of days, price per day, and total amount (all in cents)
 */
export function quoteRange(startDate: string, endDateExclusive: string) {
  const days = enumerateDates(startDate, endDateExclusive).length;
  const perDay = dayPriceCents();
  const total = days * perDay;
  return { days, perDay, total };
}

/**
 * Computes deposit amount based on policy type.
 * 
 * @param total - Total booking amount in cents
 * @param depositType - Either 'FIXED' (cents) or 'PERCENT' (percentage value)
 * @param value - Deposit value (cents if FIXED, percentage if PERCENT)
 * @returns Deposit amount in cents (never exceeds total)
 */
export function computeDeposit(total: number, depositType: 'FIXED' | 'PERCENT', value: number) {
  if (depositType === 'FIXED') return Math.min(value, total);
  const pct = Math.round((total * value) / 100);
  return Math.min(pct, total);
}


