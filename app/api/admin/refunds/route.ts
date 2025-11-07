import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getStripe } from '@/lib/stripe';

const BodySchema = z.object({ bookingId: z.string(), amountCents: z.number().int().positive() });

export async function POST(req: NextRequest) {
  let body: any = null;
  const ct = req.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    body = await req.json().catch(() => null);
  } else if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
    const form = await req.formData().catch(() => null);
    if (form) body = Object.fromEntries(form.entries());
    if (body && typeof body.amountCents === 'string') body.amountCents = parseInt(body.amountCents, 10);
  } else {
    body = await req.json().catch(() => null);
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  const { bookingId, amountCents } = parsed.data;
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { payments: true } });
  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const stripe = getStripe();
  const succeeded = booking.payments.filter((p) => p.status === 'succeeded').sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  if (succeeded.length === 0) return NextResponse.json({ error: 'No payments' }, { status: 400 });
  const refund = await stripe.refunds.create({ payment_intent: succeeded[0].stripePaymentIntentId, amount: amountCents });
  await prisma.refund.create({ data: { bookingId, stripeRefundId: refund.id, amount: amountCents, currency: booking.currency, reason: 'admin' } });
  await prisma.auditLog.create({ data: { actor: 'admin', action: 'ADMIN_REFUND', entityType: 'Booking', entityId: bookingId, metadata: { amountCents } as any } });
  return NextResponse.json({ ok: true });
}


