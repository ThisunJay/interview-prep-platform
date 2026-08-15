# Python, Data Engineering, Cloud & Systems Topics

Checklist for deep-dive prep aligned to skills on **Thisun Silva** CV (Python, Flask/Lambda, Airflow, Spark, Flink, Kafka, EMR, Glue, Iceberg, Athena, Redshift, OpenSearch, AWS, Docker, Kubernetes, Jenkins, microservices, SQL/NoSQL) plus System Design foundations.

Use with companion Guides later. Check off as you can explain aloud with tradeoffs and a production example.

---

**✅ Python for Data & Backend Engineering**

- [] Python runtime for data workloads (CPython, GIL implications for ETL/workers)
- [] Virtual envs, dependency pinning, packaging for jobs (pip, poetry, uv, lockfiles)
- [] Project layout for pipelines vs services
- [] Typing for data code (`TypedDict`, `Protocol`, Pydantic models for events)
- [] Dataclasses / Pydantic for job configs & event schemas
- [] Iterators, generators, and streaming large files
- [] Concurrency models for DE
  - [] Threading vs multiprocessing vs concurrent.futures
  - [] asyncio when talking to many I/O APIs
  - [] Process pools for CPU-bound transforms
- [] Efficient I/O (buffered reads, chunking, memory maps — conceptual)
- [] Working with Parquet / Arrow in Python (pyarrow, pandas vs polars overview)
- [] boto3 / AWS SDK patterns (sessions, pagination, retries, pagination tokens)
- [] Logging, structured logs, and correlation IDs in jobs
- [] Error handling & retries (tenacity patterns, idempotent handlers)
- [] Testing data code (pytest, golden files, property-based basics)
- [] Flask / lightweight APIs in front of data services (when relevant)
- [] AWS Lambda with Python
  - [] Handler design, cold starts, layers, timeouts, memory sizing
  - [] Event sources (Kafka/MSK triggers conceptual, SQS, S3, API Gateway)
  - [] Idempotency & partial batch failure
  - [] Observability (CloudWatch, Datadog APM)

---

**✅ Data Engineering Fundamentals**

- [] What data engineers own vs analytics / ML / backend
- [] Batch vs streaming vs micro-batch
- [] OLTP vs OLAP vs lakehouse
- [] Data lifecycle (ingest → validate → transform → serve → archive)
- [] Medallion / layered architecture (bronze/silver/gold) 
- [] Source of truth, CDC, and event sourcing (overview)
- [] Exactly-once, at-least-once, at-most-once delivery
- [] Idempotency keys & deduplication strategies
- [] Late data, watermarks, and reprocessing
- [] Backfills & replay
- [] Data contracts & schema evolution
- [] Data quality (completeness, accuracy, freshness, uniqueness)
- [] SLAs / SLOs for pipelines (freshness, completeness)
- [] Cost awareness (scan bytes, shuffle, storage tiers)
- [] Orchestration vs compute vs storage vs catalog (separation of concerns)

---

**✅ Storage Formats & Table Formats**

- [] Row vs columnar storage
- [] CSV / JSON / Avro / Protobuf / Parquet / ORC comparison
- [] Parquet internals (row groups, predicate pushdown, compression)
- [] Partitioning strategies (time, high-cardinality pitfalls)
- [] Compaction & small-files problem
- [] Apache Iceberg
  - [] Table format goals (ACID on the lake, time travel, snapshots)
  - [] Hidden partitioning
  - [] Schema evolution & partition evolution
  - [] Catalogs (Glue / Hive / REST catalog concepts)
  - [] Iceberg vs Hive tables vs Delta/Hudi (high-level comparison)
- [] AWS Glue Data Catalog
  - [] Databases, tables, partitions
  - [] Crawlers vs explicit DDL
  - [] Integration with Athena, Spark, Iceberg
- [] S3 as data lake storage
  - [] Prefix design, lifecycle policies
  - [] Consistency model implications
  - [] Encryption & bucket policies

---

**✅ Amazon S3, Redshift, Athena, EMR (AWS Analytics)**

- [] S3 data lake patterns used in ML/feature pipelines
- [] Amazon Redshift
  - [] Columnar warehouse architecture
  - [] Distribution styles & sort keys
  - [] WLM / concurrency (conceptual)
  - [] Unload/copy to/from S3
  - [] Redshift Spectrum / lake queries (overview)
  - [] Clickstream extraction patterns (as on CV)
