# Python, Data Engineering, Cloud & Systems Guide

A deep-dive companion to `Python Data Engineering Cloud Systems Topics.md`. Each heading matches the checklist; under every topic and subtopic: **what it is**, **why it exists**, **how it works**, **tradeoffs**, and **interview / CV-ready nuance**.

---

**✅ Python for Data & Backend Engineering**

### Python runtime for data workloads (CPython, GIL implications for ETL/workers)

Most production data code runs on **CPython**. The **GIL** (Global Interpreter Lock) allows only one thread to execute Python bytecode at a time, so CPU-bound transforms in threads do not scale across cores. For ETL workers: use **multiprocessing** / process pools for heavy CPU work; use **threads** or **asyncio** for I/O (S3, APIs, DB). Spark/Flink move heavy compute to the JVM — Python is often the driver or a UDF path. Interview line: “GIL pushes CPU-bound Python to processes or to distributed engines.”

---

### Virtual envs, dependency pinning, packaging for jobs (pip, poetry, uv, lockfiles)

Isolate dependencies per project/job so Airflow workers, Lambda layers, and EMR bootstrap envs are reproducible.

- **venv + pip + requirements.txt** — universal; pin with `==` or hash-pinning for critical jobs.  
- **poetry / uv / PDM** — lockfiles (`poetry.lock`) for deterministic installs.  
- Ship jobs as: wheel + lockfile, container image, or Lambda layer. Never rely on “whatever is on the AMI.”

---

### Project layout for pipelines vs services

**Services** (Flask/FastAPI): `api/`, `services/`, `repositories/`, tests, `Dockerfile`.  
**Pipelines**: `dags/`, `jobs/` (Spark/Flink entrypoints), `transforms/`, `schemas/`, `tests/`, `conf/`. Keep orchestration (Airflow) thin — call into versioned job packages rather than stuffing logic in DAG files.

---

### Typing for data code (`TypedDict`, `Protocol`, Pydantic models for events)

Type hints catch schema mistakes before production. `TypedDict` for dict-shaped records; `Protocol` for duck-typed interfaces; **Pydantic** for validating Kafka/Lambda payloads at boundaries. Prefer validating at ingest edges; keep inner loops lean.

---

### Dataclasses / Pydantic for job configs & event schemas

**Dataclasses** — simple configs and internal records.  
**Pydantic** — coercion, validation errors, JSON schema, settings (`BaseSettings`). Use for event contracts (`OrderEvent`, `InventoryUpdate`) and job parameters (date range, source table). Fail fast on invalid config at job start.

---

### Iterators, generators, and streaming large files

Don’t load multi‑GB files into memory. Generators/`yield`, chunked reads, and streaming parsers process record-by-record. Same idea as Spark partitions: bounded memory per unit of work.

---

### Concurrency models for DE

#### Threading vs multiprocessing vs concurrent.futures

| Model | Best for | Caveat |
|---|---|---|
| Threads | I/O-bound (HTTP, S3) | GIL limits CPU |
| Multiprocessing | CPU-bound Python | Higher memory; pickle costs |
| `ThreadPoolExecutor` / `ProcessPoolExecutor` | Pooled work | Prefer executors over raw threads |

#### asyncio when talking to many I/O APIs

One thread, many concurrent waits (API fan-out, async DB drivers). Don’t mix blocking boto3 calls inside the event loop without `to_thread` / executors.

#### Process pools for CPU-bound transforms

Parse/compress/transform CPU-heavy payloads in `ProcessPoolExecutor`; keep the coordinator thin. Or push to Spark/Flink.

---

### Efficient I/O (buffered reads, chunking, memory maps — conceptual)

Prefer buffered readers, read/write in chunks (e.g. 8–64MB), multipart S3 uploads for large objects. Memory mapping helps some local binary scans; on S3, design for **range GETs** and columnar formats that skip unread data.

---

### Working with Parquet / Arrow in Python (pyarrow, pandas vs polars overview)

**Arrow** — in-memory columnar; zero-copy interop. **Parquet** — on-disk columnar. **pandas** — ubiquitous, eager, memory-heavy. **Polars** — faster lazy engine for many single-node workloads. For multi-TB: Spark/Flink, not pandas. Interview: “pandas for exploration; Arrow/Parquet for interchange; Spark for scale.”

---

### boto3 / AWS SDK patterns (sessions, pagination, retries, pagination tokens)

Use a shared `Session`/client; never hardcode keys (IAM roles). Always **paginate** (`paginator` or `NextToken` loops). Rely on built-in retries with backoff; make handlers idempotent for duplicate delivers. Watch API rate limits (Glue, S3, Redshift Data API).

---

### Logging, structured logs, and correlation IDs in jobs

JSON logs with `job_id`, `dag_run_id`, `partition_date`, `trace_id`. Correlate Airflow → Spark → downstream. Avoid logging PII. Levels: INFO for progress, WARNING for retries, ERROR for failures with stack traces to Datadog/CloudWatch.

---

### Error handling & retries (tenacity patterns, idempotent handlers)

Retry **transient** errors (throttling, network); don’t retry permanent validation failures. Use exponential backoff + jitter. Handlers must be **idempotent** (safe if run twice). Dead-letter poison messages after N tries.

---

### Testing data code (pytest, golden files, property-based basics)

Unit-test transforms with small fixtures; **golden files** compare expected Parquet/JSON outputs; property-based tests (Hypothesis) for invariants (“row count preserved,” “no null PK”). Integration tests against LocalStack/minio or ephemeral AWS accounts carefully.

---

### Flask / lightweight APIs in front of data services (when relevant)

Thin APIs for triggering jobs, status, or serving online features. Keep heavy compute out of request threads — enqueue to Kafka/SQS/Airflow. Application factory, health checks, auth on admin endpoints.

---

### AWS Lambda with Python

#### Handler design, cold starts, layers, timeouts, memory sizing

Handler: parse event → validate → process → return. Cold starts: reduce package size, use layers for heavy deps, provisioned concurrency if latency-critical. Timeout max 15 minutes — not for long ETL. Memory setting also scales CPU — tune empirically.

#### Event sources (Kafka/MSK triggers conceptual, SQS, S3, API Gateway)

SQS (partial batch failure), S3 (object-created), API Gateway (sync HTTP), MSK/Kafka (batch of records). Design for batches and retries at the source.

#### Idempotency & partial batch failure

Dedupe by event ID / business key (DynamoDB conditional write). SQS: `ReportBatchItemFailures` so only failed items retry. Kafka: commit offsets only after successful processing (or idempotent sink).

#### Observability (CloudWatch, Datadog APM)

Metrics: invocations, errors, duration, concurrent executions. Custom metrics for business validation failure rates. Datadog for APM/logs correlation on order/inventory feeds.

---

**✅ Data Engineering Fundamentals**

### What data engineers own vs analytics / ML / backend

**DE:** reliable pipelines, schemas, quality, platforms (lake/warehouse/stream). **Analytics:** insights, BI models. **ML:** models, training, evaluation. **Backend:** user-facing APIs/transactions. You sit at the intersection — e.g. Airflow ML pipelines + Kafka event validation + OpenSearch serving for rankings.

---

### Batch vs streaming vs micro-batch

| Mode | Latency | Examples |
|---|---|---|
| Batch | minutes–hours | Nightly Redshift extract, Spark ETL |
| Micro-batch | seconds–minutes | Spark Structured Streaming |
| Streaming | sub-second–seconds | Flink, Kafka consumers |

Choose by SLA, cost, and complexity. Recommendations ranking → streaming; daily training set → batch.

---

### OLTP vs OLAP vs lakehouse

**OLTP** — transactional apps (Postgres). **OLAP** — analytical scans (Redshift). **Lakehouse** — cheap S3 storage + table formats (Iceberg) + engine (Spark/Athena) with warehouse-like reliability. Many orgs: OLTP → events/CDC → lake → warehouse/serving.

---

### Data lifecycle (ingest → validate → transform → serve → archive)

Ingest raw → validate contracts → clean/enrich → publish curated tables or online indexes → archive/expire cold data. Skipping validation creates silent garbage at scale.

---

### Medallion / layered architecture (bronze/silver/gold)

