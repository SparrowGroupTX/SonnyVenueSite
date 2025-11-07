# Environment Variables

Copy into a `.env` file:

- NEXT_PUBLIC_BASE_URL=http://localhost:3000
- DATABASE_URL=postgresql://user:password@localhost:5432/sonny_venue?schema=public
- REDIS_URL=redis://localhost:6379
- STRIPE_SECRET_KEY=sk_test_...
- STRIPE_WEBHOOK_SECRET=whsec_...
- RESEND_API_KEY=re_...
- EMAIL_FROM="Sonny Venue <no-reply@yourdomain.com>"
- VENUE_TZ=America/New_York
- VENUE_NAME=Sonny Venue
- VENUE_ADDRESS_LINE1=123 Main St
- VENUE_ADDRESS_CITY=YourCity
- VENUE_ADDRESS_REGION=ST
- VENUE_ADDRESS_POSTAL=00000
- VENUE_ADDRESS_COUNTRY=US
- DAY_PRICE_CENTS=50000
- DEPOSIT_CENTS=20000
- REMAINDER_DAYS=14
- CANCEL_CUTOFF_HOURS=48
- HOLD_TTL_MINUTES=15
- SENTRY_DSN=
- SENTRY_TRACES_SAMPLE_RATE=0


