# SQL & NoSQL

A deep-dive companion to the SQL & NoSQL checklist. Each heading matches the original outline; under every topic you'll find **what it is**, **why it exists**, **how it works**, and **interview-ready nuance** — focused on **PostgreSQL, MySQL, Amazon Redshift, MongoDB, DynamoDB, Redis, and OpenSearch**.

---

**📌 Data Store Selection & Fundamentals**

### OLTP vs OLAP vs search vs cache — when to use which

| Role | Engine in this stack | Workload |
|---|---|---|
| **OLTP** | PostgreSQL, MySQL, DynamoDB, MongoDB | Transactions, CRUD, low-latency point reads/writes |
| **OLAP** | Redshift | Aggregations, scans, BI dashboards |
| **Search** | OpenSearch | Full-text, facets, relevance ranking |
| **Cache** | Redis, DAX | Sub-ms reads, ephemeral/session, rate limits |

Wrong tool symptoms: running analytics on primary Postgres (lock/contention), using Redis as source of truth (durability loss), using Mongo text index for heavy search (OpenSearch wins).

---

### SQL vs document vs key-value vs columnar vs search index

- **Relational (Postgres/MySQL/Redshift)** — schema, joins, ACID (OLTP/OLAP)
- **Document (MongoDB)** — flexible nested JSON, horizontal shard native
- **Key-value (DynamoDB, Redis)** — simple access patterns, extreme scale/partitioning
- **Columnar (Redshift)** — compress columns, scan aggregates fast
- **Inverted index (OpenSearch)** — tokenized text search + aggregations

Interview: start from **access patterns**, not popularity.

---

### Technology map (PostgreSQL, MySQL, Redshift, MongoDB, DynamoDB, Redis, OpenSearch)

```
App tier
  ├─ PostgreSQL / MySQL     → system of record (relational OLTP)
  ├─ MongoDB                → document OLTP, flexible schema
  ├─ DynamoDB               → managed KV/document at AWS scale
  ├─ Redis                  → cache, sessions, rate limits, leaderboards
  ├─ OpenSearch             → search & log analytics index
  └─ Redshift               → warehouse / reporting on curated data
```

Typical pipeline: OLTP → CDC/batch → Redshift; async index → OpenSearch; hot paths → Redis/DAX.

---

### Normalization vs denormalization tradeoffs

**Normalize (3NF)** in Postgres/MySQL — fewer anomalies, joins at read time. **Denormalize** for read-heavy dashboards (Redshift star schema), Mongo embedded docs, DynamoDB single-table adjacency lists. Rule: normalize writes in OLTP; denormalize **intentionally** in analytics/search indexes with clear refresh path.

---

### Schema-first vs schema-on-read

**Schema-first** (Postgres, MySQL, Redshift) — migrations, constraints enforce quality. **Schema-on-read** (Mongo flexible docs, OpenSearch dynamic mapping) — agility early, pain later without discipline. Use **Mongo schema validation** and **explicit OpenSearch mappings** in production.

---

### Consistency, replication & read scaling patterns

**Sync vs async replicas:** Postgres/MySQL async replicas → replication lag, stale reads possible. **DynamoDB** eventual consistency on GSIs/default reads unless strongly consistent read requested. **Redis** primary-replica async replication. Design **read-your-writes** explicitly when needed (read from leader, track version).

---

### Connection pooling & query latency basics

Each DB connection costs memory (Postgres ~10MB each). Use **PgBouncer**, **RDS Proxy**, MySQL proxy/pool at scale. Latency budget: network + queue + execution + serialization. Index and query shape dominate execution time for OLTP.

---

**📌 PostgreSQL — Core & Schema**

### PostgreSQL architecture (process model, shared buffers)

Postgres uses **process per connection** (not thread pool). **Shared buffers** cache pages; **WAL** for durability; **checkpointer** flushes dirty pages. Heavy connection counts hurt — pool externally.

---

### Data types & choosing the right type

Use smallest appropriate type: `timestamptz` not `text` dates; `numeric` for money; `bigint` for IDs if needed. **Arrays**, **UUID**, **citext**, **range types** are Postgres strengths. Wrong types break indexing and bloat storage.

---

### Primary keys, sequences & UUID tradeoffs

**Serial/bigserial** — compact, index-friendly, insertion order on B-tree (until v11+ improvements). **UUID** — distributed generation, wider keys, random UUIDs cause index fragmentation (use **UUIDv7** or sequential UUID strategies). **Identity columns** (modern) preferred over serial syntax.

---

### Constraints (PK, FK, UNIQUE, CHECK, NOT NULL)

Constraints document and enforce invariants at DB layer. **FK** adds referential integrity cost on writes but prevents orphan rows. **Deferrable FKs** for complex transactions. Not null + check constraints catch bugs early.

---

### Indexes (B-tree, Hash, GIN, GiST, BRIN)

