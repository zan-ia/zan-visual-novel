# Modelo de Dados — Diagrama Entidade-Relacionamento (ERD)

## Zan Visual Novel

```mermaid
erDiagram
    %% === USUÁRIOS E AUTENTICAÇÃO ===
    USERS ||--o{ USER_SESSIONS : "possui"
    USERS ||--o{ CREDIT_TRANSACTIONS : "realiza"
    USERS ||--o{ SAVES : "possui"
    USERS ||--o{ VISUAL_NOVELS : "cria"
    USERS ||--o{ USER_VN_ACCESS : "acessa"

    %% === VISUAL NOVELS ===
    VISUAL_NOVELS ||--o{ CHAPTERS : "contem"
    VISUAL_NOVELS ||--o{ VN_TAGS : "classificada por"
    VISUAL_NOVELS ||--o{ VN_REVIEWS : "avaliada por"
    VISUAL_NOVELS ||--o{ USER_VN_ACCESS : "acessada por"

    %% === CAPÍTULOS E CENAS ===
    CHAPTERS ||--o{ SCENES : "contem"
    CHAPTERS ||--o{ USER_CHAPTER_PROGRESS : "progredido por"

    %% === CENAS E RELACIONAMENTOS ===
    SCENES ||--o{ SCENE_ASSETS : "possui"
    SCENES ||--o{ CHOICES : "oferece"
    SCENES ||--o{ USER_SCENE_HISTORY : "visitada por"
    CHOICES ||--o{ CHOICE_CONDITIONS : "condicionada por"
    CHOICES ||--o{ CHOICE_EFFECTS : "produz"

    %% === ASSETS ===
    ASSETS ||--o{ SCENE_ASSETS : "usado em"

    %% === CRÉDITOS ===
    CREDIT_PACKAGES ||--o{ CREDIT_TRANSACTIONS : "origem de"
    USERS ||--o{ CREATOR_EARNINGS : "recebe"

    %% ============================================
    %% ENTIDADES
    %% ============================================

    USERS {
        uuid id PK
        string email UK
        string password_hash
        string display_name
        string avatar_url
        enum role "player | creator | admin"
        int credits_balance
        text bio
        jsonb social_links
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    USER_SESSIONS {
        uuid id PK
        uuid user_id FK
        string refresh_token UK
        string user_agent
        string ip_address
        timestamp expires_at
        timestamp created_at
    }

    VISUAL_NOVELS {
        uuid id PK
        uuid creator_id FK
        string title
        text synopsis
        string cover_url
        enum status "draft | published | archived | under_review"
        enum age_rating "general | teen | mature"
        int total_chapters
        int price_credits
        boolean ia_enabled
        text ia_system_prompt
        text ia_persona
        int ia_max_tokens "default 500"
        jsonb metadata
        timestamp published_at
        timestamp created_at
        timestamp updated_at
    }

    VN_TAGS {
        uuid id PK
        uuid vn_id FK
        string tag
    }

    CHAPTERS {
        uuid id PK
        uuid vn_id FK
        string title
        int order_index
        enum status "draft | published"
        int price_credits
        string start_scene_id
        timestamp created_at
        timestamp updated_at
    }

    SCENES {
        uuid id PK
        uuid chapter_id FK
        string title
        enum type "narration | dialogue | choice | ending"
        jsonb content "array of text blocks with formatting"
        string next_scene_id "linear fallback"
        jsonb metadata
        timestamp created_at
        timestamp updated_at
    }

    SCENE_ASSETS {
        uuid id PK
        uuid scene_id FK
        uuid asset_id FK
        enum role "background | sprite | music | sfx | video"
        int order_index
        jsonb config "position, size, animation"
    }

    ASSETS {
        uuid id PK
        uuid owner_id FK
        string filename
        string original_name
        enum type "image | audio | video"
        string mime_type
        bigint size_bytes
        string storage_url
        string thumbnail_url
        int width
        int height
        int duration_seconds
        timestamp created_at
    }

    CHOICES {
        uuid id PK
        uuid scene_id FK
        string text
        string target_scene_id FK
        int order_index
        boolean is_default
    }

    CHOICE_CONDITIONS {
        uuid id PK
        uuid choice_id FK
        string variable_name
        enum operator "eq | neq | gt | lt | gte | lte | in | not_in | exists"
        jsonb value
    }

    CHOICE_EFFECTS {
        uuid id PK
        uuid choice_id FK
        string variable_name
        enum action "set | add | toggle | push"
        jsonb value
    }

    SAVES {
        uuid id PK
        uuid user_id FK
        uuid vn_id FK
        int slot_number "1 a 5"
        string label
        string current_scene_id
        jsonb flags "estado das variáveis"
        jsonb choice_history
        timestamp created_at
        timestamp updated_at
    }

    USER_VN_ACCESS {
        uuid id PK
        uuid user_id FK
        uuid vn_id FK
        boolean has_full_access
        timestamp first_accessed_at
        timestamp last_accessed_at
    }

    USER_CHAPTER_PROGRESS {
        uuid id PK
        uuid user_id FK
        uuid chapter_id FK
        enum status "not_started | in_progress | completed"
        timestamp started_at
        timestamp completed_at
    }

    USER_SCENE_HISTORY {
        uuid id PK
        uuid user_id FK
        uuid scene_id FK
        uuid save_id FK
        timestamp visited_at
    }

    VN_REVIEWS {
        uuid id PK
        uuid user_id FK
        uuid vn_id FK
        int rating "1 a 5"
        text comment
        timestamp created_at
    }

    CREDIT_PACKAGES {
        uuid id PK
        string name
        int credits
        int price_cents
        boolean is_active
        timestamp created_at
    }

    CREDIT_TRANSACTIONS {
        uuid id PK
        uuid user_id FK
        enum type "purchase | spend | refund | creator_earning | withdraw"
        int amount "positivo=entrada, negativo=saida"
        int balance_before
        int balance_after
        string reference_id "VN, chapter, ou package"
        string stripe_session_id
        text description
        timestamp created_at
    }

    CREATOR_EARNINGS {
        uuid id PK
        uuid creator_id FK
        uuid transaction_id FK
        int amount
        enum status "pending | available | withdrawn"
        timestamp earned_at
        timestamp withdrawn_at
    }
```