- [] Amazon Athena
  - [] Serverless SQL on S3 + Glue Catalog
  - [] Partition projection
  - [] Cost model (bytes scanned)
  - [] CTAS / UNLOAD patterns
- [] Amazon EMR
  - [] EMR architecture (primary/core/task nodes)
  - [] EMR on EC2 vs EMR Serverless (overview)
  - [] Cluster lifecycle, bootstrap actions
  - [] Spot vs on-demand for cost
  - [] Running Spark / Flink / Hive on EMR
  - [] Storage: HDFS vs S3 (EMRFS)
  - [] Logging, debugging failed steps
- [] EC2 for training / job runners (IAM roles, sizing, ephemeral disks)
- [] Glue Jobs vs EMR vs Lambda — when to choose which
- [] End-to-end example: Redshift → Airflow → EC2 train → Parquet → S3/Glue → Athena/Spark

---

**✅ AWS Glue (ETL, Catalog, Jobs)**

- [] Glue Data Catalog as Hive-compatible metastore
- [] Glue Crawlers (pros/cons)
- [] Glue ETL Jobs (Spark-based)
- [] Glue Job Bookmarks
- [] Glue Interactive Sessions / Notebooks (overview)
- [] DynamicFrames vs DataFrames
- [] Glue + Iceberg / Hudi integrations (conceptual)
- [] IAM permissions for lake access
- [] Incremental processing patterns
- [] Monitoring Glue jobs (CloudWatch metrics, logs)

---

**✅ Apache Airflow**

- [] Why orchestrators exist (vs cron)
- [] Airflow architecture
  - [] Scheduler
  - [] Executor types (Local, Celery, Kubernetes, Sequential)
  - [] Metadata DB
  - [] Webserver
  - [] Workers / triggerer (deferrable ops overview)
- [] DAG design principles
  - [] Idempotent tasks
  - [] Small tasks vs fat tasks
  - [] Explicit dependencies
  - [] Avoiding giant monolith DAGs
- [] Operators & sensors (PythonOperator, BashOperator, SqlSensor, ExternalTaskSensor, S3 sensors)
- [] TaskFlow API (`@task`)
- [] XComs (what to pass / what not to pass)
- [] Variables, Connections, Secrets backends
- [] Pools, queues, priority weights
- [] Scheduling
  - [] `schedule_interval` / timetable
  - [] Catchup & backfill
  - [] Data interval vs execution date (Airflow 2 mental model)
- [] Retries, SLA misses, alerting
- [] Branching, TriggerDagRun, Datasets / data-aware scheduling (Airflow 2.4+)
- [] Testing DAGs (dagbag import, unit-testing operators)
- [] MWAA vs self-managed Airflow (overview)
- [] Production patterns from CV
  - [] Extract from Redshift
  - [] Trigger training on EC2
  - [] Write Parquet to S3 + Glue catalog registration
  - [] Failure handling & observability

---

**✅ Apache Spark**

- [] Spark vs MapReduce (why Spark won for many ETL workloads)
- [] Spark Architecture
  - [] Driver, executors, cluster manager
  - [] Jobs → Stages → Tasks
  - [] DAG scheduler & shuffle
- [] RDDs vs DataFrames vs Datasets
- [] Spark SQL & Catalyst optimizer
- [] Lazy evaluation & actions vs transformations
- [] Narrow vs wide transformations
- [] Partitions, repartition vs coalesce
- [] Shuffle, skew, and mitigation (salting, AQE)
- [] Caching / persistence levels
- [] Broadcast joins vs sort-merge joins
- [] Adaptive Query Execution (AQE)
- [] Reading/writing Parquet/Iceberg/JSON
- [] Structured Streaming overview (micro-batch)
- [] Spark on EMR / Glue
- [] PySpark vs Scala (tradeoffs)
- [] Debugging: Spark UI, stage metrics, spill to disk
- [] Common performance checklist
- [] Checkpointing & fault tolerance

---

**✅ Apache Kafka**

- [] Events vs messages vs streams
- [] Kafka architecture
  - [] Brokers, topics, partitions, replicas
  - [] Leaders / ISR
  - [] Controllers (KRaft vs ZooKeeper era — conceptual)
- [] Producers
  - [] Acks (`0/1/all`)
  - [] Keys & partition assignment
  - [] Idempotent producer
  - [] Compression, batching, linger
- [] Consumers
  - [] Consumer groups
  - [] Offsets & commit strategies
  - [] Rebalancing
  - [] Cooperative sticky assignor (overview)
