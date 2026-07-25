---
name: product-engineering
description: "Reference knowledge for product engineering — user stories, prioritization frameworks, MVP scoping, metrics, roadmapping, and product discovery. Use when: writing user stories, prioritizing a backlog, defining MVPs, choosing metrics, planning a roadmap, or evaluating product decisions. Activates for: product, user story, prioritization, mvp, roadmap, metrics, kpi, okr, jobs to be done, prd, requirements."
user-invocable: true
disable-model-invocation: false
context: fork
---

# Product Engineering — Reference Knowledge

Reference for product thinking and decision-making. This is a **knowledge skill** — it provides reference, not a workflow.

---

## 1. User Story Format

### Standard template

```
As a [persona]
I want to [action/capability]
So that [benefit/reason]
```

### Example

```
As a returning customer
I want to view my previous orders
So that I can reorder items I liked without searching
```

### Acceptance Criteria (Given/When/Then)

```
Given [context]
When [action]
Then [outcome]
```

### INVEST criteria for good stories

- **I**ndependent: no dependencies on other stories
- **N**egotiable: not too prescriptive
- **V**aluable: delivers value to user
- **E**stimable: can be sized
- **S**mall: fits in a sprint
- **T**estable: has clear acceptance criteria

### Story splitting

When a story is too big, split by:

- **Workflow step**: each step in a multi-step flow
- **Business rule variation**: different rules = different stories
- **Data variation**: different data types
- **Interface variation**: web, mobile, API
- **Complexity layer**: simple case, then complex case
- **Defer performance**: ship working, optimize later
- **Spike**: research story that produces a follow-up

## 2. Prioritization Frameworks

### RICE Score

- **R**each: how many users per quarter
- **I**mpact: massive (3), high (2), medium (1), low (0.5), minimal (0.25)
- **C**onfidence: percentage (100%, 80%, 50%)
- **E**ffort: person-months
- **Score = (R × I × C) / E**

### MoSCoW

- **Must have**: critical for the release
- **Should have**: important but not critical
- **Could have**: nice to have if time allows
- **Won't have (this time)**: explicitly out of scope

### Value vs. Effort Matrix

```
        High Value
            |
   Quick    |   Big Bets
   Wins     |   (plan)
            |
Low --------+-------- High
Effort      |       Effort
            |
   Money     |   Time
   Pits      |   Sinks
   (avoid)   |   (avoid)
            |
        Low Value
```

### Weighted Scoring

1. List criteria (e.g., user value, revenue impact, strategic fit, risk)
2. Assign weights (sum to 100%)
3. Score each option 1-5 on each criterion
4. Multiply: score × weight
5. Sum per option

### RICE vs. other frameworks

- **RICE**: best when you have reach data
- **MoSCoW**: best for stakeholder alignment
- **Kano**: best for understanding satisfaction impact
- **Weighted scoring**: best for comparing diverse factors

## 3. Kano Model (Satisfaction)

Categorize features by their impact on satisfaction:

| Type                              | Absent       | Present                   |
| --------------------------------- | ------------ | ------------------------- |
| **Must-be** (basic)               | Dissatisfied | Neutral (expected)        |
| **One-dimensional** (performance) | Dissatisfied | Satisfied (more = better) |
| **Attractive** (delighters)       | Neutral      | Very satisfied            |
| **Indifferent**                   | Neutral      | Neutral                   |
| **Reverse**                       | Satisfied    | Dissatisfied              |

Insight: must-be features are table stakes; one-dimensional are competitive; attractive features create loyalty.

## 4. MVP Scoping

### MVP is not "bad version of the product"

It's the **smallest thing that delivers validated learning** to inform next steps.

### Scoping techniques

- **Walking skeleton**: end-to-end thin slice (one feature, all layers)
- **Concierge**: manual service behind the UI (test the experience)
- **Wizard of Oz**: fake the AI/backend, real UI
- **Piecemeal**: smallest user-valuable feature

### Anti-patterns

- **MVP with no validation**: building without learning
- **MVP with too much**: becomes a v1.0 with bugs
- **MVP with no users**: no feedback loop
- **MVP that lies**: misrepresents what the product does

## 5. Jobs to Be Done (JTBD)

### Core idea

Customers "hire" products to do a "job" in their lives. Focus on the job, not the feature.

### Job statement

```
When [situation/context]
I want to [motivation]
So I can [expected outcome]
```

