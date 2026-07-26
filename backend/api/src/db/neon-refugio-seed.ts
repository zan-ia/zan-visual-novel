/**
 * NEON REFÚGIO — Demo Story Seed
 *
 * Insere a história cyberpunk completa no banco de dados.
 * Idempotente: pode ser executado várias vezes sem duplicar dados.
 *
 * Usado por: src/db/seed.ts (chamado automaticamente)
 * Standalone: tsx src/db/neon-refugio-seed.ts
 */

import { eq } from 'drizzle-orm';
import * as schema from './schema.js';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

// ── Types ────────────────────────────────────────────────────

interface NeonSeedChapter {
  id: string;
  vnId: string;
  title: string;
  orderIndex: number;
  status: 'draft' | 'published';
  priceCredits: number;
  startSceneId: string;
}

interface NeonTextBlock {
  type: 'narration' | 'dialogue' | 'thought';
  text: string;
  speaker?: string;
  style?: 'normal' | 'italic' | 'bold';
}

interface NeonSeedScene {
  id: string;
  chapterId: string;
  title: string;
  type: 'narration' | 'dialogue' | 'choice' | 'ending';
  content: NeonTextBlock[];
  nextSceneId: string | null;
}

interface NeonSeedChoice {
  id: string;
  sceneId: string;
  text: string;
  targetSceneId: string;
  orderIndex: number;
  isDefault: boolean;
}

interface NeonSeedCondition {
  variableName: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not_in' | 'exists';
  value: unknown;
}

interface NeonSeedEffect {
  variableName: string;
  action: 'set' | 'add' | 'toggle' | 'push';
  value: unknown;
  condition?: NeonSeedCondition;
}

interface NeonFullChoice extends NeonSeedChoice {
  conditions?: NeonSeedCondition[];
  effects?: NeonSeedEffect[];
}

// ── Story Data ──────────────────────────────────────────────

export const NEON_REFUGIO_VN_ID = '10000000-0000-0000-0000-000000000010';
export const NEON_REFUGIO_CREATOR_EMAIL = 'criador@teste.com';

// ── Chapter 1: "72 Horas" (grátis) ──────────────────────────

const ch1: NeonSeedChapter = {
  id: 'a1000000-0000-0000-0000-000000000001',
  vnId: NEON_REFUGIO_VN_ID,
  title: '72 Horas',
  orderIndex: 0,
  status: 'published',
  priceCredits: 0,
  startSceneId: 'a2000000-0000-0000-0000-000000000001',
};

