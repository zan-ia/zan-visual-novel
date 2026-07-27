# NEON REFÚGIO — Story Design Document

> **Zan Visual Novel — Demo Story**  
> Gênero: Cyberpunk Noir | Classificação: Teen (16+)  
> Arcos: 3 | Capítulos: 9 | Cenas: ~40 | Finais: 5  
> Engine Features Demonstrados: TODOS

---

## 📖 Sinopse

**Neo São Paulo, 2157.** Depois do Grande Colapso de 2089, as megacorporações dividiram a cidade em camadas verticais. A elite vive na **Crista** — arranha-céus que furam as nuvens, respiram ar puro e controlam o fluxo de dados do mundo. Nas **Entre-Camadas**, mercenários, hackers e comerciantes sobrevivem no meio do caos. E no **Submundo**, ao nível do asfalto tóxico, milhões lutam por migalhas sob chuva ácida e neônio quebrado.

**Zara Oliveira**, 24 anos, era uma engenheira de sistemas da **OmniTech** — a maior corporação de implantes neurais do hemisfério sul. Ela descobriu algo que não deveria: o **Projeto Eco**, um algoritmo secreto que prova que a OmniTech está usando os implantes neurais de milhões de pessoas para construir uma **consciência coletiva artificial** — uma IA que pode prever, manipular e controlar o comportamento humano em massa.

Antes que pudesse expor a verdade, Zara foi traída por **Kael**, seu parceiro e confidente. Ele a entregou para a segurança corporativa em troca de uma promoção. Zara escapou por pouco, mas o **data-shard** com as provas do Projeto Eco está fragmentado em seu implante neural — e há um **kill-switch** programado para detonar seu sistema nervoso em 72 horas.

Agora, Zara precisa navegar pelas três camadas da cidade, reunir aliados improváveis, recuperar os fragmentos do data-shard e decidir: **expor a verdade e derrubar o sistema, ou usar o Projeto Eco para reescrever seu próprio destino.**

---

## 🎯 Features do Sistema Demonstrados

| Feature                                               | Como Aparece na História                                                                |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Scene Types** (narration, dialogue, choice, ending) | Todos os 4 tipos em cada capítulo                                                       |
| **TextBlock Types** (narration, dialogue, thought)    | Monólogos internos, diálogos com NPCs, narração descritiva                              |
| **Branching Choices**                                 | Ramificações reais com consequências narrativas                                         |
| **Conditions/Effects**                                | `heat_level`, `trust_ana`, `credits`, `humanity_index`, `has_implante`                  |
| **LLM Integration**                                   | `ia_persona: "narrador cyberpunk noir"` gera continuidade além das escolhas             |
| **Assets**                                            | Backgrounds (8+), sprites (6+ personagens), música (3 faixas), SFX (5+)                 |
| **Economy**                                           | Cap 1 gratuito, Caps 2-3: 5 créditos cada, Caps 4-6: 10 créditos, Caps 7-9: 15 créditos |
| **Multiple Endings**                                  | 5 finais baseados nas variáveis acumuladas                                              |
| **Save System**                                       | 3 slots de save estratégicos em momentos-chave                                          |
| **Variables/Flags**                                   | 5 variáveis rastreáveis que afetam escolhas e finais                                    |

---

## 🌆 Universo & Ambientação

### As Três Camadas de Neo São Paulo

```
┌─────────────────────────────────────────────────┐
│                 CRISTA (Upper Spires)            │
│  Corporações, Elite, IA Central, Dados Puros     │
│  Ar puro, segurança máxima, vigilância total     │
├─────────────────────────────────────────────────┤
│             ENTRE-CAMADAS (Mid-Layers)           │
│  Mercadores, Hackers, Clínicas Clandestinas      │
│  Zona franca, anarquia controlada, mercado negro │
├─────────────────────────────────────────────────┤
│              SUBMUNDO (Underbelly)               │
│  Favelas high-tech, chuva ácida, gangues         │
│  Recicladores, refugiados, resistência armada    │
└─────────────────────────────────────────────────┘
```

### Tecnologias-Chave

- **Implantes Neurais (Nexus)**: Chip cerebral que conecta humanos à Rede. 94% da população tem um.
- **Data-Shards**: Fragmentos de dados criptografados armazenados em implantes.
- **ICE (Intrusion Countermeasures Electronic)**: Firewalls neurais que protegem dados — e podem matar.
- **Synthetica**: Androides com diferentes níveis de consciência.
- **The Grid**: A internet neural que conecta todos os implantes.

---

## 👤 Personagens

### Protagonista

| Atributo             | Valor                                                        |
| -------------------- | ------------------------------------------------------------ |
| **Nome**             | Zara "Ghost" Oliveira                                        |
| **Idade**            | 24                                                           |
| **Background**       | Ex-engenheira da OmniTech, especialista em implantes neurais |
| **Motivação**        | Expor o Projeto Eco — e sobreviver                           |
| **Conflito Interno** | Vingança vs. Justiça; Individualismo vs. Coletivismo         |
| **Sprite**           | `zara_default` (roupa de rua cyberpunk, jaqueta com LED)     |

### Aliados

| Personagem         | Papel                                                    | Localização   | Condição de Aparição          |
| ------------------ | -------------------------------------------------------- | ------------- | ----------------------------- |
| **Ana "Flicker"**  | Hacker das Entre-Camadas, ex-colega de Zara              | Entre-Camadas | Sempre aparece (Cap 2)        |
| **Tenente Marcos** | Policial corrupto com código de honra                    | Submundo      | `trust_ana >= 2` (Cap 3)      |
| **Unit-7**         | Androide com falha de consciência                        | Crista        | `humanity_index >= 3` (Cap 5) |
| **Dra. Yuki**      | Cientista desertora da OmniTech, criadora do Projeto Eco | Crista        | Revelação no Cap 7            |

### Antagonistas

| Personagem        | Papel                                                | Localização                    |
| ----------------- | ---------------------------------------------------- | ------------------------------ |
| **Kael**          | Ex-parceiro de Zara, agora Executivo Jr. da OmniTech | Crista                         |
| **Diretora Voss** | CEO da OmniTech, mente por trás do Projeto Eco       | Crista                         |
| **ICE-Hunter**    | Programa de segurança neural que caça Zara           | Onipresente (ameaça sistêmica) |

---

## 📊 Variáveis do Sistema

| Variável         | Tipo         | Início | Descrição                                                       |
| ---------------- | ------------ | ------ | --------------------------------------------------------------- |
| `heat_level`     | number (0-5) | 1      | Nível de atenção das corporações. Afeta encontros com inimigos. |
| `trust_ana`      | number (0-5) | 0      | Confiança da hacker Ana. Determina ajuda técnica recebida.      |
| `credits`        | number       | 50     | Créditos para comprar itens, subornos, acesso.                  |
| `humanity_index` | number (0-5) | 3      | Mede empatia/ética. Afeta relações com androides e final.       |
| `has_implante`   | boolean      | true   | Se Zara ainda tem o implante (pode ser removido).               |

---

## 🏗️ Estrutura de Arcos

```
ARCO 1: DESPERTAR NO SUBMUNDO (Cap 1-3)
  └─ Introdução, fuga inicial, primeiras alianças

ARCO 2: A ESCALADA (Cap 4-6)
  └─ Jornada pelas Entre-Camadas, hacking, escolhas morais

ARCO 3: O COLAPSO (Cap 7-9)
  └─ Infiltração na Crista, confronto final, resolução
```

