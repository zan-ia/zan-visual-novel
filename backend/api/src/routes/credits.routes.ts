import { Router } from 'express';
import {
  checkoutSchema,
  spendCreditsSchema,
  CREDIT_PACKAGES,
  CREATOR_REVENUE_SHARE,
} from '@zan-vn/shared';
import { db, schema } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';
import { eq, sql } from 'drizzle-orm';

export const creditsRouter = Router();

// GET /api/v1/credits/packages — List available credit packages
creditsRouter.get('/packages', (_req, res) => {
  res.json({ success: true, data: CREDIT_PACKAGES });
});

// POST /api/v1/credits/checkout — Create Stripe checkout session
creditsRouter.post('/checkout', authenticate, async (req, res) => {
  try {
    const data = checkoutSchema.parse(req.body);
    const pkg = CREDIT_PACKAGES.find((p) => p.id === data.packageId);
    if (!pkg) {
      res
        .status(400)
        .json({
          success: false,
          error: { statusCode: 400, message: 'Pacote inválido', code: 'INVALID_PACKAGE' },
        });
      return;
    }

    // In production, this would create a Stripe Checkout Session
    // For now, simulate direct credit addition (MVP mode)
    const [user] = await db
      .select({ balance: schema.users.creditsBalance })
      .from(schema.users)
      .where(eq(schema.users.id, req.user!.userId))
      .limit(1);
    if (!user) {
      res
        .status(404)
        .json({
          success: false,
          error: { statusCode: 404, message: 'Usuário não encontrado', code: 'NOT_FOUND' },
        });
      return;
    }

    const newBalance = user.balance + pkg.credits;
    await db
      .update(schema.users)
      .set({ creditsBalance: newBalance })
      .where(eq(schema.users.id, req.user!.userId));
    await db.insert(schema.creditTransactions).values({
      userId: req.user!.userId,
      type: 'purchase',
      amount: pkg.credits,
      balanceBefore: user.balance,
      balanceAfter: newBalance,
      description: `Compra: ${pkg.name} (${pkg.credits} créditos)`,
    });

    res.json({
      success: true,
      data: { url: null, credits: newBalance, message: `${pkg.credits} créditos adicionados!` },
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res
        .status(400)
        .json({
          success: false,
          error: { statusCode: 400, message: 'Dados inválidos', code: 'VALIDATION_ERROR' },
        });
      return;
    }
    res
      .status(500)
      .json({
        success: false,
        error: { statusCode: 500, message: 'Erro interno', code: 'INTERNAL_ERROR' },
      });
  }
});

// POST /api/v1/credits/spend — Spend credits to access content
creditsRouter.post('/spend', authenticate, async (req, res) => {
  try {
    const data = spendCreditsSchema.parse(req.body);
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, req.user!.userId))
      .limit(1);
    if (!user) {
      res
        .status(404)
        .json({
          success: false,
          error: { statusCode: 404, message: 'Usuário não encontrado', code: 'NOT_FOUND' },
        });
      return;
    }

    if (user.creditsBalance < data.amount) {
      res
        .status(402)
        .json({
          success: false,
          error: {
            statusCode: 402,
            message: 'Créditos insuficientes',
            code: 'INSUFFICIENT_CREDITS',
          },
        });
      return;
    }

    // Get VN creator for revenue share
    const [vn] = await db
      .select({ creatorId: schema.visualNovels.creatorId })
      .from(schema.visualNovels)
      .where(eq(schema.visualNovels.id, data.vnId))
      .limit(1);

    const newBalance = user.creditsBalance - data.amount;

    // Transaction
    await db.transaction(async (tx) => {
      await tx
        .update(schema.users)
        .set({ creditsBalance: newBalance })
        .where(eq(schema.users.id, user.id));

      const [transaction] = await tx
        .insert(schema.creditTransactions)
        .values({
          userId: user.id,
          type: 'spend',
          amount: -data.amount,
          balanceBefore: user.creditsBalance,
          balanceAfter: newBalance,
          referenceId: data.vnId,
          description: `Acesso: VN ${data.vnId}`,
        })
        .returning();

      // Creator earnings
      if (vn && transaction) {
        const creatorAmount = Math.floor(data.amount * CREATOR_REVENUE_SHARE);
        if (creatorAmount > 0) {
          await tx.insert(schema.creatorEarnings).values({
            creatorId: vn.creatorId,
            transactionId: transaction.id,
            amount: creatorAmount,
            status: 'pending',
          });
        }
      }

      // Grant access
      await tx
        .insert(schema.userVNAccess)
        .values({
          userId: user.id,
          vnId: data.vnId,
          hasFullAccess: true,
        })
        .onConflictDoUpdate({
          target: [schema.userVNAccess.userId, schema.userVNAccess.vnId],
          set: { lastAccessedAt: new Date() },
        });
    });

    res.json({ success: true, data: { balanceAfter: newBalance, spent: data.amount } });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res
        .status(400)
        .json({
          success: false,
          error: { statusCode: 400, message: 'Dados inválidos', code: 'VALIDATION_ERROR' },
        });
      return;
    }
    res
      .status(500)
      .json({
        success: false,
        error: { statusCode: 500, message: 'Erro interno', code: 'INTERNAL_ERROR' },
      });
  }
});

// GET /api/v1/credits/transactions — Get user's transaction history
creditsRouter.get('/transactions', authenticate, async (req, res) => {
  const transactions = await db
    .select()
    .from(schema.creditTransactions)
    .where(eq(schema.creditTransactions.userId, req.user!.userId))
    .orderBy(sql`${schema.creditTransactions.createdAt} DESC`)
    .limit(50);
  res.json({ success: true, data: transactions });
});