| Index | Use |
|---|---|
| **B-tree** (default) | equality, range, sort |
| **Hash** | equality only (rare) |
| **GIN** | JSONB, arrays, full-text |
| **GiST** | geometric, full-text (older) |
| **BRIN** | very large naturally ordered tables (time) |

---

### Partial & expression indexes

Index subset of rows:

```sql
CREATE INDEX idx_active_users ON users (email) WHERE deleted_at IS NULL;
CREATE INDEX idx_lower_email ON users (lower(email));
```

Smaller, faster indexes when queries always filter the same way.

---

### JSONB columns & GIN indexing

**JSONB** binary JSON with indexing. **GIN** index on `jsonb_path_ops` or default for `@>`, `?`, path queries. Don't replace relational columns blindly — query patterns and update frequency matter.

---

### Partitioning (range, list, hash)

Declarative partitioning splits one logical table into physical partitions (often by date). **Partition pruning** skips irrelevant partitions. Use for time-series and archival (detach old partitions). Not a substitute for sharding across servers (Postgres partitioning is single-node unless Citus/extension).

---

### Vacuum, autovacuum & bloat

MVCC leaves dead tuples; **VACUUM** reclaims space for reuse; **autovacuum** prevents transaction id wraparound. Bloat from heavy updates without vacuum → table scans slow, index-only scans less effective. Monitor `n_dead_tup`, `last_autovacuum`.

---

### MVCC & transaction isolation levels

Default **Read Committed** — each statement sees snapshot. **Repeatable Read / Serializable** — stronger, may get serialization failures. Long transactions block vacuum (horizon) → bloat. Keep transactions short.

---

### Row-level locking & deadlocks

`SELECT FOR UPDATE` locks rows. Deadlocks detected automatically — one transaction aborted. Order lock acquisition consistently across app code to reduce deadlocks.

---

### EXPLAIN & EXPLAIN ANALYZE reading plans

Look for **Seq Scan** on large tables (missing index?), **Nested Loop** with huge inner, **Hash Join** memory, **actual rows vs estimated** (bad stats → run ANALYZE). `EXPLAIN (ANALYZE, BUFFERS)` for buffer hits.

---

**📌 PostgreSQL — Performance & Scaling**

### Index selection & missing index detection

Index columns in **WHERE**, **JOIN**, **ORDER BY** selectively. Composite index column order: equality columns first, then range. Use `pg_stat_user_tables`, `pg_stat_statements`, auto_explain. Drop unused indexes (write amplification).

---

### Query rewrite patterns (subquery vs join, EXISTS)

Often `EXISTS` beats `IN` with large subquery results. Avoid correlated subqueries on large sets. **Lateral joins** for top-N per group. Rewrite OR conditions across columns to **UNION** of index-friendly branches when needed.

---

### Pagination (OFFSET vs keyset / cursor)

`OFFSET 100000 LIMIT 20` scans skipped rows — O(offset) cost. **Keyset:**