## Resumo de Cardinalidades

| Entidade A      | Relação          | Entidade B          | Cardinalidade       |
| --------------- | ---------------- | ------------------- | ------------------- |
| USERS           | cria             | VISUAL_NOVELS       | 1:N                 |
| VISUAL_NOVELS   | contém           | CHAPTERS            | 1:N                 |
| CHAPTERS        | contém           | SCENES              | 1:N                 |
| SCENES          | oferece          | CHOICES             | 1:N                 |
| SCENES          | possui           | SCENE_ASSETS        | 1:N                 |
| ASSETS          | usado em         | SCENE_ASSETS        | 1:N                 |
| CHOICES         | condicionada por | CHOICE_CONDITIONS   | 1:N                 |
| CHOICES         | produz           | CHOICE_EFFECTS      | 1:N                 |
| USERS           | possui           | SAVES               | 1:N                 |
| USERS           | acessa           | USER_VN_ACCESS      | 1:N (M:N implícito) |
| USERS           | realiza          | CREDIT_TRANSACTIONS | 1:N                 |
| CREDIT_PACKAGES | origem de        | CREDIT_TRANSACTIONS | 1:N                 |

## Índices Recomendados

```sql
-- Busca de VNs
CREATE INDEX idx_vn_status ON visual_novels(status) WHERE status = 'published';
CREATE INDEX idx_vn_creator ON visual_novels(creator_id);
CREATE INDEX idx_vn_tags ON vn_tags(tag);

-- Performance de saves
CREATE INDEX idx_saves_user_vn ON saves(user_id, vn_id);
CREATE UNIQUE INDEX idx_saves_slot ON saves(user_id, vn_id, slot_number);

-- Créditos
CREATE INDEX idx_credit_transactions_user ON credit_transactions(user_id, created_at DESC);
CREATE INDEX idx_creator_earnings_status ON creator_earnings(creator_id, status);

-- Progresso
CREATE INDEX idx_chapter_progress_user ON user_chapter_progress(user_id, chapter_id);
CREATE INDEX idx_vn_access_user ON user_vn_access(user_id, vn_id);
```
