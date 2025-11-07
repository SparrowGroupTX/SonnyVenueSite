import { DateTime } from 'luxon';

export function venueZone(): string {
  return process.env.VENUE_TZ || 'America/New_York';
}

export function toVenueDate(dt: Date): DateTime {
  return DateTime.fromJSDate(dt, { zone: 'utc' }).setZone(venueZone());
}

export function isoDateToDateOnly(iso: string): Date {
  // Interpret ISO date (YYYY-MM-DD) in venue TZ as midnight, store as Date-only (UTC noon avoids TZ drift, but we store as @db.Date)
  const d = DateTime.fromISO(iso, { zone: venueZone() });
  return new Date(Date.UTC(d.year, d.month - 1, d.day));
}

export function dateOnlyToIsoUTC(d: Date): string {
  // Treat given Date as a date-only; output YYYY-MM-DD (UTC)
  const dt = DateTime.fromJSDate(d, { zone: 'utc' });
  return dt.toISODate()!;
}

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

export function monthBounds(year: number, month1to12: number): { startISO: string; endISO: string } {
  const start = DateTime.fromObject({ year, month: month1to12, day: 1 }, { zone: venueZone() });
  const end = start.plus({ months: 1 });
  return { startISO: start.toISODate()!, endISO: end.toISODate()! };
}