- **Bronze:** raw, append-only, source-aligned.  
- **Silver:** cleaned, conformed, deduped.  
- **Gold:** business aggregates / feature tables / marts.  

Enables reprocessing from bronze without re-hitting sources.

---

### Source of truth, CDC, and event sourcing (overview)

**SoT** — system authoritative for an entity. **CDC** — capture DB changes (Debezium → Kafka). **Event sourcing** — store state as event log. Practical: Kafka topics as integration SoT for downstream; OLTP DB remains SoT for transactions.

---

### Exactly-once, at-least-once, at-most-once delivery

- **At-most-once:** may lose data (acks before process).  
- **At-least-once:** may duplicate (default reality).  
- **Exactly-once:** end-to-end requires idempotent sinks + transactional outbox / Flink checkpoints + compatible sinks — hard; often “effectively once” via dedupe.

---

### Idempotency keys & deduplication strategies

Business keys (`order_id` + `event_type` + `version`). Downstream unique constraints, upserts, or stateful keyed dedupe in Flink. Retain dedupe state/windows long enough for retry storms.

---

### Late data, watermarks, and reprocessing

Events arrive out of order. **Watermarks** estimate event-time progress; late events after watermark need side outputs or recompute. Batch **reprocessing** from lake is the safety net.

---

### Backfills & replay

Rerun historical partitions after bugfixes. Design pipelines partitioned by date; Kafka replay from offset/time; Iceberg time travel. Guard prod consumers with separate consumer groups for replay.

---

### Data contracts & schema evolution

Producers and consumers agree on schema (Avro/Protobuf/JSON Schema + Registry). Evolution rules: add optional fields safely; avoid renaming/removing without versioning. Breaking changes → new topic version or compatible expansion.

---

### Data quality (completeness, accuracy, freshness, uniqueness)

Checks: null rates, referential integrity, duplicate rates, row-count anomalies, watermark lag. Fail or quarantine bad partitions; alert on freshness SLO breaches.

---

### SLAs / SLOs for pipelines (freshness, completeness)

**SLA** — external promise; **SLO** — internal target (e.g. “silver orders available by 06:00 with ≥99% completeness”). Measure lag, success rate, and data volume vs baseline.

---

### Cost awareness (scan bytes, shuffle, storage tiers)

Athena/Spectrum charge by data scanned → partition + columnar + predicate pushdown. Spark shuffle = network/disk cost. S3 tiers (Standard → IA → Glacier). Idle EMR clusters waste money — autoscaling / ephemeral clusters.

---

### Orchestration vs compute vs storage vs catalog (separation of concerns)

| Layer | Examples |
|---|---|
| Orchestration | Airflow |
| Compute | Spark, Flink, Lambda, EMR, Glue Jobs |
| Storage | S3, Kafka log, Postgres |
| Catalog | Glue Data Catalog, Iceberg catalogs |

Don’t overload Airflow as a compute engine — orchestrate, don’t transform heavy data inside the worker unless small.

---

**✅ Storage Formats & Table Formats**

### Row vs columnar storage

Row (CSV, typical OLTP heaps): good for whole-record OLTP. Columnar (Parquet): great for analytics reading few columns over many rows — less I/O, better compression.

---

### CSV / JSON / Avro / Protobuf / Parquet / ORC comparison

| Format | Strength |
|---|---|
| CSV | Human-readable; poor types/perf |
| JSON | Flexible; verbose |
| Avro | Row binary + schema; good for Kafka |
| Protobuf | Compact RPC/events |
| Parquet | Analytics columnar |
| ORC | Similar niche (Hive ecosystem) |

Streaming events often Avro/JSON; lake analytics Parquet.

---

### Parquet internals (row groups, predicate pushdown, compression)

Data in **row groups** with column chunks + min/max stats → engines **skip** irrelevant groups (**predicate pushdown**). Snappy/ZSTD compression. Larger row groups help scans; too large hurts memory.

---

### Partitioning strategies (time, high-cardinality pitfalls)

Partition by `date`/`hour` commonly. **High-cardinality** partition keys (user_id) → millions of tiny partitions — nightmare. Prefer partition coarseness + Iceberg hidden partitioning / clustering.

---

### Compaction & small-files problem

Many tiny files destroy performance (S3 LIST + open costs). Compact to target sizes (e.g. 128–512MB). Streaming sinks need periodic compaction jobs.

---

### Apache Iceberg

#### Table format goals (ACID on the lake, time travel, snapshots)

Iceberg tracks table state as **snapshots** of manifests/data files — atomic commits, concurrent readers/writers, **time travel** to prior snapshots, rollback.

#### Hidden partitioning

Physical layout decoupled from user queries — avoid partition column explosion in SQL; evolution without rewriting all paths manually.

#### Schema evolution & partition evolution

Add/drop/rename columns safely with metadata; partition specs can evolve without full table rewrite in many cases.

#### Catalogs (Glue / Hive / REST catalog concepts)

Catalog stores table metadata pointers. **Glue Catalog** common on AWS; Hive metastore; REST catalog for multi-engine.

#### Iceberg vs Hive tables vs Delta/Hudi (high-level comparison)

Hive tables: directory partitions, weaker ACID. **Delta Lake** / **Hudi** / **Iceberg** — modern lakehouse formats with different ecosystems; Iceberg strong in multi-engine AWS/open source; know they solve similar problems.

---

### AWS Glue Data Catalog

#### Databases, tables, partitions

Metastore: DB → tables → partition metadata pointing at S3 locations/schemas. Shared by Athena, Spark, Redshift Spectrum.

#### Crawlers vs explicit DDL

Crawlers infer schema — convenient but can drift/misfire. Prefer **explicit** table DDL/migrations for production contracts; crawl sandboxes or unknown dumps.

#### Integration with Athena, Spark, Iceberg

Same catalog entries power Athena SQL, Glue/EMR Spark jobs, Iceberg tables registered in Glue.

---

### S3 as data lake storage

#### Prefix design, lifecycle policies

`s3://bucket/bronze/orders/date=.../`. Lifecycle: expire temp, transition cold to IA/Glacier. Avoid unbounded listing of huge flat prefixes.

#### Consistency model implications

S3 is strongly consistent for new objects (as of 2020). Still design for eventual consumers and listing-heavy patterns carefully; prefer catalogs over raw LIST as SoT.

#### Encryption & bucket policies

SSE-S3/SSE-KMS; bucket policies + IAM least privilege; block public access; separate prod/raw buckets.

---

**✅ Amazon S3, Redshift, Athena, EMR (AWS Analytics)**

### S3 data lake patterns used in ML/feature pipelines

Land clickstream/features as Parquet under versioned prefixes; register in Glue; train reads training-set snapshot; write model artifacts to `s3://.../models/`. Immutable dated outputs enable reproducible training.

---

### Amazon Redshift

#### Columnar warehouse architecture

MPP columnar warehouse for analytics — compress columns, parallel slices across nodes.

#### Distribution styles & sort keys

**DISTSTYLE** KEY/ALL/EVEN — colocates joins. **SORTKEY** speeds range filters. Wrong dist → redistribution cost.

#### WLM / concurrency (conceptual)

Workload management queues isolate ETL vs ad-hoc so heavy queries don’t starve SLAs.

#### Unload/copy to/from S3

`UNLOAD` to Parquet/CSV on S3 for lake/ML; `COPY` from S3 into Redshift. Core bridge in your Airflow extracts.

#### Redshift Spectrum / lake queries (overview)

Query S3 via external tables (Glue Catalog) without loading — trade latency/cost vs native tables.

#### Clickstream extraction patterns (as on CV)

Scheduled SQL unload of clickstream slices → S3 → training pipeline. Partition extracts by event_date; validate row counts; avoid full-table dumps.

---

### Amazon Athena

#### Serverless SQL on S3 + Glue Catalog

Presto/Trino-based; pay per data scanned. Great for ad-hoc and light ETL (CTAS).

#### Partition projection

Infer partitions without catalog thrash for time grids — faster, cheaper metadata.

#### Cost model (bytes scanned)

Column pruning + partition filters + Parquet = lower cost. `SELECT *` is expensive.

