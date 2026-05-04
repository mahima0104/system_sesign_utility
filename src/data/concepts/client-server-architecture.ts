import type { ConceptDeepDive } from '../../types';

export const clientServerArchitecture: ConceptDeepDive = {
  moduleId: 'client-server-architecture',
  tagline: 'The request-response foundation behind websites, mobile apps, APIs, and most distributed systems.',
  introduction: {
    layman:
      'Client-server architecture means one side asks for something and another side provides it. Your browser or mobile app is the client. The server receives the request, runs logic, fetches or saves data, and sends a response back.',
    analogy:
      'Think of a restaurant. You are the client, the waiter carries your request, the kitchen prepares the food, and the bill or meal comes back as the response.',
    whyMatters:
      'Most system design interviews start with this model. Once you understand where the client, network, server, cache, and database fit, it becomes much easier to explain scaling, latency, load balancing, APIs, and failures.',
  },
  subTopics: [
    {
      title: 'Client, Server, and Network',
      icon: '👤',
      layman:
        'The client is the app the user touches. The server is the machine or service doing the work. The network is the road between them.',
      technical:
        'Clients initiate requests over protocols such as HTTP/HTTPS. Servers listen on ports, process requests, execute business logic, talk to storage systems, and return structured responses such as HTML, JSON, files, or status codes.',
      example:
        'When you open a shopping app, the phone sends a request for product data. Backend servers query catalog storage and return products as JSON for the app to render.',
      whenToUse:
        'Use this mental model whenever users or devices need to access shared data, business logic, or services over a network.',
    },
    {
      title: 'Request-Response Flow',
      icon: '🔁',
      layman:
        'A user action becomes a request. The server receives it, performs work, and returns a response that the client displays.',
      technical:
        'A typical web flow includes DNS lookup, TLS setup for HTTPS, HTTP request routing, server-side validation, application logic, optional cache/database access, and a response with status code, headers, and body.',
      example:
        'Clicking “Place Order” sends a POST request. The server validates inventory, creates an order, charges payment, and returns a success or failure response.',
      whenToUse:
        'Use request-response for actions where the client expects an immediate answer, such as fetching a profile, submitting a form, or searching a catalog.',
    },
    {
      title: '1-Tier, 2-Tier, 3-Tier, and N-Tier',
      icon: '🏗️',
      layman:
        'Tiers describe how many layers the system has. A tiny app may keep everything together. A large app separates UI, business logic, data, caching, security, and routing into different layers.',
      technical:
        '1-tier keeps UI, logic, and data in one application. 2-tier usually has a client talking directly to a server or database. 3-tier separates presentation, application logic, and data. N-tier extends this with layers such as CDN, load balancer, API gateway, cache, auth, analytics, and search.',
      example:
        'A spreadsheet is close to 1-tier. A desktop tool connected to a central database is 2-tier. A SaaS web app with browser, API server, and database is 3-tier. Netflix-like systems are N-tier.',
      whenToUse:
        'Start with the simplest tiering that satisfies the product. Add tiers when scale, security, team ownership, or performance requires separation.',
    },
    {
      title: 'Benefits',
      icon: '✅',
      layman:
        'Client-server systems let many users share the same service without installing all logic and data on every device.',
      technical:
        'Centralized servers make data consistency, access control, upgrades, monitoring, and scaling easier than distributing all behavior to every client. Clients can stay lightweight while servers handle heavier logic.',
      example:
        'A banking mobile app does not store all account rules locally. The server owns account balances, fraud checks, transaction history, and permissions.',
      whenToUse:
        'Use client-server when multiple clients need shared data, centralized policy, controlled updates, or common backend workflows.',
    },
    {
      title: 'Challenges',
      icon: '⚠️',
      layman:
        'If the server is slow, down, or overloaded, many users feel it. The network also adds latency and can fail.',
      technical:
        'Key risks include server bottlenecks, network latency, single points of failure, overload, security exposure, version compatibility between clients and APIs, and database contention.',
      example:
        'If all mobile apps call one overloaded API server during a sale, users may see timeouts even if their phones are working perfectly.',
      whenToUse:
        'Plan for retries, timeouts, load balancing, caching, rate limiting, observability, and graceful degradation in production systems.',
    },
    {
      title: 'Scaling the Model',
      icon: '📈',
      layman:
        'As users grow, you add more helpers: CDN for static files, load balancers for traffic, caches for repeated reads, and database scaling for data pressure.',
      technical:
        'Common scaling techniques include horizontal server replicas, stateless APIs, load balancing, CDN caching, application caching, read replicas, sharding, asynchronous queues, and autoscaling.',
      example:
        'An e-commerce homepage can serve images from a CDN, route API traffic through a load balancer, read product data from cache, and write orders to the primary database.',
      whenToUse:
        'Scale the bottleneck you can measure. Do not add every layer on day one; add layers as traffic, latency, reliability, or team needs justify them.',
    },
  ],
  comparison: {
    caption: 'Client-server tiers from simplest to most scalable.',
    columns: ['Model', 'Structure', 'Good For', 'Trade-Off'],
    rows: [
      ['1-Tier', 'UI, logic, and data together', 'Offline tools and small local apps', 'Very simple, but not scalable for multi-user systems'],
      ['2-Tier', 'Client talks directly to server/data layer', 'Small internal tools', 'Fast to build, but server/data can become bottlenecked'],
      ['3-Tier', 'Client, application server, database', 'Most web apps and SaaS products', 'Clear separation, with more deployment complexity'],
      ['N-Tier', 'Specialized layers like CDN, gateway, cache, services, data', 'Large-scale and enterprise systems', 'Highly scalable, but harder to operate and debug'],
    ],
  },
  realWorldExamples: [
    {
      company: 'Web Browser + Website',
      icon: '🌍',
      description:
        'A browser requests HTML, CSS, JavaScript, images, and API data from servers. DNS, CDN, load balancers, and app servers may all participate.',
    },
    {
      company: 'Mobile Banking',
      icon: '🏦',
      description:
        'The app is the client. Servers handle authentication, account rules, fraud checks, transaction processing, and database updates.',
    },
    {
      company: 'Spotify or YouTube',
      icon: '🎧',
      description:
        'The client requests playlists, metadata, and streams. Backend services and CDNs work together to deliver fast responses.',
    },
    {
      company: 'Online Shopping',
      icon: '🛒',
      description:
        'Clients browse products and place orders while servers coordinate catalog, cart, payment, inventory, and order storage.',
    },
  ],
  interviewQuestions: [
    {
      question: 'Explain client-server architecture in a system design interview.',
      answer:
        'Client-server architecture separates the user-facing client from backend servers. The client sends requests over a network, and servers process logic, access data or services, and return responses. This separation supports shared data, centralized logic, security control, and independent scaling of backend resources.',
    },
    {
      question: 'What is the difference between 2-tier and 3-tier architecture?',
      answer:
        'In 2-tier architecture, the client communicates directly with the server or database layer, which is simple but less scalable. In 3-tier architecture, the system separates presentation, application logic, and data storage. That makes the system easier to secure, maintain, and scale.',
    },
    {
      question: 'How would you scale a basic client-server application?',
      answer:
        'First identify the bottleneck. Common steps are adding a load balancer, making app servers stateless, horizontally scaling server replicas, caching hot reads, serving static assets through a CDN, adding read replicas, and eventually partitioning data or introducing queues for slow work.',
    },
    {
      question: 'What can go wrong in client-server communication?',
      answer:
        'Failures can happen at the client, network, server, cache, or database. Examples include DNS issues, high latency, server overload, database contention, bad retries, API version mismatch, and security failures. Good designs use timeouts, retries with backoff, monitoring, rate limits, and fallback behavior.',
    },
  ],
  commonMistakes: [
    'Drawing only “client → server → database” and forgetting DNS, CDN, load balancer, gateway, cache, and failure points when the scale requires them.',
    'Assuming every request must hit the database instead of using caching, pagination, precomputation, or read replicas for common read paths.',
    'Keeping clients tightly coupled to backend internals, making API changes risky and mobile app upgrades painful.',
    'Adding too many tiers too early. Extra layers bring latency, deployment complexity, monitoring needs, and debugging cost.',
    'Ignoring timeouts, retries, idempotency, and rate limits. These details matter when the network is unreliable or traffic spikes.',
  ],
};
