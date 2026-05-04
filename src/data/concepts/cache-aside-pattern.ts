import type { ConceptDeepDive } from '../../types';

export const cacheAsidePattern: ConceptDeepDive = {
  moduleId: 'cache-aside-pattern',
  tagline: 'Lazy loading — the most popular caching strategy in production',

  introduction: {
    layman:
      'Cache-aside (also called "lazy loading") is the simplest, most common caching pattern. The application code itself manages the cache: it asks the cache first, and only if missing, asks the database — then stores the result back in the cache for next time. The cache sits "aside" the application, never between it and the database.',
    analogy:
      'You want to know your friend\'s phone number. You check your contacts (cache). If found, great. If not, you text another friend asking (database), get the number, save it to your contacts (populate cache), and call. Next time, you go straight to contacts. Your contacts list and your friend network are completely independent — your phone is the only thing connecting them.',
    whyMatters:
      'Cache-aside is the default for 90% of production systems. It is simple, easy to reason about, robust to cache failure (you fall back to the DB), and gives the app full control over what gets cached and how long. Senior engineers are expected to know its mechanics, its failure modes (especially cache stampedes and write races), and how to harden it for high-traffic systems.',
  },

  subTopics: [
    {
      title: 'How Cache-Aside Works — The Read Path',
      icon: '📖',
      layman:
        'Read flow: ask the cache. If the cache has it (hit), return it. If not (miss), query the database, store the result in the cache, then return it. Future reads skip the database until the cache entry expires or is invalidated.',
      technical:
        'Pseudocode: value = cache.get(key); if (value == null) { value = db.query(key); cache.set(key, value, ttl=300); } return value. The application is responsible for: choosing the key, serializing the value, setting the TTL, and handling the miss path. The cache library is unaware of the database — it is just a key-value store. Critical detail: on a miss, store the result back to the cache before returning, otherwise the next request also misses. For absent keys (DB returned nothing), cache a sentinel value or a short-TTL "not found" marker — otherwise every "user_id=999999" probe hammers the DB.',
      example:
        'A REST API endpoint GET /products/42: handler calls redis.get("product:42"); on nil, calls postgres SELECT * FROM products WHERE id=42, then redis.set("product:42", json.dumps(row), ex=600). Subsequent requests for the same product hit Redis for the next 10 minutes.',
      whenToUse:
        'Use cache-aside when reads dominate writes, when a small staleness window is acceptable, and when you want full application control. It is the safe default for almost any web application caching layer.',
    },
    {
      title: 'How Cache-Aside Works — The Write Path',
      icon: '✏️',
      layman:
        'On a write (update or delete), you have two choices: update the cache too, or invalidate it (delete the key). Most production systems prefer invalidate-on-write — let the next read repopulate the cache with fresh data from the source. Updating the cache directly is tempting but introduces race conditions.',
      technical:
        'Standard write flow: db.write(key, newValue); cache.delete(key). On the next read, the miss path repopulates with the latest value. Why delete instead of update? Two writers updating the cache concurrently can leave it in an inconsistent state if the writes interleave with their respective DB updates. Deletion sidesteps this — whichever read wins the race repopulates from the latest DB state. But invalidation has its own race: the famous "dual-read race" — Reader A misses cache, queries DB (gets old value), then Writer updates DB and deletes cache, then Reader A populates cache with the now-stale value. Mitigations: (a) double-deletion (delete, sleep 100–500ms, delete again), (b) version stamps in the key, (c) drive invalidation from a CDC stream so timing is downstream of the actual write.',
      example:
        'Stripe-style architecture: a customer updates their default card. The handler does (1) UPDATE customers SET default_card_id=...; (2) DEL cache:customer:{id}. Next read repopulates fresh. For a heavily-read row that must never be stale, Stripe also publishes the change to Kafka, and a CDC consumer issues a second invalidation 1 second later — defeating the dual-read race.',
    },
    {
      title: 'Cache Stampede — The Hot-Key Failure Mode',
      icon: '🐂',
      layman:
        'When a popular key expires, every concurrent request misses simultaneously and rushes to the database. If the key was hot enough, this surge can crash the database — the very thing the cache was protecting. This is the cache stampede or thundering herd problem, and it is the single most common cache-aside failure.',
      technical:
        'Scenario: a top-trending Twitter user\'s profile cached at TTL=60. At second 60, the key expires. The next 1000 requests all see miss → all 1000 query the DB simultaneously → DB CPU spikes → query latency degrades → cascading slowdown. Fixes: (1) Probabilistic early expiration (XFetch algorithm) — recompute slightly before expiry with probability that increases as TTL approaches zero, so only one request rebuilds. (2) Lock on miss (single-flight) — use a distributed lock (Redis SETNX); only the lock holder queries the DB; others wait or return stale. (3) Stale-while-revalidate — keep the old value past TTL while one worker refreshes in the background. (4) Bloom filter or cache the key forever and refresh asynchronously via a queue. (5) Pre-warm before expiry via scheduled refresh for known hot keys.',
      example:
        'Reddit had a famous outage where the front-page cache expired while a viral post was being viewed by millions; the simultaneous miss crushed Cassandra. Fix: stale-while-revalidate plus a per-key lock so only one rebuild happens at a time, and other requests serve the slightly-stale value.',
    },
    {
      title: 'Versioned Keys — Decoupling Invalidation from Race Conditions',
      icon: '🔢',
      layman:
        'Instead of deleting cache entries when data changes, you can change the cache key. Every entity gets a version number; reads use the current version in the key. When data changes, you bump the version, and old keys naturally fall out of cache when their TTL expires.',
      technical:
        'Pattern: store a tiny "version pointer" key (cache:user:42:v) holding e.g., 7. Reads do GET cache:user:42:v → 7, then GET cache:user:42:7 to fetch the data. On write: increment version (INCR cache:user:42:v → 8), then SET cache:user:42:8 if you want to populate it directly. Old key cache:user:42:7 remains until TTL but is no longer referenced. Pros: avoids invalidation races entirely (a stale read of the old version is harmless because it is no longer referenced). Cons: every read becomes 2 cache calls (or pipelines into 1); old versioned keys sit in memory until TTL. Mitigations: short TTL on data keys, local micro-cache of version numbers.',
      example:
        'Pinterest uses versioned keys for board metadata. Bumping a version is faster and safer than coordinating invalidations across many cache regions. The slight memory bloat is acceptable in exchange for race-free updates.',
    },
    {
      title: 'Negative Caching & Sentinel Values',
      icon: '🚫',
      layman:
        'When a database lookup returns nothing (no such user, product not found), you should still cache that "absence" — otherwise every probe for a non-existent ID hammers the database. Cache a special "not found" marker with a shorter TTL.',
      technical:
        'Without negative caching, an attacker probing /products/{random_id} for non-existent IDs can DDoS the database — every request misses cache and queries the source. Pattern: on a DB miss, cache.set(key, NULL_SENTINEL, ex=30) (shorter TTL than positive cache, since "not found" can change). Read path checks if value == NULL_SENTINEL and returns 404 without re-querying. Tradeoff: if a missing entity gets created, there is up to TTL_NEG seconds of "still not found" returned. Use shorter TTLs (10–60s) and explicit invalidation on creation.',
      example:
        'Many APIs use negative caching: GitHub returns 404 for unknown repo, the CDN caches the 404 for 5 minutes. This stops repository-name enumeration attacks from melting the origin.',
    },
    {
      title: 'Cache-Aside vs Read-Through — Where the Logic Lives',
      icon: '⚖️',
      layman:
        'Cache-aside: the application code looks up cache, then DB, then writes back. Read-through: the cache itself transparently fetches from the DB on a miss; the app just calls cache.get and never touches the DB directly. Cache-aside is more flexible; read-through is simpler at the call site but requires a smarter cache layer.',
      technical:
        'Cache-aside: app owns the miss-handler, can use any DB, full control over key shape and TTL, easy to reason about, robust if cache fails (just bypass to DB). Read-through: cache layer is configured with a "loader" function, app code never sees misses, simpler call site, but tight coupling between cache infrastructure and DB access logic; cache outage means app outage unless explicit fallback. Most teams choose cache-aside for the operational simplicity and the clear separation between "cache is a performance optimization" and "DB is the system of record." Read-through fits better when many callers need consistent caching policy and you want to centralize miss handling.',
      example:
        'AWS DAX is read-through caching for DynamoDB: app code calls DAX exactly the same way it would call DynamoDB; DAX handles misses transparently. Compare to a typical Rails app using Redis as cache-aside: explicit Rails.cache.fetch("user:#{id}") { User.find(id) } — the developer sees the lookup pattern.',
    },
  ],

  comparison: {
    caption: 'Cache-aside compared to other caching patterns.',
    columns: ['Aspect', 'Cache-Aside', 'Read-Through', 'Write-Through'],
    rows: [
      ['Where logic lives', 'Application code', 'Cache layer (loader)', 'Cache layer (writer)'],
      ['Read on miss', 'App fetches from DB', 'Cache fetches automatically', 'N/A (only writes go through)'],
      ['Write path', 'Write DB + invalidate', 'Write DB + invalidate', 'Write cache → cache writes DB'],
      ['Consistency', 'TTL-bounded staleness', 'TTL-bounded staleness', 'Strong (write-time)'],
      ['Cache outage tolerance', 'High — app falls back to DB', 'Low — needs explicit fallback', 'Low — write path breaks'],
      ['Operational simplicity', '✅ Simple', '⚠️ Smarter cache needed', '⚠️ Coupled write path'],
      ['Best for', 'General read-heavy workloads', 'Centralized loading logic', 'Strong-consistency reads'],
    ],
  },

  realWorldExamples: [
    {
      company: 'Instagram',
      icon: '📷',
      description:
        'Instagram uses cache-aside extensively for user profiles, follower counts, and post metadata. Their Redis fleet sits "aside" the Postgres source of truth; Django views call cache.get → on miss, query Postgres → cache.set. Hit rates exceed 95% for hot pages. They publish blog posts about hot-key handling for celebrity accounts (e.g., Taylor Swift\'s profile receives so much traffic it gets shard-replicated to spread load).',
    },
    {
      company: 'Twitter',
      icon: '🐦',
      description:
        'Twitter\'s timeline service uses cache-aside with Redis. The fanout service writes new tweet IDs into followers\' cached timelines. Read-side timeline fetch is plain cache-aside: GET timeline:{user} → if miss, recompute from sources. They built Twemcache (their Memcached fork) and TwemProxy specifically to scale cache-aside lookups across millions of cache nodes.',
    },
    {
      company: 'Airbnb',
      icon: '🏠',
      description:
        'Airbnb caches listing data, search results, and pricing in Redis using cache-aside. Reservation writes invalidate cached listing pages immediately so updated availability reflects within seconds. They also use stale-while-revalidate in front of expensive search aggregations to avoid stampedes.',
    },
    {
      company: 'Stripe',
      icon: '💳',
      description:
        'Stripe caches merchant configuration, API keys, and webhook endpoints with cache-aside. On config update, they invalidate the cache key and publish a CDC event so all regions invalidate within milliseconds. Negative caching (cached 404s) prevents enumeration attacks against API key lookups.',
    },
  ],

  interviewQuestions: [
    {
      question: 'Walk me through the cache-aside read and write paths.',
      answer:
        'Read: app calls cache.get(key). If hit, return. If miss, query DB, then cache.set(key, value, ttl), then return. Write: db.write(...), then cache.delete(key) — let the next read repopulate. Why delete instead of update on write? Avoids race conditions where two concurrent writes leave the cache out of sync with the DB. Deletion is idempotent and the next read just repopulates with fresh data.',
    },
    {
      question: 'What is a cache stampede and how do you prevent it?',
      answer:
        'A stampede happens when a popular key expires and concurrent requests all miss simultaneously, all hammering the source. Mitigations: (1) Probabilistic early expiration (XFetch) — recompute slightly before TTL based on probability that grows as expiry approaches. (2) Lock-on-miss / single-flight — only one request rebuilds; others wait or return stale. (3) Stale-while-revalidate — serve old value past TTL while one worker refreshes. (4) Pre-warming hot keys via scheduled refresh. (5) Jitter on TTL so bulk-loaded keys do not expire simultaneously.',
    },
    {
      question: 'You have a write that updates a row and invalidates the cache. What can still go wrong?',
      answer:
        'The dual-read race: Reader A queries cache (miss), then queries DB (gets old value). Meanwhile Writer updates the DB and deletes cache. Reader A then populates cache with the now-stale value. Mitigations: (a) Double-deletion — delete cache, wait 500ms, delete again, defeating the in-flight reader. (b) CDC-driven invalidation — invalidation messages flow from the DB write log, downstream of the actual write, so timing is naturally correct. (c) Versioned keys — bumping a version pointer makes any stale population irrelevant. (d) Strong-consistency reads bypass cache entirely.',
    },
    {
      question: 'Why is invalidate-on-write usually preferred over update-on-write?',
      answer:
        'Update-on-write has two failure modes: (1) Concurrent writes can interleave such that Cache reflects Write A while DB reflects Write B. (2) The cache holds derived/computed data that is expensive to recompute — updating it requires duplicating the derivation logic at the write site. Invalidation sidesteps both: deletion is idempotent, and the next read recomputes from the DB. The cost is a one-time miss on the next read, which is cheap.',
    },
    {
      question: 'What happens if Redis goes down? How does cache-aside behave?',
      answer:
        'In a well-designed cache-aside system, every cache call is wrapped in error handling: on cache failure, log and fall through to the DB. The app stays available, just slower (and the DB load spikes). This is a key advantage over read-through and write-through, which couple application liveness to cache availability. To prevent the DB from melting under a sudden 100% miss rate, use circuit breakers, rate limiting, or graceful degradation (return cached/older results from a fallback layer).',
    },
  ],

  commonMistakes: [
    'Not caching negative results — every "user not found" probe hits the DB; attackers can amplify.',
    'Using update-on-write instead of invalidate-on-write — invites race conditions on concurrent writes.',
    'No protection against stampedes — popular keys expiring simultaneously crush the database.',
    'Identical TTLs on bulk-loaded keys (e.g., during cache warm) — synchronized expiry causes a stampede.',
    'No fallback when cache fails — app crashes instead of degrading gracefully to direct DB reads.',
    'Caching huge blobs that get rarely reused — wastes memory, evicts hot keys.',
  ],
};
