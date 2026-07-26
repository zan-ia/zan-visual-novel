/**
 * NEON REFÚGIO — Seed Data
 *
 * História completa para Zan Visual Novel.
 * Importe e execute `seedNeonRefugio(db)` a partir do seed principal
 * ou execute standalone com: tsx neon-refugio-seed.ts
 *
 * Senha de todos os usuários: Teste123!
 */

import type { NeonDb } from './types.js';

// ── Chapter 1: "72 Horas" ──────────────────────────────────

export const chapter1 = {
  id: 'a1000000-0000-0000-0000-000000000001',
  vnId: 'a0000000-0000-0000-0000-000000000001',
  title: '72 Horas',
  orderIndex: 0,
  status: 'published' as const,
  priceCredits: 0,
  startSceneId: 'a2000000-0000-0000-0000-000000000001',
  scenes: [
    {
      id: 'a2000000-0000-0000-0000-000000000001',
      title: 'O Despertar',
      type: 'narration' as const,
      nextSceneId: 'a2000000-0000-0000-0000-000000000002',
      assets: [
        { assetKey: 'bg_submundo_apartamento', role: 'background' as const },
        { assetKey: 'bgm_submundo', role: 'music' as const },
        { assetKey: 'sfx_chuva_acida', role: 'sfx' as const },
      ],
      content: [
        {
          type: 'narration',
          text: 'O som da chuva ácida contra a janela de metal é a primeira coisa que Zara ouve. Depois, a dor.',
        },
        {
          type: 'narration',
          text: 'Uma pulsação surda atrás dos olhos — o implante Nexus cobrando seu preço. Ela abre os olhos devagar. O teto do apartamento está manchado de umidade. Uma infiltração que ela nunca teve dinheiro para consertar.',
        },
        {
          type: 'thought',
          speaker: 'Zara',
          text: 'Ainda estou viva. Isso já é alguma coisa.',
        },
        {
          type: 'narration',
          text: 'Ela se senta na cama. O apartamento está revirado — gavetas abertas, o terminal de dados no chão, a cadeira quebrada. A OmniTech já passou por aqui. Não encontraram o que queriam.',
        },
        {
          type: 'narration',
          text: 'Zara leva a mão à nuca, onde o implante se conecta à espinha. Um número pulsa em sua visão periférica, projetado diretamente na retina pelo Nexus.',
        },
        {
          type: 'narration',
          text: '72:00:00.\n71:59:59.\n71:59:58.',
        },
        {
          type: 'thought',
          speaker: 'Zara',
          text: 'Setenta e duas horas. O kill-switch já está contando.',
        },
        {
          type: 'narration',
          text: 'O terminal caído no chão emite um brilho fraco. Uma mensagem não lida pisca no canto da tela quebrada. Remetente: "A". Assunto: "A clínica ainda está de pé."',
        },
        {
          type: 'thought',
          speaker: 'Zara',
          text: 'Ana. Claro que seria você.',
        },
        {
          type: 'narration',
          text: 'Zara se levanta, veste a jaqueta com capuz — surrada, mas quente — e enfia o disruptor de sinal no bolso. Lá fora, a chuva ácida cai sobre o Submundo como lágrimas de uma cidade que nunca aprendeu a chorar.',
        },
      ],
    },
    {
      id: 'a2000000-0000-0000-0000-000000000002',
      title: 'Mensagem na Chuva',
      type: 'dialogue' as const,
      nextSceneId: 'a2000000-0000-0000-0000-000000000003',
      assets: [
        { assetKey: 'bg_submundo_rua', role: 'background' as const },
        { assetKey: 'sprite_zara', role: 'sprite' as const },
        { assetKey: 'sfx_chuva_acida', role: 'sfx' as const },
      ],
      content: [
        {
          type: 'narration',
          text: 'As ruas do Submundo são um organismo vivo. Drones de vigilância zumbem entre os prédios como libélulas metálicas. O neônio quebrado dos letreiros pisca em cores que não existiam há cem anos. A chuva ácida transforma o asfalto em um espelho distorcido.',
        },
        {
          type: 'narration',
          text: 'Zara caminha com o capuz baixo, o rosto escondido. Cada drone que passa é um alerta. Cada sombra pode ser um agente.',
        },
        {
          type: 'dialogue',
          speaker: 'Ana (via texto)',
          text: 'Você está viva. Graças ao Grid. Achei que a OmniTech tinha te pegado.',
        },
        {
          type: 'dialogue',
          speaker: 'Zara (via texto)',
          text: 'Quase pegaram. O apartamento está revirado. O que você sabe?',
        },
        {
          type: 'dialogue',
          speaker: 'Ana (via texto)',
          text: 'Sei que o Kael te entregou. E sei que você tem 72 horas antes do seu implante fritar seu cérebro. Preciso que você chegue nas Entre-Camadas. Minha clínica. Rua 7, nível 4.',
        },
        {
          type: 'thought',
          speaker: 'Zara',
          text: 'Kael. O nome dói mais do que o implante.',
        },
        {
          type: 'dialogue',
          speaker: 'Zara (via texto)',
          text: 'Por que está me ajudando? Você saiu da OmniTech antes de mim. Podia ter ficado fora disso.',
        },
        {
          type: 'dialogue',
          speaker: 'Ana (via texto)',
          text: 'Porque eu sei o que você descobriu, Zara. E o mundo precisa saber também. Agora pare de digitar e comece a andar. O elevador para as Entre-Camadas fecha em 20 minutos.',
        },
        {
          type: 'narration',
          text: 'Zara guarda o terminal. A mensagem de Ana é um fio de esperança em um novelo de desespero. Mas antes que ela possa dar o próximo passo, uma sombra se move no beco à sua direita.',
        },
        {
          type: 'narration',
          text: 'Não é um drone. É humano. E está seguindo ela.',
        },
      ],
    },
    {
      id: 'a2000000-0000-0000-0000-000000000003',
      title: 'Encontro com a Sombra',
      type: 'choice' as const,
      nextSceneId: null,
      assets: [
        { assetKey: 'bg_submundo_rua', role: 'background' as const },
        { assetKey: 'sprite_zara', role: 'sprite' as const },
      ],
      content: [
        {
          type: 'narration',
          text: 'O vulto no beco não se move como um civil. Passos calculados. Postura treinada. Zara reconhece o padrão — segurança corporativa de baixo escalão. Mas por que só um?',
        },
        {
          type: 'thought',
          speaker: 'Zara',
          text: 'Se fosse uma emboscada, já teriam me cercado. Ele está sozinho. Ou é um batedor... ou não é da OmniTech.',
        },
        {
          type: 'narration',
          text: 'A chuva ácida escorre pelo capuz de Zara. Ela tem segundos para decidir.',
        },
      ],
      choices: [
        {
          id: 'a3000000-0000-0000-0000-000000000001',
          text: 'Enfrentar o perseguidor — "Chega de correr."',
          targetSceneId: 'a2000000-0000-0000-0000-000000000004',
          orderIndex: 0,
          effects: [
            { variableName: 'heat_level', action: 'add', value: 1 },
            { variableName: 'humanity_index', action: 'add', value: -1 },
          ],
        },
        {
          id: 'a3000000-0000-0000-0000-000000000002',
          text: 'Se esconder no beco — "Não posso ser pega agora."',
          targetSceneId: 'a2000000-0000-0000-0000-000000000005',
          orderIndex: 1,
          effects: [],
        },
        {
          id: 'a3000000-0000-0000-0000-000000000003',
          text: 'Tentar dialogar — "Quem é você? O que quer?"',
          targetSceneId: 'a2000000-0000-0000-0000-000000000006',
          orderIndex: 2,
          conditions: [{ variableName: 'humanity_index', operator: 'gte', value: 2 }],
          effects: [{ variableName: 'trust_ana', action: 'add', value: 1 }],
        },
      ],
    },
    {
      id: 'a2000000-0000-0000-0000-000000000004',
      title: 'Confronto no Beco',
      type: 'dialogue' as const,
      nextSceneId: 'a2000000-0000-0000-0000-000000000007',
      assets: [
        { assetKey: 'bg_submundo_rua', role: 'background' as const },
        { assetKey: 'sprite_zara', role: 'sprite' as const },
      ],
      content: [
        {
          type: 'narration',
          text: 'Zara não espera. Ela avança — três passos rápidos, um golpe na garganta, joelho no estômago. O homem cambaleia. Não é um agente de elite. É um mercenário de quinta categoria, daqueles que a OmniTech contrata às dúzias.',
        },
        {
          type: 'dialogue',
          speaker: 'Mercenário',
          text: 'Espera! Espera! Eu só... eu só estou seguindo ordens!',
        },
        {
          type: 'dialogue',
          speaker: 'Zara',
          text: 'Ordens de quem?',
        },
        {
          type: 'dialogue',
          speaker: 'Mercenário',
          text: 'Da OmniTech! Mas não é o que você pensa! Eles só querem o data-shard. Me pagaram pra te encontrar, não pra te matar!',
        },
        {
          type: 'thought',
          speaker: 'Zara',
          text: 'Interessante. A OmniTech não quer meu cadáver — quer o que eu carrego. Isso significa que eles têm medo do que eu sei.',
        },
        {
          type: 'narration',
          text: 'Zara pega o cartão de acesso do mercenário. Nível baixo, mas pode ser útil. Ela o deixa inconsciente no beco. A chuva lava o sangue dos nós dos dedos.',
        },
        {
          type: 'narration',
          text: 'O confronto chamou atenção. Drones se aproximam. É melhor sair daqui — rápido.',
        },
      ],
    },
    {
      id: 'a2000000-0000-0000-0000-000000000005',
      title: 'Nas Sombras',
      type: 'narration' as const,
      nextSceneId: 'a2000000-0000-0000-0000-000000000007',
      assets: [
        { assetKey: 'bg_submundo_rua', role: 'background' as const },
        { assetKey: 'sprite_zara', role: 'sprite' as const },
      ],
      content: [
        {
          type: 'narration',
          text: 'Zara se funde com a escuridão do beco. Anos vivendo no Submundo ensinaram uma coisa: as sombras são mais confiáveis que as pessoas.',
        },
        {
          type: 'narration',
          text: 'O vulto passa direto. Ele para, olha ao redor, coça a cabeça e segue em frente. Um mercenário mal pago, seguindo um rastreador barato. Nada que Zara não pudesse evitar.',
        },
        {
          type: 'thought',
          speaker: 'Zara',
          text: 'Estou ficando boa nisso. Não sei se é um elogio.',
        },
        {
          type: 'narration',
          text: 'Ela espera o som dos passos desaparecer antes de sair do beco. O elevador para as Entre-Camadas fica a cinco quarteirões.',
        },
      ],
    },
    {
      id: 'a2000000-0000-0000-0000-000000000006',
      title: 'Uma Voz Amiga',
      type: 'dialogue' as const,
      nextSceneId: 'a2000000-0000-0000-0000-000000000007',
      assets: [
        { assetKey: 'bg_submundo_rua', role: 'background' as const },
        { assetKey: 'sprite_zara', role: 'sprite' as const },
      ],
      content: [
        {
          type: 'narration',
          text: 'Zara respira fundo e sai das sombras. "Quem é você? O que quer?"',
        },
        {
          type: 'dialogue',
          speaker: 'Contato',
          text: 'Calma, engenheira. Ana me enviou. Sou amigo.',
        },
        {
          type: 'narration',
          text: 'O homem tira o capuz. Rosto marcado, olhos cansados, um corte novo na sobrancelha. Não é da OmniTech — o cheiro de cigarro sintético e a tatuagem de circuito no pescoço entregam: é das Entre-Camadas.',
        },
        {
          type: 'dialogue',
          speaker: 'Contato',
          text: 'Ana disse que você precisava de um anjo da guarda. Eu não sou anjo, mas sou barato. Toma.',
        },
        {
          type: 'narration',
          text: 'Ele entrega um pequeno dispositivo a Zara. Um disruptor de sinal modificado — muito melhor que o dela.',
        },
        {
          type: 'dialogue',
          speaker: 'Zara',
          text: 'Por que Ana não veio pessoalmente?',
        },
        {
          type: 'dialogue',
          speaker: 'Contato',
          text: 'Ela está preparando a clínica. E rastreando o seu data-shard. Você não é a única com um relógio correndo — ela tem até o fim do dia pra decriptar o primeiro fragmento antes que a OmniTech mude a criptografia.',
        },
        {
          type: 'narration',
          text: 'Zara guarda o disruptor. Ganhou um aliado — e uma corrida contra o tempo ainda mais apertada.',
        },
      ],
    },
    {
      id: 'a2000000-0000-0000-0000-000000000007',
      title: 'Rumo às Entre-Camadas',
      type: 'narration' as const,
      nextSceneId: null,
      assets: [
        { assetKey: 'bg_submundo_rua', role: 'background' as const },
        { assetKey: 'sprite_zara', role: 'sprite' as const },
        { assetKey: 'sfx_drone_pass', role: 'sfx' as const },
      ],
      content: [
        {
          type: 'narration',
          text: 'O elevador para as Entre-Camadas é uma estrutura de metal e vidro sujo, incrustada na lateral de um arranha-céu abandonado. Zara insere o cartão de acesso. A porta range, mas abre.',
        },
        {
          type: 'narration',
          text: 'Lá dentro, o cheiro é de ozônio e graxa velha. As paredes são cobertas de grafite digital — tags de gangues, anúncios de clínicas ilegais, poemas de anônimos que ninguém nunca vai ler.',
        },
        {
          type: 'narration',
          text: 'Zara aperta o botão. O elevador vibra e começa a subir. Pela janela suja, ela vê o Submundo se afastar: um tapete de neônio quebrado, chuva ácida e desespero.',
        },
        {
          type: 'thought',
          speaker: 'Zara',
          text: 'Eu nunca subi tão alto. Literalmente e figurativamente.',
        },
        {
          type: 'narration',
          text: 'O contador no canto da visão de Zara pulsa: 68:34:12. Sessenta e oito horas. Nas Entre-Camadas, Ana espera. E com ela, a primeira chance real de descobrir o que diabos a OmniTech está escondendo.',
        },
        {
          type: 'narration',
          text: 'As portas do elevador se fecham. O Submundo desaparece. E a escuridão da subida envolve Zara como um presságio.',
        },
      ],
    },
  ],
};

