# AWS Solutions Architect

A deep-dive companion to the AWS Solutions Architect checklist. Each heading matches the original outline; under every topic you'll find **what it is**, **why it exists**, **how it works**, and **interview-ready nuance**.

---

**📌 AWS Fundamentals & Well-Architected**

### AWS global infrastructure (Regions, AZs, Edge Locations)

**Regions** are geographic areas (e.g. `us-east-1`, `eu-west-1`) with multiple isolated **Availability Zones (AZs)** — separate data centers with low-latency links. **Edge Locations** (CloudFront, Route 53 resolver, Lambda@Edge) cache content closer to users.

**Design rules:**
- Deploy multi-AZ inside a region for HA
- Multi-region for DR / latency to global users
- Some services are **global** (IAM, Route 53, CloudFront control plane); most are **regional** (EC2, S3 bucket home region)

Interview: choose region for compliance (data residency), service availability, and proximity to users.

---

### Shared Responsibility Model

| AWS responsible for | You responsible for |
|---|---|
| Security **of** the cloud (hardware, hypervisor, managed service core) | Security **in** the cloud (data, IAM, OS patches on EC2, app config) |

Varies by service: **IaaS** (EC2) → you patch OS; **PaaS** (RDS) → AWS patches engine, you manage schemas/users; **SaaS** (WorkSpaces) → more AWS-managed.

---

### AWS Well-Architected Framework — six pillars

Structured lens for reviewing architectures:

1. **Operational Excellence** — run & monitor, evolve
2. **Security** — protect data & systems
3. **Reliability** — recover from failure, meet demand
4. **Performance Efficiency** — use resources well
5. **Cost Optimization** — avoid unnecessary spend
6. **Sustainability** — minimize environmental impact

Use Well-Architected Tool for guided reviews. Exams often map "best answer" to a pillar.

---

### Operational Excellence pillar

Automate changes (IaC, CI/CD), annotate ops events, learn from failures, anticipate operational needs. Practices: runbooks, blameless postmortems, feature flags, infrastructure as code (CloudFormation, Terraform), consistent tagging.

---

### Security pillar

Implement strong identity (least privilege IAM), detective controls (CloudTrail, GuardDuty), data protection (encryption, classification), secure network (private subnets, SGs), protect compute (patching, hardened AMIs). **Defense in depth** — no single control is enough.

---

### Reliability pillar

Recover from failures: multi-AZ, auto healing (ASG), graceful degradation, throttling/backpressure. Test recovery (Game Days). Avoid single points of failure. Use managed services for undifferentiated reliability (RDS Multi-AZ, SQS).

---

### Performance Efficiency pillar

Right-size resources, use serverless/containers where fit, caching (CloudFront, ElastiCache), select appropriate DB and storage class. Experiment with benchmarks; remove bottlenecks before scaling blindly.

---

### Cost Optimization pillar

Pay only for what you need: right-sizing, Spot, Reserved/Savings Plans, S3 lifecycle, delete idle resources, architect for cost-aware data transfer. Tag for chargeback; use Cost Explorer and Budgets.

---

### Sustainability pillar (overview)

Maximize utilization (consolidate workloads), use Graviton where compatible, efficient storage tiers, region selection for renewable energy goals (customer-specific). Increasingly referenced in modern AWS guidance.

---

### AWS Organizations & SCPs (overview)

**Organizations** — multi-account hierarchy (OUs). **Service Control Policies (SCPs)** — guardrails on what accounts *can* do (does not grant permissions; IAM still required). Use for separation (prod vs dev), centralized billing, compliance boundaries.

---

### Landing zone & multi-account strategy (overview)

**Landing zone** — baseline multi-account environment (network hub, logging account, security account) via Control Tower or custom IaC. Pattern: **workload accounts** per env/app; **shared services** account for DNS, CI/CD artifacts.

---

**📌 Identity, Access & Governance**

### IAM users, groups, roles, policies

**Users** — long-term humans (discouraged for apps). **Groups** — collection of users for policy attachment. **Roles** — temporary credentials via STS; preferred for services and cross-account.

Policies are JSON documents:

```json
{
  "Effect": "Allow",
  "Action": "s3:GetObject",
  "Resource": "arn:aws:s3:::my-bucket/*"
}
```

Prefer roles over access keys on servers.

---

### IAM policy evaluation (explicit deny, allow)

Evaluation order (simplified): **explicit Deny** always wins → Allow from identity + resource policies + SCPs (intersection for cross-account). Default is **implicit deny**.

If confused on exam: one Deny blocks everything.

---

### IAM roles for EC2, Lambda, cross-account

**EC2 instance profile** — role credentials via metadata service (IMDSv2). **Lambda execution role** — permissions for AWS API calls. **Cross-account role** — trust policy on role, assume-role from other account.

```json
"Principal": { "AWS": "arn:aws:iam::111122223333:root" }
```

Use for centralized logging account, shared services, vendor access.

---

### STS & temporary credentials

**Security Token Service** issues short-lived creds after AssumeRole, SSO login, or federation. Safer than static keys. Session duration configurable (up to max for role).

---

### AWS SSO / IAM Identity Center (overview)

