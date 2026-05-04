import type { ConceptDeepDive } from '../../types';

export const serverlessArchitecture: ConceptDeepDive = {
  moduleId: 'serverless-architecture',
  tagline: '"Serverless" doesn\'t mean no servers — it means you stop thinking about them entirely',

  introduction: {
    layman:
      'In traditional hosting, you rent a server 24/7. At 3 AM with zero users, that server still costs money and someone still has to maintain it. ' +
      'With serverless, you write a function and upload it to the cloud. The cloud runs it only when someone calls it, charges you only for those milliseconds, and handles all the scaling automatically. ' +
      'Your code runs anywhere from 1 request to 1 million requests per minute — and you don\'t change a single config.',
    analogy:
      'Think of electricity. You don\'t own a power plant. You don\'t maintain turbines or worry about capacity. ' +
      'You just plug in and pay for the exact watts you use. When you unplug, you pay nothing. ' +
      'Serverless is the same idea for computing — you plug in your function, and the cloud is the power grid. ' +
      'AWS Lambda, Google Cloud Functions, and Vercel Edge Functions are your sockets.',
    whyMatters:
      'Startups love serverless because they pay ₹0 when nobody is using the app — then auto-scale to millions of users on launch day without any ops work. ' +
      'Netflix uses AWS Lambda for encoding triggers. Airbnb uses it for image processing. Coca-Cola\'s vending machine API runs entirely on Lambda. ' +
      'Understanding serverless trade-offs (especially cold starts) is a common senior engineering interview topic.',
  },

  subTopics: [
    {
      title: 'What is Serverless? FaaS vs BaaS',
      icon: '⚡',
      layman:
        'Serverless has two flavours. FaaS (Function as a Service) — you write individual functions that run on demand. ' +
        'BaaS (Backend as a Service) — you use managed services for databases, auth, storage, so you never build the backend at all.',
      technical:
        'FaaS (AWS Lambda, Google Cloud Functions, Azure Functions, Cloudflare Workers): ' +
        'You deploy individual functions. Each invocation spins up a container, runs the function, and (eventually) discards it. ' +
        'Billing is per 100ms of execution + per invocation. ' +
        'BaaS (Firebase, Supabase, AWS Amplify): managed auth, database, storage, and real-time sync. ' +
        'You write frontend code that calls these services directly — no custom backend at all.',
      example:
        'FaaS: When a user uploads a photo to S3, a Lambda function fires automatically, resizes it to 3 formats, and stores them back. ' +
        'BaaS: A React app uses Firebase Auth for login, Firestore for the database, and Firebase Storage for files — zero backend code written.',
      whenToUse: 'FaaS for event-triggered compute (file processing, webhooks, scheduled jobs). BaaS for rapid prototyping where you want zero backend.',
    },
    {
      title: 'The Cold Start Problem',
      icon: '🥶',
      layman:
        'When nobody has called your function in a while, the cloud has shut it down to save resources. ' +
        'The next request has to wait while the cloud spins up a new container, loads your code, and initialises it. ' +
        'This first request takes much longer than normal — that delay is called a cold start.',
      technical:
        'A cold start = container provisioning + runtime init + function init. ' +
        'Typical cold start times: Node.js/Python ~100-500ms, Java/C# ~1-5s (JVM warmup), Go ~50-100ms. ' +
        'Mitigation strategies: (1) Provisioned Concurrency (AWS) — keep N instances always warm, billed even when idle. ' +
        '(2) Schedule a "keep-warm" ping every 5 minutes. (3) Use a lighter runtime (Go, Node instead of Java). ' +
        '(4) Minimise package size — smaller bundles init faster.',
      example:
        'Your checkout API runs on Lambda. At 4 AM, no one buys anything. ' +
        'At 4:05 AM the first user taps "Buy" — they wait 800ms for the cold start. The next 1000 users get <50ms responses. ' +
        'For payment flows, this is unacceptable → use Provisioned Concurrency for the checkout Lambda.',
      whenToUse: 'If your function handles user-facing requests with strict latency SLAs, cold starts are a critical concern.',
    },
    {
      title: 'Auto-scaling & Stateless Design',
      icon: '📈',
      layman:
        'Every time a new request comes in, serverless can spin up a brand new copy of your function in parallel. ' +
        'If 10,000 requests arrive at once, 10,000 function instances run simultaneously — you did not configure anything. ' +
        'Because each instance is new, your function cannot store anything in memory between calls — it must be completely stateless.',
      technical:
        'Lambda concurrency limit defaults to 1,000 per region (can be raised). Each concurrent execution is an isolated container. ' +
        'No shared memory between invocations — function instances cannot communicate. ' +
        'All state must live externally: session → Redis/DynamoDB, files → S3, counters → DynamoDB/Redis atomic ops. ' +
        'Database connections are a classic serverless trap: 10,000 Lambda instances × 1 DB connection = 10,000 connections (PostgreSQL limit ~500). ' +
        'Solution: use a connection pool proxy like RDS Proxy or PlanetScale.',
      example:
        'Black Friday sale: 0 to 50,000 concurrent users in 5 minutes. ' +
        'With traditional servers, your ops team scrambles to spin up more EC2 instances. ' +
        'With Lambda: AWS handles 50,000 concurrent invocations automatically. Your bill went from ₹5,000/month to ₹15,000 that day — and then back down.',
    },
    {
      title: 'When Serverless is the Wrong Choice',
      icon: '🚫',
      layman:
        'Serverless is not a silver bullet. Some workloads are terrible fits — long-running jobs, high-frequency always-on services, and apps with stateful connections all run better on traditional servers.',
      technical:
        'Avoid serverless when: (1) Execution time exceeds 15 minutes (Lambda limit). ' +
        '(2) You need persistent WebSocket connections (though API Gateway WebSocket helps). ' +
        '(3) Your workload runs 24/7 at high concurrency — always-on servers become cheaper than per-invocation billing at ~60-70% utilisation. ' +
        '(4) You have strict cold-start latency requirements and cannot afford Provisioned Concurrency costs. ' +
        '(5) Heavy background computation (ML training, video encoding) — use EC2 or containers instead.',
      example:
        'A chat application: wrong fit. WebSockets need persistent connections. Lambda is stateless and times out. ' +
        'A nightly report generator: perfect fit. Runs once, takes 3 minutes, uses almost no concurrency. With Lambda it costs pennies vs ₹2,000/month on EC2.',
      whenToUse: 'Use serverless for: event-driven tasks, webhooks, scheduled jobs, variable/unpredictable traffic, and rapid MVPs.',
    },
    {
      title: 'Cost Model — when serverless saves money (and when it doesn\'t)',
      icon: '💰',
      layman:
        'Serverless charges you per request and per millisecond of execution. If your app has millions of idle minutes, you pay nothing. ' +
        'But if your app runs constantly at high traffic, a regular server becomes cheaper very quickly.',
      technical:
        'AWS Lambda pricing (2024): $0.20 per 1M requests + $0.0000166 per GB-second. ' +
        'Break-even rule of thumb: if your function handles >2M requests/month at >500ms avg, a t3.medium EC2 (~$30/month) is usually cheaper. ' +
        'Hidden costs: API Gateway ($3.50/1M calls), data transfer, Provisioned Concurrency (~$0.015/GB-hour always-on). ' +
        'Real cost optimisation: reduce package size (faster init), lower memory allocation (cheaper per ms), use ARM (Graviton) instances (20% cheaper).',
      example:
        'A startup with 10,000 users: Lambda costs ~$0/month (within free tier). ' +
        'A mature API at 500M requests/month: Lambda ~$100, EC2 cluster ~$200 — Lambda still wins. ' +
        'A 24/7 ML inference API at 1B requests/month: Lambda ~$200+ with high compute, EC2 ~$120 — time to move to containers.',
    },
  ],

  comparison: {
    caption: 'Serverless vs Containers vs Traditional servers',
    columns: ['Dimension', 'Serverless (Lambda)', 'Containers (ECS/K8s)', 'Traditional (EC2)'],
    rows: [
      ['Scaling',      'Auto, instant',           'Manual config needed',  'Manual, slow'],
      ['Idle cost',    '$0',                       'Low (can scale to 0)',  'Always billing'],
      ['Cold starts',  'Yes (100ms–5s)',           'Minimal',               'None'],
      ['Max run time', '15 min',                   'Unlimited',             'Unlimited'],
      ['State',        'Stateless only',           'Can be stateful',       'Can be stateful'],
      ['Best for',     'Event-driven, variable load','Microservices, APIs', 'Databases, long-running'],
    ],
  },

  realWorldExamples: [
    {
      company: 'Netflix',
      icon: '🎬',
      description:
        'Uses AWS Lambda to trigger video encoding pipelines when new content is uploaded. ' +
        'Thousands of Lambda functions in parallel process different quality levels — no servers to manage, scales to any new title instantly.',
    },
    {
      company: 'Coca-Cola',
      icon: '🥤',
      description:
        'Their vending machine payment API runs 100% on AWS Lambda. ' +
        'Traffic spikes when machines are restocked (morning) and at lunch hours — Lambda scales automatically and costs almost nothing overnight.',
    },
    {
      company: 'Airbnb',
      icon: '🏠',
      description:
        'Uses serverless for image processing — when hosts upload photos, Lambda functions automatically resize, compress, and CDN-distribute them. ' +
        'Processing millions of images without managing a single image-processing server.',
    },
  ],

  interviewQuestions: [
    {
      question: 'What is serverless and how does it differ from traditional servers?',
      answer:
        'Serverless is a cloud execution model where the provider manages the infrastructure — you upload functions that run on demand. Unlike traditional servers that are always on and always billed, serverless scales automatically from 0 to millions of invocations and charges per execution. The trade-off: cold starts, 15-min execution limit, and stateless-only design.',
    },
    {
      question: 'What is a cold start and how would you reduce it?',
      answer:
        'A cold start is the latency of the first request to an inactive function — the cloud must provision a container, load the runtime, and init the function. Reduce it with: (1) smaller package sizes, (2) faster runtimes like Node or Go over Java, (3) Provisioned Concurrency for latency-critical paths, (4) periodic keep-warm invocations.',
    },
    {
      question: 'Why can\'t you use serverless for a chat application?',
      answer:
        'Chat requires persistent WebSocket connections — each user needs a long-lived, stateful connection. Lambda functions are stateless, short-lived, and ephemeral. They terminate after the request finishes. For real-time chat, you need a persistent server (Node.js with Socket.io, or a managed service like AWS API Gateway WebSocket + Lambda for the message routing layer).',
    },
    {
      question: 'What is the database connection problem with serverless?',
      answer:
        'At high concurrency, each Lambda invocation opens its own DB connection. 10,000 concurrent invocations = 10,000 connections — far beyond what most databases handle. Solution: use a connection pooling proxy (RDS Proxy, PgBouncer) that maintains a small pool of real DB connections and multiplexes many Lambda connections through them.',
    },
  ],

  commonMistakes: [
    'Storing state in Lambda memory — it disappears when the function ends or scales to a new instance',
    'Ignoring cold starts for user-facing APIs — use Provisioned Concurrency for latency-critical endpoints',
    'Opening a new DB connection on every invocation — use RDS Proxy or a global connection variable (reused across warm invocations)',
    'Using serverless for always-on high-traffic services — a traditional server becomes cheaper above ~70% utilisation',
    'Large Lambda package sizes — include only what you need; 250MB package vs 5MB package = 10× slower cold start',
  ],
};