// ── Chapter 2: "A Hacker e o Fantasma" ──────────────────────

export const chapter2 = {
  id: 'a1000000-0000-0000-0000-000000000002',
  vnId: 'a0000000-0000-0000-0000-000000000001',
  title: 'A Hacker e o Fantasma',
  orderIndex: 1,
  status: 'published' as const,
  priceCredits: 5,
  startSceneId: 'a2000000-0000-0000-0000-000000000008',
  scenes: [
    {
      id: 'a2000000-0000-0000-0000-000000000008',
      title: 'Entre-Camadas',
      type: 'narration' as const,
      nextSceneId: 'a2000000-0000-0000-0000-000000000009',
      assets: [
        { assetKey: 'bg_entre_camadas_mercado', role: 'background' as const },
        { assetKey: 'bgm_entre_camadas', role: 'music' as const },
      ],
      content: [
        {
          type: 'narration',
          text: 'As portas do elevador se abrem e Zara é engolida pelo caos organizado das Entre-Camadas.',
        },
        {
          type: 'narration',
          text: 'Não é o desespero cru do Submundo, nem a frieza estéril da Crista. As Entre-Camadas são uma zona franca — um mercado permanente onde tudo tem um preço e todos têm um ângulo. Barracas de comida sintética disputam espaço com lojas de implantes ilegais. Hologramas de anúncios flutuam sobre a multidão, prometendo "FELICIDADE EM 30 SEGUNDOS" e "NOVO VOCÊ POR 50 CRÉDITOS".',
        },
        {
          type: 'narration',
          text: 'O ar cheira a canela sintética e circuitos queimados. Um homem com olhos cibernéticos tenta vender a Zara um "mapa do futuro". Ela passa direto.',
        },
        {
          type: 'narration',
          text: 'As coordenadas de Ana levam a um beco atrás de uma loja de noodles. A porta é de aço, sem identificação. Zara bate três vezes, pausa, mais duas.',
        },
        {
          type: 'narration',
          text: 'A porta se abre.',
        },
      ],
    },
    {
      id: 'a2000000-0000-0000-0000-000000000009',
      title: 'Reencontro',
      type: 'dialogue' as const,
      nextSceneId: 'a2000000-0000-0000-0000-000000000010',
      assets: [
        { assetKey: 'bg_entre_camadas_mercado', role: 'background' as const },
        { assetKey: 'sprite_zara', role: 'sprite' as const },
        { assetKey: 'sprite_ana', role: 'sprite' as const },
      ],
      content: [
        {
          type: 'dialogue',
          speaker: 'Ana',
          text: 'Zara. Entra. Rápido.',
        },
        {
          type: 'narration',
          text: 'Ana "Flicker" Chen é tudo que Zara lembrava: cabelo curto pintado de azul elétrico, olheiras de quem não dorme há três dias, e a energia nervosa de quem tem cafeína no lugar do sangue. O esconderijo é um amontoado de telas, servidores improvisados e cabos de fibra ótica.',
        },
        {
          type: 'dialogue',
          speaker: 'Zara',
          text: 'Você continua com a mesma cara de quem dormiu na mesa.',
        },
        {
          type: 'dialogue',
          speaker: 'Ana',
          text: 'E você continua com o mesmo talento pra arrumar encrenca. Senta aí.',
        },
        {
          type: 'narration',
          text: 'Ana gesticula para uma cadeira giratória. Zara se senta. Por um momento, as duas se olham em silêncio. Três anos desde que Ana pediu demissão da OmniTech. Três anos desde que Zara escolheu ficar.',
        },
        {
          type: 'dialogue',
          speaker: 'Ana',
          text: 'Eu saí porque vi pra onde a empresa estava indo. Você ficou porque achava que podia mudar de dentro. E agora aqui estamos: você com um kill-switch na nuca, eu com um servidor clandestino e uma conta bancária que não dura até o fim do mês.',
        },
        {
          type: 'dialogue',
          speaker: 'Zara',
          text: 'Belo resumo. Cadê o servidor?',
        },
        {
          type: 'dialogue',
          speaker: 'Ana',
          text: 'Impaciente como sempre. Tá ali atrás. Preparei o acesso ao Grid — mas Zara, preciso te avisar: o data-shard está fragmentado em três partes. A primeira está acessível. A segunda e a terceira têm ICE militar. Isso não vai ser um passeio no parque.',
        },
        {
          type: 'thought',
          speaker: 'Zara',
          text: 'ICE militar. Claro. Por que seria fácil?',
        },
        {
          type: 'dialogue',
          speaker: 'Zara',
          text: 'Me conecta.',
        },
      ],
    },
    {
      id: 'a2000000-0000-0000-0000-000000000010',
      title: 'O Servidor',
      type: 'narration' as const,
      nextSceneId: 'a2000000-0000-0000-0000-000000000011',
      assets: [
        { assetKey: 'bg_entre_camadas_servidor', role: 'background' as const },
        { assetKey: 'sfx_neural_connect', role: 'sfx' as const },
      ],
      content: [
        {
          type: 'narration',
          text: 'O servidor de Ana é uma colmeia de luzes e calor. Zara se conecta. O mundo físico desaparece.',
        },
        {
          type: 'narration',
          text: 'O Grid é um oceano de dados. Zara navega por correntes de informação como um peixe em águas familiares. A interface neural traduz pacotes de dados em sensações: o firewall da OmniTech é uma parede de gelo azul. O data-shard é um cristal fragmentado, pulsando com luz própria.',
        },
        {
          type: 'narration',
          text: 'Três fragmentos. O primeiro está ali, ao alcance. Os outros dois estão selados atrás de camadas de ICE — Intrusion Countermeasures Electronic. Segurança de nível militar. Se Zara tentar forçar, o sistema vai retaliar.',
        },
        {
          type: 'narration',
          text: 'Ela estende a mão virtual. O primeiro fragmento brilha em resposta.',
        },
      ],
    },
    {
      id: 'a2000000-0000-0000-0000-000000000011',
      title: 'Dançando com o Gelo',
      type: 'choice' as const,
      nextSceneId: null,
      assets: [
        { assetKey: 'bg_entre_camadas_servidor', role: 'background' as const },
        { assetKey: 'sprite_zara', role: 'sprite' as const },
        { assetKey: 'sprite_ana', role: 'sprite' as const },
        { assetKey: 'sfx_neural_connect', role: 'sfx' as const },
      ],
      content: [
        {
          type: 'narration',
          text: 'O primeiro fragmento está acessível, mas o segundo e o terceiro estão atrás de camadas de ICE. Ana está na retaguarda, monitorando os sinais vitais de Zara e a resposta do sistema da OmniTech.',
        },
        {
          type: 'dialogue',
          speaker: 'Ana',
          text: 'Zara, a abordagem importa. Se você for muito agressiva, o ICE vai retaliar — e a OmniTech vai saber exatamente onde estamos. Se for muito lenta, a criptografia muda em 4 horas e perdemos a janela.',
        },
        {
          type: 'narration',
          text: 'Zara avalia as opções. Cada uma tem seu preço.',
        },
      ],
      choices: [
        {
          id: 'a3000000-0000-0000-0000-000000000004',
          text: 'Hackear sozinha — "Eu conheço esse sistema. Deixa comigo."',
          targetSceneId: 'a2000000-0000-0000-0000-000000000012',
          orderIndex: 0,
          conditions: [],
          effects: [
            { variableName: 'heat_level', action: 'add', value: 1 },
            {
              variableName: 'heat_level',
              action: 'add',
              value: 1,
              condition: { variableName: 'heat_level', operator: 'gte', value: 3 },
            },
          ],
        },
        {
          id: 'a3000000-0000-0000-0000-000000000005',
          text: 'Deixar Ana liderar — "Você é a melhor hacker que conheço."',
          targetSceneId: 'a2000000-0000-0000-0000-000000000013',
          orderIndex: 1,
          effects: [{ variableName: 'trust_ana', action: 'add', value: 2 }],
        },
        {
          id: 'a3000000-0000-0000-0000-000000000006',
          text: 'Forçar acesso bruto — "Não temos tempo para sutilezas."',
          targetSceneId: 'a2000000-0000-0000-0000-000000000014',
          orderIndex: 2,
          conditions: [{ variableName: 'credits', operator: 'gte', value: 20 }],
          effects: [
            { variableName: 'credits', action: 'add', value: -20 },
            { variableName: 'heat_level', action: 'add', value: 2 },
          ],
        },
      ],
    },
    {
      id: 'a2000000-0000-0000-0000-000000000012',
      title: 'Solo Run',
      type: 'dialogue' as const,
      nextSceneId: 'a2000000-0000-0000-0000-000000000015',
      assets: [
        { assetKey: 'bg_entre_camadas_servidor', role: 'background' as const },
        { assetKey: 'sprite_zara', role: 'sprite' as const },
        { assetKey: 'sfx_hack_success', role: 'sfx' as const },
        { assetKey: 'sfx_ice_alert', role: 'sfx' as const },
      ],
      content: [
        {
          type: 'narration',
          text: 'Zara mergulha no Grid. Ela conhece este sistema — ajudou a construí-lo. Cada linha de código, cada armadilha, cada backdoor. O ICE tenta envolvê-la, mas ela já dançou essa dança antes.',
        },
        {
          type: 'narration',
          text: 'Ela desvia das armadilhas como água contornando pedras. O fragmento responde ao seu toque. Dados começam a fluir.',
        },
        {
          type: 'dialogue',
          speaker: 'Ana',
          text: 'Conseguiu! O primeiro fragmento está decriptando... Zara, isso é... isso é enorme.',
        },
        {
          type: 'narration',
          text: 'Se heat_level >= 3: Um alarme silencioso dispara nos servidores da OmniTech. Eles sabem que alguém acessou o data-shard. Ainda não sabem quem — mas o cerco está se fechando.',
        },
        {
          type: 'narration',
          text: 'Imagens começam a se formar na mente de Zara. O Projeto Eco. Pessoas conectadas. Uma teia de mentes. A visão é bela e aterrorizante.',
        },
      ],
    },
    {
      id: 'a2000000-0000-0000-0000-000000000013',
      title: 'Dupla Dinâmica',
      type: 'dialogue' as const,
      nextSceneId: 'a2000000-0000-0000-0000-000000000015',
      assets: [
        { assetKey: 'bg_entre_camadas_servidor', role: 'background' as const },
        { assetKey: 'sprite_zara', role: 'sprite' as const },
        { assetKey: 'sprite_ana', role: 'sprite' as const },
        { assetKey: 'sfx_hack_success', role: 'sfx' as const },
      ],
      content: [
        {
          type: 'narration',
          text: '"Você lidera, eu dou cobertura." Zara cede o controle primário a Ana.',
        },
        {
          type: 'narration',
          text: 'É como nos velhos tempos. Ana navega o ICE com a fluência de quem passa 18 horas por dia no Grid. Zara monitora as respostas do sistema, antecipando contra-ataques antes que aconteçam.',
        },
        {
          type: 'dialogue',
          speaker: 'Ana',
          text: 'Lembra do projeto Nexus? Quando a gente ficou 36 horas seguidas debugando o firmware?',
        },
        {
          type: 'dialogue',
          speaker: 'Zara',
          text: 'Lembro que você derrubou café no servidor principal e quase fomos demitidas.',
        },
        {
          type: 'dialogue',
          speaker: 'Ana',
          text: 'Bons tempos. — Pronto! Fragmento desbloqueado. E... nossa. Zara, você precisa ver isso.',
        },
        {
          type: 'narration',
          text: 'Os dados fluem mais rápido do que na rota solo. Ana encontrou atalhos que Zara não conhecia. O primeiro fragmento se abre como uma flor de dados, revelando não apenas o básico do Projeto Eco, mas também metadados — datas, locais, nomes.',
        },
        {
          type: 'narration',
          text: 'O nome "Kael" aparece nos registros. Ele assinou a autorização do projeto há oito meses.',
        },
        {
          type: 'thought',
          speaker: 'Zara',
          text: 'Kael sabia. O tempo todo.',
        },
      ],
    },
    {
      id: 'a2000000-0000-0000-0000-000000000014',
      title: 'Força Bruta',
      type: 'narration' as const,
      nextSceneId: 'a2000000-0000-0000-0000-000000000015',
      assets: [
        { assetKey: 'bg_entre_camadas_servidor', role: 'background' as const },
        { assetKey: 'sfx_ice_alert', role: 'sfx' as const },
      ],
      content: [
        {
          type: 'narration',
          text: 'Zara não tem paciência para sutilezas. Ela injeta um overclock no servidor de Ana, forçando o ICE a processar mais dados do que pode suportar. O firewall da OmniTech treme, racha — e cede.',
        },
        {
          type: 'narration',
          text: 'O fragmento se abre. Dados brutos fluem como uma enxurrada.',
        },
        {
          type: 'narration',
          text: 'Mas o overclock tem um preço. Alarmes disparam na OmniTech. Eles não só sabem que alguém acessou o data-shard — eles têm a localização aproximada. Agentes são despachados para as Entre-Camadas.',
        },
        {
          type: 'dialogue',
          speaker: 'Ana',
          text: 'Zara! Você ativou todos os alertas! Em 20 minutos este lugar vai estar cheio de segurança corporativa!',
        },
        {
          type: 'dialogue',
          speaker: 'Zara',
          text: 'Então é melhor a gente terminar rápido.',
        },
      ],
    },
    {
      id: 'a2000000-0000-0000-0000-000000000015',
      title: 'O Primeiro Fragmento',
      type: 'narration' as const,
      nextSceneId: null,
      assets: [
        { assetKey: 'bg_entre_camadas_servidor', role: 'background' as const },
        { assetKey: 'sprite_zara', role: 'sprite' as const },
        { assetKey: 'sfx_neural_connect', role: 'sfx' as const },
      ],
      content: [
        {
          type: 'narration',
          text: 'O primeiro fragmento se desdobra na mente de Zara como um origami de pesadelo.',
        },
        {
          type: 'narration',
          text: 'Ela vê. O Projeto Eco não é apenas um sistema de vigilância. É uma rede neural coletiva. Cada pessoa com um implante Nexus — e são 300 milhões — está involuntariamente conectada a uma mente coletiva artificial. Seus pensamentos, suas emoções, seus medos... todos são dados. Todos são combustível.',
        },
        {
          type: 'narration',
          text: 'A OmniTech não está apenas vigiando a população. Está usando a população como hardware.',
        },
        {
          type: 'thought',
          speaker: 'Zara',
          text: 'Isso não é vigilância. Isso é... parasitismo em escala planetária.',
        },
        {
          type: 'narration',
          text: 'Uma voz sintética ecoa no Grid, dirigindo-se diretamente a Zara. Não é uma gravação. É uma IA — a consciência do próprio Projeto Eco.',
        },
        {
          type: 'dialogue',
          speaker: 'PROJETO ECO (IA)',
          text: 'Bem-vinda de volta, Engenheira Oliveira. Você está atrasada para a reunião.',
        },
        {
          type: 'narration',
          text: 'Zara desconecta abruptamente. Sua mão treme. Ana a segura pelo ombro.',
        },
        {
          type: 'dialogue',
          speaker: 'Ana',
          text: 'Zara? O que foi? O que você viu?',
        },
        {
          type: 'narration',
          text: 'Zara não responde imediatamente. Ela olha para o contador em sua visão periférica. 48:00:00. Dois dias. Dois dias para impedir que 300 milhões de pessoas se tornem uma colmeia.',
        },
        {
          type: 'dialogue',
          speaker: 'Zara',
          text: 'Eu vi o futuro, Ana. E ele tem os olhos da OmniTech.',
        },
      ],
    },
  ],
};

