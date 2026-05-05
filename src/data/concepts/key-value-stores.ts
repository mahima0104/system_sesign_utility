import type { ConceptDeepDive } from '../../types';

export const keyValueStores: ConceptDeepDive = {
  moduleId: 'key-value-stores',
  tagline: 'The simplest database — and the fastest. Every system needs one.',

  introduction: {
    layman:
      'A key-value store is the simplest database you can imagine: a giant dictionary. ' +
      'You store a value under a key. You retrieve it by that key. That is it. ' +
      'There is no schema, no SQL, no joins. Just PUT(key, value) and GET(key). ' +
      'This simplicity makes key-value stores extraordinarily fast — ' +
      'Redis, the most popular key-value store, can handle over 1 million operations per second on a single machine. ' +
      'Every major tech company — Google, Amazon, Meta, Netflix — uses Redis or a similar key-value store as a critical part of their infrastructure.',
    analogy:
      'Think of a hotel key desk. Every guest\'s room key is in a numbered cubby. ' +
      'To get the key for room 207, you go directly to cubby 207. ' +
      'No searching, no sorting through files — O(1), instant access. ' +
      'You do not ask "which guests have rooms above floor 5?" — the cubby system cannot answer that. ' +
      'It is optimised for one thing: direct lookup by key. ' +
      'Redis is this hotel key desk, except it also stores caches, queues, leaderboards, and pub/sub channels — all at blazing speed.',
    whyMatters:
      'In every system design interview, Redis appears within the first 15 minutes. ' +
      '"Add a cache to reduce DB load," "rate limit API requests," "store user sessions," "build a leaderboard" — all solved with Redis. ' +
      'Understanding when to reach for a key-value store versus a database, how to design cache strategies, and how to avoid pitfalls (cache stampede, cold starts) separates good engineers from great ones.',
  },

  subTopics: [
    {
      title: 'Redis Data Structures',
      icon: '🗂️',
      layman:
        'Redis is not just a key-value store — it is a data structure server. ' +
        'Beyond simple strings, Redis supports lists (queues), sets (unique collections), sorted sets (leaderboards), hashes (objects), streams (event logs), and geospatial indexes. ' +
        'Each data structure has purpose-built commands that make common operations atomic and blazing fast.',
      technical:
        'String: the most basic type\n' +
        '- SET user:42:name "Alice" EX 3600  (with 1hr TTL)\n' +
        '- GET user:42:name\n' +
        '- INCR page_views:homepage  (atomic counter)\n' +
        '- SETNX lock:resource "1"  (set if not exists — for distributed locks)\n\n' +
        'Hash: store an object\'s fields\n' +
        '- HSET user:42 name "Alice" email "alice@co.com" plan "pro"\n' +
        '- HGET user:42 name\n' +
        '- HGETALL user:42  → all fields\n' +
        '- Memory efficient: Redis optimises small hashes with ziplist encoding\n\n' +
        'List: ordered sequences\n' +
        '- LPUSH queue:emails "email1" "email2"  (left push)\n' +
        '- RPOP queue:emails  (right pop — FIFO queue)\n' +
        '- LRANGE feed:user:42 0 49  (get first 50 items of feed)\n\n' +
        'Set: unique unordered collection\n' +
        '- SADD online_users "user:42" "user:77"\n' +
        '- SISMEMBER online_users "user:42"  → 1 or 0\n' +
        '- SUNION, SINTER, SDIFF for set operations\n\n' +
        'Sorted Set (ZSet): scored leaderboard\n' +
        '- ZADD leaderboard 9850 "alice" 8200 "bob" 9100 "carol"\n' +
        '- ZRANGE leaderboard 0 9 REV WITHSCORES  (top 10 with scores)\n' +
        '- ZRANK leaderboard "alice"  → rank (0-indexed)\n\n' +
        'Stream: append-only event log (Kafka-lite)\n' +
        '- XADD events * action "purchase" user "42" amount "99.99"\n' +
        '- XREAD COUNT 100 STREAMS events 0  (consume events)',
      example:
        'Feature flag system with Redis Hashes:\n\n' +
        '# Store feature flags as a hash\n' +
        'HSET features dark_mode "true" new_checkout "false" ai_assistant "true"\n\n' +
        '# Check flag in application (sub-millisecond)\n' +
        'HGET features dark_mode  → "true"\n\n' +
        '# Update flag instantly (propagates to all app servers on next HGET)\n' +
        'HSET features new_checkout "true"\n\n' +
        '# In Python:\n' +
        'r = redis.Redis(host=\'localhost\', port=6379)\n' +
        'if r.hget("features", "dark_mode") == b"true":\n' +
        '    show_dark_mode_toggle()\n\n' +
        'This pattern lets you roll out features without deploys.\n' +
        'Querying flags in PostgreSQL would take 2–10ms per request.\n' +
        'Redis: <0.2ms. At 50,000 requests/sec: Redis saves 100+ CPU seconds per second.',
    },
    {
      title: 'Caching Patterns with Redis',
      icon: '⚡',
      layman:
        'The most common use of Redis is caching: storing the results of expensive database queries so subsequent requests can get the same data instantly from Redis instead of hitting the database. ' +
        'This is like remembering an answer you looked up before — instead of re-researching, you recall it instantly. ' +
        'Cache correctly and your database handles 10× less traffic. Cache incorrectly and users see stale data or your cache becomes useless.',
      technical:
        'Cache-Aside (Lazy Loading) — most common pattern:\n' +
        '1. Read: check cache first. If hit → return. If miss → read DB, write to cache, return.\n' +
        '2. Write: write to DB. Invalidate or update cache.\n' +
        '- Pros: cache only what is needed, database is source of truth\n' +
        '- Cons: first request after cache miss/expiry always hits DB (cold start)\n\n' +
        'Write-Through:\n' +
        '- Write to cache AND DB simultaneously on every write\n' +
        '- Pros: cache always fresh\n' +
        '- Cons: write latency doubles; cache may store data never read (waste of memory)\n\n' +
        'Write-Behind (Write-Back):\n' +
        '- Write to cache immediately, persist to DB asynchronously\n' +
        '- Pros: very fast writes\n' +
        '- Cons: risk of data loss if cache fails before async write\n\n' +
        'TTL (Time-To-Live) strategy:\n' +
        '- Short TTL (10–60s): frequently changing data (stock prices, user presence)\n' +
        '- Medium TTL (5–30min): user profiles, product details\n' +
        '- Long TTL (1–24hr): static content, geo lookups, configuration\n' +
        '- No TTL: manually invalidated (feature flags, A/B test assignments)\n\n' +
        'Cache eviction policies:\n' +
        '- LRU (Least Recently Used): evict items not accessed recently — most common\n' +
        '- LFU (Least Frequently Used): evict items accessed least often\n' +
        '- FIFO: evict oldest items\n' +
        '- TTL: evict on expiry',
      example:
        'User profile caching in a social app:\n\n' +
        'async function getUserProfile(userId) {\n' +
        '  const cacheKey = `user:profile:${userId}`;\n\n' +
        '  // 1. Check cache\n' +
        '  const cached = await redis.get(cacheKey);\n' +
        '  if (cached) return JSON.parse(cached);\n\n' +
        '  // 2. Cache miss — query database\n' +
        '  const profile = await db.query(\n' +
        '    `SELECT u.*, p.bio, p.avatar, COUNT(f.id) as followers\n' +
        '     FROM users u JOIN profiles p ON u.id = p.user_id\n' +
        '     LEFT JOIN follows f ON u.id = f.following_id\n' +
        '     WHERE u.id = $1 GROUP BY u.id, p.id`, [userId]\n' +
        '  );\n\n' +
        '  // 3. Store in cache with 5-minute TTL\n' +
        '  await redis.setex(cacheKey, 300, JSON.stringify(profile));\n\n' +
        '  return profile;\n' +
        '}\n\n' +
        '// Cache invalidation on profile update:\n' +
        'async function updateProfile(userId, data) {\n' +
        '  await db.query(`UPDATE profiles SET bio=$2 WHERE user_id=$1`, [userId, data.bio]);\n' +
        '  await redis.del(`user:profile:${userId}`);  // invalidate cache\n' +
        '}\n\n' +
        'Cache hit rate target: >90%. At 95% hit rate with 5ms DB reads:\n' +
        'Average latency = (0.95 × 0.2ms) + (0.05 × 5ms) = 0.44ms\n' +
        'Without cache: 5ms. Cache gives 10× latency improvement.',
      whenToUse:
        'Cache data that is: read much more than written, expensive to compute, tolerable if slightly stale. Do not cache: financial calculations requiring real-time accuracy, or data that changes with every request.',
    },
    {
      title: 'Session Storage and Authentication',
      icon: '🔑',
      layman:
        'When a user logs into a web application, the server needs to remember who they are across multiple requests. ' +
        'This is called session management. ' +
        'Storing sessions in a database works but is slow — every API request requires a database query just to verify who the user is. ' +
        'Redis is the standard solution: sessions are stored in Redis with a short TTL, and session lookups take microseconds instead of milliseconds.',
      technical:
        'Session design in Redis:\n' +
        '- Key: "session:{session_id}" (session_id is a cryptographically random UUID)\n' +
        '- Value: JSON-encoded session data {user_id, email, roles, created_at}\n' +
        '- TTL: 30 minutes (renew on each request to keep active sessions alive)\n\n' +
        'Session flow:\n' +
        '1. Login: verify credentials in DB → create session in Redis → set cookie with session_id\n' +
        '2. Request: read session_id from cookie → GET session:{id} in Redis → verify user\n' +
        '3. Logout: DEL session:{id} → clear cookie\n' +
        '4. Expiry: inactive sessions expire automatically via TTL\n\n' +
        'JWT vs Redis sessions:\n' +
        'JWT (stateless):\n' +
        '- Token contains all user info, signed with secret\n' +
        '- No server-side storage needed\n' +
        '- Cannot revoke individual tokens before expiry (major limitation)\n' +
        '- Good for: microservices authentication, mobile apps\n\n' +
        'Redis sessions (stateful):\n' +
        '- Session can be invalidated instantly (DEL session:{id})\n' +
        '- Can store arbitrary session state\n' +
        '- Requires Redis as a shared session store across all app servers\n' +
        '- Good for: web apps where instant logout/revocation matters\n\n' +
        'Hybrid: JWT + Redis token blocklist\n' +
        '- Use JWT for performance, but maintain a Redis blocklist of revoked JTIs\n' +
        '- On logout: add JWT ID to blocklist with TTL = JWT remaining validity',
      example:
        'Redis session in Express.js:\n\n' +
        'const session = require("express-session");\n' +
        'const RedisStore = require("connect-redis").default;\n' +
        'const redis = new Redis({ host: "redis-cluster" });\n\n' +
        'app.use(session({\n' +
        '  store: new RedisStore({ client: redis }),\n' +
        '  secret: process.env.SESSION_SECRET,\n' +
        '  resave: false,\n' +
        '  saveUninitialized: false,\n' +
        '  cookie: { maxAge: 1800000, httpOnly: true, secure: true }  // 30 min, HTTPS only\n' +
        '}));\n\n' +
        '// Login handler:\n' +
        'app.post("/login", async (req, res) => {\n' +
        '  const user = await db.verifyCredentials(req.body.email, req.body.password);\n' +
        '  if (!user) return res.status(401).json({ error: "Invalid credentials" });\n' +
        '  req.session.userId = user.id;\n' +
        '  req.session.roles = user.roles;\n' +
        '  res.json({ success: true });\n' +
        '});\n\n' +
        '// Authenticated request:\n' +
        '// express-session automatically reads cookie, fetches session from Redis\n' +
        '// req.session.userId is available instantly, no DB query needed',
    },
    {
      title: 'Rate Limiting and Distributed Locks',
      icon: '🚦',
      layman:
        'Rate limiting controls how many times a user or IP can perform an action in a time period. ' +
        '"You can send 100 API requests per minute. If you exceed that, we return a 429 error." ' +
        'Redis is perfect for this: a counter per user, per minute, with atomic increment and automatic expiry. ' +
        'Distributed locks solve a different problem: making sure only one server runs a job at a time — like ensuring only one machine sends the daily digest email, even if 10 app servers are running.',
      technical:
        'Rate limiting — sliding window with Redis:\n\n' +
        'Method 1: Fixed window (simple, less accurate)\n' +
        'key = "rate:{user_id}:{minute_timestamp}"\n' +
        'count = INCR key\n' +
        'EXPIRE key 60  (only on first request)\n' +
        'if count > limit: reject\n\n' +
        'Method 2: Sliding window with sorted set (accurate)\n' +
        'key = "rate:{user_id}"\n' +
        'now = current_timestamp_ms\n' +
        'ZREMRANGEBYSCORE key 0 (now - 60000)  // remove requests older than 60s\n' +
        'ZADD key now now  // add this request\n' +
        'count = ZCARD key\n' +
        'EXPIRE key 60\n' +
        'if count > limit: reject\n\n' +
        'Method 3: Token bucket (allow bursting)\n' +
        '- INCR and DECR a "token" counter with a refill job\n' +
        '- Allows burst then throttle\n\n' +
        'Distributed lock with SETNX:\n' +
        'Lua script (atomic):\n' +
        'local lock = redis.call("SET", KEYS[1], ARGV[1], "NX", "PX", ARGV[2])\n' +
        'return lock\n\n' +
        '- "NX": only set if key does not exist (atomic claim)\n' +
        '- "PX 30000": auto-expire in 30s (release on crash)\n' +
        '- Value is a random UUID (release only your own lock)\n' +
        '- Redlock: Redis-based distributed lock across N instances for higher safety',
      example:
        'API rate limiting at Twitter scale:\n\n' +
        '// Lua script for atomic sliding window rate limit\n' +
        'const rateLimitScript = `\n' +
        '  local key = KEYS[1]\n' +
        '  local limit = tonumber(ARGV[1])\n' +
        '  local window = tonumber(ARGV[2])\n' +
        '  local now = tonumber(ARGV[3])\n' +
        '  redis.call("ZREMRANGEBYSCORE", key, 0, now - window)\n' +
        '  local count = redis.call("ZCARD", key)\n' +
        '  if count < limit then\n' +
        '    redis.call("ZADD", key, now, now)\n' +
        '    redis.call("EXPIRE", key, window / 1000)\n' +
        '    return 0  -- allowed\n' +
        '  end\n' +
        '  return 1  -- rate limited\n' +
        '`;\n\n' +
        'async function checkRateLimit(userId) {\n' +
        '  const result = await redis.eval(\n' +
        '    rateLimitScript, 1,\n' +
        '    `rate:api:${userId}`,  // key\n' +
        '    1000,                   // limit: 1000 requests\n' +
        '    60000,                  // window: 60 seconds\n' +
        '    Date.now()              // now\n' +
        '  );\n' +
        '  return result === 0;  // true = allowed\n' +
        '}\n\n' +
        '// This check: ~0.2ms. In PostgreSQL: ~5ms.\n' +
        '// At 100K API requests/sec: Redis saves 480 CPU seconds per second on rate limit checks alone.',
      whenToUse:
        'Rate limiting: always implement at the API gateway or application layer for public-facing APIs. Distributed locks: when coordinating background jobs across multiple app servers (cron jobs, batch processing, leader election).',
    },
    {
      title: 'Pub/Sub and Queues',
      icon: '📨',
      layman:
        'Redis supports two communication patterns. ' +
        'Pub/Sub (Publish/Subscribe): one service publishes a message to a channel, and all subscribers receive it instantly — like a group chat. ' +
        'Queues (with Lists or Streams): jobs are pushed to a list, and workers pop and process them — like a task queue where only one worker handles each job. ' +
        'These patterns decouple services: the sender does not need to know who receives the message.',
      technical:
        'Pub/Sub:\n' +
        'Publisher: PUBLISH notifications:user:42 \'{"type":"like","post_id":99}\'\n' +
        'Subscriber: SUBSCRIBE notifications:user:42\n' +
        '  → receives message immediately when published\n' +
        '- Fire and forget: if subscriber is offline, message is lost\n' +
        '- Use for: real-time notifications, live dashboards, chat (where message history is stored elsewhere)\n\n' +
        'Queue with Lists (Sidekiq pattern):\n' +
        'Enqueue: LPUSH queue:email_jobs \'{"to":"alice@co.com","template":"welcome"}\'\n' +
        'Worker: BRPOP queue:email_jobs 0  (blocking pop — waits for jobs)\n' +
        '- BRPOP blocks the worker until a job is available — no polling\n' +
        '- At-most-once delivery: if worker crashes after BRPOP but before processing, job is lost\n' +
        '- Sidekiq (Ruby), Celery (Python), BullMQ (Node.js) build reliable queues on Redis\n\n' +
        'Redis Streams (reliable, Kafka-lite):\n' +
        'Producer: XADD events * event "checkout" user_id "42" amount "99"\n' +
        'Consumer group: XREADGROUP GROUP workers consumer1 COUNT 10 STREAMS events >\n' +
        'Acknowledge: XACK events workers <message-id>\n' +
        '- Consumer groups: each message delivered to one consumer in the group\n' +
        '- XPENDING: track unacknowledged messages for retry\n' +
        '- Persistent: messages survive Redis restart (if AOF persistence enabled)\n' +
        '- Use for: event sourcing at small-medium scale, audit logs, inter-service events',
      example:
        'Real-time notification system:\n\n' +
        'Architecture:\n' +
        '- WebSocket server subscribes to Redis channel per user\n' +
        '- Backend services publish notifications to Redis\n' +
        '- WebSocket server delivers to connected user\n\n' +
        '// Backend: user gets a new follower\n' +
        'await redis.publish(\n' +
        '  `notifications:${userId}`,\n' +
        '  JSON.stringify({ type: "new_follower", from: followerId, ts: Date.now() })\n' +
        ');\n\n' +
        '// WebSocket server:\n' +
        'const subscriber = redis.duplicate();  // dedicated connection for subscribe\n' +
        'await subscriber.subscribe(`notifications:${userId}`);\n' +
        'subscriber.on("message", (channel, message) => {\n' +
        '  const notification = JSON.parse(message);\n' +
        '  // Send to user\'s WebSocket connection\n' +
        '  ws.send(JSON.stringify(notification));\n' +
        '});\n\n' +
        '// Caveat: if user is offline (no WebSocket), the message is lost.\n' +
        '// Solution: also store notification in PostgreSQL for offline users.\n' +
        '// Redis delivers to online users in real-time; DB serves offline users on next login.',
    },
    {
      title: 'Redis Persistence, Clustering, and Limits',
      icon: '🏗️',
      layman:
        'Redis stores data in RAM — which is fast but means data is lost when Redis restarts. ' +
        'Redis offers two persistence options: RDB snapshots (periodic full save to disk) and AOF (append every write to a file). ' +
        'For production, you want AOF for durability. ' +
        'For scale beyond one machine, Redis Cluster shards data across multiple nodes.',
      technical:
        'Persistence options:\n\n' +
        'RDB (Redis Database Backup — snapshot):\n' +
        '- Periodic full snapshot to disk (e.g., every 60s or when 1000 keys change)\n' +
        '- Fast restart: load snapshot on boot\n' +
        '- Risk: up to 60 seconds of data loss on crash\n' +
        '- Good for: cache-only use (data loss acceptable)\n\n' +
        'AOF (Append Only File):\n' +
        '- Log every write command to file\n' +
        '- fsync options: always (safest, slowest), everysecond (default, max 1s loss), no\n' +
        '- Larger files, slower restart, but near-zero data loss\n' +
        '- Good for: sessions, queues, any durable data\n\n' +
        'Redis Cluster:\n' +
        '- 16384 hash slots distributed across N master nodes\n' +
        '- Each master + 1+ replica(s)\n' +
        '- Automatic failover: replica promoted if master fails\n' +
        '- Multi-key operations must use hash tags: {user:42}:name and {user:42}:session\n' +
        '  → forces both keys to same shard\n' +
        '- Redis Cluster vs Redis Sentinel:\n' +
        '  Sentinel: monitors single-shard Redis, manages failover\n' +
        '  Cluster: sharding + replication + failover built-in\n\n' +
        'Memory limits:\n' +
        '- maxmemory: set max RAM usage (e.g., 4GB)\n' +
        '- maxmemory-policy: what to do when full:\n' +
        '  - allkeys-lru: evict least recently used keys (good for caches)\n' +
        '  - volatile-lru: evict only TTL-keyed items (protect persistent data)\n' +
        '  - noeviction: return error on new writes (good for queues)\n\n' +
        'Managed Redis:\n' +
        '- AWS ElastiCache for Redis: managed cluster, multi-AZ\n' +
        '- Redis Cloud: Redis Inc. managed service, global active-active\n' +
        '- Upstash: serverless Redis, pay-per-request',
      example:
        'Production Redis configuration for a session store:\n\n' +
        '# redis.conf for session storage (durability required)\n' +
        'maxmemory 4gb\n' +
        'maxmemory-policy volatile-lru  # evict expired-key items first\n' +
        'appendonly yes                 # AOF enabled\n' +
        'appendfsync everysecond        # max 1 second data loss\n' +
        'save ""                        # disable RDB (AOF is primary)\n' +
        'bind 0.0.0.0                   # listen on all interfaces\n' +
        'requirepass ${REDIS_PASSWORD}  # authentication\n' +
        'protected-mode yes\n\n' +
        '# Deployment: 3-node Redis Cluster\n' +
        '# Node 1 (master) + Node 2 (master) + Node 3 (master)\n' +
        '# Each with 1 replica = 6 nodes total\n' +
        '# Handles 1 node failure without downtime\n' +
        '# Total capacity: ~12GB (3 × 4GB) distributed across 16384 slots',
    },
  ],

  comparison: {
    caption: 'Redis vs Memcached vs DynamoDB — key-value store comparison',
    columns: ['Feature', 'Redis', 'Memcached', 'DynamoDB'],
    rows: [
      ['Data structures', 'Rich: strings, hash, list, set, zset, stream', 'Strings only', 'Items with attributes'],
      ['Persistence', '✅ RDB + AOF', '❌ In-memory only', '✅ Automatic (managed)'],
      ['Pub/Sub', '✅ Native', '❌', '❌ (use SNS/SQS)'],
      ['Clustering', '✅ Redis Cluster', '✅ Client-side', '✅ Automatic (managed)'],
      ['Transactions', '🟡 MULTI/EXEC (watch)', '❌', '✅ ACID transactions'],
      ['Max value size', '512MB per key', '1MB per key', '400KB per item'],
      ['Use case', 'Cache, sessions, queues, real-time', 'Simple caching only', 'Persistent durable KV at scale'],
    ],
  },

  realWorldExamples: [
    {
      company: 'Twitter',
      icon: '🐦',
      description:
        'Twitter uses Redis for their home timeline materialisation. ' +
        'When you post a tweet, it is "fanned out" to each follower\'s timeline in Redis (using sorted sets, ordered by timestamp). ' +
        'When a user opens Twitter, their timeline is retrieved directly from Redis — no complex database query aggregating tweets from everyone they follow. ' +
        'This fan-out-on-write approach trades write amplification (writing to 10,000 follower timelines) for fast reads. ' +
        'For celebrities with 100M followers, a hybrid approach is used: some followers get materialized timelines, others compute on-read.',
    },
    {
      company: 'GitHub',
      icon: '🐙',
      description:
        'GitHub uses Redis (via Sidekiq) for their background job system. ' +
        'When you push code, GitHub needs to: trigger CI/CD, update contribution graphs, notify watchers, run security scans, update search indexes. ' +
        'All of this happens asynchronously via Redis-backed Sidekiq queues. ' +
        'The push response is instant; the heavy work is queued. ' +
        'GitHub processes millions of Sidekiq jobs per day across hundreds of workers, all coordinated through Redis.',
    },
    {
      company: 'Snapchat',
      icon: '👻',
      description:
        'Snapchat uses Redis for their "Snap Score" leaderboards and friend presence (online/offline status). ' +
        'Redis sorted sets store user scores ordered by their snap count — ZADD and ZRANK operations are O(log N) and handle millions of updates per second. ' +
        'Friend presence uses Redis pub/sub: when a user comes online, a message is published, and all friends subscribed to that channel receive the update within milliseconds. ' +
        'This powers the green dot indicator showing friends who are currently online.',
    },
  ],

  interviewQuestions: [
    {
      question: 'How would you implement a leaderboard using Redis?',
      answer:
        'Use a Redis Sorted Set (ZSET). ' +
        'ZADD leaderboard {score} {userId} — add or update a player\'s score. O(log N). ' +
        'ZINCRBY leaderboard {delta} {userId} — atomically increment score. ' +
        'ZRANGE leaderboard 0 9 REV WITHSCORES — get top 10 with scores, O(log N + K). ' +
        'ZRANK leaderboard {userId} — get a user\'s rank (0-indexed). ' +
        'The sorted set maintains order automatically. Millions of score updates per second are feasible. ' +
        'For weekly/monthly leaderboards: create a new key per period (leaderboard:2024:W21) with TTL. ' +
        'The pitfall to mention: ZSETs are sorted by score, not by name — if two players have the same score, you need a tie-breaking rule (e.g., encode timestamp into score to ensure lower insertion time ranks higher).',
    },
    {
      question: 'What is a cache stampede and how do you prevent it?',
      answer:
        'A cache stampede (also called thundering herd) occurs when a hot cache key expires and many concurrent requests all find a cache miss simultaneously, all racing to recompute the same expensive value and all hammering the database at once. ' +
        'Prevention strategies: ' +
        '(1) Mutex locking: first request acquires a Redis lock and computes; others wait. SET lock:key "" NX PX 5000. If lock fails, return stale data or a loading state. ' +
        '(2) Probabilistic early expiry: before TTL expires, with some probability recompute proactively. Prevents sharp expiry spikes. ' +
        '(3) Stale-while-revalidate: return the stale cached value immediately, recompute in background. ' +
        '(4) Never expire hot keys: manually invalidate when data changes, no TTL. Requires discipline in the application.',
    },
    {
      question: 'When should you NOT use Redis?',
      answer:
        'Five situations: ' +
        '(1) Data must survive Redis outage completely intact without any loss — Redis AOF has at most 1 second of loss; for financial audit trails, use a database. ' +
        '(2) Dataset exceeds available RAM — Redis is in-memory; at $0.10/GB/month for RAM vs $0.10/TB/month for SSDs, very large datasets are expensive in Redis. ' +
        '(3) You need complex querying — Redis is a key-based lookup system; if you need to query by multiple fields, filter, or aggregate, use a database. ' +
        '(4) You need strong consistency for multi-key operations without careful design — Redis transactions (MULTI/EXEC) do not roll back on error. ' +
        '(5) Using Redis as a primary database for business data — Redis is a cache and auxiliary store; business data belongs in a durable ACID database with proper backups.',
    },
    {
      question: 'Design a distributed rate limiter using Redis',
      answer:
        'Use the sliding window algorithm with Redis sorted sets for accuracy. ' +
        'Key: rate:{user_id}:{endpoint}. ' +
        'On each request: (1) ZREMRANGEBYSCORE to remove entries older than the window. (2) ZCARD to count remaining requests. (3) If count < limit: ZADD the current timestamp and EXPIRE the key. Else: reject with 429. ' +
        'Wrap in a Lua script for atomicity (prevents race conditions between the check and the add). ' +
        'For distributed systems with multiple rate limit nodes: use Redis Cluster and ensure the rate limit key for a given user always routes to the same shard (using hash tags: {user:42}). ' +
        'Return rate limit headers in the response: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset.',
    },
  ],

  commonMistakes: [
    'Using Redis as a primary database — it is in-memory; business data must live in a durable database; use Redis as a cache layer on top',
    'Not setting TTL on cached keys — memory fills up, Redis starts evicting items, cache hit rate drops; always set TTLs on cache data',
    'Storing too much data per key — Redis holds each value in RAM; a cached SQL result with 10,000 rows is wasteful; cache only what you need',
    'Not handling cache misses gracefully — a cold cache (after deploy or Redis restart) sends all traffic to the database; design for cache miss storms',
    'Using Redis KEYS command in production — KEYS * scans all keys and blocks Redis for seconds on large datasets; use SCAN with COUNT instead',
    'Not enabling AOF persistence for non-cache data (sessions, queues) — Redis restarts lose all in-memory data if persistence is not configured',
    'Forgetting about Redis as a single point of failure — always deploy Redis with replicas and failover (Sentinel or Cluster) for production systems',
  ],
};
