import type { ConceptDeepDive } from '../../types';

export const databaseSharding: ConceptDeepDive = {
  moduleId: 'sharding',
  tagline: 'When one database isn\'t enough — split the data, not the application',

  introduction: {
    layman:
      'Your e-commerce app has 1 billion users. Every single one of them is in one giant database table. ' +
      'Even with indexes and read replicas, queries are slow because the table is simply too big, and all writes go to one machine. ' +
      'Sharding splits your data across multiple databases. Instead of one database holding all 1 billion users, you have 10 databases each holding 100 million users. ' +
      'User IDs 1–100M go to Shard 1. IDs 100M–200M go to Shard 2. And so on. ' +
      'Each shard handles a fraction of the total load — queries are faster, writes scale, and no single machine is a bottleneck.',
    analogy:
      'Imagine a school of 10,000 students with one giant filing cabinet. Finding any student\'s record means searching through 10,000 folders. Slow, and only one person can use the cabinet at a time. ' +
      'Now split the cabinet into 10 smaller ones — one per grade (A–C → Cabinet 1, D–F → Cabinet 2, etc.). ' +
      'Each cabinet has 1,000 folders. Finding a student is 10× faster. And 10 staff members can use different cabinets simultaneously. ' +
      'The rule (last name A–C → Cabinet 1) is your shard key. The cabinets are your shards. ' +
      'The tricky part: what if you need all students with a certain grade? You have to check all 10 cabinets.',
    whyMatters:
      'Sharding is how every massive internet company scales their write-heavy databases. Instagram shards by user_id. WhatsApp shards messages by phone number. ' +
      'Uber shards by city. Cassandra, MongoDB, and Google Spanner shard natively. ' +
      'In interviews, "design Instagram" or "design WhatsApp" always reaches the question: how do you scale the database for billions of users? Sharding is the answer — and the interview tests whether you know the trade-offs.',
  },

  subTopics: [
    {
      title: 'What is a Shard Key (and Why it\'s Everything)',
      icon: '🔑',
      layman:
        'The shard key is the column you use to decide which shard a piece of data goes to. ' +
        'If you shard users by user_id, then user 42 always goes to the same shard, and you always know exactly where to find user 42\'s data. ' +
        'Choosing the wrong shard key is the most common and most painful sharding mistake. Fix it later and you might have to move billions of rows.',
      technical:
        'Properties of a good shard key:\n' +
        '1. High cardinality: many distinct values (user_id, order_id, UUID — good; status, country — bad).\n' +
        '2. Even distribution: values should spread evenly across shards. Sequential IDs with hash sharding. Avoid hot keys (one popular user causing one shard to receive all traffic).\n' +
        '3. Query alignment: most queries should need only ONE shard. If every query needs all shards, you\'ve negated the benefit.\n' +
        '4. Immutable: you never want to move data between shards. Shard key must never change (don\'t shard on email if users can change it).\n\n' +
        'Common shard keys by domain:\n' +
        '- Social app: user_id (user\'s data co-located)\n' +
        '- Multi-tenant SaaS: tenant_id (all tenant data on same shard)\n' +
        '- Ride-sharing: city_id or region (geographic locality)\n' +
        '- E-commerce orders: order_id hash (even distribution)\n' +
        '- Time-series: time range (recent data on new shards)',
      example:
        'Bad shard key: country_code.\n' +
        'India has 1.4 billion users, Maldives has 0.5 million.\n' +
        'India shard → 99% of traffic. Maldives shard → 0.04%. Hot shard = worse than no sharding.\n\n' +
        'Good shard key: hash(user_id) % num_shards.\n' +
        'User ID 1,234,567 → hash → 7,291,348 → mod 10 → Shard 8.\n' +
        'IDs distribute evenly by definition of hash functions.\n' +
        'Any user\'s data is always on exactly one predictable shard.',
      whenToUse: 'Choose the shard key before you start. It\'s the hardest architectural decision in sharding. Get it wrong and the cost of fixing it is migrating all your data.',
    },
    {
      title: 'Sharding Strategies',
      icon: '🗂️',
      layman:
        'There are three main ways to divide data across shards. Each has different trade-offs for how evenly data distributes, how easy range queries are, and how hard it is to add more shards later.',
      technical:
        'Range-based sharding:\n' +
        '  User IDs 1–1M → Shard 1, 1M–2M → Shard 2, etc.\n' +
        '  Pros: easy range queries (all users 1M–1.5M → just one shard).\n' +
        '  Cons: hot shards — newest users all go to the last shard (auto-increment IDs), causing shard 10 to receive all new writes while shard 1 is idle.\n\n' +
        'Hash-based sharding:\n' +
        '  Shard = hash(user_id) % num_shards\n' +
        '  Pros: even distribution by definition. No hot shards.\n' +
        '  Cons: range queries need all shards (WHERE user_id BETWEEN X AND Y → check all shards).\n' +
        '  Cons: adding shards requires rehashing all data (mitigated by consistent hashing).\n\n' +
        'Directory-based sharding:\n' +
        '  A lookup table maps each entity to its shard: {user_id: 12345 → shard_3}.\n' +
        '  Pros: maximum flexibility — move any entity to any shard, add shards without rehashing.\n' +
        '  Cons: the directory is a new single point of failure and a bottleneck. Must be highly available and cached.\n\n' +
        'Consistent hashing:\n' +
        '  Hash nodes and keys onto a ring. Each key routes to the next node clockwise.\n' +
        '  Adding a node only moves keys from one adjacent node — no global rehash.',
      example:
        'Instagram uses hash-based sharding on user_id across thousands of shards.\n' +
        '- Photo upload: hash(user_id) → shard_47 → INSERT into shard_47.\n' +
        '- User feed: hash(user_id) → shard_47 → SELECT from shard_47.\n' +
        '- All of user 42\'s data lives on one shard → queries are fast and local.\n\n' +
        'The problem Instagram faced: "get me all photos from users I follow."\n' +
        'Followers are on 500 different shards → 500 queries → aggregate results.\n' +
        'Their solution: denormalize. Pre-compute and cache feeds. Don\'t do cross-shard joins at query time.',
    },
    {
      title: 'The Cross-Shard Problem',
      icon: '🌐',
      layman:
        'With one database, joining two tables is trivial — the database engine does it internally. ' +
        'With sharding, those tables might be on different machines in different data centers. ' +
        'A query like "give me all users who ordered product X" might need to check all 100 shards and combine the results — that\'s 100 network round trips. ' +
        'This is the fundamental pain point of sharding.',
      technical:
        'Cross-shard query problems:\n' +
        '1. Cross-shard JOIN: JOIN between tables on different shards requires fetching data from multiple shards and joining in application code or a scatter-gather layer.\n' +
        '2. Cross-shard aggregation: SELECT COUNT(*) across all shards → query each shard, sum results in app.\n' +
        '3. Distributed transactions: updating data across two shards in one atomic operation requires 2-phase commit (complex, slow, error-prone).\n' +
        '4. Cross-shard ORDER BY: sort results from N shards → merge sort in application.\n\n' +
        'Solutions:\n' +
        '1. Shard by the most common query\'s key — design queries around your shard key.\n' +
        '2. Scatter-gather queries: fan out query to all shards in parallel, collect and merge results.\n' +
        '3. Denormalization: duplicate data across shards so co-located queries serve most needs.\n' +
        '4. Secondary indexes: global secondary index that maps non-key attributes to shard locations.\n' +
        '5. Separate systems for cross-shard queries: stream all data to Elasticsearch or BigQuery for cross-shard search and analytics.',
      example:
        'Scenario: "find all orders containing product_id = 42" — but orders are sharded by order_id.\n\n' +
        'Option A (scatter-gather, slow):\n' +
        '  Query all 100 shards simultaneously: SELECT * FROM orders WHERE product_id = 42\n' +
        '  Merge results in application. 100 network calls per query.\n\n' +
        'Option B (secondary index, better):\n' +
        '  Global index table: {product_id → [order_id, shard_id]}\n' +
        '  Step 1: look up index → get list of (order_id, shard_id) pairs for product 42.\n' +
        '  Step 2: query only relevant shards (maybe just 3).\n\n' +
        'Option C (best for search): stream orders to Elasticsearch with product_id indexed.\n' +
        '  Search Elasticsearch → instant, doesn\'t touch shards at all.',
    },
    {
      title: 'Resharding: Adding More Shards',
      icon: '📦',
      layman:
        'You started with 4 shards. Your app grew 100×. Now you need 400 shards. ' +
        'Moving data from 4 shards to 400 while your app is running, without losing any data or taking downtime, is one of the hardest operations in distributed systems. ' +
        'This is called resharding — and getting it right requires careful planning.',
      technical:
        'Resharding approaches:\n\n' +
        '1. Consistent hashing (preferred):\n' +
        '   Add new nodes to the hash ring. Only the keys that "wrap around" the new node need to move.\n' +
        '   Adding 1 node to a 10-node ring moves ~10% of keys (1/10 of each neighbor\'s data).\n' +
        '   Cassandra, DynamoDB, and Riak use this for near-zero-downtime shard additions.\n\n' +
        '2. Double-write migration:\n' +
        '   Phase 1: write to old AND new sharding scheme simultaneously.\n' +
        '   Phase 2: gradually backfill historical data to new layout.\n' +
        '   Phase 3: verify data parity between old and new.\n' +
        '   Phase 4: switch reads to new scheme.\n' +
        '   Phase 5: stop double-writes, clean up old data.\n' +
        '   GitHub used this pattern to move from 1 to 4 MySQL shards.\n\n' +
        '3. Shard splitting:\n' +
        '   A hot shard is overloaded. Split it in half: copy all data to two new shards, reroute traffic, verify, delete old shard.\n' +
        '   MongoDB and Vitess support online shard splitting.',
      example:
        'WhatsApp at 1 billion users:\n' +
        'Message data grows from 4 shards → needed 400 shards to handle write throughput.\n' +
        'Process (simplified):\n' +
        '1. Enable double-write: new messages written to both old and new sharding (400 shards).\n' +
        '2. Run backfill jobs: copy old messages to their new shard location.\n' +
        '3. Per-user cutover: once a user\'s history is fully backfilled, flip their reads to new shards.\n' +
        '4. Gradual rollout: cutover 1% of users, verify, 5%, verify, 100%.\n' +
        '5. Disable old shards after all users moved.\n' +
        'Total migration: 6 months of engineering work, zero user-facing downtime.',
    },
    {
      title: 'Managed Sharding: Vitess, Citus, and MongoDB',
      icon: '🛠️',
      layman:
        'Manual sharding is complex — you have to handle routing, resharding, cross-shard queries, and failover yourself. ' +
        'Several tools do the heavy lifting for you, making sharding almost transparent to your application.',
      technical:
        'Vitess (MySQL sharding middleware, used by YouTube, Slack, GitHub):\n' +
        '- Sits between app and MySQL shards. App talks to Vitess via MySQL protocol.\n' +
        '- Handles shard routing, resharding, connection pooling, and query planning.\n' +
        '- VTGate: stateless query router. VTablet: per-shard agent. VTTablet aggregates cross-shard queries.\n' +
        '- Online schema changes: ALTER TABLE without locking (huge for large tables).\n\n' +
        'Citus (PostgreSQL horizontal scaling extension):\n' +
        '- Turns PostgreSQL into a distributed database. Transparently shards tables across worker nodes.\n' +
        '- Coordinator node routes queries. Worker nodes hold shards.\n' +
        '- Supports distributed JOINs, cross-shard aggregations, and COPY for bulk loads.\n' +
        '- Used by Microsoft Azure (Azure Cosmos DB for PostgreSQL).\n\n' +
        'MongoDB native sharding:\n' +
        '- Choose a shard key per collection. Mongos router handles query routing.\n' +
        '- Automatic chunk splitting and balancing. Add shards online.\n' +
        '- Trade-off: MongoDB shard keys are harder to change post-launch than Vitess.\n\n' +
        'PlanetScale (MySQL + Vitess as a service):\n' +
        '- Manages all Vitess complexity. Branching model for schema changes.\n' +
        '- Used by companies that want sharding without managing it.',
      example:
        'GitHub\'s MySQL + Vitess migration:\n' +
        'Problem: GitHub\'s MySQL was hitting limits — too large, too slow to scale, schema changes caused multi-hour locks.\n' +
        'Solution: Migrated to Vitess over 2 years.\n' +
        'Result: Schema changes on billion-row tables take minutes (online). Added shards as traffic grew without downtime.\n' +
        'Lessons: Vitess works, but the initial migration is a multi-year engineering project. Don\'t shard until you must.',
    },
  ],

  comparison: {
    caption: 'Sharding strategies: trade-offs at a glance',
    columns: ['Strategy', 'Even Distribution', 'Range Query Support', 'Resharding Difficulty', 'Best For'],
    rows: [
      ['Range-based', '❌ Risk of hot shards', '✅ Great (one shard)', '🟡 Moderate', 'Time-series, sequential data'],
      ['Hash-based', '✅ Even by design', '❌ Needs all shards', '🔴 Hard (rehash all)', 'User data, random access patterns'],
      ['Consistent hashing', '✅ Even + balanced', '❌ Like hash-based', '✅ Easy (move ~1/N keys)', 'Distributed caches, cloud databases'],
      ['Directory-based', '✅ Fully flexible', '🟡 Depends on directory', '✅ Easy (update mapping)', 'Multi-tenant, complex routing'],
      ['Geographic', '🟡 Depends on user base', '✅ Within a region', '🟡 Moderate', 'Global apps, data sovereignty'],
    ],
  },

  realWorldExamples: [
    {
      company: 'Instagram',
      icon: '📸',
      description:
        'Instagram shards PostgreSQL by user_id across thousands of shards. All of a user\'s photos, followers, and activity data co-locate on one shard, enabling fast single-shard queries. ' +
        'When they needed global feeds (cross-shard aggregation), they solved it by pre-computing feeds asynchronously using Celery tasks that gather data from relevant shards and store the result in Redis — ' +
        'the feed query hits Redis only, never a database shard at query time.',
    },
    {
      company: 'Slack',
      icon: '💬',
      description:
        'Slack shards by workspace (team) ID — all messages, channels, and user data for a workspace live on one shard. ' +
        'This means almost all Slack queries (messages in a channel, users in a workspace) need just one shard. ' +
        'The cost: large enterprise workspaces (50,000 users) create hot shards. Slack handles this with workspace-level migration and load monitoring.',
    },
    {
      company: 'Uber',
      icon: '🚕',
      description:
        'Uber shards trip data by city — all trips within San Francisco are on the same database cluster. ' +
        'This gives them geographic locality (most queries are city-scoped: "drivers in Mumbai"), easy compliance (data stays in the right region), and predictable growth (add a new city cluster as they expand). ' +
        'Cross-city queries (a driver who works in two cities) go through a separate global aggregation layer.',
    },
  ],

  interviewQuestions: [
    {
      question: 'What is database sharding and when do you need it?',
      answer:
        'Sharding is horizontal partitioning — splitting a large dataset across multiple database instances (shards), each responsible for a subset of data. Use it when: (1) a single database is too large for one machine, (2) write throughput exceeds what one primary can handle, or (3) you need geographic distribution of data. ' +
        'Don\'t shard prematurely — start with vertical scaling, indexing, caching, and read replicas. Sharding dramatically increases operational complexity and should be a last resort.',
    },
    {
      question: 'How do you choose a shard key?',
      answer:
        'A good shard key has: (1) high cardinality — many distinct values for even distribution; (2) even access pattern — no hot keys where one value gets 90% of traffic; (3) query alignment — most queries filter on the shard key, minimizing cross-shard queries; (4) immutability — you should never need to change a row\'s shard key, because moving data between shards is expensive. ' +
        'Common choices: user_id for user-centric apps, tenant_id for multi-tenant SaaS, geographic region for location-based apps.',
    },
    {
      question: 'What are the main challenges with sharding?',
      answer:
        '1. Cross-shard queries: JOINs and aggregations across shards require scatter-gather (query all, merge results) — slow and complex. ' +
        '2. Cross-shard transactions: atomicity across shards requires distributed 2-phase commit — complex and error-prone. ' +
        '3. Hot shards: uneven key distribution causes one shard to receive most traffic. ' +
        '4. Resharding: adding shards requires migrating data — complex, risky, time-consuming. ' +
        '5. Operational complexity: N shards = N databases to monitor, backup, failover.',
    },
    {
      question: 'How does consistent hashing help with sharding?',
      answer:
        'Traditional hash sharding (key % N) requires rehashing all data when N changes — impractical for large datasets. ' +
        'Consistent hashing places both keys and nodes on a virtual ring. Each key maps to the next clockwise node. ' +
        'When a node is added or removed, only ~1/N of keys need to move (the keys previously owned by adjacent nodes), not all keys. ' +
        'This enables online resharding with minimal data movement. Cassandra, DynamoDB, and Riak all use consistent hashing.',
    },
  ],

  commonMistakes: [
    'Sharding too early — start with indexing, caching, and read replicas first; sharding is 10× more complex',
    'Choosing a low-cardinality shard key — sharding by status (3 values) or country creates massive hot shards',
    'Mutable shard keys — if users can change email and you shard by email, all their data must move between shards',
    'Ignoring cross-shard queries — designs that require frequent cross-shard JOINs negate sharding benefits',
    'No resharding plan — launching without a strategy for adding shards means painful migrations later',
    'Trying to do cross-shard distributed transactions — 2-phase commit at scale is a reliability disaster; redesign to avoid it',
  ],
};
