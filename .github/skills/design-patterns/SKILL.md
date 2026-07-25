---
name: design-patterns
description: "Reference knowledge of classic and modern software design patterns (GoF, GRASP, enterprise, concurrency, anti-patterns). Use when: making architectural decisions, choosing how to structure components, refactoring existing code, evaluating design trade-offs, or reviewing code for design quality. Activates for: design pattern, architecture, refactoring strategy, decoupling, extensibility, anti-pattern, code smell."
user-invocable: true
disable-model-invocation: false
context: fork
---

# Design Patterns — Reference Knowledge

Catalog of design patterns grouped by category. This is a **knowledge skill** — it provides reference material, not a workflow. Load it when making design decisions or evaluating code structure.

---

## 1. Creational Patterns

Concerned with object creation mechanisms.

| Pattern              | When to use                                                            | Trade-off                               |
| -------------------- | ---------------------------------------------------------------------- | --------------------------------------- |
| **Factory Method**   | Subclasses decide which class to instantiate                           | Couples creator to product hierarchy    |
| **Abstract Factory** | Families of related objects (e.g., UI widgets for different platforms) | Hard to extend with new product types   |
| **Builder**          | Complex object with many optional parts (e.g., query builder, config)  | Verbose; builder class is overhead      |
| **Prototype**        | Clone existing objects instead of creating from scratch                | Deep clone is tricky with circular refs |
| **Singleton**        | Exactly one instance (config, logger, connection pool)                 | Hides dependencies, hard to test        |

## 2. Structural Patterns

Concerned with how classes and objects are composed.

| Pattern       | When to use                                                         | Trade-off                             |
| ------------- | ------------------------------------------------------------------- | ------------------------------------- |
| **Adapter**   | Bridge incompatible interfaces (e.g., legacy + new API)             | Doesn't add functionality             |
| **Bridge**    | Separate abstraction from implementation (e.g., shape × renderer)   | Increases number of classes           |
| **Composite** | Tree structures (UI tree, file system, org chart)                   | Hard to restrict component types      |
| **Decorator** | Add behavior dynamically without subclassing (e.g., middleware)     | Many small objects; order matters     |
| **Facade**    | Simple interface to complex subsystem (e.g., API client)            | Becomes god-object over time          |
| **Flyweight** | Many similar objects share state to save memory (e.g., text glyphs) | Splits state into intrinsic/extrinsic |
| **Proxy**     | Control access (lazy, remote, protection, cache, logging)           | Adds indirection                      |

## 3. Behavioral Patterns

Concerned with communication and responsibility between objects.

| Pattern                     | When to use                                                     | Trade-off                               |
| --------------------------- | --------------------------------------------------------------- | --------------------------------------- |
| **Chain of Responsibility** | Pass request through handlers (e.g., middleware, auth)          | Hard to debug; no guarantee of handling |
| **Command**                 | Encapsulate request as object (undo, queue, log)                | Lots of small classes                   |
| **Iterator**                | Traverse collection without exposing internals                  | Overkill for simple collections         |
| **Mediator**                | Central hub for inter-component communication (e.g., event bus) | Mediator becomes god-object             |
| **Memento**                 | Snapshot for undo/rollback                                      | Memory cost for large states            |
| **Observer**                | Notify subscribers on events (pub/sub, event emitter)           | Memory leaks if not unsubscribed        |
| **State**                   | Behavior depends on internal state (e.g., FSM, workflow)        | Number of states can explode            |
| **Strategy**                | Interchangeable algorithms at runtime (e.g., sort strategies)   | Client must know about strategies       |
| **Template Method**         | Fixed skeleton, variable steps in subclasses                    | Inheritance-based (limits flexibility)  |
| **Visitor**                 | Operations on object structure without changing classes         | Hard to add new element types           |

## 4. GRASP Principles (General Responsibility Assignment Software Patterns)

| Principle                   | Question it answers                                                             |
| --------------------------- | ------------------------------------------------------------------------------- |
| **Information Expert**      | Who has the info needed? → Assign responsibility to that class                  |
| **Creator**                 | Who creates instances of A? → Class that contains, aggregates, or records A     |
| **Controller**              | Who handles system events? → A non-UI class representing the use case           |
| **Low Coupling**            | How to minimize dependencies? → Assign responsibilities to reduce connections   |
| **High Cohesion**           | How to keep classes focused? → Assign related responsibilities together         |
| **Indirection**             | How to decouple? → Insert an intermediate object                                |
| **Protected Variations**    | How to shield from change? → Wrap unstable elements with stable interfaces      |
| **Polymorphism**            | How to handle variations? → Use subtype polymorphism                            |
| **Pure Fabrication**        | Where to put responsibilities that don't fit domain? → Invent a synthetic class |
| **Don't Talk to Strangers** | Only talk to immediate neighbors (Law of Demeter)                               |

## 5. Enterprise Patterns (selected)

