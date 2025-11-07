import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { RangeSchema } from '@/lib/validation';
import { enumerateDates } from '@/lib/time';
import { getOrCreateDefaultPolicy } from '@/lib/policy';
import { computeDeposit, quoteRange } from '@/lib/pricing';
import { enqueue } from '@/lib/queue';

const HoldRequestSchema = RangeSchema.extend({
  customer: z.object({ email: z.string().email(), name: z.string().optional(), phone: z.string().optional() }),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = HoldRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  const { startDate, endDateExclusive, customer } = parsed.data;

  const daysList = enumerateDates(startDate, endDateExclusive);
  if (daysList.length === 0) return NextResponse.json({ error: 'Empty range' }, { status: 400 });

  const ttlMinutes = Number(process.env.HOLD_TTL_MINUTES || 15);
  const holdExpiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Clear expired holds upfront
      await tx.bookedDay.deleteMany({ where: { status: 'HELD', holdExpiresAt: { lt: new Date() } } });

      // Blackout check
      const blackoutCount = await tx.blackout.count({ where: { day: { gte: new Date(startDate), lt: new Date(endDateExclusive) } } });
      if (blackoutCount > 0) throw new Error('Dates include blackouts');

      const { days, perDay, total } = quoteRange(startDate, endDateExclusive);
      const policy = await getOrCreateDefaultPolicy();
      const deposit = computeDeposit(total, policy.depositType, policy.depositValue);

      // Customer upsert
      const cust = await tx.customer.upsert({
        where: { email: customer.email },
        update: { name: customer.name, phone: customer.phone },
        create: { email: customer.email, name: customer.name, phone: customer.phone },
      });

      // Create booking first
      const booking = await tx.booking.create({
        data: {
          customerId: cust.id,
          startDate: new Date(startDate),
          endDateExclusive: new Date(endDateExclusive),
          status: 'HELD',
          depositAmount: deposit,
          totalAmount: total,
          pricingSnapshot: { days, perDay, total },
        },
      });

      // Reserve days
      const createInput = daysList.map((d) => ({ bookingId: booking.id, day: new Date(d), status: 'HELD' as const, holdExpiresAt }));
      const created = await tx.bookedDay.createMany({ data: createInput, skipDuplicates: true });
      if (created.count !== daysList.length) throw new Error('Some days are no longer available');

      return { bookingId: booking.id };
    });

    // Enqueue hold expiration
    await enqueue('hold-expire', { bookingId: result.bookingId }, { delayMs: ttlMinutes * 60 * 1000, jobId: `hold-expire:${result.bookingId}` });
    return NextResponse.json({ ok: true, bookingId: result.bookingId, holdExpiresAt });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || 'Hold failed' }, { status: 409 });
  }
}