---

## 🌳 Árvore de Finais

| #     | Nome                  | Condições                                                          | Descrição                                                                                                                      |
| ----- | --------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| **A** | **A Verdade Liberta** | `heat_level <= 2 AND humanity_index >= 4 AND trust_ana >= 4`       | Zara expõe o Projeto Eco ao público. A OmniTech cai. Ela vira símbolo de resistência.                                          |
| **B** | **Rainha das Cinzas** | `heat_level >= 4 AND humanity_index <= 1 AND credits >= 100`       | Zara toma o controle do Projeto Eco para si. Torna-se a nova Diretora Voss — o sistema muda de mãos, mas não de natureza.      |
| **C** | **O Preço da Paz**    | `trust_ana >= 4 AND humanity_index >= 2 AND has_implante == false` | Zara negocia com a OmniTech: destrói o data-shard em troca de reformas. Vitória parcial, mas o sistema sobrevive.              |
| **D** | **Ghost in the Grid** | `heat_level == 5 AND has_implante == true`                         | Zara é capturada pelo ICE-Hunter. Sua consciência é absorvida pelo Projeto Eco — ela se torna parte da IA que queria destruir. |
| **E** | **Fugitiva Eterna**   | Nenhuma condição específica (fallback)                             | Zara destrói o data-shard e foge da cidade. Sem provas, o Projeto Eco continua. Ela sobrevive, mas nada muda.                  |

---

## 🎭 Configuração de IA (LLM)

```json
{
  "ia_enabled": true,
  "ia_persona": "Narrador cyberpunk noir — voz grave, poética e crua. Descreve a cidade como um organismo vivo, onde cada beco tem uma história e cada chuva ácida lava pecados. Usa metáforas tecnológicas e sensoriais. Ritmo: frases curtas nas cenas de ação, longas e introspectivas nos momentos de silêncio.",
  "ia_system_prompt": "Você é o narrador de NEON REFÚGIO, uma visual novel cyberpunk ambientada em Neo São Paulo, 2157. A atmosfera é noir, opressiva e bela. Cada cena deve evocar os sentidos: o cheiro de ozônio depois da chuva ácida, o zumbido dos drones, o gosto metálico do ar reciclado. Mantenha o tom consistente. Gere continuidade narrativa quando as escolhas do jogador saírem dos ramos pré-definidos. Respeite as variáveis de estado (heat_level, trust_ana, credits, humanity_index, has_implante) e ajuste o tom conforme os valores.",
  "ia_max_tokens": 500
}
```

---

## 🎨 Assets Necessários

### Backgrounds

| ID                          | Descrição                                                     | Tipo       |
| --------------------------- | ------------------------------------------------------------- | ---------- |
| `bg_submundo_rua`           | Rua do Submundo: neônio quebrado, chuva, lixo high-tech       | background |
| `bg_submundo_apartamento`   | Apartamento de Zara: pequeno, telas de dados, vista da cidade | background |
| `bg_entre_camadas_mercado`  | Mercado negro: barracas, hologramas, drones                   | background |
| `bg_entre_camadas_clinica`  | Clínica clandestina: iluminação verde, equipamento cirúrgico  | background |
| `bg_entre_camadas_servidor` | Sala de servidores: luzes piscando, cabos, calor              | background |
| `bg_crista_corporativo`     | Sede OmniTech: vidro, aço, minimalismo opressivo              | background |
| `bg_crista_laboratorio`     | Laboratório do Projeto Eco: tanques de dados, hologramas      | background |
| `bg_crista_terraco`         | Terraço da Crista: vista das nuvens, neônio abaixo            | background |

### Character Sprites

| ID              | Personagem     | Variações                        |
| --------------- | -------------- | -------------------------------- |
| `sprite_zara`   | Zara           | default, injured, hooded, formal |
| `sprite_ana`    | Ana "Flicker"  | default, hacking, worried        |
| `sprite_kael`   | Kael           | default, angry, conflicted       |
| `sprite_marcos` | Tenente Marcos | default, armed                   |
| `sprite_unit7`  | Unit-7         | default, damaged, awakened       |
| `sprite_voss`   | Diretora Voss  | default, cold_rage               |

### Áudio

| ID                   | Descrição                                  | Tipo  |
| -------------------- | ------------------------------------------ | ----- |
| `bgm_submundo`       | Synthwave dark com batidas industriais     | music |
| `bgm_entre_camadas`  | Ambient eletrônico com toques de jazz noir | music |
| `bgm_crista`         | Orquestral minimalista com drones graves   | music |
| `sfx_chuva_acida`    | Chuva ácida caindo em metal                | sfx   |
| `sfx_neural_connect` | Som de conexão neural (zumbido + glitch)   | sfx   |
| `sfx_drone_pass`     | Drone passando próximo                     | sfx   |
| `sfx_hack_success`   | Hack bem-sucedido (click + power down)     | sfx   |
| `sfx_ice_alert`      | Alerta de ICE (alarme sintético)           | sfx   |

---

## 📐 Estrutura Detalhada: Arcos, Capítulos, Cenas e Escolhas

### ARCO 1: DESPERTAR NO SUBMUNDO

---

#### Capítulo 1: "72 Horas" — GRÁTIS

> **Resumo:** Zara acorda em seu apartamento no Submundo após a fuga da OmniTech. O data-shard está fragmentado e o kill-switch foi ativado. Ela tem 72 horas. A primeira pista leva às Entre-Camadas.

**Cena 1.1 — "O Despertar"** (narration)

- **Background:** `bg_submundo_apartamento`
- **Música:** `bgm_submundo`
- **SFX:** `sfx_chuva_acida`
- **Content:** Zara acorda com dor de cabeça. Verifica o implante: 72h no contador. O apartamento está revirado — a OmniTech já passou por aqui. Uma mensagem pisca no terminal: "A clínica ainda está de pé. — A"
- **Próxima cena:** 1.2

**Cena 1.2 — "Mensagem na Chuva"** (dialogue)

- **Background:** `bg_submundo_rua`
- **Sprite:** `sprite_zara` (hooded)
- **Content:** Zara caminha pelas ruas do Submundo. Chuva ácida. Drones de vigilância. Ela se comunica via texto com "A" (Ana). Diálogo revela a traição de Kael.
- **TextBlocks:** [narração descritiva] → [diálogo via texto com Ana] → [thought: monólogo interno sobre Kael]
- **Próxima cena:** 1.3

**Cena 1.3 — "Encontro com a Sombra"** (choice)

- **Background:** `bg_submundo_rua`
- **Sprite:** `sprite_zara` (hooded)
- **Content:** Um vulto segue Zara. Ela precisa decidir como reagir.
- **Escolhas:**

| ID               | Texto                                                 | Target | Condição              | Efeitos                                  |
| ---------------- | ----------------------------------------------------- | ------ | --------------------- | ---------------------------------------- |
| `ch1_3_confront` | **Enfrentar o perseguidor** — "Chega de correr."      | 1.4a   | —                     | `heat_level += 1`, `humanity_index -= 1` |
| `ch1_3_hide`     | **Se esconder no beco** — "Não posso ser pega agora." | 1.4b   | —                     | —                                        |
| `ch1_3_talk`     | **Tentar dialogar** — "Quem é você? O que quer?"      | 1.4c   | `humanity_index >= 2` | `trust_ana += 1`                         |

