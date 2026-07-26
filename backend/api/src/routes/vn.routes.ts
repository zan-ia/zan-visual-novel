import { Router } from 'express';
import { createVNSchema, updateVNSchema, paginationSchema, createChapterSchema, updateChapterSchema, createSceneSchema, updateSceneSchema, createChoiceSchema } from '@zan-vn/shared';
import { getDb, schema } from '../db/index.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { eq, and, desc, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';

export const vnRouter = Router();

const uuidSchema = z.string().uuid('ID inválido');

// GET /api/v1/vns — List published VNs (public) or user's VNs (authenticated)
vnRouter.get('/', optionalAuth, async (req, res) => {
  try {
    const { page, pageSize } = paginationSchema.parse(req.query);
    const offset = (page - 1) * pageSize;

    let where;
    if (req.query.creator === 'me' && req.user) {
      where = eq(schema.visualNovels.creatorId, req.user.userId);
    } else {
      where = eq(schema.visualNovels.status, 'published');
    }

    const [total] = await getDb()
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.visualNovels)
      .where(where);
    const vns = await getDb()
      .select()
      .from(schema.visualNovels)
      .where(where)
      .orderBy(desc(schema.visualNovels.updatedAt))
      .limit(pageSize)
      .offset(offset);

    // Get tags for each VN
    const vnIds = vns.map((v) => v.id);
    let tags: Record<string, string[]> = {};
    if (vnIds.length > 0) {
      const tagRows = await getDb()
        .select()
        .from(schema.vnTags)
        .where(inArray(schema.vnTags.vnId, vnIds));
      for (const row of tagRows) {
        tags[row.vnId] ??= [];
        tags[row.vnId]!.push(row.tag);
      }
    }

    const data = await Promise.all(
      vns.map(async (vn) => {
        const [creator] = await getDb()
          .select({ displayName: schema.users.displayName, avatarUrl: schema.users.avatarUrl })
          .from(schema.users)
          .where(eq(schema.users.id, vn.creatorId))
          .limit(1);
        return { ...vn, creator: creator ?? null, tags: tags[vn.id] ?? [] };
      }),
    );

    res.json({
      success: true,
      data: {
        data,
        total: total?.count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((total?.count ?? 0) / pageSize),
      },
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: { statusCode: 400, message: 'Parâmetros inválidos', code: 'VALIDATION_ERROR' },
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: { statusCode: 500, message: 'Erro interno', code: 'INTERNAL_ERROR' },
    });
  }
});

// GET /api/v1/vns/:id — Get VN with full data (chapters, scenes, choices)
vnRouter.get('/:id', optionalAuth, async (req, res) => {
  try {
    const id = uuidSchema.safeParse(req.params.id);
    if (!id.success) {
      res.status(400).json({
        success: false,
        error: { statusCode: 400, message: 'ID inválido', code: 'INVALID_ID' },
      });
      return;
    }

    const [vn] = await getDb()
      .select()
      .from(schema.visualNovels)
      .where(eq(schema.visualNovels.id, id.data))
      .limit(1);
    if (!vn) {
      res.status(404).json({
        success: false,
        error: { statusCode: 404, message: 'VN não encontrada', code: 'NOT_FOUND' },
      });
      return;
    }

    const chapters = await getDb()
      .select()
      .from(schema.chapters)
      .where(eq(schema.chapters.vnId, vn.id))
      .orderBy(schema.chapters.orderIndex);
    const chapterIds = chapters.map((c) => c.id);

    let scenes: any[] = [];
    let choices: any[] = [];
    if (chapterIds.length > 0) {
      scenes = await getDb()
        .select()
        .from(schema.scenes)
        .where(inArray(schema.scenes.chapterId, chapterIds));
      const sceneIds = scenes.map((s) => s.id);
      if (sceneIds.length > 0) {
        choices = await getDb()
          .select()
          .from(schema.choices)
          .where(inArray(schema.choices.sceneId, sceneIds));
      }
    }

    const chaptersWithScenes = chapters.map((ch) => ({
      ...ch,
      scenes: scenes
        .filter((s) => s.chapterId === ch.id)
        .map((s) => ({
          ...s,
          choices: choices.filter((c) => c.sceneId === s.id),
        })),
    }));

    res.json({ success: true, data: { ...vn, chapters: chaptersWithScenes } });
  } catch {
    res.status(500).json({
      success: false,
      error: { statusCode: 500, message: 'Erro interno', code: 'INTERNAL_ERROR' },
    });
  }
});

