import type { ConceptDeepDive } from '../../types';

export const verticalHorizontalPartitioning: ConceptDeepDive = {
  moduleId: 'vertical-partitioning',
  tagline: 'Before you shard horizontally, split smart vertically — often you can 10× performance without distributing at all',

  introduction: {
    layman:
      'Most database performance advice jumps straight to sharding — splitting data across multiple machines. But there\'s a simpler, often-overlooked first step: partitioning within the same database. ' +
      'Vertical partitioning splits a table by columns: keep the frequently-accessed columns in one table and the big, rarely-used ones in another. ' +
      'Horizontal partitioning splits a table by rows: January orders go to Partition 1, February to Partition 2. Same database, just smarter organisation. ' +
      'Both let queries touch much less data — faster results, less I/O, lower cost — before you ever need to think about multiple machines.',
    analogy:
      'Imagine a desk with one massive drawer containing everything: business cards, receipts, old contracts, sticky notes, pens, stamps, and holiday cards from 2015. ' +
      'To find a business card, you sort through everything every time. ' +
      'Vertical partitioning: separate drawer for business cards, another for receipts, another for pens. Now finding a business card only involves one small drawer. ' +
      'Horizontal partitioning: same business card drawer but divided by month — "Jan–Mar", "Apr–Jun". Need a March card? Only check the first section. ' +
      'You haven\'t bought more furniture (new machines). You just organised what you had.',
    whyMatters:
      'Partitioning is one of the most underused database features. PostgreSQL, MySQL, and virtually every enterprise database support native table partitioning. ' +
      'Companies like Dropbox, Notion, and Cloudflare use table partitioning to manage billions of rows without going to full multi-machine sharding. ' +
      'In interviews, partitioning comes up when you discuss "how do you manage large tables?" or "how do you archive old data efficiently?" — it\'s the step between single-table and full sharding.',
  },

  subTopics: [
    {
      title: 'Vertical Partitioning (Column Splitting)',
      icon: '↕️',
      layman:
        'A users table might have: id, name, email, profile_picture, bio, preferences, settings, last_login, created_at. ' +
        'Every time you fetch a user\'s name for a notification, you load all those columns — including the 50KB profile_picture blob and the giant preferences JSON. ' +
        'Vertical partitioning splits this into users_core (id, name, email) and users_profile (id, profile_picture, bio, preferences). ' +
        'Notification queries only hit the tiny users_core table — 100× less data per query.',
      technical:
        'Vertical partitioning = splitting a wide table into multiple narrower tables on the same columns.\n\n' +
        'When to vertically partition:\n' +
        '- Table has many columns with very different access frequencies.\n' +
        '- Some columns are large (TEXT, BLOB, large JSON) and infrequently accessed.\n' +
        '- Queries rarely need all columns at once (violates row-level storage efficiency).\n\n' +
        'Benefits:\n' +
        '- Smaller rows → more rows per disk page → fewer I/O operations per query.\n' +
        '- Frequently accessed columns fit in buffer cache (RAM) → more cache hits.\n' +
        '- Column-level access control: different services have different table permissions.\n' +
        '- Reduced lock contention: writes to profile don\'t block reads of core data.\n\n' +
        'Implementation:\n' +
        'Split at the schema level: two tables sharing primary key.\n' +
        'JOIN when full data needed: SELECT * FROM users_core c JOIN users_profile p ON c.id = p.id\n' +
        'Use separate microservices: UserService reads users_core, ProfileService reads users_profile.',
      example:
        'Before vertical partitioning — products table (e-commerce):\n' +
        'products(id, name, price, stock, description TEXT 50KB, images JSONB 200KB, specifications JSONB 100KB, metadata JSONB 50KB)\n' +
        'Average row: 400KB. Product listing query fetches 10 products → 4MB per query. Slow.\n\n' +
        'After vertical partitioning:\n' +
        'products_core(id, name, price, stock) — Average row: 100 bytes.\n' +
        'products_detail(id, description, images, specifications, metadata) — accessed only on product detail page.\n\n' +
        'Product listing: SELECT id, name, price FROM products_core LIMIT 10 → 1KB per query.\n' +
        '4,000× less data read for the most common query.',
      whenToUse: 'When your table has many columns and queries rarely need all of them. Especially when large blobs or JSON fields are infrequently accessed but stored in the same row as frequently-queried fields.',
    },
    {
      title: 'Horizontal Partitioning (Row Splitting by Range)',
      icon: '↔️',
      layman:
        'You have 5 years of order data — 500 million rows. But 95% of queries are for orders from the last 3 months. ' +
        'Horizontal range partitioning splits this table by date: one partition per month. ' +
        'Queries for "orders this month" scan only 1 partition (10 million rows) instead of all 500 million. ' +
        'Old partitions can be archived, compressed, or moved to cheaper storage. ' +
        'And all of this happens inside the same database — no new machines needed.',
      technical:
        'Horizontal partitioning = splitting a table\'s rows into partitions, typically by a range column.\n\n' +
        'Types:\n' +
        '1. Range partitioning: partition by a value range (date, ID range, alphabetical range).\n' +
        '2. List partitioning: partition by discrete values (country, status, category).\n' +
        '3. Hash partitioning: partition by hash(key) % N — even distribution, no hot partitions.\n' +
        '4. Composite partitioning: range by year, then hash by user_id within each year.\n\n' +
        'PostgreSQL declarative partitioning:\n' +
        'CREATE TABLE orders (id bigint, user_id bigint, created_at date, amount numeric)\n' +
        'PARTITION BY RANGE (created_at);\n\n' +
        'CREATE TABLE orders_2024_q1 PARTITION OF orders\n' +
        '  FOR VALUES FROM (\'2024-01-01\') TO (\'2024-04-01\');\n\n' +
        'MySQL PARTITION BY RANGE (YEAR(created_at)) similarly.\n\n' +
        'Partition pruning: the query planner automatically skips irrelevant partitions.\n' +
        'WHERE created_at >= \'2024-03-01\' → only scans Q1 2024 partition.',
      example:
        'Payments table at a fintech startup — 3 billion rows accumulated over 5 years.\n\n' +
        'Without partitioning:\n' +
        'Query: "monthly statement for March 2024" → scans 3B rows → 45 seconds.\n\n' +
        'With monthly partitioning:\n' +
        'payments_2024_03 partition → 80M rows.\n' +
        'Same query: scans only that partition → 1.2 seconds.\n\n' +
        'Further gains:\n' +
        'payments_2020_* partitions (5 years old) → compress or move to cold storage.\n' +
        'Partition DROP for old data: DROP TABLE payments_2019_01 → instant (no DELETE needed).\n' +
        'New partition for each month created automatically via partition maintenance job.',
      whenToUse: 'Range partition on time-series data (logs, events, transactions, orders) where queries almost always filter by time range and old data is less frequently accessed.',
    },
    {
      title: 'Partition Pruning — Why Partitioning Accelerates Queries',
      icon: '✂️',
      layman:
        'The magic of partitioning isn\'t just that data is organised — it\'s that the database is smart enough to skip partitions that can\'t possibly contain the data you\'re asking for. ' +
        'This automatic skipping is called partition pruning. You write the same SQL query, but the database only reads a fraction of the data.',
      technical:
        'Partition pruning requires the query\'s WHERE clause to include the partition key.\n\n' +
        'Works: WHERE created_at >= \'2024-01-01\' AND created_at < \'2024-04-01\'\n' +
        '→ planner knows: only Q1 2024 partition, skip all others.\n\n' +
        'Does NOT work: WHERE YEAR(created_at) = 2024\n' +
        '→ function wraps the column → planner cannot determine which partition → scans all.\n\n' +
        'PostgreSQL EXPLAIN output:\n' +
        '  Seq Scan on orders_2024_q1 (→ pruned to 1 partition out of 20)\n' +
        '  Filter: created_at >= \'2024-01-01\'\n\n' +
        'Dynamic partition pruning (PostgreSQL 11+):\n' +
        'Even works with parameterized queries and JOINs — the planner evaluates the partition key at runtime.\n\n' +
        'Index + partition combo:\n' +
        'Each partition has its own local index (smaller, faster).\n' +
        'A table-level query hits one partition\'s smaller local index → even faster than a global table index.',
      example:
        'Notification logs: 20 partitions by month (1.5 years of data, 6B total rows, 300M per partition).\n\n' +
        'Query: "All SMS notifications for user 42 sent in February 2024"\n' +
        'WHERE user_id = 42 AND sent_at BETWEEN \'2024-02-01\' AND \'2024-03-01\' AND type = \'SMS\'\n\n' +
        'Without partitioning:\n' +
        '  Full scan: 6B rows × index lookup → slow.\n\n' +
        'With partitioning + pruning:\n' +
        '  Planner: sent_at range → only partition 2024_02 (300M rows).\n' +
        '  Index on user_id within that partition → find user 42\'s 23 SMS notifications.\n' +
        '  Total rows examined: 23. Not 6 billion.',
    },
    {
      title: 'Partition Maintenance: Archiving and Dropping Old Data',
      icon: '🗑️',
      layman:
        'One of the biggest benefits of partitioning is how easy it makes cleaning up old data. ' +
        'Without partitioning, deleting a year\'s worth of old logs from a 5-billion-row table means: ' +
        'DELETE FROM logs WHERE created_at < \'2023-01-01\' — this locks rows, generates massive WAL entries, and can take hours. ' +
        'With monthly partitioning: DROP TABLE logs_2022_12 — completes in milliseconds because you\'re dropping a whole file, not deleting millions of individual rows.',
      technical:
        'Partition detach and drop:\n' +
        'ALTER TABLE logs DETACH PARTITION logs_2022_12;  -- detach, now standalone table\n' +
        'DROP TABLE logs_2022_12;  -- instant file delete, no row-level deletion\n\n' +
        'Partition archiving:\n' +
        '1. Detach old partition.\n' +
        '2. pg_dump → compress → upload to S3 (cold storage, 90% cost reduction).\n' +
        '3. Drop the local partition.\n' +
        'Can restore to the partitioned table later by re-attaching the dump if needed.\n\n' +
        'Automated partition management:\n' +
        'pg_partman (PostgreSQL extension): automatically creates future partitions and archives/drops old ones per retention policy.\n' +
        'MySQL: EVENT scheduler to add/drop partitions monthly.\n\n' +
        'Partition exchange (MySQL/Oracle):\n' +
        'Swap a partition with a regular table atomically — useful for loading pre-staged data into a partitioned table without locking.',
      example:
        'Log retention policy: keep 90 days, archive to S3, delete older.\n\n' +
        'Without partitioning:\n' +
        'DELETE FROM logs WHERE created_at < NOW() - INTERVAL \'90 days\'\n' +
        'On 5B row table: 4.5B rows to delete → hours of locking, bloat, WAL pressure.\n\n' +
        'With monthly partitioning:\n' +
        '#!/bin/bash (cron job, monthly)\n' +
        'PARTITION=$(date -d "3 months ago" +logs_%Y_%m)\n' +
        'pg_dump $PARTITION | gzip | aws s3 cp - s3://archive/$PARTITION.sql.gz\n' +
        'psql -c "ALTER TABLE logs DETACH PARTITION $PARTITION"\n' +
        'psql -c "DROP TABLE $PARTITION"\n' +
        'Time: 30 seconds. Zero locking. Zero WAL pressure. Savings: massive.',
    },
    {
      title: 'Partitioning vs Sharding — When to Use Which',
      icon: '⚖️',
      layman:
        'Partitioning and sharding are often confused. Both split data into smaller pieces. The key difference: ' +
        'Partitioning stays within ONE database (one machine, one server, one connection). ' +
        'Sharding splits across MULTIPLE databases (multiple machines, multiple servers, multiple connections). ' +
        'Start with partitioning. Only move to sharding when one machine genuinely can\'t handle the load.',
      technical:
        'Partitioning:\n' +
        '+ Same database, same connection, transparent to the application.\n' +
        '+ Native JOIN and TRANSACTION support — works exactly like a normal table.\n' +
        '+ ACID guarantees preserved.\n' +
        '+ Partition pruning = automatic query performance improvement.\n' +
        '+ Easy maintenance: drop a partition = instant archival.\n' +
        '- Single machine limit: cannot scale beyond one server\'s RAM/CPU/disk.\n' +
        '- Single write path: all writes still go through one primary.\n\n' +
        'Sharding:\n' +
        '+ Horizontal scale: add machines to handle more data/writes/connections.\n' +
        '+ No single machine limit — scale to petabytes.\n' +
        '- Cross-shard queries are complex (scatter-gather, no native JOIN).\n' +
        '- Distributed transactions are error-prone (2PC, saga pattern needed).\n' +
        '- Operational complexity: N databases to monitor, backup, failover.\n' +
        '- Resharding is expensive and risky.\n\n' +
        'Decision framework:\n' +
        '1. Start: single DB with good indexes.\n' +
        '2. Table too slow → partition by date/range.\n' +
        '3. Still slow → add read replicas + caching.\n' +
        '4. Writes bottlenecked → then consider sharding.\n' +
        'Most apps never need sharding. Instagram didn\'t shard until 100M+ users.',
      example:
        'Cloudflare\'s analytics database:\n' +
        '- 40 trillion events logged per month.\n' +
        '- Uses ClickHouse (columnar DB) with range partitioning by date.\n' +
        '- Partitions are 1-day chunks.\n' +
        '- Queries like "traffic spike analysis last 24 hours" → hit 1 partition.\n' +
        '- Old partitions compressed and stored on cheaper NVMe tiers.\n' +
        '- Result: sub-second analytics on 40 trillion rows — using partitioning, not sharding.\n' +
        '- Key insight: columnar storage + partitioning often outperforms sharding for analytics workloads.',
    },
  ],

  comparison: {
    caption: 'Partitioning types and when to use them',
    columns: ['Type', 'Splits By', 'Best Query Pattern', 'Example Use Case', 'Limitation'],
    rows: [
      ['Vertical', 'Columns', 'SELECT few columns from wide table', 'user_core vs user_profile', 'JOIN needed for full row'],
      ['Range (horizontal)', 'Value range', 'WHERE partition_key BETWEEN X AND Y', 'Orders by month', 'Hot partition on newest range'],
      ['List (horizontal)', 'Discrete values', 'WHERE partition_key IN (x, y)', 'Orders by country', 'Uneven partition sizes'],
      ['Hash (horizontal)', 'Hash of key', 'Even distribution, exact lookup', 'User data by user_id hash', 'Range queries hit all partitions'],
      ['Composite', 'Multi-level (e.g. range + hash)', 'Time-range + user lookups', 'Events by year then user hash', 'Complex to set up and maintain'],
    ],
  },

  realWorldExamples: [
    {
      company: 'Notion',
      icon: '📝',
      description:
        'Notion stores blocks (the atoms of their document model) in a PostgreSQL table. As they scaled, a single blocks table became enormous. ' +
        'They implemented horizontal partitioning by space_id — each workspace\'s blocks live in their own partition. ' +
        'Queries within a workspace (the dominant access pattern) hit one partition. Cross-workspace queries (admin, analytics) still work via the parent table. ' +
        'This let them scale to millions of users without sharding across multiple databases.',
    },
    {
      company: 'Cloudflare',
      icon: '☁️',
      description:
        'Cloudflare logs billions of DNS queries, HTTP requests, and security events per day. ' +
        'They use ClickHouse with date-based range partitioning. Day-old partitions are compressed. Week-old partitions move to cheaper storage tiers. Month-old partitions are archived. ' +
        'Partition DROP makes retention cleanup instantaneous — no scanning billions of rows for deletion. ' +
        'Their engineers have said partitioning alone solved 80% of their storage scaling challenges before they needed distribution.',
    },
    {
      company: 'Stripe',
      icon: '💳',
      description:
        'Stripe\'s payment events table is partitioned by time (monthly partitions) and vertically partitioned — the core transaction record (amount, currency, status, merchant_id) is in the hot table; ' +
        'the large metadata JSON, risk signals, and audit fields are in a separate cold column table. ' +
        'The dashboard query hitting millions of transactions per day reads only the hot columns. ' +
        'Full transaction detail (fraud investigation, compliance) reads from both tables via JOIN — the expensive path only when truly needed.',
    },
  ],

  interviewQuestions: [
    {
      question: 'What is the difference between vertical and horizontal partitioning?',
      answer:
        'Vertical partitioning splits a table by columns — frequently accessed columns in one table, large/infrequent columns in another, sharing the same primary key. This reduces I/O for queries that don\'t need all columns. ' +
        'Horizontal partitioning (also called table partitioning) splits a table by rows — each partition contains a subset of rows based on a partition key (date range, hash, list). Queries that filter on the partition key only scan the relevant partition(s), dramatically reducing I/O for range queries.',
    },
    {
      question: 'What is partition pruning?',
      answer:
        'Partition pruning is the query planner\'s ability to automatically skip partitions that cannot contain rows matching the WHERE clause. ' +
        'If a table is partitioned by month and your query has WHERE created_at = \'2024-03-15\', the planner knows only the March 2024 partition can have matching rows and skips all others. ' +
        'For this to work, the partition key must be included directly in the WHERE clause — wrapping it in a function (WHERE DATE(created_at) = ...) defeats pruning.',
    },
    {
      question: 'How does table partitioning differ from sharding?',
      answer:
        'Table partitioning organizes data within a single database instance — all partitions live on one server, sharing the same connections, transactions, and query engine. It\'s transparent to the application. ' +
        'Sharding distributes data across multiple database instances on separate machines. This breaks the single-machine limit but introduces complexity: cross-shard queries require scatter-gather, transactions span multiple machines (2PC), and operations multiply across shards. ' +
        'Partition first; shard only when one machine\'s limits are genuinely reached.',
    },
    {
      question: 'How do you delete old data efficiently from a large table?',
      answer:
        'Use time-based range partitioning. Old data lives in discrete, detachable partitions. ' +
        'Dropping old data: ALTER TABLE logs DETACH PARTITION logs_2022_12 → DROP TABLE logs_2022_12. This is near-instant — it deletes a file, not individual rows. ' +
        'Without partitioning, DELETE FROM logs WHERE created_at < X on a billion-row table takes hours, generates enormous WAL traffic, and causes lock contention. ' +
        'pg_partman automates partition creation and retirement on a schedule.',
    },
  ],

  commonMistakes: [
    'Using functions in WHERE on the partition key: WHERE DATE(created_at) = X defeats partition pruning — use range conditions instead',
    'Over-partitioning: thousands of tiny partitions create planning overhead; aim for partitions that are 10M–500M rows',
    'Hash-partitioning time-series data: hash prevents range queries; use range partitioning for time-series',
    'Forgetting local indexes: each partition needs its own indexes; a global index on a partitioned table doesn\'t exist in PostgreSQL',
    'Skipping vertical partitioning: wide tables with large blobs alongside frequently-queried fields are a common but easily fixed performance problem',
    'Jumping to sharding before partitioning: partitioning is far simpler and often sufficient — most teams shard too early',
  ],
};
