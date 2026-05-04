import type { ConceptDeepDive } from '../../types';

export const caching: ConceptDeepDive = {
  moduleId: 'caching',
  tagline: 'The single most powerful performance optimization in distributed systems',

  introduction: {
    layman:
      'A cache is a small, fast storage area that holds copies of data you have already fetched once, so you do not have to fetch it again. Imagine a chef who keeps salt, pepper, and oil right next to the stove instead of walking to the pantry every time. The pantry still has the master supply, but the workspace has the items the chef uses constantly. That bench-side spot is the cache: smaller than the pantry, but a hundred times faster to reach.',
    analogy:
      'Your brain caches phone numbers you call often — you do not look them up each time. The phonebook is still the source of truth, but for the dozen numbers you dial weekly, your memory is "fast storage" and the phonebook is "slow but complete." If you tried to dial without memory, every call would take longer. If you only relied on memory, you would forget rarely-used numbers. The mix is what makes caching powerful.',
    whyMatters:
      'Caching is the lever every senior engineer reaches for when latency, cost, or load gets out of hand. Pulling a row from a database can take 5–50 ms; pulling the same row from Redis takes 0.1–1 ms — a 50× speedup. At scale, that is the difference between needing 100 database servers and needing 5. Almost every interview system design problem (URL shortener, news feed, ride-hailing) requires the candidate to identify the hot read path, choose a cache, and reason about consistency, eviction, and stampedes. Without caching, modern web-scale systems literally would not function — Twitter, YouTube, and Netflix would melt under their read load.',
  },

  subTopics: [
    {
      title: 'Why Caching Exists — The Latency Hierarchy',
      icon: '⚡',
      layman:
        'Different storage locations have wildly different access speeds. CPU registers are nanoseconds. RAM is microseconds. SSDs are milliseconds. Network calls to a database can be tens of milliseconds. A cache deliberately keeps your hottest data in the fastest location available, so the slow tier is touched only on a miss.',
      technical:
        'A canonical latency table (Jeff Dean numbers, modernized): L1 cache ~1 ns, L2 cache ~4 ns, RAM ~100 ns, SSD random read ~100 µs, network round trip in same datacenter ~500 µs, cross-region ~50–150 ms. Reading 1 MB sequentially from RAM takes ~10 µs; from SSD ~250 µs; from network ~10 ms. Caching exploits these gaps by promoting hot data up the hierarchy. A Redis cache hit (~0.5 ms over network) replaces a Postgres query (10–50 ms with disk + planner overhead) — a 20–100× win. The same principle stacks: CDN (edge cache, ~10 ms) shields origin server (~100 ms), which uses Redis (~1 ms) to shield Postgres (~30 ms).',
      example:
        'Twitter\'s timeline service: a user with 500 followers loading their feed. Without caching: query the tweets table for each followed account, merge, sort — possibly 10,000 rows touched, ~500 ms. With Redis caching the precomputed timeline: a single Redis ZRANGE operation returns the latest 50 tweet IDs in under 1 ms. The 500× speedup is the only reason Twitter is usable.',
      whenToUse:
        'Cache anywhere read latency or read volume is a bottleneck and the data is read more often than it changes. Common targets: user profiles, product catalogs, computed feeds, rendered HTML, API responses, session data, query results.',
    },
    {
      title: 'The Cache Hit / Miss Cycle',
      icon: '🎯',
      layman:
        'Every cache lookup ends in either a hit (data found, return fast) or a miss (data absent, fetch from source, store in cache, return). Your job as a designer is to maximize the hit rate. A cache with a 95% hit rate is doing real work; a cache with a 30% hit rate is mostly overhead.',
      technical:
        'Hit ratio = hits / (hits + misses). Effective average latency = hit_rate × cache_latency + miss_rate × (cache_latency + source_latency). Example: 95% hit rate, 1 ms cache, 50 ms source → 0.95×1 + 0.05×51 = 3.5 ms average — ~14× faster than hitting the source every time. At 50% hit rate it climbs to 26 ms — barely better than no cache and still paying the cache cost. Hit rate is driven by (a) cache size relative to working set, (b) eviction policy fit (LRU vs LFU vs TTL), (c) access pattern (Zipfian distributions cache extremely well; uniformly random distributions cache poorly), and (d) TTL and invalidation strategy.',
      example:
        'Memcached at Facebook: hit rates above 99% on hot key-value lookups. Each miss falls back to MySQL — a 100× cost difference. Their internal target is "hit rate above 95% or the cache is not paying for itself."',
      whenToUse:
        'Always instrument hit rate from day one. If hit rate < 80%, either your cache is too small, the access pattern is not cacheable, or your TTL is too aggressive. Treat hit rate as a first-class SLI.',
    },
    {
      title: 'Cache Layers — Browser, CDN, App, DB',
      icon: '🧱',
      layman:
        'A real production system has caches stacked at multiple layers. The browser caches images and JS files. The CDN caches assets at edge locations near the user. The application server caches computed values in local memory or Redis. The database caches recent queries and pages internally. Each layer absorbs traffic before it reaches the next, multiplying the savings.',
      technical:
        'Typical stack from client to data: (1) Browser cache — controlled by Cache-Control, ETag, Expires headers. Offloads 100% of repeat asset loads. (2) CDN edge cache (Cloudflare, Fastly, CloudFront) — ~250 PoPs globally; static assets and cacheable API responses. (3) Reverse proxy cache (Varnish, Nginx) — at the origin, holds rendered pages or fragments. (4) Application-level in-memory cache (Caffeine, Guava, sync.Map) — process-local, microsecond access, but per-instance. (5) Distributed cache (Redis, Memcached) — shared across app servers, sub-millisecond. (6) Database internal cache (Postgres shared_buffers, MySQL InnoDB buffer pool) — caches hot pages in memory. Each layer typically targets a different data class: CDN for static, Redis for hot rows, DB cache for pages.',
      example:
        'Netflix homepage load: HTML rendered server-side and cached at CDN edge for 30 seconds (absorbs 99% of requests). Personalized rows fetched via API, cached in EVCache (Memcached fork) for 1–5 minutes. User profile data in Redis, 10-minute TTL. Movie metadata in another EVCache pool. The Cassandra origin sees < 0.1% of homepage load.',
    },
    {
      title: 'What to Cache (and What Not to)',
      icon: '📋',
      layman:
        'Not everything benefits from a cache. Cache things that are read often, change rarely, and cost a lot to compute or fetch. Do not cache things that are unique per request, change every second, or contain sensitive data without careful access controls.',
      technical:
        'Strong cache candidates: (a) read-heavy data (user profile, product info, geographic lookups), (b) expensive computations (recommendations, aggregations, dashboard rollups), (c) external API responses (weather, exchange rates, geo-IP), (d) rendered HTML/JSON for popular pages, (e) authentication tokens and session data. Poor candidates: (a) write-heavy data with strict consistency requirements (bank balances, inventory counters), (b) personalized data with low reuse (one-time emails, user-specific reports rarely reread), (c) large blobs that bloat the cache (10 MB JSON responses — cache the IDs, not the payload), (d) cryptographic secrets without encryption-at-rest in the cache. Special care: PII and regulated data need TTL alignment with retention policy and may need encrypted Redis (TLS + RBAC).',
      example:
        'Stripe caches publishable API keys and merchant configuration aggressively (read 1000× per second, change once a week). Stripe does NOT cache live payment intents (write-heavy, must reflect every state change) or balance amounts (consistency-critical) — those go straight to the source of truth.',
    },
    {
      title: 'Cache Consistency — The Hard Part',
      icon: '🔄',
      layman:
        'The cache holds a copy. When the original changes, the cache becomes stale. Keeping cache and source in sync is famously the second-hardest problem in computer science. There is no perfect answer — every approach trades freshness for performance, simplicity, or cost.',
      technical:
        'Three core strategies: (1) TTL-based — set an expiry; tolerate staleness up to TTL. Simple, but stale reads happen. (2) Explicit invalidation — when source changes, delete (or update) the cache key. Race conditions: a reader can re-populate with old data between source update and cache delete. Use double-deletion with a delay, or "set then delete" pattern. (3) Write-through / write-behind — every write updates the cache directly. Strongest consistency, but couples write path performance to cache availability. CAP-style tradeoffs apply: in distributed caches with replication, asynchronous replication means readers from different replicas can see different values (eventual consistency in Redis Cluster). For cross-region caches, expect 100s of ms of inconsistency. Tools like Linkedin\'s Apache Helix and Facebook\'s memcached "leases" exist specifically to coordinate cache writes across many app servers.',
      example:
        'Reddit had a famous incident where stale cache entries showed deleted moderator comments for hours. Their fix: cache invalidation triggered by a database CDC stream (Debezium) so every write to the canonical store also pushed an invalidation message to the Redis cache, regardless of which app server made the change.',
    },
    {
      title: 'Anti-Patterns and Failure Modes',
      icon: '⚠️',
      layman:
        'A cache adds complexity. Done wrong, it can make systems slower, less reliable, or even bring them down. Common failure patterns: caching things that should not be cached, caching forever (no TTL), missing cache stampedes, and treating the cache as a system of record.',
      technical:
        'Top failure modes: (1) Cache stampede / thundering herd — popular key expires, 1000 requests hit DB simultaneously, DB melts. Fix: probabilistic early expiration, request coalescing, lock-on-miss. (2) Hot key — single key gets 90% of traffic, overwhelms one Redis shard. Fix: replicate hot keys, client-side caching, sharded keys. (3) Cache as DB — using cache as the source of truth. When Redis loses data (it can — eviction, restart, OOM), data is permanently gone. (4) Negative caching omitted — every "user not found" lookup hits the DB. Fix: cache 404s with shorter TTL. (5) Unbounded keys — autogenerated keys never expire and never get hit again. Fills cache with garbage. (6) TTL stampede — 100,000 keys all expire at the same second because they were all loaded at startup. Fix: jitter TTLs.',
      example:
        'GitHub had a 2018 incident where a Redis hot key (the public API rate-limit counter for an unauthenticated CIDR) consumed an entire shard\'s CPU. Mitigation: split rate-limit counters across multiple keys with consistent hashing.',
    },
  ],

  comparison: {
    caption: 'Storage tier latencies — why caching exists.',
    columns: ['Tier', 'Typical Latency', 'Capacity', 'Cost / GB', 'Volatility'],
    rows: [
      ['CPU L1 cache', '~1 ns', 'KB', '—', 'Per-core'],
      ['CPU L2/L3', '~4–40 ns', 'MB', '—', 'Per-CPU'],
      ['RAM (local)', '~100 ns', 'GB–TB', '$3–10', 'Volatile'],
      ['SSD (local)', '~100 µs', 'TB', '$0.10', 'Persistent'],
      ['Redis (network)', '~0.5–1 ms', 'GB–TB', '$0.50', 'Volatile'],
      ['Postgres / MySQL', '~5–50 ms', 'TB+', '$0.10', 'Persistent'],
      ['S3 (network)', '~30–100 ms', 'Unlimited', '$0.023', 'Persistent'],
      ['Cross-region call', '~50–150 ms', '—', '—', '—'],
    ],
  },

  realWorldExamples: [
    {
      company: 'Facebook (Memcached)',
      icon: '👥',
      description:
        'Facebook runs one of the largest caching deployments on Earth — tens of thousands of Memcached servers caching social graph, profile, and timeline data. Their 2013 paper "Scaling Memcache at Facebook" describes how a 99% cache hit rate is the only thing standing between their user base and total MySQL meltdown. They invented "leases" (a coordination primitive) specifically to handle stampedes and races at this scale.',
    },
    {
      company: 'Netflix (EVCache)',
      icon: '🎬',
      description:
        'Netflix forked Memcached into EVCache and runs it across multiple AWS regions for global redundancy. Every viewer\'s home page, recommendations, and continue-watching state is cached. EVCache handles ~30 million ops/sec at peak. Their philosophy: "if it can be cached, it should be cached" — origin Cassandra exists to be a fallback, not a primary read path.',
    },
    {
      company: 'Twitter (Timeline Cache)',
      icon: '🐦',
      description:
        'Twitter precomputes and caches every active user\'s home timeline (the merged feed of accounts they follow) in Redis. When you tweet, a fan-out service writes your tweet ID into all your followers\' cached timelines. Reading the home timeline is a single Redis ZRANGE call — sub-millisecond — versus a multi-table SQL join that would take seconds for high-follow users.',
    },
    {
      company: 'Cloudflare (Edge Cache)',
      icon: '🌐',
      description:
        'Cloudflare\'s 300+ edge data centers cache static assets and cacheable API responses for the websites they front. A typical news site with bursty traffic might serve 95%+ of requests directly from Cloudflare\'s edge — origin servers see only the misses and the personalized requests. This is the canonical example of a CDN as a giant geographically-distributed read cache.',
    },
  ],

  interviewQuestions: [
    {
      question: 'What is caching and when should you use it?',
      answer:
        'Caching stores copies of data in a faster, smaller storage tier so subsequent reads avoid the slow, expensive source. Use it when: data is read more often than written, the source is slow or expensive, and some staleness is tolerable. Concretely: user profiles, product catalogs, computed feeds, API responses, rendered HTML. Avoid for: write-heavy data with strict consistency, unique-per-request data (no reuse), or anything where staleness is unsafe (auth permissions for security-critical actions usually bypass caches or use very short TTLs).',
    },
    {
      question: 'Walk me through the layers of caching in a typical web application.',
      answer:
        'From client to source: (1) Browser cache — assets, controlled by Cache-Control headers. (2) CDN edge cache — static files, sometimes API responses. (3) Reverse proxy (Varnish/Nginx) — full-page or fragment caching at the origin. (4) Application-local in-memory cache (Caffeine, sync.Map) — fast but per-instance. (5) Distributed cache (Redis/Memcached) — shared across app servers. (6) Database internal cache (buffer pool, query cache) — pages of hot data in DB RAM. Each layer is faster and smaller than the next; each absorbs traffic before it reaches the deeper, more expensive tier.',
    },
    {
      question: 'How do you decide what to cache?',
      answer:
        'Three checks: (1) Read-to-write ratio — high reads per write means high reuse, high hit rate, big payoff. (2) Source cost — slow query, expensive computation, or external API call. (3) Staleness tolerance — can your business accept N seconds of stale data? If yes, cache. If staleness is dangerous (financial balances, inventory counts), either skip the cache or use very tight invalidation. Quantify: estimate hit rate, estimate latency improvement, and only cache if (a) hit rate > 80% and (b) the source latency is meaningfully larger than the cache latency.',
    },
    {
      question: 'How would you measure whether your cache is working?',
      answer:
        'Core SLIs: (1) Hit rate — should be > 90% for hot data. (2) P50/P99 latency on cache reads vs source reads — confirm the speedup is real. (3) Origin/source request rate — should drop dramatically after caching is enabled. (4) Eviction rate — high evictions mean cache is undersized. (5) Memory utilization — too low means waste, too high means evictions. Per-key instrumentation helps spot hot keys and identify candidates for additional layers (e.g., promote to in-process cache).',
    },
    {
      question: 'What are the tradeoffs of caching?',
      answer:
        'Pros: latency drops 10–100×, source load drops dramatically, costs fall (fewer DB CPUs needed). Cons: (1) Consistency — cache can be stale; invalidation is famously hard. (2) Complexity — extra service, extra failure mode. (3) Memory cost — RAM is more expensive per GB than disk. (4) New failure modes — stampedes, hot keys, cache outages causing thundering herds on DB. (5) Cold start — fresh deploy or restart can flood DB until cache fills. The trade is almost always worth it for read-heavy systems, but the design must explicitly address each downside (TTL, jitter, stampede protection, fallback path).',
    },
  ],

  commonMistakes: [
    'Caching everything indiscriminately — including data with low reuse, ballooning memory cost without improving hit rate.',
    'No TTL or eviction policy — cache fills with stale, never-accessed entries; eventually OOMs.',
    'Treating the cache as a system of record — when Redis evicts or restarts, "permanent" data disappears.',
    'Identical TTLs on bulk-loaded keys — at expiry, all keys miss simultaneously and stampede the database.',
    'Ignoring negative caching — every "not found" lookup goes to the DB; attackers can exploit this for amplification.',
    'No instrumentation on hit rate — flying blind; cache could be 30% effective and you would not know.',
  ],
};
