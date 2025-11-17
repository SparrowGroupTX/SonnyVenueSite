/**
 * Stripe webhook handler.
 * 
 * Processes Stripe webhook events for payment confirmations and failures.
 * This is the primary mechanism for updating booking status after payments.
 * 
 * Handles:
 * - checkout.session.completed: Confirms booking and schedules remainder charge/reminders
 * - payment_intent.succeeded: Records successful payments
 * - payment_intent.payment_failed: Records failures and retries remainder charge
 * 
 * Webhook signature verification ensures requests are from Stripe.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getOrCreateDefaultPolicy } from '@/lib/policy';
import { enqueue } from '@/lib/queue';
import { DateTime } from 'luxon';
import { venueZone } from '@/lib/time';

export const dynamic = 'force-dynamic';

/**
 * POST /api/stripe/webhook
 * 
 * Processes Stripe webhook events.
 * 
 * Verifies webhook signature before processing to ensure authenticity.
 * 
 * Event handlers:
 * 
 * checkout.session.completed:
 * - Creates payment record
 * - Confirms booking (HELD -> CONFIRMED)
 * - Converts held days to booked days
 * - Schedules remainder charge job (X days before start)
 * - Schedules reminder emails (14, 7, 2, 1 days before)
 * 
 * payment_intent.succeeded:
 * - Records successful payment (idempotent via upsert)
 * 
 * payment_intent.payment_failed:
 * - Records failed payment
 * - Retries remainder charge with exponential backoff (up to 3 attempts)
 */
export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return NextResponse.json({ error: 'Missing webhook secret' }, { status: 500 });

  const body = await req.text();
  let event: any;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    logger.error({ err }, 'Webhook signature verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as import('stripe').Stripe.Checkout.Session;
        const bookingId = (session.metadata?.bookingId || session.client_reference_id) as string;
        const paymentIntentId = session.payment_intent as string;
        const customerId = session.customer as string | null;

        await prisma.$transaction(async (tx) => {
          const booking = await tx.booking.findUnique({ where: { id: bookingId } });
          if (!booking) return;
          // Create payment record (unique on PI id enforces idempotency)
          await tx.payment.upsert({
            where: { stripePaymentIntentId: paymentIntentId },
            update: { status: 'succeeded' },
            create: {
              bookingId,
              stripePaymentIntentId: paymentIntentId,
              amount: booking.depositAmount,
              currency: booking.currency,
              type: 'DEPOSIT',
              status: 'succeeded',
            },
          });

          if (booking.status === 'CONFIRMED') return; // idempotent

          // Confirm booking and convert days to BOOKED
          await tx.bookedDay.updateMany({ where: { bookingId, status: 'HELD' }, data: { status: 'BOOKED', holdExpiresAt: null } });
          await tx.booking.update({ where: { id: bookingId }, data: { status: 'CONFIRMED', stripeCustomerId: customerId ?? undefined } });
        });
        // Schedule remainder charge and reminders
        try {
          const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
          const policy = await getOrCreateDefaultPolicy();
          if (booking) {
            const start = DateTime.fromJSDate(booking.startDate, { zone: venueZone() });
            const chargeAt = start.minus({ days: policy.remainderDaysBeforeStart }).startOf('day').set({ hour: 10 });
            const delayMs = Math.max(chargeAt.toMillis() - Date.now(), 0);
            await enqueue('remainder-charge', { bookingId }, { delayMs, jobId: `remainder-charge:${bookingId}` });

            const reminderOffsets = [14, 7, 2, 1];
            for (const d of reminderOffsets) {
              const sendAt = start.minus({ days: d }).startOf('day').set({ hour: 9 });
              const dly = Math.max(sendAt.toMillis() - Date.now(), 0);
              await enqueue('reminder-email', { bookingId, template: `reminder-${d}d` }, { delayMs: dly, jobId: `reminder-${d}d:${bookingId}` });
            }
          }
        } catch (e) {
          logger.error(e, 'Failed to schedule remainder charge');
        }
        break;
      }
      case 'payment_intent.succeeded': {
        const pi = event.data.object as import('stripe').Stripe.PaymentIntent;
        const bookingId = pi.metadata?.bookingId;
        if (!bookingId) break;
        await prisma.payment.upsert({
          where: { stripePaymentIntentId: pi.id },
          update: { status: 'succeeded' },
          create: {
            bookingId,
            stripePaymentIntentId: pi.id,
            amount: pi.amount,
            currency: pi.currency,
            type: (pi.metadata?.type as any) || 'REMAINDER',
            status: 'succeeded',
          },
        });
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as import('stripe').Stripe.PaymentIntent;
        const bookingId = pi.metadata?.bookingId;
        if (!bookingId) break;
        await prisma.payment.upsert({
          where: { stripePaymentIntentId: pi.id },
          update: { status: 'failed' },
          create: {
            bookingId,
            stripePaymentIntentId: pi.id,
            amount: pi.amount,
            currency: pi.currency,
            type: (pi.metadata?.type as any) || 'REMAINDER',
            status: 'failed',
          },
        });
        // simple retry: up to 3 attempts with backoff
        const failures = await prisma.payment.count({ where: { bookingId, type: 'REMAINDER', status: 'failed' } });
        if (failures < 3) {
          const delay = failures === 1 ? 6 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 6h then 24h
          await enqueue('remainder-charge', { bookingId }, { delayMs: delay, jobId: `remainder-charge-retry${failures}:${bookingId}` });
        }
        break;
      }
      default:
        break;
    }
  } catch (e) {
    logger.error(e, 'Error handling webhook');
    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}


