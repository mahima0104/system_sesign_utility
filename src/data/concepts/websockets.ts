import type { ConceptDeepDive } from '../../types';

export const websockets: ConceptDeepDive = {
  moduleId: 'websockets',
  tagline: 'One connection, two-way conversation — the phone call of the web',

  introduction: {
    layman:
      'Every time your browser loads a web page, it uses HTTP — a protocol built on a simple idea: the browser asks, the server answers, the connection closes. That\'s fine for loading pages, but terrible for live chat, multiplayer games, or live stock prices where the server needs to push data to you at any moment without waiting for you to ask. WebSockets solve this by turning that "ask-answer-close" pattern into a persistent open connection — like upgrading from postcards to a phone call. Once connected, both sides can send messages to each other at any time.',
    analogy:
      'HTTP is like exchanging text messages — you send one, wait for a reply, send another. WebSockets are like a phone call — once connected, both parties can speak whenever they want, simultaneously, without "taking turns." The setup (dialling) takes a moment, but after that, communication is instant and continuous.',
    whyMatters:
      'WebSockets are in every senior engineer\'s toolkit and every system design interview about real-time features. Chat apps, collaborative editing (Google Docs), live sports scores, multiplayer games, trading platforms — all rely on WebSockets. Understanding the upgrade handshake, the frame format, connection management at scale, and the trade-offs vs long polling and SSE separates a candidate who\'s read the docs from one who has shipped production WebSocket systems.',
  },

  subTopics: [
    {
      title: 'The WebSocket Handshake — Upgrading from HTTP',
      icon: '🤝',
      layman:
        'WebSocket connections start as a regular HTTP request. The client asks "can we upgrade to WebSocket?" and if the server agrees, they switch to a different protocol over the same TCP connection. After the upgrade, HTTP is out of the picture — both sides exchange lightweight "frames" directly.',
      technical:
        'Client sends an HTTP/1.1 GET request with headers: `Upgrade: websocket`, `Connection: Upgrade`, `Sec-WebSocket-Key: <base64-random>`, `Sec-WebSocket-Version: 13`. Server responds with HTTP 101 Switching Protocols, `Sec-WebSocket-Accept: <SHA1-of-key+GUID>`. After this handshake, the TCP socket is kept open and WebSocket framing begins. The `Sec-WebSocket-Key` exchange prevents cache poisoning attacks by ensuring the response is genuinely from a WebSocket-aware server. Total handshake overhead: one HTTP round-trip.',
      example:
        'Opening Chrome DevTools → Network → filter by "WS" shows the WebSocket connection in Slack. You can see the HTTP 101 upgrade request and then watch individual frames flying back and forth — message payloads, typing indicators, presence updates — all over the same single TCP connection.',
    },
    {
      title: 'WebSocket Frames — The Message Format',
      icon: '📦',
      layman:
        'After the handshake, data is sent in "frames" — small packets with a tiny header (just 2–10 bytes) followed by the payload. This is vastly more efficient than HTTP requests, which carry hundreds of bytes of headers even for a 3-byte "hi!" message.',
      technical:
        'A WebSocket frame has: 1-bit FIN flag (is this the last fragment?), 3 reserved bits, 4-bit opcode (0x1=text, 0x2=binary, 0x8=close, 0x9=ping, 0xA=pong), 1-bit mask flag (clients must mask frames; servers must not), 7-bit payload length (or extended 16/64-bit for large payloads). Client-to-server frames are XOR-masked with a 4-byte key (CSRF protection for browsers). Over HTTP/1.1, minimum overhead is 2 bytes vs ~500 bytes for a new HTTP request. Over a 60s session with 100 messages/s, WebSocket saves ~3 MB of header overhead vs HTTP.',
      example:
        'A stock price update of {"symbol":"AAPL","price":189.42} = 32 bytes payload. Via WebSocket: 32 + 2 = 34 bytes total. Via a new HTTP request: 32 bytes body + ~450 bytes of HTTP headers = 482 bytes. At 10 updates/second per user × 100,000 users, that\'s 4.5 GB/s saved just in header overhead.',
    },
    {
      title: 'Connection Lifecycle — Ping, Pong & Close',
      icon: '💓',
      layman:
        'Connections can silently die — a phone goes into airplane mode, a router reboots, a corporate proxy kills idle connections. WebSocket has built-in keepalive messages (ping/pong) to detect dead connections before they cause problems, and a clean close handshake to end sessions gracefully.',
      technical:
        'Ping frame (opcode 0x9): server or client sends; the other side must reply with a Pong (opcode 0xA) within a reasonable time. If no pong arrives, the connection is considered dead and closed. Typical intervals: ping every 30s, close after 2 missed pongs. Close handshake: sender sends Close frame with status code (1000=normal, 1001=going away, 1002=protocol error, 1011=server error); receiver echoes the Close frame; TCP connection closes. If the TCP connection drops without a Close frame (network cut), the next ping/write attempt raises an error.',
      example:
        'Heroku\'s HTTP routing layer closes connections idle for 55 seconds. Any WebSocket app deployed on Heroku must send a ping or data at least every 50 seconds or the proxy silently closes the connection. Every WebSocket library handles this differently — knowing to configure the ping interval is a common production gotcha.',
      whenToUse:
        'Always implement ping/pong keepalives in production. Default off in most libraries but essential behind load balancers, CDNs, and corporate proxies that close idle TCP connections.',
    },
    {
      title: 'Scaling WebSockets — The Sticky Session Problem',
      icon: '📈',
      layman:
        'Standard HTTP servers are stateless — any request can go to any server. WebSockets break this: once a client connects to Server A, all their messages must go to Server A (the connection lives there). Adding more servers is not as simple as putting a load balancer in front.',
      technical:
        'Two approaches: (1) Sticky sessions (session affinity): the load balancer routes all traffic from a given client to the same backend server. Works but creates uneven load distribution and makes zero-downtime deploys harder. (2) Pub/Sub message bus: WebSocket servers are stateless; each server subscribes to a shared message bus (Redis Pub/Sub, Kafka). When Server A gets a message for a user connected to Server B, it publishes to Redis; Server B receives it and delivers to the client. This is how Slack, Discord, and most at-scale WebSocket systems work. Each server can handle 10,000–100,000 concurrent WebSocket connections (depends on RAM and IO).',
      example:
        'Discord handles millions of concurrent WebSocket connections by running dedicated "gateway" servers. Each gateway manages ~100k open connections. An event for a user on Gateway 5 published to Kafka gets consumed by Gateway 5 and pushed. When a gateway restarts, its clients reconnect to any available gateway — no state is lost because state lives in the database, not the gateway.',
    },
    {
      title: 'WebSocket Security',
      icon: '🔒',
      layman:
        'WebSocket connections need the same security care as HTTP. Unencrypted WebSocket (ws://) sends all data in plaintext — anyone on the network can read it. Encrypted WebSocket (wss://) uses TLS just like HTTPS. Authentication is trickier — the browser can\'t send custom HTTP headers during the WebSocket handshake from JavaScript.',
      technical:
        'Always use wss:// (WebSocket over TLS). Authentication options: (1) Pass a token in the URL query string during handshake — simple but token appears in server logs (use short-lived tokens). (2) Authenticate via HTTP cookie (automatically sent during the handshake since it\'s an HTTP request). (3) Send auth message as the first WebSocket frame after connecting. CSRF: the handshake uses HTTP cookies but the Origin header must be validated server-side. Authorization: check permissions before sending messages — a user shouldn\'t receive another user\'s private messages just because they share a channel.',
      example:
        'Slack\'s WebSocket URL includes a short-lived token: wss://wss-primary.slack.com/link?token=<jwt>. The token expires in minutes — if you disconnect and reconnect, a fresh token is fetched via a regular HTTP call first. This prevents stolen WebSocket URLs from being reused.',
    },
    {
      title: 'WebSockets vs Long Polling vs SSE',
      icon: '⚖️',
      layman:
        'You have three real-time HTTP options: long polling (fake real-time via held HTTP requests), SSE (one-way server-to-client stream), and WebSockets (full two-way connection). Choosing the wrong one for your use case adds unnecessary complexity.',
      technical:
        'Long polling: universal HTTP compatibility, simple horizontal scaling, high overhead per message. Good for low-frequency events (< 1/s). SSE: native browser API, automatic reconnection, text-only, server-to-client only, works through all HTTP/1.1 proxies. Good for dashboards, news feeds, AI streaming. WebSockets: binary + text, full-duplex, lowest overhead at high frequency, requires WS-aware infrastructure. Good for chat, gaming, collaborative editing.',
      example:
        'OpenAI\'s ChatGPT streaming uses SSE — the model streams text to the browser, never needs to receive messages back over the same channel. Slack uses WebSockets — messages go both ways (you type, others type, presence changes). A sports score ticker would use SSE or long polling — scores go one direction, infrequently.',
      whenToUse:
        'Use WebSockets when you need both server-to-client and client-to-server messages over the same connection at moderate-to-high frequency. Use SSE when it\'s one-way server push. Use long polling as a compatibility fallback.',
    },
  ],

  comparison: {
    caption: 'HTTP vs WebSocket per-message cost (approximate)',
    columns: ['Metric', 'HTTP Request', 'WebSocket Frame'],
    rows: [
      ['Header overhead', '~500 bytes', '2–10 bytes'],
      ['Connection setup', 'Per request (TCP + TLS)', 'Once (then reused)'],
      ['Latency after setup', 'RTT per message', 'Near-zero (already connected)'],
      ['Server pushes without client asking', '❌ Not possible', '✅ Anytime'],
      ['Works through all HTTP proxies', '✅', '⚠️ May require ws proxy config'],
      ['Binary data support', 'Base64-encoded', '✅ Native binary frames'],
    ],
  },

  realWorldExamples: [
    {
      company: 'Slack',
      icon: '💼',
      description:
        'Slack\'s real-time messaging, typing indicators, and presence (online/away) all run over WebSockets. Their gateway servers each maintain ~100k persistent connections. Events are fanned out through a Kafka-based message bus so any gateway can deliver messages for any user regardless of which server originally received them.',
    },
    {
      company: 'Discord',
      icon: '🎮',
      description:
        'Discord\'s "Gateway" WebSocket service handles hundreds of millions of concurrent connections during peak gaming hours. Each connection receives real-time events: messages, voice state changes, typing indicators, member presence. Discord\'s engineering blog documents how they scaled from a single server to a distributed fleet of gateway pods, each backed by shared Elixir/Phoenix state.',
    },
    {
      company: 'Figma',
      icon: '🎨',
      description:
        'Figma\'s multiplayer collaborative editing (multiple cursors, real-time shape updates) runs entirely over WebSockets. Every mouse movement, shape resize, and text edit is a WebSocket message. The server merges concurrent edits using operational transforms and broadcasts the resolved state to all participants.',
    },
    {
      company: 'Robinhood / Trading Platforms',
      icon: '📈',
      description:
        'Live stock prices, order book updates, and trade confirmations require sub-100ms delivery to thousands of clients simultaneously. HTTP polling at that frequency would overwhelm any server. WebSocket connections let the backend push price ticks the moment they arrive from the exchange, with ~2ms delivery to the browser.',
    },
  ],

  interviewQuestions: [
    {
      question: 'How does a WebSocket connection get established? Walk through the handshake.',
      answer:
        'The client sends a standard HTTP/1.1 GET request to the WebSocket endpoint with three special headers: `Upgrade: websocket`, `Connection: Upgrade`, and `Sec-WebSocket-Key` (a base64-encoded 16-byte random value). The server validates the request, generates `Sec-WebSocket-Accept` by concatenating the key with a fixed GUID, SHA-1 hashing it, and base64-encoding the result, then responds with HTTP 101 Switching Protocols. After this single round-trip, the TCP connection switches to WebSocket framing — HTTP is done. The `Sec-WebSocket-Key` exchange is a security measure to ensure the response is from a genuine WebSocket server rather than a cached HTTP response.',
    },
    {
      question: 'How would you scale WebSocket connections to support 1 million concurrent users?',
      answer:
        'You cannot route all clients to one server — each connection holds a file descriptor and memory. Approach: (1) Run a fleet of WebSocket gateway servers, each handling 50k–100k connections. (2) Use a shared message bus (Redis Pub/Sub or Kafka) so any gateway can deliver a message to any client regardless of which gateway they\'re connected to. (3) Load balance using IP hash or sticky sessions to send reconnecting clients back to the same gateway if possible. (4) Store all state in an external database — gateways are stateless in terms of business logic. (5) Use horizontal pod autoscaling; when a gateway restarts, its clients reconnect automatically. At 1M users with 50k connections/gateway, you need ~20 gateway instances. Add a 2× safety margin and plan for graceful drain on deploy.',
    },
    {
      question: 'What happens when a WebSocket server restarts in production? How do you handle it gracefully?',
      answer:
        'A server restart drops all WebSocket connections — clients receive a close frame or a TCP reset. Mitigation: (1) Graceful drain: stop accepting new connections, wait for in-flight messages to complete, then close. (2) Client-side reconnection logic with exponential backoff and jitter — don\'t let all clients reconnect simultaneously and overwhelm the restarted server. (3) Sequence numbers / event IDs: clients reconnect with their last-seen sequence; server replays missed events. (4) Load balancer health checks: mark the server as unavailable before starting the drain so new connections are routed elsewhere. For zero-downtime deploys with rolling restarts, this allows gradual migration without a thundering herd.',
    },
    {
      question: 'Why do WebSocket clients need to mask their frames? Why don\'t servers mask?',
      answer:
        'The masking requirement for client-to-server frames protects against a specific cache-poisoning attack. Before WebSockets, some transparent HTTP proxies (used in ISPs and enterprises) would cache HTTP responses based on the URL. An attacker on a public network could craft WebSocket data that looks like an HTTP response, tricking the proxy into caching it — subsequent legitimate users would get the attacker\'s content. Masking (XOR with a per-frame random key) ensures client frames can never look like valid HTTP. Servers don\'t mask because they\'re not proxied through the same infrastructure and the attack vector doesn\'t apply in the server-to-client direction.',
    },
    {
      question: 'When would you choose WebSockets over Server-Sent Events (SSE)?',
      answer:
        'Choose WebSockets when you need bidirectional communication — the client sends messages to the server AND the server sends to the client over the same persistent connection (chat, collaborative editing, gaming). SSE is server-to-client only; if the client also needs to send data, you\'d need a separate HTTP request per message, which defeats the purpose. Also choose WebSockets when you need binary data (SSE is text only), when message frequency is very high (SSE has slightly more overhead), or when you need sub-protocols (e.g., STOMP or MQTT over WebSocket). Use SSE when the communication is genuinely one-way — AI text streaming, live dashboards, news feeds — because SSE has automatic reconnection, works through HTTP/1.1 proxies, and doesn\'t require WebSocket-aware infrastructure.',
    },
  ],

  commonMistakes: [
    'Not using wss:// (encrypted WebSocket) — sending user data in plaintext is a critical security vulnerability.',
    'Not implementing ping/pong keepalives — connections behind corporate proxies or Heroku close after 55–90 seconds of inactivity.',
    'Storing connection state in the WebSocket server\'s memory — makes the server stateful, breaks horizontal scaling, and loses state on restart.',
    'Not handling client reconnections — network blips are normal; clients must reconnect automatically with exponential backoff.',
    'Sending messages to all connections in a naive loop from a single goroutine/thread — creates backpressure and head-of-line blocking; each connection should have its own write goroutine/channel.',
    'Skipping authentication — the WebSocket handshake is an HTTP request; validate tokens/cookies before upgrading the connection.',
    'Using WebSockets for low-frequency one-way events (e.g., a score that updates once per minute) — SSE or long polling is simpler and has the same user experience.',
  ],
};
