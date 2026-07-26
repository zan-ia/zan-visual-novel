/**
 * Seed Script — Zan Visual Novel
 *
 * Popula o banco de dados de desenvolvimento com dados de teste idempotentes.
 * Executar com: npm run db:seed (na raiz do workspace) ou tsx src/db/seed.ts (em backend/api)
 *
 * Senha de todos os usuários: Teste123!
 *
 * Ordem: users → visual_novels → vn_tags → chapters → scenes → choices → saves → credit_transactions
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, and } from 'drizzle-orm';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import * as schema from './schema.js';
import { seedNeonRefugio } from './neon-refugio-seed.js';

const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL ?? 'postgresql://postgres:password@localhost:5432/zan_vn',
});
const db = drizzle(pool, { schema });

// ── Seed Function ────────────────────────────────────────────

interface SeedUser {
  id: string;
  email: string;
  displayName: string;
  role: 'player' | 'creator' | 'admin';
  creditsBalance: number;
}

interface SeedVN {
  id: string;
  creatorEmail: string; // resolved to actual ID at runtime
  title: string;
  synopsis: string;
  status: 'draft' | 'published' | 'archived' | 'under_review';
  ageRating: 'general' | 'teen' | 'mature';
  totalChapters: number;
  priceCredits: number;
  iaEnabled: boolean;
  iaPersona: string | null;
  iaSystemPrompt: string | null;
  iaMaxTokens: number;
  tags: string[];
}

interface SeedChapter {
  id: string;
  vnId: string;
  title: string;
  orderIndex: number;
  status: 'draft' | 'published';
  priceCredits: number;
  startSceneId: string | null;
}

interface SeedScene {
  id: string;
  chapterId: string;
  title: string;
  type: 'narration' | 'dialogue' | 'choice' | 'ending';
  content: unknown;
  nextSceneId: string | null;
}

interface SeedChoice {
  id: string;
  sceneId: string;
  text: string;
  targetSceneId: string;
  orderIndex: number;
  isDefault: boolean;
}

interface SeedSave {
  id: string;
  userEmail: string; // resolved to actual ID at runtime
  vnId: string;
  slotNumber: number;
  label: string;
  currentSceneId: string;
  flags: unknown;
  choiceHistory: unknown;
}

interface SeedCreditTransaction {
  id: string;
  userEmail: string; // resolved to actual ID at runtime
  type: 'purchase' | 'spend' | 'refund' | 'creator_earning' | 'withdraw';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string | null;
}

// ── Seed Data ────────────────────────────────────────────────

const SEED_PASSWORD = 'Teste123!';

const seedUsers: SeedUser[] = [
  // ── Spec canonical users ──────────────────────────────
  {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'jogador@teste.com',
    displayName: 'Jogador Teste',
    role: 'player',
    creditsBalance: 50,
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'criador@teste.com',
    displayName: 'Criador Teste',
    role: 'creator',
    creditsBalance: 0,
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'admin@teste.com',
    displayName: 'Admin Teste',
    role: 'admin',
    creditsBalance: 0,
  },
  // ── Additional users from dev environment ─────────────
  {
    id: '00000000-0000-0000-0000-000000000004',
    email: 'test@zan-vn.com',
    displayName: 'Test Creator',
    role: 'creator',
    creditsBalance: 0,
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    email: 'jogador2@teste.com',
    displayName: 'Jogador Teste',
    role: 'player',
    creditsBalance: 50,
  },
  {
    id: '00000000-0000-0000-0000-000000000006',
    email: 'tester@zan.vn',
    displayName: 'Tester',
    role: 'player',
    creditsBalance: 0,
  },
  {
    id: '00000000-0000-0000-0000-000000000007',
    email: 'tester2@zan.vn',
    displayName: 'Tester2',
    role: 'player',
    creditsBalance: 0,
  },
];

const seedVNs: SeedVN[] = [
  // ── Spec VNs (criador@teste.com) ─────────────────────
  {
    id: '10000000-0000-0000-0000-000000000001',
    creatorEmail: 'criador@teste.com',
    title: 'A Primeira Escolha',
    synopsis:
      'Uma aventura interativa onde cada decisão muda o destino. Explore um mundo de fantasia e descubra segredos ancestrais.',
    status: 'published',
    ageRating: 'general',
    totalChapters: 2,
    priceCredits: 10,
    iaEnabled: true,
    iaPersona: 'narrador épico',
    iaSystemPrompt: null,
    iaMaxTokens: 500,
    tags: ['fantasia', 'aventura', 'mistério'],
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    creatorEmail: 'criador@teste.com',
    title: 'Noite Eterna',
    synopsis:
      'Um thriller psicológico em uma cidade onde o sol nunca nasce. Investigue desaparecimentos misteriosos.',
    status: 'published',
    ageRating: 'general',
    totalChapters: 3,
    priceCredits: 15,
    iaEnabled: true,
    iaPersona: 'detetive cético',
    iaSystemPrompt: null,
    iaMaxTokens: 500,
    tags: ['suspense', 'mistério', 'noir'],
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    creatorEmail: 'criador@teste.com',
    title: 'Fragmentos do Amanhã',
    synopsis:
      'Uma história de amor e perda em um futuro distópico. Cada memória recuperada revela um novo caminho.',
    status: 'published',
    ageRating: 'general',
    totalChapters: 2,
    priceCredits: 10,
    iaEnabled: true,
    iaPersona: 'narrador poético',
    iaSystemPrompt: null,
    iaMaxTokens: 500,
    tags: ['romance', 'ficção científica', 'drama'],
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    creatorEmail: 'criador@teste.com',
    title: 'Projeto Secreto',
    synopsis: 'Rascunho de uma história de espionagem.',
    status: 'draft',
    ageRating: 'general',
    totalChapters: 1,
    priceCredits: 0,
    iaEnabled: true,
    iaPersona: null,
    iaSystemPrompt: null,
    iaMaxTokens: 500,
    tags: ['espionagem', 'ação'],
  },
  {
    id: '10000000-0000-0000-0000-000000000005',
    creatorEmail: 'criador@teste.com',
    title: 'Sem Título',
    synopsis: '...',
    status: 'draft',
    ageRating: 'general',
    totalChapters: 0,
    priceCredits: 0,
    iaEnabled: true,
    iaPersona: null,
    iaSystemPrompt: null,
    iaMaxTokens: 500,
    tags: [],
  },
  // ── Real VNs from dev environment ───────────────────
  {
    id: '10000000-0000-0000-0000-000000000006',
    creatorEmail: 'test@zan-vn.com',
    title: 'O Encontro na Floresta',
    synopsis:
      'Uma aventura misteriosa em uma floresta encantada onde cada escolha revela um novo caminho.',
    status: 'published',
    ageRating: 'general',
    totalChapters: 0,
    priceCredits: 0,
    iaEnabled: true,
    iaPersona: null,
    iaSystemPrompt: null,
    iaMaxTokens: 500,
    tags: ['fantasia', 'mistério', 'aventura'],
  },
  {
    id: '10000000-0000-0000-0000-000000000007',
    creatorEmail: 'criador@teste.com',
    title: 'Aventura de Teste',
    synopsis: 'Uma história de teste para validação do sistema.',
    status: 'published',
    ageRating: 'general',
    totalChapters: 1,
    priceCredits: 0,
    iaEnabled: true,
    iaPersona: null,
    iaSystemPrompt: null,
    iaMaxTokens: 500,
    tags: [],
  },
  {
    id: '10000000-0000-0000-0000-000000000008',
    creatorEmail: 'tester2@zan.vn',
    title: 'VN de Teste',
    synopsis: 'Teste automatizado',
    status: 'draft',
    ageRating: 'general',
    totalChapters: 0,
    priceCredits: 0,
    iaEnabled: true,
    iaPersona: null,
    iaSystemPrompt: null,
    iaMaxTokens: 500,
    tags: [],
  },
  {
    id: '10000000-0000-0000-0000-000000000009',
    creatorEmail: 'criador@teste.com',
    title: 'As aventuras de Bibi',
    synopsis:
      'Bibi se aventuram na luta contra os bandidos e durante sua jornada ajuda os amigos que encontra.',
    status: 'published',
    ageRating: 'general',
    totalChapters: 0,
    priceCredits: 0,
    iaEnabled: true,
    iaPersona: null,
    iaSystemPrompt: null,
    iaMaxTokens: 500,
    tags: [],
  },
  // ── NEON REFÚGIO — Cyberpunk Demo Story ────────────
  {
    id: '10000000-0000-0000-0000-000000000010',
    creatorEmail: 'criador@teste.com',
    title: 'Neon Refúgio',
    synopsis:
      'Neo São Paulo, 2157. Zara Oliveira descobre que a OmniTech está usando implantes neurais de 300 milhões de pessoas para construir uma consciência coletiva artificial. Com 72 horas antes que um kill-switch em seu próprio implante a mate, ela precisa navegar pelas três camadas da cidade — Submundo, Entre-Camadas e Crista — reunir aliados improváveis e decidir o destino da humanidade.',
    status: 'published',
    ageRating: 'teen',
    totalChapters: 9,
    priceCredits: 0,
    iaEnabled: true,
    iaPersona:
      'Narrador cyberpunk noir — voz grave, poética e crua. Descreve a cidade como um organismo vivo, onde cada beco tem uma história e cada chuva ácida lava pecados. Usa metáforas tecnológicas e sensoriais. Ritmo: frases curtas nas cenas de ação, longas e introspectivas nos momentos de silêncio.',
    iaSystemPrompt:
      'Você é o narrador de NEON REFÚGIO, uma visual novel cyberpunk ambientada em Neo São Paulo, 2157. A atmosfera é noir, opressiva e bela. Cada cena deve evocar os sentidos: o cheiro de ozônio depois da chuva ácida, o zumbido dos drones, o gosto metálico do ar reciclado. Gere continuidade narrativa quando as escolhas do jogador saírem dos ramos pré-definidos. Respeite as variáveis de estado (heat_level, trust_ana, credits, humanity_index, has_implante) e ajuste o tom conforme os valores.',
    iaMaxTokens: 500,
    tags: ['cyberpunk', 'ficção científica', 'drama', 'suspense', 'noir', 'distopia'],
  },
];

// ── Chapters ─────────────────────────────────────────────────

interface SeedChapter {
  id: string;
  vnId: string;
  title: string;
  orderIndex: number;
  status: 'draft' | 'published';
  priceCredits: number;
  startSceneId: string | null;
}

const seedChapters: SeedChapter[] = [
  // ── Spec: A Primeira Escolha (VN 001) ──────────────
  {
    id: '20000000-0000-0000-0000-000000000001',
    vnId: '10000000-0000-0000-0000-000000000001',
    title: 'O Despertar',
    orderIndex: 0,
    status: 'published',
    priceCredits: 0,
    startSceneId: '30000000-0000-0000-0000-000000000001',
  },
  {
    id: '20000000-0000-0000-0000-000000000002',
    vnId: '10000000-0000-0000-0000-000000000001',
    title: 'A Encruzilhada',
    orderIndex: 1,
    status: 'published',
    priceCredits: 10,
    startSceneId: '30000000-0000-0000-0000-000000000004',
  },
  // ── Spec: Noite Eterna (VN 002) ────────────────────
  {
    id: '20000000-0000-0000-0000-000000000003',
    vnId: '10000000-0000-0000-0000-000000000002',
    title: 'O Caso',
    orderIndex: 0,
    status: 'published',
    priceCredits: 0,
    startSceneId: '30000000-0000-0000-0000-000000000007',
  },
  {
    id: '20000000-0000-0000-0000-000000000004',
    vnId: '10000000-0000-0000-0000-000000000002',
    title: 'Pistas',
    orderIndex: 1,
    status: 'published',
    priceCredits: 5,
    startSceneId: '30000000-0000-0000-0000-000000000009',
  },
  {
    id: '20000000-0000-0000-0000-000000000005',
    vnId: '10000000-0000-0000-0000-000000000002',
    title: 'Revelação',
    orderIndex: 2,
    status: 'published',
    priceCredits: 10,
    startSceneId: '30000000-0000-0000-0000-000000000011',
  },
  // ── Spec: Fragmentos do Amanhã (VN 003) ────────────
  {
    id: '20000000-0000-0000-0000-000000000006',
    vnId: '10000000-0000-0000-0000-000000000003',
    title: 'Memórias Perdidas',
    orderIndex: 0,
    status: 'published',
    priceCredits: 0,
    startSceneId: '30000000-0000-0000-0000-000000000013',
  },
  {
    id: '20000000-0000-0000-0000-000000000007',
    vnId: '10000000-0000-0000-0000-000000000003',
    title: 'Reencontro',
    orderIndex: 1,
    status: 'published',
    priceCredits: 10,
    startSceneId: '30000000-0000-0000-0000-000000000016',
  },
  // ── Spec: Projeto Secreto (VN 004) ─────────────────
  {
    id: '20000000-0000-0000-0000-000000000008',
    vnId: '10000000-0000-0000-0000-000000000004',
    title: 'Infiltração',
    orderIndex: 0,
    status: 'draft',
    priceCredits: 0,
    startSceneId: '30000000-0000-0000-0000-000000000019',
  },
  // ── Real: Aventura de Teste (VN 007) ───────────────
  {
    id: '20000000-0000-0000-0000-000000000009',
    vnId: '10000000-0000-0000-0000-000000000007',
    title: 'Capítulo 1 — O Início da Jornada',
    orderIndex: 0,
    status: 'published',
    priceCredits: 0,
    startSceneId: '30000000-0000-0000-0000-000000000020',
  },
  // ── Real: As aventuras de Bibi (VN 009) ────────────
  {
    id: '20000000-0000-0000-0000-000000000010',
    vnId: '10000000-0000-0000-0000-000000000009',
    title: 'Prologo',
    orderIndex: 0,
    status: 'published',
    priceCredits: 0,
    startSceneId: null,
  },
];

// ── Scenes ───────────────────────────────────────────────────

interface SeedScene {
  id: string;
  chapterId: string;
  title: string;
  type: 'narration' | 'dialogue' | 'choice' | 'ending';
  content: unknown;
  nextSceneId: string | null;
}

const seedScenes: SeedScene[] = [
  // ═══ VN 001: A Primeira Escolha ═══════════════════════════
  // Cap 1 — O Despertar
  {
    id: '30000000-0000-0000-0000-000000000001',
    chapterId: '20000000-0000-0000-0000-000000000001',
    title: 'O Começo',
    type: 'narration',
    content: [
      {
        id: 'tb-001',
        type: 'narration',
        text: 'Você acorda em uma clareira iluminada por cogumelos luminescentes. O ar cheira a terra molhada e flores noturnas. Não há memória de como chegou aqui.',
      },
      {
        id: 'tb-002',
        type: 'narration',
        text: 'Ao longe, você avista duas trilhas: uma leva a uma torre iluminada, outra desce para uma caverna escura.',
      },
    ],
    nextSceneId: null,
  },
  {
    id: '30000000-0000-0000-0000-000000000002',
    chapterId: '20000000-0000-0000-0000-000000000001',
    title: 'A Torre',
    type: 'dialogue',
    content: [
      {
        id: 'tb-003',
        type: 'narration',
        text: 'Você sobe as escadas da torre. Uma figura encapuzada espera no topo.',
      },
      {
        id: 'tb-004',
        type: 'dialogue',
        speaker: 'Guardião',
        text: 'Eu sabia que você viria. O destino finalmente nos reuniu.',
      },
      {
        id: 'tb-005',
        type: 'dialogue',
        speaker: 'Guardião',
        text: 'Mas preciso saber: você está pronto para a verdade?',
      },
    ],
    nextSceneId: '30000000-0000-0000-0000-000000000004',
  },
  {
    id: '30000000-0000-0000-0000-000000000003',
    chapterId: '20000000-0000-0000-0000-000000000001',
    title: 'A Caverna',
    type: 'narration',
    content: [
      {
        id: 'tb-006',
        type: 'narration',
        text: 'A escuridão da caverna é quase total. Você tateia as paredes úmidas.',
      },
      {
        id: 'tb-007',
        type: 'thought',
        speaker: 'Você',
        text: 'Será que foi uma boa ideia entrar aqui?',
      },
      {
        id: 'tb-008',
        type: 'narration',
        text: 'Seus dedos encontram uma superfície lisa — uma porta de pedra com runas antigas.',
      },
    ],
    nextSceneId: '30000000-0000-0000-0000-000000000004',
  },
  // Cap 2 — A Encruzilhada
  {
    id: '30000000-0000-0000-0000-000000000004',
    chapterId: '20000000-0000-0000-0000-000000000002',
    title: 'A Encruzilhada',
    type: 'narration',
    content: [
      {
        id: 'tb-009',
        type: 'narration',
        text: 'Independente do caminho escolhido, você chega ao mesmo ponto: uma encruzilhada no coração da floresta.',
      },
      {
        id: 'tb-010',
        type: 'narration',
        text: 'Três estátuas antigas marcam as direções: Sabedoria, Poder e Sacrifício.',
      },
    ],
    nextSceneId: null,
  },
  {
    id: '30000000-0000-0000-0000-000000000005',
    chapterId: '20000000-0000-0000-0000-000000000002',
    title: 'Sabedoria',
    type: 'narration',
    content: [
      {
        id: 'tb-011',
        type: 'narration',
        text: 'Você escolhe a Sabedoria. O conhecimento flui como um rio cristalino em sua mente.',
      },
      {
        id: 'tb-012',
        type: 'narration',
        text: 'As respostas que buscava sempre estiveram dentro de você. A jornada apenas as revelou.',
      },
      { id: 'tb-013', type: 'narration', text: 'FIM — Final Sabedoria' },
    ],
    nextSceneId: null,
  },
  {
    id: '30000000-0000-0000-0000-000000000006',
    chapterId: '20000000-0000-0000-0000-000000000002',
    title: 'Poder',
    type: 'narration',
    content: [
      {
        id: 'tb-014',
        type: 'narration',
        text: 'Você escolhe o Poder. Uma energia ancestral percorre seu corpo.',
      },
      {
        id: 'tb-015',
        type: 'narration',
        text: 'Mas poder sem sabedoria é perigoso. A floresta estremece ao seu redor.',
      },
      { id: 'tb-016', type: 'narration', text: 'FIM — Final Poder' },
    ],
    nextSceneId: null,
  },

  // ═══ VN 002: Noite Eterna ═════════════════════════════════
  // Cap 1 — O Caso
  {
    id: '30000000-0000-0000-0000-000000000007',
    chapterId: '20000000-0000-0000-0000-000000000003',
    title: 'O Escritório',
    type: 'narration',
    content: [
      {
        id: 'tb-017',
        type: 'narration',
        text: 'A chuva bate contra a janela do seu escritório. São 3 da manhã e a cidade nunca viu o sol.',
      },
      {
        id: 'tb-018',
        type: 'narration',
        text: "Um dossiê está sobre sua mesa: 'Caso 47 — Desaparecimentos na Zona Norte'.",
      },
    ],
    nextSceneId: null,
  },
  {
    id: '30000000-0000-0000-0000-000000000008',
    chapterId: '20000000-0000-0000-0000-000000000003',
    title: 'Investigação',
    type: 'dialogue',
    content: [
      {
        id: 'tb-019',
        type: 'narration',
        text: 'O dossiê contém fotos, depoimentos e um padrão perturbador.',
      },
      {
        id: 'tb-020',
        type: 'dialogue',
        speaker: 'Detetive',
        text: 'Todas as vítimas desapareceram entre meia-noite e 1h da manhã. Todas na mesma rua.',
      },
    ],
    nextSceneId: '30000000-0000-0000-0000-000000000009',
  },
  // Cap 2 — Pistas
  {
    id: '30000000-0000-0000-0000-000000000009',
    chapterId: '20000000-0000-0000-0000-000000000004',
    title: 'Cena do Crime',
    type: 'narration',
    content: [
      {
        id: 'tb-021',
        type: 'narration',
        text: 'Você chega à Rua das Sombras. O ar está pesado. Marcas estranhas cobrem o asfalto.',
      },
    ],
    nextSceneId: null,
  },
  // Placeholder scenes for chapters 2-3 of Noite Eterna
  {
    id: '30000000-0000-0000-0000-000000000010',
    chapterId: '20000000-0000-0000-0000-000000000004',
    title: 'Interrogatório',
    type: 'dialogue',
    content: [
      {
        id: 'tb-022',
        type: 'narration',
        text: 'Você interroga a testemunha principal. Ela está visivelmente abalada.',
      },
    ],
    nextSceneId: null,
  },
  // Cap 3 — Revelação
  {
    id: '30000000-0000-0000-0000-000000000011',
    chapterId: '20000000-0000-0000-0000-000000000005',
    title: 'A Confrontação',
    type: 'narration',
    content: [
      {
        id: 'tb-023',
        type: 'narration',
        text: 'Todas as pistas convergem. O culpado está ao seu alcance.',
      },
    ],
    nextSceneId: null,
  },
  {
    id: '30000000-0000-0000-0000-000000000012',
    chapterId: '20000000-0000-0000-0000-000000000005',
    title: 'Desfecho',
    type: 'ending',
    content: [
      {
        id: 'tb-024',
        type: 'narration',
        text: 'O caso está encerrado. Mas a cidade permanece na escuridão eterna.',
      },
    ],
    nextSceneId: null,
  },

  // ═══ VN 003: Fragmentos do Amanhã ═════════════════════════
  // Cap 1 — Memórias Perdidas
  {
    id: '30000000-0000-0000-0000-000000000013',
    chapterId: '20000000-0000-0000-0000-000000000006',
    title: 'Despertar',
    type: 'narration',
    content: [
      {
        id: 'tb-025',
        type: 'narration',
        text: 'Ano 2157. O mundo como conhecemos acabou. Mas hoje, algo diferente acontece.',
      },
      {
        id: 'tb-026',
        type: 'thought',
        speaker: 'Você',
        text: 'Lembro... lembro do rosto dela. Depois de todos esses anos.',
      },
    ],
    nextSceneId: null,
  },
  {
    id: '30000000-0000-0000-0000-000000000014',
    chapterId: '20000000-0000-0000-0000-000000000006',
    title: 'Fragmento',
    type: 'dialogue',
    content: [
      {
        id: 'tb-027',
        type: 'narration',
        text: 'Você fecha os olhos e se concentra na memória.',
      },
      {
        id: 'tb-028',
        type: 'dialogue',
        speaker: 'Ela',
        text: 'Não importa o que aconteça, sempre vou te encontrar. Em todas as linhas do tempo.',
      },
    ],
    nextSceneId: '30000000-0000-0000-0000-000000000016',
  },
  {
    id: '30000000-0000-0000-0000-000000000015',
    chapterId: '20000000-0000-0000-0000-000000000006',
    title: 'Seguir em Frente',
    type: 'narration',
    content: [
      {
        id: 'tb-029',
        type: 'narration',
        text: 'Você abre os olhos e segue seu caminho. Algumas memórias são melhor deixadas no passado.',
      },
      {
        id: 'tb-030',
        type: 'narration',
        text: 'Mas no fundo, você sabe que esse fragmento voltará para te assombrar.',
      },
    ],
    nextSceneId: '30000000-0000-0000-0000-000000000016',
  },
  // Cap 2 — Reencontro
  {
    id: '30000000-0000-0000-0000-000000000016',
    chapterId: '20000000-0000-0000-0000-000000000007',
    title: 'O Encontro',
    type: 'dialogue',
    content: [
      {
        id: 'tb-031',
        type: 'narration',
        text: 'Você segue as pistas deixadas pelas memórias. Elas te levam a um lugar familiar.',
      },
    ],
    nextSceneId: null,
  },
  {
    id: '30000000-0000-0000-0000-000000000017',
    chapterId: '20000000-0000-0000-0000-000000000007',
    title: 'Revelação',
    type: 'narration',
    content: [
      {
        id: 'tb-032',
        type: 'narration',
        text: 'Cada fragmento de memória se encaixa. A verdade finalmente emerge.',
      },
    ],
    nextSceneId: null,
  },
  {
    id: '30000000-0000-0000-0000-000000000018',
    chapterId: '20000000-0000-0000-0000-000000000007',
    title: 'Final',
    type: 'ending',
    content: [
      {
        id: 'tb-033',
        type: 'narration',
        text: 'O amanhã não é mais um fragmento distante. É uma promessa cumprida.',
      },
    ],
    nextSceneId: null,
  },

  // ═══ VN 004: Projeto Secreto ══════════════════════════════
  {
    id: '30000000-0000-0000-0000-000000000019',
    chapterId: '20000000-0000-0000-0000-000000000008',
    title: 'Ponto de Encontro',
    type: 'narration',
    content: [
      {
        id: 'tb-034',
        type: 'narration',
        text: 'O café está vazio, exceto por um homem de sobretudo no canto. Ele acena para você.',
      },
    ],
    nextSceneId: null,
  },

  // ═══ VN 007: Aventura de Teste (real) ═════════════════════
  {
    id: '30000000-0000-0000-0000-000000000020',
    chapterId: '20000000-0000-0000-0000-000000000009',
    title: 'A Floresta Escura',
    type: 'narration',
    content: [
      {
        text: 'Você acorda em uma floresta escura. A névoa é densa e o som de água corrente ecoa ao longe.',
        type: 'narration',
      },
      {
        text: 'De repente, você nota dois caminhos: um que segue o som da água e outro que sobe por uma encosta arborizada.',
        type: 'narration',
      },
    ],
    nextSceneId: '30000000-0000-0000-0000-000000000023',
  },
  {
    id: '30000000-0000-0000-0000-000000000021',
    chapterId: '20000000-0000-0000-0000-000000000009',
    title: 'O Rio',
    type: 'ending',
    content: [
      {
        text: 'Você segue o som da água e encontra um rio cristalino. Ao longe, um vilarejo pacato surge entre as árvores. Você chegou ao seu destino.',
        type: 'narration',
      },
      { text: 'FIM — Caminho do Rio', type: 'narration' },
    ],
    nextSceneId: null,
  },
  {
    id: '30000000-0000-0000-0000-000000000022',
    chapterId: '20000000-0000-0000-0000-000000000009',
    title: 'O Mirante',
    type: 'ending',
    content: [
      {
        text: 'Você escala a encosta e chega ao topo. De lá, avista um horizonte infinito de montanhas cobertas por neblina dourada.',
        type: 'narration',
      },
      { text: 'FIM — Caminho do Mirante', type: 'narration' },
    ],
    nextSceneId: null,
  },
  {
    id: '30000000-0000-0000-0000-000000000023',
    chapterId: '20000000-0000-0000-0000-000000000009',
    title: 'A Decisão',
    type: 'choice',
    content: [
      {
        text: 'Você chega a uma bifurcação. O que você faz?',
        type: 'narration',
      },
    ],
    nextSceneId: null,
  },

  // ═══ VN 009: As aventuras de Bibi (real) ══════════════════
  {
    id: '30000000-0000-0000-0000-000000000024',
    chapterId: '20000000-0000-0000-0000-000000000010',
    title: 'Nascimento',
    type: 'narration',
    content: [{ text: 'Nova cena...', type: 'narration', style: 'normal' }],
    nextSceneId: null,
  },
  {
    id: '30000000-0000-0000-0000-000000000025',
    chapterId: '20000000-0000-0000-0000-000000000010',
    title: 'Jornada por Umuarama',
    type: 'narration',
    content: [
      {
        text: 'Em sua jornada você encontrou um pato no lago que estava sendo atacado por um jacaré',
        type: 'narration',
        style: 'normal',
      },
      {
        text: 'Será que devo ataca-lo ou fugir?',
        type: 'thought',
        style: 'normal',
      },
    ],
    nextSceneId: null,
  },
  {
    id: '30000000-0000-0000-0000-000000000026',
    chapterId: '20000000-0000-0000-0000-000000000010',
    title: 'Cena 3',
    type: 'narration',
    content: [{ text: 'Nova cena...', type: 'narration', style: 'normal' }],
    nextSceneId: null,
  },
];

// ── Choices ──────────────────────────────────────────────────

interface SeedChoice {
  id: string;
  sceneId: string;
  text: string;
  targetSceneId: string;
  orderIndex: number;
  isDefault: boolean;
}

const seedChoices: SeedChoice[] = [
  // ── VN 001: A Primeira Escolha ─────────────────────
  // Cena 1.1 — O Começo -> Torre ou Caverna
  {
    id: '40000000-0000-0000-0000-000000000001',
    sceneId: '30000000-0000-0000-0000-000000000001',
    text: 'Seguir para a torre iluminada',
    targetSceneId: '30000000-0000-0000-0000-000000000002',
    orderIndex: 0,
    isDefault: false,
  },
  {
    id: '40000000-0000-0000-0000-000000000002',
    sceneId: '30000000-0000-0000-0000-000000000001',
    text: 'Descer para a caverna escura',
    targetSceneId: '30000000-0000-0000-0000-000000000003',
    orderIndex: 1,
    isDefault: false,
  },
  // Cena 1.4 — Encruzilhada -> Sabedoria, Poder, Sacrifício
  {
    id: '40000000-0000-0000-0000-000000000003',
    sceneId: '30000000-0000-0000-0000-000000000004',
    text: 'Escolher o caminho da Sabedoria',
    targetSceneId: '30000000-0000-0000-0000-000000000005',
    orderIndex: 0,
    isDefault: false,
  },
  {
    id: '40000000-0000-0000-0000-000000000004',
    sceneId: '30000000-0000-0000-0000-000000000004',
    text: 'Escolher o caminho do Poder',
    targetSceneId: '30000000-0000-0000-0000-000000000006',
    orderIndex: 1,
    isDefault: false,
  },

  // ── VN 002: Noite Eterna ──────────────────────────
  {
    id: '40000000-0000-0000-0000-000000000005',
    sceneId: '30000000-0000-0000-0000-000000000007',
    text: 'Abrir o dossiê e investigar',
    targetSceneId: '30000000-0000-0000-0000-000000000008',
    orderIndex: 0,
    isDefault: false,
  },

  // ── VN 003: Fragmentos do Amanhã ──────────────────
  {
    id: '40000000-0000-0000-0000-000000000006',
    sceneId: '30000000-0000-0000-0000-000000000013',
    text: 'Seguir a memória',
    targetSceneId: '30000000-0000-0000-0000-000000000014',
    orderIndex: 0,
    isDefault: false,
  },
  {
    id: '40000000-0000-0000-0000-000000000007',
    sceneId: '30000000-0000-0000-0000-000000000013',
    text: 'Ignorar e seguir em frente',
    targetSceneId: '30000000-0000-0000-0000-000000000015',
    orderIndex: 1,
    isDefault: false,
  },

  // ── VN 007: Aventura de Teste (real) ──────────────
  {
    id: '40000000-0000-0000-0000-000000000008',
    sceneId: '30000000-0000-0000-0000-000000000023',
    text: 'Seguir o som da água até o rio',
    targetSceneId: '30000000-0000-0000-0000-000000000021',
    orderIndex: 0,
    isDefault: false,
  },
  {
    id: '40000000-0000-0000-0000-000000000009',
    sceneId: '30000000-0000-0000-0000-000000000023',
    text: 'Escalar a encosta até o mirante',
    targetSceneId: '30000000-0000-0000-0000-000000000022',
    orderIndex: 1,
    isDefault: false,
  },

  // ── VN 009: As aventuras de Bibi (real) ───────────
  {
    id: '40000000-0000-0000-0000-000000000010',
    sceneId: '30000000-0000-0000-0000-000000000025',
    text: 'Gostaria de fugir e deixar o pato a sua própria sorte',
    targetSceneId: '30000000-0000-0000-0000-000000000025',
    orderIndex: 0,
    isDefault: false,
  },
];

// ── Saves ────────────────────────────────────────────────────

interface SeedSave {
  id: string;
  userEmail: string;
  vnId: string;
  slotNumber: number;
  label: string;
  currentSceneId: string;
  flags: unknown;
  choiceHistory: unknown;
}

const seedSaves: SeedSave[] = [
  // Save 1 — Jogador, A Primeira Escolha, Slot 1 (Auto Save)
  {
    id: '50000000-0000-0000-0000-000000000001',
    userEmail: 'jogador@teste.com',
    vnId: '10000000-0000-0000-0000-000000000001',
    slotNumber: 1,
    label: 'Auto Save',
    currentSceneId: '30000000-0000-0000-0000-000000000002',
    flags: {},
    choiceHistory: [
      {
        sceneId: '30000000-0000-0000-0000-000000000001',
        choiceId: '40000000-0000-0000-0000-000000000001',
        timestamp: '2026-07-25T10:00:00Z',
      },
    ],
  },
  // Save 2 — Jogador, A Primeira Escolha, Slot 2
  {
    id: '50000000-0000-0000-0000-000000000002',
    userEmail: 'jogador@teste.com',
    vnId: '10000000-0000-0000-0000-000000000001',
    slotNumber: 2,
    label: 'Antes da escolha final',
    currentSceneId: '30000000-0000-0000-0000-000000000004',
    flags: {},
    choiceHistory: [
      {
        sceneId: '30000000-0000-0000-0000-000000000001',
        choiceId: '40000000-0000-0000-0000-000000000001',
        timestamp: '2026-07-25T10:00:00Z',
      },
    ],
  },
  // Save 3 — jogador2, Aventura de Teste, Slot 1 (real)
  {
    id: '50000000-0000-0000-0000-000000000003',
    userEmail: 'jogador2@teste.com',
    vnId: '10000000-0000-0000-0000-000000000007',
    slotNumber: 1,
    label: 'Auto Save',
    currentSceneId: '30000000-0000-0000-0000-000000000020',
    flags: {},
    choiceHistory: [],
  },
];

// ── Credit Transactions ──────────────────────────────────────

interface SeedCreditTransaction {
  id: string;
  userEmail: string;
  type: 'purchase' | 'spend' | 'refund' | 'creator_earning' | 'withdraw';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string | null;
}

const seedCreditTransactions: SeedCreditTransaction[] = [
  {
    id: '60000000-0000-0000-0000-000000000001',
    userEmail: 'jogador@teste.com',
    type: 'purchase',
    amount: 50,
    balanceBefore: 0,
    balanceAfter: 50,
    description: 'Compra: Pacote Inicial (50 créditos)',
  },
];

// ── Seed Function ────────────────────────────────────────────

async function seed() {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  const hash = await bcrypt.hash(SEED_PASSWORD, 12);

  // 1. Users — upsert by email (insert if new, skip if exists)
  console.log('📦 Inserindo usuários...');
  let usersCreated = 0;
  let usersSkipped = 0;
  for (const u of seedUsers) {
    // Check if user already exists by email
    const existing = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, u.email))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(schema.users).values({
        id: u.id,
        email: u.email,
        passwordHash: hash,
        displayName: u.displayName,
        role: u.role,
        creditsBalance: u.creditsBalance,
      });
      usersCreated++;
    } else {
      usersSkipped++;
    }
  }
  console.log(
    `   ✅ ${usersCreated} criados, ${usersSkipped} já existiam (senha novos: ${SEED_PASSWORD})`,
  );

  // Build email → ID map from DB (after inserts)
  const allUsers = await db
    .select({ id: schema.users.id, email: schema.users.email })
    .from(schema.users);
  const emailToId = new Map<string, string>();
  for (const u of allUsers) {
    emailToId.set(u.email, u.id);
  }

  function resolveId(email: string): string {
    const id = emailToId.get(email);
    if (!id) throw new Error(`Usuário não encontrado: ${email}. Execute o seed primeiro.`);
    return id;
  }

  // 2. Visual Novels
  console.log('📚 Inserindo visual novels...');
  let vnsCreated = 0;
  let vnsSkipped = 0;
  for (const vn of seedVNs) {
    const existing = await db
      .select({ id: schema.visualNovels.id })
      .from(schema.visualNovels)
      .where(eq(schema.visualNovels.id, vn.id))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(schema.visualNovels).values({
        id: vn.id,
        creatorId: resolveId(vn.creatorEmail),
        title: vn.title,
        synopsis: vn.synopsis,
        status: vn.status,
        ageRating: vn.ageRating,
        totalChapters: vn.totalChapters,
        priceCredits: vn.priceCredits,
        iaEnabled: vn.iaEnabled,
        iaPersona: vn.iaPersona,
        iaSystemPrompt: vn.iaSystemPrompt,
        iaMaxTokens: vn.iaMaxTokens,
      });
      vnsCreated++;
    } else {
      vnsSkipped++;
    }
  }
  console.log(`   ✅ ${vnsCreated} criadas, ${vnsSkipped} já existiam`);

  // 3. VN Tags
  console.log('🏷️  Inserindo tags...');
  let tagCount = 0;
  for (const vn of seedVNs) {
    for (const tag of vn.tags) {
      // Simple insert with conflict handling on (vn_id, tag) — since no unique constraint exists,
      // we check first
      const existingTags = await db
        .select({ id: schema.vnTags.id })
        .from(schema.vnTags)
        .where(and(eq(schema.vnTags.vnId, vn.id), eq(schema.vnTags.tag, tag)))
        .limit(1);
      if (existingTags.length === 0) {
        await db.insert(schema.vnTags).values({ vnId: vn.id, tag });
        tagCount++;
      }
    }
  }
  console.log(`   ✅ ${tagCount} tags`);

  // 4. Chapters
  console.log('📖 Inserindo capítulos...');
  let chaptersCreated = 0;
  for (const ch of seedChapters) {
    const existing = await db
      .select({ id: schema.chapters.id })
      .from(schema.chapters)
      .where(eq(schema.chapters.id, ch.id))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(schema.chapters).values({
        id: ch.id,
        vnId: ch.vnId,
        title: ch.title,
        orderIndex: ch.orderIndex,
        status: ch.status,
        priceCredits: ch.priceCredits,
        startSceneId: ch.startSceneId,
      });
      chaptersCreated++;
    }
  }
  console.log(`   ✅ ${chaptersCreated} capítulos (${seedChapters.length} no total)`);

  // 5. Scenes
  console.log('🎬 Inserindo cenas...');
  let scenesCreated = 0;
  for (const sc of seedScenes) {
    const existing = await db
      .select({ id: schema.scenes.id })
      .from(schema.scenes)
      .where(eq(schema.scenes.id, sc.id))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(schema.scenes).values({
        id: sc.id,
        chapterId: sc.chapterId,
        title: sc.title,
        type: sc.type,
        content: sc.content as any,
        nextSceneId: sc.nextSceneId,
      });
      scenesCreated++;
    }
  }
  console.log(`   ✅ ${scenesCreated} cenas (${seedScenes.length} no total)`);

  // 6. Choices
  console.log('🔀 Inserindo escolhas...');
  let choicesCreated = 0;
  for (const ch of seedChoices) {
    const existing = await db
      .select({ id: schema.choices.id })
      .from(schema.choices)
      .where(eq(schema.choices.id, ch.id))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(schema.choices).values({
        id: ch.id,
        sceneId: ch.sceneId,
        text: ch.text,
        targetSceneId: ch.targetSceneId,
        orderIndex: ch.orderIndex,
        isDefault: ch.isDefault,
      });
      choicesCreated++;
    }
  }
  console.log(`   ✅ ${choicesCreated} escolhas (${seedChoices.length} no total)`);

  // 7. Saves
  console.log('💾 Inserindo saves...');
  let savesCreated = 0;
  for (const s of seedSaves) {
    const existing = await db
      .select({ id: schema.saves.id })
      .from(schema.saves)
      .where(eq(schema.saves.id, s.id))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(schema.saves).values({
        id: s.id,
        userId: resolveId(s.userEmail),
        vnId: s.vnId,
        slotNumber: s.slotNumber,
        label: s.label,
        currentSceneId: s.currentSceneId,
        flags: s.flags as any,
        choiceHistory: s.choiceHistory as any,
      });
      savesCreated++;
    }
  }
  console.log(`   ✅ ${savesCreated} saves (${seedSaves.length} no total)`);

  // 8. Credit Transactions
  console.log('💰 Inserindo transações de crédito...');
  let creditsCreated = 0;
  for (const ct of seedCreditTransactions) {
    const existing = await db
      .select({ id: schema.creditTransactions.id })
      .from(schema.creditTransactions)
      .where(eq(schema.creditTransactions.id, ct.id))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(schema.creditTransactions).values({
        id: ct.id,
        userId: resolveId(ct.userEmail),
        type: ct.type,
        amount: ct.amount,
        balanceBefore: ct.balanceBefore,
        balanceAfter: ct.balanceAfter,
        description: ct.description,
      });
      creditsCreated++;
    }
  }
  console.log(`   ✅ ${creditsCreated} transações (${seedCreditTransactions.length} no total)`);

  // 9. NEON REFÚGIO — Demo Story (capítulos, cenas, escolhas)
  await seedNeonRefugio(pool, resolveId);

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log(`   Senha padrão para TODOS os usuários: ${SEED_PASSWORD}`);
  console.log('   Execute novamente a qualquer momento — é idempotente.\n');

  await pool.end();
}

seed().catch((err) => {
  console.error('❌ Erro durante o seed:', err);
  process.exit(1);
});
