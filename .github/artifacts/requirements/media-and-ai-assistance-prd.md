# PRD: Suporte a Mídia Imersiva e Ferramentas de Criação com IA

**Versão:** 1.0  
**Status:** Draft  
**Autor:** Software Engineer Agent  
**Data:** 2026-07-30  
**Branch:** `improve/llm-model-ux-pt2`

---

## 1. Resumo Executivo

A plataforma **zan-visual-novel** atualmente suporta visual novels puramente textuais com geração narrativa por IA em tempo de execução (LLM local/cloud). No entanto, duas lacunas críticas foram identificadas:

1. **Mídia imersiva ausente no player:** O `SceneRenderer` (`packages/ui/src/scene-renderer.tsx`) já renderiza backgrounds, sprites e elementos `<audio>`, mas a experiência do jogador é limitada porque não há suporte completo para upload, associação e playback de assets de imagem (fundos, sprites de personagens) e áudio (música de fundo, efeitos sonoros, TTS/narração).
2. **Ferramentas de criação assistida por IA ausentes no studio:** O dashboard (`apps/dashboard/src/pages/vn-editor-page.tsx`) permite edição manual de cenas, capítulos e escolhas, mas não oferece assistência de IA para **geração de texto** (diálogos, narração, escolhas), **geração de TTS** (narração por voz para blocos de diálogo) ou **geração de imagens** (fundos e sprites).

Este PRD define os requisitos para implementar ambas as capacidades **em paralelo**, conforme priorizado pelo usuário.

### Problema

Criadores gastam horas procurando ou criando assets visuais e sonoros manualmente, e escrevendo cada linha de diálogo sem assistência. Jogadores recebem uma experiência textual que não aproveita o potencial imersivo do meio. A plataforma já possui infraestrutura parcial (tabelas `assets`, `scene_assets`, API de upload, `SceneRenderer`), mas faltam as camadas de integração, UX e geração por IA.

### Solução Proposta

Adicionar duas capacidades complementares:

| Capacidade | Descrição |
|---|---|
| **Mídia Imersiva (Player)** | Backgrounds, sprites de personagens, música de fundo, efeitos sonoros e TTS totalmente integrados ao player de VN |
| **Criação Assistida por IA (Studio)** | Geração de texto narrativo, geração de voz (TTS) e geração de imagens (fundos/sprites) a partir de prompts no editor de VN |

---

## 2. Objetivos

### Objetivos de Negócio

- **OBJ-01:** Aumentar o engajamento do jogador (tempo médio de sessão) em ≥ 30% através de experiências imersivas com mídia
- **OBJ-02:** Reduzir o tempo de criação de uma VN em ≥ 40% através de ferramentas de IA no studio
- **OBJ-03:** Atrair criadores que não possuem habilidades de desenho/design, democratizando a criação de VNs

### Objetivos de Usuário

- **OBJ-U01:** Jogadores devem ver e ouvir a história, não apenas ler
- **OBJ-U02:** Criadores devem poder gerar assets e texto com prompts em linguagem natural, sem sair do editor
- **OBJ-U03:** A transição entre cenas com mídia deve ser fluida (sem flicker ou loading perceptível)

---

## 3. Público-Alvo

### Persona Primária: Criador de Conteúdo (Creator)

- **Nome:** "Carla Criadora"
- **Perfil:** Escritora de visual novels, não tem habilidades de ilustração ou design de som
- **Necessidades:** Criar VNs imersivas rapidamente, gerar backgrounds e sprites por descrição textual, dar voz aos personagens sem gravar áudio
- **Ferramenta:** Dashboard (`apps/dashboard`)

### Persona Primária: Jogador (Player)

- **Nome:** "Pedro Jogador"
- **Perfil:** Consumidor de visual novels, busca imersão narrativa completa
- **Necessidades:** Ver os cenários e personagens enquanto lê, ouvir a atmosfera sonora e as vozes dos personagens
- **Ferramenta:** Client (`apps/client`)

### Persona Secundária: Desenvolvedor Integrador

- **Nome:** "Diana Dev"
- **Perfil:** Desenvolvedora que integra o `vn-engine` em outras aplicações
- **Necessidades:** API limpa para controle de mídia, eventos de playback, suporte a diferentes formatos

---

## 4. User Stories

### Épico 1: Mídia Imersiva no Player

