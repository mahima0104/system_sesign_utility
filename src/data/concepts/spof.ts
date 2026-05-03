import type { ConceptDeepDive } from '../../types';

export const spof: ConceptDeepDive = {
  moduleId: 'single-point-of-failure-spof',
  tagline: 'The one thing whose failure brings everything down',

  introduction: {
    layman:
      'A single point of failure (SPOF) is one component whose breakdown takes down the whole system. The one database. The one load balancer. The one fibre cable into your building. The one DNS provider. Identifying SPOFs is mostly an exercise in pessimism: "what\'s the smallest thing whose failure ruins my day?" — and then building so that no single thing has that power.',
    analogy:
      'Imagine a chain holding up an elevator. If any one link fails, the whole chain breaks. The elevator industry doesn\'t use chains — they use multiple independent steel cables. Even if one snaps, the others hold the cabin. Reliable software systems work the same way: replace single chains with multiple independent paths.',
    whyMatters:
      'Most outages traced back have a single SPOF at the root. Interviewers love this question because it tests architectural thinking. In real systems, finding SPOFs is a continuous practice — they emerge as systems evolve, especially when teams add new dependencies without realising they\'re reintroducing the very problem they once eliminated.',
  },

  subTopics: [
    {
      title: 'Identifying SPOFs',
      icon: '🔍',
      layman:
        'For every component, ask: "if this disappears right now, what happens?" Walk the whole request path: DNS, TLS termination, load balancer, app server, cache, database, queue, downstream APIs. Anything where the answer is "we go down" is a SPOF.',
      technical:
        'Failure-mode analysis: list components, list failure modes per component (crash, network partition, slow, corrupted), then trace impact. Tools: dependency graphs (each service\'s critical-path dependencies), chaos engineering (actually break things and watch). Don\'t forget non-software SPOFs: a single deploy bot, a single key person who knows production secrets, a single Kafka cluster, a single cloud provider account.',
      example:
        'A common SPOF many teams miss: their CI/CD pipeline. If GitHub goes down, you can\'t deploy fixes — even if your runtime is multi-region and bulletproof. Companies above 99.99% availability mirror critical CI/CD to a second provider precisely because the deploy path itself is a SPOF for incident response.',
    },
    {
      title: 'Hardware-Level SPOFs',
      icon: '🔌',
      layman:
        'A single server, a single power supply, a single network switch, a single rack. Lose any of these and you lose everything depending on it. Hardware redundancy is the oldest and best-understood form of fault tolerance.',
      technical:
        'N+1 redundancy at the rack level (dual power supplies on each server, dual NICs, redundant top-of-rack switches). Multiple physical paths for power and network. Servers spread across racks, not concentrated in one. In cloud, "spread placement groups" (AWS) ensure your instances aren\'t on the same physical host.',
      example:
        'In 2017, AWS S3 had a major outage when an engineer accidentally took down the wrong subset of servers — but the bigger issue was that the index service had no proper failover, so the metadata layer became a SPOF for the entire region. Post-mortem changes: better cell isolation, faster failover for index services.',
    },
    {
      title: 'Software-Level SPOFs',
      icon: '🐛',
      layman:
        'Even with redundant hardware, software can be a SPOF. A bug in a singleton service, a misbehaving daemon, a config that affects every node simultaneously. The classic: a single deployment that ships broken code to all your servers at once.',
      technical:
        'Mitigations: cell-based architectures (each cell is a self-contained slice serving a subset of users), progressive rollouts (canary deploys), feature flags decoupled from deploy. Avoid having one service that "knows everything" — split into smaller services with bounded blast radius. Stateless services with shared-nothing architecture limit propagation of bugs.',
      example:
        'Cloudflare\'s 2019 outage: a single regex change on their WAF caused 100% CPU on every edge server worldwide simultaneously — global outage in minutes. The fix was both technical (better config-pushing safety) and architectural (canary push to one PoP first instead of global rollout).',
    },
    {
      title: 'Network-Level SPOFs',
      icon: '🌐',
      layman:
        'The internet looks redundant but often isn\'t for any individual customer. A single ISP connection, a single DNS provider, a single CDN, a single TLS certificate authority. Each is a potential SPOF that takes you off the internet even though "the internet is fine".',
      technical:
        'Multiple ISPs (BGP multi-homing). Multiple DNS providers (NS records pointing to two providers — Route 53 + Cloudflare). Multiple CDNs (different vendors for failover). Multiple certificate authorities (cross-signed certs). Each adds operational cost; large companies typically only do this for their most critical paths.',
      example:
        'The 2016 Dyn DNS outage took down Twitter, Reddit, GitHub, Netflix simultaneously — every major site that used Dyn as their sole DNS provider. Companies with multi-DNS like Stack Overflow rode it out unaffected. Lesson: even something as "boring" as DNS can be a SPOF.',
    },
    {
      title: 'Human SPOFs',
      icon: '🧑‍💻',
      layman:
        'The senior engineer who\'s the only one who knows how a critical system works. The one DBA with prod access. The one team member with the SSL certificate renewal credentials. Humans become SPOFs when knowledge or access concentrates.',
      technical:
        'Documentation, runbooks, on-call rotations, paired oncall, regular DR drills, role-based access control (multiple humans can do critical operations). Bus-factor analysis: "if this person were hit by a bus tomorrow, what breaks?" Ideally bus-factor of every critical role is ≥ 2.',
      example:
        'A startup\'s sole founder-CTO had all production passwords in their head. They went on a two-week meditation retreat with no contact. Production went down on day 3 (cert expiry); no one else could renew. The fix wasn\'t technical — it was process: shared password manager, runbooks for every recurring task, secondary on-call.',
    },
    {
      title: 'External Dependencies as SPOFs',
      icon: '🔗',
      layman:
        'Your reliability is a function of your weakest dependency. Use one payment processor? Their outage is your outage. One email service? Same. One cloud region? Same. You can\'t directly control external services\' reliability — but you can architect around their failures.',
      technical:
        'Patterns: multiple providers with auto-failover (Stripe + Adyen for payments), regional failover (multi-region cloud), graceful degradation (when service X is down, hide that feature instead of failing the whole page), circuit breakers (stop calling failing dependencies), local fallbacks (cached data when the API is down).',
      example:
        'Many startups used only AWS us-east-1; when it went down (it has, multiple times), they went down with it. Mature companies use multiple regions or even multiple providers for the most critical paths. Stripe famously runs payment processing across multiple cloud providers for redundancy.',
    },
  ],

  comparison: {
    caption: 'Common SPOFs and their typical mitigations.',
    columns: ['SPOF', 'Mitigation', 'Operational Cost'],
    rows: [
      ['Single server',          'Multiple servers + load balancer',    'Low'],
      ['Single load balancer',   'LB pair with health checks + DNS failover', 'Low'],
      ['Single database leader', 'Replica + auto-failover (RDS Multi-AZ)', 'Medium'],
      ['Single AZ',              'Multi-AZ deployment',                  'Medium'],
      ['Single region',          'Multi-region active-passive or active-active', 'High'],
      ['Single DNS provider',    'Two providers, NS records on both',    'Low'],
      ['Single payment processor', 'Two processors with auto-failover', 'High (integration cost)'],
      ['Single deploy pipeline', 'Mirrored CI/CD or break-glass script', 'Medium'],
      ['Single key person',      'Documentation, runbooks, oncall pairs', 'Process-only, but real'],
    ],
  },

  realWorldExamples: [
    {
      company: 'AWS us-east-1',
      icon: '☁️',
      description:
        'us-east-1 has had high-profile outages roughly every 1-2 years, each time taking down major customers. Companies running multi-region rode them out; single-region companies went dark. The repeating lesson: a single region — even from a giant cloud — is a SPOF for any user not architected across regions.',
    },
    {
      company: 'Cloudflare BGP outage 2022',
      icon: '🌐',
      description:
        'A bad BGP route advertisement from Cloudflare\'s control plane took huge swathes of internet offline. The lesson: a single global routing system, even at a hyperscaler, can be a SPOF. Cloudflare\'s post-mortem committed to safer rollouts of routing changes.',
    },
    {
      company: 'Facebook 2021 (DNS + BGP)',
      icon: '📱',
      description:
        'A maintenance change to Facebook\'s backbone routing accidentally withdrew their BGP routes. Effects cascaded: their internal DNS became unreachable, including the DNS used by the systems engineers needed to log in to fix it. Hours of recovery; classic example of a chain of dependencies forming an unexpected SPOF.',
    },
    {
      company: 'Slack outage 2022',
      icon: '💬',
      description:
        'Multi-hour outage traced to a misconfigured cron job that affected all consul services simultaneously. Even with a sophisticated multi-region architecture, a single configuration system that pushes to everything can become a SPOF. Subsequent design changes added staged rollouts to config pushes.',
    },
  ],

  interviewQuestions: [
    {
      question: 'Walk me through how you\'d find SPOFs in an existing system.',
      answer:
        'Start with the request path: trace a typical user request from DNS through CDN, load balancer, app server, cache, database, downstream APIs, and back. At each hop, ask "if this dies, do all requests fail?" The first answer that\'s yes is a SPOF. Then expand beyond the request path: deploy pipeline, monitoring, on-call paging, secret management, certificate renewal. Ask the same question. Then process and people: who alone can do X? What documentation gates someone\'s ability to recover? Some SPOFs are obvious (one DB), some are subtle (one DNS provider, one person with prod access). The exercise is more useful as a practice than a one-time audit because new SPOFs are constantly introduced as systems evolve.',
    },
    {
      question: 'How do you mitigate the "single load balancer" SPOF?',
      answer:
        'Multiple layers. (1) Run the load balancer in HA mode — two instances, one active, one passive, with shared virtual IP that fails over via VRRP/keepalived. Sub-second failover. (2) DNS-level multi-LB: two LBs in active-active mode, both registered in DNS; clients failover by reconnecting. Higher latency but no synchronisation between LBs needed. (3) Multi-region: traffic distributed by Route 53 latency-based routing or anycast. Real systems combine these. AWS ALBs and managed equivalents are multi-AZ by default — the LB itself is no longer a SPOF as long as you\'re in a multi-AZ region. The remaining SPOF: AWS itself, mitigated by multi-cloud or multi-region.',
    },
    {
      question: 'Why is using a single DNS provider often an underappreciated SPOF?',
      answer:
        'DNS is the first step of every request. If your DNS is down, your domain doesn\'t resolve — no users reach you, even if your servers are perfectly healthy. The Dyn 2016 attack illustrated this: Twitter, Reddit, GitHub, Netflix all relied on Dyn alone, all went dark simultaneously. Mitigation: use two DNS providers concurrently. Configure both as authoritative NS records; clients try them randomly. Both must serve the same records. Companies with high availability targets (financial, e-commerce above 99.99%) usually do this. The cost is low (two contracts, two configs to keep in sync, automation to detect drift). The benefit: you survive any single provider outage.',
    },
    {
      question: 'Can a system be entirely free of SPOFs?',
      answer:
        'Theoretically no — practically, you push them to broader and broader scopes. You eliminate single-server SPOFs with multi-instance, single-AZ SPOFs with multi-AZ, single-region SPOFs with multi-region, single-cloud SPOFs with multi-cloud. Beyond that you\'re into single-internet-protocol (BGP) and single-physical-laws-of-physics. Most systems stop at single-region or single-cloud because going further has diminishing returns on enormous engineering investment. The honest framing: every system has SPOFs at some level; the question is whether the level is acceptable for your reliability targets and business risk. A consumer app at 99.9% can stop at single-region with multi-AZ; a global bank at 99.999% needs multi-region with active-active and hot DR.',
    },
    {
      question: 'What are some non-obvious SPOFs that surprise teams in incidents?',
      answer:
        'A pattern of subtle SPOFs: (1) Shared monitoring infrastructure — your own metrics provider goes down, you can\'t see what\'s happening. (2) The deploy pipeline itself — if GitHub is down, you can\'t fix prod. (3) Internal DNS — if internal Consul/Kubernetes DNS fails, services can\'t find each other. (4) Authentication — if your single SSO provider is down, even on-call engineers can\'t log into infrastructure. (5) Slack/PagerDuty — incident communication channel is itself a single dependency. (6) The TLS certificate authority — if Let\'s Encrypt is down on the day your cert expires, you\'re stuck. (7) The git history — if the original repo is corrupted or unavailable, distributed clones save you. Each one looks "safe" until it fails. Mature teams have break-glass procedures and secondary providers for the most critical of these.',
    },
    {
      question: 'How does cell-based architecture eliminate SPOFs?',
      answer:
        'Cell-based architecture splits the system into fully independent self-contained units (cells), each serving a subset of users. AWS uses this for many services. Instead of one big shared service, you have N independent cells, each with its own databases, caches, deployment, and capacity. A bad deploy goes to one cell first, contained. A noisy customer impacts only their cell. A region outage affects only the cells in that region. The key constraint: cells share NOTHING — separate data, separate identity, separate code paths. Adding more cells is how you scale. The trade-off: cross-cell features (search across all users) require dedicated infrastructure; some features become harder. But the blast-radius reduction is profound: instead of "the system is down", it\'s "5% of cells are degraded", which is operationally and reputationally an order of magnitude better.',
    },
  ],

  commonMistakes: [
    'Doing a SPOF audit once and assuming you\'re done — new SPOFs creep in with every architectural change.',
    'Eliminating obvious SPOFs while ignoring subtle ones (CI/CD, DNS, deploy bot, monitoring).',
    'Believing "it\'s in AWS, so it\'s redundant" — no, only if you architected for multi-AZ. Single-AZ deployments fall when AZs do.',
    'Multi-region deployments where the regions share state synchronously — turning two regions into one big SPOF.',
    'Adding redundancy without testing failover — many "redundant" systems fail during real incidents because failover paths were never exercised.',
    'Ignoring human SPOFs — the senior engineer who knows everything is a SPOF for incident recovery.',
    'Accepting external SPOFs (one payment processor, one email vendor) without conscious reliability planning.',
  ],
};