#### CTAS / UNLOAD patterns

`CREATE TABLE AS SELECT` writes curated datasets back to S3; use for gold marts without a cluster.

---

### Amazon EMR

#### EMR architecture (primary/core/task nodes)

**Primary** (master): coordination. **Core:** HDFS + compute. **Task:** compute-only (often Spot). YARN manages resources.

#### EMR on EC2 vs EMR Serverless (overview)

EC2: control cluster sizing/config. Serverless: less ops, auto resources — good for spiky Spark.

#### Cluster lifecycle, bootstrap actions

Ephemeral clusters per job vs long-running. Bootstrap installs libs; bake AMIs/images when possible for speed.

#### Spot vs on-demand for cost

Task nodes on Spot save money; handle interruption (speculation, checkpointing). Keep critical masters on-demand.

#### Running Spark / Flink / Hive on EMR

Submit steps via console/API/Airflow operators. Match EMR release versions to engine versions carefully.

#### Storage: HDFS vs S3 (EMRFS)

Prefer **S3** as durable SoT; HDFS ephemeral with cluster. EMRFS connects Spark to S3.

#### Logging, debugging failed steps

Yarn logs to S3; Spark History Server; step failure codes. Capture `spark.listen` UI metrics for skew/spill.

---

### EC2 for training / job runners (IAM roles, sizing, ephemeral disks)

Instance profile IAM for S3/Glue access. Size GPU/CPU for training; use instance store/SSD for scratch; shut down via Airflow to save cost.

---

### Glue Jobs vs EMR vs Lambda — when to choose which

| Option | When |
|---|---|
| Lambda | Short, event-driven, low fan-in CPU |
| Glue Job | Managed Spark ETL, serverless-ish, catalog-native |
| EMR | Custom engines (Flink), heavy control, long-running/streaming clusters |

---

### End-to-end example: Redshift → Airflow → EC2 train → Parquet → S3/Glue → Athena/Spark

1. Airflow DAG triggers Redshift `UNLOAD` of clickstream.  
2. Validate file arrival/counts on S3.  
3. Start EC2 training; read features; write model + feature Parquet.  
4. Register/update Glue tables.  
5. Downstream Athena/Spark consume gold features; online path may index rankings in OpenSearch separately.

---

**✅ AWS Glue (ETL, Catalog, Jobs)**

### Glue Data Catalog as Hive-compatible metastore

Central schema registry for lake tables — engines share definitions. Treat it as production metadata requiring change control.

---

### Glue Crawlers (pros/cons)

**Pros:** quick discovery. **Cons:** wrong types, noisy partitions, surprise schema changes. Production: curated DDL + CI.

---

### Glue ETL Jobs (Spark-based)

Managed Spark with Glue APIs; scripts in S3; workers billed DPU-hours. Good default AWS batch ETL.

---

### Glue Job Bookmarks

Track processed data for incremental jobs — avoid full re-reads. Understand bookmark state reset when logic changes.

---

### Glue Interactive Sessions / Notebooks (overview)

Interactive Spark for development — not a substitute for versioned job code in prod.

---

### DynamicFrames vs DataFrames

**DynamicFrame** — Glue abstraction with schema flexibility/`ApplyMapping`/`ResolveChoice`. Convert to Spark DataFrame for full Spark SQL power when schema is stable.

---

### Glue + Iceberg / Hudi integrations (conceptual)

Glue supports modern table formats so commits/time travel work with catalog. Prefer Iceberg for multi-engine lakehouse on AWS when adopting formats.

---

### IAM permissions for lake access

Job role: S3 read/write prefixes, `glue:Get*`/`Update*`, KMS decrypt, optionally Redshift. Least privilege per environment.

---

### Incremental processing patterns

Partition by date; bookmarks; watermark tables; Iceberg snapshot incremental reads. Always plan backfill path.

---

### Monitoring Glue jobs (CloudWatch metrics, logs)

Track DPU hours, failed runs, data skew via Spark UI logs. Alert on duration SLO and failure rate.

---

**✅ Apache Airflow**

### Why orchestrators exist (vs cron)

Cron can’t express dependencies, retries, backfills, observability, or SLAs across fleets of jobs. Airflow is a **workflow OS** for batch/ML pipelines.

---

### Airflow architecture

#### Scheduler

Parses DAGs, creates tasks, prioritizes what runs next.

#### Executor types (Local, Celery, Kubernetes, Sequential)

| Executor | Use |
|---|---|
| Sequential | Dev only |
| Local | Small single-node |
| Celery | Distributed workers + broker |
| Kubernetes | Pod-per-task isolation |

#### Metadata DB

Stores DAG runs, task instances, connections — must be HA in prod (RDS).

#### Webserver

UI for graphs, logs, clearing tasks, manual triggers.

#### Workers / triggerer (deferrable ops overview)

Workers execute tasks. **Triggerer** handles deferrable sensors asynchronously (less worker slot waste).

---

### DAG design principles

#### Idempotent tasks

Re-running a task for the same data interval must be safe (overwrite partition, upsert).

#### Small tasks vs fat tasks

Tasks = units of retry/visibility. Too small → overhead; too fat → hard failures. Prefer “extract,” “validate,” “train,” “publish” stages.

#### Explicit dependencies

`task1 >> task2` or TaskFlow returns — clear graph beats hidden coupling.

#### Avoiding giant monolith DAGs

Split by domain; use `TriggerDagRunOperator` / Datasets; share libraries not mega-DAGs.

---

### Operators & sensors (PythonOperator, BashOperator, SqlSensor, ExternalTaskSensor, S3 sensors)

Operators perform work; sensors wait for conditions (file exists, SQL predicate, upstream DAG). Prefer deferrable sensors in modern Airflow. Use provider operators (AWS, Spark) when available.

---

### TaskFlow API (`@task`)

Decorators turn Python functions into tasks with cleaner XCom passing — still keep payloads small.

---

### XComs (what to pass / what not to pass)

Pass tiny metadata (S3 paths, row counts, run IDs). Never pass large dataframes — write to S3 and pass the URI.

---

### Variables, Connections, Secrets backends

Connections hold credentials (hook-friendly). Variables for light config. Production: **Secrets Backend** (AWS Secrets Manager) — not stored plaintext in metadata DB.

---

### Pools, queues, priority weights

Pools limit concurrency (e.g. max 2 Redshift unloads). Queues route to worker classes. Priority weights order contention.

---

### Scheduling

#### `schedule_interval` / timetable

Cron or presets (`@daily`). Timetables for custom business calendars.

#### Catchup & backfill

Catchup auto-schedules historical intervals — disable if dangerous. Backfill deliberately for repairs.

#### Data interval vs execution date (Airflow 2 mental model)

A run covers a **data interval** (e.g. yesterday 00:00–today 00:00). Use interval start/end for partition logic, not “execution date” confusion from Airflow 1 naming.

---

### Retries, SLA misses, alerting

Retries with delay; email/Slack/Pager on failure; SLA miss callbacks when tasks exceed expected runtime. Clear distinction: task failure vs data late.

---

### Branching, TriggerDagRun, Datasets / data-aware scheduling (Airflow 2.4+)

BranchPythonOperator for conditional paths. Trigger downstream DAGs. **Datasets** schedule when upstream updates data assets — better than time-only coupling.

---

### Testing DAGs (dagbag import, unit-testing operators)

CI must import DAG bag without error. Unit-test pure Python callables; integration-test with docker-compose Airflow carefully.

---

### MWAA vs self-managed Airflow (overview)

**MWAA** — managed Airflow on AWS (less ops). Self-managed — more control/version flexibility, more toil. Same DAG skills transfer.

---

### Production patterns from CV

#### Extract from Redshift

Task runs unload SQL for clickstream partition; verifies S3 objects + counts.

#### Trigger training on EC2

Start instance / SSM / API to train; wait sensor for completion artifact.

#### Write Parquet to S3 + Glue catalog registration

Trainer or publish task writes Parquet; updates Glue partitions/table.

#### Failure handling & observability

Retries on transient AWS errors; alerts to Datadog/Slack; dashboards for DAG success and data freshness.

---

**✅ Apache Spark**

### Spark vs MapReduce (why Spark won for many ETL workloads)

