---
name: backend-engineering
description: "Reference knowledge for backend engineering — API design, data modeling, authentication, integrations, and server-side best practices. Use when: designing APIs, modeling data, choosing authentication strategies, integrating external services, or reviewing server-side code. Activates for: api design, rest, graphql, database, schema, auth, backend, server, integration, microservice."
user-invocable: true
disable-model-invocation: false
context: fork
---

# Backend Engineering — Reference Knowledge

Server-side engineering reference material. This is a **knowledge skill** — it provides reference, not a workflow.

---

## 1. API Design

### REST

- **Resources as nouns**: `/users`, `/orders`, not `/getUser`
- **HTTP verbs**: GET (read), POST (create), PUT/PATCH (update), DELETE (remove)
- **Status codes**: 2xx success, 3xx redirect, 4xx client error, 5xx server error
- **Versioning**: `/v1/users`, `/v2/users`, or via header (`Accept: application/vnd.api+json;version=2`)
- **Filtering/sorting/pagination**: query params (`?status=active&sort=-created_at&page=2&limit=20`)
- **HATEOAS**: optionally include related links
- **Idempotency keys**: for POST that may retry (`Idempotency-Key: <uuid>`)

### GraphQL

- **Single endpoint** (`/graphql`)
- **Schema-first**: define types, queries, mutations
- **Resolvers**: per-field functions
- **DataLoader**: batch and cache to avoid N+1
- **Persisted queries**: send query hash instead of full query
- **Subscriptions**: for real-time (over WebSocket)

### gRPC

- **Protobuf**: schema-first, strongly typed
- **Streaming**: unary, server-streaming, client-streaming, bidirectional
- **Use for**: service-to-service, high throughput, strict contracts
- **Don't use for**: public APIs (poor browser support without proxy)

### Webhooks

- **Outbound**: POST to registered URL when event happens
- **Verify signatures**: HMAC-SHA256 with shared secret
- **Idempotency**: include event ID, allow replay
- **Retry with backoff**: exponential, with jitter
- **Document events clearly**: payload schema, when fired, ordering guarantees

## 2. Data Modeling

### Normalization (1NF, 2NF, 3NF, BCNF)

- **1NF**: atomic values, no repeating groups
- **2NF**: 1NF + no partial dependencies
- **3NF**: 2NF + no transitive dependencies
- **BCNF**: every determinant is a candidate key
- **When to denormalize**: read-heavy workloads, aggregations, materialized views

### Relationships

- **One-to-One**: separate tables with FK, or shared row
- **One-to-Many**: FK on the "many" side
- **Many-to-Many**: junction table
- **Polymorphic**: FK + type column (use sparingly)
- **Self-referential**: tree/graph structures

### Indexes

- **B-tree**: default, good for equality and range
- **Hash**: equality only
- **GIN/Full-text**: text search
- **Composite**: multi-column; leftmost prefix matters
- **Covering**: include all queried columns (avoid row fetch)
- **Partial**: filter to subset (e.g., `WHERE deleted_at IS NULL`)

### Common patterns

- **Soft delete**: `deleted_at TIMESTAMP NULL` instead of DELETE
- **Audit columns**: `created_at`, `updated_at`, `created_by`, `updated_by`
- **Versioning**: optimistic locking with `version` column
- **UUIDs vs auto-increment**: UUIDs for distributed, AI for single-DB
- **Soft FK**: store ID without constraint (for cross-service decoupling)

## 3. Authentication & Authorization

### Authentication (who are you)

| Method                 | Use case                             | Notes                                        |
| ---------------------- | ------------------------------------ | -------------------------------------------- |
| **Sessions + cookies** | Web apps, server-rendered            | CSRF protection needed                       |
| **JWT**                | APIs, SPAs, mobile                   | Hard to revoke; short-lived access + refresh |
| **OAuth 2.0**          | Third-party login (Google, GitHub)   | Delegation, not authentication per se        |
| **OIDC**               | OAuth + identity (ID token)          | Standard for SSO                             |
| **API keys**           | Service-to-service, server-side only | Long-lived; rotate regularly                 |
| **mTLS**               | Service mesh, high security          | Certificate management overhead              |

### Authorization (what can you do)

- **RBAC** (Role-Based): users have roles, roles have permissions
- **ABAC** (Attribute-Based): rules based on attributes (user, resource, context)
- **PBAC** (Policy-Based): external policy engine (OPA, Cedar)
- **Scopes**: limit what an OAuth token can do
- **Multi-tenant isolation**: row-level security (PostgreSQL RLS), schema-per-tenant, or app-level filters

### Best practices

- **Hash passwords**: bcrypt (cost ≥12), Argon2id, or scrypt — never MD5/SHA
- **Rotate secrets**: schedule + on incident
- **Short-lived tokens**: access ≤15 min, refresh ≤7 days
- **Audit log**: who did what, when, from where

## 4. Server Architecture

### Patterns

- **Monolith**: single deployable, simplest
- **Modular monolith**: monolith with clear module boundaries
- **Microservices**: independently deployable services
- **Serverless**: functions as a service (AWS Lambda, Cloud Functions)
- **BFF**: separate API per client type

### Choose by:

- **Team size**: 1-5 → monolith; 5-20 → modular monolith; 20+ → microservices
- **Deployment frequency**: if you can deploy as one unit, monolith is fine
- **Scaling axes**: different scaling needs → microservices
- **Domain boundaries**: well-defined bounded contexts → microservices

### Communication

- **Synchronous**: REST, gRPC (couples services; use carefully)
- **Asynchronous**: message queue (Kafka, RabbitMQ, SQS) (decouples; more complex)
- **Event-driven**: pub/sub, event bus (loose coupling; eventual consistency)

## 5. Performance

### Database optimization

- **Index hot queries**: EXPLAIN ANALYZE
- **Avoid N+1**: eager load, JOIN, DataLoader
- **Pagination**: cursor-based for large datasets
- **Connection pooling**: pgBouncer, ProxySQL
- **Read replicas**: for read-heavy workloads
- **Caching**: Redis, Memcached (invalidation is hard)

### Application

- **Connection pooling**: HTTP keep-alive, DB pool
- **Async processing**: queues for slow tasks
- **CDN**: static assets at the edge
- **Compression**: gzip/brotli for text responses
- **Pagination**: never return unbounded lists

### Caching layers

```
Browser cache → CDN → Application cache → DB cache → Database
```

Each layer adds latency but reduces load on inner layers.

## 6. Error Handling

- **Structured errors**: code, message, details, request_id
- **Logging**: include context, request_id, user_id (no PII)
- **Don't swallow exceptions**: log + rethrow or handle
- **Retries**: only for transient errors (5xx, timeouts), with backoff
- **Circuit breaker**: open when downstream fails repeatedly
- **Graceful degradation**: serve stale data when fresh isn't available

## 7. Testing

- **Unit**: pure functions, no I/O
- **Integration**: with database, queues, etc.
- **Contract**: verify API matches its specification
- **E2E**: full system from user perspective
- **Load**: verify performance under expected load
- **Chaos**: inject failures to verify resilience

## 8. When to Apply This Skill

Load this skill when:

- Designing a new API
- Modeling data for a new feature
- Choosing authentication strategy
- Reviewing server-side code
- Debugging performance issues
- Planning service decomposition
- Integrating with external services

For project-specific conventions, consult `.github/instructions/`.
