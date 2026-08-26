# Data Engineering Core

A deep-dive companion to the Data Engineering Core checklist. Each heading matches the original outline; under every topic you'll find **what it is**, **why it exists**, **how it works**, and **interview-ready nuance**.

---

**📌 Data Engineering Foundations**

### Batch vs streaming vs micro-batch

| Mode | Latency | Complexity | Examples |
|---|---|---|---|
| **Batch** | Minutes–hours | Lower | Nightly ETL, Airflow + EMR |
| **Streaming** | Sub-second–seconds | Higher | Kafka + Flink |
| **Micro-batch** | Seconds | Middle | Spark Structured Streaming |

Choose based on **freshness SLA**, not hype. Many "real-time" needs are satisfied with 5–15 minute micro-batches cheaper than true streaming.

---

### ETL vs ELT vs reverse ETL

- **ETL** — transform before load (traditional warehouse)
- **ELT** — load raw to lake, transform in-place (Spark, SQL on S3)
- **Reverse ETL** — sync warehouse metrics back to SaaS (Salesforce, ads)

Modern AWS pattern: **ELT** on S3 + Iceberg + Athena/Spark; Redshift for curated marts.

---

### Data lake vs data warehouse vs lakehouse

| Pattern | Strength | Weakness |
|---|---|---|
| **Lake** (S3) | Cheap scale, schema-flexible | Governance/query perf without layers |
| **Warehouse** (Redshift) | Fast SQL BI, governance | Storage cost, less flexible ingest |
| **Lakehouse** (Iceberg on S3) | ACID tables + open format + multi-engine | Ops maturity (compaction, catalog) |

Interview: lakehouse = open table format + catalog + engines (Spark, Flink, Athena).

---

### Medallion architecture (Bronze, Silver, Gold)

- **Bronze** — raw ingest, append-only, minimal transforms, full history
- **Silver** — cleaned, deduped, conformed schemas, business keys
- **Gold** — aggregates, star schemas, feature tables for BI/ML

Enables replay from bronze and clear ownership per layer. Pair with Iceberg snapshots for time travel on silver/gold.

---

### Data modeling for analytics (star schema, fact/dimension)

**Fact tables** — measurable events (orders, clicks) with foreign keys to **dimensions** (customer, product, date). Denormalized dimensions for query simplicity in Redshift/Athena. Slowly changing dimensions (SCD Type 1/2) for history.

Streaming facts may land in Iceberg first, then aggregate to gold star schema.

---

### Idempotency, at-least-once & exactly-once semantics

Message systems and retries imply **at-least-once** delivery. **Idempotent sinks** (merge by key, Iceberg upsert, dedup job) achieve effective exactly-once. Kafka transactions + Flink two-phase commit for end-to-end exactly-once where required.

Design: deterministic keys, monotonic offsets, dedup windows.

---

### Partitioning & file format choices (Parquet, ORC, Avro, JSON)

| Format | Use |
|---|---|
| **Parquet** | Analytics default (columnar, predicate pushdown) |
| **ORC** | Hive/legacy, similar to Parquet |
| **Avro** | Row-based, Kafka schemas, splittable |
| **JSON** | Ingest/debug; poor analytics perf/cost |

Partition by **low-cardinality** time (`dt=2024-01-15`) or region; avoid hot partitions. Target **128 MB–1 GB** file sizes in lake tables.

---

### Data quality dimensions (completeness, freshness, schema)

Monitor: row counts vs baseline, null rates, uniqueness of keys, schema drift, **freshness** (max event time lag). Implement checks in Airflow task or Great Expectations/Deequ on Spark. Fail pipeline or quarantine bad batches to bronze DLQ path.

---

### SLAs: freshness, latency, RPO/RTO for pipelines

Define **freshness** (data available by 6am), **latency** (event to dashboard < 5 min), **RPO** (max data loss window), **RTO** (recovery time). Architecture follows SLAs — don't over-engineer sub-minute streaming if SLA is hourly.

---

**📌 Python for Data Engineering**

### Python role in modern data stacks

Python is the **glue language**: Airflow DAGs, Lambda lightweight transforms, PySpark driver/UDFs, boto3 automation, local prototyping with pandas. Not the hot path for billion-row shuffles (Spark/Flink JVM), but orchestration and medium-scale transforms.

---

### Virtual environments & dependency pinning