```sql
WHERE (created_at, id) < ($ts, $id)
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

Stable, fast for infinite scroll feeds backed by Postgres.

---

### Batch inserts & COPY

Multi-row `INSERT` or **`COPY`** for bulk load — orders of magnitude faster than row-by-row. Disable unnecessary indexes/constraints during massive load, rebuild after (trade maintenance window).

---

### Read replicas & replication lag

Streaming replication to standbys for read scale. Lag during heavy writes — **stale read** on replica. Route critical reads to primary or use **session-level tracking** if needed. Replicas also used for backups/reporting offload.

---

### Connection pooling (PgBouncer, RDS Proxy)

**Transaction pooling** (PgBouncer) multiplexes many clients to fewer server connections — don't use session-level features (prepared statements cautiously, temp tables) without **session mode** pool. **RDS Proxy** adds IAM auth, failover smoothing for Lambda/serverless bursts.

---

### Vertical vs read-scale-out limits

Single Postgres primary eventually caps CPU/IO; read replicas help reads not writes. Write scale → partitioning, archive, or split services / move hot paths to DynamoDB/Redis. **Citus** (extension) for distributed Postgres — mention if asked.

---

### Table partitioning for large tables

Monthly partitions on `event_time` — queries with date filter scan one partition. Drop old partitions instead of DELETE millions of rows. Align partition key with query filters.

---

### Materialized views & refresh strategies

Precompute expensive aggregates; **REFRESH MATERIALIZED VIEW CONCURRENTLY** (needs unique index). Good for dashboards; stale until refresh — schedule via Airflow/cron. Not for real-time OLTP substitute.

---

### Common anti-patterns (SELECT *, N+1, OR across columns)

- `SELECT *` prevents index-only scans, wastes IO
- **N+1** ORM queries — batch fetch or join
- Functions on indexed columns (`WHERE lower(email)=`) prevent index use unless expression index
- Unbounded queries without LIMIT on admin tools

---

**📌 MySQL — Core & Schema**

### MySQL storage engines (InnoDB vs MyISAM — focus InnoDB)

**InnoDB** — default, transactions, row-level locking, FK, crash recovery. **MyISAM** — legacy, table locks, no transactions — avoid. All production OLTP on InnoDB.

---

### InnoDB row formats & clustering index

InnoDB tables are **clustered on primary key** — PK order is physical data order. Secondary indexes leaf nodes contain PK values → double lookup if not covering.

---

### Primary key & secondary index structure

Choose **monotonic PK** (AUTO_INCREMENT) for insert performance vs random UUIDs causing page splits. Secondary indexes include PK in leaves — wide PK bloats all secondary indexes.

---

### Charset & collation (utf8mb4)

Use **utf8mb4** for full Unicode (emoji). Collation affects sort/compare and index equality — `utf8mb4_unicode_ci` vs `_0900` in MySQL 8. Consistent collation across joined columns.

---

### Constraints & foreign keys in InnoDB

FK enforced in InnoDB with indexes on child side automatically (verify). Cascades (`ON DELETE CASCADE`) convenient but dangerous at scale — prefer soft deletes or explicit cleanup jobs.

---

### AUTO_INCREMENT vs UUID keys

Same tradeoffs as Postgres: AUTO_INCREMENT compact and sequential; UUID distributed but fragmenting. MySQL 8 **UUID_TO_BIN** with swap for better locality optional trick.

---

### JSON column type (MySQL 8+)

Native JSON with validation; functional indexes on paths (`(CAST(data->>'$.name' AS CHAR(50)))`). Generally Postgres JSONB indexing richer — know both for interviews comparing stacks.

---

### Online DDL & schema migrations (overview)

InnoDB supports **in-place** / **online** DDL for many operations (MySQL 8 improves). Still lock risk on huge tables — use **pt-online-schema-change** / **gh-ost** for zero-downtime migrations at scale.

---

**📌 MySQL — Performance & Scaling**

### B-tree indexes & composite index column order

**Leftmost prefix rule** — index `(a,b,c)` usable for `a`, `a,b`, not `b` alone. Put high-selectivity equality columns first; avoid redundant indexes `(a)` and `(a,b)` if latter suffices.

---

### Covering indexes & index-only scans

Include all selected columns in index (INCLUDE not in older MySQL — put columns in index definition). Reduces PK lookups — huge win on read-heavy paths.

---

### EXPLAIN & slow query log

`EXPLAIN ANALYZE` (8.0.18+) like Postgres. Enable **slow_query_log** with `long_query_time`; aggregate with **pt-query-digest**. Watch **Using filesort**, **Using temporary**.

---

### Query cache deprecation & buffer pool tuning

MySQL query cache **removed in 8.0** — don't mention for modern MySQL. **innodb_buffer_pool_size** ~70–80% RAM on dedicated DB server. Hit ratio should be high.

---

### InnoDB buffer pool & redo/undo logs

Buffer pool caches data/index pages. **Redo log** durability on commit; **undo** for rollback/MVCC. Tune `innodb_log_file_size`, flush policy (`innodb_flush_log_at_trx_commit=1` for durability).

---

### Read replicas & async replication lag

Binlog replication to replicas — async, lag under load. **Semi-sync** reduces data loss risk on primary crash. Read splitting like Postgres with stale read awareness.

---

### Group Replication / InnoDB Cluster (overview)

MySQL **InnoDB Cluster** (Group Replication) — consensus-based multi-primary/ single-primary HA. More ops complexity than single primary + replicas — enterprise HA option.

---

### Sharding at application layer (overview)

MySQL lacks native auto-shard like Mongo/Dynamo. **Vitess**, **ProxySQL**, app-level shard key routing. Cross-shard queries expensive — design bounded contexts per shard.

---

### Partitioning tables (RANGE, HASH, KEY)

MySQL native partitioning similar conceptual benefits to Postgres — prune partitions. Less common than Postgres partitioning in community stacks but valid for time-series archival.

---

### Common MySQL vs PostgreSQL differences (interview)

| Topic | Postgres | MySQL |
|---|---|---|
| MVCC | Tuple visibility | Undo rollback segments |
| Index types | GIN/GiST/BRIN rich | Full-text, spatial |
| Optimizer | Generally sophisticated | Improved greatly in 8 |
| JSON | JSONB + GIN | JSON functional indexes |
| Replication | Logical + physical | Binlog replicas |

Both: index discipline, avoid N+1, connection pooling.

---

**📌 Amazon Redshift — Warehouse & Schema**

### Columnar storage & MPP architecture

Data stored **by column** with compression; queries scan only needed columns. **Leader node** plans; **compute nodes** execute in parallel on **slices**. Designed for **scan/aggregate**, not high-concurrency OLTP.

---

### Distribution styles (KEY, EVEN, ALL)

| Style | Behavior |
|---|---|
| **KEY** | Hash shard key to slices — co-locate joins |
| **EVEN** | Round-robin |
| **ALL** | Full copy on each node — small dims |

Choose **DISTKEY** on frequent big-to-big join column; avoid skewed keys.

---

### Sort keys & zone maps

**Sort key** order enables **zone maps** (min/max per block) to skip blocks. **COMPOUND** (legacy explicit) vs **AUTO** (modern — let Redshift optimize). Match common **WHERE** range filters (date).

---

### Compression encodings (AZ64, ZSTD, etc.)

Column encodings chosen automatically (AUTO) or manually — **AZ64** common for integers/dates, **ZSTD** general. Wrong encoding wastes space and CPU — run **ANALYZE COMPRESSION**.

---

### Star schema & fact/dimension design

**Fact** tables (events, sales) with measures + FKs to **dimension** tables (customer, product, date). Denormalized dimensions acceptable. Fewer joins than 3NF OLTP — optimized for analytics queries.

---

### COPY from S3 & staging tables

Bulk load Parquet/CSV from S3 — fastest ingest. **Staging tables** → **INSERT INTO … SELECT** transform → target fact table. Minimize single-row INSERT in Redshift.

---

### UNLOAD to S3

Export query results to S3 for downstream ML/data lake interchange. Parallel unload per slice.

---

### Spectrum external tables (Glue catalog)

Query S3 data lake in place without loading — pay per scan. Hybrid: hot curated data native in Redshift, cold history via Spectrum.

---

### Late binding views (overview)

Views bound at query time — schema evolution flexibility. Materialized views in Redshift for pre-aggregated dashboards (refresh schedule).

---

**📌 Redshift — Performance & Scaling**

### Choosing distribution key (avoid skew)

Skewed DISTKEY (e.g. country=US 90%) → one slice hot, others idle. Pick high-cardinality, even distribution join keys. **EVEN** when no good join key.

---

### Sort key design & compound vs interleaved (AUTO)

Historical **interleaved** deprecated/problematic. Use **AUTO** table optimization or compound sort on date + filter columns. Avoid resorting entire table unnecessarily.

---

### VACUUM, ANALYZE & stats for optimizer

Deletes leave need for **VACUUM** (reclaim, resort). **ANALYZE** updates stats — bad stats → bad plans (nested loops on billion-row fact). Monitor **table stats off** alerts.

---

### WLM / automatic WLM & concurrency scaling

**Workload management** queues prioritize BI vs ETL. **Concurrency Scaling** adds burst clusters for read queries (extra cost). Short queries shouldn't queue behind monster scans — separate queues.

---

### Short query acceleration (overview)

Routes short queries to accelerated processing — reduces interference from long scans. Helps mixed BI workloads.

---

### Nested loop vs hash join at scale

Fact-table joins should **hash join / merge** at scale. Nested loop on billion rows catastrophic — stats/index/sort keys must enable efficient plans.

---

### Avoiding cross-node redistribution cost

Joins on **DISTKEY** matching columns avoid **DS_DIST_BOTH** redistribution in EXPLAIN plan. Inspect EXPLAIN (DIST, SORT, HASH) — redistribution is expensive network shuffle.

---

### Redshift Serverless vs provisioned (overview)

**Serverless** — auto capacity in RPU; good variable workloads. **Provisioned** — predictable cost at steady high utilization. Same SQL/design rules either way.

---

### Redshift vs PostgreSQL — different workload rules

Don't run Postgres OLTP patterns on Redshift (many small transactions, FK enforcement heavy updates). Redshift excels **bulk load + big aggregations**. OLTP stays on Postgres/RDS; ELT copies/transforms into Redshift.

---

**📌 MongoDB — Document Model & Schema**

### Documents, collections & _id design

 BSON documents up to 16MB. Default **_id** ObjectId embeds timestamp (rough ordering). Custom **_id** (UUID string, natural keys) when beneficial for sharding or idempotency.

---

### Embedding vs referencing

**Embed** one-to-few, data read together (comments on post if bounded). **Reference** one-to-many unbounded (user → orders). Embedding avoids joins but document growth and write amplification on array updates.

---

### Schema validation ($jsonSchema)

Enforce structure in production:

```javascript
db.createCollection("users", {
  validator: { $jsonSchema: { required: ["email"], properties: { email: { bsonType: "string" } } } }
});
```

Balance flexibility with data quality — don't rely on "schemaless" myth in prod.

---

### Polymorphic documents & schema evolution

Different shapes in one collection — use **discriminator field** (`type: "order"|"refund"`) and partial indexes. Version field for migration strategies.

---

### Common BSON types & Decimal128

Use **Decimal128** for money — avoid float. Dates as BSON Date, not strings. BinData for UUIDs if binary storage desired.

---

### Capped collections (overview)

Fixed-size FIFO collections — log-like use cases. Rare in modern stacks (TTL indexes often suffice).

---

### Time series collections (overview)

MongoDB 5+ **time series** optimized storage for metrics/IoT — bucket compression, automatic meta field indexing.

---

**📌 MongoDB — Indexing & Queries**

### Single-field & compound indexes

Compound index supports prefix queries like MySQL. **ESR rule** when building compound: **E**quality fields → **S**ort → **R**ange.

---

### Multikey indexes (arrays)

Indexing array field creates index entry per array element — index size explosion. Be cautious indexing unbounded arrays.

---

### Text indexes vs OpenSearch for full-text

Mongo **text index** OK for simple search; limited relevance, scaling, and analytics vs **OpenSearch**. Production search at scale → sync to OpenSearch; Mongo text for admin search only.

---

### Index intersection & ESR rule (Equality, Sort, Range)

Query `{ status: "open", created_at: { $gte: ... } }` with sort on `created_at` — index `(status, created_at)` aligns. Mongo can intersect multiple indexes but single compound index usually better.

---

### Covered queries & projection

Project only needed fields; covered query when all fields in index (include projection fields in index if needed). Reduces document fetch from collection.

---

### Aggregation pipeline ($match, $group, $lookup)

**$match early** reduces documents downstream. **$lookup** is Mongo join — expensive at scale; prefer embedded/denormalized or `$lookup` with indexed foreign field only. **$group** for analytics — may need allowDiskUse.

---

### $lookup performance & denormalization alternative

 `$lookup` without index on foreign key = collection scan. For high read QPS, denormalize snapshot fields or precompute in application/event consumer.

---

### Collation & index usage

Case-insensitive collation must match index collation or index unused. Specify at collection/index creation consistently.

---

**📌 MongoDB — Performance & Scaling**

### Read preference & replica set topology

**Primary** for read-your-writes; **secondary** for analytics offload accepting staleness. **Nearest** for geo latency. Replica set minimum 3 members for HA (primary + 2 secondaries or primary + secondary + arbiter — arbiter less preferred for data redundancy).

---

### Write concern & read concern levels

**Write concern** `majority` for durability across replicas. **Read concern** `majority` / `linearizable` for stronger reads (latency cost). Tune per use case — not everything needs majority.

---

### Sharding — shard key selection

**Immutable**, high cardinality, even distribution. Bad: monotonic `_id` only on time if all inserts hit one chunk initially (though ObjectId mitigates); bad low-cardinality `country`. **Hashed shard key** for even spread; **compound** `{ tenantId, orderId }` for multi-tenant isolation.

---

### Chunk splits, jumbo chunks & balancer

Data divided into **chunks** per shard key range. **Jumbo chunk** can't migrate — blocks balancer, causes imbalance. Monitor sharding dashboard; pre-split if known hot ranges.

---

### Hot shard mitigation

Shard key redesign (hard), **zone sharding** for isolation, split hot tenant to dedicated shard. Similar problem to DynamoDB hot partitions — design keys upfront.

---

### Horizontal scale limits of single shard

Single shard caps at one machine IO/CPU. Sharding required beyond vertical limit. Choose shard key before sharding — **resharding** is painful.

---

### Change streams (overview)

Real-time CDC from oplog — trigger sync to OpenSearch, Redshift staging, cache invalidation. Resume tokens for at-least-once consumers.

---

### Working set & WiredTiger cache

Frequently accessed data should fit **WiredTiger cache** (RAM) or disk IO spikes. Monitor cache eviction, `ftdc` metrics. Index + working set size drives RAM sizing.

---

**📌 Amazon DynamoDB — Data Model & Schema**

### Tables, items, attributes & single-table design intro

Item = row with attributes; schemaless per item except keys. **Single-table design** — multiple entity types in one table with composite keys and GSIs — advanced pattern for access-pattern-driven modeling.

---

### Partition key & sort key (composite primary key)

**Partition key (PK)** determines physical partition. Optional **sort key (SK)** enables range queries within partition (`PK=user123, SK begins_with ORDER#`). Design queries as **Query on PK**, never Scan.