const ch1Scenes: NeonSeedScene[] = [
  {
    id: 'a2000000-0000-0000-0000-000000000001',
    chapterId: ch1.id,
    title: 'O Despertar',
    type: 'narration',
    nextSceneId: 'a2000000-0000-0000-0000-000000000002',
    content: [
      { type: 'narration', text: 'O som da chuva ácida contra a janela de metal é a primeira coisa que Zara ouve. Depois, a dor.' },
      { type: 'narration', text: 'Uma pulsação surda atrás dos olhos — o implante Nexus cobrando seu preço. Ela abre os olhos devagar. O teto do apartamento está manchado de umidade. Uma infiltração que ela nunca teve dinheiro para consertar.' },
      { type: 'thought', speaker: 'Zara', text: 'Ainda estou viva. Isso já é alguma coisa.' },
      { type: 'narration', text: 'Ela se senta na cama. O apartamento está revirado — gavetas abertas, o terminal de dados no chão, a cadeira quebrada. A OmniTech já passou por aqui. Não encontraram o que queriam.' },
      { type: 'narration', text: 'Zara leva a mão à nuca, onde o implante se conecta à espinha. Um número pulsa em sua visão periférica, projetado diretamente na retina pelo Nexus.' },
      { type: 'narration', text: '72:00:00.\n71:59:59.\n71:59:58.' },
      { type: 'thought', speaker: 'Zara', text: 'Setenta e duas horas. O kill-switch já está contando.' },
      { type: 'narration', text: 'O terminal caído no chão emite um brilho fraco. Uma mensagem não lida pisca no canto da tela quebrada. Remetente: "A". Assunto: "A clínica ainda está de pé."' },
      { type: 'thought', speaker: 'Zara', text: 'Ana. Claro que seria você.' },
      { type: 'narration', text: 'Zara se levanta, veste a jaqueta com capuz — surrada, mas quente — e enfia o disruptor de sinal no bolso. Lá fora, a chuva ácida cai sobre o Submundo como lágrimas de uma cidade que nunca aprendeu a chorar.' },
    ],
  },
  {
    id: 'a2000000-0000-0000-0000-000000000002',
    chapterId: ch1.id,
    title: 'Mensagem na Chuva',
    type: 'dialogue',
    nextSceneId: 'a2000000-0000-0000-0000-000000000003',
    content: [
      { type: 'narration', text: 'As ruas do Submundo são um organismo vivo. Drones de vigilância zumbem entre os prédios como libélulas metálicas. O neônio quebrado dos letreiros pisca em cores que não existiam há cem anos. A chuva ácida transforma o asfalto em um espelho distorcido.' },
      { type: 'narration', text: 'Zara caminha com o capuz baixo, o rosto escondido. Cada drone que passa é um alerta. Cada sombra pode ser um agente.' },
      { type: 'dialogue', speaker: 'Ana (via texto)', text: 'Você está viva. Graças ao Grid. Achei que a OmniTech tinha te pegado.' },
      { type: 'dialogue', speaker: 'Zara (via texto)', text: 'Quase pegaram. O apartamento está revirado. O que você sabe?' },
      { type: 'dialogue', speaker: 'Ana (via texto)', text: 'Sei que o Kael te entregou. E sei que você tem 72 horas antes do seu implante fritar seu cérebro. Preciso que você chegue nas Entre-Camadas. Minha clínica. Rua 7, nível 4.' },
      { type: 'thought', speaker: 'Zara', text: 'Kael. O nome dói mais do que o implante.' },
      { type: 'dialogue', speaker: 'Zara (via texto)', text: 'Por que está me ajudando? Você saiu da OmniTech antes de mim. Podia ter ficado fora disso.' },
      { type: 'dialogue', speaker: 'Ana (via texto)', text: 'Porque eu sei o que você descobriu, Zara. E o mundo precisa saber também. Agora pare de digitar e comece a andar. O elevador para as Entre-Camadas fecha em 20 minutos.' },
      { type: 'narration', text: 'Zara guarda o terminal. A mensagem de Ana é um fio de esperança em um novelo de desespero. Mas antes que ela possa dar o próximo passo, uma sombra se move no beco à sua direita.' },
      { type: 'narration', text: 'Não é um drone. É humano. E está seguindo ela.' },
    ],
  },
  {
    id: 'a2000000-0000-0000-0000-000000000003',
    chapterId: ch1.id,
    title: 'Encontro com a Sombra',
    type: 'choice',
    nextSceneId: null,
    content: [
      { type: 'narration', text: 'O vulto no beco não se move como um civil. Passos calculados. Postura treinada. Zara reconhece o padrão — segurança corporativa de baixo escalão. Mas por que só um?' },
      { type: 'thought', speaker: 'Zara', text: 'Se fosse uma emboscada, já teriam me cercado. Ele está sozinho. Ou é um batedor... ou não é da OmniTech.' },
      { type: 'narration', text: 'A chuva ácida escorre pelo capuz de Zara. Ela tem segundos para decidir.' },
    ],
  },
  {
    id: 'a2000000-0000-0000-0000-000000000004',
    chapterId: ch1.id,
    title: 'Confronto no Beco',
    type: 'dialogue',
    nextSceneId: 'a2000000-0000-0000-0000-000000000007',
    content: [
      { type: 'narration', text: 'Zara não espera. Ela avança — três passos rápidos, um golpe na garganta, joelho no estômago. O homem cambaleia. Não é um agente de elite. É um mercenário de quinta categoria, daqueles que a OmniTech contrata às dúzias.' },
      { type: 'dialogue', speaker: 'Mercenário', text: 'Espera! Espera! Eu só... eu só estou seguindo ordens!' },
      { type: 'dialogue', speaker: 'Zara', text: 'Ordens de quem?' },
      { type: 'dialogue', speaker: 'Mercenário', text: 'Da OmniTech! Mas não é o que você pensa! Eles só querem o data-shard. Me pagaram pra te encontrar, não pra te matar!' },
      { type: 'thought', speaker: 'Zara', text: 'Interessante. A OmniTech não quer meu cadáver — quer o que eu carrego. Isso significa que eles têm medo do que eu sei.' },
      { type: 'narration', text: 'Zara pega o cartão de acesso do mercenário. Nível baixo, mas pode ser útil. Ela o deixa inconsciente no beco. A chuva lava o sangue dos nós dos dedos.' },
      { type: 'narration', text: 'O confronto chamou atenção. Drones se aproximam. É melhor sair daqui — rápido.' },
    ],
  },
  {
    id: 'a2000000-0000-0000-0000-000000000005',
    chapterId: ch1.id,
    title: 'Nas Sombras',
    type: 'narration',
    nextSceneId: 'a2000000-0000-0000-0000-000000000007',
    content: [
      { type: 'narration', text: 'Zara se funde com a escuridão do beco. Anos vivendo no Submundo ensinaram uma coisa: as sombras são mais confiáveis que as pessoas.' },
      { type: 'narration', text: 'O vulto passa direto. Ele para, olha ao redor, coça a cabeça e segue em frente. Um mercenário mal pago, seguindo um rastreador barato. Nada que Zara não pudesse evitar.' },
      { type: 'thought', speaker: 'Zara', text: 'Estou ficando boa nisso. Não sei se é um elogio.' },
      { type: 'narration', text: 'Ela espera o som dos passos desaparecer antes de sair do beco. O elevador para as Entre-Camadas fica a cinco quarteirões.' },
    ],
  },
  {
    id: 'a2000000-0000-0000-0000-000000000006',
    chapterId: ch1.id,
    title: 'Uma Voz Amiga',
    type: 'dialogue',
    nextSceneId: 'a2000000-0000-0000-0000-000000000007',
    content: [
      { type: 'narration', text: 'Zara respira fundo e sai das sombras. "Quem é você? O que quer?"' },
      { type: 'dialogue', speaker: 'Contato', text: 'Calma, engenheira. Ana me enviou. Sou amigo.' },
      { type: 'narration', text: 'O homem tira o capuz. Rosto marcado, olhos cansados, um corte novo na sobrancelha. Não é da OmniTech — o cheiro de cigarro sintético e a tatuagem de circuito no pescoço entregam: é das Entre-Camadas.' },
      { type: 'dialogue', speaker: 'Contato', text: 'Ana disse que você precisava de um anjo da guarda. Eu não sou anjo, mas sou barato. Toma.' },
      { type: 'narration', text: 'Ele entrega um pequeno dispositivo a Zara. Um disruptor de sinal modificado — muito melhor que o dela.' },
      { type: 'dialogue', speaker: 'Zara', text: 'Por que Ana não veio pessoalmente?' },
      { type: 'dialogue', speaker: 'Contato', text: 'Ela está preparando a clínica. E rastreando o seu data-shard. Você não é a única com um relógio correndo — ela tem até o fim do dia pra decriptar o primeiro fragmento antes que a OmniTech mude a criptografia.' },
      { type: 'narration', text: 'Zara guarda o disruptor. Ganhou um aliado — e uma corrida contra o tempo ainda mais apertada.' },
    ],
  },
  {
    id: 'a2000000-0000-0000-0000-000000000007',
    chapterId: ch1.id,
    title: 'Rumo às Entre-Camadas',
    type: 'narration',
    nextSceneId: null,
    content: [
      { type: 'narration', text: 'O elevador para as Entre-Camadas é uma estrutura de metal e vidro sujo, incrustada na lateral de um arranha-céu abandonado. Zara insere o cartão de acesso. A porta range, mas abre.' },
      { type: 'narration', text: 'Lá dentro, o cheiro é de ozônio e graxa velha. As paredes são cobertas de grafite digital — tags de gangues, anúncios de clínicas ilegais, poemas de anônimos que ninguém nunca vai ler.' },
      { type: 'narration', text: 'Zara aperta o botão. O elevador vibra e começa a subir. Pela janela suja, ela vê o Submundo se afastar: um tapete de neônio quebrado, chuva ácida e desespero.' },
      { type: 'thought', speaker: 'Zara', text: 'Eu nunca subi tão alto. Literalmente e figurativamente.' },
      { type: 'narration', text: 'O contador no canto da visão de Zara pulsa: 68:34:12. Sessenta e oito horas. Nas Entre-Camadas, Ana espera. E com ela, a primeira chance real de descobrir o que diabos a OmniTech está escondendo.' },
      { type: 'narration', text: 'As portas do elevador se fecham. O Submundo desaparece. E a escuridão da subida envolve Zara como um presságio.' },
    ],
  },
];

