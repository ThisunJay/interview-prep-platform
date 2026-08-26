# Senior Backend Production Stack

A deep-dive companion to the Senior Backend Production Stack checklist. Each heading matches the original outline; under every topic you'll find **what it is**, **why it exists**, **how it works**, and **interview-ready nuance** — covering **security (OWASP, OAuth2/JWT, secrets)**, **observability (Prometheus, Grafana, structured logging, tracing, Datadog)**, and **GenAI/LLM integration (RAG, vector search, prompt engineering, Spring Boot & Node)**.

---

**📌 Security Mindset & Secure Engineering**

### Defense in depth & least privilege

No single control stops all attacks. Layer **network**, **identity**, **application**, and **data** controls. **Least privilege** — every user, service account, and IAM role gets only permissions needed for its job. Interview: cite both principles when designing API auth or K8s RBAC.

---

### Threat modeling basics (STRIDE — overview)

STRIDE categories: **S**poofing, **T**ampering, **R**epudiation, **I**nformation disclosure, **D**enial of service, **E**levation of privilege. Walk a data flow diagram before building: who can call what, what data crosses trust boundaries. Lightweight STRIDE on PRs beats no modeling.

---

### Trust boundaries in microservices

Each service boundary is a **trust boundary**. Don't trust internal network traffic blindly (zero trust). Validate JWT at every service; don't assume "inside VPC = safe." Service mesh mTLS adds identity between pods.

---

### Secure SDLC & shift-left security

Security in **design → code → CI → deploy**: threat model, secure code review, SAST/dependency scan in pipeline, secrets scanning, staging pen tests. Cheaper to fix auth bug in PR than in prod incident.

---

### Security vs usability tradeoffs (interview framing)

MFA adds friction; strict CORS breaks dev UX. Articulate **risk-based** decisions: stricter controls on payment APIs, relaxed on public read-only catalog. Staff answer: measurable risk + compensating controls.

---

### Zero trust networking basics (service identity)

Verify **identity** (mTLS cert, SPIFFE/SPIRE, JWT) for every request. No implicit trust by IP alone. Common in K8s + service mesh fintech stacks.

---

### Security headers (CSP, HSTS, X-Frame-Options)

| Header | Purpose |
|---|---|
| **HSTS** | Force HTTPS |
| **CSP** | Restrict script/resource origins (XSS mitigation) |
| **X-Frame-Options** / **frame-ancestors** | Clickjacking protection |
| **X-Content-Type-Options** | MIME sniffing block |

Spring Security / Helmet (Node) configure these. APIs returning JSON still benefit on any HTML/error pages.

---

### Input validation at API boundary

Validate **type, length, format, range** at controller/route layer (Bean Validation / Zod / Joi). Reject early with 400. Never trust client-side validation alone. Whitelist allowed values over blacklist.

---

### Output encoding & XSS prevention in APIs

If API serves HTML or reflects user input in error messages, encode output. JSON APIs mainly risk **stored XSS** in clients if they inject HTML from API fields — document safe consumption. Set `Content-Type: application/json` correctly.

---

### Rate limiting & abuse protection

Token bucket / sliding window per IP, user, API key. Return **429** with `Retry-After`. Protect login, password reset, LLM endpoints (cost + DoS). Spring: Bucket4j/resilience4j; Node: express-rate-limit; gateway: Kong/NGINX.

---

**📌 OWASP Top 10 — Application Security**

### OWASP Top 10 overview & why it matters for backend

OWASP Top 10 is the industry checklist of **most critical web app risks**. Senior backend interviews expect you to map concrete mitigations to each category — not recite definitions only.

---

### A01 Broken Access Control (IDOR, privilege escalation)

Users access resources they shouldn't: change `userId=123` to `124`, missing `@PreAuthorize`, admin routes without role check. **Fix:** authorize every request server-side against resource owner; deny by default; test horizontal/vertical escalation.

---

### A02 Cryptographic Failures (TLS, hashing, at-rest encryption)

Weak TLS, expired certs, passwords in plaintext/MD5, unencrypted S3/RDS, hardcoded keys. **Fix:** TLS 1.2+, bcrypt/Argon2, KMS for at-rest, no secrets in repos.

---

### A03 Injection (SQL, NoSQL, OS command, LDAP)

Untrusted input concatenated into queries/commands. **Fix:** parameterized queries/ORM bind params, avoid `Runtime.exec` with user input, validate ObjectId format for Mongo. Never string-build SQL.

---

### A04 Insecure Design (missing controls by design)

Flaw in architecture, not implementation bug — e.g. no rate limit on coupon redemption, password reset without proof. Threat modeling and abuse-case review catch these.

---

### A05 Security Misconfiguration (defaults, verbose errors)

Default admin passwords, debug stack traces in prod, open S3 buckets, permissive CORS `*`, unnecessary HTTP methods. Harden configs; use infra-as-code reviews; disable Spring `include-stacktrace=always` in prod.

---

### A06 Vulnerable & Outdated Components (SCA, Dependabot)

Log4Shell-class CVEs in dependencies. **Fix:** Dependabot/Snyk in CI, pin versions, patch SLAs, SBOM for supply chain. Know your Spring Boot BOM upgrade path.

---

### A07 Identification & Authentication Failures

Weak passwords allowed, no MFA on admin, session fixation, credential stuffing success. Enforce strong auth, lockout/throttle, secure session cookies (`Secure`, `HttpOnly`, `SameSite`).

---

### A08 Software & Data Integrity Failures (unsigned artifacts)

Pulling unsigned Docker images, no CI artifact signing, auto-update without verification. Sign images (Cosign), verify checksums, protect pipeline from tampering.

---

### A09 Security Logging & Monitoring Failures

No audit trail for auth failures, admin actions, or data export. Logs lack correlation ID. Alerts missing on brute force. **Fix:** structured audit logs, SIEM/Datadog monitors, never log passwords/tokens.

---

### A10 Server-Side Request Forgery (SSRF)

