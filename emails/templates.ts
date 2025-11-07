export function bookingConfirmedTemplate(params: { bookingId: string; startDate: string; endDateExclusive: string; manageUrl: string }) {
  const subject = `Booking confirmed #${params.bookingId}`;
  const html = `<p>Your booking is confirmed for ${params.startDate} to ${params.endDateExclusive}.</p>
<p>Manage or cancel: <a href="${params.manageUrl}">${params.manageUrl}</a></p>`;
  return { subject, html };
}

export function paymentReceiptTemplate(params: { bookingId: string; amountCents: number; currency: string }) {
  const amount = (params.amountCents / 100).toFixed(2);
  const subject = `Payment received #${params.bookingId}`;
  const html = `<p>We received your payment of ${params.currency.toUpperCase()} ${amount}.</p>`;
  return { subject, html };
}

export function reminderTemplate(params: { bookingId: string; startDate: string; manageUrl: string }) {
  const subject = `Reminder: upcoming booking on ${params.startDate}`;
  const html = `<p>Your booking starts on ${params.startDate}. Manage here: <a href="${params.manageUrl}">${params.manageUrl}</a></p>`;
  return { subject, html };
}

export function cancellationTemplate(params: { bookingId: string }) {
  const subject = `Booking cancelled #${params.bookingId}`;
  const html = `<p>Your booking #${params.bookingId} has been cancelled.</p>`;
  return { subject, html };
}

export function refundTemplate(params: { bookingId: string; amountCents: number; currency: string }) {
  const amount = (params.amountCents / 100).toFixed(2);
  const subject = `Refund processed #${params.bookingId}`;
  const html = `<p>Your refund of ${params.currency.toUpperCase()} ${amount} has been processed.</p>`;
  return { subject, html };
}


