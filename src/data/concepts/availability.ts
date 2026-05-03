import type { ConceptDeepDive } from '../../types';

export const availability: ConceptDeepDive = {
  moduleId: 'availability',
  tagline: 'The system is up when users need it',

  introduction: {
    layman:
      'Availability is the percentage of time your system is actually working from the user\'s perspective. If your site is down for 1 hour out of 100, you\'re 99% available. That sounds great until you realise it\'s 7 hours of downtime a month — and customers churn, contracts break, and your team gets paged at 3am. Building "highly available" systems is about engineering away the failures that drag this number down.',
    analogy:
      'Think of your local hospital\'s emergency room. It must be open 24/7/365. You can\'t close for routine maintenance — you do it in shifts, with backup teams, with redundant power, with alternate routing if the building burns down. Highly available software systems use the same playbook: redundancy, failover, isolation.',
    whyMatters:
      'Every modern business runs on software. If the checkout is down, you lose sales by the second. If the trading platform is down, regulators get involved. SLAs (service-level agreements) bake availability into contracts — a "99.99% uptime" guarantee gives you 52 minutes of downtime per year. Miss it and pay the penalty. Interviewers test availability because it sits at the intersection of architecture, operations, and business risk.',
  },

  subTopics: [
    {
      title: 'The "Nines" — Measuring Availability',
      icon: '9️⃣',
      layman:
        'Availability is reported as a percentage with lots of nines. 99% is two nines. 99.9% is three nines. Each extra nine is 10× harder to achieve. The difference between 99% and 99.999% is 7 hours of downtime per month versus 5 minutes per year.',
      technical:
        'Availability = uptime / (uptime + downtime). Tracked over a defined window (monthly, annually). Higher nines exclude planned maintenance from the SLA window or use rolling-deploy strategies that avoid downtime entirely. The cost grows non-linearly: getting from 99% to 99.9% means redundancy; 99.9% to 99.99% means multi-region; 99.99% to 99.999% means active-active globally distributed systems with automatic failover.',
      example:
        'AWS EC2 promises 99.99% availability per region (52 min/year). S3 promises 99.99% durability with 99.9% availability. Trading systems often need 99.999% (~5 min/year) — anything more is reserved for telecom/utility-grade systems.',
    },
    {
      title: 'Common Failure Modes',
      icon: '💥',
      layman:
        'Things that break: a server crashes, a network link drops, a deploy goes wrong, a database fills up, a third-party API is down, someone pushes a bad config. Real outages are rarely the cause you expect. Availability engineering is mostly about anticipating these failures and surviving each one.',
      technical:
        'Categories: hardware (~50% historically — disks, NICs, power), software (bugs, memory leaks, deadlocks), operational (bad deploys, config mistakes, capacity planning errors), dependencies (third-party APIs down, DNS issues, certificate expiry), and external (DDoS, AWS region outage). Mean Time Between Failures (MTBF) and Mean Time To Recover (MTTR) frame the engineering choices.',
      example:
        'Cloudflare\'s 2022 outage: a single bad config push to their edge servers caused a global outage for ~30 minutes. Not hardware, not traffic — a configuration mistake. Modern availability engineering increasingly focuses on safe deployment practices because operational errors now cause more outages than hardware.',
    },
    {
      title: 'Redundancy: The Foundation',
      icon: '🛡️',
      layman:
        'If one of anything will fail, have at least two. Two web servers, two database replicas, two data centres, two internet connections. The cost is paying for capacity you don\'t actively use; the benefit is surviving the inevitable failure of any single piece.',
      technical:
        'N+1 redundancy: enough capacity that you can lose one component and still serve traffic. N+2 for high-availability targets. Geographically: deploy across multiple availability zones (AZs) within a region, then across multiple regions. The 8 fallacies of distributed computing remind us that the network itself fails — design for partial connectivity, not just node failures.',
      example:
        'AWS has multiple availability zones (datacenters with independent power, cooling, networking) per region. A correctly architected service runs in 3 AZs simultaneously. Lose an AZ (it does happen) and the other 2 absorb traffic. Companies that ran in only 1 AZ have learned this the hard way during real outages.',
    },
    {
      title: 'Failover Strategies',
      icon: '🔄',
      layman:
        'When something fails, traffic has to go somewhere else. Failover is the process of detecting the failure and switching to a backup. Manual failover takes humans (slow, mistakes happen). Automatic failover happens in seconds without human intervention — but designing it correctly is hard.',
      technical:
        'Detect failure: health checks, heartbeats, observability. Decide to failover: avoid flapping (rapid back-and-forth) and split-brain (two nodes both think they\'re leader). Execute failover: redirect traffic, promote standby, reroute writes. Recovery: bring failed component back without disrupting traffic. Patterns: active-passive (cheaper, slower failover), active-active (more capacity, harder to design).',
      example:
        'Postgres + Patroni: a leader handles writes; followers replicate. If the leader dies, Patroni runs a leader election among followers and promotes one in 10-30 seconds. Connection strings use a virtual IP that always points at the current leader. Apps see a brief blip but don\'t need to be reconfigured.',
    },
    {
      title: 'Geographic Distribution',
      icon: '🌍',
      layman:
        'A whole datacenter can go down — fire, flood, fibre cut, regional power outage. To survive that, run in multiple regions. The catch: data has to be replicated across regions, which adds latency and cost. Most companies start single-region; really critical systems go multi-region.',
      technical:
        'Strategies: active-passive (one region serves; another stands by) → active-active (both regions serve, traffic split via DNS or anycast). Data sync: synchronous cross-region replication is too slow (~100ms+ across continents); asynchronous replication accepts seconds of lag. Choose based on RTO (recovery time objective) and RPO (recovery point objective — how much data can you lose).',
      example:
        'Stripe runs active-active globally — payments are processed in the region closest to the merchant for low latency, with eventual consistency to other regions. A region outage is invisible to most customers because traffic auto-routes elsewhere within seconds.',
    },
    {
      title: 'Circuit Breakers & Bulkheads',
      icon: '🔌',
      layman:
        'When a downstream service is failing, hammering it with retries makes things worse. A circuit breaker notices repeated failures and stops calling for a bit, giving the downstream a chance to recover. A bulkhead isolates failure domains — one bad component doesn\'t drag down everything.',
      technical:
        'Circuit breaker states: closed (normal), open (failing, fail fast), half-open (testing recovery). Configurable failure thresholds (e.g. 50% errors over 30s opens the breaker). Bulkheads: separate thread pools / connection pools per dependency, separate AZ-pinning per shard, rate limits per tenant. Together they prevent cascading failures.',
      example:
        'Netflix\'s Hystrix library was the canonical circuit breaker; now most teams use Resilience4j (JVM) or built-in mesh-level circuit breakers (Istio, Envoy). Without them, a slow recommendations service can take down the entire homepage by exhausting thread pools.',
    },
    {
      title: 'Graceful Degradation',
      icon: '🪂',
      layman:
        'Sometimes you can\'t serve everything. Better to serve a degraded experience than nothing at all. Recommendations down? Show top-rated items. Search down? Show categories. Cart service down? Let users browse but defer adding items. Users get something rather than an error page.',
      technical:
        'Identify which features are non-critical for the core user journey and design fallbacks. Static fallbacks (cached "trending" page when personalisation is broken), feature flags to disable expensive features under load, "read-only mode" for sites where writes are temporarily unavailable.',
      example:
        'Netflix\'s homepage continues to render even if half its dozens of microservices are down — the layout falls back to popular content. The "experience" degrades gracefully; the user doesn\'t see "we are down" and leave. This is a deliberate engineering investment.',
    },
    {
      title: 'Health Checks & Observability',
      icon: '🩺',
      layman:
        'You can\'t fix what you can\'t see. Availability requires constant measurement: are servers responding? Are response times normal? Are error rates rising? Modern systems instrument every layer so problems show up in dashboards before users notice.',
      technical:
        'Three pillars: metrics (Prometheus, Datadog), logs (centralised, structured, searchable), traces (distributed tracing — Jaeger, Honeycomb). Health checks at multiple levels: load balancer → service → DB connectivity. Synthetic monitoring (probe key flows like a real user would). Alerting on symptoms (response-time SLO breaches), not causes (CPU > 80%).',
      example:
        'Google\'s "Four Golden Signals" (latency, traffic, errors, saturation) became the industry standard for what to monitor. Most outages are caught first by these signals breaching thresholds — well before customer support tickets arrive.',
    },
    {
      title: 'Chaos Engineering',
      icon: '🐒',
      layman:
        'You don\'t actually know if your system survives failures until you cause failures and watch. Netflix popularised "chaos engineering" — deliberately killing servers, breaking links, injecting latency in production to verify the system handles it. Counterintuitive but it works.',
      technical:
        'Tools: Chaos Monkey (random instance termination), Latency Monkey (network slowness), Chaos Kong (entire AZ failure), Gremlin (commercial chaos platform). Run chaos in production, in business hours, with proper guardrails. Goal: surface latent assumptions about reliability before real failures expose them.',
      example:
        'Netflix runs Chaos Monkey constantly in production. Every team knows their service might lose any instance any minute, so they design for that. Result: actual incidents (real AWS outages) cause minimal customer impact because the chaos training has already battle-tested everything.',
    },
  ],

  comparison: {
    caption: 'The cost of nines.',
    columns: ['Availability', 'Downtime / Year', 'Downtime / Month', 'Typical Architecture'],
    rows: [
      ['99%',        '3.65 days',     '7.20 hours',    'Single region, basic redundancy'],
      ['99.9%',      '8.76 hours',    '43.2 minutes',  'Multi-AZ, automated failover'],
      ['99.99%',     '52.6 minutes',  '4.32 minutes',  'Multi-AZ + multi-region, fast failover'],
      ['99.999%',    '5.26 minutes',  '25.9 seconds',  'Active-active multi-region, no SPOFs'],
      ['99.9999%',   '31.5 seconds',  '2.59 seconds',  'Telecom-grade, very specialised'],
    ],
  },

  realWorldExamples: [
    {
      company: 'AWS S3',
      icon: '🪣',
      description:
        'Designed for "11 nines of durability" (data not lost) and 99.99% availability. Replicates each object across multiple availability zones automatically. Decades of engineering: erasure coding, automated repair, hardware failure tolerance — invisible to users.',
    },
    {
      company: 'Visa / Mastercard',
      icon: '💳',
      description:
        'Payment networks target ~99.9999% availability — credit card transactions must work 24/7 globally. Multiple geographically distributed datacenters in active-active mode; complete redundancy at every layer; rigorous deployment processes; failures measured in single-digit-second user impact.',
    },
    {
      company: 'GitHub',
      icon: '🐙',
      description:
        'Famously transparent about outages via their status page. Has had multi-hour outages from operational mistakes (not hardware). Their availability journey illustrates: even with great engineers and infrastructure, the human / operational layer remains the dominant source of outages above 99.9%.',
    },
    {
      company: 'Cloudflare',
      icon: '⛅',
      description:
        'Edge network in 300+ cities globally, anycast routing. When one edge location fails, traffic auto-routes to the next nearest. Their 2022 BGP routing outage demonstrated even high-availability designs can have global single points of failure (the BGP control plane in that case).',
    },
  ],

  interviewQuestions: [
    {
      question: 'What\'s the difference between availability and reliability? They sound the same.',
      answer:
        'They\'re related but distinct. Availability asks "is the system up right now?" — measured as a percentage of time it\'s responding to requests. Reliability asks "does the system do what it\'s supposed to do correctly?" — measured by error rates, correctness, durability of data. A system can be available but unreliable: it responds but returns wrong answers (high availability, low reliability). It can also be reliable but unavailable: it works correctly when up, but is up only 80% of the time. Both matter; SLAs usually specify both. In interviews, distinguish them clearly: HA is about uptime; reliability is about correctness during uptime.',
    },
    {
      question: 'How would you achieve 99.99% availability for a web service?',
      answer:
        'Layered redundancy with no single points of failure. (1) Multi-AZ deployment: services run in at least 3 availability zones; lose one and traffic auto-shifts. (2) Stateless app servers behind a load balancer with health checks and auto-replacement of unhealthy instances. (3) Multi-AZ database with automated failover (e.g. RDS Multi-AZ, Aurora). (4) Cache layer with replicas. (5) Async work in queues so a downstream slow service doesn\'t propagate latency. (6) Circuit breakers around every external dependency. (7) Blue-green or canary deploys to limit blast radius of bad releases. (8) Observability: Four Golden Signals + alerts at multiple thresholds. (9) Runbooks + on-call rotations + regular failure drills. The hard part isn\'t any single technique — it\'s the operational discipline to keep all of them working.',
    },
    {
      question: 'What is a "blast radius" and why does it matter for availability?',
      answer:
        'Blast radius is the scope of impact when something fails: how many users, regions, or features are affected. Smaller blast radius = better availability, even if individual components fail more often. Achieved by isolation: separate AZs, regional cells, per-tenant resource pools, separate deploy stages, feature flags that limit a release to 1% of users first. Counterintuitively, you\'d rather have small frequent failures than rare massive ones — a daily 5-minute outage affecting 1% of users is much better than a once-a-year 8-hour outage affecting everyone.',
    },
    {
      question: 'Why is automatic failover hard to get right?',
      answer:
        'Three big problems. (1) Detection: how do you know the primary is "really" down vs just slow? Health checks need to balance speed (catch failures fast) vs accuracy (don\'t failover on a transient blip). (2) Split-brain: if the network partitions, two nodes might both think they\'re leader and both accept writes — corruption. Solved by quorum-based protocols (Raft, Paxos) requiring majority consensus before promoting. (3) Cascading failures: failover concentrates load on remaining nodes; if they\'re already near capacity, they fail too, and now everything\'s down. Mitigate with proper capacity headroom (typically running at <50% normal load so you can absorb a node failure). Manual failover with humans in the loop is slower but avoids these traps; tools like Patroni, etcd, and Kubernetes encode these patterns so you don\'t have to.',
    },
    {
      question: 'You have 99.9% availability and need to get to 99.99%. What changes?',
      answer:
        '99.9% means you\'re probably running multi-AZ in one region with automated failover. The next nine forces multi-region. Why: a region outage (yes, AWS regions go down) consumes your entire monthly downtime budget at 99.99%. So: (1) Replicate data across regions (async usually, sync for high-stakes data). (2) Active-active or fast failover routing (Route 53 health checks + DNS, or anycast at the edge). (3) Region-independent dependencies — no shared single-region service. (4) Eliminate operational SPOFs: regional capacity to handle full load if you lose one region; team coverage across timezones. (5) Tighter deployment safety — bad code rolling out everywhere is now an existential risk. (6) Better observability per region with regional dashboards. The cost roughly doubles (you run 2× the infrastructure); the engineering effort is significant. Worth it for some businesses (payments, ad tech), wasted effort for many others.',
    },
    {
      question: 'How do circuit breakers improve availability, and when can they make it worse?',
      answer:
        'Circuit breakers prevent cascading failures: when a downstream service starts failing, you stop calling it for a while, fail fast on the upstream, and let the downstream recover. Without them, a slow downstream eats all your thread pools, your service starts queuing, then it dies — one slow service has now taken down two. They make it worse if mis-tuned: too sensitive and you trip on transient blips, blocking legitimate traffic; too lenient and you don\'t protect against real failures. Also, opening a circuit breaker means "this feature is down right now" — you need a graceful fallback (cached response, default value, alternate path), or you\'ve just turned a slow response into a hard error. The best designs combine circuit breakers with fallback paths so when the breaker opens, the user still gets something useful.',
    },
    {
      question: 'What\'s the relationship between deployment practices and availability?',
      answer:
        'Above 99.9% availability, operational issues (bad deploys, config changes, capacity planning) become the dominant source of outages — exceeding hardware failures. So deployment practice IS availability engineering. Key patterns: (1) Blue-green deploys: keep the old version warm; switch traffic instantly; instant rollback on issues. (2) Canary releases: send 1% of traffic to the new version first; auto-rollback on metric regression. (3) Progressive rollouts across regions: catch a bad release in one region before hitting all. (4) Feature flags decouple deploy from release — ship the code dark, enable per-segment, kill instantly without redeploy. (5) Immutable infrastructure: every change is a new image, never an in-place mutation, so rollback is just pointing at the previous image. The companies with extreme availability invest heavily here.',
    },
  ],

  commonMistakes: [
    'Designing for hardware failures only — most modern outages are operational (bad config, bad deploys, capacity exhaustion), not hardware.',
    'Aiming for unrealistic availability targets without the engineering investment — promising 99.99% on a single-region setup will fail the first regional incident.',
    'Health checks that test the wrong thing — checking "is this process running?" instead of "can this process actually serve requests?" hides real problems.',
    'No graceful degradation — when one feature breaks, the whole page breaks. Better to ship a partial experience than no experience.',
    'Forgetting that retries make outages worse — when downstream is overloaded, retries multiply the load. Combine retries with circuit breakers and exponential backoff.',
    'Treating SLAs as aspirations rather than budgets — error budget exhaustion should slow new feature work, not be ignored.',
    'Building chaos engineering as a one-off project rather than a continuous practice — the value is in the regular drilling, not the initial run.',
  ],
};
