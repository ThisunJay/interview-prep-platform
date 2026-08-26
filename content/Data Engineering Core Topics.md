# Data Engineering Core

**📌 Data Engineering Foundations**
- [] Batch vs streaming vs micro-batch
- [] ETL vs ELT vs reverse ETL
- [] Data lake vs data warehouse vs lakehouse
- [] Medallion architecture (Bronze, Silver, Gold)
- [] Data modeling for analytics (star schema, fact/dimension)
- [] Idempotency, at-least-once & exactly-once semantics
- [] Partitioning & file format choices (Parquet, ORC, Avro, JSON)
- [] Data quality dimensions (completeness, freshness, schema)
- [] SLAs: freshness, latency, RPO/RTO for pipelines

**📌 Python for Data Engineering**
- [] Python role in modern data stacks
- [] Virtual environments & dependency pinning
- [] pandas for exploratory transforms (when & when not)
- [] PyArrow & Parquet I/O
- [] boto3 for AWS data services
- [] Writing production ETL scripts (logging, retries, config)
- [] Structured logging & observability hooks
- [] Testing data pipelines (unit vs integration)
- [] Type hints, pydantic & config validation
- [] Packaging jobs for EMR / containers

**📌 Apache Kafka**
- [] Kafka core concepts (broker, topic, partition, offset)
- [] Producers & consumers (consumer groups)
- [] Replication, ISR & leader election
- [] Key-based partitioning & ordering guarantees
- [] Retention, compaction & log segments
- [] Kafka Connect (source & sink connectors)
- [] Schema Registry & Avro/JSON schemas
- [] Kafka vs Kinesis vs MSK (when to choose)
- [] Exactly-once semantics (transactions, idempotent producer)
- [] Operational concerns (lag, rebalancing, under-replicated partitions)

**📌 Apache Spark**
- [] Spark architecture (driver, executors, cluster manager)
- [] RDD vs DataFrame vs Dataset
- [] Spark SQL & Catalyst optimizer
- [] Transformations vs actions & lineage
- [] Shuffle, stages & partitioning strategy
- [] Joins (broadcast, sort-merge, skew handling)
- [] Window functions & aggregations
- [] Handling nulls, duplicates & late data (batch)
- [] Spark on S3 (committers, partition discovery)
- [] Adaptive Query Execution (AQE)
- [] Spark Structured Streaming (overview)
- [] Performance tuning (memory, spill, caching, UDF cost)

**📌 Apache Flink**
- [] Flink vs Spark (streaming-first mental model)
- [] JobManager, TaskManagers, slots & parallelism
- [] DataStream API vs Table/SQL API
- [] Event time, processing time & watermarks
- [] Windows (tumbling, sliding, session)
- [] State & keyed state backends
- [] Checkpointing & savepoints
- [] Fault tolerance & exactly-once sinks
- [] Kafka source/sink patterns
- [] Backpressure & flow control

**📌 Apache Airflow**
- [] Airflow architecture (scheduler, webserver, workers, metadata DB)
- [] DAGs, tasks, operators & task groups
- [] Scheduling & catchup / backfill
- [] XComs (when to use vs anti-pattern)
- [] Sensors & deferrable operators
- [] Dependencies (>>), trigger rules & dynamic task mapping
- [] Connections, variables & secrets backends
- [] Idempotent & incremental pipeline design
- [] MWAA (Managed Workflows for Apache Airflow on AWS)
- [] Testing DAGs & CI for workflows

**📌 AWS EMR**
- [] EMR cluster components (master, core, task nodes)
- [] EMR on EC2 vs EMR on EKS vs Serverless (overview)
- [] Bootstrap actions & instance fleets
- [] EMR steps vs long-running clusters
- [] Running Spark on EMR (submit, configs, YARN)
- [] EMRFS & S3 access patterns
- [] Security (IAM roles, encryption, Kerberos overview)
- [] Cost optimization (Spot task nodes, auto-termination)
- [] EMR Studio & notebooks (overview)

**📌 Amazon Redshift**
- [] Redshift architecture (leader node, compute nodes, slices)
- [] Columnar storage & zone maps
- [] Distribution styles (KEY, EVEN, ALL)
- [] Sort keys & query performance
- [] COPY, UNLOAD & integration with S3
- [] Spectrum (Redshift Spectrum — external tables)
- [] Workload management (WLM / concurrency scaling)
- [] Vacuum, analyze & maintenance
- [] Redshift Serverless (overview)
- [] Redshift vs Athena vs EMR for analytics

**📌 Apache Iceberg on AWS**
- [] Table format problem (Hive-style partitions vs Iceberg)
- [] Iceberg table model (metadata layer, snapshots, manifests)
- [] Hidden partitioning & partition evolution
- [] Schema evolution & column reorder
- [] Time travel & snapshot isolation
- [] ACID commits on object storage
- [] Iceberg with Spark on EMR
- [] Iceberg with Flink
- [] Glue Data Catalog as Iceberg catalog
- [] Compaction, snapshot expiration & orphan file cleanup
- [] Iceberg vs Delta Lake vs Hudi (high level)

**📌 AWS Glue Data Catalog**
- [] Hive Metastore compatible catalog
- [] Databases, tables, partitions & crawlers
- [] Classifiers & schema inference
- [] Glue ETL jobs vs Spark scripts (overview)
- [] Partition indexing & projection
- [] IAM & Lake Formation integration
- [] Cross-account catalog sharing
- [] Catalog as single source of truth for Athena/EMR/Redshift Spectrum

**📌 Amazon Athena**
- [] Serverless SQL on S3 data lake
- [] Presto/Trino engine fundamentals
- [] Table formats (Hive, Iceberg, Hudi, Delta on Athena)
- [] Partition pruning & columnar formats (Parquet)
- [] Workgroups, cost controls & query monitoring
- [] CTAS & INSERT INTO for ELT
- [] Federated queries (data sources connector)
- [] Performance tuning (file size, partitioning, bucketing)
- [] Athena vs Redshift Spectrum vs Spark SQL

**📌 Lakehouse Pipelines on AWS (End-to-End)**
- [] Ingest: Kafka → S3 / Iceberg (streaming/batch)
- [] Orchestrate: Airflow triggering EMR/Glue/Athena jobs
- [] Transform: Spark on EMR writing Iceberg silver/gold
- [] Serve: Athena ad hoc + Redshift for BI workloads
- [] Catalog lineage: Glue Data Catalog across engines
- [] Monitoring pipeline health (CloudWatch, data freshness checks)

**📌 Interview & Design Scenarios**
- [] Design a near-real-time analytics pipeline (Kafka + Flink/Spark + Iceberg)
- [] Design a batch daily warehouse load (Airflow + EMR + Redshift)
- [] Handle schema drift in production pipelines
- [] Backfill strategy without double-counting
- [] Cost-aware architecture on AWS data services
- [] Common interview traps (shuffle, small files, hot partitions)
