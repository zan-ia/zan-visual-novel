---
name: experience-engineering
description: "Reference knowledge for user experience (UX) and experience engineering — user research, usability heuristics, information architecture, user journey mapping, and UX patterns. Use when: designing user flows, conducting user research, improving usability, mapping user journeys, or reviewing UX quality. Activates for: ux, user experience, usability, user research, persona, journey, flow, information architecture, hea, accessibility, conversion."
user-invocable: true
disable-model-invocation: false
context: fork
---

# Experience Engineering — Reference Knowledge

Reference for user experience and usability quality. This is a **knowledge skill** — it provides reference, not a workflow.

---

## 1. Nielsen's 10 Usability Heuristics

| #   | Heuristic                                               | Description                                                  |
| --- | ------------------------------------------------------- | ------------------------------------------------------------ |
| 1   | **Visibility of system status**                         | Users always know what's happening (loading, success, error) |
| 2   | **Match between system and real world**                 | Use familiar language, conventions, mental models            |
| 3   | **User control and freedom**                            | Easy undo, escape, cancel — don't trap users                 |
| 4   | **Consistency and standards**                           | Same words, actions, situations = same results               |
| 5   | **Error prevention**                                    | Design to prevent errors before they happen                  |
| 6   | **Recognition rather than recall**                      | Minimize memory load; make options visible                   |
| 7   | **Flexibility and efficiency of use**                   | Accelerators for experts (shortcuts, customizations)         |
| 8   | **Aesthetic and minimalist design**                     | No irrelevant or rarely-needed information                   |
| 9   | **Help users recognize, diagnose, recover from errors** | Plain language, suggest solution                             |
| 10  | **Help and documentation**                              | Easy to search, focused on user's task                       |

## 2. Laws of UX

| Law                     | Description                                            | Implication                                       |
| ----------------------- | ------------------------------------------------------ | ------------------------------------------------- |
| **Aesthetic-Usability** | Users perceive aesthetic designs as more usable        | First impression matters; invest in visual design |
| **Hick's Law**          | Time to decide = log of number of choices              | Limit options; use progressive disclosure         |
| **Fitts's Law**         | Time to acquire target = function of distance and size | Large, close targets are faster (44×44px touch)   |
| **Jakob's Law**         | Users prefer sites that work like others they know     | Follow platform conventions                       |
| **Miller's Law**        | Working memory holds ~7±2 items                        | Chunk content into groups of 5-7                  |
| **Peak-End Rule**       | Experience judged by peak + end, not average           | Hero (peak) + completion (end) must be excellent  |
| **Serial Position**     | First and last items remembered best                   | Place most important content first and last       |
| **Von Restorff**        | Different items are more memorable                     | CTAs should visually stand out                    |
| **Zeigarnik**           | Incomplete tasks remembered better                     | Progress indicators, "complete your profile"      |
| **Doherty Threshold**   | <400ms feels instantaneous                             | Optimize perceived performance                    |
| **Tesler's Law**        | Some complexity is irreducible                         | Don't oversimplify domain-critical complexity     |
| **Pareto (80/20)**      | 80% of effects from 20% of causes                      | Focus on the few high-impact areas                |

## 3. Gestalt Principles

| Principle                 | Description                          | Application                        |
| ------------------------- | ------------------------------------ | ---------------------------------- |
| **Proximity**             | Near things group together           | Spacing separates sections         |
| **Similarity**            | Similar things group together        | Consistent style for same purpose  |
| **Continuity**            | Eye follows lines/curves             | Visual flow guides the eye         |
| **Closure**               | Brain completes incomplete shapes    | Don't over-explain; trust the user |
| **Figure-Ground**         | Foreground separates from background | Contrast for primary content       |
| **Common Region**         | Same bounded area = group            | Cards, panels, sections            |
| **Uniform Connectedness** | Connected = grouped                  | Lines, shared backgrounds          |
| **Prägnanz**              | Simple is perceived first            | Avoid clutter, embrace clarity     |

## 4. Information Architecture

### Organization schemes

- **Hierarchical** (top-down): categories with subcategories
- **Sequential** (step-by-step): onboarding, checkout, tutorials
- **Matrix** (multi-dimensional): search results with multiple filters
- **Alphabetical**: glossaries, directories
- **Chronological**: news, history
- **Geographic**: location-based
- **By audience/role**: dashboards

### Navigation patterns

- **Global navigation**: present on every page (top nav, side nav)
- **Local navigation**: scoped to a section
- **Contextual navigation**: in-content links, breadcrumbs
- **Supplementary**: footer, related items
- **Search**: power users

