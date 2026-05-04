import type { ConceptDeepDive } from '../../types';

export const changeDataCapture: ConceptDeepDive = {
  moduleId: 'change-data-capture-cdc',
  tagline: 'Turn every database change into an event — the reliable bridge between your DB and the world',

  introduction: {
    layman:
      'Imagine a bank ledger. Every time a teller makes a transaction, they write it in the ledger. The ledger is the authoritative record. Now imagine someone sitting next to the ledger and copying down every new entry the moment it\'s written — that person can feed the information to the analytics department, the fraud detection system, the customer\'s app, all in real time. Change Data Capture (CDC) is that person for your database. It watches the database\'s internal change log and converts every insert, update, and delete into an event that downstream systems can react to.',
    analogy:
      'A security camera in a store. The camera doesn\'t change anything the employees do — it just records every action in real time. Later, loss prevention, store management, and the franchise owner can all watch the same footage for their own purposes. CDC is the security camera for your database: it records every data change in a stream that any downstream consumer can read and react to independently.',
    whyMatters:
      'CDC solves one of the hardest problems in distributed systems: keeping multiple systems in sync with the database. Without CDC, you have the "dual write" problem — update the DB AND send an event, but they can\'t be atomic. CDC removes the dual write entirely: just update the DB normally; CDC automatically propagates the change everywhere else. Used by almost every large-scale system for cache invalidation, search indexing, data warehousing, microservice communication, and event sourcing.',
  },

  subTopics: [
    {
      title: 'Why CDC Exists — The Dual Write Problem',
      icon: '⚡',
      layman:
        'The core problem CDC solves: you update your database AND need to notify other systems (update a cache, send an event to Kafka, re-index in Elasticsearch). But your database and Kafka are separate systems — you can\'t update them both atomically. If your app crashes between the DB write and the Kafka publish, one of them gets the update and the other doesn\'t. Your systems go out of sync.',
      technical:
        'The dual write problem: `db.save(record)` then `kafka.publish(event)` — if the process crashes between these two calls, either: (a) DB written, Kafka not → downstream systems never learn about the change; or (b) Kafka published, DB not written → phantom events for data that doesn\'t exist. Solutions: (1) Outbox pattern (application-level): write event to an "outbox" table in the same DB transaction as the data change; a separate poller reads and publishes. Adds application complexity. (2) CDC (infrastructure-level): database\'s own change log is the source of truth; CDC reads from it. No dual write — the single DB write is all that\'s needed; CDC handles propagation.',
      example:
        'An e-commerce platform that tried dual-write: inventory service decrements stock in MySQL AND publishes to Kafka. During a peak-hour deploy, 200 messages got dropped between DB write and Kafka publish. Inventory showed items as in stock that had been sold. Fixing this was 3 days of manual reconciliation. CDC would have made this impossible — the Kafka events come directly from MySQL\'s binlog, not from application code.',
    },
    {
      title: 'Three CDC Approaches — Timestamp, Triggers, and Log-Based',
      icon: '🔧',
      layman:
        'There are three ways to detect database changes. Timestamp-based: look for rows updated recently. Trigger-based: the database fires a "trigger" when rows change. Log-based: read the database\'s internal operation log (the most powerful approach used in production).',
      technical:
        'Timestamp-based: add `updated_at` column; CDC polls `WHERE updated_at > last_check`. Simplest. Misses deletes (deleted rows can\'t have timestamps). Requires polling interval. Good enough for ETL batch pipelines. Trigger-based: DB triggers write to a change table on INSERT/UPDATE/DELETE. CDC reads the change table. Captures deletes. High overhead — triggers run on every write, doubling write load. Hard to maintain. Log-based (preferred): reads the database replication log (MySQL binlog, Postgres WAL, MongoDB oplog). Every change is already recorded here for replication purposes. No overhead on the database. Captures all changes including deletes. Near-real-time (sub-second). Requires DB-level configuration (enable binlog). Tools: Debezium (open source, Kafka-native), AWS DMS (managed), Maxwell (MySQL-specific), PgLogical (Postgres).',
      example:
        'MySQL binlog entry for an UPDATE: `{"ts_ms":1710000000000,"op":"u","before":{"id":1,"stock":10},"after":{"id":1,"stock":9},"source":{"db":"inventory","table":"products"}}`. Debezium reads this from the binlog and publishes to Kafka topic `inventory.products`. Downstream consumers see the before/after state — cache invalidation service knows to evict product:1, search index knows to update product:1\'s availability.',
    },
    {
      title: 'Debezium + Kafka — The Production CDC Stack',
      icon: '🏗️',
      layman:
        'Debezium is the most popular open-source CDC tool. It connects to your database, reads the change log, and publishes every change as a structured event to a Kafka topic. Downstream services subscribe to those Kafka topics and react to changes.',
      technical:
        'Debezium architecture: Debezium connector runs as a Kafka Connect plugin. It connects to the DB as a replica (for Postgres WAL, MySQL binlog). Reads changes in order. Publishes to Kafka topics named `{server}.{database}.{table}`. Each event contains: operation type (c=create, u=update, d=delete, r=read/snapshot), before state (for updates/deletes), after state (for creates/updates), source metadata (DB, table, position in log). Initial snapshot: on first connect, Debezium does a full consistent snapshot of existing data, publishing as read events, then transitions to log streaming. Kafka Connect manages offset tracking — if Debezium restarts, it resumes from where it left off.',
      example:
        'An order management system: Debezium watches the `orders` table. When an order\'s status changes from "processing" to "shipped", Debezium publishes to `myapp.db.orders` with before: `{status:"processing"}` and after: `{status:"shipped"}`. Three consumers react: notification service (email/SMS the customer), analytics service (record fulfillment time), search service (update order search). Zero code changes to the service that updated the order status.',
    },
    {
      title: 'CDC Use Cases — Cache Invalidation, Search Indexing, Microservices',
      icon: '🎯',
      layman:
        'CDC unlocks several powerful patterns that are otherwise hard to implement correctly. Here are the main use cases.',
      technical:
        'Cache invalidation: instead of the app deciding when to evict cache entries (and often getting it wrong), CDC watches the DB and invalidates cache entries the moment data changes. Perfect consistency. Search indexing: Elasticsearch/OpenSearch indexes stay in sync with the source DB via CDC — no need to maintain dual writes or periodic re-indexing jobs. Microservice data sync: Service A owns the "users" table; Service B needs user data. Instead of Service B calling Service A\'s API for every query, CDC streams the users table to Service B\'s own database copy — low latency, no coupling. Read replica replication: logical CDC enables replicating specific tables to different database engines (Postgres → Redshift for analytics). Event sourcing: CDC on the DB generates the event log automatically without modifying application code. Audit logging: complete history of all changes to all rows with timestamps and old/new values.',
      example:
        'Shopify uses CDC to keep their Elasticsearch search index in sync with their product database. When a merchant updates a product, CDC detects the change in MySQL and asynchronously updates the Elasticsearch index. The search index is always within seconds of the database state — and Shopify engineers never have to write "update search on product save" in application code.',
    },
    {
      title: 'CDC Challenges & Operational Considerations',
      icon: '⚠️',
      layman:
        'CDC is powerful but not without challenges. You\'re reading the database\'s internal log — that log doesn\'t wait for you. If your CDC system falls behind, you have growing lag and eventual inconsistency. Schema changes in the database can break your CDC pipeline.',
      technical:
        'Challenges: (1) Schema evolution: if you add a column to a DB table, CDC events for that table change structure. Kafka consumers expecting the old schema break. Fix: use a schema registry (Confluent Schema Registry) with schema compatibility rules. (2) Log retention: DB replication logs have finite retention (MySQL binlog purged regularly). If your CDC consumer falls too far behind, the log position it last read is gone — you need a full re-snapshot. Monitor consumer lag. (3) Large transactions: a bulk UPDATE of 10M rows generates 10M CDC events rapidly. Can overwhelm downstream consumers. (4) PII and sensitive data: CDC events include all column values, including passwords and PII. Implement field-level masking or exclusion for sensitive columns. (5) Delete propagation: log-based CDC captures deletes (tombstone events). Consumers must handle tombstones to delete from caches/indexes.',
      example:
        'Airbnb\'s CDC pipeline once fell 8 hours behind after a bulk data migration generated 500M rows of updates. Their Elasticsearch index was 8 hours stale — search results showed wrong prices for hours. Fix: consumer autoscaling based on Kafka lag metrics, and bulk operations scheduled during off-peak hours to limit CDC burst.',
    },
  ],

  comparison: {
    caption: 'CDC approaches compared',
    columns: ['Approach', 'Timestamp-based', 'Trigger-based', 'Log-based (CDC)'],
    rows: [
      ['Captures deletes', '❌', '✅', '✅'],
      ['Write overhead', 'None (polling only)', 'High (trigger on every write)', 'Minimal (reads replica log)'],
      ['Latency', 'Poll interval (seconds–minutes)', 'Near-instant', 'Near-instant (< 1s)'],
      ['Implementation complexity', 'Low', 'Medium', 'Higher (tooling needed)'],
      ['Schema change handling', 'Automatic', 'Manual trigger updates', 'Schema registry needed'],
      ['DB support', 'Any', 'Any', 'MySQL, Postgres, MongoDB, Oracle'],
      ['Production usage', 'ETL batch pipelines', 'Legacy/simple setups', 'High-scale real-time pipelines'],
    ],
  },

  realWorldExamples: [
    {
      company: 'LinkedIn',
      icon: '💼',
      description:
        'LinkedIn uses CDC (Databus, their internal CDC system, which inspired Debezium) to propagate changes from MySQL to downstream systems: Espresso (their KV store), search index, and data warehouse. Databus was open-sourced by LinkedIn and became one of the foundational pieces of modern CDC architecture. Every profile update, connection request, and job posting flows through CDC.',
    },
    {
      company: 'Shopify',
      icon: '🛒',
      description:
        'Shopify uses CDC to keep Elasticsearch in sync with their MySQL product databases. Every product update (price change, inventory adjustment, title edit) is detected by CDC and asynchronously updated in the search index. This decouples search from the write path completely — Shopify engineers write to MySQL normally; CDC handles Elasticsearch consistency.',
    },
    {
      company: 'Stripe',
      icon: '💳',
      description:
        'Stripe uses CDC to power their real-time data pipelines. Database changes flow via CDC into their analytics data warehouse (Redshift/Snowflake) within minutes of occurring. This gives Stripe\'s data team near-real-time access to all operational data without putting query load on production databases.',
    },
    {
      company: 'Debezium (Red Hat / Confluent)',
      icon: '🔴',
      description:
        'Debezium is the most widely adopted open-source CDC platform. It supports MySQL, PostgreSQL, MongoDB, SQL Server, and Oracle. Companies like Walmart, SiriusXM, and Wix use it to stream database changes to Kafka. It\'s the de facto standard for log-based CDC in Kafka-centric architectures.',
    },
  ],

  interviewQuestions: [
    {
      question: 'What is Change Data Capture and why would you use it instead of dual writes?',
      answer:
        'CDC is a technique for detecting and streaming every change (insert, update, delete) made to a database as an event stream. Instead of application code writing to the DB AND publishing to Kafka (dual write — which can fail between the two), CDC reads the database\'s own internal change log (MySQL binlog, Postgres WAL) and automatically generates events. This solves the dual write problem: the application only writes to the DB; CDC handles propagation. Use CDC when you need to keep multiple systems in sync with your database: search indexes (Elasticsearch), caches (Redis), data warehouses, microservice data copies, audit logs. CDC gives you eventual consistency without any application code changes and without the risk of missed events from dual write failures.',
    },
    {
      question: 'How does log-based CDC work? What is a binlog?',
      answer:
        'Most databases maintain an internal replication log — MySQL calls it the binlog, PostgreSQL calls it WAL (Write-Ahead Log). This log records every change made to the database, in order, for the purpose of replicating data to replica servers. Log-based CDC tools (Debezium, Maxwell) connect to this log as if they were a replica. They read each change event: the operation type (INSERT/UPDATE/DELETE), the table, and the before/after row state. These events are published to a message system (Kafka). The tool tracks its position in the log (offset/LSN) so it can resume from the right point after a restart. Key advantage: reading the log adds virtually no overhead to the primary database and captures every change including deletes, with sub-second latency.',
    },
    {
      question: 'How would you use CDC to keep an Elasticsearch index in sync with a MySQL database?',
      answer:
        'Architecture: (1) Enable MySQL binlog with format=ROW (captures full row values, not just SQL). (2) Deploy a Debezium MySQL connector configured to capture the target tables. (3) Debezium publishes to Kafka topics (e.g., `myapp.db.products`). (4) An Elasticsearch sync consumer subscribes to the Kafka topic. For "c" (create) and "u" (update) operations: upsert the after-state into Elasticsearch. For "d" (delete) operations: delete the document from Elasticsearch using the id from the before-state. (5) Handle schema changes: use Confluent Schema Registry to evolve Avro schemas without breaking consumers. (6) Bootstrap: on first deployment, Debezium takes a consistent snapshot of existing rows before streaming new changes. This gives you a search index that\'s always within seconds of the source database, with no application code changes and no dual-write risk.',
    },
    {
      question: 'What is a "snapshot" in CDC and why is it needed?',
      answer:
        'A CDC snapshot is the initial full-table read that a CDC tool does before it begins streaming changes. The database\'s replication log only contains changes from a certain point backward — historical data before CDC was set up isn\'t in the log. Without a snapshot, downstream consumers would only see future changes, not the existing state. Debezium\'s snapshot process: (1) Takes a consistent read snapshot of all specified tables at a point in time (using a consistent snapshot isolation level to avoid seeing partial transactions). (2) Publishes every row as a read ("r" operation) event. (3) Seamlessly transitions to log-based streaming from the log position corresponding to the snapshot point. The snapshot can be time-consuming for large tables (millions of rows). For very large tables, partial snapshots (snapshot specific partition ranges) or pre-existing data loading from a backup is used.',
    },
  ],

  commonMistakes: [
    'Not monitoring CDC consumer lag — if the consumer falls behind the DB log retention window, it loses its position and needs a full re-snapshot.',
    'Not handling schema evolution — CDC event schemas change when DB columns are added/removed; without a schema registry, downstream consumers break silently.',
    'Including PII and passwords in CDC events — all column values are captured; implement field exclusion or masking for sensitive data.',
    'Ignoring tombstone (delete) events — downstream caches and indexes retain stale deleted data if delete events aren\'t handled.',
    'Enabling CDC on a heavily written table without performance testing — log-based CDC has minimal overhead, but very high write throughput can create Kafka consumer lag.',
    'Forgetting to configure binlog retention long enough — if CDC restarts and the DB binlog has been purged past the last checkpoint, a full re-snapshot is required.',
  ],
};