Use `venv`/`poetry` + lockfiles. EMR/Lambda/Docker images must pin versions (`requirements.txt` hash) for reproducible runs. Avoid "works on my laptop" drift across workers.

---

### pandas for exploratory transforms (when & when not)

Great for **MB–low GB** prototyping, ad hoc analysis, small file merges. **Avoid** on EMR driver for large data (memory blowup). Rule: scale out with Spark once data exceeds single-node RAM or needs parallel IO.

---

### PyArrow & Parquet I/O

**PyArrow** — efficient columnar in-memory format; read/write Parquet with schema preservation. Bridge between Python and Spark (`spark.read.parquet` / pandas UDF boundaries). Prefer Arrow-backed pandas ops where available.

---

### boto3 for AWS data services

SDK for S3, Glue, Athena, EMR, Redshift Data API, MWAA CLI triggers. Patterns: paginators for large lists, exponential backoff retries, SSE-KMS on uploads, multipart upload for large files.

```python
s3.upload_file(local_path, bucket, key)
athena.start_query_execution(...)
emr.add_job_flow_steps(...)
```

---

### Writing production ETL scripts (logging, retries, config)

Structure: config (env/yaml) → extract → validate → transform → load → emit metrics. Use structured JSON logs, exit codes, retry only transient errors (throttling), dead-letter paths for poison records. No hardcoded paths/credentials.

---

### Structured logging & observability hooks

Log correlation IDs, partition dates, row counts in/out, duration. Push custom CloudWatch metrics (freshness lag, records processed). OpenTelemetry emerging for cross-service traces.

---

### Testing data pipelines (unit vs integration)

**Unit:** pure transform functions with fixture DataFrames (pandas/PySpark local). **Integration:** mini S3 (LocalStack) or dev bucket, run against sample parquet. **DAG tests:** Airflow `DagBag` import test, task mock. Don't run full cluster in unit CI — use smaller Spark local session judiciously.

---

### Type hints, pydantic & config validation

Validate pipeline config at startup with **pydantic** models (dates, bucket names, required keys). Type hints improve maintainability in large codebases. Fail fast before expensive cluster spin-up.

---

### Packaging jobs for EMR / containers

Ship code via `--py-files` zip, bootstrap sync from S3, or custom Docker image on EMR on EKS. Keep driver and executor env aligned on dependency versions. Entry point: `spark-submit` with main module.

---

**📌 Apache Kafka**

### Kafka core concepts (broker, topic, partition, offset)

**Topic** — logical stream split into **partitions** for parallelism. **Offset** — immutable position in partition log. **Broker** stores replicas. Producers write; consumers read in order **per partition**.

Throughput scales with partition count; ordering guaranteed **within** partition only.

---

### Producers & consumers (consumer groups)

**Producer** chooses partition (key hash or sticky batching). **Consumer group** — each partition consumed by one consumer in group; rebalance on join/leave. Scale consumers ≤ partitions (extra consumers idle).

---

### Replication, ISR & leader election

Each partition has leader + followers (**ISR** = in-sync replicas). `acks=all` waits for ISR ack before producer success. Unclean leader election tradeoff (availability vs data loss) — production configs favor durability.

---

### Key-based partitioning & ordering guarantees

Same **message key** → same partition → order preserved for that key. Design keys for business entity (`order_id`) when order matters. Hot keys → hot partitions → throttle.

---

### Retention, compaction & log segments

Time/size retention deletes old segments. **Compaction** keeps latest value per key (changelog topics for Kafka Streams/Flink state). Tune retention for replay vs storage cost.

---

### Kafka Connect (source & sink connectors)

Framework for scalable integrations (Debezium CDC → Kafka, S3 sink, JDBC source). Distributed workers with offset tracking. Prefer Connect over one-off scripts for operational connectors.

---

### Schema Registry & Avro/JSON schemas

Central schema versions; producers embed schema ID; consumers evolve safely (**backward/forward compatibility**). Avro common with Kafka for compact binary + evolution. Breaking schema changes need migration plan.

---

### Kafka vs Kinesis vs MSK (when to choose)

| Service | Notes |
|---|---|
| **Self-managed Kafka / MSK** | Full Kafka API, ecosystem, Connect, Streams |
| **Kinesis** | AWS-native, shards, simpler ops, different consumer model |
| **MSK Serverless** | Variable throughput, less broker tuning |

