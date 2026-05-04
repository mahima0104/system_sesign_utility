import type { ConceptDeepDive } from '../../types';

export const readThroughWriteThroughCache: ConceptDeepDive = {
  moduleId: 'read-through-vs-write-through-cache',
  tagline: 'Letting the cache do the talking — automatic loading and automatic persistence',

  introduction: {
    layman:
      'Read-through and write-through are caching patterns where the cache itself takes responsibility for talking to the database. With read-through, the application asks the cache for data and the cache silently fetches from the database on a miss. With write-through, when the application writes to the cache, the cache immediately writes through to the database. The application code only ever talks to the cache — the cache is the front door.',
    analogy:
      'A personal assistant. You (the app) never call the bank, the airline, or the hotel directly. You call your assistant (the cache). When you ask for your account balance, the assistant either remembers it (cache hit) or quietly calls the bank (read-through miss). When you ask to transfer money, the assistant updates their notebook and immediately makes the bank call before confirming back to you (write-through). You never see the underlying systems.',
    whyMatters:
      'Read-through and write-through centralize caching logic and let application code stay simple. They are the model for AWS DAX (DynamoDB), Hazelcast, Apache Ignite, and many ORM second-level caches. Senior engineers must understand when their advantages (consistency, simplicity at the call site) outweigh their cost (cache becomes a critical dependency, harder to bypass) compared to cache-aside.',
  },

  subTopics: [
    {
      title: 'Read-Through — How It Works',
      icon: '📖',
      layman:
        'The cache is configured with a "loader function" that knows how to fetch from the database. When the application asks for a key, the cache checks its memory; on a miss, it calls the loader, stores the result, and returns it — all transparently. The application has no idea whether it was a hit or a miss.',
      technical:
        'Architecture: cache layer is configured with read-through capability and a loader callback (e.g., (key) => db.query(key)). On cache.get(key) miss, the cache invokes the loader synchronously, stores the result with a configured TTL, and returns it. The miss handling logic lives in the cache layer (or a sidecar like AWS DAX) — application code is identical for hits and misses. Many caches deduplicate concurrent misses on the same key (single-flight) by default, neutralizing stampedes for free. Examples: AWS DAX, Caffeine\'s LoadingCache, Guava\'s CacheLoader, Hibernate second-level cache, Apache Ignite\'s read-through configuration.',
      example:
        'Caffeine LoadingCache in Java: LoadingCache<String, User> users = Caffeine.newBuilder().maximumSize(10_000).expireAfterWrite(5, MINUTES).build(key -> userRepo.findById(key)); — the call site is just users.get("user42") and the loader runs only on miss, with built-in single-flight dedup.',
      whenToUse:
        'Use read-through when many call sites share identical cache logic and you want to factor it out. Strong fit when paired with caches that offer single-flight to neutralize stampedes for free. Avoid when cache outage cannot translate into application outage — read-through couples your app\'s read path to the cache layer.',
    },
    {
      title: 'Write-Through — How It Works',
      icon: '✏️',
      layman:
        'Every write goes through the cache: the app writes to the cache, the cache immediately persists to the database, and only after the database confirms does the cache acknowledge the write to the app. Reads always see the latest value because the cache and database are always in sync.',
      technical:
        'Flow: app calls cache.set(key, value); cache writes value to its own memory AND issues db.write(key, value); only after both succeed does cache.set return success. If the DB write fails, the cache rolls back (or retries, or surfaces the error). Pros: read consistency is strong — any read after a successful write sees the new value. No invalidation race. Cons: write latency = cache latency + DB latency (slower than direct DB writes); cache becomes a critical write-path dependency; if the cache is down, writes fail. Many implementations support synchronous write-through (block until DB acks) or asynchronous (queue the DB write — but that is closer to write-behind, not pure write-through).',
      example:
        'Hazelcast IMap with MapStore: configure write-through and Hazelcast persists every put to the underlying RDBMS before acknowledging to the app. Used heavily for distributed caches in financial applications where strong consistency is required.',
      whenToUse:
        'Use write-through when (a) reads must see writes immediately with no eventual-consistency window, (b) the write rate is low enough that the DB latency surcharge is acceptable, (c) the cache is stable enough to be a write-path dependency. Often combined with read-through for symmetry.',
    },
    {
      title: 'Combining Read-Through + Write-Through',
      icon: '🔁',
      layman:
        'In production, read-through and write-through are usually used together. The cache is the front door for both reads and writes. The database becomes a system of record that the cache talks to on the user\'s behalf.',
      technical:
        'In a combined R/T + W/T setup: every read goes via cache (loader on miss), every write goes via cache (writer on each set). Cache is always at least as fresh as the database; cache and DB cannot drift. This is the model behind a "system of engagement" sitting in front of a "system of record." Architecturally: cache layer (Redis Enterprise, Hazelcast, Ignite, DAX) plus persistence plugin. Apps write code as if the cache were a database. Dual writes are handled by the cache, not the application code. Caveat: the cache layer\'s reliability and persistence story now matters as much as the database\'s — multi-AZ replication, restart recovery, and write durability are required.',
      example:
        'Many trading systems use Hazelcast + RDBMS in this pattern: order books are read-through (sub-millisecond reads from RAM, falls back to DB for cold orders), and order writes are write-through (persisted in RDBMS within the request, with cache holding the canonical state for the rest of the day).',
    },
    {
      title: 'Latency & Consistency Tradeoffs',
      icon: '⚖️',
      layman:
        'Write-through is slower than write-back or fire-and-forget because every write waits for the database. The payoff is that reads always see writes — there is no "eventual consistency" window where the cache and database disagree.',
      technical:
        'Write-through write latency = cache_set + db_write ≈ 1ms + 10ms ≈ 11ms. Pure DB write ≈ 10ms. Write-back (async) ≈ 1ms. So write-through adds ~10% overhead in the typical case but eliminates dual-write races. Read consistency: strict — any read after a successful write sees the new value (assuming single cache instance or strong replication; with async cache replication, replicas can lag). For multi-region: write-through to primary, async replicate cache + DB to remote regions, accept seconds of regional staleness. Compare to cache-aside with TTL=300: reads can see stale data for up to 5 minutes, which is unacceptable for some workloads.',
      example:
        'A banking app showing balances: write-through ensures the balance update from a deposit is reflected in the next account-summary read with zero staleness. Cache-aside with 60s TTL would risk showing the old balance for up to 60 seconds — unacceptable for the user experience even if not a correctness bug.',
    },
    {
      title: 'Failure Handling & Operational Concerns',
      icon: '🛠️',
      layman:
        'Read-through and write-through make the cache a critical part of the system. If the cache fails, reads might fall back to the database (slower but working) or might fail entirely (depending on configuration). For write-through, a cache failure means writes fail.',
      technical:
        'Failure modes: (1) Read-through DB fails — loader throws, cache surfaces the error to the app. Should the cache return stale data if available? Configurable. (2) Read-through cache fails — app reads break unless explicit fallback to direct DB access exists. Some libraries (Caffeine) hold an in-process L1 even when the L2 cache is down. (3) Write-through DB fails — cache must roll back its in-memory write, or it diverges from the DB. Some implementations queue retries, but that is write-behind territory. (4) Write-through cache fails — write rejected (or app falls back to direct DB write, reintroducing dual-write hazard). Operational implications: cache uptime SLA must match or exceed DB SLA; cache must be replicated; cache restart recovery must repopulate quickly to avoid a flood of misses to DB.',
      example:
        'AWS DAX (read-through + write-through over DynamoDB) has automatic failover between cluster nodes. If a DAX node fails, writes route to a healthy node. If the entire DAX cluster fails, the app must explicitly fall back to the underlying DynamoDB endpoint — a code path that should be tested regularly.',
    },
    {
      title: 'Read-Through vs Cache-Aside — The Decision',
      icon: '🤔',
      layman:
        'Cache-aside leaves the cache decision in the application: you can opt out, log misses, switch caches without rewriting business logic. Read-through hides the decision: simpler call sites, but the cache becomes a dependency of every read. Most general-purpose web apps lean cache-aside; specialized data layers (DAX, Ignite, Hibernate L2) lean read-through.',
      technical:
        'Pick read-through when: you have many call sites with identical caching policy; you want stampede protection (single-flight) built in; you operate within a managed-cache layer that supports it (DAX, Hazelcast, Ignite). Pick cache-aside when: caching policies vary per call site; you want the application to remain functional during cache outage by simply falling back; you want explicit observability into hit/miss at each call site; you may want to migrate caches without coupling business logic to a specific cache product.',
      example:
        'A team building a high-traffic e-commerce site: product detail pages use cache-aside in Redis (call sites vary, fall back to MySQL on cache outage). Internal microservices that all need consistent low-latency reads of product master data use AWS DAX or read-through Caffeine to avoid duplicating cache logic across services.',
    },
  ],

  comparison: {
    caption: 'Read-through, write-through, cache-aside, and write-back compared.',
    columns: ['Aspect', 'Cache-Aside', 'Read-Through', 'Write-Through', 'Write-Back'],
    rows: [
      ['Read on miss', 'App fetches from DB', 'Cache fetches from DB', 'N/A', 'N/A'],
      ['Write path', 'App writes DB + invalidates cache', 'App writes DB + invalidates cache', 'Cache writes DB synchronously', 'Cache writes DB asynchronously'],
      ['Read consistency', 'TTL-bounded staleness', 'TTL-bounded staleness', 'Strong (post-write)', 'TTL-bounded staleness'],
      ['Write latency', 'DB only', 'DB only', 'Cache + DB', 'Cache only'],
      ['Cache failure tolerance', 'High (fall back to DB)', 'Medium', 'Low (writes fail)', 'Low (data loss risk)'],
      ['Stampede protection', 'Manual (locks/early refresh)', 'Often built-in (single-flight)', 'N/A', 'N/A'],
      ['Best for', 'General read-heavy apps', 'Centralized policy', 'Strong-consistency reads', 'Write-heavy with tolerance'],
    ],
  },

  realWorldExamples: [
    {
      company: 'AWS DAX (DynamoDB Accelerator)',
      icon: '☁️',
      description:
        'DAX is a fully managed read-through and write-through cache for DynamoDB. Apps use DynamoDB SDK calls; DAX silently caches reads and forwards writes. Reads drop from ~10ms to ~1ms; the application code is identical to direct DynamoDB code, just pointed at the DAX endpoint. Heavily used by gaming companies (King, Supercell) for hot leaderboards and player profile lookups.',
    },
    {
      company: 'Hazelcast IMap',
      icon: '🌌',
      description:
        'Hazelcast\'s IMap is an in-memory distributed map that supports read-through and write-through via a MapStore plugin. Banks and brokerages use it to front Oracle/MySQL with sub-millisecond access while preserving strong consistency. The "MapStore" abstraction hides the DB; application code only ever calls map.get / map.put.',
    },
    {
      company: 'Hibernate Second-Level Cache',
      icon: '🐘',
      description:
        'Hibernate (Java ORM) supports a read-through second-level cache via providers like Ehcache, Infinispan, or Hazelcast. When an entity is requested, Hibernate first asks the cache; on miss, it loads from DB and populates. For applications already using Hibernate, this is essentially zero-config caching of entity reads.',
    },
    {
      company: 'Apache Ignite',
      icon: '🔥',
      description:
        'Apache Ignite is a memory-centric data grid with first-class read-through and write-through to RDBMS or NoSQL. Used in fintech and IoT for hot data layers. Write-through ensures the data lake/warehouse stays in sync with in-memory operational data without a separate ETL pipeline.',
    },
  ],

  interviewQuestions: [
    {
      question: 'Explain the difference between cache-aside and read-through.',
      answer:
        'In cache-aside, the application code itself manages the cache: it reads from cache, on miss queries the DB, and writes back to cache. The DB and cache are independent components from the app\'s perspective. In read-through, the cache layer is configured with a loader function — the app only calls cache.get, and the cache transparently calls the DB on miss. Read-through centralizes the miss-handling logic and often includes single-flight dedup (preventing stampedes), but it makes the cache a hard dependency of the read path.',
    },
    {
      question: 'When would you choose write-through over cache-aside\'s "write DB then invalidate"?',
      answer:
        'Write-through wins when reads must see writes with zero staleness — banking balances, inventory after a checkout, anything where the brief invalidation race in cache-aside is unacceptable. Write-through also wins when many call sites share identical write logic and you want to factor out the cache+DB coordination. The cost is write latency (cache + DB instead of just DB) and tighter coupling between cache uptime and write path. For most general web apps, cache-aside\'s simplicity and resilience to cache outage is preferred; write-through is reserved for specialized strong-consistency scenarios.',
    },
    {
      question: 'What happens to writes if the cache layer fails in a write-through setup?',
      answer:
        'In a synchronous write-through, the write fails — the application sees an error. This is by design: the cache and DB must remain in sync. Some systems offer fallback paths: route the write directly to the DB and accept temporary cache inconsistency until repair. Others queue the write internally for retry (now you are doing write-behind, with all its data-loss risks). The operational implication is that cache uptime must match or exceed DB uptime — cache replication, multi-AZ deployment, and fast restart recovery are not optional.',
    },
    {
      question: 'How does read-through handle cache stampedes compared to cache-aside?',
      answer:
        'Many read-through implementations include single-flight (request coalescing) for free: if 1000 concurrent requests miss the same key, only one calls the loader; the other 999 wait for that result. Caffeine, Guava, and Hazelcast all do this by default. In cache-aside, you must implement this yourself with distributed locks, probabilistic early expiration, or stale-while-revalidate. So read-through often gives stampede protection out of the box; cache-aside requires explicit work.',
    },
    {
      question: 'Why is write-through slower than cache-aside on writes?',
      answer:
        'Cache-aside on writes: app writes to DB (10ms), then deletes cache key (1ms in parallel) — net ~10ms. Write-through: app writes to cache (1ms), cache writes to DB (10ms) synchronously, cache acks (1ms) — net ~11–12ms. The overhead is small but real, and it scales with the number of writes. For write-heavy systems (event ingestion, telemetry), this overhead is significant. Cache-aside also lets you optimize: batch DB writes, write asynchronously to cache, etc. — flexibility write-through trades away.',
    },
  ],

  commonMistakes: [
    'Choosing write-through for write-heavy workloads — the cache + DB latency on every write becomes a bottleneck.',
    'Forgetting that read-through couples app liveness to cache liveness — no fallback path means cache outage = app outage.',
    'Using async writes inside a "write-through" — that is actually write-behind, with data-loss risk on cache crash.',
    'Configuring single-flight dedup (good) without timeout protection (bad) — a slow loader blocks all waiters indefinitely.',
    'Treating read-through cache as a database — the underlying DB is still the system of record, and the cache must be repopulatable.',
    'Not testing the cache-failure code path — the fallback to direct DB only works if it is exercised before a real outage.',
  ],
};
