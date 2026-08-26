# SQL & NoSQL

**📌 Data Store Selection & Fundamentals**
- [] OLTP vs OLAP vs search vs cache — when to use which
- [] SQL vs document vs key-value vs columnar vs search index
- [] Technology map (PostgreSQL, MySQL, Redshift, MongoDB, DynamoDB, Redis, OpenSearch)
- [] Normalization vs denormalization tradeoffs
- [] Schema-first vs schema-on-read
- [] Consistency, replication & read scaling patterns
- [] Connection pooling & query latency basics

**📌 PostgreSQL — Core & Schema**
- [] PostgreSQL architecture (process model, shared buffers)
- [] Data types & choosing the right type
- [] Primary keys, sequences & UUID tradeoffs
- [] Constraints (PK, FK, UNIQUE, CHECK, NOT NULL)
- [] Indexes (B-tree, Hash, GIN, GiST, BRIN)
- [] Partial & expression indexes
- [] JSONB columns & GIN indexing
- [] Partitioning (range, list, hash)
- [] Vacuum, autovacuum & bloat
- [] MVCC & transaction isolation levels
- [] Row-level locking & deadlocks
- [] EXPLAIN & EXPLAIN ANALYZE reading plans

**📌 PostgreSQL — Performance & Scaling**
- [] Index selection & missing index detection
- [] Query rewrite patterns (subquery vs join, EXISTS)
- [] Pagination (OFFSET vs keyset / cursor)
- [] Batch inserts & COPY
- [] Read replicas & replication lag
- [] Connection pooling (PgBouncer, RDS Proxy)
- [] Vertical vs read-scale-out limits
- [] Table partitioning for large tables
- [] Materialized views & refresh strategies
- [] Common anti-patterns (SELECT *, N+1, OR across columns)

**📌 MySQL — Core & Schema**
- [] MySQL storage engines (InnoDB vs MyISAM — focus InnoDB)
- [] InnoDB row formats & clustering index
- [] Primary key & secondary index structure
- [] Charset & collation (utf8mb4)
- [] Constraints & foreign keys in InnoDB
- [] AUTO_INCREMENT vs UUID keys
- [] JSON column type (MySQL 8+)
- [] Online DDL & schema migrations (overview)

**📌 MySQL — Performance & Scaling**
- [] B-tree indexes & composite index column order
- [] Covering indexes & index-only scans
- [] EXPLAIN & slow query log
- [] Query cache deprecation & buffer pool tuning
- [] InnoDB buffer pool & redo/undo logs
- [] Read replicas & async replication lag
- [] Group Replication / InnoDB Cluster (overview)
- [] Sharding at application layer (overview)
- [] Partitioning tables (RANGE, HASH, KEY)
- [] Common MySQL vs PostgreSQL differences (interview)

**📌 Amazon Redshift — Warehouse & Schema**
- [] Columnar storage & MPP architecture
- [] Distribution styles (KEY, EVEN, ALL)
- [] Sort keys & zone maps
- [] Compression encodings (AZ64, ZSTD, etc.)
- [] Star schema & fact/dimension design
- [] COPY from S3 & staging tables
- [] UNLOAD to S3
- [] Spectrum external tables (Glue catalog)
- [] Late binding views (overview)

**📌 Redshift — Performance & Scaling**
- [] Choosing distribution key (avoid skew)
- [] Sort key design & compound vs interleaved (AUTO)
- [] VACUUM, ANALYZE & stats for optimizer
- [] WLM / automatic WLM & concurrency scaling
- [] Short query acceleration (overview)
- [] Nested loop vs hash join at scale
- [] Avoiding cross-node redistribution cost
- [] Redshift Serverless vs provisioned (overview)
- [] Redshift vs PostgreSQL — different workload rules

**📌 MongoDB — Document Model & Schema**
- [] Documents, collections & _id design
- [] Embedding vs referencing
- [] Schema validation ($jsonSchema)
- [] Polymorphic documents & schema evolution
- [] Common BSON types & Decimal128
- [] Capped collections (overview)
- [] Time series collections (overview)

