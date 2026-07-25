import { pgTable, uuid, varchar, text, integer, boolean, timestamp, jsonb, uniqueIndex, index, pgEnum } from 'drizzle-orm/pg-core';

// ── Enums ────────────────────────────────────────────────

export const userRoleEnum = pgEnum('user_role', ['player', 'creator', 'admin']);
export const vnStatusEnum = pgEnum('vn_status', ['draft', 'published', 'archived', 'under_review']);
export const ageRatingEnum = pgEnum('age_rating', ['general', 'teen', 'mature']);
export const chapterStatusEnum = pgEnum('chapter_status', ['draft', 'published']);
export const sceneTypeEnum = pgEnum('scene_type', ['narration', 'dialogue', 'choice', 'ending']);
export const assetTypeEnum = pgEnum('asset_type', ['image', 'audio', 'video']);
export const assetRoleEnum = pgEnum('asset_role', ['background', 'sprite', 'music', 'sfx', 'video']);
export const transactionTypeEnum = pgEnum('transaction_type', ['purchase', 'spend', 'refund', 'creator_earning', 'withdraw']);
export const earningStatusEnum = pgEnum('earning_status', ['pending', 'available', 'withdrawn']);
export const progressStatusEnum = pgEnum('progress_status', ['not_started', 'in_progress', 'completed']);