In-memory DAG execution, richer APIs (SQL/DataFrame), iterative ML — less HDFS thrash than classic MapReduce.

---

### Spark Architecture

#### Driver, executors, cluster manager

**Driver** runs your app / query planner. **Executors** run tasks. Cluster manager (YARN/K8s/standalone) allocates resources.

#### Jobs → Stages → Tasks

Action triggers a **job**; shuffle boundaries split **stages**; **tasks** run per partition.

#### DAG scheduler & shuffle

Scheduler pipelines narrow transforms; **shuffle** redistributes by key — expensive.

---

### RDDs vs DataFrames vs Datasets

RDDs — low-level. **DataFrames** — structured + Catalyst optimizations (preferred). Datasets — typed (Scala/Java). PySpark: DataFrames dominate.

---

### Spark SQL & Catalyst optimizer

Logical → optimized → physical plans (predicate pushdown, projection pruning, join selection).

---

### Lazy evaluation & actions vs transformations

Transforms build a plan; **actions** (`count`, `write`) execute. Enables whole-stage optimization.

---

### Narrow vs wide transformations

Narrow (map, filter) — no shuffle. Wide (groupBy, join) — shuffle. Minimize wide ops.

---

### Partitions, repartition vs coalesce

Parallelism ≈ partitions. `repartition` increases/decreases with shuffle; `coalesce` reduces without full shuffle. Too few → underutilize; too many tiny tasks → overhead.

---

### Shuffle, skew, and mitigation (salting, AQE)

Skewed keys overload few tasks. Mitigate: salting keys, adaptive skew join handling, pre-aggregate, filter early.

---

### Caching / persistence levels

Cache reused DataFrames; don’t cache everything. Memory-only vs memory-and-disk.

---

### Broadcast joins vs sort-merge joins

Broadcast small dimension to all executors — avoids shuffle. Large-large → sort-merge.

---

### Adaptive Query Execution (AQE)

Runtime re-optimization: coalesce shuffle partitions, switch join strategies, handle skew — enable in modern Spark.

---

### Reading/writing Parquet/Iceberg/JSON

Prefer Parquet/Iceberg; push filters; avoid wide JSON. Partition writes carefully; coalesce before write to fight small files.

---

### Structured Streaming overview (micro-batch)

Continuous processing as timed micro-batches; checkpoints for recovery; triggers control latency vs cost. For harder event-time state, Flink may fit better.

---

### Spark on EMR / Glue

Same API; submit differently. Watch versions, Iceberg packages, IAM for S3.

---

### PySpark vs Scala (tradeoffs)

PySpark: faster to write, great for DE; UDF Python can be slow — use built-in functions. Scala: tighter JVM performance for custom libs.

---

### Debugging: Spark UI, stage metrics, spill to disk

Look for long stragglers, shuffle read/write sizes, **spill** (memory pressure), GC time, input vs output rows for filtering bugs.

---

### Common performance checklist

Filter early; select needed columns; broadcast small tables; fix skew; AQE on; Parquet + partition prune; right-size executors; avoid Python UDFs; compact outputs.

---

### Checkpointing & fault tolerance

Streaming checkpoints store offsets/state. Lineage recomputes RDD/DataFrame partitions on failure; checkpoint cuts lineage for long iterative jobs.

---

**✅ Apache Kafka**

### Events vs messages vs streams

**Message** — unit of delivery. **Event** — fact that happened (`OrderPlaced`). **Stream** — unbounded sequence of events. Design events as immutable facts for integration.

---

### Kafka architecture

#### Brokers, topics, partitions, replicas

Topic split into **partitions** (parallelism + ordering unit). Replicas for durability. Brokers store logs.

#### Leaders / ISR

Each partition has a leader; **ISR** = in-sync replicas. Produce/consume against leader.

#### Controllers (KRaft vs ZooKeeper era — conceptual)

Cluster metadata coordination. Modern Kafka moves to **KRaft** (no ZK). Know both exist historically.

---

### Producers

#### Acks (`0/1/all`)

`all` + min ISR → strongest durability. `0`/`1` faster but risk loss.

#### Keys & partition assignment

Same key → same partition → per-key ordering. Null key → sticky/round-robin.

#### Idempotent producer

Producer IDs + seq numbers prevent dupe writes on retries (`enable.idempotence=true`).

#### Compression, batching, linger

Batch records; `linger.ms` trades latency for throughput; snappy/lz4/zstd compression.

---

### Consumers

#### Consumer groups

Group shares topic partitions — each partition owned by one consumer in the group. Scale consumers ≤ partitions.

#### Offsets & commit strategies

Offset = position. Auto-commit vs manual after processing. Commit-too-early → loss; too-late → duplicates.

#### Rebalancing

Membership changes pause processing — minimize with cooperative assignors and shorter processing.

#### Cooperative sticky assignor (overview)

Incremental rebalances reduce “stop the world” partition revocation vs classic eager protocol.

---

### Delivery semantics & idempotent consumers

Kafka commonly gives **at-least-once** to apps. Achieving exactly-once effects needs idempotent sinks / transactions. Your Lambda validators must tolerate duplicates.

---

### Ordering guarantees (per partition)

Only within a partition. Global order requires single partition (scalability tradeoff).

---

### Log retention & compaction

Time/size retention deletes old segments. **Compaction** keeps latest value per key — good for changelog topics (entity state).

---

### Schema Registry / Avro / Protobuf (contract evolution)

Central schemas; compatibility modes (BACKWARD/FORWARD/FULL). Prevents poison messages from undeclared fields.

---

### Dead letter topics / retry topics

Failed records → retry topic with delay → DLQ for human inspection. Preserve headers/trace IDs.

---

### Kafka Connect (overview)

Managed connectors source/sink (DB, S3) without custom consumers — great for CDC landing.

---

### Kafka Streams vs external processors (Flink)

**Kafka Streams** — library inside app, Kafka-centric. **Flink** — independent cluster, richer event-time/state for complex streaming (your ranking path).

---

### Security (SASL, TLS, ACLs) overview

Encrypt in transit; authenticate clients; ACLs per topic. MSK IAM auth common on AWS.

---

### Ops: lag monitoring, under-replicated partitions

**Consumer lag** = freshness KPI. Under-replicated partitions = durability risk. Alert both.

---

### AWS patterns: self-managed vs MSK vs MSK Serverless

MSK managed brokers; Serverless for variable load; self-managed on EC2/K8s for exotic needs. Prefer managed unless constraints require otherwise.

---

### Kafka CV patterns

#### Lambda + Kafka validate/process/route order & inventory feeds

Consume batches → schema/business validation → route valid events to sinks / forward topics; reject to DLQ; metrics on fail rates.

#### High-volume event-driven design

Partition for parallelism; keep handlers idempotent; backpressure via lag alerts + scaling; separate topics by domain (orders vs inventory).

---

**✅ Apache Flink**

### Why Flink for real-time (true streaming vs micro-batch)

Flink processes continuous streams with sophisticated **event-time** and **keyed state** — better for low-latency ranking/enrichment than overnight batch. Spark micro-batches can work but Flink often wins true streaming SLAs.

---

### Flink Architecture

#### JobManager / TaskManagers

JobManager coordinates; TaskManagers execute operators with slots.

#### Parallelism, slots, chaining

Parallelism sets operator copies. Chaining fuses operators to cut serialization overhead.

#### Managed state (keyed state)

Per-key state (ValueState, MapState) fault-tolerant via checkpoints — foundation for dedupe, sessions, rankings buffers.

---

### DataStream API vs Table/SQL API

DataStream — explicit operators. Table/SQL — relational on streams/tables; unify batch/stream conceptually. Many jobs mix both.

---

### Event time vs processing time

**Event time** — when it happened at source. **Processing time** — wall clock at operator. Correct analytics use event time + watermarks.

---

### Watermarks & late events

Watermarks declare “unlikely to see events earlier than T.” Late events can be dropped, side-outputted, or update results depending on allowed lateness.

---

### Windows (tumbling, sliding, session)

Tumbling — fixed non-overlap. Sliding — overlap. Session — gap-based. Used for aggregates over time; ranking pipelines may instead maintain keyed latest state.