Central workforce access to AWS accounts and SAML apps. Replaces per-account IAM users for enterprises. Integrates with external IdP (Okta, AD). Exam: human access → SSO; machine/service → IAM roles.

---

### Resource-based vs identity-based policies

**Identity-based** — attached to user/role/group. **Resource-based** — on S3 bucket, SQS queue, KMS key, Lambda (resource policy). S3 bucket policy can allow cross-account without role in other account (with trust considerations).

---

### Permission boundaries & session policies

**Permissions boundary** — max permissions IAM entity can have (delegate admin safely). **Session policy** — further restrict role session at AssumeRole time. Advanced IAM for delegated administration.

---

### AWS CloudTrail (audit)

Logs AWS API calls (management events; data events optional for S3/Lambda). Multi-region trail; send to S3 + CloudWatch Logs. Organization trail for all accounts. **Detective control** — who deleted that SG rule?

---

### AWS Config (compliance & drift)

Records configuration changes over time; rules evaluate compliance (e.g. encrypted volumes, open SGs). Remediation via SSM Automation. Config ≠ CloudTrail (config state vs API audit).

---

**📌 VPC & Networking**

### VPC, subnets (public vs private)

**VPC** — isolated virtual network in a region. **Subnets** — AZ-scoped IP ranges.

- **Public subnet** — route to **Internet Gateway (IGW)** for `0.0.0.0/0`
- **Private subnet** — no direct IGW route; outbound via **NAT** in public subnet

Place app tiers in private subnets; ALB in public (or internal ALB for private APIs).

---

### Internet Gateway & NAT Gateway vs NAT Instance

**IGW** — horizontally scaled, redundant internet for VPC. **NAT Gateway** — managed NAT for private subnet outbound (AZ-specific; create per AZ for HA). **NAT Instance** — self-managed, cheaper at scale but ops burden; exam prefers NAT Gateway.

---

### Route tables & routing

Each subnet associates with one route table. Longest prefix match. Common routes: local (VPC CIDR), IGW, NAT, peering, TGW, VPC endpoints. **Implicit router** — not a device you manage.

---

### Security Groups vs NACLs

| | Security Group | NACL |
|---|---|---|
| Level | Instance ENI | Subnet |
| State | Stateful (return allowed) | Stateless |
| Rules | Allow only | Allow + Deny |
| Default | Deny inbound | Allow all |

**SG** is primary defense; **NACL** for subnet-level block lists or explicit denies. Exam trap: NACL is stateless — configure inbound AND outbound.

---

### VPC peering

Connect two VPCs (non-transitive). CIDR must not overlap. Same or cross-region/cross-account. Full mesh doesn't scale — use **Transit Gateway** for hub-spoke.

---

### Transit Gateway

Regional hub connecting VPCs, VPN, Direct Connect. Route tables on TGW for segmentation. Scalable enterprise network core vs many peering links.

---

### VPN (Site-to-Site) & Client VPN

**Site-to-Site VPN** — IPsec tunnel from on-prem to VPC (often over internet; pair for HA). **Client VPN** — remote users into VPC. Cheaper/faster to stand up than Direct Connect; bandwidth/latency variable.

---

### AWS Direct Connect (overview)

Dedicated private connection from on-prem to AWS (via DX location). Consistent latency, higher bandwidth, hybrid architectures. Often combined with VPN as backup. Virtual interfaces (private VIF for VPC, public VIF for S3/global).

---

### PrivateLink & VPC endpoints (Gateway vs Interface)

Avoid public internet to AWS services:

- **Gateway endpoint** — S3, DynamoDB (route table entry, no charge for endpoint hour)
- **Interface endpoint** — most other services (ENI in subnet, PrivateLink, per-hour + data charge)

Access SaaS via **AWS PrivateLink** consumer endpoint.

---

### Flow Logs & network troubleshooting

Capture accepted/rejected IP traffic (VPC, subnet, ENI) to CloudWatch Logs or S3. Use for connectivity debugging complementing Reachability Analyzer. Doesn't capture host OS firewall or traffic to IGW for some paths — know limits.

---

**📌 DNS, CDN & Edge**

### Route 53 — routing policies

Route 53 maps DNS names to resources via **hosted zones** (public/private).

#### Simple, weighted, latency, failover, geolocation, geoproximity

| Policy | Use |
|---|---|
| **Simple** | Single record, random if multiple values |
| **Weighted** | Split traffic by weight (blue/green, canary) |
| **Latency** | Lowest latency region for user |
| **Failover** | Active-passive with health check |
| **Geolocation** | Route by user country/continent |
| **Geoproximity** | Route by geographic bias + optional traffic dial (Traffic Flow) |

**Multivalue answer** — multiple healthy records (not a substitute for client-side load balancing at scale).

---

### Route 53 health checks & DNS failover

Health checks monitor endpoint or CloudWatch alarm. Failed check triggers **failover routing** to secondary record. Combine with ELB/multi-region for DR story.

---

### Amazon CloudFront (CDN)

Global edge cache for static/dynamic content, APIs (with appropriate cache headers), video streaming. Origin: S3, ALB, custom HTTP. **Edge locations** reduce latency and absorb traffic spikes.

