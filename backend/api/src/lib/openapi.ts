import { z } from 'zod';
import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import {
  registerSchema,
  loginSchema,
  createVNSchema,
  updateVNSchema,
  createChapterSchema,
  updateChapterSchema,
  createSceneSchema,
  updateSceneSchema,
  createChoiceSchema,
  updateChoiceSchema,
  createSaveSchema,
  checkoutSchema,
  spendCreditsSchema,
  llmGenerateSchema,
  paginationSchema,
  userRoleSchema,
  vnStatusSchema,
  ageRatingSchema,
  chapterStatusSchema,
  sceneTypeSchema,
  textBlockSchema,
  choiceConditionSchema,
  choiceEffectSchema,
} from '@zan-vn/shared';

// ── Extend zod with OpenAPI capabilities ────────────────

extendZodWithOpenApi(z);

// ── Reusable response wrappers ──────────────────────────

const SuccessResponse = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  });

const ErrorResponse = z.object({
  success: z.literal(false),
  error: z.object({
    statusCode: z.number(),
    message: z.string(),
    code: z.string(),
  }),
});

const PaginatedResponse = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: z.object({
      data: z.array(dataSchema),
      total: z.number(),
      page: z.number(),
      pageSize: z.number(),
      totalPages: z.number(),
    }),
  });

// ── Build & export spec ─────────────────────────────────

