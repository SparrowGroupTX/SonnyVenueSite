# Sonny Venue Booking System

A full-featured venue booking platform similar to Airbnb, built with Next.js, Prisma, Stripe, and Redis. Customers can browse availability, reserve dates, make secure payments, and receive email notifications.

## Features

- **Availability Calendar**: View and check date availability by month
- **Temporary Holds**: Reserve dates for a limited time (default 15 minutes) before payment
- **Stripe Integration**: Secure payment processing for deposits and remainder charges
- **Email Notifications**: Automated emails for confirmations, reminders, receipts, cancellations, and refunds
- **Calendar Integration**: ICS file attachments for booking confirmations
- **Admin Dashboard**: Manage bookings, blackouts, and process refunds
- **Background Jobs**: Automated remainder charges and reminder emails via BullMQ
- **Cancellation Policy**: Configurable cancellation windows and refund handling

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Queue**: BullMQ with Redis
- **Payments**: Stripe
- **Email**: Resend
- **Logging**: Pino
- **Validation**: Zod
- **Date Handling**: Luxon

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── (admin)/           # Admin routes (protected)
│   │   └── admin/         # Admin dashboard
│   ├── (public)/          # Public routes
│   │   ├── availability/  # Availability calendar page
│   │   └── manage/         # Booking management page
│   ├── api/               # API routes
│   │   ├── admin/         # Admin endpoints (blackouts, refunds)
│   │   ├── availability/  # Check availability
│   │   ├── bookings/      # Booking operations (cancel)
│   │   ├── checkout/      # Create Stripe checkout session
│   │   ├── holds/         # Create temporary holds
│   │   └── stripe/        # Stripe webhook handler
│   ├── layout.tsx         # Root layout with header/footer
│   └── page.tsx           # Homepage
├── lib/                    # Shared utilities
│   ├── db.ts              # Prisma client singleton
│   ├── stripe.ts          # Stripe client initialization
│   ├── pricing.ts         # Pricing calculations
│   ├── policy.ts          # Booking policy management
│   ├── emails.ts          # Email sending functions
│   ├── validation.ts      # Zod schemas
│   ├── time.ts            # Date/time utilities (timezone-aware)
│   ├── ics.ts             # ICS calendar file generation
│   ├── queue.ts           # BullMQ queue setup
│   └── logger.ts          # Pino logger configuration
├── prisma/
│   └── schema.prisma      # Database schema
├── emails/
│   └── templates.ts       # Email template functions
├── workers/
│   └── index.ts           # Background job worker
└── docker-compose.yml      # Local development setup

```

## Booking Flow

1. **Check Availability**: Customer views calendar and selects dates
2. **Create Hold**: Customer submits email/name to create temporary hold (15 min default)
3. **Payment**: Customer redirected to Stripe Checkout to pay deposit
4. **Confirmation**: On successful payment, booking is confirmed via webhook
5. **Remainder Charge**: Automatically charged X days before start date (default 14 days)
6. **Reminders**: Automated email reminders sent at 14, 7, 2, and 1 day(s) before start
7. **Cancellation**: Customer can cancel within cancellation window (default 48 hours before start)

## Database Schema

### Core Models

- **Customer**: Customer information and Stripe customer ID
- **Booking**: Main booking record with status (HELD, CONFIRMED, CANCELLED, REFUNDED)
- **BookedDay**: Individual days reserved (prevents double-booking)
- **Payment**: Stripe payment records (deposits and remainder charges)
- **Refund**: Refund records for tracking
- **Blackout**: Admin-defined unavailable dates
- **Policy**: Configurable booking policies (deposit type, cancellation window, etc.)
- **Notification**: Email notification tracking
- **AuditLog**: Admin action logging

## Environment Variables

See `ENVIRONMENT.md` for complete list. Key variables:

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `STRIPE_SECRET_KEY`: Stripe API secret key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret
- `RESEND_API_KEY`: Resend email API key
- `DAY_PRICE_CENTS`: Price per day in cents (default: 50000 = $500)
- `DEPOSIT_CENTS`: Deposit amount in cents (default: 20000 = $200)
- `HOLD_TTL_MINUTES`: Hold expiration time (default: 15)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis
- Stripe account
- Resend account (or email provider)

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `ENVIRONMENT.md`)
4. Generate Prisma client: `npx prisma generate`
5. Run migrations: `npx prisma migrate dev`
6. Start development server: `npm run dev`
7. Start worker (in separate terminal): `npm run worker`

### Docker Setup

For local development with Docker:

```bash
docker compose up -d  # Starts PostgreSQL and Redis
```

## Development

### Running Locally

- **Next.js dev server**: `npm run dev` (runs on http://localhost:3000)
- **Background worker**: `npm run worker` (processes jobs from Redis queue)

### Key Endpoints

- `/` - Homepage
- `/availability` - Availability calendar
- `/manage/[bookingId]` - Booking management page
- `/admin` - Admin dashboard
- `/api/availability` - GET/POST availability checks
- `/api/holds` - POST create temporary hold
- `/api/checkout` - POST create Stripe checkout session
- `/api/stripe/webhook` - POST Stripe webhook handler
- `/api/bookings/[id]/cancel` - POST cancel booking
- `/api/admin/blackouts` - GET/POST/DELETE blackout management
- `/api/admin/refunds` - POST process refunds

## Background Jobs

The worker (`workers/index.ts`) processes the following job types:

- **hold-expire**: Expires temporary holds that weren't paid
- **remainder-charge**: Charges remainder balance before booking start
- **reminder-email**: Sends booking reminder emails

Jobs are scheduled via BullMQ and stored in Redis.

## Stripe Integration

- **Checkout Sessions**: Used for deposit payments (customer-facing)
- **Payment Intents**: Used for remainder charges (off-session, automated)
- **Webhooks**: Handles payment confirmations and failures
- **Refunds**: Supports partial and full refunds

## Email Notifications

Emails are sent via Resend for:
- Booking confirmations (with ICS attachment)
- Payment receipts
- Booking reminders (14, 7, 2, 1 days before)
- Cancellation confirmations
- Refund notifications

## Admin Features

- View all bookings
- Create/delete blackout dates
- Process refunds
- Audit log tracking

## Production Deployment

See `README_DEPLOY.md` for deployment instructions.

## License

Private - All rights reserved
