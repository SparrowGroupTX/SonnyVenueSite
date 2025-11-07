import { prisma } from '@/lib/db';
import React from 'react';

async function getBooking(bookingId: string) {
  return prisma.booking.findUnique({ where: { id: bookingId }, include: { customer: true, payments: true } });
}

export default async function ManageBookingPage({ params }: { params: { bookingId: string } }) {
  const booking = await getBooking(params.bookingId);
  if (!booking) return <div>Booking not found.</div>;
  const paid = booking.payments.filter(p => p.status === 'succeeded').reduce((s, p) => s + p.amount, 0);
  const remainderDue = Math.max(booking.totalAmount - booking.depositAmount, 0);
  const remainderPaid = Math.max(paid - booking.depositAmount, 0);
  const remainderOutstanding = Math.max(remainderDue - remainderPaid, 0);

  return (
    <div>
      <h1>Manage Booking</h1>
      <p><strong>ID:</strong> {booking.id}</p>
      <p><strong>Status:</strong> {booking.status}</p>
      <p><strong>Dates:</strong> {booking.startDate.toISOString().slice(0,10)} to {booking.endDateExclusive.toISOString().slice(0,10)}</p>
      <p><strong>Total:</strong> ${(booking.totalAmount/100).toFixed(2)} {booking.currency.toUpperCase()}</p>
      <p><strong>Deposit:</strong> ${(booking.depositAmount/100).toFixed(2)}</p>
      <p><strong>Remainder Outstanding:</strong> ${(remainderOutstanding/100).toFixed(2)}</p>

      {booking.status === 'HELD' && (
        <form action={`/api/checkout`} method="post">
          <input type="hidden" name="bookingId" value={booking.id} />
          <button type="submit" style={{ padding: '0.5rem 1rem' }}>Pay Deposit</button>
        </form>
      )}

      {booking.status === 'CONFIRMED' && (
        <form action={`/api/bookings/${booking.id}/cancel`} method="post" style={{ marginTop: 16 }}>
          <button type="submit" style={{ padding: '0.5rem 1rem', background: '#ef4444', color: '#fff' }}>Cancel booking</button>
        </form>
      )}
    </div>
  );
}