---

### CloudFront origins, behaviors, caching, signed URLs/cookies

**Behaviors** map path patterns to origin + cache policy. TTL from headers or defaults. **Signed URLs/cookies** restrict access to private content (S3 origin via OAC/OAI). **Cache invalidation** costs — prefer versioned object keys (`app.v2.js`).

---

### AWS Global Accelerator (overview)

Anycast static IPs route users to nearest healthy endpoint (ALB, EC2, EIP) over AWS backbone. Good for non-HTTP (UDP/TCP games, IoT) or global static IP requirement. Different from CloudFront (L7 CDN vs L4 acceleration).

---

### S3 as CloudFront origin patterns

S3 **website endpoint** vs **REST API endpoint** — use REST with **Origin Access Control (OAC)** so bucket stays private; CloudFront serves public edge. SPA: `index.html` error routing for client-side routes.

---

**📌 Compute — EC2 & Auto Scaling**

### EC2 instance types & purchasing options

Families: **t** (burstable), **m** (general), **c** (compute), **r** (memory), **i** (storage), **g/p** (GPU), **Graviton** (arm, cost-efficient).

#### On-Demand, Reserved, Savings Plans, Spot, Dedicated

| Model | When |
|---|---|
| **On-Demand** | Unpredictable, short-lived |
| **Reserved / Savings Plans** | Steady baseline (1–3 yr commit) |
| **Spot** | Fault-tolerant, flexible (up to ~90% off) |
| **Dedicated** | Compliance/isolation, license requirements |

Mix: Reserved base + On-Demand/Spot burst.

---

### AMIs & instance store vs EBS-backed

**AMI** — template for EC2 (OS + apps). **EBS-backed** — root on EBS, stop/start preserves root. **Instance store** — ephemeral local NVMe, high perf, data lost on stop/terminate. Use instance store for cache/scratch with replication elsewhere.

---

### EC2 placement groups

| Strategy | Use |
|---|---|
| **Cluster** | Low latency, HPC (same rack risk) |
| **Spread** | Critical instances, separate hardware (max 7/AZ per group) |
| **Partition** | Large distributed systems (HDFS, Kafka) |

---

### Elastic Load Balancing (ALB, NLB, GLB)

| LB | Layer | Use |
|---|---|---|
| **ALB** | 7 | HTTP/S, path/host routing, WebSocket |
| **NLB** | 4 | TCP/UDP, static IP, extreme perf |
| **GLB** | 3/4 | Gateway Load Balancer — inline appliances (firewalls) |

Cross-zone load balancing recommended for even distribution.

---

### Target groups, health checks, stickiness

Targets: instances, IPs, Lambda, ALB (chaining). Health checks determine routing. **Stickiness** (session affinity) via cookie — use sparingly (stateless preferred). Deregistration delay for graceful drain.

---

### Auto Scaling Groups (ASG)

Maintains desired capacity across AZs. Launch template defines instance config. Integrates with ALB (replace unhealthy). Scale on schedules, manual, or **dynamic policies** (CPU, request count, custom metrics).

---

### Launch templates & scaling policies

**Launch template** — successor to launch configuration (versions, mixed instances). **Target tracking** — e.g. keep CPU at 50%. **Step scaling** — stepped adjustments. **Predictive scaling** — ML forecast (optional).

---

### Connection draining & graceful shutdown

ALB **connection draining** (deregistration delay) stops new connections, waits for in-flight to complete before terminating instance. App should handle SIGTERM, complete requests, deregister from pools.

---

**📌 Serverless Compute**

### AWS Lambda fundamentals

Run code without provisioning servers. Event-driven, pay per invoke + duration (GB-seconds). Limits: timeout (max 15 min), memory 128 MB–10 GB (CPU scales with memory), deployment package size limits.

---

### Lambda triggers (API Gateway, S3, SQS, EventBridge, etc.)

Invoke via sync (API Gateway) or async (S3, SNS, EventBridge) with retry/DLQ. **Event source mapping** for poll-based (SQS, Kinesis, DynamoDB streams). Design for idempotency on retries.

---

### Lambda concurrency, reserved vs provisioned

**Account concurrency limit** per region. **Reserved concurrency** — cap/guarantee for function. **Provisioned concurrency** — warm instances, reduces cold start (cost). Throttling → 429 when exhausted.

---

### Lambda layers & deployment packages

**Layers** share dependencies (common libs). Package as zip or container image (10 GB image limit). Keep deployment package small for faster cold starts.

---

### Lambda@Edge (overview)

Run Lambda at CloudFront edge for request/response manipulation (A/B, auth, URL rewrite). Limits vs regional Lambda; replicate to all edge locations on publish.

---

### AWS Fargate (serverless containers overview)

Run containers without managing EC2 for ECS/EKS. Pay for vCPU/memory task duration. Good when you don't want to patch AMIs. Cold start / cost vs Lambda for spiky small jobs — compare tradeoffs.

---

**📌 Storage — S3 & Object Storage**

### S3 buckets, objects, keys, prefixes