Choose MSK when you need Kafka compatibility; Kinesis for tight AWS integration and shard model acceptance.

---

### Exactly-once semantics (transactions, idempotent producer)

**Idempotent producer** dedupes retries per PID. **Transactions** atomic write across partitions + commit consumer offsets. End-to-end EoS needs transactional sink (Iceberg/Flink/Kafka Streams) or idempotent design.

---

### Operational concerns (lag, rebalancing, under-replicated partitions)

Monitor **consumer lag**, **URP**, disk usage, request latency. Lag spikes: slow consumers, GC, downstream backpressure, too few partitions. Rebalance storms — cooperative sticky assignor, avoid frequent rolling restarts during peak.

---

**📌 Apache Spark**

### Spark architecture (driver, executors, cluster manager)

**Driver** — plans jobs, schedules tasks, holds lineage. **Executors** — run tasks, cache data. **Cluster manager** — YARN (EMR), Kubernetes, standalone. Driver OOM from `collect()` is a classic failure mode.

---

### RDD vs DataFrame vs Dataset

**RDD** — low-level, resilient distributed dataset (legacy). **DataFrame** — untyped rows + Catalyst optimizer (PySpark primary). **Dataset** — typed (Scala/Java). Prefer **DataFrame/SQL** for performance and readability.

---

### Spark SQL & Catalyst optimizer

SQL/DataFrame API → logical plan → optimized physical plan (predicate pushdown, column pruning). **Explain** plans in interviews. Push filters to Parquet/Iceberg sources for IO savings.

---

### Transformations vs actions & lineage

**Transformations** lazy (map, filter, join). **Actions** trigger execution (count, write, collect). Spark builds **DAG**; stages separated by shuffle. Cache/persist after expensive reuse.

---

### Shuffle, stages & partitioning strategy

**Shuffle** — all-to-all exchange (groupBy, join). Expensive: disk spill, network. Reduce: pre-partition, broadcast small tables, salting skewed keys. **Repartition** vs **coalesce** — coalesce narrow without full shuffle (decrease partitions).

---

### Joins (broadcast, sort-merge, skew handling)

**Broadcast hash join** — small table (< `spark.sql.autoBroadcastJoinThreshold`) sent to all executors. **Sort-merge** — large-large. **Skew:** salt keys, AQE skew join (Spark 3), isolate hot keys to separate processing.

---

### Window functions & aggregations

```sql
SUM(amount) OVER (PARTITION BY user_id ORDER BY event_time
  ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
```

Power user analytics in Spark SQL; mind shuffle on `PARTITION BY` high cardinality.

---

### Handling nulls, duplicates & late data (batch)

Batch: dedup with `row_number()` over key ordered by timestamp; null handling explicit (`coalesce`, filters). **Late data** in batch often handled by **partition overwrite** for day D including late arrivals next run (idempotent merge).

---

### Spark on S3 (committers, partition discovery)

Use **S3A** committers compatible with EMR (magic committer / directory marking) to avoid inconsistent writes on failure. Partition discovery: `spark.sql.sources.partitionOverwriteMode=dynamic` for partition replaces. Avoid listing huge prefix without partition filter.

---

### Adaptive Query Execution (AQE)

Spark 3 runtime optimization: coalesce partitions post-shuffle, switch join strategy, skew handling based on stats. Enable on EMR 6+ for automatic perf wins without manual tuning.

---

### Spark Structured Streaming (overview)

Micro-batch or continuous processing over Kafka/S3. **Checkpoint** dir for fault tolerance. **Watermark** for late event handling. Output modes: append, update, complete. Good when team already on Spark; Flink often wins ultra-low latency complex state.

---

### Performance tuning (memory, spill, caching, UDF cost)

- Avoid UDFs — use built-in SQL functions (JVM codegen)
- Tune `spark.executor.memory`, overhead, cores
- Watch **spill** metrics (memory pressure)
- Cache only reused DataFrames (`MEMORY_AND_DISK`)
- File sizing on write (`repartition` before save)

---

**📌 Apache Flink**

### Flink vs Spark (streaming-first mental model)

Flink treats stream as default; batch is bounded stream. **Event-time** semantics native; lower latency than Spark micro-batch for many workloads. Spark stronger batch ecosystem maturity; Flink stronger CEP, stateful streaming.

