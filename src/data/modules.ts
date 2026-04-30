import type { Module } from '../types';

export const modules: Module[] = [
  {
    id: 'load-balancing',
    title: 'Load Balancing',
    subtitle: 'The Coffee Shop Analogy',
    description:
      'Learn how load balancers distribute traffic across multiple servers — just like a coffee shop manager routing customers to available baristas.',
    icon: '☕',
    difficulty: 'beginner',
    estimatedTime: 25,
    tags: ['Scaling', 'Availability', 'Traffic'],
    color: 'blue',
    realWorldAnalogy:
      "Imagine a busy coffee shop. Without a load balancer, every customer queues at one barista while others stand idle. A good manager (load balancer) routes each new customer to the barista with the shortest queue.",
    lessons: [
      {
        id: 'lb-concept-1',
        title: 'What is a Load Balancer?',
        description: 'Understand the core problem load balancers solve and how they work.',
        duration: 5,
        type: 'concept',
        component: 'LoadBalancerConcept',
      },
      {
        id: 'lb-demo-1',
        title: 'Interactive Demo: Round Robin',
        description: 'Watch requests being distributed across servers in real time.',
        duration: 8,
        type: 'demo',
        component: 'LoadBalancerDemo',
      },
      {
        id: 'lb-concept-2',
        title: 'Load Balancing Strategies',
        description: 'Round robin, least connections, IP hash — how each strategy works.',
        duration: 7,
        type: 'concept',
        component: 'LoadBalancerStrategies',
      },
      {
        id: 'lb-quiz-1',
        title: 'Knowledge Check',
        description: 'Test your understanding of load balancing concepts.',
        duration: 5,
        type: 'quiz',
        component: 'LoadBalancerQuiz',
      },
    ],
  },
  {
    id: 'caching',
    title: 'Caching',
    subtitle: 'The Library Analogy',
    description:
      'Discover how caches speed up systems by storing frequently accessed data close to where it\'s needed — like keeping popular books on your desk instead of walking to the stacks.',
    icon: '📚',
    difficulty: 'beginner',
    estimatedTime: 20,
    tags: ['Performance', 'Databases', 'Memory'],
    color: 'green',
    realWorldAnalogy:
      "A librarian keeps the 10 most-requested books on their desk (the cache). When a patron asks for one, they grab it instantly instead of walking to the shelves. This is exactly how Redis or Memcached work.",
    lessons: [
      {
        id: 'cache-concept-1',
        title: 'Why Caching Exists',
        description: 'The cost of fetching data and how caches solve the latency problem.',
        duration: 5,
        type: 'concept',
        component: 'CachingConcept',
      },
      {
        id: 'cache-demo-1',
        title: 'Interactive Demo: Cache Hit vs Miss',
        description: 'See the speed difference between cache hits and database queries.',
        duration: 8,
        type: 'demo',
        component: 'CachingDemo',
      },
      {
        id: 'cache-quiz-1',
        title: 'Knowledge Check',
        description: 'Test your caching knowledge.',
        duration: 7,
        type: 'quiz',
        component: 'CachingQuiz',
      },
    ],
  },
  {
    id: 'databases',
    title: 'SQL vs NoSQL',
    subtitle: 'Choosing the Right Storage',
    description:
      'Understand when to use relational databases vs document/graph stores — with visual schema comparisons and real-world examples.',
    icon: '🗄️',
    difficulty: 'intermediate',
    estimatedTime: 30,
    tags: ['Databases', 'SQL', 'NoSQL', 'Schema'],
    color: 'purple',
    realWorldAnalogy:
      "SQL is like a highly organised spreadsheet — every row follows the same strict columns. NoSQL is like a folder of sticky notes — each one can hold whatever you write on it.",
    lessons: [
      {
        id: 'db-concept-1',
        title: 'Relational Databases',
        description: 'Tables, relationships, ACID guarantees, and when SQL shines.',
        duration: 8,
        type: 'concept',
        component: 'SQLConcept',
      },
      {
        id: 'db-concept-2',
        title: 'NoSQL Databases',
        description: 'Document, key-value, graph, and column stores — trade-offs explored.',
        duration: 10,
        type: 'concept',
        component: 'NoSQLConcept',
      },
      {
        id: 'db-demo-1',
        title: 'Schema Comparison Demo',
        description: 'Side-by-side view of the same data in SQL and MongoDB.',
        duration: 7,
        type: 'demo',
        component: 'DBComparisonDemo',
      },
      {
        id: 'db-quiz-1',
        title: 'Knowledge Check',
        description: 'SQL vs NoSQL decision-making quiz.',
        duration: 5,
        type: 'quiz',
        component: 'DatabaseQuiz',
      },
    ],
  },
  {
    id: 'microservices',
    title: 'Microservices',
    subtitle: 'The Restaurant Kitchen Analogy',
    description:
      'See how breaking a monolith into microservices is like splitting a restaurant kitchen into specialized stations — each team does one thing well.',
    icon: '🍽️',
    difficulty: 'intermediate',
    estimatedTime: 35,
    tags: ['Architecture', 'Microservices', 'APIs'],
    color: 'orange',
    realWorldAnalogy:
      "A monolith is one chef cooking everything. Microservices are specialized stations: grill chef, saucier, pastry chef — each expert, each independently scalable, each with their own tools.",
    lessons: [
      {
        id: 'ms-concept-1',
        title: 'Monolith vs Microservices',
        description: 'Trade-offs, when to use each, and migration strategies.',
        duration: 10,
        type: 'concept',
        component: 'MonolithVsMicroservices',
      },
      {
        id: 'ms-demo-1',
        title: 'Architecture Diagram Explorer',
        description: 'Interactive diagram of a microservices system.',
        duration: 12,
        type: 'demo',
        component: 'MicroservicesDemo',
      },
      {
        id: 'ms-quiz-1',
        title: 'Knowledge Check',
        description: 'Microservices patterns and principles quiz.',
        duration: 8,
        type: 'quiz',
        component: 'MicroservicesQuiz',
      },
    ],
  },
];

export const getModule = (id: string) => modules.find((m) => m.id === id);
