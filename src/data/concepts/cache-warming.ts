import type { ConceptDeepDive } from '../../types';

export const cacheWarming: ConceptDeepDive = {
  moduleId: 'cache-warming',
  tagline: 'Filling the cache before traffic hits — solving the cold-start problem',

  introduction: {
    layman:
      'Cache warming is the practice of populating a cache with data BEFORE your real users start hitting it. A "cold" cache (just deployed, just restarted, just flushed) has zero hits — every request is a miss, every miss goes to the database, and the database melts under traffic that the warm cache would normally absorb. Warming proactively fills the cache so the first user sees a hit, not a miss.',
    analogy:
      'Imagine running a popular restaurant. Every morning, the kitchen prepares a base supply of soups, sauces, and prepped vegetables — "mise en place" — so when customers arrive at lunch, orders go out fast. If the chef started cooking each ingredient from scratch when the first customer ordered, lunch service would collapse. Cache warming is mise en place for distributed systems.',
    whyMatters:
      'Cold caches are responsible for many of the most painful production incidents: deploys that crash the database, recovery cycles that never recover because every retry is a fresh miss, autoscaling new pods that all stampede the source. Senior engineers must know how to identify hot keys, when to warm proactively, and how to do it without itself causing a stampede.',
  },

  subTopics: [
    {
      title: 'The Cold Cache Problem',
      icon: '🥶',
      layman:
        'When a cache starts empty, every request misses. Every miss becomes a database query. If your normal traffic is 100,000 RPS with a 99% cache hit rate, the database normally handles ~1,000 RPS. With a cold cache, the database suddenly handles all 100,000 RPS. It almost certainly cannot. Latency rockets, requests time out, and the cache barely fills before the system melts.',
      technical:
        'Cold cache failure modes: (1) Deploy-time invalidation — cache wiped on deploy, traffic immediately misses. (2) Restart — Redis restart wipes RAM unless persistence enabled; even with AOF, restart-from-disk takes minutes. (3) Auto-scaling — new pods join with empty in-process caches; their first 1000 requests all miss. (4) Manual flush — operator runs FLUSHALL, often during incident response, and triggers a worse incident. (5) Cache failure — Redis cluster goes down, clients fall back to DB, DB melts. Quantitatively: a service designed for 99% hit rate has 100× spare DB capacity vs steady-state. Cold cache means using 100% of available DB capacity at the same RPS — guaranteed saturation.',
      example:
        'A real outage pattern: team deploys new code, accidentally invalidates ALL cache keys. Within seconds, every read becomes a DB miss. The DB hits CPU saturation, queries time out, app pods restart due to health check failures, restarted pods have empty in-process caches and pile back on. Recovery requires manual rate limiting until the cache rewarms — sometimes an hour or more.',
    },
    {
      title: 'What to Warm — Identifying the Hot Set',
      icon: '🎯',
      layman:
        'You cannot pre-load everything; the cache is much smaller than the database. The goal is to load the items most likely to be requested. Usually, this means the top-N most-popular keys: top 1% of products, most-trending posts, most-active users.',
      technical:
        'Strategies to identify hot keys: (1) Access logs — analyze the previous N hours of cache request logs; rank keys by frequency; warm the top X%. (2) Analytics events — page views, search counts, click-through; rank entities by traffic. (3) Domain knowledge — known hot lists (top sellers, breaking news, featured items). (4) Real-time tracking — count-min sketch or top-K data structure built from live traffic. (5) Heuristic — last 24h of writes (recent items often re-read soon). Goal: warm 80% of expected request volume with X% of cache capacity (Pareto). Concretely: an e-commerce site might warm the top 10,000 products to cover 80% of product page views.',
      example:
        'Twitter pre-warms timelines for active users (logged in within 7 days) on a rolling basis. Inactive users are warmed on demand. This concentrates cache memory on the population actually using the product right now.',
    },
    {
      title: 'When to Warm — Triggers and Timing',
      icon: '⏰',
      layman:
        'Common moments to warm: before a deploy, after a restart, before a known traffic spike, when a new pod starts up, during off-peak hours to refresh expired entries. The trick is doing it in time without itself overloading the source.',
      technical:
        'Warming triggers: (1) Pre-deploy — script runs before traffic flips to new version; gates the deploy on cache fullness. (2) Pre-launch / pre-event — warm before a marketing campaign, sale, or product launch. (3) Pod startup — newly-spawned pods read a "warmup file" from S3 or peer pods to populate in-process caches before accepting traffic. (4) Periodic — cron jobs refresh hot keys every N minutes regardless of TTL. (5) Predictive — ML-driven warming based on time-of-day patterns. (6) Post-incident — after a flush or outage, warming script restores the cache before reopening to traffic. Anti-pattern: warming the cache and accepting traffic in parallel — ramps in tension.',
      example:
        'Amazon pre-warms product detail caches for the top 10,000 SKUs before Prime Day. Their deployment process gates traffic ramp-up on cache fullness — they do not ramp from 1% to 100% until the cache has the expected hot keys loaded.',
    },
    {
      title: 'Warming Approaches — How to Actually Fill the Cache',
      icon: '🔧',
      layman:
        'There are several mechanical approaches: replay logged URLs, snapshot another running instance, run synthetic queries, or stream from a backup. Each has tradeoffs in fidelity, speed, and source impact.',
      technical:
        'Approach 1: Replay traffic — capture last hour of production requests, replay them against the cache layer (with reads to populate). Authentic traffic shape; requires capture infrastructure. Approach 2: Snapshot from existing instance — Redis MIGRATE or SAVE/LOAD between instances; fastest but only when an existing warm cache is available. Approach 3: Persistence-based — Redis AOF/RDB on disk; on restart, load from disk (~minutes for large datasets). Approach 4: Synthetic warmer — script issues GETs for known hot keys (e.g., top 1000 from a known list); fast, controllable, but risks not matching actual traffic. Approach 5: Source-side bulk — read from DB and populate cache directly via pipeline (mass MSET or pipelined SETs); efficient but bypasses application logic. Approach 6: Tiered warming — fastest hot-set first, cold-set later in background.',
      example:
        'Netflix\'s EVCache uses a "cache warmer" service that reads from a sister region\'s warm EVCache (cross-region read), populating a freshly-deployed region in minutes. No DB load involved.',
    },
    {
      title: 'Avoiding Warmup Stampede',
      icon: '🌊',
      layman:
        'Warming itself can stampede the source: if a cron job tries to load 100,000 keys all at once, the database is hit by 100,000 simultaneous queries — exactly the problem you were trying to prevent. Throttle the warmup process.',
      technical:
        'Throttling techniques: (1) Rate-limited warmup — load N keys per second, not all at once. Tune to source\'s comfortable load. (2) Pipelined / batched fetches — group keys into batched DB queries (SELECT * FROM products WHERE id IN (1, 2, 3, ...)). (3) Incremental warmup — start with top 100, monitor load, expand to next 1000 if healthy, etc. (4) Coordinator-based — single warmup leader to prevent multiple instances all warming the same keys. (5) Use replicas — warm cache from a read-replica DB to avoid impacting primary writes. (6) TTL jitter on warmed keys — to prevent synchronized expiry stampede later.',
      example:
        'A team\'s warmup script tried to load 1M product keys at deploy. The bulk SELECT crashed the read replica (long-running query, replication lag). Fix: paginated warmer reading 5,000 keys per batch with 100ms sleep between batches, completed in 5 minutes with no impact.',
    },
    {
      title: 'Cache Warming for Auto-Scaling and New Pods',
      icon: '🔄',
      layman:
        'When you autoscale and new app pods join, they often have empty in-process caches. Each pod must warm its local cache before its requests behave like the cluster average. Without warming, new pods amplify load on shared caches and databases.',
      technical:
        'Patterns: (1) Out-of-rotation warmup — Kubernetes readiness probe gates traffic until warmer completes. (2) Warm-from-peer — new pod queries an existing pod\'s in-process cache via internal API. (3) Bootstrap from S3 — periodically dumped cache snapshot, loaded by new pods on startup. (4) Lazy warmup — new pods accept reduced traffic share until their hit rate matches cluster average. (5) Pod-anti-affinity — schedule new pods on nodes near warm caches. For per-pod LRU caches (Caffeine, in-memory dicts), the warmup data is small enough to ship via internal endpoint at startup.',
      example:
        'LinkedIn\'s services often expose a /warmup endpoint that, when called, loads a configured set of hot data into in-process caches and reports readiness. The Kubernetes readiness probe blocks traffic until the warmup completes — preventing cold-pod traffic amplification.',
    },
    {
      title: 'Warming vs Refreshing — Different Goals',
      icon: '🆚',
      layman:
        'Warming fills an empty cache. Refreshing keeps an already-populated cache fresh. They use similar techniques but solve different problems. Both are needed for production: warming on cold start, refreshing during steady-state to prevent expiry-induced stampedes.',
      technical:
        'Warming: cache empty (or almost empty); goal is to populate quickly without overloading source. One-shot or burst. Refreshing: cache populated; goal is to update entries before they expire so users never see misses on hot keys. Continuous, scheduled. Refreshing is essentially "perpetual cache warming for the hot set." Combine: schedule refresh-cron for top-N keys every N seconds (less than TTL); on cold start, run warmup that loads the same top-N. Same target list, different cadence.',
      example:
        'A search service\'s autocomplete cache: bulk-warmed at deploy with the top 100K queries (warming), then refreshed every 5 minutes by a background job that re-fetches the top 1K (refreshing). New trending queries naturally percolate into the top 1K and get refreshed.',
    },
  ],

  comparison: {
    caption: 'Cache warming approaches compared.',
    columns: ['Approach', 'Speed', 'Source Load', 'Fidelity', 'Best For'],
    rows: [
      ['Traffic replay', 'Slow', 'High (real queries)', 'Excellent', 'Pre-deploy correctness'],
      ['Snapshot from peer', 'Fast', 'None (peer-to-peer)', 'Excellent', 'Multi-region replication'],
      ['Persistence (AOF/RDB)', 'Medium', 'None', 'Excellent', 'Restart recovery'],
      ['Synthetic warmer (top-N)', 'Fast', 'Medium (bulk SELECT)', 'Good if list is right', 'Pre-deploy, pod startup'],
      ['Source-side bulk', 'Fastest', 'Concentrated', 'Excellent', 'Bulk warm at scale'],
      ['Lazy / on-demand', '∞', 'Distributed over time', 'Perfect', 'Steady-state misses only'],
    ],
  },

  realWorldExamples: [
    {
      company: 'Amazon (Prime Day prep)',
      icon: '📦',
      description:
        'Amazon famously runs extensive warming routines before Prime Day: all caches across the stack (product details, search, recommendations) are pre-loaded with the top SKUs likely to be hot. Traffic ramp is gated on cache fullness; they do not unleash full traffic until the cache shows expected hit rates. This is a textbook example of warming as a deployment / launch discipline.',
    },
    {
      company: 'Netflix (EVCache cross-region warmup)',
      icon: '🎬',
      description:
        'Netflix EVCache supports cross-region warming: a freshly-deployed cache cluster reads from a peer region\'s warm cache to populate itself. No origin DB load required. Combined with automatic TTL jitter to avoid synchronized re-expiry. They publish about this in their tech blog as "cache warming via peer replication."',
    },
    {
      company: 'Twitter (active-user warming)',
      icon: '🐦',
      description:
        'Twitter pre-warms timelines for users active in the last 7 days. The warming runs continuously, not as a deploy event — it is a steady-state background process that ensures the active user set always has fresh timelines cached. Inactive users are warmed lazily on first request. Concentrates cache resources on currently-engaged users.',
    },
    {
      company: 'Stripe (deploy gating on cache health)',
      icon: '💳',
      description:
        'Stripe\'s deploy process includes cache-health gates: before traffic ramps to new versions, automated checks verify cache hit rates and key population. If a deploy somehow flushed caches, the deploy halts before user traffic could expose the cold-cache stampede.',
    },
  ],

  interviewQuestions: [
    {
      question: 'What is cache warming and why does it matter?',
      answer:
        'Cache warming is proactively populating a cache with expected hot data before user traffic arrives. It matters because a cold cache has 100% miss rate — every request goes to the database, which is normally protected by ~99% cache hit rate. The sudden 100× DB load during cold-cache periods (deploys, restarts, autoscaling, manual flushes) is one of the most common causes of production outages. Warming pays the rebuild cost on a controlled schedule instead of letting users trigger it.',
    },
    {
      question: 'How do you decide what to warm?',
      answer:
        'Identify the hot set: typically the top 1–5% of keys that account for 80%+ of request volume (Pareto distribution). Sources: (1) access logs — past N hours of cache requests, ranked by frequency. (2) Domain knowledge — known hot lists (top sellers, featured content). (3) Analytics — page-view counts, click-through. (4) Real-time top-K data structures (count-min sketch). Goal: small enough to load quickly, broad enough to cover the bulk of expected traffic. Warm 1–10% of the cache by capacity, expect to cover 60–80% of requests right after warming.',
    },
    {
      question: 'How would you warm a cache without overloading the database?',
      answer:
        'Throttle aggressively: (1) Rate-limited loader — load N keys per second, tuned to the database\'s comfortable spare capacity. (2) Batched fetches — combine many key lookups into single bulk queries (WHERE id IN ...). (3) Use a read replica — direct warmup queries to replicas, avoiding write-primary load. (4) Incremental ramp — start with top 100, monitor DB metrics, scale up if healthy. (5) Coordinator-based — a single warm-leader, not all pods warming simultaneously. (6) Preferred: warm from a peer cache, not the database, when possible (cross-region or in-place restart).',
    },
    {
      question: 'What is the cold-start problem during autoscaling?',
      answer:
        'When new app pods spin up, their in-process caches (Caffeine, in-memory dicts) are empty. Their first thousands of requests all miss, falling through to the shared cache or DB. This amplifies load on shared resources just when traffic is rising (the reason for autoscaling). Mitigations: (a) Warmup before accepting traffic (readiness probe gates rollout). (b) Bootstrap from S3 snapshot or peer pod. (c) Lazy ramp — new pod accepts a reduced share of traffic until its hit rate normalizes. (d) Skip per-pod cache and rely on shared distributed cache only.',
    },
    {
      question: 'Should you warm with traffic replay or synthetic queries?',
      answer:
        'Traffic replay (capture real recent requests and replay them) gives high fidelity — exact same key shapes and access distribution. Cost: requires capture infrastructure; load on source matches real load. Synthetic queries (predefined top-N list) are simpler and faster but only as good as the list — if your hot list is stale, you warm wrong keys. In practice, big sites use hybrid: synthetic warmer for the obviously-hot set, replay or live traffic for the long tail. Pick replay when correctness matters; pick synthetic for speed and simplicity.',
    },
  ],

  commonMistakes: [
    'No warmup at all — accepting that every deploy or restart causes a brief outage.',
    'Warmup that itself stampedes — bulk-loading 1M keys at once melts the source.',
    'Warming with the wrong list — last week\'s hot keys are not this week\'s; refresh the list.',
    'No TTL jitter on warmed keys — they all expire at the same moment, creating a synchronized stampede later.',
    'Forgetting per-pod caches — distributed cache is warm but new pods\' in-process LRUs are still empty.',
    'Warming and serving traffic in parallel — defeats the purpose; gate traffic on warm-completion.',
    'Manual warmup procedures — error-prone; automate as part of deploy and pod-readiness pipelines.',
  ],
};