---

### Secondary indexes (GSI vs LSI)

| Index | Scope | Key change | Consistency |
|---|---|---|---|
| **LSI** | Same PK, alt SK | PK fixed at create | Strongly consistent option |
| **GSI** | Different PK/SK | Flexible | Eventually consistent |

GSI projects spare global access patterns — each GSI consumes separate WCUs/RCUs.

---

### Sparse indexes & overload patterns

GSI with sparse attribute — only items with attribute indexed (e.g. `GSI1PK` only on orders not profiles). **Overloading** — same GSI fields mean different entities in single-table design.

---

### Item collections & adjacency list pattern

All related items share partition key (`PK=USER#123`, `SK=PROFILE`, `SK=ORDER#1`) — efficient **Query** for user's data in one round trip. Trade partition size if unbounded orders — paginate or archive.

---

### TTL attribute for expiry

DynamoDB deletes expired items asynchronously (no WCUs for delete). Great for sessions, temp tokens, cache-like rows. Don't rely on instant expiry for security-critical timing alone.

---

### DynamoDB Streams (overview)

Ordered change log per shard — Lambda consumers for sync to OpenSearch, audit, cross-region. **NEW_AND_OLD_IMAGES** for full delta processing.

---

**📌 DynamoDB — Performance & Scaling**

