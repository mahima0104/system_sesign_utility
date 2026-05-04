import type { ConceptDeepDive } from '../../types';

export const databaseIndexing: ConceptDeepDive = {
  moduleId: 'indexing',
  tagline: 'A database without indexes is a book with no table of contents — every query scans every page',

  introduction: {
    layman:
      'Imagine a phone book with 10 million names. If you want "Sharma, Rohit", you don\'t start at page 1 and read every name. You jump straight to "S", then "Sh", and find it in seconds. ' +
      'A database index does the exact same thing — it builds a secret sorted shortcut alongside your table so queries can jump straight to the right rows instead of scanning millions of records one by one. ' +
      'Without an index on a 50 million row table, a simple query can take 30 seconds. With one, the same query runs in 2 milliseconds.',
    analogy:
      'Think of a giant library with 1 million books, all dumped in a random pile. Finding a specific book means checking every single one — that\'s a full table scan. ' +
      'Now the librarian builds a card catalog: a sorted alphabetical index that says "Harry Potter → Row 7, Shelf 3". You check the catalog (index), then go directly to the book (row). ' +
      'The catalog is small, sorted, and always up to date. Every time someone adds or removes a book, the catalog is updated too. That tiny extra work on writes saves enormous time on reads.',
    whyMatters:
      'Indexing is the single most impactful performance lever available to most engineers. A missing index on a WHERE clause column can make a 5ms query take 30 seconds. ' +
      'Conversely, too many indexes slow down writes — every INSERT/UPDATE must update all indexes. ' +
      'In interviews, "how would you speed up this slow query?" almost always leads to a conversation about indexing. ' +
      'Companies like Zomato, Swiggy, and Flipkart have entire teams focused on query performance and index strategies because their databases handle billions of rows.',
  },

  subTopics: [
    {
      title: 'How Indexes Actually Work (B+ Tree)',
      icon: '🌳',
      layman:
        'The most common index type is a B+ Tree — a sorted tree structure. Imagine a tournament bracket in reverse: at the top you have a range ("A–M" or "N–Z"), each level narrows it down, until you reach the leaf at the bottom which points to the actual row. ' +
        'Searching is always O(log n) — for 1 million rows, that\'s only about 20 comparisons. Without an index, it\'s O(n) — up to 1 million comparisons.',
      technical:
        'A B+ Tree index stores keys in sorted order across tree nodes (typically 4KB pages, matching disk block size). Internal nodes hold keys + pointers to child nodes. ' +
        'Leaf nodes hold keys + pointers to actual table rows (via row ID or heap pointer). Leaf nodes are linked in sorted order — enabling efficient range scans. ' +
        'Search: O(log n) — traverse from root to leaf. Insert/Delete: O(log n) — find position, insert, rebalance if needed. ' +
        'Clustered index: the table data IS stored in index order (one per table, usually primary key). ' +
        'Non-clustered/secondary index: a separate structure that stores the key + a pointer back to the row.',
      example:
        'Table: orders (order_id, user_id, amount, created_at) — 50 million rows.\n' +
        'Query: SELECT * FROM orders WHERE user_id = 12345;\n' +
        'Without index: PostgreSQL scans all 50M rows → ~30 seconds.\n' +
        'With index on user_id: B+ Tree traversal → 4 node reads → 2ms.\n' +
        'EXPLAIN ANALYZE shows the difference: "Seq Scan" (bad) vs "Index Scan" (good).',
      whenToUse: 'Always index columns in WHERE, JOIN ON, and ORDER BY clauses. Don\'t index low-cardinality columns like boolean flags (male/female) — the scan savings are tiny.',
    },
    {
      title: 'Types of Indexes',
      icon: '📑',
      layman:
        'There are several flavours of indexes, each designed for a different type of query. Choosing the right type is like choosing between a phone book (single column), a map (spatial), or a search engine (full text).',
      technical:
        'Single-column index: indexes one column. Simple and covers most queries.\n' +
        'Composite (multi-column) index: indexes two+ columns together. INDEX(last_name, first_name) speeds up WHERE last_name=X AND first_name=Y, but also WHERE last_name=X alone. The LEFT-PREFIX rule: (A, B, C) index helps queries on A, on A+B, on A+B+C — but NOT on B alone or C alone.\n' +
        'Covering index: index contains ALL columns the query needs → no need to hit the actual table row at all.\n' +
        'Partial index: index only a subset of rows. INDEX ON orders(user_id) WHERE status=\'pending\' — small, fast, laser-focused.\n' +
        'Unique index: enforces uniqueness + speeds up lookups. Every PRIMARY KEY has one automatically.\n' +
        'Full-text index: tokenises text for keyword search (LIKE queries do NOT use regular indexes).\n' +
        'Hash index: O(1) exact lookups, but cannot do range queries at all. Used in Memory tables.',
      example:
        'Composite index example — Swiggy orders:\n' +
        'INDEX(city, restaurant_id, created_at)\n' +
        'Helps: WHERE city=\'Mumbai\' AND restaurant_id=42 ORDER BY created_at\n' +
        'Helps: WHERE city=\'Mumbai\' (leftmost prefix)\n' +
        'Does NOT help: WHERE restaurant_id=42 (skips leftmost column)\n\n' +
        'Covering index example:\n' +
        'SELECT user_id, amount FROM orders WHERE user_id = 123\n' +
        'INDEX(user_id, amount) → query answered entirely from index, zero table lookups.',
      whenToUse: 'Use composite indexes when queries filter on multiple columns together. Use covering indexes for your hottest, most frequent queries to eliminate table lookups entirely.',
    },
    {
      title: 'The Index Trade-off: Reads vs Writes',
      icon: '⚖️',
      layman:
        'Indexes are free for reads, but they cost something on writes. Every time you INSERT a new row, the database must update every index on that table. ' +
        '10 indexes on a table means every INSERT does 11 operations instead of 1. For write-heavy tables, too many indexes can make writes slower than the reads they save.',
      technical:
        'Write amplification: INSERT/UPDATE/DELETE must update all indexes. A table with 10 indexes = 10 B+ Tree modifications per write. ' +
        'Space amplification: each index is a separate data structure, often 20–50% the size of the table. ' +
        'Index bloat: frequent deletes leave dead pages in the B+ Tree (fragmentation) → REINDEX or VACUUM ANALYZE periodically. ' +
        'Rule of thumb: OLTP tables (high writes) → few, carefully chosen indexes. OLAP/reporting tables (read-heavy) → many indexes is fine. ' +
        'PostgreSQL tip: CREATE INDEX CONCURRENTLY avoids locking the table during index build.',
      example:
        'Flipkart product_reviews table: 1 billion rows, heavy writes from new reviews.\n' +
        'Bad: 15 indexes on every column → each review write takes 200ms.\n' +
        'Good: 3 indexes (user_id, product_id, created_at) chosen based on actual query patterns → each write takes 8ms.\n' +
        'Monitoring: pg_stat_user_indexes shows which indexes are never used → candidates for deletion.',
    },
    {
      title: 'Index Strategies for Scale',
      icon: '🚀',
      layman:
        'As tables grow to hundreds of millions of rows, basic indexing isn\'t enough. You need smarter strategies: partial indexes that only cover the data you actually query, index-only scans that never touch the main table, and knowing when to de-normalise instead of indexing.',
      technical:
        'Index cardinality: columns with high cardinality (user_id, email, order_id) benefit most from indexes. Low cardinality (status: active/inactive, gender) often better served by partial indexes or bitmap indexes. ' +
        'Index-only scans: if your SELECT, WHERE, and ORDER BY columns are all in one index, PostgreSQL never reads the heap table — "covering index" approach. ' +
        'Expression indexes: CREATE INDEX ON products (LOWER(email)) allows case-insensitive searches with index support. ' +
        'Deferred index builds: for massive batch inserts, drop indexes → insert millions of rows → rebuild indexes (faster than maintaining them during insert). ' +
        'Index hints: MySQL allows USE INDEX / FORCE INDEX to override the query planner when it makes bad choices. ' +
        'Monitoring slow queries: always run EXPLAIN ANALYZE on slow queries to see exactly which index is used and whether a seq scan snuck in.',
      example:
        'Paytm transaction ledger: 5 billion rows.\n' +
        'Problem: monthly statement query (SELECT * FROM transactions WHERE user_id=X AND created_at BETWEEN ...) is slow.\n' +
        'Solution 1: Composite index (user_id, created_at) — jumps directly to user\'s rows in date order.\n' +
        'Solution 2: Partition table by month — each partition is smaller, index smaller, query faster.\n' +
        'Solution 3: Covering index (user_id, created_at, amount, merchant_id) — monthly statement needs these 4 columns → zero table reads.',
    },
    {
      title: 'When NOT to Add an Index',
      icon: '🚫',
      layman:
        'More indexes doesn\'t always mean faster. Knowing when to skip an index is as important as knowing when to add one. The goal is to index the right columns, not all columns.',
      technical:
        'Skip indexes when: (1) Column cardinality is very low (boolean, status with 3 values) — the database might choose a seq scan anyway. ' +
        '(2) Table is very small (<10K rows) — full scan is faster than index overhead. ' +
        '(3) Column is rarely queried in WHERE clauses — index wastes write amplification. ' +
        '(4) Write throughput is critical — log tables, audit tables, event streams → index only after the fact for analytics. ' +
        '(5) Unused indexes: run pg_stat_user_indexes.idx_scan = 0 to find indexes that nobody queries — delete them.',
      example:
        'Common anti-patterns:\n' +
        '1. INDEX ON users(gender) — only 2 values, database scans whole table anyway.\n' +
        '2. INDEX ON audit_log(created_at) on a table receiving 100K inserts/sec — index maintenance overhead outweighs query benefit.\n' +
        '3. 8 indexes on a join table — each insert now does 9 B+ Tree writes.\n\n' +
        'Interview tip: when asked "how do you improve query performance?", always say:\n' +
        '"First I\'d run EXPLAIN ANALYZE, look for seq scans on large tables, check index cardinality, and validate that indexes exist on WHERE/JOIN columns — before adding anything new."',
      whenToUse: 'Add indexes based on actual query analysis (EXPLAIN ANALYZE + slow query logs), not guesswork. Remove indexes that have zero usage in production.',
    },
  ],

  comparison: {
    caption: 'Index types and when to use them',
    columns: ['Index Type', 'Best For', 'Limitation', 'Example Use Case'],
    rows: [
      ['B+ Tree (default)', 'Equality + range queries', 'Slow on very low cardinality', 'WHERE user_id = X, ORDER BY created_at'],
      ['Hash', 'Exact equality only (O(1))', 'No range queries at all', 'WHERE session_token = \'abc123\''],
      ['Composite', 'Multi-column WHERE/JOIN/ORDER', 'Left-prefix rule must be respected', 'WHERE city = X AND status = Y'],
      ['Covering', 'Eliminate table lookups', 'Larger index size', 'SELECT a, b WHERE c = X (index has a,b,c)'],
      ['Partial', 'Subset of rows only', 'Only helps matching WHERE clause', 'WHERE status = \'pending\' (active orders)'],
      ['Full-text', 'Text search / keyword match', 'Expensive to maintain, not for sort', 'Search product names, article content'],
    ],
  },

  realWorldExamples: [
    {
      company: 'Uber',
      icon: '🚕',
      description:
        'Uber\'s trips table has billions of rows. They use composite indexes on (driver_id, status, created_at) for driver trip history, and (city_id, pickup_time) for surge pricing calculations. ' +
        'Their engineers regularly run EXPLAIN plans and have automated alerts for queries exceeding 100ms — the first fix is always "is there an index for this?"',
    },
    {
      company: 'GitHub',
      icon: '🐙',
      description:
        'GitHub\'s pull_requests table has hundreds of millions of rows. They use partial indexes (WHERE state = \'open\') for the common dashboard view — only open PRs are in this index, making it tiny and fast. ' +
        'Closed PRs (the 99% majority) don\'t inflate it. This pattern reduced their dashboard query from 800ms to 12ms.',
    },
    {
      company: 'Shopify',
      icon: '🛍️',
      description:
        'Shopify processes millions of orders per minute on Black Friday. Their orders table uses covering indexes for the most frequent merchant dashboard queries, ' +
        'so those queries never touch the heap table at all — the index alone answers them. They also built a query advisor that automatically flags missing indexes in staging before they reach production.',
    },
  ],

  interviewQuestions: [
    {
      question: 'What is a database index and how does it speed up queries?',
      answer:
        'A database index is a separate data structure (usually a B+ Tree) that stores a sorted copy of one or more columns with pointers back to the actual rows. Without an index, the database must scan every row (O(n)). With an index, it traverses the tree in O(log n) steps — for 1 million rows, that\'s ~20 comparisons instead of 1 million. The trade-off is write amplification: every INSERT/UPDATE must update all indexes on that table.',
    },
    {
      question: 'What is the difference between a clustered and non-clustered index?',
      answer:
        'A clustered index determines the physical order in which rows are stored on disk — the table IS sorted by this index. There can only be one per table (usually the primary key). A non-clustered (secondary) index is a separate structure that stores the indexed column(s) plus a pointer back to the heap row. Non-clustered indexes require an extra hop to fetch the actual row data; clustered indexes do not. In PostgreSQL, all indexes are non-clustered by default (the heap is unordered); in MySQL InnoDB, the primary key is always the clustered index.',
    },
    {
      question: 'What is the left-prefix rule for composite indexes?',
      answer:
        'A composite index on (A, B, C) can accelerate queries that filter on A alone, A+B, or A+B+C — but NOT on B alone or C alone. The index is sorted by A first, then B within A, then C within A+B. Skipping A means the B values are scattered throughout the index with no useful sort order. Always put the most selective or most commonly filtered column first, and ensure your WHERE clauses include the leftmost prefix.',
    },
    {
      question: 'A query is running slowly. How do you approach fixing it?',
      answer:
        '1. Run EXPLAIN ANALYZE to see the actual execution plan — look for Seq Scan on large tables. ' +
        '2. Check which columns are in the WHERE, JOIN ON, and ORDER BY clauses — these are index candidates. ' +
        '3. Check index cardinality — is the column selective enough to justify an index? ' +
        '4. Consider a composite or covering index if multiple columns are always queried together. ' +
        '5. Check for common anti-patterns: LIKE \'%term%\' (can\'t use index), functions in WHERE (WHERE LOWER(email) = X needs an expression index), or OR conditions (often can\'t use indexes). ' +
        '6. After adding an index, run EXPLAIN ANALYZE again to confirm an Index Scan is used.',
    },
  ],

  commonMistakes: [
    'Indexing every column "just in case" — each index adds write overhead and consumes storage',
    'Ignoring the left-prefix rule — INDEX(A, B) does NOT help a query that only filters on B',
    'Using LIKE \'%keyword%\' — the leading wildcard prevents index use; use full-text search instead',
    'Applying functions in WHERE without expression indexes — WHERE YEAR(created_at) = 2024 skips the index on created_at',
    'Never auditing index usage — pg_stat_user_indexes.idx_scan = 0 means the index is dead weight',
    'Building indexes on write-heavy tables without considering write amplification impact',
  ],
};