// POST /api/v1/vns — Create new VN
vnRouter.post('/', authenticate, async (req, res) => {
  try {
    const data = createVNSchema.parse(req.body);
    const [vn] = await getDb()
      .insert(schema.visualNovels)
      .values({
        creatorId: req.user!.userId,
        title: data.title,
        synopsis: data.synopsis,
        ageRating: data.ageRating,
        priceCredits: data.priceCredits,
        iaEnabled: data.iaEnabled,
        iaSystemPrompt: data.iaSystemPrompt,
        iaPersona: data.iaPersona,
        iaMaxTokens: data.iaMaxTokens,
      })
      .returning();

    // Insert tags
    if (data.tags.length > 0) {
      await getDb()
        .insert(schema.vnTags)
        .values(data.tags.map((tag) => ({ vnId: vn!.id, tag })));
    }

    res.status(201).json({ success: true, data: vn });
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

// PATCH /api/v1/vns/:id — Update VN
vnRouter.patch('/:id', authenticate, async (req, res) => {
  try {
    const id = uuidSchema.parse(req.params.id);
    const data = updateVNSchema.parse(req.body);
    const [vn] = await getDb()
      .select()
      .from(schema.visualNovels)
      .where(eq(schema.visualNovels.id, id))
      .limit(1);
    if (!vn) {
      res.status(404).json({
        success: false,
        error: { statusCode: 404, message: 'VN não encontrada', code: 'NOT_FOUND' },
      });
      return;
    }
    if (vn.creatorId !== req.user!.userId) {
      res.status(403).json({
        success: false,
        error: { statusCode: 403, message: 'Acesso negado', code: 'FORBIDDEN' },
      });
      return;
    }

    // Guard: não permitir publicar VN sem capítulos publicados
    if (data.status === 'published') {
      const [publishedCount] = await getDb()
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.chapters)
        .where(and(eq(schema.chapters.vnId, id), eq(schema.chapters.status, 'published')));
      if (!publishedCount || publishedCount.count === 0) {
        res.status(400).json({
          success: false,
          error: {
            statusCode: 400,
            message: 'VN precisa de ao menos 1 capítulo publicado para ser publicado.',
            code: 'NO_PUBLISHED_CHAPTERS',
          },
        });
        return;
      }
    }

    await getDb()
      .update(schema.visualNovels)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.visualNovels.id, id));
    res.json({ success: true, data: { ...vn, ...data } });
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

// ── Helper ──────────────────────────────────────────────

async function getNextOrderIndex(vnId: string): Promise<number> {
  const [result] = await getDb()
    .select({ maxOrder: sql<number>`coalesce(max(${schema.chapters.orderIndex}), -1)` })
    .from(schema.chapters)
    .where(eq(schema.chapters.vnId, vnId));
  return (result?.maxOrder ?? -1) + 1;
}

// ── POST /api/v1/vns/:vnId/chapters — Create Chapter ─────

vnRouter.post('/:vnId/chapters', authenticate, async (req, res) => {
  try {
    const vnId = uuidSchema.parse(req.params.vnId);
    const [vn] = await getDb()
      .select()
      .from(schema.visualNovels)
      .where(eq(schema.visualNovels.id, vnId))
      .limit(1);
    if (!vn) {
      res.status(404).json({ success: false, error: { statusCode: 404, message: 'VN não encontrada', code: 'NOT_FOUND' } });
      return;
    }
    if (vn.creatorId !== req.user!.userId) {
      res.status(403).json({ success: false, error: { statusCode: 403, message: 'Acesso negado', code: 'FORBIDDEN' } });
      return;
    }

    const data = createChapterSchema.parse(req.body);
    const [chapter] = await getDb()
      .insert(schema.chapters)
      .values({
        vnId,
        title: data.title,
        priceCredits: data.priceCredits,
        orderIndex: await getNextOrderIndex(vnId),
      })
      .returning();

    res.status(201).json({ success: true, data: chapter });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ success: false, error: { statusCode: 400, message: err.errors[0]?.message ?? 'Dados inválidos', code: 'VALIDATION_ERROR' } });
      return;
    }
    res.status(500).json({ success: false, error: { statusCode: 500, message: 'Erro interno', code: 'INTERNAL_ERROR' } });
  }
});

// ── PUT /api/v1/vns/:vnId/chapters/:chapterId — Update Chapter