const ch1Choices: NeonFullChoice[] = [
  {
    id: 'a3000000-0000-0000-0000-000000000001',
    sceneId: 'a2000000-0000-0000-0000-000000000003',
    text: 'Enfrentar o perseguidor — "Chega de correr."',
    targetSceneId: 'a2000000-0000-0000-0000-000000000004',
    orderIndex: 0,
    isDefault: false,
    effects: [
      { variableName: 'heat_level', action: 'add', value: 1 },
      { variableName: 'humanity_index', action: 'add', value: -1 },
    ],
  },
  {
    id: 'a3000000-0000-0000-0000-000000000002',
    sceneId: 'a2000000-0000-0000-0000-000000000003',
    text: 'Se esconder no beco — "Não posso ser pega agora."',
    targetSceneId: 'a2000000-0000-0000-0000-000000000005',
    orderIndex: 1,
    isDefault: false,
  },
  {
    id: 'a3000000-0000-0000-0000-000000000003',
    sceneId: 'a2000000-0000-0000-0000-000000000003',
    text: 'Tentar dialogar — "Quem é você? O que quer?"',
    targetSceneId: 'a2000000-0000-0000-0000-000000000006',
    orderIndex: 2,
    isDefault: false,
    conditions: [{ variableName: 'humanity_index', operator: 'gte', value: 2 }],
    effects: [{ variableName: 'trust_ana', action: 'add', value: 1 }],
  },
];

// ── Chapter 2: "A Hacker e o Fantasma" (5 créditos) ──────────

const ch2: NeonSeedChapter = {
  id: 'a1000000-0000-0000-0000-000000000002',
  vnId: NEON_REFUGIO_VN_ID,
  title: 'A Hacker e o Fantasma',
  orderIndex: 1,
  status: 'published',
  priceCredits: 5,
  startSceneId: 'a2000000-0000-0000-0000-000000000008',
};