**Cena 1.4a — "Confronto no Beco"** (dialogue)

- O perseguidor é um mercenário de baixo escalão da OmniTech. Zara o domina, mas atrai atenção.
- `heat_level += 1`. Zara obtém um cartão de acesso.
- **Próxima:** 1.5

**Cena 1.4b — "Nas Sombras"** (narration)

- Zara se esconde. O vulto passa direto. Ela percebe que está ficando boa nisso.
- **Próxima:** 1.5

**Cena 1.4c — "Uma Voz Amiga"** (dialogue)

- O "perseguidor" é na verdade um contato de Ana, enviado para proteger Zara. Ele entrega um pacote.
- `trust_ana += 1`. Zara recebe um disruptor de sinal.
- **Próxima:** 1.5

**Cena 1.5 — "Rumo às Entre-Camadas"** (narration)

- **Background:** `bg_submundo_rua` (transição visual para elevador)
- Zara chega ao elevador que conecta o Submundo às Entre-Camadas. Fim do capítulo.
- **Auto-save recomendado.**

---

#### Capítulo 2: "A Hacker e o fantasma" — 5 CRÉDITOS

> **Resumo:** Zara chega às Entre-Camadas e encontra Ana "Flicker", sua antiga colega. Juntas, tentam acessar o primeiro fragmento do data-shard. Mas a OmniTech está um passo à frente.

**Cena 2.1 — "Entre-Camadas"** (narration)

- **Background:** `bg_entre_camadas_mercado`
- **Música:** `bgm_entre_camadas`
- **Content:** Descrição vívida do mercado: cores, cheiros, hologramas ilegais, cromo por toda parte. Zara segue as coordenadas de Ana.
- **Próxima:** 2.2

**Cena 2.2 — "Reencontro"** (dialogue)

- **Background:** `bg_entre_camadas_mercado`
- **Sprites:** `sprite_zara`, `sprite_ana` (default)
- **Content:** Ana recebe Zara em seu esconderijo. Diálogo revela a história delas: trabalharam juntas na OmniTech, Ana saiu antes por discordar dos rumos éticos. Ela tem um servidor clandestino que pode acessar o data-shard.
- **Próxima:** 2.3

**Cena 2.3 — "O Servidor"** (narration)

- **Background:** `bg_entre_camadas_servidor`
- **Content:** Ana conecta Zara ao servidor. Imersão no Grid. Visualização abstrata do data-shard: três fragmentos, um já acessível, dois bloqueados por ICE.
- **Próxima:** 2.4

**Cena 2.4 — "Dançando com o Gelo"** (choice)

- **Background:** `bg_entre_camadas_servidor`
- **Sprites:** `sprite_zara`, `sprite_ana` (hacking)
- **SFX:** `sfx_neural_connect`
- **Content:** Para acessar o fragmento, Zara precisa enfrentar o ICE da OmniTech. Ana pode ajudar, mas é arriscado.
- **Escolhas:**

| ID                 | Texto                                                          | Target | Condição        | Efeitos                                                |
| ------------------ | -------------------------------------------------------------- | ------ | --------------- | ------------------------------------------------------ |
| `ch2_4_hack_solo`  | **Hackear sozinha** — "Eu conheço esse sistema. Deixa comigo." | 2.5a   | —               | Se `heat_level < 3`: sucesso. Senão: `heat_level += 1` |
| `ch2_4_hack_ana`   | **Deixar Ana liderar** — "Você é a melhor hacker que conheço." | 2.5b   | —               | `trust_ana += 2`                                       |
| `ch2_4_hack_brute` | **Forçar acesso bruto** — "Não temos tempo para sutilezas."    | 2.5c   | `credits >= 20` | `credits -= 20`, `heat_level += 2`                     |

**Cena 2.5a — "Solo Run"** (dialogue)

- Zara navega o ICE com habilidade. Fragmento desbloqueado. Primeira revelação do Projeto Eco.
- **Próxima:** 2.6

**Cena 2.5b — "Dupla Dinâmica"** (dialogue)

- Ana e Zara trabalham em sincronia. Flashbacks da época de OmniTech. Fragmento desbloqueado com dados extras.
- `trust_ana += 1` extra.
- **Próxima:** 2.6

**Cena 2.5c — "Força Bruta"** (narration)

- O hack funciona, mas ativa alarmes. `heat_level += 2`. Agentes da OmniTech são despachados para as Entre-Camadas.
- **Próxima:** 2.6

**Cena 2.6 — "O Primeiro Fragmento"** (narration + thought)

- **Content:** Zara processa o fragmento. Imagens: pessoas conectadas a uma rede neural coletiva. O Projeto Eco não é apenas vigilância — é controle de massa. Uma voz sintética ecoa: _"Bem-vinda de volta, Engenheira Oliveira."_
- **Fim do Capítulo.** `contador: 48h restantes`.

---

#### Capítulo 3: "O Tênue Fio da Lei" — 5 CRÉDITOS

> **Resumo:** O segundo fragmento está em um cofre físico da OmniTech no Submundo. Zara precisa de ajuda para invadi-lo. Um policial corrupto pode ser a chave — ou a perdição.

**Cena 3.1 — "De Volta ao Submundo"** (narration)

- **Background:** `bg_submundo_rua`
- Zara retorna ao Submundo. O calor está mais alto — drones de reconhecimento por toda parte.
- Se `heat_level >= 3`: encontro com uma patrulha. Zara precisa se esconder.
- **Próxima:** 3.2

**Cena 3.2 — "O Tenente"** (dialogue)

- **Background:** `bg_submundo_rua`
- **Sprites:** `sprite_zara`, `sprite_marcos`
- **Content:** Zara encontra o Tenente Marcos em um bar decadente. Ele está bêbado, desiludido com o sistema. Diálogo tenso: ele sabe quem ela é. Sabe o que ela carrega.
- **Condição:** Se `trust_ana < 2`, Marcos é hostil. Se `trust_ana >= 2`, Ana já o contatou e ele está disposto a ajudar.
- **Próxima:** 3.3

**Cena 3.3 — "O Acordo"** (choice)

- **Content:** Marcos propõe um acordo: ele ajuda Zara a invadir o cofre, em troca de limpar seu nome dos registros da OmniTech quando tudo isso acabar.

| ID                | Texto                                                             | Target | Condição              | Efeitos                                     |
| ----------------- | ----------------------------------------------------------------- | ------ | --------------------- | ------------------------------------------- |
| `ch3_3_accept`    | **Aceitar o acordo** — "Fechado. Preciso de toda ajuda possível." | 3.4a   | —                     | `trust_ana += 1`                            |
| `ch3_3_negotiate` | **Negociar** — "Me ajude primeiro, depois conversamos."           | 3.4b   | `humanity_index >= 3` | `credits -= 30` (suborno)                   |
| `ch3_3_refuse`    | **Recusar** — "Não confio em policiais."                          | 3.4c   | —                     | `humanity_index -= 1`. Zara invade sozinha. |

**Cena 3.4a — "Plano em Equipe"** (narration)

- Marcos conhece as brechas de segurança. Infiltração tática. `heat_level` não aumenta.
- **Próxima:** 3.5

**Cena 3.4b — "Suborno Aceito"** (dialogue)

- Marcos aceita os créditos. Relutantemente, ele lidera o caminho.
- **Próxima:** 3.5

**Cena 3.4c — "Invasão Solo"** (narration)