---

### JobManager, TaskManagers, slots & parallelism

**JobManager** coordinates; **TaskManagers** execute **tasks** in **slots** (JVM resource unit). Parallelism = operator parallel instances. Slots limit concurrent tasks per TM — size clusters accordingly on EMR/K8s.

---

### DataStream API vs Table/SQL API

**DataStream** — explicit operators (map, keyBy, window). **Table/SQL** — declarative, unified batch/streaming. SQL often preferred for maintainability; DataStream for fine-grained control.

---

### Event time, processing time & watermarks

**Event time** — timestamp in record (correct for out-of-order). **Processing time** — wall clock (simple, non-deterministic). **Watermark** — progress of event time; triggers windows; handles lateness with allowed lateness side output.

---

### Windows (tumbling, sliding, session)

| Type | Behavior |
|---|---|
| **Tumbling** | Fixed non-overlapping buckets |
| **Sliding** | Overlapping fixed length |
| **Session** | Gap-based user sessions |

Keyed windows require **keyBy**; state scoped per key.

---

### State & keyed state backends

Flink maintains **keyed state** (ValueState, ListState, MapState) fault-tolerant with checkpoints. Choose **HashMapStateBackend** (heap, small) vs **RocksDB** (large state, disk). State size drives recovery time and ops cost.

---

### Checkpointing & savepoints

**Checkpoint** — automatic async snapshot for fault tolerance (barrier alignment). **Savepoint** — manual, versioned, for upgrades/migration. Interval + timeout tuning; exactly-once needs aligned sources/sinks supporting 2PC.

---

### Fault tolerance & exactly-once sinks

Checkpoint barriers synchronize operators; on failure restart from last completed checkpoint. Sinks must be **idempotent** or participate in two-phase commit (Kafka, Iceberg with proper connector). At-least-once + dedup acceptable for many analytics cases.

---

### Kafka source/sink patterns

Flink Kafka consumer with offset commits tied to checkpoints. **Partition discovery** dynamic. Sink with delivery guarantee matching business need. Monitor lag per partition; scale Flink parallelism with Kafka partitions.

---

### Backpressure & flow control

Slow sink propagates **backpressure** upstream — natural flow control. If persistent, increase sink parallelism, optimize state, or scale cluster. Unlike batch, sustained backpressure indicates bottleneck needing architecture fix.

---

**📌 Apache Airflow**

### Airflow architecture (scheduler, webserver, workers, metadata DB)

**Scheduler** parses DAGs, enqueues tasks. **Workers** execute task instances (Celery/Kubernetes/local). **Metadata DB** (Postgres) stores state. **Webserver** UI. **Executor** choice drives scale (CeleryExecutor, KubernetesExecutor on MWAA/self-hosted).

---

### DAGs, tasks, operators & task groups

**DAG** — workflow definition (schedule, default args). **Task** — node ( BashOperator, PythonOperator, `@task` decorator, providers: `EmrAddStepsOperator`, `AthenaOperator`). **TaskGroup** — UI grouping without extra DAG files.

---

### Scheduling & catchup / backfill

`schedule_interval` or timetable (cron, `@daily`). **`catchup=False`** prevents historical flood on new DAG. **Backfill** CLI for intentional historical runs. Understand data interval vs execution date (`{{ ds }}`, `{{ data_interval_start }}` in Airflow 2).

---

### XComs (when to use vs anti-pattern)

Pass small metadata between tasks via XCom (task instance return pushed to metadata DB). **Anti-pattern:** large DataFrames in XCom. Pass S3 paths, partition keys, job IDs instead.

---

### Sensors & deferrable operators

**Sensors** wait for external condition (S3 key, partition). Use **deferrable** mode / async sensors to free worker slots. Timeout and poke interval tuning prevents DAG gridlock.

---

### Dependencies (>>), trigger rules & dynamic task mapping

`task1 >> task2` lineage. **Trigger rules** (`all_success`, `one_failed`, etc.). **Dynamic task mapping** (`expand`) fans out over list of inputs (process each date partition in parallel tasks).

---

### Connections, variables & secrets backends

Store AWS creds via **IAM role on worker** (preferred on MWAA) not long-lived keys. Airflow **Connections** for JDBC/API; **Variables** for config; **Secrets Backend** (AWS Secrets Manager) for sensitive values.