---

### Checkpointing & savepoints

Periodic **checkpoints** for fault recovery. **Savepoints** — operator-triggered consistent snapshot for version upgrades/redeploys.

---

### Exactly-once sinks (two-phase commit conceptual)

With checkpoints + transactional sinks (Kafka transactional / two-phase), Flink can provide end-to-end exactly-once into compatible systems. OpenSearch sinks often idempotent upserts (at-least-once + upsert).

---

### RocksDB state backend

Local RocksDB stores large keyed state on disk with checkpoint upload to S3/HDFS — scales beyond JVM heap.

---

### Connectors (Kafka, OpenSearch/Elasticsearch, S3, JDBC)

Source Kafka orders/products; sink OpenSearch for low-latency queries; S3 for audit/lake; JDBC for enrichment cautiously (async/cached).

---

### Backpressure

Slow operators propagate pressure upstream — protects memory. Fix slow sinks, under-parallelism, or external dependency latency.

---

### Flink on EMR / Kinesis Data Analytics / self-managed (overview)

EMR can run Flink; KDA/Managed Flink on AWS reduces ops; self-managed on K8s for control. Pick based on team ops maturity.

---

### Flink vs Spark Structured Streaming vs Kafka Streams

| Engine | Strength |
|---|---|
| Flink | Event-time, large state, low latency |
| Spark SS | Unified batch/stream in Spark shops |
| Kafka Streams | Lightweight, Kafka-native apps |

---

### Flink CV patterns

#### Real-time order/product capture

Ingest streams; enrich/normalize; maintain timely state for downstream ranking.

#### Product ranking pipeline into OpenSearch

Compute ranking features/scores; upsert documents so API queries stay fast.

#### Latency reduction for customer-product embeddings queries

Precompute/index embeddings or ranking signals in OpenSearch instead of heavy online joins — trade freshness for query latency.

---

**✅ Search & Serving Layer (OpenSearch)**

### Search vs OLTP vs warehouse

OLTP — point reads/writes transactional. Warehouse — large scans/aggregations. **Search** — inverted index relevance, filters, low-latency secondary query patterns (products, rankings).

---

### Inverted index basics

Term → postings list of docs. Enables fast text/filter retrieval unlike full table scans.

---

### Mappings, analyzers, tokenization

Explicit mappings beat dynamic surprises. Analyzers tokenize/normalize text. Wrong mapping types (text vs keyword) break aggregations/sorting.

---

### Document modeling for products / rankings

Denormalize what queries need (product attrs + scores). Document ID = stable business key for upserts from Flink.

---

### Indexing pipelines from Flink/Spark/Kafka

Stream upserts for freshness; batch reindex for rebuilds. Control bulk size and retries.

---

### Queries vs aggregations

Queries find docs; aggregations bucket/metric analytics. Deep aggregations expensive — use carefully.

---

### Relevance / ranking / function_score (conceptual)

BM25 text relevance + **function_score** / rank features for business signals (popularity, personalization score). Your pipeline may write the score field Flink computed.

---

### Refresh interval vs near-real-time search

Docs searchable after refresh (default ~1s). Increase refresh interval for heavier indexing throughput if SLA allows.

---

### Shards, replicas, capacity planning basics

Shards parallelize; replicas for HA/read scale. Too many small shards hurts. Size by data volume + query load.

---

### Alias / blue-green reindex patterns

Write alias / read alias swap for zero-downtime reindex when mappings change.

---

### Pitfalls (mapping explosion, deep pagination, hot shards)

Unbounded field names → cluster blowups. `from+size` deep pages slow — use `search_after`. Hot keys skew shards.

---

### OpenSearch vs Elasticsearch vs relational LIKE/ILIKE

OpenSearch ≈ AWS-friendly ES fork lineage. `LIKE %foo%` can’t use normal B-tree well — search engines exist for this class of problem + relevance.

---

### Observability for search latency & error rates

p95 latency, indexing rate, rejected/bulk failures, JVM/heap, query error rates — Grafana/Datadog.

---

**✅ ML / Feature Pipeline Topics (as on CV)**

### Training vs inference data paths

**Training:** historical batch features/labels from warehouse/lake. **Inference/ranking:** low-latency online path (API + OpenSearch/precomputed scores). Keep schemas aligned to avoid train/serve skew.

---

### Feature stores (conceptual) vs S3/Glue tables as feature landing

Feature stores manage definitions, point-in-time joins, online/offline sync. Many teams start with **versioned Parquet on S3 + Glue** as pragmatic offline store.

---

### Offline features (Parquet) vs online features (OpenSearch/Dynamo/Redis)

Offline — high-dimensional historical. Online — low-latency keyed lookup. Materialize training from offline; publish subset online for serving.

---

### Clickstream → warehouse → training set construction

Clickstream in Redshift → unload → join/label → Parquet training set. Time-aware joins essential.

---

### Model artifact storage on S3

Version artifacts (`s3://.../model/yyyy/mm/dd/...`); immutable; pointer in metadata DB for “current prod.”

---

### Orchestrating train jobs (Airflow → EC2)

DAG gates on data readiness → launch training → validate metrics → publish artifacts → optional index refresh.

---

### Batch scoring vs real-time ranking

Batch score nightly into tables/indexes; real-time ranking computes/updates continuously (Flink). Hybrid common.

---

### Data leakage & time-travel correctness (high level)

Features must only use information available at prediction time. Point-in-time correct joins; no “future” clicks in training rows.

---

### Monitoring data drift / pipeline freshness (practical DE view)

Alert on feature table freshness, null spikes, distribution shifts in key features, training job failures — DE owns pipeline health even if DS owns model quality.

---

**✅ Docker**

### Images, containers, registries

Image = immutable template; container = running instance; registry (ECR/Docker Hub) stores images. Tag by git SHA for traceability.

---

### Dockerfile best practices

#### Multi-stage builds

Build in fat stage; copy artifacts to slim runtime image — smaller, safer prod images.

#### Layer caching

Order Dockerfile from least to most frequently changing; dependency install before code copy.

#### Non-root users

Drop privileges in final image.

#### `.dockerignore`

Exclude `.git`, venvs, tests data — faster builds, smaller context.

---

### EntryPoint vs CMD

`ENTRYPOINT` — fixed executable; `CMD` — default args (overridable). Combine cleanly for job containers.

---

### Volumes & bind mounts

Persist data or mount configs; avoid storing critical state only in container writable layer.

---

### Networking (bridge, host, overlay conceptual)

Bridge for single-host compose; overlay for Swarm/K8s-like multi-host. K8s has its own CNI model.

---

### Environment config & secrets (what not to bake in)

Inject env at runtime; secrets via orchestrator/secret store — never `ENV PASSWORD=` in image layers.

---

### Healthchecks

Container-level checks complement K8s probes; useful in Compose.

---

### docker compose for local data stacks (Kafka/Postgres/etc.)

Local Kafka + Zookeeper/KRaft, Postgres, LocalStack — faster DE inner loops.

---

### Image scanning & SBOM overview

Scan CVEs in CI; Software Bill of Materials for supply-chain visibility.

---

### Running Spark/Flink/Airflow components in containers

Standard deploys today; match CPU/memory; careful with native libs. Official images as base when possible.

---

### Resource limits (CPU/memory)

Prevent noisy neighbors; align with Spark executor configs.

---

### Debugging containers (exec, logs, ephemeral debug)

`docker logs`, `exec` into shell, ephemeral debug containers with same network/volume — don’t SSH into prod casually without policy.

---

**✅ Kubernetes**

### Why orchestration (vs Docker alone)

Docker runs one container; K8s schedules replicas, heals, rolling updates, service discovery, secrets, horizontal scale across a cluster.

---

### Cluster architecture

#### Control plane (API server, etcd, scheduler, controller manager)

API is source of desired state; etcd stores it; scheduler places pods; controllers reconcile actual → desired.

#### Worker nodes (kubelet, kube-proxy, container runtime)

Kubelet runs pods; kube-proxy implements Services; runtime (containerd) pulls/runs images.

---

### Core objects

#### Pod

Smallest unit — one or more containers sharing network/storage.

#### Deployment / ReplicaSet

