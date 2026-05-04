import type { ConceptDeepDive } from '../../types';

export const readReplicas: ConceptDeepDive = {
  moduleId: 'read-replicas',
  tagline: 'One database writes. Many databases read. The oldest scaling trick in the book — and still one of the best',

  introduction: {
    layman:
      'Your app starts with one database. It handles everything: writes (new orders, new users) and reads (show me my order history, show me the product catalog). ' +
      'As you grow, 90% of your database load turns out to be reads — show the feed, load the dashboard, search products. ' +
      'Read replicas are exact copies of your main database, constantly kept in sync, that exist only to serve read queries. ' +
      'Your main database writes. The copies read. Traffic splits. Everyone gets served faster.',
    analogy:
      'Imagine a popular textbook at a university library. Every student wants to read it, and occasionally a professor updates the content. ' +
      'Without replicas: one copy, one student at a time, long queues. ' +
      'With replicas: the library makes 10 photocopies. Students read from any copy. Only the professor\'s original gets updated — and the copies are refreshed overnight. ' +
      'Reads scale to 10×. Writes still go to the one original. That\'s exactly what read replicas do.',
    whyMatters:
      'Read replicas are typically the first scaling move after caching for database-heavy applications. They\'re used by virtually every major internet company. ' +
      'Instagram\'s MySQL setup has dozens of read replicas per table shard. Stack Overflow\'s SQL Server setup relies heavily on replicas for reporting. ' +
      'For interviews, read replicas come up in: "how do you scale a database?" or "how do you design a product catalog?" — they\'re the answer for read-heavy workloads before you need sharding.',
  },

  subTopics: [
    {
      title: 'How Read Replicas Work',
      icon: '🔄',
      layman:
        'Your primary (master) database handles all writes. Every change it makes — new row, updated value, deleted record — is recorded in a special log. ' +
        'Replica databases connect to the primary and continuously replay that log, staying a near-identical copy. ' +
        'Your app is configured to: send writes to primary, send reads to replicas.',
      technical:
        'Replication mechanics:\n' +
        '1. Write-Ahead Log (WAL) / binlog: every write to the primary is first written to a durable log (WAL in PostgreSQL, binary log in MySQL).\n' +
        '2. Log shipping: the log is streamed to replica servers.\n' +
        '3. Log replay: replicas apply each log entry in order, maintaining identical state.\n\n' +
        'Replication modes:\n' +
        'Asynchronous (default): primary commits, immediately acknowledges to client. Log ships to replica in background. Replica may be slightly behind (replication lag).\n' +
        'Synchronous: primary waits for at least one replica to confirm before acknowledging. No lag, but higher write latency (waits for network round-trip to replica).\n' +
        'Semi-synchronous: wait for at least one replica, not all. Balance of latency and durability.',
      example:
        'PostgreSQL streaming replication:\n' +
        'Primary: postgresql.conf → wal_level = replica, max_wal_senders = 5\n' +
        'Replica: pg_basebackup to clone, recovery.conf → primary_conninfo\n' +
        'App: writes → primary:5432, reads → replica1:5432 or replica2:5432\n\n' +
        'AWS RDS: one click creates a read replica. Replication is automatic. Same data, different endpoint.',
      whenToUse: 'When reads are 80%+ of your database load and a single instance is becoming a bottleneck. Read replicas scale reads linearly — 3 replicas = ~3× read throughput.',
    },
    {
      title: 'Replication Lag — The Core Trade-off',
      icon: '⏱️',
      layman:
        'Replicas are almost always a little bit behind the primary. If someone places an order and immediately refreshes their order history, the replica might not have that new order yet. ' +
        'This window of being "behind" is called replication lag. Usually it\'s milliseconds. During heavy write load, it can be seconds. This is not a bug — it\'s the fundamental trade-off.',
      technical:
        'Replication lag causes:\n' +
        '1. High write throughput: replica can\'t replay fast enough.\n' +
        '2. Long-running transactions on primary: replica blocks until they complete.\n' +
        '3. Network latency to geo-distant replicas.\n' +
        '4. Replica under load from heavy read queries (CPU contention with replay).\n\n' +
        'Measuring lag:\n' +
        'PostgreSQL: SELECT now() - pg_last_xact_replay_timestamp() AS replication_lag;\n' +
        'MySQL: SHOW SLAVE STATUS → Seconds_Behind_Master\n\n' +
        'Handling lag in your application:\n' +
        '1. Read-your-own-writes: after a user writes, route their next reads to primary temporarily.\n' +
        '2. Session stickiness: route a user\'s reads to the same replica, which has their recent writes sooner.\n' +
        '3. Monotonic reads: always read from the same replica within a session to prevent time-traveling reads.\n' +
        '4. Synchronous replication: eliminate lag at the cost of higher write latency.',
      example:
        'Scenario: User updates their profile picture → primary gets the write.\n' +
        'User immediately opens profile page → reads from replica → still shows old picture (lag = 200ms).\n' +
        'User confused: "Did my update work?"\n\n' +
        'Fix: detect that this is a "read-your-own-write" scenario:\n' +
        '- After a profile write, set a cookie: "last_write_timestamp = now"\n' +
        '- For 5 seconds after, route that user\'s profile reads to the primary\n' +
        '- After 5 seconds, back to replica (replication has caught up)\n' +
        'User always sees their own updates immediately.',
      whenToUse: 'You must understand and design for replication lag any time you use replicas. It\'s not optional — every system using replicas has dealt with this.',
    },
    {
      title: 'Read Routing Strategies',
      icon: '🚦',
      layman:
        'You have a primary and 3 replicas. How do you decide which queries go where? You can be smart about this — route based on query type, user, or even how critical the data freshness is.',
      technical:
        'Common routing strategies:\n\n' +
        '1. Application-level routing (most common):\n' +
        '   Write operations (INSERT/UPDATE/DELETE/transactions) → always primary.\n' +
        '   Read-only queries (SELECT, reports, search) → replicas.\n' +
        '   Implementation: different DB connection pools for primary vs replicas in your ORM config.\n\n' +
        '2. Proxy-level routing:\n' +
        '   ProxySQL (MySQL) / PgBouncer + PgPool (PostgreSQL): database proxy that automatically routes writes to primary and reads to replicas based on SQL parsing.\n' +
        '   App talks to one endpoint; proxy decides.\n\n' +
        '3. Lag-aware routing:\n' +
        '   Only route to replicas with lag < 500ms. Fall back to primary if all replicas are lagging.\n' +
        '   AWS Aurora does this automatically.\n\n' +
        '4. Weighted routing:\n' +
        '   Send 80% of reads to replicas, 20% to primary (for freshness-sensitive operations).\n\n' +
        '5. Geographic routing:\n' +
        '   Users in Mumbai read from Mumbai replica. Users in Delhi from Delhi replica.\n' +
        '   All writes go to primary (e.g., in US-east), async replicated globally.',
      example:
        'Django ORM with replica routing:\n\n' +
        'class ReplicaRouter:\n' +
        '    def db_for_read(self, model, **hints):\n' +
        '        return random.choice([\'replica1\', \'replica2\'])  # load balance reads\n' +
        '    def db_for_write(self, model, **hints):\n' +
        '        return \'primary\'  # always write to primary\n\n' +
        'settings.py:\n' +
        'DATABASE_ROUTERS = [\'myapp.routers.ReplicaRouter\']',
    },
    {
      title: 'Replica Promotion and Failover',
      icon: '🔁',
      layman:
        'What happens when your primary database crashes? Without a replica, you\'re down until it recovers. With a replica, you can "promote" one of them to become the new primary — a process called failover. ' +
        'This is why replicas serve double duty: scaling reads AND providing high availability.',
      technical:
        'Automatic failover:\n' +
        '1. Health monitor (Patroni for PostgreSQL, MHA for MySQL, AWS RDS Multi-AZ) detects primary is down.\n' +
        '2. Promotes the most up-to-date replica to primary.\n' +
        '3. Updates DNS/load balancer to point to new primary.\n' +
        '4. Other replicas re-connect to new primary and continue replicating.\n' +
        '5. Old primary comes back → joins as replica.\n\n' +
        'Failover risks:\n' +
        '- Split-brain: network partition causes two nodes to both think they\'re primary → writes lost/duplicated. Fencing (STONITH) prevents this.\n' +
        '- Data loss: async replication means replica may be seconds behind → last few writes lost on promotion.\n' +
        '- Failover time: typically 30–60 seconds for automated failover (longer if manual).\n\n' +
        'AWS RDS Multi-AZ: synchronous standby replica in another availability zone. Automatic failover in ~60 seconds. Zero data loss (sync replication). Cannot serve reads (standby only).',
      example:
        'Paytm checkout: primary DB in Mumbai fails at 2 PM during a sale.\n' +
        'Without replica: site is down, no orders processing.\n' +
        'With Patroni failover:\n' +
        't+0: primary stops responding.\n' +
        't+10s: Patroni detects failure.\n' +
        't+15s: replica in Pune promoted to primary.\n' +
        't+20s: DNS updated, app connects to new primary.\n' +
        't+30s: all orders processing again. Last 5 seconds of writes potentially lost.\n' +
        'The 30-second window of writes during failover → need idempotent retry logic on clients.',
    },
    {
      title: 'When Read Replicas Are NOT Enough',
      icon: '🚫',
      layman:
        'Read replicas solve the read bottleneck. But what if your write volume is too high? Or your table is so large that even replicas can\'t serve queries fast enough? ' +
        'At some point you need to take a different approach — sharding (splitting the data itself) or moving to different database types altogether.',
      technical:
        'Read replicas limitations:\n' +
        '1. Write bottleneck: all writes go to ONE primary. If writes are the bottleneck, replicas don\'t help.\n' +
        '2. Full dataset per replica: each replica stores ALL data. If the dataset is 10TB, each replica is 10TB — expensive and slower.\n' +
        '3. Replication lag: cannot guarantee freshness for all use cases.\n' +
        '4. Connection limits: each replica has its own connection limit; too many app servers and you\'re back to connection exhaustion.\n\n' +
        'What to do when replicas aren\'t enough:\n' +
        '- Horizontal sharding: split data across multiple primaries (each with their own replicas).\n' +
        '- CQRS pattern: separate read and write models entirely (write to relational DB, sync aggregated read model to Elasticsearch or Redis).\n' +
        '- Move reads to specialised stores: Elasticsearch for search, Redis for counters and leaderboards, Cassandra for time-series reads.\n' +
        '- Connection pooling (PgBouncer): multiplex thousands of app connections through a small pool of DB connections.',
      example:
        'Instagram scaled to:\n' +
        'Phase 1: 1 PostgreSQL primary + 2 replicas → served first 10M users.\n' +
        'Phase 2: DB was still too slow → switched to MySQL + read replicas, aggressively cached with Memcached.\n' +
        'Phase 3: MySQL sharded by user_id → 1000+ shards, each with their own replica.\n' +
        'Phase 4: Photos/media moved to Cassandra (write-scalable). User data stayed in MySQL shards.\n' +
        'The progression: replica → cache → shard → specialised DB. Read replicas were the first step, not the last.',
    },
  ],

  comparison: {
    caption: 'Primary vs Read Replicas — capabilities and trade-offs',
    columns: ['Property', 'Primary (Leader)', 'Read Replica (Follower)', 'Synchronous Replica'],
    rows: [
      ['Handles writes', '✅ Yes', '❌ No', '✅ Yes (as standby)'],
      ['Handles reads', '✅ Yes', '✅ Yes (main use)', '❌ No (standby only)'],
      ['Data freshness', 'Always current', 'Milliseconds to seconds behind', 'Always current'],
      ['Failover role', 'Is the active primary', 'Can be promoted to primary', 'Auto-promoted on failure'],
      ['Write latency', 'Baseline', 'Same (doesn\'t write)', 'Higher (waits for replica ACK)'],
      ['Cost', '1 instance', '+1 per replica', '+1 per sync replica'],
    ],
  },

  realWorldExamples: [
    {
      company: 'Stack Overflow',
      icon: '💻',
      description:
        'Stack Overflow famously runs on very few servers — but they do use read replicas for reporting and tag browsing queries. ' +
        'Their SQL Server setup routes complex analytical queries to replicas so they never burden the primary that handles real-time question and answer writes. ' +
        'They\'ve published that 95% of their traffic is handled by just 2 SQL Servers (1 primary, 1 replica).',
    },
    {
      company: 'GitLab',
      icon: '🦊',
      description:
        'GitLab uses PostgreSQL with multiple read replicas. Their CI/CD pipeline status queries (read-heavy, slightly stale is fine) go to replicas. ' +
        'Git push operations (write) go to primary. They use PgBouncer for connection pooling and Patroni for automatic failover. ' +
        'When they had replication lag issues, they tuned PostgreSQL WAL settings and moved heavy reporting queries to a dedicated analytics replica.',
    },
    {
      company: 'Twitter/X',
      icon: '🐦',
      description:
        'Twitter\'s MySQL setup used "Twitter Gizzard" — their own sharding and replication framework. Each shard had a primary and 2–4 read replicas. ' +
        'Timeline reads (showing you your feed) went to replicas. Tweets writes went to primary. ' +
        'During peak traffic (World Cup, New Year\'s) replicas received 10× their normal read load — the system scaled by adding more replicas without touching the write path.',
    },
  ],

  interviewQuestions: [
    {
      question: 'What is a read replica and why do we use it?',
      answer:
        'A read replica is a continuously synchronized copy of the primary database that serves read-only queries. We use replicas when reads are the bottleneck — they distribute read load across multiple instances, each serving a subset of read traffic. ' +
        'The primary handles all writes; replicas handle reads. This can multiply read throughput (5 replicas = ~5× reads) while keeping writes on a single consistent source of truth. ' +
        'They also serve as hot standby for failover.',
    },
    {
      question: 'What is replication lag and how do you handle it?',
      answer:
        'Replication lag is the delay between a write to the primary and when that write becomes visible on replicas (typically milliseconds to seconds). ' +
        'Handle it by: (1) Read-your-own-writes — after a write, route the same user\'s reads to primary for a short window. ' +
        '(2) Monotonic reads — ensure a user always reads from the same replica so they don\'t see time-travel effects. ' +
        '(3) Accept eventual consistency for non-critical reads (showing a product\'s view count 2 seconds stale is fine). ' +
        '(4) Use synchronous replication for zero-lag at the cost of higher write latency.',
    },
    {
      question: 'When would you choose sharding over read replicas?',
      answer:
        'Read replicas solve read bottlenecks — all data still lives on one primary. Sharding solves write bottlenecks and dataset size problems — data is split across multiple primaries. ' +
        'Choose sharding when: (1) writes are the bottleneck (replicas don\'t help writes), (2) the dataset is too large for one machine, or (3) you need writes to scale horizontally. ' +
        'Sharding is much more complex (cross-shard queries, rebalancing) — try replicas, caching, and vertical scaling first.',
    },
    {
      question: 'How do you ensure a user sees their own writes immediately when using replicas?',
      answer:
        'The "read-your-own-writes" pattern: after any write by a user, record a timestamp in their session or a cookie. For a short window (5 seconds, or until replica lag clears), route that user\'s reads to the primary. ' +
        'After the window, routing shifts back to replicas (by then, replication has caught up). ' +
        'Another approach: sticky routing — pin a user\'s session to one specific replica and route writes to it first (only works with synchronous replication to that replica).',
    },
  ],

  commonMistakes: [
    'Sending writes to replicas — replicas are read-only; writes fail or corrupt data',
    'Assuming zero replication lag — always design for the possibility of stale reads',
    'Not handling "read-your-own-writes" — users see outdated data immediately after their own changes',
    'Using too many connection pools per replica — each app server creates connections to every replica, exhausting DB connection limits',
    'Treating replica promotion as instant — automated failover takes 30–60 seconds; design for that downtime window',
    'Using replicas to avoid indexing — a replica with a full table scan is still slow; fix queries first',
  ],
};
