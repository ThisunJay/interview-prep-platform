# System Design at Scale

**📌 System Design Interview Foundations**
- [] How to approach a system design interview (RESHEARD / framework)
- [] Functional vs non-functional requirements
- [] Back-of-the-envelope estimation (QPS, storage, bandwidth)
- [] API design & core entities upfront
- [] High-level diagram → deep dive tradeoffs
- [] Explicit assumptions & scope control
- [] Communicating tradeoffs to interviewers

**📌 Scalability & Performance Basics**
- [] Vertical vs horizontal scaling
- [] Stateless vs stateful services
- [] Latency vs throughput vs availability
- [] Little's Law (conceptual)
- [] Amdahl's Law & parallel speedup limits
- [] Caching fundamentals (local vs distributed)
- [] Content Delivery Networks (CDN)
- [] Database read replicas & read scaling
- [] Connection pooling & keep-alive

**📌 Load Balancing & Traffic Management**
- [] Load balancer types (L4 vs L7)
- [] Algorithms (round robin, least connections, consistent hash)
- [] Sticky sessions & when to avoid them
- [] Global load balancing & anycast (overview)
- [] Rate limiting & throttling (token bucket, leaky bucket)
- [] Backpressure & load shedding
- [] Graceful degradation

**📌 Caching Strategies**
- [] Cache-aside (lazy loading)
- [] Read-through & write-through
- [] Write-back (write-behind)
- [] Cache invalidation strategies
- [] TTL design & stale-while-revalidate
- [] Redis vs Memcached at scale
- [] CDN edge caching vs application cache
- [] Thundering herd & cache stampede mitigation

**📌 Databases at Scale**
- [] SQL vs NoSQL decision matrix
- [] Database indexing & query patterns
- [] Replication (leader-follower, multi-leader)
- [] Sharding / partitioning strategies
- [] Consistent hashing for sharding
- [] Hot keys & skew mitigation
- [] Denormalization vs normalization tradeoffs
- [] OLTP vs OLAP separation (CQRS preview)
- [] Time-series & wide-column stores (when to use)

**📌 Distributed Systems Theory**
- [] CAP theorem (practical interpretation)
- [] PACELC extension
- [] Consistency models (strong, eventual, causal)
- [] Linearizability vs serializability (overview)
- [] Quorum reads/writes (R + W > N)
- [] Leader election & consensus (Raft overview)
- [] Clocks & ordering (Lamport, vector clocks overview)
- [] Split-brain & fencing tokens
- [] Byzantine faults (high-level awareness)

**📌 Microservices Architecture**
- [] Monolith vs modular monolith vs microservices
- [] Service boundaries (DDD bounded contexts)
- [] Synchronous vs asynchronous communication
- [] API Gateway pattern
- [] Service discovery (client-side vs server-side)
- [] Backend for Frontend (BFF)
- [] Strangler fig migration pattern
- [] Shared libraries vs shared databases anti-pattern
- [] Data ownership per service
- [] Versioning & backward compatibility

**📌 Communication Patterns**
- [] REST API design at scale
- [] gRPC & Protocol Buffers
- [] GraphQL tradeoffs (BFF, over-fetching)
- [] WebSockets & SSE for real-time
- [] Idempotency keys & safe retries
- [] Pagination (offset vs cursor)
- [] Bulkheads & timeout budgets

**📌 Messaging & Event-Driven Architecture**
- [] Message queues vs event streams
- [] Pub/sub vs point-to-point
- [] At-least-once, at-most-once, exactly-once
- [] Event-driven microservices decoupling
- [] Event sourcing (overview)
- [] CQRS (Command Query Responsibility Segregation)
- [] Saga pattern (orchestration vs choreography)
- [] Outbox pattern & transactional messaging
- [] Dead letter queues & poison messages

**📌 Reliability & Fault Tolerance**
- [] SLI, SLO, SLA & error budgets
- [] Redundancy & blast radius reduction
- [] Multi-AZ & multi-region strategies
- [] Circuit breaker pattern
- [] Retry with exponential backoff & jitter
- [] Bulkhead pattern
- [] Health checks & synthetic monitoring
- [] Chaos engineering (overview)
- [] Disaster recovery (RTO/RPO)

**📌 Observability at Scale**
- [] Three pillars: logs, metrics, traces
- [] Structured logging & correlation IDs
- [] Metrics types (counter, gauge, histogram)
- [] Distributed tracing (spans, context propagation)
- [] Alerting on symptoms vs causes
- [] Dashboards for golden signals (latency, traffic, errors, saturation)
- [] Cardinality explosion pitfalls

**📌 Security & Multi-Tenancy**
- [] Authentication vs authorization at scale
- [] OAuth2 / OIDC & API security
- [] mTLS & service mesh security (overview)
- [] Secrets management & rotation
- [] Tenant isolation strategies
- [] Rate limiting per tenant / API key
- [] DDoS mitigation layers

**📌 Storage & Specialized Systems**
- [] Object storage for media & backups
- [] Search indexes (Elasticsearch/OpenSearch overview)
- [] Blob storage + metadata DB pattern
- [] Bloom filters & probabilistic structures
- [] Geospatial indexes (overview)
- [] File upload & chunked transfer at scale

**📌 Classic Design Scenarios**
- [] Design a URL shortener
- [] Design a rate limiter
- [] Design a news feed / timeline (Twitter/X)
- [] Design a chat system (WhatsApp/Slack)
- [] Design a video streaming platform (YouTube/Netflix)
- [] Design a ride-hailing dispatch (Uber/Lyft)
- [] Design a distributed cache
- [] Design a notification system
- [] Design a payment / wallet system (consistency focus)
- [] Design a web crawler
- [] Design a metrics / monitoring system

**📌 Architecture at Scale — Advanced Topics**
- [] Leader-follower replication lag handling
- [] Two-phase commit vs Saga vs eventual consistency
- [] Conflict resolution (LWW, CRDT overview)
- [] Multi-region active-active challenges
- [] Data locality & edge compute
- [] Cost vs performance tradeoffs at scale
- [] Platform engineering & golden paths (overview)
- [] Common interview traps & red flags
