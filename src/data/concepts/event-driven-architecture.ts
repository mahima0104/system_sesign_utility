import type { ConceptDeepDive } from '../../types';

export const eventDrivenArchitecture: ConceptDeepDive = {
  moduleId: 'event-driven-architecture',
  tagline: 'Systems that react to things that happen — instead of constantly asking "anything new?"',

  introduction: {
    layman:
      'In a normal system, Service A calls Service B directly and waits for an answer — like calling a friend and staying on the line until they reply. ' +
      'In event-driven architecture (EDA), Service A instead shouts "something happened!" into a room, and whoever cares picks it up — no waiting, no direct connection. ' +
      'The services never even need to know each other exists.',
    analogy:
      'Imagine a restaurant kitchen. The cook doesn\'t walk out and hand food to each waiter — that would create chaos. ' +
      'Instead, the cook rings a bell when an order is ready. Any available waiter picks it up. ' +
      'The cook (producer) and waiter (consumer) are completely decoupled — the bell (event broker) handles the handoff. ' +
      'Swap one waiter for another, add three more cooks, and the bell system keeps working without any changes.',
    whyMatters:
      'WhatsApp, Uber, Netflix, and every major e-commerce site use EDA for their most critical flows. ' +
      'When someone places an Amazon order, one event triggers: warehouse picking, payment processing, email confirmation, loyalty points, and fraud detection — all in parallel, all independently. ' +
      'That is impossible with direct calls. EDA is what makes modern systems feel instant despite doing dozens of things at once.',
  },

  subTopics: [
    {
      title: 'What is an Event?',
      icon: '📣',
      layman:
        'An event is just a message that says "something happened." It is a fact about the past — immutable and timestamped. ' +
        '"Order placed", "Payment received", "User signed up", "Driver location updated" are all events.',
      technical:
        'An event typically has: an event type (string), a timestamp, a payload (JSON body), and optionally a correlation ID. ' +
        'Events are immutable records of facts — unlike commands ("do this"), events describe what already occurred ("this happened"). ' +
        'They are usually serialised as JSON or Avro and published to a topic on a broker.',
      example:
        'Zomato publishes: { type: "ORDER_PLACED", orderId: "Z123", userId: "U456", restaurantId: "R789", amount: 450, ts: "2024-01-15T19:30:00Z" }. ' +
        'This single event triggers: kitchen notification, delivery partner assignment, payment hold, and ETA calculation — all independently.',
    },
    {
      title: 'Producers, Consumers & the Broker',
      icon: '🔔',
      layman:
        'A producer is whoever fires the event ("the cook ringing the bell"). ' +
        'A consumer is whoever reacts to it ("the waiter picking up the food"). ' +
        'The broker sits in between — it stores events and delivers them. Neither side knows the other directly.',
      technical:
        'The broker (Kafka, RabbitMQ, AWS SNS/SQS, Google Pub/Sub) decouples producers and consumers in time and space. ' +
        'Kafka stores events durably in ordered logs (topics), allowing any number of consumer groups to replay from any offset. ' +
        'RabbitMQ routes messages via exchanges and deletes them after ACK — better for task queues than event logs.',
      example:
        'When you book an Uber: the Booking Service (producer) publishes "RIDE_REQUESTED" to Kafka. ' +
        'Three consumers react independently: Matching Service (finds driver), Surge Pricing Service (recalculates price), Analytics Service (logs the request). ' +
        'None of them calls the others.',
      whenToUse: 'When you need decoupling, when multiple services need the same event, or when order processing must survive a downstream outage.',
    },
    {
      title: 'Pub/Sub vs Message Queue',
      icon: '📡',
      layman:
        'Pub/Sub is like a newspaper — one publisher, many readers, each gets their own copy. ' +
        'A message queue is like a shared to-do list — one task gets picked up by exactly one worker and crossed off.',
      technical:
        'Pub/Sub (Kafka topics, Google Pub/Sub): one event is delivered to all subscribed consumer groups. Great for fan-out. ' +
        'Message Queue (RabbitMQ, SQS): competing consumers share a queue; each message is processed once. Great for distributing work. ' +
        'Kafka supports both: multiple consumer groups each get all messages (pub/sub), but within a group messages are distributed (queue).',
      example:
        '"Payment received" event → Pub/Sub: Email service, notification service, and analytics service ALL receive it. ' +
        '"Resize image" task → Queue: only ONE resize worker picks it up (you don\'t want the same image resized 5 times).',
    },
    {
      title: 'Event Sourcing & CQRS (bonus concepts)',
      icon: '📚',
      layman:
        'Instead of storing the current state ("Alice has ₹500"), store every event that led to it ("deposited ₹200, withdrew ₹100, deposited ₹400"). ' +
        'You can always replay events to get current state — and you get a perfect audit log for free.',
      technical:
        'Event Sourcing: the event log IS the source of truth. State is derived by replaying events. Pairs naturally with CQRS (Command Query Responsibility Segregation): ' +
        'writes go through commands that produce events; reads come from materialized views built from those events. ' +
        'Used in banking (every transaction is an immutable ledger entry), e-commerce order history, and git (every commit is an event).',
      example:
        'Your UPI bank statement is event sourcing in action — every debit/credit is stored, and your balance is just the sum. ' +
        'The bank never updates a "balance" row; it appends a transaction row.',
      whenToUse: 'When you need audit trails, time-travel debugging, or the ability to rebuild state from scratch.',
    },
    {
      title: 'Benefits & Challenges',
      icon: '⚖️',
      layman:
        'EDA makes services independent and the system fast. But it makes debugging harder — a bug can hide anywhere in the chain, and data is only "eventually" consistent.',
      technical:
        'Benefits: loose coupling (services can be deployed independently), high scalability (consumers scale independently), resilience (events survive if a consumer is down — they are replayed). ' +
        'Challenges: eventual consistency (a consumer may be seconds behind), event ordering (Kafka guarantees order per partition, not globally), ' +
        'debugging (distributed traces span multiple services), and idempotency (consumers must handle duplicate events safely).',
      example:
        'Flipkart flash sale: "ITEM_SOLD" events are published. Inventory service is 2 seconds behind. For 2 seconds, the website still shows "In Stock." ' +
        'This is acceptable eventual consistency — but your system must handle it gracefully (re-check at checkout).',
    },
  ],

  comparison: {
    caption: 'Direct calls vs Event-Driven — when to use which',
    columns: ['Dimension', 'Direct (REST/gRPC)', 'Event-Driven'],
    rows: [
      ['Coupling',    'Tight — caller knows callee',    'Loose — no direct knowledge'],
      ['Latency',     'Low — immediate response',       'Higher — async processing'],
      ['Consistency', 'Strong — immediate',             'Eventual — seconds behind'],
      ['Scalability', 'Limited — caller waits',         'High — consumers scale independently'],
      ['Debugging',   'Easy — one call stack',          'Hard — distributed traces'],
      ['Best for',    'User-facing reads, simple APIs', 'Workflows, fan-out, async tasks'],
    ],
  },

  realWorldExamples: [
    {
      company: 'Uber',
      icon: '🚕',
      description:
        'Every location update from a driver is an event. Thousands of consumers react: ETA recalculation, surge pricing, driver-rider matching — all independently and in real time.',
    },
    {
      company: 'LinkedIn',
      icon: '💼',
      description:
        'When you update your profile, an event triggers: search index update, notification to connections, recommendation engine refresh, analytics — all via Kafka, all decoupled.',
    },
    {
      company: 'Amazon',
      icon: '📦',
      description:
        'A single "Order Placed" event fans out to: warehouse picking, payment processing, fraud detection, email confirmation, and loyalty points — all in parallel via SNS/SQS.',
    },
  ],

  interviewQuestions: [
    {
      question: 'What is event-driven architecture and when would you use it?',
      answer:
        'EDA is a pattern where services communicate by publishing and consuming events through a broker, rather than calling each other directly. Use it when you need loose coupling between services, fan-out (one event → multiple consumers), async processing (email, notifications), or resilience (events survive temporary consumer downtime).',
    },
    {
      question: 'What is the difference between a message queue and pub/sub?',
      answer:
        'A message queue (SQS, RabbitMQ) delivers each message to exactly one consumer — competing workers share the load. Pub/sub (Kafka topics, Google Pub/Sub) delivers each event to every subscriber independently. Use queues for task distribution; use pub/sub for fan-out where multiple services need the same event.',
    },
    {
      question: 'What challenges does EDA introduce?',
      answer:
        'Eventual consistency (consumers may lag), event ordering (hard to guarantee globally), duplicate delivery (consumers must be idempotent), and debugging (requires distributed tracing). These are the trade-offs you accept in exchange for decoupling and scalability.',
    },
    {
      question: 'How do you handle duplicate events in an event-driven system?',
      answer:
        'Make consumers idempotent — processing the same event twice produces the same result as processing it once. Use the event\'s unique ID as a deduplication key, stored in Redis or the DB. Before processing, check if the ID was already handled.',
    },
  ],

  commonMistakes: [
    'Using EDA everywhere — direct REST calls are simpler and better for user-facing synchronous requests',
    'Not making consumers idempotent — duplicate events cause double-charges, double-emails, etc.',
    'Ignoring event schema evolution — adding a required field breaks all existing consumers',
    'Using a single Kafka partition — kills ordering guarantees AND parallelism simultaneously',
    'Not setting up a Dead Letter Queue — failed events disappear silently without one',
  ],
};