---

### Idempotent & incremental pipeline design

Tasks should be safe to retry: merge into Iceberg by partition, `INSERT OVERWRITE` idempotent paths, EMR step with deterministic output location. Pass **`logical_date`** as processing partition — reruns same interval replace same output.

---

### MWAA (Managed Workflows for Apache Airflow on AWS)

AWS-managed Airflow (scheduler + workers + web UI). VPC integration, S3 DAG bucket, CloudWatch logs, IAM execution role for EMR/Glue/Athena. Trade ops burden for service limits and version pinning.

---

### Testing DAGs & CI for workflows

`pytest` import DAG bag (no cycles, valid start date). Task tests mock operators. CI: parse DAGs on PR, lint, run unit tests. Staging MWAA environment for integration before prod promotion.

---

**📌 AWS EMR**

### EMR cluster components (master, core, task nodes)

**Master** — YARN ResourceManager, HDFS NameNode (if HDFS used), tracking UI. **Core** — HDFS data + compute (keep for HDFS clusters). **Task** — compute only, ideal for Spot — no HDFS role. Most S3-native lakes use task nodes heavily.

---

### EMR on EC2 vs EMR on EKS vs Serverless (overview)

| Variant | When |
|---|---|
| **EMR on EC2** | Classic Spark/Hadoop, full control |
| **EMR on EKS** | Kubernetes-native, shared cluster |
| **EMR Serverless** | Submit jobs without cluster ops (Spark) |

Pick EC2 EMR for mature Spark tuning; Serverless for intermittent jobs with less cluster management.

---

### Bootstrap actions & instance fleets

**Bootstrap scripts** install libs at node start (use sparingly — slows scale-up). **Instance fleets** mix instance types for Spot diversification + on-demand core capacity.

---

### EMR steps vs long-running clusters

**Transient cluster** — add steps, auto-terminate (cost efficient for batch). **Long-running** — shared cluster for interactive/notebooks (higher ops, idle cost). Airflow often adds steps to transient cluster or uses EMR Serverless job run.

---

### Running Spark on EMR (submit, configs, YARN)

```bash
spark-submit --deploy-mode cluster \
  --conf spark.dynamicAllocation.enabled=true \
  s3://code/jobs/etl.py --date 2024-01-15
```

Tune in `spark-defaults`, classification configs, or step args. **Cluster mode** — driver on YARN; **client mode** — driver on edge node (notebooks).

---

### EMRFS & S3 access patterns

**EMRFS** — Hadoop S3 filesystem implementation. Consistent view, server-side encryption integration. Use s3:// paths in Spark. Watch **ListObject** costs on huge buckets — partition your data.

---

### Security (IAM roles, encryption, Kerberos overview)

**EC2 instance profile** for S3/Glue access. Encryption at rest SSE-KMS on S3, in-transit TLS. **Lake Formation** fine-grained access. Kerberos for multi-tenant Hadoop hardening (legacy enterprises).

---

### Cost optimization (Spot task nodes, auto-termination)

Task nodes on **Spot** with on-demand master/core for stability. Enable **managed scaling**. Terminate idle clusters. Right-size instance types (Graviton where supported). Compare EMR Serverless $ vs always-on cluster.

---

### EMR Studio & notebooks (overview)

Web notebooks backed by EMR cluster for exploratory Spark SQL. Not production orchestration — promote to scheduled Airflow + versioned scripts.

---

**📌 Amazon Redshift**

### Redshift architecture (leader node, compute nodes, slices)

**Leader** — parser, optimizer, coordinator. **Compute nodes** — storage + execution split into **slices** (parallel units). MPP database — queries fan out to slices. RA3 separates compute/storage scaling.

---

### Columnar storage & zone maps

Columnar blocks with min/max **zone maps** skip irrelevant blocks. Sort key alignment improves zone map pruning. Why columnar wins analytics aggregations vs row stores.

---

### Distribution styles (KEY, EVEN, ALL)

| Style | Behavior |
|---|---|
| **KEY** | Same key on same slice — co-locate joins |
| **EVEN** | Round-robin |
| **ALL** | Full copy on each slice — small dimension tables |

Choose distribution key on frequent join column; avoid skewed keys.

---

### Sort keys & query performance

**Compound/ interleaved sort keys** (interleaved deprecated in favor of AUTO). Recent sort key design: **AUTO** table optimization. Match sort key to common filter columns (`event_date`).

