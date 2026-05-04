import type { ConceptDeepDive } from '../../types';

export const syncVsAsync: ConceptDeepDive = {
  moduleId: 'sync-vs-async-communication',
  tagline: 'Wait for the answer or fire and forget — the fundamental trade-off in distributed systems',

  introduction: {
    layman:
      'Imagine asking a colleague a question. Synchronous: you tap them on the shoulder, they stop what they\'re doing, answer you, then you both continue. You waited, they were interrupted, but the exchange is immediate. Asynchronous: you drop a note on their desk, walk away, and continue your own work. They answer when they have time; you check back later. Both get the job done — but the right choice depends entirely on whether you need the answer before you can continue.',
    analogy:
      'A restaurant analogy: synchronous is table service — you order, the waiter runs to the kitchen, stands there waiting, brings your food back, then takes the next table\'s order. Asynchronous is a ticket system — the waiter takes 10 orders, each with a ticket number, gives them all to the kitchen at once, and the kitchen shouts out numbers when dishes are ready. The second approach serves more customers — but you don\'t get your food the moment you ask.',
    whyMatters:
      'The sync/async decision is made dozens of times per day in production systems. Get it wrong and you end up with either unnecessary slowness (doing async work synchronously) or confusing UX (telling users "we\'ll get to it" when they need an instant answer). Every distributed system design interview requires you to identify which service calls should be synchronous and which should go through a queue. Understanding this trade-off is foundational to everything from microservices to event-driven architecture.',
  },

  subTopics: [
    {
      title: 'Synchronous Communication — Call and Wait',
      icon: '📞',
      layman:
        'In synchronous communication, the caller sends a request and blocks until it gets a response. The entire flow is sequential: request → wait → response → continue. Everything is predictable and immediate, but the caller can\'t do anything else while waiting.',
      technical:
        'REST API calls, gRPC unary calls, database queries — all synchronous. The caller\'s thread (or coroutine) is suspended until the response arrives. Chained synchronous calls create a dependency chain: if Service A calls B calls C, A\'s response time = B\'s + C\'s latency. Total latency compounds with each hop. Timeouts are critical — without them, a slow downstream can block callers indefinitely. Circuit breakers prevent cascading failures when a dependency is slow or down.',
      example:
        'Checkout flow: user clicks "Pay" → your API calls the payment processor synchronously (you need to know if it succeeded before confirming the order). Synchronous is correct here — the user is waiting and needs a definitive answer before you can say "order confirmed."',
      whenToUse:
        'Use synchronous when: the caller needs the result before it can proceed, the result must be returned to an end user immediately, failure should immediately surface to the caller, or the operation is fast (< 500ms) and doesn\'t depend on slow external systems.',
    },
    {
      title: 'Asynchronous Communication — Fire and Continue',
      icon: '📬',
      layman:
        'In asynchronous communication, the caller sends a message and moves on immediately without waiting for processing to complete. The work happens in the background — handled by a different process, possibly on a different server, possibly at a different time.',
      technical:
        'Implemented via message queues (Kafka, SQS, RabbitMQ), event buses, or async HTTP (webhook callbacks). The caller publishes a message and gets an acknowledgement that the message was received (not that the work is done). A consumer service picks up the message and processes it independently. Decouples producer from consumer: they don\'t need to be running simultaneously, and the consumer can process at its own pace.',
      example:
        'After checkout: the payment succeeded synchronously, but now you need to send a confirmation email, update inventory, generate a PDF receipt, notify warehouse, and update analytics. None of these need to happen in the 200ms before you show the user "order confirmed." Publish one "order.confirmed" event to a queue; downstream services handle each task independently.',
      whenToUse:
        'Use asynchronous when: the work can happen after responding to the user, the operation is slow (image processing, PDF generation, ML inference), the work can fail and retry without user impact, or you need to notify multiple systems about one event.',
    },
    {
      title: 'Latency Impact — How Async Changes System Performance',
      icon: '⚡',
      layman:
        'Asynchronous processing dramatically improves user-facing response times by moving slow work off the critical path. The user sees a fast response; the slow work happens in the background.',
      technical:
        'Synchronous chain: UserRequest → ServiceA (10ms) → ServiceB (50ms) → ServiceC (200ms) → ServiceD (100ms). Total: 360ms. User waits for all of it. Async refactor: UserRequest → ServiceA (10ms) → publish to queue (5ms) = 15ms response. Queue consumers handle B, C, D asynchronously. User response is 24× faster. The key insight: most tasks in a user request are not in the critical path. Identify which steps are truly blocking (need the result to proceed) vs. side effects (can happen later). Async everything that isn\'t blocking.',
      example:
        'Instagram photo upload: synchronous — receive photo, validate format, write to storage = 300ms. Everything else (resize for every device, generate thumbnails, run content moderation, update follower feeds for 10M followers) is async. User gets "uploaded!" in 300ms; fans see the photo seconds later.',
    },
    {
      title: 'Common Async Patterns',
      icon: '🔧',
      layman:
        'Once you go async, you need patterns to track work, handle failures, and coordinate across services. Here are the most important ones.',
      technical:
        'Request-Reply async: publisher sends a message with a correlation ID and reply queue; consumer processes and publishes result to the reply queue; original publisher reads from its reply queue. Job queue: tasks submitted to a queue; worker pool processes tasks; result stored in DB for polling or callback. Saga pattern: a sequence of async transactions where each step publishes an event; next step triggers on previous step\'s success event; compensating transactions undo completed steps on failure. Event sourcing: all state changes are events stored in order; current state is derived by replaying events — every action is inherently async/logged. Outbox pattern: instead of publishing directly to a queue (which can fail mid-transaction), write the event to a DB "outbox" table in the same transaction, then a background process reliably publishes it.',
      example:
        'Order fulfillment saga: OrderPlaced event → Payment service charges card → PaymentConfirmed event → Inventory service reserves items → ItemsReserved event → Warehouse service creates shipment → OrderShipped event. If inventory is out of stock: ItemsUnavailable event → compensating transaction refunds payment. Each step is async; failures trigger rollback events.',
    },
    {
      title: 'Failure Modes & The Hard Parts of Async',
      icon: '⚠️',
      layman:
        'Async systems are more complex to reason about. If something fails, you might not know immediately. Messages can be processed more than once. Events can arrive out of order. Debugging an async system means tracing a request across multiple services and queue consumers.',
      technical:
        'Key challenges: (1) Eventual consistency: async updates mean different services see different states at different times. A user\'s order might show "processing" on one dashboard and "fulfilled" on another momentarily. (2) Idempotency: message queues deliver at-least-once. Consumers must handle duplicate messages safely (see: delivery semantics). (3) Out-of-order delivery: event for "order cancelled" might arrive before "order created" at the consumer. Use sequence numbers or event timestamps to handle ordering. (4) Debugging: distributed tracing (OpenTelemetry, Jaeger) adds correlation IDs to follow a request across all async hops. Without tracing, debugging async failures is nearly impossible in production.',
      example:
        'The classic distributed systems headache: user cancels an order, but the cancellation event and fulfillment event are processed in the wrong order by the warehouse service. Warehouse fulfills first, then processes cancellation and does nothing (order is now erroneously fulfilled). Fix: warehouse checks order status before fulfilling, or uses event sequence numbers to reject out-of-order events.',
    },
  ],

  comparison: {
    caption: 'When to use synchronous vs asynchronous communication',
    columns: ['Dimension', 'Synchronous', 'Asynchronous'],
    rows: [
      ['Response time', 'Dependent on all downstream services', 'Fast (offloads work to queue)'],
      ['User experience', 'Immediate feedback', '"We\'re processing it" — then update later'],
      ['Failure visibility', 'Immediate — errors surface to caller', 'Delayed — failures logged, may need polling'],
      ['Service coupling', 'Tight (caller waits on receiver)', 'Loose (sender/receiver independent)'],
      ['Duplicate handling', 'Not needed (one request = one response)', 'Required (at-least-once delivery)'],
      ['Debugging complexity', 'Low (linear stack trace)', 'High (trace spans multiple services)'],
      ['Scalability', 'Limited by slowest downstream', 'Consumers can scale independently'],
      ['Best for', 'User-facing reads, payment auth, simple CRUD', 'Email, notifications, file processing, fan-outs'],
    ],
  },

  realWorldExamples: [
    {
      company: 'Uber',
      icon: '🚗',
      description:
        'Uber\'s ride request is synchronous — you need to know immediately if a driver accepted. But the downstream effects are async: the receipt email, the trip summary to your history, the driver\'s earnings update, the city-level demand analytics — all handled by event-driven async consumers that subscribe to the "trip.completed" event. The rider and driver both get instant confirmation; everything else catches up in seconds.',
    },
    {
      company: 'Amazon',
      icon: '📦',
      description:
        'Amazon\'s "Place Order" is synchronous (you see order confirmed instantly). Everything after is async: warehouse picks the item, logistics books a courier, email confirmation sends, accounting records the transaction, inventory decrements, personalization updates "bought together" models. All triggered by the "order.placed" event on a queue. Different teams own each consumer; they scale and deploy independently.',
    },
    {
      company: 'Netflix',
      icon: '🎬',
      description:
        'Video upload at Netflix: the upload itself is synchronous (you need to know the bytes arrived). Transcoding to 20+ formats (4K, HD, mobile, low-bandwidth, different audio tracks, subtitles) is massively async. Each format is a separate job on a queue, processed by a worker farm. A 2-hour movie might take hours to fully transcode — async processing makes this feasible without keeping an HTTP connection open for hours.',
    },
    {
      company: 'GitHub',
      icon: '🐙',
      description:
        'Git push is synchronous — you get immediate confirmation that your code was received. But CI triggers, webhook notifications to Slack, email notifications to watchers, and index updates for search are all async. A push to a popular repository might trigger webhooks to hundreds of registered endpoints — doing that synchronously would make `git push` take 30 seconds.',
    },
  ],

  interviewQuestions: [
    {
      question: 'When would you choose async communication over sync in a microservices architecture?',
      answer:
        'Choose async when: (1) The work doesn\'t need to complete before responding to the caller — sending emails, generating reports, updating secondary indexes. (2) Multiple services need to react to one event — an order placed triggers inventory, billing, email, analytics; event fan-out via Pub/Sub is cleaner than synchronous calls to each. (3) The downstream is slow or unreliable — async decouples availability; if the email service is down, the queue absorbs the events until it recovers. (4) You need to rate-limit processing — a queue lets you control consumer throughput regardless of producer rate. Keep sync when: the user needs an immediate answer (authentication, payment validation), the result must flow back to the caller in the same request, or you need transactional consistency.',
    },
    {
      question: 'How do you ensure consistency in an async system when multiple services consume the same event?',
      answer:
        'Several strategies: (1) Idempotent consumers — each consumer handles duplicate delivery safely (check event ID before processing). (2) Outbox pattern — publish events transactionally with DB writes to avoid lost events or duplicate publishes. Write the event to a DB outbox table in the same transaction as the state change; a relay process publishes it to the queue. (3) Saga pattern with compensation — if a step fails, publish a compensating event that undoes previous steps. (4) Event sequencing — include a sequence number or version in events; consumers reject out-of-order events and request replay. (5) Distributed tracing — trace IDs propagate through all async hops for debugging consistency violations.',
    },
    {
      question: 'What is the "dual write problem" in async systems and how do you solve it?',
      answer:
        'The dual write problem: you need to both update the database AND publish a message to the queue atomically — but they\'re different systems and can\'t share a transaction. If you write to DB then crash before publishing, the event is lost. If you publish first then crash before DB write, you have an event with no corresponding state. Solutions: (1) Outbox pattern (most reliable) — write the event to an "outbox" table in the same DB transaction as the state change. A separate poller or CDC system reads from the outbox and publishes to the queue, marking entries as sent. Guarantees exactly-once publish. (2) Event sourcing — the event IS the source of truth; state is derived from events. No dual write because the event log is the database. (3) Transactional messaging (Kafka + DB in same XA transaction) — complex and rarely practical outside JVM ecosystems.',
    },
  ],

  commonMistakes: [
    'Making everything async "because microservices" — some operations genuinely need synchronous responses; async adds complexity without benefit there.',
    'Not implementing idempotency in async consumers — at-least-once delivery means duplicate messages will arrive; processing duplicates causes double-charges, double-sends, etc.',
    'Forgetting to handle the "dual write problem" — writing to DB and publishing to queue are not atomic; a crash between them causes lost events or phantom events.',
    'Not setting message TTL (time-to-live) — old events for cancelled orders can be processed hours later by a consumer, triggering actions on stale data.',
    'No dead-letter queue — messages that fail repeatedly silently disappear; a DLQ captures them for investigation.',
    'Distributed tracing not configured — async systems are nearly impossible to debug in production without trace IDs flowing through every service and queue hop.',
  ],
};
