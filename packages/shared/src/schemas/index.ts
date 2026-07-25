import { z } from 'zod';

// ── User Schemas ────────────────────────────────────────

export const userRoleSchema = z.enum(['player', 'creator', 'admin']);

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  displayName: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100),
  role: userRoleSchema.default('player'),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
  socialLinks: z.record(z.string()).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ── VN Schemas ──────────────────────────────────────────

export const vnStatusSchema = z.enum(['draft', 'published', 'archived', 'under_review']);
export const ageRatingSchema = z.enum(['general', 'teen', 'mature']);

export const createVNSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200),
  synopsis: z.string().min(1, 'Sinopse é obrigatória').max(2000),
  ageRating: ageRatingSchema.default('general'),
  priceCredits: z.number().int().min(0).default(0),
  iaEnabled: z.boolean().default(true),
  iaSystemPrompt: z.string().max(5000).optional(),
  iaPersona: z.string().max(1000).optional(),
  iaMaxTokens: z.number().int().min(50).max(2000).default(500),
  tags: z.array(z.string().max(50)).max(10).default([]),
});

export const updateVNSchema = createVNSchema.partial();

export type CreateVNInput = z.infer<typeof createVNSchema>;
export type UpdateVNInput = z.infer<typeof updateVNSchema>;

// ── Chapter & Scene Schemas ─────────────────────────────

export const chapterStatusSchema = z.enum(['draft', 'published']);

export const createChapterSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200),
  priceCredits: z.number().int().min(0).default(0),
});

export const textBlockSchema = z.object({
  type: z.enum(['narration', 'dialogue', 'thought']),
  speaker: z.string().max(100).optional(),
  text: z.string().min(1, 'Texto é obrigatório').max(5000),
  style: z.enum(['normal', 'italic', 'bold']).default('normal'),
});

export const sceneTypeSchema = z.enum(['narration', 'dialogue', 'choice', 'ending']);

export const createSceneSchema = z.object({
  title: z.string().min(1).max(200),
  type: sceneTypeSchema.default('narration'),
  content: z.array(textBlockSchema).min(1, 'Cena precisa de ao menos 1 bloco de texto'),
  nextSceneId: z.string().uuid().optional(),
});

export const createChoiceSchema = z.object({
  text: z.string().min(1).max(500),
  targetSceneId: z.string().uuid('Cena alvo inválida'),
  orderIndex: z.number().int().min(0).default(0),
  isDefault: z.boolean().default(false),
});

export type CreateChapterInput = z.infer<typeof createChapterSchema>;
export type CreateSceneInput = z.infer<typeof createSceneSchema>;
export type CreateChoiceInput = z.infer<typeof createChoiceSchema>;

// ── Save Schema ─────────────────────────────────────────

export const createSaveSchema = z.object({
  vnId: z.string().uuid(),
  slotNumber: z.number().int().min(1).max(5),
  label: z.string().max(100).default('Auto Save'),
  currentSceneId: z.string().uuid(),
  flags: z.record(z.unknown()).default({}),
  choiceHistory: z.array(z.object({
    sceneId: z.string(),
    choiceId: z.string(),
    timestamp: z.string(),
  })).default([]),
});

export type CreateSaveInput = z.infer<typeof createSaveSchema>;

// ── Credit Schemas ──────────────────────────────────────

export const creditPackageSchema = z.object({
  id: z.string(),
  name: z.string(),
  credits: z.number().int().positive(),
  priceCents: z.number().int().positive(),
});

export const checkoutSchema = z.object({
  packageId: z.string(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export const spendCreditsSchema = z.object({
  vnId: z.string().uuid(),
  chapterId: z.string().uuid().optional(),
  amount: z.number().int().positive(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type SpendCreditsInput = z.infer<typeof spendCreditsSchema>;

// ── LLM Schemas ─────────────────────────────────────────

export const llmModelTypeSchema = z.enum(['lfm-230m', 'lfm-350m', 'lfm-1.2b-thinking', 'lfm-vl-450m']);

export const llmGenerateSchema = z.object({
  prompt: z.string().min(1).max(2000),
  context: z.object({
    storyTitle: z.string(),
    currentScene: z.string(),
    characterNames: z.array(z.string()).default([]),
    recentHistory: z.array(z.string()).default([]),
    flags: z.record(z.unknown()).default({}),
  }),
  config: z.object({
    modelType: llmModelTypeSchema.default('lfm-230m'),
    temperature: z.number().min(0).max(2).default(0.7),
    maxTokens: z.number().int().min(50).max(2000).default(500),
    topP: z.number().min(0).max(1).default(0.9),
    systemPrompt: z.string().default(''),
    persona: z.string().default(''),
  }),
});

export type LLMGenerateInput = z.infer<typeof llmGenerateSchema>;

// ── Pagination ──────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
