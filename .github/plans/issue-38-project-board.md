# Implementation Plan — Issue #38

**Issue:** [#38](https://github.com/zan-ia/zan-visual-novel/issues/38) — feat: setup GitHub Project Board and issue templates for pipeline workflow
**Type:** feature
**Complexity:** low
**Date:** 2026-07-27
**Branch:** `feat/project-board-templates`

## Summary

Create three standardized issue templates (bug, feature, improvement) aligned with the pipeline workflow defined in `.github/instructions/pipeline-workflow.instructions.md`, and document the manual steps required to set up the GitHub Project Board (Projects V2) with columns, milestone associations, and automation. The existing `bug_report.md` and `feature_request.md` will be renamed to `bug.md` and `feature.md`, their frontmatter and sections updated, and a new `improvement.md` template created. The Project Board itself must be created via the GitHub UI (no API tool available), so the plan includes step-by-step instructions for the user.

## Files to Modify/Create

| File | Action | Description |
|------|--------|-------------|
| `.github/ISSUE_TEMPLATE/bug_report.md` | RENAME → `bug.md` + MODIFY | Rename to `bug.md`, update frontmatter (title prefix `fix:`, labels `['bug']`), add `Motivação` and `Referências` sections |
| `.github/ISSUE_TEMPLATE/feature_request.md` | RENAME → `feature.md` + MODIFY | Rename to `feature.md`, update frontmatter (title prefix `feat:`, labels `['enhancement']`), add `Referências` section |
| `.github/ISSUE_TEMPLATE/improvement.md` | CREATE | New template for improvements (`improve:`, labels `['improvement']`) with sections: Motivação, Descrição, Critérios de Aceite, Referências |
| `.github/ISSUE_TEMPLATE/config.yml` | MODIFY | Minor update — already has `blank_issues_enabled: false`, no major changes needed, but ensure contact link is correct |
| *(GitHub UI)* Project Board | CREATE | Manual setup via github.com/zan-ia/zan-visual-novel/projects — Projects V2 with columns: Backlog, To Do, In Progress, Review, Done |
| *(GitHub UI)* Milestones | CREATE | Verify M1, M3, M4 exist as milestones (M0 already exists as milestone #1); create if missing |
| *(GitHub UI)* Board Automation | CONFIGURE | Set workflow: closed issues → Done column |

## Patterns to Follow

- **Pipeline workflow templates**: The canonical templates are defined in `.github/instructions/pipeline-workflow.instructions.md` (Phase 1 — Issue Creation). Each issue template must match the corresponding pipeline template structure exactly.
- **Existing template format**: Current templates use YAML frontmatter with `name`, `about`, `title`, `labels`, `assignees`. Follow this same frontmatter convention.
- **Portuguese language**: All templates are in Brazilian Portuguese, consistent with existing `bug_report.md` and `feature_request.md`.
- **Checkbox areas**: Existing templates use a consistent `[ ] Client (Player) / Dashboard / Backend / Engine / IA / Infra` section pattern. The new improvement template should include a similar area section.
- **Section structure**: Each template should follow this model:
  ```markdown
  ## Motivação
  ## Descrição
  ## Critérios de Aceite
  ## Referências
  ```
  With issue-type-specific additions where appropriate (Steps to Reproduce for bugs, Impact for improvements).

## Template Content Specifications

### `bug.md` (RENAME + MODIFY from `bug_report.md`)

**Frontmatter:**
```yaml
---
name: Bug Report
about: Reportar um problema ou comportamento inesperado
title: 'fix: '
labels: ['bug']
assignees: []
---
```

**Sections:**
1. **Motivação** — *NEW* — "<!-- Por que este bug precisa ser corrigido? Qual o impacto? -->"
2. **Descrição do Bug** (existing)
3. **Passos para Reproduzir** (existing)
4. **Comportamento Esperado** (existing)
5. **Comportamento Atual** (existing)
6. **Screenshots** (existing)
7. **Critérios de Aceite** — *NEW* — checklist do que define a correção como completa
8. **Ambiente** (existing — SO, Navegador, Branch)
9. **Severidade** (existing — Critical/High/Medium/Low)
10. **Área** (existing — Client/Dashboard/Backend/Engine/IA/Infra)
11. **Referências** — *NEW* — "<!-- Links, docs, arquivos relacionados -->"

### `feature.md` (RENAME + MODIFY from `feature_request.md`)

**Frontmatter:**
```yaml
---
name: Feature Request
about: Sugerir uma nova funcionalidade
title: 'feat: '
labels: ['enhancement']
assignees: []
---
```

**Sections:**
1. **Motivação** (existing)
2. **Descrição** (existing — currently "Descrição da Feature")
3. **Critérios de Aceite** (existing)
4. **Design / UX** (existing)
5. **Impacto Técnico** (existing)
6. **Prioridade** (existing)
7. **Área** (existing — add Infra option)
8. **Referências** — *NEW* — "<!-- Links, docs, referências -->"

### `improvement.md` (CREATE)

**Frontmatter:**
```yaml
---
name: Improvement
about: Sugerir uma melhoria ou refatoração
title: 'improve: '
labels: ['improvement']
assignees: []
---
```

**Sections:**
1. **Motivação** — "<!-- Por que esta melhoria é necessária? Qual problema resolve? -->"
2. **Descrição** — "<!-- O que será melhorado ou refatorado -->"
3. **Critérios de Aceite** — checklist
4. **Impacto Técnico** — "<!-- Componentes, pacotes, APIs afetados -->"
5. **Risco** — `[ ] 🔴 Critical / [ ] 🟡 High / [ ] 🟢 Medium / [ ] ⚪ Low`
6. **Área** — same checkbox pattern as other templates
7. **Referências** — "<!-- Links, docs, PRs relacionados -->"

## Implementation Order

### Step 1: Rename + Update `bug_report.md` → `bug.md`

- Delete `bug_report.md` and create `bug.md` with updated frontmatter and new sections
- Add **Motivação** section at top (after frontmatter)
- Add **Critérios de Aceite** section after Comportamento Atual
- Add **Referências** section at end
- Keep all existing sections (Descrição, Passos, Comportamento Esperado/Atual, Screenshots, Ambiente, Severidade, Área)

### Step 2: Rename + Update `feature_request.md` → `feature.md`

- Delete `feature_request.md` and create `feature.md` with updated frontmatter
- Rename "Descrição da Feature" → "Descrição" for consistency
- Add **Referências** section at end
- Add **Infra** checkbox option to Área section

### Step 3: Create `improvement.md`

- New file with frontmatter and sections as specified above

### Step 4: Update `config.yml`

- No changes needed — already has `blank_issues_enabled: false` and correct contact link
- Verify the content is correct

### Step 5: Document Manual Steps for GitHub UI

- Provide clear instructions for:
  1. Creating the GitHub Project Board (Projects V2)
  2. Creating milestones M1, M3, M4 (if not existing)
  3. Setting up automation rules
  4. Categorizing existing issues into the board

## Manual Steps (GitHub UI — No API Available)

Since the GitHub MCP tools do not support Projects V2 API, the following must be done manually by the user:

### 5.1 Create Project Board

1. Go to https://github.com/zan-ia/zan-visual-novel/projects
2. Click **"Create project"** → select **"Board"** template
3. Name: **"Zan Visual Novel Pipeline"**
4. Columns (rename defaults):
   - **Backlog** — issues a serem priorizadas
   - **To Do** — issues prontas para iniciar
   - **In Progress** — issues em desenvolvimento
   - **Review** — aguardando code review / QA
   - **Done** — concluídas

### 5.2 Create Milestones (if missing)

M0 already exists (milestone #1 — "M0 — Organizacional"). Create the others if they don't exist:

| Milestone | Title | Description |
|-----------|-------|-------------|
| M0 | M0 — Organizacional | ✅ Already exists — milestones/1 |
| M1 | M1 — Fundação | Core do player e API (auth, VN CRUD, engine base) |
| M3 | M3 — Criação | Dashboard creator, editor de VN, publicação |
| M4 | M4 — Monetização | Créditos, Stripe, analytics, PWA |

To create: https://github.com/zan-ia/zan-visual-novel/milestones → **"Create a milestone"**

### 5.3 Associate Milestones with Board

In the Project Board settings:
1. Add fields: **Milestone** (custom field type "Milestone")
2. Group or filter by milestone to visualize per-milestone progress

### 5.4 Configure Automation

In the Project Board settings → **Workflows**:
1. Create workflow: **"Close issue → Move to Done"**
   - Trigger: When an issue is closed
   - Action: Move item to **Done** column
2. (Optional) Create workflow: **"New issue → Move to Backlog"**
   - Trigger: When an issue is opened
   - Action: Move item to **Backlog** column

### 5.5 Categorize Existing Issues

After creating the board, manually add existing issues:
1. Open each open issue
2. In the **Projects** section (right sidebar), select "Zan Visual Novel Pipeline"
3. Set the correct column and milestone
4. Or use the board UI to drag-and-drop issues into columns

### 5.6 Create `improvement` Label

Since the improvement template uses label `['improvement']`:
1. Go to https://github.com/zan-ia/zan-visual-novel/labels
2. Check if `improvement` label exists; if not, create it with a distinctive color (e.g., `#fbca04` — orange)

## Identified Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Project Board creation not automatable** | low | Document step-by-step manual instructions; user must execute via GitHub UI |
| **Milestones M1, M3, M4 may not exist as milestone objects** | medium | Plan includes creation instructions; verify after board setup; if they only exist as labels, delete labels and create proper milestones |
| **Template renaming breaks existing issue references** | low | Old template files (`bug_report.md`, `feature_request.md`) are only used when creating *new* issues; existing issues are unaffected |
| **`improvement` label missing** | low | Document manual label creation step; add to implementation checklist |

## Post-Implementation Verification

- [ ] `.github/ISSUE_TEMPLATE/bug.md` exists with correct sections and frontmatter
- [ ] `.github/ISSUE_TEMPLATE/feature.md` exists with correct sections and frontmatter
- [ ] `.github/ISSUE_TEMPLATE/improvement.md` exists with correct sections and frontmatter
- [ ] `.github/ISSUE_TEMPLATE/config.yml` has `blank_issues_enabled: false`
- [ ] Old files `bug_report.md` and `feature_request.md` removed
- [ ] Project Board created with 5 columns (Backlog, To Do, In Progress, Review, Done)
- [ ] Milestones M0, M1, M3, M4 exist and are associated with the board
- [ ] Automation configured: closed issues → Done
- [ ] All existing issues categorized in the board
- [ ] `improvement` label exists in the repository
