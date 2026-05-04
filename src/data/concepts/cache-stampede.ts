import type { ConceptDeepDive } from '../../types';

export const cacheStampede: ConceptDeepDive = {
  moduleId: 'cache-stampede',
  tagline: 'When a hot cache key expires and a thousand requests rush the database simultaneously',

  introduction: {
    layman:
      'A cache stampede (also called the "thundering herd" problem) happens when a popular cache key expires, and many requests miss the cache at the same time. All of them try to refill it from the database simultaneously — a sudden surge that can overload or crash the very database the cache was supposed to protect. The cache, ironically, becomes the trigger for the outage.',
    analogy:
      'Imagine a popular bakery that sells out of bread at exactly noon every day. From 11:59 to 12:00, everyone in line is buying the last loaves; at 12:01, ten people walk in needing bread, and the baker has to make all ten loaves from scratch — at once. The kitchen is overwhelmed not because demand is too high overall, but because demand is concentrated in a single moment. Cache stampedes are exactly this: synchronized expiry creating synchronized demand.',
    whyMatters:
      'Cache stampedes are one of the most common causes of production outages in cached web systems. They are particularly cruel: the cache is doing its job (absorbing 99% of traffic), but a single key expiry on a popular item can cascade to a database meltdown. Senior engineers must know the prevention techniques (locking, probabilistic refresh, stale-while-revalidate, jitter) and how to apply them.',
  },

  subTopics: [
    {
      title: 'How a Stampede Happens',
      icon: '🐂',
      layman:
        'A cache key holds the answer to an expensive question (e.g., "what is on the home page right now?"). The key has a TTL — say 60 seconds. At second 60, the key expires. Between seconds 60 and 61, thousands of requests arrive, all asking the same question. They all see "miss," all query the database, all do the expensive computation. The database, normally serving < 1% of requests, suddenly handles 100% of them — concentrated in milliseconds.',
      technical:
        'Concrete numbers: home page cache, TTL=60s, 10,000 RPS. Steady state: 99.99% hit rate (one miss every 60s). Stampede moment: 10,000 RPS × 1 second of expiry-window misses = 10,000 simultaneous DB queries for the same expensive operation. Each query takes 500ms. Database CPU saturates, latency rockets, downstream timeouts cascade. Recovery: usually the first request that completes repopulates the cache, and the next 9,999 get the cached result — but only after burning the database CPU. Worse case: each query holds row locks; queries pile up; the database deadlocks or crashes; the cache is now empty; the next refill itself stampedes.',
      example:
        'Reddit had a notorious incident where the front-page cache expired during a viral event; the simultaneous cache miss across millions of users crushed Cassandra. Mitigation went in afterward: stale-while-revalidate plus per-key locks so only one rebuild happens at a time.',
    },
    {
      title: 'Why It Affects Hot Keys Disproportionately',
      icon: '🌶️',
      layman:
        'Cold keys (rarely accessed) miss too, but only one or two requests are waiting; the database handles them easily. Hot keys are dangerous because the request rate is high, so the number of concurrent misses during the expiry window is also high. The hotter the key, the more catastrophic the stampede.',
      technical:
        'Math: misses_per_expiry = RPS × expiry_window_seconds. For 100 RPS hot key with 1-second window: 100 misses pile up. For 10,000 RPS: 10,000 misses pile up. The database does not care that the cache hit rate is 99% globally — it cares about the absolute concurrent miss count for the same expensive operation. Even with rate limiting, concurrent execution of an expensive query can saturate connection pools, lock queues, or memory. Hot key + long compute time = recipe for cascade failure.',
      example:
        'A breaking-news article with 100K RPS reads. The article render is cached for 30 seconds. At expiry, 100,000 / 30 ≈ 3,000 RPS of concurrent rebuilds — each potentially involving a 200ms query. Without protection, the article-rendering service becomes the bottleneck and the app degrades for everyone, not just the breaking-news viewers.',
    },
    {
      title: 'Prevention 1 — Lock on Miss (Single-Flight)',
      icon: '🔒',
      layman:
        'When a cache miss happens, take a distributed lock on the key. Only the lock holder fetches from the database; everyone else waits for the lock holder to finish, then reads the freshly-populated cache. The database sees one query instead of thousands.',
      technical:
        'Implementation: SET NX EX (set if not exists with TTL) for a "lock" key like cache:lock:home. If acquired, the request fetches from DB, stores result, deletes lock. Other concurrent requests see the lock held, either (a) wait briefly and retry, (b) return stale data if available, or (c) return an error. Caffeine, Guava\'s LoadingCache, and many read-through caches do this automatically (called "single-flight" or "request coalescing"). Pitfalls: (1) Lock holder dies — TTL on lock prevents permanent deadlock. (2) Many waiters poll aggressively — backoff with jitter. (3) Lock contention itself becomes a bottleneck for very hot keys — fall back to a per-process lock + distributed lock combination. Used by Go\'s singleflight package, Python\'s asyncio.Lock around cache fetches, Redis SET NX patterns.',
      example:
        'Caffeine\'s LoadingCache automatically deduplicates concurrent loads for the same key — 10,000 concurrent get("home") calls during a miss collapse into one loader invocation, with all callers receiving the same result. No additional code required.',
    },
    {
      title: 'Prevention 2 — Probabilistic Early Expiration (XFetch)',
      icon: '🎲',
      layman:
        'Instead of waiting until the TTL expires, requests probabilistically choose to refresh "early." As the TTL approaches zero, the probability of refresh on any given request increases. By the time TTL expires, only one request has likely already triggered a refresh, and the cache is already warm.',
      technical:
        'XFetch algorithm (paper: "Optimal Probabilistic Cache Stampede Prevention"): on each read, sample a random number; if random × beta × ln(1/random) > remaining_ttl, refresh now. Tunable beta controls aggressiveness. As remaining_ttl shrinks, the probability of triggering an early refresh grows. The first request to trigger does the work; subsequent reads use the still-valid old value (or the new one if the refresh has completed). Net effect: a single "early bird" rebuilds the cache before anyone else sees the miss. Implementations: php-cache/integration, custom Redis Lua scripts, library helpers.',
      example:
        'Yahoo uses XFetch in their internal caching libraries; the technique was published in a 2015 paper specifically because it eliminates stampedes without any locking overhead. The math is elegant: it costs almost nothing per read.',
    },
    {
      title: 'Prevention 3 — Stale-While-Revalidate',
      icon: '🔄',
      layman:
        'Keep two TTLs on the cache: a "fresh" window and a "stale-but-OK" window. While fresh, just return. After fresh expires but during the stale window, return the old value immediately AND trigger a background refresh. The user gets a fast (slightly stale) response, and the cache rebuilds without anyone waiting.',
      technical:
        'Cache stores entry with two timestamps: fresh_until, stale_until. On read: if now < fresh_until, return value (fast). If fresh_until ≤ now < stale_until, return value AND launch async refresh task (combined with single-flight to avoid 1000 background refreshes). If now ≥ stale_until, treat as miss — block on refresh. Net effect: users almost never wait for cache rebuilds; database sees a single background refresh per expiry. Used in HTTP (Cache-Control: stale-while-revalidate=300), in many CDN configs, in app frameworks (SWR React library, Next.js ISR). Combine with single-flight: only one background refresh at a time.',
      example:
        'Vercel\'s ISR (Incremental Static Regeneration) implements this for HTML: serve the cached page (even if technically expired) while regenerating in background. Pages stay fast for users; regeneration happens once, not 10,000 times.',
    },
    {
      title: 'Prevention 4 — TTL Jitter',
      icon: '🎰',
      layman:
        'When you load 10,000 cache entries at the same moment (e.g., during application startup or after a deploy), they all expire at the same moment too. To prevent this synchronized expiry stampede, add a random spread to the TTL — instead of all 10,000 keys having TTL=60, make them TTL=50–70 (uniform random). Now expiries spread out over 20 seconds.',
      technical:
        'Pattern: ttl = base_ttl + random.uniform(-jitter, jitter); cache.set(key, value, ttl). Common: ±20% jitter. Without jitter, mass-loaded keys cause periodic spikes every TTL seconds. With jitter, expiries smear evenly. Apply jitter to: (1) bulk loads (warming, batch refresh), (2) deploy-time cache resets, (3) any place identical TTLs are computed for many keys at once. Costs nothing; prevents one of the most common stampede patterns.',
      example:
        'A team noticed CPU spikes every 5 minutes on their API servers — exactly aligned with the cache TTL. Investigation revealed that they bulk-loaded user permissions at startup, and all keys expired together, hammering the auth DB every TTL period. Fix: add ±10% jitter on each set. Spike disappeared.',
    },
    {
      title: 'Prevention 5 — Background Refresh / Pre-Warming',
      icon: '🔥',
      layman:
        'For known-hot keys, never let them expire under user-driven traffic. Run a background job that refreshes them just before TTL is reached. The cache is always fresh from the user\'s perspective; the background job pays the rebuild cost.',
      technical:
        'Approach 1: Scheduled refresh — cron / job runs every N seconds, refreshes a known set of hot keys. Approach 2: Adaptive — cache layer tracks per-key access rate; auto-refreshes any key above threshold. Approach 3: Pre-warm after deploy — before flipping traffic to a new deploy, run scripts that populate cache for top-N hottest keys. Combines naturally with stale-while-revalidate. Best for: known long-lived hot keys (front page, top sellers, trending content). Less useful for unpredictable hot-key emergence.',
      example:
        'Amazon pre-warms product detail caches for the top 10,000 SKUs at the start of each Prime Day. The first user click on a popular item is already cached. Without pre-warming, the first-minute traffic spike would stampede every popular SKU simultaneously.',
    },
    {
      title: 'Prevention 6 — Negative Caching with Locks',
      icon: '🚫',
      layman:
        'A subtle stampede variant: thousands of requests asking for a non-existent entity (e.g., a deleted user, a typo\'d URL). Each one is a cache miss followed by a DB miss. Cache the "not found" result so repeated probes do not hit the DB.',
      technical:
        'Pattern: on DB miss, cache.set(key, NULL_SENTINEL, ex=30). Read path checks for NULL_SENTINEL and returns 404 without going to DB. Combined with lock-on-miss to prevent the negative cache itself from stampeding. Without negative caching, an attacker probing /products/{random_id} can DDoS the database — every request is a miss with no cache benefit.',
      example:
        'Many APIs use cached 404 responses with shorter TTLs (10–60s). Stripe caches "API key not found" lookups to prevent enumeration attacks from melting their auth backend.',
    },
  ],

  comparison: {
    caption: 'Stampede prevention techniques compared.',
    columns: ['Technique', 'How It Works', 'Cost', 'Best For'],
    rows: [
      ['Lock on miss (single-flight)', 'Only one request rebuilds; others wait', 'Latency for waiters', 'Hot keys, expensive rebuilds'],
      ['Probabilistic early expiration', 'One request refreshes early', 'Tiny CPU per read', 'High-traffic keys, no waiting'],
      ['Stale-while-revalidate', 'Serve old, refresh async', 'Tolerated staleness window', 'User-facing reads'],
      ['TTL jitter', 'Spread expiries over time', 'Trivial', 'Bulk-loaded keys'],
      ['Background refresh', 'Scheduled pre-emptive refresh', 'Always-on job', 'Known hot keys'],
      ['Negative caching', 'Cache 404s', 'Memory for sentinels', 'Probing attacks, missing entities'],
    ],
  },

  realWorldExamples: [
    {
      company: 'Reddit',
      icon: '🤖',
      description:
        'Reddit famously suffered cache stampedes during viral events: front-page cache expiry during a million-RPS surge crushed Cassandra. Their fix combined stale-while-revalidate, per-key locks, and longer base TTLs for high-traffic content. They wrote publicly about the incident response — a canonical postmortem on cache stampede recovery.',
    },
    {
      company: 'Facebook (Memcached Leases)',
      icon: '👥',
      description:
        'Facebook invented "leases" — a small coordination primitive in Memcached. When a client misses a key, it gets a unique 64-bit token; only the holder of the token can write back to the cache. Concurrent missers either wait for the lease holder or return stale data. Effectively single-flight at Memcached protocol level. Documented in their 2013 "Scaling Memcache" paper.',
    },
    {
      company: 'Vercel ISR (stale-while-revalidate)',
      icon: '▲',
      description:
        'Vercel\'s Incremental Static Regeneration serves cached pages even after their "fresh" window, kicking off background regeneration when traffic arrives on a stale page. Users always get fast responses; rebuilds happen once at the edge per stale interval. Standard pattern for modern frontend frameworks.',
    },
    {
      company: 'Discord (background refresh for hot guilds)',
      icon: '💬',
      description:
        'Discord identified that some "guilds" (servers) get traffic 1000× the median. They run scheduled background refreshes on these hot guild caches so their TTL never lapses under user traffic. Combined with consistent hashing tuned to spread hot guilds across nodes, they keep tail latency tight even under heavy load.',
    },
  ],

  interviewQuestions: [
    {
      question: 'What is a cache stampede and why is it dangerous?',
      answer:
        'A cache stampede happens when a popular cache key expires and many requests simultaneously miss, all rushing to refill it from the database. The database, which was being shielded by the cache (handling <1% of traffic), suddenly handles 100% — concentrated in milliseconds. Latency rockets, the database can saturate, and downstream services time out. The cache, ironically, becomes the trigger for the outage. The hotter the key and the more expensive the rebuild, the worse the impact.',
    },
    {
      question: 'How do you prevent cache stampedes?',
      answer:
        'Multiple strategies, often combined: (1) Lock on miss / single-flight — only one request rebuilds; others wait. (2) Probabilistic early expiration (XFetch) — requests stochastically refresh slightly before TTL. (3) Stale-while-revalidate — serve old value and refresh async. (4) TTL jitter — randomize TTL ±20% to prevent synchronized expiries. (5) Background refresh / pre-warming — scheduled jobs keep hot keys always fresh. (6) Negative caching — cache "not found" to prevent DB hammering on missing keys. Pick based on workload: stale-while-revalidate for user-facing reads, locks for very expensive computations, jitter as a cheap baseline everywhere.',
    },
    {
      question: 'Explain the lock-on-miss pattern in detail.',
      answer:
        'On a cache miss, the request attempts to acquire a distributed lock on the key (e.g., Redis SET NX EX). If acquired, the request fetches from DB, populates cache, releases lock. If not acquired, another request is already working — this request can (a) wait briefly and retry the cache, (b) serve stale data if available, or (c) error out gracefully. Single-flight at scale: 10,000 concurrent missers collapse into 1 DB query plus 9,999 waits. Pitfalls: lock holder dying (TTL on lock prevents deadlock), waiters polling too aggressively (use exponential backoff), lock acquisition itself becoming a bottleneck (per-process pre-lock plus distributed post-lock).',
    },
    {
      question: 'You bulk-load 10,000 keys at startup all with TTL=60. What problem does this create?',
      answer:
        'Synchronized expiry stampede. Sixty seconds after startup, all 10,000 keys expire simultaneously. The next 60 seconds of traffic includes a flood of misses for these keys, each requiring a rebuild. Database CPU spikes; latency degrades; this repeats every 60 seconds forever. Fix: add jitter to TTLs — ttl = 60 + random.uniform(-12, 12). Now expiries spread over 24 seconds, the database sees a smooth flow of refresh queries instead of bursts. Costs nothing; eliminates one of the most common stampede patterns.',
    },
    {
      question: 'How does stale-while-revalidate work and when would you use it?',
      answer:
        'Cache entries have two TTLs: fresh_until and stale_until. While fresh, return immediately. Between fresh and stale, return the old value AND fire a background refresh (single-flighted). Past stale, treat as a hard miss. Net effect: users almost never wait for cache rebuilds; the database sees one background refresh per expiry instead of a stampede. Use for user-facing reads where slight staleness is acceptable: HTML pages, product listings, feed snapshots. Less suitable for strict-consistency reads where any staleness is unsafe.',
    },
  ],

  commonMistakes: [
    'Identical TTL on bulk-loaded keys — synchronized expiry creates periodic stampedes.',
    'No protection on hot keys — relying on luck that the rebuild is fast enough.',
    'Lock with no TTL — if the lock holder dies, all readers hang forever.',
    'Polling for the lock too aggressively — the polling itself overloads the cache.',
    'Forgetting negative caching — every probe for a missing entity bypasses the cache and hits the DB.',
    'Treating stampede as theoretical — most large outages have a stampede component; protection should be on by default.',
    'Stale-while-revalidate without single-flight — every stale read triggers a background refresh, defeating the purpose.',
  ],
};
