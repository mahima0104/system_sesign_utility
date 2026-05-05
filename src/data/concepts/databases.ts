import type { ConceptDeepDive } from '../../types';

export const databases: ConceptDeepDive = {
  moduleId: 'databases',
  tagline: 'SQL vs NoSQL — choosing the right storage for your system',

  introduction: {
    layman:
      'Every application needs to store data. The first major decision you make is: SQL or NoSQL? ' +
      'SQL databases (PostgreSQL, MySQL) organise data into rigid tables with rows and columns — like a well-structured spreadsheet. ' +
      'NoSQL databases (MongoDB, Redis, Cassandra) are more flexible — they can store documents, key-value pairs, or massive distributed tables. ' +
      'Neither is universally better. Instagram uses both. Netflix uses five different database types. ' +
      'The skill is knowing which to reach for and why.',
    analogy:
      'SQL is like a perfectly organised filing cabinet: everything has a labelled folder, every document follows the same format, and you can cross-reference between folders efficiently. ' +
      'It is rigid but powerful — you can run complex queries across everything. ' +
      'NoSQL is like a flexible digital folder system: each item can look completely different, you can add new "fields" any time, and it is easier to spread across many cabinets (machines). ' +
      'You trade structure and cross-referencing ability for flexibility and scale.',
    whyMatters:
      'In every system design interview, "what database would you use?" is asked within the first 10 minutes. ' +
      'The answer reveals whether you understand data access patterns, consistency trade-offs, and real-world operational constraints. ' +
      'Companies like Amazon, Meta, and Google have multiple teams dedicated to data storage decisions — ' +
      'getting this wrong early means expensive migrations later. Twitter\'s migration from MySQL to their own distributed stores took years.',
  },

  subTopics: [
    {
      title: 'Relational Databases (SQL)',
      icon: '📊',
      layman:
        'SQL databases store data in tables. Each table has defined columns. Rows in one table can reference rows in another using foreign keys. ' +
        'You write SQL to retrieve, join, and aggregate data. They guarantee ACID transactions — if you transfer money from account A to B, ' +
        'either both the debit and credit happen, or neither does.',
      technical:
        'ACID guarantees:\n' +
        '- Atomicity: transaction is all-or-nothing\n' +
        '- Consistency: database goes from one valid state to another\n' +
        '- Isolation: concurrent transactions do not interfere\n' +
        '- Durability: committed data survives crashes (WAL)\n\n' +
        'Strengths:\n' +
        '- Complex queries: JOINs, subqueries, aggregations, window functions\n' +
        '- Referential integrity: foreign keys prevent orphaned records\n' +
        '- Mature tooling: decades of optimisation, monitoring, ORMs\n' +
        '- ACID for financial/inventory operations\n\n' +
        'Weaknesses:\n' +
        '- Schema rigidity: ALTER TABLE on a billion-row table can lock for hours\n' +
        '- Vertical scaling: one powerful machine with hard limits\n' +
        '- Write throughput: single primary bottleneck for all writes\n' +
        '- Object-relational impedance: mapping objects to tables requires ORMs\n\n' +
        'Top choices: PostgreSQL (most feature-rich), MySQL (most deployed), SQLite (embedded)',
      example:
        'E-commerce order placement with ACID transaction:\n\n' +
        'BEGIN;\n' +
        '  -- Deduct inventory\n' +
        '  UPDATE products SET stock = stock - 1 WHERE id = 42 AND stock > 0;\n' +
        '  -- Create order\n' +
        '  INSERT INTO orders (user_id, product_id, amount) VALUES (7, 42, 99.99);\n' +
        '  -- Charge payment\n' +
        '  INSERT INTO payments (order_id, status) VALUES (LASTVAL(), \'pending\');\n' +
        'COMMIT;\n\n' +
        'If any step fails (out of stock, payment failure), ROLLBACK undoes everything.\n' +
        'No partial state. Trying to replicate this safety in a NoSQL database requires distributed sagas — much more complex.',
      whenToUse:
        'Default choice for most applications. Use when you have relationships between entities, need ACID transactions, or require complex queries. Start here and only move to NoSQL when you hit clear limitations.',
    },
    {
      title: 'NoSQL Databases',
      icon: '🗃️',
      layman:
        'NoSQL is an umbrella term for databases that do not use the relational model. ' +
        'It includes document stores (MongoDB — stores JSON objects), key-value stores (Redis — ultra-fast dictionary), ' +
        'wide-column stores (Cassandra — handles billions of rows), and graph databases (Neo4j — maps relationships). ' +
        'They trade some SQL power (no joins, limited transactions) for horizontal scalability and flexible schemas.',
      technical:
        'NoSQL categories:\n\n' +
        '1. Document stores (MongoDB, Firestore):\n' +
        '   - JSON/BSON documents, flexible per-document schema\n' +
        '   - Index on any field, aggregation pipelines\n' +
        '   - Best for: product catalogs, CMS, user profiles\n\n' +
        '2. Key-value stores (Redis, DynamoDB):\n' +
        '   - O(1) get/set by key, optional TTL\n' +
        '   - No querying inside values (Redis)\n' +
        '   - Best for: caching, sessions, rate limiting\n\n' +
        '3. Wide-column (Cassandra, HBase):\n' +
        '   - Rows with variable columns, partition-key routing\n' +
        '   - Linear write scaling across nodes\n' +
        '   - Best for: time-series, activity feeds, IoT\n\n' +
        '4. Graph (Neo4j, Amazon Neptune):\n' +
        '   - Nodes and edges with properties\n' +
        '   - Multi-hop traversal queries\n' +
        '   - Best for: social graphs, fraud rings, recommendations\n\n' +
        'Common trade-offs:\n' +
        '- No ACID by default (most offer eventual consistency)\n' +
        '- No JOINs — embed data or do multiple queries\n' +
        '- Horizontal scaling built-in\n' +
        '- Schema flexibility (good for rapid iteration, dangerous without discipline)',
      example:
        'MongoDB product catalog at an electronics retailer:\n\n' +
        '// Laptop document\n' +
        '{ _id: "P001", category: "laptop", brand: "Dell",\n' +
        '  specs: { cpu: "Intel i7", ram: "16GB", storage: "512GB SSD" },\n' +
        '  price: 1299.99, stock: 45, tags: ["gaming", "business"] }\n\n' +
        '// T-Shirt document (same collection, completely different shape)\n' +
        '{ _id: "P002", category: "clothing", brand: "Nike",\n' +
        '  sizes: ["S","M","L","XL"], colors: ["black","white"],\n' +
        '  material: "100% cotton", price: 29.99 }\n\n' +
        'Adding a new field to one product type requires zero migration. In PostgreSQL:\n' +
        'ALTER TABLE products ADD COLUMN material VARCHAR(100);\n' +
        '-- This locks the table on 10M rows for minutes',
      whenToUse:
        'When schema changes frequently, when you need horizontal write scaling beyond what SQL supports, or when your data naturally fits a non-relational model (graph, time-series, key-value lookups).',
    },
    {
      title: 'The Decision Framework',
      icon: '🎯',
      layman:
        'There is no universal right answer. The decision comes down to four questions: ' +
        '(1) What does my data look like? (2) What queries will I run? (3) How much data and traffic do I expect? (4) How important is strict consistency? ' +
        'Answer those and the choice becomes clearer.',
      technical:
        'Decision matrix:\n\n' +
        'Choose SQL when:\n' +
        '✅ Data has clear relationships (users, orders, products)\n' +
        '✅ Need ACID transactions (financial, inventory, bookings)\n' +
        '✅ Complex queries with JOINs and aggregations\n' +
        '✅ Schema is stable and well-defined\n' +
        '✅ Team knows SQL well (lower learning curve)\n\n' +
        'Choose Document DB when:\n' +
        '✅ Schema varies per record (product catalogs, CMS)\n' +
        '✅ Data maps naturally to JSON objects\n' +
        '✅ Rapid iteration with frequent schema changes\n' +
        '✅ Hierarchical data that would require many JOINs\n\n' +
        'Choose Key-Value when:\n' +
        '✅ Need sub-millisecond lookups\n' +
        '✅ Simple get/set by known key (caching, sessions)\n' +
        '✅ High throughput (millions of ops/sec)\n\n' +
        'Choose Wide-Column when:\n' +
        '✅ Write throughput >100K/sec sustained\n' +
        '✅ Multi-region active-active replication\n' +
        '✅ Time-series or append-heavy workloads\n\n' +
        'Red flags for NoSQL:\n' +
        '❌ "NoSQL scales better" (so does properly indexed Postgres)\n' +
        '❌ No clear access pattern defined yet\n' +
        '❌ Team unfamiliar with consistency trade-offs',
      example:
        'System design decision: ride-sharing app like Uber\n\n' +
        'Drivers/Riders: PostgreSQL\n' +
        '  - User accounts, payment methods, identity\n' +
        '  - ACID for payment processing\n\n' +
        'Driver locations (real-time): Redis\n' +
        '  - driver:loc:{id} → {lat, lng, ts} with 30-second TTL\n' +
        '  - Geo commands for proximity queries\n' +
        '  - 500K active drivers → needs in-memory speed\n\n' +
        'Trip history: Cassandra\n' +
        '  - Billions of completed trips over time\n' +
        '  - Partition by driver_id or city_id\n' +
        '  - Write-heavy, no complex joins needed\n\n' +
        'Surge pricing decisions: PostgreSQL (small table, ACID needed for fare changes)\n\n' +
        'This is how real companies design data layers — multiple databases, each chosen for its access pattern.',
      whenToUse:
        'Always ask: "What queries do I need to run?" before picking a database. The access pattern drives the choice, not technology preference.',
    },
    {
      title: 'Consistency, Availability, and Partition Tolerance',
      icon: '⚖️',
      layman:
        'In distributed systems, the CAP theorem says you can only guarantee two of three properties: ' +
        'Consistency (every read sees the latest write), Availability (every request gets a response), and Partition Tolerance (the system works even if network splits occur). ' +
        'SQL databases prioritise consistency. Many NoSQL databases prioritise availability. ' +
        'In practice, partitions always happen, so the real trade-off is consistency vs. availability.',
      technical:
        'SQL databases — CP systems:\n' +
        '- Strong consistency: reads always see committed writes\n' +
        '- In a network partition: some nodes may become unavailable to preserve consistency\n' +
        '- Single primary receives all writes; replicas may lag\n' +
        '- Read your own writes guaranteed\n\n' +
        'Cassandra — AP system (tunable):\n' +
        '- Eventual consistency by default: writes propagate asynchronously\n' +
        '- Tunable: QUORUM reads/writes enforce stronger consistency at cost of latency\n' +
        '- Always available: every node can serve reads and writes\n' +
        '- Conflicts resolved by "last write wins" (client timestamp)\n\n' +
        'DynamoDB — tunable:\n' +
        '- Eventually consistent reads by default (fast, cheap)\n' +
        '- Strongly consistent reads available (+cost, +latency)\n' +
        '- Global tables for multi-region: eventual consistency across regions\n\n' +
        'Practical implication:\n' +
        '- Stale reads are acceptable for: social feeds, product views, leaderboards → NoSQL\n' +
        '- Stale reads are NOT acceptable for: bank balances, inventory, seat booking → SQL',
      example:
        'Amazon inventory system:\n\n' +
        'Problem: 100 users simultaneously trying to buy the last unit of a product.\n\n' +
        'NoSQL (eventual consistency) approach:\n' +
        '- All 100 writes succeed immediately (stock=0 eventually consistent)\n' +
        '- System might "sell" the same item multiple times before sync\n' +
        '- Leads to overselling — painful for operations\n\n' +
        'SQL (ACID) approach:\n' +
        'UPDATE products SET stock = stock - 1 WHERE id = 42 AND stock > 0\n' +
        '-- Row lock prevents two concurrent transactions from both seeing stock=1\n' +
        '-- First wins, second sees stock=0 and fails cleanly\n' +
        '-- No overselling possible\n\n' +
        'Amazon actually uses DynamoDB with conditional writes for this:\n' +
        '-- UpdateItem with condition: stock > 0\n' +
        '-- Atomic conditional update — prevents overselling even in NoSQL',
    },
  ],

  comparison: {
    caption: 'SQL vs NoSQL — side-by-side comparison',
    columns: ['Property', 'SQL (Relational)', 'Document (MongoDB)', 'Key-Value (Redis)', 'Wide-Column (Cassandra)'],
    rows: [
      ['Schema', 'Fixed, enforced', 'Flexible per doc', 'None', 'Flexible columns'],
      ['Transactions', '✅ Full ACID', '✅ Multi-doc (v4+)', '❌ Limited', '🟡 Lightweight (LWT)'],
      ['Joins', '✅ Native SQL', '❌ Application-level', '❌ None', '❌ None'],
      ['Write scale', '🟡 Vertical + replicas', '✅ Horizontal sharding', '✅ Very high', '✅ Linear scale'],
      ['Query power', '✅ Full SQL', '🟡 Aggregation pipeline', '❌ Key only', '🟡 CQL (no joins)'],
      ['Consistency', '✅ Strong (ACID)', '🟡 Tunable', '🟡 Eventual', '🟡 Tunable'],
      ['Best for', 'OLTP, finance, ERP', 'CMS, catalogs, profiles', 'Cache, sessions, limits', 'IoT, feeds, metrics'],
    ],
  },

  realWorldExamples: [
    {
      company: 'GitHub',
      icon: '🐙',
      description:
        'GitHub uses MySQL as their primary database for most entities: users, repositories, pull requests, issues. ' +
        'They run MySQL at massive scale using Vitess for sharding. ' +
        'They use Redis extensively for caching, job queues (Sidekiq), and feature flags. ' +
        'Elasticsearch handles code search and issue search. ' +
        'GitHub\'s lesson: start with relational and add specialised stores only as specific bottlenecks emerge.',
    },
    {
      company: 'Airbnb',
      icon: '🏠',
      description:
        'Airbnb uses MySQL (via Amazon RDS) as the core booking and listing database — ACID is critical for reservations. ' +
        'They use Redis for session storage and caching hot listing data. ' +
        'Elasticsearch powers their search (location, dates, filters). ' +
        'Druid for real-time analytics on booking patterns. ' +
        'Airbnb\'s principle: "right tool for the right job, but default to MySQL unless you have a compelling reason."',
    },
    {
      company: 'Discord',
      icon: '💬',
      description:
        'Discord migrated from MongoDB to Cassandra for their message storage when MongoDB could not handle their write volume. ' +
        'At 100M daily messages, MongoDB\'s single-primary write bottleneck became the problem. ' +
        'Cassandra\'s distributed write model handles Discord\'s append-heavy message workload natively. ' +
        'They kept PostgreSQL for user accounts, servers, and roles where relational consistency matters. ' +
        'More recently they moved to ScyllaDB (Cassandra-compatible, better performance) for messages.',
    },
  ],

  interviewQuestions: [
    {
      question: 'What would you use for a social media app — SQL or NoSQL?',
      answer:
        'Both. User accounts, follows, and core entities: PostgreSQL (ACID, referential integrity, complex queries). ' +
        'Posts and feeds: Cassandra or a document DB — high write throughput, denormalised for fast reads, no complex joins needed. ' +
        'Caching: Redis for hot profiles, session data, rate limiting. ' +
        'Search: Elasticsearch for hashtag and content search. ' +
        'The mistake is picking one database for everything. Senior engineers design with multiple stores, each optimised for its workload.',
    },
    {
      question: 'How does MongoDB handle the lack of joins?',
      answer:
        'Two strategies: (1) Embedding — include related data inside the document. A blog post with 5 comments includes them as an array in the post document. Fast reads, no join needed. Works when the embedded data is bounded in size and always accessed together. ' +
        '(2) Referencing — store an ID and do two separate queries (like a manual join in application code). Needed when related data is large, unbounded, or shared across documents. ' +
        'MongoDB 3.2+ added $lookup for server-side joins, but they are slower than relational JOINs because MongoDB was not designed for them. The recommended approach is to model your data so joins are rarely needed.',
    },
    {
      question: 'Can you use a NoSQL database for financial transactions?',
      answer:
        'Yes, but carefully. DynamoDB supports ACID transactions on multiple items within a single region. MongoDB 4.0+ supports multi-document ACID transactions. ' +
        'The concern is: many NoSQL databases default to eventual consistency, which means two reads might see different values temporarily. For bank balances, inventory, or seat booking, this is dangerous. ' +
        'If using NoSQL for financial data: use strongly consistent reads, use conditional writes to prevent conflicts, implement idempotency keys to handle retries, and use distributed locking carefully. ' +
        'Relational databases are still the safer default for financial data — the guarantees are built-in, not bolt-on.',
    },
  ],

  commonMistakes: [
    'Choosing MongoDB for everything because "NoSQL is more modern" — SQL is often the correct, simpler choice',
    'Thinking NoSQL always scales better — PostgreSQL with read replicas handles most web scale; NoSQL complexity is real',
    'Using a document DB and then needing lots of joins — this means your data model is actually relational',
    'Not defining access patterns before choosing a database — wide-column and key-value require knowing queries upfront',
    'Using Redis as a primary database — it is an in-memory cache; without persistence config, data loss on restart is real',
    'Mixing strong consistency requirements with eventually consistent NoSQL (e.g., using Cassandra for bank balances)',
    'Migrating from SQL to NoSQL to solve a performance problem that indexes and caching would have fixed',
  ],
};