Declarative replica management + rolling updates for stateless apps.

#### StatefulSet

Stable identities/storage for Kafka/ZK-like workloads (careful ops).

#### DaemonSet

One pod per node (log agents, node exporters).

#### Job / CronJob

Run-to-completion batch; CronJob schedules Jobs — useful for compactors/reports.

#### Service (ClusterIP, NodePort, LoadBalancer)

Stable virtual IP/DNS to pods. ClusterIP internal; LB external via cloud.

#### Ingress / Gateway API (overview)

HTTP routing/TLS at edge into Services. Gateway API is newer evolution.

#### ConfigMap & Secret

Config vs sensitive data mounted as env/files. Still encrypt Secrets at rest properly (KMS providers).

#### PersistentVolume / PVC / StorageClass

Abstract durable disks for stateful workloads.

---

### Labels, selectors, annotations

Labels for selection (Service → Pods); annotations for non-identifying metadata (build IDs).

---

### Probes (liveness, readiness, startup)

**Liveness** — restart unhealthy. **Readiness** — remove from Service until ready. **Startup** — slow-starting apps. Misconfigured probes cause flapping.

---

### Rolling updates, rollbacks, blue/green & canary (patterns)

Deployment rolling update default; rollback via revision history. Blue/green & canary via dual Deployments + traffic split (service mesh/Ingress).

---

### Resource requests/limits & QoS

Requests for scheduling; limits for hard caps. Set both for predictable bin-packing.

---

### Horizontal Pod Autoscaler (HPA)

Scale replicas on CPU/custom metrics (lag, QPS). Need Metrics Server / adapters.

---

### Namespaces & RBAC basics

Namespaces isolate envs/teams; Role/RoleBinding least-privilege for humans/service accounts.

---

### NetworkPolicies (overview)

Pod-level firewall — default deny + allow needed paths in secure clusters.

---

### Helm charts (overview)

Package K8s YAML templates — versioned releases for Airflow/Spark operators apps.

---

### Sidecars & init containers

Init runs before app (migrations, waits). Sidecar alongside (proxy, log shipper).

---

### Jobs for batch/Spark-on-K8s / Airflow KubernetesExecutor (conceptual)

Each Airflow task can be a Pod — isolation + elasticity. Spark-on-K8s schedules executors as pods.

---

### Observability on K8s (metrics, logs, events)

Cluster metrics; app RED metrics; centralized logs; `kubectl describe` events for scheduling failures.

---

### Local tools (minikube, kind, k9s) — optional

kind/minikube for local clusters; k9s for terminal UI.

---

### Production concerns (pod disruption budgets, topology spread)

PDBs limit concurrent voluntary disruptions. Topology spread across AZs for HA.

---

**✅ CI/CD & DevOps Tooling (Jenkins, Git, Observability)**

### Git branching strategies for services & infra

Trunk-based + short PRs preferred for services; GitFlow sometimes for release-heavy. Infra repos: plan/apply discipline; never commit secrets.

---

### Jenkins pipelines (declarative vs scripted overview)

#### Stages: lint, test, build, image, deploy

Quality gates before artifact; deploy only green builds.

#### Credentials & shared libraries

Credentials binding; shared libraries for reusable pipeline code — version carefully.

#### Multibranch pipelines

Auto jobs per branch/PR — CI on every change.

---

### Artifact versioning & immutability

Tag images `app:gitsha`; never mutate `latest` in prod. Promote same artifact through envs.

---

### Deploy strategies (rolling, blue/green, canary)

Rolling — gradual. Blue/green — instant switch + quick rollback. Canary — small % traffic. Data jobs: dual-run / shadow topics before cutover.

---

### Infrastructure as Code overview (Terraform/CloudFormation — awareness)

Declarative AWS resources; PRs for infra changes; state locking. Know concept even if platform team owns most modules.

---

### 12-factor config

Config via env; backing services as attachments; disposable processes — fits K8s/Lambda.

---

### Secrets management patterns

AWS Secrets Manager / SSM Parameter Store; rotate; inject at runtime; audit access.

---

### Observability triad

#### Metrics (Grafana, CloudWatch, Datadog)

Lag, duration, error rate, throughput. Grafana dashboards for offers/orders; CloudWatch native AWS; Datadog unified.

#### Logs (Datadog, CloudWatch Logs)

Structured searchable logs for RCA. Retention & PII policies.

#### Traces (conceptual OpenTelemetry)

Follow a request/event across services; sampling for high-volume streams.

---

### Alerting & on-call hygiene (SLO, noise reduction)

Alert on symptoms (SLO burn, lag) not every CPU blip. Runbooks linked in alerts. Page sparingly.

---

### Dashboard design for offers/orders (CV-style operational views)

Golden signals: publish rate, success %, latency, lag, downstream OpenSearch errors. Separate business KPIs vs infra KPIs.

---

### Runbooks & incident response basics

DETECT → CONTAIN → DIAGNOSE → FIX → PREVENT. Document Kafka lag spikes, DAG failures, Flink checkpoint fails.

---

**✅ Microservices Architecture**

### Monolith vs modular monolith vs microservices

Start modular monolith if team/domain small; split when independent scale/release ownership justifies distributed cost. Personalization platforms often hybrid: core services + event backbone.

---

### Service boundaries (DDD-lite: bounded contexts)

Split by domain (offers, orders, recommendations, identity) — not by technical layers alone. Avoid distributed monolith (chatty sync coupling).

---

### Communication styles

#### Synchronous REST/gRPC

Simple request/response; coupling & failure propagation risks.

#### Asynchronous events (Kafka)

Decouple producers/consumers; buffer spikes; enable multiple independent consumers.

#### Request/response vs pub/sub vs stream processing

RPC for user waits; pub/sub for fan-out facts; stream processing for continuous derived state (Flink).

---

### API Gateway

#### Routing, auth termination, rate limiting, aggregation

Single edge entry: TLS, authN, routing to services, throttle abuse, sometimes aggregate.

#### Gateway vs BFF (Backend-for-Frontend)

Gateway — shared edge. **BFF** — UI-specific backend (Persoverse) shaping payloads for one client — reduces chatty UI→N services.

#### AWS API Gateway / Spring Cloud Gateway / Kong (conceptual map)

Same role, different ecosystems. Lambda often behind API Gateway; Spring Cloud Gateway in JVM meshes; Kong/Nginx gateway products.

---

### Service discovery

#### Client-side vs server-side discovery

Client chooses instance (Eureka) vs LB/DNS chooses (K8s Service, AWS LB/Cloud Map).

#### DNS, Eureka/Consul, Kubernetes Services as discovery

K8s DNS `svc.namespace` is discovery. Consul/Eureka in classic Spring Cloud. Prefer platform-native where possible.

---

### Load balancing (L4/L7, client-side)

L4 TCP; L7 HTTP path/host. Client-side LB in service meshes. For consumers, partition assignment is the “LB.”

---

### Configuration & secret distribution

Central config (Spring Cloud Config, env from K8s) with refresh strategies; never bake secrets into images.

---

### Resilience patterns

#### Timeouts, retries, backoff, jitter

Always timeout. Retry only idempotent ops; exponential backoff + jitter to avoid storms.

#### Circuit breaker (Resilience4j)

Open circuit when dependency unhealthy — fail fast + fallback.

#### Bulkhead

Isolate thread pools/connections so one dependency can’t exhaust the whole service.

#### Rate limiting

Protect yourself and downstream (gateway + app limits).

---

### Distributed transactions

#### 2PC (why avoided)

Locks & availability issues across services — rarely used at web scale.

#### Saga (choreography vs orchestration)

Sequence of local transactions with compensations. Choreography = events; orchestration = coordinator.

#### Outbox pattern

Write state + outbox event atomically in service DB; publisher relays to Kafka — avoids lost events.

#### Idempotent consumers

Required for at-least-once. Upserts keyed by event ID.

---

### Consistency models (strong vs eventual)

User checkout may need strong consistency; recommendation ranking often **eventual** — say it explicitly in designs.

---

### Data per service & shared DB anti-pattern

Each service owns its schema. Sharing DBs couples deployments and schemas — anti-pattern except transitional periods.

