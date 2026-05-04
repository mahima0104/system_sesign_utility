import type { ConceptDeepDive } from '../../types';

export const cacheInvalidation: ConceptDeepDive = {
  moduleId: 'cache-invalidation',
  tagline: 'There are only two hard things in computer science: cache invalidation, naming things, and off-by-one errors',

  introduction: {
    layman:
      'Cache invalidation is the act of removing or marking-stale a cache entry when the underlying data changes. Get it wrong, and users see old data. Get it too aggressive, and your cache is useless. Get the timing wrong, and you create race conditions where the cache and the database disagree. Phil Karlton\'s famous quip — "there are only two hard things in computer science: cache invalidation and naming things" — has aged remarkably well.',
    analogy:
      'A printed price tag in a store. When the actual price changes (in the back-office system), every tag in the aisle is now wrong. You need a process to find every wrong tag and replace it. Miss one, and a customer pays the wrong price. Replace too eagerly, and you waste labor. Replace at exactly the wrong moment (mid-purchase), and you create a "saw old price, charged new price" complaint. Cache invalidation is exactly this problem at network scale.',
    whyMatters:
      'Almost every production cache bug — stale data, race conditions, security leaks, "ghost" entries — traces back to invalidation. Senior engineers must know the canonical strategies (TTL, explicit, CDC-driven, versioned), the race conditions each strategy creates, and the mitigations. This is one of the deepest, most practically important caching topics.',
  },

  subTopics: [
    {
      title: 'Why Invalidation Is Hard',
      icon: '😩',
      layman:
        'Two systems hold the same data: the source (database) and the cache. Every change must propagate from source to cache, in the right order, at the right time, while concurrent reads and writes are happening. Any timing mismatch can leave the cache with stale data — sometimes for seconds, sometimes forever.',
      technical:
        'Fundamental challenges: (1) The cache and database are physically separate systems with independent failure modes. (2) Multiple writers can race — two updates land in different orders at DB and cache. (3) Multiple readers between a write and an invalidation can repopulate stale data. (4) Distributed caches replicate; invalidation must propagate to all replicas. (5) Caches at multiple layers (browser, CDN, app, distributed) all need invalidation. (6) Some events that should invalidate are not direct writes (e.g., a permission revocation that affects whether a cached document should be served). Invalidation is fundamentally a distributed coordination problem and inherits all the complexity that brings.',
      example:
        'Reddit had a famous outage where stale moderator-removed comments stayed visible for hours. The fix required moving invalidation off the application code path and onto a CDC stream — making invalidation correct at any timing of writes.',
    },
    {
      title: 'Strategy 1 — TTL Only (Time-Based Expiry)',
      icon: '⏱️',
      layman:
        'The simplest strategy: every cache entry has an expiration time. After that time, the entry is gone, and the next read fetches fresh data. No explicit invalidation — staleness is bounded but never eliminated.',
      technical:
        'Set a Time-To-Live (e.g., 60 seconds, 5 minutes) when storing. Cache automatically removes the entry on expiry (lazy or active). Pros: simple, no coordination, no race conditions, works across distributed caches without messaging. Cons: staleness window equal to TTL; long TTL = more stale, short TTL = more origin load. Tuning: pick TTL based on tolerance for stale data and cost of a miss. Combine with stale-while-revalidate (serve old while refreshing in background) to reduce miss latency. Best for: data where bounded staleness is acceptable (product details, user profiles, geographic lookups).',
      example:
        'Most modern web apps cache user profiles for 5 minutes. If you change your profile photo, your friends might still see the old one for up to 5 minutes — acceptable for a social product. Replacing this with explicit invalidation would 10× the engineering complexity for marginal user experience improvement.',
      whenToUse:
        'Default for read-heavy data with bounded-staleness tolerance. Use TTL alone unless you have a specific reason for tighter consistency.',
    },
    {
      title: 'Strategy 2 — Explicit Invalidation on Write',
      icon: '✋',
      layman:
        'When the application writes data, it also tells the cache "this entry is now stale" — usually by deleting the cache key. The next read repopulates from the source. Tighter consistency than TTL alone, but introduces race conditions.',
      technical:
        'Pattern: db.write(key, value); cache.delete(key). Most common; works with cache-aside. The race condition: between the DB write and the cache delete, a reader can populate the cache with the old value. Specifically, the "dual-read race": Reader R queries DB (gets old value), then Writer W updates DB and deletes cache, then Reader R writes the old value into the now-empty cache. Mitigations: (1) Double-deletion — delete, sleep 500ms, delete again, defeating any in-flight reader. (2) Order matters — some prefer cache.delete then db.write, but this creates an inconsistency window where reads see stale data even though writes have happened (no clear winner; both have edge cases). (3) Two-phase invalidation: mark entry as "invalidating" first, then write, then delete; readers see "invalidating" and bypass cache. Real systems usually accept the rare race + short TTL as a backstop.',
      example:
        'Stripe pattern: UPDATE customers SET ...; cache.delete("customer:" + id); publish CDC event. The CDC consumer issues a second invalidation 1s later — defeating any reader that populated stale data in the brief race window.',
    },
    {
      title: 'Strategy 3 — CDC-Driven Invalidation',
      icon: '📡',
      layman:
        'Instead of invalidating from application code, you watch the database\'s change log (Change Data Capture) and invalidate the cache whenever any write happens — regardless of which app server made the change. This eliminates the "another writer forgot to invalidate" problem entirely.',
      technical:
        'Architecture: DB write → DB transaction log → CDC tool (Debezium, AWS DMS, Maxwell) → message queue (Kafka) → cache invalidator service → cache. Pros: any writer (app, batch job, manual SQL) triggers invalidation; no risk of forgetting; downstream of the actual write so timing is naturally correct. Cons: extra infrastructure (Debezium, Kafka, invalidator); some lag between write and invalidation (hundreds of ms typical). Race condition still exists in the brief window between the DB commit and the invalidation message arriving — but it is much smaller and predictable. Best for: high-stakes correctness where the application code path cannot be trusted to invalidate, or where there are many writers (microservices, batch jobs).',
      example:
        'LinkedIn uses Apache Kafka + Brooklin to stream MySQL/Espresso writes to caches across the platform. Every write to the source generates an invalidation message; every cache subscribes to relevant streams. Result: cache consistency without coupling to application code.',
    },
    {
      title: 'Strategy 4 — Versioned Keys',
      icon: '🔢',
      layman:
        'Instead of deleting cache entries on write, you change the cache key. A small "version pointer" tracks the current version of each entity. Reads use the current version in their cache lookup. When data changes, the version pointer increments, old keys become orphaned, and the next read fetches fresh.',
      technical:
        'Pattern: store cache:user:42:v = 7 (version pointer). Reads do GET cache:user:42:v → 7, then GET cache:user:42:7 (the actual data). Writes: increment cache:user:42:v → 8, optionally populate cache:user:42:8. Old key cache:user:42:7 becomes unreachable but still in cache until TTL. Pros: stale population by an in-flight reader is harmless (writes the old version key, which is no longer referenced). Eliminates the dual-read race entirely. Cons: every read becomes 2 cache calls (mitigate with pipelining or local micro-cache of versions); old versioned keys consume memory until TTL. Variant: hash the version into the key (cache:user:42:v7) so version pointer is implicit.',
      example:
        'Pinterest uses versioned keys for board metadata to avoid invalidation races across many regions. Bumping a version is a single atomic INCR. Old versioned keys are evicted by LRU within minutes. Tradeoff is small memory overhead vs eliminating an entire class of race conditions.',
    },
    {
      title: 'Distributed Invalidation — Multi-Region & Multi-Layer',
      icon: '🌐',
      layman:
        'When you have caches in multiple regions, multiple layers (CDN, Redis, app), and multiple data centers, a single invalidation must propagate to all of them. Some layers are far away, some are slow to invalidate, and some you cannot directly control.',
      technical:
        'Layered invalidation: an update must propagate top-down. (1) CDN purge (URL or tag-based) — slowest, expensive, often async. (2) Distributed cache invalidate — Redis Cluster broadcasts via pub/sub or via CDC stream. (3) App-local in-memory cache invalidate — message bus (Kafka, NATS) so each app instance receives the invalidation. (4) Browser cache invalidate — only via cache-busting URLs (you cannot reach into a browser). Cross-region: each region has its own cache; invalidations must be replicated cross-region (Kafka replication, multi-region pub/sub). Accepts seconds of lag. Best practice: design TTLs so even if invalidation fails, staleness is bounded.',
      example:
        'A global e-commerce site updating a product price: (1) DB write in primary region. (2) CDC event published to Kafka (replicated to all regions). (3) Each region\'s cache invalidator receives event and DELs the relevant Redis keys. (4) CDN purge issued in parallel. (5) App-local LRUs in each app pod receive a Kafka invalidation message. End-to-end propagation: ~2–5 seconds globally.',
    },
    {
      title: 'Race Conditions & How to Reason About Them',
      icon: '🏁',
      layman:
        'Race conditions in invalidation come from interleaving concurrent reads and writes such that the cache ends up with old data. They are subtle, hard to reproduce, and often only show up at scale. Understanding the timing diagrams is essential.',
      technical:
        'Classic dual-read race: T0: Reader A queries cache (miss). T1: Reader A queries DB (gets value V1). T2: Writer updates DB (V1 → V2). T3: Writer invalidates cache. T4: Reader A populates cache with V1. Result: cache holds V1, DB holds V2. Will return stale until next invalidation or TTL. Solutions: (1) Double-delete with delay > expected read latency. (2) Versioned keys (Reader A populates an orphaned old version key). (3) CDC-driven invalidation (Reader A might still race, but a second invalidation fires when the change reaches the CDC stream). (4) Locks during write — expensive. (5) Sentinel values during write window — block reads briefly. Real systems combine 2–3 mitigations and accept tiny residual races bounded by TTL.',
      example:
        'Redis has a documented pattern called "delete twice with delay": cache.del(key); db.update(...); sleep(500ms); cache.del(key). The delayed second delete defeats any concurrent read that populated the cache with stale data during the first delete.',
    },
    {
      title: 'Special Cases — Negative Caching, Wildcard Invalidation',
      icon: '🎯',
      layman:
        'Some invalidation problems are tricky in their own right: invalidating "not found" results when an entity is created, invalidating a whole class of cache entries (all products in a category) at once, and invalidating cached query results when underlying rows change.',
      technical:
        '(1) Negative cache invalidation — when an entity is created, the cached "404" must be invalidated. Pattern: on create, invalidate the negative entry explicitly. (2) Wildcard / category invalidation — Redis SCAN + DEL pattern is slow at scale. Better: tag-based caches (cache.tag("category:5", key)) and invalidate by tag. Or use versioned categories: incrementing the category version invalidates all members at once. (3) Query result caching — a query like SELECT * FROM products WHERE category=5 caches a list. When any product in that category changes, the query result is stale. Solutions: invalidate by table-level version, by category-version, or via materialized-view-style maintenance. (4) Permission-driven invalidation — when a user\'s role changes, every cached document referencing their access must reconsider. Often easier to bypass cache for permission-sensitive reads.',
      example:
        'Shopify caches collection (category) listing pages. Each product belongs to multiple collections. When a product is updated, all collections it belongs to are invalidated (via tag-based purging). Without tags, they would have to enumerate every collection page URL — operationally infeasible.',
    },
  ],

  comparison: {
    caption: 'Cache invalidation strategies compared.',
    columns: ['Aspect', 'TTL Only', 'Explicit Invalidation', 'CDC-Driven', 'Versioned Keys'],
    rows: [
      ['Staleness window', 'Up to TTL', 'Brief race window + TTL backstop', 'CDC lag (~ms–s) + TTL', 'Effectively zero (race-free)'],
      ['Coordination cost', 'None', 'App-level', 'Infra (CDC, queue)', 'Atomic version bump'],
      ['Race condition risk', 'None (just stale)', 'Dual-read race', 'Smaller race window', 'Eliminated'],
      ['Multi-writer safety', '✅', '⚠️ Each writer must invalidate', '✅ Centralized', '✅'],
      ['Operational complexity', 'Lowest', 'Low', 'High', 'Medium'],
      ['Best for', 'Tolerance for staleness', 'Standard cache-aside', 'High correctness, many writers', 'Race-free at low overhead'],
    ],
  },

  realWorldExamples: [
    {
      company: 'LinkedIn (Brooklin / Kafka)',
      icon: '💼',
      description:
        'LinkedIn streams DB writes from Espresso/MySQL to caches via Brooklin (their CDC tool) over Kafka. Every cache subscribes to relevant change streams. Eliminates the "did the writer remember to invalidate?" failure mode entirely. Hundreds of services consume the same change streams for cache invalidation, search index updates, and analytics.',
    },
    {
      company: 'Reddit (post-incident CDC fix)',
      icon: '🤖',
      description:
        'After the moderator-deletion incident, Reddit moved cache invalidation off of application code paths and onto a CDC stream from MySQL via Maxwell. Any UPDATE or DELETE generates an invalidation message that all caches consume. Stale-content bugs of that class effectively eliminated.',
    },
    {
      company: 'Shopify (tag-based purging)',
      icon: '🛍️',
      description:
        'Shopify uses tag-based cache invalidation: rendered pages and API responses are tagged with related entities ("product:42", "collection:home"). When a product changes, invalidating the tag wipes all cached pages referencing it. Faster and more correct than enumerating URLs.',
    },
    {
      company: 'Stripe (double-delete + CDC)',
      icon: '💳',
      description:
        'Stripe uses application-level invalidation as the primary mechanism, with a CDC-driven follow-up invalidation 1 second later as a safety net. The combination eliminates dual-read races in their high-stakes merchant configuration data.',
    },
  ],

  interviewQuestions: [
    {
      question: 'Why is cache invalidation considered hard?',
      answer:
        'Three core reasons: (1) The cache and database are independent systems; any timing mismatch creates inconsistency. (2) Concurrent readers between a DB write and a cache invalidation can populate stale data — the dual-read race. (3) Distributed caches replicate; multiple cache layers exist (browser, CDN, app, distributed); each invalidation must propagate everywhere. (4) Not all "events that invalidate" are direct writes — permission changes, related-entity updates, and time-based events all complicate invalidation logic. Get any of these wrong and users see stale data, sometimes for hours.',
    },
    {
      question: 'Walk through the dual-read race condition.',
      answer:
        'T0: Reader queries cache, miss. T1: Reader queries DB, gets old value V1. T2: Writer updates DB to V2 and deletes cache key. T3: Reader populates cache with V1 (which it fetched at T1). Result: cache holds V1, DB holds V2 — stale until next invalidation. Mitigations: (a) Double-delete with delay — delete, wait 500ms, delete again, defeating in-flight readers. (b) Versioned keys — reader populates an orphaned old version, which is no longer referenced. (c) CDC-driven invalidation as a safety net — a second invalidation arrives downstream of the actual write. Most production systems combine TTL with one of these for race coverage.',
    },
    {
      question: 'What are versioned keys and how do they eliminate invalidation races?',
      answer:
        'A version pointer (cache:user:42:v = 7) is stored separately from the data; reads first fetch the version, then the data at cache:user:42:7. On write, the version is incremented (now v=8). Old data lives at cache:user:42:7 but is no longer referenced — it ages out by TTL. The dual-read race is harmless: a reader populating cache:user:42:7 with stale data is irrelevant because all subsequent reads use v=8. The cost is one extra cache call per read (mitigable with pipelining or in-process micro-cache of versions) and some memory for orphaned old keys.',
    },
    {
      question: 'How would you design cache invalidation for a multi-region system?',
      answer:
        'Use CDC: DB writes flow through a global change log (Kafka with cross-region replication). Each region\'s cache invalidator subscribes and applies invalidations. Accept seconds of cross-region lag. Layer invalidation: CDN purge (slowest), distributed cache (Redis Cluster), app-local in-memory (via Kafka subscription), and browsers (via cache-busting URLs). TTL acts as a final backstop so even total invalidation failure means bounded staleness. For very strict consistency, bypass cache for those reads in the affected regions.',
    },
    {
      question: 'When is TTL-only invalidation sufficient?',
      answer:
        'When (a) bounded staleness is acceptable for the data class (most user profiles, product details, geographic lookups), (b) writes are infrequent enough that the staleness window is rarely hit, and (c) the operational simplicity is worth the rare staleness. Many successful production systems run TTL-only for 80% of their cache and reserve more aggressive invalidation for the consistency-critical 20% (financial data, permission checks). Pragmatic choice: do not pay for explicit/CDC invalidation everywhere when TTL is good enough.',
    },
  ],

  commonMistakes: [
    'Forgetting the dual-read race — relying on cache.delete after db.write is not race-free.',
    'No TTL backstop — if a manual invalidation fails (Redis was down, code path forgot), the cache holds stale data forever.',
    'Wildcard invalidation by SCAN+DEL — slow and risky; use tag-based caches or versioned categories instead.',
    'Forgetting negative caching invalidation — a "user not found" 404 cache entry must be cleared when the user is created.',
    'Coupling invalidation to one app code path — any other writer (batch job, manual SQL, microservice) silently leaves stale cache.',
    'Ignoring multi-layer invalidation — invalidating Redis but forgetting browser caches, CDN, or app-local LRU.',
    'Trying to make caches strongly consistent — usually you should accept eventual consistency and rely on bounded staleness.',
  ],
};
