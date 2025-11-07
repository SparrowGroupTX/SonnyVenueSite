import { prisma } from '@/lib/db';
import Link from 'next/link';

async function getData() {
  const bookings = await prisma.booking.findMany({ orderBy: { startDate: 'asc' }, include: { customer: true } });
  const blackouts = await prisma.blackout.findMany({ orderBy: { day: 'asc' } });
  return { bookings, blackouts };
}

export default async function AdminPage() {
  const { bookings, blackouts } = await getData();
  return (
    <div>
      <h1>Admin</h1>
      <h2>Bookings</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr><th align="left">ID</th><th align="left">Dates</th><th align="left">Customer</th><th align="left">Status</th><th></th></tr>
        </thead>
        <tbody>
          {bookings.map(b => (
            <tr key={b.id} style={{ borderTop: '1px solid #eee' }}>
              <td>{b.id}</td>
              <td>{b.startDate.toISOString().slice(0,10)} → {b.endDateExclusive.toISOString().slice(0,10)}</td>
              <td>{b.customer.email}</td>
              <td>{b.status}</td>
              <td>
                <Link href={`/manage/${b.id}`}>Open</Link>
                {b.status === 'CONFIRMED' && (
                  <form action="/api/admin/refunds" method="post" style={{ display: 'inline-block', marginLeft: 12 }}>
                    <input type="hidden" name="bookingId" value={b.id} />
                    <input type="number" name="amountCents" placeholder="Amount (cents)" style={{ width: 140 }} />
                    <button type="submit">Refund</button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: 32 }}>Blackouts</h2>
      <ul>
        {blackouts.map(b => (<li key={b.id}>{b.day.toISOString().slice(0,10)} — {b.reason}</li>))}
      </ul>
      <form action="/api/admin/blackouts" method="post" style={{ marginTop: 16 }}>
        <input name="day" placeholder="YYYY-MM-DD" />
        <input name="reason" placeholder="Reason" />
        <button type="submit">Add blackout</button>
      </form>
    </div>
  );
}