---

### Contract testing & versioning APIs

Consumer-driven contracts; version URIs/headers; expand/contract schema changes.

---

### Security between services (mTLS, IAM, JWT propagation)

mTLS/service mesh; AWS IAM for Lambda-to-AWS; propagate end-user JWT/claims carefully to BFFs/services; authorize at each sensitive boundary.

---

### Observability in distributed systems (correlation IDs, RED metrics)

Pass `X-Correlation-Id` / trace context. **RED:** Rate, Errors, Duration per service.

---

### Serverless microservices (Lambda + events) tradeoffs

(+) ops light, scale to zero, event glue. (−) timeouts, cold starts, local testing, distributed sprawl. Great for validation/routing; less for long Flink-like state.

---

### When NOT to use microservices

Small team, unclear domains, low scale, early product — prefer modular monolith + good boundaries. Complexity tax is real.

---

**✅ System Design (Interview-Ready Pillars)**

### Clarifying requirements (functional + non-functional)

Ask: users, read/write QPS, latency targets, consistency, data retention, compliance, budget. Restate before drawing.

---

### Capacity estimation (QPS, storage, bandwidth — Fermi style)

Orders of magnitude: events/sec × size × retention = storage; peak QPS × replicas. Show reasoning, not fake precision.

---

### High-level design sketches (clients → edge → services → data)

Boxes and arrows: Client → Gateway/BFF → Services → Kafka/DB/Lake → Serving index. Then drill one hotspot.

---

### Scaling

#### Vertical vs horizontal

Bigger box vs more boxes. Prefer horizontal for stateless services.

#### Stateless services

Session in Redis/JWT; enable easy scale-out.

#### Caching layers (CDN, Redis, app cache)

Cache derived reads; protect origins; watch invalidation.

#### Read replicas / sharding

Scale reads; shard by key when single primary insufficient — sharding is hard (rebalancing, cross-shard queries).

---

### Availability & reliability (replication, failover, multi-AZ)

Multi-AZ Kafka/OpenSearch/DB; health checks; graceful degradation (serve slightly stale rankings).

---

### Consistency, latency, and cost tradeoffs

Pick two to optimize explicitly. Real-time ranking: latency + availability; accept eventual consistency.

---

### CAP theorem in practice

Under partition, choose continuity (AP) vs consistency (CP). Most web systems favor AP with eventual consistency for non-critical paths.

---

### Caching strategies (cache-aside, write-through, TTLs, stampede)

Cache-aside common; TTL safety; stampede prevention (jittered TTL, single-flight).

---

### Rate limiting & throttling designs

Token bucket/leaky bucket at gateway; per-tenant quotas; protect OpenSearch from query floods.

---

### Queue-based load leveling

Kafka/SQS absorb spikes so consumers process at sustainable rate.

---

### Fan-out / CQRS / read models (OpenSearch as read model)

Write path updates events; **CQRS** read model (OpenSearch) optimized for queries — your ranking index is a classic read model.

---

### Designing for replay & audit

Immutable event log + lake bronze layer; replay consumers with new group; audit who changed offers.

---

### Multi-tenant considerations (overview)

Tenant isolation (data, noisy neighbor, security). Partition keys include tenant_id carefully.

---

### Security in design (authn/z, least privilege, encryption)

AuthN at edge; AuthZ in services; IAM for data plane; encrypt S3/Kafka; admin BFFs especially locked down.

---

### Failure modes & graceful degradation

If Flink lags, serve last-known rankings; if Redshift extract fails, don’t silently train on stale without alert.

---

### End-to-end case studies to practice

#### Real-time product ranking & recommendations

Kafka orders/products → Flink enrichment/rank → OpenSearch → API; Order Status Engine filters purchased; cache; monitor lag & p95.

#### Order status engine (exclude purchased items)

Stream of order events → keyed state of purchased items per customer → queryable store for recommendation filter — low latency, eventual sync with orders.

#### Loyalty offer tracker (batch + near-real-time status)

Spring Batch/Redshift for heavy hurdles; status service for near-real-time visibility; dashboards on progress.

#### Clickstream → features → training → Parquet lake

Airflow unload → validate → EC2 train → Parquet/Glue → evaluate → publish.

#### Admin BFF for personalization ops

React → BFF → downstream services; uploads to S3; status polling; authZ roles.

#### High-volume order/inventory Kafka ingestion with Lambda validation

MSK/Kafka → Lambda batches → validate → route; DLQ; idempotency; metrics on invalid rates.

---

**✅ SQL (Relational Deep Dive)**

### Relational model & normalization (1NF–3NF, when to denormalize)

Normalize to reduce anomalies; denormalize read models for performance (carefully). Warehouses intentionally denormalize star schemas.

---

### PostgreSQL architecture overview (processes, MVCC)

Server process + backends; **MVCC** keeps row versions for concurrent readers without blocking writers as heavily — vacuum needed for cleanup.

---

### MySQL vs PostgreSQL practical differences

Postgres: richer SQL, JSONB, window functions historically stronger; MySQL ubiquitous, simpler replication historically. Know your dialect for the interview.

---

### Core SQL

#### SELECT/WHERE/ORDER/LIMIT

Foundation; deterministic ORDER BY for pagination.

#### JOINs (inner, left, right, full, cross, anti-join patterns)

Anti-join: `LEFT JOIN ... WHERE right.key IS NULL` or `NOT EXISTS` — “orders without shipments.”

#### GROUP BY / HAVING

Filter groups with HAVING after aggregation.

#### Aggregations

`COUNT/SUM/AVG/MIN/MAX`; `COUNT(*)` vs `COUNT(col)`.

#### Subqueries & CTEs (`WITH`)

CTEs for readability; may be inlined/optimized differently by engine.

#### Window functions (`ROW_NUMBER`, `RANK`, `LAG/LEAD`, running totals)

Top-N per group: `ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...)`. Running sums with frames.

#### CASE expressions

Conditional columns in transforms.

#### UNION / INTERSECT / EXCEPT

Set ops; `UNION ALL` preserves dupes cheaper.

---

### Indexes

#### B-tree, Hash (where supported), GIN/GiST (Postgres awareness)

B-tree default equality/range; GIN for JSONB/arrays/full text; GiST for geometric/full text variants.

#### Composite indexes & leftmost prefix

`(a,b)` helps `a` and `a,b` predicates — not `b` alone generally.

#### Covering indexes

Index-only scans when all needed columns are in the index (Postgres visibility map caveats).

#### When indexes hurt (writes, wrong selectivity)

Every index slows writes; low-selectivity indexes waste space.

---

### Query planning (`EXPLAIN` / `ANALYZE`)

Read sequential vs index scan, join types, estimated vs actual rows — skew hints.

---

### Transactions

#### ACID

Atomicity, Consistency, Isolation, Durability — foundational OLTP promise.

#### Isolation levels (READ COMMITTED, REPEATABLE READ, SERIALIZABLE)

Higher isolation → fewer anomalies, more contention. Postgres default READ COMMITTED.

#### Dirty/non-repeatable/phantom reads

Phenomena prevented differently per level — classic interview table.

#### Deadlocks

Circular locks → engine aborts one; retry transaction; consistent lock ordering helps.

---

### Constraints (PK, FK, unique, check)

Enforce integrity close to data — your last line of defense.

---

### Views & materialized views

Views virtual; materialized views stored & refreshed — good for gold marts (warehouse-like).

---

### Upserts (`ON CONFLICT` / `INSERT ... ON DUPLICATE`)

Idempotent writes for event consumers projecting to SQL.

---

### Pagination (OFFSET vs keyset)

OFFSET degrades on deep pages; **keyset** (`WHERE id > ? ORDER BY id LIMIT`) scales.

---

### Locking (optimistic vs pessimistic)

Optimistic: version column. Pessimistic: `SELECT FOR UPDATE`. Choose by conflict rate.

---

### Connection pooling (PgBouncer / app pools)

DB connections are expensive — pool at app and/or PgBouncer especially with serverless/K8s many pods.

---

### Migrations (expand/contract pattern)

Additive expand → deploy code → contract remove old. Avoid locking rewrites without plan.

---

### SQL for analytics on Redshift (differences from Postgres)