| ID | User Story | Prioridade |
|---|---|---|
| **US-M01** | Como jogador, quero ver uma imagem de fundo (background) em cada cena, para me sentir imerso no ambiente da história | Must |
| **US-M02** | Como jogador, quero ver sprites dos personagens que estão falando, para identificar visualmente quem está dialogando | Must |
| **US-M03** | Como jogador, quero ouvir música de fundo que combine com o tom da cena, para aumentar a imersão emocional | Must |
| **US-M04** | Como jogador, quero ouvir efeitos sonoros (SFX) em momentos-chave da narrativa, para reforçar a dramaticidade | Should |
| **US-M05** | Como jogador, quero ouvir a narração em voz (TTS) dos diálogos, para ter uma experiência auditiva completa | Should |
| **US-M06** | Como jogador, quero que as transições de mídia entre cenas sejam suaves (fade in/out), para manter a imersão | Should |
| **US-M07** | Como jogador, quero poder pausar/retomar o áudio e ajustar o volume de música, SFX e voz separadamente | Could |
| **US-M08** | Como jogador, quero que as mídias sejam pré-carregadas antes da cena, para evitar loading durante a leitura | Must |

### Épico 2: Criação Assistida por IA no Studio

| ID | User Story | Prioridade |
|---|---|---|
| **US-A01** | Como criador, quero gerar texto narrativo (diálogos, narração, pensamentos) a partir de um prompt, para acelerar a escrita | Must |
| **US-A02** | Como criador, quero gerar múltiplas opções de escolha (choices) com IA, para enriquecer a árvore de decisão | Should |
| **US-A03** | Como criador, quero gerar voz TTS para um bloco de diálogo a partir do texto, para dar voz aos personagens sem gravação | Must |
| **US-A04** | Como criador, quero gerar imagens de background a partir de uma descrição textual, para criar cenários sem habilidades de desenho | Must |
| **US-A05** | Como criador, quero gerar sprites de personagens a partir de uma descrição textual, para criar personagens visualmente consistentes | Must |
| **US-A06** | Como criador, quero revisar, editar e regenerar o conteúdo gerado por IA antes de publicar, para manter controle criativo | Must |
| **US-A07** | Como criador, quero associar o conteúdo gerado (texto, TTS, imagem) diretamente a uma cena ou capítulo, sem sair do editor | Must |
| **US-A08** | Como criador, quero ver um histórico das gerações de IA por VN, para poder reverter ou reutilizar gerações anteriores | Could |

---

## 5. Escopo da Funcionalidade

### Must Have (MVP — Fase 1)

#### Mídia Imersiva

- **M-MUST-01:** Exibição de imagem de fundo (background) por cena no player
- **M-MUST-02:** Exibição de sprites de personagens com posicionamento configurável
- **M-MUST-03:** Playback de música de fundo (loop) por cena
- **M-MUST-04:** Pré-carregamento de assets de mídia antes da transição de cena
- **M-MUST-05:** Upload e gerenciamento de assets de imagem e áudio no dashboard (já parcialmente implementado)

#### Criação Assistida por IA

- **A-MUST-01:** Geração de texto narrativo (diálogos, narração) via prompt no editor de cena
- **A-MUST-02:** Geração de TTS para blocos de diálogo (integração com modelo LFM2.5-Audio ou API cloud)
- **A-MUST-03:** Geração de imagens de background via prompt textual (integração com modelo de imagem ou API cloud)
- **A-MUST-04:** Geração de sprites de personagens via prompt textual
- **A-MUST-05:** Interface de prompt no editor de cena (campo de texto + botão gerar + preview)
- **A-MUST-06:** Associação automática do conteúdo gerado à cena atual

### Should Have (Fase 2)

- **M-SHOULD-01:** Efeitos sonoros (SFX) com triggers por evento de cena
- **M-SHOULD-02:** Narração TTS durante o playback no player
- **M-SHOULD-03:** Transições animadas de mídia (fade in/out, slide)
- **A-SHOULD-01:** Geração de múltiplas opções de escolha (choices) com IA
- **A-SHOULD-02:** Controles de qualidade de geração (temperatura, estilo, negative prompt)
- **A-SHOULD-03:** Preview de TTS antes de salvar

### Could Have (Fase 3)

