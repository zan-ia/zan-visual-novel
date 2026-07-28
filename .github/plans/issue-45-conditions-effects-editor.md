# Implementation Plan — Issue #45

**Issue:** [#45](https://github.com/zan-ia/zan-visual-novel/issues/45) — feat: add conditions and effects editor for choices in dashboard
**Type:** feature
**Complexity:** medium
**Date:** 2026-07-27
**Branch:** `feat/conditions-effects-editor`

## Summary

Add conditions and effects editing UI to the dashboard's choice editor. The DB schema (`choice_conditions`, `choice_effects`) and TypeScript types (`ChoiceCondition`, `ChoiceEffect`) already exist. The engine already evaluates conditions and applies effects. Only the UI and API persistence layer are missing.

## Files to Modify

| File                                          | Action | Description                                             |
| --------------------------------------------- | ------ | ------------------------------------------------------- |
| `apps/dashboard/src/pages/vn-editor-page.tsx` | MODIFY | Add conditions/effects inline editors in choice section |
| `apps/dashboard/src/styles/global.css`        | MODIFY | Add styles for conditions/effects panels                |
| `backend/api/src/routes/vn.routes.ts`         | MODIFY | Save conditions/effects in POST/PUT choice endpoints    |
| `packages/shared/src/schemas/index.ts`        | MODIFY | Add condition/effect Zod schemas, update choice schemas |

## Implementation Order

### Step 1: Zod Validation Schemas

**File:** `packages/shared/src/schemas/index.ts`

Add schemas for conditions and effects, then update `createChoiceSchema` and `updateChoiceSchema` to include them:

```typescript
// Condition operator enum
const conditionOperatorSchema = z.enum([
  'eq',
  'neq',
  'gt',
  'lt',
  'gte',
  'lte',
  'in',
  'not_in',
  'exists',
]);

// Effect action enum
const effectActionSchema = z.enum(['set', 'add', 'toggle', 'push']);

// Condition schema
const choiceConditionSchema = z.object({
  variableName: z.string().min(1).max(100),
  operator: conditionOperatorSchema,
  value: z.unknown(),
});

// Effect schema
const choiceEffectSchema = z.object({
  variableName: z.string().min(1).max(100),
  action: effectActionSchema,
  value: z.unknown(),
});
```

Update `createChoiceSchema` and `updateChoiceSchema` to accept optional `conditions` and `effects` arrays.

### Step 2: API Persistence

**File:** `backend/api/src/routes/vn.routes.ts`

Update the POST `/choices` and PUT `/choices/:choiceId` routes to:

1. Accept `conditions` and `effects` in the request body
2. Delete existing conditions/effects for the choice before inserting new ones (upsert pattern)
3. Insert new conditions/effects into `choiceConditions` and `choiceEffects` tables
4. Return conditions/effects in GET responses

### Step 3: UI — Conditions Editor

**File:** `apps/dashboard/src/pages/vn-editor-page.tsx`

Add an inline conditions section within each choice card:

- Toggle to expand/collapse "Condições" section
- "➕ Adicionar Condição" button
- Each condition row: Flag name input, operator dropdown (== != > < >= <=), value input, delete button
- Preview text below: "Se `flag` `op` `value`" (e.g., "Se health > 50")
- Multiple conditions shown with "E" (AND) between them
- Save button to persist conditions

### Step 4: UI — Effects Editor

**File:** `apps/dashboard/src/pages/vn-editor-page.tsx`

Add an inline effects section within each choice card:

- Toggle to expand/collapse "Efeitos" section
- "➕ Adicionar Efeito" button
- Each effect row: Flag name input, action dropdown (set/add/toggle/push), value input, delete button
- Preview text: "`action` `flag` = `value`" (e.g., "set trustLevel = 5")
- Effects shown in order with index numbers
- Save button to persist effects

### Step 5: CSS Styles

**File:** `apps/dashboard/src/styles/global.css`

Add styles for:

- `.choice-conditions-panel` / `.choice-effects-panel` — collapsible container
- `.condition-row` / `.effect-row` — flex row with inputs
- `.condition-preview` / `.effect-preview` — preview text styling

### Step 6: Build Verification

Run `npx turbo build --filter=@zan-vn/shared --filter=@zan-vn/api --filter=@zan-vn/dashboard` to verify no regressions.

## Acceptance Criteria Verification

| #   | Criterion                        | How Verified                                               |
| --- | -------------------------------- | ---------------------------------------------------------- |
| 1   | Conditions UI in choice editor   | Manual: expand "Condições" in any choice                   |
| 2   | Effects UI in choice editor      | Manual: expand "Efeitos" in any choice                     |
| 3   | Conditions/effects persist in DB | Manual: save choice, reload page, verify data              |
| 4   | Textual preview                  | Visual: preview text shown below each condition/effect row |
| 5   | Validation prevents invalid      | Zod schema validation in API + client-side check           |
