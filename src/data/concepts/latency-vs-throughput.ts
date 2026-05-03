import type { ConceptDeepDive } from '../../types';

export const latencyVsThroughput: ConceptDeepDive = {
  moduleId: 'latency-vs-throughput',
  tagline: 'Speed of one request vs total work per second',

  introduction: {
    layman:
      'Latency is how long ONE thing takes — the time between you asking and the system answering. Throughput is how MANY things per second the system can do. They\'re different quantities and they often pull in opposite directions. Optimising for one can hurt the other. Knowing the difference and how to talk about both is foundational for any system design conversation.',
    analogy:
      'Imagine a highway. Latency is how long it takes one car to drive from A to B. Throughput is how many cars per minute can pass a toll booth. A 10-lane highway with a 30 MPH speed limit has high throughput but high latency. A single-lane race track with a 200 MPH limit has low latency but low throughput. Different goals, different designs.',
    whyMatters:
      'Confusing these two concepts is one of the most common mistakes in system design interviews. Half the design questions you\'ll get hinge on this distinction: a low-latency system (trading) is engineered very differently from a high-throughput system (analytics). Worse, naive optimisations often make one better at the cost of the other — and you have to know which one your business actually cares about.',
  },

  subTopics: [
    {
      title: 'Latency: The Time for One Operation',
      icon: '⚡',
      layman:
        'Latency is the delay between cause and effect. You click "search"; the results appear 200ms later — that\'s 200ms of latency. Lower latency feels snappier. Modern users start to notice anything above ~100ms; above 1 second feels broken.',
      technical:
        'Measured per request, usually in milliseconds. Different stages contribute: network round-trip, queueing time, processing time, downstream API calls. Components add up: a request that hits 5 services in serial sees the sum of latencies. Common metrics: p50 (median), p95, p99 — averages hide the long tail.',
      example:
        'Google Search\'s p50 latency is around 200ms; p99 is harder to measure but engineering targets it aggressively because slow searches hurt user retention. Studies (Amazon, Google) show that every 100ms of additional latency measurably reduces conversion rates and engagement.',
    },
    {
      title: 'Throughput: Total Work Per Second',
      icon: '🚀',
      layman:
        'Throughput is your system\'s total capacity per second. A web server doing 10,000 requests/second has 10k RPS throughput. A Kafka cluster doing 1M messages/second has 1M msg/s throughput. Higher throughput = more work done per unit time, regardless of how fast any individual unit is.',
      technical:
        'Measured as units-per-second: requests, transactions, queries, bytes. Throughput depends on parallelism: if your system handles 10ms requests but processes 100 in parallel, throughput is 10,000 RPS. Bottlenecks (single-threaded code, lock contention, downstream limits) cap throughput regardless of resources thrown at it.',
      example:
        'Kafka can comfortably do 1M+ messages per second per broker. Each individual message has very low latency (sub-millisecond), but the headline number people quote is throughput because Kafka\'s value is moving large volumes of data, not minimising any single message\'s delay.',
    },
    {
      title: 'Bandwidth: The Pipe\'s Capacity',
      icon: '🌊',
      layman:
        'Bandwidth is the maximum amount of data your network connection can carry per second. A 1 Gbps connection has 1 gigabit of bandwidth. Throughput uses bandwidth — but the actual achieved throughput is usually less because of overhead, latency, and protocol efficiency.',
      technical:
        'Bandwidth is the theoretical max; throughput is what you actually achieve. The gap depends on protocol overhead (TCP headers, TLS, application protocol), round-trip time (TCP slow-start, congestion control), and packet loss. Long-distance high-bandwidth links suffer from the bandwidth-delay product: you need a large send window to keep the pipe full.',
      example:
        'A trans-Atlantic 10 Gbps link with 100ms RTT can\'t actually carry 10 Gbps for a single TCP connection — the bandwidth-delay product (10 Gbps × 0.1s = 1 GB) needs huge TCP buffers, slow-start ramps up gradually, and congestion control responds to any loss. Multiple parallel connections or QUIC mitigate this.',
    },
    {
      title: 'The Trade-off: Latency vs Throughput',
      icon: '⚖️',
      layman:
        'Adding parallelism, batching, queueing, and caching often raises throughput but also raises latency for individual requests. Optimising for fast individual responses sometimes means leaving capacity unused. Designs choose where to sit on this curve.',
      technical:
        'Batching: wait briefly to accumulate work, then process together — higher throughput, higher latency. Queueing: when load exceeds capacity, requests wait — average latency rises sharply (queueing theory). Caching: trade memory for both lower latency AND higher throughput (cached responses are fast and don\'t consume backend capacity). Most performance work is finding the right point on this curve.',
      example:
        'Kafka producers batch messages: linger.ms=20 means the producer waits up to 20ms to gather a batch before sending. The batch sends together at higher throughput than individual sends — but each message paid up to 20ms of latency it didn\'t have to. For analytics use cases this is fine; for trading systems it\'d be unacceptable.',
    },
    {
      title: 'Tail Latency: The p99 Problem',
      icon: '📉',
      layman:
        'Average latency lies. A system might respond in 50ms on average but have 1% of requests that take 5 seconds. Those 1% are the requests your most engaged users hit, and the difference between 50ms and 5000ms is what they remember. Always look at p99 and p99.9, not just averages.',
      technical:
        'In a system that\'s 99% fast and 1% slow, a request that fans out to 100 services hits the slow path with probability ~63%. So tail latency compounds badly under fan-out. Mitigations: hedged requests (fire to two replicas, take whichever returns first), tail-tolerant deadlines, eliminate slow-path causes (GC pauses, lock contention, cold caches).',
      example:
        'Amazon famously found that 100ms of additional latency costs 1% of sales. The interesting bit: "additional latency" was measured at p99, not averages — the slow tail mattered more than the median. Google\'s "tail at scale" paper makes the same case quantitatively for fan-out architectures.',
    },
    {
      title: 'Optimising for Latency',
      icon: '🏃',
      layman:
        'When users\' subjective experience is what matters — UI responsiveness, interactive search, gaming — you optimise latency. Techniques: keep things in memory, run them physically close to the user, do work in parallel instead of serial, eliminate any unnecessary round-trips.',
      technical:
        'Caching aggressively (RAM, CDN edge), minimising network hops (collocate services), parallel fan-out instead of serial calls, denormalising data so reads are cheap, avoiding cross-region calls on hot paths, pre-computing answers (materialised views), using compiled languages or low-overhead runtimes for hot paths.',
      example:
        'High-frequency trading targets sub-microsecond latency: dedicated fibre, specialised network cards (kernel bypass), code in C++/FPGA, colocated with the exchange\'s servers. Every microsecond costs money to optimise but earns more in trading edge.',
    },
    {
      title: 'Optimising for Throughput',
      icon: '🏭',
      layman:
        'When you have to process huge volumes — analytics, ML training, batch jobs, log ingestion — you optimise throughput. Techniques: batch work, parallelise, use bulk-friendly protocols, stream data instead of polling, accept higher per-request latency if total work-per-second goes up.',
      technical:
        'Batching (collect N items, process together), parallelism (more cores/machines), efficient serialization (Protobuf > JSON), bulk APIs (1 request to insert 1000 rows vs 1000 requests for 1 each), columnar formats for analytics (Parquet > row-based), zero-copy I/O, async / non-blocking I/O.',
      example:
        'Snowflake / BigQuery process petabytes daily. Each query may take seconds (high latency) but they process millions per day across thousands of customers (high throughput). The architecture is unrecognisably different from a low-latency OLTP database — different tools for different goals.',
    },
    {
      title: 'Queueing Theory: Why Wait Times Explode',
      icon: '📊',
      layman:
        'Counterintuitive fact: a system that\'s 90% utilised has waits roughly 9× longer than at 50% utilisation. Push to 99% and waits are 99×. Above some threshold, latency goes from "fine" to "terrible" without throughput changing much. This is why practitioners run servers at 50-70% target utilisation.',
      technical:
        'Little\'s Law: average queue length = arrival rate × average wait time. Wait time grows non-linearly with utilisation: at ρ utilisation, wait time scales as ρ/(1-ρ). At ρ=0.5: 1 unit. At 0.9: 9. At 0.99: 99. Real systems hit this in capacity planning: leaving headroom is necessary not for capacity but for tail latency.',
      example:
        'Server-tier capacity planning: "we can handle 1000 RPS at 90% CPU" doesn\'t mean serve 900 RPS comfortably. At 90% utilisation, p99 latency is brutally bad. Production targets typically set 50-70% capacity headroom precisely because of queueing theory — the cost of running at 60% vs 80% is far less than the latency cost of approaching saturation.',
    },
  ],

  comparison: {
    caption: 'Quick reference for the three metrics.',
    columns: ['Metric', 'Definition', 'Unit', 'When You Care'],
    rows: [
      ['Latency',    'Time per single operation',         'ms',         'User-facing UIs, real-time, gaming, trading'],
      ['Throughput', 'Operations completed per second',   'ops/sec',    'Batch processing, analytics, queues, log pipelines'],
      ['Bandwidth',  'Maximum data rate of the link',     'bits/sec',   'Streaming media, large-file transfer, CDN sizing'],
      ['p50',        'Median latency',                    'ms',         'Typical user experience'],
      ['p99',        '99th percentile latency',           'ms',         'Long-tail experience; what 1% of users feel'],
      ['Utilisation', 'How busy a resource is',           '%',          'Capacity planning; predicting saturation'],
    ],
  },

  realWorldExamples: [
    {
      company: 'High-Frequency Trading',
      icon: '📈',
      description:
        'Latency-obsessed: microseconds matter because faster traders capture profitable trades. Custom hardware, dedicated fibre, code in C++ or FPGA, colocation with exchange servers. Throughput is secondary — they\'d trade lower throughput for any latency improvement.',
    },
    {
      company: 'Google Search',
      icon: '🔍',
      description:
        'Both matter, latency primary. Each query fans out to thousands of shards in parallel; the slow tail of any one shard becomes the user\'s observed latency. Google\'s "tail at scale" paper documents the engineering required: hedged requests, tied requests, micro-partitions to limit per-shard work.',
    },
    {
      company: 'Snowflake / BigQuery',
      icon: '📊',
      description:
        'Throughput-obsessed: petabytes scanned per second across thousands of nodes. Individual queries take seconds (sometimes minutes for huge ones); that\'s fine because users expect "analytics" not "interactive". Architecture is unrecognisable from low-latency systems — columnar storage, vectorised execution, massive parallelism.',
    },
    {
      company: 'Netflix Streaming',
      icon: '🎬',
      description:
        'Bandwidth-driven: video at 4K is ~25 Mbps per stream, multiplied by millions of concurrent viewers globally. Their CDN (Open Connect) places caches inside ISP networks to maximise effective bandwidth and minimise transit costs. Latency matters for buffering decisions; throughput for steady-state delivery.',
    },
  ],

  interviewQuestions: [
    {
      question: 'Define latency, throughput, and bandwidth in plain language and explain how they\'re different.',
      answer:
        'Latency: time for one operation to complete (ms). Throughput: total operations per second (ops/sec). Bandwidth: maximum data rate of the underlying link (bits/sec). Latency and throughput are different measurements of the same system; they often trade off (batching raises throughput but raises individual latency too). Bandwidth is a capacity limit — actual throughput in bytes/sec can\'t exceed bandwidth, but real throughput is often much less due to protocol overhead, RTT, and congestion control. Concrete example: a 1 Gbps connection (bandwidth) might yield 100 MB/sec throughput (lower due to TCP overhead and RTT) and have 50ms latency between you and a remote server.',
    },
    {
      question: 'Why does optimising for throughput often hurt latency?',
      answer:
        'Most throughput optimisations involve batching, queueing, or parallelism with synchronisation, all of which add waiting time per individual request. Batching: gather work for some time before processing — the first item waits while the batch fills. Queueing: when load is high, requests wait their turn. Parallelism with coordination (e.g. waiting for slowest worker): you finish only as fast as the slowest. Caching is a rare exception — it usually improves both. Designers explicitly choose where to sit: a real-time UI prioritises latency (no batching, no queuing, parallel fan-out); an analytics pipeline prioritises throughput (large batches, queues, multi-stage processing). Same problem space, opposite design points.',
    },
    {
      question: 'What is "tail latency" and why is it disproportionately important?',
      answer:
        'Tail latency = the slow end of the latency distribution, typically measured at p99 or p99.9. Average and median latencies hide tail problems: p50 might be 50ms while p99 is 5000ms. The tail matters disproportionately because (1) users notice slow requests more than fast ones — five fast then one slow feels worse than uniformly mediocre; (2) it compounds in fan-out architectures: a request hitting 100 backends with 1% slow each has ~63% chance of hitting at least one slow path; (3) timeouts and retries trigger off the tail, so tail latency drives infrastructure costs. Google\'s "tail at scale" paper formalised this: in fan-out systems, you must engineer the slow path explicitly with hedged requests, micro-partitions, and consistent percentile-based monitoring.',
    },
    {
      question: 'Explain the queueing-theory intuition for why you shouldn\'t run a server at 95% capacity.',
      answer:
        'Queueing wait time scales as ρ / (1-ρ) where ρ is utilisation. At ρ=0.5, wait = 1 unit. At ρ=0.9, wait = 9. At ρ=0.95, wait = 19. At ρ=0.99, wait = 99. So pushing utilisation from 60% to 90% triples your effective wait time despite only adding 50% more throughput. Why? Because as you approach saturation, every brief load spike or slow request causes a queue that can\'t drain quickly enough — and every queueing event compounds. Production capacity targets typically aim for 50-70% steady-state utilisation precisely so transient spikes don\'t blow up tail latency. This is also why autoscaling triggers usually fire at 70%, not 90% — you need headroom for safety, not just for capacity.',
    },
    {
      question: 'How would you reduce tail latency in a system that fans out to many backends?',
      answer:
        'Several techniques compound. (1) Hedged requests: send to two replicas, take the first response, cancel the other. Drops p99 dramatically. (2) Tied requests: send to two, the slower one cancels itself when notified the first responded. Same idea with less wasted work. (3) Micro-partitioning: small partitions per backend so any one partition\'s slowness affects fewer requests; combined with rapid rebalancing. (4) Eliminating slow-path causes: GC tuning, eliminating lock contention, JIT warmup, cold-cache mitigation. (5) Deadline propagation: every request carries a deadline; backends can skip work that won\'t finish in time. (6) Speculative execution / backup tasks (MapReduce style): start a duplicate of a task that\'s running slow; take whichever finishes first. Combine with monitoring p99 (not average) so you actually see the tail and can verify your fixes are working.',
    },
    {
      question: 'When does latency matter more than throughput, and vice versa?',
      answer:
        'Latency-first: anything humans wait for interactively (web pages, mobile apps, search), real-time control (gaming, robotics), trading, voice/video calls. The cost is paid in user retention, conversion rates, or business outcomes per millisecond. Throughput-first: batch processing (analytics, ETL), log/event pipelines, ML training, content distribution, backup/restore. Users don\'t care if a single record took 100ms vs 1ms; they care that the entire job completes in time. Many real systems are mixed: write path is throughput-optimised (batched ingestion), read path is latency-optimised (precomputed indexes). The interview-worthy answer: identify which side of the system the question is about and optimise accordingly. A failure mode is over-engineering low latency for a workload where throughput is what users actually care about.',
    },
  ],

  commonMistakes: [
    'Reporting only averages — the tail (p99) is where real reliability problems live and where users\' experience is shaped.',
    'Confusing throughput with bandwidth — they\'re related but different; throughput is what you achieve, bandwidth is the pipe\'s capacity.',
    'Optimising one without measuring the other — making a single request 10× faster might 10× the cost or kill throughput.',
    'Targeting 90%+ utilisation as "efficient" — queueing theory makes that latency-poisonous; 60-70% is usually the right target.',
    'Adding caching without understanding what you\'re caching — wrong caches hurt latency (extra hop on miss) without helping much.',
    'Ignoring fan-out tail-amplification — a request that depends on 100 backends is sensitive to each one\'s p99, not their average.',
    'Designing for throughput a system that needs latency, or vice versa — the architectures are fundamentally different.',
  ],
};
