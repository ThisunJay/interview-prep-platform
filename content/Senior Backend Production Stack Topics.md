# Senior Backend Production Stack

**📌 Security Mindset & Secure Engineering**
- [] Defense in depth & least privilege
- [] Threat modeling basics (STRIDE — overview)
- [] Trust boundaries in microservices
- [] Secure SDLC & shift-left security
- [] Security vs usability tradeoffs (interview framing)
- [] Zero trust networking basics (service identity)
- [] Security headers (CSP, HSTS, X-Frame-Options)
- [] Input validation at API boundary
- [] Output encoding & XSS prevention in APIs
- [] Rate limiting & abuse protection

**📌 OWASP Top 10 — Application Security**
- [] OWASP Top 10 overview & why it matters for backend
- [] A01 Broken Access Control (IDOR, privilege escalation)
- [] A02 Cryptographic Failures (TLS, hashing, at-rest encryption)
- [] A03 Injection (SQL, NoSQL, OS command, LDAP)
- [] A04 Insecure Design (missing controls by design)
- [] A05 Security Misconfiguration (defaults, verbose errors)
- [] A06 Vulnerable & Outdated Components (SCA, Dependabot)
- [] A07 Identification & Authentication Failures
- [] A08 Software & Data Integrity Failures (unsigned artifacts)
- [] A09 Security Logging & Monitoring Failures
- [] A10 Server-Side Request Forgery (SSRF)
- [] Parameterized queries & ORM safe usage
- [] Mass assignment & over-posting prevention
- [] CORS misconfiguration pitfalls

**📌 OAuth 2.0 & OpenID Connect**
- [] Authentication vs authorization
- [] OAuth 2.0 roles (resource owner, client, authorization server, resource server)
- [] Authorization Code flow (+ PKCE for SPAs/mobile)
- [] Client Credentials flow (service-to-service)
- [] Refresh token rotation & revocation
- [] OpenID Connect (ID token vs access token)
- [] Scopes & consent
- [] OAuth for internal APIs vs public APIs
- [] Common OAuth misconfigurations (redirect URI, state param)
- [] Spring Security OAuth2 Resource Server setup
- [] Spring Security OAuth2 Client (login with Google/Okta — overview)
- [] Node.js OAuth2 middleware patterns (Passport, custom JWT verify)

**📌 JWT — Tokens, Validation & API Security**
- [] JWT structure (header, payload, signature)
- [] Signed vs encrypted tokens (JWS vs JWE — overview)
- [] Claims: iss, aud, sub, exp, iat, nbf
- [] JWT validation checklist (signature, expiry, issuer, audience)
- [] Access token vs refresh token responsibilities
- [] Stateless JWT vs server-side sessions
- [] Where to store tokens (httpOnly cookie vs memory vs localStorage)
- [] JWT in Spring Boot (filter chain, @PreAuthorize)
- [] JWT in Node/Express (middleware, jwks-rsa)
- [] JWKS endpoint & key rotation
- [] JWT vulnerabilities (alg:none, weak HMAC secret, token in URL)
- [] API keys vs JWT for machine clients
- [] mTLS for service-to-service (overview)

**📌 Secrets Management & Cryptography**
- [] Never commit secrets — pre-commit & CI scanning
- [] Secrets vs configuration vs feature flags
- [] HashiCorp Vault concepts (paths, policies, dynamic secrets)
- [] AWS Secrets Manager vs SSM Parameter Store
- [] Kubernetes Secrets limitations & External Secrets Operator
- [] Injecting secrets in Spring Boot (env, Spring Cloud Config)
- [] Injecting secrets in Node (env, dotenv only for local dev)
- [] Secret rotation strategies & zero-downtime reload
- [] Encryption in transit (TLS 1.2+, mTLS overview)
- [] Encryption at rest (KMS, envelope encryption)
- [] Password storage (bcrypt, Argon2 — never plain MD5)
- [] Managing secrets in CI/CD (OIDC, short-lived creds)
- [] Audit who accessed which secret (Vault/AWS CloudTrail)

