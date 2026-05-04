import type { ConceptDeepDive } from '../../types';

export const connectionPooling: ConceptDeepDive = {
  moduleId: 'connection-pooling',
  tagline: 'Opening a new database connection for every request is like hiring a new employee for every customer — expensive, slow, and completely unnecessary',

  introduction: {
    layman:
      'Every time your app talks to the database, it has to "open a connection" — think of it like picking up the phone and dialling. ' +
      'Opening a connection takes 20–100 milliseconds (handshake, authentication, memory allocation). If your app handles 1,000 requests per second and each opens a new connection, that\'s 1,000 "dials" per second — most of your time is spent dialling, not actually working. ' +
      'Connection pooling keeps a set of connections permanently open and ready. Requests borrow a connection, use it, and return it — like a shared taxi fleet instead of everyone calling a new Uber.',
    analogy:
      'Imagine a call centre with 100 customer service agents. Without pooling: every customer call causes the centre to hire and train a new agent (takes 30 minutes), the agent handles one call, then quits. ' +
      'With pooling: you have 20 trained agents permanently on duty. Each call goes to a free agent. When the call ends, the agent is ready for the next one. ' +
      'The centre handles far more calls with far fewer agents, and response time drops from 30 minutes to instant. ' +
      'PgBouncer, HikariCP, and connection pools are your permanently employed agents.',
    whyMatters:
      'Connection pooling is one of the most impactful and overlooked optimizations in backend systems. ' +
      'When AWS Lambda arrived, engineers discovered that serverless functions creating new DB connections per invocation would quickly exhaust PostgreSQL\'s connection limit (default: 100). ' +
      'At 10,000 concurrent Lambda functions, 10,000 connections → database crashes. ' +
      'RDS Proxy (AWS\'s managed pooler) became one of AWS\'s most-requested features, entirely because serverless exposed this problem at scale. ' +
      'In interviews, "design a serverless API that talks to PostgreSQL" immediately leads to "how do you handle connection limits?"',
  },

  subTopics: [
    {
      title: 'The Problem with New Connections',
      icon: '🐢',
      layman:
        'Creating a database connection is much more expensive than it looks. It\'s not just a TCP handshake — the database allocates memory, authenticates the user, starts a backend process, and loads configuration. ' +
        'For PostgreSQL, each connection has a dedicated backend process consuming 5–10MB of RAM. At 1,000 connections, that\'s 5–10 GB just for connections, before any data is stored.',
      technical:
        'Connection establishment cost breakdown:\n' +
        '1. TCP 3-way handshake: ~1ms on local network.\n' +
        '2. TLS/SSL negotiation (if encrypted): ~5–20ms.\n' +
        '3. Database authentication: ~5–15ms (password hash, permission check).\n' +
        '4. Session setup: allocate backend process (PostgreSQL), allocate session memory.\n' +
        'Total: 20–100ms per connection on typical cloud setup.\n\n' +
        'PostgreSQL architecture: one backend process per connection.\n' +
        'Default max_connections = 100. Each process uses ~5–10MB RAM.\n' +
        '1000 connections = 5–10GB RAM consumed just for connections.\n\n' +
        'MySQL thread-per-connection model: similar overhead, tunable with thread caches.\n\n' +
        'The connection limit problem:\n' +
        'Each service instance creates a pool of N connections.\n' +
        '50 app servers × 20 connections each = 1,000 connections → PostgreSQL limit hit.\n' +
        'New connections refused → app errors → cascading failure.',
      example:
        'Without pooling (measured):\n' +
        '1,000 requests/second × 50ms connection overhead = 50,000ms wasted per second.\n' +
        'A server doing 1,000 req/s spends 50 full seconds per second just dialing the database.\n\n' +
        'With pooling:\n' +
        'Pool of 20 connections, reused across 1,000 requests/second.\n' +
        'Connection overhead: ~0ms (connections are already open).\n' +
        'Database handles 1,000 req/s with just 20 connections.',
      whenToUse: 'Always. Connection pooling should be the default, not an optimization you add later. Every production backend should use a connection pool.',
    },
    {
      title: 'How Connection Pools Work',
      icon: '🏊',
      layman:
        'A connection pool is a bucket of pre-opened database connections sitting idle, waiting for work. ' +
        'When a request comes in, it grabs a connection from the bucket, runs its query, and puts the connection back. No opening, no closing — just borrowing and returning.',
      technical:
        'Pool lifecycle:\n' +
        '1. Startup: pool opens min_connections to the DB (always open, always ready).\n' +
        '2. Request arrives: app asks pool for a connection.\n' +
        '3. If connection available: borrow it instantly (0ms overhead).\n' +
        '4. If all connections busy:\n' +
        '   a. If pool < max_connections: open a new one (~50ms). \n' +
        '   b. If pool = max_connections: wait in queue until one frees, or timeout.\n' +
        '5. After query: return connection to pool (not closed — just marked available).\n' +
        '6. Idle connections: pool periodically validates and closes connections idle longer than max_idle_time.\n\n' +
        'Key pool parameters:\n' +
        '- min_connections (pool_size): always-open connections. Set to expected concurrent load.\n' +
        '- max_connections: maximum connections pool will ever create.\n' +
        '- connection_timeout: how long to wait for a free connection before erroring.\n' +
        '- max_lifetime: max age of a connection before it\'s closed and replaced (prevent stale connections).\n' +
        '- idle_timeout: close connections that have been idle too long.',
      example:
        'HikariCP (Java — fastest connection pool) configuration:\n\n' +
        'HikariConfig config = new HikariConfig();\n' +
        'config.setJdbcUrl("jdbc:postgresql://host:5432/mydb");\n' +
        'config.setMaximumPoolSize(20);  // max 20 connections to DB\n' +
        'config.setMinimumIdle(5);       // keep 5 always open\n' +
        'config.setConnectionTimeout(3000);  // 3s wait before error\n' +
        'config.setMaxLifetime(1800000); // retire connections after 30 min\n\n' +
        'Node.js with pg-pool:\n' +
        'const pool = new Pool({ max: 20, idleTimeoutMillis: 30000 });\n' +
        'const client = await pool.connect();\n' +
        'await client.query(...);\n' +
        'client.release(); // return to pool, not close',
      whenToUse: 'Configure pool size to match your database\'s max_connections minus connections needed for admin/monitoring tasks. A good starting formula: pool_size = (core_count × 2) + effective_spindle_count (from HikariCP research).',
    },
    {
      title: 'External Poolers: PgBouncer and RDS Proxy',
      icon: '🔀',
      layman:
        'Application-level pools (HikariCP, pg-pool) work great for one app. But when you have 50 app servers, each with its own pool of 20 connections, that\'s still 1,000 database connections. ' +
        'External connection poolers sit between all your app servers and the database — they act as a shared pool for your entire fleet.',
      technical:
        'Architecture:\n' +
        'Without external pooler: each app server has its own pool → total connections = servers × pool_size.\n' +
        'With external pooler: all app servers connect to the pooler. Pooler maintains a small pool to the DB.\n' +
        '50 servers × 20 app connections → pooler → 10 real DB connections.\n\n' +
        'PgBouncer (PostgreSQL):\n' +
        'Three pooling modes:\n' +
        '- Session mode: one real connection per client session (least multiplexing, most compatible).\n' +
        '- Transaction mode: release connection back to pool after each transaction (most efficient).\n' +
        '- Statement mode: release after each statement (only safe for simple queries, breaks multi-statement transactions).\n\n' +
        'Transaction mode is the sweet spot: handles 10,000 concurrent clients with 100 real DB connections.\n\n' +
        'AWS RDS Proxy:\n' +
        'Managed external pooler for RDS/Aurora. Specifically solves the serverless connection problem.\n' +
        'Lambda function connects to RDS Proxy endpoint instead of RDS directly.\n' +
        'Proxy maintains warm pool to RDS. 10,000 Lambdas × 1 connection → Proxy → 50 real DB connections.\n' +
        'Auto-failover aware: transparently re-routes to new primary after RDS failover.',
      example:
        'Without RDS Proxy (serverless problem):\n' +
        'Lambda function: const client = new Client(dbConfig); await client.connect(); ...\n' +
        '10,000 concurrent Lambdas = 10,000 new PostgreSQL connections.\n' +
        'PostgreSQL max_connections = 200 → 9,800 connections refused → mass failures.\n\n' +
        'With RDS Proxy:\n' +
        'Lambda connects to proxy endpoint (instant, proxy is always warm).\n' +
        'Proxy holds pool of 50 connections to RDS.\n' +
        '10,000 Lambdas share 50 DB connections via proxy.\n' +
        'Zero connection limit issues. Cost: ~$0.015/hour for the proxy.',
    },
    {
      title: 'Tuning Pool Size Correctly',
      icon: '🎛️',
      layman:
        'More connections in the pool doesn\'t always mean faster. There\'s a sweet spot. Too few: requests wait for connections. Too many: the database is overwhelmed by concurrent queries and slows down for everyone.',
      technical:
        'Pool size formula (HikariCP research — "About Pool Sizing"):\n' +
        'pool_size = (number_of_CPU_cores × 2) + effective_spindle_count\n' +
        'For a 4-core app server with SSD DB: pool_size ≈ (4 × 2) + 1 = 9\n\n' +
        'Why bigger isn\'t better:\n' +
        'Database is bottlenecked by CPU and I/O, not connection count.\n' +
        '200 concurrent queries on an 8-core database = context switching overhead → slower for everyone.\n' +
        '20 concurrent queries on 8 cores = each gets ~2 core threads → fast.\n\n' +
        'Calculating total DB connections needed:\n' +
        'app_servers × pool_max = total connections to DB\n' +
        'Leave headroom for: admin connections, monitoring agents, migration scripts.\n' +
        'Target: total connections ≤ (DB max_connections × 0.8)\n\n' +
        'Pool monitoring metrics to watch:\n' +
        '- Pool wait time: time requests spend waiting for a free connection (should be ~0ms).\n' +
        '- Pool usage %: (active_connections / max_pool_size) → if consistently >90%, increase pool or scale DB.\n' +
        '- Connection creation rate: high rate = pool too small, app spinning up new connections constantly.',
      example:
        'Scenario: 10 app servers, PostgreSQL max_connections = 200.\n' +
        'Naive setup: each app server pool max = 50 → 10 × 50 = 500 connections → exceeds limit → crash.\n\n' +
        'Correct setup:\n' +
        'Total budget: 200 connections × 0.8 = 160 (keep 40 for admin).\n' +
        'Per-server pool max: 160 / 10 servers = 16 connections per pool.\n' +
        'This serves ~16 × 10 = 160 concurrent queries. More than enough for most apps.\n\n' +
        'If you add a 11th server:\n' +
        'Recalculate: 160 / 11 = 14 per pool.\n' +
        'OR add PgBouncer so all 11 servers share connections centrally.',
    },
    {
      title: 'Connection Pool Anti-Patterns',
      icon: '🚨',
      layman:
        'Connection pools are simple in theory but easy to misconfigure. A misconfigured pool is often worse than no pool — it either starves requests of connections or floods the database.',
      technical:
        '1. Pool too large:\n' +
        '   Setting pool_max = 100 per app server across 20 servers = 2,000 DB connections.\n' +
        '   PostgreSQL default max = 100 → immediate connection exhaustion.\n\n' +
        '2. No connection timeout:\n' +
        '   If all connections busy and no timeout set, requests wait forever.\n' +
        '   Set connection_timeout to 3–5 seconds → fail fast, let client retry.\n\n' +
        '3. Forgetting to release connections:\n' +
        '   Connection borrowed, query runs, error thrown → connection never released → pool drains.\n' +
        '   Always use try/finally or using blocks:\n' +
        '   const client = await pool.connect();\n' +
        '   try { await client.query(...) } finally { client.release() }\n\n' +
        '4. Stale connections:\n' +
        '   DB server restart → all pool connections become stale (closed server-side).\n' +
        '   Pool doesn\'t know → next query fails. Fix: set max_lifetime to auto-retire old connections.\n\n' +
        '5. Creating pool inside request handlers:\n' +
        '   const pool = new Pool() inside each HTTP handler = new pool per request = no reuse = worse than no pooling.\n' +
        '   Create pool at app startup, share across all requests (singleton pattern).',
      example:
        '// WRONG — creates a new pool for every request\n' +
        'app.get(\'/users\', async (req, res) => {\n' +
        '  const pool = new Pool({ max: 20 });  // ← new pool each time!\n' +
        '  const result = await pool.query(...);\n' +
        '});\n\n' +
        '// RIGHT — create pool once at startup\n' +
        'const pool = new Pool({ max: 20, idleTimeoutMillis: 30000 });  // ← module-level\n\n' +
        'app.get(\'/users\', async (req, res) => {\n' +
        '  const client = await pool.connect();\n' +
        '  try {\n' +
        '    const result = await client.query(\'SELECT * FROM users\');\n' +
        '    res.json(result.rows);\n' +
        '  } finally {\n' +
        '    client.release();  // ← always release\n' +
        '  }\n' +
        '});',
    },
  ],

  comparison: {
    caption: 'Connection strategies compared',
    columns: ['Strategy', 'How It Works', 'Best For', 'Limitation'],
    rows: [
      ['No pooling', 'New connection per request', 'Local dev/testing only', 'Slow, exhausts DB connections'],
      ['App-level pool (HikariCP)', 'Pool per app instance', 'Single service, traditional servers', 'Total connections = servers × pool_size'],
      ['PgBouncer (transaction mode)', 'Shared external pool', 'Many app servers, high concurrency', 'Breaks features needing session state'],
      ['RDS Proxy', 'Managed pooler + failover routing', 'AWS serverless + RDS', 'Cost, AWS-specific'],
      ['PgPool-II', 'Pool + query routing + load balancing', 'Complex PostgreSQL setups', 'Complex configuration'],
    ],
  },

  realWorldExamples: [
    {
      company: 'Airbnb',
      icon: '🏠',
      description:
        'Airbnb\'s move to microservices in 2018 created a connection crisis: each service had its own connection pool, and 300+ microservices × 20 connections = 6,000 database connections. ' +
        'PostgreSQL max_connections = 400. Their fix: PgBouncer as a sidecar container next to each DB pod, centralising connection management. ' +
        'Connections to DB dropped from 6,000 to 80. Query latency improved 15%.',
    },
    {
      company: 'AWS Lambda / Serverless',
      icon: '⚡',
      description:
        'The arrival of serverless architectures made the connection problem acute: a Lambda function invocation creates a new process, and without careful management, creates a new DB connection. ' +
        '10,000 cold starts = 10,000 connections instantly. AWS built RDS Proxy specifically for this use case — it became generally available in 2020 after massive demand. ' +
        'Now all production Lambda-to-RDS architectures should use RDS Proxy.',
    },
    {
      company: 'Discord',
      icon: '💬',
      description:
        'Discord serves 150M+ users with a mix of relational and Cassandra databases. Their PostgreSQL setup uses pgBouncer in transaction mode, keeping real DB connections under 200 while serving tens of thousands of concurrent API connections. ' +
        'They published that moving to transaction pooling doubled their query throughput without adding any database capacity — just by reducing connection overhead.',
    },
  ],

  interviewQuestions: [
    {
      question: 'What is connection pooling and why is it important?',
      answer:
        'Connection pooling reuses a set of pre-established database connections across many requests, instead of opening and closing a connection for each request. ' +
        'Opening a connection costs 20–100ms (TCP handshake, authentication, memory allocation). For high-traffic apps, this overhead becomes dominant. ' +
        'Pools eliminate this by keeping connections warm and ready — requests borrow and return connections in microseconds. ' +
        'Equally important: databases have connection limits (PostgreSQL default: 100). Without pooling, connection exhaustion causes cascading failures.',
    },
    {
      question: 'How do you handle database connections in a serverless (Lambda) environment?',
      answer:
        'Each Lambda invocation is a short-lived process. Without care, each invocation creates a new DB connection → at 10,000 concurrent Lambdas, 10,000 connections, which exhausts any database. ' +
        'Solutions: (1) Reuse connections by placing pool initialization outside the handler function — Lambda reuses the execution context for warm invocations, so the connection persists. ' +
        '(2) Use an external pooler: AWS RDS Proxy sits between Lambdas and RDS, maintaining a warm pool of real DB connections. Lambdas connect to the proxy (always fast), proxy multiplexes to RDS (few real connections).',
    },
    {
      question: 'How do you determine the right connection pool size?',
      answer:
        'The HikariCP formula: pool_size = (CPU_cores × 2) + effective_disk_spindles. For a 4-core machine with SSD: ~9 connections. ' +
        'More importantly, calculate total connections: app_servers × pool_max must be < DB max_connections × 0.8 (leave headroom for admin). ' +
        'If 10 servers × 20 = 200 but DB max = 100, reduce pool_max to 8 per server or add PgBouncer. ' +
        'Monitor pool wait time — if requests wait >1ms for a connection, pool is too small.',
    },
    {
      question: 'What is PgBouncer and when would you use it?',
      answer:
        'PgBouncer is an external connection pooler for PostgreSQL. It sits between your apps and the database, multiplexing thousands of application connections into a small number of real DB connections. ' +
        'Use it when: (1) you have many app servers and total connections exceed DB limits, (2) you use serverless functions, or (3) you want to reduce connection overhead across a microservices fleet. ' +
        'Transaction mode (most efficient) releases the DB connection back to the pool after each transaction, allowing 10,000 app connections to share 50 DB connections.',
    },
  ],

  commonMistakes: [
    'Creating a new pool inside request handlers — defeats the purpose entirely; pool must be a singleton at startup',
    'Not releasing connections after errors — use try/finally to guarantee release even when queries fail',
    'Setting pool_max too high — 50 app servers × 50 pool = 2,500 connections, instantly crashes PostgreSQL',
    'Ignoring connection timeout settings — without timeouts, requests hang indefinitely when the pool is exhausted',
    'Using session-mode PgBouncer for serverless — session mode holds the DB connection for the entire client session; use transaction mode for serverless',
    'Not setting max_lifetime — stale connections from DB restarts silently fail on next use',
  ],
};
