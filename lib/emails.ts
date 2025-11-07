import { Resend } from '@resend/node';
import { generateAllDayIcs } from '@/lib/ics';
import * as T from '@/emails/templates';

const resend = new Resend(process.env.RESEND_API_KEY || '');

export async function sendEmail(to: string, subject: string, html: string, attachments?: { filename: string; content: string; contentType?: string }[]) {
  const from = process.env.EMAIL_FROM || 'Sonny Venue <no-reply@example.com>';
  await resend.emails.send({ from, to, subject, html, attachments });
}

export async function sendBookingConfirmed(params: { email: string; bookingId: string; startDate: string; endDateExclusive: string; manageUrl: string; venueName: string; venueAddress?: string }) {
  const { subject, html } = T.bookingConfirmedTemplate({ bookingId: params.bookingId, startDate: params.startDate, endDateExclusive: params.endDateExclusive, manageUrl: params.manageUrl });
  const ics = generateAllDayIcs({
    title: `${params.venueName} Booking`,
    description: 'Venue reservation',
    location: params.venueAddress,
    startDate: params.startDate,
    endDateExclusive: params.endDateExclusive,
    uid: `booking-${params.bookingId}`,
    url: params.manageUrl,
  });
  await sendEmail(params.email, subject, html, [{ filename: 'booking.ics', content: ics, contentType: 'text/calendar' }]);
}

export async function sendPaymentReceipt(params: { email: string; bookingId: string; amountCents: number; currency: string }) {
  const { subject, html } = T.paymentReceiptTemplate(params);
  await sendEmail(params.email, subject, html);
}

export async function sendReminder(params: { email: string; bookingId: string; startDate: string; manageUrl: string }) {
  const { subject, html } = T.reminderTemplate(params);
  await sendEmail(params.email, subject, html);
}

export async function sendCancellation(params: { email: string; bookingId: string }) {
  const { subject, html } = T.cancellationTemplate(params);
  await sendEmail(params.email, subject, html);
}

export async function sendRefund(params: { email: string; bookingId: string; amountCents: number; currency: string }) {
  const { subject, html } = T.refundTemplate(params);
  await sendEmail(params.email, subject, html);
}


