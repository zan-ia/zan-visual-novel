import { Router, raw } from 'express';
import { getStripe } from '../lib/stripe.js';
import { getDb, schema } from '../db/index.js';
import { CREDIT_PACKAGES } from '@zan-vn/shared';
import { eq } from 'drizzle-orm';

export const stripeWebhookRouter = Router();

// Stripe requires the raw body for signature verification
stripeWebhookRouter.post('/', raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) {
    res.status(400).json({ error: 'Missing signature or webhook secret' });
    return;
  }

  try {
    const stripe = getStripe();
    const event = stripe.webhooks.constructEvent(req.body, sig, secret);

    // Handle checkout.session.completed — credit the user
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      const packageId = session.metadata?.packageId;

      if (!userId || !packageId) {
        console.error('[Stripe Webhook] Missing metadata in session', session.id);
        res.status(400).json({ error: 'Missing metadata' });
        return;
      }

      const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
      if (!pkg) {
        console.error('[Stripe Webhook] Unknown package', packageId);
        res.status(400).json({ error: 'Unknown package' });
        return;
      }

      const db = getDb();

      // Get current balance
      const [user] = await db
        .select({ balance: schema.users.creditsBalance })
        .from(schema.users)
        .where(eq(schema.users.id, userId))
        .limit(1);

      if (!user) {
        console.error('[Stripe Webhook] User not found', userId);
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const newBalance = user.balance + pkg.credits;

      // Update balance and record transaction in a DB transaction
      await db.transaction(async (tx) => {
        await tx
          .update(schema.users)
          .set({ creditsBalance: newBalance })
          .where(eq(schema.users.id, userId));

        await tx.insert(schema.creditTransactions).values({
          userId,
          type: 'purchase',
          amount: pkg.credits,
          balanceBefore: user.balance,
          balanceAfter: newBalance,
          stripeSessionId: session.id,
          description: `Compra via Stripe: ${pkg.name} (${pkg.credits} créditos)`,
        });
      });

      console.log(
        `[Stripe Webhook] Credited ${pkg.credits} to user ${userId} (session ${session.id})`,
      );
    }

    res.json({ received: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Stripe Webhook] Error:', message);
    res.status(400).json({ error: `Webhook Error: ${message}` });
  }
});
