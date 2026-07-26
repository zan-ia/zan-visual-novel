/**
 * Cascade References — Zan Visual Novel
 *
 * Mantém referências internas e métricas estatísticas consistentes
 * após qualquer operação de escrita em VNs, capítulos, cenas e escolhas.
 *
 * Referências internas rastreadas:
 *   - chapters.start_scene_id  → scenes.id (mesma VN)
 *   - scenes.next_scene_id     → scenes.id (mesma VN)
 *   - choices.target_scene_id  → scenes.id (mesma VN)
 *   - visual_novels.total_chapters → COUNT(chapters) WHERE vn_id = ?
 *
 * Idempotente: seguro executar várias vezes.
 */

import { eq, and, isNotNull, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';

// ── Module-level state (initialized via init) ──────────────

let _pool: any = null;

export function initCascadeRefs(pool: any) {
  _pool = pool;
}

function getDb() {
  if (!_pool) throw new Error('cascade-references not initialized. Call initCascadeRefs(pool) first.');
  return drizzle(_pool, { schema });
}

// ── Stats & Counts ──────────────────────────────────────────

/**
 * Recalcula `total_chapters` no VN com base na contagem real de capítulos.
 */
export async function recalculateVNStats(vnId: string): Promise<{ totalChapters: number }> {
  const db = getDb();
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.chapters)
    .where(eq(schema.chapters.vnId, vnId));

  const totalChapters = result?.count ?? 0;
  await db
    .update(schema.visualNovels)
    .set({ totalChapters, updatedAt: new Date() })
    .where(eq(schema.visualNovels.id, vnId));

  return { totalChapters };
}

// ── Reference Validation ────────────────────────────────────

interface NullifyResult {
  chapters: number;
  scenes: number;
  choices: number;
}

/**
 * Encontra e anula (NULL) todas as referências internas quebradas em uma VN.
 * Útil após migração de dados ou reset de IDs.
 */
export async function nullifyBrokenReferences(vnId: string): Promise<NullifyResult> {
  const db = getDb();

  // Coleta todos os scene IDs válidos da VN
  const validScenes = await db
    .select({ id: schema.scenes.id })
    .from(schema.scenes)
    .innerJoin(schema.chapters, eq(schema.scenes.chapterId, schema.chapters.id))
    .where(eq(schema.chapters.vnId, vnId));
  const validSceneIds = new Set(validScenes.map((s) => s.id));

  let chaptersFixed = 0;
  let scenesFixed = 0;
  let choicesFixed = 0;

  // 1. Chapters com start_scene_id inválido
  const chapterRows = await db
    .select({ id: schema.chapters.id, startSceneId: schema.chapters.startSceneId })
    .from(schema.chapters)
    .where(and(eq(schema.chapters.vnId, vnId), isNotNull(schema.chapters.startSceneId)));
  for (const ch of chapterRows) {
    if (ch.startSceneId && !validSceneIds.has(ch.startSceneId)) {
      await db
        .update(schema.chapters)
        .set({ startSceneId: null, updatedAt: new Date() })
        .where(eq(schema.chapters.id, ch.id));
      chaptersFixed++;
    }
  }
  // 2. Scenes com next_scene_id inválido
  const sceneRows = await db
    .select({ id: schema.scenes.id, nextSceneId: schema.scenes.nextSceneId })
    .from(schema.scenes)
    .innerJoin(schema.chapters, eq(schema.scenes.chapterId, schema.chapters.id))
    .where(and(eq(schema.chapters.vnId, vnId), isNotNull(schema.scenes.nextSceneId)));
  for (const sc of sceneRows) {
    if (sc.nextSceneId && !validSceneIds.has(sc.nextSceneId)) {
      await db
        .update(schema.scenes)
        .set({ nextSceneId: null, updatedAt: new Date() })
        .where(eq(schema.scenes.id, sc.id));
      scenesFixed++;
    }
  }

  // 3. Choices com target_scene_id inválido
  const choiceRows = await db
    .select({ id: schema.choices.id, targetSceneId: schema.choices.targetSceneId })
    .from(schema.choices)
    .innerJoin(schema.scenes, eq(schema.choices.sceneId, schema.scenes.id))
    .innerJoin(schema.chapters, eq(schema.scenes.chapterId, schema.chapters.id))
    .where(eq(schema.chapters.vnId, vnId));
  for (const ch of choiceRows) {
    if (ch.targetSceneId && !validSceneIds.has(ch.targetSceneId)) {
      await db
        .update(schema.choices)
        .set({ targetSceneId: null } as any)
        .where(eq(schema.choices.id, ch.id));
      choicesFixed++;
    }
  }

  return { chapters: chaptersFixed, scenes: scenesFixed, choices: choicesFixed };
}

