/**
 * Stripe client initialization.
 * 
 * Returns a configured Stripe client instance with a fixed API version
 * for consistency. Throws if the secret key is not configured.
 */
import Stripe from 'stripe';

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not set');
  return new Stripe(key, { apiVersion: '2024-06-20' });
}


