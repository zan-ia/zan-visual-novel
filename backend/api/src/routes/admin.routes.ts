import { Router } from 'express';
import { CREDIT_PACKAGES, CREATOR_REVENUE_SHARE } from '@zan-vn/shared';
import { getDb, schema } from '../db/index.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { eq, like, or, and } from 'drizzle-orm';

export const adminRouter = Router();

// All admin routes require authentication + admin role
adminRouter.use(authenticate, requireAdmin);

// ── Users ────────────────────────────────────────────────

// GET /api/v1/admin/users — List users (with optional role/search filters)
adminRouter.get('/users', async (req, res) => {
  try {
    const { role, search } = req.query;
    const conditions = [];

    if (role && typeof role === 'string') {
      conditions.push(eq(schema.users.role, role as any));
    }

    if (search && typeof search === 'string') {
      conditions.push(
        or(
          like(schema.users.displayName, `%${search}%`),
          like(schema.users.email, `%${search}%`),
        ),
      );
    }

    const users = await getDb()
      .select({
        id: schema.users.id,
        email: schema.users.email,
        displayName: schema.users.displayName,
        avatarUrl: schema.users.avatarUrl,
        role: schema.users.role,
        creditsBalance: schema.users.creditsBalance,
        bio: schema.users.bio,
        socialLinks: schema.users.socialLinks,
        createdAt: schema.users.createdAt,
        updatedAt: schema.users.updatedAt,
        deletedAt: schema.users.deletedAt,
      })
      .from(schema.users)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(schema.users.createdAt);

    res.json({ success: true, data: users });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { statusCode: 500, message: 'Erro ao listar usuários', code: 'INTERNAL_ERROR' },
    });
  }
});

// PATCH /api/v1/admin/users/:id/role — Update user role
adminRouter.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !['player', 'creator', 'admin'].includes(role)) {
      res.status(400).json({
        success: false,
        error: { statusCode: 400, message: 'Role inválida', code: 'VALIDATION_ERROR' },
      });
      return;
    }

    const [updated] = await getDb()
      .update(schema.users)
      .set({ role, updatedAt: new Date() })
      .where(eq(schema.users.id, req.params.id))
      .returning({
        id: schema.users.id,
        email: schema.users.email,
        displayName: schema.users.displayName,
        role: schema.users.role,
      });

    if (!updated) {
      res.status(404).json({
        success: false,
        error: { statusCode: 404, message: 'Usuário não encontrado', code: 'NOT_FOUND' },
      });
      return;
    }

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { statusCode: 500, message: 'Erro ao atualizar role', code: 'INTERNAL_ERROR' },
    });
  }
});

// POST /api/v1/admin/users/:id/ban — Soft-delete/ban a user
adminRouter.post('/users/:id/ban', async (req, res) => {
  try {
    const [updated] = await getDb()
      .update(schema.users)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.users.id, req.params.id))
      .returning({
        id: schema.users.id,
        displayName: schema.users.displayName,
        deletedAt: schema.users.deletedAt,
      });

    if (!updated) {
      res.status(404).json({
        success: false,
        error: { statusCode: 404, message: 'Usuário não encontrado', code: 'NOT_FOUND' },
      });
      return;
    }

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { statusCode: 500, message: 'Erro ao banir usuário', code: 'INTERNAL_ERROR' },
    });
  }
});

// ── VNs (Moderation) ─────────────────────────────────────

// GET /api/v1/admin/vns — List all VNs for moderation
adminRouter.get('/vns', async (_req, res) => {
  try {
    const vns = await getDb()
      .select()
      .from(schema.visualNovels)
      .orderBy(schema.visualNovels.createdAt);

    res.json({ success: true, data: vns });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { statusCode: 500, message: 'Erro ao listar VNs', code: 'INTERNAL_ERROR' },
    });
  }
});

// PATCH /api/v1/admin/vns/:id/status — Update VN status
adminRouter.patch('/vns/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['published', 'archived', 'under_review'].includes(status)) {
      res.status(400).json({
        success: false,
        error: { statusCode: 400, message: 'Status inválido', code: 'VALIDATION_ERROR' },
      });
      return;
    }

    const [updated] = await getDb()
      .update(schema.visualNovels)
      .set({ status, updatedAt: new Date() })
      .where(eq(schema.visualNovels.id, req.params.id))
      .returning();

    if (!updated) {
      res.status(404).json({
        success: false,
        error: { statusCode: 404, message: 'VN não encontrada', code: 'NOT_FOUND' },
      });
      return;
    }

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { statusCode: 500, message: 'Erro ao atualizar status', code: 'INTERNAL_ERROR' },
    });
  }
});

// ── Credits Config ───────────────────────────────────────

// GET /api/v1/admin/credits/config — Return credit packages + revenue share
adminRouter.get('/credits/config', (_req, res) => {
  res.json({
    success: true,
    data: {
      packages: CREDIT_PACKAGES,
      creatorRevenueShare: CREATOR_REVENUE_SHARE,
    },
  });
});

// PUT /api/v1/admin/credits/config — Placeholder (config is in code)
adminRouter.put('/credits/config', (_req, res) => {
  res.json({ success: true, data: { message: 'Configuração de créditos atualizada (estática)' } });
});
