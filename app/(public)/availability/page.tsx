/**
 * Availability calendar page.
 * 
 * Client-side component that displays a calendar view of available dates
 * and allows customers to create temporary holds on date ranges.
 */
"use client";
import React, { useEffect, useMemo, useState } from 'react';

function todayParts() {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export default function AvailabilityPage() {
  const [year, setYear] = useState(todayParts().year);
  const [month, setMonth] = useState(todayParts().month);
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDateExclusive, setEndDateExclusive] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Fetch unavailable dates when month/year changes
  useEffect(() => {
    fetch(`/api/availability?year=${year}&month=${month}`)
      .then(r => r.json())
      .then(d => setUnavailable(d.unavailable || []));
  }, [year, month]);

  const daysInMonth = useMemo(() => new Date(year, month, 0).getDate(), [year, month]);

  /**
   * Creates a temporary hold on the selected date range.
   * 
   * On success, displays the booking ID for reference.
   * Customer can then proceed to payment via the booking management page.
   */
  async function holdDates(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setMessage(null);
    const res = await fetch('/api/holds', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ startDate, endDateExclusive, customer: { email, name } }) });
    const data = await res.json();
    if (!data.ok) { setError(data.error || 'Failed to hold'); return; }
    setMessage(`Hold created. Booking ID: ${data.bookingId}`);
  }

  return (
    <div>
      <h1>Availability</h1>
      <div style={{ display: 'flex', gap: 16 }}>
        <label>Year <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value, 10))} /></label>
        <label>Month <input type="number" value={month} onChange={e => setMonth(parseInt(e.target.value, 10))} /></label>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginTop: 16 }}>
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const iso = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const disabled = unavailable.includes(iso);
          return <div key={iso} style={{ padding: 8, border: '1px solid #eee', background: disabled ? '#fee2e2' : '#e5fbe5' }}>{day}</div>;
        })}
      </div>

      <h2 style={{ marginTop: 24 }}>Hold dates</h2>
      <form onSubmit={holdDates}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <label>Start date <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required /></label>
          <label>End date (exclusive) <input type="date" value={endDateExclusive} onChange={e => setEndDateExclusive(e.target.value)} required /></label>
          <label>Email <input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
          <label>Name <input value={name} onChange={e => setName(e.target.value)} /></label>
          <button type="submit">Create hold</button>
        </div>
      </form>
      {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
      {message && <p style={{ color: '#065f46' }}>{message}</p>}
    </div>
  );
}


