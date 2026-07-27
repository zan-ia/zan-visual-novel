import { Router } from 'express';
import {
  createVNSchema,
  updateVNSchema,
  paginationSchema,
  createChapterSchema,
  updateChapterSchema,
  createSceneSchema,
  updateSceneSchema,
  createChoiceSchema,
  updateChoiceSchema,
} from '@zan-vn/shared';
import { getDb, schema } from '../db/index.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { eq, and, desc, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import {
  cascadeAfterUpdate,
  cascadeAfterChapterDelete,
  cascadeAfterSceneDelete,
  setPublishedAtIfPublished,
  validateSceneReference,
} from '../db/cascade-references.js';

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
    const tags: Record<string, string[]> = {};
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
    let sceneAssets: any[] = [];
    let assets: any[] = [];
    let choiceConditions: any[] = [];
    let choiceEffects: any[] = [];
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
        const choiceIds = choices.map((c) => c.id);
        if (choiceIds.length > 0) {
          choiceConditions = await getDb()
            .select()
            .from(schema.choiceConditions)
            .where(inArray(schema.choiceConditions.choiceId, choiceIds));
          choiceEffects = await getDb()
            .select()
            .from(schema.choiceEffects)
            .where(inArray(schema.choiceEffects.choiceId, choiceIds));
        }
        sceneAssets = await getDb()
          .select()
          .from(schema.sceneAssets)
          .where(inArray(schema.sceneAssets.sceneId, sceneIds));
        const assetIds = sceneAssets.map((sa) => sa.assetId);
        if (assetIds.length > 0) {
          assets = await getDb()
            .select()
            .from(schema.assets)
            .where(inArray(schema.assets.id, assetIds));
        }
      }
    }

    const chaptersWithScenes = chapters.map((ch) => ({
      ...ch,
      scenes: scenes
        .filter((s) => s.chapterId === ch.id)
        .map((s) => ({
          ...s,
          choices: choices
            .filter((c) => c.sceneId === s.id)
            .map((c) => ({
              ...c,
              conditions: choiceConditions.filter((cc) => cc.choiceId === c.id),
              effects: choiceEffects.filter((ce) => ce.choiceId === c.id),
            })),
          assets: sceneAssets
            .filter((sa) => sa.sceneId === s.id)
            .map((sa) => ({
              ...sa,
              asset: assets.find((a) => a.id === sa.assetId) ?? null,
            })),
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

    // Cascade: se status mudou para published, define published_at
    if (data.status === 'published') {
      await setPublishedAtIfPublished('vn', id, data.status);
    }

    // Cascade: recalcula totalChapters (caso tenha mudado via endpoint) e valida refs
    await cascadeAfterUpdate(id);

    res.json({
      success: true,
      data: {
        ...vn,
        ...data,
        ...(data.status === 'published' ? { publishedAt: new Date().toISOString() } : {}),
      },
    });
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

    const [existing] = await getDb()
      .select()
      .from(schema.chapters)
      .where(and(eq(schema.chapters.id, chapterId), eq(schema.chapters.vnId, vnId)))
      .limit(1);
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { statusCode: 404, message: 'Capítulo não encontrado', code: 'NOT_FOUND' },
      });
      return;
    }

    // Validar startSceneId se foi fornecido
    if (data.startSceneId) {
      const isValid = await validateSceneReference(vnId, chapterId, data.startSceneId);
      if (!isValid) {
        data.startSceneId = null;
      }
    }

    await getDb()
      .update(schema.chapters)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.chapters.id, chapterId));

    // Cascade: se status mudou para published, marca
    if (data.status === 'published') {
      await setPublishedAtIfPublished('chapter', chapterId, data.status);
    }

    // Cascade: recalcula stats do VN e valida todas as referências
    await cascadeAfterUpdate(vnId);

    res.json({
      success: true,
      data: { ...existing, ...data, updatedAt: new Date().toISOString() },
    });
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

    const [existing] = await getDb()
      .select()
      .from(schema.chapters)
      .where(and(eq(schema.chapters.id, chapterId), eq(schema.chapters.vnId, vnId)))
      .limit(1);
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { statusCode: 404, message: 'Capítulo não encontrado', code: 'NOT_FOUND' },
      });
      return;
    }

    await getDb().delete(schema.chapters).where(eq(schema.chapters.id, chapterId));

    // Cascade: recalcula totalChapters e valida refs (FK CASCADE já removeu scenes/choices)
    await cascadeAfterChapterDelete(vnId);

    res.json({ success: true, data: { deleted: true } });
  } catch {
    res.status(500).json({
      success: false,
      error: { statusCode: 500, message: 'Erro interno', code: 'INTERNAL_ERROR' },
    });
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

    const [chapter] = await getDb()
      .select()
      .from(schema.chapters)
      .where(and(eq(schema.chapters.id, chapterId), eq(schema.chapters.vnId, vnId)))
      .limit(1);
    if (!chapter) {
      res.status(404).json({
        success: false,
        error: { statusCode: 404, message: 'Capítulo não encontrado', code: 'NOT_FOUND' },
      });
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

    const [existing] = await getDb()
      .select()
      .from(schema.scenes)
      .where(and(eq(schema.scenes.id, sceneId), eq(schema.scenes.chapterId, chapterId)))
      .limit(1);
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { statusCode: 404, message: 'Cena não encontrada', code: 'NOT_FOUND' },
      });
      return;
    }

    const updateData: Record<string, unknown> = { ...data, updatedAt: new Date() };

    // Validar nextSceneId se foi fornecido
    if (data.nextSceneId) {
      const isValid = await validateSceneReference(vnId, sceneId, data.nextSceneId);
      if (!isValid) {
        updateData.nextSceneId = null;
      }
    }

    const [updated] = await getDb()
      .update(schema.scenes)
      .set(updateData as any)
      .where(eq(schema.scenes.id, sceneId))
      .returning();

    // Cascade: valida refs da VN (caso esta cena tenha se tornado inválida)
    await cascadeAfterUpdate(vnId);

    res.json({ success: true, data: updated });
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

    const [existing] = await getDb()
      .select()
      .from(schema.scenes)
      .where(and(eq(schema.scenes.id, sceneId), eq(schema.scenes.chapterId, chapterId)))
      .limit(1);
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { statusCode: 404, message: 'Cena não encontrada', code: 'NOT_FOUND' },
      });
      return;
    }

    // Cascade ANTES do delete: anula todas as refs que apontam para esta cena
    await cascadeAfterSceneDelete(sceneId);

    await getDb().delete(schema.scenes).where(eq(schema.scenes.id, sceneId));

    // Cascade: recalcula stats do VN
    await cascadeAfterUpdate(vnId);

    res.json({ success: true, data: { deleted: true } });
  } catch {
    res.status(500).json({
      success: false,
      error: { statusCode: 500, message: 'Erro interno', code: 'INTERNAL_ERROR' },
    });
  }
});