export function getOpenApiSpec() {
  const registry = new OpenAPIRegistry();

  // ═══════════════════════════════════════════════════════
  // Security Scheme
  // ═══════════════════════════════════════════════════════

  registry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  });

  // ═══════════════════════════════════════════════════════
  // Component Schemas
  // ═══════════════════════════════════════════════════════

  // ── User ──────────────────────────────────────────────

  const UserSchema = registry.register(
    'User',
    z.object({
      id: z.string().uuid(),
      email: z.string().email(),
      displayName: z.string(),
      avatarUrl: z.string().nullable(),
      role: userRoleSchema,
      creditsBalance: z.number().int(),
      bio: z.string().nullable(),
      socialLinks: z.record(z.string()).nullable(),
      createdAt: z.string(),
      updatedAt: z.string(),
    }),
  );

  // ── VisualNovel ───────────────────────────────────────

  const VisualNovelSchema = registry.register(
    'VisualNovel',
    z.object({
      id: z.string().uuid(),
      creatorId: z.string().uuid(),
      title: z.string(),
      synopsis: z.string(),
      coverUrl: z.string().nullable(),
      status: vnStatusSchema,
      ageRating: ageRatingSchema,
      totalChapters: z.number().int(),
      priceCredits: z.number().int(),
      iaEnabled: z.boolean(),
      iaSystemPrompt: z.string().nullable(),
      iaPersona: z.string().nullable(),
      iaMaxTokens: z.number().int(),
      metadata: z.record(z.unknown()).nullable(),
      publishedAt: z.string().nullable(),
      createdAt: z.string(),
      updatedAt: z.string(),
      creator: z
        .object({
          displayName: z.string(),
          avatarUrl: z.string().nullable(),
        })
        .nullable(),
      tags: z.array(z.string()),
    }),
  );

  // ── Chapter ───────────────────────────────────────────

  const ChapterSchema = registry.register(
    'Chapter',
    z.object({
      id: z.string().uuid(),
      vnId: z.string().uuid(),
      title: z.string(),
      orderIndex: z.number().int(),
      status: chapterStatusSchema,
      priceCredits: z.number().int(),
      startSceneId: z.string().uuid().nullable(),
      createdAt: z.string(),
      updatedAt: z.string(),
    }),
  );

  // ── TextBlock ─────────────────────────────────────────

  registry.register('TextBlock', textBlockSchema);

  // ── Scene ─────────────────────────────────────────────

  const SceneSchema = registry.register(
    'Scene',
    z.object({
      id: z.string().uuid(),
      chapterId: z.string().uuid(),
      title: z.string(),
      type: sceneTypeSchema,
      content: z.array(textBlockSchema),
      nextSceneId: z.string().uuid().nullable(),
      metadata: z.record(z.unknown()).nullable(),
      createdAt: z.string(),
      updatedAt: z.string(),
    }),
  );

  // ── ChoiceCondition ───────────────────────────────────

  registry.register('ChoiceCondition', choiceConditionSchema);

  // ── ChoiceEffect ──────────────────────────────────────

  registry.register('ChoiceEffect', choiceEffectSchema);

  // ── Choice ────────────────────────────────────────────

  const ChoiceSchema = registry.register(
    'Choice',
    z.object({
      id: z.string().uuid(),
      sceneId: z.string().uuid(),
      text: z.string(),
      targetSceneId: z.string().uuid(),
      orderIndex: z.number().int(),
      isDefault: z.boolean(),
      conditions: z.array(choiceConditionSchema),
      effects: z.array(choiceEffectSchema),
    }),
  );

  // ── Scene with choices (nested) ───────────────────────

  const SceneWithChoicesSchema = z.object({
    id: z.string().uuid(),
    chapterId: z.string().uuid(),
    title: z.string(),
    type: sceneTypeSchema,
    content: z.array(textBlockSchema),
    nextSceneId: z.string().uuid().nullable(),
    metadata: z.record(z.unknown()).nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    choices: z.array(ChoiceSchema),
    assets: z.array(
      z.object({
        id: z.string().uuid(),
        sceneId: z.string().uuid(),
        assetId: z.string().uuid(),
        role: z.enum(['background', 'sprite', 'music', 'sfx', 'video']),
        orderIndex: z.number().int(),
        config: z.record(z.unknown()).nullable(),
        asset: z
          .object({
            id: z.string().uuid(),
            filename: z.string(),
            originalName: z.string(),
            type: z.enum(['image', 'audio', 'video']),
            mimeType: z.string(),
            sizeBytes: z.number().int(),
            storageUrl: z.string(),
            thumbnailUrl: z.string().nullable(),
            createdAt: z.string(),
          })
          .nullable(),
      }),
    ),
  });

  // ── ChapterWithScenes ─────────────────────────────────

  const ChapterWithScenesSchema = registry.register(
    'ChapterWithScenes',
    z.object({
      id: z.string().uuid(),
      vnId: z.string().uuid(),
      title: z.string(),
      orderIndex: z.number().int(),
      status: chapterStatusSchema,
      priceCredits: z.number().int(),
      startSceneId: z.string().uuid().nullable(),
      createdAt: z.string(),
      updatedAt: z.string(),
      scenes: z.array(SceneWithChoicesSchema),
    }),
  );

  // ── VisualNovelWithChapters ───────────────────────────

  const VisualNovelWithChaptersSchema = registry.register(
    'VisualNovelWithChapters',
    z.object({
      id: z.string().uuid(),
      creatorId: z.string().uuid(),
      title: z.string(),
      synopsis: z.string(),
      coverUrl: z.string().nullable(),
      status: vnStatusSchema,
      ageRating: ageRatingSchema,
      totalChapters: z.number().int(),
      priceCredits: z.number().int(),
      iaEnabled: z.boolean(),
      iaSystemPrompt: z.string().nullable(),
      iaPersona: z.string().nullable(),
      iaMaxTokens: z.number().int(),
      metadata: z.record(z.unknown()).nullable(),
      publishedAt: z.string().nullable(),
      createdAt: z.string(),
      updatedAt: z.string(),
      chapters: z.array(ChapterWithScenesSchema),
    }),
  );

  // ── AuthTokens ────────────────────────────────────────

  const AuthTokensSchema = registry.register(
    'AuthTokens',
    z.object({
      accessToken: z.string(),
      refreshToken: z.string(),
      expiresIn: z.number(),
      user: UserSchema,
    }),
  );

  // ── Save ──────────────────────────────────────────────

  const SaveSchema = registry.register(
    'Save',
    z.object({
      id: z.string().uuid(),
      userId: z.string().uuid(),
      vnId: z.string().uuid(),
      slotNumber: z.number().int(),
      label: z.string(),
      currentSceneId: z.string().uuid(),
      flags: z.record(z.unknown()),
      choiceHistory: z.array(
        z.object({
          sceneId: z.string(),
          choiceId: z.string(),
          timestamp: z.string(),
        }),
      ),
      createdAt: z.string(),
      updatedAt: z.string(),
    }),
  );

  // ── CreditPackage ─────────────────────────────────────

  const CreditPackageSchema = registry.register(
    'CreditPackage',
    z.object({
      id: z.string(),
      name: z.string(),
      credits: z.number().int(),
      priceCents: z.number().int(),
    }),
  );

  // ── CreditTransaction ─────────────────────────────────

  const CreditTransactionSchema = registry.register(
    'CreditTransaction',
    z.object({
      id: z.string().uuid(),
      userId: z.string().uuid(),
      type: z.enum(['purchase', 'spend', 'refund', 'creator_earning', 'withdraw']),
      amount: z.number().int(),
      balanceBefore: z.number().int(),
      balanceAfter: z.number().int(),
      referenceId: z.string().nullable(),
      stripeSessionId: z.string().nullable(),
      description: z.string().nullable(),
      createdAt: z.string(),
    }),
  );

  // ── Asset ─────────────────────────────────────────────

  const AssetSchema = registry.register(
    'Asset',
    z.object({
      id: z.string().uuid(),
      ownerId: z.string().uuid(),
      filename: z.string(),
      originalName: z.string(),
      type: z.enum(['image', 'audio', 'video']),
      mimeType: z.string(),
      sizeBytes: z.number().int(),
      storageUrl: z.string(),
      thumbnailUrl: z.string().nullable(),
      width: z.number().nullable(),
      height: z.number().nullable(),
      durationSeconds: z.number().nullable(),
      createdAt: z.string(),
    }),
  );

  // ── LLM Request/Response ──────────────────────────────

  registry.register('LLMGenerateRequest', llmGenerateSchema);

  const LLMGenerateResponseSchema = registry.register(
    'LLMGenerateResponse',
    z.object({
      text: z.string(),
      modelUsed: z.enum(['lfm-230m', 'lfm-350m', 'lfm-1.2b-thinking', 'lfm-vl-450m']),
      isLocal: z.boolean(),
      tokensUsed: z.number().int(),
      duration: z.number(),
    }),
  );

  // ── Analytics ─────────────────────────────────────────

  const AnalyticsSummarySchema = registry.register(
    'AnalyticsSummary',
    z.object({
      totalViews: z.number(),
      totalEarnings: z.number(),
      totalVNs: z.number(),
      uniquePlayers: z.number(),
      recentEarnings: z.number(),
    }),
  );

  const VNAnalyticsSchema = registry.register(
    'VNAnalytics',
    z.object({
      id: z.string().uuid(),
      title: z.string(),
      views: z.number(),
      earnings: z.number(),
      status: z.string(),
    }),
  );

  const CreatorEarningSchema = registry.register(
    'CreatorEarning',
    z.object({
      id: z.string().uuid(),
      amount: z.number().int(),
      status: z.enum(['pending', 'available', 'withdrawn']),
      earnedAt: z.string(),
    }),
  );

  // ═══════════════════════════════════════════════════════
  // Path Definitions
  // ═══════════════════════════════════════════════════════

  const tags = {
    health: 'Health',
    auth: 'Auth',
    vns: 'Visual Novels',
    saves: 'Saves',
    credits: 'Credits',
    llm: 'LLM',
    assets: 'Assets',
    admin: 'Admin',
    analytics: 'Analytics',
  };

  // ── Health ────────────────────────────────────────────

  registry.registerPath({
    method: 'get',
    path: '/api/health',
    summary: 'Health check',
    description: 'Returns server health status and Redis connectivity.',
    tags: [tags.health],
    responses: {
      200: {
        description: 'Server is healthy',
        content: {
          'application/json': {
            schema: z.object({
              status: z.string(),
              redis: z.string(),
              timestamp: z.string(),
            }),
          },
        },
      },
    },
  });

  // ── Auth ──────────────────────────────────────────────

  registry.registerPath({
    method: 'post',
    path: '/api/v1/auth/register',
    summary: 'Register a new user',
    tags: [tags.auth],
    request: {
      body: {
        content: {
          'application/json': {
            schema: registerSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'User registered successfully',
        content: {
          'application/json': {
            schema: SuccessResponse(AuthTokensSchema),
          },
        },
      },
      400: {
        description: 'Validation error',
        content: { 'application/json': { schema: ErrorResponse } },
      },
      409: {
        description: 'Email already registered',
        content: { 'application/json': { schema: ErrorResponse } },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/v1/auth/login',
    summary: 'Login with email and password',
    tags: [tags.auth],
    request: {
      body: {
        content: {
          'application/json': {
            schema: loginSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Login successful',
        content: {
          'application/json': {
            schema: SuccessResponse(AuthTokensSchema),
          },
        },
      },
      400: {
        description: 'Validation error',
        content: { 'application/json': { schema: ErrorResponse } },
      },
      401: {
        description: 'Invalid credentials',
        content: { 'application/json': { schema: ErrorResponse } },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/v1/auth/refresh',
    summary: 'Refresh access token',
    tags: [tags.auth],
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              refreshToken: z.string(),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Token refreshed',
        content: {
          'application/json': {
            schema: SuccessResponse(AuthTokensSchema),
          },
        },
      },
      401: {
        description: 'Invalid or expired refresh token',
        content: { 'application/json': { schema: ErrorResponse } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/v1/auth/me',
    summary: 'Get current user profile',
    tags: [tags.auth],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Current user data',
        content: {
          'application/json': {
            schema: SuccessResponse(UserSchema),
          },
        },
      },
      404: {
        description: 'User not found',
        content: { 'application/json': { schema: ErrorResponse } },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/v1/auth/logout',
    summary: 'Logout and invalidate refresh token',
    tags: [tags.auth],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              refreshToken: z.string(),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Logged out successfully',
        content: {
          'application/json': {
            schema: z.object({ success: z.literal(true) }),
          },
        },
      },
    },
  });

  // ── Visual Novels ─────────────────────────────────────

  registry.registerPath({
    method: 'get',
    path: '/api/v1/vns',
    summary: 'List visual novels',
    description: 'Returns published VNs. When authenticated with ?creator=me, returns the current user\'s VNs.',
    tags: [tags.vns],
    request: {
      query: paginationSchema,
    },
    responses: {
      200: {
        description: 'Paginated list of VNs',
        content: {
          'application/json': {
            schema: PaginatedResponse(VisualNovelSchema),
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/v1/vns/{id}',
    summary: 'Get a visual novel with full data',
    description: 'Returns VN with all chapters, scenes, choices, and assets.',
    tags: [tags.vns],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        description: 'VN with chapters, scenes, and choices',
        content: {
          'application/json': {
            schema: SuccessResponse(VisualNovelWithChaptersSchema),
          },
        },
      },
      400: {
        description: 'Invalid ID',
        content: { 'application/json': { schema: ErrorResponse } },
      },
      404: {
        description: 'VN not found',
        content: { 'application/json': { schema: ErrorResponse } },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/v1/vns',
    summary: 'Create a new visual novel',
    tags: [tags.vns],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: createVNSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'VN created',
        content: {
          'application/json': {
            schema: SuccessResponse(VisualNovelSchema),
          },
        },
      },
      400: {
        description: 'Validation error',
        content: { 'application/json': { schema: ErrorResponse } },
      },
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/api/v1/vns/{id}',
    summary: 'Update a visual novel',
    tags: [tags.vns],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: {
        content: {
          'application/json': {
            schema: updateVNSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'VN updated',
        content: {
          'application/json': {
            schema: SuccessResponse(VisualNovelSchema),
          },
        },
      },
      400: {
        description: 'Validation error',
        content: { 'application/json': { schema: ErrorResponse } },
      },
      403: {
        description: 'Access denied (not the creator)',
        content: { 'application/json': { schema: ErrorResponse } },
      },
      404: {
        description: 'VN not found',
        content: { 'application/json': { schema: ErrorResponse } },
      },
    },
  });

  // ── Chapters ──────────────────────────────────────────

  registry.registerPath({
    method: 'post',
    path: '/api/v1/vns/{vnId}/chapters',
    summary: 'Create a chapter',
    tags: [tags.vns],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        vnId: z.string().uuid(),
      }),
      body: {
        content: {
          'application/json': {
            schema: createChapterSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Chapter created',
        content: {
          'application/json': {
            schema: SuccessResponse(ChapterSchema),
          },
        },
      },
      400: {
        description: 'Validation error',
        content: { 'application/json': { schema: ErrorResponse } },
      },
      403: {
        description: 'Access denied (not the creator)',
        content: { 'application/json': { schema: ErrorResponse } },
      },
      404: {
        description: 'VN not found',
        content: { 'application/json': { schema: ErrorResponse } },
      },
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/api/v1/vns/{vnId}/chapters/{chapterId}',
    summary: 'Update a chapter',
    tags: [tags.vns],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        vnId: z.string().uuid(),
        chapterId: z.string().uuid(),
      }),
      body: {
        content: {
          'application/json': {
            schema: updateChapterSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Chapter updated',
        content: {
          'application/json': {
            schema: SuccessResponse(ChapterSchema),
          },
        },
      },
      400: {
        description: 'Validation error',
        content: { 'application/json': { schema: ErrorResponse } },
      },
      403: {
        description: 'Access denied (not the creator)',
        content: { 'application/json': { schema: ErrorResponse } },
      },
      404: {
        description: 'VN or chapter not found',
        content: { 'application/json': { schema: ErrorResponse } },
      },
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/v1/vns/{vnId}/chapters/{chapterId}',
    summary: 'Delete a chapter (cascade)',
    tags: [tags.vns],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        vnId: z.string().uuid(),
        chapterId: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        description: 'Chapter deleted',
        content: {
          'application/json': {
            schema: z.object({
              success: z.literal(true),
              data: z.object({ deleted: z.literal(true) }),
            }),
          },
        },
      },
      403: {
        description: 'Access denied (not the creator)',
        content: { 'application/json': { schema: ErrorResponse } },
      },
      404: {
        description: 'VN or chapter not found',
        content: { 'application/json': { schema: ErrorResponse } },
      },
    },
  });

  // ── Scenes ────────────────────────────────────────────

  registry.registerPath({
    method: 'post',
    path: '/api/v1/vns/{vnId}/chapters/{chapterId}/scenes',
    summary: 'Create a scene',
    tags: [tags.vns],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        vnId: z.string().uuid(),
        chapterId: z.string().uuid(),
      }),
      body: {
        content: {
          'application/json': {
            schema: createSceneSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Scene created',
        content: {
          'application/json': {
            schema: SuccessResponse(SceneSchema),
          },
        },
      },
      400: {
        description: 'Validation error',
        content: { 'application/json': { schema: ErrorResponse } },
      },
      403: {
        description: 'Access denied (not the creator)',
        content: { 'application/json': { schema: ErrorResponse } },
      },
      404: {
        description: 'VN or chapter not found',
        content: { 'application/json': { schema: ErrorResponse } },
      },
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/api/v1/vns/{vnId}/chapters/{chapterId}/scenes/{sceneId}',
    summary: 'Update a scene',
    tags: [tags.vns],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        vnId: z.string().uuid(),
        chapterId: z.string().uuid(),
        sceneId: z.string().uuid(),
      }),
      body: {
        content: {
          'application/json': {
            schema: updateSceneSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Scene updated',
        content: {
          'application/json': {
            schema: SuccessResponse(SceneSchema),
          },
        },
      },
      400: {
        description: 'Validation error',
        content: { 'application/json': { schema: ErrorResponse } },
      },
      403: {
        description: 'Access denied (not the creator)',
        content: { 'application/json': { schema: ErrorResponse } },
      },
      404: {
        description: 'VN, chapter, or scene not found',
        content: { 'application/json': { schema: ErrorResponse } },
      },
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/v1/vns/{vnId}/chapters/{chapterId}/scenes/{sceneId}',
    summary: 'Delete a scene (cascade)',
    tags: [tags.vns],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        vnId: z.string().uuid(),
        chapterId: z.string().uuid(),
        sceneId: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        description: 'Scene deleted',
        content: {
          'application/json': {
            schema: z.object({
              success: z.literal(true),
              data: z.object({ deleted: z.literal(true) }),
            }),
          },
        },
      },
      403: {
        description: 'Access denied (not the creator)',
        content: { 'application/json': { schema: ErrorResponse } },
      },
      404: {
        description: 'VN, chapter, or scene not found',
        content: { 'application/json': { schema: ErrorResponse } },
      },
    },
  });

  // ── Choices ───────────────────────────────────────────

  registry.registerPath({
    method: 'post',
    path: '/api/v1/vns/{vnId}/chapters/{chapterId}/scenes/{sceneId}/choices',
    summary: 'Create a choice',
    tags: [tags.vns],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        vnId: z.string().uuid(),
        chapterId: z.string().uuid(),
        sceneId: z.string().uuid(),
      }),
      body: {
        content: {
          'application/json': {
            schema: createChoiceSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Choice created',
        content: {
          'application/json': {
            schema: SuccessResponse(ChoiceSchema),
          },
        },
      },
      400: {
        description: 'Validation error',
        content: { 'application/json': { schema: ErrorResponse } },
      },
      403: {
        description: 'Access denied (not the creator)',
        content: { 'application/json': { schema: ErrorResponse } },
      },
      404: {
        description: 'VN, chapter, or scene not found',
        content: { 'application/json': { schema: ErrorResponse } },
      },
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/api/v1/vns/{vnId}/chapters/{chapterId}/scenes/{sceneId}/choices/{choiceId}',
    summary: 'Update a choice',
    tags: [tags.vns],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        vnId: z.string().uuid(),
        chapterId: z.string().uuid(),
        sceneId: z.string().uuid(),
        choiceId: z.string().uuid(),
      }),
      body: {
        content: {
          'application/json': {
            schema: updateChoiceSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Choice updated',
        content: {
          'application/json': {
            schema: SuccessResponse(ChoiceSchema),
          },
        },
      },
      400: {
        description: 'Validation error',
        content: { 'application/json': { schema: ErrorResponse } },
      },
      403: {
        description: 'Access denied (not the creator)',
        content: { 'application/json': { schema: ErrorResponse } },
      },
      404: {
        description: 'Not found',
        content: { 'application/json': { schema: ErrorResponse } },
      },
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/v1/vns/{vnId}/chapters/{chapterId}/scenes/{sceneId}/choices/{choiceId}',
    summary: 'Delete a choice',
    tags: [tags.vns],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        vnId: z.string().uuid(),
        chapterId: z.string().uuid(),
        sceneId: z.string().uuid(),
        choiceId: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        description: 'Choice deleted',
        content: {
          'application/json': {
            schema: z.object({
              success: z.literal(true),
              data: z.object({ deleted: z.literal(true) }),
            }),
          },
        },
      },
      403: {
        description: 'Access denied (not the creator)',
        content: { 'application/json': { schema: ErrorResponse } },
      },
      404: {
        description: 'Not found',
        content: { 'application/json': { schema: ErrorResponse } },
      },
    },
  });

  // ── Saves ─────────────────────────────────────────────

  registry.registerPath({
    method: 'get',
    path: '/api/v1/saves',
    summary: 'List saves for a VN',
    tags: [tags.saves],
    security: [{ bearerAuth: [] }],
    request: {
      query: z.object({
        vnId: z.string().uuid().optional(),
      }),
    },
    responses: {
      200: {
        description: 'List of saves',
        content: {
          'application/json': {
            schema: SuccessResponse(z.array(SaveSchema)),
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/v1/saves',
    summary: 'Create or update a save',
    description: 'Creates a new save or overwrites an existing one in the same slot.',
    tags: [tags.saves],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: createSaveSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Save created/updated',
        content: {
          'application/json': {
            schema: SuccessResponse(SaveSchema),
          },
        },
      },
      400: {
        description: 'Validation error',
        content: { 'application/json': { schema: ErrorResponse } },
      },
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/api/v1/saves/{id}',
    summary: 'Update a save',
    tags: [tags.saves],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        description: 'Save updated',
        content: {
          'application/json': {
            schema: SuccessResponse(SaveSchema),
          },
        },
      },
      404: {
        description: 'Save not found',
        content: { 'application/json': { schema: ErrorResponse } },
      },
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/v1/saves/{id}',
    summary: 'Delete a save',
    tags: [tags.saves],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        description: 'Save deleted',
        content: {
          'application/json': {
            schema: z.object({
              success: z.literal(true),
              data: z.object({ deleted: z.literal(true) }),
            }),
          },
        },
      },
      404: {
        description: 'Save not found',
        content: { 'application/json': { schema: ErrorResponse } },
      },
    },
  });

  // ── Credits ───────────────────────────────────────────

  registry.registerPath({
    method: 'get',
    path: '/api/v1/credits/packages',
    summary: 'List available credit packages',
    tags: [tags.credits],
    responses: {
      200: {
        description: 'List of credit packages',
        content: {
          'application/json': {
            schema: SuccessResponse(z.array(CreditPackageSchema)),
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/v1/credits/checkout',
    summary: 'Create Stripe checkout session',
    tags: [tags.credits],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: checkoutSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Checkout session created',
        content: {
          'application/json': {
            schema: SuccessResponse(
              z.object({
                url: z.string().nullable(),
                sessionId: z.string(),
              }),
            ),
          },
        },
      },
      400: {
        description: 'Validation error or invalid package',
        content: { 'application/json': { schema: ErrorResponse } },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/v1/credits/spend',
    summary: 'Spend credits to access content',
    tags: [tags.credits],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: spendCreditsSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Credits spent successfully',
        content: {
          'application/json': {
            schema: SuccessResponse(
              z.object({
                balanceAfter: z.number().int(),
                spent: z.number().int(),
              }),
            ),
          },
        },
      },
      400: {
        description: 'Validation error',
        content: { 'application/json': { schema: ErrorResponse } },
      },
      402: {
        description: 'Insufficient credits',
        content: { 'application/json': { schema: ErrorResponse } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/v1/credits/transactions',
    summary: 'Get transaction history',
    tags: [tags.credits],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'List of transactions (last 50)',
        content: {
          'application/json': {
            schema: SuccessResponse(z.array(CreditTransactionSchema)),
          },
        },
      },
    },
  });

  // ── LLM ───────────────────────────────────────────────

  registry.registerPath({
    method: 'post',
    path: '/api/v1/llm/generate',
    summary: 'Generate text via cloud LLM',
    description: 'Authenticated endpoint with rate limiting (10 req/min) and prompt caching.',
    tags: [tags.llm],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: llmGenerateSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Generated text',
        content: {
          'application/json': {
            schema: SuccessResponse(LLMGenerateResponseSchema),
          },
        },
      },
      400: {
        description: 'Validation error',
        content: { 'application/json': { schema: ErrorResponse } },
      },
      429: {
        description: 'Rate limited',
        content: { 'application/json': { schema: ErrorResponse } },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/v1/llm/local',
    summary: 'Generate text via local Transformers.js model',
    description: 'Public endpoint for server-side local LLM inference with prompt caching.',
    tags: [tags.llm],
    request: {
      body: {
        content: {
          'application/json': {
            schema: llmGenerateSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Generated text',
        content: {
          'application/json': {
            schema: SuccessResponse(LLMGenerateResponseSchema),
          },
        },
      },
      400: {
        description: 'Validation error',
        content: { 'application/json': { schema: ErrorResponse } },
      },
    },
  });

  // ── Assets ────────────────────────────────────────────

  registry.registerPath({
    method: 'post',
    path: '/api/v1/assets',
    summary: 'Upload a new asset',
    description: 'Upload image, audio, or video file (max 50 MB).',
    tags: [tags.assets],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'multipart/form-data': {
            schema: z.object({
              file: z.any(),
            }),
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Asset uploaded',
        content: {
          'application/json': {
            schema: SuccessResponse(AssetSchema),
          },
        },
      },
      400: {
        description: 'Validation error or file too large',
        content: { 'application/json': { schema: ErrorResponse } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/v1/assets',
    summary: 'List user assets',
    tags: [tags.assets],
    security: [{ bearerAuth: [] }],
    request: {
      query: z.object({
        type: z.enum(['image', 'audio', 'video']).optional(),
      }),
    },
    responses: {
      200: {
        description: 'List of assets',
        content: {
          'application/json': {
            schema: SuccessResponse(z.array(AssetSchema)),
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/v1/assets/{id}',
    summary: 'Delete an asset',
    tags: [tags.assets],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        description: 'Asset deleted',
        content: {
          'application/json': {
            schema: z.object({
              success: z.literal(true),
              data: z.object({ deleted: z.literal(true) }),
            }),
          },
        },
      },
      403: {
        description: 'Not authorized (not the owner)',
        content: { 'application/json': { schema: ErrorResponse } },
      },
      404: {
        description: 'Asset not found',
        content: { 'application/json': { schema: ErrorResponse } },
      },
    },
  });

  // ── Admin ─────────────────────────────────────────────

  registry.registerPath({
    method: 'get',
    path: '/api/v1/admin/users',
    summary: 'List all users (admin)',
    tags: [tags.admin],
    security: [{ bearerAuth: [] }],
    request: {
      query: z.object({
        role: z.enum(['player', 'creator', 'admin']).optional(),
        search: z.string().optional(),
      }),
    },
    responses: {
      200: {
        description: 'List of users',
        content: {
          'application/json': {
            schema: SuccessResponse(z.array(UserSchema)),
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/api/v1/admin/users/{id}/role',
    summary: 'Update user role (admin)',
    tags: [tags.admin],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: {
        content: {
          'application/json': {
            schema: z.object({
              role: z.enum(['player', 'creator', 'admin']),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Role updated',
        content: {
          'application/json': {
            schema: SuccessResponse(
              z.object({
                id: z.string(),
                email: z.string(),
                displayName: z.string(),
                role: z.string(),
              }),
            ),
          },
        },
      },
      400: {
        description: 'Invalid role',
        content: { 'application/json': { schema: ErrorResponse } },
      },
      404: {
        description: 'User not found',
        content: { 'application/json': { schema: ErrorResponse } },
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/v1/admin/users/{id}/ban',
    summary: 'Ban (soft-delete) a user (admin)',
    tags: [tags.admin],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        description: 'User banned',
        content: {
          'application/json': {
            schema: SuccessResponse(
              z.object({
                id: z.string(),
                displayName: z.string(),
                deletedAt: z.string(),
              }),
            ),
          },
        },
      },
      404: {
        description: 'User not found',
        content: { 'application/json': { schema: ErrorResponse } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/v1/admin/vns',
    summary: 'List all VNs for moderation (admin)',
    tags: [tags.admin],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'List of all VNs',
        content: {
          'application/json': {
            schema: SuccessResponse(z.array(VisualNovelSchema)),
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/api/v1/admin/vns/{id}/status',
    summary: 'Update VN moderation status (admin)',
    tags: [tags.admin],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: {
        content: {
          'application/json': {
            schema: z.object({
              status: z.enum(['published', 'archived', 'under_review']),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'VN status updated',
        content: {
          'application/json': {
            schema: SuccessResponse(VisualNovelSchema),
          },
        },
      },
      400: {
        description: 'Invalid status',
        content: { 'application/json': { schema: ErrorResponse } },
      },
      404: {
        description: 'VN not found',
        content: { 'application/json': { schema: ErrorResponse } },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/v1/admin/credits/config',
    summary: 'Get credit packages and revenue share config (admin)',
    tags: [tags.admin],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Credit configuration',
        content: {
          'application/json': {
            schema: SuccessResponse(
              z.object({
                packages: z.array(CreditPackageSchema),
                creatorRevenueShare: z.number(),
              }),
            ),
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/api/v1/admin/credits/config',
    summary: 'Update credit configuration (admin)',
    description: 'Placeholder — configuration is currently static in code.',
    tags: [tags.admin],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Config updated (placeholder)',
        content: {
          'application/json': {
            schema: SuccessResponse(
              z.object({ message: z.string() }),
            ),
          },
        },
      },
    },
  });

  // ── Analytics ─────────────────────────────────────────

  registry.registerPath({
    method: 'get',
    path: '/api/v1/analytics/creator/summary',
    summary: 'Get analytics summary for creator',
    tags: [tags.analytics],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Analytics summary',
        content: {
          'application/json': {
            schema: SuccessResponse(AnalyticsSummarySchema),
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/v1/analytics/creator/vns',
    summary: 'Get per-VN analytics for creator',
    tags: [tags.analytics],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Per-VN analytics',
        content: {
          'application/json': {
            schema: SuccessResponse(z.array(VNAnalyticsSchema)),
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/v1/analytics/creator/earnings',
    summary: 'Get earnings history for creator',
    tags: [tags.analytics],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Earnings history (last 50)',
        content: {
          'application/json': {
            schema: SuccessResponse(z.array(CreatorEarningSchema)),
          },
        },
      },
    },
  });

  // ═══════════════════════════════════════════════════════
  // Generate Document
  // ═══════════════════════════════════════════════════════

  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'Zan Visual Novel API',
      version: '1.0.0',
      description:
        'API for the Zan Visual Novel platform — visual novels, chapters, scenes, choices, saves, credits, LLM generation, assets, and analytics.',
    },
    servers: [
      { url: 'http://localhost:3001', description: 'Development server' },
    ],
  });
}