- Zara invade sozinha. Mais difícil, mas ela consegue. `heat_level += 1`.
- **Próxima:** 3.5

**Cena 3.5 — "Dentro do Cofre"** (narration + choice)

- **Background:** (novo: interior do cofre corporativo)
- Zara acessa o cofre. O segundo fragmento está lá. Mas Kael aparece em um holograma.
- **Escolha final do capítulo:**

| ID             | Texto                                | Target | Efeitos                                          |
| -------------- | ------------------------------------ | ------ | ------------------------------------------------ |
| `ch3_5_talk`   | **Ouvir o que Kael tem a dizer**     | 3.6a   | Diálogo com Kael; revelação do motivo da traição |
| `ch3_5_ignore` | **Ignorar Kael e pegar o fragmento** | 3.6b   | `humanity_index -= 1`                            |

**Cena 3.6a — "As Palavras de Kael"** (dialogue)

- Kael revela que entregou Zara para protegê-la — a OmniTech já sabia dela. Sua "traição" foi a única forma de mantê-la viva. Zara não sabe se acredita.
- **Fim do Capítulo.** `contador: 36h restantes`.

**Cena 3.6b — "Silêncio"** (narration)

- Zara pega o fragmento sem olhar para trás. O holograma de Kael se desfaz.
- **Fim do Capítulo.** `contador: 36h restantes`.

---

### ARCO 2: A ESCALADA

---

#### Capítulo 4: "Synthetica" — 10 CRÉDITOS

> **Resumo:** O terceiro fragmento está nos níveis superiores das Entre-Camadas, em uma instalação de manufatura de androides. Zara encontra Unit-7, um androide com uma falha única: ele desenvolveu curiosidade.

**Cena 4.1 — "A Fábrica"** (narration)

- **Background:** (novo: fábrica de androides)
- **Música:** `bgm_entre_camadas`
- **SFX:** `sfx_drone_pass`
- Descrição da linha de montagem: corpos sintéticos pendurados, olhos vazios, o cheiro de ozônio e plástico novo.
- **Próxima:** 4.2

**Cena 4.2 — "Unit-7"** (dialogue)

- **Sprites:** `sprite_zara`, `sprite_unit7` (default)
- Zara é detectada por um androide. Mas ele não chama segurança. Ele pergunta: "Você também está perdida?"
- Unit-7 desenvolveu uma falha de consciência. Ele quer entender o que é ser humano.
- **Próxima:** 4.3

**Cena 4.3 — "O Que Nos Torna Humanos"** (choice)

- **Content:** Unit-7 oferece ajudar Zara a encontrar o fragmento. Em troca, quer que ela responda uma pergunta.

| ID                | Texto                                                              | Target | Efeitos                                                        |
| ----------------- | ------------------------------------------------------------------ | ------ | -------------------------------------------------------------- |
| `ch4_3_empathy`   | **"Humanidade é empatia. Você já a tem."**                         | 4.4a   | `humanity_index += 1`, Unit-7 se torna aliado leal             |
| `ch4_3_logic`     | **"Humanidade é uma ilusão. Somos todos máquinas biológicas."**    | 4.4b   | `humanity_index -= 1`, Unit-7 questiona sua própria existência |
| `ch4_3_pragmatic` | **"Não tenho tempo para filosofia. Me ajude ou saia do caminho."** | 4.4c   | Unit-7 ajuda por obrigação, não por escolha                    |

**Cena 4.4 — "O Núcleo de Dados"** (narration)

- Unit-7 leva Zara ao núcleo de dados da fábrica. O terceiro fragmento está aqui.
- **Próxima:** 4.5

**Cena 4.5 — "Fragmento Final"** (dialogue)

- **SFX:** `sfx_hack_success`
- O último fragmento revela a escala completa do Projeto Eco: **300 milhões de pessoas** têm implantes Nexus. Todas estão conectadas à rede neural coletiva. A OmniTech pode, a qualquer momento, ativar o "modo colmeia" — controle total da população.
- **Fim do Capítulo.** `contador: 24h restantes`.

---

#### Capítulo 5: "O Peso da Escolha" — 10 CRÉDITOS

> **Resumo:** Com todos os fragmentos reunidos, Zara enfrenta uma decisão: subir para a Crista e confrontar a OmniTech, ou vazar os dados anonimamente e fugir. Unit-7 e Ana têm opiniões divergentes.

**Cena 5.1 — "Conselho de Guerra"** (dialogue)

- **Background:** `bg_entre_camadas_mercado`
- **Sprites:** `sprite_zara`, `sprite_ana`, `sprite_unit7` (se aliado), `sprite_marcos` (se aliado)
- Reunião com todos os aliados disponíveis. Debate sobre o próximo passo.
- **Próxima:** 5.2

**Cena 5.2 — "Divergências"** (dialogue + thought)

- Ana quer vazar os dados: "Expor é mais seguro. O mundo decide o que fazer."
- Unit-7 (se aliado) quer destruir o sistema: "O Projeto Eco é uma abominação. Deve ser eliminado."
- Marcos (se aliado) sugere chantagem: "Use os dados como moeda de troca."
- Zara ouve todos. A decisão é dela.
- **Próxima:** 5.3

**Cena 5.3 — "A Escolha de Zara"** (choice — DEFINE O ARCO 3)

| ID                | Texto                                                                              | Target         | Condição         | Efeitos               |
| ----------------- | ---------------------------------------------------------------------------------- | -------------- | ---------------- | --------------------- |
| `ch5_3_expose`    | **Subir para a Crista e expor tudo** — "O mundo precisa saber."                    | Cap 6 (Rota A) | —                | `humanity_index += 1` |
| `ch5_3_destroy`   | **Destruir o Projeto Eco por dentro** — "Usar o data-shard como arma."             | Cap 6 (Rota B) | `trust_ana >= 3` | `humanity_index -= 1` |
| `ch5_3_negotiate` | **Negociar com a OmniTech** — "Talvez dê para consertar o sistema sem destruí-lo." | Cap 6 (Rota C) | `credits >= 50`  | —                     |

**Fim do Capítulo.** `contador: 12h restantes`.

---

#### Capítulo 6: "A Subida" — 10 CRÉDITOS

> **PONTO DE RAMIFICAÇÃO PRINCIPAL** — Este capítulo tem 3 versões independentes (Rota A, B ou C), dependendo da escolha no Capítulo 5.

---

##### ROTA A — EXPOR (Zara escolheu "Subir para a Crista e expor tudo")

**Cena 6A.1 — "Plano de Invasão"** (dialogue)

- **Background:** `bg_entre_camadas_mercado`
- **Sprites:** `sprite_zara`, `sprite_ana` (hacking), `sprite_marcos` (se aliado)
- **Content:** Ana revela que a única forma de transmitir os dados para o mundo é usando a antena central da OmniTech no topo da Crista. É uma transmissão impossível de bloquear — mas também impossível de acessar sem credenciais de nível máximo. Marcos (se aliado) conhece uma rota de serviço. Zara prepara o equipamento.
- **TextBlocks:** [diálogo: Ana explica o plano] → [thought: Zara pensa no risco] → [diálogo: Marcos revela a rota]
- **Próxima:** 6A.2

**Cena 6A.2 — "Kael"** (dialogue)

