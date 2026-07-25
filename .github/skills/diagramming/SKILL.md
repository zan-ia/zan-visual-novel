---
name: diagramming
description: 'Create diagrams and visual artifacts using Mermaid — ERD, flowcharts, sequence, class, state, C4 Model, mind maps, Gantt charts, and more. Use when: creating entity-relationship diagrams (ERD), process flowcharts, sequence diagrams, UML class diagrams, state machines, mind maps, Gantt charts, or any technical visualization. Activates for: diagram, ERD, flowchart, sequence, class, state, mindmap, gantt, mermaid, architecture, visual, chart.'
user-invocable: true
disable-model-invocation: false
context: fork
---

# Diagramming — Criação de Diagramas e Artefatos Visuais

Skill para criação de diagramas profissionais usando Mermaid. Cobre todos os tipos de diagramas relevantes para engenharia de software.

> **Nota técnica:** Use `activate_mermaid_diagram_tools` antes de criar diagramas. O fluxo é: consultar sintaxe → validar → preview.

---

## 1. Catálogo de Diagramas

```mermaid
mindmap
  root((Diagramas))
    Estrutura
      ERD
      Classes UML
      Componentes
      C4 Model
    Comportamento
      Sequência
      Atividade
      Estado
      Casos de Uso
    Fluxo
      Flowchart
      Data Flow
      BPMN simples
    Gestão
      Gantt
      Roadmap
      Timeline
      Mindmap
```

---

## 2. Diagrama Entidade-Relacionamento (ERD)

### Template

```mermaid
erDiagram
    USUARIO ||--o{ PEDIDO : faz
    PEDIDO ||--|{ ITEM_PEDIDO : contem
    PRODUTO ||--o{ ITEM_PEDIDO : referencia
    USUARIO {
        uuid id PK
        string nome
        string email UK
        datetime criado_em
        enum papel
    }
    PEDIDO {
        uuid id PK
        uuid usuario_id FK
        decimal total
        enum status
        datetime criado_em
    }
    PRODUTO {
        uuid id PK
        string nome
        decimal preco
        int estoque
    }
    ITEM_PEDIDO {
        uuid id PK
        uuid pedido_id FK
        uuid produto_id FK
        int quantidade
        decimal preco_unitario
    }
```

### Convenções:

- **PK**: Primary Key
- **FK**: Foreign Key
- **UK**: Unique Key
- Cardinalidade: `||--o{` (um-para-muitos), `}|--||` (muitos-para-um), `||--||` (um-para-um)
- Relacionamentos nomeados com `: descricao`

---

## 3. Diagrama de Sequência

### Template

```mermaid
sequenceDiagram
    actor U as Usuário
    participant F as Frontend
    participant A as API Gateway
    participant S as Serviço
    participant D as Banco de Dados

    U->>F: Clica em "Comprar"
    F->>A: POST /api/orders
    A->>S: createOrder(dados)
    S->>D: INSERT INTO orders
    D-->>S: order_id
    S-->>A: 201 Created
    A-->>F: { order_id, status }
    F-->>U: Exibe confirmação

    Note over S,D: Transação inicia aqui
    S->>D: UPDATE inventory
    D-->>S: OK
    Note over S,D: Transação commit
```

### Convenções:

- `->>`: chamada síncrona
- `-->>`: resposta/retorno
- `actor`: usuário/papel externo
- `participant`: sistema/componente
- `Note over X,Y`: comentário explicativo
- `alt/else/end`: fluxos alternativos
- `loop/end`: repetição

---

## 4. Fluxograma (Flowchart)

### Template

```mermaid
flowchart TD
    A[Início] --> B{Usuário autenticado?}
    B -->|Sim| C[Carregar Dashboard]
    B -->|Não| D[Redirecionar para Login]
    D --> E[Usuário faz login]
    E --> F{Credenciais válidas?}
    F -->|Sim| C
    F -->|Não| G{Tentativas < 3?}
    G -->|Sim| H[Exibir erro]
    H --> E
    G -->|Não| I[Bloquear conta 30 min]
    I --> J[Fim]
    C --> K[Exibir dados]
    K --> J
```

### Convenções:

