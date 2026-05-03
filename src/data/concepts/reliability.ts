import type { ConceptDeepDive } from '../../types';

export const reliability: ConceptDeepDive = {
  moduleId: 'reliability',
  tagline: 'The system does what it should, every time',

  introduction: {
    layman:
      'Reliability is whether your system actually does the right thing — correctly, completely, and consistently. A reliable system answers questions correctly. It doesn\'t lose your data. It doesn\'t double-charge your card. It doesn\'t silently corrupt records. Availability is "is it on?"; reliability is "when it\'s on, is it doing the right thing?". You can be available without being reliable, and a reliable-but-down system is no good either.',
    analogy:
      'Imagine two airlines. Airline A flies on time 99% of the time but loses your luggage 5% of the time. Airline B is on time only 95% of the time but never loses luggage. A is more "available"; B is more "reliable". Real-world systems need both — but the failure modes are different and the engineering investments are different.',
    whyMatters:
      'Most outages users actually notice aren\'t total downtime — they\'re the system being up but wrong. Wrong totals on the cart, payments charged but not recorded, search returning empty when data exists, profile photos disappearing. Reliability engineering is what stops these subtle failures, and it\'s what separates great systems from merely working ones.',
  },

  subTopics: [
    {
      title: 'Measuring Reliability: MTBF & MTTR',
      icon: '📏',
      layman:
        'Two numbers describe most reliability work. MTBF (Mean Time Between Failures) — how long a system runs before something breaks. MTTR (Mean Time To Recover) — how fast you fix it when it does. You improve reliability by either failing less often OR recovering faster. Recovering faster is usually cheaper.',
      technical:
        'MTBF improvements: better testing, better hardware, better deployment safety, simpler designs. MTTR improvements: better observability (catch failures fast), automated recovery, runbook-driven on-call, blast-radius limitation. Modern SRE practice favours MTTR — failures are inevitable; what differentiates teams is how fast they recover.',
      example:
        'Google\'s SRE book popularised the focus on MTTR. They report that reducing MTTR by half is roughly equivalent to doubling MTBF for user-perceived reliability — and it\'s usually 10× cheaper to engineer.',
    },
    {
      title: 'Idempotency: Safe Retries',
      icon: '🔁',
      layman:
        'Networks fail. Requests time out. Users hit submit twice. Your code has to handle being called more than once with the same input — without doing the work twice. An idempotent operation gives the same result whether you call it once or a hundred times.',
      technical:
        'Make state-changing operations idempotent by including an idempotency key. Server checks if the key was seen before; if yes, return cached response without redoing the work. Stripe\'s idempotency-key header is the canonical pattern. For database operations, use UPSERTs or natural unique constraints. For consumer-side processing of message queues, use exactly-once semantics or deduplicate on a unique message ID.',
      example:
        'When you tap "Pay" on a slow connection and re-tap because nothing seems to happen, both requests go through. Stripe accepts both, sees the same idempotency key, and returns the same payment from the first request — without charging you twice. Reliability you don\'t notice because the system is doing the right thing.',
    },
    {
      title: 'Retries with Exponential Backoff',
      icon: '⏳',
      layman:
        'When something fails, retry — but smartly. Don\'t hammer it 10 times in a second; that just makes the downstream worse. Wait a bit, then try again. If still failing, wait longer. Eventually give up. This pattern alone prevents a huge class of cascading failures.',
      technical:
        'Backoff schedule: 100ms, 200ms, 400ms, 800ms, 1.6s, … with jitter to prevent thundering herds (every retrying client retrying at the same instant). Cap maximum retries (3-5 typical) and total elapsed time. Combine with circuit breakers: if 50% of recent calls failed, stop retrying entirely for a window. Common config: 3 retries, exponential base 100ms, ±50% jitter.',
      example:
        'AWS SDKs retry with exponential backoff and jitter by default. Without it, the famous DynamoDB outages of 2015 would have been worse — every client retrying simultaneously would have permanently DDoSed the recovery. With backoff and jitter, retry waves spread out, giving the service room to recover.',
    },
    {
      title: 'Replication & Data Durability',
      icon: '🛡️',
      layman:
        'Disks fail. Servers die. To never lose data, store every important piece in multiple places. The more places, the safer — but the more expensive and slower writes get. Most production systems use 3 copies; some use 5 or more for critical data.',
      technical:
        'Replication factors: 3 typical (survives loss of 2 replicas without data loss), 5 for critical (survives 2 simultaneous failures). Synchronous replication waits for all replicas to confirm before acknowledging the write — strongest durability, highest latency. Asynchronous replication acknowledges from the leader; replicas catch up — faster but a window of data loss exists. Quorum-based: write to majority, read from majority — balance.',
      example:
        'AWS S3 is designed for "11 nines" of durability — meaning if you store 10 million objects, you\'d expect to lose one every 10,000 years. Achieved via cross-AZ erasure coding and continuous integrity checks. Your hard drive at home? About 0.5% chance of failure per year — orders of magnitude less reliable than well-replicated cloud storage.',
    },
    {
      title: 'Checksums & Integrity Verification',
      icon: '🔍',
      layman:
        'Data doesn\'t just disappear in failures — it gets corrupted. Bits flip. Disks return wrong values. Networks scramble bytes. Reliable systems verify data hasn\'t silently corrupted by computing checksums on every write and re-verifying on every read.',
      technical:
        'Layers of integrity checks: TCP checksums (every packet), application checksums (CRC32, SHA-256 per blob), filesystem checksums (ZFS, Btrfs), block-level (ECC RAM, SAS sector-level CRC). When a checksum mismatches, the system either fails fast (better than serving corruption) or reads from a replica and self-heals.',
      example:
        'ZFS scrubs all data periodically by re-reading and verifying checksums. When it finds bit-rot (it does, on every large array), it fixes the corruption from a parity copy. Without scrubbing, that bit-flip could persist for months until you happened to read it — by which point all replicas might be corrupted.',
    },
    {
      title: 'Atomic Operations & Transactions',
      icon: '⚛️',
      layman:
        'Some operations have to happen completely or not at all. Transferring money: debit one account AND credit the other — never just one. The system has to guarantee atomicity even if the power fails halfway through. That\'s what database transactions do.',
      technical:
        'ACID properties: Atomicity (all-or-nothing), Consistency (invariants preserved), Isolation (concurrent transactions don\'t see each other\'s partial state), Durability (committed data survives crashes). Implemented via write-ahead logs, two-phase commit, MVCC. Distributed transactions are notoriously hard — Sagas and outbox patterns trade strict atomicity for practical correctness.',
      example:
        'Banks use transactions everywhere. A wire transfer is atomic: it either fully completes (both accounts updated, ledger entry written, receipt generated) or fully aborts (nothing changes). Even if the server crashes mid-transfer, the WAL ensures recovery completes the operation correctly.',
    },
    {
      title: 'Idempotency Keys vs Sequence Numbers',
      icon: '🔢',
      layman:
        'Two ways to make duplicate requests safe. Idempotency keys: client includes a unique ID; server stores "I\'ve seen this ID, here\'s the answer". Sequence numbers: each operation has an ever-increasing number; server rejects duplicates or older numbers. Different patterns for different problems.',
      technical:
        'Idempotency keys are good for client-driven operations (HTTP API calls). Sequence numbers fit producer-consumer flows (Kafka with idempotent producers uses producer-id + sequence). Vector clocks generalise to multi-actor systems. Persistence: idempotency caches typically TTL after 24h; sequence numbers persist indefinitely per-producer.',
      example:
        'Stripe uses idempotency-key headers — clients generate UUIDs and include them on every charge. Kafka\'s idempotent producer uses sequence numbers internally so retries on broker timeouts don\'t create duplicate messages. Same goal (no duplicates), different mechanics fit different layers.',
    },
    {
      title: 'Dead Letter Queues & Poison Messages',
      icon: '💀',
      layman:
        'Sometimes a message just won\'t process — bad data, missing references, code bugs. If you keep retrying, you block everything else. Send those poison messages to a "dead letter queue" so the rest of the queue keeps moving. Investigate failures separately.',
      technical:
        'Configure max-retries (e.g. 3-5) before routing to a DLQ. DLQ is a separate topic/queue holding failed messages with metadata (original topic, error, retry count). Operators inspect, fix the cause, and replay. Without a DLQ, one bad message permanently blocks a partition — cascading queue depth and outages.',
      example:
        'A typical Kafka deployment has every consumer-group paired with a DLQ topic. When a payment can\'t be processed (bad customer ID, deleted card), it routes to payments.dlq. An on-call engineer reviews periodically; valid issues get manually replayed after fixes.',
    },
    {
      title: 'Graceful Shutdown',
      icon: '👋',
      layman:
        'When a server is shutting down — for a deploy, scale-down, or crash — it shouldn\'t just kill connections. It should finish in-flight requests, drain its queues, and tell the load balancer to stop sending new traffic. Otherwise users see errors during routine maintenance.',
      technical:
        'Receive SIGTERM. Mark unhealthy in load balancer (stop new traffic). Drain in-flight requests with a deadline. Close connection pools. Flush logs/metrics. Exit. Most container orchestrators (Kubernetes, ECS) send SIGTERM with a configurable grace period before SIGKILL. Apps that don\'t handle this drop traffic on every deploy.',
      example:
        'Kubernetes uses preStop hooks + termination grace period (default 30s). Well-engineered services subscribe to lifecycle events, set themselves "not ready", complete in-flight requests, and only then exit. Result: rolling deploys cause zero user-visible errors.',
    },
  ],

  comparison: {
    caption: 'Strategies for making operations reliable.',
    columns: ['Strategy', 'Protects Against', 'Cost', 'Where Used'],
    rows: [
      ['Replication',         'Hardware/region failures',           'Storage 3-5x',        'Databases, object stores'],
      ['Idempotency keys',    'Duplicate requests on retry',         'Cache lookup overhead','APIs, payment processors'],
      ['Retries + backoff',   'Transient failures',                  'Higher tail latency', 'Inter-service calls, queues'],
      ['Checksums',           'Silent data corruption',              'CPU on read/write',   'Storage, networking'],
      ['Transactions',        'Partial updates, race conditions',    'Lock contention',     'Money movement, critical state'],
      ['Dead letter queues',  'Poison messages blocking processing', 'Operational triage',  'Async messaging, queues'],
      ['Circuit breakers',    'Cascading failures',                  'Brief feature loss',  'Inter-service calls'],
    ],
  },

  realWorldExamples: [
    {
      company: 'Stripe',
      icon: '💳',
      description:
        'Idempotency-key API design is the canonical example. Every payment can be retried safely. Combined with sophisticated retry logic on the client side, this means a flaky network never causes double charges — extreme reliability for billions of transactions/year.',
    },
    {
      company: 'AWS S3',
      icon: '🪣',
      description:
        '11 nines of durability across distributed erasure coding, continuous background scrubbing, and cross-AZ replication. Has stored quintillions of objects with effectively zero data loss in nearly two decades — a benchmark for storage reliability.',
    },
    {
      company: 'Bank wire systems (SWIFT, Fedwire)',
      icon: '🏦',
      description:
        'Transaction atomicity is sacred — a wire transfer either fully happens or fully doesn\'t, with cryptographic audit trails. Reconciliation runs continuously; discrepancies are flagged within minutes. Reliability requirements written into law.',
    },
    {
      company: 'GitHub',
      icon: '🐙',
      description:
        'Git itself is a reliability masterpiece — content-addressable storage with cryptographic checksums means corruption is detected automatically. GitHub adds replication, backups, and graceful degradation on top. Even during outages, your local repo always has the truth.',
    },
  ],

  interviewQuestions: [
    {
      question: 'Distinguish reliability from availability with a concrete example.',
      answer:
        'Availability is "the system is responding"; reliability is "the system is responding correctly". A search service that\'s up 99.99% but returns empty results 5% of the time is highly available but unreliable. A trading system that\'s up only 99% but never executes a trade incorrectly is highly reliable but less available. Real systems target both. Both are measurable but with different metrics — uptime percentage for availability; error rate, data-loss rate, correctness for reliability. In design discussions, distinguish them explicitly because they often conflict: tightening reliability (synchronous replication, transactions) often costs availability (latency, more failure modes).',
    },
    {
      question: 'Why are retries dangerous, and how do you make them safe?',
      answer:
        'Retries multiply load on a struggling downstream. If a service is at 90% capacity and starts failing, naive clients retrying once double the load — making it fail completely. Three safety nets: (1) Exponential backoff with jitter so retries spread out instead of synchronising. (2) Bounded retries (3-5 max) so you don\'t retry forever. (3) Circuit breaker that stops retrying entirely when failure rate is too high. (4) Idempotency keys so retries don\'t cause duplicates. (5) Retry budgets at the service level — limit total retry traffic to a fraction of normal traffic. Without all of these, retries cause cascading failures more often than they help. The Google SRE book has the canonical treatment.',
    },
    {
      question: 'Walk me through the design of an idempotent payment endpoint.',
      answer:
        'Client generates a UUID per payment attempt and sends it as Idempotency-Key header. Server first checks an idempotency cache (Redis, with 24h TTL): if the key exists, return the cached response — no work re-done. Otherwise: lock the key (or use SETNX), execute the payment in a transaction (charge card via processor, write to DB, emit event), cache the response keyed by the idempotency key, release the lock. Return the response. Edge cases: server crashes mid-transaction → next retry sees no cached response, replays the work; payment processor itself must be idempotent (Stripe accepts the same idempotency key, returns the same charge). The key invariant: same idempotency key → same response, regardless of how many times the request arrives.',
    },
    {
      question: 'How do you guarantee no data loss during a service crash?',
      answer:
        'Three layers. (1) Persistent queues: producers write to durable storage (Kafka with acks=all + min.insync.replicas≥2, RDBMS with synchronous commit) before acknowledging the request. The data exists on disk on multiple machines before the user sees a "success". (2) Write-ahead logs: any state-changing operation logs its intent before mutating data. On crash recovery, replay the log to reach a consistent state. (3) Replication: data lives on N machines with quorum-based writes. Lose any minority and continue operating. The combination: even if a server dies between accepting a write and processing it, the data\'s on disk on multiple machines and will be processed (at least once). Without all three, you have a window where data can be lost.',
    },
    {
      question: 'What is a "poison message" and how do you handle it without taking down the consumer?',
      answer:
        'A poison message is one that consistently fails to process — bad format, missing references, hits a code bug. If consumers retry forever, the queue stalls behind it; everything else stops. Solution: dead letter queue (DLQ). After N failed processing attempts (configurable, typically 3-5), move the message to a DLQ topic and continue with the next message. The DLQ accumulates problem messages for human inspection. Operators investigate root cause (a bug, bad data upstream), fix it, and replay messages from the DLQ. Critical: alert on DLQ growth — DLQ messages mean either bugs to fix or upstream data quality problems. A silently-growing DLQ with no alerting is a sign of an unhealthy system.',
    },
    {
      question: 'How does graceful shutdown improve reliability, and what breaks if you don\'t implement it?',
      answer:
        'Without graceful shutdown, every deploy and every scale-down event drops in-flight requests, causes connection errors, and leaves messages partially-processed. Reliability metrics suffer not because of failures but because of routine maintenance. Graceful shutdown means: on SIGTERM, mark yourself unhealthy in the load balancer (so no new traffic), wait for in-flight requests to complete with a deadline, drain consumer-group partitions cleanly (commit offsets, release them so a teammate can pick up), close DB connection pools properly, flush logs and metrics, then exit. A well-engineered service can be killed at any moment with zero user-visible impact. This is what enables continuous deployment, autoscaling, and chaos engineering — features that themselves improve reliability further.',
    },
    {
      question: 'What\'s the trade-off between synchronous and asynchronous replication?',
      answer:
        'Synchronous replication: leader waits for all replicas to confirm before acknowledging the write. Strongest durability — no data loss even if leader dies immediately. Cost: write latency = slowest replica; if any replica is slow or unreachable, writes block; reduces availability (if a replica is down, writes can fail). Asynchronous replication: leader acknowledges as soon as it commits locally; replicas catch up shortly. Lower latency, higher availability under partial failures. Cost: window of potential data loss — if leader dies before replicas caught up, recent writes are lost. Hybrid approaches: semi-synchronous (wait for at least one replica), quorum-based (wait for majority). Decision: financial transactions usually demand sync; user activity / metrics usually accept async; databases like Postgres let you configure per-transaction.',
    },
  ],

  commonMistakes: [
    'Treating reliability as someone else\'s problem — uptime is everyone\'s job; data correctness is everyone\'s job.',
    'Naive retries without backoff or idempotency — turns transient hiccups into cascading outages.',
    'Storing critical data on a single machine — the disk WILL fail; replication is non-negotiable above toy scale.',
    'Ignoring the long tail — averages look fine, but the p99 errors that one customer sees consistently are real reliability problems.',
    'No dead letter queue — one poison message takes down a whole consumer group at 3am.',
    'Skipping graceful shutdown because "it works in normal cases" — every deploy and autoscaling event becomes a tiny outage.',
    'Confusing data loss prevention with corruption prevention — replication protects against loss, checksums protect against corruption; you need both.',
  ],
};
