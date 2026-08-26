# System Design at Scale

A deep-dive companion to the System Design at Scale checklist. Each heading matches the original outline; under every topic you'll find **what it is**, **why it exists**, **how it works**, and **interview-ready nuance**.

---

**📌 System Design Interview Foundations**

### How to approach a system design interview (RESHEARD / framework)

Structured flow interviewers expect:

1. **Requirements** — functional + non-functional (5–10 min)
2. **Estimation** — scale, QPS, storage (5 min)
3. **High-level design** — boxes & arrows (10 min)
4. **Deep dives** — data model, APIs, bottlenecks (15–20 min)
5. **Tradeoffs** — alternatives you rejected and why

Mnemonics like **RESHEARD** (Requirements, Estimation, Storage, High-level, Entities/API, Architecture, Reliability, Deep dive) keep you from jumping to Redis too early. **Drive the conversation** — check in after each phase.

---

### Functional vs non-functional requirements

**Functional:** what the system does (shorten URL, post tweet, send message). **Non-functional:** how well — latency (p99), availability (99.99%), consistency, durability, scalability, cost, compliance.

Always ask: read/write ratio? peak QPS? retention? geographic distribution? Strong consistency required or eventual OK?

---

### Back-of-the-envelope estimation (QPS, storage, bandwidth)

Example template:

- DAU → peak QPS ≈ DAU × actions/day × peak factor / 86400
- Storage ≈ records/day × bytes/record × retention days × replication factor
- Bandwidth ≈ QPS × payload size

Round aggressively (powers of 10). Shows you can size machines and choose sharding. **Wrong math with clear reasoning beats silence.**

---

### API design & core entities upfront

Define REST/gRPC endpoints and nouns early:

```
POST /v1/urls   { long_url } → { short_code }
GET  /v1/urls/{code}
```

Entities: User, URLMapping, Tweet, Message. Schema sketch informs storage and sharding key choices before drawing Kafka.

---

### High-level diagram → deep dive tradeoffs

Start simple: clients → LB → app servers → cache → DB → async queue → workers. Then drill where interviewer points (feed fanout, consistency, hot keys). Don't pre-optimize every box — leave hooks for depth.

---

### Explicit assumptions & scope control

State: "Assume authenticated users," "Out of scope: ML ranking," "Mobile + web clients." Prevents scope creep and shows product sense. Revisit assumptions when scale forces change.

---

### Communicating tradeoffs to interviewers

Use **"We could X or Y; I'd choose X because … at our scale …"** Framework: option → pros/cons → decision → what breaks if scale 10×. Interviewers score judgment, not memorized architectures.

---

**📌 Scalability & Performance Basics**

### Vertical vs horizontal scaling

**Vertical** — bigger machine (CPU/RAM). Simpler, hits hardware ceiling, single point of failure. **Horizontal** — more machines + load balancing. Required at internet scale; needs stateless app tier and partitioned data.

Most designs: scale out app tier early; scale DB via replicas + sharding last (hardest).

---

### Stateless vs stateful services

**Stateless** app servers — any instance handles any request; session in Redis/DB; easy autoscaling. **Stateful** — sticky connections, WebSocket rooms, streaming aggregations — harder to scale; isolate stateful components explicitly.

---

### Latency vs throughput vs availability

