import { Router } from 'express';
import { createSaveSchema } from '@zan-vn/shared';
import { getDb, schema } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';
import { eq, and } from 'drizzle-orm';

export const savesRouter = Router();

// GET /api/v1/saves — Get saves for a VN
savesRouter.get('/', authenticate, async (req, res) => {
  try {
    const vnId = req.query.vnId as string;
    const saves = await getDb()
      .select()
      .from(schema.saves)
      .where(
        and(
          eq(schema.saves.userId, req.user!.userId),
          vnId ? eq(schema.saves.vnId, vnId) : undefined,
        ),
      )
      .orderBy(schema.saves.updatedAt);
    res.json({ success: true, data: saves });
  } catch {
    res.status(500).json({
      success: false,
      error: { statusCode: 500, message: 'Erro interno', code: 'INTERNAL_ERROR' },
    });
  }
});

// POST /api/v1/saves — Create save
savesRouter.post('/', authenticate, async (req, res) => {
  try {
    const data = createSaveSchema.parse(req.body);
    const [existing] = await getDb()
      .select()
      .from(schema.saves)
      .where(
        and(
          eq(schema.saves.userId, req.user!.userId),
          eq(schema.saves.vnId, data.vnId),
          eq(schema.saves.slotNumber, data.slotNumber),
        ),
      )
      .limit(1);

    let save;
    if (existing) {
      [save] = await getDb()
        .update(schema.saves)
        .set({
          label: data.label,
          currentSceneId: data.currentSceneId,
          flags: data.flags,
          choiceHistory: data.choiceHistory,
          updatedAt: new Date(),
        })
        .where(eq(schema.saves.id, existing.id))
        .returning();
    } else {
      [save] = await getDb()
        .insert(schema.saves)
        .values({
          userId: req.user!.userId,
          vnId: data.vnId,
          slotNumber: data.slotNumber,
          label: data.label,
          currentSceneId: data.currentSceneId,
          flags: data.flags,
          choiceHistory: data.choiceHistory,
        })
        .returning();
    }

    res.status(201).json({ success: true, data: save });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: {
          statusCode: 400,
          message: err.errors[0]?.message ?? 'Dados inválidos',
          code: 'VALIDATION_ERROR',
        },
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: { statusCode: 500, message: 'Erro interno', code: 'INTERNAL_ERROR' },
    });
  }
});

// PUT /api/v1/saves/:id — Update save
savesRouter.put('/:id', authenticate, async (req, res) => {
  try {
    const [existing] = await getDb()
      .select()
      .from(schema.saves)
      .where(and(eq(schema.saves.id, req.params.id), eq(schema.saves.userId, req.user!.userId)))
      .limit(1);
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { statusCode: 404, message: 'Save não encontrado', code: 'NOT_FOUND' },
      });
      return;
    }
    const [save] = await getDb()
      .update(schema.saves)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(schema.saves.id, req.params.id))
      .returning();
    res.json({ success: true, data: save });
  } catch {
    res.status(500).json({
      success: false,
      error: { statusCode: 500, message: 'Erro interno', code: 'INTERNAL_ERROR' },
    });
  }
});
