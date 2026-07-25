# Diagramas de Sequência — Fluxos Principais

## Zan Visual Novel

---

## 1. Fluxo de Jogo (Player — Interação com IA)

```mermaid
sequenceDiagram
    actor J as Jogador
    participant UI as Client UI
    participant VNE as VN Engine
    participant LLM as Local LLM (ONNX)
    participant API as Backend API
    participant DB as PostgreSQL

    J->>UI: Abre VN
    UI->>API: GET /api/vn/:id
    API->>DB: SELECT vn + chapters + scenes
    DB-->>API: StoryData
    API-->>UI: VN completa com cenas
    UI->>VNE: start(vnData)
    VNE-->>UI: Primeira cena

    loop Cada cena
        UI->>J: Renderiza cena (texto + assets + escolhas)
        J->>UI: Escolhe opção
        UI->>VNE: choose(choiceId)

        alt Escolha leva a cena pré-definida
            VNE-->>UI: Próxima cena
        else Escolha sai da árvore (fim do ramo)
            VNE->>LLM: generate(prompt, context)
            Note over VNE,LLM: Modelo local 230M/350M

            alt Modelo local disponível
                LLM-->>VNE: Texto narrativo gerado
            else Fallback para cloud
                VNE->>API: POST /api/llm/generate
                API-->>VNE: Texto narrativo gerado
            end

            VNE-->>UI: Cena gerada por IA (marcada)
        end

        UI->>API: POST /api/progress (auto-save)
        API->>DB: UPSERT save
    end

    J->>UI: Sai da VN
    UI->>API: PUT /api/saves/:id (save final)
```

---

## 2. Fluxo de Criação de VN (Dashboard)

```mermaid
sequenceDiagram
    actor C as Criador
    participant D as Dashboard UI
    participant API as Backend API
    participant DB as PostgreSQL
    participant S3 as Cloud Storage

    %% Criar VN
    C->>D: Clica "Nova VN"
    D->>C: Formulário (título, sinopse, capa)
    C->>D: Preenche e envia
    D->>API: POST /api/vn
    API->>DB: INSERT visual_novels
    DB-->>API: vn_id
    API-->>D: VN criada (rascunho)

    %% Upload de capa
    C->>D: Seleciona imagem de capa
    D->>API: GET /api/upload/presigned-url
    API->>S3: generatePresignedUrl
    S3-->>API: URL pré-assinada
    API-->>D: uploadUrl
    D->>S3: PUT imagem
    D->>API: PATCH /api/vn/:id (cover_url)

    %% Criar capítulos e cenas
    loop Para cada capítulo
        C->>D: Cria capítulo
        D->>API: POST /api/vn/:id/chapters
        API->>DB: INSERT chapters
        DB-->>API: chapter_id

        loop Para cada cena
            C->>D: Edita cena (texto, assets, escolhas)

            alt Upload de asset
                D->>API: Upload de imagem/áudio
                API->>S3: Store asset
                S3-->>API: storage_url
                API->>DB: INSERT assets
            end

            C->>D: Define escolhas e targets
            D->>API: PUT /api/scenes/:id (com choices)
            API->>DB: UPSERT scene + choices + conditions
        end
    end

    %% Preview
    C->>D: Clica "Preview"
    D->>VNE: start(vnData) — mesmo engine do client
    D-->>C: Modo preview (jogável)

    %% Publicar
    C->>D: Clica "Publicar"
    D->>API: PATCH /api/vn/:id/status (published)
    API->>DB: UPDATE status = 'published'
    API-->>D: VN publicada!
```

---

## 3. Fluxo de Compra e Gasto de Créditos

```mermaid
sequenceDiagram
    actor J as Jogador
    participant UI as Client UI
    participant API as Backend API
    participant DB as PostgreSQL
    participant ST as Stripe
    actor C as Criador

    %% Compra de créditos
    J->>UI: Clica "Comprar Créditos"
    UI->>API: GET /api/credits/packages
    API-->>UI: Lista de pacotes
    J->>UI: Seleciona pacote (ex: 60 créditos)
    UI->>API: POST /api/credits/checkout (package_id)
    API->>ST: Create Checkout Session
    ST-->>API: session_url
    API-->>UI: Redirect Stripe Checkout
    J->>ST: Pagamento
    ST-->>API: Webhook: checkout.session.completed
    API->>DB: INSERT credit_transactions (purchase)
    API->>DB: UPDATE users SET credits_balance += 60
    API-->>UI: Créditos atualizados (via WebSocket/Poll)

    %% Gasto de créditos ao jogar
    J->>UI: Inicia capítulo pago (custa 5 créditos)
    UI->>J: Confirma: "Este capítulo custa 5 créditos"
    J->>UI: Confirma
    UI->>API: POST /api/credits/spend (vn_id, chapter_id, 5)

    API->>DB: BEGIN TRANSACTION
    API->>DB: CHECK balance >= 5
    API->>DB: UPDATE users SET credits_balance -= 5
    API->>DB: INSERT credit_transactions (spend, -5)
    API->>DB: INSERT creator_earnings (creator_id, +3.5, pending)
    API->>DB: INSERT user_vn_access (ou chapter_progress)
    API->>DB: COMMIT

    API-->>UI: Acesso concedido!

    %% Criador consulta ganhos
    C->>API: GET /api/creator/earnings
    API->>DB: SELECT SUM(amount) FROM creator_earnings WHERE status IN ('pending','available')
    API-->>C: Saldo disponível: 350 créditos
```

---

## 4. Fluxo de Autenticação (OAuth2 + JWT)

```mermaid
sequenceDiagram
    actor U as Usuário
    participant UI as Client/Dashboard
    participant API as Backend API
    participant DB as PostgreSQL
    participant RD as Redis

    %% Registro
    U->>UI: Preenche formulário de registro
    UI->>API: POST /api/auth/register
    API->>API: hash(password) com bcrypt
    API->>DB: INSERT users
    API->>API: Gera access_token (15min) + refresh_token (7d)
    API->>RD: Store refresh_token (user_id → token)
    API-->>UI: { access_token, refresh_token, user }

    %% Login
    U->>UI: Login (email + senha)
    UI->>API: POST /api/auth/login
    API->>DB: SELECT user WHERE email
    API->>API: bcrypt.compare(password, hash)
    API->>API: Gera tokens
    API->>RD: Store refresh_token
    API-->>UI: { access_token, refresh_token, user }

    %% API calls subsequentes
    UI->>API: GET /api/vn (Authorization: Bearer access_token)
    API->>API: Verifica JWT signature + expiry
    API-->>UI: Dados

    %% Refresh token (token expirado)
    UI->>API: GET /api/vn (token expirado)
    API-->>UI: 401 Unauthorized
    UI->>API: POST /api/auth/refresh (refresh_token)
    API->>RD: GET refresh_token
    API->>API: Verifica validade
    API->>API: Gera novo access_token
    API-->>UI: { access_token }
    UI->>API: GET /api/vn (novo token)
    API-->>UI: Dados
```