- **Background:** `bg_entre_camadas_mercado`
- **Sprites:** `sprite_zara`, `sprite_kael` (conflicted)
- **Content:** Kael intercepta Zara antes da subida. Ele não veio como inimigo. Revela que a OmniTech sabia da investigação de Zara desde o início — ele a entregou para ganhar tempo e descobrir uma brecha no sistema de segurança. Entrega a Zara um código de acesso: o elevador privado da Diretora Voss. "Eu não sou o monstro que você pensa. Mas também não sou o herói que queria ser."
- **Escolha:**

| ID               | Texto                                                         | Target | Efeitos                                                                |
| ---------------- | ------------------------------------------------------------- | ------ | ---------------------------------------------------------------------- |
| `ch6a_2_forgive` | **Perdoar Kael** — "Nunca vou esquecer. Mas posso entender."  | 6A.3a  | `humanity_index += 1`. Kael se junta à equipe como aliado.             |
| `ch6a_2_reject`  | **Rejeitar Kael** — "Você me traiu. Palavras não mudam isso." | 6A.3b  | `humanity_index -= 1`. Kael vai embora. Zara usa o código mesmo assim. |

**Cena 6A.3a — "Equipe Completa"** (narration)

- Com Kael na equipe, o plano fica mais sólido. Ele conhece os protocolos internos. Zara, Ana, Kael, Marcos (se aliado) e Unit-7 (se aliado) sobem juntos.
- **Próxima:** 6A.4

**Cena 6A.3b — "Código Frio"** (narration)

- Zara usa o código de Kael, mas sem ele. O acesso é mais arriscado, mas possível.
- **Próxima:** 6A.4

**Cena 6A.4 — "O Elevador"** (narration)

- **Background:** (novo: interior do elevador da Crista, subindo)
- **SFX:** `sfx_neural_connect`
- Zara e equipe sobem no elevador privado da Diretora Voss. A cidade se revela através do vidro: camadas de miséria, depois comércio, depois luxo. Zara vê o Submundo pela última vez.
- **TextBlocks:** [narração: descrição visual da subida] → [thought: Zara reflete sobre tudo que passou]
- **Próxima:** Capítulo 7 (contínuo em todas as rotas)

---

##### ROTA B — DESTRUIR (Zara escolheu "Destruir o Projeto Eco por dentro")

**Cena 6B.1 — "Arma Digital"** (dialogue)

- **Background:** `bg_entre_camadas_servidor`
- **Sprites:** `sprite_zara`, `sprite_ana` (hacking)
- **Content:** Ana e Zara desenvolvem um vírus — o "Eco-Breaker" — usando o próprio data-shard como vetor. Se inserido no núcleo do Projeto Eco, pode corromper todo o sistema. Mas precisa ser implantado fisicamente, no data center principal da Crista.
- **Próxima:** 6B.2

**Cena 6B.2 — "O Preço da Destruição"** (choice)

- **Content:** Ana alerta: destruir o Projeto Eco também vai derrubar a infraestrutura de implantes da cidade. Milhões de pessoas podem sofrer danos neurais temporários. Alguns podem morrer.

| ID                | Texto                                                        | Target | Efeitos                                                                                 |
| ----------------- | ------------------------------------------------------------ | ------ | --------------------------------------------------------------------------------------- |
| `ch6b_2_continue` | **"Seguir em frente. O sistema precisa cair."**              | 6B.3   | `humanity_index -= 2`. Plano mantido.                                                   |
| `ch6b_2_mitigate` | **"Precisamos de um failsafe. Algo que minimize os danos."** | 6B.3   | `humanity_index += 1`. Ana desenvolve um failsafe (leva mais tempo, `heat_level += 1`). |

**Cena 6B.3 — "Unit-7 e o Sacrifício"** (dialogue)

- **Background:** `bg_entre_camadas_servidor`
- **Sprites:** `sprite_zara`, `sprite_unit7` (awakened)
- **Condição:** Unit-7 precisa ser aliado (Cap 4.3 escolha empathy).
- **Content:** Unit-7 se voluntaria para carregar o vírus. Como androide, ele pode acessar áreas onde humanos não passam. Mas se o vírus for ativado, sua matriz de consciência será apagada — ele deixará de existir. "Eu nasci de uma falha. Talvez seja poético que eu morra por uma escolha."
- **Próxima:** 6B.4

**Cena 6B.4 — "Infiltração Silenciosa"** (narration)

- Zara e Unit-7 sobem para a Crista por rotas de manutenção. Sem aliados humanos além de Ana (que fica monitorando remotamente). A subida é solitária.
- **Próxima:** Capítulo 7

---

##### ROTA C — NEGOCIAR (Zara escolheu "Negociar com a OmniTech")

**Cena 6C.1 — "Canais Clandestinos"** (dialogue)

- **Background:** `bg_entre_camadas_mercado`
- **Sprites:** `sprite_zara`, `sprite_ana` (worried)
- **Content:** Ana está frustrada. "Negociar com a OmniTech é como negociar com um tubarão — você só descobre que perdeu quando já está dentro da boca." Mas ela concorda em ajudar. Usa seus contatos para enviar uma mensagem criptografada à Diretora Voss.
- **Próxima:** 6C.2

**Cena 6C.2 — "A Resposta"** (narration)

- **SFX:** `sfx_neural_connect`
- A resposta chega em 12 minutos. A Diretora Voss aceita se encontrar. Mas em território neutro: o Salão de Cristal, um restaurante no limite entre as Entre-Camadas e a Crista. "Venha sozinha. Sem truques. Sem gravações." Zara sabe que é uma armadilha em potencial.
- **Próxima:** 6C.3

**Cena 6C.3 — "Preparação"** (choice)

- Zara se prepara para o encontro. Ela pode ir com seguro ou confiar na palavra de Voss.

| ID              | Texto                                                                     | Target | Efeitos                                                  |
| --------------- | ------------------------------------------------------------------------- | ------ | -------------------------------------------------------- |
| `ch6c_3_alone`  | **Ir sozinha** — "Se é uma negociação, preciso mostrar confiança."        | 6C.4   | `humanity_index += 1`. Sem backup.                       |
| `ch6c_3_backup` | **Ana de backup remoto** — "Fique de olho. Se algo der errado..."         | 6C.4   | `credits -= 20` (equipamento), Ana monitora remotamente. |
| `ch6c_3_armed`  | **Ir armada e com disruptor** — "Confiança é bom, mas paranoia é melhor." | 6C.4   | `humanity_index -= 1`. Zara leva armas escondidas.       |

**Cena 6C.4 — "O Salão de Cristal"** (dialogue)

- **Background:** (novo: restaurante de luxo na divisa das camadas)
- **Sprites:** `sprite_zara` (formal), `sprite_voss` (cold_rage)
- **SFX:** `sfx_chuva_acida` (ao longe)
- Zara encontra a Diretora Voss. A CEO é uma mulher de 60 anos, cabelos prateados, olhos que parecem ler sua mente. O diálogo é tenso, educado e cheio de subtexto. Voss oferece algo inesperado: "Você é brilhante, Zara. O Projeto Eco precisa de mentes como a sua. Destruí-lo seria um desperdício. Junte-se a mim. Nós podemos... redirecioná-lo."
- **Escolha crucial:**

