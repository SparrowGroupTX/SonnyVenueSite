/**
 * Homepage component.
 * 
 * Landing page with basic information and link to availability calendar.
 */
export default function HomePage() {
  return (
    <div>
      <h1>Book the Venue by Day</h1>
      <p>Check availability and reserve your dates. Deposits collected securely via Stripe.</p>
      <p>
        <a href="/availability" style={{ display: 'inline-block', padding: '0.75rem 1rem', background: '#111827', color: '#fff', borderRadius: 8 }}>View Availability</a>
      </p>
    </div>
  );
}


