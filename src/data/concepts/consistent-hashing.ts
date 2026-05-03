import type { ConceptDeepDive } from '../../types';

export const consistentHashing: ConceptDeepDive = {
  moduleId: 'consistent-hashing',
  tagline: 'Distribute data so adding/removing nodes barely disturbs anything',

  introduction: {
    layman:
      'Imagine you\'re distributing 1 million customer records across 10 servers. The naive approach: server = customer_id % 10. Works great — until you add an 11th server. Now nearly every customer\'s server changes (because everything\'s mod 11 instead of mod 10). You\'d move ~91% of the data to rebalance. Consistent hashing solves this: when you add a node, only ~1/N of the data moves. The other 90% stays put.',
    analogy:
      'Picture a circular conveyor belt at a sushi restaurant with 10 chefs around it. Each customer\'s seat is a fixed spot; their dish travels clockwise to the nearest chef. Add an 11th chef — they slot into one place on the belt; the only customers affected are those whose nearest chef just changed. Everyone else continues being served by the same chef as before.',
    whyMatters:
      'Consistent hashing powers most distributed caches (Memcached client libraries, Redis Cluster), CDNs, distributed databases (Cassandra, DynamoDB), and any system where nodes scale up and down. Without it, every elastic scaling event would massively reshuffle data and hammer the underlying storage. It\'s also a perennial interview question because the math is elegant and reveals deep understanding.',
  },

  subTopics: [
    {
      title: 'The Problem with Naive Hashing',
      icon: '❌',
      layman:
        'Hash the key, mod by the number of nodes — that\'s naive hashing. Easy and fast. But change the node count and almost every key moves to a new node. For a cache, that means a near-total miss storm; for a database, a massive data shuffle.',
      technical:
        'partition_index = hash(key) % N. When N changes from 10 to 11, the modulo result changes for almost every key — only keys where hash(key) % 10 happens to equal hash(key) % 11 stay put. That\'s a tiny fraction. Result: scaling from N to N+1 nodes triggers ~(N-1)/N data movement.',
      example:
        'Memcached without consistent hashing: every time you add a memcached node, ~90% of cached entries become unreachable, the cache "miss-storm" hammers the database, and the system effectively grinds to a halt for the duration of the cache fill. This was a real production problem in the mid-2000s, and motivated consistent hashing\'s rapid adoption.',
    },
    {
      title: 'The Hash Ring',
      icon: '🔵',
      layman:
        'Imagine a circle. Hash both keys and node IDs onto this circle (each becomes a point on the ring). For each key, walk clockwise until you find a node — that\'s the node responsible for the key. Add a new node? It claims only the keys between it and the previous node — everyone else is undisturbed.',
      technical:
        'Hash range usually [0, 2^32-1] or [0, 2^64-1]. Each node hashes to one (or many) points on the ring. Each key hashes to one point. Lookup: take key\'s hash, search clockwise for the first node hash ≥ key\'s hash. Insert/remove a node: only keys in that node\'s slice are affected. Average expected disruption: 1/N when adding/removing one node.',
      example:
        'AWS DynamoDB internally uses consistent hashing to distribute partitions across thousands of nodes. When DynamoDB scales partitions during traffic spikes, only the affected partition\'s keys move — not the entire dataset. This is what enables their "auto-scaling without performance impact" claim.',
    },
    {
      title: 'Virtual Nodes (vnodes)',
      icon: '🌀',
      layman:
        'A pure ring has a problem: with few real nodes, key distribution is uneven — some nodes get a lot of keys, others get few. The fix: each physical node is mapped to many points on the ring (virtual nodes). With 100-200 virtual nodes per physical node, distribution becomes very even.',
      technical:
        'Each physical node N gets V virtual nodes (typically 100-200): hash(N + ":" + i) for i in 0..V. Physical-node responsibility = union of all its vnode ranges. Adding/removing a physical node moves V slices around the ring, each small. Distribution standard deviation drops as V grows; the trade-off is metadata overhead (more entries to track in the ring map).',
      example:
        'Cassandra uses 256 vnodes per physical node by default. Why so many? With fewer vnodes, when a node fails, the load redistributes to a small number of survivors, hotspotting them. With 256 vnodes, the failed node\'s load splits across 256 small slices, distributed across all surviving nodes — nearly perfect rebalancing.',
    },
    {
      title: 'Replication on the Ring',
      icon: '🛡️',
      layman:
        'For fault tolerance, store each key on more than one node. The simple rule: a key is owned by N consecutive nodes clockwise on the ring. Replication factor 3? Three sequential nodes. Lose one, the next one clockwise already has the data.',
      technical:
        'Replication factor R: each key replicated on R consecutive nodes clockwise from where it lands on the ring. Read/write quorums: write to W nodes, read from R nodes, with W + R > N for strong consistency. Cassandra exposes ANY/ONE/QUORUM/ALL knobs; DynamoDB defaults to quorum for strong reads. Topology-aware variants ensure replicas span racks/AZs/regions for failure independence.',
      example:
        'In Riak (and influential paper "Dynamo"), the system places replicas on the next R nodes clockwise. Configurable: in a multi-AZ deploy, the placement strategy ensures the R replicas land in different AZs so an AZ outage doesn\'t cost you the data.',
    },
    {
      title: 'Hot Keys & Skew',
      icon: '🔥',
      layman:
        'Consistent hashing distributes keys uniformly, but what if one key gets way more traffic than others? Justin Bieber\'s Twitter follower list, or a celebrity profile during a scandal. That single key\'s home node gets hammered while others sit idle. The hash ring can\'t fix this because the load is at one key.',
      technical:
        'Mitigations: (1) Caching the hot key extensively (out of the storage layer entirely). (2) Splitting the hot key into sub-keys (key#0, key#1, …, key#N) and aggregating client-side. (3) Replicating hot keys on multiple nodes deliberately, accepting eventual consistency. (4) Detecting hot keys at runtime and dynamically caching them locally on every node. (5) Application-level sharding of conceptually-hot data.',
      example:
        'Twitter has explicit handling for celebrity tweets: rather than fanning out to millions of follower timelines (which would hotspot), they read-on-demand for the most-followed accounts, merging celebrity tweets at view time. The architecture acknowledges that pure consistent hashing isn\'t enough when load distribution is heavily skewed.',
    },
    {
      title: 'Adding & Removing Nodes',
      icon: '🔄',
      layman:
        'When you add a node, it picks up some keys from neighbours; when you remove a node, its keys redistribute to neighbours. Both happen smoothly and locally — only neighbouring nodes are involved, not the whole cluster. That\'s the whole point.',
      technical:
        'Add: new node hashes to position(s) on ring; for each position, claim keys from current owner; copy data; clients update ring topology. Remove: redistribute departing node\'s keys to next nodes clockwise; clients drop departed node from ring. Membership changes are gossiped (Cassandra, Riak) or coordinated by a master (HDFS-style). Migration is throttled to avoid cluster overload during the move.',
      example:
        'Cassandra\'s "nodetool decommission" gracefully removes a node: it streams its data to neighbours, then the cluster\'s ring map updates. Reads/writes continue throughout. Adding a node ("bootstrap") works similarly — pulls its share of data from existing nodes, joins the ring, starts serving.',
    },
    {
      title: 'Rendezvous Hashing (HRW)',
      icon: '🎯',
      layman:
        'A simpler alternative to ring-based consistent hashing. For each key, compute hash(key + node_i) for every node, pick the highest score — that\'s the owner. No ring data structure, no virtual nodes. Same locality property: adding a node only affects ~1/N of keys.',
      technical:
        'Highest Random Weight (HRW) hashing. For each (key, node) pair, compute hash; key goes to node with max hash. O(N) per lookup vs O(log N) on a ring with binary search, but usually negligible at common N. Some implementations (Wikipedia\'s caching) prefer it for simplicity. Distribution is naturally uniform; no vnodes needed.',
      example:
        'Wikimedia\'s caching uses rendezvous hashing across their CDN nodes. When a cache server is added or removed, only ~1/N of URLs reroute. Implementation is shorter than ring-based and easier to reason about, at the cost of slightly slower per-lookup (though usually invisible).',
    },
  ],

  comparison: {
    caption: 'Naive vs consistent hashing on N → N+1 nodes.',
    columns: ['Aspect', 'Naive (modulo)', 'Consistent (ring)'],
    rows: [
      ['Keys moved on add/remove', '~(N-1)/N (almost all)',     '~1/N (small slice)'],
      ['Lookup cost',              'O(1)',                       'O(log N) with ring + binary search'],
      ['Implementation',           'Trivial',                    'Modest — ring map, vnodes'],
      ['Distribution evenness',    'Perfect (with uniform keys)','Even with sufficient vnodes (~200/node)'],
      ['Best for',                 'Static node count',          'Dynamic clusters, caches, distributed DBs'],
    ],
  },

  realWorldExamples: [
    {
      company: 'Apache Cassandra',
      icon: '🪶',
      description:
        'Token ring with 256 vnodes per physical node. Distributes data evenly, handles failures gracefully, scales horizontally. The Dynamo paper inspired Cassandra; consistent hashing is the foundation of how data is placed and replicated.',
    },
    {
      company: 'Memcached client libraries',
      icon: '🥬',
      description:
        'libmemcached, twemproxy, and most modern Memcached clients use consistent hashing (often "ketama" — a popular library). Adding cache nodes during traffic spikes doesn\'t cause cache miss storms; only ~1/N of keys remap.',
    },
    {
      company: 'Akamai / Cloudflare CDN',
      icon: '🌐',
      description:
        'CDN nodes are added/removed continuously. Consistent hashing decides which edge node caches which URL, minimising cache invalidation when topology changes. Combined with anycast routing, the user always reaches a fast cached copy.',
    },
    {
      company: 'AWS DynamoDB',
      icon: '⚡',
      description:
        'Internally uses consistent hashing (with significant proprietary refinements) to partition data across thousands of storage nodes. Auto-scaling adds and removes partitions transparently; consistent hashing is what makes that practical at the storage layer.',
    },
  ],

  interviewQuestions: [
    {
      question: 'Why does naive modulo-based hashing fail when nodes are added or removed?',
      answer:
        'With partition = hash(key) % N, almost every key\'s assigned partition changes when N changes. Concretely: only keys where hash(key) happens to satisfy hash(key) % N == hash(key) % (N+1) stay put — a tiny fraction of all keys. So scaling from N to N+1 moves nearly all data. For a cache: cache miss storm. For a database: massive data shuffle, unavailability during the move, hot spots on still-warming nodes. The fundamental issue: modulo-N is a global function — change N and every key\'s answer changes. Consistent hashing is local — only keys in a small region around the new/removed node are affected.',
    },
    {
      question: 'Walk me through how consistent hashing maps keys to nodes.',
      answer:
        'Imagine a circular hash space (0 to 2^64). Each node hashes to one or more points on the ring (typically 100-200 virtual node points per physical node, for even distribution). Each key hashes to one point. To find the node responsible for a key: take the key\'s hash, search clockwise on the ring for the first node\'s hash that\'s ≥ key\'s hash. That node owns the key. Adding a node: it claims points on the ring; only keys whose previous owner was the next-clockwise neighbour get reassigned to the new node. Removing a node: keys it owned go to the next-clockwise neighbour. Result: adding or removing one node moves ~1/N of all keys, independent of how big N is.',
    },
    {
      question: 'What problem do virtual nodes solve?',
      answer:
        'With one ring point per physical node, distribution depends heavily on where the few node hashes happen to land — some nodes might own large arcs of the ring (lots of keys) while others own small arcs (few keys). With small N (say, 4 nodes), the variance can be huge: one node might own 50% of keys, another 5%. Virtual nodes solve this by giving each physical node many ring points (typically 100-200). The law of large numbers kicks in: each physical node ends up with roughly an equal share of the ring. Secondary benefit: when a node fails, its share splits among many small slices distributed across all surviving nodes — instead of a single neighbour absorbing all of the failed node\'s load.',
    },
    {
      question: 'How would consistent hashing place replicas for fault tolerance?',
      answer:
        'For replication factor R, place each key on R consecutive nodes clockwise from where the key hashes. So a key whose primary is node A, with replicas R=3, also lives on nodes B and C (next two clockwise). Failure of any one of A/B/C still leaves two replicas. To survive AZ outages, augment with topology-awareness: skip nodes in the same rack/AZ so the R replicas land on different physical fault domains. Dynamo-style systems formalise this with "preference lists" — for each key, the ordered list of nodes that should hold its replicas, taking topology into account. Read/write quorums (W + R > total replicas) on top of this give consistency guarantees.',
    },
    {
      question: 'How does a hot key defeat consistent hashing, and what can you do about it?',
      answer:
        'Consistent hashing distributes KEYS evenly, not LOAD. If 99% of traffic targets one specific key (say, a celebrity\'s profile or a viral tweet), then the node owning that key gets pounded while every other node sits idle. The hashing algorithm can\'t help — the load skew is at the key level. Mitigations: (1) Aggressive caching — most reads hit a CDN or in-memory cache before reaching the storage layer. (2) Replicating hot keys on multiple nodes (giving up some write coordination cost). (3) Sub-sharding: split the hot key into N pieces (key#0...key#N), distribute those, aggregate at read. Twitter does this for celebrity timelines. (4) Application-level rate limiting. (5) Detecting hot keys at runtime (sketch-based counters) and dynamically caching them on every node. Real systems combine these.',
    },
    {
      question: 'When would you NOT use consistent hashing?',
      answer:
        'When the node count is fixed and known in advance — naive hashing is simpler, faster, and gives perfect distribution. Examples: a 3-node Postgres replica setup where you\'re unlikely to add/remove nodes; a 4-shard MySQL setup where shards are intentionally pinned. Consistent hashing\'s value is in dynamic clusters; for static ones it\'s overkill. Also when you need range queries — consistent hashing scrambles keys across the ring, so "all keys between X and Y" becomes a scatter-gather across N nodes. For range-friendly partitioning, range-based sharding (HBase-style) is better. Finally, for systems with strong locality requirements (data must live in a specific physical location), consistent hashing\'s "wherever the hash lands" doesn\'t work — you need explicit placement (geo-sharding by region).',
    },
    {
      question: 'Compare ring-based consistent hashing with rendezvous (HRW) hashing.',
      answer:
        'Both have the property that adding/removing a node only affects ~1/N of keys. Ring-based: nodes hash onto a circular space; lookup walks the ring clockwise. With virtual nodes for even distribution. Look-up is O(log N) via binary search on a sorted ring. Adding/removing nodes requires updating the ring metadata, possibly across many places. Rendezvous (HRW): for each lookup, compute hash(key + node) for every node, pick the highest score. O(N) per lookup but no shared ring data structure to maintain. Distribution is naturally uniform without virtual nodes. Trade-offs: ring-based scales better for large N (log N vs N per lookup) but has more moving parts; rendezvous is simpler and easier to implement correctly. Wikimedia chose rendezvous for cache nodes; Cassandra/Riak chose ring-based. Both work; the choice is implementation-specific.',
    },
  ],

  commonMistakes: [
    'Using one virtual node per physical node — distribution is wildly uneven for small clusters; bump to 100-200 vnodes per node.',
    'Believing consistent hashing solves hot-key problems — it distributes keys, not load. Hot keys still hotspot.',
    'Forgetting topology-aware placement — placing all replicas on the same rack defeats fault tolerance even with replication factor 3.',
    'Implementing consistent hashing for static node counts — you took on complexity for a problem you don\'t have.',
    'Using consistent hashing where range queries are needed — scatter-gather over N nodes is brutal vs range-partitioning.',
    'Assuming the hash function doesn\'t matter — a poor hash (high collision, non-uniform output) defeats the whole scheme. Use a quality hash (xxHash, MurmurHash, SHA-1 truncated).',
    'Confusing consistent hashing with consistency models (CAP-theorem consistency) — totally unrelated concepts that share the word.',
  ],
};