---

### COPY, UNLOAD & integration with S3

Bulk load from S3 Parquet/CSV via **COPY** (fast ingest). **UNLOAD** export to S3 for lake interchange. Use IAM role, manifest files, compression. COPY errors → STL_LOAD_ERRORS system table.

---

### Spectrum (Redshift Spectrum — external tables)

Query S3 data lake in place via external schema linked to **Glue Data Catalog**. Pay per data scanned; no load step. Combine with native Redshift tables for hybrid queries (lake + warehouse).

---

### Workload management (WLM / concurrency scaling)

**WLM queues** prioritize ETL vs BI (classic) or **Automatic WLM** (modern). **Concurrency Scaling** bursts read queries to extra capacity (additional cost). Separate heavy ETL from dashboards.

---

### Vacuum, analyze & maintenance

**VACUUM** reclaim space after deletes (sort key tables). **ANALYZE** update stats for optimizer. Monitor table bloat, unsorted regions. RA3 / AUTO reduce manual sort key maintenance vs old distkey/sortkey religion.

---

### Redshift Serverless (overview)

Auto-scaling RPU capacity; no cluster provisioning. Good variable BI workloads. Still integrate with Glue catalog / zero-ETL from Aurora in evolving AWS stories — know conceptually.

---

### Redshift vs Athena vs EMR for analytics

| Engine | Best for |
|---|---|
| **Redshift** | Low-latency BI, complex joins on curated data, concurrent dashboards |
| **Athena** | Ad hoc lake SQL, sporadic queries, no cluster |
| **EMR Spark** | Heavy transforms, ML feature gen, complex ETL |

Lakehouse: transform on EMR → serve via Redshift (load or Spectrum) + Athena for exploration.

---

**📌 Apache Iceberg on AWS**

### Table format problem (Hive-style partitions vs Iceberg)

Hive-style `s3://bucket/dt=2024-01-01/file.parquet` couples **physical layout** to partition columns; schema changes painful; no ACID. **Iceberg** separates **table metadata** from files — engines interact via catalog.

---

### Iceberg table model (metadata layer, snapshots, manifests)

Hierarchy: **metadata file** → **manifest list** → **manifest files** → data files. **Snapshot** = consistent view at commit time. Enables cheap planning without listing entire bucket.

---

### Hidden partitioning & partition evolution

Partition spec in metadata — change evolution without rewriting all paths (`days(event_ts)`). Queries filter via metadata pruning without user knowing folder layout.

---

### Schema evolution & column reorder

Add/drop/rename columns safely; optional column IDs for evolution. Spark & Flink writers/readers negotiate schema. Safer than brittle Parquet hive partitions.

---

### Time travel & snapshot isolation

Query `AS OF TIMESTAMP` or snapshot ID for reproducible reads and audit. Rollback bad writes by resetting to prior snapshot. Critical for debugging pipeline regressions.

---

### ACID commits on object storage

Serializable isolation for table updates; concurrent writers with optimistic concurrency (commit retry on conflict). Enables **MERGE INTO**, row-level deletes/updates on lake.

---

### Iceberg with Spark on EMR

Use Iceberg Spark runtime package / EMR iceberg classification:

```sql
MERGE INTO glue_catalog.db.orders t
USING updates u ON t.id = u.id
WHEN MATCHED THEN UPDATE SET ...
WHEN NOT MATCHED THEN INSERT *
```

Configure Glue catalog implementation.

---

### Iceberg with Flink

Flink Iceberg sink/source with checkpoint-aligned commits for exactly-once-ish writes. Streaming upserts via equality delete files (advanced). Growing production pattern for real-time silver layers.

---

### Glue Data Catalog as Iceberg catalog

**AwsDataCatalog** with `iceberg` table type. Single metastore for Athena, EMR Spark, Flink (with config). Set `spark.sql.catalog.glue_catalog=org.apache.iceberg.spark.SparkCatalog`.

---

### Compaction, snapshot expiration & orphan file cleanup

Small files hurt Athena/Spark — schedule **compaction** (rewrite data files). **Expire snapshots** per retention policy. **Remove orphan files** after snapshot expiry. Airflow maintenance DAG weekly.

---

### Iceberg vs Delta Lake vs Hudi (high level)