**📌 Observability Fundamentals**
- [] Monitoring vs observability
- [] Three pillars: logs, metrics, traces
- [] Golden signals (latency, traffic, errors, saturation)
- [] RED method (Rate, Errors, Duration)
- [] USE method (Utilization, Saturation, Errors)
- [] SLI, SLO & error budget basics
- [] Alerting on symptoms vs causes
- [] On-call runbooks & incident response hooks
- [] Observability in Kubernetes (sidecar vs daemonset agents)
- [] Cost of observability (cardinality, retention)

**📌 Structured Logging & Log Management**
- [] Structured logging (JSON) vs plain text
- [] Correlation ID / request ID propagation
- [] Trace ID in logs (log-trace correlation)
- [] Log levels — what belongs in production
- [] Logging PII & PCI/PII redaction
- [] Spring Boot Logback JSON (Logstash encoder)
- [] Node structured logging (pino / winston JSON)
- [] Centralized log aggregation architecture
- [] Log sampling under high volume
- [] Audit logs vs application debug logs
- [] Error logging with stack traces — safe fields only

**📌 Prometheus & Metrics**
- [] Metrics types (counter, gauge, histogram, summary)
- [] Pull model & scrape targets
- [] Prometheus exposition format (/metrics endpoint)
- [] PromQL basics (rate, increase, histogram_quantile)
- [] Micrometer → Prometheus in Spring Boot Actuator
- [] prom-client metrics in Node.js services
- [] Custom business metrics (orders_created_total)
- [] Histogram buckets & latency SLOs
- [] Label cardinality explosion — anti-patterns
- [] Recording rules & federation (overview)
- [] Pushgateway for batch jobs (overview)
- [] kube-state-metrics & cAdvisor in K8s

**📌 Grafana, Alerting & Dashboards**
- [] Grafana dashboards — golden signals per service
- [] Prometheus alerting rules (PrometheusRule in K8s)
- [] Alertmanager routing, grouping & silencing
- [] Alert fatigue & actionable alerts
- [] SLO burn-rate alerts (multi-window — overview)
- [] Dashboards as code (Jsonnet / Terraform — overview)
- [] Annotations for deploy markers
- [] On-call escalation (PagerDuty / Opsgenie integration)
- [] Grafana Loki for logs (overview — Prometheus-style logs)
- [] Unified view: metrics + logs + traces in one pane

**📌 Distributed Tracing**
- [] Why tracing for microservices & fintech latency
- [] Traces, spans & parent-child relationships
- [] W3C Trace Context (traceparent, tracestate)
- [] Context propagation across HTTP, gRPC, message queues
- [] OpenTelemetry (OTel) architecture (SDK, collector, exporters)
- [] Span attributes vs events vs logs
- [] Sampling (head-based vs tail-based)
- [] Spring Boot Micrometer Tracing / OTel auto-instrumentation
- [] Node OpenTelemetry SDK & auto-instrumentation
- [] Manual spans for business operations (payment, LLM call)
- [] Debugging slow requests with flame graphs
- [] Service mesh tracing (Istio/Envoy — brief)

**📌 Datadog (Unified Observability)**
- [] Datadog platform map (APM, Logs, Metrics, RUM)
- [] Datadog Agent & DogStatsD
- [] Datadog on Kubernetes (DaemonSet, admission controller)
- [] APM traces & service map
- [] Log-trace correlation in Datadog (@trace_id)
- [] Custom metrics & custom spans
- [] Monitors, composite monitors & SLOs in Datadog
- [] Datadog vs Prometheus/Grafana stack — tradeoffs
- [] Cost control (indexed vs ingested logs, metric cardinality)
- [] Synthetic tests & real user monitoring (overview)
- [] Security monitoring (SIEM features — brief)