Bucket names globally unique. Objects up to 5 TB (multipart for large). **Key** is full path (`photos/2024/img.jpg`). **Prefix** is not a real folder but listing delimiter — design prefixes for scale (avoid hot prefixes at extreme QPS).

---

### S3 storage classes (Standard, IA, One Zone-IA, Glacier tiers, Intelligent-Tiering)

| Class | Access | AZ | Use |
|---|---|---|---|
| Standard | Frequent | ≥3 | Default |
| Standard-IA | Infrequent | ≥3 | Backups, older media |
| One Zone-IA | Infrequent | 1 | Recreatable data |
| Glacier Instant/Flexible/Deep Archive | Archive | — | Retention tiers |
| Intelligent-Tiering | Auto tier | ≥3 | Unknown/changing patterns |

Minimum storage duration charges for IA/Glacier.

---

### S3 durability, availability & consistency model

Durability **11 nines** (Standard). **Read-after-write consistency** for new objects; **strong read consistency** for overwrite/delete/list (since 2020). Cross-region replication adds eventual consistency considerations for reads in dest.

---

### S3 lifecycle policies & transitions

Automate transition to IA/Glacier or expiration. Rules by prefix/tags. Cost optimization pillar favorite. Combine with Intelligent-Tiering when access unknown.

---

### S3 versioning & MFA Delete

Versioning keeps delete markers and prior versions. **MFA Delete** protects version deletion. Pair with lifecycle to expire noncurrent versions. Required for many compliance patterns.

---

### S3 replication (CRR & SRR)

**CRR** — cross-region (compliance, latency). **SRR** — same region (log aggregation, account separation). Requires versioning; replicate encrypted objects with KMS key policy alignment.

---

### S3 encryption (SSE-S3, SSE-KMS, SSE-C, DSSE)

| Mode | Keys |
|---|---|
| SSE-S3 | S3-managed |
| SSE-KMS | KMS CMK (audit, rotation control) |
| SSE-C | Customer-provided key per request |
| DSSE | Dual-layer (defense in depth) |

Default encryption on bucket recommended. KMS throttling on high-volume — use S3 Bucket Keys.

---

### S3 presigned URLs & access points

**Presigned URL** — temporary access for upload/download without IAM creds for caller. **Access Points** — named network endpoints with dedicated policies for shared buckets (multi-tenant data lake).

---

### S3 event notifications

Notify SNS, SQS, Lambda, EventBridge on object create/delete. Fan-out processing pipelines (thumbnail generation, ETL trigger). At-least-once delivery — idempotent consumers.

---

### S3 request patterns & performance (prefix scaling)

S3 scales automatically; previously cited 3,500 PUT/5,500 GET per prefix per second guidance — spread load with randomized key prefixes for extreme throughput. Transfer Acceleration for long-distance uploads.

---

**📌 Storage — Block & File**

### Amazon EBS volumes & types (gp3, io2, st1, sc1)

Network block storage for EC2. **gp3** general SSD (baseline IOPS/throughput configurable). **io2** high IOPS databases. **st1/sc1** HDD throughput/cold. Snapshots to S3-backed storage.

---

### EBS snapshots & AMIs

**Snapshot** incremental, region-specific; copy cross-region for DR. Create **AMI** from snapshot for golden images. Fast snapshot restore (pre-warm) for quick recovery in AZ.

---

### EBS encryption & multi-attach (io2)

Encryption default in many accounts; uses KMS. **Multi-attach** io2 only — shared block storage for clustered apps (careful with filesystem clustering).

---

### Amazon EFS (NFS, performance modes, access points)

Managed NFS, multi-AZ, grow automatically. **General Purpose** vs **Max I/O** performance mode. **Throughput mode** provisioned vs bursting. **EFS IA** lifecycle to cheaper tier. **Access points** — application-specific POSIX roots.

---

### FSx (Windows, Lustre, NetApp, OpenZFS — overview)

Specialized file systems: **FSx for Windows** (SMB, AD), **Lustre** (HPC, S3 linked), **NetApp ONTAP**, **OpenZFS**. Pick when EFS/EBS insufficient for protocol or perf profile.

---

### Storage Gateway (file, volume, tape — overview)

Hybrid on-prem cache to AWS (S3, EBS snapshots, virtual tapes). Used for gradual cloud migration and backup without immediate full lift.

---

**📌 Databases — Relational**

### Amazon RDS (Multi-AZ, Read Replicas)

Managed relational DB. **Multi-AZ** — synchronous standby for failover (same region, different AZ); not read scaling. **Read Replicas** — async, read scaling, cross-region promotion for DR.

---

### RDS engines & use cases (MySQL, PostgreSQL, Aurora)

MySQL/PostgreSQL/MariaDB/Oracle/SQL Server — lift-and-shift. **Aurora** — AWS-native, separate storage/compute, faster failover, more replicas. Exam: need MySQL compatibility + scale → Aurora.

---

### Amazon Aurora architecture & Aurora Serverless v2

Storage volume replicated 6 ways across 3 AZs. Up to 15 read replicas. **Serverless v2** — auto-scaling capacity for variable workloads. **Global Database** — cross-region replicas with ~1s lag typical.

---