### Partition internals & 3000 RCU / 1000 WCU soft limits per partition

Each partition ~10GB / throughput limits. Throttling when exceeded — **ProvisionedThroughputExceededException**. Split partitions when growth/traffic increases — cannot control directly; key design matters.

---

### Hot partition problem & key design fixes

Celebrity user all writes one partition key → throttle. Fixes: **write sharding** suffix `userId#random(0-N)` with scatter-gather read, or compound key spreading. Same lesson as Redis hot keys.

---

### On-demand vs provisioned capacity

**On-demand** — pay per request, AWS scales partitions automatically (still hot key limits). **Provisioned** — cheaper at steady known load + auto-scaling policies. **Reserved capacity** for cost savings.

---

### Adaptive capacity (conceptual)

DynamoDB can redistribute unused partition throughput to hot partitions temporarily — not excuse for bad keys but helps burst. Monitor **ConsumedReadCapacityUnits** per key (CloudWatch Contributor Insights).

---

### Query vs Scan — always prefer Query

**Scan** reads entire table — cost scales with table size. **Query** uses key condition. Interviews: "How find user by email?" → GSI on email, not Scan filter.

---

### Pagination with LastEvaluatedKey

DynamoDB queries return max 1MB per page — loop with **ExclusiveStartKey**. Never use Scan pagination for large exports without parallel segmented scans (still expensive).

