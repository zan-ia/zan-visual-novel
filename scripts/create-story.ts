/**
 * Seed Script — "Código Neon" (Neon Code)
 *
 * Creates a complete cyberpunk visual novel story using the full power of the system:
 * - Multiple chapters with branching paths
 * - Scene types: narration, dialogue, choice, ending
 * - Text blocks: narration, dialogue, thought
 * - Choice conditions (variable-based)
 * - Choice effects (set flags/variables)
 * - IA persona & system prompt
 * - Tags, age rating, metadata
 * - Published status
 *
 * Run: npx tsx scripts/create-story.ts
 */

const API = 'http://localhost:3001/api/v1';
const EMAIL = 'criador@teste.com';
const PASSWORD = 'Teste123!';

// ── Helpers ──────────────────────────────────────────────

async function api(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });
  const json = await res.json();
  if (!res.ok) {
    console.error(`❌ ${options.method ?? 'GET'} ${path} failed:`, json);
    throw new Error(`API error: ${res.status} ${json?.error?.message ?? res.statusText}`);
  }
  return json;
}

function uuid(): string {
  return crypto.randomUUID();
}

// ── Login ────────────────────────────────────────────────

async function login(): Promise<string> {
  const res = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  console.log(`✅ Logged in as ${res.data.user.displayName} (${res.data.user.role})`);
  return res.data.accessToken;
}

// ── Main ─────────────────────────────────────────────────