### RDS Proxy (connection pooling)

Pools connections for Lambda/serverless bursting connections to RDS/Aurora. Reduces DB connection exhaustion; IAM auth support; failover awareness.

---

### RDS backup, snapshots & restore

Automated backups (point-in-time recovery within retention), manual snapshots. Restore creates **new** instance. Test RTO/RPO. Encrypt backups with KMS.

---

### Amazon Redshift (warehouse overview)

Columnar MPP warehouse for analytics. Redshift Serverless option. Spectrum queries S3 data lake. Not OLTP — exam distinguishes OLTP (RDS) vs OLAP (Redshift).

---

**📌 Databases — NoSQL & Caching**

### Amazon DynamoDB (partitions, RCU/WCU, on-demand vs provisioned)

Fully managed key-value/document. Partition key (+ optional sort key) determines partition. **Provisioned** RCU/WCU or **on-demand** pay per request. Hot partition key = throttling — design keys for even distribution.

---

### DynamoDB indexes (LSI, GSI)

**LSI** — same partition key, alternate sort key; must define at create; shares throughput. **GSI** — alternate partition/sort keys; eventual consistency; separate throughput. Enable access patterns without scan.

---

### DynamoDB streams & DAX

**Streams** — ordered change feed per partition (Lambda consumers). **DAX** — in-memory cache microsecond reads; app transparent; write-through cache invalidation.

---

### DynamoDB global tables & TTL

**Global tables** — multi-region active-active replication. **TTL** — auto-delete expired items (free, background). Use for sessions, ephemeral data.

---

### Amazon ElastiCache (Redis vs Memcached)

In-memory cache in VPC. **Redis** — persistence, replication, cluster mode, data structures, sorted sets. **Memcached** — multithreaded, simple cache, horizontal scale. Redis for HA + complex structures; Memcached for simple massive cache.

---

### Amazon DocumentDB & Neptune (overview)

**DocumentDB** — MongoDB-compatible. **Neptune** — graph DB (Gremlin, SPARQL). Use when relational model poor fit (relationships, documents).

---

**📌 Application Integration & Messaging**

### Amazon SQS (standard vs FIFO)

**Standard** — unlimited throughput, at-least-once, best-effort ordering. **FIFO** — exactly-once (with dedup), strict order, 300 msg/s per queue (batching higher). Choose FIFO when order and dedup matter.

---

### SQS visibility timeout, DLQ, long polling

**Visibility timeout** — hide message while processing; extend if job long. **DLQ** — poison messages after max receives. **Long polling** (`WaitTimeSeconds`) reduces empty receives and cost.

---

### Amazon SNS (topics, fan-out, filtering)

Pub/sub to subscribers (SQS, Lambda, HTTP, email, SMS). **Message filtering** by attributes. Fan-out: one event → many queues/functions. At-least-once delivery.

---

### SNS + SQS fan-out pattern

SNS topic → multiple SQS queues (each subscriber). Decouple microservices; buffer spikes; independent scaling. Classic exam architecture pattern.

---

### Amazon EventBridge (event bus, rules, schema registry)

Serverless event router (formerly CloudWatch Events). **Default** and **custom** buses; cross-account via resource policies. **Rules** match event patterns → targets (Lambda, Step Functions, SQS, etc.). **Schema registry** for contract discovery.

---

### AWS Step Functions (Standard vs Express)

Orchestrate workflows as state machines. **Standard** — long-running, exactly-once semantics, audit history. **Express** — high volume, short duration, at-least-once, cheaper. Visual workflows for sagas, human approval steps.

---

### Amazon MQ (overview)

Managed ActiveMQ/RabbitMQ for legacy JMS/AMQP apps migrating to cloud. Not serverless — you manage broker sizing. When lift-and-shift messaging can't rewrite to SQS/SNS yet.

---

**📌 Streaming & Data Ingestion**

### Amazon Kinesis Data Streams

Real-time streaming shards with ordered records per partition key. Producers → shards → consumers (SDK, Lambda, KCL). Scale shards; hot keys problem similar to DynamoDB.

---

### Kinesis Data Firehose

Fully managed delivery stream to S3, Redshift, OpenSearch, Splunk — no shard management. Optional Lambda transform. Near-real-time ETL ingestion.

---

### Kinesis Data Analytics (overview)

SQL on streams (deprecated path) / Apache Flink for real-time analytics. Prefer Flink-managed service for complex event processing.

---

### MSK (Managed Kafka — overview)

Managed Apache Kafka for Kafka-native apps (topics, consumer groups, exactly-once with config). Use when existing Kafka ecosystem or need log retention replay semantics.

---

### Glue & Athena (analytics overview)

**Glue** — ETL, data catalog. **Athena** — serverless SQL on S3 (Presto). Data lake query pattern: ingest → S3 (Parquet) → Athena/Glue → QuickSight.

---

**📌 API Management & Integration**

### Amazon API Gateway (REST vs HTTP vs WebSocket)

| API | Features |
|---|---|
| **REST** | Full features, request/response mapping, caching, WAF |
| **HTTP** | Cheaper, simpler, JWT authorizers, lower latency |
| **WebSocket** | Bidirectional real-time |

