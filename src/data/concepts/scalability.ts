import type { ConceptDeepDive } from '../../types';

export const scalability: ConceptDeepDive = {
  moduleId: 'scalability',
  tagline: 'Handling more work without breaking',

  introduction: {
    layman:
      'Scalability is your system\'s ability to grow. Today you have 1,000 users; next year you might have 10 million. A scalable system can absorb that growth — by adding more machines, smarter caches, or faster databases — without falling over and without forcing you to rewrite the whole thing. An unscalable system collapses long before you reach the headline numbers.',
    analogy:
      'Imagine a coffee shop with one barista. With 5 customers/hour, they\'re happy. At 50/hour, the queue snakes out the door. You have two choices: (a) hire a faster barista (vertical) or (b) hire more baristas and add another counter (horizontal). Real businesses do both — and so do scalable software systems.',
    whyMatters:
      'Every interviewer asks "how would you scale this?" because every product hopes to grow. Knowing the language of scaling — vertical vs horizontal, stateless vs stateful, scaling reads vs writes — is the price of admission. More importantly, scaling decisions shape architecture: pick wrong early and the rewrite costs years of engineering.',
  },

  subTopics: [
    {
      title: 'Vertical Scaling (Scale Up)',
      icon: '⬆️',
      layman:
        'Make the one machine you have bigger. More CPU, more RAM, faster SSD, better network card. From the application\'s perspective, nothing changes — it just runs on a beefier box.',
      technical:
        'Replace or upgrade hardware (or in cloud, change instance type from m5.large to m5.16xlarge). No code changes, no architectural changes. The constraint: hardware has limits — you eventually hit the largest instance available, and the cost curve becomes exponential. Single point of failure too.',
      example:
        'Stack Overflow famously runs almost everything on a handful of very large servers. Their philosophy: a 256GB RAM SQL Server box is simpler to reason about than 100 microservices. Works because their workload fits on big iron.',
      whenToUse:
        'Early stage when you have one DB, simple app, no time for distribution complexity. Or for stateful systems (databases) where horizontal scaling is genuinely hard.',
    },
    {
      title: 'Horizontal Scaling (Scale Out)',
      icon: '➡️',
      layman:
        'Instead of one big machine, run many small ones. New traffic? Boot another box. Add a load balancer in front so users don\'t care which box answers. Lose a box? The others keep serving.',
      technical:
        'Distribute load across N identical (or sharded) instances behind a load balancer. Requires the application tier to be stateless (or session state externalised to Redis/DB). Throughput grows roughly linearly until you hit downstream bottlenecks (DB, cache, network). Costs scale linearly too — no exponential cliff.',
      example:
        'Netflix runs hundreds of thousands of EC2 instances. Each microservice is stateless and horizontally scaled — Netflix\'s "Chaos Monkey" randomly kills servers in production because losing any one makes essentially zero difference.',
      whenToUse:
        'When you outgrow a single machine, when you need fault tolerance (one box dying ≠ outage), when traffic is bursty (cloud auto-scaling spins up more boxes).',
    },
    {
      title: 'Stateless vs Stateful Tiers',
      icon: '🧠',
      layman:
        'A stateless service has no memory between requests — every request stands on its own. That makes it trivial to put behind a load balancer because any instance can serve any request. Stateful services remember stuff (a user\'s session, a sharded customer\'s data) and need careful routing.',
      technical:
        'Push state to a shared store (Redis, Memcached, the DB). Stateless app servers become "cattle, not pets" — interchangeable, killable, replaceable. Stateful tiers (databases, caches, queues) scale via different patterns: replication, sharding, partitioning.',
      example:
        'Twitter\'s web servers are stateless — they keep nothing between requests. The state lives in MySQL (sharded by user_id), Redis (caches), and Manhattan (KV store). That\'s why Twitter can deploy 100× a day without users noticing.',
    },
    {
      title: 'Read vs Write Scaling',
      icon: '📖',
      layman:
        'Most apps do way more reads than writes. Reading is easy to scale: copy the data to many machines and read from any of them. Writing is harder: if two writes happen at the same time, who wins? Most scaling problems are really write-scaling problems.',
      technical:
        'Reads scale via replicas (read-only copies of the leader), CDNs (cache responses at the edge), and caches (Redis in front of the DB). Writes scale via sharding (split the data so each shard handles its slice), conflict-free data types (CRDTs), or eventual-consistency designs that accept temporary divergence.',
      example:
        'Instagram\'s feed is read 100× more than written. They use Cassandra (replicated reads from any node) plus aggressive caching. Writes go to the leader of the right shard. Read:write ratios for content sites often hit 1000:1.',
    },
    {
      title: 'Sharding (Partitioning Your Data)',
      icon: '🧩',
      layman:
        'When one database can\'t hold all your data, split it across many. User #1–1M lives on shard A; user #1M–2M on shard B. Each shard handles only its slice. The catch: cross-shard queries become painful.',
      technical:
        'Choose a shard key (user_id, tenant_id, geographic region). Strategies: range-based (predictable, prone to hotspots), hash-based (even distribution, no range scans), directory-based (lookup table, flexible but extra hop), geo-based (data near users). Resharding when one shard outgrows the others is a recurring nightmare.',
      example:
        'Slack shards by team_id — every message in your workspace lives on the same shard. Why team_id and not user_id? Because Slack\'s queries are almost always "give me messages in this channel of this team" — keeping that data co-located makes queries fast and cross-shard joins rare.',
    },
    {
      title: 'Caching: The Cheap Win',
      icon: '⚡',
      layman:
        'Before you scale the database, scale away from the database. A cache stores answers to questions you\'ve already answered. Hot data lives in RAM; cold data goes to disk. Done right, you serve 95% of requests without ever hitting the DB.',
      technical:
        'Multiple cache layers: browser cache, CDN, edge cache, application cache (in-process), distributed cache (Redis/Memcached), database cache. Patterns: cache-aside (lazy), read-through, write-through, write-behind. Trade-offs: invalidation complexity, stale data, cache stampedes.',
      example:
        'Reddit caches almost everything — the front page, comments, user profiles. A typical Reddit page hits Memcached for 90%+ of its data; the database is mostly there for cache misses and writes. Without caching, Reddit couldn\'t exist at its scale.',
    },
    {
      title: 'Async Processing & Queues',
      icon: '📨',
      layman:
        'Some work doesn\'t need to happen right now. Sending a welcome email after signup? Generating a thumbnail? Stick those on a queue and let workers chew through them. Your user response stays fast; the heavy lifting happens off the critical path.',
      technical:
        'Move synchronous work to async via message queues (Kafka, RabbitMQ, SQS). Producers push tasks; consumers process at their own pace. Adds eventual consistency, but gets latency-critical work off the response path. Dead letter queues handle poison-pill messages.',
      example:
        'Instagram\'s photo upload returns "uploaded!" the moment the bytes land. The actual work — resizing for each device size, generating face-detection tags, running content moderation, propagating to followers\' feeds — all happens async behind the scenes via queues.',
    },
    {
      title: 'Load Balancing',
      icon: '⚖️',
      layman:
        'When you have N servers, something has to decide which one each request goes to. That something is a load balancer. It checks who\'s busy, who\'s healthy, and routes traffic accordingly. Done well, no single server gets pounded.',
      technical:
        'Layer-4 (TCP, faster, less aware) vs Layer-7 (HTTP, can route by URL/headers/cookies). Algorithms: round-robin, least-connections, least-response-time, IP-hash (sticky), weighted versions of all of these. Health checks remove unhealthy backends. DNS-level LB for global, regional LBs (ALB/NLB) for inside a region.',
      example:
        'Google Search uses geographically distributed load balancers. Your DNS lookup for google.com returns the nearest datacenter\'s IP; once there, regional load balancers route to the least-busy frontend; that frontend then dispatches to specialised backends for different parts of the result page.',
    },
    {
      title: 'Auto-scaling (Elastic Capacity)',
      icon: '📈',
      layman:
        'Traffic is bursty: 3am has 1% of midday traffic. Why pay for midday capacity at 3am? Auto-scaling spins up servers when demand rises and shuts them down when it falls — you pay for what you use.',
      technical:
        'Define metrics (CPU > 70%, request queue depth > 100), thresholds, and policies. Cloud providers (EC2 Auto Scaling, GKE HPA, Lambda concurrency) handle the boot/teardown. Pitfalls: cold-start latency, scaling-up too slowly under flash crowds, oscillation (scaling up and down repeatedly), state loss on shutdown.',
      example:
        'Black Friday at any major e-commerce site: traffic 10× normal for a few hours. Auto-scaling absorbs the surge, then quietly scales back when shoppers go to bed. Pre-cloud, retailers had to provision peak capacity year-round — wasteful and capital-intensive.',
    },
    {
      title: 'Premature Scaling: The Pitfall',
      icon: '⚠️',
      layman:
        'Designing for 1 billion users when you have 100 is one of the most expensive mistakes in software. Sharding databases, breaking into microservices, building elaborate queueing layers — all add complexity that slows you down before you reach scale.',
      technical:
        'Knuth\'s rule applies: premature optimisation is the root of all evil. Start with the simplest architecture that solves your current problem. Monolith + one DB scales further than people think. Add complexity only when you have measurements showing where the bottleneck is. Most "scaling" advice on the internet is wrong for 99% of products.',
      example:
        'Instagram famously kept a Postgres monolith until ~30M users. WhatsApp\'s 32 engineers served 450M users with a single Erlang codebase. Stack Overflow runs the entire thing on ~10 servers. Most of the famously-scalable companies started simple and stayed simple far longer than people assume.',
    },
  ],

  comparison: {
    caption: 'Vertical vs Horizontal — the foundational trade-off.',
    columns: ['Aspect', 'Vertical (Scale Up)', 'Horizontal (Scale Out)'],
    rows: [
      ['Cost curve',          'Exponential (premium hardware costs disproportionately)',  'Roughly linear (commodity boxes)'],
      ['Ceiling',             'Hardware limit (~$100k-class instance)',                   'Practically unlimited'],
      ['Code changes',        'None — same monolith on a bigger box',                     'Often significant — must be stateless / sharded'],
      ['Operational complexity', 'Low — one machine to babysit',                          'High — distributed systems problems'],
      ['Fault tolerance',     'Worse — one machine = single point of failure',            'Better — kill a box, others keep serving'],
      ['Best for',            'Stateful systems (DBs), early-stage simplicity',           'Stateless web tier, high-traffic systems'],
    ],
  },

  realWorldExamples: [
    {
      company: 'Netflix',
      icon: '🎬',
      description:
        'Pure horizontal scaling at extreme scale: ~250k microservice instances on AWS, all stateless, all replaceable. Their Chaos Monkey randomly kills production servers as a test — passes because nothing depends on any specific instance staying up.',
    },
    {
      company: 'Stack Overflow',
      icon: '💬',
      description:
        'Famously vertical-first. ~10 web servers + a few enormous SQL Server boxes serve 100M+ monthly users. They invested in big-iron hardware and ruthless query optimisation — simpler than microservices and runs on a fraction of Netflix\'s budget.',
    },
    {
      company: 'WhatsApp (pre-Meta)',
      icon: '💬',
      description:
        '32 engineers serving 450M users with Erlang and FreeBSD. Vertical scaling on huge boxes (massive RAM) plus per-user Erlang processes (lightweight). Bought by Facebook for $19B — scaling done with extreme operational discipline rather than thousands of services.',
    },
    {
      company: 'Twitter (the early 2010s rewrite)',
      icon: '🐦',
      description:
        'The "fail whale" era: Rails monolith couldn\'t handle the load. They migrated to JVM microservices, sharded MySQL, and built Manhattan (their KV store). Multi-year project; result: 500M tweets/day with sub-second timelines. A textbook case for scaling forcing rewrites.',
    },
  ],

  interviewQuestions: [
    {
      question: 'Walk me through how you\'d scale a system from 100 users to 10 million. What changes at each order of magnitude?',
      answer:
        '100 users: a single Postgres + Node.js box on a small VPS. No caching, no LB, no async. 10k users: vertical-scale the box, add Redis for hot reads, put nginx in front. 100k users: split web tier from DB, add a load balancer, multiple stateless app servers, async queue for emails/heavy work, read replicas on the DB. 1M users: CDN for static assets, sharded application caches, dedicated DB read replicas per region, monitoring/observability becomes critical. 10M users: shard the database (by user_id or tenant_id), break the monolith where genuine boundaries exist, multi-region deployment, sophisticated caching layers, asynchronous fan-out for cross-cutting events. The thread: each step solves the bottleneck the previous step exposed. Don\'t skip ahead.',
    },
    {
      question: 'Why is horizontal scaling generally preferred over vertical scaling for web tiers?',
      answer:
        'Three reasons: cost, fault tolerance, and ceiling. Cost: doubling a server\'s capacity by buying premium hardware costs ~3-5×, while doubling capacity by adding a second commodity box costs ~2×. Fault tolerance: with one big box, hardware failure = outage. With ten boxes, losing one drops capacity by 10% and triggers auto-replacement. Ceiling: the largest instance type at any cloud provider sits around 100-200 vCPUs and 1-4 TB RAM — you can run out of room. Horizontal scaling has no comparable ceiling. The cost is complexity: you need stateless services, a load balancer, and you have to think about partial failures. For databases, the trade-off flips — vertical scaling is often easier than sharding.',
    },
    {
      question: 'What does "stateless" actually mean, and why does it matter for scaling?',
      answer:
        'A stateless service treats every request as a fresh interaction — it doesn\'t remember anything from previous requests in its own memory. All state lives in external stores (database, cache, session store). This matters because identical stateless instances are interchangeable: a load balancer can send any request to any instance, and you can boot/kill instances freely. With stateful services, you have to route specific users to specific instances ("sticky sessions"), which limits load-balancer flexibility, complicates deployments (you can\'t kill an instance without losing state), and makes auto-scaling harder. Modern cloud-native architecture pushes to make every service stateless and externalise state — this is why Kubernetes, serverless functions, and containers all assume statelessness by default.',
    },
    {
      question: 'How do you scale a database\'s writes? Why is it harder than scaling reads?',
      answer:
        'Reads scale easily because you can replicate the data and serve copies. Writes don\'t — every write must be applied somewhere authoritative, in a consistent order, without conflicts. Three main approaches: (1) Sharding — split the data so each shard handles its own writes. Requires picking a shard key carefully; hot keys cause hotspots. (2) Multi-leader / multi-master — multiple nodes accept writes, conflicts resolved via last-write-wins, vector clocks, or CRDTs. Operationally complex. (3) Append-only logs (Kafka, event sourcing) — instead of mutating state, append events. Reads compute current state by replaying or maintaining materialised views. The hard part of write scaling is consistency: in a distributed system, getting two writes to agree on order requires consensus (Paxos, Raft) or accepting eventual consistency.',
    },
    {
      question: 'How does caching help scaling, and what are the main caching pitfalls?',
      answer:
        'Caching converts expensive operations (DB queries, computations) into cheap ones (RAM lookups). The win is enormous: a 1ms cache read replaces a 50ms DB query, and the DB sees only the cache misses. Pitfalls: (1) Cache invalidation — when underlying data changes, stale cached copies serve wrong data. (2) Cache stampede — when a popular cache entry expires, thousands of concurrent requests all miss and slam the DB simultaneously. Mitigate with locking, probabilistic early refresh, or background warmth. (3) Cache vs DB drift — if the cache becomes the source of truth, losing it is catastrophic. (4) Memory pressure — caching too much causes evictions; eviction policy (LRU, LFU) determines what gets dropped. (5) Cold starts — restarted services have empty caches; everything misses for the first few minutes.',
    },
    {
      question: 'What are signs that a system needs to be sharded — and what would you shard by?',
      answer:
        'Signs: (a) the database is the bottleneck despite read replicas and caching, (b) the dataset doesn\'t fit on the largest instance you can buy, (c) writes are saturating a single leader, (d) you need geographic data locality (GDPR, latency). Shard key choice is the most important decision and the hardest to change later. Good shard keys are (1) high-cardinality (millions of distinct values, so the data spreads evenly), (2) match how queries access data (queries should usually hit one shard, not all), and (3) avoid hotspots (no single value gets disproportionate traffic). For a multi-tenant SaaS, shard by tenant_id. For Slack, shard by team_id. For Twitter timelines, shard by user_id. Avoid sharding by something like timestamp — newest data always goes to one shard (hotspot).',
    },
    {
      question: 'When would you choose async / queue-based processing over synchronous request/response?',
      answer:
        'Async makes sense when: (1) The work is slow but the user doesn\'t need to wait — sending email, generating PDF, transcoding video, fanning out notifications. (2) The work can fail and retry without confusing the user — payment retries, webhook delivery. (3) Throughput-bound work where the producer rate exceeds the consumer rate — buffer in a queue and let consumers catch up. (4) Decoupling services so a slow downstream doesn\'t block the upstream. Costs: complexity (you now have a queue, dead letter queues, retry logic), eventual consistency (the user sees "submitted" but the work isn\'t done yet), debugging is harder (asynchronous flows span multiple services). For low-latency synchronous needs (paying for an item, fetching a user profile), async is the wrong choice.',
    },
    {
      question: 'What is "premature scaling" and why is it harmful?',
      answer:
        'Premature scaling is designing or building infrastructure for traffic / data scale you don\'t have yet. Examples: breaking a 1-developer codebase into 10 microservices, sharding a database holding 1GB of data, building a Kafka cluster for an app with 100 events/day. Why harmful: (1) Distributed systems are vastly more expensive to develop, debug, and operate than monoliths. (2) Each component you add needs reliability engineering — monitoring, alerting, failure recovery. (3) You\'re solving imagined problems instead of real ones; meanwhile competitors ship features. (4) Over-engineered architectures often need rewrites later when actual traffic patterns differ from imagined ones. The pattern in healthy companies: start with the simplest thing that solves the current problem; add complexity only when you have measurements showing where simplicity breaks down. Stack Overflow, Instagram, WhatsApp, Shopify all stayed simple far longer than mythology suggests.',
    },
  ],

  commonMistakes: [
    'Adding microservices before you have the operational maturity to run them — turning one debuggable monolith into a distributed-systems mess.',
    'Sharding too early — you double your operational burden (resharding, cross-shard queries, hotspots) for problems you don\'t have yet.',
    'Caching aggressively without thinking through invalidation — stale data bugs that only surface in production are some of the hardest to track down.',
    'Assuming horizontal scaling is automatic — it requires the application to be stateless. Sessions, in-memory state, and per-instance caches all break it silently.',
    'Confusing "we can handle 1M users" with "we should architect for 1M users today." Spending two years building for users you don\'t have is how startups die.',
    'Ignoring downstream bottlenecks — scaling the web tier 10× does nothing if the database is the bottleneck. Always profile before optimising.',
    'Auto-scaling that scales up but never scales down — you save money on peaks but pay full price 24/7 because the policy never reduces capacity.',
  ],

  metrics: [
    { name: 'Single biggest cloud VM',  value: '~448 vCPU / 24 TB RAM',   notes: 'AWS u7i-12tb / similar. Hard ceiling on vertical scaling.' },
    { name: 'Read:write ratio (typical web)', value: '10:1 to 1000:1',     notes: 'Why caching and read replicas are the cheap win.' },
    { name: 'Common sharding break-point', value: '~1 TB / ~50k QPS',     notes: 'Below this, vertical scaling + replicas usually suffice.' },
    { name: 'Microservices overhead',    value: '~30% extra eng effort',  notes: 'Internal estimates from migration retrospectives — varies wildly.' },
    { name: 'Cache hit rate target',     value: '> 95%',                   notes: 'Above 90% is good; below 80% means caching is barely helping.' },
  ],
};
