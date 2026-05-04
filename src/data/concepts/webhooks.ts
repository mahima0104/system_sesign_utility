import type { ConceptDeepDive } from '../../types';

export const webhooks: ConceptDeepDive = {
  moduleId: 'webhooks',
  tagline: 'Don\'t ask, get told — the doorbell of the internet',

  introduction: {
    layman:
      'Imagine you\'re waiting for an important package. You have two options: (a) call the courier company every 10 minutes asking "has my package arrived?" or (b) give them your phone number and say "call me when it arrives." Webhooks are option (b) for software. Instead of your server constantly asking another service "has anything changed?", you register a URL with that service and they call your URL the moment something happens. Stripe calls your URL when a payment succeeds. GitHub calls your URL when someone pushes code. You stop asking; they start telling.',
    analogy:
      'A doorbell. You don\'t stand at the window watching for visitors — you install a doorbell and let visitors announce themselves. Webhooks are doorbells for software systems. The "visitor" (another service) rings your bell (sends an HTTP request to your URL) the moment an event occurs. You can be doing other things in the meantime.',
    whyMatters:
      'Webhooks are everywhere in modern software: payment processors, CI/CD pipelines, communication APIs, e-commerce platforms, IoT devices. Every integration engineer has to implement and debug them. Interviewers ask about webhooks to test your understanding of event-driven integration, security (how do you verify the sender?), reliability (what if your server is down when the event fires?), and scalability (how do you process thousands of webhook events per second?).',
  },

  subTopics: [
    {
      title: 'How Webhooks Work — The Basic Flow',
      icon: '🔔',
      layman:
        'You register a URL with a third-party service. When a specific event happens on their platform, they send an HTTP POST request to your URL with details about the event. Your server processes it and responds with HTTP 200 to acknowledge receipt. That\'s it.',
      technical:
        'Registration: you call the service\'s API to register your endpoint URL and which event types you care about (e.g., `payment.succeeded`, `push`). Event delivery: on event, the service POSTs a JSON payload to your URL. Your server must respond within a timeout (typically 5–30 seconds) with HTTP 200–299. Any other response (4xx, 5xx, timeout) is treated as delivery failure, triggering retries. The request includes event metadata: event type, event ID, timestamp, and the event payload. Idempotency: the same event may be delivered multiple times (network retries) — your handler must be idempotent (processing the same event twice produces the same result).',
      example:
        'Stripe payment flow: customer pays → Stripe processes payment → Stripe POSTs to your endpoint `https://api.yourapp.com/webhooks/stripe` with `{"type":"payment_intent.succeeded","data":{"object":{"amount":4999,"currency":"usd","customer":"cus_xxx"}}}` → your server marks the order as paid and sends the confirmation email → responds with HTTP 200.',
    },
    {
      title: 'Anatomy of a Webhook Request',
      icon: '📋',
      layman:
        'A webhook is just an HTTP POST request that someone else sends to you. But it comes with specific headers and a structured body that tell you who sent it, what happened, and when.',
      technical:
        'Typical headers: `Content-Type: application/json`, `X-Webhook-Signature: sha256=<hmac-hex>` (for verification), `X-Event-Type: payment.succeeded`, `X-Event-ID: evt_1234` (for idempotency), `User-Agent: ServiceName/1.0`. Body: JSON object with `event`, `id`, `created` timestamp, and `data` payload. The HMAC signature is computed by the sender as `HMAC-SHA256(secret_key, raw_request_body)` — you recompute it with your shared secret and compare. Crucially, verify using the raw bytes of the request body, not a re-serialized parsed object — JSON serialization order can differ.',
      example:
        'GitHub webhook for a push event: headers include `X-GitHub-Event: push`, `X-Hub-Signature-256: sha256=abc123`. Body includes `repository.full_name`, `pusher.name`, `commits` array with each commit\'s message, author, and changed files. Your CI system reads the branch name and commit SHA, then kicks off a build pipeline.',
    },
    {
      title: 'Verifying Webhooks — Never Trust Without Checking',
      icon: '🔒',
      layman:
        'Anyone on the internet can POST to your webhook URL. Without verification, a bad actor could fake a "payment succeeded" event and get your server to fulfill an order without a real payment. Every production webhook must verify that the request genuinely came from the legitimate service.',
      technical:
        'HMAC signature verification: (1) The service and your app share a secret key. (2) When sending a webhook, the service computes `HMAC-SHA256(secret, request_body_bytes)` and puts it in a header. (3) Your server reads the raw request body bytes (before parsing), recomputes the HMAC with your stored secret, and compares using a constant-time comparison (to prevent timing attacks). If they match, the request is genuine. Pitfall: parse JSON only after verification, and use the raw body bytes — not the re-serialized JSON. Also verify the timestamp header (if present) to reject replayed requests older than 5 minutes.',
      example:
        'Stripe verification in Node.js: `stripe.webhooks.constructEvent(req.rawBody, req.headers[\'stripe-signature\'], process.env.STRIPE_WEBHOOK_SECRET)`. If this throws, reject with HTTP 400. This one function handles HMAC verification AND replay protection (Stripe includes a timestamp and Stripe SDK rejects events older than 5 minutes). Most payment and communication APIs provide equivalent helper functions.',
      whenToUse:
        'Always verify webhooks in production. A missing signature check is a critical security vulnerability — attackers can trigger arbitrary state changes in your system by faking events.',
    },
    {
      title: 'Retry Logic & Idempotency — What If Delivery Fails?',
      icon: '🔄',
      layman:
        'Your server might be down when a webhook arrives. Or it might respond with a 500 error. The sender will retry — sometimes for hours or days. Your webhook handler must be designed to safely process the same event more than once without doing double-work (charging a customer twice, sending two confirmation emails).',
      technical:
        'Retry strategies vary by provider: Stripe retries for 3 days with exponential backoff (immediately, 1h, 4h, 24h, 48h, 72h). GitHub retries 3 times. Shopify retries for 48 hours. Because retries are guaranteed, your handler MUST be idempotent. Pattern: (1) Check if the event ID has been processed before (store processed event IDs in DB with a unique constraint). (2) If already processed, return HTTP 200 immediately — the sender sees success and stops retrying. (3) Use database transactions: update order status AND record the event ID atomically. Avoid sending emails or external API calls inside the transaction — do those after commit.',
      example:
        'Order fulfillment handler: `BEGIN; INSERT INTO processed_events (event_id) VALUES (\'evt_1234\') ON CONFLICT DO NOTHING RETURNING id; UPDATE orders SET status=\'paid\' WHERE payment_id=\'pi_xxx\'; COMMIT`. The unique constraint on event_id means a duplicate delivery simply skips the insert and the update is a no-op — safe to run twice.',
    },
    {
      title: 'Building a Scalable Webhook Receiver',
      icon: '🏗️',
      layman:
        'If you receive thousands of webhook events per second — like a busy Stripe integration for a marketplace — you can\'t process each one synchronously in the HTTP handler. You\'d hit your timeout limit, back-pressure would cause retries, and a slow database would block everything. The solution: receive fast, process async.',
      technical:
        'Async receiver pattern: (1) Webhook endpoint receives the POST, verifies the signature, writes the raw event to a queue (Redis, SQS, Kafka) in < 50ms, responds HTTP 200. (2) A pool of worker processes consume from the queue and run the actual business logic (DB updates, email sends, API calls). Benefits: the HTTP endpoint is always fast (no downstream dependency), workers can scale independently, failures in workers don\'t cause retries from the sender (the 200 was already sent). Drawback: at-least-once delivery from the queue requires idempotency in workers too. For very high volume (100k+ events/s), fan out across partitioned Kafka topics.',
      example:
        'A marketplace receiving Stripe webhooks for 10,000 sellers: endpoint writes to SQS in 10ms → responds 200. SQS workers (100 instances) each consume events and update seller dashboards, trigger payouts, and update analytics. Peak volume of 5,000 events/s is absorbed by the queue; workers process at their own pace with no Stripe retries.',
    },
    {
      title: 'Sending Webhooks — Building the Other Side',
      icon: '📤',
      layman:
        'Not just receiving — many products need to send webhooks to their customers. When you build a platform (a payment API, an e-commerce system, a CI tool), your customers will register URLs with you and expect real-time notifications. Building a reliable webhook delivery system is its own engineering challenge.',
      technical:
        'Key components: (1) Registration store: DB table of (customer_id, event_type, endpoint_url, secret). (2) Event pipeline: on internal event, publish to a queue. (3) Delivery workers: dequeue, look up subscribers, POST to each endpoint with HMAC signature. (4) Retry scheduler: on failure, schedule retries with exponential backoff. (5) Dead-letter handling: after max retries, move to DLQ, notify customer. (6) Dashboard: show delivery history, success/failure rates, let customers manually replay events. At scale (millions of endpoints): partition by customer_id, rate-limit per endpoint (don\'t retry a failing endpoint more than N times/min), circuit-break endpoints that consistently fail.',
      example:
        'GitHub\'s webhook delivery system: sends webhooks for every push, PR, issue, and comment across millions of repositories. They maintain a delivery log (visible in repo settings → Webhooks) showing every delivery attempt, response code, and response body — invaluable for debugging. Failed deliveries are retried with exponential backoff; you can manually redeliver from the UI.',
    },
  ],

  comparison: {
    caption: 'Webhook vs polling vs WebSocket — integration pattern comparison',
    columns: ['Aspect', 'Webhooks', 'Polling', 'WebSockets'],
    rows: [
      ['Direction', 'They push to you', 'You pull from them', 'Bidirectional'],
      ['Latency', 'Near-instant (event-driven)', 'Poll interval (seconds–minutes)', 'Near-instant'],
      ['Your server must be reachable', '✅ Public URL required', '❌ You initiate', '❌ You initiate'],
      ['Works for 3rd-party services', '✅ Universal (just HTTP POST)', '✅', '⚠️ Service must support WS'],
      ['Reliability', 'Depends on sender retry logic', 'You control retry', 'You handle reconnects'],
      ['Debugging', '⚠️ Need delivery logs', '✅ You can inspect responses', '⚠️ Need frame inspector'],
      ['Best for', 'Event-driven integrations', 'Simple checks, public data', 'Real-time user-facing apps'],
    ],
  },

  realWorldExamples: [
    {
      company: 'Stripe',
      icon: '💳',
      description:
        'Stripe\'s webhook system is the gold standard. Every payment event — charges, refunds, disputes, subscription renewals — is delivered as a webhook. Stripe retries for 3 days, provides a dashboard showing every delivery attempt and response, lets you replay events, and has clear HMAC verification documentation. Most payment integrations rely on Stripe webhooks to trigger order fulfillment.',
    },
    {
      company: 'GitHub',
      icon: '🐙',
      description:
        'GitHub webhooks power almost every CI/CD system on the planet. When you push code, GitHub fires a webhook to Jenkins, CircleCI, GitHub Actions, or your custom build server. The webhook includes the commit SHA, branch name, and diff — all the information a build system needs. Every GitHub repo has a Webhooks settings page showing delivery history.',
    },
    {
      company: 'Twilio',
      icon: '📱',
      description:
        'Twilio uses webhooks for incoming SMS/calls: when a text message arrives to your Twilio number, Twilio POSTs to your webhook URL with the sender, body, and metadata. Your server responds with TwiML (XML instructions) telling Twilio what to do next. The entire flow — receive SMS, process it, respond — happens via webhooks in under a second.',
    },
    {
      company: 'Shopify',
      icon: '🛒',
      description:
        'Shopify\'s webhook system notifies third-party apps about store events: new orders, product updates, customer sign-ups, cart abandonments. Apps in the Shopify ecosystem are built around webhooks — an email marketing app subscribes to order.created webhooks to trigger post-purchase flows. Shopify retries for 48 hours and pauses delivery if an endpoint consistently fails.',
    },
  ],

  interviewQuestions: [
    {
      question: 'What is a webhook and how does it differ from polling?',
      answer:
        'A webhook is an HTTP callback: you register a URL with a third-party service, and they POST to your URL whenever a relevant event occurs. It\'s event-driven, near-instant, and requires no continuous requests. Polling is the reverse: your server periodically calls the third-party\'s API to check for changes. Webhooks win on latency (instant vs poll interval), server efficiency (zero wasted requests), and simplicity (no need for a polling scheduler). Polling wins when: the third party doesn\'t support webhooks, your server doesn\'t have a public URL (e.g., local development), or you need to query public data that doesn\'t have event hooks.',
    },
    {
      question: 'How do you secure a webhook endpoint against spoofed requests?',
      answer:
        'HMAC signature verification: the sender computes `HMAC-SHA256(shared_secret, raw_request_body)` and includes the hex result in a header (e.g., `X-Signature: sha256=abc123`). Your server reads the raw request body bytes (before JSON parsing), recomputes the HMAC with your stored secret, and compares using a constant-time string comparison (to prevent timing attacks — `crypto.timingSafeEqual` in Node.js). If they match, the request is genuine. Also verify a timestamp header if provided, rejecting events older than 5 minutes to prevent replay attacks. Never trust `X-Forwarded-For` or other headers for authentication; only the HMAC can be trusted.',
    },
    {
      question: 'Your webhook endpoint is called 3 times for the same event (retries). How do you handle this?',
      answer:
        'Design for idempotency. The key: the sender includes a unique event ID. Your handler: (1) Before processing, check if the event ID exists in a `processed_events` table (or Redis set). (2) If yes, return HTTP 200 immediately — the sender stops retrying, no double processing. (3) If no, process the event AND record the event ID atomically in a DB transaction (unique constraint prevents duplicate inserts). Critical: run side effects (emails, external API calls) after the transaction commits, not inside it. This way, even if your server crashes mid-processing and the sender retries, the atomic insert-or-skip ensures the business logic runs exactly once.',
    },
    {
      question: 'Design a system to deliver webhooks to 1 million customers with guaranteed at-least-once delivery.',
      answer:
        'Architecture: (1) Event ingestion: internal events published to Kafka topics partitioned by event type. (2) Webhook fanout service: Kafka consumer queries the subscription DB to find all customer endpoints for each event type. For each matching endpoint, publishes a delivery job to a per-customer queue (prevents one slow customer from blocking others). (3) Delivery workers: pull from customer queues, POST to endpoint, record result. On failure: exponential backoff retry (1s, 5s, 30s, 5min, 30min, 2h). (4) Dead-letter queue: after max retries, move to DLQ, alert the customer. (5) Delivery log DB: every attempt logged for customer visibility and manual replay. (6) Circuit breaker: if endpoint fails > 50% over last hour, pause delivery and alert customer. Idempotency: include a unique event ID so customers can deduplicate. At 1M customers each averaging 1 event/day = ~12 events/sec — very manageable; spike protection via queue depth.',
    },
  ],

  commonMistakes: [
    'Not verifying the HMAC signature — allows anyone to fake events and trigger arbitrary state changes in your system.',
    'Not handling idempotency — retried webhook deliveries trigger double-charges, duplicate emails, or double-fulfillments.',
    'Doing heavy processing synchronously inside the webhook handler — causes timeouts, triggers retries, and cascades into a retry storm.',
    'Re-serializing the JSON body before HMAC verification — JSON key order may differ, causing valid webhooks to fail verification.',
    'Not responding with HTTP 200 immediately on success — some frameworks default to HTTP 201 or 204, which some webhook senders treat as failure.',
    'Not logging webhook payloads — when debugging a missed order or failed payment, the webhook payload is essential; without logs, debugging is nearly impossible.',
    'Exposing your webhook URL without any path obscurity — makes it trivial for attackers to find and bombard with fake requests, even if you verify signatures.',
  ],
};