- [] Delivery semantics & idempotent consumers
- [] Ordering guarantees (per partition)
- [] Log retention & compaction
- [] Schema Registry / Avro / Protobuf (contract evolution)
- [] Dead letter topics / retry topics
- [] Kafka Connect (overview)
- [] Kafka Streams vs external processors (Flink)
- [] Security (SASL, TLS, ACLs) overview
- [] Ops: lag monitoring, under-replicated partitions
- [] AWS patterns: self-managed vs MSK vs MSK Serverless
- [] Kafka CV patterns
  - [] Lambda + Kafka validate/process/route order & inventory feeds
  - [] High-volume event-driven design

---

**✅ Apache Flink**

- [] Why Flink for real-time (true streaming vs micro-batch)
- [] Flink Architecture
  - [] JobManager / TaskManagers
  - [] Parallelism, slots, chaining
  - [] Managed state (keyed state)
- [] DataStream API vs Table/SQL API
- [] Event time vs processing time
- [] Watermarks & late events
- [] Windows (tumbling, sliding, session)
- [] Checkpointing & savepoints
- [] Exactly-once sinks (two-phase commit conceptual)
- [] RocksDB state backend
- [] Connectors (Kafka, OpenSearch/Elasticsearch, S3, JDBC)
- [] Backpressure
- [] Flink on EMR / Kinesis Data Analytics / self-managed (overview)
- [] Flink vs Spark Structured Streaming vs Kafka Streams
- [] Flink CV patterns
  - [] Real-time order/product capture
  - [] Product ranking pipeline into OpenSearch
  - [] Latency reduction for customer-product embeddings queries

---

**✅ Search & Serving Layer (OpenSearch)**

- [] Search vs OLTP vs warehouse
- [] Inverted index basics
- [] Mappings, analyzers, tokenization
- [] Document modeling for products / rankings
- [] Indexing pipelines from Flink/Spark/Kafka
- [] Queries vs aggregations
- [] Relevance / ranking / function_score (conceptual)
- [] Refresh interval vs near-real-time search
- [] Shards, replicas, capacity planning basics
- [] Alias / blue-green reindex patterns
- [] Pitfalls (mapping explosion, deep pagination, hot shards)
- [] OpenSearch vs Elasticsearch vs relational LIKE/ILIKE
- [] Observability for search latency & error rates

---

**✅ ML / Feature Pipeline Topics (as on CV)**

- [] Training vs inference data paths
- [] Feature stores (conceptual) vs S3/Glue tables as feature landing
- [] Offline features (Parquet) vs online features (OpenSearch/Dynamo/Redis)
- [] Clickstream → warehouse → training set construction
- [] Model artifact storage on S3
- [] Orchestrating train jobs (Airflow → EC2)
- [] Batch scoring vs real-time ranking
- [] Data leakage & time-travel correctness (high level)
- [] Monitoring data drift / pipeline freshness (practical DE view)

---

**✅ Docker**

- [] Images, containers, registries
- [] Dockerfile best practices
  - [] Multi-stage builds
  - [] Layer caching
  - [] Non-root users
  - [] `.dockerignore`
- [] EntryPoint vs CMD
- [] Volumes & bind mounts
- [] Networking (bridge, host, overlay conceptual)
- [] Environment config & secrets (what not to bake in)
- [] Healthchecks
- [] docker compose for local data stacks (Kafka/Postgres/etc.)
- [] Image scanning & SBOM overview
- [] Running Spark/Flink/Airflow components in containers
- [] Resource limits (CPU/memory)
- [] Debugging containers (exec, logs, ephemeral debug)

---

**✅ Kubernetes**

- [] Why orchestration (vs Docker alone)
- [] Cluster architecture
  - [] Control plane (API server, etcd, scheduler, controller manager)
  - [] Worker nodes (kubelet, kube-proxy, container runtime)
- [] Core objects
  - [] Pod
  - [] Deployment / ReplicaSet
  - [] StatefulSet
  - [] DaemonSet
  - [] Job / CronJob
  - [] Service (ClusterIP, NodePort, LoadBalancer)
  - [] Ingress / Gateway API (overview)
  - [] ConfigMap & Secret
  - [] PersistentVolume / PVC / StorageClass
- [] Labels, selectors, annotations
- [] Probes (liveness, readiness, startup)
- [] Rolling updates, rollbacks, blue/green & canary (patterns)
- [] Resource requests/limits & QoS
- [] Horizontal Pod Autoscaler (HPA)
- [] Namespaces & RBAC basics
- [] NetworkPolicies (overview)
- [] Helm charts (overview)
- [] Sidecars & init containers
- [] Jobs for batch/Spark-on-K8s / Airflow KubernetesExecutor (conceptual)
- [] Observability on K8s (metrics, logs, events)
- [] Local tools (minikube, kind, k9s) — optional
- [] Production concerns (pod disruption budgets, topology spread)

