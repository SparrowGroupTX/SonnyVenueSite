/**
 * Root layout component.
 * 
 * Provides the base HTML structure, metadata, and shared layout elements
 * (header, footer) for all pages.
 */
import './globals.css';
import React from 'react';

export const metadata = {
  title: 'Sonny Venue',
  description: 'Reserve the venue by day with simple checkout',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
          <a href="/" style={{ fontWeight: 700 }}>Sonny Venue</a>
          <nav style={{ float: 'right' }}>
            <a href="/availability">Availability</a>
          </nav>
        </header>
        <main style={{ maxWidth: 960, margin: '2rem auto', padding: '0 1rem' }}>{children}</main>
        <footer style={{ padding: '2rem 1rem', borderTop: '1px solid #eee' }}>
          <small>© {new Date().getFullYear()} Sonny Venue</small>
        </footer>
      </body>
    </html>
  );
}


