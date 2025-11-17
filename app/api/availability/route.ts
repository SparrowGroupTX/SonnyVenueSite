/**
 * Availability API endpoint.
 * 
 * GET: Returns unavailable dates for a given month (booked days, active holds, blackouts)
 * POST: Validates if a date range is available for booking
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { MonthQuerySchema, RangeSchema } from '@/lib/validation';
import { monthBounds } from '@/lib/time';

/**
 * GET /api/availability?year=YYYY&month=M
 * 
 * Returns unavailable dates for the specified month.
 * Includes:
 * - Confirmed bookings (BOOKED status)
 * - Active holds (HELD status with unexpired holdExpiresAt)
 * - Blackout dates
 * 
 * Expired holds are automatically excluded.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const parsed = MonthQuerySchema.safeParse({
    year: url.searchParams.get('year'),
    month: url.searchParams.get('month'),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
  }
  const { year, month } = parsed.data;
  const { startISO, endISO } = monthBounds(year, month);

  // Fetch booked/held days and blackouts
  const [days, blackouts] = await Promise.all([
    prisma.bookedDay.findMany({
      where: { day: { gte: new Date(startISO), lt: new Date(endISO) } },
      select: { day: true, status: true, holdExpiresAt: true },
    }),
    prisma.blackout.findMany({
      where: { day: { gte: new Date(startISO), lt: new Date(endISO) } },
      select: { day: true },
    }),
  ]);

  const taken = new Set<string>();
  const now = new Date();
  for (const d of days) {
    // consider held days as taken only if not expired
    if (d.status === 'BOOKED' || (d.status === 'HELD' && d.holdExpiresAt && d.holdExpiresAt > now)) {
      taken.add(d.day.toISOString().slice(0, 10));
    }
  }
  for (const b of blackouts) taken.add(b.day.toISOString().slice(0, 10));

  return NextResponse.json({
    month: { year, month },
    unavailable: Array.from(taken),
  });
}

/**
 * POST /api/availability
 * 
 * Validates if a date range is available for booking.
 * 
 * Request body: { startDate: "YYYY-MM-DD", endDateExclusive: "YYYY-MM-DD" }
 * 
 * Returns:
 * - { ok: true } if range is available
 * - { ok: false, conflicts: [...] } if conflicts exist
 * 
 * Checks for:
 * - Confirmed bookings
 * - Active (unexpired) holds
 * - Blackout dates
 */
export async function POST(req: NextRequest) {
  // Validate a requested range is free (ignoring expired holds)
  const body = await req.json().catch(() => null);
  const parsed = RangeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  const { startDate, endDateExclusive } = parsed.data;

  const [conflicts, blackouts] = await Promise.all([
    prisma.bookedDay.findMany({
      where: {
        day: { gte: new Date(startDate), lt: new Date(endDateExclusive) },
        OR: [
          { status: 'BOOKED' },
          { status: 'HELD', holdExpiresAt: { gt: new Date() } },
        ],
      },
      select: { day: true },
    }),
    prisma.blackout.findMany({
      where: { day: { gte: new Date(startDate), lt: new Date(endDateExclusive) } },
      select: { day: true },
    }),
  ]);

  if (conflicts.length > 0 || blackouts.length > 0) {
    return NextResponse.json({ ok: false, conflicts: [...conflicts, ...blackouts].map(d => d.day.toISOString().slice(0,10)) });
  }
  return NextResponse.json({ ok: true });
}


