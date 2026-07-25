---
name: system-engineering
description: "Reference knowledge for system design and engineering — scalability, reliability, consistency, distributed systems, and architectural trade-offs. Use when: designing new systems, evaluating architectural choices, planning for scale, or making reliability vs. cost trade-offs. Activates for: system design, scalability, reliability, distributed system, architecture, consistency, sharding, replication, cap theorem, queue, cache."
user-invocable: true
disable-model-invocation: false
context: fork
---

# System Engineering — Reference Knowledge

Reference for designing and operating systems at scale. This is a **knowledge skill** — it provides reference, not a workflow.

---

## 1. Core Concepts

### Scalability dimensions

- **Vertical (scale up)**: bigger machines (CPU, RAM, disk)
  - Pros: simple, no code change
  - Cons: hardware limits, single point of failure
- **Horizontal (scale out)**: more machines
  - Pros: theoretically unlimited, fault tolerant
  - Cons: complexity (state, coordination, distribution)

### Reliability vs. Availability

- **Reliability**: probability system works at a given moment
- **Availability**: % of time system is operational (e.g., 99.9% = 8.7h downtime/year)
- **Durability**: data survives failures (backups, replication)

### CAP Theorem

In a distributed system during a network partition, you can have at most 2 of 3:

- **Consistency**: all nodes see the same data
- **Availability**: every request gets a response
- **Partition tolerance**: system continues despite network failures

Since partitions always happen, the real choice is **CP** (consistency over availability, e.g., HBase) or **AP** (availability over consistency, e.g., Cassandra).

### Consistency models

- **Strong**: reads always return latest write
- **Eventual**: reads may return stale data, but converge
- **Causal**: respects cause-effect order, otherwise eventual
- **Read-your-writes**: user sees their own updates immediately
- **Bounded staleness**: reads return at most X seconds old

## 2. Architecture Patterns

### Layered (N-tier)

- Presentation → Application → Domain → Infrastructure
- Pros: familiar, easy to understand
- Cons: tends toward monolith, can have layer-skipping issues

### Microservices

- Each service: one bounded context, independent deployment
- Pros: independent scaling, team autonomy, technology choice per service
- Cons: distributed system complexity, network failures, data consistency

### Event-driven

- Services communicate via events
- Pros: loose coupling, async, scales well
- Cons: harder to debug, eventual consistency, event ordering

### CQRS (Command Query Responsibility Segregation)

- Separate write model (commands) from read model (queries)
- Often combined with Event Sourcing
- Pros: optimized reads, audit trail, complex business logic
- Cons: eventual consistency, complexity

### Event Sourcing

- Store state as sequence of events
- Replay to get current state
- Pros: complete audit, time travel, debug
- Cons: schema evolution is hard, event store is critical

### Saga

- Long-running transaction across services
- Two flavors: orchestration (central coordinator) vs. choreography (event-driven)
- Compensation actions for rollback
- Pros: no distributed transactions needed
- Cons: hard to reason about, eventual consistency

## 3. Data at Scale

### Replication

- **Synchronous**: strong consistency, but slower writes
- **Asynchronous**: faster writes, possible data loss on failure
- **Quorum**: read from N nodes, write to M, require W+R > N for consistency

### Sharding / Partitioning

- **By key range**: ordered, can be uneven
- **By hash**: even distribution, no order
- **By directory**: lookup table, flexible, single point of failure
- **Consistent hashing**: minimal reshuffling on node add/remove

### Caching

- **Cache-aside** (lazy loading): app reads from cache, falls back to DB
- **Write-through**: write to cache and DB synchronously
- **Write-behind** (write-back): write to cache, async to DB
- **Refresh-ahead**: proactively refresh before expiry

Cache invalidation is one of the two hard problems in CS.

### Data warehousing

- **OLTP** (transactional): normalized, fast writes, simple queries
- **OLAP** (analytical): denormalized, fast aggregations, complex queries
- **ETL/ELT**: extract, transform, load (or extract, load, transform)
- **Star schema**: fact table + dimension tables
- **Snowflake schema**: normalized dimensions