Fronts Lambda, HTTP backends, AWS services. Throttling, API keys, usage plans for monetization/partners.

---

### API Gateway stages, throttling, caching, usage plans

**Stages** (dev/prod) with deployments. **Throttling** burst/rate limits protect backend. **Caching** reduces backend load (TTL by stage). **Usage plans** tie API keys to throttle/quotas.

---

### API Gateway authorizers (IAM, Cognito, Lambda)

Control access: **IAM** for SigV4 (internal AWS callers), **Cognito** for user pools/JWT, **Lambda authorizer** for custom logic. HTTP API JWT authorizer simpler for OIDC.

---

### AWS AppSync (GraphQL overview)

Managed GraphQL with real-time subscriptions. Resolves from DynamoDB, Lambda, RDS, HTTP. Mobile/web apps needing flexible queries — single endpoint, client-driven data fetch.

---

**📌 Containers on AWS**

### Amazon ECR

Private Docker registry integrated with IAM. Image scanning on push. Lifecycle policies expire old images. Use with ECS/EKS/CodePipeline.

---

### Amazon ECS (tasks, services, clusters)

AWS-native orchestration. **Task definition** — container specs. **Service** — desired count + ALB registration. **Cluster** — logical grouping. Simpler than K8s for AWS-centric teams.

---

### ECS launch types (EC2 vs Fargate)

**EC2** — you manage capacity, more control, potentially cheaper at steady scale. **Fargate** — serverless tasks, no EC2 management. **Capacity providers** mix Spot/On-Demand.

---

### Application Load Balancer with ECS

Dynamic port mapping (host mode vs awsvpc). **Target type IP** in awsvpc — register task ENI IPs. Health checks on `/health`. Service auto-registers tasks.

---

### Amazon EKS (overview)

Managed Kubernetes control plane. Worker nodes EC2 or Fargate profiles. Use for K8s portability, rich ecosystem, multi-cloud skill set. Higher operational complexity vs ECS.

---

### ECS vs EKS vs Lambda decision matrix

| Need | Lean |
|---|---|
| Short event jobs | Lambda |
| AWS-native containers, simpler ops | ECS + Fargate |
| Kubernetes required | EKS |
| Long-running always-on low ops | Fargate |
| Extreme scale batch Spot | ECS on EC2 Spot |

---

**📌 High Availability & Disaster Recovery**

### RTO & RPO definitions

**RPO** — max acceptable data loss (time between backups). **RTO** — max acceptable downtime. Drive architecture: synchronous replication lowers RPO; warm standby lowers RTO.

---

### DR strategies (backup-restore, pilot light, warm standby, multi-site active-active)

| Strategy | Cost | RTO/RPO |
|---|---|---|
| Backup-restore | Lowest | Hours / hours |
| Pilot light | Low | Tens of min |
| Warm standby | Medium | Minutes |
| Active-active multi-site | Highest | Near zero |

AWS DRS, AMIs/snapshots, Route 53 failover implement these patterns.

---

### Multi-AZ vs Multi-Region patterns

**Multi-AZ** — HA within region (sync where available). **Multi-Region** — DR, compliance, latency. Data replication complexity (conflict resolution, global tables, async replicas).

---

### Elastic Disaster Recovery (DRS overview)

Continuous block-level replication to staging area in AWS; fail over EC2 in minutes. Low RPO/RTO without maintaining full duplicate always-on stack.

---

### Backup plans (AWS Backup overview)

Centralized backup policies across EBS, RDS, DynamoDB, EFS, etc. Cross-region/account copy. Compliance retention. One pane vs ad-hoc snapshots per service.

---

### Architecture for stateless vs stateful tiers

Stateless app tier behind ALB → scale horizontally, replace anytime. Stateful tier (DB) → Multi-AZ RDS, backups, careful failover. Session externalize to ElastiCache/DynamoDB for stateless web tier.

---

**📌 Migration & Hybrid**

### AWS Migration Hub & Application Discovery Service

Track migration progress across tools. **Application Discovery Service** — agent/agentless inventory of on-prem dependencies for planning wave migrations.

---

### AWS Database Migration Service (DMS)

Replicate homogenous/heterogeneous DBs to AWS with ongoing CDC. Source/on-prem → RDS/Aurora/S3. Minimal downtime migrations when paired with cutover plan. Schema conversion tool for heterogeneous (Oracle → PostgreSQL).

---

### AWS Application Migration Service (MGN)

Lift-and-shift rehost: continuous replication of source servers to AWS staging snapshots; test and cutover. Successor to CloudEndure migration.

---

### VMware Cloud on AWS (overview)

Run VMware SDDC on bare metal in AWS. Hybrid extension of vSphere — same tools, burst to AWS. Specific enterprise migration path.

---

### Hybrid connectivity summary (VPN + Direct Connect)

Combine **Direct Connect** primary + **VPN** backup for resilient hybrid. Route propagation via Virtual Private Gateway or Transit Gateway. DNS resolution split-horizon for hybrid Active Directory.

---

### Snowball / Snowmobile (edge transfer overview)

