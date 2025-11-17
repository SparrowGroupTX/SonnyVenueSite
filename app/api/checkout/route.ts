/**
 * Stripe Checkout session creation endpoint.
 * 
 * Creates a Stripe Checkout session for paying the deposit on a held booking.
 * Customer is redirected to Stripe's hosted checkout page.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getStripe } from '@/lib/stripe';

const BodySchema = z.object({ bookingId: z.string() });

/**
 * POST /api/checkout
 * 
 * Creates a Stripe Checkout session for deposit payment.
 * 
 * Request body: { bookingId: string }
 * 
 * Process:
 * 1. Validates booking exists and is in HELD status
 * 2. Ensures Stripe customer exists (creates if needed)
 * 3. Creates Stripe Checkout session for deposit amount
 * 4. Returns checkout URL for redirect
 * 
 * The checkout session includes:
 * - Payment intent with setup_future_usage for remainder charges
 * - Success/cancel URLs pointing to booking management page
 * - Metadata linking to booking ID
 * 
 * Returns: { url: string } - Stripe Checkout URL
 */
export async function POST(req: NextRequest) {
  let body: any = null;
  const ct = req.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    body = await req.json().catch(() => null);
  } else if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
    const form = await req.formData().catch(() => null);
    if (form) body = Object.fromEntries(form.entries());
  } else {
    body = await req.json().catch(() => null);
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  const { bookingId } = parsed.data;

  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { customer: true } });
  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (booking.status !== 'HELD') return NextResponse.json({ error: 'Invalid state' }, { status: 400 });

  const stripe = getStripe();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  // Ensure Stripe customer exists
  let stripeCustomerId = booking.stripeCustomerId || booking.customer.stripeCustomerId || undefined;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({ email: booking.customer.email, name: booking.customer.name || undefined, metadata: { customerId: booking.customerId } });
    stripeCustomerId = customer.id;
    await prisma.customer.update({ where: { id: booking.customerId }, data: { stripeCustomerId } });
    await prisma.booking.update({ where: { id: booking.id }, data: { stripeCustomerId } });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer: stripeCustomerId,
    client_reference_id: booking.id,
    payment_intent_data: {
      setup_future_usage: 'off_session', // Allows charging remainder later without customer present
      metadata: { bookingId: booking.id, type: 'DEPOSIT' },
    },
    line_items: [
      {
        price_data: {
          currency: booking.currency,
          product_data: { name: `Deposit for booking ${booking.id}` },
          unit_amount: booking.depositAmount,
        },
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/manage/${booking.id}?success=1`,
    cancel_url: `${baseUrl}/manage/${booking.id}?canceled=1`,
    metadata: { bookingId: booking.id },
  });

  return NextResponse.json({ url: session.url });
}


