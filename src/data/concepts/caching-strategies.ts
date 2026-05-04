import type { ConceptDeepDive } from '../../types';

export const cachingStrategies: ConceptDeepDive = {
  moduleId: 'caching-strategies',
  tagline: 'Five caching strategies, one decision framework — when to use each',

  introduction: {
    layman:
      'There are five well-known patterns for moving data between an application, a cache, and a database: cache-aside, read-through, write-through, write-around, and write-back. They differ in who is responsible for filling the cache, how writes are handled, and what consistency and durability guarantees you get. Picking the right one is the difference between a performant system and one that loses data or melts under load.',
    analogy:
      'Stocking a small corner shop. You can: (1) only stock what customers ask for (cache-aside), (2) hire a smart shelf manager who fetches from the warehouse on demand (read-through), (3) update both the shelf and the warehouse on every delivery (write-through), (4) put new stock straight into the warehouse, only on the shelf when someone asks (write-around), or (5) take orders, write them on a notepad, and update the warehouse later in batches (write-back). Each strategy fits a different shop.',
    whyMatters:
      'The strategy choice is one of the highest-impact decisions in system design. The wrong pattern at the wrong scale causes data loss, performance regressions, or cache stampedes. Interviewers test this exhaustively because the trade-offs (consistency, throughput, latency, durability, complexity) are the building blocks of every distributed system.',
  },

  subTopics: [
    {
      title: 'Cache-Aside (Lazy Loading)',
      icon: '🪟',
      layman:
        'The application checks the cache first; on a miss, it queries the database, then stores the result in the cache. Writes go directly to the database, and the cache entry is invalidated. The cache "sits aside" the data path — never required, always optional.',
      technical:
        'Read: cache.get → on miss, db.query → cache.set → return. Write: db.write → cache.delete (invalidate). Pros: simple, robust to cache failure (just bypass), full app control over key shape and TTL. Cons: every miss takes both cache and DB latency; risk of stampede on hot keys; invalidation races on concurrent writes/reads. Most popular pattern in production. Examples: Redis with most web frameworks (Rails.cache, Django cache, Spring @Cacheable in manual mode).',
      example:
        'Instagram caches user profiles in Redis with cache-aside: GET cache → on miss, query Postgres, populate cache, return. On profile update, the write path invalidates the cache key. Hit rates exceed 95% on hot pages, with Postgres handling under 5% of profile reads.',
      whenToUse:
        'Default choice for read-heavy workloads. Use when caching policies vary across call sites, when cache outage must not bring down the app, or when you want full observability and control over cache behavior.',
    },
    {
      title: 'Read-Through',
      icon: '🚪',
      layman:
        'The application talks only to the cache. The cache itself knows how to fetch from the database — when the data is missing, the cache transparently loads it. The application never directly queries the database.',
      technical:
        'Cache configured with a loader function. Read: app calls cache.get(key) → cache checks memory; on miss, cache calls loader (db.query) and stores result; cache returns. Pros: centralized miss-handling logic, single-flight stampede protection often built in, cleaner call sites. Cons: cache becomes critical dependency of read path; if cache is down, reads fail unless explicit fallback exists. Examples: AWS DAX, Caffeine\'s LoadingCache, Hazelcast read-through MapStore, Hibernate L2 cache.',
      example:
        'AWS DAX in front of DynamoDB: app code uses the DynamoDB SDK pointed at the DAX endpoint. DAX silently caches reads and forwards writes. Read latency drops from ~10ms to ~1ms with no application code changes.',
      whenToUse:
        'Use when many call sites share identical cache logic and you want it factored into one place; when you operate within a managed cache (DAX, Ignite) that supports it natively; when stampede protection out of the box matters more than control.',
    },
    {
      title: 'Write-Through',
      icon: '➡️',
      layman:
        'On every write, the application updates the cache and the cache synchronously updates the database before acknowledging. Reads always see the latest value. Strong consistency, slower writes.',
      technical:
        'Write: app calls cache.set(key, value); cache stores in memory + writes synchronously to DB; cache acks only after DB ack. Pros: strict read consistency (no invalidation race), simplifies reasoning. Cons: write latency = cache + DB; cache becomes write-path dependency; if DB write fails, cache must roll back or surface the error. Examples: Hazelcast/Ignite with synchronous MapStore, AWS DAX with write-through, financial-grade in-memory grids.',
      example:
        'Banking apps using Hazelcast IMap with synchronous MapStore: every account-balance update is written to both Hazelcast and Oracle in one synchronous operation. Subsequent balance reads from any region always see the latest value with no staleness window.',
      whenToUse:
        'Use when reads must immediately see writes with zero staleness — banking balances, inventory after checkout, anything where the brief invalidation window is unacceptable. Avoid for write-heavy workloads where DB-latency-per-write is the bottleneck.',
    },
    {
      title: 'Write-Around',
      icon: '↪️',
      layman:
        'Writes go directly to the database; the cache is not touched on the write path. The cache fills lazily on subsequent reads (like cache-aside). Useful when written data is not necessarily about to be read.',
      technical:
        'Write: app writes to DB only; cache is left alone (or invalidated if it had a stale entry). Read: cache.get → on miss, db.query → cache.set → return. Pros: cache memory not polluted by write-only or rarely-read data; lower write latency than write-through. Cons: first read after write always misses (latency spike); useful only when read patterns are predictable. Examples: log ingestion systems where most events are never read individually; bulk import pipelines where reads come days later.',
      example:
        'Netflix uses write-around for viewing-history events: the play/pause/scrub events go straight to Cassandra (write-optimized), with no cache write. The cache populates only when a user later loads "Continue Watching" — keeping the cache full of actually-read data, not high-volume writes.',
      whenToUse:
        'Use when written data is not read immediately and would only pollute the cache. Common for logs, metrics, audit trails, and bulk-loaded data with cold reads.',
    },
    {
      title: 'Write-Back (Write-Behind)',
      icon: '🔄',
      layman:
        'Writes go to the cache and are acknowledged immediately; the cache asynchronously persists to the database in batches. Highest throughput, weakest durability — the cache holds data temporarily and could lose it on crash.',
      technical:
        'Write: app calls cache.set; cache stores in memory + enqueues for background flush; ack returned in cache-speed (~1ms). Background flusher batches dirty keys and writes to DB. Pros: throughput dramatically higher (10–100×) than write-through, especially with coalescing; reduces DB write rate. Cons: cache crash = data loss for unflushed writes; complex failure modes (DLQ, backpressure, DB outage handling). Examples: Twitter view counts, Stripe usage metering, gaming score updates, IoT telemetry.',
      example:
        'Twitter\'s view counts: every tweet view increments a Redis counter immediately; a background flusher writes batched aggregates to MySQL once per minute. Coalescing reduces 1M view increments on a viral tweet to a single DB UPDATE per flush — the only way the system can scale to billions of daily interactions.',
      whenToUse:
        'Use for write-heavy, latency-sensitive workloads where small data-loss windows are tolerable: telemetry, counters, gaming state, metrics. Avoid for financial / regulatory data.',
    },
    {
      title: 'The Decision Framework',
      icon: '🧭',
      layman:
        'Pick by answering four questions: How read-heavy is the workload? How important is consistency? How important is write throughput? How tolerant is the system to cache failure? The answers map directly to a strategy.',
      technical:
        'Decision tree: (1) Is the workload read-heavy with tolerable staleness? → Cache-aside (default) or Read-through (if you want centralized policy). (2) Must reads see writes immediately? → Write-through (often paired with read-through). (3) Are writes the bottleneck and some loss is OK? → Write-back. (4) Are written items rarely read soon after? → Write-around. (5) Should the app stay up if cache is down? → Cache-aside (only one with natural DB fallback). Combine patterns within one app: write-through for critical data, write-back for high-rate counters, cache-aside for general reads — all in the same Redis fleet.',
      example:
        'A typical e-commerce architecture: product catalog uses cache-aside (read-heavy, small staleness OK), inventory writes use write-through (must reflect immediately on next read to prevent overselling), analytics events use write-back to a time-series DB (millions of writes/sec, modest loss tolerated), and audit logs use write-around (writes go to cold storage, rarely re-read).',
    },
  ],

  comparison: {
    caption: 'All five caching strategies compared on key dimensions.',
    columns: ['Aspect', 'Cache-Aside', 'Read-Through', 'Write-Through', 'Write-Around', 'Write-Back'],
    rows: [
      ['Read miss handler', 'App', 'Cache (loader)', 'N/A', 'App', 'N/A'],
      ['Write path', 'DB + invalidate', 'DB + invalidate', 'Cache → DB sync', 'DB only', 'Cache → DB async'],
      ['Read consistency', 'TTL-bounded', 'TTL-bounded', 'Strong', 'TTL-bounded', 'Strong (cache is source)'],
      ['Write latency', 'DB', 'DB', 'Cache + DB', 'DB', 'Cache only'],
      ['Write throughput', 'DB-bound', 'DB-bound', 'DB-bound', 'DB-bound', 'Very high (batched)'],
      ['Durability', 'Strong', 'Strong', 'Strong', 'Strong', 'Window of risk'],
      ['Cache failure tolerance', 'High', 'Low', 'Low', 'High', 'Data loss risk'],
      ['Stampede risk', 'High (manual fix)', 'Low (built in)', 'N/A', 'High', 'N/A'],
      ['Best for', 'General reads', 'Centralized policy', 'Strong consistency', 'Cold writes', 'High-rate counters'],
    ],
  },

  realWorldExamples: [
    {
      company: 'Amazon (mixed strategies)',
      icon: '📦',
      description:
        'Amazon\'s product detail pages use cache-aside in front of DynamoDB. Inventory uses write-through (must reflect immediately to prevent overselling). Order events use write-back to durable streams (Kinesis) for analytics. Audit logs use write-around (rare reads). One e-commerce platform, all five strategies coexisting.',
    },
    {
      company: 'Netflix (read-through + write-around)',
      icon: '🎬',
      description:
        'Netflix uses EVCache (Memcached) primarily as cache-aside for personalized rows. For viewing history, they use write-around: viewing events go straight to Cassandra (write-optimized), and the cache fills only when a user revisits. Heavy writes do not pollute the cache.',
    },
    {
      company: 'Twitter (write-back for counters)',
      icon: '🐦',
      description:
        'Twitter\'s like/retweet/view counters use write-back: increments hit Redis instantly, and a background flusher writes batched aggregates to MySQL every minute or so. Without this, the per-event DB write rate would be unsupportable for viral content.',
    },
    {
      company: 'Banking apps (write-through for balances)',
      icon: '🏦',
      description:
        'Major banks use write-through with Hazelcast or Ignite for account balance updates. Reads must reflect the most recent transaction immediately — invalidation races would create user-visible bugs. Write latency is acceptable because balance updates happen at a low absolute rate per account.',
    },
  ],

  interviewQuestions: [
    {
      question: 'Walk me through the five caching strategies and when you would use each.',
      answer:
        'Cache-aside: app manages cache; read-through DB on miss, write to DB then invalidate cache. Default for general reads. Read-through: cache itself loads from DB on miss. Use when many call sites need identical caching policy. Write-through: every write goes cache→DB synchronously. Use for strong-consistency reads. Write-around: writes go directly to DB, cache populated lazily on read. Use when written data is rarely read soon. Write-back: writes go to cache, async flushed to DB. Use for high-rate counters and telemetry where some loss is acceptable.',
    },
    {
      question: 'In what scenarios would write-around outperform write-through?',
      answer:
        'Write-around wins when written data is unlikely to be read soon. Examples: log ingestion, audit trails, bulk imports, time-series writes that are queried only by aggregation jobs. Write-through would pollute the cache with rarely-read entries, evicting more valuable hot data. Write-around keeps the cache focused on actually-read data; the price is that the first read of any new record is a miss.',
    },
    {
      question: 'Can you combine these strategies in a single application?',
      answer:
        'Yes — large systems mix strategies per data class. Common pattern: cache-aside for general reads, write-through for strong-consistency entities (inventory, balances), write-back for high-rate counters, write-around for cold writes (logs). All can coexist in one Redis fleet. The key is to choose explicitly per data class based on read/write ratio, consistency requirement, and durability tolerance.',
    },
    {
      question: 'How do you decide between cache-aside and read-through?',
      answer:
        'Cache-aside: app keeps explicit control; cache outage falls back to DB; great when you have many distinct call sites with different policies. Read-through: cache layer owns the loader; simpler call sites; usually includes single-flight stampede protection; tighter coupling to cache uptime. Pick read-through when you have a managed cache (DAX, Ignite) and uniform caching policy. Pick cache-aside when you want the app to remain functional during cache outage and you need per-site policy flexibility.',
    },
    {
      question: 'What are the durability tradeoffs across these strategies?',
      answer:
        'Cache-aside, read-through, write-through, write-around all have strong durability — the DB is always the source of truth and writes commit before ack (write-through) or write directly (others). Write-back is the outlier: writes commit only to cache initially; data lives in cache memory for the flush window. A cache crash before flush loses those writes. Mitigations: cache persistence (Redis AOF), durable write-ahead log (Kafka before Redis), bounded queue, replicated cache.',
    },
  ],

  commonMistakes: [
    'Using write-through for write-heavy workloads — every write pays DB latency, throughput collapses.',
    'Using write-back for financial data — the durability gap creates real risk.',
    'Treating "cache-aside" as the only pattern — missing the write-back gains for hot counters or write-around for cold writes.',
    'Not thinking about cache failure — read-through and write-through couple liveness to cache uptime.',
    'Mixing strategies without thinking about the cache layer — write-back keys and cache-aside keys evicting each other in shared memory creates unpredictable behavior.',
    'Choosing the strategy first, then trying to retrofit consistency requirements — start with the consistency / durability needs and let the strategy fall out.',
  ],
};
