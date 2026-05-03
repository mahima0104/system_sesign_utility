import type { ConceptDeepDive } from '../../types';

export const capTheorem: ConceptDeepDive = {
  moduleId: 'cap-theorem',
  tagline: 'You can have two of three: Consistency, Availability, Partition tolerance',

  introduction: {
    layman:
      'CAP theorem says that when something goes wrong with the network in a distributed database, you have to make a hard choice. Either keep showing everyone exactly the same data (Consistency) but refuse to answer some users while the network is broken (giving up Availability), or keep answering everyone (Availability) but allow some users to see slightly out-of-date data (giving up Consistency). You can\'t have both — physics doesn\'t allow it.',
    analogy:
      'Imagine a chain of bookstores all selling the same book. Their stock systems get disconnected from each other (a "partition"). When a customer asks "is this book in stock?", you have two choices. (a) Refuse to answer — "I can\'t check until our systems are reconnected." That\'s consistency over availability. (b) Answer with what you know locally — "yes, it\'s in stock here" — even though it might be sold out at the next store. That\'s availability over consistency. There\'s no third option that gives both.',
    whyMatters:
      'Every distributed database makes this trade-off, and you need to know which trade-off your database makes before relying on it. Bank ledgers can\'t serve stale balances (consistency wins); shopping carts and social feeds usually can (availability wins). CAP is the standard interview vocabulary for talking about this — but it\'s often misused, so understanding what it really says (and doesn\'t say) sets you apart.',
  },

  subTopics: [
    {
      title: 'The Three Properties',
      icon: '🔺',
      layman:
        'Consistency: every read sees the most recent write, like a bank balance. Availability: every request gets an answer (success or failure), no timeouts forever. Partition tolerance: the system keeps working even when network connections between nodes drop. CAP says you can\'t have all three when a partition happens.',
      technical:
        'Consistency in CAP = linearizability: there\'s a single global order of operations and every read sees the most recent committed write. Availability = every request to a non-failed node gets a non-error response. Partition tolerance = the system continues to operate despite arbitrary message loss between nodes. Note: CAP\'s "consistency" is much stricter than the "C" in ACID; "availability" is much stricter than typical SLA-driven uptime.',
      example:
        'A single Postgres database is naturally CA — strong consistency and high availability, no partition because it\'s one node. The moment you add a replica in another datacenter, you have to deal with partitions, and you\'re forced into CP or AP territory. This is why CAP only meaningfully applies to distributed systems.',
    },
    {
      title: 'CP: Choose Consistency Over Availability',
      icon: '🔒',
      layman:
        'When the network breaks, refuse to serve the side that might give wrong answers. Better to say "we can\'t tell you right now" than to say something inconsistent. Banks, payment systems, anything where wrong data is worse than no data, choose CP.',
      technical:
        'During a network partition, only the side that can reach a majority (quorum) of nodes serves requests; the minority side errors out. Often implemented via consensus protocols (Raft, Paxos): writes require majority agreement; minority partitions cannot commit. Examples: ZooKeeper, etcd, Consul (in default modes), traditional RDBMS with synchronous replication.',
      example:
        'A bank wire transfer cannot succeed on a node that\'s separated from the rest of the cluster — there\'s no way to know if a duplicate transfer is happening on the other side. The right answer during a partition is "service temporarily unavailable, please retry". This is why financial systems lean strongly CP — wrong answers are catastrophic.',
    },
    {
      title: 'AP: Choose Availability Over Consistency',
      icon: '🌐',
      layman:
        'When the network breaks, both sides keep answering — using whatever local data they have. They might give slightly different answers temporarily; once the network heals, they reconcile. Used by social feeds, shopping carts, content sites — places where stale or mildly inconsistent data is fine.',
      technical:
        'During a partition, all nodes continue to accept reads and writes. After the partition heals, conflicting writes are resolved (last-write-wins by timestamp, vector clocks, CRDTs, application-level merge logic). Examples: Cassandra, DynamoDB (default), Riak, CouchDB. Most NoSQL databases lean AP because they were built for global-scale always-on workloads.',
      example:
        'Amazon\'s shopping cart famously chooses AP. Suppose your laptop is in a cart on one server; you add a book on another server during a partition. After healing, the system merges — your cart now has both items (rather than refusing the add or losing one). The merge logic is application-specific; the design choice was conscious.',
    },
    {
      title: 'CA: A Misleading Category',
      icon: '⚠️',
      layman:
        'CA — consistency and availability without partition tolerance — sounds great, but in any real distributed system you can\'t avoid network partitions. They WILL happen. So CA isn\'t really a choice in practice; it\'s what you get with a single non-distributed system.',
      technical:
        'Network partitions are not optional in distributed systems — they\'re a fact of physical networks. Eric Brewer (who formulated CAP) and others have clarified: in a real distributed system, you must tolerate partitions, so you\'re always choosing between CP and AP during a partition. "CA" is a useful label only for single-node systems (one Postgres, one Redis instance).',
      example:
        'A single MySQL server with no replicas is "CA" — consistent, available, no partitions because there\'s nothing to partition. The moment you add a replica or use sharding, partitions become possible and you must pick a behaviour. The CAP discussion only kicks in for genuinely distributed systems.',
    },
    {
      title: 'PACELC: A More Useful Refinement',
      icon: '🔄',
      layman:
        'CAP only covers what happens during a partition. But what about the 99.999% of the time when there\'s no partition? PACELC adds: even without a partition (Else), there\'s a trade-off between Latency and Consistency. Pure consistency requires waiting for confirmations; pure low latency means accepting stale reads.',
      technical:
        'PACELC: in case of Partition, choose A or C (PA/PC); Else, choose L or C (EL/EC). So a database can be PA-EL (Cassandra: avail during partition, low-latency normally), PA-EC (rare), PC-EL (some configurations), PC-EC (traditional RDBMS with sync replication). Captures the common-case latency cost of stronger consistency, which CAP ignores.',
      example:
        'DynamoDB defaults to PA-EL: during partitions, stays available; normally, low-latency reads from any replica (eventually consistent). Strongly-consistent reads are an opt-in flag (more expensive, slightly higher latency). This is the right framing for picking databases — the partition behaviour is one decision; the everyday latency-consistency trade-off is another.',
    },
    {
      title: 'Tunable Consistency',
      icon: '🎚️',
      layman:
        'Most modern AP-leaning databases let you ask for stronger consistency on individual operations when you need it, accepting the latency cost. So one database can be AP for most ops and CP for the few that need it. The design is a slider, not a binary choice.',
      technical:
        'Per-operation tuning of read/write quorums. With N replicas, R+W > N gives strong consistency for that operation. Examples: Cassandra ANY/ONE/QUORUM/ALL knobs; DynamoDB consistent-read flag; MongoDB read/write concerns. Trade-off: stronger consistency = higher latency, lower availability under partial failures. Apps choose per query.',
      example:
        'A retailer might run product catalog reads with eventual consistency (fast, AP) but inventory decrement at checkout with strong consistency (slow, CP). Same database, different operations, different consistency. Tunable consistency is what makes this practical.',
    },
    {
      title: 'CAP Misunderstandings',
      icon: '🤔',
      layman:
        'Common misreading: "CAP says you can only have 2 of 3, so pick 2." Wrong. CAP says: when a partition happens, you must pick between consistency and availability. You always have partition tolerance (because partitions happen anyway), and outside of partitions you have both consistency and availability.',
      technical:
        'Eric Brewer\'s 2012 paper clarified: "CAP isn\'t really 2 of 3" — it\'s a constraint that emerges only during partitions, and most systems can have full C and A in normal operation. The "choose 2" reading misses the temporal aspect: trade-offs happen at the partition boundary, and tunable consistency lets the trade-off be made per-request.',
      example:
        'Cassandra is often labelled "AP", but during normal operation (no partitions), it can serve strongly-consistent reads via QUORUM consistency and is fully available — that\'s effectively all three. The label "AP" describes its behaviour during partitions specifically. Treating CAP as a static classification of databases misses how they actually work in practice.',
    },
  ],

  comparison: {
    caption: 'CAP & PACELC behaviours of common databases.',
    columns: ['Database', 'Partition behaviour (CAP)', 'Normal-time choice (PACELC)', 'Notes'],
    rows: [
      ['Postgres (single node)', 'CA',         'CA',           'No partition possible — single node.'],
      ['Postgres (sync replica)', 'CP',         'PC-EC',        'Sync replication blocks on partition.'],
      ['Postgres (async replica)', 'PA',        'PA-EL',        'Replica may be stale; tunable.'],
      ['MySQL (Galera)',          'CP',         'PC-EC',         'Quorum-based; minority partition errors.'],
      ['DynamoDB (default)',      'PA',         'PA-EL',         'Eventual consistency by default.'],
      ['DynamoDB (consistent read)', 'PC',     'PC-EC',         'Opt-in strong reads; higher latency.'],
      ['Cassandra',               'PA / tunable', 'PA-EL / tunable', 'Per-query consistency level.'],
      ['ZooKeeper / etcd',        'CP',         'PC-EC',          'Consensus-based; minority unavailable.'],
      ['Redis (replicated)',      'PA',         'PA-EL',          'Async by default; tunable.'],
      ['CockroachDB / Spanner',   'CP',         'PC-EC',          'Strong consistency via consensus + clocks.'],
    ],
  },

  realWorldExamples: [
    {
      company: 'Google Spanner',
      icon: '🌐',
      description:
        'A genuinely globally distributed database that aims for strong consistency. Achieves it via TrueTime — atomic clocks and GPS in datacenters — bounding clock uncertainty. Strongly CP under the hood, with 99.999% availability via massive redundancy. Famous for "breaking" the perceived AP-only constraint at global scale.',
    },
    {
      company: 'Amazon DynamoDB',
      icon: '⚡',
      description:
        'Influential AP-leaning system inspired by Amazon\'s Dynamo paper. Defaults to eventual consistency with tunable strong reads. Massively scalable and highly available globally. Powers Amazon\'s shopping cart and many AWS-internal services.',
    },
    {
      company: 'Apache Cassandra',
      icon: '🪶',
      description:
        'AP database with tunable consistency. Used at Netflix, Apple, Uber for internet-scale workloads where availability across regions is non-negotiable. Per-query consistency knobs let it lean CP when needed.',
    },
    {
      company: 'Bank ledger systems',
      icon: '🏦',
      description:
        'Always CP. Wrong balances are unacceptable; brief unavailability during partitions is. Built on consensus protocols (Raft for active-active replication) or carefully-designed eventually-consistent designs with reconciliation processes. Regulators essentially mandate the CP choice.',
    },
  ],

  interviewQuestions: [
    {
      question: 'Explain the CAP theorem in your own words.',
      answer:
        'In a distributed system that can experience network partitions (which all of them do, eventually), you cannot simultaneously guarantee Consistency (every read sees the latest write) AND Availability (every request gets a non-error response) during a partition. You must pick one. Concretely: when nodes can\'t talk to each other, either some nodes refuse requests until they regain contact (consistent but unavailable) or all nodes keep answering with potentially divergent data (available but inconsistent). The "CAP" naming is misleading because it suggests a 3-way choice; it\'s really a binary choice (C or A) that surfaces during partitions.',
    },
    {
      question: 'When would you choose AP over CP and vice versa?',
      answer:
        'AP fits where stale or slightly divergent data is acceptable: social feeds (showing yesterday\'s like count is fine), shopping carts (you can merge later), content sites (cache for a few seconds is OK), product catalogues, recommendations. AP wins when uptime is paramount and reads are far more common than mutations. CP fits where wrong answers are unacceptable: financial transactions (account balances, ledgers), inventory at checkout (don\'t double-sell the last item), unique-username enforcement, leader election in consensus systems, anything coordinating shared state with hard invariants. CP accepts brief unavailability during partitions in exchange for never being wrong. Many real systems are hybrid: AP for cheap reads, CP for the few critical mutations.',
    },
    {
      question: 'Why is "CA" usually a misleading classification?',
      answer:
        'CA means "consistent and available without tolerating partitions" — but in real distributed systems, network partitions happen whether you tolerate them or not. They\'re physical events: switch failures, cable cuts, congestion, bugs. So in practice CA only describes single-node systems where there\'s nothing to partition (one Postgres instance). Any genuinely distributed system that claims CA is either making implicit decisions about how to behave during partitions (which silently means CP or AP) or lying. Eric Brewer\'s clarifications emphasised this — the meaningful CAP discussion is between CP and AP, with partition tolerance assumed.',
    },
    {
      question: 'Explain PACELC and why it\'s more useful than CAP.',
      answer:
        'PACELC adds a missing piece: CAP only describes behaviour during partitions, but what about the 99.99% of normal operation? PACELC says — in case of Partition, choose A or C (PA / PC); Else, choose Latency or Consistency (EL / EC). It captures the common-case trade-off CAP ignores: stronger consistency requires waiting for replica confirmations, which raises latency. So a database\'s behaviour is two decisions, not one. Cassandra is PA-EL (available during partition, low-latency normally with eventual consistency). Spanner is PC-EC (consistent during partition, accepts higher latency normally for strong consistency). These two decisions matter a lot more for picking a database than the single CAP letter.',
    },
    {
      question: 'How can a database be both AP and CP at different times?',
      answer:
        'Through tunable consistency. With N replicas, an operation that requires R reads + W writes where R + W > N gives strong consistency for THAT operation. Same system, different ops, different consistency. Cassandra exposes this directly: every read/write specifies a consistency level (ANY, ONE, QUORUM, ALL). DynamoDB has a "ConsistentRead" flag. MongoDB has read/write concerns. So a product catalogue read might use ONE (AP, fast) while inventory decrement at checkout uses QUORUM (CP, slower but correct). The database itself is both AP and CP — the application chooses per query. This is the modern reality; treating databases as statically AP or CP misses the flexibility.',
    },
    {
      question: 'Google Spanner claims to be globally consistent and highly available — does it violate CAP?',
      answer:
        'No, but it cleverly minimises the visible cost. CAP still applies: during a partition, Spanner is CP — minority partitions can\'t commit. What\'s special is how rarely a "partition" is visible to applications. Spanner uses TrueTime (synchronised atomic clocks + GPS in datacenters) to bound clock uncertainty to a few milliseconds, plus consensus across many globally-distributed replicas. The result: most "partitions" are detected and resolved within milliseconds; minority sides briefly stall rather than serve incorrect data. Combined with extreme redundancy (5+ replicas across regions), the perceived availability is 99.999%+ even though it\'s a strict CP system. The lesson: CAP is a constraint at the partition moment; engineering can shrink that moment to be invisible most of the time.',
    },
    {
      question: 'Are eventually-consistent systems always wrong for financial use cases?',
      answer:
        'Not always. The right framing: financial accounting requires consistency at certain bounded points, not necessarily linearizability moment-to-moment. Examples: end-of-day reconciliation can accept eventually-consistent intra-day data. Idempotent transaction submission can be eventually consistent (Stripe accepts a payment, eventually all replicas agree). Audit logs can be eventually consistent because correctness comes from append-only immutability, not real-time consistency. The wrong use case for eventual consistency: real-time balance display when subsequent decisions depend on it (showing a customer their available credit before approving a charge). Financial systems often use CP for the critical paths (the ledger writes) and AP for everything else (dashboards, search, analytics).',
    },
  ],

  commonMistakes: [
    'Treating CAP as a 3-way "pick 2" choice — it\'s really a 2-way choice (C or A) that surfaces during partitions.',
    'Labelling databases statically as "AP" or "CP" — most modern databases are tunable per-query.',
    'Believing a single-node database is CA in any meaningful distributed sense — it just doesn\'t have partitions yet.',
    'Confusing CAP\'s "C" (linearizability) with ACID\'s "C" (constraints) — totally different concepts that share a letter.',
    'Ignoring PACELC — the latency-vs-consistency trade-off in normal operation matters more day-to-day than the partition behaviour.',
    'Reaching for AP databases without designing reconciliation — eventual consistency requires the application to handle conflicts.',
    'Assuming "CP means the system goes down during partitions" — minority sides go down; the majority side keeps serving.',
  ],
};