| Pattern                        | Purpose                                                              |
| ------------------------------ | -------------------------------------------------------------------- |
| **Repository**                 | Encapsulate data access; provides collection-like interface          |
| **Unit of Work**               | Track changes and commit as a single transaction                     |
| **Aggregate**                  | Cluster of domain objects treated as a single unit (DDD)             |
| **Domain Event**               | Capture what happened in the past tense; decouple bounded contexts   |
| **Saga**                       | Coordinate long-running transactions across services                 |
| **CQRS**                       | Separate read and write models for performance or clarity            |
| **Event Sourcing**             | Store state as sequence of events; rebuild current state from events |
| **BFF (Backend for Frontend)** | Tailored API per client (web, mobile)                                |
| **Strangler Fig**              | Incrementally replace legacy system by routing traffic               |

## 6. Concurrency Patterns (selected)

| Pattern                    | When to use                                                |
| -------------------------- | ---------------------------------------------------------- |
| **Active Object**          | Decouple method execution from invocation (own thread)     |
| **Balking**                | Skip operation if object is in wrong state                 |
| **Double-Checked Locking** | Lazy init with thread safety, minimal locking overhead     |
| **Guarded Suspension**     | Wait for a condition to be true                            |
| **Immutable Object**       | Avoid synchronization entirely by making objects read-only |
| **Producer-Consumer**      | Decouple data production from consumption via queue        |
| **Reader-Writer Lock**     | Multiple concurrent reads, exclusive write                 |
| **Thread Pool**            | Reuse threads to amortize creation cost                    |
| **Semaphore**              | Limit concurrent access to N resources                     |

## 7. Anti-Patterns to Avoid

| Anti-pattern               | Symptom                                          | Fix                                    |
| -------------------------- | ------------------------------------------------ | -------------------------------------- |
| **God Object**             | One class knows/does everything                  | Split by responsibility (SRP)          |
| **Spaghetti Code**         | Tangled control flow, no structure               | Refactor to layered architecture       |
| **Big Ball of Mud**        | No discernible architecture                      | Define boundaries; introduce modules   |
| **Lava Flow**              | Dead code kept "just in case"                    | Delete unused code (VCS has history)   |
| **Copy-Paste Programming** | Duplicated logic across files                    | Extract to shared function/module      |
| **Golden Hammer**          | Same tool/pattern for every problem              | Match the tool to the problem          |
| **Premature Optimization** | Optimizing before measuring                      | Profile first, then optimize hot paths |
| **Anemic Domain Model**    | Domain objects are pure data; logic in services  | Move behavior into the domain objects  |
| **Poltergeist**            | Classes that only pass data to others            | Inline or remove                       |
| **Object Orgy**            | Object exposes internals for direct manipulation | Encapsulate; provide behavior methods  |
| **Yo-Yo Problem**          | Long inheritance chains force navigation up/down | Prefer composition over inheritance    |
| **Singleton Overuse**      | Global state everywhere                          | Inject dependencies; use scopes        |

## 8. Code Smells → Refactorings (Fowler)

| Smell                                         | Refactoring                                                                           |
| --------------------------------------------- | ------------------------------------------------------------------------------------- |
| Long Method                                   | Extract Method, Replace Temp with Query, Introduce Parameter Object                   |
| Large Class                                   | Extract Class, Extract Subclass, Extract Interface                                    |
| Long Parameter List                           | Introduce Parameter Object, Preserve Whole Object, Replace Parameter with Method Call |
| Divergent Change                              | Extract Class (one class per axis of change)                                          |
| Shotgun Surgery                               | Move Method, Move Field, Inline Class                                                 |
| Feature Envy                                  | Move Method (to the class that uses the data most)                                    |
| Data Clumps                                   | Extract Class, Introduce Parameter Object                                             |
| Primitive Obsession                           | Replace Primitive with Object, Introduce Parameter Object                             |
| Switch Statements                             | Replace Conditional with Polymorphism                                                 |
| Parallel Inheritance Hierarchies              | Move Method, Move Field                                                               |
| Lazy Class                                    | Inline Class, Collapse Hierarchy                                                      |
| Speculative Generality                        | Collapse Hierarchy, Inline Class, Remove Parameter                                    |
| Temporary Field                               | Extract Class                                                                         |
| Message Chains                                | Hide Delegate, Extract Method, Move Method                                            |
| Middle Man                                    | Remove Middle Man, Inline Class, Replace Delegation with Inheritance                  |
| Inappropriate Intimacy                        | Move Method, Move Field, Change Bidirectional to Unidirectional                       |
| Alternative Classes with Different Interfaces | Rename Method, Move Method                                                            |
| Refused Bequest                               | Replace Inheritance with Delegation, Push Down Field/Method                           |
| Comments                                      | Extract Variable, Extract Method, Rename Method                                       |

## 9. When to Apply This Skill

Load this skill when:

- Reviewing code for architectural quality
- Making "how should I structure this" decisions
- Refactoring legacy code
- Explaining a pattern to a junior team member
- Identifying the pattern (or anti-pattern) in existing code
- Comparing approaches (e.g., "Repository vs DAO", "Observer vs Pub/Sub")

For project-specific conventions, consult `.github/instructions/`. For implementation workflows, use the `planner` or `implementer` agents.