- **M-COULD-01:** Controles de volume independentes (música, SFX, voz)
- **M-COULD-02:** Suporte a vídeo em cenas
- **A-COULD-01:** Histórico de gerações por VN com possibilidade de reverter
- **A-COULD-02:** Geração de variações de sprite (expressões, poses) do mesmo personagem
- **A-COULD-03:** Integração com APIs externas de geração (Stable Diffusion, ElevenLabs) como alternativa

### Won't Have (Esta Fase)

- **WONT-01:** Animação de sprites (Live2D, spine)
- **WONT-02:** Sincronização labial (lip-sync) para TTS
- **WONT-03:** Geração procedural de música
- **WONT-04:** Edição colaborativa em tempo real

---

## 6. Requisitos Não-Funcionais

### Performance

| ID | Requisito | Alvo |
|---|---|---|
| **RNF-P01** | Tempo de carregamento de background (imagem ≤ 2 MB) | < 1s em conexão 10 Mbps |
| **RNF-P02** | Tempo de carregamento de sprite (imagem ≤ 500 KB) | < 500ms |
| **RNF-P03** | Início de playback de áudio após carregamento | < 300ms |
| **RNF-P04** | Pré-carregamento da próxima cena | Completo antes da transição |
| **RNF-P05** | Geração de texto por IA | < 10s |
| **RNF-P06** | Geração de TTS por IA | < 15s para bloco de até 500 caracteres |
| **RNF-P07** | Geração de imagem por IA | < 30s |

### Usabilidade

| ID | Requisito | Critério |
|---|---|---|
| **RNF-U01** | Interface de prompt de IA | Máximo 2 campos (prompt + estilo) |
| **RNF-U02** | Preview de mídia gerada | Exibido inline no editor antes de confirmar |
| **RNF-U03** | Feedback de progresso de geração | Barra de progresso ou spinner com texto descritivo |
| **RNF-U04** | Tratamento de erros de geração | Mensagem clara + opção de tentar novamente |

### Segurança e Conformidade

| ID | Requisito | Descrição |
|---|---|---|
| **RNF-S01** | Rate limiting em APIs de IA | Máximo 20 requisições/minuto por usuário (já parcialmente implementado em `llm.routes.ts`) |
| **RNF-S02** | Moderação de conteúdo gerado | Verificação básica de conteúdo impróprio antes de associar à cena |
| **RNF-S03** | Atribuição de conteúdo IA | Marcação automática `generatedBy: 'ai'` em metadata de cenas/assets gerados |
| **RNF-S04** | Consentimento do criador | Checkbox explícito aceitando termos de uso de IA antes da primeira geração |

### Compatibilidade

| ID | Requisito | Descrição |
|---|---|---|
| **RNF-C01** | Formatos de imagem suportados | PNG, JPEG, WebP (já configurado no multer de `assets.routes.ts`) |
| **RNF-C02** | Formatos de áudio suportados | MP3, WAV, OGG, WebM (já configurado) |
| **RNF-C03** | Navegadores suportados | Chrome 90+, Firefox 90+, Safari 15+, Edge 90+ |
| **RNF-C04** | Resolução máxima de background | 1920×1080 (redimensionamento server-side recomendado) |
| **RNF-C05** | Tamanho máximo de upload | 50 MB (já configurado) |

---

## 7. Design & UX (Diretrizes)

### Player — Layout de Cena com Mídia

```
┌──────────────────────────────────────────┐
│ [Background Image - full bleed]          │
│                                          │
│     ┌──────┐              ┌──────┐      │
│     │Sprite│              │Sprite│      │
│     │  L   │              │  R   │      │
│     └──────┘              └──────┘      │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ "Diálogo do personagem..."          │ │
│ │ — Narrador                          │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ [▶ Continuar]  [Escolha 1] [Escolha 2]  │
└──────────────────────────────────────────┘
```

### Studio — Painel de Geração IA no Editor de Cena