const ch2Scenes: NeonSeedScene[] = [
  {
    id: 'a2000000-0000-0000-0000-000000000008',
    chapterId: ch2.id,
    title: 'Entre-Camadas',
    type: 'narration',
    nextSceneId: 'a2000000-0000-0000-0000-000000000009',
    content: [
      { type: 'narration', text: 'As portas do elevador se abrem e Zara é engolida pelo caos organizado das Entre-Camadas.' },
      { type: 'narration', text: 'Não é o desespero cru do Submundo, nem a frieza estéril da Crista. As Entre-Camadas são uma zona franca — um mercado permanente onde tudo tem um preço e todos têm um ângulo. Barracas de comida sintética disputam espaço com lojas de implantes ilegais. Hologramas de anúncios flutuam sobre a multidão, prometendo "FELICIDADE EM 30 SEGUNDOS" e "NOVO VOCÊ POR 50 CRÉDITOS".' },
      { type: 'narration', text: 'O ar cheira a canela sintética e circuitos queimados. Um homem com olhos cibernéticos tenta vender a Zara um "mapa do futuro". Ela passa direto.' },
      { type: 'narration', text: 'As coordenadas de Ana levam a um beco atrás de uma loja de noodles. A porta é de aço, sem identificação. Zara bate três vezes, pausa, mais duas.' },
      { type: 'narration', text: 'A porta se abre.' },
    ],
  },
  {
    id: 'a2000000-0000-0000-0000-000000000009',
    chapterId: ch2.id,
    title: 'Reencontro',
    type: 'dialogue',
    nextSceneId: 'a2000000-0000-0000-0000-000000000010',
    content: [
      { type: 'dialogue', speaker: 'Ana', text: 'Zara. Entra. Rápido.' },
      { type: 'narration', text: 'Ana "Flicker" Chen é tudo que Zara lembrava: cabelo curto pintado de azul elétrico, olheiras de quem não dorme há três dias, e a energia nervosa de quem tem cafeína no lugar do sangue. O esconderijo é um amontoado de telas, servidores improvisados e cabos de fibra ótica.' },
      { type: 'dialogue', speaker: 'Zara', text: 'Você continua com a mesma cara de quem dormiu na mesa.' },
      { type: 'dialogue', speaker: 'Ana', text: 'E você continua com o mesmo talento pra arrumar encrenca. Senta aí.' },
      { type: 'narration', text: 'Ana gesticula para uma cadeira giratória. Zara se senta. Por um momento, as duas se olham em silêncio. Três anos desde que Ana pediu demissão da OmniTech. Três anos desde que Zara escolheu ficar.' },
      { type: 'dialogue', speaker: 'Ana', text: 'Eu saí porque vi pra onde a empresa estava indo. Você ficou porque achava que podia mudar de dentro. E agora aqui estamos: você com um kill-switch na nuca, eu com um servidor clandestino e uma conta bancária que não dura até o fim do mês.' },
      { type: 'dialogue', speaker: 'Zara', text: 'Belo resumo. Cadê o servidor?' },
      { type: 'dialogue', speaker: 'Ana', text: 'Impaciente como sempre. Tá ali atrás. Preparei o acesso ao Grid — mas Zara, preciso te avisar: o data-shard está fragmentado em três partes. A primeira está acessível. A segunda e a terceira têm ICE militar. Isso não vai ser um passeio no parque.' },
      { type: 'thought', speaker: 'Zara', text: 'ICE militar. Claro. Por que seria fácil?' },
      { type: 'dialogue', speaker: 'Zara', text: 'Me conecta.' },
    ],
  },
  {
    id: 'a2000000-0000-0000-0000-000000000010',
    chapterId: ch2.id,
    title: 'O Servidor',
    type: 'narration',
    nextSceneId: 'a2000000-0000-0000-0000-000000000011',
    content: [
      { type: 'narration', text: 'O servidor de Ana é uma colmeia de luzes e calor. Zara se conecta. O mundo físico desaparece.' },
      { type: 'narration', text: 'O Grid é um oceano de dados. Zara navega por correntes de informação como um peixe em águas familiares. A interface neural traduz pacotes de dados em sensações: o firewall da OmniTech é uma parede de gelo azul. O data-shard é um cristal fragmentado, pulsando com luz própria.' },
      { type: 'narration', text: 'Três fragmentos. O primeiro está ali, ao alcance. Os outros dois estão selados atrás de camadas de ICE — Intrusion Countermeasures Electronic. Segurança de nível militar. Se Zara tentar forçar, o sistema vai retaliar.' },
      { type: 'narration', text: 'Ela estende a mão virtual. O primeiro fragmento brilha em resposta.' },
    ],
  },
  {
    id: 'a2000000-0000-0000-0000-000000000011',
    chapterId: ch2.id,
    title: 'Dançando com o Gelo',
    type: 'choice',
    nextSceneId: null,
    content: [
      { type: 'narration', text: 'O primeiro fragmento está acessível, mas o segundo e o terceiro estão atrás de camadas de ICE. Ana está na retaguarda, monitorando os sinais vitais de Zara e a resposta do sistema da OmniTech.' },
      { type: 'dialogue', speaker: 'Ana', text: 'Zara, a abordagem importa. Se você for muito agressiva, o ICE vai retaliar — e a OmniTech vai saber exatamente onde estamos. Se for muito lenta, a criptografia muda em 4 horas e perdemos a janela.' },
      { type: 'narration', text: 'Zara avalia as opções. Cada uma tem seu preço.' },
    ],
  },
  {
    id: 'a2000000-0000-0000-0000-000000000012',
    chapterId: ch2.id,
    title: 'Solo Run',
    type: 'dialogue',
    nextSceneId: 'a2000000-0000-0000-0000-000000000015',
    content: [
      { type: 'narration', text: 'Zara mergulha no Grid. Ela conhece este sistema — ajudou a construí-lo. Cada linha de código, cada armadilha, cada backdoor. O ICE tenta envolvê-la, mas ela já dançou essa dança antes.' },
      { type: 'narration', text: 'Ela desvia das armadilhas como água contornando pedras. O fragmento responde ao seu toque. Dados começam a fluir.' },
      { type: 'dialogue', speaker: 'Ana', text: 'Conseguiu! O primeiro fragmento está decriptando... Zara, isso é... isso é enorme.' },
      { type: 'narration', text: 'Se heat_level >= 3: Um alarme silencioso dispara nos servidores da OmniTech. Eles sabem que alguém acessou o data-shard. Ainda não sabem quem — mas o cerco está se fechando.' },
      { type: 'narration', text: 'Imagens começam a se formar na mente de Zara. O Projeto Eco. Pessoas conectadas. Uma teia de mentes. A visão é bela e aterrorizante.' },
    ],
  },
  {
    id: 'a2000000-0000-0000-0000-000000000013',
    chapterId: ch2.id,
    title: 'Dupla Dinâmica',
    type: 'dialogue',
    nextSceneId: 'a2000000-0000-0000-0000-000000000015',
    content: [
      { type: 'narration', text: '"Você lidera, eu dou cobertura." Zara cede o controle primário a Ana.' },
      { type: 'narration', text: 'É como nos velhos tempos. Ana navega o ICE com a fluência de quem passa 18 horas por dia no Grid. Zara monitora as respostas do sistema, antecipando contra-ataques antes que aconteçam.' },
      { type: 'dialogue', speaker: 'Ana', text: 'Lembra do projeto Nexus? Quando a gente ficou 36 horas seguidas debugando o firmware?' },
      { type: 'dialogue', speaker: 'Zara', text: 'Lembro que você derrubou café no servidor principal e quase fomos demitidas.' },
      { type: 'dialogue', speaker: 'Ana', text: 'Bons tempos. — Pronto! Fragmento desbloqueado. E... nossa. Zara, você precisa ver isso.' },
      { type: 'narration', text: 'Os dados fluem mais rápido do que na rota solo. Ana encontrou atalhos que Zara não conhecia. O primeiro fragmento se abre como uma flor de dados, revelando não apenas o básico do Projeto Eco, mas também metadados — datas, locais, nomes.' },
      { type: 'narration', text: 'O nome "Kael" aparece nos registros. Ele assinou a autorização do projeto há oito meses.' },
      { type: 'thought', speaker: 'Zara', text: 'Kael sabia. O tempo todo.' },
    ],
  },
  {
    id: 'a2000000-0000-0000-0000-000000000014',
    chapterId: ch2.id,
    title: 'Força Bruta',
    type: 'narration',
    nextSceneId: 'a2000000-0000-0000-0000-000000000015',
    content: [
      { type: 'narration', text: 'Zara não tem paciência para sutilezas. Ela injeta um overclock no servidor de Ana, forçando o ICE a processar mais dados do que pode suportar. O firewall da OmniTech treme, racha — e cede.' },
      { type: 'narration', text: 'O fragmento se abre. Dados brutos fluem como uma enxurrada.' },
      { type: 'narration', text: 'Mas o overclock tem um preço. Alarmes disparam na OmniTech. Eles não só sabem que alguém acessou o data-shard — eles têm a localização aproximada. Agentes são despachados para as Entre-Camadas.' },
      { type: 'dialogue', speaker: 'Ana', text: 'Zara! Você ativou todos os alertas! Em 20 minutos este lugar vai estar cheio de segurança corporativa!' },
      { type: 'dialogue', speaker: 'Zara', text: 'Então é melhor a gente terminar rápido.' },
    ],
  },
  {
    id: 'a2000000-0000-0000-0000-000000000015',
    chapterId: ch2.id,
    title: 'O Primeiro Fragmento',
    type: 'narration',
    nextSceneId: null,
    content: [
      { type: 'narration', text: 'O primeiro fragmento se desdobra na mente de Zara como um origami de pesadelo.' },
      { type: 'narration', text: 'Ela vê. O Projeto Eco não é apenas um sistema de vigilância. É uma rede neural coletiva. Cada pessoa com um implante Nexus — e são 300 milhões — está involuntariamente conectada a uma mente coletiva artificial. Seus pensamentos, suas emoções, seus medos... todos são dados. Todos são combustível.' },
      { type: 'narration', text: 'A OmniTech não está apenas vigiando a população. Está usando a população como hardware.' },
      { type: 'thought', speaker: 'Zara', text: 'Isso não é vigilância. Isso é... parasitismo em escala planetária.' },
      { type: 'narration', text: 'Uma voz sintética ecoa no Grid, dirigindo-se diretamente a Zara. Não é uma gravação. É uma IA — a consciência do próprio Projeto Eco.' },
      { type: 'dialogue', speaker: 'PROJETO ECO (IA)', text: 'Bem-vinda de volta, Engenheira Oliveira. Você está atrasada para a reunião.' },
      { type: 'narration', text: 'Zara desconecta abruptamente. Sua mão treme. Ana a segura pelo ombro.' },
      { type: 'dialogue', speaker: 'Ana', text: 'Zara? O que foi? O que você viu?' },
      { type: 'narration', text: 'Zara não responde imediatamente. Ela olha para o contador em sua visão periférica. 48:00:00. Dois dias. Dois dias para impedir que 300 milhões de pessoas se tornem uma colmeia.' },
      { type: 'dialogue', speaker: 'Zara', text: 'Eu vi o futuro, Ana. E ele tem os olhos da OmniTech.' },
    ],
  },
];

