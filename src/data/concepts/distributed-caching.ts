import type { ConceptDeepDive } from '../../types';

export const distributedCaching: ConceptDeepDive = {
  moduleId: 'distributed-caching',
  tagline: 'Scaling the cache itself — sharding, replication, and consistency across many nodes',

  introduction: {
    layman:
      'A distributed cache is a cache that lives on many servers, not one. The data is spread across the cluster, so the total cache size scales horizontally — add more nodes, get more cache. A single Redis or Memcached instance is limited to one machine\'s RAM (say 256 GB); a distributed cluster of 100 nodes gives you 25 TB of fast, shared cache that all your application servers can use.',
    analogy:
      'Imagine running a city-wide library system instead of one big library. Each branch holds a portion of the collection. If you ask any branch for a book, they either have it locally (fast) or fetch it from the right branch via a delivery network (a bit slower). The whole city can hold millions of books even though no single branch could. The challenge is figuring out which branch has which book and what to do when a branch closes for repairs.',
    whyMatters:
      'Almost every web-scale application uses distributed caching. Twitter, Facebook, Amazon, and Netflix run cache clusters with thousands of nodes. Senior engineers must know how data is sharded (consistent hashing), how replication trades consistency for availability, how to handle node failures, and how to operate at scale (rebalancing, migrations, hot keys). This is one of the most heavily-tested topics in system design interviews.',
  },

  subTopics: [
    {
      title: 'Why Distribute the Cache?',
      icon: '📈',
      layman:
        'A single cache server has limits: RAM is finite, network bandwidth is finite, and CPU can only handle so many operations per second. When you outgrow these limits — or when one machine\'s failure would take your whole site down — you need to spread the cache across many servers.',
      technical:
        'Reasons to distribute: (1) Capacity — single-node Redis caps at machine RAM (typically 64–512 GB on cloud); web-scale workloads need TB. (2) Throughput — a single Redis instance handles ~100K–500K ops/sec; distributing across N shards gives N× throughput. (3) Availability — single-node failure = full cache outage and a database stampede. Replication / clustering eliminates the single point of failure. (4) Geographic distribution — multi-region clusters reduce latency for global users (with caveats about consistency). Cost vs benefit: a 3-node Redis cluster doubles operational complexity vs single node; a 100-node cluster is a major investment in tooling, monitoring, and SRE expertise.',
      example:
        'Twitter\'s Twemcache deployment runs across thousands of nodes with custom routing (Twemproxy) — required because timeline reads peak at tens of millions of ops/sec, well beyond any single instance.',
      whenToUse:
        'Move from single-node to distributed when (a) cache size exceeds 50–100 GB, (b) throughput exceeds 50K ops/sec, (c) you cannot tolerate even brief cache outages, or (d) you need multi-region deployment.',
    },
    {
      title: 'Sharding — How Keys Map to Nodes',
      icon: '🔀',
      layman:
        'In a distributed cache, each key lives on exactly one node (or a small set). When the application wants to look up a key, it needs to know which node holds it. The mapping from key to node is called sharding (or partitioning), and it is the foundation of every distributed cache.',
      technical:
        'Naive: hash(key) mod N where N is the number of nodes. Problem: if N changes (node added/removed), almost every key maps to a different node — a massive cache miss storm. Consistent hashing solves this: keys and nodes are placed on a circular hash ring; each key goes to the next node clockwise on the ring. Adding a node only redistributes ~1/N of keys (its successor\'s previous responsibility). Used by Redis Cluster (with hash slots variant), Memcached (client-side), Cassandra, DynamoDB, Riak. Variant: virtual nodes (vnodes) — each physical node owns hundreds of points on the ring, smoothing distribution and easing rebalancing. Redis Cluster\'s slot model: 16384 fixed slots; each node owns a contiguous range; CLUSTER ADDSLOTS / MIGRATING moves slots between nodes. Trade: simpler than free consistent hashing but adds the slot-migration step on rebalance.',
      example:
        'Memcached client libraries (Twemproxy, Mcrouter, Spymemcached) implement client-side consistent hashing: the client hashes each key to find the right node and sends directly. No proxy, no central coordinator. Add a node: only ~1/N of keys move; the rest still hit the same node.',
    },
    {
      title: 'Replication — Surviving Node Failures',
      icon: '🪞',
      layman:
        'If a single node holds a key and that node dies, the key is gone (cold miss until repopulated). Replication keeps copies on other nodes. When the primary fails, a replica takes over with the data still warm.',
      technical:
        'Primary-replica (master-slave): every write goes to primary; replicas asynchronously stream the changes. On primary failure, a replica is promoted. Redis Sentinel / Redis Cluster automate this. Async replication means replicas can lag the primary by milliseconds — reads from replicas may be slightly stale. Synchronous replication is rare in caches because it doubles write latency. Multi-primary: writes accepted by any node; conflicts must be resolved (last-writer-wins, CRDTs). Used by Riak and DynamoDB. Replication factor (RF): RF=3 means 3 copies. Higher RF means more durability and read scale at the cost of more write amplification and more memory. Tradeoff: replicas use memory that could otherwise hold more keys; doubling RF roughly halves effective cache size.',
      example:
        'Redis Cluster default: each shard has 1 primary + 1 replica. On primary failure, replica is promoted within seconds (Sentinel orchestrates). Reads can be served from replicas with the READONLY command, scaling read throughput.',
    },
    {
      title: 'Consistency Models in Distributed Caches',
      icon: '⚖️',
      layman:
        'When data is replicated, different nodes can briefly disagree. A write to one node has not yet propagated to the others. The cache\'s consistency model defines what readers can see during this window. Most caches choose availability over strict consistency — a small staleness window is acceptable for cache.',
      technical:
        'Eventual consistency: most distributed caches default to this. Async replication; readers may see slightly old data. Acceptable because the data is already a cache — tiny additional staleness rarely matters. Strong consistency requires consensus protocols (Raft, Paxos) — used in coordination services (Etcd, ZooKeeper, Consul) but not typical caches due to write latency cost. Read-your-writes: a useful weaker guarantee — after a client writes, its subsequent reads see the new value. Achieved via session affinity (route reads back to the primary) or version stamps. CAP framing: most caches are AP (available, partition-tolerant, eventually consistent). Some specialty caches (DynamoDB strong consistency reads) trade availability for stronger reads.',
      example:
        'Redis Cluster: writes go to primary; replicas async. Reading from a replica might see data 50ms older than primary. Most apps tolerate this; for read-after-write consistency, send reads to the primary.',
    },
    {
      title: 'Rebalancing — Adding and Removing Nodes',
      icon: '⚖️',
      layman:
        'When traffic grows, you add nodes; when nodes fail or you scale down, you remove them. Each change requires moving some keys to maintain even distribution. Done carelessly, rebalancing causes cache misses and origin spikes.',
      technical:
        'Adding a node with consistent hashing: only the keys that map to the new node\'s ring segment move. Approach 1 (offline migration): cordon the new node, move keys, then route traffic. Approach 2 (live migration): keys served from old node until copied; once copied, traffic switches; old node drops them. Redis Cluster CLUSTER MIGRATING / IMPORTING flags coordinate this slot-by-slot. Failure modes: (1) Migration during high traffic causes increased latency. (2) Aborted migration leaves keys on both nodes; readers might see stale data. (3) Inconsistent hash rings across clients cause split-brain — some clients route to old node, others to new. Tooling (Redis CLI, Memcached pcache) automates the dance but requires careful scripting at scale.',
      example:
        'Twitter publicly described their Twemcache rebalances: each tier scales by adding nodes incrementally, with extensive monitoring of hot keys and cache hit rate per shard during the migration. A single misconfigured rebalance once caused a noticeable site-wide latency spike.',
    },
    {
      title: 'Hot Keys & Hot Shards',
      icon: '🔥',
      layman:
        'Even with perfect sharding, sometimes one key gets so much traffic it overwhelms its single node. A celebrity tweet, a flash-sale product page, a global counter — these "hot keys" are the most common cause of distributed-cache outages.',
      technical:
        'Detection: per-node CPU / network I/O is uneven; one shard saturates while others idle. Tools: Redis MONITOR, INFO commandstats, MGET sampling. Mitigations: (1) Replicate hot key to multiple nodes, read from any (manual or via cache aliasing). (2) Client-side micro-cache for the hot key — the most popular key sits in process memory of every app server, network requests stop. (3) Shard the key — split a single counter into 100 sub-counters (shard:0:counter, shard:1:counter ...); reads sum, writes pick a random shard. (4) Edge caching for read-only hot keys (CDN). (5) Rate limit / throttle the hot path. Twitter has written extensively about handling celebrity-account hot keys (Justin Bieber\'s timeline being a classic example).',
      example:
        'Instagram replicates Cristiano Ronaldo\'s profile across many cache nodes — any node can serve reads. Updates fan out to all replicas. Without this, a single Redis shard would be 100% CPU on his profile alone.',
    },
    {
      title: 'Operating at Scale — Monitoring, Capacity, Migrations',
      icon: '🛠️',
      layman:
        'Running a distributed cache in production is a full-time job. You need monitoring of hit rates per shard, memory pressure, replication lag, and slow commands. You need plans for scaling, version upgrades, and disaster recovery.',
      technical:
        'Core SLIs per shard: hit rate, P99 latency, memory utilization, eviction rate, network bandwidth, replica lag. Tools: Datadog Redis integration, Prometheus + redis_exporter, Cloudwatch for ElastiCache. Capacity planning: aim for 60–70% memory utilization to absorb spikes; target 40–50% CPU. Disaster recovery: cache crash (or full cluster wipe) should not bring down the site — origin must handle the resulting miss storm. Plan for graceful warming after recovery (gradual ramp via probabilistic admission). Version upgrades: blue-green clusters or rolling restarts with replica failover. Cost optimization: tier between memory (hot) and SSD (warm) using something like Redis on Flash or Aerospike.',
      example:
        'Pinterest\'s Memcached fleet exceeded 5 PB of cache. Operating it required custom tooling for hot-key detection, automatic shard rebalancing, and graceful failover during AWS instance preemptions. Scale changes the operational character entirely.',
    },
  ],

  comparison: {
    caption: 'Popular distributed cache solutions compared.',
    columns: ['Aspect', 'Redis Cluster', 'Memcached', 'Hazelcast', 'AWS ElastiCache'],
    rows: [
      ['Data model', 'Strings, hashes, lists, sets, streams', 'Strings only', 'Maps, queues, topics', 'Redis or Memcached'],
      ['Sharding', 'Hash slots (16384)', 'Client-side consistent hash', 'Built-in partitioning', 'Inherits from engine'],
      ['Replication', 'Primary-replica per shard', '❌ (none built-in)', 'Synchronous + async modes', 'Multi-AZ replication'],
      ['Persistence', 'RDB + AOF', '❌', 'Optional', 'Optional snapshots'],
      ['Read-through / write-through', 'Manual', 'Manual', 'Built-in (MapStore)', 'Manual'],
      ['Operational complexity', 'Medium', 'Low', 'High', 'Managed (low)'],
      ['Best for', 'Versatile, rich data types', 'Pure key-value at scale', 'Java apps, strong consistency', 'Anyone on AWS'],
    ],
  },

  realWorldExamples: [
    {
      company: 'Facebook (Memcached at scale)',
      icon: '👥',
      description:
        'Facebook runs hundreds of thousands of Memcached instances. Their 2013 paper "Scaling Memcache at Facebook" describes regional pools, leases (a coordination primitive for stampede prevention), and cross-datacenter consistency. They invented Mcrouter — a Memcached protocol router that handles sharding, replication, failover, and migrations — to manage the complexity.',
    },
    {
      company: 'Twitter (Twemcache + Twemproxy)',
      icon: '🐦',
      description:
        'Twitter forked Memcached as Twemcache (twin-cache) and built Twemproxy (a fast proxy that handles consistent hashing, connection pooling, and pipelining). Their cache fleet handles the timeline service\'s tens of millions of ops/sec. Hot-key handling for celebrity accounts is a custom in-house addition.',
    },
    {
      company: 'Netflix (EVCache)',
      icon: '🎬',
      description:
        'Netflix forked Memcached into EVCache for cross-region replication. EVCache replicates writes across multiple AWS regions so any region can serve reads with no cross-region miss. At peak ~30M ops/sec. Their open-source release is widely used in microservice architectures inside the JVM ecosystem.',
    },
    {
      company: 'AWS DynamoDB DAX',
      icon: '☁️',
      description:
        'DAX is a fully-managed distributed cache for DynamoDB, with read-through and write-through built in. Multi-AZ replication, automatic failover, sub-millisecond reads. DAX hides the cache distribution — apps use the DynamoDB SDK and DAX transparently caches.',
    },
  ],

  interviewQuestions: [
    {
      question: 'Why use a distributed cache instead of a single-node cache?',
      answer:
        'Three reasons: (1) Capacity — single-node Redis is limited to one machine\'s RAM; a distributed cluster scales horizontally to TB. (2) Throughput — a single instance handles ~100–500K ops/sec; sharding gives N× throughput. (3) Availability — single-node failure means full outage and origin stampede; replication / clustering eliminates the single point of failure. The cost is operational complexity — sharding logic, replication monitoring, rebalancing, version upgrades. Move to distributed when single-node\'s limits are real, not earlier.',
    },
    {
      question: 'How does consistent hashing work and why is it preferred over hash mod N?',
      answer:
        'Hash mod N: hash(key) % N maps key to one of N nodes. Problem: if N changes, almost every key maps to a different node — catastrophic miss storm. Consistent hashing: keys and nodes are placed on a circular hash ring; each key goes to the next node clockwise. Adding a node only takes over the keys that fall in its segment of the ring (~1/N of keys). Adding/removing nodes minimally disturbs the existing mapping. Variants like vnodes (each node owning hundreds of points) smooth distribution. This is what makes scaling a distributed cache feasible.',
    },
    {
      question: 'What is the hot key problem and how do you mitigate it?',
      answer:
        'A hot key receives so much traffic it saturates one node\'s CPU or network, even though the rest of the cluster is idle. Mitigations: (1) Replicate the hot key to many nodes, read from any. (2) Client-side micro-cache — process-local cache of the hot key on every app server, eliminating most cache requests. (3) Key sharding — split a single counter into N sub-keys, reads sum them, writes pick one randomly. (4) Edge / CDN caching for read-only hot keys. (5) Rate limit the hot path. Detection: monitor per-shard CPU and command rate; investigate any imbalance.',
    },
    {
      question: 'How would you add a new node to a Redis cluster without downtime?',
      answer:
        'Steps: (1) Add the new node to the cluster (CLUSTER MEET) — joins as empty. (2) Reshard slots from existing nodes onto the new one (CLUSTER MIGRATING / IMPORTING per slot, then SETSLOT). Redis Cluster moves keys slot-by-slot live; readers/writers continue working as redirects (MOVED responses) point them to the right node. (3) Monitor migration progress and per-shard hit rates. (4) Add a replica for the new primary. The whole process takes minutes to hours depending on data size; impact on application is minimal because individual keys are unavailable only during the brief migration of their slot.',
    },
    {
      question: 'How do you handle replication lag in a distributed cache?',
      answer:
        'Replication is asynchronous in most caches; replicas can lag the primary by milliseconds. Strategies: (1) Send writes and immediate reads to the primary — read-your-writes. (2) Tolerate stale reads on replicas — for cache data, a few ms of staleness is usually fine. (3) Monitor replication lag (Redis INFO replication shows lag in bytes / seconds); alert on excessive lag. (4) For multi-region: accept seconds of cross-region inconsistency; design app to tolerate. (5) For strong consistency requirements, bypass the cache for that specific read. Treat the cache\'s eventual consistency as a deliberate design choice, not a defect.',
    },
  ],

  commonMistakes: [
    'Using hash mod N — every node addition or removal causes a near-total cache miss storm.',
    'No replication — a single node failure becomes a cache-wide outage and origin stampede.',
    'Ignoring hot keys — one celebrity user\'s profile saturates one shard while others sit idle.',
    'Reading from replicas without considering lag — strict-consistency reads silently return stale data.',
    'Not monitoring per-shard metrics — uneven shard load is invisible until it causes an outage.',
    'Treating distributed cache as a database — even Redis Cluster can lose data on simultaneous primary + replica failure.',
    'Manually scripting rebalances at scale — error-prone; use built-in tooling (redis-cli --cluster reshard, Mcrouter) or managed services.',
  ],
};