All lakehouse formats with ACID + time travel. **Iceberg** — engine-neutral, open spec, strong Athena/Spark/Flink support on AWS. **Delta** — Databricks-centric. **Hudi** — upsert/CDC focus. AWS multi-engine shops often lean Iceberg + Glue.

---

**📌 AWS Glue Data Catalog**

### Hive Metastore compatible catalog

Central **metastore** storing database/table/partition metadata. EMR, Athena, Redshift Spectrum, Spark SQL all query same definitions — avoids schema drift across engines.

---

### Databases, tables, partitions & crawlers

**Crawler** infers schema from S3 paths; schedules update partitions. Manual tables for Iceberg. **Partition indexes** speed GetPartitions for large tables.

---

### Classifiers & schema inference

Built-in CSV/JSON/Parquet classifiers; custom Grok for logs. Crawlers can over-partition or mis-infer types — validate silver layer contracts.

---

### Glue ETL jobs vs Spark scripts (overview)

Managed Spark (Glue ETL) with DynamicFrames — convenient but proprietary; many teams prefer **EMR Spark** or **Glue Spark** with standard DataFrames + Iceberg. Glue still useful for lightweight scheduled transforms.

---

### Partition indexing & projection

**Partition index** for tables with thousands of partitions. **Partition projection** synthesizes partition values without listing — fast Athena queries on predictable date hierarchies.

---

### IAM & Lake Formation integration

**Lake Formation** grants table/column-level permissions on catalog resources. Fine-grained access for multi-team lake. IAM + LF-tags for attribute-based access control.

---

### Cross-account catalog sharing

RAM-share Glue databases to consumer accounts; consumers query via Athena/EMR with linked catalog. Enterprise data mesh pattern.

---

### Catalog as single source of truth for Athena/EMR/Redshift Spectrum

Architecture principle: **one catalog** → many engines. Iceberg commits update metadata atomically; all engines see consistent snapshot after commit (with refresh semantics per engine).

---

**📌 Amazon Athena**

### Serverless SQL on S3 data lake

Interactive Presto/Trino-based query engine — no infrastructure. Pay per data scanned (TB). Ideal ad hoc analytics, lightweight ELT (`CTAS`), data exploration on curated Parquet/Iceberg.

---

### Presto/Trino engine fundamentals

Distributed MPP query: coordinator plans, workers scan S3 in parallel. **Predicate pushdown** to Parquet/Iceberg metadata minimizes IO. Understand **EXPLAIN** for interview debugging.

---

### Table formats (Hive, Iceberg, Hudi, Delta on Athena)

Athena supports **Iceberg**, **Hudi**, **Delta Lake** (via manifest) and Hive tables. Prefer Iceberg for ACID MERGE workflows compatible with Spark writes. Hive external tables still common for simple read-only partitions.

---

### Partition pruning & columnar formats (Parquet)

Always partition by common filters (`year`, `month`, `day`). Parquet + Snappy/Zstd compression. **Column projection** — `SELECT` only needed columns. Avoid `SELECT *` on wide tables (scan cost).

---

### Workgroups, cost controls & query monitoring

**Workgroups** separate teams billing/limits. **Data scan limit** per query. CloudWatch metrics for failed queries. **Query result reuse** (optional) for identical repeated queries.

---

### CTAS & INSERT INTO for ELT

```sql
CREATE TABLE gold.daily_sales
WITH (format='PARQUET', partitioned_by=ARRAY['dt'])
AS SELECT ...
```

Lightweight transforms without Spark for moderate data volumes; heavy transforms still EMR.

---

### Federated queries (data sources connector)

Query external operational DBs (Postgres, DynamoDB) via connectors — join with lake data cautiously (latency, pushdown limits). Useful enrichment, not primary ETL path.

---

### Performance tuning (file size, partitioning, bucketing)

Target large Parquet files; run compaction jobs. Avoid too many small files post-streaming ingest. **Bucketing** (Hive) less critical with Iceberg hidden partitioning. Run `MSCK REPAIR` for Hive tables when adding partitions manually.

---

### Athena vs Redshift Spectrum vs Spark SQL

| Tool | Role |
|---|---|
| **Athena** | Serverless lake SQL, CTAS, exploration |
| **Spectrum** | Redshift-side lake access inside warehouse queries |
| **Spark SQL** | Programmatic complex ETL, UDFs, large shuffles |