const ch2Choices: NeonFullChoice[] = [
  {
    id: 'a3000000-0000-0000-0000-000000000004',
    sceneId: 'a2000000-0000-0000-0000-000000000011',
    text: 'Hackear sozinha — "Eu conheço esse sistema. Deixa comigo."',
    targetSceneId: 'a2000000-0000-0000-0000-000000000012',
    orderIndex: 0,
    isDefault: false,
  },
  {
    id: 'a3000000-0000-0000-0000-000000000005',
    sceneId: 'a2000000-0000-0000-0000-000000000011',
    text: 'Deixar Ana liderar — "Você é a melhor hacker que conheço."',
    targetSceneId: 'a2000000-0000-0000-0000-000000000013',
    orderIndex: 1,
    isDefault: false,
    effects: [{ variableName: 'trust_ana', action: 'add', value: 2 }],
  },
  {
    id: 'a3000000-0000-0000-0000-000000000006',
    sceneId: 'a2000000-0000-0000-0000-000000000011',
    text: 'Forçar acesso bruto — "Não temos tempo para sutilezas."',
    targetSceneId: 'a2000000-0000-0000-0000-000000000014',
    orderIndex: 2,
    isDefault: false,
    conditions: [{ variableName: 'credits', operator: 'gte', value: 20 }],
    effects: [
      { variableName: 'credits', action: 'add', value: -20 },
      { variableName: 'heat_level', action: 'add', value: 2 },
    ],
  },
];