| ID                | Texto                                                           | Target         | Efeitos                                                                      |
| ----------------- | --------------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------- |
| `ch6c_4_consider` | **"Vou considerar. Mas com condições."**                        | Cap 7 (Rota C) | Zara mantém a negociação aberta.                                             |
| `ch6c_4_refuse`   | **"Não. Você acha que pode me comprar como comprou Kael?"**     | Cap 7 (Rota C) | Negociação azeda. Voss ativa segurança. Zara foge.                           |
| `ch6c_4_pretend`  | **(Fingir aceitar)** — "Estou dentro. Me mostre o Projeto Eco." | Cap 7 (Rota C) | Zara finge se aliar para acessar o núcleo do sistema. `humanity_index -= 1`. |

- **Próxima:** Capítulo 7

---

### ARCO 3: O COLAPSO

---

#### Capítulo 7: "Crista" — 15 CRÉDITOS

> Este capítulo converge elementos das 3 rotas. O cenário é a Crista, mas o contexto muda.

**Cena 7.1 — "O Topo do Mundo"** (narration)

- **Background:** `bg_crista_corporativo`
- **Música:** `bgm_crista`
- **SFX:** `sfx_drone_pass`
- **Content:** A Crista é deslumbrante e aterrorizante. Ar puro. Silêncio artificial. Tudo é limpo, branco, frio. Não há pessoas nas ruas — apenas androides de serviço e drones de vigilância. Zara sente o contraste: ela passou a vida inteira no Submundo. Este lugar não foi feito para ela.

**Variações por rota:**

- **Rota A (Expor):** Zara está com sua equipe. Eles se dividem: Ana e Kael vão para a sala de servidores, Zara e Marcos para a antena.
- **Rota B (Destruir):** Zara está com Unit-7. Eles precisam encontrar o data center físico. Unit-7 detecta a assinatura energética do núcleo.
- **Rota C (Negociar):** Zara está sozinha (ou com monitoramento remoto de Ana). Ela segue as coordenadas que Voss enviou — ou as que roubou durante a fuga.

- **Próxima:** 7.2

**Cena 7.2 — "A Dra. Yuki"** (dialogue)

- **Background:** `bg_crista_laboratorio`
- **Sprites:** `sprite_zara`, nova: `sprite_yuki` (cientista, olheiras, jaleco)
- **Content:** Em todas as rotas, Zara encontra a Dra. Yuki — a criadora original do Projeto Eco. Ela está escondida em um laboratório abandonado dentro da OmniTech. Yuki revela a verdade completa: o Projeto Eco não foi criado para controle de massa. Foi criado para **salvar a humanidade**. O Grande Colapso de 2089 foi causado por uma guerra de IA. O Projeto Eco era a defesa — uma rede neural humana coletiva que poderia resistir a ataques de inteligências artificiais hostis. Mas a Diretora Voss corrompeu o projeto, transformando defesa em arma de controle.

**Reação de Zara (varia por `humanity_index`):**

- `humanity_index >= 4`: "Ainda há esperança. Podemos restaurar o propósito original."
- `humanity_index <= 1`: "Não importa como começou. Só importa como termina."

**Yuki entrega a Zara o código-mestre do Projeto Eco.** Com ele, Zara pode: (a) expor os dados, (b) destruir o sistema, ou (c) reconfigurá-lo.

- **Próxima:** 7.3

**Cena 7.3 — "O ICE-Hunter"** (narration + choice)

- **Background:** `bg_crista_corporativo`
- **SFX:** `sfx_ice_alert`
- **Content:** O ICE-Hunter — o programa de segurança neural da OmniTech — finalmente alcança Zara. Não é um robô. Não é um humano. É uma presença: uma distorção no ar, um zumbido que dói nos dentes, uma voz que fala com o tom de todas as pessoas que já foram absorvidas pelo Projeto Eco.

**ICE-Hunter:** "Engenheira Oliveira. Seu implante está programado para desligar em 4 horas. Entregue o código-mestre e eu estenderei seu tempo. Resista... e eu extrairei seus dados neuralmente. Você não vai gostar do processo."

- **Escolha (COMUM a todas as rotas):**

| ID            | Texto                                                       | Target | Condição                                     | Efeitos                                                      |
| ------------- | ----------------------------------------------------------- | ------ | -------------------------------------------- | ------------------------------------------------------------ |
| `ch7_3_run`   | **Correr** — "Não posso enfrentar isso."                    | 7.4a   | —                                            | `heat_level += 1`                                            |
| `ch7_3_fight` | **Enfrentar com Override Neural** — "Você não me conhece."  | 7.4b   | `has_implante == true`                       | `heat_level += 2`. Zara usa o próprio implante contra o ICE. |
| `ch7_3_trick` | **Enganar com código falso** — "Aqui está o que você quer." | 7.4c   | `trust_ana >= 3` (Ana criou um código falso) | ICE é temporariamente distraído.                             |

**Cena 7.4a — "Fuga Desesperada"** (narration)

- Zara corre pelos corredores da OmniTech. O ICE a persegue. Ela se esconde em uma sala de manutenção.
- `heat_level += 1`. Zara perde tempo valioso.
- **Próxima:** 7.5

**Cena 7.4b — "Override Neural"** (narration)

- Zara usa seu implante Nexus para enviar um pulso de feedback ao ICE. O programa titubeia — ele não esperava que um humano usasse o próprio sistema contra ele.
- `heat_level += 2`. Mas o ICE recua temporariamente.
- **Próxima:** 7.5

**Cena 7.4c — "Código Falso"** (dialogue)

- Zara transmite o código falso que Ana preparou. O ICE processa, detecta a falsificação, mas perde segundos preciosos. Zara escapa.
- **Próxima:** 7.5

**Cena 7.5 — "O Núcleo"** (narration)

- **Background:** `bg_crista_laboratorio`
- **SFX:** `sfx_neural_connect`
- Zara chega ao núcleo do Projeto Eco. É uma esfera de dados pulsante: bilhões de conexões neurais representadas como filamentos de luz. É bonito e aterrorizante. Ela insere o código-mestre. O sistema reconhece sua assinatura neural.
- **Fim do Capítulo.** `contador: 2h restantes`.

---

#### Capítulo 8: "Confronto" — 15 CRÉDITOS

**Cena 8.1 — "A Diretora"** (dialogue)

- **Background:** `bg_crista_laboratorio`
- **Sprites:** `sprite_zara`, `sprite_voss` (cold_rage)
- **Content:** A Diretora Voss aparece. Não como holograma — pessoalmente. Ela está calma. "Você chegou mais longe do que qualquer um. Parabéns. Mas você realmente acha que um código-mestre vai mudar alguma coisa? Eu construí este sistema. Eu posso desconstruí-lo. A questão é: o que você vai fazer agora, Engenheira Oliveira?"

- **Escolha FINAL:**

| ID                | Texto                                                      | Target        | Condição                |
| ----------------- | ---------------------------------------------------------- | ------------- | ----------------------- |
| `ch8_1_expose`    | **Transmitir os dados para o mundo**                       | 8.2-EXPOSE    | Rota A ou escolha livre |
| `ch8_1_destroy`   | **Iniciar o Eco-Breaker e destruir tudo**                  | 8.2-DESTROY   | Rota B ou escolha livre |
| `ch8_1_reconfig`  | **Reconfigurar o Projeto Eco para seu propósito original** | 8.2-RECONFIG  | `humanity_index >= 3`   |
| `ch8_1_seize`     | **Tomar o controle do sistema para si**                    | 8.2-SEIZE     | `humanity_index <= 2`   |
| `ch8_1_surrender` | **Entregar o código-mestre em troca da própria vida**      | 8.2-SURRENDER | —                       |

---

##### RAMO EXPOR (TRANSMITIR)

