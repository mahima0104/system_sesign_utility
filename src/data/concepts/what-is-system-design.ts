import type { ConceptDeepDive } from '../../types';

export const whatIsSystemDesign: ConceptDeepDive = {
  moduleId: 'what-is-system-design',
  tagline: 'The art of building software that millions of people can use without it falling over',

  introduction: {
    layman:
      'System design is deciding HOW to build something before you write a single line of code. ' +
      'Not what the app does (that is product design), but how it stays fast, never goes down, ' +
      'and keeps working when ten million people use it at once. Think of it as the blueprint stage.',
    analogy:
      'Imagine you are building a McDonald\'s. You do not just start frying burgers. ' +
      'First you decide: How many counters? Where is the kitchen? How does the drive-through work? ' +
      'What happens when the fryer breaks? How do you serve 300 people during lunch without a queue? ' +
      'System design is exactly that — but for software.',
    whyMatters:
      'Every senior engineering interview asks system design questions because bad design choices ' +
      'made early cost months to fix later. Instagram had to rewrite their database when they hit ' +
      '1 million users. Twitter rewrote their timeline architecture twice. ' +
      'Understanding system design helps you avoid those expensive mistakes from day one.',
  },

  subTopics: [
    {
      title: 'What exactly IS system design?',
      icon: '🏗️',
      layman:
        'System design is choosing the right building blocks and connecting them smartly so your ' +
        'app is fast, reliable, and can grow. It covers everything a user never sees: servers, ' +
        'databases, caches, queues, and the links between them.',
      technical:
        'System design encompasses architectural decisions about compute (monolith vs microservices), ' +
        'data storage (SQL vs NoSQL, primary vs replica), communication (sync REST vs async queues), ' +
        'and cross-cutting concerns (caching, CDN, rate limiting, monitoring).',
      example:
        'WhatsApp delivers 100 billion messages per day with under 100 engineers. ' +
        'That only works because their system design choices — Erlang for concurrency, Mnesia for storage, ' +
        'and a message-fan-out architecture — are extremely well-matched to the problem.',
      whenToUse: 'Always — before you start building anything non-trivial.',
    },
    {
      title: 'The 10 questions every designer must answer',
      icon: '❓',
      layman:
        'Before touching code, answer these 10 questions. They cover scale, speed, data, failure, ' +
        'and cost. If you can answer all 10 confidently, you understand your system.',
      technical:
        '1. How many users / requests per second at peak?\n' +
        '2. What is the acceptable latency? (p50, p99)\n' +
        '3. What data do we store, and how much of it?\n' +
        '4. How consistent must the data be? (strong vs eventual)\n' +
        '5. What is the read:write ratio?\n' +
        '6. What does failure look like, and how do we recover?\n' +
        '7. Do we need to be globally distributed?\n' +
        '8. What are the security and compliance requirements?\n' +
        '9. What is the cost envelope?\n' +
        '10. What are the SLAs (uptime, latency guarantees)?',
      example:
        'Netflix answers question 7 with: "Yes — 230 countries." That single answer forced them to ' +
        'build a global CDN (Open Connect), regional failover, and chaos engineering to test it all.',
    },
    {
      title: 'The key components you will use again and again',
      icon: '🧩',
      layman:
        'Every large system is built from the same 8 building blocks. Learn these once and you can ' +
        'reason about any system — from WhatsApp to Netflix to a banking app.',
      technical:
        'Client → DNS → CDN → Load Balancer → API Gateway → App Servers → Cache → Database. ' +
        'Each layer has a job: DNS finds the server, CDN serves static content fast, the load balancer ' +
        'spreads traffic, the cache avoids slow DB reads, the DB persists truth.',
      example:
        'When you open Instagram, your phone hits a CDN for the images, an API server for the feed, ' +
        'Redis for the like counts, and Cassandra for the post data — all in under 200 ms. ' +
        'Eight components, one seamless tap.',
    },
  ],

  realWorldExamples: [
    {
      company: 'WhatsApp',
      icon: '💬',
      description:
        'Handles 100 billion messages/day with ~50 servers and under 100 engineers — ' +
        'because their system design (Erlang, actor model, efficient fan-out) is perfectly matched to the workload.',
    },
    {
      company: 'Instagram',
      icon: '📸',
      description:
        '13 engineers and 30 million users when acquired by Facebook. They stayed small because ' +
        'they made brilliant design choices early: PostgreSQL sharding, Redis caching, and a monolith-first approach.',
    },
    {
      company: 'Netflix',
      icon: '🎬',
      description:
        'Streams to 230+ countries with 99.99% uptime using a microservices architecture, ' +
        'Chaos Monkey to test resilience, and their own CDN (Open Connect) built into ISPs.',
    },
  ],

  interviewQuestions: [
    {
      question: 'What is system design and why does it matter in interviews?',
      answer:
        'System design is the process of defining the architecture, components, and data flow of a system to meet functional and non-functional requirements. It matters in interviews because it reveals how an engineer thinks about scale, trade-offs, failure, and cost — skills that separate senior engineers from junior ones.',
    },
    {
      question: 'What is the difference between system design and software design?',
      answer:
        'Software design is about code structure (classes, patterns, APIs). System design is about infrastructure (servers, databases, networks, queues). Both matter, but system design focuses on the "how do 10 million people use this without it breaking" problem.',
    },
    {
      question: 'What are non-functional requirements and why do they matter?',
      answer:
        'NFRs are the "quality" requirements: scalability, availability, latency, consistency, security. They are not features — users do not see them — but they determine whether the system actually works in production. Most system design failures come from ignoring NFRs early.',
    },
  ],

  commonMistakes: [
    'Starting to design before clarifying requirements — spend the first 5 minutes asking the 10 questions',
    'Designing for 1 billion users on day one — start simple, identify bottlenecks, then scale',
    'Ignoring failure modes — always ask "what happens when this component dies?"',
    'Treating all data the same — different data has different consistency, latency, and retention needs',
    'Skipping the back-of-envelope estimation — knowing your numbers (QPS, storage) grounds every decision',
  ],
};