Similar SQL surface; MPP distribution/sort keys matter; some Postgres features absent; optimize for scans not OLTP.

---

### Common interview SQL problems (top-N per group, gaps, running metrics)

Practice: top 3 products per category; sessionize events; running revenue; detect missing dates in a series.

---

**✅ NoSQL & Specialized Stores**

### When NoSQL fits (access patterns, scale, flexibility)

Known key lookups at high QPS, flexible documents, or specialized query (search). If you need rich ad-hoc joins/transactions, relational often wins.

---

### Consistency & durability tradeoffs overview

Tunable consistency (DynamoDB eventually vs strong reads); quorum systems; be explicit what user sees under failure.

---

### Document stores — MongoDB

#### Documents, collections, BSON

JSON-like documents; collections ≈ tables; BSON binary JSON.

#### Embedding vs referencing

Embed for data read together; reference for many/large/changing relations — trading duplication vs joins (`$lookup`).

#### Indexing strategies

Index access paths; compound indexes; TTL indexes for ephemeral docs.

#### Aggregation pipeline

Transform pipelines (`$match/$group/$lookup`) — powerful analytics inside Mongo.

#### Transactions (multi-document) — limits

Supported but costlier; don’t design highly transactional systems primarily on Mongo without reason.

#### Schema design for trading/platform-style workloads

Model orders/trades around query patterns (by user, by instrument, time ranges); careful unbounded array growth.

---

### Key-value / wide-ish — Amazon DynamoDB

#### Tables, items, PK/SK

Partition key (+ optional sort key) defines uniqueness and access. Design **from queries**.

#### GSIs / LSIs

Alternate access patterns; GSI has own partition key; eventually consistent by default usually.

#### Capacity modes (provisioned vs on-demand)

On-demand for spiky; provisioned + autoscaling for steady predictable.

#### Single-table design (conceptual)

Multiple entity types under one table with careful PK/SK patterns — powerful and easy to mess up.

#### Consistency (eventually vs strongly consistent reads)

Strong reads cost more and only on base table (not all GSI cases).

#### Streams for CDC-like flows

DynamoDB Streams → Lambda for projections/events.

#### Hot partitions & adaptive capacity

Popular PK values throttle — salt keys or redesign. Adaptive capacity helps somewhat.

---

### Warehouse — Redshift (OLAP) as distinct from OLTP NoSQL

Not NoSQL — analytical relational MPP. Don’t use as app primary store for transactional APIs.

---

### Search — OpenSearch as query-optimized store

Secondary index / read model — not system of record for money/inventory without careful design.

---

### Polyglot persistence strategy (how YOU combine Postgres + DynamoDB + OpenSearch + Redshift + S3)

| Store | Role in your world |
|---|---|
| PostgreSQL | App/admin relational SoT (LetsBridge, services) |
| DynamoDB | Low-latency keyed product/config/state |
| OpenSearch | Ranking/search read models |
| Redshift | Clickstream analytics / extracts |
| S3 + Glue | Lake/features/Parquet |
| Kafka | Event backbone |

Speak this map in interviews — it’s your differentiator.

---

### Caching stores awareness (Redis) in microservice designs

Session cache, rate limits, hot keys, materializations. TTL + eviction; not durable SoT.

---

### Data modeling exercises

#### Order events in Kafka → DynamoDB projection

Consumer upserts `PK=ORDER#id` latest status; idempotent; stream lag monitored.

#### Product docs in OpenSearch

Flink writes denormalized product+rank docs; API searches/filters.

#### User/admin relational data in PostgreSQL

Users, roles, audit — transactions + FKs.

#### Clickstream analytics in Redshift + lake Parquet

Warehouse for SQL; unload to lake for ML/Spark.

---

**✅ Networking, Security & Reliability for Distributed Data Systems**

### TLS, certificates, and encryption at rest / in transit

TLS everywhere; rotate certs; S3/Kafka/disk encryption with KMS; least privilege decrypt rights.

---

### IAM roles for Lambda / EMR / EC2 / Airflow workers

Prefer roles over access keys; scope to prefixes/tables; separate read/write roles per env.

---

### Network isolation (VPC, private subnets, security groups — AWS overview)

Private data services; NAT for egress; SG least ports; MSK/Redshift in private subnets.

---

### PII handling in logs & lakes

Tokenize/hash; column-level access; avoid logging payloads with PII; encrypt sensitive lake zones.

---

### GDPR-style deletion challenges on immutable lakes/Kafka (conceptual)

Immutable logs/lakes conflict with deletion rights — tiered retention, crypto-shredding, compacted topics, legal holds process. Know it’s hard and organizational.

---

### Backup / restore / time travel (Iceberg snapshots, DB backups)

Iceberg snapshot rollback; RDS/Redshift snapshots; Kafka not a backup system — replicate lake. Test restores.

---

### Chaos & failure injection awareness

Game days: kill consumers, throttle OpenSearch, fail a DAG — validate alerts and degradation paths.

---

### Cost governance (S3 storage classes, Athena scans, EMR idle clusters)

Lifecycle policies; partition data; auto-terminate EMR; monitor Athena bytes; right-size Lambda memory.

---

**✅ Cross-Cutting Interview Scenarios (Integrate Everything)**

### Design a real-time ranking system (Kafka + Flink + OpenSearch)

Clarify latency/freshness → Kafka topics for orders/products → Flink keyed enrichment + score → upsert OpenSearch → query API with filters (purchased exclusion via Order Status Engine) → monitor lag/p95 → discuss replay and schema evolution.

---

### Design an Airflow-orchestrated daily ML training pipeline

Dataset readiness sensors → Redshift unload → quality checks → EC2/EMR train → evaluate gates → publish Parquet/model to S3/Glue → notify; no catchup surprises; idempotent partition writes.

---

### Design Kafka → Lambda validation → multi-sink routing

Batch handler; schema validate; business rules; emit to topic A/B or S3; DLQ; partial failure; idempotency store; dashboards on invalid %.

---

### Migrate Hive tables to Iceberg on S3 + Glue Catalog

Dual-write or snapshot migrate; register Iceberg table; shadow reads; cut readers (Athena/Spark); retire Hive table; compaction strategy.

---

### Compare EMR Spark job vs Glue job vs Flink streaming job for a use case

Batch large curated transform → Glue/EMR Spark. Continuous ranking → Flink. Tiny event validate → Lambda. State cost of always-on cluster vs serverless.

---

### Debug consumer lag / checkpoint failures / DAG SLA miss

Lag: slow consumer, hot partition, downstream sink, scale consumers, skew. Checkpoint fail: state backend S3 permissions, pressure, barriers. SLA miss: upstream data late vs task runtime — check sensors/logs/XCom paths.

---

### Choose SQL vs DynamoDB vs OpenSearch for a given access pattern

Relational multi-row transactions/joins → SQL. Key lookup at huge scale → DynamoDB. Text/relevance/filter denormalized docs → OpenSearch. Don’t force one tool.

---

### Containerize a worker and deploy with Kubernetes Job/Deployment

Dockerfile multi-stage → ECR → Deployment for long consumers / Job for batch → requests/limits, probes, IAM via IRSA, ConfigMaps, dashboards.

---

### Add observability (Grafana metrics + Datadog logs) to a data product

Define SLIs (freshness, lag, error rate); emit metrics; structured logs with run IDs; Grafana ops board; Datadog monitors → Pager; runbook links.

---

### Explain microservices around a personalization platform (gateway, BFF, events)

Edge gateway auth → Persoverse BFF for admin UI → domain services (offers, recommendations, order status) → Kafka backbone → streaming rank → OpenSearch read models → lake/ML via Airflow; resilience + correlation IDs across hops.

---

## How to use this guide

- Walk the Topics checklist; explain each item aloud, then deepen here.  
- Prefer **diagrams on paper** for Kafka → Flink → OpenSearch and Airflow ML paths — your CV stories.  
- Pair with `Interview Prep - React Python Full Stack.md` for behavioral framing of these systems.  
- Re-read weak areas weekly: **exactly-once, watermarks, Iceberg, K8s probes, SQL windows, DynamoDB keys**.

Good luck with prep.