Often tension: strong consistency adds latency; sync replication reduces availability under partitions. Define **p99 latency** targets separately from average. Throughput = concurrency / avg response time (Little's Law).

---

### Little's Law (conceptual)

**L = λ × W** — average items in system = arrival rate × average time in system. If queue grows, either reduce W (faster processing) or limit λ (rate limit). Explains why backlog explodes under sustained overload.

---

### Amdahl's Law & parallel speedup limits

Speedup bounded by serial portion of work. 10% serial → max ~10× speedup no matter how many cores. Implies optimize bottlenecks sequentially first; parallelize the parallelizable fraction (map-reduce fanout).

---

### Caching fundamentals (local vs distributed)

**Local (in-process)** — microsecond latency, inconsistent across instances. **Distributed (Redis)** — shared, milliseconds, single logical view. Multi-tier: local → Redis → DB. Cache hit ratio drives DB load reduction.

---

### Content Delivery Networks (CDN)

Edge caches static and cacheable dynamic content close to users. Reduces origin load and latency. Use for images, video segments, static JS, some API GET with short TTL. **Cache key design** matters for personalization.

---

### Database read replicas & read scaling

Leader handles writes; replicas async replicate for reads. **Replication lag** → stale reads acceptable? Route read-your-writes via leader or session stickiness to primary. Replicas don't replace sharding for write scale.

---

### Connection pooling & keep-alive

Opening DB/TCP connections is expensive. Pool per app instance; size pools to avoid exhausting DB max connections (N_instances × pool_size). HTTP keep-alive reduces TLS handshake overhead at LB.

---

**📌 Load Balancing & Traffic Management**

### Load balancer types (L4 vs L7)

**L4 (TCP)** — fast, IP/port routing, no HTTP awareness. **L7 (HTTP)** — path/host/header routing, TLS termination, WAF integration. Microservices often L7 ALB/NGINX; internal service mesh L7/L4.

---

### Algorithms (round robin, least connections, consistent hash)

| Algorithm | Behavior |
|---|---|
| Round robin | Even rotation |
| Least connections | Send to least busy |
| Weighted | Capacity-aware |
| Consistent hash | Same key → same node (caches) |

Health checks remove bad backends automatically.

---

### Sticky sessions & when to avoid them

Session affinity routes user to same server. Complicates rolling deploys and failures. Prefer **external session store** (Redis) over LB stickiness unless legacy constraint.

---

### Global load balancing & anycast (overview)

DNS/geo routing (Route 53 latency routing) or **anycast IP** (Global Accelerator) directs users to nearest healthy region. Pair with multi-region data strategy — hard problem (consistency).

---

### Rate limiting & throttling (token bucket, leaky bucket)

Protect services from abuse and overload. **Token bucket** allows bursts with sustained cap. Implement at edge (API GW), per user/API key, per tenant. Return 429 + `Retry-After`.

---

### Backpressure & load shedding

When overloaded, **reject early** (503) rather than queue infinitely and die. **Load shedding** drops low-priority traffic. **Admission control** at gateway preserves core path.

---

### Graceful degradation

Disable non-critical features under stress (recommendations, rich previews) while keeping checkout/messaging core. Feature flags + automatic triggers from saturation metrics.

---

**📌 Caching Strategies**

### Cache-aside (lazy loading)

App checks cache → miss → read DB → populate cache. Simple; cache and DB can diverge on failure paths. Most common interview pattern.

```python
val = cache.get(key)
if val is None:
    val = db.get(key)
    cache.set(key, val, ttl=300)
```

---

### Read-through & write-through

**Read-through** — cache library loads on miss (app sees cache only). **Write-through** — write updates cache and DB synchronously. Stronger consistency, higher write latency.

---

### Write-back (write-behind)

Write to cache, async flush to DB. High write throughput; risk of data loss on crash; complex consistency. Used in buffering/analytics, not financial ledger primary write path.

---

### Cache invalidation strategies

Hard problem. **TTL** simplest. **Explicit invalidation** on update (precise, must not miss). **Versioned keys** (`user:123:v5`). Event-driven invalidation via pub/sub for multi-instance consistency.

---

### TTL design & stale-while-revalidate

Short TTL for hot mutable data; long for static. **Stale-while-revalidate** serves stale while async refresh — good for feeds/CDN. Document acceptable staleness in NFRs.

---

### Redis vs Memcached at scale

**Redis** — structures, persistence option, replication, cluster, Lua. **Memcached** — simple KV, multithreaded, pure cache. Redis default choice for sessions, rate limits, leaderboards (sorted sets).

---

### CDN edge caching vs application cache

CDN for static/geographic latency; Redis for dynamic computed objects (feed page 2, user session). Don't CDN highly personalized JSON without careful Vary headers and short TTLs.

---

### Thundering herd & cache stampede mitigation

Many requests miss expired key simultaneously → DB overload. Fixes: **probabilistic early expiration**, **single-flight lock** (one rebuilds, others wait), **request coalescing**, pre-warm caches.

---

**📌 Databases at Scale**

### SQL vs NoSQL decision matrix

| Choose SQL | Choose NoSQL |
|---|---|
| ACID transactions, joins | Massive scale simple access patterns |
| Complex queries | Flexible schema, horizontal partition native |
| Strong consistency core ledger | High write throughput KV/wide-column |

Many systems polyglot: Postgres + Redis + Elasticsearch + S3.

---

### Database indexing & query patterns

B-tree indexes for range/equality; composite index column order matters. Covering indexes avoid table lookups. Explain **slow query** debug: EXPLAIN plan, missing index, N+1 queries. At scale, index write amplification matters.

---

### Replication (leader-follower, multi-leader)

**Single leader** — simple consistency story. **Multi-leader** — multi-region writes, conflict resolution needed. **Leaderless (Dynamo-style)** — tunable quorums. Pick based on conflict tolerance.

---

### Sharding / partitioning strategies

Split data by **shard key** (user_id hash, tenant_id). Each shard is separate DB instance. Challenges: cross-shard queries, resharding, hot shards. Application or proxy (Vitess, Citus) routes queries.

---

### Consistent hashing for sharding

Hash ring minimizes remapping when nodes added/removed vs `hash(n) % N`. Virtual nodes balance load. Used in caches (Redis cluster), distributed storage, load balancers.

---

### Hot keys & skew mitigation

Viral user/post concentrates on one shard. Mitigations: **salting** keys, local in-memory cache on hot key, read replicas for that shard, async preaggregation, split logical key across subkeys.

---

### Denormalization vs normalization tradeoffs

Normalize for write consistency in OLTP; denormalize read models for feeds/dashboards (CQRS). Accept duplication with clear ownership and update paths.

---

### OLTP vs OLAP separation (CQRS preview)

Transactional path on normalized store; analytics on columnar warehouse/replicas. ETL or event stream bridges them. Prevents analytics queries from crushing OLTP.

---

### Time-series & wide-column stores (when to use)

**Time-series DB** (Influx, Timestream) for metrics/IoT. **Wide-column** (Cassandra, HBase) for high write, time-ordered, partition-key access. Not general SQL replacement.

---

**📌 Distributed Systems Theory**

### CAP theorem (practical interpretation)

During a **network partition**, choose **Consistency** (refuse writes/reads that can't be guaranteed correct) or **Availability** (respond but possibly stale). **Partition tolerance** is non-optional in distributed systems — real tradeoff is **C vs A** during partition.

Don't quote CAP as "pick two of three always" — it's **during partition**.

---

### PACELC extension

If **P**artition → **A** or **C**; **E**lse (normal operation) → **L**atency vs **C**onsistency. Many systems choose availability + eventual consistency normally, tunable read consistency on request.

---

### Consistency models (strong, eventual, causal)

| Model | Guarantee |
|---|---|
| **Strong/linearizable** | Reads see latest write |
| **Eventual** | Converges if no new writes |
| **Causal** | Related events seen in order |

Social "like count" → eventual OK; bank balance → strong(er).

---

### Linearizability vs serializability (overview)

**Linearizability** — single copy illusion for individual ops. **Serializability** — transaction order equivalent to serial execution. Distributed DBs mix models per operation/isolation level.

---

### Quorum reads/writes (R + W > N)

N replicas; write to W nodes; read from R nodes; **R + W > N** guarantees overlap (stale read risk if W<N). Dynamo/Cassandra tunable. Latency vs consistency knob.

---

### Leader election & consensus (Raft overview)

**Raft** — elect leader, log replication, committed entries safe. Used in etcd, Consul, Cockroach coordination. **Paxos** — equivalent problem, harder to teach. Needed for consistent metadata, not every app feature.

---

### Clocks & ordering (Lamport, vector clocks overview)

Wall clocks drift — don't trust NTP for ordering across nodes. **Lamport timestamps** order events loosely. **Vector clocks** detect concurrency for conflict resolution. **Hybrid logical clocks** in Cockroach/Spanner.

---

### Split-brain & fencing tokens

Two nodes think they're leader → corrupted writes. **Fencing tokens** (monotonic from coordination service) reject stale leader writes. Always pair leader election with lease TTL + fencing in storage layer.

---

### Byzantine faults (high-level awareness)

Nodes may lie/corrupt (malicious or bug). BFT consensus (PBFT) expensive; blockchain territory. Most business systems assume crash-fault model, not Byzantine.

---

**📌 Microservices Architecture**

### Monolith vs modular monolith vs microservices

| Style | When |
|---|---|
| **Monolith** | Early product, small team |
| **Modular monolith** | Clear modules, single deploy, lower ops |
| **Microservices** | Independent scale/deploy, many teams, mature DevOps |

Microservices tax: network failures, distributed tracing, data consistency, deployment complexity. **Don't microservice prematurely.**

---

### Service boundaries (DDD bounded contexts)

Split by **business capability** (Billing, Inventory, Notifications) not technical layer only. **Bounded context** owns its model — "Customer" differs between contexts. Conway's Law: structure mirrors org communication.

---

### Synchronous vs asynchronous communication

**Sync (HTTP/gRPC)** — simple mental model, cascading latency/failure. **Async (queue/events)** — decoupling, buffering, eventual consistency. Core user path sync; side effects async (email, analytics).

---

### API Gateway pattern

Single entry: auth, rate limit, routing, TLS, request aggregation. Backend services internal-only. Kong, AWS API Gateway, NGINX. Avoid god-gateway business logic — keep thin.

---

### Service discovery (client-side vs server-side)

**Client-side** (Eureka) — client picks instance from registry. **Server-side** (K8s Service + kube-proxy, LB) — client talks to stable VIP. Service mesh (Istio) adds L7 routing, mTLS, retries.

---

### Backend for Frontend (BFF)

Separate API tailored per client (mobile vs web) aggregating microservices. Reduces chatty mobile clients; prevents one-size API bloat. Team per client type optional.

---

### Strangler fig migration pattern

Incrementally replace monolith by routing new features to new services, proxying legacy paths. Reduces big-bang rewrite risk. Facade/router directs traffic by path/feature flag.

---

### Shared libraries vs shared databases anti-pattern

**Shared DB** couples services — schema changes break everyone; violates independent deploy. **Shared library** for pure utils OK; shared domain models create coupling. Prefer **API + events** over shared tables.

---

### Data ownership per service

Each service owns its datastore; other services access only via API or events. **No direct cross-service DB joins** in microservices purist model; materialized views/read models for queries.

---

### Versioning & backward compatibility

URL versioning (`/v1/`) or header negotiation. Additive schema changes preferred; deprecate with sunset headers. Consumer-driven contract tests prevent breaking deploys.

---

**📌 Communication Patterns**

### REST API design at scale

Resources, nouns, HTTP verbs idempotently (GET/PUT/DELETE idempotent; POST creates). Pagination, filtering, HATEOAS optional. Problem: overfetching, many round trips — leads to GraphQL/gRPC for internal.

---

### gRPC & Protocol Buffers

Binary, HTTP/2, streaming, strong contracts (.proto). Low latency internal service-to-service. Browser needs grpc-web gateway. Excellent for polyglot microservices at scale.

---

### GraphQL tradeoffs (BFF, over-fetching)

Client specifies shape — reduces round trips. Risks: complex resolver N+1 (DataLoader batching), query cost attacks (depth limits), caching harder than REST CDN. Best at BFF layer, not always every internal service.

---

### WebSockets & SSE for real-time

**WebSocket** bidirectional (chat, gaming). **SSE** server push one-way (live feeds). Connection state complicates scaling — use pub/sub backplane (Redis) so any server can push to connected clients.

---

### Idempotency keys & safe retries

Client sends `Idempotency-Key` header; server stores result keyed by it — retries don't double-charge. Essential for payments and POST under unreliable networks. TTL store (Redis/DB) for keys.

---

### Pagination (offset vs cursor)

**Offset** — simple, slow/deep pages (`OFFSET 100000`). **Cursor** — keyset on `(created_at, id)` stable for feeds. Always cursor for infinite scroll at scale.

---

### Bulkheads & timeout budgets

**Bulkhead** — isolate thread pools per dependency so one slow service doesn't exhaust all threads. **Timeout budgets** — if 200ms p99 SLA, allocate fractions per hop; fail fast downstream.

---

**📌 Messaging & Event-Driven Architecture**

### Message queues vs event streams

**Queue (SQS)** — consumer deletes message; one consumer typical per group. **Log (Kafka)** — retained log; multiple consumer groups replay. Queue for task distribution; log for event sourcing/analytics fanout.

---

### Pub/sub vs point-to-point

Pub/sub — many subscribers receive copy (notifications). Point-to-point — one worker processes job. SNS+SQS fanout bridges both on AWS.

---

### At-least-once, at-most-once, exactly-once

| Semantics | Meaning |
|---|---|
| At-most-once | May lose, never duplicate |
| At-least-once | May duplicate, rarely lose |
| Exactly-once | Hard end-to-end; often effective via idempotency |

Assume at-least-once; design idempotent consumers.

---

### Event-driven microservices decoupling

Services publish **domain events** (`OrderPlaced`); others subscribe. Reduces sync coupling; enables new consumers without changing producer. Requires schema registry and versioning discipline.

---

### Event sourcing (overview)

Store state as immutable event log; current state = replay events. Audit trail natural; temporal queries easy. Complexity: snapshots, schema evolution, projection rebuild. Pair with CQRS.

---

### CQRS (Command Query Responsibility Segregation)

Separate write model (commands, normalized) from read model (denormalized projections). Scale reads independently; optimize shapes per query (feed, search index). Eventual consistency on read side.

---

### Saga pattern (orchestration vs choreography)

Distributed transaction across services without 2PC:

- **Choreography** — each service reacts to events (decentralized)
- **Orchestration** — central coordinator (Step Functions, Temporal)

Compensating transactions undo prior steps on failure (`CancelPayment`, `ReleaseInventory`).

---

### Outbox pattern & transactional messaging

Write business row + outbox row in **same DB transaction**; relay process publishes to Kafka. Avoids dual-write inconsistency (DB committed, message lost). Critical for reliable event-driven systems.

---

### Dead letter queues & poison messages

After N failed processing attempts, move to **DLQ** for inspection/replay. Prevents infinite retry blocking queue. Monitor DLQ depth; idempotent replay tooling.

---

**📌 Reliability & Fault Tolerance**

### SLI, SLO, SLA & error budgets

- **SLI** — measured metric (availability, latency)
- **SLO** — target (99.9% availability / 30 days)
- **SLA** — contractual with penalties
- **Error budget** — allowed unreliability before feature freeze

SLO drives engineering priorities — not "100% uptime."

---

### Redundancy & blast radius reduction

No single points of failure: multi-instance, multi-AZ. **Blast radius** — shard failures, cell-based architecture (Amazon style) limit impact to subset of users. Avoid one global Redis for everything.

---

### Multi-AZ & multi-region strategies

**Multi-AZ** — HA within region (sync/async replication). **Multi-region** — DR + latency; data replication hard (conflicts, cost). Active-passive simpler than active-active.

---

### Circuit breaker pattern

After N failures to dependency, **open** circuit — fail fast without calling. **Half-open** probes recovery. Prevents cascade failure and thread exhaustion. Resilience4j, Istio outlier detection.

---

### Retry with exponential backoff & jitter

Retry transient errors (503, timeout) with increasing delay + **random jitter** to avoid synchronized retry storms. Cap max retries; respect `Retry-After`. Non-idempotent ops need idempotency keys before retry.

---

### Bulkhead pattern

Separate resource pools (thread pools, connection limits) per downstream service. Netflix Hystory terminology. One bad dependency can't starve entire JVM.

---

### Health checks & synthetic monitoring

**Liveness** — process up. **Readiness** — can serve traffic (DB connected). **Synthetic probes** — external black-box tests catch DNS/cert/routing issues real users hit.

---

### Chaos engineering (overview)

Intentionally inject failures (kill instance, latency) in controlled env to validate resilience. Chaos Monkey, AWS FIS. Requires mature observability and rollback — not day-one priority.

---

### Disaster recovery (RTO/RPO)

**RPO** — max acceptable data loss. **RTO** — max downtime. Backup-restore vs warm standby vs multi-region active. Document runbooks; test restores quarterly (untested backup = hope).

---

**📌 Observability at Scale**

### Three pillars: logs, metrics, traces

**Logs** — discrete events. **Metrics** — aggregated time series. **Traces** — request path across services. Correlate via **trace_id** injected at edge. All three needed — metrics alert, logs debug, traces find slow hop.

---

### Structured logging & correlation IDs

JSON logs with `request_id`, `user_id`, `service`. Propagate `X-Request-ID` from gateway. Enables log aggregation (ELK, Loki) queries across microservices.

---

### Metrics types (counter, gauge, histogram)

**Counter** — monotonic (requests total). **Gauge** — point-in-time (queue depth). **Histogram** — latency distribution (p50/p99). RED method: Rate, Errors, Duration per service.

---

### Distributed tracing (spans, context propagation)

Each hop creates **span** with timing; tree forms trace. OpenTelemetry standard. Sample aggressively at high QPS (1–10%) to control cost. Critical for debugging microservice latency tails.

---

### Alerting on symptoms vs causes

Alert on **user-visible symptoms** (error rate, p99 latency, saturation) not every CPU blip. Page humans for SLO burn; tickets for trends. Runbooks linked from alerts.

---

### Dashboards for golden signals (latency, traffic, errors, saturation)

Google SRE **four golden signals** on per-service dashboards. Saturation: CPU, memory, DB connections, queue lag. One dashboard per tier + global overview.

---

### Cardinality explosion pitfalls

High-cardinality labels (user_id on every metric) kill TSDBs and cost. Aggregate at reasonable granularity; use logs/traces for per-user debug.

---

**📌 Security & Multi-Tenancy**

### Authentication vs authorization at scale

**Authn** — who (OAuth, JWT). **Authz** — what allowed (RBAC, ABAC). Central IdP; services validate JWT signature locally (JWKS cache) to avoid IdP hot path.

---

### OAuth2 / OIDC & API security

OAuth2 flows for delegated access; OIDC adds identity layer. Short-lived access tokens + refresh tokens; rotate keys; scope minimization. API Gateway validates tokens at edge.

---

### mTLS & service mesh security (overview)

**Mutual TLS** — services prove identity to each other. Service mesh (Istio) automates cert rotation. Zero-trust internal network — don't rely on VPC alone.

---

### Secrets management & rotation

Vault, AWS Secrets Manager — no secrets in env repos. Rotate DB credentials; support graceful reload. Least privilege IAM per service.

---

### Tenant isolation strategies

**Silo** — DB per tenant (strong isolation, ops cost). **Pool** — shared DB with `tenant_id` column (RLS policies). **Bridge** — hybrid. No cross-tenant data leaks — test with automated isolation tests.

---

### Rate limiting per tenant / API key

Fair usage in SaaS — prevent noisy neighbor. Token bucket per API key + global cap. Return 429 with clear headers (`X-RateLimit-Remaining`).

---

### DDoS mitigation layers

Edge (Cloudflare, Shield), WAF, rate limits, autoscale absorb, geo block last resort. Origin protection via private subnets + CDN only public entry.

---

**📌 Storage & Specialized Systems**

### Object storage for media & backups

S3/GCS for images, video, backups — unlimited scale, 11 nines durability narrative. Metadata in DB; blob in object store. Pre-signed URLs for direct upload/download.

---

### Search indexes (Elasticsearch/OpenSearch overview)

Inverted index full-text search, facets, ranking. Separate from OLTP — sync via CDC/events. Expensive at scale — index only searchable fields; shard sizing matters.

---

### Blob storage + metadata DB pattern

Store file in object storage; row in SQL/NoSQL with URL, size, owner, content-type. Enables listing without listing S3 prefix. Virus scan async worker on upload event.

---

### Bloom filters & probabilistic structures

**Bloom filter** — "possibly in set" or "definitely not" — compact membership test. Use to avoid expensive DB lookups (avoid useless GET for non-existent keys in URL shortener cache path).

---

### Geospatial indexes (overview)

PostGIS, Redis GEO, Elasticsearch geo — nearby drivers/restaurants. Geohash grid queries; accuracy vs performance tradeoffs. Uber dispatch interview topic.

---

### File upload & chunked transfer at scale

**Multipart upload** to S3 for large files; **chunked encoding** for resume. Generate pre-signed PUT URLs from API; client uploads direct to storage; webhook on completion. Avoid proxying GB through app servers.

---

**📌 Classic Design Scenarios**

### Design a URL shortener

**Entities:** long_url, short_code, user_id, created_at. **API:** encode, redirect. **Key:** base62 code or hash truncation with collision handling. **Store:** SQL or Dynamo keyed by short_code; cache hot codes in Redis. **Scale:** read-heavy → cache + CDN redirect edge; write moderate. **Analytics** async. Discuss custom domains, expiration.

---

### Design a rate limiter

Distributed token bucket in Redis with Lua atomicity; or sliding window log. Key = user_id or IP. Sync vs async decision at API GW. Fail open vs closed under Redis outage — product decision. Horizontal scale: Redis cluster, local approximate + global sync for soft limits.

---

### Design a news feed / timeline (Twitter/X)

**Fanout on write** vs **fanout on read** vs hybrid (celebrity exception). Storage: tweet table; user timeline cache (Redis sorted set). Fanout worker on post. Home timeline merge rank/score. Hot users: don't fanout to millions — fetch on read for followers. Consistency: eventual for counts OK.

---

### Design a chat system (WhatsApp/Slack)

WebSocket gateway + presence; message store partitioned by `conversation_id`. Delivery acks; offline push notifications (APNs/FCM). Group chat: sequence numbers per channel. End-to-end encryption out of scope or deep dive separately. Multi-device sync via message sync API.

---

### Design a video streaming platform (YouTube/Netflix)

Upload → transcode pipeline (workers) → multiple bitrates → CDN. Metadata DB; blob storage. **Netflix** — preposition popular content to Open Connect appliances. Adaptive bitrate client. View counts approximate (Kafka → aggregate). Copyright / moderation async.

---

### Design a ride-hailing dispatch (Uber/Lyft)

Drivers location in Redis GEO; matching radius query; surge pricing dynamic. Trip state machine; payment saga. Real-time tracking WebSocket. Split: Supply, Demand, Pricing, Trips services. Discuss clock skew, driver fraud, idempotent trip requests.

---

### Design a distributed cache

Consistent hashing shards; replication factor; cache aside; TTL eviction; LRU approximate. Invalidation pub/sub channel. Single-flight on miss. Not same as "design Redis" — focus client routing, replication lag, hotspot mitigation.

---

### Design a notification system

Multi-channel (email, SMS, push). Priority queues; template service; user preferences opt-out (legal). Idempotent send per event_id. Provider webhooks for delivery status. Rate limit per channel provider caps.

---

### Design a payment / wallet system (consistency focus)

Strong consistency on balance; ledger append-only (double-entry). Idempotency keys mandatory. Saga with payment provider. Audit trail; PCI scope minimization (tokenization). Never cache balance without invalidation strategy. Discuss isolation levels, row locks, optimistic concurrency.

---

### Design a web crawler

Frontier queue (BFS priority); politeness delay per domain; dedup URL bloom + canonicalization. Fetcher workers; parser; storage S3 + index Elasticsearch. Respect robots.txt. Scale: partition frontier by domain hash.

---

### Design a metrics / monitoring system

Agents push or scrape metrics; time-series DB (Cortex/M3); downsampling tiers; alert evaluator on rollups. High cardinality control; label schema standards. Similar to Prometheus + Grafana architecture at scale.

---

**📌 Architecture at Scale — Advanced Topics**

### Leader-follower replication lag handling

Read-your-writes: route to leader or track session "last write timestamp" and read from replica only if caught up. UI tolerance for stale reads on non-critical data.

---

### Two-phase commit vs Saga vs eventual consistency

**2PC** — blocking, fragile across services (avoid cross-service). **Saga** — compensating steps, eventual business consistency. **Eventual** — simplest, conflict handling required. Payment/inventory → saga; social likes → eventual.

---

### Conflict resolution (LWW, CRDT overview)

**Last-write-wins** with timestamps (loses concurrent edits). **CRDTs** — merge without coordination for specific data types (counters, sets). Choose based on business tolerance for lost updates.

---

### Multi-region active-active challenges

Write conflicts, latency to quorum, data residency, observability across regions. CRDTs or single-leader per entity with routing. Expensive — justify with SLA/regulation.

---

### Data locality & edge compute

Process data near user/source to reduce bandwidth (IoT, CDN edge workers). GDPR data residency — store EU users in EU region; routing layer directs accordingly.

---

### Cost vs performance tradeoffs at scale

Every 9 of availability ≈ exponentially more cost. Cache to reduce DB $; spot/preemptible for batch; tiered storage; right-size instances. Architecture interviews increasingly include **cost awareness**.

---

### Platform engineering & golden paths (overview)

Internal developer platform: templates for new microservice (CI, observability, deploy). Golden path reduces divergence; teams still own services. Not exam core but senior/staff signal.

---

### Common interview traps & red flags

- Jumping to microservices/Kafka without requirements
- Single global DB with no sharding plan at 1B users
- Ignoring hot keys and fanout cost
- No failure modes (what if Redis down?)
- Strong consistency everywhere (latency/cost)
- Forgetting idempotency on async paths
- Offset pagination on huge feeds
- Sticky sessions instead of shared session store
- Monitoring only averages, not p99

---

**Interview recap**

- **Clarify → estimate → diagram → deep dive → tradeoffs.**
- Name **bottleneck** before solution (read-heavy? hot key? fanout?).
- Separate **sync path** from **async side effects**.
- Assume **at-least-once**; design **idempotent** consumers.
- Microservices buy organizational scale, not automatic technical scale.
- Close with **how you'd evolve** the design at 10× scale.
