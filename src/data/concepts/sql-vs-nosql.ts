import type { ConceptDeepDive } from '../../types';

export const sqlVsNoSQL: ConceptDeepDive = {
  moduleId: 'sql-vs-nosql',
  tagline: 'Every dimension compared — so you can justify your choice in any interview',

  introduction: {
    layman:
      'SQL vs NoSQL is the most debated database question in software engineering. ' +
      'The debate is not about which is better — it is about which is better FOR YOUR USE CASE. ' +
      'SQL (Structured Query Language) databases organise data into tables, enforce a strict schema, and guarantee ACID properties. ' +
      'NoSQL databases sacrifice some of those guarantees in exchange for schema flexibility, horizontal scalability, and specialised data models. ' +
      'This module gives you the vocabulary and reasoning to make and defend this choice in any system design conversation.',
    analogy:
      'SQL is like a professional kitchen with mise en place: every ingredient is labelled, in its specific spot, and the chef follows an exact recipe. ' +
      'Prep takes longer, but execution is precise and consistent. ' +
      'NoSQL is like a food truck: flexible, fast to set up, easy to move, and the menu can change daily. ' +
      'You sacrifice some precision for speed and adaptability. ' +
      'A Michelin star restaurant (bank) needs the professional kitchen. A pop-up event (startup MVP) might start with the food truck.',
    whyMatters:
      'This comparison comes up in every backend interview. Candidates who say "just use Postgres" or "just use Mongo" without reasoning fail. ' +
      'The expected answer demonstrates understanding of: data model fit, consistency requirements, query patterns, scalability needs, and operational trade-offs. ' +
      'At Facebook, the data team runs hundreds of MySQL instances and Cassandra clusters simultaneously — the choice is made per service, per access pattern.',
  },

  subTopics: [
    {
      title: 'Data Model: Structure vs Flexibility',
      icon: '🗂️',
      layman:
        'SQL requires you to define columns and types before storing any data. ' +
        'Every row in a table has the same structure. Adding a new field means altering the table — which can be disruptive on large tables. ' +
        'NoSQL (document databases) let each record be a completely different shape. ' +
        'One user document might have a "twitter_handle" field; another might not. No migration needed.',
      technical:
        'SQL data model:\n' +
        '- Normalisation: split data into multiple tables to avoid duplication (1NF, 2NF, 3NF)\n' +
        '- Schema enforced at write time: inserting a row with the wrong type fails immediately\n' +
        '- ALTER TABLE: adding columns on tables with 100M+ rows can be slow or require pt-online-schema-change\n' +
        '- Foreign key constraints enforced by the database engine\n\n' +
        'NoSQL (document) data model:\n' +
        '- Schema-on-read: structure is interpreted when reading, not enforced at write\n' +
        '- Denormalisation: embed related data in one document to avoid multi-collection queries\n' +
        '- Schema evolution: add new fields without migrations; old documents simply lack the new field\n' +
        '- Risk: no enforcement means invalid/inconsistent data can slip in silently\n\n' +
        'Schema design example (e-commerce):\n' +
        'SQL: products(id, name, price), product_attributes(product_id, key, value)\n' +
        '- Generic but slow for querying by attribute\n\n' +
        'MongoDB: { name, price, attributes: { cpu: "i7", ram: "16GB" } }\n' +
        '- Fast reads, flexible per product category, but no enforced attribute types',
      example:
        'SaaS application evolving over time:\n\n' +
        'Month 1: User has {name, email, plan}\n' +
        'Month 3: Add {company, billing_address} for enterprise users\n' +
        'Month 6: Add {github_handle} for developer plan\n' +
        'Month 12: Add {ai_credits_remaining} for new AI tier\n\n' +
        'SQL path:\n' +
        'ALTER TABLE users ADD COLUMN company VARCHAR(200);\n' +
        'ALTER TABLE users ADD COLUMN billing_address JSONB;\n' +
        '-- On 5M users: each ALTER takes 30–120 seconds with locking\n\n' +
        'MongoDB path:\n' +
        '// Just start writing documents with new fields\n' +
        'db.users.updateOne({_id: userId}, {$set: {github_handle: "kleppmann"}})\n' +
        '// No migration. Old docs simply lack the field. Application handles missing fields.',
      whenToUse:
        'Stable, well-understood schema → SQL. Frequently evolving schema or highly variable record structure → Document DB.',
    },
    {
      title: 'Query Language and Capabilities',
      icon: '🔍',
      layman:
        'SQL is one of the most powerful query languages ever designed. With one statement you can join 5 tables, filter millions of rows, group by category, compute averages, and sort results. ' +
        'NoSQL databases have query languages too, but they are more limited. ' +
        'MongoDB has an aggregation pipeline. Cassandra has CQL (no JOINs). Redis has almost no query capability beyond key lookup.',
      technical:
        'SQL strengths:\n' +
        '- JOINs: combine data from multiple tables in one query\n' +
        '- Aggregations: SUM, AVG, COUNT, GROUP BY, HAVING\n' +
        '- Window functions: ROW_NUMBER, RANK, LAG, LEAD over partitions\n' +
        '- Subqueries and CTEs: complex multi-step logic in one statement\n' +
        '- EXPLAIN ANALYZE: query plan inspection for optimisation\n\n' +
        'MongoDB aggregation pipeline:\n' +
        '- $match, $group, $sort, $project, $lookup (join)\n' +
        '- Powerful but more verbose than SQL\n' +
        '- $lookup is slower than SQL JOIN (not optimised for it)\n\n' +
        'Cassandra CQL:\n' +
        '- SELECT with WHERE on partition key and clustering columns only\n' +
        '- No JOINs, no subqueries, no GROUP BY\n' +
        '- ALLOW FILTERING: forces full table scan (never use in production)\n\n' +
        'DynamoDB:\n' +
        '- Query by partition key and optional sort key range\n' +
        '- Scan = full table scan = slow and expensive\n' +
        '- Secondary indexes for alternate access patterns\n\n' +
        'Redis:\n' +
        '- GET/SET by key, sorted set range queries, geo radius\n' +
        '- No querying on value contents',
      example:
        '"Find top 10 customers by total order value in the last 30 days"\n\n' +
        'SQL (4 lines):\n' +
        'SELECT c.name, SUM(o.total) as spend\n' +
        'FROM customers c JOIN orders o ON c.id = o.customer_id\n' +
        'WHERE o.created_at > NOW() - INTERVAL \'30 days\'\n' +
        'GROUP BY c.id ORDER BY spend DESC LIMIT 10;\n\n' +
        'MongoDB (aggregation pipeline — 15+ lines):\n' +
        'db.orders.aggregate([\n' +
        '  { $match: { created_at: { $gt: thirtyDaysAgo } } },\n' +
        '  { $group: { _id: "$customer_id", spend: { $sum: "$total" } } },\n' +
        '  { $lookup: { from: "customers", localField: "_id",\n' +
        '               foreignField: "_id", as: "customer" } },\n' +
        '  { $sort: { spend: -1 } }, { $limit: 10 }\n' +
        '])\n\n' +
        'Cassandra: impossible without denormalising data specifically for this query pattern.',
    },
    {
      title: 'Scalability: Vertical vs Horizontal',
      icon: '📈',
      layman:
        'SQL databases scale primarily by making the machine bigger (vertical scaling): more CPU, more RAM, faster SSDs. ' +
        'This works well up to a point — eventually you hit hardware limits or the cost becomes astronomical. ' +
        'NoSQL databases are designed to scale horizontally: add more machines to the cluster. ' +
        'Cassandra going from 10 to 100 nodes is a routine operation. Sharding PostgreSQL to 100 machines is an engineering project.',
      technical:
        'SQL scaling strategies:\n' +
        '1. Vertical scaling: upgrade to larger machine (RDS db.r6g.16xlarge = 64 cores, 512GB RAM)\n' +
        '2. Read replicas: route read queries to replicas (lag risk for strong consistency)\n' +
        '3. Connection pooling (PgBouncer): reduce connection overhead\n' +
        '4. Caching (Redis): cache hot query results\n' +
        '5. Sharding: horizontal partitioning (complex, Vitess/Citus abstracts this)\n\n' +
        'Write throughput ceiling for SQL: ~50K–100K TPS on a single primary (with SSDs and WAL tuning)\n\n' +
        'NoSQL horizontal scaling:\n' +
        'Cassandra: linear write scaling. 10 nodes → 100K TPS. 100 nodes → 1M TPS.\n' +
        '  - Consistent hashing routes each write to specific nodes\n' +
        '  - Adding a node redistributes ~1/N of data automatically\n\n' +
        'MongoDB: native sharding with mongos router\n' +
        '  - Choose shard key per collection\n' +
        '  - Automatic chunk balancing across shards\n\n' +
        'DynamoDB: auto-scaling, no capacity planning for tables\n' +
        '  - Partition key determines the partition (physical storage unit)\n' +
        '  - Hot partitions can throttle writes (choose high-cardinality key)',
      example:
        'WhatsApp message storage growth:\n\n' +
        '2010: 1M users → Single PostgreSQL handles all messages\n' +
        '2013: 200M users → Read replicas + sharding, hitting limits\n' +
        '2014: 600M users → Cassandra for messages (writes scale linearly)\n' +
        '2021: 2B users → Cassandra across hundreds of nodes\n\n' +
        'Message throughput: 65 billion messages per day = 750,000/second\n' +
        'A single PostgreSQL primary cannot handle 750K writes/second sustainably.\n' +
        'Cassandra with 100 nodes handles this with room to spare.\n\n' +
        'But WhatsApp still uses PostgreSQL for: user accounts, contacts, group metadata.\n' +
        'The access pattern for those is different — they need relational consistency.',
      whenToUse:
        'If write throughput exceeds ~100K/sec on a single database, start planning horizontal scaling. Cassandra or sharded SQL are the options. For most applications, a well-tuned PostgreSQL with read replicas scales to very high traffic.',
    },
    {
      title: 'Consistency and Transactions',
      icon: '🔒',
      layman:
        'SQL databases guarantee ACID transactions. When you move $100 from Account A to Account B, ' +
        'the debit from A and credit to B happen atomically — they both succeed or both fail. No in-between state. ' +
        'Most NoSQL databases relax this guarantee for performance and availability. ' +
        'Two nodes might temporarily disagree on a value — eventual consistency means they will sync up eventually, but not immediately.',
      technical:
        'ACID in SQL:\n' +
        '- Atomicity: BEGIN/COMMIT/ROLLBACK — all-or-nothing\n' +
        '- Consistency: constraints, triggers, foreign keys always maintained\n' +
        '- Isolation levels: READ COMMITTED (default most DBs), REPEATABLE READ, SERIALIZABLE\n' +
        '- Durability: WAL (Write-Ahead Log) ensures committed data survives crashes\n\n' +
        'BASE in NoSQL:\n' +
        '- Basically Available: system is always available for reads/writes\n' +
        '- Soft state: state might change over time without input\n' +
        '- Eventually consistent: replicas converge to same value eventually\n\n' +
        'Concurrency anomalies in eventually consistent systems:\n' +
        '- Read your own writes: you write, then read immediately — might see old value\n' +
        '- Lost updates: two nodes both update, one overwrites the other\n' +
        '- Dirty reads: reading uncommitted data\n\n' +
        'Tunable consistency (Cassandra):\n' +
        '- ONE: fastest, weakest (one node confirms)\n' +
        '- QUORUM: majority confirms (strong, slower)\n' +
        '- ALL: all nodes confirm (strongest, least available)\n\n' +
        'Recent NoSQL improvements:\n' +
        '- MongoDB 4.0+: multi-document ACID transactions\n' +
        '- DynamoDB: ACID transactions across multiple items\n' +
        '- CockroachDB: distributed SQL with SERIALIZABLE isolation',
      example:
        'Bank transfer: SQL vs NoSQL\n\n' +
        '=== SQL (safe) ===\n' +
        'BEGIN;\n' +
        '  UPDATE accounts SET balance = balance - 100 WHERE id = 1 AND balance >= 100;\n' +
        '  -- If above updated 0 rows (insufficient funds): ROLLBACK\n' +
        '  UPDATE accounts SET balance = balance + 100 WHERE id = 2;\n' +
        'COMMIT;\n' +
        '-- If server crashes between the two UPDATEs: WAL rolls back on restart\n\n' +
        '=== Cassandra (without transactions) ===\n' +
        '-- Step 1: deduct from account 1\n' +
        'UPDATE accounts SET balance = 900 WHERE id = 1;\n' +
        '-- Server crashes HERE\n' +
        '-- Step 2 never runs: account 2 never credited\n' +
        '-- $100 vanished. No rollback mechanism.\n\n' +
        '=== Fix: Cassandra Lightweight Transactions ===\n' +
        'UPDATE accounts SET balance = 900 WHERE id = 1 IF balance = 1000;\n' +
        '-- Compare-and-set, but only for single row, not multi-row atomicity',
      whenToUse:
        'Anything financial, inventory, or booking: use SQL ACID transactions. Social feeds, activity logs, metrics: eventual consistency is fine. If you need cross-table/cross-collection atomicity, relational wins clearly.',
    },
    {
      title: 'Performance Characteristics',
      icon: '⚡',
      layman:
        'Performance is not about "SQL is slow, NoSQL is fast." ' +
        'It is about what kind of operations are fast. ' +
        'Redis can do 1 million simple gets per second. PostgreSQL can handle complex analytical queries efficiently that Redis cannot do at all. ' +
        'Cassandra writes are extremely fast. PostgreSQL reads with proper indexes are often faster than MongoDB for the same data.',
      technical:
        'SQL performance profile:\n' +
        '- B-Tree indexes: O(log N) point and range queries\n' +
        '- Query planner: automatically chooses optimal execution plan\n' +
        '- Buffer cache: hot pages cached in shared_buffers\n' +
        '- Joins: optimised with hash join, merge join, nested loop\n' +
        '- Bottleneck: write throughput on single primary; large JOINs under load\n\n' +
        'MongoDB performance profile:\n' +
        '- B-Tree indexes on any field (including nested fields)\n' +
        '- No join optimisation → $lookup is slow on large collections\n' +
        '- Good for: single-document reads (embed your data!)\n' +
        '- WiredTiger engine: document-level locking (good concurrency)\n\n' +
        'Redis performance profile:\n' +
        '- In-memory: all operations in microseconds to milliseconds\n' +
        '- Single-threaded for commands (no lock overhead)\n' +
        '- 100K–1M ops/sec on a single instance\n' +
        '- Bottleneck: RAM capacity\n\n' +
        'Cassandra performance profile:\n' +
        '- Writes: O(1), always appended to memtable then SSTable\n' +
        '- Reads: fast when partition key known; slow for full scans\n' +
        '- Compaction: background process merges SSTables (can spike latency)\n\n' +
        'p99 latency benchmarks (approximate, depends on hardware and query):\n' +
        '- Redis GET: <1ms\n' +
        '- Cassandra write (QUORUM): 2–5ms\n' +
        '- PostgreSQL indexed SELECT: 2–10ms\n' +
        '- MongoDB single doc read: 2–15ms\n' +
        '- PostgreSQL complex JOIN: 50–500ms',
      example:
        'Latency comparison — user profile lookup:\n\n' +
        'Option A: PostgreSQL\n' +
        'SELECT u.*, p.bio, p.avatar FROM users u JOIN profiles p ON u.id = p.user_id WHERE u.id = 42;\n' +
        '-- ~3ms with indexes. Correct, consistent.\n\n' +
        'Option B: Redis cache\n' +
        'GET user:42  → {name, bio, avatar} serialised\n' +
        '-- ~0.2ms. But cache may be stale (TTL 60s).\n\n' +
        'Option C: MongoDB\n' +
        'db.users.findOne({_id: 42})  → {name, bio, avatar embedded}\n' +
        '-- ~3ms. No join needed since data is embedded.\n\n' +
        'Real production pattern:\n' +
        '1. Check Redis cache first (0.2ms — 95% of requests)\n' +
        '2. Cache miss → query PostgreSQL (3ms — 5% of requests)\n' +
        '3. Write result to Redis with 60s TTL\n' +
        '-- Effective p50 latency: <1ms. Database protected from 95% of reads.',
    },
  ],

  comparison: {
    caption: 'SQL vs NoSQL across every dimension that matters',
    columns: ['Dimension', 'SQL', 'NoSQL'],
    rows: [
      ['Schema', 'Fixed, enforced at write', 'Flexible, enforced at read (or not at all)'],
      ['Transactions', 'Full ACID (multi-table)', 'Varies: none / single-item / limited multi-item'],
      ['Query language', 'SQL — rich, standardised', 'Varies: CQL, MQL, proprietary APIs'],
      ['JOINs', 'Native, optimised', 'Application-level or slow ($lookup)'],
      ['Horizontal scale', 'Complex (Vitess, Citus)', 'Native (Cassandra, DynamoDB, MongoDB)'],
      ['Write throughput', '50K–100K TPS (single primary)', '100K–1M+ TPS (distributed)'],
      ['Consistency', 'Strong (ACID by default)', 'Tunable (eventual → strong)'],
      ['Data model', 'Relational (tables, rows)', 'Document, KV, wide-column, graph'],
      ['Schema changes', 'Migration required (ALTER TABLE)', 'Add fields instantly, handle in app'],
      ['Maturity', '50+ years, vast tooling', '10–15 years, evolving ecosystem'],
    ],
  },

  realWorldExamples: [
    {
      company: 'Stack Overflow',
      icon: '💬',
      description:
        'Stack Overflow runs on a remarkably lean SQL stack: SQL Server powers their entire Q&A platform at 3.7 billion page views per month. ' +
        'They use Redis for caching and tag data, Elasticsearch for search, but the core is relational. ' +
        'Their lesson: a well-tuned SQL database can go extremely far. They run on fewer than 30 servers total. ' +
        '"Premature optimisation is the root of all evil" — do not add NoSQL until SQL proves insufficient.',
    },
    {
      company: 'Twitter',
      icon: '🐦',
      description:
        'Twitter started with MySQL (Rails app). As scale grew, they ran into write bottlenecks for tweets. ' +
        'They built Manhattan (their internal distributed key-value store) for tweet storage and home timelines. ' +
        'They use Redis for timelines (materialised fan-out). ' +
        'MySQL remains for user accounts, follow graphs (core entities). ' +
        'Key insight: they did not replace SQL, they added specialised stores for specific high-scale workloads.',
    },
    {
      company: 'Shopify',
      icon: '🛒',
      description:
        'Shopify handles Black Friday peaks of 70K+ orders/minute — all on MySQL (via Vitess for sharding). ' +
        'They use Redis heavily for caching, rate limiting, and job queues (Sidekiq). ' +
        'Their database architecture is sharded MySQL with careful query optimisation and aggressive caching. ' +
        'Shopify demonstrates that SQL at scale is absolutely viable — it just requires engineering investment in sharding and caching, not abandoning SQL.',
    },
  ],

  interviewQuestions: [
    {
      question: 'Design a URL shortener — what database do you use?',
      answer:
        'Core storage: PostgreSQL or DynamoDB for the URL mapping table. Structure: {short_code (PK), original_url, created_at, user_id, click_count}. ' +
        'DynamoDB is a great fit: access pattern is purely "get original_url by short_code" — a single key lookup. No JOINs needed. Scales globally. ' +
        'Analytics (click counts, geographic distribution): ClickHouse or a time-series DB for click events. ' +
        'Caching: Redis cache for popular short codes (top 1% of codes get 99% of traffic). Cache hit for those in <1ms, avoiding DB entirely. ' +
        'The combination: DynamoDB (durable storage) + Redis (hot cache) is the classic pattern for read-heavy lookup services.',
    },
    {
      question: 'Your SQL database is slow. What do you do before switching to NoSQL?',
      answer:
        '(1) Add indexes for slow queries — EXPLAIN ANALYZE to see what\'s doing a full table scan. An index often turns a 2s query into 2ms. ' +
        '(2) Add a caching layer (Redis) for hot, frequently read data. ' +
        '(3) Add read replicas to offload SELECT queries from the primary. ' +
        '(4) Optimise queries — avoid N+1, use pagination, avoid SELECT *. ' +
        '(5) Connection pooling (PgBouncer) to reduce overhead. ' +
        '(6) Vertical scaling — bigger machine, more RAM for buffer cache. ' +
        'Only after exhausting these should you consider NoSQL. Migrating from SQL to NoSQL is a multi-month project with real risk. Most slowness is a missing index or an unoptimised query.',
    },
    {
      question: 'When is eventual consistency acceptable in a real system?',
      answer:
        'Acceptable: social media likes and view counts (showing 1,247 vs 1,248 likes is fine), product search results, recommendation feeds, leaderboards (slightly stale rankings are OK), news feeds. ' +
        'Not acceptable: bank balances (cannot show different balances to different ATMs), inventory (cannot oversell), seat reservations (cannot double-book), authentication tokens (revoked token must be rejected everywhere immediately). ' +
        'The rule: if showing stale data causes financial loss, safety issues, or incorrect decisions — require strong consistency. If stale data is a minor display issue — eventual consistency is fine and gives you better availability and performance.',
    },
  ],

  commonMistakes: [
    'Choosing NoSQL because it is "newer" or "trendy" without analysing actual access patterns',
    'Assuming SQL does not scale — with read replicas, connection pooling, and sharding, SQL scales to massive workloads',
    'Designing a NoSQL schema without defining all access patterns upfront — Cassandra and DynamoDB punish you for this later',
    'Using MongoDB\'s $lookup for large-scale joins — it performs closer to a client-side join than a proper SQL JOIN',
    'Treating eventual consistency as a free feature — it requires careful application logic to handle stale reads and write conflicts',
    'Not benchmarking — choosing based on assumptions about performance, not actual measurements with your data and queries',
    'Mixing use cases in one database — putting metrics, sessions, and business data in one Postgres/Mongo instance creates a hot mess',
  ],
};
