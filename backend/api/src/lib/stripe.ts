import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

/** Returns a singleton Stripe client, initialised from env on first call. */
export function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY não configurada');
    }
    stripeInstance = new Stripe(key, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    });
  }
  return stripeInstance;
}
