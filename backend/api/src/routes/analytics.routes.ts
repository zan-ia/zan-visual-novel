import { Router } from 'express';
import { eq, sum, count, sql, and, gte, desc } from 'drizzle-orm';
import { authenticate, requireRole } from '../middleware/auth.js';
import { getDb, schema } from '../db/index.js';

export const analyticsRouter = Router();

// ── All analytics routes require creator role ─────────────

analyticsRouter.use(authenticate, requireRole('creator'));

// GET /creator/summary — Aggregate analytics summary
analyticsRouter.get('/creator/summary', async (req, res) => {
  try {
    const creatorId = (req as any).user.userId;
    const db = getDb();

    // Total views: count of userVNAccess for creator's VNs
    const [viewsResult] = await db
      .select({ value: count() })
      .from(schema.userVNAccess)
      .innerJoin(schema.visualNovels, eq(schema.userVNAccess.vnId, schema.visualNovels.id))
      .where(eq(schema.visualNovels.creatorId, creatorId));

    // Total earnings: sum of creatorEarnings for this creator
    const [earningsResult] = await db
      .select({ value: sum(schema.creatorEarnings.amount) })
      .from(schema.creatorEarnings)
      .where(eq(schema.creatorEarnings.creatorId, creatorId));

    // Total VNs published by this creator
    const [vnsResult] = await db
      .select({ value: count() })
      .from(schema.visualNovels)
      .where(eq(schema.visualNovels.creatorId, creatorId));

    // Unique players: distinct count of users who accessed creator's VNs
    const [playersResult] = await db
      .select({ value: sql<number>`count(distinct ${schema.userVNAccess.userId})` })
      .from(schema.userVNAccess)
      .innerJoin(schema.visualNovels, eq(schema.userVNAccess.vnId, schema.visualNovels.id))
      .where(eq(schema.visualNovels.creatorId, creatorId));

    // Recent earnings (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentResult] = await db
      .select({ value: sum(schema.creatorEarnings.amount) })
      .from(schema.creatorEarnings)
      .where(
        and(
          eq(schema.creatorEarnings.creatorId, creatorId),
          gte(schema.creatorEarnings.earnedAt, thirtyDaysAgo),
        ),
      );

    res.json({
      success: true,
      data: {
        totalViews: Number(viewsResult?.value) || 0,
        totalEarnings: Number(earningsResult?.value) || 0,
        totalVNs: Number(vnsResult?.value) || 0,
        uniquePlayers: Number(playersResult?.value) || 0,
        recentEarnings: Number(recentResult?.value) || 0,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { statusCode: 500, message: 'Erro ao carregar analytics', code: 'INTERNAL_ERROR' },
    });
  }
});

// GET /creator/vns — List creator's VNs with per-VN metrics
analyticsRouter.get('/creator/vns', async (req, res) => {
  try {
    const creatorId = (req as any).user.userId;
    const db = getDb();

    const vns = await db
      .select({
        id: schema.visualNovels.id,
        title: schema.visualNovels.title,
        status: schema.visualNovels.status,
      })
      .from(schema.visualNovels)
      .where(eq(schema.visualNovels.creatorId, creatorId));

    // Hydrate per-VN metrics
    const result = await Promise.all(
      vns.map(async (vn) => {
        const [viewsResult] = await db
          .select({ value: count() })
          .from(schema.userVNAccess)
          .where(eq(schema.userVNAccess.vnId, vn.id));

        // All creator earnings (total) — per-VN earnings not traceable in current schema
        const [earningsResult] = await db
          .select({ value: sum(schema.creatorEarnings.amount) })
          .from(schema.creatorEarnings)
          .where(eq(schema.creatorEarnings.creatorId, creatorId));

        return {
          id: vn.id,
          title: vn.title,
          views: Number(viewsResult?.value) || 0,
          earnings: Number(earningsResult?.value) || 0,
          status: vn.status,
        };
      }),
    );

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { statusCode: 500, message: 'Erro ao carregar VNs', code: 'INTERNAL_ERROR' },
    });
  }
});

// GET /creator/earnings — Paginated earnings history (last 50)
analyticsRouter.get('/creator/earnings', async (req, res) => {
  try {
    const creatorId = (req as any).user.userId;
    const db = getDb();

    const earnings = await db
      .select({
        id: schema.creatorEarnings.id,
        amount: schema.creatorEarnings.amount,
        status: schema.creatorEarnings.status,
        earnedAt: schema.creatorEarnings.earnedAt,
      })
      .from(schema.creatorEarnings)
      .where(eq(schema.creatorEarnings.creatorId, creatorId))
      .orderBy(desc(schema.creatorEarnings.earnedAt))
      .limit(50);

    res.json({ success: true, data: earnings });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { statusCode: 500, message: 'Erro ao carregar earnings', code: 'INTERNAL_ERROR' },
    });
  }
});