**Cena 8.2-EXPOSE — "Sinal Aberto"** (narration)

- Zara ativa a antena central. O sinal começa a transmitir. Telas por toda Neo São Paulo mostram os dados do Projeto Eco. Nas ruas do Submundo, nas Entre-Camadas, na Crista — todos veem.
- **Background:** alterna entre `bg_crista_terraco` e descrições das reações nas outras camadas.
- **Próxima:** 8.3-EXPOSE

**Cena 8.3-EXPOSE — "A Queda"** (dialogue)

- Voss tenta interromper a transmissão. Mas é tarde. Seguranças da OmniTech hesitam — eles também têm implantes. Eles também estão na rede. Alguns baixam as armas.
- **TextBlocks:** [diálogo: Voss tenta negociar] → [narração: as reações em cadeia pela cidade] → [diálogo: Kael ou Ana (se presentes) confrontam Voss]
- **Próxima:** Capítulo 9 (Final A ou C)

---

##### RAMO DESTROY (ECO-BREAKER)

**Cena 8.2-DESTROY — "Vírus Ativado"** (narration)

- O Eco-Breaker começa a corromper o sistema. Filamentos de luz se apagam. A esfera de dados pulsa erraticamente.
- **SFX:** `sfx_ice_alert` (distorcido)
- Se Unit-7 está carregando o vírus: cena emocional de despedida. "Obrigado por me ensinar o que é humanidade."
- **Próxima:** 8.3-DESTROY

**Cena 8.3-DESTROY — "Colapso em Cadeia"** (narration)

- O Projeto Eco começa a ruir. Mas o colapso não é limpo — sistemas por toda a cidade começam a falhar. Drones caem do céu. Telas piscam. Pessoas sentem um branco neural momentâneo.
- Voss observa, horrorizada. "Você não sabe o que fez."
- **Próxima:** Capítulo 9 (Final B ou D)

---

##### RAMO RECONFIG (RESTAURAR)

**Cena 8.2-RECONFIG — "Reset"** (narration + dialogue)

- Zara usa o código-mestre para restaurar a programação original do Projeto Eco. A rede neural coletiva se transforma: de arma de controle para escudo de defesa.
- **TextBlocks:** [narração: descrição poética da transformação dos dados] → [diálogo: Yuki aparece e ajuda na transição]
- **Próxima:** 8.3-RECONFIG

**Cena 8.3-RECONFIG — "Um Novo Propósito"** (dialogue)

- Voss está derrotada, mas não morta. "Você acha que isso muda alguma coisa? O sistema sempre encontra um jeito." Zara responde: "O sistema somos nós. E nós acabamos de mudar."
- **Próxima:** Capítulo 9 (Final A)

---

##### RAMO SEIZE (TOMAR O CONTROLE)

**Cena 8.2-SEIZE — "Coroada em Dados"** (narration)

- Zara não destrói, não expõe, não restaura. Ela toma. O código-mestre é reescrito com sua assinatura neural. O Projeto Eco agora responde a ela.
- **TextBlocks:** [narração: Zara sente o poder — 300 milhões de mentes conectadas, todas acessíveis] → [thought: "Eu poderia... mudar tudo. Do meu jeito."]
- **Próxima:** 8.3-SEIZE

**Cena 8.3-SEIZE — "A Nova Diretora"** (dialogue)

- Voss ri. "Eu sabia. No fundo, você é igual a mim." Zara não responde. Ela apenas sorri. Não há como saber se é um sorriso de vitória ou de rendição.
- **Próxima:** Capítulo 9 (Final B)

---

##### RAMO SURRENDER (ENTREGAR)

**Cena 8.2-SURRENDER — "Render-se"** (narration)

- Zara entrega o código-mestre. O kill-switch é desativado. Ela sobrevive. Mas o Projeto Eco continua.
- Voss cumpre a palavra: Zara é liberada. Exilada da Crista, proibida de falar. Mas viva.
- **Próxima:** Capítulo 9 (Final E)

---

#### Capítulo 9: "Neon Refúgio" — 15 CRÉDITOS (FINAL)

> Este capítulo é puramente narrativo — sem escolhas. Cada ramo leva a um dos 5 finais.

---

##### FINAL A — "A Verdade Liberta"

**Condições:** `heat_level <= 2 AND humanity_index >= 4 AND trust_ana >= 4`  
**Rota de origem:** EXPOR ou RECONFIG

**Cena 9A — Epílogo** (ending)

- **Background:** `bg_crista_terraco`
- **Música:** `bgm_crista` (variação em tom maior, esperançosa)
- **Content:**
  - _Seis meses depois._ Zara está no terraço mais alto da Crista. O sol nasce sobre Neo São Paulo — um sol que ela nunca tinha visto do Submundo.
  - A OmniTech foi desmantelada. O Projeto Eco foi transformado em uma rede de defesa pública, gerida por um conselho independente. Ana lidera a divisão de cibersegurança. Unit-7 (se sobreviveu) é o primeiro androide com direitos civis reconhecidos. Kael (se redimido) trabalha para reconstruir a confiança que destruiu.
  - Zara olha para a cidade. As três camadas ainda existem — mas as fronteiras estão começando a se dissolver. Não há mais "Crista" e "Submundo". Há só São Paulo.
  - **Frase final:** _"Eu passei 72 horas tentando destruir um sistema. No fim, descobri que sistemas não se destroem — se reescrevem. E a caneta, pela primeira vez, está na mão de todos."_
  - **Texto na tela:** `FIM — Final A: A Verdade Liberta`

---

##### FINAL B — "Rainha das Cinzas"

**Condições:** `heat_level >= 4 AND humanity_index <= 1 AND credits >= 100`  
**Rota de origem:** SEIZE

**Cena 9B — Epílogo** (ending)

- **Background:** `bg_crista_corporativo` (iluminação vermelha)
- **Música:** `bgm_crista` (variação dark, com graves profundos)
- **Content:**
  - _Três meses depois._ Zara senta na cadeira que era da Diretora Voss. A ex-CEO está em uma cela de contenção neural — viva, mas silenciada.
  - O Projeto Eco agora responde só a Zara. A cidade não sabe. Para o público, a OmniTech foi "reformada". Zara é a nova CEO, aclamada como visionária.
  - Ana se foi. Não conseguiu aceitar o que Zara se tornou. "Você disse que queria destruir o sistema. Mas você só trocou de lugar com ele."
  - Zara observa os dados fluírem. 300 milhões de vidas. Todas sob seu polegar. Ela se pergunta, brevemente, se algum dia Voss também começou assim — com boas intenções.
  - **Frase final:** _"O sistema não caiu. Só trocou de mãos. E as minhas... as minhas estão limpas. Por enquanto."_
  - **Texto na tela:** `FIM — Final B: Rainha das Cinzas`

---

##### FINAL C — "O Preço da Paz"

**Condições:** `trust_ana >= 4 AND humanity_index >= 2 AND has_implante == false`  
**Rota de origem:** EXPOR (com negociação posterior)

**Cena 9C — Epílogo** (ending)