### Card sorting

- **Open sort**: users create categories
- **Closed sort**: users sort items into predefined categories
- **Hybrid sort**: predefined categories with "other" option
- Use to derive IA from user mental models

## 5. User Research Methods

### Discovery (generative)

- **User interviews**: 30-60 min conversations, "tell me about..."
- **Contextual inquiry**: observe users in their environment
- **Diary studies**: users log activities over time
- **Ethnography**: deep observation of culture and behavior

### Evaluation (validation)

- **Usability testing**: 5 users per round, think-aloud protocol
- **A/B testing**: compare two versions statistically
- **Card sorting**: test IA (see above)
- **Tree testing**: test IA with text-only hierarchy
- **Surveys**: quantitative data, larger samples
- **Heuristic evaluation**: expert review against heuristics

### Continuous

- **Analytics**: what users actually do (vs. what they say)
- **Session recordings**: watch real users
- **Feedback widgets**: in-product feedback
- **Support tickets**: common pain points
- **NPS / CSAT**: satisfaction metrics

## 6. User Journey Mapping

### Components of a journey map

1. **Persona**: who is the user
2. **Scenario**: context and goal
3. **Phases**: high-level stages
4. **Actions**: what they do at each phase
5. **Thoughts**: what they're thinking
6. **Emotions**: how they feel (curve)
7. **Pain points**: frustrations
8. **Opportunities**: where to improve

### Example phases (e-commerce)

Awareness → Consideration → Purchase → Onboarding → Usage → Support → Renewal

## 7. Information Density

- **Progressive disclosure**: show essentials first, details on demand
- **Layered design**: overview → details → expert
- **Defaults**: most common option is the default
- **Smart suggestions**: based on context, history, or all users

## 8. Forms UX

- **Single column**: easier to scan, especially on mobile
- **Labels above**: faster to scan than inline
- **Inline validation**: on blur, not on every keystroke
- **Show password toggle**: for password fields
- **Autofill**: use `autocomplete` for common fields
- **Smart defaults**: prefill when possible
- **Required vs optional**: mark optional (don't make everything required)
- **Don't disable submit**: explain why instead
- **Save drafts**: for long forms
- **Summary before submit**: for multi-step

## 9. Onboarding

- **Progressive**: reveal features as needed, not all at once
- **Interactive**: let users try, don't just show
- **Personalized**: adapt to user role/expertise
- **Skippable**: power users can skip
- **Contextual help**: available when needed, not upfront
- **Empty states**: guide users on what to do first

## 10. Conversion Optimization

### Frameworks

- **AIDA**: Attention, Interest, Desire, Action
- **Cialdini's 6 principles**: reciprocity, commitment, social proof, authority, liking, scarcity
- **Pain-Agitation-Solution (PAS)**: name pain, agitate, offer solution
- **Before-After-Bridge (BAB)**: current state, desired state, how to get there

### Tactics

- **Reduce friction**: fewer steps, fewer fields
- **Social proof**: testimonials, reviews, user counts
- **Urgency**: limited time, limited quantity (only when real)
- **Clear CTAs**: action-oriented, single primary action
- **Trust signals**: security badges, guarantees
- **Risk reversal**: free trial, money-back guarantee

## 11. Common UX Anti-Patterns

| Anti-pattern                | Symptom                         | Fix                             |
| --------------------------- | ------------------------------- | ------------------------------- |
| **Mystery meat navigation** | Unclear icons, no labels        | Add labels; use known icons     |
| **Carousel homepage**       | Low CTR, accessibility issues   | Use static hero with clear CTA  |
| **Modal overload**          | Stack of modals                 | Use inline forms, single dialog |
| **Infinite scroll**         | Can't find footer, no position  | Pagination or "load more"       |
| **Auto-play media**         | Annoying, accessibility issue   | User-initiated only             |
| **Dark patterns**           | Tricks to deceive users         | Honest design                   |
| **Notification spam**       | Users ignore all                | Smart, user-controlled          |
| **Hover-only features**     | Mobile users can't access       | Tap targets, alternatives       |
| **Hidden CTAs**             | "Contact us" instead of buttons | Prominent, action-oriented      |

## 12. When to Apply This Skill

Load this skill when:

- Designing user flows
- Reviewing usability
- Conducting user research
- Mapping user journeys
- Improving conversion
- Diagnosing UX issues
- Planning onboarding

For project-specific UX patterns, consult `.github/instructions/`.