---

### BatchGetItem & BatchWriteItem limits

BatchGet up to 100 items / 16MB; BatchWrite 25 items. Unprocessed keys retry with backoff. Partial failures normal under throttle.

---

### DAX (DynamoDB Accelerator) for read caching

In-memory cache microsecond reads for DynamoDB — cluster mode, item cache, query cache. App transparent like ElastiCache but Dynamo-aware invalidation on write through DAX. Use for read-heavy, hot key patterns.

---

### Global tables & multi-region (overview)

Multi-active replication across regions — eventual consistency between regions, last writer wins conflicts. Disaster recovery and local latency — understand conflict resolution for counters (atomic ADD preferred).

---

### Transactions API limits & use cases

**TransactWriteItems** up to 100 actions, 4MB — ACID across items **same account/region**. Use for double-entry wallet transfer coordinating two items — not cross-service replacement for Saga.

---

**📌 Redis — Data Structures & Schema Patterns**

### Strings, hashes, lists, sets, sorted sets

| Type | Pattern |
|---|---|
| **String** | Cache blob, counters INCR |
| **Hash** | Object field map (user:123 fields) |
| **List** | Queue (careful with BLPOP patterns) |
| **Set** | Unique tags, membership |
| **ZSet** | Leaderboard, time-scored ranks |

Choose type matching access pattern — wrong type → wrong Big-O.

---

### Key naming conventions & TTL design

`service:entity:id:field` — e.g. `prep:user:42:session`. Consistent naming for scan avoidance (never KEYS * prod). **TTL** on every cache key unless persistent by design.

---

### Cache-aside pattern with Redis

App loads on miss from Postgres/Dynamo, sets Redis with TTL. Invalidate on update (delete key) or short TTL + accept staleness. Stampede protection with lock key.

---

### Session storage pattern

Hash per session id; TTL sliding on activity. Faster than DB session table; survive Redis restart only if AOF/RDB persistence enabled — sessions often acceptable to lose on failover (re-login).

---

### Rate limiting (INCR + EXPIRE, sliding window overview)

Fixed window: INCR key per minute bucket. **Sliding window** — sorted set of timestamps or Redis Cell module / Lua script for accuracy. Per-user and global limits at API edge.

---

### Leaderboards (sorted sets)

`ZADD leaderboard score userId`; `ZREVRANGE` top N — O(log N). Perfect Redis use case — don't implement in SQL for real-time gaming ranks at scale.

---

### Pub/Sub vs Redis Streams (overview)

**Pub/Sub** fire-and-forget — subscribers offline miss messages. **Streams** persistent log with consumer groups — lightweight Kafka-like for small scale event buffering.

---

### RedisJSON / RedisSearch modules (brief)

Redis Stack adds JSON document and search — overlaps Mongo/OpenSearch for small scope. Know exists; at scale dedicated search (OpenSearch) and OLTP DB usually cleaner separation.

---

**📌 Redis — Performance & Scaling**

### Single-threaded model & latency implications

Redis primary command execution single-threaded — **O(N) commands** (KEYS, huge SMEMBERS) block everything. Keep values small; use **UNLINK** async delete for large keys. CPU not the scaling axis — memory and network are.

---

### Memory eviction policies (allkeys-lru, volatile-lru)

