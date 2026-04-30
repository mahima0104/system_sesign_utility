import type { QuizQuestion } from '../types';

export const loadBalancingQuiz: QuizQuestion[] = [
  {
    id: 'lb-q1',
    question: 'What is the primary purpose of a load balancer?',
    options: [
      'To store frequently accessed data',
      'To distribute incoming traffic across multiple servers',
      'To compress network packets',
      'To encrypt HTTPS connections',
    ],
    correctIndex: 1,
    explanation:
      'A load balancer distributes incoming requests across a pool of servers so no single server becomes overwhelmed. This improves availability and throughput.',
  },
  {
    id: 'lb-q2',
    question: 'In the "Round Robin" strategy, how are requests assigned?',
    options: [
      'Always sent to the fastest server',
      'Sent to the server with the fewest connections',
      'Cycled through servers one by one in order',
      'Randomly assigned',
    ],
    correctIndex: 2,
    explanation:
      'Round robin simply cycles through the list of servers in sequence: request 1 → server A, request 2 → server B, request 3 → server C, request 4 → server A again, and so on.',
  },
  {
    id: 'lb-q3',
    question: 'Which strategy would work best if sessions must stay on the same server?',
    options: [
      'Round Robin',
      'Least Connections',
      'IP Hash (Sticky Sessions)',
      'Random',
    ],
    correctIndex: 2,
    explanation:
      'IP Hash hashing always routes the same client IP to the same server — useful when session state is stored locally on each server rather than in a shared store.',
  },
  {
    id: 'lb-q4',
    question: 'What problem does horizontal scaling (adding more servers) solve?',
    options: [
      'It reduces database query complexity',
      'It allows traffic to grow beyond what a single machine can handle',
      'It eliminates the need for caching',
      'It speeds up individual request processing',
    ],
    correctIndex: 1,
    explanation:
      'Horizontal scaling (scale-out) adds more servers to the pool. Combined with a load balancer, it lets you handle more concurrent traffic than any single machine could.',
  },
];

export const cachingQuiz: QuizQuestion[] = [
  {
    id: 'cache-q1',
    question: 'What is a "cache hit"?',
    options: [
      'When the cache is full and evicts an item',
      'When requested data is found in the cache',
      'When a cache write fails',
      'When the database is faster than the cache',
    ],
    correctIndex: 1,
    explanation:
      'A cache hit occurs when the requested data is already present in the cache, avoiding a slower database or API call entirely.',
  },
  {
    id: 'cache-q2',
    question: 'LRU stands for:',
    options: [
      'Last Read Update',
      'Least Recently Used',
      'Load Reduction Utility',
      'Latency Reduction Unit',
    ],
    correctIndex: 1,
    explanation:
      'LRU (Least Recently Used) is a cache eviction policy that removes the item that was accessed least recently when the cache is full.',
  },
  {
    id: 'cache-q3',
    question: 'What is cache invalidation?',
    options: [
      'Filling the cache with data before it is requested',
      'The process of removing or updating stale cache entries',
      'Compressing cache entries to save memory',
      'Encrypting cache contents',
    ],
    correctIndex: 1,
    explanation:
      'Cache invalidation removes or updates stale data so the cache stays consistent with the source of truth. It is famously described as one of the two hard problems in computer science.',
  },
];

export const databaseQuiz: QuizQuestion[] = [
  {
    id: 'db-q1',
    question: 'Which database type enforces a fixed schema with tables and rows?',
    options: ['Document Store', 'Graph DB', 'Relational (SQL)', 'Key-Value Store'],
    correctIndex: 2,
    explanation:
      'Relational databases (SQL) use tables with predefined columns and enforce relationships via foreign keys. Examples include PostgreSQL, MySQL, and SQLite.',
  },
  {
    id: 'db-q2',
    question: 'What does ACID stand for in database transactions?',
    options: [
      'Atomicity, Consistency, Isolation, Durability',
      'Availability, Caching, Indexing, Distribution',
      'Asynchronous, Concurrent, Independent, Distributed',
      'Atomic, Cached, Indexed, Documented',
    ],
    correctIndex: 0,
    explanation:
      'ACID properties guarantee reliable database transactions: Atomicity (all-or-nothing), Consistency (valid state), Isolation (concurrent txns don\'t interfere), Durability (committed data persists).',
  },
];
