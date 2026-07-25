---
name: devops
description: "Reference knowledge for DevOps and Site Reliability Engineering (SRE) — CI/CD pipelines, deployment strategies, observability, infrastructure as code, incident response, and operational best practices. Use when: designing or reviewing CI/CD workflows, choosing deployment strategies, configuring monitoring/logging/tracing, setting up infrastructure, planning incident response, or evaluating operational maturity. Activates for: devops, ci/cd, deployment, observability, monitoring, sre, infrastructure, incident, runbook, on-call."
user-invocable: true
disable-model-invocation: false
context: fork
---

# DevOps & SRE — Reference Knowledge

Operational knowledge for building, deploying, and running reliable systems. This is a **knowledge skill** — it provides reference material, not a workflow.

---

## 1. CI/CD Pipelines

### Stages of a typical pipeline

```
Lint → Type-check → Unit tests → Integration tests → Build → Security scan
    → Artifact publish → Deploy to staging → Smoke tests → Deploy to production
```

### Pipeline as code

| Tool           | Type                         | Notes                           |
| -------------- | ---------------------------- | ------------------------------- |
| GitHub Actions | YAML in `.github/workflows/` | Native to GitHub; matrix builds |
| GitLab CI      | YAML in `.gitlab-ci.yml`     | Built-in to GitLab              |
| Jenkins        | Groovy DSL (`Jenkinsfile`)   | Mature, self-hosted             |
| CircleCI       | YAML `.circleci/config.yml`  | Cloud-first, Docker-native      |
| Buildkite      | YAML + agents                | Hybrid cloud/agent              |
| Drone          | YAML `.drone.yml`            | Docker-native, simple           |

### Best practices

- **Fast feedback**: lint and unit tests should run in <2 min
- **Fail fast**: order stages by speed and cost (cheap checks first)
- **Reproducible builds**: pin versions, use lockfiles
- **Cache dependencies**: avoid re-downloading on every run
- **Matrix testing**: test on multiple OS/Node/Python versions
- **Required checks**: protect branches with required status checks
- **Secret management**: use CI secret store, never inlined values

## 2. Deployment Strategies

| Strategy         | Risk                  | Rollback | Complexity | When to use                           |
| ---------------- | --------------------- | -------- | ---------- | ------------------------------------- |
| **Recreate**     | High (downtime)       | Slow     | Low        | Dev environments, non-critical        |
| **Rolling**      | Low                   | Slow     | Medium     | Stateless services, gradual migration |
| **Blue-Green**   | Low (instant switch)  | Instant  | High       | Critical services with spare capacity |
| **Canary**       | Low (small % first)   | Fast     | High       | Production services with metrics      |
| **Feature Flag** | Very low (toggle off) | Instant  | Medium     | High-velocity teams, A/B testing      |
| **A/B Test**     | Low                   | Instant  | High       | Product experimentation               |

### Release patterns

- **Continuous Deployment (CD)**: every merged PR goes to production
- **Continuous Delivery**: every merged PR is _ready_ to go to production
- **Trunk-based development**: short-lived branches, frequent merges
- **Gitflow**: long-lived branches, scheduled releases (older pattern)

## 3. Observability (Three Pillars)

### Metrics (numbers over time)

- **RED method** (services): Rate, Errors, Duration
- **USE method** (resources): Utilization, Saturation, Errors
- **Four Golden Signals**: Latency, Traffic, Errors, Saturation

Tools: Prometheus, Grafana, Datadog, CloudWatch, InfluxDB

### Logs (discrete events)

- **Structured logging**: JSON with consistent fields (timestamp, level, message, context)
- **Log levels**: DEBUG, INFO, WARN, ERROR, FATAL — use consistently
- **Correlation IDs**: trace a request across services
- **Log aggregation**: centralize (ELK, Loki, Splunk, CloudWatch Logs)

### Traces (request paths)

- **Distributed tracing**: OpenTelemetry, Jaeger, Zipkin, Datadog APM
- **Spans**: units of work with start/end/duration
- **Context propagation**: pass trace headers across service boundaries

## 4. Infrastructure as Code (IaC)

| Tool       | Approach                     | Notes                            |
| ---------- | ---------------------------- | -------------------------------- |
| Terraform  | Declarative HCL              | Multi-cloud, stateful, mature    |
| Pulumi     | Code in TypeScript/Python/Go | Programmatic, typed              |
| AWS CDK    | CloudFormation via code      | AWS-only, idiomatic per language |
| Ansible    | Procedural YAML              | Agentless, good for config mgmt  |
| Helm       | Templated Kubernetes YAML    | K8s-only, package manager        |
| Crossplane | Kubernetes-native IaC        | K8s as control plane for cloud   |

### Best practices

- **State management**: use remote state with locking
- **Modules**: encapsulate reusable infrastructure
- **Plan/Apply separation**: always review `plan` before `apply`
- **Drift detection**: schedule periodic reconciliation
- **Least privilege**: IAM roles scoped to what each stack needs
- **Cost estimation**: tools like Infracost for Terraform

