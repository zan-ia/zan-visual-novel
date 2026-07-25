import { Router } from 'express';
import { createVNSchema, updateVNSchema, paginationSchema } from '@zan-vn/shared';
import { db, schema } from '../db/index.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { eq, and, desc, inArray, sql } from 'drizzle-orm';

export const vnRouter = Router();

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

    const [total] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.visualNovels)
      .where(where);
    const vns = await db
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
      const tagRows = await db
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
        const [creator] = await db
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
      res
        .status(400)
        .json({
          success: false,
          error: { statusCode: 400, message: 'Parâmetros inválidos', code: 'VALIDATION_ERROR' },
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

// GET /api/v1/vns/:id — Get VN with full data (chapters, scenes, choices)
vnRouter.get('/:id', optionalAuth, async (req, res) => {
  try {
    const [vn] = await db
      .select()
      .from(schema.visualNovels)
      .where(eq(schema.visualNovels.id, req.params.id))
      .limit(1);
    if (!vn) {
      res
        .status(404)
        .json({
          success: false,
          error: { statusCode: 404, message: 'VN não encontrada', code: 'NOT_FOUND' },
        });
      return;
    }

    const chapters = await db
      .select()
      .from(schema.chapters)
      .where(eq(schema.chapters.vnId, vn.id))
      .orderBy(schema.chapters.orderIndex);
    const chapterIds = chapters.map((c) => c.id);

    let scenes: any[] = [];
    let choices: any[] = [];
    if (chapterIds.length > 0) {
      scenes = await db
        .select()
        .from(schema.scenes)
        .where(inArray(schema.scenes.chapterId, chapterIds));
      const sceneIds = scenes.map((s) => s.id);
      if (sceneIds.length > 0) {
        choices = await db
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
    res
      .status(500)
      .json({
        success: false,
        error: { statusCode: 500, message: 'Erro interno', code: 'INTERNAL_ERROR' },
      });
  }
});

// POST /api/v1/vns — Create new VN
vnRouter.post('/', authenticate, async (req, res) => {
  try {
    const data = createVNSchema.parse(req.body);
    const [vn] = await db
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
      await db.insert(schema.vnTags).values(data.tags.map((tag) => ({ vnId: vn!.id, tag })));
    }

    res.status(201).json({ success: true, data: vn });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res
        .status(400)
        .json({
          success: false,
          error: {
            statusCode: 400,
            message: err.errors[0]?.message ?? 'Dados inválidos',
            code: 'VALIDATION_ERROR',
          },
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

// PATCH /api/v1/vns/:id — Update VN
vnRouter.patch('/:id', authenticate, async (req, res) => {
  try {
    const data = updateVNSchema.parse(req.body);
    const [vn] = await db
      .select()
      .from(schema.visualNovels)
      .where(eq(schema.visualNovels.id, req.params.id))
      .limit(1);
    if (!vn) {
      res
        .status(404)
        .json({
          success: false,
          error: { statusCode: 404, message: 'VN não encontrada', code: 'NOT_FOUND' },
        });
      return;
    }
    if (vn.creatorId !== req.user!.userId) {
      res
        .status(403)
        .json({
          success: false,
          error: { statusCode: 403, message: 'Acesso negado', code: 'FORBIDDEN' },
        });
      return;
    }

    await db
      .update(schema.visualNovels)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.visualNovels.id, req.params.id));
    res.json({ success: true, data: { ...vn, ...data } });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      res
        .status(400)
        .json({
          success: false,
          error: {
            statusCode: 400,
            message: err.errors[0]?.message ?? 'Dados inválidos',
            code: 'VALIDATION_ERROR',
          },
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
