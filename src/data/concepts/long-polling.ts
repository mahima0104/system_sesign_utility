import type { ConceptDeepDive } from '../../types';

export const longPolling: ConceptDeepDive = {
  moduleId: 'long-polling',
  tagline: 'Simulating real-time over plain HTTP — the clever waiting trick',

  introduction: {
    layman:
      'Imagine you order food at a restaurant and the waiter says "I\'ll check if your order is ready." With short polling, the waiter walks to the kitchen, comes back saying "not yet," then walks back again 30 seconds later, repeating endlessly. With long polling, the waiter walks to the kitchen and simply stays there — waiting until the food is ready, then brings it to you immediately. Long polling keeps an HTTP request open on the server until new data is available, then responds. The browser gets the data instantly and immediately opens a new "waiting" request.',
    analogy:
      'Calling a cinema ticket hotline. Old way (short polling): you call every 5 minutes asking "are seats available yet?" Long polling: you call, they put you on hold and say "stay on the line — I\'ll tell you the moment seats open up." Same phone technology (HTTP), completely different experience.',
    whyMatters:
      'Long polling was the backbone of real-time web before WebSockets existed. Gmail used it for years. Interviewers ask about it to test whether you understand the HTTP request lifecycle, the trade-offs between polling frequency and server load, and when you would choose it over WebSockets or SSE. It is also the most common fallback when WebSockets are blocked by corporate firewalls.',
  },

  subTopics: [
    {
      title: 'Short Polling — The Naive Baseline',
      icon: '🔄',
      layman:
        'The simplest approach: your browser sends a request every N seconds asking "anything new?" The server responds immediately — with data if there is some, or an empty response if not. Simple to implement, wasteful in practice.',
      technical:
        'Client fires a GET /updates request on a fixed interval (e.g., every 2s). Server responds immediately with current state. Each request completes the full HTTP cycle: TCP connection setup, TLS handshake (if HTTPS), request headers, response headers, response body. For 1,000 users polling every 2s, the server handles 500 req/s of mostly-empty responses. CPU, bandwidth, and connection overhead are all wasted on "nothing new" responses.',
      example:
        'Early stock-ticker widgets on financial sites (circa 2005): a JavaScript setInterval called fetch("/price?symbol=AAPL") every 5 seconds. Server returned JSON immediately whether price changed or not. Worked fine for 100 users; catastrophic at 100,000.',
      whenToUse:
        'Short polling is acceptable when updates are infrequent, latency requirements are loose (minutes not seconds), and the user count is small. Never use it for chat, notifications, or anything requiring sub-5-second freshness.',
    },
    {
      title: 'Long Polling — How It Actually Works',
      icon: '📡',
      layman:
        'Instead of answering immediately with "nothing new," the server holds the request open — keeping the connection alive while it watches for new data. When data arrives, it responds. The client, on receiving the response, immediately fires another request. To the user, it feels like a live stream; under the hood, it\'s a sequence of held-open HTTP requests.',
      technical:
        'Client sends GET /updates?lastEventId=42. Server parks the request — suspends the handler without blocking a thread (using async I/O, coroutines, or event loops). When an event occurs, the server wakes the handler, writes the response, and closes the connection. Client parses the response and immediately sends GET /updates?lastEventId=43. The server typically enforces a timeout (20–30s) to prevent connections hanging indefinitely behind firewalls or load balancers that close idle connections. On timeout, the server responds with an empty/heartbeat message; client re-dials.',
      example:
        'Gmail\'s original push notifications (pre-2012) used long polling. When you were in Gmail, your browser held a request to a Google endpoint. When a new email arrived, Google responded to that request with the email data. Your inbox updated instantly. The same request lifecycle — just held open instead of answered immediately.',
      whenToUse:
        'Use long polling when WebSockets are not available (corporate proxies, legacy infrastructure), when you need HTTP-compatible real-time (works with any CDN or HTTP/1.1 stack), or when the event frequency is low (a new message every few seconds, not hundreds per second).',
    },
    {
      title: 'Server-Side: Holding Connections Efficiently',
      icon: '🖥️',
      layman:
        'The hardest part of long polling is the server. Old-school servers spawned a thread per connection — holding 10,000 open connections meant 10,000 threads, each consuming megabytes of RAM. Modern servers solve this with async/event-driven I/O: a single thread can manage thousands of suspended connections, waking only when data arrives.',
      technical:
        'Thread-per-connection (blocking I/O) model: Apache prefork — each pending long-poll ties up a thread. With 1,000 concurrent connections and 256 MB/thread, that\'s 256 GB RAM before serving a single byte of data. Async I/O model: Node.js event loop, Python asyncio, Java Netty — connections park as callbacks or coroutines. Memory per connection drops to kilobytes. The C10K problem (10,000 concurrent connections) that drove the creation of Nginx and Node.js was essentially the long-polling scalability problem.',
      example:
        'Nginx\'s event-driven architecture allows it to hold 50,000+ long-poll connections on a 2 GB server. Apache in prefork mode would run out of RAM at ~500. This is why the entire industry shifted to event-loop architectures — long polling at scale forced the issue.',
    },
    {
      title: 'Timeouts, Heartbeats & Reconnection',
      icon: '💓',
      layman:
        'Network connections can silently die — a router reboots, a mobile phone switches from WiFi to 4G, a corporate firewall closes "idle" connections after 60 seconds. Long polling needs a strategy to detect and recover from these silent failures.',
      technical:
        'Server-side timeout: respond with an empty message after T seconds (typically 20–30s) regardless of new data. Client immediately re-dials. Heartbeat: server sends a small keepalive byte (newline, or a specific heartbeat event) every 15–20s to prevent proxy/firewall timeouts. Idempotency: the client tracks the last event ID it received; when reconnecting, it sends lastEventId so the server can replay any missed events. Exponential backoff: if the server is down, clients retry with increasing delays (1s, 2s, 4s, 8s…) to avoid thundering-herd pile-on when the server recovers.',
      example:
        'Facebook\'s Messenger (pre-WebSocket era) tracked a "seq" sequence number. Every long-poll request included the last seq received. If you lost your connection mid-vacation, the reconnect request told Facebook\'s servers exactly where to resume — you never missed a message.',
    },
    {
      title: 'Long Polling vs WebSockets — When to Choose Which',
      icon: '⚖️',
      layman:
        'WebSockets are like a dedicated phone line — once connected, both sides can talk freely at any time. Long polling is like a very fast sequence of phone calls — you call, get the answer, hang up, call again. WebSockets are more efficient for high-frequency, bidirectional traffic. Long polling is simpler to deploy and works everywhere HTTP works.',
      technical:
        'Long polling: standard HTTP, works through all proxies/CDNs/load balancers, stateless between "polls" (easy horizontal scaling), higher overhead per message (full HTTP headers each round trip ~0.5–2 KB). WebSockets: single persistent TCP connection, binary or text frames (~2–10 bytes overhead per message), requires WebSocket-aware proxies and load balancers, stateful connection (sticky sessions or dedicated socket servers needed). Rule of thumb: if messages are fewer than ~10/second per client, long polling is simpler. Above that, WebSockets win on efficiency.',
      example:
        'Slack uses WebSockets for the active session (rapid message streams) but falls back to long polling automatically when WebSockets are blocked. Trello used long polling exclusively for years — its updates (card moves, comments) are infrequent enough that the HTTP overhead was irrelevant.',
      whenToUse:
        'Choose long polling when: (a) you need broad compatibility without WebSocket infrastructure, (b) updates are infrequent (< 1/second per user), (c) you want simple horizontal scaling behind a standard HTTP load balancer.',
    },
  ],

  comparison: {
    caption: 'Polling strategies compared across the key dimensions.',
    columns: ['Aspect', 'Short Polling', 'Long Polling', 'WebSockets'],
    rows: [
      ['Latency', 'Poll interval (e.g. 5s)', 'Near-instant (~ms after event)', 'Near-instant'],
      ['HTTP overhead', 'Very high (full round-trip per poll)', 'Medium (one round-trip per event)', 'Minimal (frames after handshake)'],
      ['Server resource use', 'High (many completed requests)', 'Medium (held connections)', 'Low (persistent connection)'],
      ['Proxy/firewall compatibility', '✅ Universal', '✅ Universal', '⚠️ May be blocked'],
      ['Bidirectional', '❌', '❌', '✅'],
      ['Horizontal scaling complexity', 'Easy', 'Easy', 'Harder (sticky sessions)'],
      ['Best for', 'Infrequent, low-user workloads', 'Moderate real-time needs', 'High-frequency, bidirectional'],
    ],
  },

  realWorldExamples: [
    {
      company: 'Gmail (2004–2012)',
      icon: '📧',
      description:
        'Gmail used long polling for new email notifications for nearly a decade. The technique let Google deliver near-instant inbox updates using only standard HTTP — essential at a time when WebSockets did not exist and browser support was inconsistent. Millions of concurrent long-poll connections drove Google\'s investment in async server infrastructure.',
    },
    {
      company: 'Facebook Chat (2008–2011)',
      icon: '💬',
      description:
        'Facebook\'s initial chat system was built on long polling, handling hundreds of thousands of concurrent connections. They wrote an entire Erlang-based server (Erlang\'s lightweight processes are ideal for holding many open connections) specifically for the task. The engineering blog post about this became a landmark document in real-time web architecture.',
    },
    {
      company: 'Trello',
      icon: '📋',
      description:
        'Trello served real-time board updates via long polling for years, choosing it over WebSockets for its simplicity and universal proxy compatibility. Because board events (card moves, comments) arrive at human speed rather than machine speed, the HTTP overhead per event was negligible compared to the operational simplicity of a pure HTTP stack.',
    },
    {
      company: 'Slack (fallback)',
      icon: '💼',
      description:
        'Slack\'s client automatically falls back from WebSockets to long polling when WebSocket connections fail — common in corporate environments with aggressive proxy filtering. The long-poll fallback ensures Slack works in environments where other real-time apps fail entirely, a significant enterprise selling point.',
    },
  ],

  interviewQuestions: [
    {
      question: 'Explain long polling. How does it differ from short polling and WebSockets?',
      answer:
        'Short polling: client fires HTTP requests on a fixed interval; server responds immediately (empty if nothing new). Wasteful. Long polling: client sends a request; server holds it open until data is available, then responds; client immediately re-requests. Near-instant delivery, standard HTTP. WebSockets: single TCP connection persists; both sides push frames at will, with minimal overhead. Long polling wins on compatibility (works through every HTTP proxy); WebSockets win on efficiency for high-frequency or bidirectional traffic.',
    },
    {
      question: 'How does long polling handle server timeouts and dropped connections?',
      answer:
        'The server enforces a maximum hold time (20–30s). If no event arrives in that window, it sends an empty/heartbeat response. The client immediately re-dials. This prevents corporate firewalls from silently closing "idle" connections. Clients also send the last received event ID on every reconnect so the server can replay any events missed during a dropped connection. Exponential backoff prevents thundering-herd pile-on when the server restarts.',
    },
    {
      question: 'What is the "C10K problem" and how does it relate to long polling?',
      answer:
        'The C10K problem (1999) asked: can a server handle 10,000 concurrent connections? With thread-per-connection servers (Apache), each connection ties up a thread. 10,000 threads × 256 MB = 2.5 TB RAM — impossible. The answer was event-driven, async I/O (Nginx, Node.js, Netty): a single thread parks thousands of connections as callbacks or coroutines, consuming kilobytes not megabytes per connection. Long polling is exactly C10K in practice — thousands of browsers each holding an open request. Choosing a framework that supports async I/O is critical for long polling at scale.',
    },
    {
      question: 'Design a simple notification system for 1 million users. Would you use long polling or WebSockets?',
      answer:
        'For a notification system (low frequency — a few events per hour per user), long polling is a strong choice. 1M users × 1 held request each = 1M concurrent connections. With async I/O (Node.js, Go, Nginx), this is achievable on tens of servers. Key design: stateless long-poll servers behind a load balancer; notification events published to Redis Pub/Sub; each server subscribes and wakes any waiting connections for that user. If messages get frequent (> a few per second per user — e.g., live chat), upgrade those sessions to WebSockets. Hybrid approaches are common: use long polling by default, promote to WebSocket on demand.',
    },
    {
      question: 'What are the main failure modes of long polling in production?',
      answer:
        '(1) Connection leaks: if clients disconnect without the server noticing, held connections accumulate. Fix: server-side timeouts + connection lifecycle monitoring. (2) Thundering herd: all clients reconnect simultaneously after a server restart. Fix: exponential backoff with jitter. (3) Missed events: if a client was disconnected when an event fired, it never gets it. Fix: event sequencing with replay (track lastEventId). (4) Proxy timeouts: corporate proxies close connections after 60–90s. Fix: server sends a heartbeat response at 20–30s intervals. (5) Head-of-line blocking on HTTP/1.1: browsers limit 6 concurrent connections per domain, so one long-poll request can block other resource loads. Fix: serve long-poll requests from a separate subdomain.',
    },
  ],

  commonMistakes: [
    'Using short polling when long polling or WebSockets would reduce server load by 10–100×.',
    'Not implementing server-side timeouts — connections hang forever behind proxies that close idle connections silently.',
    'Forgetting event sequence IDs — clients that disconnect and reconnect miss events with no way to recover them.',
    'Using a thread-per-connection server (Apache prefork) for long polling — runs out of threads/memory at a few hundred concurrent users.',
    'Not implementing exponential backoff on the client — a server restart causes all clients to reconnect simultaneously, creating a spike that crashes the server again.',
    'Putting long-poll endpoints behind the same domain as regular assets — the browser\'s 6-connection-per-domain limit means one open long-poll can slow down page loads.',
  ],
};