---

**✅ CI/CD & DevOps Tooling (Jenkins, Git, Observability)**

- [] Git branching strategies for services & infra
- [] Jenkins pipelines (declarative vs scripted overview)
  - [] Stages: lint, test, build, image, deploy
  - [] Credentials & shared libraries
  - [] Multibranch pipelines
- [] Artifact versioning & immutability
- [] Deploy strategies (rolling, blue/green, canary)
- [] Infrastructure as Code overview (Terraform/CloudFormation — awareness)
- [] 12-factor config
- [] Secrets management patterns
- [] Observability triad
  - [] Metrics (Grafana, CloudWatch, Datadog)
  - [] Logs (Datadog, CloudWatch Logs)
  - [] Traces (conceptual OpenTelemetry)
- [] Alerting & on-call hygiene (SLO, noise reduction)
- [] Dashboard design for offers/orders (CV-style operational views)
- [] Runbooks & incident response basics

---

**✅ Microservices Architecture**

- [] Monolith vs modular monolith vs microservices
- [] Service boundaries (DDD-lite: bounded contexts)
- [] Communication styles
  - [] Synchronous REST/gRPC
  - [] Asynchronous events (Kafka)
  - [] Request/response vs pub/sub vs stream processing
- [] API Gateway
  - [] Routing, auth termination, rate limiting, aggregation
  - [] Gateway vs BFF (Backend-for-Frontend)
  - [] AWS API Gateway / Spring Cloud Gateway / Kong (conceptual map)
- [] Service discovery
  - [] Client-side vs server-side discovery
  - [] DNS, Eureka/Consul, Kubernetes Services as discovery
- [] Load balancing (L4/L7, client-side)
- [] Configuration & secret distribution
- [] Resilience patterns
  - [] Timeouts, retries, backoff, jitter
  - [] Circuit breaker (Resilience4j)
  - [] Bulkhead
  - [] Rate limiting
- [] Distributed transactions
  - [] 2PC (why avoided)
  - [] Saga (choreography vs orchestration)
  - [] Outbox pattern
  - [] Idempotent consumers
- [] Consistency models (strong vs eventual)
- [] Data per service & shared DB anti-pattern
- [] Contract testing & versioning APIs
- [] Security between services (mTLS, IAM, JWT propagation)
- [] Observability in distributed systems (correlation IDs, RED metrics)
- [] Serverless microservices (Lambda + events) tradeoffs
- [] When NOT to use microservices

---

**✅ System Design (Interview-Ready Pillars)**

- [] Clarifying requirements (functional + non-functional)
- [] Capacity estimation (QPS, storage, bandwidth — Fermi style)
- [] High-level design sketches (clients → edge → services → data)
- [] Scaling
  - [] Vertical vs horizontal
  - [] Stateless services
  - [] Caching layers (CDN, Redis, app cache)
  - [] Read replicas / sharding
- [] Availability & reliability (replication, failover, multi-AZ)
- [] Consistency, latency, and cost tradeoffs
- [] CAP theorem in practice
- [] Caching strategies (cache-aside, write-through, TTLs, stampede)
- [] Rate limiting & throttling designs
- [] Queue-based load leveling
- [] Fan-out / CQRS / read models (OpenSearch as read model)
- [] Designing for replay & audit
- [] Multi-tenant considerations (overview)
- [] Security in design (authn/z, least privilege, encryption)
- [] Failure modes & graceful degradation
- [] End-to-end case studies to practice
  - [] Real-time product ranking & recommendations
  - [] Order status engine (exclude purchased items)
  - [] Loyalty offer tracker (batch + near-real-time status)
  - [] Clickstream → features → training → Parquet lake
  - [] Admin BFF for personalization ops
  - [] High-volume order/inventory Kafka ingestion with Lambda validation

---

**✅ SQL (Relational Deep Dive)**

- [] Relational model & normalization (1NF–3NF, when to denormalize)
- [] PostgreSQL architecture overview (processes, MVCC)
- [] MySQL vs PostgreSQL practical differences
- [] Core SQL
  - [] SELECT/WHERE/ORDER/LIMIT
  - [] JOINs (inner, left, right, full, cross, anti-join patterns)
  - [] GROUP BY / HAVING
  - [] Aggregations
  - [] Subqueries & CTEs (`WITH`)
  - [] Window functions (`ROW_NUMBER`, `RANK`, `LAG/LEAD`, running totals)
  - [] CASE expressions
  - [] UNION / INTERSECT / EXCEPT