## 5. Container & Orchestration

### Containers (Docker)

- **Multi-stage builds**: separate build and runtime layers
- **Distroless or minimal base images**: reduce attack surface
- **Layer caching**: order commands to maximize cache hits
- **Health checks**: `HEALTHCHECK` directive
- **Run as non-root**: drop capabilities
- **Pinned versions**: not `latest`

### Kubernetes (when scale demands it)

- Pods, Deployments, Services, Ingress
- ConfigMaps and Secrets
- HPA (Horizontal Pod Autoscaler) / VPA / Cluster Autoscaler
- Resource requests and limits
- Liveness, readiness, startup probes
- Network Policies
- Pod Disruption Budgets
- RBAC

> ⚠️ Don't adopt Kubernetes just because it's popular — for most projects, serverless or a single VM is simpler and cheaper.

## 6. Incident Response

### Severity levels

| Sev      | Definition                       | Example               | Response time   |
| -------- | -------------------------------- | --------------------- | --------------- |
| **SEV1** | Service down, all users affected | Production outage     | <15 min         |
| **SEV2** | Major degradation, many users    | Core feature broken   | <1 hour         |
| **SEV3** | Minor degradation, some users    | Edge case bug         | <1 business day |
| **SEV4** | Cosmetic, no user impact         | Typo in error message | Next sprint     |

### Incident process

1. **Detect**: alert fires (or user reports)
2. **Triage**: assess severity, assign Incident Commander
3. **Mitigate**: stop the bleeding (rollback, feature flag, scale up)
4. **Communicate**: status page, internal channels
5. **Resolve**: confirm service is healthy
6. **Post-mortem**: blameless review within 5 business days

### Post-mortem template

- **What happened**: timeline of events
- **Impact**: users affected, duration, business impact
- **Root cause**: technical explanation
- **Why we didn't catch it earlier**: monitoring gaps
- **Action items**: with owners and deadlines (prioritize: detection, mitigation, prevention)

## 7. Reliability Engineering

### SLOs, SLIs, and Error Budgets

- **SLI** (Service Level Indicator): metric (e.g., success rate, latency p99)
- **SLO** (Service Level Objective): target for the SLI (e.g., 99.9% success)
- **Error budget**: 100% - SLO (e.g., 0.1% = ~43 min/month of allowed downtime)

### Best practices

- **Define SLOs per user journey**, not per technical component
- **Tie error budgets to deployment velocity**: when budget is exhausted, freeze non-critical changes
- **Make SLOs public**: align team around what users experience

## 8. Secrets Management

| Tool                | Type          | Notes                               |
| ------------------- | ------------- | ----------------------------------- |
| HashiCorp Vault     | Self-hosted   | Mature, dynamic secrets             |
| AWS Secrets Manager | Cloud         | Per-service, audit trail            |
| GCP Secret Manager  | Cloud         | Per-project, versioning             |
| Doppler             | SaaS          | Developer-friendly, sync            |
| SOPS (Mozilla)      | File-encrypt  | Git-friendly, multiple KMS backends |
| 1Password CLI       | Personal/team | CLI-friendly, .env generation       |

### Rules

- **Never commit secrets** (use pre-commit hooks like `gitleaks` or `trufflehog`)
- **Rotate regularly**: automate with Vault dynamic secrets
- **Audit access**: who/what/when for every secret read
- **Principle of least privilege**: scope secrets to what each service needs

## 9. Common DevOps Anti-Patterns

| Anti-pattern        | Symptom                                     | Fix                           |
| ------------------- | ------------------------------------------- | ----------------------------- |
| Snowflake servers   | Manual config that can't be reproduced      | IaC + immutable images        |
| Snowflake deploys   | "Works on my machine"                       | Containers, identical envs    |
| Cowboy deploys      | Friday afternoon prod push without rollback | CI/CD + protected branches    |
| Alert fatigue       | 1000s of pages, ignored                     | SLO-based alerting            |
| Manual toil         | Repetitive operational tasks                | Automate                      |
| Unowned infra       | "Whose job is this?"                        | SRE team / platform team      |
| No runbooks         | Engineers google during incidents           | Write runbooks, test them     |
| Configuration drift | Dev ≠ staging ≠ prod                        | IaC enforced by CI            |
| No post-mortems     | Same incidents repeat                       | Blameless, action-item driven |

## 10. When to Apply This Skill

Load this skill when:

- Designing a new CI/CD pipeline
- Reviewing deployment strategy or rollback plan
- Setting up monitoring, logging, or tracing
- Planning incident response
- Building infrastructure as code
- Auditing operational maturity
- Investigating a production incident
- Deciding whether to adopt Kubernetes / serverless / multi-cloud

For project-specific tooling, consult `.github/instructions/` and the project README.