Physical data transfer when network impractical. **Snowball Edge** compute+storage at edge. Petabyte-scale **Snowmobile** truck. Seed initial S3 bulk then sync deltas.

---

**📌 Security, Encryption & Compliance**

### AWS KMS (CMK, envelope encryption, grants)

**Customer Master Keys** — symmetric (default) or asymmetric. Envelope encryption: data key encrypts data, CMK encrypts data key. **Grants** delegate limited key use. Key policies + IAM control access. Rotation for symmetric CMKs.

---

### AWS Secrets Manager vs Systems Manager Parameter Store

**Secrets Manager** — automatic rotation (RDS), cross-account, costs more. **Parameter Store** — config + SecureString (manual rotation), free tier, integrates with SSM. Secrets for credentials; Parameter Store for non-rotating config.

---

### AWS WAF & AWS Shield

**WAF** — L7 rules on ALB, API Gateway, CloudFront (SQLi, XSS, rate limits, geo block). **Shield Standard** free DDoS protection. **Shield Advanced** — 24/7 DRT, cost protection, advanced metrics.

---

### AWS Firewall Manager (overview)

Central WAF rules, SG policies across organization accounts. Consistent security baseline at scale.

---

### Amazon Macie (PII in S3 overview)

ML discovers sensitive data (PII) in S3 buckets. Compliance reporting. Pair with bucket policies blocking public access.

---

### GuardDuty, Security Hub, Inspector (overview)

**GuardDuty** — threat detection (ML on VPC Flow, CloudTrail, DNS). **Security Hub** — aggregate findings (CIS benchmarks). **Inspector** — vulnerability scanning for EC2/container images. Defense in depth detective controls.

---

### Encryption in transit (TLS) & at rest patterns

**In transit:** TLS 1.2+ everywhere (ALB, CloudFront, API Gateway). **At rest:** KMS for EBS, S3, RDS, DynamoDB. End-to-end: client → TLS → app → encrypted storage. mTLS for service-to-service in zero-trust designs.

---

**📌 Monitoring, Logging & Operations**

### Amazon CloudWatch metrics, alarms, dashboards

Default metrics (EC2, ALB, RDS); custom metrics via API/agent. **Alarms** trigger SNS, Auto Scaling, EventBridge. **Dashboards** visualize ops health. **Metric math** for composite signals.

---

### CloudWatch Logs & Logs Insights

Central log storage (log groups/streams). **Logs Insights** query language for ad-hoc analysis. Subscription filters → Lambda/Kinesis/Firehose for processing/export.

---

### CloudWatch Agent & custom metrics

Collect memory/disk from EC2 (not default). Publish custom app metrics. Unified agent for logs + metrics. Required for detailed instance monitoring beyond CPU/network.

---

### AWS X-Ray (distributed tracing)

Trace requests across API Gateway → Lambda → DynamoDB/SQS. Service map, latency analysis, error rates. Instrument SDK or Lambda active tracing. Essential for debugging microservices.

---

### AWS Systems Manager (Patch Manager, Session Manager, Parameter Store)

**Session Manager** — shell access without SSH/bastion (IAM audited). **Patch Manager** — automate OS patching. **Run Command** — remote scripts. **Parameter Store** — config hierarchy.

---

### EventBridge for operational events

React to AWS health events, CloudTrail patterns, scheduled maintenance. Automate remediation (Lambda) on alarm or compliance change.

---

### Personal Health Dashboard & Trusted Advisor (overview)

**PHD** — account-specific AWS health events. **Trusted Advisor** — best-practice checks (cost, security, limits). Support plan affects full TA access.

---

**📌 Cost Management & Optimization**

### AWS Pricing models & Cost Explorer

Pay-as-you-go dominant. **Cost Explorer** — visualize spend by service/tag/time. **CUR** (Cost and Usage Report) for granular analysis. Understand free tier vs always-free (Lambda requests, etc.).

---

### AWS Budgets & Cost Anomaly Detection

Budget alerts on actual/forecast spend. **Anomaly Detection** ML flags unusual charges. Proactive ops before bill shock.

---

### Reserved Instances & Savings Plans strategy

**RI** — specific instance family/region (Standard convertible/flexible). **Savings Plans** — commit $/hour compute spend ( broader). Cover steady baseline; On-Demand/Spot for variable top.

---

### Spot instances & Spot Fleet patterns

Spot interrupted with 2-min notice — fault-tolerant workloads (batch, render farm, stateless workers, ASG mixed instances policy). **Spot Fleet** diversify capacity pools. Not for single-instance critical DB.

---

### S3 Intelligent-Tiering & lifecycle cost wins

Auto-move objects between access tiers; small monitoring fee. Lifecycle to Glacier for archives. Delete incomplete multipart uploads. Reduce cross-AZ/region transfer where possible.

---

### Right-sizing & tagging for cost allocation

Use Compute Optimizer recommendations. Tag `Environment`, `Team`, `CostCenter` for Cost Explorer allocation. Turn off dev nights/weekends with schedules.

---

### Data transfer cost awareness

|**Flow|Often charged|
|---|---|
| Internet egress | Yes (expensive) |
| Cross-AZ same region | Yes |
| Cross-region | Yes |
| Into AWS from internet | Often free |
| CloudFront egress | CloudFront pricing (often cheaper than S3 direct) |