**📌 MongoDB — Indexing & Queries**
- [] Single-field & compound indexes
- [] Multikey indexes (arrays)
- [] Text indexes vs OpenSearch for full-text
- [] Index intersection & ESR rule (Equality, Sort, Range)
- [] Covered queries & projection
- [] Aggregation pipeline ($match, $group, $lookup)
- [] $lookup performance & denormalization alternative
- [] Collation & index usage

**📌 MongoDB — Performance & Scaling**
- [] Read preference & replica set topology
- [] Write concern & read concern levels
- [] Sharding — shard key selection
- [] Chunk splits, jumbo chunks & balancer
- [] Hot shard mitigation
- [] Horizontal scale limits of single shard
- [] Change streams (overview)
- [] Working set & WiredTiger cache

**📌 Amazon DynamoDB — Data Model & Schema**
- [] Tables, items, attributes & single-table design intro
- [] Partition key & sort key (composite primary key)
- [] Secondary indexes (GSI vs LSI)
- [] Sparse indexes & overload patterns
- [] Item collections & adjacency list pattern
- [] TTL attribute for expiry
- [] DynamoDB Streams (overview)

**📌 DynamoDB — Performance & Scaling**
- [] Partition internals & 3000 RCU / 1000 WCU soft limits per partition
- [] Hot partition problem & key design fixes
- [] On-demand vs provisioned capacity
- [] Adaptive capacity (conceptual)
- [] Query vs Scan — always prefer Query
- [] Pagination with LastEvaluatedKey
- [] BatchGetItem & BatchWriteItem limits
- [] DAX (DynamoDB Accelerator) for read caching
- [] Global tables & multi-region (overview)
- [] Transactions API limits & use cases

**📌 Redis — Data Structures & Schema Patterns**
- [] Strings, hashes, lists, sets, sorted sets
- [] Key naming conventions & TTL design
- [] Cache-aside pattern with Redis
- [] Session storage pattern
- [] Rate limiting (INCR + EXPIRE, sliding window overview)
- [] Leaderboards (sorted sets)
- [] Pub/Sub vs Redis Streams (overview)
- [] RedisJSON / RedisSearch modules (brief)

**📌 Redis — Performance & Scaling**
- [] Single-threaded model & latency implications
- [] Memory eviction policies (allkeys-lru, volatile-lru)
- [] Pipelining & batching commands
- [] Cluster mode & hash slots
- [] Replication & read replicas
- [] Persistence tradeoffs (RDB vs AOF)
- [] Hot key problem & local cache hybrid
- [] NOT using Redis as primary database (interview stance)

**📌 OpenSearch — Index Design & Schema**
- [] Indices, shards & replicas
- [] Mapping (dynamic vs explicit)
- [] Analyzers, tokenizers & full-text search
- [] keyword vs text fields
- [] Nested & object field types
- [] Index templates & aliases (zero-downtime reindex)
- [] Ingest pipelines (overview)

**📌 OpenSearch — Querying & Aggregations**
- [] Query DSL (match, term, bool, filter context)
- [] Filters vs queries (scoring & cache)
- [] Aggregations (terms, date_histogram, nested)
- [] Pagination (from/size vs search_after)
- [] Highlighting & suggesters (overview)
- [] SQL plugin / JDBC (overview)

**📌 OpenSearch — Performance & Scaling**
- [] Shard sizing (20–50 GB guideline, workload dependent)
- [] Force merge & segment management
- [] Refresh interval & near-real-time tradeoff
- [] Bulk indexing API & backpressure
- [] Cross-cluster replication (overview)
- [] UltraWarm / cold tiers (AWS overview)
- [] When OpenSearch vs PostgreSQL GIN / MongoDB text index

**📌 Cross-Store Patterns & Interview Scenarios**
- [] PostgreSQL OLTP + OpenSearch search index sync
- [] PostgreSQL / MongoDB → Redshift ELT pipeline
- [] DynamoDB + DAX + Redis multi-layer cache
- [] Choosing primary store for a new feature (decision checklist)
- [] Indexing strategy comparison across stores
- [] Sharding vs partitioning vs distribution key
- [] Handling hot keys across Redis, MongoDB, DynamoDB
- [] Migration between stores (MySQL → PostgreSQL, Mongo → DynamoDB)
- [] Common interview traps per technology