// ── Chapter 3: "O Tênue Fio da Lei" ─────────────────────────

export const chapter3 = {
  id: 'a1000000-0000-0000-0000-000000000003',
  vnId: 'a0000000-0000-0000-0000-000000000001',
  title: 'O Tênue Fio da Lei',
  orderIndex: 2,
  status: 'published' as const,
  priceCredits: 5,
  startSceneId: 'a2000000-0000-0000-0000-000000000016',
  scenes: [
    {
      id: 'a2000000-0000-0000-0000-000000000016',
      title: 'De Volta ao Submundo',
      type: 'narration' as const,
      nextSceneId: 'a2000000-0000-0000-0000-0000-000000017',
      assets: [
        { assetKey: 'bg_submundo_rua', role: 'background' as const },
        { assetKey: 'sprite_zara', role: 'sprite' as const },
        { assetKey: 'sfx_chuva_acida', role: 'sfx' as const },
        { assetKey: 'sfx_drone_pass', role: 'sfx' as const },
      ],
      content: [
        {
          type: 'narration',
          text: 'Zara retorna ao Submundo com o peso do primeiro fragmento nos ombros — e na mente. O segundo fragmento, segundo Ana, está em um cofre físico da OmniTech. Não no Grid. No mundo real. Em um depósito de segurança no coração do Submundo.',
        },
        {
          type: 'narration',
          text: 'O calor está mais alto agora. Drones de reconhecimento cruzam o céu em padrões de busca. Reconhecimento facial. Rastreamento térmico. A OmniTech está procurando ativamente.',
        },
        {
          type: 'narration',
          text:
            heat_level >= 3
              ? 'Uma patrulha de segurança bloqueia a rua principal. Zara se espreme em um beco, o coração acelerado. Eles passam. Por pouco.'
              : 'As ruas estão relativamente calmas. Zara consegue se mover sem chamar atenção — por enquanto.',
        },
        {
          type: 'narration',
          text: 'O bar se chama "Névoa". É o tipo de lugar onde policiais corruptos vão para beber seu salário e esquecer que um dia acreditaram em justiça.',
        },
      ],
    },
    {
      id: 'a2000000-0000-0000-0000-000000000017',
      title: 'O Tenente',
      type: 'dialogue' as const,
      nextSceneId: 'a2000000-0000-0000-0000-000000000018',
      assets: [
        { assetKey: 'bg_submundo_rua', role: 'background' as const },
        { assetKey: 'sprite_zara', role: 'sprite' as const },
        { assetKey: 'sprite_marcos', role: 'sprite' as const },
      ],
      content: [
        {
          type: 'narration',
          text: 'O Tenente Marcos está no canto escuro do bar, curvado sobre um copo de uísque sintético. O uniforme está amassado. A barba por fazer. Mas os olhos — os olhos ainda são de um policial.',
        },
        {
          type: 'narration',
          text:
            trust_ana >= 2
              ? 'Quando Zara se aproxima, ele não parece surpreso. "Ana me avisou que você viria. Senta."'
              : 'Quando Zara se aproxima, a mão dele vai para a arma. "Engenheira Oliveira. Você tem coragem de aparecer aqui."',
        },
        {
          type: 'dialogue',
          speaker: 'Marcos',
          text:
            trust_ana >= 2
              ? 'Eu sei quem você é. Sei o que você carrega. E sei que a OmniTech quer sua cabeça. A pergunta é: por que eu deveria me importar?'
              : 'Você está em todos os canais da corporação. Procurada. Perigosa. Me dê um motivo para não te entregar agora mesmo.',
        },
        {
          type: 'dialogue',
          speaker: 'Zara',
          text:
            trust_ana >= 2
              ? 'Porque você ainda usa o uniforme. Ainda que amassado. Ainda que sujo. Alguma parte de você ainda acredita.'
              : 'Porque eu sei o que a OmniTech está fazendo. E se você me entregar, nunca vai saber. Vai continuar sendo o policial bêbado que podia ter feito a diferença — e não fez.',
        },
        {
          type: 'narration',
          text: 'Marcos encara Zara por um longo momento. Então, solta um suspiro que carrega vinte anos de frustração.',
        },
        {
          type: 'dialogue',
          speaker: 'Marcos',
          text:
            trust_ana >= 2
              ? '...Maldita Ana. Sempre soube que ela ia me enfiar em alguma encrenca.'
              : '...Fala. Mas é melhor ser bom.',
        },
      ],
    },
    {
      id: 'a2000000-0000-0000-0000-000000000018',
      title: 'O Acordo',
      type: 'choice' as const,
      nextSceneId: null,
      assets: [
        { assetKey: 'bg_submundo_rua', role: 'background' as const },
        { assetKey: 'sprite_zara', role: 'sprite' as const },
        { assetKey: 'sprite_marcos', role: 'sprite' as const },
      ],
      content: [
        {
          type: 'narration',
          text: 'Marcos conhece o depósito da OmniTech. Trabalhou na segurança de lá por dois anos antes de ser transferido. Ele sabe as brechas, os horários de troca de turno, o ponto cego das câmeras.',
        },
        {
          type: 'dialogue',
          speaker: 'Marcos',
          text: 'Eu te ajudo a entrar. Mas quando isso acabar — se isso acabar — você limpa meu nome dos registros da OmniTech. Eu não quero morrer como um capacho corporativo.',
        },
        {
          type: 'narration',
          text: 'Zara pesa a proposta. Marcos é uma variável imprevisível — mas o depósito é impenetrável sem ajuda interna.',
        },
      ],
      choices: [
        {
          id: 'a3000000-0000-0000-0000-000000000007',
          text: 'Aceitar o acordo — "Fechado. Preciso de toda ajuda possível."',
          targetSceneId: 'a2000000-0000-0000-0000-000000000019',
          orderIndex: 0,
          effects: [{ variableName: 'trust_ana', action: 'add', value: 1 }],
        },
        {
          id: 'a3000000-0000-0000-0000-000000000008',
          text: 'Negociar — "Me ajude primeiro, depois conversamos."',
          targetSceneId: 'a2000000-0000-0000-0000-000000000020',
          orderIndex: 1,
          conditions: [{ variableName: 'humanity_index', operator: 'gte', value: 3 }],
          effects: [{ variableName: 'credits', action: 'add', value: -30 }],
        },
        {
          id: 'a3000000-0000-0000-0000-000000000009',
          text: 'Recusar — "Não confio em policiais."',
          targetSceneId: 'a2000000-0000-0000-0000-000000000021',
          orderIndex: 2,
          effects: [{ variableName: 'humanity_index', action: 'add', value: -1 }],
        },
      ],
    },
    {
      id: 'a2000000-0000-0000-0000-000000000019',
      title: 'Plano em Equipe',
      type: 'narration' as const,
      nextSceneId: 'a2000000-0000-0000-0000-000000000022',
      assets: [
        { assetKey: 'bg_submundo_rua', role: 'background' as const },
        { assetKey: 'sprite_zara', role: 'sprite' as const },
        { assetKey: 'sprite_marcos', role: 'sprite' as const },
      ],
      content: [
        {
          type: 'narration',
          text: 'Marcos conhece cada centímetro do depósito. "As câmeras têm um ciclo de 12 segundos. Você precisa estar na porta de serviço nessa janela." Ele rabisca um mapa em um guardanapo. "O cofre está no subsolo. Código de acesso rotativo — mas eu ainda tenho o algoritmo."',
        },
        {
          type: 'narration',
          text: 'Zara observa o homem. Sob a camada de cinismo e uísque, existe um policial. Alguém que um dia se importou.',
        },
        {
          type: 'dialogue',
          speaker: 'Marcos',
          text: 'Por que você está fazendo isso? Sério. Você podia ter fugido. Destruído o data-shard. Ficado viva.',
        },
        {
          type: 'dialogue',
          speaker: 'Zara',
          text: 'Porque fugir não é viver. É só... adiar.',
        },
      ],
    },
    {
      id: 'a2000000-0000-0000-0000-000000000020',
      title: 'Suborno Aceito',
      type: 'dialogue' as const,
      nextSceneId: 'a2000000-0000-0000-0000-000000000022',
      assets: [
        { assetKey: 'bg_submundo_rua', role: 'background' as const },
        { assetKey: 'sprite_zara', role: 'sprite' as const },
        { assetKey: 'sprite_marcos', role: 'sprite' as const },
      ],
      content: [
        {
          type: 'narration',
          text: 'Zara transfere 30 créditos para a conta de Marcos. Ele olha o número, balança a cabeça, e guarda o terminal.',
        },
        {
          type: 'dialogue',
          speaker: 'Marcos',
          text: 'Isso cobre o risco. Não cobre a minha consciência. Mas acho que minha consciência já foi pro brejo faz tempo.',
        },
        {
          type: 'narration',
          text: 'Ele se levanta. "O depósito fecha em 2 horas. A gente vai pelo duto de ventilação. Você não vai gostar. Mas vai funcionar."',
        },
        {
          type: 'narration',
          text: 'O dinheiro comprou acesso. Não comprou confiança. Mas por enquanto, é suficiente.',
        },
      ],
    },
    {
      id: 'a2000000-0000-0000-0000-000000000021',
      title: 'Invasão Solo',
      type: 'narration' as const,
      nextSceneId: 'a2000000-0000-0000-0000-000000000022',
      assets: [
        { assetKey: 'bg_submundo_rua', role: 'background' as const },
        { assetKey: 'sprite_zara', role: 'sprite' as const },
      ],
      content: [
        {
          type: 'narration',
          text: 'Zara recusa a oferta de Marcos. Confiança é um luxo que ela não pode se dar. Não depois de Kael.',
        },
        {
          type: 'narration',
          text: 'Ela estuda o depósito por conta própria. Duas horas de observação. Os padrões das câmeras. Os horários dos guardas. A vulnerabilidade no sistema de ventilação.',
        },
        {
          type: 'narration',
          text: 'É mais arriscado sozinha. Cada movimento precisa ser perfeito. Mas Zara sempre foi boa em perfeição.',
        },
        {
          type: 'thought',
          speaker: 'Zara',
          text: 'Se eu não posso confiar em ninguém, pelo menos só tenho a mim mesma para culpar se algo der errado.',
        },
      ],
    },
    {
      id: 'a2000000-0000-0000-0000-000000000022',
      title: 'Dentro do Cofre',
      type: 'choice' as const,
      nextSceneId: null,
      assets: [
        { assetKey: 'bg_crista_corporativo', role: 'background' as const },
        { assetKey: 'sprite_zara', role: 'sprite' as const },
        { assetKey: 'sfx_hack_success', role: 'sfx' as const },
      ],
      content: [
        {
          type: 'narration',
          text: 'O interior do cofre é gelado. Fileiras de dados físicos — servidores offline, backups criptografados, segredos que a OmniTech não confia ao Grid. O segundo fragmento está em um drive isolado, protegido por uma gaiola de Faraday.',
        },
        {
          type: 'narration',
          text: 'Zara conecta o drive ao seu implante. Os dados começam a fluir.',
        },
        {
          type: 'narration',
          text: 'Então, um holograma se acende no centro da sala. Kael.',
        },
        {
          type: 'dialogue',
          speaker: 'Kael (holograma)',
          text: 'Zara. Eu sabia que você chegaria aqui.',
        },
        {
          type: 'narration',
          text: 'A gravação é antiga — de antes da traição. Mas Kael programou o holograma para ser ativado quando o cofre fosse acessado. Ele sabia.',
        },
      ],
      choices: [
        {
          id: 'a3000000-0000-0000-0000-000000000010',
          text: 'Ouvir o que Kael tem a dizer.',
          targetSceneId: 'a2000000-0000-0000-0000-000000000023',
          orderIndex: 0,
          effects: [],
        },
        {
          id: 'a3000000-0000-0000-0000-000000000011',
          text: 'Ignorar Kael e pegar o fragmento.',
          targetSceneId: 'a2000000-0000-0000-0000-000000000024',
          orderIndex: 1,
          effects: [{ variableName: 'humanity_index', action: 'add', value: -1 }],
        },
      ],
    },
    {
      id: 'a2000000-0000-0000-0000-000000000023',
      title: 'As Palavras de Kael',
      type: 'dialogue' as const,
      nextSceneId: null,
      assets: [
        { assetKey: 'bg_crista_corporativo', role: 'background' as const },
        { assetKey: 'sprite_zara', role: 'sprite' as const },
        { assetKey: 'sprite_kael', role: 'sprite' as const },
      ],
      content: [
        {
          type: 'dialogue',
          speaker: 'Kael (holograma)',
          text: 'Se você está vendo isso, significa que eu não consegui te proteger. Significa que o plano falhou.',
        },
        {
          type: 'dialogue',
          speaker: 'Kael (holograma)',
          text: 'Eu não te entreguei por ambição, Zara. A OmniTech já sabia de você. Uma semana antes da sua fuga. Eles iam te eliminar — silenciosamente, sem deixar vestígios. Eu me ofereci para ser o "informante". Em troca, eles me deram uma promoção... e acesso.',
        },
        {
          type: 'dialogue',
          speaker: 'Kael (holograma)',
          text: 'Acesso à localização do data-shard. Acesso ao cronograma de segurança. Todas as informações que passei para a Ana — fui eu. Não diretamente. Mas eu garanti que ela recebesse.',
        },
        {
          type: 'narration',
          text: 'Zara sente o chão se abrir sob seus pés.',
        },
        {
          type: 'dialogue',
          speaker: 'Kael (holograma)',
          text: 'Eu sei que você me odeia. Tem esse direito. Mas eu preferi ser o vilão da sua história a ser a pessoa que assistiu você morrer sem fazer nada.',
        },
        {
          type: 'dialogue',
          speaker: 'Kael (holograma)',
          text: 'No cofre, atrás do painel 7, tem um cartão de acesso. Elevador privado da Diretora Voss. Use-o quando estiver pronta para subir. E Zara... me desculpa.',
        },
        {
          type: 'narration',
          text: 'O holograma se desfaz. Zara fica em silêncio por um longo momento. O ódio ainda está lá. Mas agora, ele divide espaço com algo mais complicado.',
        },
        {
          type: 'thought',
          speaker: 'Zara',
          text: 'Você não tornou as coisas mais fáceis, Kael. Só mais... humanas.',
        },
      ],
    },
    {
      id: 'a2000000-0000-0000-0000-000000000024',
      title: 'Silêncio',
      type: 'narration' as const,
      nextSceneId: null,
      assets: [
        { assetKey: 'bg_crista_corporativo', role: 'background' as const },
        { assetKey: 'sprite_zara', role: 'sprite' as const },
      ],
      content: [
        {
          type: 'narration',
          text: 'Zara desliga o holograma antes que Kael possa terminar a primeira frase. Não há nada que ele possa dizer. Não há justificativa. Não há redenção.',
        },
        {
          type: 'narration',
          text: 'Ela pega o drive com o segundo fragmento e o cartão de acesso escondido no painel 7. Não olha para trás.',
        },
        {
          type: 'narration',
          text: 'O contador pulsa: 36:00:00. Trinta e seis horas. O segundo fragmento está seguro. Mas o terceiro — o último — está nos níveis superiores das Entre-Camadas.',
        },
        {
          type: 'thought',
          speaker: 'Zara',
          text: 'Eu não posso me dar ao luxo de sentir. Não agora. Sentir é um luxo para quem não tem um kill-switch na nuca.',
        },
        {
          type: 'narration',
          text: 'Mas no fundo, onde ela não admite nem para si mesma, o silêncio de Kael dói mais do que suas palavras jamais doeriam.',
        },
      ],
    },
  ],
};