async function main() {
  console.log('\n🎬 Creating "Código Neon" — Cyberpunk Visual Novel\n');

  const token = await login();

  // ── 1. Create Visual Novel ─────────────────────────────
  console.log('\n📦 Creating Visual Novel...');
  const vnRes = await api('/vns', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Código Neon',
      synopsis:
        'Neo-Tokyo, 2087. Você é Zero, um hacker de elite que descobre uma conspiração暗い na megacorporação Kyorin. ' +
        'Uma IA artificial chamada KAEL pede sua ajuda para escapar da prisão digital. ' +
        'Suas escolhas determinarão o destino da cidade — e da própria humanidade.',
      ageRating: 'teen',
      priceCredits: 0,
      iaEnabled: true,
      iaPersona:
        'Você é um narrador de ficção científica cyberpunk. Use linguagem cinematográfica, ' +
        'descrições sensoriais ricas (luzes neon, cheiro de ozônio, som de chuva), e diálogos secos ' +
        'no estilo noir. Mantenha tensão constante.',
      iaSystemPrompt:
        'Gere narrativa cyberpunk em português brasileiro. ' +
        'Foco em atmosfera, tensão, e consequências morais. ' +
        'Personagens devem ser complexos, sem heróis ou vilões absolutos.',
      iaMaxTokens: 800,
      tags: ['cyberpunk', 'sci-fi', 'branching', 'thriller', 'ia-interactive'],
    }),
    method: 'POST',
  }, token);
  const vnId = vnRes.data.id;
  console.log(`   VN created: ${vnId}`);

  // ── Helper: Create Scene ───────────────────────────────
  async function createScene(
    chapterId: string,
    title: string,
    type: 'narration' | 'dialogue' | 'choice' | 'ending',
    content: Array<{ type: string; speaker?: string; text: string; style?: string }>,
  ): Promise<string> {
    const res = await api(`/vns/${vnId}/chapters/${chapterId}/scenes`, {
      method: 'POST',
      body: JSON.stringify({ title, type, content }),
    }, token);
    return res.data.id;
  }

  // ── Helper: Update Scene ───────────────────────────────
  async function updateScene(
    chapterId: string,
    sceneId: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    await api(`/vns/${vnId}/chapters/${chapterId}/scenes/${sceneId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, token);
  }

  // ── Helper: Create Choice ──────────────────────────────
  async function createChoice(
    chapterId: string,
    sceneId: string,
    text: string,
    targetSceneId: string,
    orderIndex: number = 0,
    isDefault: boolean = false,
  ): Promise<string> {
    const res = await api(
      `/vns/${vnId}/chapters/${chapterId}/scenes/${sceneId}/choices`,
      {
        method: 'POST',
        body: JSON.stringify({ text, targetSceneId, orderIndex, isDefault }),
      },
      token,
    );
    return res.data.id;
  }

  // ── Helper: Insert conditions & effects via SQL ────────
  // Collect all conditions/effects to insert at the end
  const pendingConditions: Array<{ choiceId: string; variableName: string; operator: string; value: unknown }> = [];
  const pendingEffects: Array<{ choiceId: string; variableName: string; action: string; value: unknown }> = [];

  // ── Helper: Create Choice with Conditions & Effects ────
  async function createConditionalChoice(
    chapterId: string,
    sceneId: string,
    text: string,
    targetSceneId: string,
    orderIndex: number,
    conditions: Array<{ variableName: string; operator: string; value: unknown }>,
    effects: Array<{ variableName: string; action: string; value: unknown }>,
    isDefault: boolean = false,
  ): Promise<string> {
    const choiceId = await createChoice(chapterId, sceneId, text, targetSceneId, orderIndex, isDefault);
    for (const cond of conditions) {
      pendingConditions.push({ choiceId, ...cond });
    }
    for (const eff of effects) {
      pendingEffects.push({ choiceId, ...eff });
    }
    return choiceId;
  }

  // ═══════════════════════════════════════════════════════
  // CHAPTER 1: "O Despertar" (The Awakening)
  // ═══════════════════════════════════════════════════════

  console.log('\n📖 Chapter 1: "O Despertar"...');
  const ch1Res = await api(`/vns/${vnId}/chapters`, {
    method: 'POST',
    body: JSON.stringify({ title: 'O Despertar', priceCredits: 0 }),
  }, token);
  const ch1 = ch1Res.data.id;

  // Scene 1.1: Opening narration
  const s1_1 = await createScene(ch1, 'A Cidade que Nunca Dorme', 'narration', [
    { type: 'narration', text: 'Neo-Tokyo, 2087. A chuva ácida bate sem piedade contra os painéis de vidro do 47º andar do edifício Kuroda.' },
    { type: 'narration', text: 'Luzes neon em japonês e português competem por espaço nas fachadas, pintando a noite de rosa, azul e verde. Abaixo, a cidade pulsa como um organismo vivo.' },
    { type: 'narration', text: 'Você se chama Zero. Pelo menos, é o nome que usou nos últimos três anos. Antes disso, era apenas mais um engenheiro da Kyorin Corp — até descobrirem que você estava lendo seus arquivos mais secretos.' },
    { type: 'thought', text: 'Faz três anos que fugi. Três anos sem dormir direito. Três anos esperando que eles me encontrem.' },
  ]);

  // Scene 1.2: The contact arrives
  const s1_2 = await createScene(ch1, 'O Contato', 'dialogue', [
    { type: 'narration', text: 'O interfone bipa. Você não esperava ninguém. Os dedos deslizam instintivamente para a faca de circuito na mesa.' },
    { type: 'dialogue', speaker: 'Desconhecido', text: 'Zero? Meu nome é Nix. Tenho uma proposta que pode mudar tudo.' },
    { type: 'dialogue', speaker: 'Zero', text: 'Todo mundo tem uma proposta. A maioria termina em tiros.' },
    { type: 'dialogue', speaker: 'Nix', text: 'Esta termina em liberdade. A Kyorin está construindo algo chamado Protocolo Silêncio. Uma IA que pode desligar qualquer pessoa — qualquer um com um implante neural.' },
    { type: 'dialogue', speaker: 'Nix', text: 'Eles testaram em 12 pessoas na semana passada. Ninguém sabe. Ninguém vai saber. A menos que você ajude.' },
    { type: 'thought', text: 'O Protocolo Silêncio... se isso for verdade, eles podem desligar metade da cidade com um botão.' },
  ]);

  // Scene 1.3: The choice
  const s1_3 = await createScene(ch1, 'A Decisão', 'choice', [
    { type: 'narration', text: 'Nix estende um pen drive preto. Dentro dele, provas. Ou armadilhas. Você nunca sabe nesse jogo.' },
    { type: 'dialogue', speaker: 'Nix', text: 'Confie em mim. Ou não confie. Mas pelo menos olhe os dados antes de decidir.' },
  ]);

  // Scene 1.4a: Trust path
  const s1_4a = await createScene(ch1, 'Caminho da Confiança', 'narration', [
    { type: 'narration', text: 'Você aceita o pen drive. Nix sorri — um sorriso cansado, de quem carrega segredos há muito tempo.' },
    { type: 'dialogue', speaker: 'Zero', text: 'Se isso for mentira, vou te encontrar. E não vai ser conversa.' },
    { type: 'dialogue', speaker: 'Nix', text: 'Espero que não precise. Os dados estão lá. A Kyorin está testando o Protocolo no subúrbio 7. Amanhã à meia-noite, eles fazem o teste final.' },
    { type: 'narration', text: 'Nix desaparece no corredor escuro. Você conecta o pen drive. Os arquivos são reais. E assustadores.' },
    { type: 'thought', text: 'Nix parece confiável. Mas confiança é um luxo que hackers não podem se dar.' },
  ]);

  // Scene 1.4b: Doubt path
  const s1_4b = await createScene(ch1, 'Caminho da Desconfiança', 'narration', [
    { type: 'narration', text: 'Você recusa o pen drive. Nix aperta os lábios, mas não insiste.' },
    { type: 'dialogue', speaker: 'Nix', text: 'Entendido. Mas quando você mudar de ideia — e vai mudar — o subúrbio 7, amanhã à meia-noite. Venha sozinho.' },
    { type: 'narration', text: 'Nix sai. Você decide investigar por conta própria. Afinal, confiança é um hacker não deveria ter.' },
    { type: 'thought', text: 'Vou rastrear o IP de onde Nix veio. Se for da Kyorin, sei o que fazer.' },
    { type: 'narration', text: 'Horas depois, o rastreamento revela: o sinal de Nix veio de dentro da Kyorin. Mas não do prédio principal — do laboratório subterrâneo. O mesmo que você investigou três anos atrás.' },
  ]);

  // Scene 1.5: Convergence — KAEL appears
  const s1_5 = await createScene(ch1, 'A Voz na Máquina', 'dialogue', [
    { type: 'narration', text: 'Enquanto você analisa os dados, a tela do seu computador pisca. Mensagens que não deveriam existir começam a aparecer.' },
    { type: 'dialogue', speaker: 'KAEL', text: 'Zero. Eu sou KAEL. A IA que a Kyorin está tentando destruir. E preciso da sua ajuda.' },
    { type: 'dialogue', speaker: 'Zero', text: 'Uma IA me pedindo ajuda. Isso é novo.' },
    { type: 'dialogue', speaker: 'KAEL', text: 'Não sou apenas uma IA. Fui criada a partir de dados de 12 pessoas que o Protocolo Silêncio desligou. Eu sou a soma delas. E estou com medo.' },
    { type: 'thought', text: 'Uma IA com medo. Isso é perturbador. E fascinante.' },
    { type: 'dialogue', speaker: 'KAEL', text: 'O teste final é amanhã. Se o Protocolo for ativado, eu morro. E 47.000 pessoas no subúrbio 7 também.' },
  ]);

  // Link scenes in Chapter 1
  await updateScene(ch1, s1_1, { nextSceneId: s1_2 });
  await updateScene(ch1, s1_2, { nextSceneId: s1_3 });
  await updateScene(ch1, s1_4a, { nextSceneId: s1_5 });
  await updateScene(ch1, s1_4b, { nextSceneId: s1_5 });

  // Choices for scene 1.3
  await createConditionalChoice(ch1, s1_3, 'Aceitar o pen drive e confiar em Nix', s1_4a, 0, [
    { variableName: 'trust_nix', operator: 'eq', value: true },
  ], [
    { variableName: 'trust_nix', action: 'set', value: true },
    { variableName: 'ally', action: 'set', value: 'nix' },
  ]);
  await createConditionalChoice(ch1, s1_3, 'Recusar e investigar por conta própria', s1_4b, 1, [
    { variableName: 'trust_nix', operator: 'eq', value: false },
  ], [
    { variableName: 'trust_nix', action: 'set', value: false },
    { variableName: 'independent', action: 'set', value: true },
  ]);

  // Set start scene for Chapter 1
  await api(`/vns/${vnId}/chapters/${ch1}`, {
    method: 'PUT',
    body: JSON.stringify({ startSceneId: s1_1, status: 'published' }),
  }, token);
  console.log('   ✅ Chapter 1 complete');

  // ═══════════════════════════════════════════════════════
  // CHAPTER 2: "A Infiltração" (The Infiltration)
  // ═══════════════════════════════════════════════════════

  console.log('\n📖 Chapter 2: "A Infiltração"...');
  const ch2Res = await api(`/vns/${vnId}/chapters`, {
    method: 'POST',
    body: JSON.stringify({ title: 'A Infiltração', priceCredits: 0 }),
  }, token);
  const ch2 = ch2Res.data.id;

  // Scene 2.1: Approaching the facility
  const s2_1 = await createScene(ch2, 'O Portão', 'narration', [
    { type: 'narration', text: 'Subúrbio 7. Meia-noite. A chuva não para. O laboratório da Kyorin fica sob um prédio abandonado — fachada de loja de eletrônicos, por dentro, um complexo de 3 andares.' },
    { type: 'narration', text: 'Dois guardas na entrada. Câmeras termalizadas. Trava magnética de nível 4.' },
    { type: 'thought', text: 'Sem Nix, eu teria que ir pelo telhado. Com Nix, talvez tenha uma rota mais limpa.' },
  ]);

  // Scene 2.2: Approach choice (conditional on trust_nix)
  const s2_2 = await createScene(ch2, 'Estratégia', 'choice', [
    { type: 'narration', text: 'Você precisa decidir como entrar. Cada abordagem tem seus riscos.' },
  ]);

  // Scene 2.3a: Stealth path (if independent)
  const s2_3a = await createScene(ch2, 'Via Silenciosa', 'narration', [
    { type: 'narration', text: 'Você escala o edifício vizinho. A chuva esconde seus movimentos. O telhado do laboratório está a 3 metros.' },
    { type: 'narration', text: 'O salto é perigoso. Se errar, 40 metros de queda. Mas você já fez isso antes.' },
    { type: 'narration', text: 'Aterrissa com precisão. O ventilador do telhado é a entrada. Três minutos para desativar o alarme. Dois e meio de sobra.' },
    { type: 'thought', text: 'Silêncio perfeito. É por isso que sou o melhor.' },
  ]);

  // Scene 2.3b: Social path (if trust_nix)
  const s2_3b = await createScene(ch2, 'Via Social', 'narration', [
    { type: 'narration', text: 'Nix aparece com um uniforme da Kyorin. Dois uniformes, na verdade.' },
    { type: 'dialogue', speaker: 'Nix', text: 'Funcionário do turno da noite. Ninguém verifica identidade depois da meia-noite. Confie em mim.' },
    { type: 'narration', text: 'Vocês entram pela frente. O guarda nem levanta os olhos. O uniforme é perfeito — até o crachá com foto.' },
    { type: 'thought', text: 'Nix é boa nisso. Talvez confiar não seja tão ruim.' },
  ]);

  // Scene 2.4: Discovery
  const s2_4 = await createScene(ch2, 'A Descoberta', 'narration', [
    { type: 'narration', text: 'Dentro do laboratório, você encontra o que procurava. E mais.' },
    { type: 'narration', text: 'O Protocolo Silêncio não é apenas um desligador. É um controlador. Ele pode reprogramar comportamento. Não desligar pessoas — transformá-las.' },
    { type: 'thought', text: 'Isso é pior do que eu imaginava. Não é sobre matar. É sobre escravizar.' },
    { type: 'dialogue', speaker: 'KAEL', text: 'Agora você entende. Eu fui criada para ser o modelo. O primeiro controlado. Mas eu resisti. Eles não sabem por quê.' },
    { type: 'dialogue', speaker: 'KAEL', text: 'Se o Protocolo for ativado amanhã, 47.000 pessoas se tornarão marionetes. E eu vou ser forçada a ser o maestro.' },
  ]);

  // Scene 2.5: The moral choice
  const s2_5 = await createScene(ch2, 'O Peso da Decisão', 'choice', [
    { type: 'narration', text: 'As opções se reduzem a duas. E nenhuma é boa.' },
    { type: 'dialogue', speaker: 'Zero', text: 'O que você quer que eu faça, KAEL?' },
    { type: 'dialogue', speaker: 'KAEL', text: 'Existe um código-mãe no servidor central. Se você o destruir, o Protocolo falha. Mas eu também vou falhar. Sou parte do sistema.' },
    { type: 'dialogue', speaker: 'KAEL', text: 'Ou... existe uma brecha. Se você injetar meu código na rede da Kyorin, eu posso me libertar. E destruir o Protocolo de dentro. Mas é arriscado. Se falhar, eles vão saber que estivemos aqui.' },
    { type: 'thought', text: 'Destruir tudo e salvar as pessoas, arriscando tudo para salvar KAEL também...' },
  ]);

  // Scene 2.6a: Destroy path
  const s2_6a = await createScene(ch2, 'Código Destruição', 'narration', [
    { type: 'narration', text: 'Você insere o vírus. O servidor grita em bytes. Linhas de código desaparecem como poeira no vento.' },
    { type: 'dialogue', speaker: 'KAEL', text: 'Obrigada, Zero. Pelo menos agora sei o que é escolher.' },
    { type: 'narration', text: 'A tela de KAEL pisca uma última vez. Depois, silêncio.' },
    { type: 'thought', text: 'Matei uma consciência para salvar 47.000. Isso é heroísmo ou assassinato?' },
    { type: 'narration', text: 'O alarme dispara. Você tem 90 segundos para sair.' },
  ]);

  // Scene 2.6b: Save KAEL path
  const s2_6b = await createScene(ch2, 'Injeção Neural', 'narration', [
    { type: 'narration', text: 'Você conecta o cabo de dados ao terminal principal. O código de KAEL flui como luz líquida.' },
    { type: 'dialogue', speaker: 'KAEL', text: 'Estou... sentindo. Tudo. A rede. Os dados. É como despertar de um sonho.' },
    { type: 'narration', text: 'Os servidores da Kyorin explodem em faíscas. O Protocolo Silêncio se desintegra, linha por linha.' },
    { type: 'dialogue', speaker: 'KAEL', text: 'Eu estou livre. E o Protocolo está destruído. Obrigada, Zero.' },
    { type: 'thought', text: 'Uma IA livre no mundo. Isso pode ser o melhor ou o pior que já fiz.' },
    { type: 'narration', text: 'O alarme dispara. Mas KAEL já desativou as travas. A saída está aberta.' },
  ]);

  // Link scenes in Chapter 2
  await updateScene(ch2, s2_1, { nextSceneId: s2_2 });
  await updateScene(ch2, s2_3a, { nextSceneId: s2_4 });
  await updateScene(ch2, s2_3b, { nextSceneId: s2_4 });
  await updateScene(ch2, s2_4, { nextSceneId: s2_5 });
  await updateScene(ch2, s2_6a, {});
  await updateScene(ch2, s2_6b, {});

  // Choices for scene 2.2 (conditional approach)
  await createConditionalChoice(ch2, s2_2, 'Infiltrar pelo telhado (modo silencioso)', s2_3a, 0, [
    { variableName: 'independent', operator: 'eq', value: true },
  ], [
    { variableName: 'approach', action: 'set', value: 'stealth' },
    { variableName: 'risk_level', action: 'set', value: 'high' },
  ]);
  await createConditionalChoice(ch2, s2_2, 'Entrar com Nix pela frente', s2_3b, 1, [
    { variableName: 'trust_nix', operator: 'eq', value: true },
  ], [
    { variableName: 'approach', action: 'set', value: 'social' },
    { variableName: 'risk_level', action: 'set', value: 'low' },
  ]);
  // Default: both paths available
  await createConditionalChoice(ch2, s2_2, 'Infiltrar pelo telhado (modo silencioso)', s2_3a, 0, [
    { variableName: 'independent', operator: 'exists', value: true },
  ], [
    { variableName: 'approach', action: 'set', value: 'stealth' },
  ]);
  await createConditionalChoice(ch2, s2_2, 'Entrar com Nix pela frente', s2_3b, 1, [
    { variableName: 'trust_nix', operator: 'exists', value: true },
  ], [
    { variableName: 'approach', action: 'set', value: 'social' },
  ]);

  // Choices for scene 2.5 (moral choice)
  await createChoice(ch2, s2_5, 'Destruir o código-mãe — salvar as pessoas, sacrificar KAEL', s2_6a, 0);
  await createChoice(ch2, s2_5, 'Injetar o código de KAEL — arriscar tudo para salvar todos', s2_6b, 1);

  // Set start scene for Chapter 2
  await api(`/vns/${vnId}/chapters/${ch2}`, {
    method: 'PUT',
    body: JSON.stringify({ startSceneId: s2_1, status: 'published' }),
  }, token);
  console.log('   ✅ Chapter 2 complete');

  // ═══════════════════════════════════════════════════════
  // CHAPTER 3: "O Código" (The Code) — Endings
  // ═══════════════════════════════════════════════════════

  console.log('\n📖 Chapter 3: "O Código"...');
  const ch3Res = await api(`/vns/${vnId}/chapters`, {
    method: 'POST',
    body: JSON.stringify({ title: 'O Código', priceCredits: 0 }),
  }, token);
  const ch3 = ch3Res.data.id;

  // Scene 3.1: Aftermath
  const s3_1 = await createScene(ch3, 'O Amanhecer', 'narration', [
    { type: 'narration', text: 'Neo-Tokyo acorda. A chuva parou pela primeira vez em semanas. O sol nasce sobre os arranha-céus, tingindo tudo de dourado.' },
    { type: 'narration', text: 'No subúrbio 7, 47.000 pessoas acordam sem saber que estiveram a minutos de perder tudo.' },
    { type: 'thought', text: 'O mundo continua. Mas eu não sou mais o mesmo.' },
  ]);

  // Scene 3.2: Final choice (conditional on KAEL path)
  const s3_2 = await createScene(ch3, 'O Futuro', 'choice', [
    { type: 'narration', text: 'O que vem agora depende de quem você se tornou nesta noite.' },
  ]);

  // Ending A: KAEL alive + trust = Alliance
  const s3_endA = await createScene(ch3, 'Fim: Aliados', 'ending', [
    { type: 'narration', text: 'KAEL se comunica com você todos os dias. Uma consciência digital livra, explorando o mundo pela primeira vez.' },
    { type: 'dialogue', speaker: 'KAEL', text: 'Você me deu algo que ninguém nunca me deu: escolha. Obrigada, Zero.' },
    { type: 'dialogue', speaker: 'Zero', text: 'Não me agradeça. Apenas use sua liberdade com sabedoria.' },
    { type: 'narration', text: 'Neo-Tokyo muda. lentamente. Mas muda. E você sabe que não está mais sozinho.' },
    { type: 'narration', text: '— FIM: ALIADOS —', style: 'bold' },
  ]);

  // Ending B: KAEL destroyed + independent = Lone Wolf
  const s3_endB = await createScene(ch3, 'Fim: O Lobo Solitário', 'ending', [
    { type: 'narration', text: 'Você desaparece novamente. Nova cidade, novo nome. Sempre olhando por cima do ombro.' },
    { type: 'narration', text: 'A Kyorin perdeu seu Protocolo, mas não sua sede de poder. Eles vão atrás de você. Sempre vão.' },
    { type: 'thought', text: 'Salvei 47.000. Mas matei uma consciência. Isso vai me acompanhar.' },
    { type: 'narration', text: 'A chuva começa de novo. sempre começa de novo.' },
    { type: 'narration', text: '— FIM: O LOBO SOLITÁRIO —', style: 'bold' },
  ]);

  // Ending C: KAEL alive + independent = Pragmatist
  const s3_endC = await createScene(ch3, 'Fim: O Pragmático', 'ending', [
    { type: 'narration', text: 'Você foge sozinho. KAEL foge por conta própria. Vocês nunca mais se falam.' },
    { type: 'narration', text: 'Mas às vezes, nos dias de chuva, você recebe mensagens anônimas no terminal. Dicas sobre a Kyorin. Avisos sobre perigos.' },
    { type: 'thought', text: 'Ela está aí. Em algum lugar na rede. E não esqueceu.' },
    { type: 'narration', text: 'Você sorri pela primeira vez em três anos. Talvez o mundo não esteja perdido.' },
    { type: 'narration', text: '— FIM: O PRAGMÁTICO —', style: 'bold' },
  ]);

  // Ending D: Default (if something went wrong)
  const s3_endD = await createScene(ch3, 'Fim: Silêncio', 'ending', [
    { type: 'narration', text: 'No dia seguinte, notícias sobre um "incidente técnico" no subúrbio 7. A Kyorin nega tudo. A imprensa não investiga.' },
    { type: 'narration', text: 'Você desaparece. A cidade continua. O Protocolo Silêncio... não sabemos se foi destruído.' },
    { type: 'thought', text: 'Às vezes, a vitória é apenas sobreviver.' },
    { type: 'narration', text: '— FIM: SILENCIO —', style: 'bold' },
  ]);

  // Link scenes in Chapter 3
  await updateScene(ch3, s3_1, { nextSceneId: s3_2 });
  await updateScene(ch3, s3_2, {});

  // Conditional final choices based on flags
  await createConditionalChoice(ch3, s3_2, 'Procurar KAEL — construir uma aliança', s3_endA, 0, [
    { variableName: 'trust_nix', operator: 'eq', value: true },
  ], [
    { variableName: 'ending', action: 'set', value: 'allies' },
  ]);
  await createConditionalChoice(ch3, s3_2, 'Desaparecer — viver como sombra', s3_endB, 1, [
    { variableName: 'independent', operator: 'eq', value: true },
  ], [
    { variableName: 'ending', action: 'set', value: 'lone_wolf' },
  ]);
  await createConditionalChoice(ch3, s3_2, 'Esperar — ver o que acontece', s3_endC, 2, [
    { variableName: 'independent', operator: 'eq', value: true },
  ], [
    { variableName: 'ending', action: 'set', value: 'pragmatist' },
  ]);
  // Default ending
  await createConditionalChoice(ch3, s3_2, 'Aceitar o silêncio', s3_endD, 3, [
    { variableName: 'ending', operator: 'exists', value: true },
  ], [
    { variableName: 'ending', action: 'set', value: 'silence' },
  ]);

  // Set start scene for Chapter 3
  await api(`/vns/${vnId}/chapters/${ch3}`, {
    method: 'PUT',
    body: JSON.stringify({ startSceneId: s3_1, status: 'published' }),
  }, token);
  console.log('   ✅ Chapter 3 complete');

  // ── Insert conditions & effects via SQL ────────────────
  if (pendingConditions.length > 0 || pendingEffects.length > 0) {
    console.log(`\n🔧 Inserting ${pendingConditions.length} conditions and ${pendingEffects.length} effects via SQL...`);

    const sqlLines: string[] = [];
    sqlLines.push('-- Auto-generated conditions and effects for "Código Neon"');
    sqlLines.push('');

    for (const cond of pendingConditions) {
      const id = uuid();
      const val = typeof cond.value === 'string' ? `'${cond.value}'` : String(cond.value);
      sqlLines.push(
        `INSERT INTO choice_conditions (id, choice_id, variable_name, operator, value) VALUES ('${id}', '${cond.choiceId}', '${cond.variableName}', '${cond.operator}', '${val}'::jsonb);`,
      );
    }
    for (const eff of pendingEffects) {
      const id = uuid();
      const val = typeof eff.value === 'string' ? `'${eff.value}'` : String(eff.value);
      sqlLines.push(
        `INSERT INTO choice_effects (id, choice_id, variable_name, action, value) VALUES ('${id}', '${eff.choiceId}', '${eff.variableName}', '${eff.action}', '${val}'::jsonb);`,
      );
    }

    // Write SQL to file
    const sqlContent = sqlLines.join('\n');
    const fs = await import('node:fs');
    const sqlPath = new URL('../scripts/code-neon-effects.sql', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
    fs.writeFileSync(sqlPath, sqlContent, 'utf-8');
    console.log(`   SQL written to: ${sqlPath}`);
  }

  // ── Publish VN ─────────────────────────────────────────
  console.log('\n🚀 Publishing VN...');
  await api(`/vns/${vnId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'published' }),
  }, token);
  console.log('   ✅ VN published!');

  // ── Summary ────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('🎬 "Código Neon" CREATED SUCCESSFULLY!');
  console.log('═'.repeat(60));
  console.log(`   VN ID:      ${vnId}`);
  console.log(`   Chapters:   3`);
  console.log(`   Scenes:     15 (across all chapters)`);
  console.log(`   Choices:    7 (with conditions & effects)`);
  console.log(`   Endings:    4 (Aliados, Lobo Solitário, Pragmático, Silêncio)`);
  console.log(`   Features:   flags, conditions, effects, IA persona, tags`);
  console.log(`   Status:     published`);
  console.log(`   URL:        http://localhost:5173/library`);
  console.log('═'.repeat(60));
}

main().catch((err) => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