- [] Indexes
  - [] B-tree, Hash (where supported), GIN/GiST (Postgres awareness)
  - [] Composite indexes & leftmost prefix
  - [] Covering indexes
  - [] When indexes hurt (writes, wrong selectivity)
- [] Query planning (`EXPLAIN` / `ANALYZE`)
- [] Transactions
  - [] ACID
  - [] Isolation levels (READ COMMITTED, REPEATABLE READ, SERIALIZABLE)
  - [] Dirty/non-repeatable/phantom reads
  - [] Deadlocks
- [] Constraints (PK, FK, unique, check)
- [] Views & materialized views
- [] Upserts (`ON CONFLICT` / `INSERT ... ON DUPLICATE`)
- [] Pagination (OFFSET vs keyset)
- [] Locking (optimistic vs pessimistic)
- [] Connection pooling (PgBouncer / app pools)
- [] Migrations (expand/contract pattern)
- [] SQL for analytics on Redshift (differences from Postgres)
- [] Common interview SQL problems (top-N per group, gaps, running metrics)

---

**✅ NoSQL & Specialized Stores**

- [] When NoSQL fits (access patterns, scale, flexibility)
- [] Consistency & durability tradeoffs overview
- [] Document stores — MongoDB
  - [] Documents, collections, BSON
  - [] Embedding vs referencing
  - [] Indexing strategies
  - [] Aggregation pipeline
  - [] Transactions (multi-document) — limits
  - [] Schema design for trading/platform-style workloads
- [] Key-value / wide-ish — Amazon DynamoDB
  - [] Tables, items, PK/SK
  - [] GSIs / LSIs
  - [] Capacity modes (provisioned vs on-demand)
  - [] Single-table design (conceptual)
  - [] Consistency (eventually vs strongly consistent reads)
  - [] Streams for CDC-like flows
  - [] Hot partitions & adaptive capacity
- [] Warehouse — Redshift (OLAP) as distinct from OLTP NoSQL
- [] Search — OpenSearch as query-optimized store
- [] Polyglot persistence strategy (how YOU combine Postgres + DynamoDB + OpenSearch + Redshift + S3)
- [] Caching stores awareness (Redis) in microservice designs
- [] Data modeling exercises
  - [] Order events in Kafka → DynamoDB projection
  - [] Product docs in OpenSearch
  - [] User/admin relational data in PostgreSQL
  - [] Clickstream analytics in Redshift + lake Parquet

---

**✅ Networking, Security & Reliability for Distributed Data Systems**

- [] TLS, certificates, and encryption at rest / in transit
- [] IAM roles for Lambda / EMR / EC2 / Airflow workers
- [] Network isolation (VPC, private subnets, security groups — AWS overview)
- [] PII handling in logs & lakes
- [] GDPR-style deletion challenges on immutable lakes/Kafka (conceptual)
- [] Backup / restore / time travel (Iceberg snapshots, DB backups)
- [] Chaos & failure injection awareness
- [] Cost governance (S3 storage classes, Athena scans, EMR idle clusters)

---

**✅ Cross-Cutting Interview Scenarios (Integrate Everything)**

- [] Design a real-time ranking system (Kafka + Flink + OpenSearch)
- [] Design an Airflow-orchestrated daily ML training pipeline
- [] Design Kafka → Lambda validation → multi-sink routing
- [] Migrate Hive tables to Iceberg on S3 + Glue Catalog
- [] Compare EMR Spark job vs Glue job vs Flink streaming job for a use case
- [] Debug consumer lag / checkpoint failures / DAG SLA miss
- [] Choose SQL vs DynamoDB vs OpenSearch for a given access pattern
- [] Containerize a worker and deploy with Kubernetes Job/Deployment
- [] Add observability (Grafana metrics + Datadog logs) to a data product
- [] Explain microservices around a personalization platform (gateway, BFF, events)

---

## How to use this checklist

1. For each item, practice a **definition → why it exists → how it works → tradeoffs → one CV example**.
2. Prioritize sections matching recent Sysco work: **Kafka, Flink, Airflow, OpenSearch, Glue/S3/Redshift, Lambda, observability**, then fill Docker/K8s/system design/SQL for interviews.
3. Ask for the **Guide** next (same layout, deep answers under every heading) when you want the full write-up.
