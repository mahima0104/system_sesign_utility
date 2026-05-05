import type { ConceptDeepDive } from '../../types';

export const relationalDatabases: ConceptDeepDive = {
  moduleId: 'relational-databases',
  tagline: 'The backbone of enterprise software for 50 years — and still the right default',

  introduction: {
    layman:
      'A relational database organises data into tables — think spreadsheets with superpowers. ' +
      'A "users" table has columns for id, name, and email. An "orders" table has order details plus a user_id that links back to the users table. ' +
      'This linking (the "relation" in relational) lets you ask complex questions: "Give me all orders placed by users in California in the last 30 days, sorted by value." ' +
      'Relational databases (PostgreSQL, MySQL, SQL Server) power most of the world\'s financial systems, e-commerce sites, and enterprise applications. ' +
      'They have been the standard since the 1970s — not because we lack alternatives, but because they solve most problems incredibly well.',
    analogy:
      'Imagine a highly organised office with a strict filing system. ' +
      'Every client has exactly one folder in the client cabinet. Every invoice has exactly one folder in the invoice cabinet, with a reference number pointing to the right client folder. ' +
      'Nothing is duplicated. If a client\'s address changes, you update one place and every invoice automatically reflects it. ' +
      'A skilled clerk (SQL) can cross-reference cabinets instantly: "Find all invoices over $10K from clients in New York." ' +
      'The system is disciplined, consistent, and queryable from any angle.',
    whyMatters:
      'Relational databases are the default choice for a reason: ACID guarantees prevent data corruption, SQL is the most expressive query language ever built, and the ecosystem is mature (ORMs, migration tools, monitoring). ' +
      'When you "design Twitter," "design Airbnb," or "design a bank" in an interview, relational databases handle the core transactional data. ' +
      'Every senior engineer needs to understand their strengths, limitations, and scaling strategies deeply — because this is what runs most production systems.',
  },

  subTopics: [
    {
      title: 'The Relational Model and Normalisation',
      icon: '🗄️',
      layman:
        'The relational model has one rule: store each piece of information in exactly one place. ' +
        'If you store a user\'s email in 3 different tables and they change it, you have to update 3 places — and if one fails, data is inconsistent. ' +
        'Normalisation is the process of structuring tables to eliminate this duplication. ' +
        'First Normal Form (1NF), Second Normal Form (2NF), Third Normal Form (3NF) are the progressively stricter rules that eliminate different types of redundancy.',
      technical:
        'Normalisation forms:\n\n' +
        '1NF: no repeating groups, atomic values per cell\n' +
        '  ❌ Bad: orders(id, product_names, product_prices) — multiple values in one column\n' +
        '  ✅ Good: order_items(order_id, product_id, price) — one row per item\n\n' +
        '2NF: 1NF + no partial dependency on composite key\n' +
        '  ❌ Bad: order_items(order_id, product_id, product_name) — product_name depends only on product_id\n' +
        '  ✅ Good: separate products(id, name) table + order_items(order_id, product_id)\n\n' +
        '3NF: 2NF + no transitive dependency\n' +
        '  ❌ Bad: orders(id, zip_code, city, state) — city and state depend on zip_code, not order id\n' +
        '  ✅ Good: zip_codes(code, city, state) + orders(id, zip_code FK)\n\n' +
        'Denormalisation: intentional duplication for query performance\n' +
        '  Storing customer_name in the orders table avoids a JOIN for the 90% of queries that need it.\n' +
        '  Trade-off: update anomalies if customer changes name.',
      example:
        'E-commerce normalised schema:\n\n' +
        'users(id, email, name, created_at)\n' +
        'addresses(id, user_id FK, street, city, country, is_default)\n' +
        'products(id, name, price, stock, category_id FK)\n' +
        'categories(id, name, parent_id FK)\n' +
        'orders(id, user_id FK, shipping_address_id FK, status, created_at)\n' +
        'order_items(id, order_id FK, product_id FK, quantity, unit_price)\n' +
        'payments(id, order_id FK, amount, method, status, processed_at)\n\n' +
        'Benefits:\n' +
        '- Change product price → update one row in products. Historical order_items keep the price-at-time-of-order (unit_price stored).\n' +
        '- User changes address → update addresses table. All orders reference address by ID.\n' +
        '- Zero data duplication → no inconsistency risk.\n\n' +
        'Query: "Total revenue by category last month"\n' +
        'SELECT c.name, SUM(oi.quantity * oi.unit_price) as revenue\n' +
        'FROM order_items oi\n' +
        'JOIN orders o ON oi.order_id = o.id\n' +
        'JOIN products p ON oi.product_id = p.id\n' +
        'JOIN categories c ON p.category_id = c.id\n' +
        'WHERE o.created_at > NOW() - INTERVAL \'30 days\'\n' +
        'GROUP BY c.name ORDER BY revenue DESC;',
      whenToUse:
        'Always normalise first. Denormalise only when you have measured a specific query is too slow due to JOINs — and the trade-off of duplication is acceptable.',
    },
    {
      title: 'ACID Transactions in Depth',
      icon: '🔒',
      layman:
        'ACID is the most important property of relational databases. ' +
        'Imagine transferring $500 from your savings to your checking account. ' +
        'If the database crashes after debiting savings but before crediting checking, you just lost $500. ' +
        'ACID prevents this. The transaction either fully completes (both debit and credit) or fully rolls back (neither). ' +
        'No partial state is ever visible to other users.',
      technical:
        'Atomicity:\n' +
        '- BEGIN/COMMIT/ROLLBACK wraps multiple SQL statements as one unit\n' +
        '- Write-Ahead Log (WAL): changes written to WAL before data pages\n' +
        '- Crash recovery: on restart, redo committed WAL entries, undo incomplete ones\n\n' +
        'Consistency:\n' +
        '- Constraints checked at commit: NOT NULL, UNIQUE, CHECK, FOREIGN KEY\n' +
        '- Triggers: run custom logic before/after writes\n' +
        '- If any constraint fails: entire transaction rolls back\n\n' +
        'Isolation — concurrency control:\n' +
        '- READ UNCOMMITTED: can read dirty (uncommitted) data — almost never used\n' +
        '- READ COMMITTED: only see committed data (default PostgreSQL, MySQL)\n' +
        '- REPEATABLE READ: same row reads return same value within transaction\n' +
        '- SERIALIZABLE: transactions appear to run one after another (strongest, slowest)\n\n' +
        'Isolation anomalies by level:\n' +
        '- Dirty read: reading uncommitted data (prevented by RC+)\n' +
        '- Non-repeatable read: same row reads different values within transaction (prevented by RR+)\n' +
        '- Phantom read: query returns different rows within transaction (prevented by SERIALIZABLE)\n\n' +
        'Durability:\n' +
        '- fsync: WAL flushed to disk before COMMIT returns to client\n' +
        '- Replication: WAL shipped to standby for additional durability\n' +
        '- PITR (Point-in-Time Recovery): restore to any point in time using WAL archive',
      example:
        'Seat booking with SERIALIZABLE isolation (airline reservation):\n\n' +
        'Two users simultaneously trying to book seat 14A on flight UA100:\n\n' +
        'Transaction T1 (User Alice):              Transaction T2 (User Bob):\n' +
        'BEGIN TRANSACTION ISOLATION LEVEL         BEGIN TRANSACTION ISOLATION LEVEL\n' +
        '  SERIALIZABLE;                             SERIALIZABLE;\n' +
        'SELECT status FROM seats                  SELECT status FROM seats\n' +
        '  WHERE flight=\'UA100\' AND seat=\'14A\';     WHERE flight=\'UA100\' AND seat=\'14A\';\n' +
        '-- Both see: status=\'available\'           -- Both see: status=\'available\'\n' +
        'UPDATE seats SET status=\'booked\',         UPDATE seats SET status=\'booked\',\n' +
        '  booked_by=\'alice\'                         booked_by=\'bob\'\n' +
        '  WHERE flight=\'UA100\'                      WHERE flight=\'UA100\'\n' +
        '  AND seat=\'14A\' AND status=\'available\';   AND seat=\'14A\' AND status=\'available\';\n' +
        'COMMIT;  ✅                               COMMIT;  ❌ SERIALIZATION FAILURE\n' +
        '                                         -- Bob must retry or get error\n\n' +
        'Serializable isolation detects the conflict and rejects T2. No double booking.',
      whenToUse:
        'Use READ COMMITTED for most OLTP queries. Use REPEATABLE READ for financial calculations that read data multiple times. Use SERIALIZABLE for critical invariants like seat booking or inventory where phantom reads would cause real problems.',
    },
    {
      title: 'Indexes and Query Performance',
      icon: '🔍',
      layman:
        'Without an index, finding a user by email means scanning every single row in the users table — even if there are 100 million rows. ' +
        'An index is a separate data structure (a B-Tree) that lets the database jump directly to the right rows. ' +
        'Adding the right index can turn a 10-second query into a 10-millisecond one. ' +
        'But indexes have a cost: every write must update all relevant indexes. ' +
        'Too many indexes slow down writes. Too few indexes make reads slow.',
      technical:
        'B-Tree index (default):\n' +
        '- Balanced tree structure, O(log N) search, supports =, <, >, BETWEEN, LIKE \'prefix%\'\n' +
        '- Stores: (indexed_value, row_pointer) pairs in sorted order\n' +
        '- Supports range scans and ORDER BY without sorting\n\n' +
        'Hash index:\n' +
        '- O(1) lookup for exact equality (=). Cannot do ranges.\n' +
        '- PostgreSQL supports hash indexes; MySQL does not (InnoDB uses adaptive hash index)\n\n' +
        'GIN index (Generalised Inverted Index):\n' +
        '- For arrays, JSONB, full-text search\n' +
        '- CREATE INDEX idx ON posts USING GIN(content_tsv) for full-text\n\n' +
        'Composite indexes:\n' +
        '- CREATE INDEX idx ON orders (user_id, created_at DESC)\n' +
        '- Leftmost prefix rule: can use this index for queries on (user_id) or (user_id, created_at)\n' +
        '- Cannot use for queries on just (created_at)\n\n' +
        'Covering indexes:\n' +
        '- Include all columns needed by query in index → no table lookup needed\n' +
        '- CREATE INDEX idx ON users (email) INCLUDE (name, plan)\n' +
        '  SELECT name, plan FROM users WHERE email = \'x\' → index-only scan\n\n' +
        'EXPLAIN ANALYZE: shows actual execution plan, rows scanned, time taken\n' +
        '- "Seq Scan": full table scan → probably needs an index\n' +
        '- "Index Scan": using an index → good\n' +
        '- "Index Only Scan": covering index hit → best\n' +
        '- "Nested Loop / Hash Join / Merge Join": JOIN strategies',
      example:
        'Diagnosing a slow query:\n\n' +
        'EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 12345 ORDER BY created_at DESC LIMIT 10;\n\n' +
        'Before index:\n' +
        '"Seq Scan on orders (cost=0.00..450000 rows=10M, actual time=4200ms)"\n' +
        '-- Full scan of 10M rows. 4.2 seconds. Unacceptable.\n\n' +
        'Add index:\n' +
        'CREATE INDEX idx_orders_user_time ON orders(user_id, created_at DESC);\n\n' +
        'After index:\n' +
        '"Index Scan using idx_orders_user_time (cost=0.56..12.3 rows=10, actual time=0.8ms)"\n' +
        '-- Jumps directly to user 12345\'s orders, already sorted. 0.8ms.\n' +
        '-- 5000× speedup from one index.\n\n' +
        'Trade-off: each INSERT into orders now also writes to idx_orders_user_time.\n' +
        'On an orders table with 1M inserts/day: ~5% write overhead. Worth it.',
      whenToUse:
        'Index every column used in WHERE, JOIN ON, or ORDER BY for frequently run queries. Avoid over-indexing write-heavy tables. Use EXPLAIN ANALYZE to verify index usage before and after.',
    },
    {
      title: 'Scaling Relational Databases',
      icon: '📈',
      layman:
        'A single PostgreSQL server can handle most workloads — up to about 10,000–50,000 queries per second depending on complexity. ' +
        'But as your app grows, you need strategies to go further. ' +
        'Read replicas let you distribute SELECT queries across multiple machines. ' +
        'Connection pooling prevents thousands of app connections from overwhelming the database. ' +
        'Eventually, sharding splits the data itself across multiple database instances.',
      technical:
        'Connection pooling (PgBouncer):\n' +
        '- PostgreSQL allows ~100–200 concurrent connections efficiently\n' +
        '- Each connection = 5–10MB RAM + process overhead\n' +
        '- PgBouncer pools connections: 1000 app threads → 50 actual DB connections\n' +
        '- Session pooling vs transaction pooling vs statement pooling\n\n' +
        'Read replicas:\n' +
        '- Primary (writer) streams WAL to one or more replicas\n' +
        '- Replicas apply WAL, become queryable read-only copies\n' +
        '- Replication lag: replicas may be milliseconds to seconds behind\n' +
        '- Route read queries to replicas, writes to primary\n' +
        '- Synchronous replication: wait for replica ACK before committing (zero lag, slower writes)\n\n' +
        'Vertical scaling:\n' +
        '- AWS RDS db.r6g.16xlarge: 64 vCPU, 512GB RAM (~$15K/month)\n' +
        '- Diminishing returns above ~32 cores for most OLTP workloads\n\n' +
        'Partitioning (within one database):\n' +
        '- Table partitioning by range: one physical table per year/month\n' +
        '  CREATE TABLE orders_2024 PARTITION OF orders FOR VALUES FROM (\'2024-01-01\') TO (\'2025-01-01\');\n' +
        '- Queries on one partition only scan that partition (partition pruning)\n' +
        '- Drop old partitions instantly (vs DELETE of millions of rows)\n\n' +
        'Sharding (across multiple databases):\n' +
        '- Split rows across database instances by shard key\n' +
        '- Vitess (MySQL): transparent sharding middleware, used by YouTube, Slack\n' +
        '- Citus (PostgreSQL): distributed PostgreSQL, shard tables across worker nodes\n' +
        '- CockroachDB: distributed SQL with automatic sharding\n\n' +
        'Replication architecture for a high-traffic app:\n' +
        'App → PgBouncer → Primary DB (writes)\n' +
        '                → Replica 1 (read traffic 50%)\n' +
        '                → Replica 2 (read traffic 50%)\n' +
        '                → Replica 3 (analytics / reporting — OK to be seconds behind)',
      example:
        'Shopify Black Friday scaling:\n\n' +
        'Traffic: 70,000+ orders per minute at peak\n' +
        'Database: MySQL (sharded via Vitess)\n\n' +
        'Architecture:\n' +
        '- Hundreds of MySQL shards, each handling a range of shop IDs\n' +
        '- Vitess vtgate routes queries to correct shard transparently\n' +
        '- Each shard: 1 primary + 2 replicas\n' +
        '- PgBouncer equivalent (MySQL Proxy) for connection pooling\n' +
        '- Redis caches hot product inventory and session data\n\n' +
        'Why not NoSQL?\n' +
        '- Financial transactions require ACID (no overselling, no payment inconsistency)\n' +
        '- Complex queries for merchant analytics, tax reporting\n' +
        '- Shopify processes billions of dollars — they cannot afford consistency bugs\n\n' +
        'Lesson: sharded SQL handles internet scale. NoSQL is not required for scale alone.',
    },
    {
      title: 'PostgreSQL vs MySQL: Which to Choose',
      icon: '⚖️',
      layman:
        'PostgreSQL and MySQL are the two most popular open-source relational databases. ' +
        'Both are battle-tested. Both run most of the world\'s web applications. ' +
        'PostgreSQL is more standards-compliant, more feature-rich, and better for complex queries. ' +
        'MySQL has a larger ecosystem in web hosting and is marginally simpler to set up. ' +
        'For new projects, PostgreSQL is the modern default choice.',
      technical:
        'PostgreSQL advantages:\n' +
        '- Full SQL compliance: window functions, CTEs, ALL isolation levels\n' +
        '- Rich data types: JSONB, arrays, hstore, UUID, PostGIS (geospatial)\n' +
        '- JSONB: binary JSON with indexing, operators, and functions\n' +
        '- Table inheritance and partitioning\n' +
        '- Custom extensions: PostGIS (geospatial), pg_trgm (fuzzy search), pgvector (vectors)\n' +
        '- MVCC (Multi-Version Concurrency Control): readers never block writers\n' +
        '- Default: REPEATABLE READ for better isolation than MySQL default\n\n' +
        'MySQL advantages:\n' +
        '- Simpler replication setup (traditionally)\n' +
        '- Wider web hosting support (LAMP stack)\n' +
        '- Vitess ecosystem (Slack, GitHub, YouTube)\n' +
        '- MariaDB: community fork with additional features\n' +
        '- Marginally faster for simple key-value reads (historical; gap has closed)\n\n' +
        'For new projects: PostgreSQL unless you have a specific reason (team expertise, ecosystem) for MySQL\n\n' +
        'Cloud managed options:\n' +
        '- PostgreSQL: AWS RDS for PostgreSQL, Google Cloud SQL, Supabase, Neon\n' +
        '- MySQL: AWS RDS for MySQL, PlanetScale (MySQL + Vitess), Amazon Aurora\n' +
        '- Distributed SQL: CockroachDB, Google Spanner, TiDB',
      example:
        'JSONB in PostgreSQL — bridging relational and document:\n\n' +
        'CREATE TABLE products (\n' +
        '  id SERIAL PRIMARY KEY,\n' +
        '  name TEXT NOT NULL,\n' +
        '  category TEXT,\n' +
        '  attributes JSONB  -- flexible, per-product-type fields\n' +
        ');\n\n' +
        'INSERT INTO products VALUES\n' +
        '  (1, \'MacBook Pro\', \'laptop\', \'{"cpu":"M3","ram":"16GB","weight":1.4}\'),\n' +
        '  (2, \'Nike Air Max\', \'shoes\', \'{"sizes":[7,8,9,10],"colors":["black","white"]}\');\n\n' +
        '-- Query inside JSONB:\n' +
        'SELECT name FROM products WHERE attributes->>\'cpu\' = \'M3\';\n\n' +
        '-- Index on JSONB field:\n' +
        'CREATE INDEX idx_cpu ON products USING GIN ((attributes->\'cpu\'));\n\n' +
        'You get schema flexibility where you need it (attributes), and relational structure where it matters (id, name, category).',
      whenToUse:
        'New projects: PostgreSQL. Existing MySQL ecosystem: stay on MySQL (migration cost rarely justified). Need distributed SQL with automatic sharding: CockroachDB or TiDB.',
    },
  ],

  comparison: {
    caption: 'PostgreSQL vs MySQL vs SQLite vs CockroachDB',
    columns: ['Database', 'Best For', 'Strengths', 'Limitations'],
    rows: [
      ['PostgreSQL', 'Production web apps, complex queries', 'Feature-rich, JSONB, extensions, full SQL compliance', 'More complex setup than MySQL'],
      ['MySQL', 'Web apps, LAMP stack, Vitess sharding', 'Wide hosting support, large ecosystem', 'Fewer advanced features than PostgreSQL'],
      ['SQLite', 'Mobile apps, testing, embedded', 'Zero config, serverless, single file', 'No concurrent writes, no network access'],
      ['CockroachDB', 'Distributed SQL, multi-region', 'Geo-distributed, SERIALIZABLE by default', 'Higher latency than single-node, complex ops'],
      ['Amazon Aurora', 'AWS-native high availability', 'Fast failover, read replicas, serverless mode', 'Vendor lock-in, cost at scale'],
    ],
  },

  realWorldExamples: [
    {
      company: 'Stripe',
      icon: '💳',
      description:
        'Stripe processes hundreds of billions of dollars annually using PostgreSQL as their core database. ' +
        'Financial transactions demand ACID guarantees that only relational databases reliably provide. ' +
        'Stripe uses pg_bouncer for connection pooling, read replicas for analytics, and has invested heavily in query optimisation tooling. ' +
        'Their lesson: for financial systems, correctness trumps novelty. They chose the boring, proven technology and built systems around it.',
    },
    {
      company: 'GitHub',
      icon: '🐙',
      description:
        'GitHub runs on MySQL (Vitess-sharded) for their core data: repositories, pull requests, issues, users. ' +
        'They famously migrated from Rails-default ActiveRecord queries to explicit SQL with careful index management. ' +
        'One of their key engineering posts described how a single missing index caused multi-second query times on their busiest tables. ' +
        'GitHub handles billions of git events through a MySQL backbone, demonstrating that relational databases scale to massive workloads with the right engineering.',
    },
    {
      company: 'Notion',
      icon: '📝',
      description:
        'Notion stores all user documents and blocks in PostgreSQL. They use JSONB extensively to store block-level content with flexible structure (different block types have different attributes). ' +
        'Their schema: blocks(id, parent_id, type, properties JSONB, space_id) — a recursive self-referencing structure. ' +
        'PostgreSQL recursive CTEs let them traverse page hierarchies efficiently. ' +
        'They added read replicas and aggressive caching as they scaled to millions of users, without changing the core relational foundation.',
    },
  ],

  interviewQuestions: [
    {
      question: 'How would you optimise a slow PostgreSQL query?',
      answer:
        '(1) Run EXPLAIN ANALYZE to see the actual execution plan — look for Seq Scans on large tables. ' +
        '(2) Add missing indexes on WHERE, JOIN ON, and ORDER BY columns. ' +
        '(3) Check index selectivity — an index on a boolean column has low selectivity and may not help. ' +
        '(4) Rewrite N+1 queries — fetch related data in one query, not in a loop. ' +
        '(5) Use covering indexes (INCLUDE) to enable index-only scans. ' +
        '(6) Consider query rewrite — sometimes a CTE or subquery is executed differently than you expect. ' +
        '(7) Check table statistics (ANALYZE) — stale statistics cause the query planner to choose wrong execution plans. ' +
        '(8) For analytical queries on large tables: consider partitioning, partial indexes, or materialized views.',
    },
    {
      question: 'Explain database isolation levels with a practical example',
      answer:
        'READ COMMITTED (default): You see only committed data at the moment you read. If transaction A reads a row, transaction B commits a change, and A reads again — A sees the new value. This is called a non-repeatable read. Good for most web applications. ' +
        'REPEATABLE READ: Same row reads return the same value within a transaction. If A reads user balance as $1000, then B commits a debit to $800, A still sees $1000 until it commits. Prevents non-repeatable reads. Good for financial calculations. ' +
        'SERIALIZABLE: Transactions execute as if they ran one after another. Prevents phantom reads (new rows appearing). Used for seat booking, inventory checks. Highest safety but slowest (more contention and rollbacks). ' +
        'The practical rule: use READ COMMITTED for general CRUD. Use SERIALIZABLE when you must guarantee that "check then act" operations are safe (check seat available → book seat).',
    },
    {
      question: 'When would you NOT use a relational database?',
      answer:
        'Five clear signals to look elsewhere: ' +
        '(1) Write throughput exceeds 100K TPS sustained and sharding adds too much complexity — consider Cassandra or DynamoDB. ' +
        '(2) Data has no relationships and is purely key-based lookups at sub-millisecond latency — use Redis. ' +
        '(3) Data is heavily graph-shaped and queries are multi-hop traversals — use Neo4j. ' +
        '(4) Data is time-series metrics with billions of data points — use InfluxDB or TimescaleDB. ' +
        '(5) Schema changes 10 times per week and structure is genuinely unpredictable — document DB reduces migration pain. ' +
        'Note: these are signals to ADD a specialised database, not necessarily to abandon the relational one for core business data.',
    },
    {
      question: 'What is the N+1 query problem and how do you fix it?',
      answer:
        'N+1 occurs when you query a list of N items, then make a separate query for each item\'s related data. ' +
        'Example: SELECT * FROM posts LIMIT 20 → 20 posts. Then for each post: SELECT * FROM users WHERE id = post.user_id → 20 more queries. Total: 21 queries. ' +
        'Fix with a JOIN: SELECT p.*, u.name FROM posts p JOIN users u ON p.user_id = u.id LIMIT 20 → 1 query. ' +
        'In ORMs: Eloquent uses eager loading (with(\'user\')), ActiveRecord uses includes(:user), Django uses select_related. ' +
        'N+1 is one of the most common performance bugs in web applications. EXPLAIN ANALYZE reveals it as many repeated index scans.',
    },
  ],

  commonMistakes: [
    'Not adding indexes on foreign key columns — foreign key columns are frequently JOINed but not automatically indexed in PostgreSQL',
    'Using SELECT * — fetches all columns including large TEXT/BLOB fields; always name the columns you need',
    'N+1 queries from lazy loading in ORMs — invisible in development, catastrophic in production with 10K+ users',
    'Not using transactions for multi-step operations — two separate INSERTs without a transaction can leave partial data on crash',
    'Deleting rows from huge tables with DELETE — locks the table; use partitioning and DROP PARTITION for bulk deletes',
    'Not running VACUUM/ANALYZE — dead rows accumulate (MVCC), bloating tables and slowing queries; configure autovacuum properly',
    'Over-normalising for OLAP workloads — reporting databases often benefit from denormalised star schema, not 3NF',
    'Ignoring connection limits — applications that open unlimited connections overwhelm PostgreSQL; always use PgBouncer',
  ],
};