When `maxmemory` reached: **allkeys-lru** evicts any key LRU; **volatile-lru** only keys with TTL. **noeviction** returns errors on write — cache-aside must handle. Monitor memory fragmentation ratio.

---

### Pipelining & batching commands

Send many commands without waiting for each reply — cuts RTT latency. **MGET/MSET** for bulk. Essential at high QPS from app servers.

---

### Cluster mode & hash slots

16384 hash slots across nodes; key hash tag `{userId}` co-locate related keys in same slot for multi-key ops. **MOVED/ASK** redirects during resharding. Client must be cluster-aware.

---

### Replication & read replicas

Async replication — replica may lag. **Read from replica** for stale-tolerant cache-like reads; writes to primary. **Sentinel** or **Cluster** for failover automation.

---

### Persistence tradeoffs (RDB vs AOF)

**RDB** snapshots periodic — fast restore, possible data loss window. **AOF** append log — more durable, larger files; **fsync always** slowest safest. Cache use case: often disable persistence; session: AOF every sec acceptable.

---

### Hot key problem & local cache hybrid

One viral key (celebrity profile) saturates single Redis node slot. **Local in-process cache** (Caffeine) in front of Redis for hottest keys; **read replicas** for read-heavy hot keys; split key `{id}#shard`.

---

### NOT using Redis as primary database (interview stance)

Redis lacks rich query, durability guarantees for financial source of truth, backup/restore complexity at DB level. Correct answer: **cache, session, rate limit, ephemeral state** — OLTP remains Postgres/Dynamo/Mongo.

---

**📌 OpenSearch — Index Design & Schema**

### Indices, shards & replicas

Index split into **primary shards** (write parallelism) + **replica shards** (read scale, HA). Shard count fixed at index creation (split/shrink API with constraints). Too many small shards → cluster overhead; too few → no parallelism.

---

### Mapping (dynamic vs explicit)

**Explicit mapping** production best practice — control field types, avoid wrong dynamic guess (`123 → long` then `"abc"` breaks). **Dynamic templates** for semi-structured logs.

---

### Analyzers, tokenizers & full-text search

**Analyzer** = tokenizer + filters (lowercase, stemmer, stop words). **Search analyzer** vs **index analyzer** can differ (synonyms at query time). Language-specific analyzers for relevance.

---

### keyword vs text fields

**text** — analyzed full-text search. **keyword** — exact match, aggregations, sorting. Multi-fields: `title.text` + `title.keyword`. Wrong mapping → aggregations fail or relevance poor.

---

### Nested & object field types

**Object** flattens arrays internally (cross-object matching bugs). **Nested** preserves array of object integrity for queries — more expensive indexing. Use nested when querying array of structs precisely.

---

### Index templates & aliases (zero-downtime reindex)

**Index templates** auto-apply mappings to `logs-*`. **Aliases** `products` → `products_v2` swap after reindex for zero-downtime mapping changes. **Index lifecycle management (ILM)** for logs/time-series.

---

### Ingest pipelines (overview)

Pre-process on ingest: grok parsing, enrich geoip, remove fields. Offload transformation from indexing clients; version pipelines in config.

---

**📌 OpenSearch — Querying & Aggregations**

### Query DSL (match, term, bool, filter context)

**bool** query: must, should, must_not, **filter** (no scoring, cacheable). **match** analyzed text; **term** exact on keyword fields.

---

### Filters vs queries (scoring & cache)

**Filter context** — yes/no, cached bitsets, faster. **Query context** — relevance score. Structure: filters narrow set, queries rank within — performance best practice.

---

### Aggregations (terms, date_histogram, nested)

**terms** — facet counts (category). **date_histogram** — time series charts. **nested** agg requires nested mapping. **Cardinality** approximate distinct (HyperLogLog++). Watch **size** parameter cost.

---

### Pagination (from/size vs search_after)

`from + size` deep pagination expensive (each shard collects from+size). **`search_after`** with sort tiebreaker (`_shard_doc`) for stable deep paging like keyset in SQL.

---

### Highlighting & suggesters (overview)

Highlight matched terms in snippets for search UI. **Completion suggester** for autocomplete — separate field type indexing.

---

### SQL plugin / JDBC (overview)

OpenSearch SQL translates SQL to DSL — convenient for BI tools; not every DSL feature supported. Know for Redshift/OpenSearch hybrid reporting conversations.

---

**📌 OpenSearch — Performance & Scaling**

### Shard sizing (20–50 GB guideline, workload dependent)

Target shard size balancing parallelism vs overhead. **Force merge** to reduce segments after bulk load (costly, plan off-peak). **Segment count** affects query latency — merge policy tuning.

---

### Force merge & segment management

Bulk index → many small segments → slow searches. `_forcemerge?max_num_segments=1` on read-only indices (logs after day closed). Avoid constant forcemerge on live write-heavy indices.

---

### Refresh interval & near-real-time tradeoff