Architect: CloudFront for static assets; keep traffic in AZ/VPC endpoints; process data in same region as storage.

---

**📌 Architecture Patterns & Design Scenarios**

### Three-tier web application on AWS

Classic: Route 53 → CloudFront (optional) → ALB → EC2/ECS (private subnets) → RDS Multi-AZ (private). Static assets on S3. ElastiCache session/cache. ASG for web/app tier. Template for many exam questions.

---

### Microservices on ECS/EKS/Lambda

Decompose by domain; async via SQS/EventBridge; API Gateway front door; per-service IAM roles; X-Ray tracing; independent deploy pipelines. Choose sync (REST) vs async (events) boundaries carefully.

---

### Event-driven architecture (SQS/SNS/EventBridge)

Producers don't know consumers. Buffer with SQS; fan-out with SNS; enterprise bus with EventBridge schema contracts. Idempotent consumers; DLQs; visibility timeout tuning.

---

### Static website (S3 + CloudFront)

S3 hosts static files; CloudFront HTTPS + caching; OAC locks bucket private. Route 53 alias to CloudFront. Cheap, scalable marketing/docs sites.

---

### Hybrid read-heavy API (ElastiCache + RDS)

RDS source of truth; Redis cache-aside for hot keys; TTL + cache invalidation strategy; RDS Read Replicas if read DB load still high. Protect database from thundering herd on cache miss.

---

### Multi-region active-passive failover

Primary region serves traffic; secondary warm with replicated data (S3 CRR, Aurora Global, async replicas). Route 53 health check failover. RTO includes DNS TTL and promotion steps — document runbooks.

---

### Batch processing (Batch, Step Functions)

**AWS Batch** — managed batch jobs on Spot/On-Demand compute environment. **Step Functions** orchestrate dependent jobs with retries. S3 trigger → Lambda → Batch for large files.

---

### CI/CD on AWS (CodePipeline overview)

CodeCommit/GitHub → CodeBuild → CodeDeploy/ECS blue-green → CodePipeline orchestration. Artifact store S3; IAM least privilege per stage. Integrate CloudFormation/Terraform for infra stages.

---

**📌 Solutions Architect Exam & Interview Extras**

### Choosing the right database (decision flow)

Start: relational fixed schema + joins? → RDS/Aurora. Key-value scale + ms latency? → DynamoDB. Cache? → ElastiCache. Warehouse/analytics? → Redshift. Graph? → Neptune. Document flexible? → DocumentDB/DynamoDB document. Time-series? → Timestream. Don't force one DB for everything.

---

### Choosing the right compute (decision flow)

Long-running always-on? → EC2/ECS/EKS. Event/spiky short? → Lambda. Containers without servers? → Fargate. HPC/bare metal? → EC2 special instances. Edge? → Lambda@Edge/CloudFront. Match ops appetite to choice.

---

### CAP & consistency tradeoffs on AWS services

DynamoDB global tables — eventual cross-region. SQS standard — no ordering guarantee. RDS Multi-AZ failover — brief disconnect. Design for **eventual consistency** where service docs say so; use strongly consistent reads (DynamoDB) when needed per operation.

---

### Idempotency & exactly-once patterns (FIFO, dedup)

SQS FIFO deduplication ID; Lambda idempotent handlers; DynamoDB conditional writes; Step Functions task tokens. Retries are everywhere — **at-least-once** is default assumption.

---

### Common exam traps (NACL vs SG, Multi-AZ vs Read Replica)

- SG **stateful** vs NACL **stateless**
- Multi-AZ **failover** not read scale; Read Replica **reads** not auto failover (unless promoted)
- S3 **versioning** ≠ replication (need CRR/SRR enabled)
- **Internet Gateway** vs **NAT Gateway** direction
- **ALB** L7 vs **NLB** L4
- **ElastiCache** is cache not primary DB
- **CloudFront** signed URL origin access vs public S3

---

### Whiteboard: design a scalable photo-sharing app

Sketch: mobile/web → CloudFront (thumbnails) → ALB → stateless API (ECS/Lambda) → S3 (photos, user prefixes) + DynamoDB (metadata, userId partition key) + SQS (async resize Lambda workers) + Rekognition optional. Presigned S3 uploads; multi-AZ; CloudWatch alarms; WAF on ALB/API GW.

---

### Whiteboard: design real-time analytics pipeline

IoT/web → API Gateway/Kinesis Data Streams → Lambda/Flink consumers → aggregate → DynamoDB/OpenSearch dashboard; archive raw to S3 (Firehose) → Athena/Glue for batch. Handle hot shards; partition keys by deviceId hash; DLQ for poison events.

---

**Interview recap**

- Anchor answers in **Well-Architected pillars** (security, reliability, cost, perf).
- Draw **VPC** first for network questions; label public/private, NAT, SG.
- State **RTO/RPO** when discussing DR.
- Prefer **managed services** when ops burden isn't differentiating.
- Always mention **IAM least privilege**, **encryption**, and **multi-AZ** where relevant.