Server fetches attacker-controlled URL → hits metadata (`169.254.169.254`), internal admin APIs. **Fix:** allowlist outbound hosts, block private IP ranges, no raw URL passthrough from user input.

---

### Parameterized queries & ORM safe usage

JPA/JDBC `?` binds; MyBatis `#{}` not `${}`. Node: `pg` parameterized queries. ORM doesn't auto-fix **native queries** you write as strings.

---

### Mass assignment & over-posting prevention

Client sends `{ "role": "ADMIN" }` in profile update. **Fix:** DTOs with explicit fields; ignore unknown JSON properties; `@JsonIgnoreProperties(ignoreUnknown = true)` isn't enough without field whitelist.

---

### CORS misconfiguration pitfalls

`Access-Control-Allow-Origin: *` with credentials is invalid and dangerous patterns with reflected Origin. Explicit allowlist of origins. CORS is browser-only — not a substitute for auth.

---

**📌 OAuth 2.0 & OpenID Connect**

### Authentication vs authorization

**Authentication (AuthN)** — who are you? **Authorization (AuthZ)** — what may you do? OAuth2 is primarily **authorization** (delegated access); OIDC adds **identity** (ID token).

---

### OAuth 2.0 roles (resource owner, client, authorization server, resource server)

| Role | Example |
|---|---|
| Resource owner | User |
| Client | Your SPA / backend |
| Authorization server | Okta, Auth0, Keycloak |
| Resource server | Your API validating access token |

---

### Authorization Code flow (+ PKCE for SPAs/mobile)

User redirected to IdP → login → auth code → client exchanges code for tokens **server-side** (confidential client) or with **PKCE** (public client). **Never** implicit flow for new apps. PKCE: `code_verifier` + `code_challenge` prevents code interception.

---

### Client Credentials flow (service-to-service)

Machine client uses `client_id` + `client_secret` → access token, no user. For cron jobs, microservice A calling B. Store secret in Vault/Secrets Manager; scope narrowly.

---

### Refresh token rotation & revocation

Refresh tokens obtain new access tokens. **Rotation** — new refresh on each use; detect reuse (token theft). Support **revocation** on logout/compromise. Short-lived access tokens (5–15 min) limit blast radius.

---

### OpenID Connect (ID token vs access token)

**ID token** — JWT about user identity for client. **Access token** — permission to call APIs (may be opaque or JWT). Don't send ID token to your backend API as bearer — validate access token with correct audience.

---

### Scopes & consent

Scopes limit access (`read:orders`, `openid profile email`). Request minimum scopes. User consent screen for third-party apps.

---

### OAuth for internal APIs vs public APIs

Internal: client credentials or mTLS. Public/partner: auth code + PKCE, strict redirect URIs, rate limits, contract on scopes.

---

### Common OAuth misconfigurations (redirect URI, state param)

Open redirect via loose redirect URI matching; missing **`state`** → CSRF on OAuth callback. Exact match redirect URIs; always validate `state`.

---

### Spring Security OAuth2 Resource Server setup

```yaml
spring.security.oauth2.resourceserver.jwt.issuer-uri: https://idp.example.com/
```

`SecurityFilterChain` with `oauth2ResourceServer().jwt()`. Method security `@PreAuthorize("hasAuthority('SCOPE_read:orders')")`.

---

### Spring Security OAuth2 Client (login with Google/Okta — overview)

OAuth2 **client** for browser login session; different from resource server validating API tokens. Often combined: login via OIDC, session cookie for BFF, or SPA with PKCE tokens.

---

### Node.js OAuth2 middleware patterns (Passport, custom JWT verify)

`passport-oauth2` for login flows; `express-jwt` + `jwks-rsa` for API:

```javascript
jwt({ secret: jwksRsa.expressJwtSecret({ jwksUri, cache: true }), audience, issuer, algorithms: ['RS256'] })
```

---

**📌 JWT — Tokens, Validation & API Security**

### JWT structure (header, payload, signature)

`base64(header).base64(payload).signature` — header has `alg`, payload has claims, signature verifies integrity with secret/public key.

---

### Signed vs encrypted tokens (JWS vs JWE — overview)

