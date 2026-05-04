import type { ConceptDeepDive } from '../../types';

export const writeBehindCache: ConceptDeepDive = {
  moduleId: 'write-behind-cache',
  tagline: 'Acknowledge fast, persist later — the highest-throughput caching pattern',

  introduction: {
    layman:
      'Write-behind (also called "write-back") is a caching pattern where writes go to the cache immediately and are flushed to the database asynchronously some time later. The application gets a fast acknowledgement, and the database is updated in the background — usually in batches. The result is dramatically higher write throughput, at the cost of a small window where data lives only in the cache and could be lost if the cache crashes.',
    analogy:
      'A waiter taking orders. Instead of running each order to the kitchen one at a time (write-through), the waiter writes orders on a notepad and walks them in batches. Each customer gets immediate acknowledgement, the kitchen processes orders efficiently in groups, but if the waiter loses the notepad before delivering, those orders are lost. The faster service comes with a small risk window.',
    whyMatters:
      'Write-behind is the secret weapon for write-heavy systems: telemetry pipelines, gaming leaderboards, IoT ingestion, social media interactions (likes, views). Senior engineers must understand exactly what guarantees they are giving up (durability, sometimes ordering) to gain throughput, and how to mitigate the risks. Used incorrectly, write-behind silently loses customer data.',
  },

  subTopics: [
    {
      title: 'How Write-Behind Works — The Write Queue',
      icon: '📥',
      layman:
        'When the application writes, the cache stores the value and adds the key to a "dirty" queue. A background worker reads from the queue and writes to the database. Until the worker has completed the database write, the data exists only in the cache.',
      technical:
        'Architecture: write path = cache.set(key, value) + enqueue(key) + ack to client. Background flusher: periodically (or when queue size exceeds threshold), pull keys from queue, batch them, and execute one or many DB writes. Common implementations use an in-memory queue (Java BlockingQueue, Go channel) or an external queue (Redis Stream, Kafka). The cache marks keys as "dirty" until their flush succeeds. Tunable parameters: flush interval (e.g., every 5 seconds), batch size (e.g., 1000 writes per batch), max queue depth (after which writes start blocking or returning errors). Some implementations support "coalescing": if the same key is written multiple times before flush, only the latest value is persisted.',
      example:
        'Hazelcast IMap with write-behind MapStore: configure write-delay-seconds=5 and write-batch-size=1000. Writes to the IMap return immediately; every 5 seconds, dirty keys are batched and persisted to the underlying RDBMS. Throughput jumps from ~5K writes/sec (write-through) to ~50K+ writes/sec because individual DB round trips are eliminated.',
      whenToUse:
        'Use write-behind when (a) write throughput is the bottleneck, (b) the business can tolerate seconds of unflushed data being at risk in the cache, and (c) writes are idempotent or coalescing is acceptable.',
    },
    {
      title: 'Coalescing — Why It Matters',
      icon: '🔗',
      layman:
        'When the same key is updated multiple times before being flushed to the database, the cache can keep only the latest value and write that to the DB once. Instead of 100 writes to the database for 100 updates of the same counter, you get just 1. This is called write coalescing and is the source of write-behind\'s biggest gains.',
      technical:
        'Coalescing is what makes write-behind dramatically more efficient than write-through for high-update-rate keys. Example: a video player sending "current_position" updates every second; per-user, that is 1 write/sec to the DB without coalescing. With write-behind + coalescing flushing every 30s, it becomes 1 write per 30 seconds — a 30× reduction. Implementation: the dirty queue is a set, not a list — duplicate keys collapse. The flusher reads the latest value from the cache when it dequeues, not a snapshot at enqueue time. Caveat: coalescing loses intermediate states. If you need a full audit trail of every update, write-behind is the wrong pattern (use an event log instead).',
      example:
        'Twitter\'s tweet view counter: every view increments a counter. Without coalescing, 1M views/min on a viral tweet = 1M DB writes/min. With write-behind + coalescing flushing every 60 seconds, the DB sees ~1 write/min for that tweet — the counter increments by ~1M atomically.',
    },
    {
      title: 'Batching — Reducing DB Round Trips',
      icon: '📦',
      layman:
        'Instead of executing one INSERT or UPDATE per dirty key, the flusher groups many keys into one larger statement (a batch UPDATE, a multi-row INSERT, a bulk_write). Each round trip handles 1000s of keys instead of 1, so DB CPU drops dramatically.',
      technical:
        'Batch types: (1) Multi-row INSERT (... ), (... ), (... ) — efficient for new rows. (2) Bulk UPDATE via VALUES list and JOIN, or repeated UPDATE in a transaction. (3) MERGE / UPSERT (INSERT ... ON CONFLICT UPDATE) — handles new + existing in one statement. (4) MongoDB bulkWrite, Cassandra batch statements. Batch size tuning: too small means more overhead than necessary; too large means long-running transactions, lock contention, and replication lag. Sweet spot is 100–1000 rows depending on row size and DB. Critical: batches must be idempotent — flusher retries on failure, and partial batch failures must not leave the system in an inconsistent state.',
      example:
        'Stripe\'s metering pipeline ingests usage events at high rate. Per-event writes would crush Postgres. Write-behind aggregates per-customer-per-minute counters in Redis, then flushes batches of 5000 rows every 30 seconds via a single INSERT ... ON CONFLICT statement. Throughput is roughly 100× direct writes, with a 30-second durability window mitigated by Redis persistence.',
    },
    {
      title: 'Durability Risks — When the Cache Loses Data',
      icon: '⚠️',
      layman:
        'The fundamental risk: any data written to the cache but not yet flushed to the database lives only in cache memory. If the cache process crashes, restarts, runs out of memory, or has its node fail, those unflushed writes vanish. Losing 30 seconds of telemetry data may be fine; losing 30 seconds of credit card transactions is not.',
      technical:
        'Mitigation strategies: (1) Persistent cache — Redis with AOF (append-only file) fsynced every second or every write; persistent cache instances on EBS volumes. (2) Replicated cache — write to primary + sync to replica before ack. Reduces risk to dual-failure scenarios. (3) Write-ahead log to durable queue (Kafka, Redis Streams with persistence) before cache write — if cache crashes, replay from the log. (4) Bounded "in-flight" window — set a hard cap on unflushed writes; switch to write-through when threshold approached. (5) Cache disasters scenarios drilled: what happens if the entire Redis cluster is wiped? How long until business notices? Critical reading: any team using write-behind for revenue-impacting data should write a runbook for "cache lost N seconds of data."',
      example:
        'Reddit had a notable incident where a Redis crash dropped vote counts gathered over the previous several minutes. Mitigation went in afterward: votes are now logged to Kafka first (durable), then aggregated in Redis via write-behind to MySQL — Kafka is the recovery point if Redis or MySQL has issues.',
    },
    {
      title: 'Failure Handling — Retries, DLQs, and Backpressure',
      icon: '🛟',
      layman:
        'When the flusher fails to write to the database (DB down, schema mismatch, deadlock), it must retry. If retries fail repeatedly, the dirty queue grows and grows. The cache fills up with unflushed data. Eventually, you must shed load: reject new writes, or send failed writes to a dead-letter queue for manual handling.',
      technical:
        'Failure modes: (1) Transient DB error (timeout, deadlock) — retry with exponential backoff. (2) Permanent error (schema violation, FK violation, oversized row) — must not block the queue forever; route to a DLQ. (3) DB down for hours — backpressure: queue is bounded, new writes either block (latency spike), drop to disk, or fail. (4) Poison pill: one bad row blocks the whole batch — implementations need single-row retry on batch failure. (5) Out-of-order writes due to retries — for non-coalesced writes, retry of an older value after a newer one creates inconsistency. Coalescing helps; sequence numbers help more. Operationally: monitor queue depth, age of oldest dirty key, batch failure rate, DLQ depth — these are the SLIs of write-behind.',
      example:
        'Hazelcast and Ignite both expose hooks for write-behind failure: onWriteError handlers can retry, log to a DLQ, or surface to monitoring. Without those hooks wired up, a sustained DB outage silently fills the cache and eventually OOMs — the second-order failure is much worse than the first.',
    },
    {
      title: 'When to Use Write-Behind (and When Not To)',
      icon: '🎯',
      layman:
        'Write-behind is for write-heavy, latency-sensitive workloads where the data is not so critical that 30 seconds of risk is unacceptable. Telemetry, view counts, "last seen" timestamps, IoT readings, gaming state. Do not use it for financial transactions, audit logs, or anything regulated.',
      technical:
        'Good fits: (1) High-rate counters that coalesce well (views, likes, plays). (2) Telemetry / metrics ingestion where some loss is acceptable. (3) Session state (typically reconstructible). (4) Game state where the canonical write is to memory and DB persistence is for restart recovery. Bad fits: (1) Financial ledger entries — every write must be durable before ack. (2) Audit / compliance logs — regulators want an immutable record, not "best effort." (3) Anything where order of writes is observable to users (chat messages — coalescing or out-of-order delivery would corrupt conversation). (4) Workloads where DB schema does not tolerate idempotent retries (rare but possible). Hybrid: use write-through for critical paths, write-behind for non-critical aggregates within the same app.',
      example:
        'A gaming company used write-behind for player score updates (~50K writes/sec) but write-through for in-app purchase records (~50/sec). Same Redis cluster, two distinct write paths chosen explicitly per data class.',
    },
  ],

  comparison: {
    caption: 'Write-behind vs other write strategies.',
    columns: ['Aspect', 'Write-Through', 'Write-Behind', 'Cache-Aside (write+invalidate)', 'Direct DB Write'],
    rows: [
      ['Write latency', 'Cache + DB (~10ms)', 'Cache only (~1ms)', 'DB + invalidate (~10ms)', 'DB (~10ms)'],
      ['Write throughput', 'DB-bound', 'Very high (batched)', 'DB-bound', 'DB-bound'],
      ['Data durability', 'Strong (DB sync)', 'Weak (window of loss)', 'Strong', 'Strong'],
      ['Read consistency', 'Strong', 'Strong (cache is source)', 'TTL-bounded', 'Direct'],
      ['Coalescing benefit', '❌', '✅ Massive', '❌', '❌'],
      ['Cache failure impact', 'Writes fail', 'Data loss', 'Read slowdown only', 'None'],
      ['Best for', 'Strong consistency', 'High-rate counters / telemetry', 'General read-heavy', 'Low-rate writes'],
    ],
  },

  realWorldExamples: [
    {
      company: 'Twitter (Tweet Counters)',
      icon: '🐦',
      description:
        'View counts, retweets, and likes use a write-behind pattern: every interaction increments a Redis counter immediately; a background process flushes aggregates to MySQL every minute or so. Coalescing reduces 1M individual increments down to ~1 DB write for a viral tweet, making the system scalable to billions of interactions per day.',
    },
    {
      company: 'Stripe (Usage Metering)',
      icon: '💳',
      description:
        'Stripe Billing\'s metering ingests millions of usage events. Events are aggregated in Redis using write-behind: per-customer per-minute counters live in cache, flushed to Postgres every 30 seconds via batched UPSERTs. Without write-behind, the per-event write rate would require sharding Postgres heavily; with it, a few primary nodes suffice.',
    },
    {
      company: 'Gaming (King, Supercell)',
      icon: '🎮',
      description:
        'Mobile gaming companies use write-behind extensively for player score, currency, and inventory updates. Game servers update in-memory state immediately for snappy gameplay; persistence flushes happen every few seconds. Player-visible state is consistent (read from cache); loss of the last few seconds on rare cache crashes is recoverable from client-side checkpoints.',
    },
    {
      company: 'IoT Telemetry (AWS Greengrass, Azure IoT)',
      icon: '📡',
      description:
        'IoT platforms aggregate sensor readings in edge or regional caches, flushing batched writes to time-series DBs (Timestream, InfluxDB) periodically. Hundreds of thousands of devices each posting every second would overwhelm direct writes; write-behind compresses the load by orders of magnitude through batching and downsampling.',
    },
  ],

  interviewQuestions: [
    {
      question: 'Explain write-behind caching and its main benefit.',
      answer:
        'Write-behind: app writes go to the cache and are acknowledged immediately; a background worker flushes them to the database asynchronously, usually in batches. The main benefit is throughput — writes return in cache-speed (1ms) instead of DB-speed (10ms), and the DB receives batched writes instead of one-per-event, which can be 10–100× more efficient. Coalescing (multiple updates to the same key collapse to one DB write) is the multiplier that makes it dramatically scalable for hot-key workloads like view counters.',
    },
    {
      question: 'What are the main risks of write-behind?',
      answer:
        '(1) Data loss: data sits in cache memory until flushed; a cache crash before flush means it is gone. Mitigations: AOF persistence, cache replication, durable write-ahead log. (2) Backpressure: if DB is down, the dirty queue fills; eventually you must shed load. Mitigations: bounded queues, DLQ for failed writes. (3) Out-of-order or lost intermediate values: coalescing collapses updates, which is great for counters but loses intermediate states. (4) Operational complexity: monitoring queue depth, flush latency, batch failure rate. (5) Restart recovery: cache restart must rebuild dirty state or accept some data loss.',
    },
    {
      question: 'When would you choose write-behind over write-through?',
      answer:
        'Choose write-behind when write throughput is the bottleneck and modest data loss in failure scenarios is acceptable: high-rate counters (views, likes), telemetry, IoT, gaming state. Choose write-through when reads must immediately see writes with strong durability — financial transactions, inventory, audit logs. A common hybrid: write-through for critical / regulated data, write-behind for high-rate aggregates, both fronting the same DB.',
    },
    {
      question: 'How does coalescing work and why is it powerful?',
      answer:
        'Coalescing: when the same key is written multiple times before flush, the cache keeps only the latest value, and one DB write covers them all. The dirty queue is conceptually a set, not a list — repeated writes to the same key do not enqueue duplicate flush requests. Power example: a viral tweet getting 1M views/minute → 1M counter increments in Redis but only 1 UPDATE in MySQL per flush window. Without coalescing, write-behind is just batching; with coalescing, it is a fundamental throughput multiplier for hot-key workloads.',
    },
    {
      question: 'How would you architect a write-behind system that does not lose data?',
      answer:
        'Layer durability: (1) Write the request to a durable log (Kafka, Redis Streams with AOF) before any in-memory work — gives you a replayable record. (2) Cache writes the value and updates internal dirty queue. (3) Flusher reads from the log (or cache state) and writes to DB; commits offset / clears dirty flag only on successful DB ack. (4) On cache crash: replay from the log, or rebuild dirty state from primary records in the log. (5) Multi-AZ replication of cache + log for hardware failure tolerance. Net effect: even total cache loss is recoverable from the log; only loss of both Kafka and Redis (rare) creates data loss.',
    },
  ],

  commonMistakes: [
    'Using write-behind for financial / regulatory data — durability gap is unacceptable.',
    'Unbounded dirty queue — when DB has issues, queue fills cache memory until OOM.',
    'No coalescing on hot keys — write-behind degrades to plain batching, missing the order-of-magnitude win.',
    'Ignoring batch-failure handling — one bad row blocks the queue or silently drops everything.',
    'Forgetting to persist cache (AOF / replicas) — a single Redis restart erases unflushed data.',
    'Conflating write-behind with write-through — telling stakeholders writes are "durable" when they are not yet.',
    'No monitoring of flush lag — you only discover the problem when the queue is at 100% and writes are blocking.',
  ],
};