**📌 GenAI & LLM Integration — Fundamentals**
- [] Why LLM integration is baseline for backend/data roles
- [] LLM use cases (summarization, classification, extraction, chat)
- [] OpenAI-compatible APIs (OpenAI, Azure OpenAI, Bedrock — pattern)
- [] Chat completions vs embeddings vs assistants API
- [] Tokens, context windows & cost estimation
- [] Streaming responses (SSE) vs blocking calls
- [] Timeouts, retries & exponential backoff for LLM APIs
- [] Circuit breakers & fallbacks when LLM is down
- [] Idempotency keys for paid API calls
- [] Model selection tradeoffs (quality, latency, cost)
- [] Responsible AI basics (bias, data handling — interview awareness)

**📌 Calling LLM APIs from Backend Services**
- [] Sync vs async LLM invocation patterns
- [] Queue-based LLM jobs (SQS, BullMQ — overview)
- [] Spring Boot RestClient / WebClient calling OpenAI API
- [] Spring AI overview (ChatClient, embeddings — optional)
- [] Node.js fetch/axios calling LLM APIs
- [] Handling SSE streams in Spring Boot & Node
- [] API key management for LLM providers
- [] Proxy/gateway pattern for LLM calls (rate limit, audit)
- [] Multi-tenant LLM usage & per-tenant quotas
- [] Caching LLM responses (semantic cache — overview)
- [] Testing LLM integrations (mocks, recorded fixtures)

**📌 Prompt Engineering for Production**
- [] System, user & assistant messages
- [] Few-shot prompting with examples
- [] Output format control (JSON mode, schema instructions)
- [] Temperature, top_p & max_tokens tuning
- [] Prompt templates & versioning in code
- [] Chain-of-thought — when helpful vs risky
- [] Prompt injection attacks & mitigations
- [] Input sanitization & output validation (guardrails)
- [] Separating instructions from user content
- [] Evaluating prompts (golden datasets, regression)
- [] Human-in-the-loop for high-risk outputs

**📌 Embeddings & Vector Search**
- [] What embeddings represent (semantic vectors)
- [] Embedding models & dimensions
- [] Similarity metrics (cosine, dot product, L2)
- [] Chunking strategies (size, overlap, document structure)
- [] Metadata filters alongside vector search
- [] pgvector in PostgreSQL
- [] OpenSearch k-NN / vector search
- [] Managed vector DBs (Pinecone, Weaviate — overview)
- [] Hybrid search (BM25 keyword + vector fusion)
- [] Re-ranking retrieved chunks (cross-encoder — overview)
- [] Index rebuild & embedding model migration
- [] Batch vs online embedding generation

**📌 RAG — Retrieval-Augmented Generation**
- [] RAG pipeline (ingest → embed → retrieve → augment → generate)
- [] When RAG vs fine-tuning vs long context
- [] Document ingestion & chunk storage
- [] Top-k retrieval & score thresholds
- [] Context window budgeting (truncate vs summarize)
- [] Grounding, citations & hallucination reduction
- [] Handling stale or conflicting documents
- [] RAG latency budget (retrieve + LLM)
- [] Evaluation: retrieval recall & answer faithfulness
- [] Security: PII in knowledge base & access control to chunks
- [] Observability for RAG (retrieval span, token usage, latency)

**📌 Production Integration & Interview Scenarios**
- [] Secure LLM endpoint behind OAuth2/JWT
- [] Logging LLM calls without leaking prompts/secrets
- [] Metrics for LLM (latency, tokens, error rate, cost)
- [] Tracing full RAG request across services
- [] OWASP LLM Top 10 awareness (prompt injection, model DoS — overview)
- [] Fintech backend observability story (Datadog + K8s)
- [] Incident: JWT key rotation without downtime
- [] Incident: metric cardinality blew up billing
- [] Designing observability for a new microservice
- [] Adding RAG to an existing Spring Boot or Node API
- [] Senior/staff interview traps across security, observability & GenAI