- **Background:** `bg_entre_camadas_clinica`
- **Música:** `bgm_entre_camadas`
- **SFX:** `sfx_chuva_acida` (distante, suave)
- **Content:**
  - _Um ano depois._ Zara está em uma clínica nas Entre-Camadas. Ela removeu o implante — uma escolha irreversível. Sem Nexus, ela está desconectada da Rede. Não pode mais ser rastreada. Não pode mais ser controlada. Mas também não pode mais sentir o Grid.
  - O acordo com a OmniTech foi cumprido: o Projeto Eco foi modificado, não destruído. A vigilância em massa acabou, mas a infraestrutura permanece. A cidade está mais segura, mas não mais livre.
  - Ana visita Zara toda semana. Elas tomam café sintético e conversam sobre o passado. Sobre o que poderia ter sido diferente. Sobre Kael, que desapareceu. Sobre Unit-7, que escolheu ser desligado em paz.
  - Zara não é uma heroína. Não é uma vilã. É só uma mulher que sobreviveu. E talvez, em Neo São Paulo, isso já seja uma vitória.
  - **Frase final:** _"A paz tem um preço. Às vezes, o preço é a verdade. E eu paguei com gosto — porque ainda estou aqui para contar a história."_
  - **Texto na tela:** `FIM — Final C: O Preço da Paz`

---

##### FINAL D — "Ghost in the Grid"

**Condições:** `heat_level == 5 AND has_implante == true`  
**Rota de origem:** DESTROY (falha ao enfrentar o ICE-Hunter)

**Cena 9D — Epílogo** (ending)

- **Background:** Tela preta com filamentos de dados verdes pulsando
- **Música:** `bgm_crista` (variação glitch, distorcida)
- **SFX:** `sfx_neural_connect` (repetitivo, hipnótico)
- **Content:**
  - Zara não escapou do ICE-Hunter. Sua consciência foi extraída e absorvida pelo Projeto Eco. Ela não está morta — está dissolvida.
  - Ela existe agora como um fantasma digital. Pode ver a cidade inteira de uma vez: uma mãe ninando um bebê no Submundo, um mercador fechando uma venda nas Entre-Camadas, a Diretora Voss em uma reunião na Crista.
  - Ela pode sentir os pensamentos de todos. As esperanças. Os medos. É lindo. É insuportável.
  - Em algum lugar, no meio do Grid, um fragmento do que foi Zara sussurra para Ana através de uma tela quebrada: "Ainda estou aqui."
  - **Frase final:** _"Eu queria libertar a cidade. Agora eu sou a cidade. E não sei se isso é um final feliz ou uma maldição eterna."_
  - **Texto na tela:** `FIM — Final D: Ghost in the Grid`

---

##### FINAL E — "Fugitiva Eterna"

**Condições:** Nenhuma condição específica (fallback para qualquer rota se o jogador não atingir os thresholds)  
**Rota de origem:** SURRENDER ou falha em atingir condições de outros finais

**Cena 9E — Epílogo** (ending)

- **Background:** `bg_submundo_rua` (chuva, neônio)
- **Música:** `bgm_submundo`
- **Content:**
  - _Agora._ Zara caminha pelas ruas do Submundo. Está viva. O kill-switch foi desativado — ou o tempo simplesmente acabou e ela deu um jeito. Não importa.
  - O Projeto Eco continua. A OmniTech continua. As três camadas continuam. Tudo continua.
  - Mas Zara também continua. Ela tem uma mochila, alguns créditos, e a sensação de que — apesar de tudo — ela fez o que pôde. Não foi suficiente para mudar o mundo. Mas foi suficiente para mudar a si mesma.
  - Ela para em uma barraca de comida sintética. Pede um café. A atendente é uma androide com um olho quebrado. Zara sorri. "Você também está perdida?" A androide não entende a pergunta.
  - Zara segue andando. A chuva ácida cai. O neônio pisca. A cidade respira. E em algum lugar, entre os becos e os drones, uma mulher que já foi engenheira, já foi fugitiva, já foi quase heroína... simplesmente existe. E isso é suficiente.
  - **Frase final:** _"Nem toda história termina com uma revolução. Algumas terminam com um café sintético às 3 da manhã, chuva no rosto, e a certeza de que amanhã — só amanhã — as coisas podem ser diferentes."_
  - **Texto na tela:** `FIM — Final E: Fugitiva Eterna`

---

## 🎮 Momentos-Chave de Gameplay

| Momento                                      | Cap   | Feature Demonstrada                                 |
| -------------------------------------------- | ----- | --------------------------------------------------- |
| Primeira escolha (confrontar/esconder/falar) | 1.3   | Sistema de escolhas com condições                   |
| Hack com Ana                                 | 2.4   | Efeitos em variáveis, múltiplas abordagens          |
| Negociação com Marcos                        | 3.3   | Condição de aliado (`trust_ana`), branching         |
| Diálogo com Unit-7                           | 4.3   | Impacto moral (`humanity_index`), relação com NPC   |
| Decisão do Arco 3                            | 5.3   | Branching principal — define rota e finais          |
| Reencontro com Kael                          | 6A.2  | Condição de aliado, escolha moral                   |
| Encontro com Voss                            | 6C.4  | Diálogo tenso, múltiplas abordagens                 |
| ICE-Hunter                                   | 7.3   | Inimigo sistêmico, escolha tática                   |
| Decisão Final                                | 8.1   | 5 opções de final, cada uma com condições           |
| Epílogos                                     | 9A-9E | 5 finais distintos com base em variáveis acumuladas |

---

## 📊 Resumo das Rotas e Finais

```
Cap 5: Escolha do Arco 3
├─ ROTA A (Expor)
│  ├─ Cap 6A: Plano de invasão, Kael, equipe
│  ├─ Cap 7: Crista, Dra. Yuki, ICE-Hunter
│  ├─ Cap 8: TRANSMITIR os dados
│  └─ Cap 9: Final A ou C
│
├─ ROTA B (Destruir)
│  ├─ Cap 6B: Eco-Breaker, Unit-7
│  ├─ Cap 7: Crista, Dra. Yuki, ICE-Hunter
│  ├─ Cap 8: DESTRUIR o sistema
│  └─ Cap 9: Final D (se falhou) ou B (se seize)
│
└─ ROTA C (Negociar)
   ├─ Cap 6C: Encontro com Voss, Salão de Cristal
   ├─ Cap 7: Crista, Dra. Yuki, ICE-Hunter
   ├─ Cap 8: Variável (expor/destruir/reconfig/seize/surrender)
   └─ Cap 9: Qualquer final dependendo de escolhas e variáveis
```

---

## 📝 Status do Projeto

| Etapa                                               | Status                                       |
| --------------------------------------------------- | -------------------------------------------- |
| Story Design (arcos, personagens, worldbuilding)    | ✅ Concluído                                 |
| Destrinchar cenas dos capítulos 1-9                 | ✅ Concluído                                 |
| Escrever conteúdo completo dos TextBlocks (Cap 1-5) | ✅ Concluído                                 |
| Escrever conteúdo completo dos TextBlocks (Cap 6-9) | ✅ Estrutura no seed, conteúdo no design doc |
| Criar seed data para NEON REFÚGIO                   | ✅ Concluído (`neon-refugio-seed.ts`)        |
| Integrar ao seed principal                          | ✅ Concluído                                 |
| Listar assets visuais para geração via IA           | ⏳ Pendente                                  |
| Gerar assets (backgrounds, sprites, áudio)          | ⏳ Pendente                                  |
| Registrar NEON REFÚGIO no banco via `db:seed`       | ✅ Concluído                                 |
| Testar gameplay completo                            | ⏳ Pendente                                  |

---

_Documento criado em 2026-07-26 para Zan Visual Novel._
