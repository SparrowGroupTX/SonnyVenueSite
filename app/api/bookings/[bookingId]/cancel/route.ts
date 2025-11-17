/**
 * Booking cancellation endpoint.
 * 
 * Allows customers to cancel confirmed bookings within the cancellation window.
 * Processes refunds according to policy (deposit is non-refundable, remainder is refundable).
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getStripe } from '@/lib/stripe';
import { getOrCreateDefaultPolicy } from '@/lib/policy';
import { DateTime } from 'luxon';
import { venueZone } from '@/lib/time';
import { sendCancellation, sendRefund } from '@/lib/emails';

/**
 * POST /api/bookings/[bookingId]/cancel
 * 
 * Cancels a confirmed booking.
 * 
 * Requirements:
 * - Booking must be in CONFIRMED status
 * - Cancellation must be within cutoff window (default: 48 hours before start)
 * 
 * Process:
 * 1. Validates cancellation window
 * 2. Calculates refundable amount (paid - deposit; deposit is non-refundable)
 * 3. Refunds remainder payments if applicable
 * 4. Deletes booked days to free up dates
 * 5. Updates booking status to CANCELLED
 * 6. Sends cancellation and refund emails
 * 
 * Returns: { ok: true, refunded: number } - Amount refunded in cents
 */
export async function POST(_req: NextRequest, { params }: { params: { bookingId: string } }) {
  const { bookingId } = params;
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { customer: true, payments: true, days: true } });
  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (booking.status !== 'CONFIRMED') return NextResponse.json({ error: 'Only confirmed bookings can be cancelled' }, { status: 400 });

  const policy = await getOrCreateDefaultPolicy();
  const start = DateTime.fromJSDate(booking.startDate, { zone: venueZone() }).startOf('day');
  const cutoff = start.minus({ hours: policy.cancelCutoffHours });
  if (DateTime.now() > cutoff) {
    return NextResponse.json({ error: 'Cancellation window closed' }, { status: 400 });
  }

  // Compute refundable (paid - deposit)
  const paid = booking.payments.filter((p) => p.status === 'succeeded').reduce((s, p) => s + p.amount, 0);
  const refundable = Math.max(0, paid - booking.depositAmount);

  let refunded = 0;
  const stripe = getStripe();
  if (refundable > 0) {
    // Prefer refunding from remainder payment(s)
    const remainderPayments = booking.payments.filter((p) => p.type === 'REMAINDER' && p.status === 'succeeded');
    for (const pay of remainderPayments) {
      if (refunded >= refundable) break;
      const toRefund = Math.min(refundable - refunded, pay.amount);
      const r = await stripe.refunds.create({ payment_intent: pay.stripePaymentIntentId, amount: toRefund });
      await prisma.refund.create({ data: { bookingId: booking.id, stripeRefundId: r.id, amount: toRefund, currency: booking.currency, reason: 'requested_by_customer' } });
      refunded += toRefund;
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.bookedDay.deleteMany({ where: { bookingId: booking.id } });
    await tx.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } });
  });

  // Emails
  await sendCancellation({ email: booking.customer.email, bookingId: booking.id });
  if (refunded > 0) await sendRefund({ email: booking.customer.email, bookingId: booking.id, amountCents: refunded, currency: booking.currency });

  return NextResponse.json({ ok: true, refunded });
}