## 4. Performance

### Latency vs. Throughput

- **Latency**: time to complete one operation
- **Throughput**: operations per unit time
- Optimizing for one often hurts the other

### Caching strategies (where to cache)

```
Client → CDN → Load balancer → App server → Cache → Database
```

- **Browser cache**: cache-control headers, ETags
- **CDN**: static assets, edge caching
- **Application cache**: in-process (Caffeine) or external (Redis)
- **Database cache**: query cache, buffer pool
- **Result cache**: precomputed query results

### Batching

- Group small operations into larger ones
- Reduces overhead, increases latency
- Good for: high-throughput, low-priority
- Bad for: low-latency, user-facing

### Async processing

- Move slow work to background queues
- Use for: emails, reports, exports, image processing
- Tools: RabbitMQ, Kafka, SQS, Pub/Sub, Redis Streams

## 5. Reliability Patterns

### Circuit Breaker

- Open when downstream fails repeatedly
- Half-open: try one request to test recovery
- Close: normal operation
- Libraries: Hystrix (deprecated), Resilience4j, Polly

### Retry

- **Exponential backoff**: double wait each attempt
- **Jitter**: randomize to avoid thundering herd
- **Max attempts**: cap retries
- **Only retry idempotent operations**

### Rate Limiting

- **Token bucket**: refill at constant rate, consume per request
- **Leaky bucket**: smooth rate, queue overflow
- **Fixed window**: count per time window
- **Sliding window**: more accurate, more memory

### Timeouts

- Always set timeouts
- Different timeouts per dependency type
- Cascading timeouts (downstream < upstream)

### Idempotency

- Same operation multiple times = same result
- Idempotency key: client provides UUID, server stores result
- Critical for: payments, webhooks, retries

## 6. Observability

- **Metrics**: counters, gauges, histograms
- **Logs**: structured, correlated, sampled
- **Traces**: distributed, sampled
- **SLOs**: user-facing reliability targets
- **Alerts**: only on SLO violations, not raw metrics

## 7. Security at Scale

- **Defense in depth**: multiple layers
- **Least privilege**: minimum required permissions
- **Zero trust**: verify every request
- **Encryption**: in transit (TLS) and at rest
- **Audit logging**: who did what, when
- **Secret management**: Vault, AWS Secrets Manager
- **Rate limiting**: prevent abuse
- **DDoS protection**: CDN, WAF

## 8. Cost Optimization

- **Right-size**: match resources to load
- **Auto-scaling**: scale with demand
- **Spot/preemptible**: cheaper, interruptible workloads
- **Caching**: reduce DB load (DB is expensive)
- **Compression**: reduce bandwidth
- **Right database**: not every problem needs PostgreSQL
- **Cleanup**: delete unused resources, old data

## 9. Common System Anti-Patterns

| Anti-pattern                | Symptom                                 | Fix                               |
| --------------------------- | --------------------------------------- | --------------------------------- |
| **Distributed monolith**    | Microservices that must deploy together | Loose coupling, async             |
| **Chatty services**         | Too many cross-service calls            | Aggregate, batch                  |
| **Shared database**         | Services couple via DB                  | Database per service              |
| **Synchronous chains**      | A → B → C → D, one fails, all fail      | Async, queues, circuit breakers   |
| **No backpressure**         | Slow consumer breaks producer           | Rate limiting, queues with limits |
| **Single point of failure** | One DB, one load balancer               | Replication, redundancy           |
| **No idempotency**          | Retries cause duplicates                | Idempotency keys                  |

## 10. When to Apply This Skill

Load this skill when:

- Designing a new system or major feature
- Evaluating architectural trade-offs
- Planning for scale (10x, 100x)
- Reviewing for reliability
- Debugging production issues
- Optimizing cost
- Making technology choices

For project-specific implementation, consult `.github/instructions/` and the `planner` agent.