// ── Chapter 3: "O Tênue Fio da Lei" (5 créditos) ────────────

const ch3: NeonSeedChapter = {
  id: 'a1000000-0000-0000-0000-000000000003',
  vnId: NEON_REFUGIO_VN_ID,
  title: 'O Tênue Fio da Lei',
  orderIndex: 2,
  status: 'published',
  priceCredits: 5,
  startSceneId: 'a2000000-0000-0000-0000-000000000016',
};

const ch3Scenes: NeonSeedScene[] = [
  {
    id: 'a2000000-0000-0000-0000-000000000016',
    chapterId: ch3.id,
    title: 'De Volta ao Submundo',
    type: 'narration',
    nextSceneId: 'a2000000-0000-0000-0000-000000000017',
    content: [
      { type: 'narration', text: 'Zara retorna ao Submundo com o peso do primeiro fragmento nos ombros — e na mente. O segundo fragmento, segundo Ana, está em um cofre físico da OmniTech. Não no Grid. No mundo real. Em um depósito de segurança no coração do Submundo.' },
      { type: 'narration', text: 'O calor está mais alto agora. Drones de reconhecimento cruzam o céu em padrões de busca. Reconhecimento facial. Rastreamento térmico. A OmniTech está procurando ativamente.' },
      { type: 'narration', text: 'O bar se chama "Névoa". É o tipo de lugar onde policiais corruptos vão para beber seu salário e esquecer que um dia acreditaram em justiça.' },
    ],
  },
  {
    id: 'a2000000-0000-0000-0000-000000000017',
    chapterId: ch3.id,
    title: 'O Tenente',
    type: 'dialogue',
    nextSceneId: 'a2000000-0000-0000-0000-000000000018',
    content: [
      { type: 'narration', text: 'O Tenente Marcos está no canto escuro do bar, curvado sobre um copo de uísque sintético. O uniforme está amassado. A barba por fazer. Mas os olhos — os olhos ainda são de um policial.' },
      { type: 'narration', text: 'trust_ana >= 2: Quando Zara se aproxima, ele não parece surpreso. "Ana me avisou que você viria. Senta."' },
      { type: 'narration', text: 'trust_ana < 2: Quando Zara se aproxima, a mão dele vai para a arma. "Engenheira Oliveira. Você tem coragem de aparecer aqui."' },
      { type: 'dialogue', speaker: 'Marcos', text: 'Eu sei quem você é. Sei o que você carrega. E sei que a OmniTech quer sua cabeça. A pergunta é: por que eu deveria me importar?' },
      { type: 'dialogue', speaker: 'Zara', text: 'Porque você ainda usa o uniforme. Ainda que amassado. Ainda que sujo. Alguma parte de você ainda acredita.' },
      { type: 'narration', text: 'Marcos encara Zara por um longo momento. Então, solta um suspiro que carrega vinte anos de frustração.' },
      { type: 'dialogue', speaker: 'Marcos', text: 'Maldita Ana. Sempre soube que ela ia me enfiar em alguma encrenca.' },
    ],
  },
  {
    id: 'a2000000-0000-0000-0000-000000000018',
    chapterId: ch3.id,
    title: 'O Acordo',
    type: 'choice',
    nextSceneId: null,
    content: [
      { type: 'narration', text: 'Marcos conhece o depósito da OmniTech. Trabalhou na segurança de lá por dois anos antes de ser transferido. Ele sabe as brechas, os horários de troca de turno, o ponto cego das câmeras.' },
      { type: 'dialogue', speaker: 'Marcos', text: 'Eu te ajudo a entrar. Mas quando isso acabar — se isso acabar — você limpa meu nome dos registros da OmniTech. Eu não quero morrer como um capacho corporativo.' },
      { type: 'narration', text: 'Zara pesa a proposta. Marcos é uma variável imprevisível — mas o depósito é impenetrável sem ajuda interna.' },
    ],
  },
  {
    id: 'a2000000-0000-0000-0000-000000000019',
    chapterId: ch3.id,
    title: 'Plano em Equipe',
    type: 'narration',
    nextSceneId: 'a2000000-0000-0000-0000-000000000022',
    content: [
      { type: 'narration', text: 'Marcos conhece cada centímetro do depósito. "As câmeras têm um ciclo de 12 segundos. Você precisa estar na porta de serviço nessa janela." Ele rabisca um mapa em um guardanapo. "O cofre está no subsolo. Código de acesso rotativo — mas eu ainda tenho o algoritmo."' },
      { type: 'narration', text: 'Zara observa o homem. Sob a camada de cinismo e uísque, existe um policial. Alguém que um dia se importou.' },
      { type: 'dialogue', speaker: 'Marcos', text: 'Por que você está fazendo isso? Sério. Você podia ter fugido. Destruído o data-shard. Ficado viva.' },
      { type: 'dialogue', speaker: 'Zara', text: 'Porque fugir não é viver. É só... adiar.' },
    ],
  },
  {
    id: 'a2000000-0000-0000-0000-000000000020',
    chapterId: ch3.id,
    title: 'Suborno Aceito',
    type: 'dialogue',
    nextSceneId: 'a2000000-0000-0000-0000-000000000022',
    content: [
      { type: 'narration', text: 'Zara transfere 30 créditos para a conta de Marcos. Ele olha o número, balança a cabeça, e guarda o terminal.' },
      { type: 'dialogue', speaker: 'Marcos', text: 'Isso cobre o risco. Não cobre a minha consciência. Mas acho que minha consciência já foi pro brejo faz tempo.' },
      { type: 'narration', text: 'Ele se levanta. "O depósito fecha em 2 horas. A gente vai pelo duto de ventilação. Você não vai gostar. Mas vai funcionar."' },
      { type: 'narration', text: 'O dinheiro comprou acesso. Não comprou confiança. Mas por enquanto, é suficiente.' },
    ],
  },
  {
    id: 'a2000000-0000-0000-0000-000000000021',
    chapterId: ch3.id,
    title: 'Invasão Solo',
    type: 'narration',
    nextSceneId: 'a2000000-0000-0000-0000-000000000022',
    content: [
      { type: 'narration', text: 'Zara recusa a oferta de Marcos. Confiança é um luxo que ela não pode se dar. Não depois de Kael.' },
      { type: 'narration', text: 'Ela estuda o depósito por conta própria. Duas horas de observação. Os padrões das câmeras. Os horários dos guardas. A vulnerabilidade no sistema de ventilação.' },
      { type: 'narration', text: 'É mais arriscado sozinha. Cada movimento precisa ser perfeito. Mas Zara sempre foi boa em perfeição.' },
      { type: 'thought', speaker: 'Zara', text: 'Se eu não posso confiar em ninguém, pelo menos só tenho a mim mesma para culpar se algo der errado.' },
    ],
  },
  {
    id: 'a2000000-0000-0000-0000-000000000022',
    chapterId: ch3.id,
    title: 'Dentro do Cofre',
    type: 'choice',
    nextSceneId: null,
    content: [
      { type: 'narration', text: 'O interior do cofre é gelado. Fileiras de dados físicos — servidores offline, backups criptografados, segredos que a OmniTech não confia ao Grid. O segundo fragmento está em um drive isolado, protegido por uma gaiola de Faraday.' },
      { type: 'narration', text: 'Zara conecta o drive ao seu implante. Os dados começam a fluir.' },
      { type: 'narration', text: 'Então, um holograma se acende no centro da sala. Kael.' },
      { type: 'dialogue', speaker: 'Kael (holograma)', text: 'Zara. Eu sabia que você chegaria aqui.' },
      { type: 'narration', text: 'A gravação é antiga — de antes da traição. Mas Kael programou o holograma para ser ativado quando o cofre fosse acessado. Ele sabia.' },
    ],
  },
  {
    id: 'a2000000-0000-0000-0000-000000000023',
    chapterId: ch3.id,
    title: 'As Palavras de Kael',
    type: 'dialogue',
    nextSceneId: null,
    content: [
      { type: 'dialogue', speaker: 'Kael (holograma)', text: 'Se você está vendo isso, significa que eu não consegui te proteger. Significa que o plano falhou.' },
      { type: 'dialogue', speaker: 'Kael (holograma)', text: 'Eu não te entreguei por ambição, Zara. A OmniTech já sabia de você. Uma semana antes da sua fuga. Eles iam te eliminar — silenciosamente, sem deixar vestígios. Eu me ofereci para ser o "informante". Em troca, eles me deram uma promoção... e acesso.' },
      { type: 'dialogue', speaker: 'Kael (holograma)', text: 'Acesso à localização do data-shard. Acesso ao cronograma de segurança. Todas as informações que passei para a Ana — fui eu. Não diretamente. Mas eu garanti que ela recebesse.' },
      { type: 'narration', text: 'Zara sente o chão se abrir sob seus pés.' },
      { type: 'dialogue', speaker: 'Kael (holograma)', text: 'Eu sei que você me odeia. Tem esse direito. Mas eu preferi ser o vilão da sua história a ser a pessoa que assistiu você morrer sem fazer nada.' },
      { type: 'dialogue', speaker: 'Kael (holograma)', text: 'No cofre, atrás do painel 7, tem um cartão de acesso. Elevador privado da Diretora Voss. Use-o quando estiver pronta para subir. E Zara... me desculpa.' },
      { type: 'narration', text: 'O holograma se desfaz. Zara fica em silêncio por um longo momento. O ódio ainda está lá. Mas agora, ele divide espaço com algo mais complicado.' },
      { type: 'thought', speaker: 'Zara', text: 'Você não tornou as coisas mais fáceis, Kael. Só mais... humanas.' },
    ],
  },
  {
    id: 'a2000000-0000-0000-0000-000000000024',
    chapterId: ch3.id,
    title: 'Silêncio',
    type: 'narration',
    nextSceneId: null,
    content: [
      { type: 'narration', text: 'Zara desliga o holograma antes que Kael possa terminar a primeira frase. Não há nada que ele possa dizer. Não há justificativa. Não há redenção.' },
      { type: 'narration', text: 'Ela pega o drive com o segundo fragmento e o cartão de acesso escondido no painel 7. Não olha para trás.' },
      { type: 'narration', text: 'O contador pulsa: 36:00:00. Trinta e seis horas. O segundo fragmento está seguro. Mas o terceiro — o último — está nos níveis superiores das Entre-Camadas.' },
      { type: 'thought', speaker: 'Zara', text: 'Eu não posso me dar ao luxo de sentir. Não agora. Sentir é um luxo para quem não tem um kill-switch na nuca.' },
      { type: 'narration', text: 'Mas no fundo, onde ela não admite nem para si mesma, o silêncio de Kael dói mais do que suas palavras jamais doeriam.' },
    ],
  },
];