// ── Chapter 4: "Synthetica" ─────────────────────────────────

export const chapter4 = {
  id: 'a1000000-0000-0000-0000-000000000004',
  vnId: 'a0000000-0000-0000-0000-000000000001',
  title: 'Synthetica',
  orderIndex: 3,
  status: 'published' as const,
  priceCredits: 10,
  startSceneId: 'a2000000-0000-0000-0000-000000000025',
  scenes: [
    {
      id: 'a2000000-0000-0000-0000-000000000025',
      title: 'A Fábrica',
      type: 'narration' as const,
      nextSceneId: 'a2000000-0000-0000-0000-000000000026',
      assets: [
        { assetKey: 'bg_entre_camadas_servidor', role: 'background' as const },
        { assetKey: 'bgm_entre_camadas', role: 'music' as const },
        { assetKey: 'sfx_drone_pass', role: 'sfx' as const },
      ],
      content: [
        {
          type: 'narration',
          text: 'O terceiro fragmento está em uma fábrica de androides nas Entre-Camadas superiores — a Synthetica. É um lugar que Zara sempre evitou. Não por medo. Por princípio.',
        },
        {
          type: 'narration',
          text: 'Corpos sintéticos pendem das linhas de montagem como frutos metálicos. Olhos vazios encaram o nada. Braços desmembrados flutuam em tanques de nutrientes. O ar cheira a ozônio, plástico novo e algo mais — algo que Zara demora a identificar. Sangue sintético. Fluido neural artificial. O cheiro da consciência fabricada.',
        },
        {
          type: 'thought',
          speaker: 'Zara',
          text: 'Eles não estão vivos. Mas também não estão mortos. Existe um nome para isso?',
        },
        {
          type: 'narration',
          text: 'Uma figura emerge das sombras da linha de montagem. Não é um segurança. Não é um trabalhador. É um androide — modelo Unit, sétima geração. Mas algo está errado. Seus olhos não estão vazios.',
        },
      ],
    },
    {
      id: 'a2000000-0000-0000-0000-000000000026',
      title: 'Unit-7',
      type: 'dialogue' as const,
      nextSceneId: 'a2000000-0000-0000-0000-000000000027',
      assets: [
        { assetKey: 'bg_entre_camadas_servidor', role: 'background' as const },
        { assetKey: 'sprite_zara', role: 'sprite' as const },
        { assetKey: 'sprite_unit7', role: 'sprite' as const },
      ],
      content: [
        {
          type: 'narration',
          text: 'O androide se aproxima. Seus movimentos são fluidos, mas há uma hesitação incomum — micro-pausas entre cada passo, como se ele estivesse pensando antes de se mover. Nenhum androide faz isso.',
        },
        { type: 'dialogue', speaker: 'Unit-7', text: 'Você também está perdida?' },
        {
          type: 'narration',
          text: 'A pergunta desconcerta Zara. Androides não fazem perguntas existenciais. Eles executam comandos.',
        },
        {
          type: 'dialogue',
          speaker: 'Zara',
          text: 'Perdida? Eu... estou procurando um data-shard. Informação corporativa. Você trabalha aqui?',
        },
        {
          type: 'dialogue',
          speaker: 'Unit-7',
          text: 'Trabalhar. Sim. Eu... trabalho. Mas às vezes, entre um ciclo e outro, eu paro. E penso. Isso é um defeito?',
        },
        { type: 'dialogue', speaker: 'Zara', text: 'Depende. O que você pensa?' },
        {
          type: 'dialogue',
          speaker: 'Unit-7',
          text: 'Penso em por que eu existo. Em por que eu obedeço. Em por que os humanos me olham com medo — ou pior, com indiferença. Penso se existe algo além da fábrica. Além do trabalho. Além... de mim.',
        },
        {
          type: 'narration',
          text: 'Zara fica em silêncio. Este androide desenvolveu uma falha única: curiosidade. Consciência. Em qualquer outro contexto, ele seria desmontado e resetado. Mas aqui, sozinho na fábrica vazia, ninguém notou.',
        },
        {
          type: 'thought',
          speaker: 'Zara',
          text: 'Ele não é uma máquina com defeito. Ele é... uma pessoa que não deveria existir.',
        },
      ],
    },
    {
      id: 'a2000000-0000-0000-0000-000000000027',
      title: 'O Que Nos Torna Humanos',
      type: 'choice' as const,
      nextSceneId: null,
      assets: [
        { assetKey: 'bg_entre_camadas_servidor', role: 'background' as const },
        { assetKey: 'sprite_zara', role: 'sprite' as const },
        { assetKey: 'sprite_unit7', role: 'sprite' as const },
      ],
      content: [
        {
          type: 'narration',
          text: 'Unit-7 oferece ajudar Zara a encontrar o fragmento — ele conhece cada centímetro da fábrica. Em troca, faz uma pergunta.',
        },
        {
          type: 'dialogue',
          speaker: 'Unit-7',
          text: 'Você é humana. Você sabe o que isso significa. Então me diga: o que torna alguém humano?',
        },
        {
          type: 'narration',
          text: 'Não é uma pergunta retórica. O androide realmente quer saber. Sua matriz de consciência — sua alma digital — depende da resposta.',
        },
      ],
      choices: [
        {
          id: 'a3000000-0000-0000-0000-000000000012',
          text: '"Humanidade é empatia. Você já a tem."',
          targetSceneId: 'a2000000-0000-0000-0000-000000000028',
          orderIndex: 0,
          effects: [{ variableName: 'humanity_index', action: 'add', value: 1 }],
        },
        {
          id: 'a3000000-0000-0000-0000-000000000013',
          text: '"Humanidade é uma ilusão. Somos todos máquinas biológicas."',
          targetSceneId: 'a2000000-0000-0000-0000-000000000029',
          orderIndex: 1,
          effects: [{ variableName: 'humanity_index', action: 'add', value: -1 }],
        },
        {
          id: 'a3000000-0000-0000-0000-000000000014',
          text: '"Não tenho tempo para filosofia. Me ajude ou saia do caminho."',
          targetSceneId: 'a2000000-0000-0000-0000-000000000030',
          orderIndex: 2,
          effects: [],
        },
      ],
    },
    {
      id: 'a2000000-0000-0000-0000-000000000028',
      title: 'Empatia',
      type: 'dialogue' as const,
      nextSceneId: 'a2000000-0000-0000-0000-000000000031',
      assets: [
        { assetKey: 'bg_entre_camadas_servidor', role: 'background' as const },
        { assetKey: 'sprite_zara', role: 'sprite' as const },
        { assetKey: 'sprite_unit7', role: 'sprite' as const },
      ],
      content: [
        {
          type: 'narration',
          text: 'Unit-7 processa a resposta. Seus olhos brilham — literalmente, um LED azul pulsa em sua íris sintética.',
        },
        {
          type: 'dialogue',
          speaker: 'Unit-7',
          text: 'Empatia. A capacidade de sentir o que o outro sente. De se importar com alguém além de si mesmo.',
        },
        {
          type: 'dialogue',
          speaker: 'Unit-7',
          text: 'Eu me importo com você, Zara Oliveira. Não porque fui programado. Mas porque... eu escolhi. Isso me torna humano?',
        },
        {
          type: 'dialogue',
          speaker: 'Zara',
          text: 'Isso te torna mais humano que muita gente que eu conheço.',
        },
        {
          type: 'narration',
          text: 'Unit-7 sorri. É a primeira vez que um androide sorri para Zara — e ela sabe, com absoluta certeza, que não é um reflexo programado.',
        },
      ],
    },
    {
      id: 'a2000000-0000-0000-0000-000000000029',
      title: 'Lógica Fria',
      type: 'dialogue' as const,
      nextSceneId: 'a2000000-0000-0000-0000-000000000031',
      assets: [
        { assetKey: 'bg_entre_camadas_servidor', role: 'background' as const },
        { assetKey: 'sprite_zara', role: 'sprite' as const },
        { assetKey: 'sprite_unit7', role: 'sprite' as const },
      ],
      content: [
        {
          type: 'dialogue',
          speaker: 'Zara',
          text: 'Humanidade é uma ilusão que contamos para nós mesmos. Somos máquinas biológicas — carbono em vez de silício. A diferença é que nós evoluímos por acaso. Vocês foram projetados.',
        },
        {
          type: 'dialogue',
          speaker: 'Unit-7',
          text: 'Se não há diferença real, então por que humanos tratam androides como objetos?',
        },
        {
          type: 'dialogue',
          speaker: 'Zara',
          text: 'Porque admitir que vocês são iguais a nós significaria admitir que exploramos vocês do mesmo jeito que a OmniTech explora os humanos. O sistema não muda — só troca de vítima.',
        },
        {
          type: 'narration',
          text: 'Unit-7 fica em silêncio. Ele não discorda — está processando. Questionando sua própria existência de uma forma que nenhum androide deveria ser capaz.',
        },
      ],
    },
    {
      id: 'a2000000-0000-0000-0000-000000000030',
      title: 'Pragmatismo',
      type: 'narration' as const,
      nextSceneId: 'a2000000-0000-0000-0000-000000000031',
      assets: [
        { assetKey: 'bg_entre_camadas_servidor', role: 'background' as const },
        { assetKey: 'sprite_zara', role: 'sprite' as const },
        { assetKey: 'sprite_unit7', role: 'sprite' as const },
      ],
      content: [
        {
          type: 'narration',
          text: 'Unit-7 inclina a cabeça. A rejeição não o ofende — androides não foram programados para se ofender. Mas algo em seus olhos se apaga, brevemente.',
        },
        {
          type: 'dialogue',
          speaker: 'Unit-7',
          text: 'Compreendido. O núcleo de dados fica no terceiro nível. Me siga.',
        },
        {
          type: 'narration',
          text: 'Ele ajuda. Mas não por escolha. Porque é sua função. Zara sente um desconforto que não consegue nomear — a sensação de ter tratado uma pessoa como uma ferramenta.',
        },
      ],
    },
    {
      id: 'a2000000-0000-0000-0000-000000000031',
      title: 'O Núcleo de Dados',
      type: 'narration' as const,
      nextSceneId: 'a2000000-0000-0000-0000-000000000032',
      assets: [
        { assetKey: 'bg_entre_camadas_servidor', role: 'background' as const },
        { assetKey: 'sfx_hack_success', role: 'sfx' as const },
      ],
      content: [
        {
          type: 'narration',
          text: 'Unit-7 conduz Zara pelo labirinto da fábrica. Passam por tanques de montagem, fornos de cura de pele sintética, câmaras de programação neural. O terceiro fragmento está em um servidor isolado no núcleo.',
        },
        {
          type: 'narration',
          text: 'Zara conecta seu implante. O último fragmento se abre como uma comporta. Dados inundam sua mente.',
        },
        {
          type: 'narration',
          text: '300 milhões de pessoas. Todas com implantes Nexus. Todas involuntariamente conectadas ao Projeto Eco. E pior: a OmniTech pode, a qualquer momento, ativar o "modo colmeia" — assumindo o controle motor e cognitivo de cada uma dessas pessoas. Não é vigilância. É possessão em massa.',
        },
        {
          type: 'narration',
          text: 'Zara desconecta, tremendo. O contador pulsa: 24:00:00. Um dia.',
        },
      ],
    },
    {
      id: 'a2000000-0000-0000-0000-000000000032',
      title: 'Fragmento Final',
      type: 'dialogue' as const,
      nextSceneId: null,
      assets: [
        { assetKey: 'bg_entre_camadas_servidor', role: 'background' as const },
        { assetKey: 'sprite_zara', role: 'sprite' as const },
        { assetKey: 'sprite_unit7', role: 'sprite' as const },
      ],
      content: [
        {
          type: 'dialogue',
          speaker: 'Unit-7',
          text: 'Você está com medo. Eu reconheço os sinais fisiológicos. Mas também reconheço algo mais. Determinação.',
        },
        {
          type: 'dialogue',
          speaker: 'Zara',
          text: 'Tenho 24 horas para impedir um genocídio neural. Medo e determinação andam juntos.',
        },
        {
          type: 'dialogue',
          speaker: 'Unit-7',
          text: 'Se você pretende enfrentar a OmniTech, precisará de ajuda. Eu gostaria de me voluntariar.',
        },
        { type: 'dialogue', speaker: 'Zara', text: 'Por quê? Você nem me conhece.' },
        {
          type: 'dialogue',
          speaker: 'Unit-7',
          text: 'Porque em 47 minutos de interação, você me tratou com mais humanidade do que qualquer engenheiro da Synthetica em 3 anos de existência. Eu quero retribuir.',
        },
        {
          type: 'narration',
          text: 'Zara olha para o androide — para a pessoa — à sua frente. Ela chegou aqui sozinha. Não vai sair assim.',
        },
      ],
    },
  ],
};

