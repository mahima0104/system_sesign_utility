import type { ConceptDeepDive } from '../../types';

export const cacheEvictionPolicies: ConceptDeepDive = {
  moduleId: 'cache-eviction-policies',
  tagline: 'When the cache is full, what gets thrown out — and why it matters',

  introduction: {
    layman:
      'A cache has limited memory. When it fills up and a new item needs to come in, something old has to go out. The eviction policy is the rule that picks which one. Different policies suit different workloads: some discard the item not used in the longest time, others discard the least-popular item, others just drop the oldest. The choice can change your cache hit rate by 30 percentage points.',
    analogy:
      'Your fridge has limited space. When you bring home groceries and there is no room, you pick something to throw out. Do you throw out the food you have not touched in the longest time (LRU)? The food you bought first regardless of use (FIFO)? The food you eat least often (LFU)? Or whatever you grab first (random)? Each rule fits different shopping habits.',
    whyMatters:
      'Eviction policy is one of the few cache decisions that directly determines hit rate. Choosing LFU when your workload is recency-skewed wastes memory; choosing LRU when one cold scan dominates your access pattern flushes hot data. Senior engineers must know the seven main policies, their math, their workload fits, and their production cost.',
  },

  subTopics: [
    {
      title: 'LRU — Least Recently Used',
      icon: '🕐',
      layman:
        'LRU evicts the item that has not been accessed for the longest time. Every time you read or write a key, it moves to the "front" of an internal list. The item at the back has been ignored the longest, so it gets evicted first.',
      technical:
        'Implementation: doubly-linked list + hash map. On access, O(1) to remove the node from its current position and move it to the head. On eviction, O(1) to drop the tail. Variants: approximate LRU (Redis maintains 5–10 candidate samples and evicts the LRU among them, avoiding O(N) bookkeeping). Memory overhead: ~16 bytes per key for pointers and timestamps. Best for workloads with strong recency bias — items just accessed are likely to be accessed again soon. Suffers under "scan" workloads: a one-time scan touches every key once, evicting all hot data.',
      example:
        'Linux page cache uses approximate LRU (the "active/inactive" list), as does Redis with maxmemory-policy=allkeys-lru. Memcached\'s default is LRU. Browser caches typically LRU. Most general-purpose caching needs.',
      whenToUse:
        'Default choice for general workloads. Best when access patterns favor recently-touched items (most web caches, session caches, profile caches).',
    },
    {
      title: 'LFU — Least Frequently Used',
      icon: '📊',
      layman:
        'LFU tracks how many times each item has been accessed. When eviction is needed, the item with the lowest access count gets thrown out. Popular items stick around regardless of how recently they were used.',
      technical:
        'Implementation: counter per key, plus a priority queue or bucket structure (min-heap, sorted set, or a frequency-list). On access, increment counter (O(1)). On eviction, find min counter (O(log N) heap or O(1) with a frequency-list). Variants: Redis allkeys-lfu approximates LFU using a logarithmic counter (15-bit, decays over time so old hits do not lock keys forever). Best for workloads with stable popularity distributions: a small set of items always hot, rest cold. Suffers when popularity shifts: a once-hot item that is no longer needed still has a high counter and resists eviction. Needs counter aging.',
      example:
        'CDN edges sometimes use LFU because asset popularity follows a long-tail Zipfian distribution — a few items dominate. Database query result caches (e.g., MySQL query cache historically) used LFU-like policies. Redis "allkeys-lfu" is increasingly popular for product catalog caches.',
      whenToUse:
        'Best when access frequency is the primary signal of value and popularity is stable. Combine with aging (decaying counters) to handle shifting popularity.',
    },
    {
      title: 'FIFO — First In, First Out',
      icon: '🧾',
      layman:
        'FIFO is the simplest policy: items are evicted in the order they were inserted, regardless of access patterns. The oldest insertion gets thrown out first, like rotating stock in a warehouse.',
      technical:
        'Implementation: a single queue. Insert at the tail, evict from the head. O(1) operations. Memory overhead: minimal (one pointer per key). No bookkeeping on access (touches the queue only on insertion/eviction). Workload fit: items where insertion order correlates with how long they remain useful — newest data most relevant, oldest disposable. Often a poor general-purpose choice because it ignores access patterns: a hot item inserted long ago gets evicted while a cold item inserted recently survives.',
      example:
        'Some streaming pipelines use FIFO eviction for time-windowed caches (e.g., last 5 minutes of metrics). Time-bounded data naturally suits FIFO since old items must go regardless of access.',
      whenToUse:
        'Use when insertion order is the right signal — time-windowed data, append-only logs, queue-like behavior. Avoid for general key-value caching.',
    },
    {
      title: 'Random Replacement',
      icon: '🎲',
      layman:
        'Random replacement picks a random item to evict. No bookkeeping, no priority — just pick one and drop it. Surprisingly close to LRU performance for many workloads, with much less overhead.',
      technical:
        'Implementation: keep keys in an array; on eviction, pick a random index. O(1) operations, no per-access bookkeeping. Performance: research shows random eviction often comes within 10–20% of LRU for typical workloads, sometimes better when scan-resistance matters. Used by some hardware caches (CPU cache lines) where bookkeeping overhead exceeds the benefit. Redis has maxmemory-policy=allkeys-random.',
      example:
        'CPU caches often use random or pseudo-random replacement at the L1/L2 level — the per-access bookkeeping for LRU would be too expensive at GHz speeds. Some database buffer pools use random replacement under specific configurations.',
      whenToUse:
        'When per-access bookkeeping is too expensive (hardware caches), or when randomness provides scan resistance (no key is favored, so a sequential scan does not specifically evict hot items).',
    },
    {
      title: 'MRU — Most Recently Used',
      icon: '🔁',
      layman:
        'MRU evicts the most recently used item — the opposite of LRU. Counter-intuitive, but useful when the most-recent access is unlikely to repeat. Imagine reading a long article: once you finish a section, you do not need it cached anymore.',
      technical:
        'Implementation similar to LRU but evicts from the head instead of the tail. Workloads where MRU helps: linear scans (database table scans where each row is read exactly once and never again), sequential file reads. In these workloads, LRU is exactly wrong — it evicts the data least likely to be re-accessed. MRU is one of the few cases where evicting the most-recent item is correct.',
      example:
        'Some database engines switch to MRU for sequential table scans because the next row to read is brand-new, while the just-read row will not be revisited within the scan.',
      whenToUse:
        'Rare but specific: linear / sequential access patterns, large one-pass scans, batch processing where re-access is unlikely.',
    },
    {
      title: 'TTL — Time-To-Live',
      icon: '⏰',
      layman:
        'TTL evicts items based on their age, not their access pattern. Each item is given an expiration time when stored; once that time passes, the item is removed regardless of how often it was used. Often used alongside another policy (like LRU) as a sanity-check upper bound.',
      technical:
        'Implementation: store an expiry timestamp per key. Eviction can be (a) lazy — check expiry on read, drop if expired; (b) active — periodic background sweep deletes expired keys; (c) hybrid (Redis does both). TTL is not really an eviction policy on its own; it is a freshness bound. Combined with LRU/LFU, it ensures stale data does not linger even if it stays "popular" by access count. Tradeoffs: tight TTL = more misses; loose TTL = stale data risk.',
      example:
        'Redis defaults: lazy expiration on read + active sampling (every 100ms, sample 20 random keys, evict expired ones; if more than 25% expired, repeat). Combined with maxmemory-policy=volatile-lru means: keys with a TTL get LRU-evicted when memory is full, untimed keys are protected.',
      whenToUse:
        'Almost always — set TTLs even with another eviction policy. Use TTL as the primary eviction signal when freshness is the key concern (e.g., short-lived auth tokens, real-time market data).',
    },
    {
      title: 'Two-Tiered Caching',
      icon: '🪜',
      layman:
        'Some systems split eviction across two layers: a small "hot" cache with one policy (often LRU) and a larger "cold" cache with another (often LFU or FIFO). New items enter the cold cache; if accessed often, they are promoted to the hot cache. This combines the strengths of multiple policies.',
      technical:
        'Architecture: tier 1 (hot, LRU, e.g., 10% of memory) for items that have been promoted; tier 2 (cold, LFU or FIFO, 90% of memory) for newly inserted or re-inserted items. On access in T2, increment a counter; once it crosses a threshold, promote to T1. On eviction from T1, demote back to T2 instead of dropping immediately. Variants: ARC (Adaptive Replacement Cache, used in ZFS), 2Q (introduced in 1994), Caffeine\'s W-TinyLFU (approximate LFU + small LRU window — currently the highest-hit-rate algorithm in widely-used libraries).',
      example:
        'Caffeine (Java) uses W-TinyLFU and consistently achieves 5–15% higher hit rate than plain LRU on typical workloads. ZFS uses ARC, which dynamically rebalances between recency-favoring and frequency-favoring sub-caches.',
      whenToUse:
        'When your cache library supports it (Caffeine, ARC), prefer it over plain LRU/LFU. The extra complexity is hidden behind the library; the benefit (higher hit rate, better scan resistance) is real and measurable.',
    },
  ],

  comparison: {
    caption: 'Cache eviction policies compared.',
    columns: ['Policy', 'Eviction signal', 'Overhead', 'Best for', 'Weakness'],
    rows: [
      ['LRU', 'Recency of access', 'Medium (timestamp / list)', 'General workloads', 'Scan workloads flush hot data'],
      ['LFU', 'Frequency of access', 'High (counters)', 'Stable popularity', 'Slow to adapt to shifts'],
      ['FIFO', 'Insertion order', 'Low', 'Time-windowed data', 'Ignores access patterns'],
      ['Random', 'Random pick', 'Very low', 'Hardware / scan resistance', 'Suboptimal hit rate'],
      ['MRU', 'Most recently accessed', 'Medium', 'Linear scans', 'Wrong for typical workloads'],
      ['TTL', 'Age', 'Low', 'Freshness-bounded data', 'Not size-aware alone'],
      ['Two-tiered (W-TinyLFU)', 'Hybrid', 'Higher', 'Production-grade caching', 'More complex'],
    ],
  },

  realWorldExamples: [
    {
      company: 'Redis',
      icon: '🔴',
      description:
        'Redis supports 8 maxmemory-policy settings: noeviction, allkeys-lru, allkeys-lfu, allkeys-random, volatile-lru, volatile-lfu, volatile-random, volatile-ttl. The most common production choice is allkeys-lru for general caches, allkeys-lfu for skewed-popularity workloads (CDN-like access patterns). Redis uses approximate LRU/LFU for O(1) operations.',
    },
    {
      company: 'Caffeine (Java)',
      icon: '☕',
      description:
        'Caffeine implements W-TinyLFU — a hybrid that admits new items only if they have a higher estimated frequency than the current eviction candidate. Used inside Cassandra, HBase, Spring, and many JVM apps. Independently benchmarked to outperform plain LRU by 5–15% on real-world workloads.',
    },
    {
      company: 'ZFS (ARC)',
      icon: '🗄️',
      description:
        'ZFS file system uses Adaptive Replacement Cache (ARC), which maintains both recency-favoring and frequency-favoring lists and dynamically tunes the balance based on observed hit/miss patterns. ARC outperforms LRU in mixed workloads where neither pure recency nor pure frequency is optimal.',
    },
    {
      company: 'Memcached',
      icon: '🐘',
      description:
        'Memcached uses LRU exclusively, with slab-class-specific eviction. Each slab class (fixed-size memory chunks) maintains its own LRU list. The simplicity is a feature: predictable behavior, low overhead, easy to operate at huge scale. Facebook runs hundreds of thousands of Memcached instances on this single policy.',
    },
  ],

  interviewQuestions: [
    {
      question: 'Compare LRU and LFU. When does each win?',
      answer:
        'LRU evicts items not accessed recently; LFU evicts items not accessed often. LRU adapts quickly to workload shifts (recently-touched items survive). LFU protects long-stable hot items even if they had a quiet hour. LRU wins for general workloads with shifting popularity. LFU wins when you have a small set of always-hot items and a long tail of rarely-touched ones (Zipfian distributions). LFU\'s weakness: a once-hot, now-cold item resists eviction (counter is high). Mitigation: counter aging or hybrids like W-TinyLFU.',
    },
    {
      question: 'Your workload is dominated by a periodic full table scan that touches every cached key once. What happens with LRU? What is a better choice?',
      answer:
        'With LRU, the scan touches every key once, "refreshing" their position to the head of the list. The actually-hot keys (which were not touched during the scan) get pushed to the tail and evicted. The cache is now full of scan data that will never be re-read. Better choices: (a) MRU during the scan — evict the most recent items so the scan does not flush hot data; (b) Two-tiered (W-TinyLFU, ARC, 2Q) — admission-based; only promotes items into hot tier after multiple accesses; one-time scan touches go straight back to eviction; (c) Bypass cache for the scan — read directly from source.',
    },
    {
      question: 'How does Redis approximate LRU and why?',
      answer:
        'A true LRU requires a doubly-linked list of all keys and ordered updates on every access — expensive memory and pointer overhead. Redis instead samples a small number of candidates (default 5; tunable to 10 for more accuracy) and evicts the LRU among the sample. This approximate LRU is within ~5% of true LRU at far lower cost. The same trick applies to LFU. The approximation is good enough for 99% of use cases and avoids O(N) bookkeeping.',
    },
    {
      question: 'How is TTL different from an eviction policy like LRU?',
      answer:
        'TTL evicts based on age (time elapsed since insertion or last refresh); LRU evicts based on access pattern when memory pressure occurs. They are orthogonal: TTL ensures freshness, LRU manages capacity. Real systems use both together — e.g., Redis with volatile-lru evicts the LRU among keys with TTL, leaving untimed keys protected. Without TTL, "popular" stale data could live forever; without LRU, the cache could fill up with rarely-accessed but unexpired keys.',
    },
    {
      question: 'Why do CPU caches often use random or pseudo-random replacement?',
      answer:
        'At GHz speeds and in hardware, the bookkeeping cost for LRU (updating timestamps or list pointers on every access) is prohibitive. Random eviction needs almost no bookkeeping and produces hit rates within 10–20% of LRU on typical workloads — an excellent tradeoff at hardware scale. Some processors use pseudo-random or "tree-based pseudo-LRU" as a compromise: a tiny tree of bits approximates LRU with O(log N) bits of state per cache line.',
    },
  ],

  commonMistakes: [
    'Defaulting to LRU without considering scan workloads — a single periodic scan can flush all hot data.',
    'Using LFU without counter aging — once-hot keys never get evicted even when no longer relevant.',
    'Setting maxmemory but forgetting maxmemory-policy — Redis defaults to noeviction, which causes write failures when memory fills.',
    'Using FIFO for general key-value caching — completely ignores access patterns, low hit rate.',
    'No TTL on cache keys — even with a good eviction policy, stale data lingers indefinitely if it stays "popular."',
    'Not measuring hit rate per policy — assumptions about workload often turn out wrong; always benchmark.',
  ],
};
