import type { ConceptDeepDive } from '../../types';

export const consistencyModels: ConceptDeepDive = {
  moduleId: 'consistency-models',
  tagline: 'A spectrum of guarantees about what reads can see',

  introduction: {
    layman:
      'Consistency models describe what a distributed system promises about reads after writes. The strongest: every read sees the most recent write, instantly, everywhere. The weakest: writes propagate eventually, and reads may see anything in between. The interesting middle ground has many subtle variations, and picking the right one for each piece of your system is a core design skill. Stronger models are easier to reason about but cost latency, availability, or both.',
    analogy:
      'Think about how news reaches different friends after you tell one of them. Strong consistency: the moment you tell anyone, everyone in your group instantly knows. Costs energy (you have to broadcast). Eventual consistency: you tell one friend; they\'ll pass it along over the next few hours. Cheap, but for a while different friends know different things. Causal consistency: anyone who knows the gossip also knows whatever you knew before — the order of cause and effect is preserved, even if specific timestamps disagree.',
    whyMatters:
      'Almost every system design interview reaches a moment where the interviewer asks "what consistency guarantee does this need?" Knowing the spectrum — and being able to argue why eventual consistency is fine for likes but not balances — is foundational. In real engineering, picking the right model per operation is the difference between a system that scales and one that\'s either too slow or quietly buggy.',
  },

  subTopics: [
    {
      title: 'Strong Consistency (Linearizability)',
      icon: '🔒',
      layman:
        'Once a write completes, every subsequent read anywhere returns that write or something newer. There\'s a single global timeline of operations. Easy to reason about — exactly like a single non-distributed system. Costs: latency (writes wait for confirmation), availability (CP under partition).',
      technical:
        'Linearizability: there exists a total order over all operations consistent with real-time order. Implemented by consensus protocols (Raft, Paxos, ZAB) or by waiting for synchronous replication to a majority. Strongest realistic guarantee. Cost: write latency = round-trip to majority of replicas (potentially cross-region).',
      example:
        'etcd, ZooKeeper, Spanner, single-leader Postgres with synchronous replication. These systems serialise writes through a leader; reads either go through the leader (fully linearizable) or to followers with caveats. Use them for primary-key uniqueness, leader election, distributed locks, configuration metadata.',
    },
    {
      title: 'Sequential Consistency',
      icon: '📜',
      layman:
        'All operations happen in some single order (everyone agrees on it), and each client\'s operations appear in the order they issued them. Slightly weaker than linearizability — there\'s no real-time guarantee, so the order doesn\'t have to match wall-clock time. Easier to implement than full linearizability.',
      technical:
        'Operations form a total order; per-process program order is preserved. Different from linearizability: the order doesn\'t have to respect real-time. So if A finishes before B starts (in real time), B could still appear before A in the order. In practice rarely the model picked deliberately — most systems either go all the way to linearizability or settle for weaker.',
      example:
        'Some shared-memory systems and academic protocols. Mostly a useful conceptual stopover — interview answers should mention it as a step on the consistency ladder but few production databases stop here intentionally.',
    },
    {
      title: 'Causal Consistency',
      icon: '🔗',
      layman:
        'Operations that have a cause-and-effect relationship are seen in the right order by everyone. Independent operations can be seen in any order. Weaker than total order, much cheaper, often "feels right" to users — comments appear after the post they\'re replying to, even though unrelated posts might shuffle.',
      technical:
        'Causally-related ops (one happened-before another) are observed in causal order; concurrent ops can be reordered. Tracked via vector clocks or version vectors. Achievable without consensus — much cheaper than linearizability. Used in chat systems, collaborative editing, version control.',
      example:
        'A comment on a Facebook post: causal consistency ensures everyone sees the post before the comment, but two unrelated comments might appear in different orders for different viewers. That\'s fine — what would be confusing is seeing a reply to a comment that hasn\'t appeared yet.',
    },
    {
      title: 'Read-Your-Writes',
      icon: '👤',
      layman:
        'After you write something, you see it in your subsequent reads — even if other users haven\'t seen it yet. Probably the minimum users notice. Without it, you change your profile photo, refresh, and see the old one. Confusing and feels broken.',
      technical:
        'Single-client guarantee: a process always reads its own writes back. Achievable cheaply by routing a client\'s reads to a replica that has its writes (sticky sessions to leader for a window after writing) or by tracking write timestamps and reading from a sufficiently up-to-date replica. Doesn\'t require global synchronisation.',
      example:
        'Most user-facing systems (Twitter, Facebook, Gmail) implement read-your-writes for the writer specifically. You post a tweet — you immediately see it on your feed even if other users\' replicas haven\'t caught up. The implementation often pins the writer briefly to a leader replica or annotates their session with a timestamp.',
    },
    {
      title: 'Monotonic Reads',
      icon: '⬆️',
      layman:
        'Successive reads from a single client never go back in time. If you saw "10 likes" on a post, you should never refresh and see "8 likes" on the same post (unless something was actually deleted). Without it, reads bouncing between replicas can show data appearing and disappearing.',
      technical:
        'For a single client, each subsequent read sees a state at least as recent as the previous read. Implemented by sticky sessions (route a client to the same replica) or by tracking the latest version a client has observed and ensuring subsequent reads come from a replica that\'s caught up at least to that version.',
      example:
        'Without monotonic reads: a user reads from replica A (v15), then from replica B (still at v12). They see counts go backwards, items reappear, etc. Confusing and feels buggy. Sticky-session routing or version-aware reads fix this cheaply.',
    },
    {
      title: 'Eventual Consistency',
      icon: '⏳',
      layman:
        'Without further updates, all replicas eventually agree. No promise about when "eventually" happens — could be milliseconds, could be seconds. During that window, different clients can see different versions. Cheapest, fastest, most available. The default for many global systems.',
      technical:
        'No upper bound on replication delay; convergence guaranteed only in the absence of new writes. Conflict resolution required: last-write-wins (timestamp-based), vector clocks (preserve concurrent writes for app-level merge), CRDTs (mathematically guaranteed to converge to a consistent answer regardless of order).',
      example:
        'DNS is famously eventually consistent: update an A record and it propagates over hours as caches expire. Your follower count on Twitter, your S3 object visibility, your DynamoDB read after a write all are eventually consistent by default. For most user-facing data this is fine; for money it\'s not.',
    },
    {
      title: 'Strong vs Eventual: The Real-World Trade-off',
      icon: '⚖️',
      layman:
        'Strong consistency: easy to reason about, slow, lower availability. Eventual consistency: fast, highly available, hard to reason about until you stop expecting it to work like a single machine. Most real systems use a mix — strong for the few critical operations, eventual for everything else.',
      technical:
        'Strong consistency adds latency (write must reach majority) and reduces availability (during partition, minority can\'t serve). Eventual consistency keeps writes fast and any node serving reads but exposes anomalies (read-after-write surprises, conflicts on concurrent writes). Mitigations for eventual: client-side version vectors, application-level reconciliation logic, CRDTs for conflict-free merges.',
      example:
        'Banking apps: balance display is often eventually consistent (a few seconds of lag is fine), but a transfer is strongly consistent at the ledger level. Same app, two consistency models, chosen per operation. The art is knowing which operations get which.',
    },
    {
      title: 'Conflict Resolution Strategies',
      icon: '🤝',
      layman:
        'Eventual consistency means concurrent writes can conflict — two users edit the same field on different replicas, both succeed locally. When the writes meet, who wins? You need a rule. Several rules exist; pick based on what feels right for the data type.',
      technical:
        'Last-write-wins (LWW) by timestamp: simple but loses data on concurrent writes; relies on synchronised clocks. Vector clocks: detect concurrent writes; surface to application for manual merge. CRDTs (Conflict-free Replicated Data Types): mathematically commutative operations — counters, sets, lists with provable convergence. Application-merge: domain-specific logic (cart-add merge keeps both items; chat-message merge orders by timestamp and uses tiebreakers).',
      example:
        'Google Docs uses operational transformation (and now CRDTs) to merge concurrent edits seamlessly. Amazon\'s shopping cart uses application-level merge (concurrent adds keep both items rather than picking one). Cassandra defaults to last-write-wins by timestamp, with the well-known caveat about clock skew.',
    },
    {
      title: 'CRDTs: Conflict-Free Data Types',
      icon: '✨',
      layman:
        'A CRDT is a data structure designed so concurrent updates can be merged automatically — no application logic, no manual conflict resolution. The math guarantees that all replicas converge to the same state regardless of order or duplication. Powerful for collaborative editing, counters, distributed sets.',
      technical:
        'Two flavours: state-based (CvRDTs — replicas exchange entire state, merge with a join function) and operation-based (CmRDTs — replicas exchange operations, requires reliable broadcast). Common types: G-Counter (grow-only counter), PN-Counter (increment/decrement), G-Set (grow-only set), OR-Set (observed-remove set), LWW-Register, RGA (replicated growable array — for ordered lists).',
      example:
        'Redis Conflict-Free Replicated Data Types (Active-Active in Redis Enterprise), Riak\'s CRDT support, Yjs and Automerge libraries powering collaborative editors. Figma and Linear use CRDTs to enable real-time multiplayer editing without conflict-prompting users.',
    },
  ],

  comparison: {
    caption: 'The consistency ladder, from strongest to weakest.',
    columns: ['Model', 'Guarantee', 'Implementation Cost', 'Typical Use'],
    rows: [
      ['Linearizable',     'Single global order matching real-time',         'Consensus, sync replication',     'Locks, leader election, balances'],
      ['Sequential',       'Single global order (not real-time)',            'Total order broadcast',           'Rare in production'],
      ['Causal',           'Cause-and-effect order preserved',                'Vector clocks',                   'Chat, collaborative editing'],
      ['Read-your-writes', 'Client sees own writes back',                     'Sticky sessions or versioning',   'Almost every user-facing app'],
      ['Monotonic reads',  'Reads never go backwards',                        'Sticky sessions or versioning',   'Feeds, counters, dashboards'],
      ['Eventual',         'Convergence given no new writes',                 'Async replication',               'DNS, S3, social-feed counts'],
    ],
  },

  realWorldExamples: [
    {
      company: 'Google Spanner',
      icon: '🌐',
      description:
        'External / linearizable consistency at global scale. Achieves it via TrueTime (atomic-clock-bounded uncertainty) and Paxos consensus across regions. The price: every write waits for cross-region consensus (~10-100ms typical). Used at Google for ad accounting, where strong consistency is non-negotiable.',
    },
    {
      company: 'AWS DynamoDB',
      icon: '⚡',
      description:
        'Eventual consistency by default for low-latency reads from any replica; strongly-consistent reads available as an opt-in flag (higher latency, slightly less available). Each application picks the right consistency per operation — exemplifies the modern tunable model.',
    },
    {
      company: 'Apache Cassandra',
      icon: '🪶',
      description:
        'Tunable consistency level per query: ANY, ONE, QUORUM, ALL. Same database can serve eventually-consistent reads (fast, AP-leaning) and strongly-consistent ones (slower, CP). Conflict resolution defaults to last-write-wins by timestamp; lightweight transactions provide linearizability for specific ops.',
    },
    {
      company: 'Figma & Linear',
      icon: '🎨',
      description:
        'Real-time collaborative editing built on CRDTs. Multiple users edit the same document concurrently; CRDTs merge changes automatically and deterministically. Eventual consistency that feels instant because conflict resolution is mathematical, not user-prompted.',
    },
  ],

  interviewQuestions: [
    {
      question: 'What is the difference between linearizability and serializability? They sound similar.',
      answer:
        'Both are strong consistency notions but they apply to different things. Linearizability is about single-object operations across distributed replicas — it guarantees there\'s a real-time-respecting global order over operations on a single object. Serializability is about multi-object transactions — it guarantees that the result of executing transactions concurrently is equivalent to some serial order. Many transactional databases give serializability without strict linearizability: a transaction commits "as if" it were serial, but the order doesn\'t have to match wall-clock time. Strict serializability combines both: serializable AND respecting real-time order. For interview purposes: linearizability ≈ "single-object strongest"; serializability ≈ "multi-object transactional correctness".',
    },
    {
      question: 'Walk me through what eventual consistency means and when it\'s acceptable.',
      answer:
        'Eventual consistency: in the absence of new updates, all replicas eventually converge to the same state. No bound on "eventually" — could be milliseconds, could be minutes. During the convergence window, different clients can see different versions of the same data. Acceptable when: reads can be slightly stale without breaking correctness (social feeds, like counts, recommendations), writes are infrequent and rarely conflict (S3 metadata, DNS), the application can tolerate brief inconsistency (shopping carts that auto-merge, chat history catch-up). NOT acceptable when: subsequent decisions depend on absolute correctness (account balance before authorising a charge), invariants must hold (unique usernames), real-time accuracy is essential (auction final-price). Modern systems use eventual consistency for most data and reach for stronger consistency only where required.',
    },
    {
      question: 'What is "read-your-writes" consistency, and why is it the bare minimum users expect?',
      answer:
        'Read-your-writes (RYW) guarantees a single client always sees their own writes when they read back, even if other clients haven\'t observed those writes yet. Without RYW, a user changes their profile photo, refreshes, and sees the old one — feels broken. Most user-facing systems implement RYW even when they\'re otherwise eventually consistent for everyone else. Implementation: cheap. Common patterns: (1) Stick the writing client to the same replica or shard for a window after their write. (2) Send a write timestamp / version with the client\'s session, ensure subsequent reads come from a replica caught up to that version. (3) Read from leader for a brief period after writing. RYW is single-client; it doesn\'t cost global coordination. Almost every consumer-facing system gets this right.',
    },
    {
      question: 'What is causal consistency, and what does it offer over eventual?',
      answer:
        'Causal consistency preserves cause-and-effect order across all clients. If event B was caused by event A (i.e., the writer of B had observed A), then everyone observes A before B. Independent (concurrent) events can appear in any order. Stronger than eventual but weaker than total order — and crucially, achievable without global consensus. Why it matters: feels right to humans. Comments appear after the post they reply to. A reply to a message comes after the message. A like on a comment shows up after the comment exists. Eventual consistency would allow weird inversions (seeing a reply before its parent), which feels broken. Implementation: vector clocks or causal session tokens. COPS, Eiger, and other research systems formalised this; many modern systems implement it for chat / collaborative scenarios.',
    },
    {
      question: 'Explain CRDTs and when you\'d use them.',
      answer:
        'CRDT = Conflict-free Replicated Data Type. A data structure designed so concurrent updates from multiple replicas always converge to the same state regardless of order or duplicate delivery — without coordination. The math is in the merge function: it must be commutative, associative, and idempotent. Common types: G-Counter (only increases), PN-Counter (increments and decrements via two counters), Grow-only Set, Observed-Remove Set, Last-Write-Wins Register, RGA (replicated growable array for ordered lists). When to use: collaborative editing (Figma, Linear, Google Docs), distributed counters (likes, views), shopping carts, IoT data aggregation. Trade-offs: limited to data types where commutativity is achievable; metadata can grow over time (tombstones in OR-Sets); not all operations are CRDT-friendly (you can\'t have arbitrary atomic transactions on CRDTs). When they fit, they fit beautifully — eventual consistency that "just works".',
    },
    {
      question: 'How would you choose a consistency model for different parts of an e-commerce system?',
      answer:
        'Mix and match. Product catalogue (browse pages): eventual consistency, served from CDN/cache. Stale-by-seconds is fine. Shopping cart: eventual with merge logic on conflict (concurrent adds keep both items). Inventory display ("X in stock"): eventually consistent reads, with a final check at checkout. Inventory decrement at checkout: strong consistency — must not double-sell the last item. Payment processing: strong consistency + idempotency keys for retry safety. Order history: read-your-writes (user sees their just-placed order immediately) + eventual for everyone else. Search/recommendations: eventual, often hours stale. The principle: identify operations where wrong answers cause real harm (money movement, inventory, identity uniqueness) → use strong consistency. Everything else → eventual is faster, more available, and good enough.',
    },
    {
      question: 'What\'s the typical cost of moving from eventual to strong consistency?',
      answer:
        'Three costs, in order of usual impact. (1) Latency: writes must wait for confirmation from a quorum of replicas, often cross-region. Adds 10-100ms to every write depending on geography. (2) Availability: during a partition, minority sides can\'t serve writes (CP behaviour). Brief but noticeable in incident scenarios. (3) Throughput: contention on shared keys becomes worse because operations serialise. (4) Engineering complexity: consensus protocols (Raft, Paxos) require careful operational practice, leader election handling, and debugging. Many systems reach for strong consistency only on the few operations that need it (uniqueness constraints, money) and use eventual everywhere else. The pattern that scales: per-operation consistency level rather than database-wide.',
    },
  ],

  commonMistakes: [
    'Treating consistency as binary (strong vs eventual) — there\'s a spectrum and most systems pick per-operation.',
    'Picking strong consistency by default — pays massive latency/availability tax for use cases that don\'t need it.',
    'Picking eventual consistency without designing reconciliation — concurrent writes will conflict; have a strategy.',
    'Forgetting read-your-writes — users notice when their own writes don\'t appear immediately to themselves.',
    'Confusing CAP\'s "consistency" (linearizability) with ACID\'s "consistency" (constraints) — different things, same word.',
    'Using last-write-wins on data that has real concurrent semantics — silently drops updates you didn\'t mean to lose.',
    'Believing eventual consistency means "really fast strong consistency" — it\'s a fundamentally different guarantee with real correctness implications.',
  ],
};