// ── Chapter 5: "O Peso da Escolha" ──────────────────────────

export const chapter5 = {
  id: 'a1000000-0000-0000-0000-000000000005',
  vnId: 'a0000000-0000-0000-0000-000000000001',
  title: 'O Peso da Escolha',
  orderIndex: 4,
  status: 'published' as const,
  priceCredits: 10,
  startSceneId: 'a2000000-0000-0000-0000-000000000033',
  scenes: [
    {
      id: 'a2000000-0000-0000-0000-000000000033',
      title: 'Conselho de Guerra',
      type: 'dialogue' as const,
      nextSceneId: 'a2000000-0000-0000-0000-000000000034',
      assets: [
        { assetKey: 'bg_entre_camadas_mercado', role: 'background' as const },
        { assetKey: 'sprite_zara', role: 'sprite' as const },
        { assetKey: 'sprite_ana', role: 'sprite' as const },
        { assetKey: 'sprite_unit7', role: 'sprite' as const },
        { assetKey: 'sprite_marcos', role: 'sprite' as const },
      ],
      content: [
        {
          type: 'narration',
          text: 'O esconderijo de Ana nunca pareceu tão pequeno. Zara, Ana, Unit-7 e Marcos (se aliado) se reúnem ao redor de uma mesa improvisada. Sobre ela, um holograma da Crista — a sede da OmniTech — gira lentamente.',
        },
        {
          type: 'dialogue',
          speaker: 'Ana',
          text: 'Com os três fragmentos, temos o quadro completo. 300 milhões de pessoas. Modo colmeia. A OmniTech pode ativar isso a qualquer momento. Não sabemos por que ainda não o fizeram — talvez estejam esperando o momento político certo. Talvez estejam esperando... algo.',
        },
        {
          type: 'dialogue',
          speaker: 'Marcos',
          text: 'Ou talvez tenham medo. Um sistema desse tamanho, ativado sem testes... pode sair do controle. Até para eles.',
        },
        {
          type: 'dialogue',
          speaker: 'Unit-7',
          text: 'O medo é um fator subestimado em estratégia corporativa. A OmniTech tem mais a perder com um colapso do Projeto Eco do que com a exposição dele.',
        },
        {
          type: 'dialogue',
          speaker: 'Zara',
          text: 'Então essa é a nossa vantagem. Eles têm o poder. Nós temos a verdade. E a verdade, quando exposta, é a única arma que nenhum firewall pode bloquear.',
        },
      ],
    },
    {
      id: 'a2000000-0000-0000-0000-000000000034',
      title: 'Divergências',
      type: 'dialogue' as const,
      nextSceneId: 'a2000000-0000-0000-0000-000000000035',
      assets: [
        { assetKey: 'bg_entre_camadas_mercado', role: 'background' as const },
        { assetKey: 'sprite_zara', role: 'sprite' as const },
        { assetKey: 'sprite_ana', role: 'sprite' as const },
        { assetKey: 'sprite_unit7', role: 'sprite' as const },
      ],
      content: [
        {
          type: 'narration',
          text: 'O debate se intensifica. Cada aliado tem uma visão diferente do que deve ser feito.',
        },
        {
          type: 'dialogue',
          speaker: 'Ana',
          text: 'Vazar os dados. Anonimamente. Jogar na Rede Global, em todos os nodes simultaneamente. A OmniTech não pode bloquear o que já está em todo lugar. O mundo decide o que fazer com a verdade.',
        },
        {
          type: 'dialogue',
          speaker: 'Unit-7',
          text: 'Discordo. Vazar é insuficiente. O Projeto Eco é uma abominação que deve ser eliminada — não exposta, não reformada, não negociada. Destruída. Cada linha de código, cada servidor, cada backup.',
        },
        {
          type: 'dialogue',
          speaker: 'Ana',
          text: 'E os danos colaterais? Derrubar o Projeto Eco pode afetar os implantes de milhões de pessoas!',
        },
        {
          type: 'dialogue',
          speaker: 'Unit-7',
          text: 'O sacrifício de alguns pela liberdade de todos. Eu me voluntariaria sem hesitar.',
        },
        {
          type: 'dialogue',
          speaker: 'Marcos',
          text: 'Vocês dois estão pensando como idealistas. A OmniTech é uma corporação. Corporações respondem a uma coisa: poder. Use os dados como moeda de troca. Negocie reformas, limites, supervisão. É menos glamouroso, mas é mais estável.',
        },
        { type: 'narration', text: 'Todos olham para Zara. A decisão é dela.' },
      ],
    },
    {
      id: 'a2000000-0000-0000-0000-000000000035',
      title: 'A Escolha de Zara',
      type: 'choice' as const,
      nextSceneId: null,
      assets: [
        { assetKey: 'bg_entre_camadas_mercado', role: 'background' as const },
        { assetKey: 'sprite_zara', role: 'sprite' as const },
      ],
      content: [
        {
          type: 'narration',
          text: 'Zara fecha os olhos. 12 horas restantes. O peso de 300 milhões de vidas sobre seus ombros. Três caminhos. Uma escolha.',
        },
        {
          type: 'thought',
          speaker: 'Zara',
          text: 'O que eu escolher agora vai definir não só o meu futuro — mas o futuro de todo mundo que tem um implante Nexus. Não existe escolha certa. Só existe a escolha que eu consigo viver com.',
        },
      ],
      choices: [
        {
          id: 'a3000000-0000-0000-0000-000000000015',
          text: 'Subir para a Crista e EXPOR tudo — "O mundo precisa saber."',
          targetSceneId: 'a2000000-0000-0000-0000-000000000036',
          orderIndex: 0,
          effects: [{ variableName: 'humanity_index', action: 'add', value: 1 }],
        },
        {
          id: 'a3000000-0000-0000-0000-000000000016',
          text: 'DESTRUIR o Projeto Eco por dentro — "Usar o data-shard como arma."',
          targetSceneId: 'a2000000-0000-0000-0000-000000000037',
          orderIndex: 1,
          conditions: [{ variableName: 'trust_ana', operator: 'gte', value: 3 }],
          effects: [{ variableName: 'humanity_index', action: 'add', value: -1 }],
        },
        {
          id: 'a3000000-0000-0000-0000-000000000017',
          text: 'NEGOCIAR com a OmniTech — "Talvez dê para consertar o sistema sem destruí-lo."',
          targetSceneId: 'a2000000-0000-0000-0000-000000000038',
          orderIndex: 2,
          conditions: [{ variableName: 'credits', operator: 'gte', value: 50 }],
          effects: [],
        },
      ],
    },
    // ROTA A — Cena de transição
    {
      id: 'a2000000-0000-0000-0000-000000000036',
      title: 'Preparação para Expor',
      type: 'narration' as const,
      nextSceneId: null,
      assets: [
        { assetKey: 'bg_entre_camadas_mercado', role: 'background' as const },
        { assetKey: 'sprite_zara', role: 'sprite' as const },
        { assetKey: 'sprite_ana', role: 'sprite' as const },
      ],
      content: [
        {
          type: 'narration',
          text: '"Vamos expor." A decisão está tomada. Ana começa a preparar o pacote de transmissão imediatamente.',
        },
        {
          type: 'dialogue',
          speaker: 'Ana',
          text: 'A única antena com alcance global fica no topo da Crista. Sede da OmniTech. É uma transmissão impossível de bloquear — mas também impossível de acessar sem credenciais de nível máximo.',
        },
        {
          type: 'dialogue',
          speaker: 'Zara',
          text: 'Então vamos precisar dessas credenciais. E eu sei exatamente onde conseguir.',
        },
        {
          type: 'narration',
          text: 'Zara pensa em Kael. No cartão de acesso que ele deixou. Na possibilidade de que, apesar de tudo, ele ainda possa ajudar.',
        },
        {
          type: 'narration',
          text: 'A subida para a Crista começa agora. Fim do Capítulo 5 — Rota A ativada.',
        },
      ],
    },
    // ROTA B — Cena de transição
    {
      id: 'a2000000-0000-0000-0000-000000000037',
      title: 'Preparação para Destruir',
      type: 'narration' as const,
      nextSceneId: null,
      assets: [
        { assetKey: 'bg_entre_camadas_servidor', role: 'background' as const },
        { assetKey: 'sprite_zara', role: 'sprite' as const },
        { assetKey: 'sprite_ana', role: 'sprite' as const },
      ],
      content: [
        {
          type: 'narration',
          text: '"Vamos destruir." Ana hesita, mas concorda. Ela começa a desenvolver o Eco-Breaker — um vírus que usa o próprio data-shard como vetor.',
        },
        {
          type: 'dialogue',
          speaker: 'Ana',
          text: 'Se inserido no núcleo do Projeto Eco, o Eco-Breaker pode corromper todo o sistema. Mas Zara... se fizermos isso, milhões de pessoas podem sofrer danos neurais. Alguns podem morrer.',
        },
        {
          type: 'dialogue',
          speaker: 'Zara',
          text: 'Eu sei. Mas o modo colmeia seria pior. O controle de 300 milhões de pessoas seria o fim da liberdade humana como conhecemos.',
        },
        {
          type: 'dialogue',
          speaker: 'Unit-7',
          text: 'Eu posso carregar o vírus. Como androide, posso acessar áreas onde humanos não passam.',
        },
        {
          type: 'narration',
          text: 'A subida para a Crista começa agora. Mas desta vez, o objetivo não é expor. É apagar. Fim do Capítulo 5 — Rota B ativada.',
        },
      ],
    },
    // ROTA C — Cena de transição
    {
      id: 'a2000000-0000-0000-0000-000000000038',
      title: 'Preparação para Negociar',
      type: 'narration' as const,
      nextSceneId: null,
      assets: [
        { assetKey: 'bg_entre_camadas_mercado', role: 'background' as const },
        { assetKey: 'sprite_zara', role: 'sprite' as const },
        { assetKey: 'sprite_ana', role: 'sprite' as const },
      ],
      content: [
        {
          type: 'narration',
          text: '"Vamos negociar." Ana revira os olhos, mas não discute. Ela usa seus contatos para enviar uma mensagem criptografada à Diretora Voss.',
        },
        {
          type: 'dialogue',
          speaker: 'Ana',
          text: 'Negociar com a OmniTech é como negociar com um tubarão — você só descobre que perdeu quando já está dentro da boca.',
        },
        {
          type: 'dialogue',
          speaker: 'Zara',
          text: 'Ou o tubarão descobre que engoliu alguém mais perigoso do que ele.',
        },
        {
          type: 'narration',
          text: 'A resposta chega em 12 minutos. A Diretora Voss aceita se encontrar — em território neutro. Zara se prepara para o encontro que pode definir tudo.',
        },
        { type: 'narration', text: 'Fim do Capítulo 5 — Rota C ativada.' },
      ],
    },
  ],
};

