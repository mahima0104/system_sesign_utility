import type { ConceptDeepDive } from '../../types';

export const wideColumnDatabases: ConceptDeepDive = {
  moduleId: 'wide-column-databases',
  tagline: 'Designed for scale that makes relational databases break a sweat',

  introduction: {
    layman:
      'Wide-column databases look like tables on the surface — rows and columns — but they work very differently from relational databases. ' +
      'The key insight: each row can have its own set of columns, and there can be millions of columns. ' +
      'More importantly, they are designed from the ground up for massive distributed deployments. ' +
      'Apache Cassandra can handle a million writes per second, spread across hundreds of machines, across multiple data centres, with no single point of failure. ' +
      'Netflix, Apple, Instagram, and Discord all rely on Cassandra for their highest-scale data storage needs.',
    analogy:
      'Think of a regular database as a grid of spreadsheet cells where every row must fill every column. ' +
      'A wide-column database is like a warehouse with infinite aisles, where each aisle (partition) has its own shelves (rows) in a specific order. ' +
      'You always know which aisle to go to (partition key), and the shelves in that aisle are sorted (clustering key). ' +
      'You cannot browse randomly across aisles — you have to know which aisle you need. ' +
      'But within your aisle, retrieving data is blindingly fast, and the warehouse can have as many aisles as needed across as many buildings as you want (nodes).',
    whyMatters:
      'Cassandra is the answer whenever a system design interview reaches "how do you handle 100 million writes per day?" or "how does Netflix serve 230 million users without downtime?" ' +
      'Understanding the Cassandra data model — partition keys, clustering keys, and query-first design — is tested frequently in senior engineering interviews at companies like Netflix, Uber, and Apple, all of whom are major Cassandra users.',
  },

  subTopics: [
    {
      title: 'The Wide-Column Data Model',
      icon: '📋',
      layman:
        'In Cassandra, data is organised into tables with a special twist: the primary key has two parts. ' +
        'The partition key determines which machine holds your data. ' +
        'The clustering key sorts the data within that partition. ' +
        'This two-level key structure is everything — it determines how fast your reads are and which queries are even possible.',
      technical:
        'Cassandra table anatomy:\n\n' +
        'CREATE TABLE user_events (\n' +
        '  user_id    UUID,           -- partition key: "which node?"\n' +
        '  event_time TIMESTAMP,      -- clustering key: "in what order?"\n' +
        '  event_type TEXT,\n' +
        '  payload    TEXT,\n' +
        '  PRIMARY KEY (user_id, event_time)\n' +
        ') WITH CLUSTERING ORDER BY (event_time DESC);\n\n' +
        'Partition key:\n' +
        '- Determines which node(s) own this data (via consistent hashing)\n' +
        '- All rows with the same partition key are on the same node\n' +
        '- Queries MUST include the partition key (otherwise: full cluster scan)\n\n' +
        'Clustering key:\n' +
        '- Determines sort order within a partition\n' +
        '- Enables range queries within a partition: WHERE user_id = X AND event_time > Y\n' +
        '- Can have multiple clustering columns for multi-level sorting\n\n' +
        'Composite partition key:\n' +
        'PRIMARY KEY ((user_id, month), event_time)\n' +
        '- Combines user_id AND month to distribute data more evenly\n' +
        '- Prevents one user with millions of events creating a hot partition\n\n' +
        'Column families (legacy term):\n' +
        '- Cassandra stores data in column families (now called tables)\n' +
        '- Different rows in a table can have different non-key columns (sparse rows)\n' +
        '- Useful for entity-attribute-value patterns without EAV table complexity',
      example:
        'Twitter-like activity feed in Cassandra:\n\n' +
        'CREATE TABLE user_timeline (\n' +
        '  user_id    BIGINT,\n' +
        '  tweet_id   TIMEUUID,   -- clustering key with embedded timestamp\n' +
        '  content    TEXT,\n' +
        '  author_id  BIGINT,\n' +
        '  likes      INT,\n' +
        '  PRIMARY KEY (user_id, tweet_id)\n' +
        ') WITH CLUSTERING ORDER BY (tweet_id DESC);  -- newest first\n\n' +
        '-- Fetch user 42\'s last 20 tweets:\n' +
        'SELECT * FROM user_timeline WHERE user_id = 42 LIMIT 20;\n' +
        '-- This query: O(1) partition lookup + O(20) read = extremely fast\n\n' +
        '-- Impossible (without ALLOW FILTERING — never use in production):\n' +
        'SELECT * FROM user_timeline WHERE author_id = 77;  -- no partition key!\n\n' +
        '-- Solution: create a separate table for author_timeline with author_id as partition key\n' +
        '-- This is Cassandra\'s core principle: one table per query pattern',
      whenToUse:
        'Define your queries first. Then design your tables around those queries. Never design a Cassandra schema based on entity relationships — always based on access patterns.',
    },
    {
      title: 'Storage Architecture: LSM Trees and SSTables',
      icon: '💾',
      layman:
        'The magic behind Cassandra\'s write speed is how it stores data. ' +
        'Instead of updating data in place (which requires finding the right spot on disk), ' +
        'Cassandra always appends new data. Writes go to an in-memory buffer (memtable), then are flushed to immutable files on disk (SSTables). ' +
        'This is like taking notes on sticky notes, then periodically organising them into a binder. ' +
        'Writing is always fast because you are always adding to the end, never searching for where to update.',
      technical:
        'Write path:\n' +
        '1. Write to commit log (WAL): for crash recovery, sequential disk write\n' +
        '2. Write to memtable: in-memory sorted structure (per-table)\n' +
        '3. Memtable flush: when memtable hits size threshold, flush to SSTable on disk\n' +
        '4. SSTable: immutable, sorted on disk. Multiple SSTables can exist per table.\n\n' +
        'Read path:\n' +
        '1. Check memtable: is the data in memory?\n' +
        '2. Check bloom filter: is the key in this SSTable? (probabilistic, no false negatives)\n' +
        '3. Check row cache: was this partition recently read?\n' +
        '4. Read SSTable(s): sorted files on disk, can binary-search by key\n' +
        '5. Merge: combine memtable + multiple SSTable results (newest wins for same key)\n\n' +
        'Compaction:\n' +
        '- Over time, many SSTables accumulate. Compaction merges them into fewer, larger files.\n' +
        '- Removes deleted data (tombstones), deduplicates same-key writes\n' +
        '- Strategies:\n' +
        '  STCS (Size-Tiered Compaction): groups SSTables of similar size. Good for write-heavy.\n' +
        '  LCS (Leveled Compaction Strategy): maintains levels of increasing size. Better read performance.\n' +
        '  TWCS (Time Window Compaction Strategy): groups by time window. Best for time-series.\n\n' +
        'Tombstones:\n' +
        '- Deletes in Cassandra write a "tombstone" marker, not an actual deletion\n' +
        '- The actual data is removed during compaction (after gc_grace_seconds)\n' +
        '- Too many tombstones without compaction degrades read performance severely',
      example:
        'Write performance comparison — why Cassandra is so fast at writes:\n\n' +
        'PostgreSQL INSERT into users table (10M rows):\n' +
        '1. Find correct page in B-Tree index\n' +
        '2. Update index node (may split)\n' +
        '3. Write to WAL\n' +
        '4. Write to heap page\n' +
        '5. Update all other indexes (if you have 5 indexes: 5 updates)\n' +
        'Total disk seeks: 3–10 (random I/O)\n' +
        'Latency: 2–10ms, throughput: ~50K inserts/sec on fast hardware\n\n' +
        'Cassandra INSERT:\n' +
        '1. Append to commit log (sequential write, extremely fast)\n' +
        '2. Write to memtable (in-memory)\n' +
        'Total disk seeks: ~1 (sequential), rest in RAM\n' +
        'Latency: 0.1–0.5ms, throughput: 200K–1M writes/sec per node\n\n' +
        'At 10 nodes: Cassandra handles ~2M–10M writes/sec.\n' +
        'This is why Netflix uses Cassandra for billions of user events per day.',
    },
    {
      title: 'Replication and Consistency in Cassandra',
      icon: '🌐',
      layman:
        'Cassandra stores copies of your data on multiple nodes simultaneously. ' +
        'If one machine dies, the data is still available on the other copies. ' +
        'The number of copies is called the replication factor (RF). ' +
        'But with multiple copies, you face a question: do you wait for all copies to confirm a write before saying "success"? ' +
        'Cassandra lets you choose — wait for more nodes for stronger consistency, or fewer nodes for faster performance.',
      technical:
        'Replication Factor (RF):\n' +
        '- RF=1: one copy. No redundancy. Node failure = data loss.\n' +
        '- RF=3: three copies. Standard production setting. Survives 2 node failures.\n\n' +
        'Consistency Level (per query):\n' +
        '- ONE: read/write succeeds if 1 replica responds\n' +
        '  → Fastest, weakest. Stale reads possible.\n' +
        '- QUORUM: majority of replicas must respond (ceil(RF/2) + 1)\n' +
        '  → For RF=3: QUORUM = 2. Default balance of speed and consistency.\n' +
        '- ALL: all replicas must respond\n' +
        '  → Strongest consistency, lowest availability (one failure = query fails)\n' +
        '- LOCAL_QUORUM: quorum within the local data centre (for multi-DC)\n\n' +
        'Strong consistency: write at QUORUM + read at QUORUM\n' +
        '- At RF=3: write to 2, read from 2 → guaranteed to see latest write\n' +
        '- Mathematical guarantee: write set and read set overlap by at least 1 node\n\n' +
        'Hinted handoff:\n' +
        '- If a replica is down, the coordinator stores a "hint"\n' +
        '- When the replica comes back, it receives the hint and applies the write\n' +
        '- Ensures eventual consistency even through temporary outages\n\n' +
        'Read repair:\n' +
        '- On read, coordinator compares responses from multiple replicas\n' +
        '- If they disagree, sends the latest version to stale replicas\n' +
        '- Keeps replicas in sync without a background job',
      example:
        'Multi-data-centre Cassandra for global availability:\n\n' +
        'Setup: RF=3 in US-East, RF=3 in EU-West (6 total copies)\n\n' +
        'Write from US app server:\n' +
        'INSERT INTO sessions (id, user_id, data) VALUES (...) USING CONSISTENCY LOCAL_QUORUM;\n' +
        '-- Writes to 2 of 3 US-East nodes immediately (fast)\n' +
        '-- Asynchronously replicates to EU-West (eventual)\n\n' +
        'Read from EU app server:\n' +
        'SELECT * FROM sessions WHERE id = ? USING CONSISTENCY LOCAL_QUORUM;\n' +
        '-- Reads from 2 of 3 EU-West nodes\n' +
        '-- Data may be slightly behind US (cross-DC lag: 50–200ms)\n\n' +
        'Why this matters:\n' +
        '- US-East data centre goes down: EU-West still has all data (RF=3 there)\n' +
        '- EU users still get sessions: LOCAL_QUORUM reads from EU-West\n' +
        '- Zero downtime for EU users during US outage\n' +
        '- Netflix uses this for global resilience — regional outages do not affect other regions',
    },
    {
      title: 'Data Modeling for Cassandra',
      icon: '🎯',
      layman:
        'The most important mindset shift for Cassandra: stop thinking about entities and relationships, start thinking about queries. ' +
        'In SQL, you design your tables around your data (entities), then write any query you want. ' +
        'In Cassandra, you design your tables around your queries — one table per access pattern. ' +
        'This seems wasteful (data duplication), but it is the price of massive scale and predictable performance.',
      technical:
        'Design process:\n' +
        '1. List all required queries first (what SELECT statements need to run?)\n' +
        '2. For each query: what partition key gets the data to the right node?\n' +
        '3. What clustering key orders data within the partition for the query?\n' +
        '4. Design one table per query pattern (even if data is duplicated)\n\n' +
        'Anti-patterns to avoid:\n' +
        '- ALLOW FILTERING: forces full cluster scan. Never use in production.\n' +
        '- Secondary indexes (built-in): they query every node. Acceptable only for low-cardinality, low-volume use.\n' +
        '- Unbounded partitions: one partition that grows forever. Hotspot + performance degradation.\n\n' +
        'Partition size limits:\n' +
        '- Recommended: <100MB per partition, <100K rows per partition\n' +
        '- Larger partitions: slow reads, GC pressure, difficulty compacting\n' +
        '- Fix: add a "bucket" to the partition key (year-month, sequential ID % N)\n\n' +
        'Denormalisation is expected:\n' +
        '- Same data stored in multiple tables for different access patterns\n' +
        '- Application code must maintain all copies on write\n' +
        '- Use Cassandra Lightweight Transactions (LWT) for conditional writes\n' +
        '- Or: use Change Data Capture to propagate writes asynchronously',
      example:
        'Instagram photo feed — multi-table design:\n\n' +
        'Query 1: "Get user 42\'s last 20 posts"\n' +
        'CREATE TABLE user_posts (\n' +
        '  user_id BIGINT,\n' +
        '  post_id TIMEUUID,\n' +
        '  photo_url TEXT, caption TEXT, like_count INT,\n' +
        '  PRIMARY KEY (user_id, post_id)\n' +
        ') WITH CLUSTERING ORDER BY (post_id DESC);\n\n' +
        'Query 2: "Get user 42\'s followers\' last 20 posts" (home feed)\n' +
        'CREATE TABLE home_feed (\n' +
        '  viewer_id BIGINT,\n' +
        '  post_id   TIMEUUID,\n' +
        '  author_id BIGINT, photo_url TEXT, caption TEXT,\n' +
        '  PRIMARY KEY (viewer_id, post_id)\n' +
        ') WITH CLUSTERING ORDER BY (post_id DESC);\n\n' +
        '-- When user 42 posts a photo:\n' +
        '-- 1. Write to user_posts\n' +
        '-- 2. Fan-out: write to home_feed for EVERY follower\n' +
        '-- If user 42 has 1M followers: 1M writes per post\n' +
        '-- This is "write amplification" — the trade-off for O(1) feed reads\n' +
        '-- Instagram pre-computes feeds this way (with hybrid for celebrities)',
    },
  ],

  comparison: {
    caption: 'Cassandra vs HBase vs Google Bigtable',
    columns: ['Feature', 'Cassandra', 'HBase', 'Google Bigtable'],
    rows: [
      ['Architecture', 'Masterless (peer-to-peer)', 'Master-slave (HMaster)', 'Managed master nodes'],
      ['Write model', 'LSM Tree + SSTable', 'LSM Tree + HFile', 'LSM Tree (proprietary)'],
      ['Consistency', 'Tunable (ONE → ALL)', 'Strong (by default)', 'Strong within region'],
      ['Multi-DC', '✅ Native multi-DC', '🟡 Requires setup', '✅ Native (Google infra)'],
      ['SQL support', 'CQL (Cassandra Query Language)', '❌ Java API / Phoenix', '❌ Java API only'],
      ['Managed service', 'DataStax Astra, Amazon Keyspaces', 'Amazon EMR HBase', 'Google Cloud Bigtable'],
      ['Best for', 'Internet-scale OLTP, IoT, feeds', 'Hadoop ecosystem, analytics', 'Google-scale, AdTech, IoT'],
    ],
  },

  realWorldExamples: [
    {
      company: 'Netflix',
      icon: '🎬',
      description:
        'Netflix is one of the largest Cassandra deployments in the world — thousands of Cassandra nodes across multiple regions. ' +
        'Primary use cases: viewing history (user_id + timestamp partition), user preferences, billing events, and A/B test assignment tracking. ' +
        'Netflix chooses Cassandra because: (1) no single point of failure — any node can fail, others serve the data; (2) linear write scaling across nodes; (3) multi-region active-active replication keeps EU users served even if US data centre has issues. ' +
        'Their engineering blog is a key reference for Cassandra best practices at scale.',
    },
    {
      company: 'Apple',
      icon: '🍎',
      description:
        'Apple runs one of the world\'s largest Cassandra clusters — tens of thousands of nodes — for iCloud data storage. ' +
        'Messages, contacts, and device backups are distributed across Cassandra. ' +
        'The scale: 100,000+ nodes, 10+ PB of data. ' +
        'Apple contributed significantly to Cassandra\'s development and runs it at a scale few other organisations can match. ' +
        'The key requirement was multi-datacenter replication with strong durability guarantees across all Apple data centres globally.',
    },
    {
      company: 'Discord',
      icon: '💬',
      description:
        'Discord migrated from MongoDB to Cassandra as their message storage grew to hundreds of billions. ' +
        'Table design: messages(channel_id, message_id, author_id, content, attachments[]) — channel_id as partition key, message_id as clustering key (ordered by time). ' +
        '"Get last 50 messages in channel X" becomes a single O(1) Cassandra query. ' +
        'They later moved to ScyllaDB (a Cassandra-compatible, performance-optimised replacement written in C++) for even better performance and lower latency at their scale.',
    },
  ],

  interviewQuestions: [
    {
      question: 'How does Cassandra handle node failures?',
      answer:
        'Cassandra uses consistent hashing to distribute data across nodes in a ring. ' +
        'With replication factor RF=3, each piece of data is on 3 nodes. ' +
        'When a node fails: (1) Cassandra detects failure via gossip protocol (each node exchanges state with a few others periodically). (2) Coordinator routes queries to the remaining healthy replicas. (3) When consistency level is QUORUM (2 of 3), reads and writes continue normally even with one failed node. ' +
        'Hinted handoff: while the node is down, the coordinator stores "hints" for writes it could not deliver. When the node recovers, it receives the hints and catches up. ' +
        'No manual intervention needed for node failures — Cassandra is designed for this.',
    },
    {
      question: 'Explain why you would use Cassandra over PostgreSQL for a time-series workload',
      answer:
        'For a high-volume time-series workload (1M writes/sec), Cassandra wins on: ' +
        '(1) Write throughput: Cassandra\'s LSM-tree writes are always appends; PostgreSQL\'s B-tree updates are random writes. At scale, random writes are the bottleneck. ' +
        '(2) Linear scalability: add nodes, get proportionally more write capacity. PostgreSQL scales vertically (bigger machine) until you hit hardware limits or resort to complex sharding. ' +
        '(3) Built-in TTL: USING TTL 86400 automatically expires data without expensive DELETE operations. In PostgreSQL, deleting old time-series rows causes table bloat and locking. ' +
        '(4) Multi-DC replication: native geo-distributed writes without complex setup. ' +
        'Trade-offs: Cassandra cannot do the analytics queries (GROUP BY, window functions, ad-hoc aggregations) that PostgreSQL handles well. Combine Cassandra (storage) with a data warehouse (analytics).',
    },
    {
      question: 'What is a "hot partition" in Cassandra and how do you fix it?',
      answer:
        'A hot partition occurs when one partition key receives disproportionately more traffic than others, causing one node to be overloaded while others are idle. ' +
        'Common causes: (1) Using a low-cardinality partition key (e.g., country code — US gets 10× more traffic than all others). (2) Using a timestamp as partition key without bucketing (all current writes go to one partition). ' +
        'Fixes: (1) Add a random bucket to the partition key: (user_id, random % N) distributes writes across N virtual partitions. (2) Add a time-based bucket: (user_id, YYYYMM) limits partition growth to one month of data. (3) Use a composite partition key with higher cardinality. ' +
        'Detecting hot partitions: monitor node CPU, network I/O, and read/write latency per node — the hot node will stand out.',
    },
  ],

  commonMistakes: [
    'Using ALLOW FILTERING in production queries — this forces a full cluster scan and will bring your Cassandra cluster to its knees under load',
    'Designing tables without defining all required queries first — adding a query pattern after data is loaded requires a new table and backfilling',
    'Creating unbounded partitions — storing all events for a user without time-bucketing leads to partitions of millions of rows, causing performance degradation',
    'Using Cassandra for frequently updated data with many secondary index queries — Cassandra is append-optimised; many updates create many tombstones, degrading performance',
    'Not running regular compaction — tombstones accumulate, read performance degrades, and partition scans slow down without compaction',
    'Choosing Cassandra for small datasets — operational complexity (tuning, compaction, repair) is significant; for <10GB of data, PostgreSQL is simpler and often faster',
    'Not using LOCAL_QUORUM in multi-DC deployments — using QUORUM across DCs adds cross-region network latency to every query',
  ],
};
