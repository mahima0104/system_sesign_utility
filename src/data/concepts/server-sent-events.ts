import type { ConceptDeepDive } from '../../types';

export const serverSentEvents: ConceptDeepDive = {
  moduleId: 'server-sent-events',
  tagline: 'One-way server push over plain HTTP — simple, reliable, built into browsers',

  introduction: {
    layman:
      'Sometimes you need the server to push updates to the browser — but those updates only flow one way: server to browser. Think of a live sports score ticker, stock prices updating on a dashboard, or an AI assistant typing out its response word by word. You don\'t need the browser to send anything back on that same channel. Server-Sent Events (SSE) is the browser\'s built-in tool for exactly this: the server opens a response and keeps it open, sending new data whenever it wants. The browser has a native API called `EventSource` that handles reconnection, parsing, and error recovery automatically.',
    analogy:
      'SSE is like subscribing to a newspaper that gets delivered in real time. The newspaper office (server) pushes each new article to your door (browser) the moment it\'s written. You don\'t write back to the newspaper — you just receive. Compare to a phone call (WebSocket) where both parties speak; or to you walking to the newsstand every 5 minutes to check (polling). SSE is the one-way broadcast channel.',
    whyMatters:
      'SSE is underused and underrated. It works through every HTTP proxy and CDN, has built-in reconnection, uses plain text you can debug in a browser tab, and is native to every modern browser without any library. The explosion of AI chatbots (ChatGPT, Claude, Copilot) has brought SSE back into the spotlight — streaming LLM token output to the browser is SSE\'s ideal use case. Interviewers ask about it to see if you know when to reach for a simpler tool instead of defaulting to WebSockets.',
  },

  subTopics: [
    {
      title: 'The SSE Protocol — What Goes Over the Wire',
      icon: '📨',
      layman:
        'SSE uses a dead-simple text format. The server sends lines of text over a normal HTTP response that never closes. Each message is a few lines starting with "data:", followed by a blank line. That\'s the entire protocol — no binary, no complex framing, no handshake beyond standard HTTP.',
      technical:
        'The server responds with Content-Type: text/event-stream and keeps the connection open. Each event is one or more fields followed by a blank line (\\n\\n). Fields: `data:` (the message payload, one line per field), `event:` (optional custom event name), `id:` (optional event sequence number), `retry:` (optional client reconnection delay in ms). Example response body: `id: 42\\nevent: price-update\\ndata: {"symbol":"AAPL","price":189.42}\\n\\n`. Multi-line data: repeat `data:` fields, they\'re concatenated with newlines. The response uses chunked transfer encoding to stream indefinitely without declaring Content-Length.',
      example:
        'Open any OpenAI streaming API response in a browser\'s network tab. You\'ll see a Content-Type: text/event-stream response with lines like `data: {"id":"chatcmpl-xxx","choices":[{"delta":{"content":"Hello"}}]}` arriving one token at a time — each chunk is one SSE event, and the browser displays it instantly without waiting for the full response.',
    },
    {
      title: 'The EventSource API — Browser-Side Made Simple',
      icon: '🌐',
      layman:
        'The browser has a built-in object called `EventSource` that handles all the SSE complexity for you. You give it a URL, and it calls your callback function every time a new message arrives. If the connection drops, it reconnects automatically. No libraries needed.',
      technical:
        'Usage: `const es = new EventSource(\'/stream\')`. Event listeners: `es.onmessage = (e) => console.log(e.data)` for unnamed events; `es.addEventListener(\'price-update\', handler)` for named events. State: `es.readyState` (0=CONNECTING, 1=OPEN, 2=CLOSED). Automatic reconnection: on connection loss, EventSource waits `retry:` ms (default 3000ms) then reconnects, sending `Last-Event-ID` header with the last received `id:` value. To stop: `es.close()`. Limitation: EventSource only supports GET requests and cannot send custom headers (use cookies or URL tokens for auth).',
      example:
        'A live election results dashboard: `const results = new EventSource(\'/api/election/live\')`. The server pushes a new event every time a county reports. `results.addEventListener(\'county-result\', e => updateMap(JSON.parse(e.data)))`. If the user\'s laptop sleeps and wakes, EventSource reconnects automatically, sending the last received ID so the server replays any missed county results.',
      whenToUse:
        'Use EventSource for simple one-way server-to-browser streams in modern browsers. If you need authentication headers or POST, use the `fetch` API with `ReadableStream` instead (same SSE protocol, more flexible).',
    },
    {
      title: 'Auto-Reconnection & Event IDs — Never Miss a Message',
      icon: '🔁',
      layman:
        'Connections drop. The browser goes to sleep. The server restarts. SSE has a built-in mechanism to handle this: event sequence IDs. When the browser reconnects after a dropped connection, it tells the server the last event it received. The server can then replay everything it missed.',
      technical:
        'Server assigns monotonically increasing `id:` to each event. Browser stores the last received ID in memory. On reconnect, browser sends `Last-Event-ID: 42` HTTP header. Server starts streaming from event 43. This requires the server to persist recent events (in Redis, Postgres, or an in-memory buffer). The `retry:` field (in milliseconds) tells the browser how long to wait before reconnecting — the server can dynamically adjust this (e.g., `retry: 5000\\n\\n` to back off under load). If the server sends `id:` with an empty value (`id:\\n`), the browser resets its stored ID — useful for stateless streams that don\'t support replay.',
      example:
        'A financial news feed: server emits 200 news articles per day, each with an incremental ID. User closes laptop at noon (last event ID: 1,547). Opens laptop at 6pm. EventSource reconnects with `Last-Event-ID: 1547`. Server queries: `SELECT * FROM news_events WHERE id > 1547` and streams the afternoon\'s articles instantly, then continues live. The user never sees a gap in their feed.',
    },
    {
      title: 'SSE on the Server — Keeping Connections Open',
      icon: '🖥️',
      layman:
        'The tricky part of SSE is the server: it needs to hold thousands of open HTTP responses simultaneously, pushing data to each one when events occur. Old-fashioned "one thread per request" servers struggle. Modern async servers handle this easily.',
      technical:
        'Streaming response: do not buffer; flush after each event. In Node.js: `res.write(\'data: hello\\n\\n\')` — no `res.end()` until the stream closes. In Python FastAPI: use `StreamingResponse` with an async generator. The server must: (1) Register each response object against a user/channel ID. (2) Subscribe to an event source (Redis Pub/Sub, in-process event emitter). (3) When an event fires, find all subscribed responses and `write()` + flush to each. (4) Handle client disconnect by removing the response from the registry (listen for the `close` event on the response/request). Memory: each open SSE connection is ~10–50 KB (response buffers + kernel socket). A 2 GB server can hold ~20,000–100,000 concurrent SSE connections.',
      example:
        'Node.js SSE server for a dashboard: app registers each `res` object in a Map keyed by userId. A Redis subscriber listens for `dashboard:update` channel. On message: iterate the Map, call `res.write(formatSSE(data))` for each matching user. On client disconnect: `req.on(\'close\', () => connections.delete(userId))`. Simple, explicit, and scales well with async I/O.',
    },
    {
      title: 'SSE Limitations & When to Use Something Else',
      icon: '⚠️',
      layman:
        'SSE is one-way — the browser can only receive, not send, over the SSE connection. If the user\'s action needs to go back to the server, you send a separate regular HTTP request. SSE is also text-only — fine for JSON, not ideal for binary data like audio or video streams.',
      technical:
        'Limitations: (1) Unidirectional: client-to-server messages require separate HTTP requests. (2) Text only: binary data must be base64-encoded (+33% size overhead). (3) HTTP/1.1 browser connection limit: browsers allow 6 connections per domain; one SSE uses one permanently — open multiple tabs and you hit the limit. HTTP/2 multiplexes streams over one TCP connection, removing this limit. (4) No built-in message acknowledgement: if the client receives a message but crashes before processing, it cannot nack. (5) Stateful server: like WebSockets, SSE requires the client to stay connected to the same server pod (or use a shared bus for fanout).',
      example:
        'An AI chat interface (ChatGPT-style): The user types a message → POST /chat (regular HTTP). Server streams the LLM response back via SSE. User sees tokens appearing word by word. This is the canonical SSE use case — one-way, text, medium frequency, browser\'s EventSource handles reconnection automatically.',
      whenToUse:
        'SSE is ideal for: AI/LLM streaming output, live dashboards (metrics, scores), notification feeds, log streaming to a browser terminal, and any "server broadcasts, client watches" pattern. Switch to WebSockets when clients also need to send frequent messages over the same channel.',
    },
  ],

  comparison: {
    caption: 'SSE vs WebSockets vs Long Polling — pick the right tool',
    columns: ['Aspect', 'SSE', 'WebSockets', 'Long Polling'],
    rows: [
      ['Direction', 'Server → Client only', 'Bidirectional', 'Server → Client (simulated)'],
      ['Protocol', 'HTTP/1.1 or HTTP/2', 'WS / WSS (upgraded from HTTP)', 'HTTP'],
      ['Browser API', 'EventSource (native)', 'WebSocket (native)', 'fetch / XHR (manual)'],
      ['Auto-reconnect', '✅ Built in', '❌ Must implement', '❌ Must implement'],
      ['Proxy compatibility', '✅ Universal', '⚠️ May be blocked', '✅ Universal'],
      ['Binary support', '❌ Text only', '✅ Binary + text', '❌ Text only'],
      ['HTTP/2 multiplexing', '✅ Multiple streams, one TCP', '❌ Separate connection', 'N/A'],
      ['Best for', 'AI streaming, dashboards, feeds', 'Chat, gaming, collab editing', 'Compatibility fallback'],
    ],
  },

  realWorldExamples: [
    {
      company: 'OpenAI / ChatGPT',
      icon: '🤖',
      description:
        'ChatGPT\'s streaming response — where you see the AI\'s answer appear word by word — is implemented with SSE. The API endpoint streams `data:` events containing JSON chunks, each carrying the next token. The browser\'s fetch + ReadableStream (SSE-compatible) renders each chunk instantly, giving the feel of the AI "thinking out loud" in real time.',
    },
    {
      company: 'GitHub Copilot',
      icon: '💻',
      description:
        'Copilot\'s inline code suggestions and chat stream completions token by token using SSE. The IDE extension connects to GitHub\'s backend, which streams the LLM\'s output as SSE events. The partial suggestion appears in the editor as tokens arrive, allowing the developer to accept or reject before the full completion is generated.',
    },
    {
      company: 'Cloudflare Dashboard',
      icon: '☁️',
      description:
        'Cloudflare\'s real-time analytics dashboard uses SSE to push live request metrics, firewall events, and DDoS alerts to the browser. The one-way nature is perfect — the dashboard is a passive consumer of server data. SSE\'s ability to traverse Cloudflare\'s own CDN without configuration makes it a natural fit.',
    },
    {
      company: 'Twitter/X Live Activity',
      icon: '🐦',
      description:
        'Twitter\'s live tweet counts and trending topic updates are powered by SSE-style streaming. The server pushes incremental count updates to the browser without the client polling. SSE\'s built-in reconnection is valuable here: a brief network hiccup reconnects automatically, picking up from the last received event ID.',
    },
  ],

  interviewQuestions: [
    {
      question: 'What is SSE and when would you use it over WebSockets?',
      answer:
        'SSE (Server-Sent Events) is a standard HTTP protocol where the server holds a response open and pushes newline-delimited text events to the browser. The browser\'s built-in EventSource API handles reconnection and parses the events. Use SSE when communication is one-way (server to client): AI text streaming, live dashboards, news feeds, score updates. Use WebSockets when the client also needs to send messages over the same persistent connection (chat, gaming, collaborative editing). SSE wins on simplicity: works through all HTTP proxies, has native browser reconnection, and doesn\'t require WebSocket-aware infrastructure.',
    },
    {
      question: 'How does SSE handle dropped connections and missed events?',
      answer:
        'SSE has two complementary mechanisms: automatic reconnection and event IDs. The browser\'s EventSource automatically reconnects after a connection drop, waiting `retry:` milliseconds (default 3s). When reconnecting, it sends a `Last-Event-ID` HTTP header containing the last event ID it received. The server should use this ID to replay any events that occurred while the client was disconnected — typically by querying a persistent event store (Redis, database) for events with ID greater than the received value. If the server doesn\'t support replay, it can ignore the header and stream from the current state. This mechanism makes SSE resilient to brief network interruptions with zero developer code on the client side.',
    },
    {
      question: 'Why do browsers limit SSE connections per domain, and how does HTTP/2 fix it?',
      answer:
        'Under HTTP/1.1, browsers allow 6 concurrent connections per domain. An SSE connection is a persistent HTTP response that occupies one of those 6 slots indefinitely. Open two browser tabs with SSE on the same domain: 2 slots gone. Open 6 tabs: the 7th tab\'s SSE connection is queued and blocked. Under HTTP/2, all streams are multiplexed over a single TCP connection — you can have 100+ SSE streams on one connection. On HTTP/2, this limit disappears entirely. The practical advice: serve SSE endpoints over HTTP/2 (which most modern servers do by default), and if you must support HTTP/1.1, use a separate subdomain (e.g., stream.example.com) to give SSE its own 6-connection budget.',
    },
    {
      question: 'How would you implement a live dashboard that shows server metrics updating every second for 50,000 users?',
      answer:
        'SSE is a good fit here. Architecture: (1) Each browser connects to a load-balanced fleet of SSE servers via EventSource. (2) SSE servers subscribe to a Redis Pub/Sub channel where the metrics collector publishes updates every second. (3) On each published event, each SSE server iterates its connected clients and writes the event to each open response. At 50k users, 20 SSE servers × 2,500 clients each is comfortable. Key implementation details: use async I/O (Node.js/Go) so holding 2,500 connections doesn\'t need 2,500 threads; send a heartbeat comment (`: keepalive\\n\\n`) every 30s to prevent proxy timeouts; set `Cache-Control: no-cache` to prevent intermediate caches from buffering the stream. If not all users need the same data, add a filter so each SSE server only delivers relevant metrics to each client.',
    },
  ],

  commonMistakes: [
    'Not setting `Cache-Control: no-cache` on the SSE response — some proxies buffer the stream, destroying the real-time effect.',
    'Forgetting to flush after each event — frameworks that buffer responses will hold events until the buffer is full, adding latency.',
    'Not handling client disconnect on the server — each disconnected client\'s response object stays in memory forever, causing a leak.',
    'Opening SSE from multiple tabs on the same HTTP/1.1 domain — exhausts the browser\'s 6-connection limit; use a separate subdomain or HTTP/2.',
    'Using SSE when bidirectional communication is needed — sending client data via a separate HTTP request for every action adds latency and complexity; use WebSockets instead.',
    'Not assigning event IDs — without IDs, a client that reconnects after a brief outage gets no indication of what it missed, leading to data gaps.',
  ],
};