### Example

```
When I'm commuting on the train
I want to listen to industry news
So I can stay informed without reading
```

### Implications

- Competing products may serve the same job differently
- Features matter less than outcomes
- Better jobs understanding → better positioning

## 6. Metrics That Matter

### North Star Metric

The single metric that best captures the value the product delivers to users.

Examples:

- **Airbnb**: nights booked
- **Spotify**: time spent listening
- **Facebook**: daily active users
- **WhatsApp**: messages sent

### Framework: AARRR (Pirate Metrics)

- **Acquisition**: how do users find us
- **Activation**: do they have a great first experience
- **Retention**: do they come back
- **Revenue**: do they pay
- **Referral**: do they tell others

### Good vs. Bad Metrics

**Good metrics (North Star):**

- Reflects user value
- Leading indicator of success
- Actionable
- Auditable

**Bad metrics (Vanity):**

- Easy to game
- No clear action to improve
- Don't predict business outcomes

### Counter-metrics (guardrails)

For every improvement, watch for unintended consequences:

- Conversion ↑ but quality ↓
- Engagement ↑ but retention ↓
- Speed ↑ but accuracy ↓

## 7. Roadmap Planning

### Horizons

- **H1 (now)**: shipping this quarter, mostly known
- **H2 (next)**: next 1-2 quarters, more uncertainty
- **H3 (future)**: 3-6+ quarters, strategic bets

### Themes vs. Features

Group features into themes:

- **Activation**: improve new user experience
- **Retention**: bring users back
- **Monetization**: increase revenue
- **Platform**: enable future work

Themes should map to business outcomes, not outputs.

### Now/Next/Later

Simple alternative to date-based roadmaps:

- **Now**: current sprint
- **Next**: up next
- **Later**: after that

Avoids false precision.

## 8. Product Discovery

### Continuous discovery (Teresa Torres)

- Talk to customers **every week**
- Frame opportunities as **opportunity solution trees**
- Test assumptions with **small experiments** before building

### Opportunity Solution Tree

```
Outcome (business goal)
├── Opportunities (customer needs, pains, desires)
│   ├── Solutions (ways to address)
│   │   ├── Experiments (tests of solutions)
│   │   └── Results
```

### Assumption testing

- **Desirability**: do they want it
- **Viability**: does it make business sense
- **Feasibility**: can we build it

Test the riskiest assumption first.

## 9. Writing PRDs

### Structure

1. **Problem**: what user pain exists
2. **Goal**: what outcome we want
3. **Non-goals**: what we're explicitly NOT doing
4. **Personas**: who is affected
5. **User stories**: how they experience the change
6. **Requirements**: functional and non-functional
7. **Success metrics**: how we measure success
8. **Risks**: what could go wrong
9. **Open questions**: what we don't know yet
10. **Timeline**: rough phasing

### Tips

- One problem per PRD
- "Why" before "what"
- Explicit non-goals prevent scope creep
- Risks with mitigations, not just risks

## 10. Stakeholder Communication

- **Exec**: outcomes, metrics, risks, decisions needed
- **Engineering**: requirements, constraints, trade-offs
- **Design**: user needs, brand consistency
- **Sales/CS**: positioning, common questions
- **Customers**: what changed and why it matters to them

## 11. Anti-Patterns

| Anti-pattern                              | Symptom                              | Fix                          |
| ----------------------------------------- | ------------------------------------ | ---------------------------- |
| **Feature factory**                       | Many features, no impact             | Tie to outcomes, measure     |
| **HiPPO** (Highest Paid Person's Opinion) | Decisions by authority, not data     | Demand evidence              |
| **We built it, they will come**           | Build first, users later             | Discovery first              |
| **Premature scaling**                     | Optimizing before product-market fit | Find fit, then scale         |
| **Boiling the ocean**                     | Trying to do everything              | Ruthless prioritization      |
| **Roadmap as commitment**                 | "We promised this date"              | Roadmap as plan, not promise |
| **Vanity metrics**                        | Reporting what looks good            | North Star + counter-metrics |

## 12. When to Apply This Skill

Load this skill when:

- Writing user stories or PRDs
- Prioritizing a backlog
- Defining an MVP
- Choosing metrics
- Planning a roadmap
- Evaluating product decisions
- Framing a problem
- Resolving scope debates

For project-specific product context, consult the project README and existing PRDs.