Same Glue catalog can back all three for consistent table definitions.

---

**📌 Lakehouse Pipelines on AWS (End-to-End)**

### Ingest: Kafka → S3 / Iceberg (streaming/batch)

**Pattern A:** Kafka → Flink/Spark Streaming → Iceberg bronze/silver with checkpointing. **Pattern B:** Kafka Connect S3 sink → periodic Spark batch compact to Iceberg. Choose by latency SLA and ops maturity.

---

### Orchestrate: Airflow triggering EMR/Glue/Athena jobs

Airflow DAG: sensor raw landing → EMR step Spark merge to silver → Athena CTAS gold aggregate → data quality check task → Slack alert on failure. Use **task timeouts**, **retries=2**, **sla** alerts.

---

### Transform: Spark on EMR writing Iceberg silver/gold

EMR Spark job reads bronze (JSON/Avro) → validate schema → **MERGE** into Iceberg silver by primary key → aggregate to gold Iceberg or Redshift COPY. Commit metrics to CloudWatch; tag output `processing_date`.

---

### Serve: Athena ad hoc + Redshift for BI workloads

Analysts explore gold Iceberg via **Athena**. BI tool (QuickSight/Tableau) on **Redshift** native tables for dashboard performance or Spectrum external tables for federation. Cache hot aggregates.

---

### Catalog lineage: Glue Data Catalog across engines

Register all layers in Glue; document owners in **Glue Data Catalog tags** or external data catalog (DataHub/OpenMetadata). Lineage from Airflow + Spark listeners where possible.

---

### Monitoring pipeline health (CloudWatch, data freshness checks)

Metrics: last successful Airflow DAG run, max(`event_time`) in gold vs now (**freshness lag**), row count variance, Iceberg snapshot age. PagerDuty when freshness SLA breached before business hours reporting.

---

**📌 Interview & Design Scenarios**

### Design a near-real-time analytics pipeline (Kafka + Flink/Spark + Iceberg)

Sketch: Producers → MSK → Flink (event-time windows, RocksDB state) → Iceberg silver upserts on S3 → Glue catalog → Athena/QuickSight. DLQ topic for bad records. Airflow for compaction/snapshot expiry. Discuss watermark lateness vs completeness.

---

### Design a batch daily warehouse load (Airflow + EMR + Redshift)

Sketch: Source DB CDC/files → S3 bronze → Airflow schedules EMR Spark silver/gold Iceberg → COPY to Redshift marts → vacuum/analyze. Idempotent partition overwrite. Catchup/backfill strategy documented. Cost: transient EMR cluster.

---

### Handle schema drift in production pipelines

Schema registry for Kafka; Iceberg **schema evolution** for adds; quarantine unknown fields to JSON column; contract tests in CI; versioned Avro/Protobuf. Breaking changes require coordinated consumer deploys.

---

### Backfill strategy without double-counting

Use **idempotent merge** on natural key + partition; or mark batches with `batch_id` and filter in gold; Iceberg snapshot for reproducible backfill window. Disable downstream consumers during full partition rebuild or use versioned tables.

---

### Cost-aware architecture on AWS data services

Athena partition projection vs crawler; EMR Spot task nodes; compact files reduce scan $; Redshift pause/resume or Serverless; S3 lifecycle to IA/Glacier for old bronze; right-size Kafka retention; MWAA vs self-hosted Airflow ops tradeoff.

---

### Common interview traps (shuffle, small files, hot partitions)

- Confusing **Kafka partition** with **Spark partition**
- Ignoring **small file problem** after streaming ingest
- **Driver collect()** on big data
- Hive partition **MSCK REPAIR** forgotten
- **Sort key** myth on modern Redshift AUTO
- Assuming Athena **MERGE** without Iceberg
- **At-least-once** without idempotent sink
- Airflow **execution date** vs real-world event date confusion

---

**Interview recap**

- Draw **medallion layers** and which engine owns each transition.
- State delivery semantics (**at-least-once** + idempotency) for Kafka/Flink/Spark streaming.
- Anchor AWS story: **Glue catalog** + **Iceberg** + **EMR transform** + **Athena explore** + **Redshift serve**.
- Airflow orchestrates; it doesn't replace Spark for heavy compute.
- Always mention **data quality**, **freshness SLAs**, and **cost of scans**.
