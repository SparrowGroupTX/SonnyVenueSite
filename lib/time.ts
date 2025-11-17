/**
 * Timezone-aware date/time utilities using Luxon.
 * 
 * All date operations respect the venue's timezone to ensure
 * consistent date handling regardless of server location.
 * 
 * Important: Dates are stored as date-only values (no time component)
 * to avoid timezone confusion. The venue timezone is used for
 * interpreting user input and displaying dates.
 */
import { DateTime } from 'luxon';

/**
 * Returns the venue's timezone identifier.
 * Defaults to 'America/New_York' if not configured.
 */
export function venueZone(): string {
  return process.env.VENUE_TZ || 'America/New_York';
}

/**
 * Converts a JavaScript Date to a Luxon DateTime in the venue's timezone.
 * 
 * Assumes the input Date is in UTC and converts it to venue timezone.
 */
export function toVenueDate(dt: Date): DateTime {
  return DateTime.fromJSDate(dt, { zone: 'utc' }).setZone(venueZone());
}

/**
 * Converts an ISO date string (YYYY-MM-DD) to a JavaScript Date.
 * 
 * Interprets the date string in the venue's timezone as midnight,
 * then stores as a UTC date-only value to avoid timezone drift.
 * 
 * @param iso - ISO date string (YYYY-MM-DD)
 * @returns Date object representing the date-only value
 */
export function isoDateToDateOnly(iso: string): Date {
  // Interpret ISO date (YYYY-MM-DD) in venue TZ as midnight, store as Date-only (UTC noon avoids TZ drift, but we store as @db.Date)
  const d = DateTime.fromISO(iso, { zone: venueZone() });
  return new Date(Date.UTC(d.year, d.month - 1, d.day));
}

/**
 * Converts a JavaScript Date to an ISO date string (YYYY-MM-DD).
 * 
 * Treats the Date as a date-only value and outputs in UTC.
 * 
 * @param d - Date object (treated as date-only)
 * @returns ISO date string (YYYY-MM-DD)
 */
export function dateOnlyToIsoUTC(d: Date): string {
  // Treat given Date as a date-only; output YYYY-MM-DD (UTC)
  const dt = DateTime.fromJSDate(d, { zone: 'utc' });
  return dt.toISODate()!;
}

/**
 * Enumerates all dates in a range (inclusive start, exclusive end).
 * 
 * Returns an array of ISO date strings for each day in the range.
 * Dates are interpreted in the venue's timezone.
 * 
 * @param startInclusiveISO - Start date (inclusive) in YYYY-MM-DD format
 * @param endExclusiveISO - End date (exclusive) in YYYY-MM-DD format
 * @returns Array of ISO date strings
 */
export function enumerateDates(startInclusiveISO: string, endExclusiveISO: string): string[] {
  const dates: string[] = [];
  let cur = DateTime.fromISO(startInclusiveISO, { zone: venueZone() });
  const end = DateTime.fromISO(endExclusiveISO, { zone: venueZone() });
  while (cur < end) {
    dates.push(cur.toISODate()!);
    cur = cur.plus({ days: 1 });
  }
  return dates;
}

/**
 * Calculates the start and end dates for a given month.
 * 
 * @param year - Year (e.g., 2024)
 * @param month1to12 - Month number (1-12)
 * @returns Object with startISO and endISO (exclusive) date strings
 */
export function monthBounds(year: number, month1to12: number): { startISO: string; endISO: string } {
  const start = DateTime.fromObject({ year, month: month1to12, day: 1 }, { zone: venueZone() });
  const end = start.plus({ months: 1 });
  return { startISO: start.toISODate()!, endISO: end.toISODate()! };
}