const ch3Choices: NeonFullChoice[] = [
  {
    id: 'a3000000-0000-0000-0000-000000000007',
    sceneId: 'a2000000-0000-0000-0000-000000000018',
    text: 'Aceitar o acordo — "Fechado. Preciso de toda ajuda possível."',
    targetSceneId: 'a2000000-0000-0000-0000-000000000019',
    orderIndex: 0,
    isDefault: false,
    effects: [{ variableName: 'trust_ana', action: 'add', value: 1 }],
  },
  {
    id: 'a3000000-0000-0000-0000-000000000008',
    sceneId: 'a2000000-0000-0000-0000-000000000018',
    text: 'Negociar — "Me ajude primeiro, depois conversamos."',
    targetSceneId: 'a2000000-0000-0000-0000-000000000020',
    orderIndex: 1,
    isDefault: false,
    conditions: [{ variableName: 'humanity_index', operator: 'gte', value: 3 }],
    effects: [{ variableName: 'credits', action: 'add', value: -30 }],
  },
  {
    id: 'a3000000-0000-0000-0000-000000000009',
    sceneId: 'a2000000-0000-0000-0000-000000000018',
    text: 'Recusar — "Não confio em policiais."',
    targetSceneId: 'a2000000-0000-0000-0000-000000000021',
    orderIndex: 2,
    isDefault: false,
    effects: [{ variableName: 'humanity_index', action: 'add', value: -1 }],
  },
  {
    id: 'a3000000-0000-0000-0000-000000000010',
    sceneId: 'a2000000-0000-0000-0000-000000000022',
    text: 'Ouvir o que Kael tem a dizer.',
    targetSceneId: 'a2000000-0000-0000-0000-000000000023',
    orderIndex: 0,
    isDefault: false,
  },
  {
    id: 'a3000000-0000-0000-0000-000000000011',
    sceneId: 'a2000000-0000-0000-0000-000000000022',
    text: 'Ignorar Kael e pegar o fragmento.',
    targetSceneId: 'a2000000-0000-0000-0000-000000000024',
    orderIndex: 1,
    isDefault: false,
    effects: [{ variableName: 'humanity_index', action: 'add', value: -1 }],
  },
];

