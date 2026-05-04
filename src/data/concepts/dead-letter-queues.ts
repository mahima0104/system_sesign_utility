import type { ConceptDeepDive } from '../../types';

export const deadLetterQueues: ConceptDeepDive = {
  moduleId: 'dead-letter-queues',
  tagline: 'The safety net that catches every unprocessable message before it disappears forever',

  introduction: {
    layman:
      'Imagine a mail sorting facility. Most letters get sorted and delivered normally. But occasionally, a letter has an unreadable address, damaged packaging, or content that trips a security scan. What happens to those letters? A well-run facility doesn\'t throw them away — it puts them in a special "problem mail" bin for human review. A Dead Letter Queue (DLQ) is exactly that: a special queue where messages go when they can\'t be processed after multiple attempts. Instead of being silently discarded, they\'re held in the DLQ where engineers can investigate, fix the bug, and manually replay them.',
    analogy:
      'A Return-to-Sender bin at a postal sorting office. Parcels that can\'t be delivered (unreadable address, recipient moved, customs issues) don\'t just vanish — they\'re placed in a special area for review. The postal workers can inspect why they failed, contact the sender, and attempt redelivery. Without this bin, failed deliveries would simply disappear.',
    whyMatters:
      'Without DLQs, failed messages silently disappear from your system — orders never fulfilled, payments never processed, notifications never sent, with no record of what went wrong. DLQs are a production reliability essential. Every serious messaging architecture includes them. In interviews, mentioning DLQs when designing message-based systems demonstrates production-ready thinking. They\'re also essential for debugging in production — most message processing bugs are only caught because a DLQ captured failing messages.',
  },

  subTopics: [
    {
      title: 'Why Messages Fail — The Root Causes',
      icon: '❌',
      layman:
        'Messages end up in the DLQ for many reasons. Understanding the common failure modes helps you design systems that fail gracefully.',
      technical:
        'Common failure categories: (1) Poison messages: a message with malformed data that crashes the consumer every time. Example: JSON parsing fails because a field changed type. (2) Business logic exceptions: the message is valid but the operation fails — insufficient inventory, duplicate payment, missing user account. (3) Dependency failures: the consumer needs a third-party API (SendGrid, Stripe) that is down. Transient failures should be retried; permanent failures (deleted user, cancelled order) should be dead-lettered. (4) Consumer timeouts: processing takes too long and the visibility timeout expires — message re-queues and retries. Eventually exceeds maxReceiveCount → DLQ. (5) Schema mismatches: producer deploys a new message format; consumer hasn\'t deployed yet and can\'t parse it. (6) Ordering violations: a message arrives that references data not yet created (e.g., "order shipped" before "order created").',
      example:
        'A payment processing consumer fails when it encounters `{"amount":"forty-nine dollars"}` — someone sent a string instead of a number. The consumer throws a JSON parse error, nacks, message retries 3 times, then goes to DLQ. An engineer sees it in the DLQ, identifies the bug in the producer, fixes it, and replays the message with corrected data.',
    },
    {
      title: 'DLQ Mechanics — How It Works in Practice',
      icon: '⚙️',
      layman:
        'The flow: a consumer fails to process a message. The queue retries it. After a configured number of retries, instead of deleting the message or retrying forever, the queue moves it to a separate "dead letter" queue. Crucially, the original message is preserved intact — you can see exactly what was sent.',
      technical:
        'AWS SQS: set `maxReceiveCount` on the source queue (e.g., 3). If a message is received 3 times without deletion, SQS automatically moves it to the configured DLQ. The DLQ is itself an SQS queue. Message attributes preserved including original message body, attributes, and metadata. Message in DLQ has a `approximateFirstReceiveTimestamp` to know when processing first failed. Kafka: no native DLQ — implement manually. On consumer exception, publish the message to a dedicated DLQ topic (e.g., `orders.failed`) with error metadata headers. Typically done inside a try/catch after N retries. Spring Kafka, Faust, and other frameworks provide DLQ handling out of the box. RabbitMQ: dead letter exchange (DLX). Configure a queue with `x-dead-letter-exchange` and `x-message-ttl`. When a message is nacked with `requeue=false` or exceeds TTL, it\'s published to the DLX and routed to the DLQ.',
      example:
        'SQS configuration: source queue `orders-processing` with maxReceiveCount=3, redrive policy pointing to DLQ `orders-dlq`. Consumer processes order, fails 3 times. On the 4th receive attempt, SQS has already moved it to `orders-dlq`. An alarm triggers (DLQ depth > 0). On-call engineer gets paged, opens SQS console, reads the message, identifies the issue, fixes the consumer bug, and uses the DLQ redrive feature to move the message back to `orders-processing` for reprocessing.',
    },
    {
      title: 'DLQ Alerting & Monitoring',
      icon: '🚨',
      layman:
        'A DLQ is useless if no one knows messages are landing there. The DLQ captures failed messages, but someone needs to be alerted. Every DLQ should have a corresponding alarm.',
      technical:
        'Key metrics to monitor: (1) DLQ depth (message count): alarm when > 0. A non-empty DLQ always means something is broken. (2) DLQ message age: if messages have been sitting in the DLQ for 24 hours unresolved, escalate. (3) Source queue redrive rate: how fast are messages moving to the DLQ? A spike means a new bug was deployed. Implementation: AWS CloudWatch: `AWS/SQS ApproximateNumberOfMessagesVisible` on DLQ → SNS alarm → PagerDuty/Slack. Kafka: consumer lag on the DLQ topic (if you have consumers reading it for analysis). Datadog: custom metric from your DLQ consumer reporting message counts. Alerting severity: DLQ > 0 should be at least a P2 alert. DLQ growing rapidly = P1. DLQ message age > 1 hour for payment processing = P0.',
      example:
        'Uber\'s ride-completion pipeline: DLQ alarm fires (depth > 5 messages). On-call engineer checks: 8 messages with error "driver not found in database." Root cause: driver was deleted mid-trip (rare edge case). Fix: add null check in consumer. Replay 8 messages from DLQ — all process successfully. Alert auto-resolves. Total resolution: 12 minutes. Without the DLQ, 8 trips would never have been processed; drivers wouldn\'t have been paid; customers wouldn\'t have received receipts.',
    },
    {
      title: 'Handling DLQ Messages — Inspect, Fix, Replay',
      icon: '🔧',
      layman:
        'Once messages are in the DLQ, what do you do with them? There are three options: investigate and fix the bug then replay the messages, transform the message into a valid format, or permanently discard them (if they\'re genuinely unprocessable).',
      technical:
        'DLQ handling workflow: (1) Triage: read DLQ messages, inspect the body and error metadata. Categorize failures: transient (retry will work), persistent-fixable (bug to fix, then replay), permanent (data error, discard). (2) Fix: deploy the consumer fix. (3) Replay: for SQS — use "Start DLQ Redrive" in console/SDK: moves messages back to source queue. For Kafka — seek your consumer to the start of the DLQ topic, reprocess, and skip already-processed IDs. (4) Transform and replay: if message format was wrong, use a Lambda/script to read from DLQ, transform each message, and publish to source queue with corrected format. (5) Discard: if messages are truly unprocessable (test data, cancelled orders), call `deleteMessage()` after logging. Best practice: log every message that hits the DLQ to persistent storage (S3, Elasticsearch) before processing. DLQ retention (SQS: up to 14 days) is limited; your archive isn\'t.',
      example:
        'A batch of 500 order confirmation emails failed because SendGrid was down for 2 hours. All 500 messages went to the DLQ. After SendGrid came back up, the engineer ran: `aws sqs start-message-move-task --source-arn {dlq-arn} --destination-arn {source-queue-arn}`. All 500 messages moved back to the source queue and were successfully sent within 10 minutes. Users received their confirmations with a 2-hour delay — much better than never.',
    },
    {
      title: 'DLQ Architecture Patterns',
      icon: '🏗️',
      layman:
        'In larger systems, DLQ design becomes an architectural decision. Should you have one global DLQ or one per service? Should the DLQ have its own consumer for automated handling? What about messages that should never be retried?',
      technical:
        'One DLQ per source queue: cleanest model. Each consumer has its own DLQ so failures are isolated. Easy to see which service is failing. One global DLQ: simpler operationally but messages from different services are mixed. DLQ consumer: a background service that reads from the DLQ, categorizes failures, and either retries with backoff, alerts, or discards. Avoids manual intervention for known transient failures. Retry with delay: rather than immediate redrive, a DLQ consumer can publish to a "retry later" queue with a delay (SQS message timers, RabbitMQ TTL/delay exchange). This implements exponential backoff for transient failures. Permanent DLQ: some messages should NEVER be retried (malformed input from an external source). These go to a "permanent DLQ" that feeds an analytics pipeline to understand failure patterns.',
      example:
        'A payment platform\'s DLQ strategy: failed payment messages go to DLQ. A DLQ consumer reads each message and classifies: network timeout → delay 5 min and redrive. Card declined → send to "manual-review" queue for human action. Invalid data format → log to S3 archive and discard. Each failure type is handled appropriately without manual intervention for the 95% of transient failures.',
    },
  ],

  comparison: {
    caption: 'DLQ behavior across messaging systems',
    columns: ['Feature', 'AWS SQS DLQ', 'Kafka DLQ (manual)', 'RabbitMQ DLX'],
    rows: [
      ['Built-in support', '✅ Native redrive policy', '❌ Manual implementation', '✅ x-dead-letter-exchange'],
      ['Trigger condition', 'maxReceiveCount exceeded', 'Application-defined (try/catch)', 'Nack or TTL expiry'],
      ['Original message preserved', '✅ Full message body + attributes', '✅ (with headers)', '✅'],
      ['Replay mechanism', '✅ SQS Redrive (console + SDK)', 'Manual consumer seek', '✅ Shovel plugin'],
      ['Message retention', 'Up to 14 days (configurable)', 'By topic retention policy', 'Configurable TTL'],
      ['Monitoring', 'CloudWatch metrics native', 'Custom consumer metrics', 'RabbitMQ Management UI'],
    ],
  },

  realWorldExamples: [
    {
      company: 'Amazon',
      icon: '📦',
      description:
        'Amazon\'s order processing system uses DLQs at every stage of the fulfillment pipeline. An order that fails warehouse allocation goes to a DLQ with all order details preserved. The warehouse team can inspect the failure, resolve the inventory issue, and replay the order. Without DLQs, orders would silently fail and customers would wait forever for items that were never allocated.',
    },
    {
      company: 'Twilio',
      icon: '📱',
      description:
        'Twilio\'s SMS delivery pipeline uses DLQs for undeliverable messages — invalid phone numbers, blocked destinations, carrier rejections. Failed webhook deliveries also land in a DLQ with the original payload and error response. Customers can inspect failed webhooks in their Twilio dashboard, fix the issue with their endpoint, and manually replay the failed events.',
    },
    {
      company: 'Netflix',
      icon: '🎬',
      description:
        'Netflix\'s video encoding pipeline uses DLQs for encoding jobs that fail after multiple retries. An encoding failure could be a corrupt source file, an unsupported format, or a transient infrastructure issue. Failed jobs land in a DLQ; Netflix\'s operations team is alerted and can inspect the source file, diagnose the issue, fix the encoder configuration, and requeue the job.',
    },
    {
      company: 'Shopify',
      icon: '🛒',
      description:
        'Shopify\'s webhook delivery system uses DLQ-style dead-lettering for merchant endpoints that repeatedly fail. After multiple delivery failures, Shopify disables the webhook and notifies the merchant — a form of circuit-breaking that protects Shopify\'s delivery workers from wasting cycles on permanently-broken endpoints. The "failed webhook" notification IS the DLQ notification in their customer-facing product.',
    },
  ],

  interviewQuestions: [
    {
      question: 'What is a dead letter queue and why is it important in a message-driven system?',
      answer:
        'A dead letter queue (DLQ) is a secondary queue where messages go after exceeding the maximum retry attempts on the primary queue. When a consumer fails to process a message (exception, timeout, business logic failure) N times, instead of either retrying forever (infinite loop) or silently discarding (data loss), the message is moved to the DLQ intact. Importance: (1) Zero silent data loss — failed messages are preserved for investigation. (2) Prevents poison-message storms — a message that always crashes the consumer doesn\'t loop forever; it gets dead-lettered and stops consuming consumer resources. (3) Debugging — the failed message body and metadata tells you exactly what went wrong. (4) Recovery — after fixing the bug, you can replay DLQ messages to process them successfully. Without a DLQ, every message processing failure is either a silent loss or a system blockage.',
    },
    {
      question: 'How would you set up and monitor a DLQ for a critical order processing pipeline?',
      answer:
        'Setup (SQS): create `orders-processing` queue and `orders-processing-dlq`. Configure redrive policy on source queue: maxReceiveCount=3, deadLetterTargetArn=orders-dlq. Consumer is idempotent (handles duplicate delivery). Monitoring: CloudWatch alarm on `orders-processing-dlq` `ApproximateNumberOfMessagesVisible` > 0 → SNS → PagerDuty. Secondary alarm: message age > 30 min → escalate. Handling: when alarm fires, engineer reads DLQ messages, inspects failure (JSON body + error logs). Fixes underlying bug. Deploys fix. Redrive DLQ messages back to source queue using AWS console or `start-message-move-task` API. Validates messages processed successfully. Key: DLQ messages have 14-day retention; archive to S3 immediately on receipt for longer-term audit trail.',
    },
    {
      question: 'What is the difference between a poison message and a transient failure? How should DLQ handling differ?',
      answer:
        'Poison message: a message that will always fail regardless of retries — malformed data, invalid format, references a deleted entity, or violates a business invariant. Retrying it wastes resources. After moving to DLQ, it requires human intervention: fix the data, fix the producer, or discard the message. Transient failure: a message that fails due to a temporary condition — database connection timeout, downstream API unavailable, temporary network partition. Retrying after a delay should succeed. DLQ handling strategy: build a DLQ consumer that inspects the error type. For transient failures (retryable errors, network exceptions): delay and redrive automatically. For poison messages (parsing errors, business logic violations): alert immediately, require human review. Implementation: include the exception type and message in DLQ metadata headers so the DLQ consumer can categorize without re-attempting.',
    },
  ],

  commonMistakes: [
    'No DLQ configured — messages that fail repeatedly are silently deleted; you never know what data was lost.',
    'No alarm on DLQ depth — a DLQ without alerting is useless; by the time you notice messages accumulating, data has been sitting there for days.',
    'DLQ with very short retention — if the DLQ expires messages before you fix the bug and replay, the data is lost. Set DLQ retention to the maximum (14 days for SQS).',
    'Replaying DLQ to a source queue before fixing the consumer bug — the same messages will fail again immediately and return to the DLQ, wasting time and causing consumer thrashing.',
    'Not archiving DLQ messages to durable storage — DLQ retention is limited; critical message bodies should be archived to S3 or a DB on receipt for long-term audit.',
    'Treating DLQ as a black hole — DLQ messages represent real user actions (orders, payments, notifications) that failed. Each one is a potential revenue loss or user experience failure. Treat DLQ alerts with the same urgency as service outages.',
  ],
};
