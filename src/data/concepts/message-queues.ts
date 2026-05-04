import type { ConceptDeepDive } from '../../types';

export const messageQueues: ConceptDeepDive = {
  moduleId: 'message-queues',
  tagline: 'Decouple producers from consumers — the buffer that makes distributed systems resilient',

  introduction: {
    layman:
      'Imagine a restaurant kitchen. Orders come in from tables at unpredictable speeds — sometimes 3 at once, sometimes none for 10 minutes. If each waiter had to stand at the grill and wait for their order to be cooked before taking new orders, the restaurant would grind to a halt. Instead, orders go to a ticket rail — a queue. Waiters drop off tickets and go back to customers. Cooks process at their own pace. The ticket rail (message queue) is the buffer between the front-of-house (producer) and the kitchen (consumer), letting each operate at their own speed.',
    analogy:
      'A postal sorting facility. Letter senders (producers) drop mail off at post offices throughout the day. Sorting machines and delivery trucks (consumers) process them in batches on their own schedule. If there\'s a surge of holiday mail, it piles up in the facility rather than overwhelming delivery drivers. The facility also ensures every letter eventually gets delivered — even if a delivery truck breaks down, the letters wait for the next one.',
    whyMatters:
      'Message queues are the backbone of every scalable distributed system. They solve three critical problems: (1) Decoupling — producers and consumers don\'t know about each other; add a new consumer without changing the producer. (2) Load leveling — a queue absorbs traffic spikes so a consumer isn\'t overwhelmed by bursts. (3) Reliability — if a consumer crashes, messages wait in the queue and are reprocessed when it recovers. Every senior engineer uses queues regularly, and every system design interview for backend roles tests your knowledge of them.',
  },

  subTopics: [
    {
      title: 'Core Concepts — Producers, Consumers, and Brokers',
      icon: '🔧',
      layman:
        'A message queue has three roles: the producer sends messages, the broker stores and manages them, and the consumer reads and processes them. None of these know much about the others, which is the whole point.',
      technical:
        'Producer: any service that sends a message to the queue. Fire-and-forget — it doesn\'t wait for the consumer to process. Broker: the queue server (Kafka cluster, RabbitMQ node, SQS service). Persists messages until consumed. Manages delivery guarantees, ordering, and retries. Consumer: a service that subscribes to or polls the queue. Processes one message at a time (or in batches). Acknowledges successful processing (ack) so the broker can discard the message. On failure, nacks (negative ack) so the broker retries or dead-letters. Consumer group: multiple consumer instances sharing work — each message goes to exactly one consumer in the group (work distribution).',
      example:
        'E-commerce order processing: Checkout service (producer) publishes `{"orderId":"123","items":[...],"total":49.99}` to the "orders" queue. Three consumer services independently consume from the same queue: email-service (sends confirmation), inventory-service (decrements stock), analytics-service (records the sale). Each gets its own copy of every message, processes independently.',
    },
    {
      title: 'Message Queue vs Pub/Sub — Two Models',
      icon: '🔀',
      layman:
        'There are two fundamental messaging patterns: a queue where each message is processed by exactly ONE consumer, and pub/sub where each message is delivered to ALL subscribers. Queues are for work distribution (divide labor). Pub/sub is for broadcasting (notify everyone).',
      technical:
        'Queue (point-to-point): multiple consumers compete to pull messages. Each message is processed exactly once. Used for: task distribution, work queues, parallel processing. If consumer A processes order #123, consumer B won\'t. Pub/Sub (publish-subscribe): message is copied and delivered to every subscriber independently. Used for: event fan-out, notification broadcast, feed updates. If 5 services subscribe to "order.placed", all 5 get a copy. Hybrid: Kafka topics support both — consumer groups compete (queue behavior within a group) but multiple groups each get all messages (pub/sub behavior across groups). SQS + SNS: SNS is pub/sub (fan-out to multiple SQS queues); each SQS queue is then a work queue for one consumer service.',
      example:
        'When an Uber trip ends: "trip.completed" event published to Kafka. Consumer Group A (payment workers) compete to process the payment for the trip. Consumer Group B (email workers) compete to send the receipt. Consumer Group C (analytics workers) compete to record the data. All three groups see every event; within each group, only one worker processes each event.',
      whenToUse:
        'Use a work queue when you have N tasks to distribute across N workers (parallel processing). Use pub/sub when an event must notify multiple independent systems. Use Kafka when you need both patterns simultaneously, or when you need event replay.',
    },
    {
      title: 'Message Persistence & Durability',
      icon: '💾',
      layman:
        'One of the most valuable properties of a message queue is that messages survive crashes. If your consumer crashes while processing, the message isn\'t lost — it stays in the queue and gets redelivered when the consumer restarts.',
      technical:
        'In-memory queues (Redis lists without persistence): fast but messages lost on restart. Disk-backed queues (RabbitMQ with durable queues, Kafka with log files): messages survive broker restarts. Acknowledgement (ack) flow: (1) Consumer receives message — message is "in-flight," still in queue. (2) Consumer processes successfully → sends ack → broker deletes message. (3) Consumer crashes or sends nack → broker re-queues message for redelivery. Visibility timeout (SQS) / ack deadline (Pub/Sub): if no ack within T seconds, broker re-queues. Prevents messages from being lost if a consumer crashes mid-processing. Kafka difference: messages aren\'t deleted after consumption. Each consumer group tracks an "offset" (position). Messages retained for configurable period (default 7 days). Consumers can replay from any offset.',
      example:
        'AWS SQS visibility timeout: consumer receives a message, visibility timeout = 30s. If consumer doesn\'t ack within 30s (it crashed), SQS makes the message visible again. Another consumer instance picks it up. This is why you need idempotent consumers — the same message may be processed twice in this scenario.',
    },
    {
      title: 'Ordering & Partitioning',
      icon: '📊',
      layman:
        'In a simple queue, messages are delivered in order — first in, first out. But when you have multiple consumers and millions of messages, maintaining strict order becomes complex. Different systems make different trade-offs.',
      technical:
        'FIFO queues: strict order, but limit throughput (can\'t parallelize easily without partitioning). SQS FIFO queues: guarantee order within a MessageGroupId; different groups process in parallel. Kafka partitions: a topic is divided into partitions; within a partition, order is strict. Different partitions process in parallel. Producer assigns messages to partitions by key (e.g., userId hash) — all messages for user X go to partition 5, always in order. RabbitMQ: single queue is ordered; routing to multiple queues via exchange loses global order. When order matters most: financial transactions for one account, events for one user\'s state machine, game actions from one player.',
      example:
        'A bank processing transactions: all transactions for account "ACC-123" must be processed in order (deposit then withdrawal, not withdrawal then deposit). Kafka partition key = account number. All ACC-123 transactions go to the same partition, processed sequentially. Transactions for different accounts go to different partitions, processed in parallel. Perfect balance of ordering guarantees and throughput.',
    },
    {
      title: 'Popular Message Queue Systems — Kafka, RabbitMQ, SQS',
      icon: '🛠️',
      layman:
        'Three systems dominate the market: Kafka (the high-throughput log), RabbitMQ (the flexible router), and SQS (the fully managed AWS queue). Each is optimized for different use cases.',
      technical:
        'Kafka: distributed log — persistent, ordered, replayable, designed for millions of messages/second. Messages retained by time/size (not deleted on consumption). Great for: event streaming, data pipelines, activity feeds. Consumer groups can independently replay all events. Throughput: millions of msgs/sec per cluster. RabbitMQ: AMQP broker with flexible routing — exchanges route messages to queues via binding rules (direct, fanout, topic, headers). Supports complex routing, priority queues, delayed messages. Messages deleted after consumption. Great for: task queues, RPC-style async, complex routing. SQS: fully managed AWS queue with zero ops overhead. Two types: Standard (at-least-once, best-effort order, nearly unlimited throughput) and FIFO (exactly-once, strict order, 300 TPS limit). Great for: AWS-native workloads, serverless, teams that don\'t want to manage infrastructure.',
      example:
        'Spotify uses Kafka for everything: user play events (millions/second), playlist changes, recommendations pipeline. They don\'t need complex routing, they need throughput and replay. A startup e-commerce team might use SQS because it\'s 5 minutes to set up vs. weeks to operate a Kafka cluster. A fintech company might use RabbitMQ for its priority queues (high-priority payments before low-priority reports).',
      whenToUse:
        'Kafka: event streaming, data pipelines, high throughput, event replay. RabbitMQ: complex routing, task queues, priority, legacy AMQP systems. SQS: AWS-native, low operational overhead, standard task queues.',
    },
  ],

  comparison: {
    caption: 'Kafka vs RabbitMQ vs SQS — key differences',
    columns: ['Feature', 'Kafka', 'RabbitMQ', 'AWS SQS'],
    rows: [
      ['Message retention', 'Retained by time/size (default 7 days)', 'Deleted after ack', 'Deleted after ack (up to 14 days)'],
      ['Message replay', '✅ Any consumer group can rewind', '❌', '❌'],
      ['Throughput', 'Millions/sec (partitioned)', 'Thousands–hundreds of thousands/sec', 'Standard: virtually unlimited; FIFO: 300 TPS'],
      ['Ordering', 'Per partition', 'Per queue', 'FIFO: per group; Standard: best-effort'],
      ['Routing', 'Topics (simple)', 'Exchanges (very flexible)', 'Topic subscriptions via SNS'],
      ['Ops complexity', 'High (ZooKeeper/KRaft, partitions)', 'Medium', 'None (fully managed)'],
      ['Best for', 'Event streaming, data pipelines', 'Task queues, complex routing', 'Serverless, AWS-native workloads'],
    ],
  },

  realWorldExamples: [
    {
      company: 'LinkedIn',
      icon: '💼',
      description:
        'LinkedIn invented Kafka to handle activity stream data — profile views, connection requests, feed updates — at massive scale. They needed to process billions of events per day and replay them for new downstream consumers (e.g., a new recommendations service that needed historical data). Kafka\'s log-based model, where events are retained and replayable, was invented for exactly this use case.',
    },
    {
      company: 'Robinhood',
      icon: '📈',
      description:
        'Robinhood uses message queues to decouple trade execution from downstream effects. A trade executes synchronously (must confirm to the user). But updating portfolio value, sending push notifications, updating tax reporting, generating trade confirmations, and updating compliance records all happen asynchronously via queues. This lets trade execution stay fast while dozens of downstream effects happen in parallel.',
    },
    {
      company: 'Airbnb',
      icon: '🏠',
      description:
        'Airbnb uses Kafka as their central event bus. When a booking is confirmed, a "booking.created" event is published. 20+ downstream services consume it: host notifications, guest messaging, payment processing, calendar blocking, fraud detection, analytics, pricing model updates. Without a message queue, Airbnb would need to know about every downstream service and call each one — adding a new consumer would require changing the booking service.',
    },
    {
      company: 'Netflix',
      icon: '🎬',
      description:
        'Netflix\'s video encoding pipeline uses message queues at every stage. When a video is uploaded, a "video.uploaded" message is queued. Workers pick it up and transcode to the first format, publishing a "encoding.complete" event when done. Subsequent pipeline stages (quality checking, DRM encryption, CDN distribution) are each triggered by the previous stage\'s completion event. The pipeline is resilient: any stage can retry independently without restarting the entire pipeline.',
    },
  ],

  interviewQuestions: [
    {
      question: 'What is a message queue and why would you use one instead of a direct service call?',
      answer:
        'A message queue is a durable buffer between a producer (sender) and consumer (processor). Instead of Service A calling Service B directly and waiting, A publishes a message to the queue and immediately returns. B processes asynchronously. Benefits: (1) Decoupling — A doesn\'t need to know B exists; you can add/remove consumers without touching A. (2) Load leveling — the queue absorbs traffic spikes; if A publishes 10,000 messages in a burst, B processes at a steady pace. (3) Reliability — if B crashes, messages wait in the queue; B resumes where it left off. (4) Retry — failed processing automatically retries without the caller involvement. Trade-offs: eventual consistency (B hasn\'t processed yet when A moves on), added complexity, harder to debug. Use queues for work that can be deferred: emails, notifications, image processing, analytics, any side effects of user actions.',
    },
    {
      question: 'How does Kafka differ from a traditional message queue like RabbitMQ?',
      answer:
        'The key difference is the storage model. RabbitMQ (and SQS) delete messages after they\'re acknowledged — they\'re "work queues." Kafka is a distributed log: messages are retained for a configurable period (default 7 days) regardless of consumption. Consumers track their own position ("offset") in the log. This enables: (1) Replay — a new analytics service can read all events from the beginning, not just future ones. (2) Multiple independent consumers — each consumer group reads the whole log independently; adding a new consumer group doesn\'t affect existing ones. (3) Event sourcing — Kafka can be the source of truth for system state. Trade-off: Kafka is operationally more complex (partition tuning, consumer group lag monitoring, offset management) and has a learning curve. For simple "process each task once" workloads, RabbitMQ or SQS is simpler.',
    },
    {
      question: 'What happens if your message consumer crashes mid-processing? How do you prevent message loss?',
      answer:
        'Most queues use an acknowledgement model to handle this. When a consumer receives a message, it\'s marked "in-flight" but not deleted. The consumer has a visibility window (SQS: configurable 0–12 hours, Kafka: consumer must commit the offset). If the consumer crashes or doesn\'t ack within the window, the broker re-queues the message for redelivery to another consumer. Result: at-least-once delivery — messages are never lost, but may be processed more than once. This requires consumers to be idempotent (processing the same message twice produces the same result). Pattern: use the message ID as an idempotency key in your database — `INSERT INTO processed_messages (message_id) ON CONFLICT DO NOTHING`. If the insert succeeds, process. If it conflicts, skip (already processed).',
    },
    {
      question: 'How would you use a message queue to process 1 million image uploads per hour?',
      answer:
        'Architecture: (1) Upload service: receives image, stores raw bytes in S3, publishes message `{s3Key, userId, uploadTime}` to "images.to-process" queue. Responds 200 immediately. (2) Processing workers: auto-scaled fleet subscribes to the queue. Each worker: pulls message, reads from S3, runs processing (resize to 5 formats, generate thumbnail, run content moderation), uploads results to S3, writes metadata to DB, acks the message. (3) Scaling: at 1M uploads/hour = ~280/second. If each takes 2s to process, need ~560 concurrent workers. Use auto-scaling based on queue depth metric. (4) Error handling: processing failures nack → message retried up to 3 times → dead-letter queue for manual review. (5) Progress tracking: after worker completes, publish "image.processed" event so the user\'s app can show the processed image. This keeps the upload fast (~50ms) while heavy processing happens async.',
    },
  ],

  commonMistakes: [
    'Not acknowledging messages after processing — messages re-queue indefinitely even after successful processing, causing repeated work.',
    'Not implementing idempotent consumers — at-least-once delivery means the same message will eventually be delivered twice; non-idempotent handlers cause double-charges or duplicate sends.',
    'Single consumer with no scaling — a single consumer instance is a bottleneck; consumer groups can parallelize work across many instances.',
    'Message size too large — queues are designed for small messages (< 1 MB); large payloads should go to object storage (S3) with only a reference in the queue message.',
    'No dead-letter queue (DLQ) — messages that repeatedly fail silently disappear; a DLQ captures them for debugging and manual replay.',
    'Ignoring consumer lag — in Kafka, if producers publish faster than consumers process, the lag grows until it\'s hours or days behind; monitor lag metrics and autoscale consumers.',
    'Using a queue where a synchronous call is simpler — not every service interaction needs a queue; adding a queue to a simple request-response adds latency, complexity, and eventual consistency unnecessarily.',
  ],

  metrics: [
    { name: 'Kafka throughput (single broker)', value: '~1M msgs/sec', notes: 'Depends on message size and replication factor' },
    { name: 'RabbitMQ throughput', value: '~50k–100k msgs/sec', notes: 'Per node; cluster scales linearly' },
    { name: 'SQS Standard throughput', value: 'Virtually unlimited', notes: 'AWS manages scaling automatically' },
    { name: 'SQS FIFO throughput', value: '300 TPS (3000 with batching)', notes: 'Ordering guarantee has throughput cost' },
    { name: 'Kafka message retention (default)', value: '7 days', notes: 'Configurable; limited by disk' },
    { name: 'SQS max message size', value: '256 KB', notes: 'Use S3 + SQS for larger payloads' },
  ],
};