// ── Combined seed data ──────────────────────────────────────

export const neonRefugioChapters: NeonSeedChapter[] = [ch1, ch2, ch3];
export const neonRefugioScenes: NeonSeedScene[] = [...ch1Scenes, ...ch2Scenes, ...ch3Scenes];
export const neonRefugioChoices: NeonFullChoice[] = [...ch1Choices, ...ch2Choices, ...ch3Choices];

// ── Seed function ───────────────────────────────────────────

export async function seedNeonRefugio(
  pool: Pool,
  // resolveId é reservado para uso futuro (seeds com emails dinâmicos).
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _resolveId: (email: string) => string,
): Promise<void> {
  const db = drizzle(pool, { schema });

  console.log('\n🎮 Inserindo NEON REFÚGIO (capítulos/cenas/escolhas)...');

  // 1. Chapters
  let chaptersCreated = 0;
  for (const ch of neonRefugioChapters) {
    const existing = await db.select({ id: schema.chapters.id }).from(schema.chapters).where(eq(schema.chapters.id, ch.id)).limit(1);
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
  console.log(`   ✅ ${chaptersCreated} capítulos criados (${neonRefugioChapters.length} no total)`);

  // 2. Scenes
  let scenesCreated = 0;
  for (const sc of neonRefugioScenes) {
    const existing = await db.select({ id: schema.scenes.id }).from(schema.scenes).where(eq(schema.scenes.id, sc.id)).limit(1);
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
  console.log(`   ✅ ${scenesCreated} cenas criadas (${neonRefugioScenes.length} no total)`);

  // 3. Choices
  let choicesCreated = 0;
  for (const ch of neonRefugioChoices) {
    const existing = await db.select({ id: schema.choices.id }).from(schema.choices).where(eq(schema.choices.id, ch.id)).limit(1);
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

      // Insert conditions
      if (ch.conditions) {
        for (const cond of ch.conditions) {
          await db.insert(schema.choiceConditions).values({
            choiceId: ch.id,
            variableName: cond.variableName,
            operator: cond.operator,
            value: cond.value as any,
          });
        }
      }

      // Insert effects
      if (ch.effects) {
        for (const eff of ch.effects) {
          await db.insert(schema.choiceEffects).values({
            choiceId: ch.id,
            variableName: eff.variableName,
            action: eff.action,
            value: eff.value as any,
          });
        }
      }
    }
  }
  console.log(`   ✅ ${choicesCreated} escolhas criadas (com condições e efeitos) (${neonRefugioChoices.length} no total)`);

  console.log('   💡 NEON REFÚGIO agora tem 3 capítulos jogáveis (Caps 1-3, 23 cenas, 11 escolhas)');
}

// ── Standalone execution ────────────────────────────────────

// Allow direct execution: tsx src/db/neon-refugio-seed.ts
if (import.meta.url === `file://${process.argv[1]}`) {
  const standalonePool = new Pool({
    connectionString: process.env.DATABASE_URL ?? 'postgresql://postgres:password@localhost:5432/zan_vn',
  });
  seedNeonRefugio(standalonePool, (_email) => {
    throw new Error(`Cannot resolve email in standalone mode. Run via main seed first.`);
  })
    .then(() => standalonePool.end())
    .catch((err) => {
      console.error('❌ Erro:', err);
      process.exit(1);
    });
}
