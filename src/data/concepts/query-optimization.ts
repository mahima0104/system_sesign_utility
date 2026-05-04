import type { ConceptDeepDive } from '../../types';

export const queryOptimization: ConceptDeepDive = {
  moduleId: 'query-optimization',
  tagline: 'Writing a query that works is easy. Writing one that\'s fast at 100 million rows is a skill',

  introduction: {
    layman:
      'You ask the database a question: "Give me all orders from Mumbai placed in the last 30 days." ' +
      'The database has dozens of ways to answer that question — scan every row, use an index, join tables in different orders, filter early vs late. ' +
      'Query optimization is the art (and science) of asking the question in a way that the database can answer in milliseconds instead of minutes. ' +
      'A badly written query on a 50 million row table can take 2 minutes. The same question, rewritten well with the right indexes, takes 4ms.',
    analogy:
      'Imagine you\'re searching for a specific email in your inbox with 500,000 emails. ' +
      'Option A: read every email one by one until you find it (full table scan). ' +
      'Option B: use the search bar (index). ' +
      'Option C: search for the exact subject AND sender together (composite index, most precise). ' +
      'The database\'s query planner is like a smart navigator: it looks at your search criteria, checks what shortcuts (indexes) are available, estimates which route is fastest, and picks it automatically. ' +
      'Your job is to make sure the shortcuts exist and write your query in a way the navigator can actually use them.',
    whyMatters:
      'Slow queries are one of the top causes of production outages and poor user experience. At companies like Amazon, a 100ms delay in page load costs them 1% in sales. ' +
      'Query optimization is not just for DBAs — every backend engineer who writes SQL needs to understand how to read an execution plan and spot a slow query. ' +
      'In interviews, "design a leaderboard" or "design a notification system" always bottoms out at: "how do you make the queries fast at scale?"',
  },

  subTopics: [
    {
      title: 'How the Query Planner Works',
      icon: '🗺️',
      layman:
        'Before your query runs, the database runs a mini-program called the query planner. It looks at your SQL, checks the available indexes, estimates how many rows each step will touch, and picks the plan it thinks is fastest. ' +
        'You can see this plan using EXPLAIN — it\'s like asking the GPS to show you its route before you start driving.',
      technical:
        'Query lifecycle: (1) Parse — convert SQL text to an AST. (2) Rewrite — apply view expansions, rule rewrites. (3) Plan — generate N candidate plans, estimate cost for each using table statistics (row counts, column histograms). Pick lowest cost. (4) Execute — run the winning plan. ' +
        'The planner uses pg_statistic (PostgreSQL) or information_schema.statistics (MySQL) — table statistics collected by ANALYZE/VACUUM. Stale statistics → bad plans → slow queries. ' +
        'EXPLAIN shows the plan with estimated costs. EXPLAIN ANALYZE actually executes and shows real timings. ' +
        'Key plan nodes to understand:\n' +
        '- Seq Scan: reads entire table. Acceptable for small tables, terrible for large ones.\n' +
        '- Index Scan: traverses the index + fetches heap rows. Fast for selective queries.\n' +
        '- Index Only Scan: answers entirely from index (covering index). Fastest.\n' +
        '- Hash Join, Merge Join, Nested Loop: strategies for joining two tables.',
      example:
        'EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 12345;\n\n' +
        'Bad plan output:\n' +
        '  Seq Scan on orders (cost=0..450000 rows=50M width=64)\n' +
        '  Filter: user_id = 12345\n' +
        '  Actual time: 28000ms\n\n' +
        'After CREATE INDEX ON orders(user_id):\n' +
        '  Index Scan on orders_user_idx (cost=0..8 rows=23 width=64)\n' +
        '  Index Cond: user_id = 12345\n' +
        '  Actual time: 2ms\n\n' +
        'Reading execution plans is the #1 skill for fixing slow queries.',
      whenToUse: 'Run EXPLAIN ANALYZE on any query that runs > 100ms in production. This is not optional — it\'s the starting point of every performance investigation.',
    },
    {
      title: 'Common Query Anti-Patterns',
      icon: '🚨',
      layman:
        'Some SQL patterns look harmless but secretly prevent the database from using indexes, forcing a full table scan. ' +
        'These are the most common causes of "why is this simple query so slow?"',
      technical:
        '1. Functions in WHERE clause:\n' +
        '   BAD:  WHERE YEAR(created_at) = 2024  → breaks index on created_at\n' +
        '   GOOD: WHERE created_at BETWEEN \'2024-01-01\' AND \'2024-12-31\'\n\n' +
        '2. Leading wildcard LIKE:\n' +
        '   BAD:  WHERE name LIKE \'%rohit%\'  → cannot use B+ Tree index\n' +
        '   GOOD: Use full-text index or Elasticsearch for text search\n' +
        '   OK:   WHERE name LIKE \'rohit%\'  → uses index (leading fixed prefix)\n\n' +
        '3. Implicit type casting:\n' +
        '   BAD:  WHERE phone_number = 9876543210  (int vs varchar column)  → forces cast on every row\n' +
        '   GOOD: WHERE phone_number = \'9876543210\'\n\n' +
        '4. OR conditions:\n' +
        '   BAD:  WHERE city = \'Mumbai\' OR status = \'active\'  → often forces full scan\n' +
        '   GOOD: UNION of two separate indexed queries\n\n' +
        '5. SELECT * (over-fetching):\n' +
        '   BAD:  SELECT * FROM products  → transfers huge payloads, blocks covering indexes\n' +
        '   GOOD: SELECT id, name, price FROM products\n\n' +
        '6. N+1 Query problem:\n' +
        '   BAD:  Fetch 100 orders, then loop and do SELECT for each user → 101 queries\n' +
        '   GOOD: JOIN users and orders in one query → 1 query',
      example:
        'Real incident at a startup: dashboard loads in 45 seconds.\n' +
        'Root cause: WHERE DATE(created_at) = CURDATE() on a 20M row table.\n' +
        'DATE() wraps the column in a function → index on created_at is useless → full scan.\n' +
        'Fix: WHERE created_at >= CURDATE() AND created_at < CURDATE() + INTERVAL 1 DAY\n' +
        'Result: query time → 8ms. Dashboard → instant.',
      whenToUse: 'Review these anti-patterns before writing any query that runs on a large table. Review them again during code review when teammates touch database queries.',
    },
    {
      title: 'JOIN Optimization',
      icon: '🔗',
      layman:
        'JOINs combine data from multiple tables. When done right, they\'re fast. When done wrong — joining without indexes, joining huge tables unnecessarily, joining in the wrong order — they\'re the slowest thing you can do to a database.',
      technical:
        'Join algorithms the DB chooses from:\n' +
        '- Nested Loop: for each row in outer table, probe inner table. O(n×m) but fast when inner lookup is indexed.\n' +
        '- Hash Join: build hash table from smaller table, probe with larger. O(n+m), great for large unindexed joins.\n' +
        '- Merge Join: both tables pre-sorted on join key → linear scan. Fast when data is already sorted (e.g. ordered by primary key).\n\n' +
        'Best practices:\n' +
        '1. Always index JOIN columns. JOIN ON orders.user_id = users.id requires index on orders.user_id.\n' +
        '2. Filter early — put WHERE conditions before JOINs to reduce rows flowing in.\n' +
        '3. Avoid joining large tables to large tables — materialise or aggregate first.\n' +
        '4. Use CTEs or subqueries to pre-filter: WITH active_users AS (SELECT id FROM users WHERE active=true) SELECT * FROM orders JOIN active_users ON ...\n' +
        '5. Avoid SELECT * with JOINs — each extra column costs network + memory.',
      example:
        'Slow: SELECT * FROM orders o JOIN users u ON o.user_id = u.id JOIN products p ON o.product_id = p.id WHERE o.created_at > \'2024-01-01\'\n' +
        '→ Joins 50M orders × 10M users × 5M products (billions of row combinations considered)\n\n' +
        'Fast rewrite:\n' +
        'WITH recent_orders AS (\n' +
        '  SELECT order_id, user_id, product_id, amount FROM orders WHERE created_at > \'2024-01-01\'\n' +
        '  -- filter FIRST: reduces 50M rows to maybe 100K recent ones\n' +
        ')\n' +
        'SELECT ro.amount, u.name, p.title\n' +
        'FROM recent_orders ro\n' +
        'JOIN users u ON ro.user_id = u.id\n' +
        'JOIN products p ON ro.product_id = p.id\n' +
        '-- now joining 100K rows against indexed primary keys → fast',
    },
    {
      title: 'Pagination Patterns',
      icon: '📄',
      layman:
        'Almost every app needs to paginate: "show me orders 1–20, then 21–40." The obvious approach (OFFSET + LIMIT) has a hidden problem — it gets slower and slower as you go deeper. Page 1 is fast. Page 10,000 is painfully slow.',
      technical:
        'OFFSET pagination problem:\n' +
        'SELECT * FROM orders ORDER BY created_at LIMIT 20 OFFSET 10000\n' +
        'The DB must read and discard 10,000 rows before returning your 20. At 100M rows, OFFSET 5000000 scans 5 million rows → minutes.\n\n' +
        'Cursor-based (keyset) pagination — the fix:\n' +
        'First page: SELECT * FROM orders ORDER BY created_at DESC, id DESC LIMIT 20\n' +
        'Save last row: {created_at: \'2024-03-15\', id: 98765}\n' +
        'Next page: SELECT * FROM orders WHERE (created_at, id) < (\'2024-03-15\', 98765) ORDER BY created_at DESC, id DESC LIMIT 20\n' +
        'This uses the index directly, never scanning discarded rows. Always O(log n) regardless of page depth.\n\n' +
        'When to use OFFSET: small datasets, admin panels, when users won\'t go past page 10.\n' +
        'When to use cursor: social feeds, large datasets, API pagination, infinite scroll.',
      example:
        'Twitter-style feed pagination:\n' +
        'Page 1: SELECT * FROM tweets WHERE user_id IN (following_list) ORDER BY id DESC LIMIT 20\n' +
        'User sees tweet IDs ending at id=500000\n' +
        'Page 2: SELECT * FROM tweets WHERE user_id IN (...) AND id < 500000 ORDER BY id DESC LIMIT 20\n' +
        'Regardless of whether this is page 2 or page 20,000 — same speed, same index path.',
    },
    {
      title: 'Aggregation and Reporting Queries',
      icon: '📊',
      layman:
        'Queries like "total sales this month per city" or "top 10 products" crunch millions of rows down to a small result. These are the slowest queries in most systems — and they require completely different optimization strategies than simple lookups.',
      technical:
        'Aggregation anti-patterns:\n' +
        '1. Running COUNT(*), SUM(), GROUP BY on billions of rows in real-time → always slow.\n' +
        '2. Nested aggregations without indexes on group-by columns.\n\n' +
        'Optimization strategies:\n' +
        '1. Pre-aggregate with materialized views:\n' +
        '   CREATE MATERIALIZED VIEW daily_revenue AS SELECT DATE(created_at), city, SUM(amount) FROM orders GROUP BY 1, 2;\n' +
        '   REFRESH MATERIALIZED VIEW CONCURRENTLY daily_revenue; -- run nightly\n' +
        '   Dashboard query now hits materialized view (1000 rows) not orders (500M rows).\n\n' +
        '2. Separate OLTP and OLAP:\n' +
        '   Live transactional DB → handles writes, fast single-row reads.\n' +
        '   Analytics DB (Redshift, BigQuery) → receives nightly dump, optimised for column scans and aggregations.\n\n' +
        '3. Approximate counting:\n' +
        '   SELECT COUNT(DISTINCT user_id) is O(n). Use HyperLogLog instead (1% error, 1000× faster).\n\n' +
        '4. Incremental aggregation:\n' +
        '   Don\'t recalculate all history. Update a running_total row on each write.',
      example:
        'Zomato analytics: "Total orders per city, this week, by restaurant category"\n' +
        'OLTP approach: GROUP BY on 200M orders table → 45 seconds, blocks prod DB.\n\n' +
        'Proper approach:\n' +
        '1. Orders stream to Kafka as they happen.\n' +
        '2. Flink consumer aggregates into a Redis hash: {city:Mumbai, category:Pizza → 4523 orders today}.\n' +
        '3. Analytics dashboard reads from Redis/materialized view → sub-millisecond.\n' +
        'Real-time aggregation without ever hitting the OLTP database.',
    },
  ],

  comparison: {
    caption: 'Query optimization techniques and their impact',
    columns: ['Problem', 'Root Cause', 'Fix', 'Expected Improvement'],
    rows: [
      ['Full table scan', 'Missing index on WHERE/JOIN column', 'Add B+ Tree index', '1000× faster for selective queries'],
      ['Function in WHERE', 'Wrapping column breaks index', 'Rewrite to range condition', 'Seq Scan → Index Scan'],
      ['LIKE \'%term%\'', 'Leading wildcard skips index', 'Full-text index or Elasticsearch', 'Seconds → milliseconds'],
      ['Deep OFFSET pagination', 'Reads+discards N rows each time', 'Keyset (cursor) pagination', 'O(n) → O(log n) per page'],
      ['N+1 queries', 'Loop generates 100s of queries', 'JOIN or IN clause in one query', 'N round trips → 1'],
      ['Slow aggregations', 'GROUP BY on billions of rows', 'Materialized views + OLAP DB', 'Minutes → milliseconds'],
    ],
  },

  realWorldExamples: [
    {
      company: 'Instagram',
      icon: '📸',
      description:
        'Instagram\'s feed ranking query originally joined multiple tables in real-time. At scale this hit 3+ second latency. ' +
        'They switched to precomputing ranked feeds using offline jobs that write pre-sorted results into Redis. ' +
        'The "query" became a Redis list fetch — microseconds instead of seconds. The lesson: the best query is often no query at all.',
    },
    {
      company: 'LinkedIn',
      icon: '💼',
      description:
        '"People you may know" ran an expensive graph traversal query per user per request. ' +
        'LinkedIn moved to batch precomputation (compute recommendations offline for all users nightly, store results) and an online freshness layer. ' +
        'Query time: from 8 seconds → 12ms. The pattern: separate heavy computation from the read path.',
    },
    {
      company: 'Razorpay',
      icon: '💳',
      description:
        'Payment dashboards show merchant transaction summaries. Running live SUM(amount) GROUP BY date on the transactions table (billions of rows) brought down production twice. ' +
        'Fix: materialized views updated every 5 minutes + Redis cache for sub-second dashboard loads. ' +
        'The transactions table is now read-only for the dashboard — a separate analytics replica handles those queries.',
    },
  ],

  interviewQuestions: [
    {
      question: 'How do you approach optimizing a slow SQL query?',
      answer:
        '1. Run EXPLAIN ANALYZE — find Seq Scans on large tables and high actual vs estimated row count misrepresentations. ' +
        '2. Check for missing indexes on WHERE/JOIN/ORDER BY columns. ' +
        '3. Identify anti-patterns: functions in WHERE, leading wildcard LIKE, implicit type casts. ' +
        '4. Check JOIN order — are we joining huge tables before filtering? ' +
        '5. Check OFFSET pagination — switch to keyset. ' +
        '6. For aggregations, consider materialized views or pre-aggregation. ' +
        '7. After changes, EXPLAIN ANALYZE again to confirm improvement.',
    },
    {
      question: 'What is the N+1 query problem and how do you fix it?',
      answer:
        'N+1 happens when code fetches a list of N items, then queries the database N more times for related data (one per item). Example: fetch 100 orders, then in a loop SELECT the user for each order = 101 queries. ' +
        'Fix: use a single JOIN to fetch orders + users together, or use an IN clause (SELECT * FROM users WHERE id IN (...orderUserIds)). ORMs like Hibernate and ActiveRecord solve this with eager loading / includes.',
    },
    {
      question: 'Why is OFFSET pagination slow at scale, and what\'s the alternative?',
      answer:
        'OFFSET N requires the database to read and discard N rows to find your starting position. For OFFSET 1,000,000, the database reads 1 million rows and throws them away — O(n) per page. ' +
        'Keyset (cursor) pagination records the last item\'s key from the previous page (e.g., last order_id=98765) and uses WHERE id < 98765 LIMIT 20. The database jumps directly via index — always O(log n) regardless of depth.',
    },
    {
      question: 'What is a materialized view and when do you use it?',
      answer:
        'A materialized view is a pre-computed, stored query result. Unlike a regular view (which reruns the query on every access), a materialized view stores the result and is refreshed on a schedule. ' +
        'Use it when: (1) an aggregation query is slow (GROUP BY millions of rows), (2) a dashboard shows the same data to many users, (3) the data can tolerate slight staleness (e.g., 5-minute refresh is fine). ' +
        'The read becomes instant (hit precomputed table); only the refresh job does the heavy lifting.',
    },
  ],

  commonMistakes: [
    'Never reading EXPLAIN ANALYZE output — optimizing blind without seeing the execution plan',
    'Wrapping indexed columns in functions: WHERE DATE(created_at) = X instead of a range condition',
    'Using OFFSET for deep pagination — it scales as O(n) and collapses at page 10,000+',
    'SELECT * in production queries — transfers data you don\'t need and prevents covering indexes',
    'Running heavy GROUP BY aggregations in real-time on OLTP databases — use materialized views',
    'Forgetting to ANALYZE after bulk data loads — stale table statistics lead the planner to pick wrong plans',
  ],
};