// ── Users ────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  avatarUrl: text('avatar_url'),
  role: userRoleEnum('role').notNull().default('player'),
  creditsBalance: integer('credits_balance').notNull().default(0),
  bio: text('bio'),
  socialLinks: jsonb('social_links'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

// ── User Sessions ────────────────────────────────────────

export const userSessions = pgTable('user_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  refreshToken: varchar('refresh_token', { length: 500 }).notNull().unique(),
  userAgent: text('user_agent'),
  ipAddress: varchar('ip_address', { length: 45 }),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ── Visual Novels ────────────────────────────────────────

export const visualNovels = pgTable('visual_novels', {
  id: uuid('id').defaultRandom().primaryKey(),
  creatorId: uuid('creator_id').notNull().references(() => users.id),
  title: varchar('title', { length: 200 }).notNull(),
  synopsis: text('synopsis').notNull(),
  coverUrl: text('cover_url'),
  status: vnStatusEnum('status').notNull().default('draft'),
  ageRating: ageRatingEnum('age_rating').notNull().default('general'),
  totalChapters: integer('total_chapters').notNull().default(0),
  priceCredits: integer('price_credits').notNull().default(0),
  iaEnabled: boolean('ia_enabled').notNull().default(true),
  iaSystemPrompt: text('ia_system_prompt'),
  iaPersona: text('ia_persona'),
  iaMaxTokens: integer('ia_max_tokens').notNull().default(500),
  metadata: jsonb('metadata'),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('idx_vn_status').on(table.status),
  index('idx_vn_creator').on(table.creatorId),
]);

// ── VN Tags ──────────────────────────────────────────────

export const vnTags = pgTable('vn_tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  vnId: uuid('vn_id').notNull().references(() => visualNovels.id, { onDelete: 'cascade' }),
  tag: varchar('tag', { length: 50 }).notNull(),
}, (table) => [
  index('idx_vn_tags_tag').on(table.tag),
]);

// ── Chapters ─────────────────────────────────────────────

export const chapters = pgTable('chapters', {
  id: uuid('id').defaultRandom().primaryKey(),
  vnId: uuid('vn_id').notNull().references(() => visualNovels.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 200 }).notNull(),
  orderIndex: integer('order_index').notNull().default(0),
  status: chapterStatusEnum('status').notNull().default('draft'),
  priceCredits: integer('price_credits').notNull().default(0),
  startSceneId: uuid('start_scene_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ── Scenes ───────────────────────────────────────────────

export const scenes = pgTable('scenes', {
  id: uuid('id').defaultRandom().primaryKey(),
  chapterId: uuid('chapter_id').notNull().references(() => chapters.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 200 }).notNull(),
  type: sceneTypeEnum('type').notNull().default('narration'),
  content: jsonb('content').notNull().default('[]'),
  nextSceneId: uuid('next_scene_id'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ── Choices ──────────────────────────────────────────────

export const choices = pgTable('choices', {
  id: uuid('id').defaultRandom().primaryKey(),
  sceneId: uuid('scene_id').notNull().references(() => scenes.id, { onDelete: 'cascade' }),
  text: varchar('text', { length: 500 }).notNull(),
  targetSceneId: uuid('target_scene_id').notNull(),
  orderIndex: integer('order_index').notNull().default(0),
  isDefault: boolean('is_default').notNull().default(false),
});

export const choiceConditions = pgTable('choice_conditions', {
  id: uuid('id').defaultRandom().primaryKey(),
  choiceId: uuid('choice_id').notNull().references(() => choices.id, { onDelete: 'cascade' }),
  variableName: varchar('variable_name', { length: 100 }).notNull(),
  operator: varchar('operator', { length: 20 }).notNull(),
  value: jsonb('value'),
});

export const choiceEffects = pgTable('choice_effects', {
  id: uuid('id').defaultRandom().primaryKey(),
  choiceId: uuid('choice_id').notNull().references(() => choices.id, { onDelete: 'cascade' }),
  variableName: varchar('variable_name', { length: 100 }).notNull(),
  action: varchar('action', { length: 20 }).notNull(),
  value: jsonb('value'),
});

// ── Assets ───────────────────────────────────────────────

export const assets = pgTable('assets', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id').notNull().references(() => users.id),
  filename: varchar('filename', { length: 500 }).notNull(),
  originalName: varchar('original_name', { length: 500 }).notNull(),
  type: assetTypeEnum('type').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  storageUrl: text('storage_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  width: integer('width'),
  height: integer('height'),
  durationSeconds: integer('duration_seconds'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const sceneAssets = pgTable('scene_assets', {
  id: uuid('id').defaultRandom().primaryKey(),
  sceneId: uuid('scene_id').notNull().references(() => scenes.id, { onDelete: 'cascade' }),
  assetId: uuid('asset_id').notNull().references(() => assets.id, { onDelete: 'cascade' }),
  role: assetRoleEnum('role').notNull(),
  orderIndex: integer('order_index').notNull().default(0),
  config: jsonb('config'),
});

// ── Saves ────────────────────────────────────────────────

export const saves = pgTable('saves', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  vnId: uuid('vn_id').notNull().references(() => visualNovels.id),
  slotNumber: integer('slot_number').notNull(),
  label: varchar('label', { length: 100 }).notNull().default('Auto Save'),
  currentSceneId: uuid('current_scene_id').notNull(),
  flags: jsonb('flags').notNull().default('{}'),
  choiceHistory: jsonb('choice_history').notNull().default('[]'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('idx_saves_slot').on(table.userId, table.vnId, table.slotNumber),
  index('idx_saves_user_vn').on(table.userId, table.vnId),
]);

// ── Progress ─────────────────────────────────────────────

export const userVNAccess = pgTable('user_vn_access', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  vnId: uuid('vn_id').notNull().references(() => visualNovels.id),
  hasFullAccess: boolean('has_full_access').notNull().default(false),
  firstAccessedAt: timestamp('first_accessed_at').notNull().defaultNow(),
  lastAccessedAt: timestamp('last_accessed_at').notNull().defaultNow(),
}, (table) => [
  index('idx_vn_access_user').on(table.userId, table.vnId),
]);

export const userChapterProgress = pgTable('user_chapter_progress', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  chapterId: uuid('chapter_id').notNull().references(() => chapters.id),
  status: progressStatusEnum('status').notNull().default('not_started'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
}, (table) => [
  index('idx_chapter_progress_user').on(table.userId, table.chapterId),
]);

// ── Credits ──────────────────────────────────────────────

export const creditPackages = pgTable('credit_packages', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  credits: integer('credits').notNull(),
  priceCents: integer('price_cents').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const creditTransactions = pgTable('credit_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  type: transactionTypeEnum('type').notNull(),
  amount: integer('amount').notNull(),
  balanceBefore: integer('balance_before').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  referenceId: uuid('reference_id'),
  stripeSessionId: varchar('stripe_session_id', { length: 255 }),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('idx_credit_transactions_user').on(table.userId, table.createdAt.desc()),
]);

export const creatorEarnings = pgTable('creator_earnings', {
  id: uuid('id').defaultRandom().primaryKey(),
  creatorId: uuid('creator_id').notNull().references(() => users.id),
  transactionId: uuid('transaction_id').notNull().references(() => creditTransactions.id),
  amount: integer('amount').notNull(),
  status: earningStatusEnum('status').notNull().default('pending'),
  earnedAt: timestamp('earned_at').notNull().defaultNow(),
  withdrawnAt: timestamp('withdrawn_at'),
}, (table) => [
  index('idx_creator_earnings_status').on(table.creatorId, table.status),
]);