Default **refresh_interval 1s** — new docs searchable within ~1s. Increase (30s) for bulk ingest throughput; `refresh=false` on bulk API during load, restore after.

---

### Bulk indexing API & backpressure

**Bulk** API batches index operations; optimal batch 5–15MB payload. Handle **429** with exponential backoff. Parallel workers per shard count — too many workers overwhelm cluster.

---

### Cross-cluster replication (overview)

Replicate indices across clusters for DR/geo read local. Leader-follower index pairing; lag monitoring for search freshness SLAs.

---

### UltraWarm / cold tiers (AWS overview)

OpenSearch Service **UltraWarm** moves older indices to cheaper storage; **Cold** for rarely accessed. Cost optimization for log retention policies.

---

### When OpenSearch vs PostgreSQL GIN / MongoDB text index

| Need | Choice |
|---|---|
| Simple admin search on one entity | Postgres GIN / Mongo text |
| Facets, relevance tuning, high QPS search UI | OpenSearch |
| Log analytics + search unified | OpenSearch |
| Transactional source of truth | Never OpenSearch alone |

Sync via CDC (Debezium), DynamoDB Streams, or application dual-write (discouraged without outbox).

---

**📌 Cross-Store Patterns & Interview Scenarios**

### PostgreSQL OLTP + OpenSearch search index sync

Postgres canonical; **change capture** (logical replication, Debezium, or app outbox) → indexer → OpenSearch. **Eventual consistency** on search; handle lag in UI ("results may update"). Idempotent indexing by document version.

---

### PostgreSQL / MongoDB → Redshift ELT pipeline

Extract (CDC/daily dump) → S3 staging → **COPY** → transform SQL in Redshift → gold tables. **Spectrum** for raw history. Never run heavy ETL on primary OLTP — offload to warehouse.

---

### DynamoDB + DAX + Redis multi-layer cache

DynamoDB source of truth; **DAX** for hot Dynamo reads; **Redis** for computed aggregates/sessions. Clear TTL and invalidation on writes. Explain why three layers — each targets different access pattern/latency tier.

---

### Choosing primary store for a new feature (decision checklist)

1. Relational joins/transactions? → Postgres/MySQL
2. Flexible nested docs, rapid schema change? → MongoDB
3. Predictable access patterns, massive scale, AWS-native? → DynamoDB
4. Sub-ms ephemeral/cache? → Redis
5. Full-text/facets? → OpenSearch (+ OLTP source)
6. Analytics aggregations? → Redshift

---

### Indexing strategy comparison across stores

| Store | Index mental model |
|---|---|
| Postgres/MySQL | B-tree composite, partial, GIN |
| Redshift | Sort key + distribution, not OLTP indexes |
| MongoDB | Compound, multikey, text (limited) |
| DynamoDB | Primary key + GSI/LSI only |
| Redis | Key access only — no secondary query index |
| OpenSearch | Inverted index + keyword fields |

---

### Sharding vs partitioning vs distribution key

- **Postgres/MySQL partitioning** — single node split tables
- **Mongo/Dynamo sharding** — horizontal split across machines
- **Redshift distribution** — how rows placed on slices in one cluster
- **Redis cluster** — hash slots across nodes

Same goal (scale), different mechanisms — don't conflate terms in interviews.

---

### Handling hot keys across Redis, MongoDB, DynamoDB

Universal pattern: **spread writes** (salting suffix), **local cache** fronting, **read replicas**, **preaggregate** async. Detection via monitoring (Redis hot key alerts, DynamoDB Contributor Insights, Mongo balancer stats).

---

### Migration between stores (MySQL → PostgreSQL, Mongo → DynamoDB)

Dual-write or CDC with validation; cutover with feature flag; rollback plan. **pgloader** MySQL→Postgres. Mongo→Dynamo requires access pattern redesign — not lift-and-shift documents. Expect application changes, not just dump/restore.

---

### Common interview traps per technology

- **Postgres:** ignoring autovacuum bloat; OFFSET pagination at scale
- **MySQL:** wrong charset; redundant indexes; assuming query cache exists in 8.0
- **Redshift:** OLTP-style updates; bad DISTKEY skew; ignoring ANALYZE
- **MongoDB:** unbounded document arrays; `$lookup` without index; shard key change later
- **DynamoDB:** Scan in production; hot partition; ignoring GSI cost doubling writes
- **Redis:** KEYS command; no TTL; primary database fallacy; big values blocking thread
- **OpenSearch:** dynamic mapping surprises; too many shards; deep `from/size` pagination

---

**Interview recap**

- Name **access patterns** before naming technology.
- Every store: know **how it scales**, **how it indexes**, and **what breaks at hot spots**.
- **OLTP ≠ warehouse ≠ search ≠ cache** — your stack uses all four intentionally.
- Strong answers compare **two stores you know** (e.g. DynamoDB vs Postgres for orders table).
- Always mention **operational cost**: replication lag, reindex, vacuum, shard balancing.
