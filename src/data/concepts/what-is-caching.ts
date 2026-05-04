import type { ConceptDeepDive } from '../../types';

export const whatIsCaching: ConceptDeepDive = {
  moduleId: 'what-is-caching',
  tagline: 'Anatomy, layers, hit/miss mechanics, consistency, and metrics — caching from first principles',

  introduction: {
    layman:
      'A cache is a small, very fast memory area that stores copies of recently or frequently used data so the system does not have to refetch them from the slow, original source. Picture a coffee shop: the barista keeps the most popular syrups within arm\'s reach (fast) while keeping the rest in the storeroom (slow). The shelf next to the espresso machine is the cache — limited space, but extremely fast access.',
    analogy:
      'Your fridge is a cache for the grocery store. The store has every item you could possibly need, but reaching it costs you a 20-minute drive. The fridge holds a small subset of items you want this week — items you grabbed on the last trip. When you need eggs, you check the fridge first (cache hit). If eggs are missing, you drive to the store (cache miss), grab some, and put extras in the fridge for next time.',
    whyMatters:
      'Almost every modern web service stays under SLA only because of careful caching. Senior engineers are expected to know exactly which layer to cache at, what data to cache, what TTL to choose, how to handle invalidation races, and how to measure success. This module is the foundation that all the strategy modules (cache-aside, write-through, eviction, invalidation) build on.',
  },

  subTopics: [
    {
      title: 'Anatomy of a Cache — Keys, Values, TTL, Eviction',
      icon: '🧬',
      layman:
        'Every cache is essentially a giant hash map: each "key" is a unique label, each "value" is the data you stored, plus metadata like when it was added and when it should expire. When the cache fills up, the eviction policy decides which key to drop to make room.',
      technical:
        'Core components: (1) Key — usually a string like "user:42:profile" or a hash of query parameters. Keys must be deterministic so identical reads hit the same key. (2) Value — bytes, often serialized JSON or Protobuf. Size matters: Redis caps at 512MB/key but practical limits are far lower (1–100KB typical). (3) TTL — time-to-live in seconds; cache deletes the key after this period regardless of access. (4) Last access timestamp — used by LRU eviction. (5) Hit count — used by LFU eviction. (6) Eviction policy — LRU (drop least-recently-used), LFU (drop least-frequently-used), FIFO (drop oldest), Random, or TTL-only. Redis supports several of these via maxmemory-policy. Memcached uses LRU only.',
      example:
        'Redis SET user:42:profile \'{"name":"Alice","email":"a@x.com"}\' EX 300 — stores the profile for 5 minutes. After 300 seconds, GET user:42:profile returns nil. With maxmemory 4gb maxmemory-policy allkeys-lru, when memory fills, Redis evicts least-recently-used keys to make room.',
    },
    {
      title: 'Cache Layers — From Browser to Database',
      icon: '🪜',
      layman:
        'A web request can hit caches at many points: the browser cache, the CDN cache near you, the app server\'s in-memory cache, the shared Redis cache, and finally the database\'s own cache. Each layer absorbs requests so deeper layers stay protected.',
      technical:
        'L1: Browser cache — controlled by HTTP headers (Cache-Control: max-age, ETag, Last-Modified). Holds JS, CSS, images for repeat visits. L2: CDN edge cache — Cloudflare/Fastly/Akamai PoPs. Holds static assets and cacheable API responses. Hit rates of 95%+ are normal. L3: Reverse-proxy cache — Varnish, Nginx, HAProxy at the edge of your origin. Whole-page or fragment caching. L4: Application in-memory cache — Caffeine (Java), lru-cache (Node), functools.lru_cache (Python). Per-instance, microsecond latency, but bounded by RAM and not shared. L5: Distributed cache — Redis, Memcached. Shared across app servers, sub-millisecond, scales horizontally. L6: Database buffer pool — Postgres shared_buffers, MySQL innodb_buffer_pool_size. Caches recently-read pages in DB RAM. Caches do not replace each other; they stack to compound their effects.',
      example:
        'Stack Overflow famously runs on a tiny number of servers. Their caching: HTTP cache headers on assets, Cloudflare CDN, Redis at the application layer, ASP.NET in-process cache for hot lookups, plus SQL Server\'s buffer pool. Layered together, fewer than 5% of requests reach the database.',
    },
    {
      title: 'Hit, Miss, Hit Rate — Measuring What Matters',
      icon: '📊',
      layman:
        'A hit is when the cache had what you wanted; a miss is when it did not and you had to fetch from the source. The hit rate (hits divided by total requests) is the single most important number for any cache. A high hit rate means the cache is doing its job; a low one means it is mostly overhead.',
      technical:
        'Effective average latency = hit_rate × cache_latency + miss_rate × (cache_latency + source_latency). At 95% hit / 1ms cache / 50ms source: 0.95×1 + 0.05×51 = 3.5ms. At 50% hit: 0.5×1 + 0.5×51 = 26ms. Hit rate is driven by: (a) cache size vs working set — if working set fits, hit rate climbs to 99%; (b) access pattern — Zipfian (a few keys getting most traffic) caches well, uniform random caches poorly; (c) eviction policy match — LRU helps with recency-skewed workloads, LFU with popularity-skewed; (d) TTL — too short means premature evictions, too long means staleness. Track hit rate per key class (e.g., user_profiles, product_listings) — aggregate hit rate hides bimodal patterns.',
      example:
        'A common interview trap: candidate proposes Redis cache, claims "fast." Interviewer asks: hit rate? Without instrumentation you cannot say. If working set is 100GB but cache is 10GB, hit rate likely sits around 30–40% — barely worth the operational cost. Always size the cache for ~120% of the hot working set if possible.',
    },
    {
      title: 'What to Cache — Identifying Cacheable Workloads',
      icon: '🎯',
      layman:
        'Cache things people read a lot, change rarely, and that cost money or time to fetch. Skip things that change every second, are unique to one request, or where stale data is dangerous.',
      technical:
        'Strong candidates: (1) Read-mostly entities (user profile, product, geographic lookup tables). (2) Expensive computations (recommendations, leaderboards, aggregations). (3) External API calls (weather, exchange rates, geo-IP). (4) Rendered output (HTML fragments, JSON responses, search snippets). (5) Session and auth tokens. Weak candidates: (1) Per-request unique data (a one-off report). (2) Strict-consistency data (account balance — caching is risky). (3) Large blobs (cache the ID, fetch the blob from S3). (4) Frequently mutated counters (use Redis counters directly, not as a "cache" of DB rows). Special: regulatory constraints (GDPR, PCI) demand TTL aligned to retention policy and access controls on cache contents.',
      example:
        'YouTube caches video metadata (title, thumbnail, channel) aggressively — sub-millisecond reads, billions of times per day. YouTube does NOT cache the watch-history write path: each "I watched this" event goes straight to a write-optimized store, because the cache adds nothing on writes and would just complicate consistency.',
    },
    {
      title: 'Consistency — Keeping Cache In Sync',
      icon: '🔄',
      layman:
        'When the source data changes, the cache copy is now wrong. Different strategies trade off staleness against complexity. There is no perfect solution; pick the one that matches your tolerance.',
      technical:
        'Three strategies: (1) TTL-only — accept staleness up to T seconds. Simplest. Good for most read-heavy data where 60–300 seconds of staleness is fine (product catalogs, user profiles). (2) Explicit invalidation on write — on every UPDATE, DELETE the cache key. Race condition: a reader can repopulate the cache with stale data between the write and the delete. Mitigation: "delete twice" pattern with a 500ms gap, or consume CDC events to invalidate. (3) Write-through — every write goes to cache + source atomically. Strongest consistency but couples write latency to cache health. Distributed cache replication adds another wrinkle: Redis Cluster\'s async replication means replicas can lag the primary, so a read after write might still see old data on a replica. For multi-region, accept seconds of inconsistency or use specialized stores (Spanner, Cosmos).',
      example:
        'Reddit, after a notorious incident, moved their cache invalidation onto a CDC stream from MySQL via Maxwell — every UPDATE produces an invalidation message regardless of which app server made the change, eliminating the "different app server cached old value after I wrote" race.',
    },
    {
      title: 'Anti-Patterns and Pitfalls',
      icon: '🚫',
      layman:
        'Caching can backfire. Common mistakes: caching things that should not be cached, caching forever (no TTL), missing stampedes, treating the cache as a database, forgetting to handle "not found."',
      technical:
        '(1) Cache as system-of-record — Redis can lose data (eviction, restart, OOM). If your data is irreplaceable, persist it elsewhere. (2) Stampede — popular key expires; thousands of requests miss simultaneously and pile onto the source. (3) Hot key — one key gets 90% of traffic, overloads one Redis shard. (4) Negative caching omitted — every "user not found" hits the DB; attackers can exploit. Cache 404s with shorter TTL. (5) Unbounded keys — auto-generated keys (per-request signatures) fill the cache with junk that is never reused. (6) TTL stampede — bulk-loaded keys all expire at the same second. Add jitter (TTL ± 20%). (7) Caching mutable references in process memory — concurrent reads/writes corrupt state. Use immutable copies or a thread-safe cache library.',
      example:
        'A classic outage pattern: a deploy invalidates all keys at once (or restarts the cache), and the now-cold cache means every read goes to the database. The DB melts under 100% miss traffic. Mitigation: warm the cache before flipping traffic, or use a "trickle" approach (gradually invalidate over minutes).',
    },
    {
      title: 'Performance Metrics & SLIs',
      icon: '📈',
      layman:
        'You cannot improve what you do not measure. Track hit rate, latency, eviction rate, and memory use — they tell you whether the cache is healthy and whether it is the right size.',
      technical:
        'Core SLIs: (1) Hit rate (hits / total) — target > 90% for hot paths. (2) Cache read P50 / P99 latency — should be 1–5 ms over network for Redis, < 1µs for in-process. (3) Eviction rate — high rate means cache is undersized for the working set. (4) Memory utilization — aim 70–80%, with headroom for spikes. (5) Origin / source RPS — should plummet after enabling caching. (6) Per-key hot-spot detection — top-10 keys by request rate; if one key is > 5% of traffic, you have a hot key. (7) Stampede / coalesced miss count — Redis SLOWLOG and key-space notifications. Tools: Redis INFO, Datadog Redis integration, custom metrics emitted by your client library.',
      example:
        'Twitter\'s timeline cache aims for >99% hit rate with P99 latency under 5ms. Anything below 99% triggers an investigation — typically a hot user (celebrity tweeting) creating a hot-key pattern that needs sharding.',
    },
  ],

  comparison: {
    caption: 'Different cache layers and where they fit in a request path.',
    columns: ['Layer', 'Latency', 'Scope', 'Persistence', 'Best Use'],
    rows: [
      ['Browser cache', '0 ms (local)', 'Per-user', 'Until cleared', 'Static assets, ETag-validated'],
      ['CDN edge', '~5–30 ms', 'Per-region', 'Configurable TTL', 'Static + cacheable API'],
      ['Reverse proxy', '~1 ms', 'Per-origin', 'In RAM', 'Whole-page / fragment'],
      ['App in-process', '~1 µs', 'Per-instance', 'Per-process lifetime', 'Hot lookups, config'],
      ['Distributed (Redis)', '~0.5–1 ms', 'Cluster-wide', 'Persistent or RAM', 'Shared session, hot rows'],
      ['DB buffer pool', '~10 µs–1 ms', 'Per-DB-node', 'In RAM', 'Recently-read pages'],
    ],
  },

  realWorldExamples: [
    {
      company: 'Stack Overflow',
      icon: '💬',
      description:
        'Stack Overflow famously serves billions of pages on minimal hardware. Their secret is layered caching: HTTP cache headers, CDN, Redis, in-memory ASP.NET cache, and SQL Server buffer pool. They publicly publish hit rates per cache layer; the database sees less than 5% of requests on hot paths. The site is a textbook example of cache layering done right.',
    },
    {
      company: 'Facebook (TAO + Memcached)',
      icon: '👥',
      description:
        'Facebook\'s social graph is fronted by TAO (Type-Aware Object) cache layer and Memcached. They run hundreds of thousands of cache servers; their 2013 paper reported that hit rates above 99% were the only way to keep MySQL alive. They invented "leases" — a small coordination primitive — specifically because at their scale, even rare cache stampedes are catastrophic.',
    },
    {
      company: 'Cloudflare',
      icon: '🌍',
      description:
        'Cloudflare\'s global edge serves >50 million HTTP requests per second. Most are absorbed at the cache layer: their hit rate for cacheable assets exceeds 95%. The origin servers see only the misses + uncacheable requests. This is what makes a "free tier" CDN economically viable — caching does the heavy lifting.',
    },
    {
      company: 'Netflix (EVCache)',
      icon: '🎬',
      description:
        'Netflix runs EVCache (a Memcached fork) across multiple AWS regions for redundancy. Every viewer\'s personalized homepage is assembled from cached responses. EVCache handles ~30M ops/sec at peak. Internal philosophy: "Cassandra is the fallback, not the primary read path" — every read tries the cache first.',
    },
  ],

  interviewQuestions: [
    {
      question: 'Walk me through what happens during a cache hit and miss.',
      answer:
        'On a hit: app calls cache (e.g., Redis GET key) → cache returns value in ~1ms → app returns to client. On a miss: cache returns nil → app queries source (DB) in ~30ms → app stores result in cache (Redis SET key value EX 300) → app returns to client. Subsequent reads will hit. The miss adds the cache write latency to the source latency, so the first miss is slower than a no-cache fetch — the win is on subsequent reads.',
    },
    {
      question: 'What hit rate is "good"? Why?',
      answer:
        'For hot paths, target 90–99%. Below 80%, the cache is barely paying for itself: the average latency is dominated by misses. Math: 80% hit / 1ms cache / 50ms source → average 11ms. 95% hit → 3.5ms. The improvement from 80→95% is 3× — bigger than the cache itself usually delivers. Hit rate depends on cache size relative to working set, eviction policy fit, and TTL sanity. Always track per-cache-class hit rate, not just the global aggregate.',
    },
    {
      question: 'When should you NOT cache something?',
      answer:
        'Skip caching when: (1) the data is unique per request and will never be reused (a one-time computed report); (2) strict consistency is required and staleness is dangerous (account balance reads in a banking app); (3) the value changes more often than it is read (a counter that increments on every write but is read only by a metrics job); (4) the data is so large it would dominate cache memory with low reuse (multi-MB blobs — cache the ID, store blob in S3); (5) the data carries security/regulatory constraints that the cache layer cannot meet.',
    },
    {
      question: 'How would you debug a cache that is "not helping"?',
      answer:
        'Step 1: measure hit rate. If <50%, either the cache is too small or the access pattern is non-cacheable (uniform random or single-use). Step 2: check eviction rate. High evictions = under-sized. Step 3: inspect top keys by traffic. If one key is >10% of traffic, you have a hot-key problem — that single key may be on one shard and saturating it. Step 4: check TTLs. Too short = unnecessary misses; too long = stale. Step 5: look for negative results not being cached. Step 6: check that the cache layer is actually faster than the source — tiny rows from a well-tuned DB sometimes beat a network hop to Redis.',
    },
    {
      question: 'How do you keep the cache consistent with the database?',
      answer:
        'Three options: (1) TTL-only — simple, accept staleness. (2) Explicit invalidation on write — on UPDATE/DELETE, also DELETE the cache key. Watch for read-then-write races: a concurrent read can repopulate the stale value. Mitigations include double-deletion with delay, or driving invalidation from a CDC stream (Debezium reading the DB write log) so any writer triggers invalidation. (3) Write-through — write to cache + DB atomically. Strongest, but couples write path to cache. For most apps a TTL of 30–300 seconds plus explicit invalidation on the most consistency-critical paths is the right balance.',
    },
  ],

  commonMistakes: [
    'No instrumentation — running blind without hit rate, latency, or eviction metrics.',
    'Identical TTLs on bulk-loaded keys — synchronized expiry causes a stampede on the source.',
    'Caching unique-per-request results — fills cache with garbage, hit rate plummets.',
    'Treating the cache as durable storage — when Redis evicts or restarts, "permanent" data is lost.',
    'Ignoring negative caching — every 404 lookup repeatedly hits the source.',
    'Mixing concerns: caching session data, hot rows, and ephemeral counters in the same Redis instance — eviction of the wrong class causes mysterious bugs.',
  ],
};
