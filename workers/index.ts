import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/db';
import { getStripe } from '@/lib/stripe';
import { sendReminder } from '@/lib/emails';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

type HoldExpireData = { bookingId: string };
type ReminderEmailData = { bookingId: string; template: string };
type RemainderChargeData = { bookingId: string };

async function handleHoldExpire(job: Job<HoldExpireData>) {
  const { bookingId } = job.data;
  logger.info({ bookingId }, 'Hold expiration check');
  await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({ where: { id: bookingId }, include: { days: true } });
    if (!booking) return;
    if (booking.status !== 'HELD') return;
    const anyActiveHolds = booking.days.some((d) => d.status === 'HELD' && d.holdExpiresAt && d.holdExpiresAt > new Date());
    if (anyActiveHolds) return; // Not yet expired

    await tx.bookedDay.deleteMany({ where: { bookingId: booking.id, status: 'HELD' } });
    await tx.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } });
  });
}

async function handleRemainderCharge(job: Job<RemainderChargeData>) {
  const stripe = getStripe();
  const { bookingId } = job.data;
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { payments: true } });
  if (!booking) return;
  if (booking.status !== 'CONFIRMED') return;
  const alreadyCharged = booking.payments.some((p) => p.type === 'REMAINDER' && p.status === 'succeeded');
  if (alreadyCharged) return;
  const amount = booking.totalAmount - booking.depositAmount;
  if (amount <= 0) return;
  if (!booking.stripeCustomerId) return;

  try {
    const pi = await stripe.paymentIntents.create({
      amount,
      currency: booking.currency,
      customer: booking.stripeCustomerId,
      confirm: true,
      off_session: true,
      description: `Remainder for booking ${booking.id}`,
      metadata: { bookingId: booking.id, type: 'REMAINDER' },
    });
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        stripePaymentIntentId: pi.id,
        amount,
        currency: booking.currency,
        type: 'REMAINDER',
        status: pi.status as any,
      },
    });
  } catch (e) {
    logger.error(e, 'Remainder charge failed');
    // The webhook will send failure emails.
  }
}

async function handleReminderEmail(job: Job<ReminderEmailData>) {
  const { bookingId } = job.data;
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { customer: true } });
  if (!booking || booking.status !== 'CONFIRMED') return;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const manageUrl = `${baseUrl}/manage/${booking.id}`;
  await sendReminder({ email: booking.customer.email, bookingId: booking.id, startDate: booking.startDate.toISOString().slice(0,10), manageUrl });
  await prisma.notification.create({ data: { bookingId: booking.id, template: 'reminder', sendAt: new Date(), sentAt: new Date() } });
}

const worker = new Worker('jobs', async (job) => {
  switch (job.name) {
    case 'hold-expire':
      return handleHoldExpire(job as Job<HoldExpireData>);
    case 'remainder-charge':
      return handleRemainderCharge(job as Job<RemainderChargeData>);
    case 'reminder-email':
      return handleReminderEmail(job as Job<ReminderEmailData>);
    default:
      return;
  }
}, { connection });

worker.on('ready', () => logger.info('Worker ready'));
worker.on('failed', (job, err) => logger.error({ jobId: job?.id, err }, 'Job failed'));


