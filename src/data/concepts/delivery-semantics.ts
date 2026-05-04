import type { ConceptDeepDive } from '../../types';

export const deliverySemantics: ConceptDeepDive = {
  moduleId: 'delivery-semantics',
  tagline: 'How many times will your message be processed? The answer defines your entire reliability strategy',

  introduction: {
    layman:
      'When you send a message through a queue, how confident are you that it gets processed? There are three possible guarantees: (1) "At most once" — it will be sent once and might be lost, but will never be processed twice. Like sending a regular letter — it might get lost in transit, but you won\'t accidentally send the same letter twice by trying to be safe. (2) "At least once" — it will definitely be processed, but might be processed more than once if there\'s a network hiccup. Like a delivery service that keeps retrying until you sign for the package — but you might sign twice. (3) "Exactly once" — guaranteed delivered once and only once. Like certified mail with a single tracked delivery. Each guarantee has a cost.',
    analogy:
      'Imagine sending a payment to a contractor. At-most-once: write the check and mail it — if it gets lost, too bad. You won\'t double-pay accidentally. At-least-once: keep resending the payment until they confirm receipt — they might get paid twice if the first payment was in-transit when you resent. Exactly-once: use a bank transfer with a unique transaction ID — the bank won\'t process the same ID twice, so double-payment is impossible even if you submit twice.',
    whyMatters:
      'Delivery semantics determine the fundamental contract your messaging system makes. Choose wrong and you either lose data (at-most-once when you need reliability) or corrupt data (at-least-once without idempotent consumers leading to double-charges). This concept appears in every distributed systems interview. At FAANG-level, engineers are expected to design systems that degrade gracefully: at-least-once delivery with idempotent consumers is the industry standard for high-reliability systems.',
  },

  subTopics: [
    {
      title: 'At-Most-Once Delivery — Speed at the Cost of Reliability',
      icon: '1️⃣',
      layman:
        'The producer fires a message and forgets about it. No retry, no acknowledgement, no guarantee it was received. If the network drops or the consumer crashes at the wrong moment, the message is gone. The upside: maximum speed, zero overhead, simple code.',
      technical:
        'Implementation: producer publishes and doesn\'t wait for ack. Broker doesn\'t persist to disk (in-memory only). Consumer reads and immediately deletes from queue — no ack round-trip. If consumer crashes after reading but before processing, message is lost. Network partition: producer publishes but broker never receives it — message is gone. Use cases: analytics/telemetry (a missed click event doesn\'t matter), real-time game position updates (old position is irrelevant anyway), IoT sensor readings where the next reading will supersede it, Redis Pub/Sub (fire-and-forget, no persistence). Kafka configuration: producer `acks=0` (don\'t wait for broker ack); consumer auto-commit offset immediately on receipt (before processing).',
      example:
        'Metrics collection for a dashboard: your app sends 1,000 CPU usage data points per minute. Losing 5 of them (0.5%) causes no visible effect on the dashboard — you see a smooth average anyway. Using at-most-once here is correct: maximum throughput, zero retry overhead, acceptable loss. Using at-least-once would add retry logic for data you don\'t care about recovering.',
      whenToUse:
        'Use at-most-once for: telemetry/metrics where small loss is acceptable, real-time sensor data superseded by newer readings, scenarios where duplicate processing is worse than message loss.',
    },
    {
      title: 'At-Least-Once Delivery — Reliability at the Cost of Duplicates',
      icon: '🔄',
      layman:
        'The producer keeps trying until it gets confirmation the message was received. If the network drops after the broker received the message but before the ack reaches the producer, the producer retries — the broker receives it twice. The guarantee: your message will be processed. The obligation: your consumer must handle receiving the same message twice gracefully.',
      technical:
        'Producer side: publish with ack=1 (leader acked). On timeout or failure, retry. Broker must be durable (message persisted to disk). Consumer side: process message, then send explicit ack. If consumer crashes before acking, broker re-delivers to another consumer. Kafka: consumer commits offset only after processing (`enable.auto.commit=false`; manually call `consumer.commitSync()` after processing). SQS: consumer must call `deleteMessage()` after processing; visibility timeout prevents double-delivery within the window. Common failure mode: consumer processes successfully, crashes before acking → message re-delivered to another consumer → processed twice. This is why at-least-once delivery requires idempotent consumers.',
      example:
        'Order confirmation email: at-least-once delivery. Producer sends "send confirmation email" message. Consumer processes → sends email → crashes before acking. Message re-delivered. Consumer processes again → sends a second confirmation email. To fix: check `processed_messages` DB before sending: `INSERT INTO processed_messages (msg_id) ON CONFLICT DO NOTHING RETURNING id` — if the insert returns nothing (already processed), skip. If it returns a row, send. Now the consumer is idempotent.',
      whenToUse:
        'Use at-least-once for: the vast majority of production messaging. Most side effects (emails, payments, state updates) are safe to make idempotent. At-least-once with idempotent consumers is the most practical high-reliability pattern.',
    },
    {
      title: 'Exactly-Once Delivery — The Hardest Guarantee',
      icon: '🎯',
      layman:
        'Exactly-once means the message is delivered and processed precisely one time — not zero, not two. In a distributed system where networks fail and machines crash, achieving this is genuinely hard. It\'s expensive and complex, but sometimes necessary — like for financial transactions where processing twice means charging a customer twice.',
      technical:
        'Exactly-once requires two sub-guarantees: (1) Producer exactly-once: idempotent producer — each message has a unique sequence number; the broker deduplicates at-write time. (2) Consumer exactly-once: atomic processing — consuming the message and updating state happen in the same transaction. Kafka transactions: producer enables transactions (`transactional.id` config). Broker generates a producer ID (PID). Each batch has a sequence number. Broker deduplicates retried writes. Consumer uses Kafka consumer groups with `isolation.level=read_committed` — only sees messages from committed transactions. Application uses Kafka\'s atomic write API to read from one topic, process, and write to another topic atomically. SQS FIFO: provides exactly-once via message deduplication IDs — duplicate submissions within a 5-minute deduplication window are rejected.',
      example:
        'Bank transfer pipeline: transfer $100 from account A to B. Using Kafka transactions: (1) Read transfer request from input topic. (2) Debit A, credit B in DB. (3) Write "transfer complete" to output topic. All three happen atomically — if any step fails, all are rolled back. The transfer is processed exactly once, even if the consumer restarts mid-processing.',
      whenToUse:
        'Use exactly-once for: financial transactions, inventory deduction (can\'t sell the same item twice), critical state machines where replaying events is impossible. Avoid overusing it — the performance cost (2-5× lower throughput in Kafka) is significant; at-least-once with idempotency is usually sufficient.',
    },
    {
      title: 'Making At-Least-Once Safe — The Idempotency Pattern',
      icon: '🛡️',
      layman:
        'Since at-least-once is the practical industry standard, the key skill is making your message handlers idempotent — processing the same message twice must produce the same result as processing it once. This sounds simple but requires careful design.',
      technical:
        'Idempotency key: every message carries a unique ID (UUID or derived from business data). Handler checks if this ID was already processed before doing anything. Database pattern: `INSERT INTO processed_messages (message_id) VALUES ($1) ON CONFLICT (message_id) DO NOTHING RETURNING id`. If returns a row, process. If returns nothing, message already processed — skip. Use the same DB transaction for the insert AND the business logic. Redis pattern: `SET msg:{id} 1 NX EX 86400` — NX = only set if not exists. Returns OK = process; returns nil = skip. Idempotent by design: some operations are naturally idempotent. Setting a user\'s status to "active" is idempotent (setting it twice = same result). Incrementing a counter is not (incrementing twice = wrong count). Design your message handlers toward idempotent operations where possible.',
      example:
        'Stripe handles this brilliantly with their idempotency key API. When charging a customer, you pass an `Idempotency-Key: <uuid>` header. If the network drops and you retry, Stripe detects the same key and returns the original charge response instead of charging again. The entire API is idempotent by design — safe to retry anything.',
    },
    {
      title: 'The Two Generals Problem — Why Exactly-Once Is Fundamentally Hard',
      icon: '🤔',
      layman:
        'Why is exactly-once so hard to achieve? It comes down to a fundamental problem in distributed systems: you can never be 100% certain that a message was received unless you get an acknowledgement — but the acknowledgement itself might get lost. This creates an unsolvable dilemma without additional mechanisms.',
      technical:
        'The Two Generals Problem (or Byzantine Generals Problem simplified): General A wants to confirm General B received the message. A sends message → B receives → B sends ack → A receives ack. But what if the ack is lost? A doesn\'t know if B got the original. A retries → B gets it twice. Or B sends ack, it\'s lost, A retries, B nacks the duplicate — A doesn\'t know if the original was processed. The only escape: (1) Deduplication at the consumer with idempotency keys — technically at-least-once + deduplication ≈ exactly-once semantics. (2) Kafka transactions — coordinate producer ID, sequence numbers, and consumer offset commits atomically. (3) Two-phase commit — coordinate across multiple systems (expensive, slow). In practice, "exactly-once" in Kafka means "exactly-once within the Kafka system" — guaranteeing idempotent producer + consumer offsets + atomic writes. External side effects (DB writes, emails) still require application-level idempotency.',
      example:
        'Even Kafka\'s "exactly-once" semantics doesn\'t prevent you from charging a customer twice if your consumer crashes after charging but before committing the Kafka offset. True end-to-end exactly-once requires idempotency at every layer. Stripe\'s idempotency key + your DB deduplication table + Kafka offset commitment = practical exactly-once.',
    },
  ],

  comparison: {
    caption: 'Three delivery guarantees — the trade-off matrix',
    columns: ['Property', 'At-Most-Once', 'At-Least-Once', 'Exactly-Once'],
    rows: [
      ['Message loss possible', '✅ Yes (fire-and-forget)', '❌ Never', '❌ Never'],
      ['Duplicate processing possible', '❌ Never', '✅ Yes (requires idempotency)', '❌ Never'],
      ['Producer overhead', 'None (no ack)', 'Low (ack + retry)', 'High (transactions)'],
      ['Consumer overhead', 'None (no ack)', 'Low (ack per message)', 'High (atomic commit)'],
      ['Throughput (Kafka)', '~1M msgs/sec', '~800k msgs/sec', '~200k msgs/sec'],
      ['Implementation complexity', 'Very low', 'Low + idempotency', 'High'],
      ['Best for', 'Metrics, telemetry, gaming state', 'Most production workloads', 'Financial transactions, critical state'],
    ],
  },

  realWorldExamples: [
    {
      company: 'Stripe',
      icon: '💳',
      description:
        'Stripe\'s payment processing uses idempotency keys across their entire API to achieve safe at-least-once semantics. Every charge, refund, or payment intent can be safely retried with the same idempotency key — Stripe deduplicates at the API level. Their engineering blog describes how they handle exactly-once payment semantics despite unreliable networks: the key is treating idempotency as a first-class API primitive.',
    },
    {
      company: 'Kafka (Confluent)',
      icon: '🟦',
      description:
        'Kafka introduced exactly-once semantics in version 0.11 (2017), a significant milestone. Idempotent producers (deduplication via producer ID + sequence number) combined with transactional APIs allow atomic read-process-write pipelines. Used by financial institutions, trading platforms, and any application where processing an event twice has catastrophic consequences.',
    },
    {
      company: 'WhatsApp',
      icon: '💬',
      description:
        'WhatsApp uses at-least-once delivery for messages with application-level deduplication. Messages have unique IDs; if a message is re-delivered (network retry), the app recognizes the ID and discards the duplicate. You\'ve seen this: occasionally a message appears twice in a chat if there\'s a poor connection. This is the at-least-once delivery model with imperfect deduplication visible to the user.',
    },
    {
      company: 'AWS SQS',
      icon: '☁️',
      description:
        'SQS Standard queues provide at-least-once delivery — the documentation explicitly states messages may be delivered more than once. SQS FIFO queues provide exactly-once processing within the 5-minute deduplication window using a MessageDeduplicationId. This is why every SQS guide tells you to design idempotent consumers — it\'s not a suggestion, it\'s a requirement for correctness.',
    },
  ],

  interviewQuestions: [
    {
      question: 'Explain at-most-once, at-least-once, and exactly-once delivery semantics. Which would you use for a payment processing system?',
      answer:
        'At-most-once: send once, no retry. Messages may be lost, never duplicated. For payments: unacceptable — a lost payment event means the customer pays but the order isn\'t processed. At-least-once: send with retry until ack received. Messages may be duplicated (retry after missed ack). For payments: possible if consumers are idempotent — use a payment intent ID as deduplication key; processing the same payment intent twice returns the first result. Exactly-once: no loss, no duplicates. For payments: ideal but expensive — use Kafka transactions or database-level idempotency (unique constraint on payment intent ID). In practice: at-least-once + idempotent consumer (unique payment ID in DB with `ON CONFLICT DO NOTHING`) is the industry standard. True exactly-once is reserved for cases where idempotency at the consumer is impossible.',
    },
    {
      question: 'How do you implement idempotency in a message consumer to handle at-least-once delivery?',
      answer:
        'Three patterns: (1) Database unique constraint: every message has a unique ID. `INSERT INTO processed_messages (message_id) VALUES ($1) ON CONFLICT (message_id) DO NOTHING RETURNING id`. If returns a row, process. If returns nothing, already processed — skip and ack. Do this inside a transaction with your business logic. (2) Redis SET NX: `SET processed:{messageId} 1 NX EX 86400`. If returns OK, process and ack. If returns nil, skip and ack. (3) Business-level idempotency: design operations to be naturally idempotent. "Set order status to shipped" is idempotent — setting it twice doesn\'t double-ship. "Send confirmation email" is not — check the DB for an existing sent record. Choose based on message volume: DB is durable; Redis is faster but loses data on restart.',
    },
    {
      question: 'Why is exactly-once delivery so hard in distributed systems?',
      answer:
        'The fundamental problem is that acknowledgements can be lost. Producer sends message → broker receives → broker sends ack → network drops ack → producer retries → broker receives duplicate. To prevent duplicates at the broker: idempotent producer assigns a sequence number; broker deduplicates. To prevent duplicates at the consumer: consumer must commit its processed offset atomically with its business logic output. In Kafka: this is the transactions API — read from topic A, write to DB, write to topic B, commit offset A, all atomically. But "exactly-once" within Kafka doesn\'t cover external side effects (sending an email, calling an external API). Those require application-level idempotency. True end-to-end exactly-once is extremely difficult; in practice, at-least-once + idempotency achieves the same result with less complexity.',
    },
  ],

  commonMistakes: [
    'Assuming at-least-once means at-most-once in practice — under normal conditions duplicates are rare, but a system designed without idempotency will fail catastrophically during network issues or rolling deploys.',
    'Making consumers idempotent but not using the same DB transaction for idempotency check and business logic — race conditions between two concurrent consumers processing the same message.',
    'Using at-exactly-once everywhere — the 5× performance overhead is only justified for truly idempotency-impossible operations; overuse cripples throughput.',
    'Treating auto-commit offsets as safe — Kafka\'s `enable.auto.commit=true` commits the offset before processing is complete; a crash loses that message permanently despite at-least-once being the stated guarantee.',
    'No monitoring for duplicate processing rates — track how often your idempotency checks trigger; a sudden spike means delivery is misbehaving upstream.',
  ],

  metrics: [
    { name: 'Kafka throughput (at-most-once, acks=0)', value: '~1M msgs/sec', notes: 'No ack round-trip' },
    { name: 'Kafka throughput (at-least-once, acks=1)', value: '~800k msgs/sec', notes: 'Leader ack' },
    { name: 'Kafka throughput (exactly-once, transactions)', value: '~150–200k msgs/sec', notes: 'Transaction overhead' },
    { name: 'SQS Standard max delivery attempts', value: '1–10 (configurable)', notes: 'Before DLQ or deletion' },
    { name: 'Idempotency check overhead (Redis NX)', value: '~0.5–1 ms', notes: 'Per message, same region Redis' },
    { name: 'Idempotency check overhead (Postgres unique insert)', value: '~2–5 ms', notes: 'Per message, includes network' },
  ],
};