- `[]`: processo/ação (retângulo)
- `{}`: decisão/condição (losango)
- `()``: início/fim (cápsula)
- `[()]`: sub-rotina
- Direções: TD (top-down), LR (left-right), BT, RL

---

## 5. Diagrama de Classes (UML)

### Template

```mermaid
classDiagram
    class Usuario {
        -String id
        -String nome
        -String email
        -String senhaHash
        +autenticar(senha) bool
        +atualizarPerfil(dados) void
    }
    class Pedido {
        -String id
        -Date data
        -Decimal total
        -String status
        +calcularTotal() Decimal
        +cancelar() void
    }
    class Produto {
        -String id
        -String nome
        -Decimal preco
        -int estoque
        +reservarEstoque(qtd) bool
    }
    Usuario "1" --> "*" Pedido : realiza
    Pedido "*" --> "*" Produto : contém
```

### Convenções:

- `+`: público, `-`: privado, `#`: protegido
- `<<interface>>`, `<<abstract>>`: estereótipos
- Herança: `ClasseFilha --|> ClassePai`
- Implementação: `Classe ..|> Interface`
- Composição: `*--`, Agregação: `o--`

---

## 6. Diagrama de Estados

### Template

```mermaid
stateDiagram-v2
    [*] --> Rascunho
    Rascunho --> Revisao: submeter
    Revisao --> Rascunho: solicitarAlteracao
    Revisao --> Aprovado: aprovar
    Revisao --> Rejeitado: rejeitar
    Aprovado --> Publicado: publicar
    Publicado --> Arquivado: arquivar
    Aprovado --> [*]
    Rejeitado --> [*]
    Arquivado --> [*]
```

---

## 7. Gráfico de Gantt / Roadmap

### Template

```mermaid
gantt
    title Roadmap do Projeto
    dateFormat  YYYY-MM-DD
    axisFormat  %b %d
    section Fundação
    Setup do Projeto       :done,    s1, 2026-07-01, 3d
    Arquitetura Base       :done,    s2, after s1, 5d
    section MVP
    Autenticação           :active,  a1, 2026-07-10, 5d
    CRUD Principal         :         a2, after a1, 8d
    Dashboard              :         a3, after a2, 5d
    section Melhorias
    Notificações           :         n1, 2026-08-01, 5d
    Relatórios             :         n2, after n1, 8d
    section Lançamento
    Testes e QA            :         t1, 2026-08-15, 5d
    Deploy Produção        :milestone, m1, 2026-08-20, 0d
```

---

## 8. Mapa Mental

### Template

```mermaid
mindmap
  root((Projeto))
    Frontend
      React
        Componentes
        Hooks
        Router
      Estado
        Context API
        Zustand
    Backend
      API
        REST
        GraphQL
      Banco
        PostgreSQL
        Redis
    DevOps
      CI/CD
        GitHub Actions
      Deploy
        Docker
        Kubernetes
```

---

## 9. Diagrama de Caso de Uso

### Template

```mermaid
flowchart LR
    subgraph Sistema
        UC1[Registrar-se]
        UC2[Fazer Login]
        UC3[Criar Pedido]
        UC4[Gerenciar Produtos]
        UC5[Gerar Relatório]
    end
    U((Usuário)) --> UC1
    U --> UC2
    U --> UC3
    A((Admin)) --> UC2
    A --> UC4
    A --> UC5
    UC1 -.->|extend| UC2
    UC3 -.->|include| UC2
```

---

## 10. Procedimento

### Ao criar diagramas:

1. **Ativar ferramentas** — Chame `activate_mermaid_diagram_tools` primeiro
2. **Identificar o tipo** — Qual diagrama melhor representa o conceito?
3. **Consultar sintaxe** — Use `mermaid-diagram-validator` para validar
4. **Criar** — Escreva o código Mermaid
5. **Validar** — Execute o validador
6. **Preview** — Use `mermaid-diagram-preview` para visualizar
7. **Salvar** — Salve o código `.mmd` e/ou exporte a imagem em `.github/artifacts/diagrams/`

### Regras:

- SEMPRE use `activate_mermaid_diagram_tools` antes de criar diagramas
- SEMPRE valide a sintaxe com o validador antes do preview
- SEMPRE salve os arquivos `.mmd` (código fonte) em `.github/artifacts/diagrams/`
- Prefira diagramas com direção top-down (TD) para fluxos
- Use notas (`Note`) para adicionar contexto quando necessário
- Mantenha diagramas focados — um conceito por diagrama
- Use `vscode_askQuestions` se precisar decidir qual tipo de diagrama usar
