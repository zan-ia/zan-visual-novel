# Testes — Zan Visual Novel

Diretório de artefatos de teste para regressão completa da plataforma.

## Estrutura

| Arquivo | Conteúdo |
|---------|----------|
| `test-specification.md` | Plano de teste formal (IEEE 829 adaptado) com matriz de rastreabilidade, 34 casos de teste e fluxos E2E |
| `task-browser-scripts.md` | Scripts executáveis passo a passo para o agente `task-browser` do GitHub Copilot |
| `test-data-seed.md` | Especificação da massa de dados de teste (usuários, VNs, capítulos, cenas, saves, créditos) |

## Como Usar

### 1. Preparar ambiente

```bash
# Garantir que tudo está rodando
npm run dev

# Seedar banco com dados de teste
npm run db:seed:test
```

### 2. Executar testes via task-browser

No Copilot Chat, use o comando:

```
@task-browser execute os scripts em .github/artifacts/tests/task-browser-scripts.md
```

Ou individualmente:

```
@task-browser execute o Fluxo 1 de .github/artifacts/tests/task-browser-scripts.md
```

### 3. Registrar resultados

Preencha a tabela de relatório em `test-specification.md` após cada execução.

## Cobertura

| Módulo | Casos de Teste |
|--------|---------------|
| Client — Auth | 4 |
| Client — Library | 3 |
| Client — Player | 8 |
| Client — Profile/Layout | 2 |
| Dashboard — Auth | 1 |
| Dashboard — VN List | 2 |
| Dashboard — Editor | 7 |
| Dashboard — Analytics/Layout | 2 |
| Backend API | 5 |
| **Total** | **34** |

## Ordem de Execução Recomendada

```
F4 (API Health) → F2 (Criador) → F1 (Jogador) → F3 (Créditos) → F6 (Erros) → F5 (Layout)
```

> **F2 antes de F1** garante que há VNs publicadas para testar a biblioteca e o player.
