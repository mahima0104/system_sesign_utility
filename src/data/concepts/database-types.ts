import type { ConceptDeepDive } from '../../types';

export const databaseTypes: ConceptDeepDive = {
  moduleId: 'database-types',
  tagline: 'The right database for the right problem — why one size never fits all',

  introduction: {
    layman:
      'Imagine you run a city. You need different filing systems for different things: ' +
      'a phonebook (name → phone number), a hospital (patient records with relationships to doctors and treatments), ' +
      'a social network (who is friends with whom, six degrees of separation), and a weather station (temperature every 10 seconds for 10 years). ' +
      'Using a single filing system for all of these would be a disaster. Databases are the same. ' +
      'A relational database is fantastic for your hospital — but terrible for your social network. ' +
      'A graph database handles "friends of friends" queries effortlessly — but would be absurdly complex for storing weather data. ' +
      'The database landscape evolved because engineers kept building the wrong tool for the wrong problem and suffering the consequences.',
    analogy:
      'Think of databases like vehicles. A sports car (relational DB) is fast and precise on paved roads (structured data, complex queries). ' +
      'A pickup truck (document DB) can carry irregular loads (flexible schema). ' +
      'A motorcycle (key-value store) weaves through traffic instantly (low latency lookups). ' +
      'A train (wide-column DB) moves massive cargo efficiently in one direction (write-heavy time-series). ' +
      'A GPS system (graph DB) specialises in finding connections and routes. ' +
      'You would never take a sports car off-roading — and you would never haul freight with a motorcycle.',
    whyMatters:
      'In system design interviews, "which database do you use and why?" is a guaranteed question. ' +
      'Candidates who say "PostgreSQL for everything" or "just use MongoDB" immediately signal limited experience. ' +
      'Senior engineers know that database choice is one of the most consequential architectural decisions — it affects query patterns, scalability, consistency guarantees, and operational complexity for years. ' +
      'At companies like Netflix, Uber, and Airbnb, they use 5–8 different database types simultaneously, each for a specific purpose.',
  },

  subTopics: [
    {
      title: 'Relational Databases (RDBMS)',
      icon: '📊',
      layman:
        'Relational databases store data in tables — rows and columns, like a spreadsheet. ' +
        'The power comes from relationships: an "orders" table links to a "customers" table via customer_id. ' +
        'You write SQL queries to join, filter, and aggregate. ' +
        'PostgreSQL, MySQL, and SQL Server are the workhorses of most enterprise applications built in the last 40 years.',
      technical:
        'Key properties:\n' +
        '- ACID transactions: Atomicity, Consistency, Isolation, Durability — every write either fully succeeds or fully fails\n' +
        '- Structured schema: defined columns with types enforced by the database engine\n' +
        '- SQL: declarative query language for JOINs, aggregations, subqueries, window functions\n' +
        '- Referential integrity: foreign keys prevent orphaned records\n' +
        '- B-Tree indexes for fast lookups (O(log n))\n\n' +
        'When to use:\n' +
        '- Complex relationships between entities (users, orders, products, payments)\n' +
        '- Need for ACID transactions (banking, e-commerce, inventory)\n' +
        '- Rich querying with JOINs and aggregations\n' +
        '- Schema is well-known and stable\n\n' +
        'Scaling limits:\n' +
        '- Vertical scaling (bigger machine) up to ~128 cores / 10TB\n' +
        '- Read replicas for read scaling\n' +
        '- Sharding is possible but complex (Vitess, Citus)\n' +
        '- Write throughput caps at ~50K–100K TPS on single instance\n\n' +
        'Popular choices: PostgreSQL (OLTP + JSON), MySQL (web apps), CockroachDB (distributed SQL)',
      example:
        'Airbnb uses PostgreSQL for their core listing and booking data:\n' +
        '- users table (id, email, name, payment_info)\n' +
        '- listings table (id, host_id, location, price_per_night)\n' +
        '- bookings table (id, guest_id, listing_id, check_in, check_out, status)\n\n' +
        'A single booking requires: check user exists, check listing available, charge payment, create booking record.\n' +
        'All four steps must succeed or all fail → ACID transaction. ' +
        'Relational DB is perfect here. Trying to do this in a pure document DB without transactions was a nightmare before MongoDB 4.0.',
      whenToUse:
        'Default choice for most applications. Start here unless you have a specific reason (massive scale, schema flexibility, graph traversal, time-series) to use something else.',
    },
    {
      title: 'Document Databases',
      icon: '📄',
      layman:
        'Document databases store data as JSON-like documents. Instead of splitting user data across 5 related tables, ' +
        'you store everything about a user in one document: their profile, preferences, and recent activity all together. ' +
        'Reading is fast because you get all the data you need in one shot. ' +
        'The schema is flexible — different documents in the same collection can have different fields. ' +
        'MongoDB and Firestore are the most popular choices.',
      technical:
        'Key properties:\n' +
        '- Documents: JSON/BSON objects with nested arrays and objects\n' +
        '- Schema flexibility: each document can have different fields (schema-on-read)\n' +
        '- Horizontal scaling built-in: native sharding across multiple machines\n' +
        '- No JOINs (by design): embed related data or use application-level references\n\n' +
        'Embedding vs referencing:\n' +
        '- Embed: put related data inside the document (blog post with its comments array)\n' +
        '  Pros: one read, no joins. Cons: document grows unboundedly, data duplicated\n' +
        '- Reference: store an ID and look up separately (like a foreign key)\n' +
        '  Pros: data normalised. Cons: multiple reads, no guaranteed consistency\n\n' +
        'When to use:\n' +
        '- Highly variable schema (product catalogs with different attributes per product)\n' +
        '- Hierarchical data that maps naturally to documents (user profiles, CMS content)\n' +
        '- High write throughput without complex join requirements\n' +
        '- Rapid iteration (schema changes without migrations)\n\n' +
        'Popular choices: MongoDB (general purpose), Firestore (mobile/web apps), CouchDB (offline-first)',
      example:
        'Amazon product catalog:\n' +
        'A "Book" has: title, author, ISBN, pages, publisher.\n' +
        'A "Laptop" has: brand, CPU, RAM, storage, display_size, weight.\n' +
        'A "T-Shirt" has: size[], color[], material, care_instructions.\n\n' +
        'In a relational DB: you would need a products table + multiple attribute tables + complex joins.\n' +
        'In MongoDB:\n' +
        '{ "_id": "B001", "type": "Book", "title": "DDIA", "author": "Kleppmann", "pages": 562 }\n' +
        '{ "_id": "L002", "type": "Laptop", "brand": "Apple", "RAM": "16GB", "display_size": 14 }\n\n' +
        'Different shapes, same collection. Adding a new product type requires zero schema changes.',
      whenToUse:
        'When your data is naturally hierarchical/document-shaped, your schema evolves rapidly, or you need horizontal write scaling. Avoid when you need complex multi-document transactions or frequent cross-collection joins.',
    },
    {
      title: 'Key-Value Stores',
      icon: '🔑',
      layman:
        'The simplest database possible: you store a value under a key, and you retrieve it by that key. ' +
        'Like a giant dictionary or hashtable. No queries, no joins, no schema. ' +
        'Just PUT(key, value) and GET(key). ' +
        'This extreme simplicity makes them blindingly fast — Redis can handle 1 million operations per second on a single machine. ' +
        'Redis, DynamoDB, and Memcached are the most common examples.',
      technical:
        'Key properties:\n' +
        '- O(1) get/set by key: no searching, no scanning\n' +
        '- In-memory (Redis, Memcached) or on-disk (DynamoDB)\n' +
        '- Optional TTL: keys automatically expire after N seconds\n' +
        '- No query language: you get exactly what you look up by key\n\n' +
        'Redis data structures (beyond simple strings):\n' +
        '- Strings: cached values, counters\n' +
        '- Hashes: user sessions, object fields\n' +
        '- Lists: queues, feeds\n' +
        '- Sets: unique tags, followers\n' +
        '- Sorted sets: leaderboards, range queries by score\n' +
        '- Streams: append-only event logs\n\n' +
        'When to use:\n' +
        '- Caching: cache database query results to avoid repeated expensive queries\n' +
        '- Session storage: user session data keyed by session_id\n' +
        '- Rate limiting: INCR user:api_calls and check against limit\n' +
        '- Leaderboards: sorted sets ordered by score\n' +
        '- Pub/Sub messaging: real-time event broadcasting\n' +
        '- Distributed locks: SETNX (set if not exists)\n\n' +
        'Limits: no complex querying, data must fit in RAM (for in-memory), limited transaction support',
      example:
        'Twitter rate limiting with Redis:\n' +
        'Key: "rate:user:12345:api"\n' +
        'Value: request count (integer)\n' +
        'TTL: 3600 seconds (1 hour)\n\n' +
        'Every API request:\n' +
        '1. INCR rate:user:12345:api → returns new count\n' +
        '2. If count > 1000: reject with 429 Too Many Requests\n' +
        '3. If first request: SET TTL to 3600s\n\n' +
        'This check takes <0.1ms. Doing it in PostgreSQL would add 5–20ms per request and kill the DB under load.',
      whenToUse:
        'Caching, sessions, rate limiting, leaderboards, feature flags, distributed locks. Always use alongside a primary database — not as a replacement.',
    },
    {
      title: 'Wide-Column Databases',
      icon: '📋',
      layman:
        'Wide-column databases look like tables on the surface, but they behave very differently from relational databases. ' +
        'The key difference: each row can have completely different columns, and there can be thousands of columns per row. ' +
        'They are designed for massive scale — Cassandra handles millions of writes per second across hundreds of machines. ' +
        'The catch: you design your data around your queries, not the other way around. ' +
        'They excel at time-series data and write-heavy workloads.',
      technical:
        'Architecture:\n' +
        '- Data stored in column families (groups of related columns)\n' +
        '- Rows keyed by a partition key + optional clustering columns\n' +
        '- Each partition lives on specific nodes (consistent hashing)\n' +
        '- LSM-tree storage: writes go to in-memory memtable, flushed to SSTable on disk\n\n' +
        'Cassandra specifics:\n' +
        '- Partition key determines which node holds the row\n' +
        '- Clustering columns determine sort order within a partition\n' +
        '- Replication factor: how many nodes hold each row copy\n' +
        '- Tunable consistency: QUORUM, ONE, ALL — trade consistency for speed\n' +
        '- CQL (Cassandra Query Language): SQL-like but no JOINs, no subqueries\n\n' +
        'Data modeling rule: design tables around access patterns, not data relationships.\n' +
        '"Which queries will I run?" → "Build a table for each query"\n\n' +
        'When to use:\n' +
        '- Write-heavy workloads (>100K writes/sec)\n' +
        '- Time-series data (IoT, metrics, logs)\n' +
        '- Global distribution with multi-master writes\n' +
        '- Data that can be accessed by a known partition key',
      example:
        'Netflix uses Cassandra for viewing history:\n\n' +
        'Table design: user_watch_history\n' +
        '  partition_key: user_id\n' +
        '  clustering_key: watched_at DESC\n' +
        '  columns: title_id, progress_seconds, device\n\n' +
        'Query: "Get last 20 shows user 42 watched"\n' +
        'SELECT * FROM user_watch_history WHERE user_id = 42 LIMIT 20;\n\n' +
        'Why this works:\n' +
        '- Partition key routes to correct node (O(1))\n' +
        '- Clustering by watched_at DESC means latest entries first — no sorting\n' +
        '- Netflix has 230M users × multiple daily events = billions of writes/day\n' +
        '- Cassandra handles this with zero downtime across 30+ data centers',
      whenToUse:
        'Massive write throughput, time-series data, global multi-region writes. Avoid when you need ad-hoc queries, joins, or frequent schema changes.',
    },
    {
      title: 'Graph Databases',
      icon: '🕸️',
      layman:
        'Graph databases are built around relationships. ' +
        'Instead of storing data in tables or documents, you store nodes (entities) and edges (relationships between them). ' +
        '"Alice follows Bob who follows Carol who works at Acme" is trivially represented as a graph. ' +
        'Finding "who does Alice know within 3 degrees?" is a single graph traversal query — in a relational DB, it would require recursive CTEs or multiple JOINs. ' +
        'LinkedIn, Facebook, and fraud detection systems rely heavily on graph databases.',
      technical:
        'Property graph model:\n' +
        '- Nodes: entities (Person, Product, Account)\n' +
        '- Edges: directed relationships (FOLLOWS, PURCHASED, OWNS)\n' +
        '- Properties: key-value pairs on both nodes and edges\n' +
        '  e.g., edge TRANSFERRED {amount: 500, currency: "USD", timestamp: ...}\n\n' +
        'Query languages:\n' +
        '- Cypher (Neo4j): MATCH (a:Person)-[:FOLLOWS]->(b:Person) RETURN b.name\n' +
        '- Gremlin (Apache TinkerPop): g.V().has("name","Alice").out("FOLLOWS").values("name")\n' +
        '- SPARQL (RDF triples): for semantic web/knowledge graphs\n\n' +
        'When to use:\n' +
        '- Social networks: friends, followers, recommendations\n' +
        '- Fraud detection: detect rings of linked suspicious accounts\n' +
        '- Knowledge graphs: Google Knowledge Graph, enterprise ontologies\n' +
        '- Recommendation engines: "users who bought X also bought Y"\n' +
        '- Access control: hierarchical permissions and roles\n\n' +
        'Popular: Neo4j (most mature), Amazon Neptune, ArangoDB (multi-model)',
      example:
        'LinkedIn "People You May Know" (PYMK):\n\n' +
        'Graph: 900M member nodes, billions of connection edges\n\n' +
        'Query: "Find friends of Alice\'s friends who Alice doesn\'t know yet"\n' +
        'In Cypher:\n' +
        'MATCH (alice:Member {id:1})-[:CONNECTED]->(friend:Member)-[:CONNECTED]->(fof:Member)\n' +
        'WHERE NOT (alice)-[:CONNECTED]->(fof) AND fof <> alice\n' +
        'RETURN fof, COUNT(*) as mutualCount ORDER BY mutualCount DESC LIMIT 10\n\n' +
        'This traverses two hops in the graph. In SQL:\n' +
        'SELECT fof.id, COUNT(*) FROM connections c1\n' +
        'JOIN connections c2 ON c1.to_id = c2.from_id\n' +
        'LEFT JOIN connections c3 ON c1.from_id = c3.from_id AND c2.to_id = c3.to_id\n' +
        'WHERE c1.from_id = 1 AND c3.to_id IS NULL GROUP BY fof.id\n' +
        'The SQL becomes exponentially more complex at 3+ hops. Graph DBs handle this natively.',
      whenToUse:
        'When the primary queries are about relationships and traversals, not simple lookups. If you are doing many-hop traversals or relationship-heavy analytics, a graph DB outperforms SQL by orders of magnitude.',
    },
    {
      title: 'Time-Series Databases',
      icon: '📈',
      layman:
        'Time-series databases are optimised for data that is always stamped with a timestamp and queried by time ranges. ' +
        'Think: CPU usage every 10 seconds, stock prices every millisecond, IoT sensor readings every minute. ' +
        'They compress this data extremely efficiently (similar readings close in time compress well) and answer queries like ' +
        '"average CPU over last 5 minutes" or "max temperature yesterday" in milliseconds, ' +
        'even with billions of data points. InfluxDB, TimescaleDB, and Prometheus are the leaders.',
      technical:
        'Optimisations specific to time-series:\n' +
        '- Time-based partitioning: data chunked by time window (hourly, daily), old chunks compressed and archived\n' +
        '- Delta encoding: store differences between consecutive values (CPU: 45, +2, -1, +3...)\n' +
        '- Gorilla compression: float compression by XOR of consecutive values (Facebook\'s algorithm)\n' +
        '- Automatic downsampling: raw data kept for 7 days, 1-minute aggregates for 90 days, hourly for 2 years\n' +
        '- Optimised aggregation functions: rollups, rate of change, moving averages built-in\n\n' +
        'Data model:\n' +
        '- Measurement/metric name (e.g., "cpu_usage")\n' +
        '- Tags: indexed metadata (host="web-01", region="us-east")\n' +
        '- Fields: the actual values (value=87.3)\n' +
        '- Timestamp: nanosecond precision\n\n' +
        'When to use:\n' +
        '- Infrastructure monitoring: CPU, memory, network, disk\n' +
        '- Application metrics: request latency percentiles, error rates\n' +
        '- IoT: temperature, humidity, GPS coordinates\n' +
        '- Financial: tick data, trade prices\n' +
        '- Real-time analytics dashboards',
      example:
        'Cloudflare monitoring infrastructure:\n' +
        '- 100 trillion data points ingested per day\n' +
        '- Metrics: HTTP requests, DNS queries, latency, error rates per data center\n\n' +
        'InfluxDB line protocol ingestion:\n' +
        'http_requests,datacenter=SFO,status=200 count=15234 1716000000000000000\n' +
        'http_requests,datacenter=SFO,status=500 count=12 1716000000000000000\n\n' +
        'Query (Flux):\n' +
        'from(bucket:"metrics") |> range(start: -5m)\n' +
        '  |> filter(fn: (r) => r["_measurement"] == "http_requests")\n' +
        '  |> aggregateWindow(every: 1m, fn: sum)\n\n' +
        'Returns: per-minute request counts for the last 5 minutes.\n' +
        'PostgreSQL doing this query on the same dataset: 30–60 seconds. InfluxDB: <100ms.',
      whenToUse:
        'Any data that is always associated with a timestamp and queried by time ranges. Do not use for operational data with complex relationships — combine with a relational DB (time-series for metrics, relational for business data).',
    },
    {
      title: 'Vector Databases',
      icon: '🤖',
      layman:
        'Vector databases are the newest type, born from the AI era. ' +
        'They store data as high-dimensional vectors — lists of hundreds or thousands of numbers that represent the "meaning" of something. ' +
        'A sentence like "I love machine learning" becomes a vector of 1,536 numbers. ' +
        'Two sentences with similar meaning have similar vectors (they are "close" in vector space). ' +
        'The database specialises in finding the most similar vectors to a query vector — this powers semantic search, recommendations, and RAG (Retrieval Augmented Generation) for AI chatbots.',
      technical:
        'Core concept: embedding vectors\n' +
        '- Text, images, audio are converted to dense float vectors by a neural network model\n' +
        '- Similar items are close in vector space (measured by cosine similarity or dot product)\n' +
        '- "Nearest neighbor search": given query vector, find top-K most similar stored vectors\n\n' +
        'Indexing algorithms:\n' +
        '- HNSW (Hierarchical Navigable Small World): graph-based ANN index. Best query speed.\n' +
        '- IVF (Inverted File Index): cluster vectors, search only nearest clusters. Better memory.\n' +
        '- ScaNN (Google): product quantisation for billion-scale datasets\n\n' +
        'Key metrics:\n' +
        '- Recall: % of true nearest neighbours returned (vs. exact results)\n' +
        '- QPS: queries per second at given recall level\n' +
        '- Index build time vs. query latency trade-off\n\n' +
        'Use cases:\n' +
        '- Semantic search: "find documents about machine learning" (not keyword match)\n' +
        '- RAG: retrieve relevant context chunks for LLM prompts\n' +
        '- Recommendation: find products similar to what user interacted with\n' +
        '- Duplicate detection: find near-duplicate images or documents\n\n' +
        'Popular: Pinecone (managed), Weaviate (open source), Qdrant, pgvector (PostgreSQL extension)',
      example:
        'Notion AI "Ask Anything" feature:\n\n' +
        'When you ask "What did we decide about the product roadmap?"\n\n' +
        '1. Embed the query: query_vector = embed("What did we decide about the product roadmap?")\n' +
        '2. Vector search: find top-10 Notion pages closest to query_vector\n' +
        '3. Retrieve page chunks: fetch the actual text of matched pages\n' +
        '4. LLM call: "Given these documents: [chunks], answer: [question]"\n' +
        '5. Return: grounded answer with source citations\n\n' +
        'Without a vector database: keyword search ("roadmap") would miss pages that discuss\n' +
        '"Q3 prioritisation" or "feature backlog decisions" even though they answer the question.\n' +
        'Semantic search understands meaning, not just keywords.',
      whenToUse:
        'When building AI-powered search, RAG systems, or recommendation engines. Often used alongside a relational DB (vector DB for semantic search, relational for structured metadata filtering).',
    },
  ],

  comparison: {
    caption: 'Database types at a glance — quick selection guide',
    columns: ['Type', 'Best For', 'Scaling', 'Query Flexibility', 'Examples'],
    rows: [
      ['Relational', 'Structured data, ACID transactions', 'Vertical + read replicas', '✅ Rich SQL', 'PostgreSQL, MySQL'],
      ['Document', 'Flexible schema, hierarchical data', '✅ Horizontal (native)', '🟡 Limited joins', 'MongoDB, Firestore'],
      ['Key-Value', 'Cache, sessions, rate limiting', '✅ Very high', '❌ Key lookup only', 'Redis, DynamoDB'],
      ['Wide-Column', 'Write-heavy, time-series, IoT', '✅ Massive scale', '🟡 Partition-key queries', 'Cassandra, HBase'],
      ['Graph', 'Relationships, social, fraud detection', '🟡 Moderate', '✅ Traversals', 'Neo4j, Neptune'],
      ['Time-Series', 'Metrics, IoT, monitoring', '✅ High (with compression)', '✅ Time-range aggregations', 'InfluxDB, TimescaleDB'],
      ['Vector', 'Semantic search, AI, recommendations', '✅ Horizontal', '❌ Similarity search only', 'Pinecone, Weaviate'],
    ],
  },

  realWorldExamples: [
    {
      company: 'Uber',
      icon: '🚕',
      description:
        'Uber uses 5+ database types: MySQL (relational) for core trip and payment data with ACID guarantees. ' +
        'Redis (key-value) for driver location caching and session management. ' +
        'Cassandra (wide-column) for trip history and event logs at massive scale. ' +
        'Elasticsearch (document) for full-text search on driver and rider profiles. ' +
        'ClickHouse (column-oriented) for analytical queries on trip data. Each serves a distinct purpose — no single DB handles everything.',
    },
    {
      company: 'LinkedIn',
      icon: '💼',
      description:
        'LinkedIn uses PostgreSQL/MySQL for member accounts and connections (relational). ' +
        'Espresso (document, LinkedIn-built) for profile data that needs flexible schema. ' +
        'Voldemort (key-value, LinkedIn-built) for high-throughput session and identity lookups. ' +
        'Venice (key-value) for feature store data serving ML models. ' +
        'Graph storage for their 900M member professional graph powering PYMK and job recommendations.',
    },
    {
      company: 'Netflix',
      icon: '🎬',
      description:
        'Netflix is famous for their diverse data store usage. ' +
        'MySQL for billing and subscriber data (ACID critical). ' +
        'Cassandra for viewing history, user interactions, and activity feeds (billions of events/day). ' +
        'EVCache (Redis-based) for API response caching across 300M subscribers. ' +
        'Elasticsearch for content search. ' +
        'Druid for real-time analytics on streaming data. ' +
        'Each service team picks the right tool — no central mandate to use one database.',
    },
  ],

  interviewQuestions: [
    {
      question: 'How do you choose between SQL and NoSQL?',
      answer:
        'Start with SQL (PostgreSQL) as the default — it handles 80% of use cases well. Choose NoSQL when you have specific needs: ' +
        '(1) Document DB: schema is highly variable or data is naturally hierarchical (product catalogs, CMS). ' +
        '(2) Key-Value: you need sub-millisecond lookups by a single key (caching, sessions). ' +
        '(3) Wide-Column: write throughput exceeds what a single SQL DB can handle (>100K writes/sec), or you need multi-region active-active writes. ' +
        '(4) Graph: your primary queries are multi-hop relationship traversals (social, fraud). ' +
        'Never choose NoSQL just because it "scales better" — modern SQL databases scale very well with read replicas and sharding.',
    },
    {
      question: 'Design the data layer for a system like Instagram',
      answer:
        'Instagram needs multiple database types: ' +
        '(1) PostgreSQL (sharded by user_id via Citus/Vitess): user profiles, followers, core entity data with referential integrity. ' +
        '(2) Cassandra: photo metadata and activity feeds — billions of events, write-heavy, no complex joins needed. ' +
        '(3) Redis: user sessions, rate limiting, cache of hot profiles and feed fragments. ' +
        '(4) Elasticsearch: hashtag and location search, full-text caption search. ' +
        '(5) S3 + CDN: photo and video binary storage (not a DB, but part of the data layer). ' +
        'The key insight: choosing one database forces painful trade-offs; each type serves a distinct access pattern.',
    },
    {
      question: 'When would you NOT use a relational database?',
      answer:
        '(1) Write throughput exceeds ~100K TPS sustained on a single machine — relational DBs cap out here even with vertical scaling. ' +
        '(2) Schema is genuinely unpredictable and changes constantly — relational migrations at scale are painful. ' +
        '(3) Data is graph-shaped and queries are multi-hop traversals — SQL recursive CTEs become unmaintainable. ' +
        '(4) Data is time-series metrics — relational storage and query patterns are inefficient vs. specialised TSDBs. ' +
        '(5) You need semantic similarity search — relational DBs cannot do approximate nearest neighbor search efficiently. ' +
        'In practice, the answer is rarely "do not use relational" — it is "use relational for X AND use Y for this specific need".',
    },
    {
      question: 'What is the difference between a document DB and a key-value store?',
      answer:
        'A key-value store returns the entire value for a given key — you cannot query inside the value. Redis: GET user:42 → returns entire JSON blob. ' +
        'A document DB lets you query fields inside documents: MongoDB: db.users.find({age: {$gt: 18}, city: "NYC"}) — it indexes and queries document internals. ' +
        'Key-value stores are simpler and faster; document DBs trade some speed for queryability inside the stored objects.',
    },
  ],

  commonMistakes: [
    'Choosing MongoDB because it "scales better" — PostgreSQL with proper indexing handles most workloads; NoSQL introduces operational complexity',
    'Using Redis as a primary database — Redis is in-memory; without persistence config, data is lost on restart; it is a cache layer, not a source of truth',
    'Using a relational DB for time-series metrics — storing 1 million rows/day of metrics in PostgreSQL creates tables with billions of rows and slow range scans; use InfluxDB or TimescaleDB',
    'Building social graph features in a relational DB with recursive JOINs — multi-hop friend-of-friend queries are O(n^k) in SQL; graph databases handle this natively',
    'Not considering operational costs — exotic databases (vector, graph, time-series) need specialised expertise; PostgreSQL has vastly better community support and tooling',
    'Mixing concerns in one database — storing metrics, sessions, and business data in the same PostgreSQL instance creates a single point of failure and a tuning nightmare',
    'Choosing a database based on what you already know instead of what the access pattern requires',
  ],
};