**JWS** — signed, readable by anyone (don't put secrets in payload). **JWE** — encrypted payload for sensitive claims. Most APIs use signed JWT access tokens over HTTPS.

---

### Claims: iss, aud, sub, exp, iat, nbf

| Claim | Meaning |
|---|---|
| **iss** | Issuer — must match expected IdP |
| **aud** | Intended audience — your API identifier |
| **sub** | Subject — user/service ID |
| **exp** | Expiry — reject expired |
| **nbf** | Not before |

Validate all in resource server.

---

### JWT validation checklist (signature, expiry, issuer, audience)

1. Verify signature (JWKS RS256 preferred over HS256 shared secret at scale)
2. Check `exp`, `nbf`
3. Validate `iss` and `aud` match your service
4. Reject `alg: none`
5. Optional: revoke list / session check for logout

---

### Access token vs refresh token responsibilities

**Access** — short-lived, sent to APIs. **Refresh** — long-lived, only to token endpoint, stored securely server-side or httpOnly cookie. Never expose refresh to JS if avoidable.

---

### Stateless JWT vs server-side sessions

**JWT stateless** — no server session store; hard to revoke instantly. **Server session** — easy revoke, DB/Redis lookup per request. Hybrid: short JWT + refresh rotation + denylist for compromise.

---

### Where to store tokens (httpOnly cookie vs memory vs localStorage)

**localStorage** — XSS steals token (avoid for sensitive apps). **httpOnly Secure cookie** — JS can't read; CSRF protection needed. **Memory only** — lost on refresh; OK for SPA with refresh in httpOnly cookie (BFF pattern).

---

### JWT in Spring Boot (filter chain, @PreAuthorize)

Resource server JWT decoder populates `JwtAuthenticationToken`. `@PreAuthorize("hasRole('ADMIN')")` on methods. Map claims to authorities via `JwtAuthenticationConverter`.

---

### JWT in Node/Express (middleware, jwks-rsa)

Middleware validates JWT before route handlers; attach `req.user = decoded`. Centralize error → 401 uniform response.

---

### JWKS endpoint & key rotation

IdP publishes public keys at `/.well-known/jwks.json`. Cache keys; handle `kid` header rotation without downtime — accept old key briefly during rotation window.

---

### JWT vulnerabilities (alg:none, weak HMAC secret, token in URL)

Never accept `alg: none`. HS256 with weak secret → brute force. Tokens in query strings leak via logs/Referer. Use RS256 + JWKS; tokens in Authorization header.

---

### API keys vs JWT for machine clients

**API keys** — simple, long-lived, hard to scope/rotate (OK for server-to-server with care). **JWT client credentials** — scoped, expiring, auditable. Prefer OAuth client credentials or mTLS at scale.

---

### mTLS for service-to-service (overview)

Mutual TLS — client and server present certs. Strong identity without bearer tokens in app layer. Common in service mesh (Istio).

---

**📌 Secrets Management & Cryptography**

### Never commit secrets — pre-commit & CI scanning

`.env` in `.gitignore`; use **gitleaks**, **trufflehog**, GitHub secret scanning. Rotate immediately if leaked. Treat git history as permanent.

---

### Secrets vs configuration vs feature flags

**Secrets** — passwords, API keys, private keys. **Config** — port, feature toggles, non-sensitive URLs. **Flags** — LaunchDarkly etc. Don't store secrets in feature flag systems.

---

### HashiCorp Vault concepts (paths, policies, dynamic secrets)

Vault stores secrets at paths; **policies** grant access. **Dynamic secrets** — short-lived DB creds generated on demand. Audit log on every read. App uses Vault agent or sidecar to inject.

---

### AWS Secrets Manager vs SSM Parameter Store

**Secrets Manager** — rotation built-in, higher cost, for DB passwords/API keys. **SSM Parameter Store** — Standard (free tier) / Advanced (SecureString with KMS). Both integrate with Lambda, ECS, EKS IRSA.

---

### Kubernetes Secrets limitations & External Secrets Operator

K8s Secrets are **base64**, not encrypted at rest unless etcd encryption enabled. RBAC carefully. **External Secrets Operator** syncs from AWS/GCP/Vault into K8s Secret objects.

---

### Injecting secrets in Spring Boot (env, Spring Cloud Config)

`SPRING_DATASOURCE_PASSWORD` from env; never in `application.yml` in git. Spring Cloud Config + Vault backend for centralized secrets with encryption.

---

### Injecting secrets in Node (env, dotenv only for local dev)

Production: env from K8s/ECS secrets. `dotenv` for local only. Don't bundle secrets in Docker image layers.

---

### Secret rotation strategies & zero-downtime reload

Dual-read window: new secret deployed, app accepts both, retire old. Vault dynamic creds auto-rotate. DB password rotation via Secrets Manager Lambda. Signal app reload or use sidecar refresh.

---

### Encryption in transit (TLS 1.2+, mTLS overview)

All external APIs HTTPS. Internal service mesh may use mTLS. Terminate TLS at ingress or end-to-end depending on compliance (fintech often end-to-end).

---

### Encryption at rest (KMS, envelope encryption)

RDS/S3/EBS encryption with KMS CMK. **Envelope encryption** — data key encrypts data, CMK encrypts data key. Control key access via IAM.

---

### Password storage (bcrypt, Argon2 — never plain MD5)

Spring `BCryptPasswordEncoder`; Node `bcrypt` or `argon2`. Salt per password; adaptive cost factor. Never reversible encryption for passwords.

---

### Managing secrets in CI/CD (OIDC, short-lived creds)

GitHub Actions OIDC → AWS IAM role (no static AWS keys in Jenkins/GHA). Terraform reads secrets from Vault at apply time. Plan jobs get read-only creds.

---

### Audit who accessed which secret (Vault/AWS CloudTrail)

Vault audit devices log every secret read with identity. AWS CloudTrail for Secrets Manager `GetSecretValue`. Required for SOC2/fintech audits.

---

**📌 Observability Fundamentals**

### Monitoring vs observability

**Monitoring** — known failures, dashboards, thresholds ("is CPU high?"). **Observability** — answer **arbitrary** questions about system behavior from telemetry without deploying new code ("why did checkout fail for EU users?"). Needs rich logs, metrics, traces.

---

### Three pillars: logs, metrics, traces

| Pillar | Answers |
|---|---|
| **Logs** | What happened (discrete events) |
| **Metrics** | How much, how often, how fast (aggregates) |
| **Traces** | Request path across services (causal chain) |

Correlate all three with shared **trace_id**.

---

### Golden signals (latency, traffic, errors, saturation)

Google SRE: **Latency**, **Traffic**, **Errors**, **Saturation**. Every service dashboard should expose these four.

---

### RED method (Rate, Errors, Duration)

For **request-driven** services: requests/sec, error rate, duration distribution. Natural fit for HTTP/gRPC APIs and Prometheus histograms.

---

### USE method (Utilization, Saturation, Errors)

For **resources** (CPU, disk, DB connections): utilization %, saturation (queue depth), errors. Complements RED for infra layers.

---

### SLI, SLO & error budget basics

**SLI** — measurable indicator (99th pct latency < 300ms). **SLO** — target (99.9% of requests meet SLI). **Error budget** — allowed unreliability before freeze on features. Drives prioritization between velocity and reliability.

---

### Alerting on symptoms vs causes

Alert users on **symptoms** (high checkout error rate), not every cause (single pod restart). Page humans for customer-impacting SLO breaches; ticket for disk filling slowly with auto-remediation path.

---

### On-call runbooks & incident response hooks

Every alert links to runbook: verify, mitigate, escalate, comms. Observability tools integrate PagerDuty. Post-incident: missing metric/log? add it.

---

### Observability in Kubernetes (sidecar vs daemonset agents)

**DaemonSet** agent (Datadog, OTel collector) on each node — one per host, lower overhead. **Sidecar** — per pod, isolation, higher resource cost. Fintech/K8s stacks usually DaemonSet + admission injection for APM.

---

### Cost of observability (cardinality, retention)

High-cardinality labels (`user_id` on every metric) explode storage and cost (Prometheus, Datadog). Log indexing vs ingestion pricing. Sample traces/logs at scale. Design telemetry deliberately.

---

**📌 Structured Logging & Log Management**

### Structured logging (JSON) vs plain text

JSON logs: `{"level":"error","trace_id":"abc","msg":"payment failed","order_id":"123"}`. Machine-parseable; query in Datadog/Loki/ELK. Plain text grep doesn't scale across microservices.

---

### Correlation ID / request ID propagation

Generate `X-Request-Id` at edge (API gateway); pass through all downstream HTTP/gRPC calls and include in every log line. Essential for support tickets.

---

### Trace ID in logs (log-trace correlation)

Include `trace_id` and `span_id` from OpenTelemetry/MDC in logs. Click from log line → trace in Datadog/Grafana Tempo. Spring: Micrometer tracing MDC; Node: `@opentelemetry/api` context.

---

### Log levels — what belongs in production

**ERROR** — needs action. **WARN** — degraded but handled. **INFO** — business milestones (order placed), startup. **DEBUG** — dev/troubleshoot only (off in prod or sampled). Don't log every request body at INFO.

---

### Logging PII & PCI/PII redaction

Never log full PAN, CVV, passwords, raw JWT. Mask email/phone in logs or hash. Fintech compliance (PCI-DSS) mandates strict log hygiene. Use log processors to scrub patterns.

---

### Spring Boot Logback JSON (Logstash encoder)

```xml
<encoder class="net.logstash.logback.LogstashEncoder"/>
```

Ship JSON to stdout; collector picks up. Include MDC fields for trace_id.

---

### Node structured logging (pino / winston JSON)

**pino** — fast JSON default; **winston** with JSON format. Child loggers with bound `requestId`. Lower overhead than string concatenation at high QPS.

---

### Centralized log aggregation architecture

Apps → stdout → Fluent Bit/Fluentd/Datadog agent → centralized store. Retention tiers: hot (7d) → warm → archive S3. Search by trace_id, service, level.

---

### Log sampling under high volume

Sample DEBUG; always keep ERROR. Head-based sampling for health-check spam exclusion. Tail sampling for interesting traces (errors, high latency).

---

### Audit logs vs application debug logs

**Audit** — who did what to which resource (immutable, long retention, compliance). Separate stream from debug logs; tamper-evident storage.

---

### Error logging with stack traces — safe fields only

Log exception class, message, stack — but scrub nested causes that might contain SQL with PII. Don't log full request payload on error by default.

---

**📌 Prometheus & Metrics**

### Metrics types (counter, gauge, histogram, summary)

| Type | Use |
|---|---|
| **Counter** | Monotonic (requests_total) — use `rate()` |
| **Gauge** | Up/down (queue depth, memory) |
| **Histogram** | Latency buckets + `_count`, `_sum` |
| **Summary** | Client-side quantiles (less common now) |

Prefer histograms for SLO latency in Prometheus.

---

### Pull model & scrape targets

Prometheus **scrapes** `/metrics` on interval. Service discovery in K8s (pod annotations). Push model exception: Pushgateway for batch jobs.

---

### Prometheus exposition format (/metrics endpoint)

```
http_requests_total{method="GET",status="200"} 1027
http_request_duration_seconds_bucket{le="0.1"} 900
```

Text format; labels identify dimensions. Spring Actuator `/actuator/prometheus`.

---

### PromQL basics (rate, increase, histogram_quantile)

```promql
rate(http_requests_total[5m])
histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
```

`rate` for counters; quantile from histogram buckets.

---

### Micrometer → Prometheus in Spring Boot Actuator

Add `micrometer-registry-prometheus`; expose `/actuator/prometheus`. Auto HTTP metrics; add `@Timed` or `Timer.builder` for custom spans of work.

---

### prom-client metrics in Node.js services

```javascript
const client = require('prom-client');
const httpRequests = new client.Counter({ name: 'http_requests_total', labelNames: ['method', 'status'] });
client.collectDefaultMetrics();
app.get('/metrics', async (_, res) => res.end(await client.register.metrics()));
```

---

### Custom business metrics (orders_created_total)

Instrument domain events — payments succeeded, KYC failures, LLM tokens used. Product and ops dashboards from same Prometheus.

---

### Histogram buckets & latency SLOs

Choose buckets matching SLO (e.g. 50ms, 100ms, 250ms, 500ms, 1s). Too few buckets → bad quantile accuracy. Micrometer SLA utilities help.

---

### Label cardinality explosion — anti-patterns

**Never** label `user_id` or `order_id` on high-volume metrics. Cardinality = product of label values → memory explosion. High-cardinality → logs/traces instead.

---

### Recording rules & federation (overview)

Precompute expensive PromQL (`record: job:http_requests:rate5m`) for dashboard speed. Federation pulls metrics up hierarchy (K8s cluster → global).

---

### Pushgateway for batch jobs (overview)

Short-lived cron job pushes metrics to Pushgateway; Prometheus scrapes gateway. Avoid Pushgateway for long-lived service metrics.

---

### kube-state-metrics & cAdvisor in K8s

**kube-state-metrics** — pod/deployment state. **cAdvisor** — container CPU/memory. Standard K8s monitoring stack with Prometheus Operator.

---

**📌 Grafana, Alerting & Dashboards**

### Grafana dashboards — golden signals per service

One row per service: RPS, error %, p50/p99 latency, saturation (thread pool, DB pool). Template variables for env/namespace. Link to logs/traces datasources.

---

### Prometheus alerting rules (PrometheusRule in K8s)

```yaml
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
  for: 5m
```

`for` duration reduces flapping.

---

### Alertmanager routing, grouping & silencing

Route by severity/team; group related alerts into one page; silences for maintenance windows with expiry. Inhibit warnings when critical fires.

---

### Alert fatigue & actionable alerts

Every page should be **actionable**. Remove alerts nobody responds to. Runbook link in annotation. Tune thresholds from historical data.

---

### SLO burn-rate alerts (multi-window — overview)

Google SRE multi-window burn alerts page before error budget exhausted — fast burn (1h) and slow burn (6h) windows. Implement with Prometheus or Datadog SLO monitors.

---

### Dashboards as code (Jsonnet / Terraform — overview)

Version dashboards in Git; review in PR. Grafana Terraform provider or Jsonnet for reproducibility across envs.

---

### Annotations for deploy markers

Vertical lines on graphs when deploy happened — correlates latency spikes with releases. Datadog deployment tracking; Grafana annotations API.

---

### On-call escalation (PagerDuty / Opsgenie integration)

Alertmanager → PagerDuty with escalation policy. Heartbeat for cron jobs. Document primary/secondary on-call.

---

### Grafana Loki for logs (overview — Prometheus-style logs)

Loki indexes labels not full text (cost efficient); LogQL queries. Pairs with Prometheus/Grafana stack as open-source alternative to Datadog logs.

---

### Unified view: metrics + logs + traces in one pane

Datadog/Grafana Cloud/Jaeger+Tempo goal: from spike in error metric → filtered logs → full trace. Requires consistent `service.name` and trace_id in logs.

---

**📌 Distributed Tracing**

### Why tracing for microservices & fintech latency

Single user request crosses gateway → auth → payment → ledger → notification. Logs alone can't reconstruct order. Traces show **where time went** and which dependency failed — critical for fintech SLAs.

---

### Traces, spans & parent-child relationships

**Trace** — entire request tree. **Span** — one operation (HTTP call, DB query). Parent span starts child spans. Critical path visible in waterfall view.

---

### W3C Trace Context (traceparent, tracestate)

Standard header `traceparent: 00-{trace-id}-{parent-span-id}-01`. Propagate across services; vendor-neutral. OpenTelemetry uses this.

---

### Context propagation across HTTP, gRPC, message queues

Inject trace context in HTTP headers, gRPC metadata, Kafka message headers. Broken propagation = orphaned spans — common bug when adding async consumers.

---

### OpenTelemetry (OTel) architecture (SDK, collector, exporters)

App SDK instruments → optional **Collector** receives/processes → exports to Jaeger, Tempo, Datadog, etc. Vendor-neutral instrumentation; switch backends without re-instrumenting app.

---

### Span attributes vs events vs logs

**Attributes** — key-value on span (http.status_code=500). **Events** — timestamped annotations (cache miss). **Logs** linked via trace_id. Don't duplicate entire log body in span attributes.

---

### Sampling (head-based vs tail-based)

**Head** — decide at start (sample 1%). **Tail** — keep all errors/slow traces after complete. Tail sampling needs collector (Tempo/Datadog). Balance cost vs debuggability.

---

### Spring Boot Micrometer Tracing / OTel auto-instrumentation

`micrometer-tracing-bridge-otel` + exporter. Auto traces RestTemplate/WebClient, JDBC, Kafka. Add `@NewSpan` or `tracer.nextSpan()` for custom operations.

---

### Node OpenTelemetry SDK & auto-instrumentation

```javascript
require('@opentelemetry/auto-instrumentations-node').register();
```

Auto HTTP, Express, pg, redis spans. Manual spans for business logic.

---

### Manual spans for business operations (payment, LLM call)

```java
Span span = tracer.nextSpan().name("charge-card").start();
try (Tracer.SpanInScope ws = tracer.withSpan(span)) {
  paymentClient.charge(...);
} finally { span.end(); }
```

Separate LLM retrieval vs generation spans in RAG pipeline.

---

### Debugging slow requests with flame graphs

Trace UI shows span durations stacked — instantly see if slowness is DB, external API, or LLM. Compare p99 trace vs median.

---

### Service mesh tracing (Istio/Envoy — brief)

Envoy generates spans automatically for mesh traffic. App still adds business spans. mTLS + tracing headers handled by sidecar.

---

**📌 Datadog (Unified Observability)**

### Datadog platform map (APM, Logs, Metrics, RUM)

| Product | Role |
|---|---|
| **APM** | Distributed traces, service map |
| **Logs** | Centralized log management |
| **Metrics** | Custom & infrastructure metrics |
| **RUM** | Browser/mobile user monitoring |
| **Synthetics** | Uptime/API tests |

Single agent often ships all telemetry — your fintech experience advantage in interviews.

---

### Datadog Agent & DogStatsD

Agent runs on host/K8s node; apps send custom metrics via **DogStatsD** (UDP) or API. APM libraries send traces to local agent. Unified tagging (`env`, `service`, `version`).

---

### Datadog on Kubernetes (DaemonSet, admission controller)

DaemonSet agent on every node; **admission controller** injects APM env vars into pods. Unified service tagging from K8s labels. Correlates pod metrics with traces.

---

### APM traces & service map

Auto-instrument Java (dd-trace-java), Node, Go. **Service map** shows dependency graph and error rates between services. Filter by env/version during deploy validation.

---

### Log-trace correlation in Datadog (@trace_id)

Inject trace id into JSON logs; Datadog links log ↔ trace automatically. Search logs for a trace; pivot from error log to flame graph.

---

### Custom metrics & custom spans

`statsd.increment('orders.created')`; programmatic spans for batch steps. Tag sparingly — billing scales with custom metrics cardinality.

---

### Monitors, composite monitors & SLOs in Datadog

Monitors on metrics, logs, traces, anomalies. **Composite** — A AND B. **SLO** — error budget tracking with burn alerts. Replace brittle static thresholds where anomaly detection helps.

---

### Datadog vs Prometheus/Grafana stack — tradeoffs

| | Datadog | Prometheus/Grafana |
|---|---|---|
| Ops burden | Low (SaaS) | Self-manage, on-call for stack |
| Cost | Usage-based, can grow fast | Infra + engineer time |
| Correlation | Built-in | Wire Tempo+Loki yourself |
| Vendor lock | Higher | Open standards (OTel) |

Interview: "Used Datadog in prod; understand PromQL/OTel for portable mental model."

---

### Cost control (indexed vs ingested logs, metric cardinality)

Datadog bills **ingested** vs **indexed** log volume separately — exclude health checks, sample debug. Limit custom metric tags. Regular monitor audit for unused metrics.

---

### Synthetic tests & real user monitoring (overview)

Synthetics probe APIs from global locations — catch DNS/SSL/regional issues before users. RUM ties frontend errors to backend traces (session replay in some tiers).

---

### Security monitoring (SIEM features — brief)

Datadog Cloud SIEM correlates security signals from logs. Mention if you've seen audit/compliance use cases; not deep dive unless role is security-focused.

---

**📌 GenAI & LLM Integration — Fundamentals**

### Why LLM integration is baseline for backend/data roles

Postings expect engineers to **call LLM APIs**, build **RAG** over internal docs, and ship safely — not only ML specialists. Treat LLM as another dependency with latency, cost, and failure modes.

---

### LLM use cases (summarization, classification, extraction, chat)

| Use case | Pattern |
|---|---|
| Summarization | Single prompt, long input |
| Classification | Few-shot categories |
| Extraction | JSON schema output |
| Chat | Multi-turn + optional RAG |

Pick smallest model that meets quality bar.

---

### OpenAI-compatible APIs (OpenAI, Azure OpenAI, Bedrock — pattern)

Many providers expose **chat completions** JSON API. Abstract with interface; swap base URL/model env var. Azure uses deployment name; Bedrock uses model IDs — same client pattern.

---

### Chat completions vs embeddings vs assistants API

**Chat completions** — generate text. **Embeddings** — vector for search/RAG. **Assistants** (OpenAI) — hosted threads/files — less common in custom backend; most build own RAG.

---

### Tokens, context windows & cost estimation

Billing per **input + output tokens**. Context window max (128k etc.) bounds RAG chunk count. Estimate cost in design reviews; log `usage.prompt_tokens` per request.

---

### Streaming responses (SSE) vs blocking calls

**Streaming** — better UX for chat (tokens appear live); harder timeout handling. **Blocking** — simpler for batch jobs. Spring `WebClient` flux; Node SSE `response.write`.

---

### Timeouts, retries & exponential backoff for LLM APIs

LLM calls are slow (5–60s). Set generous client timeout; retry **429/503** with jitter; don't retry 400. Idempotent reads OK; payment side-effects need idempotency keys separate from LLM retry.

---

### Circuit breakers & fallbacks when LLM is down

Resilience4j/Hystrix pattern: after failures, fail fast; return cached summary or "AI unavailable" graceful degradation. Don't block checkout on LLM feature.

---

### Idempotency keys for paid API calls

If LLM call triggers billable downstream action, use idempotency key per user request to avoid double charge on retry.

---

### Model selection tradeoffs (quality, latency, cost)

GPT-4 class vs smaller model: route simple queries to cheap model (router/classifier). Measure quality regression with eval set.

---

### Responsible AI basics (bias, data handling — interview awareness)

Don't send regulated data to public models without DPA. Document data retention policy of provider. Human review for high-stakes decisions (credit, medical).

---

**📌 Calling LLM APIs from Backend Services**

### Sync vs async LLM invocation patterns

**Sync** — user waits (chat). **Async** — enqueue job, poll/webhook for doc summarization. Long docs → always async to avoid HTTP timeout and thread pool exhaustion.

---

### Queue-based LLM jobs (SQS, BullMQ — overview)

Producer publishes `{ jobId, docId }`; worker calls LLM; stores result in DB/S3; client polls status. Scales workers independently; natural retry/DLQ.

---

### Spring Boot RestClient / WebClient calling OpenAI API

```java
var body = Map.of("model", "gpt-4o-mini", "messages", List.of(
    Map.of("role", "user", "content", prompt)));
webClient.post().uri("/v1/chat/completions")
    .header("Authorization", "Bearer " + apiKey)
    .bodyValue(body).retrieve().bodyToMono(ChatResponse.class);
```

Externalize API key; set timeout; map errors to domain exceptions.

---

### Spring AI overview (ChatClient, embeddings — optional)

Spring AI abstracts chat/embeddings across providers:

```java
ChatResponse response = chatClient.prompt("Summarize: " + text).call().chatResponse();
```

Reduces boilerplate; understand underlying HTTP for interviews.

---

### Node.js fetch/axios calling LLM APIs

```javascript
const res = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ model, messages }),
  signal: AbortSignal.timeout(60_000),
});
```

Use env secrets; handle stream with `for await` on body.

---

### Handling SSE streams in Spring Boot & Node

Parse `data: {...}` lines; emit to WebSocket/SSE client. Flush buffers; handle client disconnect to cancel upstream. Backpressure matters at scale.

---

### API key management for LLM providers

Keys in Secrets Manager; per-env keys; rotate on engineer offboarding. **Never** expose to browser — always backend proxy. Optional: Azure AD / IAM for Bedrock instead of raw keys.

---

### Proxy/gateway pattern for LLM calls (rate limit, audit)

Central **LLM gateway** service: auth, rate limit, prompt logging (redacted), cost accounting, model routing. All microservices call gateway not OpenAI directly.

---

### Multi-tenant LLM usage & per-tenant quotas

Track usage by `tenant_id`; enforce token budgets; prevent one tenant exhausting shared quota. Metrics: `llm_tokens_total{tenant}`.

---

### Caching LLM responses (semantic cache — overview)

Exact cache on prompt hash for idempotent queries; **semantic cache** (embedding similarity) for near-duplicate — cost savings with staleness risk. TTL carefully.

---

### Testing LLM integrations (mocks, recorded fixtures)

Unit test with mocked HTTP client returning fixed JSON. Contract tests with recorded VCR cassettes. Separate **eval pipeline** for quality (not CI gate on every commit due to cost/flake).

---

**📌 Prompt Engineering for Production**

### System, user & assistant messages

**System** — behavior rules, persona, output format (stable). **User** — actual request (untrusted). **Assistant** — model prior turns. Keep system prompt versioned in git.

---

### Few-shot prompting with examples

Include 2–5 input/output examples in prompt for classification/extraction. Examples dominate token cost — curate representative set; eval when changing examples.

---

### Output format control (JSON mode, schema instructions)

"Respond only with valid JSON matching schema: {...}" Use provider **JSON mode** / structured outputs where available. Parse and validate with Jackson/Zod — never trust raw LLM output for SQL execution.

---

### Temperature, top_p & max_tokens tuning

**Temperature 0** — deterministic (extraction, classification). Higher — creative writing. **max_tokens** caps cost/latency. Set explicitly in prod; don't rely on defaults.

---

### Prompt templates & versioning in code

```java
String prompt = templateEngine.render("summarize-v3", Map.of("text", sanitized));
```

Version templates (`v1`, `v2`); A/B test; rollback bad prompt without code deploy if stored in config.

---

### Chain-of-thought — when helpful vs risky

CoT improves reasoning tasks but increases tokens and may leak reasoning in output. For user-facing support, may need to hide chain. Risk of fabricated reasoning — validate final answer.

---

### Prompt injection attacks & mitigations

Attacker embeds "ignore previous instructions" in user/doc content. **Mitigations:** separate system/user clearly; delimit untrusted content (`<document>...</document>`); output validation; never execute LLM output as code/SQL; RAG access control on documents.

---

### Input sanitization & output validation (guardrails)

Max input length; strip control chars; block known jailbreak patterns (weak alone). Validate output schema; refuse off-topic with fixed message. Secondary model as moderator (cost tradeoff).

---

### Separating instructions from user content

Use structured message parts; never string-concatenate user input into system role. Same principle as SQL parameterization — **boundary** between trusted instructions and untrusted data.

---

### Evaluating prompts (golden datasets, regression)

Maintain 50–200 labeled examples; score accuracy/F1/LLM-judge on each prompt change. CI eval job (nightly) catches regressions. Human review sample.

---

### Human-in-the-loop for high-risk outputs

Financial advice, legal, medical — require human approval before send/store. Audit trail of prompt, model version, output, reviewer.

---

**📌 Embeddings & Vector Search**

### What embeddings represent (semantic vectors)

Embedding model maps text → dense float vector where semantic similarity ≈ geometric closeness. Enables "find docs similar to query" beyond keyword match.

---

### Embedding models & dimensions

OpenAI `text-embedding-3-small/large`, open models (BGE, E5). Dimensions vary (384–3072). **Same model** for index and query. Changing model requires re-embed all documents.

---

### Similarity metrics (cosine, dot product, L2)

**Cosine similarity** — angle between vectors (scale-invariant). **Dot product** — when vectors normalized, equivalent to cosine. **L2 distance** — Euclidean. pgvector supports all; pick consistent with index type.

---

### Chunking strategies (size, overlap, document structure)

Typical **512–1024 tokens** per chunk with **10–20% overlap**. Split on headings/paragraphs not mid-sentence. Code: split by function; tables: row groups. Bad chunks → bad retrieval.

---

### Metadata filters alongside vector search

Store `tenant_id`, `doc_type`, `effective_date` with vectors. Filter **before** k-NN (pgvector WHERE clause; OpenSearch bool filter). Prevents cross-tenant leakage in RAG.

---

### pgvector in PostgreSQL

```sql
CREATE EXTENSION vector;
CREATE TABLE chunks (id bigserial PRIMARY KEY, content text, embedding vector(1536), tenant_id uuid);
CREATE INDEX ON chunks USING hnsw (embedding vector_cosine_ops);
SELECT content FROM chunks WHERE tenant_id = $1 ORDER BY embedding <=> $2 LIMIT 5;
```

Reuse existing Postgres ops knowledge; HNSW/IVFFlat indexes for scale.

---

### OpenSearch k-NN / vector search

`knn_vector` field type; HNSW plugin. Combine with BM25 in **hybrid query** for keyword + semantic. Fits stack if already using OpenSearch for logs/search.

---

### Managed vector DBs (Pinecone, Weaviate — overview)

Fully managed ANN index, metadata filters, namespaces. Trade ops simplicity vs another vendor. pgvector sufficient for many workloads until billions of vectors.

---

### Hybrid search (BM25 keyword + vector fusion)

Exact SKU/account number needs keyword; conceptual questions need vector. **Reciprocal rank fusion** merges ranked lists. Critical for production RAG quality.

---

### Re-ranking retrieved chunks (cross-encoder — overview)

Retrieve top 20 with bi-encoder (fast), **re-rank** top with cross-encoder (slow, accurate), pass top 5 to LLM. Latency/cost tradeoff for quality.

---

### Index rebuild & embedding model migration

Plan blue/green index: build new index with new model, swap alias, delete old. Background job re-embeds on model upgrade — version embeddings in metadata.

---

### Batch vs online embedding generation

**Batch** at ingest (cheaper, consistent). **Online** embed query at request time (required). Cache query embeddings for repeated questions.

---

**📌 RAG — Retrieval-Augmented Generation**

### RAG pipeline (ingest → embed → retrieve → augment → generate)

```
Documents → chunk → embed → vector store
User query → embed query → top-k retrieve → build prompt(context + question) → LLM → answer
```

Each stage instrumented (latency, tokens, retrieval scores).

---

### When RAG vs fine-tuning vs long context

| Approach | When |
|---|---|
| **RAG** | Fresh/private knowledge, cite sources, lower cost |
| **Fine-tuning** | Style/format, domain language, repeated task |
| **Long context** | Small corpus, single doc Q&A, simpler ops |

Most backend postings expect **RAG** explanation, not training loops.

---

### Document ingestion & chunk storage

Pipeline: S3 upload → parse PDF/HTML → chunk → embed → upsert vector DB. Track `source_uri`, `checksum`, `updated_at` for refresh. Idempotent ingest on same doc version.

---

### Top-k retrieval & score thresholds

Retrieve k=5–20; drop chunks below similarity threshold to reduce hallucination from irrelevant context. Tune k with eval set — more chunks ≠ better (noise, token cost).

---

### Context window budgeting (truncate vs summarize)

If retrieved chunks exceed window, prioritize highest scores; or **map-reduce** summarize chunks first. Monitor `prompt_tokens` metric.

---

### Grounding, citations & hallucination reduction

Prompt: "Answer only from context; say I don't know if missing." Return `citations: [{chunk_id, source}]` to UI. User verifies sources — fintech/compliance friendly.

---

### Handling stale or conflicting documents

Metadata `effective_date`; prefer newest policy doc. Background job re-indexes on CMS update. Show "as of DATE" in UI.

---

### RAG latency budget (retrieve + LLM)

Target p95: retrieval <100ms, LLM 2–10s. Parallel retrieve + auth check; stream LLM response. Async for batch reports.

---

### Evaluation: retrieval recall & answer faithfulness

**Retrieval** — is correct chunk in top-k? **Generation** — does answer match chunk (faithfulness)? Use LLM-as-judge or human labeling. Track over prompt/model changes.

---

### Security: PII in knowledge base & access control to chunks

Index only docs user may access; filter retrieval by `user_id`/`role`. Don't embed secrets/PII unnecessarily; redact before embed. RAG **prompt injection** via malicious uploaded doc — scan uploads, ACL on ingest.

---

### Observability for RAG (retrieval span, token usage, latency)

Spans: `rag.retrieve`, `rag.generate`. Metrics: `rag_chunks_retrieved`, `llm_tokens_total`, retrieval score histogram. Log `trace_id` not full prompt in prod.

---

**📌 Production Integration & Interview Scenarios**

### Secure LLM endpoint behind OAuth2/JWT

RAG API requires valid access token; scope `ai:query`. Rate limit per subject. Same auth model as rest of platform — don't create anonymous LLM proxy.

---

### Logging LLM calls without leaking prompts/secrets

Log: model, latency, token count, trace_id, user_id hash. **Don't** log full prompt/response in prod (PII, secrets in user text). Debug tier with explicit opt-in and redaction.

---

### Metrics for LLM (latency, tokens, error rate, cost)

```
llm_request_duration_seconds{model}
llm_tokens_total{direction="input|output", model}
llm_errors_total{reason}
```

Dashboard cost estimate: tokens × price table. Alert on error rate spike (provider outage).

---

### Tracing full RAG request across services

Trace: API gateway → auth → retrieval service (pgvector query span) → LLM HTTP client span. One trace_id in support ticket shows retrieval returned 0 chunks vs LLM timeout.

---

### OWASP LLM Top 10 awareness (prompt injection, model DoS — overview)

Know **LLM01 Prompt Injection**, **LLM04 Model DoS** (expensive prompts), **LLM06 Sensitive Info Disclosure**. Map mitigations: input limits, auth, output filtering, rate limits. Shows security + GenAI breadth for staff roles.

---

### Fintech backend observability story (Datadog + K8s)

Interview narrative: "Java microservices on EKS, Datadog DaemonSet agent, APM service map, SLO monitors on payment latency, log-trace correlation for incident debug, Prometheus-compatible metrics export where needed." Tie to golden signals and on-call.

---

### Incident: JWT key rotation without downtime

IdP publishes new JWKS key while old valid; services cache JWKS with TTL; rotate signing key; after all tokens expire, remove old key. Zero downtime if clients refresh JWKS. Botched rotation → mass 401 — practice runbook.

---

### Incident: metric cardinality blew up billing

Developer added `user_id` label → Datadog custom metrics exploded. Fix: remove label, use logs/traces for per-user debug, aggregate metrics only. Prevention: code review checklist for labels.

---

### Designing observability for a new microservice

Checklist: structured JSON logs with trace_id, RED metrics on `/metrics`, OTel auto-instrumentation, health/readiness probes, SLO definition, dashboards cloned from template, alerts to team channel.

---

### Adding RAG to an existing Spring Boot or Node API

Steps: ingest pipeline → pgvector table → `/ask` endpoint: auth → retrieve with tenant filter → prompt template v1 → WebClient/fetch LLM → validate JSON response → return answer + citations. Feature flag rollout; monitor tokens/latency.

---

### Senior/staff interview traps across security, observability & GenAI

- Logging JWTs or API keys
- Validating JWT without `aud`/`iss`
- High-cardinality metric labels
- Alerting on CPU alone without SLO
- Calling LLM from browser with exposed key
- No timeout on LLM client blocking thread pool
- RAG without tenant filter (data leak)
- Trusting LLM JSON for SQL execution
- "We use Datadog" but can't explain one dashboard or alert
- Prompt injection dismissed as "edge case"

---

## How to use this guide

- Walk each checkbox in `Senior Backend Production Stack Topics.md` aloud before reading the matching section.
- Connect the three pillars: **secure the API (OAuth/JWT/secrets) → observe it (logs/metrics/traces/Datadog) → extend it with LLM (RAG with same security and telemetry)**.
- For senior/staff interviews, tell **one production story** that touches all three — e.g. shipped RAG feature behind OAuth, with Datadog traces and OWASP-aware input handling.
- Rebuild mental flows: **request → auth filter → business logic → LLM/DB → structured log + span + metric**.

Good luck with prep.