// ── Cascade After Delete ────────────────────────────────────

/**
 * Chamado ANTES de deletar uma cena.
 * Anula todas as referências que apontam para essa cena.
 */
export async function cascadeAfterSceneDelete(sceneId: string): Promise<{
  chaptersFixed: number;
  scenesFixed: number;
  choicesFixed: number;
}> {
  const db = getDb();

  const chaptersResult = await db
    .update(schema.chapters)
    .set({ startSceneId: null, updatedAt: new Date() })
    .where(eq(schema.chapters.startSceneId, sceneId))
    .returning({ id: schema.chapters.id });

  const scenesResult = await db
    .update(schema.scenes)
    .set({ nextSceneId: null, updatedAt: new Date() })
    .where(eq(schema.scenes.nextSceneId, sceneId))
    .returning({ id: schema.scenes.id });

  const choicesResult = await db
    .update(schema.choices)
    .set({ targetSceneId: null } as any)
    .where(eq(schema.choices.targetSceneId, sceneId))
    .returning({ id: schema.choices.id });

  return {
    chaptersFixed: chaptersResult.length,
    scenesFixed: scenesResult.length,
    choicesFixed: choicesResult.length,
  };
}

/**
 * Chamado ANTES de deletar um capítulo.
 * FK CASCADE já remove scenes/choices do capítulo. Resta apenas
 * recalcular métricas do VN.
 */
export async function cascadeAfterChapterDelete(vnId: string): Promise<{
  stats: { totalChapters: number };
}> {
  const stats = await recalculateVNStats(vnId);
  return { stats };
}

// ── Published-at Management ─────────────────────────────────

/**
 * Define `published_at` se o status está mudando de draft → published.
 * Não altera se já estiver publicado.
 */
export async function setPublishedAtIfPublished(
  entityType: 'vn' | 'chapter',
  entityId: string,
  newStatus: string,
): Promise<boolean> {
  if (newStatus !== 'published') return false;

  const db = getDb();
  const now = new Date();

  if (entityType === 'vn') {
    const [vn] = await db
      .select({ publishedAt: schema.visualNovels.publishedAt })
      .from(schema.visualNovels)
      .where(eq(schema.visualNovels.id, entityId))
      .limit(1);
    if (!vn || vn.publishedAt) return false;
    await db
      .update(schema.visualNovels)
      .set({ publishedAt: now, updatedAt: now })
      .where(eq(schema.visualNovels.id, entityId));
    return true;
  }

  if (entityType === 'chapter') {
    const [ch] = await db
      .select()
      .from(schema.chapters)
      .where(eq(schema.chapters.id, entityId))
      .limit(1);
    if (!ch) return false;
    // Schema não tem publishedAt em chapters; usa updatedAt como proxy
    await db
      .update(schema.chapters)
      .set({ status: 'published' as const, updatedAt: now })
      .where(eq(schema.chapters.id, entityId));
    return true;
  }

  return false;
}

// ── Reference Update on Scene Change ────────────────────────

/**
 * Valida que `targetSceneId` aponta para uma cena existente na mesma VN.
 * Se a referência for inválida, anula-a (NULL).
 * Retorna true se a referência é válida, false se foi anulada.
 */
export async function validateSceneReference(
  vnId: string,
  sceneId: string,
  targetSceneId: string | null,
): Promise<boolean> {
  if (!targetSceneId) return true;

  const db = getDb();
  const [target] = await db
    .select({ id: schema.scenes.id })
    .from(schema.scenes)
    .innerJoin(schema.chapters, eq(schema.scenes.chapterId, schema.chapters.id))
    .where(and(eq(schema.scenes.id, targetSceneId), eq(schema.chapters.vnId, vnId)))
    .limit(1);

  if (!target) {
    await db
      .update(schema.scenes)
      .set({ nextSceneId: null, updatedAt: new Date() })
      .where(eq(schema.scenes.id, sceneId));
    return false;
  }
  return true;
}

// ── Convenience wrapper ─────────────────────────────────────

/**
 * Executa todas as atualizações em cascata necessárias após uma operação.
 * Use após QUALQUER update de chapter, scene ou choice.
 */
export async function cascadeAfterUpdate(vnId: string): Promise<{
  stats: { totalChapters: number };
  nullified: NullifyResult;
}> {
  const stats = await recalculateVNStats(vnId);
  const nullified = await nullifyBrokenReferences(vnId);
  return { stats, nullified };
}