vnRouter.put('/:vnId/chapters/:chapterId', authenticate, async (req, res) => {
  try {
    const vnId = uuidSchema.parse(req.params.vnId);
    const chapterId = uuidSchema.parse(req.params.chapterId);
    const data = updateChapterSchema.parse(req.body);

    const [vn] = await getDb()
      .select()
      .from(schema.visualNovels)
      .where(eq(schema.visualNovels.id, vnId))
      .limit(1);
    if (!vn) {
      res.status(404).json({ success: false, error: { statusCode: 404, message: 'VN não encontrada', code: 'NOT_FOUND' } });
      return;
    }
    if (vn.creatorId !== req.user!.userId) {
      res.status(403).json({ success: false, error: { statusCode: 403, message: 'Acesso negado', code: 'FORBIDDEN' } });
      return;
    }

    const [existing] = await getDb()
      .select()
      .from(schema.chapters)
      .where(and(eq(schema.chapters.id, chapterId), eq(schema.chapters.vnId, vnId)))
      .limit(1);
    if (!existing) {
      res.status(404).json({ success: false, error: { statusCode: 404, message: 'Capítulo não encontrado', code: 'NOT_FOUND' } });
      return;
    }

    await getDb()
      .update(schema.chapters)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.chapters.id, chapterId));

    res.json({ success: true, data: { ...existing, ...data, updatedAt: new Date().toISOString() } });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ success: false, error: { statusCode: 400, message: err.errors[0]?.message ?? 'Dados inválidos', code: 'VALIDATION_ERROR' } });
      return;
    }
    res.status(500).json({ success: false, error: { statusCode: 500, message: 'Erro interno', code: 'INTERNAL_ERROR' } });
  }
});

// ── DELETE /api/v1/vns/:vnId/chapters/:chapterId — Delete Chapter (cascade)

vnRouter.delete('/:vnId/chapters/:chapterId', authenticate, async (req, res) => {
  try {
    const vnId = uuidSchema.parse(req.params.vnId);
    const chapterId = uuidSchema.parse(req.params.chapterId);

    const [vn] = await getDb()
      .select()
      .from(schema.visualNovels)
      .where(eq(schema.visualNovels.id, vnId))
      .limit(1);
    if (!vn) {
      res.status(404).json({ success: false, error: { statusCode: 404, message: 'VN não encontrada', code: 'NOT_FOUND' } });
      return;
    }
    if (vn.creatorId !== req.user!.userId) {
      res.status(403).json({ success: false, error: { statusCode: 403, message: 'Acesso negado', code: 'FORBIDDEN' } });
      return;
    }

    const [existing] = await getDb()
      .select()
      .from(schema.chapters)
      .where(and(eq(schema.chapters.id, chapterId), eq(schema.chapters.vnId, vnId)))
      .limit(1);
    if (!existing) {
      res.status(404).json({ success: false, error: { statusCode: 404, message: 'Capítulo não encontrado', code: 'NOT_FOUND' } });
      return;
    }

    await getDb().delete(schema.chapters).where(eq(schema.chapters.id, chapterId));

    res.json({ success: true, data: { deleted: true } });
  } catch {
    res.status(500).json({ success: false, error: { statusCode: 500, message: 'Erro interno', code: 'INTERNAL_ERROR' } });
  }
});

// ── POST /api/v1/vns/:vnId/chapters/:chapterId/scenes — Create Scene

vnRouter.post('/:vnId/chapters/:chapterId/scenes', authenticate, async (req, res) => {
  try {
    const vnId = uuidSchema.parse(req.params.vnId);
    const chapterId = uuidSchema.parse(req.params.chapterId);

    const [vn] = await getDb()
      .select()
      .from(schema.visualNovels)
      .where(eq(schema.visualNovels.id, vnId))
      .limit(1);
    if (!vn) {
      res.status(404).json({ success: false, error: { statusCode: 404, message: 'VN não encontrada', code: 'NOT_FOUND' } });
      return;
    }
    if (vn.creatorId !== req.user!.userId) {
      res.status(403).json({ success: false, error: { statusCode: 403, message: 'Acesso negado', code: 'FORBIDDEN' } });
      return;
    }

    const [chapter] = await getDb()
      .select()
      .from(schema.chapters)
      .where(and(eq(schema.chapters.id, chapterId), eq(schema.chapters.vnId, vnId)))
      .limit(1);
    if (!chapter) {
      res.status(404).json({ success: false, error: { statusCode: 404, message: 'Capítulo não encontrado', code: 'NOT_FOUND' } });
      return;
    }

    const data = createSceneSchema.parse(req.body);

    const [scene] = await getDb()
      .insert(schema.scenes)
      .values({
        chapterId,
        title: data.title,
        type: data.type,
        content: data.content,
        nextSceneId: data.nextSceneId ?? null,
      })
      .returning();

    res.status(201).json({ success: true, data: scene });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ success: false, error: { statusCode: 400, message: err.errors[0]?.message ?? 'Dados inválidos', code: 'VALIDATION_ERROR' } });
      return;
    }
    res.status(500).json({ success: false, error: { statusCode: 500, message: 'Erro interno', code: 'INTERNAL_ERROR' } });
  }
});

