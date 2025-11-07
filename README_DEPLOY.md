# Deploy Guide

1) Provision Postgres and Redis (or use docker-compose for local):
   - `docker compose up -d`
   - Set `DATABASE_URL` and `REDIS_URL` in `.env`.

2) Install deps and generate Prisma client:
   - `npm install`
   - `npx prisma generate`
   - `npx prisma migrate dev` (or `deploy` in production)

3) Configure Stripe and email:
   - `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
   - `RESEND_API_KEY` and `EMAIL_FROM`

4) Run dev:
   - `npm run dev`
   - Worker in another terminal: `npm run worker`

5) Production deploy options:
   - Vercel for Next.js, and a separate worker on Fly.io/Render/Railway.
   - Or Docker everywhere: `Dockerfile` (build) + `Procfile` for process types.

6) Webhooks:
   - Expose `/api/stripe/webhook` publicly.
   - Verify signatures (already enabled).


