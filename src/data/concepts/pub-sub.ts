import type { ConceptDeepDive } from '../../types';

export const pubSub: ConceptDeepDive = {
  moduleId: 'pub-sub',
  tagline: 'One event, many reactions — broadcast without knowing who\'s listening',

  introduction: {
    layman:
      'Imagine a radio station. The station (publisher) broadcasts music on a frequency. Anyone with a radio (subscriber) tuned to that frequency hears it. The station doesn\'t know who is listening, doesn\'t care if 3 people or 3 million people are tuned in, and doesn\'t need to send a separate copy to each listener. Pub/Sub in software works the same way: a service publishes an event ("order placed"), and any number of other services that have subscribed to that event receive their own copy and react to it independently.',
    analogy:
      'A newspaper subscription. The newspaper (publisher) prints one edition. Subscribers each get their own copy. The newspaper doesn\'t call each reader individually — it prints once, distributes copies. Readers decide what to do with their copy: one cuts out the sports section, one reads the crossword, one recycles it. The newspaper doesn\'t care.',
    whyMatters:
      'Pub/Sub is how modern microservices communicate without becoming tightly coupled. Without it, adding a new notification when an order is placed means editing the order service to know about the notification service — a dependency that grows fragile over time. With Pub/Sub, the order service just says "an order happened" and any number of downstream services react without the order service knowing they exist. It\'s the foundation of event-driven architecture, and interviewers ask about it in every system design involving multiple services reacting to shared events.',
  },

  subTopics: [
    {
      title: 'Core Concepts — Topics, Publishers, and Subscribers',
      icon: '📡',
      layman:
        'A pub/sub system has three components: topics (named channels), publishers (who send events to a topic), and subscribers (who listen on a topic). A publisher sends an event to a topic; the broker fans it out to all subscribers of that topic.',
      technical:
        'Topic: a named channel (e.g., "orders", "user-events", "payment.succeeded"). Publishers and subscribers are decoupled — they never talk directly. When a publisher sends a message to a topic, the broker creates a copy for each subscription and delivers it. Subscription: the binding between a subscriber and a topic. Each subscriber has its own queue (in AWS SNS+SQS model) or offset (in Kafka). Messages in one subscription don\'t affect another — they\'re independent delivery pipelines. Filtering: subscribers can declare interest in only certain events (e.g., only `payment.succeeded` from the "payments" topic, not `payment.failed`).',
      example:
        'Twitter\'s timeline fan-out: when a user tweets, a "tweet.created" event is published. Multiple subscribers react: timeline-service (fan out to followers\' feeds), notification-service (push notifications for mentions), trending-service (update trending topics), search-indexer (make tweet searchable), analytics-service (record the event). Twitter doesn\'t call each service — they all subscribe to the tweet event and react independently.',
    },
    {
      title: 'Fan-Out — One Event, Many Consumers',
      icon: '📣',
      layman:
        'The core value of Pub/Sub is fan-out: one message published triggers reactions in many services simultaneously. The publisher does one unit of work; subscribers do their work in parallel.',
      technical:
        'Fan-out models: (1) Topic fan-out: broker sends a copy to every subscription. All subscribers receive in parallel. (2) Filtered fan-out: broker evaluates each subscription\'s filter and only sends to matching ones. (3) Fan-out + work queue: SNS → multiple SQS queues. SNS fans out to N SQS queues (each representing a different microservice\'s work queue). Each SQS queue then has its own consumer group processing independently. This is the AWS reference pattern for event-driven microservices. Fan-out at scale: 1 event → 100 subscribers means 100 separate delivery operations. If each subscriber has 1,000 consumers, a single event creates 100,000 database writes. Design for the throughput of the most subscribed event.',
      example:
        'Shopify product update: merchant updates a product price. "product.updated" event published. Fan-out to: CDN cache invalidation service (purge cached product pages), search index service (re-index the product), inventory service (trigger reorder logic), analytics service (record pricing change), all merchant\'s apps and integrations. One event, eight subscribers, all notified in milliseconds.',
    },
    {
      title: 'Decoupling — The Architecture Superpower',
      icon: '🔓',
      layman:
        'The most important thing about Pub/Sub is what it removes: direct dependencies. Service A doesn\'t need to know about Services B, C, or D. If you add a new service E that needs to react to A\'s events, you just subscribe E — zero changes to A.',
      technical:
        'Without Pub/Sub (choreography via direct calls): OrderService calls PaymentService, calls InventoryService, calls NotificationService, calls AnalyticsService. Adding RewardService means editing OrderService — a new deployment, new tests, new risk. With Pub/Sub: OrderService publishes "order.placed". Each downstream service independently subscribes. Adding RewardService = add a new subscription — OrderService never changes. Services can be deployed, scaled, and failed independently. Operational benefit: services deploy at their own pace. If AnalyticsService is down, the queue absorbs events; when it restarts, it processes from where it left off. OrderService never knew or cared.',
      example:
        'Uber Eats: originally, completing a delivery called 3 services directly. Over time, they needed to notify 15 more systems (driver app, restaurant dashboard, loyalty points, data warehouse, fraud detection...). With pub/sub, "delivery.completed" is published once; 18 teams subscribe independently. Adding new subscribers never touches the delivery service.',
    },
    {
      title: 'Message Ordering and Delivery Guarantees in Pub/Sub',
      icon: '📋',
      layman:
        'When you broadcast an event to multiple subscribers, do they all receive it at the same time? In the same order? What if one subscriber is slow? Each pub/sub system makes different trade-offs on these questions.',
      technical:
        'At-least-once delivery (most systems): each subscriber gets every message at least once. Duplicates possible; subscribers must be idempotent. Exactly-once delivery (harder, rare): some systems (Kafka transactions, SQS FIFO) provide this at extra complexity/cost. Ordering: per-topic ordering is hard at scale. Solutions: Kafka partitions (ordered within partition, parallelized across partitions). Google Pub/Sub: no global ordering guarantee; use ordering keys to request ordering for a subset of messages. Fan-out timing: all subscribers notified "simultaneously" in practice — each has an independent queue; slow subscriber doesn\'t block fast one.',
      example:
        'A banking ledger using Kafka: all transactions for account ACC-123 publish with partition key = accountId. All subscribers see ACC-123\'s events in strict order within their partition. Two subscribers — audit-service and balance-service — each maintain independent, consistent views of the account state without any coordination.',
    },
    {
      title: 'Pub/Sub Implementations — SNS+SQS, Kafka, Redis, Google Pub/Sub',
      icon: '🛠️',
      layman:
        'Different systems implement pub/sub with different trade-offs. The right choice depends on your scale, cloud provider, ordering needs, and how long you want to retain events.',
      technical:
        'AWS SNS + SQS: SNS is the pub/sub broker; SQS is the work queue for each subscriber. Pattern: topic (SNS) → N queues (SQS) → N consumer services. Fully managed, scales automatically. No message retention in SNS; SQS retains up to 14 days. Kafka: topics with partitions; consumer groups each get a full copy. Messages retained by time/size. Replay possible. High throughput. Best for event streaming. Redis Pub/Sub: in-memory, fire-and-forget. Messages not persisted — if subscriber is down when message is published, it\'s lost. Not for critical events. Good for real-time notifications where message loss is acceptable (e.g., live chat read receipts). Google Cloud Pub/Sub: fully managed, at-least-once delivery, ordering keys, subscription filters, message retention up to 7 days. Native GCP integration.',
      example:
        'Startup architecture: SNS + SQS is 30 minutes to set up, zero ops, infinite scale at low volumes. When "order.placed" fires, SNS delivers to three SQS queues: one per microservice. As you grow, swap the SQS consumers for Kafka for replay capability and higher throughput — but start with managed services.',
    },
  ],

  comparison: {
    caption: 'Pub/Sub implementations — key differences',
    columns: ['Feature', 'AWS SNS+SQS', 'Kafka', 'Redis Pub/Sub', 'Google Pub/Sub'],
    rows: [
      ['Message persistence', 'SQS: up to 14 days', 'By time/size (configurable)', 'None (in-memory only)', 'Up to 7 days'],
      ['Replay capability', '❌', '✅ Rewind to any offset', '❌', '⚠️ Limited (within retention)'],
      ['Throughput', 'High (managed)', 'Very high (millions/sec)', 'Very high (in-memory)', 'High (managed)'],
      ['Ordering guarantee', 'FIFO: per group; Standard: none', 'Per partition', 'Publication order (no persistence)', 'Ordering keys'],
      ['Operational overhead', 'None (fully managed)', 'High (cluster ops)', 'Low–medium', 'None (fully managed)'],
      ['Fan-out model', 'SNS → N SQS queues', 'Consumer groups on same topic', 'All active subscribers', 'Subscriptions per topic'],
    ],
  },

  realWorldExamples: [
    {
      company: 'Twitter',
      icon: '🐦',
      description:
        'Twitter\'s timeline is one of the most famous pub/sub fan-out challenges. When a celebrity with 100M followers tweets, the event fans out to 100M inbox updates. Twitter uses a hybrid approach: for "heavy" users (high follower count), updates are computed at read time. For normal users, a Pub/Sub-driven fan-out writes precomputed timeline entries. Kafka handles the event stream; fan-out workers consume and write to Redis timeline caches.',
    },
    {
      company: 'Spotify',
      icon: '🎵',
      description:
        'Spotify uses Kafka as their event backbone with a pub/sub model. When a user plays a track, a "track.played" event fans out to: recommendation engine (update listening history), royalty tracking (count the play for payment), playlist analytics, personalization models, social features (update "listening to" status). Each team owns their consumer independently; Spotify\'s data platform team owns Kafka infrastructure.',
    },
    {
      company: 'Stripe',
      icon: '💳',
      description:
        'Stripe\'s internal architecture uses pub/sub extensively. When a payment is authorized, the event fans out to: fraud detection (log the pattern), webhook delivery (notify merchant), financial ledger (record the transaction), dashboard (update real-time metrics), regulatory reporting. Stripe also exposes this as their external webhook product — effectively pub/sub as a service for their customers.',
    },
    {
      company: 'Slack',
      icon: '💬',
      description:
        'Slack\'s message delivery uses pub/sub to fan out messages to workspace members. When a message is sent to a channel with 500 members, the event is published and the fan-out service delivers it to each member\'s connection server. Connected members see it instantly via WebSocket. Offline members get it when they reconnect. The pub/sub model means the sending service doesn\'t manage individual delivery — that\'s the fan-out service\'s job.',
    },
  ],

  interviewQuestions: [
    {
      question: 'What is the difference between a message queue and pub/sub?',
      answer:
        'A message queue (work queue) delivers each message to exactly one consumer from a pool of competing consumers — used to distribute work. The message is deleted after one consumer processes it. Pub/Sub delivers each message to ALL subscribers — each subscriber gets their own copy. Used to broadcast events to multiple independent consumers. Analogy: work queue = assigning one task from a stack to available workers (each task done once). Pub/Sub = announcing to the whole company that a meeting is starting (everyone hears it). In practice, they\'re combined: Kafka consumer groups give work-queue behavior within a group, but multiple groups each get all messages (pub/sub across groups). AWS SNS is pub/sub; SQS is the work queue for each subscriber.',
    },
    {
      question: 'How would you design a notification system that alerts users across email, SMS, and push when an order ships?',
      answer:
        'Event-driven pub/sub approach: (1) Order service publishes "order.shipped" event to a pub/sub topic with order details (orderId, userId, trackingNumber). (2) Three subscriber services each get a copy: email-service, sms-service, push-notification-service. Each has its own queue (SQS) behind the SNS topic. (3) Each service processes independently at its own pace, using its own external API (SendGrid, Twilio, Firebase). (4) User preferences: before sending, each service queries a user-preferences service (or reads from cached preferences in the event payload) to check opt-in status and preferred channels. (5) Retry: each SQS queue retries on failure; dead-letter queues capture permanently failed deliveries. Benefits: adding a new channel (WhatsApp) = new subscriber, no changes to order service. Channel is down = its queue buffers; others unaffected.',
    },
    {
      question: 'What is fan-out at scale and what are the challenges with it?',
      answer:
        'Fan-out is delivering one event to many subscribers. Challenges: (1) Amplification — one tweet to 100M followers = 100M writes. Naive fan-out (write to each follower\'s feed) doesn\'t scale for celebrity accounts. Solution: hybrid fan-out — fan out to normal users (< 1M followers), compute celebrity feeds at read time. (2) Hot partitions — if events for one key (e.g., a viral product) dominate one Kafka partition, that partition becomes a bottleneck. Solution: key randomization with secondary routing. (3) Slow subscribers — in systems where one slow subscriber blocks others, use separate queues per subscriber (SNS+SQS pattern ensures independence). (4) Ordering at scale — maintaining strict order across fan-out is hard; partition keys give ordering within a partition. (5) Exactly-once at scale — guaranteeing no duplicates to all subscribers adds significant complexity; most systems accept at-least-once and require idempotent consumers.',
    },
    {
      question: 'How does pub/sub help with service decoupling in a microservices architecture?',
      answer:
        'Without pub/sub, Service A calling Services B, C, D creates direct dependencies: A must know B, C, D exist; A\'s code must change when you add E; if C is slow, A is slow; if D is down, A\'s call fails. With pub/sub: A publishes "event.happened" to a topic and returns — it knows nothing about B, C, D. B, C, D subscribe and react independently. Adding E = add a new subscription, zero code change in A. C being slow doesn\'t affect A or D. D being down doesn\'t affect A — events queue up until D recovers. This is the Open/Closed Principle in architecture: A is open for extension (new subscribers) without modification. The trade-off: eventual consistency (A can\'t know if B processed the event yet), harder debugging (trace IDs across services), and the need for idempotent consumers.',
    },
  ],

  commonMistakes: [
    'Using pub/sub when a direct call would be simpler — not every service interaction needs an event bus; adding pub/sub to a simple request adds latency and complexity.',
    'No message filtering — subscribing to all events and filtering in consumer code wastes bandwidth and consumer resources; use broker-side filters.',
    'Forgetting idempotency — at-least-once delivery means duplicates will arrive; non-idempotent handlers send duplicate emails or charge customers twice.',
    'Not monitoring subscriber lag — if consumers fall behind publishers, events pile up unprocessed; alert when lag exceeds a threshold.',
    'One topic for everything — a single monolithic topic becomes a noisy catch-all; use meaningful topic names (payments.charged, orders.placed) and consumer-specific subscriptions.',
    'Not handling event schema evolution — changing the event payload structure breaks existing subscribers; use a schema registry (Confluent Schema Registry for Kafka) and add fields, never remove them.',
  ],
};