// ── POST /api/v1/vns/:vnId/chapters/:chapterId/scenes/:sceneId/choices — Create Choice

vnRouter.post(
  '/:vnId/chapters/:chapterId/scenes/:sceneId/choices',
  authenticate,
  async (req, res) => {
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

      const [scene] = await getDb()
        .select()
        .from(schema.scenes)
        .where(and(eq(schema.scenes.id, sceneId), eq(schema.scenes.chapterId, chapterId)))
        .limit(1);
      if (!scene) {
        res.status(404).json({
          success: false,
          error: { statusCode: 404, message: 'Cena não encontrada', code: 'NOT_FOUND' },
        });
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

      // Insert conditions if provided
      let conditions: any[] = [];
      if (data.conditions && data.conditions.length > 0) {
        const insertedConditions = await getDb()
          .insert(schema.choiceConditions)
          .values(
            data.conditions.map((c) => ({
              choiceId: choice!.id,
              variableName: c.variableName,
              operator: c.operator,
              value: c.value,
            })),
          )
          .returning();
        conditions = insertedConditions;
      }

      // Insert effects if provided
      let effects: any[] = [];
      if (data.effects && data.effects.length > 0) {
        const insertedEffects = await getDb()
          .insert(schema.choiceEffects)
          .values(
            data.effects.map((e) => ({
              choiceId: choice!.id,
              variableName: e.variableName,
              action: e.action,
              value: e.value,
            })),
          )
          .returning();
        effects = insertedEffects;
      }

      res.status(201).json({
        success: true,
        data: { ...choice, conditions, effects },
      });
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
  },
);

// ── PUT /api/v1/vns/:vnId/chapters/:chapterId/scenes/:sceneId/choices/:choiceId — Update Choice

vnRouter.put(
  '/:vnId/chapters/:chapterId/scenes/:sceneId/choices/:choiceId',
  authenticate,
  async (req, res) => {
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

      const [scene] = await getDb()
        .select()
        .from(schema.scenes)
        .where(and(eq(schema.scenes.id, sceneId), eq(schema.scenes.chapterId, chapterId)))
        .limit(1);
      if (!scene) {
        res.status(404).json({
          success: false,
          error: { statusCode: 404, message: 'Cena não encontrada', code: 'NOT_FOUND' },
        });
        return;
      }

      const [existing] = await getDb()
        .select()
        .from(schema.choices)
        .where(eq(schema.choices.id, choiceId))
        .limit(1);
      if (!existing) {
        res.status(404).json({
          success: false,
          error: { statusCode: 404, message: 'Escolha não encontrada', code: 'NOT_FOUND' },
        });
        return;
      }

      const data = updateChoiceSchema.parse(req.body);

      // Validar targetSceneId se foi fornecido
      if (data.targetSceneId) {
        const isValid = await validateSceneReference(vnId, sceneId, data.targetSceneId);
        if (!isValid) {
          data.targetSceneId = null;
        }
      }

      const [updated] = await getDb()
        .update(schema.choices)
        .set({
          text: data.text,
          targetSceneId: data.targetSceneId,
          orderIndex: data.orderIndex,
          isDefault: data.isDefault,
        })
        .where(eq(schema.choices.id, choiceId))
        .returning();

      // Upsert conditions: delete old, insert new if provided
      let conditions: any[] = [];
      if (data.conditions !== undefined) {
        await getDb()
          .delete(schema.choiceConditions)
          .where(eq(schema.choiceConditions.choiceId, choiceId));
        if (data.conditions.length > 0) {
          const insertedConditions = await getDb()
            .insert(schema.choiceConditions)
            .values(
              data.conditions.map((c) => ({
                choiceId,
                variableName: c.variableName,
                operator: c.operator,
                value: c.value,
              })),
            )
            .returning();
          conditions = insertedConditions;
        }
      }

      // Upsert effects: delete old, insert new if provided
      let effects: any[] = [];
      if (data.effects !== undefined) {
        await getDb()
          .delete(schema.choiceEffects)
          .where(eq(schema.choiceEffects.choiceId, choiceId));
        if (data.effects.length > 0) {
          const insertedEffects = await getDb()
            .insert(schema.choiceEffects)
            .values(
              data.effects.map((e) => ({
                choiceId,
                variableName: e.variableName,
                action: e.action,
                value: e.value,
              })),
            )
            .returning();
          effects = insertedEffects;
        }
      }

      // Cascade: valida refs da VN
      await cascadeAfterUpdate(vnId);

      res.json({ success: true, data: { ...updated, conditions, effects } });
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
  },
);

// ── DELETE /api/v1/vns/:vnId/chapters/:chapterId/scenes/:sceneId/choices/:choiceId — Delete Choice (cascade)

vnRouter.delete(
  '/:vnId/chapters/:chapterId/scenes/:sceneId/choices/:choiceId',
  authenticate,
  async (req, res) => {
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

      // Verify the scene belongs to the chapter
      const [scene] = await getDb()
        .select()
        .from(schema.scenes)
        .where(and(eq(schema.scenes.id, sceneId), eq(schema.scenes.chapterId, chapterId)))
        .limit(1);
      if (!scene) {
        res.status(404).json({
          success: false,
          error: { statusCode: 404, message: 'Cena não encontrada', code: 'NOT_FOUND' },
        });
        return;
      }

      const [existing] = await getDb()
        .select()
        .from(schema.choices)
        .where(and(eq(schema.choices.id, choiceId), eq(schema.choices.sceneId, sceneId)))
        .limit(1);
      if (!existing) {
        res.status(404).json({
          success: false,
          error: { statusCode: 404, message: 'Escolha não encontrada', code: 'NOT_FOUND' },
        });
        return;
      }

      await getDb().delete(schema.choices).where(eq(schema.choices.id, choiceId));

      res.json({ success: true, data: { deleted: true } });
    } catch {
      res.status(500).json({
        success: false,
        error: { statusCode: 500, message: 'Erro interno', code: 'INTERNAL_ERROR' },
      });
    }
  },
);