```
┌─────────────────────────────────────────────┐
│ Cena: "Encontro no jardim"                  │
│                                             │
│ ┌─ Conteúdo ─────────────────────────────┐  │
│ │ [Narração] Texto da cena...            │  │
│ │ [Diálogo]  Personagem: "Olá!"          │  │
│ └────────────────────────────────────────┘  │
│                                             │
│ ┌─ Assistência IA ───────────────────────┐  │
│ │ 🤖 Gerar: [Texto ▼] [TTS ▼] [Img ▼]  │  │
│ │ Prompt: [__________________________]   │  │
│ │ [Gerar]                                │  │
│ │                                        │  │
│ │ ⏳ Gerando imagem... 67%               │  │
│ │ ┌──────────┐ ┌──────────┐             │  │
│ │ │ Preview  │ │ Preview  │             │  │
│ │ │   BG 1   │ │   BG 2   │             │  │
│ │ └──────────┘ └──────────┘             │  │
│ │ [Usar este] [Regenerar]               │  │
│ └────────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

---

## 8. Roadmap

| Fase | Escopo | Data Alvo | Entregável |
|---|---|---|---|
| **Fase 1 — MVP** | Must Have (Mídia + IA): backgrounds, sprites, música, geração de texto/TTS/imagem | Sprint 1-2 | Player com mídia funcional, Studio com painel de geração IA |
| **Fase 2 — Polimento** | Should Have: SFX, TTS no player, transições, escolhas IA, preview TTS | Sprint 3-4 | Experiência completa e polida |
| **Fase 3 — Extras** | Could Have: controles de volume, vídeo, histórico de gerações | Sprint 5+ | Funcionalidades complementares |

---

## 9. Métricas de Sucesso

| Métrica | Baseline | Alvo | Forma de Medição |
|---|---|---|---|
| **Tempo médio de sessão no player** | ~5 min (text-only) | ≥ 8 min | Analytics no client |
| **Taxa de conclusão de capítulo** | ~40% | ≥ 60% | Progress tracking |
| **Tempo para criar uma cena com 5 text blocks** | ~15 min (manual) | ≤ 8 min (com IA) | Telemetria no dashboard |
| **% de cenas publicadas com ao menos 1 asset de mídia** | ~0% | ≥ 70% | Query no banco |
| **% de criadores que usam geração IA ≥ 1 vez por VN** | N/A (novo) | ≥ 80% | Eventos de uso |
| **NPS (Net Promoter Score) do editor** | N/A | ≥ 40 | Pesquisa pós-publicação |

---

## 10. Dependências e Riscos

### Dependências Técnicas

| Dependência | Status | Impacto |
|---|---|---|
| Infraestrutura de assets (`assets` table, `assets.routes.ts`, `getStorage()`) | ✅ Existente | Base para upload e storage de mídia |
| `SceneRenderer` com suporte a background, sprite e áudio | ✅ Existente | Base para renderização no player |
| `VNEngine` com eventos de cena e interface `ILLMProvider` | ✅ Existente | Base para controle de mídia e IA |
| Backend LLM (`llm.routes.ts`, `cloud-llm.ts`, `local-llm.ts`) | ✅ Existente | Base para APIs de geração |
| Modelos LFM 2.5 (Audio, VL) | ⚠️ Cloud-only | Requer API key ou backend dedicado para TTS e imagem |
| Redis (cache e rate limiting) | ✅ Existente | Já usado para cache de prompts LLM |

### Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Custo de API de geração de imagem/TTS | Média | Alto | Rate limiting agressivo, cache de resultados, fila de jobs |
| Qualidade insatisfatória das gerações IA | Alta | Médio | Permitir regeneração, ajuste de parâmetros, múltiplos provedores |
| Tempo de carregamento de mídia em conexões lentas | Média | Médio | Pré-carregamento, compressão adaptativa, lazy loading |
| Conteúdo inapropriado gerado por IA | Baixa | Alto | Moderação automática + flag para revisão humana |

---

## 11. Glossário

| Termo | Definição |
|---|---|
| **Background** | Imagem de fundo da cena, geralmente 1920×1080 |
| **Sprite** | Imagem de personagem sobreposta ao background, com posição configurável |
| **SFX** | Sound effects — efeitos sonoros pontuais (ex: porta batendo, tiro) |
| **TTS** | Text-to-Speech — conversão de texto em fala (narração por voz) |
| **LLM** | Large Language Model — modelo de linguagem para geração de texto |
| **LFM** | Liquid Foundation Model — família de modelos ONNX usados na plataforma |
| **Prompt** | Descrição textual que guia a geração da IA |

---

> **Próximo passo:** Ver SRS complementar em `media-and-ai-assistance-srs.md` para especificações técnicas detalhadas.
