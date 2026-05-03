export interface Top30Concept {
  id: string;
  title: string;
  interviewFocus: string;
  estimatedMinutes: number;
  moduleId?: string;
  subTopics: string[];
}

export interface Top30ConceptGroup {
  id: string;
  title: string;
  description: string;
  icon: string;
  concepts: Top30Concept[];
}

export const top30ConceptGroups: Top30ConceptGroup[] = [
  {
    id: 'networking',
    title: 'Networking',
    icon: '🌐',
    description: 'The request path, traffic routing, and performance language every design starts with.',
    concepts: [
      {
        id: 'dns',
        title: 'DNS',
        interviewFocus: 'How a domain becomes an IP address and where DNS can help with scale.',
        estimatedMinutes: 20,
        subTopics: ['Recursive vs authoritative lookup', 'TTL and caching behavior', 'DNS load balancing and failover'],
      },
      {
        id: 'http-https',
        title: 'HTTP and HTTPS',
        interviewFocus: 'Request response mechanics, TLS, verbs, headers, and status codes.',
        estimatedMinutes: 25,
        subTopics: ['HTTP methods and idempotency', 'TLS handshake basics', 'Common status code families'],
      },
      {
        id: 'tcp-udp',
        title: 'TCP vs UDP',
        interviewFocus: 'Reliability, ordering, latency, and why protocols choose one over the other.',
        estimatedMinutes: 20,
        subTopics: ['Connection setup and retransmission', 'Ordering and congestion control', 'Low-latency UDP use cases'],
      },
      {
        id: 'latency-throughput-bandwidth',
        title: 'Latency, Throughput, Bandwidth',
        interviewFocus: 'Separate response time, system capacity, and network pipe size clearly.',
        estimatedMinutes: 18,
        moduleId: 'latency-vs-throughput',
        subTopics: ['Latency measurement', 'Throughput and QPS', 'Bandwidth bottlenecks'],
      },
      {
        id: 'cdn',
        title: 'CDN',
        interviewFocus: 'How edge caching reduces latency and protects origin services.',
        estimatedMinutes: 25,
        subTopics: ['Edge locations and cache keys', 'Cache invalidation', 'Static vs dynamic acceleration'],
      },
    ],
  },
  {
    id: 'apis',
    title: 'APIs',
    icon: '🔌',
    description: 'How services expose capabilities, evolve contracts, and protect themselves.',
    concepts: [
      {
        id: 'rest',
        title: 'REST APIs',
        interviewFocus: 'Resource modeling, stateless requests, and practical API design trade-offs.',
        estimatedMinutes: 25,
        subTopics: ['Resources and URI design', 'Pagination and filtering', 'Versioning strategy'],
      },
      {
        id: 'grpc',
        title: 'gRPC',
        interviewFocus: 'Binary RPC, protobuf contracts, and service-to-service communication.',
        estimatedMinutes: 25,
        subTopics: ['Protobuf schemas', 'Unary vs streaming calls', 'Backward compatibility'],
      },
      {
        id: 'graphql',
        title: 'GraphQL',
        interviewFocus: 'Client-shaped reads, schema design, and avoiding over-fetching.',
        estimatedMinutes: 25,
        subTopics: ['Queries and mutations', 'Schema and resolvers', 'N+1 query risks'],
      },
      {
        id: 'rate-limiting',
        title: 'Rate Limiting',
        interviewFocus: 'Protect services from abuse and overload while preserving fairness.',
        estimatedMinutes: 22,
        subTopics: ['Token bucket', 'Leaky bucket', 'Per-user vs global limits'],
      },
      {
        id: 'api-gateway',
        title: 'API Gateway',
        interviewFocus: 'Central entry point for auth, routing, throttling, and observability.',
        estimatedMinutes: 20,
        subTopics: ['Routing and aggregation', 'Authentication offload', 'Gateway failure modes'],
      },
    ],
  },
  {
    id: 'data-storage',
    title: 'Data Storage',
    icon: '🗄️',
    description: 'Pick storage based on access patterns, consistency needs, and query shape.',
    concepts: [
      {
        id: 'sql-vs-nosql',
        title: 'SQL vs NoSQL',
        interviewFocus: 'Choose relational or non-relational storage from requirements, not fashion.',
        estimatedMinutes: 25,
        subTopics: ['Schema and joins', 'Document and key-value models', 'Consistency and scaling trade-offs'],
      },
      {
        id: 'indexing',
        title: 'Database Indexing',
        interviewFocus: 'Speed up reads while understanding write cost and storage overhead.',
        estimatedMinutes: 24,
        moduleId: 'indexing',
        subTopics: ['B-tree and hash indexes', 'Composite indexes', 'Index maintenance cost'],
      },
      {
        id: 'transactions-acid',
        title: 'Transactions and ACID',
        interviewFocus: 'Reason about correctness when many users update data together.',
        estimatedMinutes: 25,
        subTopics: ['Atomicity and durability', 'Isolation levels', 'Deadlocks and retries'],
      },
      {
        id: 'replication',
        title: 'Replication',
        interviewFocus: 'Copy data for availability, read scale, and disaster recovery.',
        estimatedMinutes: 25,
        subTopics: ['Leader follower replication', 'Synchronous vs asynchronous', 'Replication lag'],
      },
      {
        id: 'partitioning-sharding',
        title: 'Partitioning and Sharding',
        interviewFocus: 'Split data across machines without creating hotspots.',
        estimatedMinutes: 28,
        subTopics: ['Range vs hash partitioning', 'Shard keys', 'Rebalancing and hotspots'],
      },
    ],
  },
  {
    id: 'scaling',
    title: 'Scaling',
    icon: '📈',
    description: 'Increase capacity using caching, balancing, async processing, and careful bottleneck removal.',
    concepts: [
      {
        id: 'vertical-horizontal-scaling',
        title: 'Vertical vs Horizontal Scaling',
        interviewFocus: 'Know when to scale up a machine and when to add more machines.',
        estimatedMinutes: 20,
        moduleId: 'scalability',
        subTopics: ['Scale-up limits', 'Stateless service replicas', 'Operational complexity'],
      },
      {
        id: 'load-balancing',
        title: 'Load Balancing',
        interviewFocus: 'Distribute traffic across healthy servers and avoid single bottlenecks.',
        estimatedMinutes: 25,
        moduleId: 'load-balancing',
        subTopics: ['L4 vs L7 balancing', 'Health checks', 'Routing algorithms'],
      },
      {
        id: 'caching',
        title: 'Caching',
        interviewFocus: 'Reduce latency and database load while managing stale data.',
        estimatedMinutes: 25,
        moduleId: 'caching',
        subTopics: ['Cache-aside pattern', 'TTL and invalidation', 'Eviction policies'],
      },
      {
        id: 'queues',
        title: 'Message Queues',
        interviewFocus: 'Smooth spikes and decouple slow work from user-facing requests.',
        estimatedMinutes: 25,
        subTopics: ['Producer consumer model', 'At-least-once delivery', 'Retries and dead-letter queues'],
      },
      {
        id: 'backpressure',
        title: 'Backpressure',
        interviewFocus: 'Keep overloaded systems from collapsing under more work.',
        estimatedMinutes: 20,
        subTopics: ['Queue depth signals', 'Load shedding', 'Client retry strategy'],
      },
    ],
  },
  {
    id: 'distributed-systems',
    title: 'Distributed Systems',
    icon: '🧠',
    description: 'Handle partial failures, consistency trade-offs, coordination, and reliability.',
    concepts: [
      {
        id: 'cap-theorem',
        title: 'CAP Theorem',
        interviewFocus: 'Explain consistency and availability trade-offs during network partitions.',
        estimatedMinutes: 25,
        moduleId: 'cap-theorem',
        subTopics: ['Consistency', 'Availability', 'Partition tolerance'],
      },
      {
        id: 'consistency-models',
        title: 'Consistency Models',
        interviewFocus: 'Choose strong, eventual, or client-centric consistency for product needs.',
        estimatedMinutes: 28,
        moduleId: 'consistency-models',
        subTopics: ['Strong consistency', 'Eventual consistency', 'Read-your-writes'],
      },
      {
        id: 'consensus',
        title: 'Consensus',
        interviewFocus: 'Understand how nodes agree on state despite failures.',
        estimatedMinutes: 30,
        subTopics: ['Leader election', 'Quorum writes', 'Raft and Paxos basics'],
      },
      {
        id: 'fault-tolerance',
        title: 'Fault Tolerance',
        interviewFocus: 'Design systems that continue working when components fail.',
        estimatedMinutes: 24,
        moduleId: 'reliability',
        subTopics: ['Redundancy', 'Failover', 'Circuit breakers'],
      },
      {
        id: 'consistent-hashing',
        title: 'Consistent Hashing',
        interviewFocus: 'Distribute keys while minimizing movement when nodes change.',
        estimatedMinutes: 24,
        moduleId: 'consistent-hashing',
        subTopics: ['Hash ring', 'Virtual nodes', 'Node add/remove behavior'],
      },
    ],
  },
  {
    id: 'architecture-patterns',
    title: 'Architecture Patterns',
    icon: '🏛️',
    description: 'Structure services and workflows so teams can build, deploy, and operate at scale.',
    concepts: [
      {
        id: 'monolith-microservices',
        title: 'Monolith vs Microservices',
        interviewFocus: 'Choose boundaries based on team scale, deployment needs, and complexity.',
        estimatedMinutes: 25,
        moduleId: 'microservices',
        subTopics: ['Deployment coupling', 'Service boundaries', 'Operational overhead'],
      },
      {
        id: 'event-driven-architecture',
        title: 'Event-Driven Architecture',
        interviewFocus: 'Use events to decouple producers and consumers across workflows.',
        estimatedMinutes: 28,
        subTopics: ['Events vs commands', 'Pub/sub topics', 'Eventual consistency'],
      },
      {
        id: 'cqrs',
        title: 'CQRS',
        interviewFocus: 'Separate write models from read models when query needs diverge.',
        estimatedMinutes: 24,
        subTopics: ['Command model', 'Read projection', 'Synchronization lag'],
      },
      {
        id: 'saga-pattern',
        title: 'Saga Pattern',
        interviewFocus: 'Coordinate multi-service workflows without distributed transactions.',
        estimatedMinutes: 26,
        subTopics: ['Choreography', 'Orchestration', 'Compensating actions'],
      },
      {
        id: 'observability',
        title: 'Observability',
        interviewFocus: 'Debug production systems with logs, metrics, traces, and alerts.',
        estimatedMinutes: 22,
        subTopics: ['Metrics and SLOs', 'Structured logs', 'Distributed tracing'],
      },
    ],
  },
];

export const getTop30Totals = () => {
  const concepts = top30ConceptGroups.flatMap((group) => group.concepts);
  const subTopics = concepts.reduce((total, concept) => total + concept.subTopics.length, 0);

  return {
    concepts: concepts.length,
    subTopics,
  };
};