// ── PUT /api/v1/vns/:vnId/chapters/:chapterId/scenes/:sceneId — Update Scene

vnRouter.put('/:vnId/chapters/:chapterId/scenes/:sceneId', authenticate, async (req, res) => {
  try {
    const vnId = uuidSchema.parse(req.params.vnId);
    const chapterId = uuidSchema.parse(req.params.chapterId);
    const sceneId = uuidSchema.parse(req.params.sceneId);
    const data = updateSceneSchema.parse(req.body);

    const [vn] = await getDb()
      .select()
      .from(schema.visualNovels)
      .where(eq(schema.visualNovels.id, vnId))
      .limit(1);
    if (!vn) {
      res.status(404).json({ success: false, error: { statusCode: 404, message: 'VN não encontrada', code: 'NOT_FOUND' } });
      return;
    }
    if (vn.creatorId !== req.user!.userId) {
      res.status(403).json({ success: false, error: { statusCode: 403, message: 'Acesso negado', code: 'FORBIDDEN' } });
      return;
    }

    const [existing] = await getDb()
      .select()
      .from(schema.scenes)
      .where(and(eq(schema.scenes.id, sceneId), eq(schema.scenes.chapterId, chapterId)))
      .limit(1);
    if (!existing) {
      res.status(404).json({ success: false, error: { statusCode: 404, message: 'Cena não encontrada', code: 'NOT_FOUND' } });
      return;
    }

    const updateData: Record<string, unknown> = { ...data, updatedAt: new Date() };

    const [updated] = await getDb()
      .update(schema.scenes)
      .set(updateData as any)
      .where(eq(schema.scenes.id, sceneId))
      .returning();

    res.json({ success: true, data: updated });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ success: false, error: { statusCode: 400, message: err.errors[0]?.message ?? 'Dados inválidos', code: 'VALIDATION_ERROR' } });
      return;
    }
    res.status(500).json({ success: false, error: { statusCode: 500, message: 'Erro interno', code: 'INTERNAL_ERROR' } });
  }
});

// ── DELETE /api/v1/vns/:vnId/chapters/:chapterId/scenes/:sceneId — Delete Scene (cascade)

vnRouter.delete('/:vnId/chapters/:chapterId/scenes/:sceneId', authenticate, async (req, res) => {
  try {
    const vnId = uuidSchema.parse(req.params.vnId);
    const chapterId = uuidSchema.parse(req.params.chapterId);
    const sceneId = uuidSchema.parse(req.params.sceneId);

    const [vn] = await getDb()
      .select()
      .from(schema.visualNovels)
      .where(eq(schema.visualNovels.id, vnId))
      .limit(1);
    if (!vn) {
      res.status(404).json({ success: false, error: { statusCode: 404, message: 'VN não encontrada', code: 'NOT_FOUND' } });
      return;
    }
    if (vn.creatorId !== req.user!.userId) {
      res.status(403).json({ success: false, error: { statusCode: 403, message: 'Acesso negado', code: 'FORBIDDEN' } });
      return;
    }

    const [existing] = await getDb()
      .select()
      .from(schema.scenes)
      .where(and(eq(schema.scenes.id, sceneId), eq(schema.scenes.chapterId, chapterId)))
      .limit(1);
    if (!existing) {
      res.status(404).json({ success: false, error: { statusCode: 404, message: 'Cena não encontrada', code: 'NOT_FOUND' } });
      return;
    }

    await getDb().delete(schema.scenes).where(eq(schema.scenes.id, sceneId));

    res.json({ success: true, data: { deleted: true } });
  } catch {
    res.status(500).json({ success: false, error: { statusCode: 500, message: 'Erro interno', code: 'INTERNAL_ERROR' } });
  }
});