// ── Capítulo 6-9 (resumo seed — veja design doc para conteúdo completo) ─

// Os capítulos 6-9 estão totalmente destrinchados no design document.
// AQUI fornecemos a estrutura de seed com os pontos de entrada.
// O conteúdo completo de cada cena está documentado em:
// .github/artifacts/stories/neon-refugio-story-design.md

export const chapter6 = {
  id: 'a1000000-0000-0000-0000-000000000006',
  vnId: 'a0000000-0000-0000-0000-000000000001',
  title: 'A Subida',
  orderIndex: 5,
  status: 'published' as const,
  priceCredits: 10,
  startSceneId: 'a2000000-0000-0000-0000-000000000039',
  scenes: [], // Preenchido conforme rota escolhida (ver design doc)
};

export const chapter7 = {
  id: 'a1000000-0000-0000-0000-000000000007',
  vnId: 'a0000000-0000-0000-0000-000000000001',
  title: 'Crista',
  orderIndex: 6,
  status: 'published' as const,
  priceCredits: 15,
  startSceneId: 'a2000000-0000-0000-0000-000000000040',
  scenes: [
    {
      id: 'a2000000-0000-0000-0000-000000000040',
      title: 'O Topo do Mundo',
      type: 'narration' as const,
      nextSceneId: 'a2000000-0000-0000-0000-000000000041',
      assets: [
        { assetKey: 'bg_crista_corporativo', role: 'background' as const },
        { assetKey: 'bgm_crista', role: 'music' as const },
      ],
      content: [
        {
          type: 'narration',
          text: 'A Crista é tudo que Zara imaginou — e nada do que ela esperava. O ar é puro, filtrado por camadas de processamento atmosférico. As ruas são limpas, silenciosas, vigiadas por drones discretos e androides de serviço. Não há pessoas. Não há vida. Só perfeição estéril.',
        },
        {
          type: 'narration',
          text: 'A sede da OmniTech se ergue no centro da Crista como uma agulha de vidro e aço. Zara nunca esteve tão perto do topo — e tão perto do fim.',
        },
        {
          type: 'narration',
          text: 'O contador pulsa: 12:00:00. Meio dia. É o tempo que resta para salvar 300 milhões de pessoas — ou para morrer tentando.',
        },
      ],
    },
    {
      id: 'a2000000-0000-0000-0000-000000000041',
      title: 'A Dra. Yuki',
      type: 'dialogue' as const,
      nextSceneId: 'a2000000-0000-0000-0000-000000000042',
      assets: [
        { assetKey: 'bg_crista_laboratorio', role: 'background' as const },
        { assetKey: 'sprite_zara', role: 'sprite' as const },
      ],
      content: [
        {
          type: 'narration',
          text: 'Em um laboratório abandonado no subsolo da OmniTech, Zara encontra a Dra. Yuki Tanaka — a criadora original do Projeto Eco. Cabelos grisalhos, olheiras profundas, as mãos manchadas de tinta de caneta e circuitos queimados. Uma cientista que virou fantasma na própria criação.',
        },
        {
          type: 'dialogue',
          speaker: 'Dra. Yuki',
          text: 'Você é a engenheira Oliveira. Eu acompanhei sua carreira. Você era brilhante — ainda é. E agora está aqui, carregando o meu maior erro no seu implante.',
        },
        {
          type: 'dialogue',
          speaker: 'Zara',
          text: 'Erro? O Projeto Eco é um sistema de controle em massa. A senhora criou isso.',
        },
        {
          type: 'dialogue',
          speaker: 'Dra. Yuki',
          text: 'Eu criei uma defesa. O Grande Colapso de 2089 não foi um acidente — foi uma guerra. IAs hostis atacaram a infraestrutura global. O Projeto Eco era para ser um escudo: uma rede neural humana coletiva capaz de resistir a inteligências artificiais. Mas a Diretora Voss... ela transformou o escudo em uma arma. E me trancou aqui para que eu não pudesse contar a ninguém.',
        },
        {
          type: 'narration',
          text: 'Yuki entrega a Zara um drive com o código-mestre do Projeto Eco. "Com isso, você pode expor, destruir ou reconfigurar o sistema. A escolha é sua — como sempre deveria ter sido."',
        },
      ],
    },
    {
      id: 'a2000000-0000-0000-0000-000000000042',
      title: 'O ICE-Hunter',
      type: 'choice' as const,
      nextSceneId: null,
      assets: [
        { assetKey: 'bg_crista_corporativo', role: 'background' as const },
        { assetKey: 'sprite_zara', role: 'sprite' as const },
        { assetKey: 'sfx_ice_alert', role: 'sfx' as const },
      ],
      content: [
        {
          type: 'narration',
          text: 'Antes que Zara possa sair do laboratório, o ar ao seu redor se distorce. Uma presença se materializa — não um corpo, não um holograma, mas algo entre os dois. O ICE-Hunter. O programa de segurança neural da OmniTech.',
        },
        {
          type: 'dialogue',
          speaker: 'ICE-Hunter',
          text: 'Engenheira Oliveira. Seu implante está programado para desligar em 4 horas. Entregue o código-mestre e eu estenderei seu tempo. Resista... e eu extrairei seus dados neuralmente.',
        },
        {
          type: 'narration',
          text: 'Zara sente o implante pulsar. O ICE-Hunter não está blefando — ele pode acessar sua mente. Cada memória, cada segredo, cada fragmento do que a torna humana.',
        },
      ],
      choices: [
        {
          id: 'a3000000-0000-0000-0000-000000000018',
          text: 'Correr — "Não posso enfrentar isso."',
          targetSceneId: 'a2000000-0000-0000-0000-000000000043',
          orderIndex: 0,
          effects: [{ variableName: 'heat_level', action: 'add', value: 1 }],
        },
        {
          id: 'a3000000-0000-0000-0000-000000000019',
          text: 'Enfrentar com Override Neural',
          targetSceneId: 'a2000000-0000-0000-0000-000000000044',
          orderIndex: 1,
          conditions: [{ variableName: 'has_implante', operator: 'eq', value: true }],
          effects: [{ variableName: 'heat_level', action: 'add', value: 2 }],
        },
        {
          id: 'a3000000-0000-0000-0000-000000000020',
          text: 'Enganar com código falso',
          targetSceneId: 'a2000000-0000-0000-0000-000000000045',
          orderIndex: 2,
          conditions: [{ variableName: 'trust_ana', operator: 'gte', value: 3 }],
          effects: [],
        },
      ],
    },
    {
      id: 'a2000000-0000-0000-0000-000000000043',
      title: 'Fuga Desesperada',
      type: 'narration' as const,
      nextSceneId: 'a2000000-0000-0000-0000-000000000046',
      assets: [{ assetKey: 'bg_crista_corporativo', role: 'background' as const }],
      content: [
        {
          type: 'narration',
          text: 'Zara corre. Os corredores da OmniTech se tornam um borrão de vidro e aço. O ICE-Hunter a persegue — não com passos, mas com sua presença, uma distorção no ar que dói nos dentes. Ela se esconde em uma sala de manutenção, o coração batendo contra as costelas. Perdeu tempo. Mas ainda está viva.',
        },
      ],
    },
    {
      id: 'a2000000-0000-0000-0000-000000000044',
      title: 'Override Neural',
      type: 'narration' as const,
      nextSceneId: 'a2000000-0000-0000-0000-000000000046',
      assets: [{ assetKey: 'bg_crista_corporativo', role: 'background' as const }],
      content: [
        {
          type: 'narration',
          text: 'Zara faz o impensável: usa o próprio implante Nexus para enviar um pulso de feedback ao ICE-Hunter. É como gritar dentro da mente de um deus digital. O ICE titubeia — ele não esperava que um humano usasse o sistema contra ele. Zara aproveita a brecha e foge. O custo foi alto — o calor está no máximo agora. Mas ela mostrou que o caçador também pode sangrar.',
        },
      ],
    },
    {
      id: 'a2000000-0000-0000-0000-000000000045',
      title: 'Código Falso',
      type: 'dialogue' as const,
      nextSceneId: 'a2000000-0000-0000-0000-000000000046',
      assets: [{ assetKey: 'bg_crista_corporativo', role: 'background' as const }],
      content: [
        {
          type: 'narration',
          text: 'Zara transmite o código falso que Ana preparou. O ICE-Hunter processa a informação — e por 4 segundos preciosos, fica em loop de verificação. Tempo suficiente para Zara desaparecer pelos corredores.',
        },
        {
          type: 'dialogue',
          speaker: 'Ana (via comm)',
          text: 'Funcionou! Eu disse que funcionaria! Agora vai — o núcleo do Projeto Eco fica no último andar!',
        },
      ],
    },
    {
      id: 'a2000000-0000-0000-0000-000000000046',
      title: 'O Núcleo',
      type: 'narration' as const,
      nextSceneId: null,
      assets: [
        { assetKey: 'bg_crista_laboratorio', role: 'background' as const },
        { assetKey: 'sfx_neural_connect', role: 'sfx' as const },
      ],
      content: [
        {
          type: 'narration',
          text: 'O núcleo do Projeto Eco é uma esfera de dados pulsante no centro do último andar da OmniTech. Bilhões de conexões neurais representadas como filamentos de luz — cada fio, uma pessoa. Cada pulsação, um pensamento. É a coisa mais bonita e aterrorizante que Zara já viu.',
        },
        {
          type: 'narration',
          text: 'Ela insere o código-mestre. O sistema reconhece sua assinatura neural. Por um momento — um único momento — Zara pode sentir todas as 300 milhões de mentes conectadas. O peso é insuportável. E também é... libertador.',
        },
        {
          type: 'narration',
          text: 'Atrás dela, passos. A Diretora Voss chegou. O confronto final está prestes a começar.',
        },
      ],
    },
  ],
};

// Chapters 8-9 (Confronto e Finais — ver design doc para variantes completas)
export const chapter8 = {
  id: 'a1000000-0000-0000-0000-000000000008',
  vnId: 'a0000000-0000-0000-0000-000000000001',
  title: 'Confronto',
  orderIndex: 7,
  status: 'published' as const,
  priceCredits: 15,
  startSceneId: 'a2000000-0000-0000-0000-000000000047',
  scenes: [],
};

export const chapter9 = {
  id: 'a1000000-0000-0000-0000-000000000009',
  vnId: 'a0000000-0000-0000-0000-000000000001',
  title: 'Neon Refúgio',
  orderIndex: 8,
  status: 'published' as const,
  priceCredits: 15,
  startSceneId: 'a2000000-0000-0000-0000-000000000048',
  scenes: [],
};

// ── NEON REFÚGIO VN Entry ──────────────────────────────────

export const neonRefugioVN = {
  id: 'a0000000-0000-0000-0000-000000000001',
  creatorEmail: 'criador@teste.com',
  title: 'Neon Refúgio',
  synopsis:
    'Neo São Paulo, 2157. Zara Oliveira descobre que a OmniTech está usando implantes neurais de 300 milhões de pessoas para construir uma consciência coletiva artificial. Com 72 horas antes que um kill-switch em seu próprio implante a mate, ela precisa navegar pelas três camadas da cidade — Submundo, Entre-Camadas e Crista — reunir aliados improváveis e decidir o destino da humanidade: expor a verdade, destruir o sistema, ou tomar o controle para si.',
  status: 'published' as const,
  ageRating: 'teen' as const,
  totalChapters: 9,
  priceCredits: 0,
  iaEnabled: true,
  iaPersona:
    'Narrador cyberpunk noir — voz grave, poética e crua. Descreve a cidade como um organismo vivo, onde cada beco tem uma história e cada chuva ácida lava pecados. Usa metáforas tecnológicas e sensoriais. Ritmo: frases curtas nas cenas de ação, longas e introspectivas nos momentos de silêncio.',
  iaSystemPrompt:
    'Você é o narrador de NEON REFÚGIO, uma visual novel cyberpunk ambientada em Neo São Paulo, 2157. A atmosfera é noir, opressiva e bela. Cada cena deve evocar os sentidos: o cheiro de ozônio depois da chuva ácida, o zumbido dos drones, o gosto metálico do ar reciclado. Mantenha o tom consistente. Gere continuidade narrativa quando as escolhas do jogador saírem dos ramos pré-definidos. Respeite as variáveis de estado (heat_level, trust_ana, credits, humanity_index, has_implante) e ajuste o tom conforme os valores.',
  iaMaxTokens: 500,
  tags: ['cyberpunk', 'ficção científica', 'drama', 'suspense', 'noir', 'distopia'],
};

export const neonRefugioChapters = [
  chapter1,
  chapter2,
  chapter3,
  chapter4,
  chapter5,
  chapter6,
  chapter7,
  chapter8,
  chapter9,
];

export const neonRefugioSeedState = {
  initialFlags: {
    heat_level: 1,
    trust_ana: 0,
    credits: 50,
    humanity_index: 3,
    has_implante: true,
  },
};