// ── POST /api/v1/vns/:vnId/chapters/:chapterId/scenes/:sceneId/choices — Create Choice

vnRouter.post('/:vnId/chapters/:chapterId/scenes/:sceneId/choices', authenticate, async (req, res) => {
  try {
    const vnId = uuidSchema.parse(req.params.vnId);
    const chapterId = uuidSchema.parse(req.params.chapterId);
    const sceneId = uuidSchema.parse(req.params.sceneId);

    const [vn] = await getDb()
      .select()
      .from(schema.visualNovels)
      .where(eq(schema.visualNovels.id, vnId))
      .limit(1);
    if (!vn) {
      res.status(404).json({ success: false, error: { statusCode: 404, message: 'VN não encontrada', code: 'NOT_FOUND' } });
      return;
    }
    if (vn.creatorId !== req.user!.userId) {
      res.status(403).json({ success: false, error: { statusCode: 403, message: 'Acesso negado', code: 'FORBIDDEN' } });
      return;
    }

    const [scene] = await getDb()
      .select()
      .from(schema.scenes)
      .where(and(eq(schema.scenes.id, sceneId), eq(schema.scenes.chapterId, chapterId)))
      .limit(1);
    if (!scene) {
      res.status(404).json({ success: false, error: { statusCode: 404, message: 'Cena não encontrada', code: 'NOT_FOUND' } });
      return;
    }

    const data = createChoiceSchema.parse(req.body);
    const [choice] = await getDb()
      .insert(schema.choices)
      .values({
        sceneId,
        text: data.text,
        targetSceneId: data.targetSceneId,
        orderIndex: data.orderIndex,
        isDefault: data.isDefault,
      })
      .returning();

    res.status(201).json({ success: true, data: choice });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res.status(400).json({ success: false, error: { statusCode: 400, message: err.errors[0]?.message ?? 'Dados inválidos', code: 'VALIDATION_ERROR' } });
      return;
    }
    res.status(500).json({ success: false, error: { statusCode: 500, message: 'Erro interno', code: 'INTERNAL_ERROR' } });
  }
});

// ── DELETE /api/v1/vns/:vnId/chapters/:chapterId/scenes/:sceneId/choices/:choiceId — Delete Choice (cascade)

vnRouter.delete('/:vnId/chapters/:chapterId/scenes/:sceneId/choices/:choiceId', authenticate, async (req, res) => {
  try {
    const vnId = uuidSchema.parse(req.params.vnId);
    const chapterId = uuidSchema.parse(req.params.chapterId);
    const sceneId = uuidSchema.parse(req.params.sceneId);
    const choiceId = uuidSchema.parse(req.params.choiceId);

    const [vn] = await getDb()
      .select()
      .from(schema.visualNovels)
      .where(eq(schema.visualNovels.id, vnId))
      .limit(1);
    if (!vn) {
      res.status(404).json({ success: false, error: { statusCode: 404, message: 'VN não encontrada', code: 'NOT_FOUND' } });
      return;
    }
    if (vn.creatorId !== req.user!.userId) {
      res.status(403).json({ success: false, error: { statusCode: 403, message: 'Acesso negado', code: 'FORBIDDEN' } });
      return;
    }

    // Verify the scene belongs to the chapter
    const [scene] = await getDb()
      .select()
      .from(schema.scenes)
      .where(and(eq(schema.scenes.id, sceneId), eq(schema.scenes.chapterId, chapterId)))
      .limit(1);
    if (!scene) {
      res.status(404).json({ success: false, error: { statusCode: 404, message: 'Cena não encontrada', code: 'NOT_FOUND' } });
      return;
    }

    const [existing] = await getDb()
      .select()
      .from(schema.choices)
      .where(and(eq(schema.choices.id, choiceId), eq(schema.choices.sceneId, sceneId)))
      .limit(1);
    if (!existing) {
      res.status(404).json({ success: false, error: { statusCode: 404, message: 'Escolha não encontrada', code: 'NOT_FOUND' } });
      return;
    }

    await getDb().delete(schema.choices).where(eq(schema.choices.id, choiceId));

    res.json({ success: true, data: { deleted: true } });
  } catch {
    res.status(500).json({ success: false, error: { statusCode: 500, message: 'Erro interno', code: 'INTERNAL_ERROR' } });
  }
});
