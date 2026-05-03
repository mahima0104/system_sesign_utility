import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import StepAnimation from '../components/Common/StepAnimation';
import InteractiveCode from '../components/Patterns/InteractiveCode';
import KafkaArchitecture from '../components/Kafka/KafkaArchitecture';
import PartitioningDemo from '../components/Kafka/PartitioningDemo';
import ConsumerGroupDemo from '../components/Kafka/ConsumerGroupDemo';
import ReplicationDemo from '../components/Kafka/ReplicationDemo';
import AcksDemo from '../components/Kafka/AcksDemo';
import CompactionDemo from '../components/Kafka/CompactionDemo';
import type { PatternStep, PatternVisualization } from '../types';

interface SectionProps {
  num: number;
  icon: string;
  title: string;
  children: React.ReactNode;
  delay?: number;
}

function Section({ num, icon, title, children, delay = 0 }: SectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-mono text-gray-600 font-medium">
          {String(num).padStart(2, '0')}
        </span>
        <h2 className="flex items-center gap-2 text-xl font-bold text-white">
          <span>{icon}</span>
          {title}
        </h2>
      </div>
      <div className="pl-6">{children}</div>
    </motion.section>
  );
}

// Visualization data for the lifecycle step animation in section 5
const lifecycleViz: PatternVisualization = {
  caption: 'A message\'s journey from producer to consumer.',
  entities: [
    { id: 'p', label: 'Producer', x: 12, y: 50, icon: '✍️', color: '#60a5fa' },
    { id: 'b', label: 'Broker', x: 38, y: 50, icon: '🏢', color: '#2563eb' },
    { id: 'pa', label: 'Partition', x: 62, y: 50, icon: '📂', color: '#a78bfa' },
    { id: 'd', label: 'Disk', x: 62, y: 88, icon: '💾', color: '#7c3aed' },
    { id: 'c', label: 'Consumer', x: 88, y: 50, icon: '📖', color: '#34d399' },
  ],
  relations: [
    { from: 'p', to: 'b', label: 'send' },
    { from: 'b', to: 'pa', label: 'route' },
    { from: 'pa', to: 'd', label: 'persist' },
    { from: 'pa', to: 'c', label: 'fetch' },
  ],
};

const lifecycleSteps: PatternStep[] = [
  {
    title: '1. Producer creates a message',
    description:
      'Your app builds a message — a JSON event, a sensor reading, a user action. The producer library serializes it and sends it to Kafka over the network.',
    highlight: ['p'],
  },
  {
    title: '2. Broker receives and routes it',
    description:
      'A Kafka broker accepts the message and figures out which partition it belongs in (using the message\'s key, or round-robin if no key).',
    highlight: ['p', 'b'],
  },
  {
    title: '3. Message is appended to a partition',
    description:
      'The broker adds the message to the end of the chosen partition\'s log. New messages go to the back of the line — like adding to a notebook page.',
    highlight: ['b', 'pa'],
  },
  {
    title: '4. Persisted to disk + replicated',
    description:
      'The message is written to disk (so it survives crashes) and copied to follower brokers for backup. Producers get an acknowledgement.',
    highlight: ['pa', 'd'],
  },
  {
    title: '5. Consumer fetches the message',
    description:
      'The consumer pulls messages from the partition starting from where it left off. It processes the message, then commits its position so it doesn\'t reread.',
    highlight: ['pa', 'c'],
  },
];

const COMPONENTS = [
  { icon: '✍️', name: 'Producer', desc: 'Application that sends messages to Kafka.' },
  { icon: '📖', name: 'Consumer', desc: 'Application that reads messages from Kafka.' },
  { icon: '📚', name: 'Topic', desc: 'A named stream of messages — like a channel or category.' },
  { icon: '📂', name: 'Partition', desc: 'A topic split into ordered logs for parallel reads/writes.' },
  { icon: '🏢', name: 'Broker', desc: 'A Kafka server. A cluster has many brokers working together.' },
  { icon: '🔢', name: 'Offset', desc: 'A consumer\'s bookmark — which message it has read up to.' },
  { icon: '👥', name: 'Consumer Group', desc: 'A team of consumers that share work on a topic.' },
  { icon: '🛡️', name: 'Replication', desc: 'Multiple copies of each partition for fault tolerance.' },
];

const USE_CASES = [
  {
    company: 'LinkedIn',
    icon: '💼',
    description:
      'Where Kafka was born (2011). Originally built to track every user action across the site for activity feeds, analytics, and search indexing — millions of events per second.',
  },
  {
    company: 'Netflix',
    icon: '🎬',
    description:
      'Streams telemetry from hundreds of millions of devices for personalisation, billing, and operational dashboards. Kafka moves trillions of messages per day.',
  },
  {
    company: 'Uber',
    icon: '🚗',
    description:
      'GPS pings from drivers and riders, trip events, surge pricing signals — all flow through Kafka so analytics, fraud detection, and pricing react in seconds.',
  },
  {
    company: 'Spotify',
    icon: '🎧',
    description:
      'Tracks every song play, skip, like, and search to power recommendations and "Wrapped". The same events feed analytics, ML training, and royalty calculations.',
  },
  {
    company: 'Goldman Sachs',
    icon: '🏦',
    description:
      'Distributes market data and trade events between systems. Replay capabilities let them reconstruct any historical state for compliance and back-testing.',
  },
  {
    company: 'Airbnb',
    icon: '🏠',
    description:
      'Search events, booking events, host actions — all published to Kafka. Different teams subscribe to the same stream for very different use cases.',
  },
];

const FAILURES = [
  {
    icon: '💥',
    title: 'A broker crashes',
    body: 'Kafka detects it, automatically promotes a replica to leader, and producers/consumers reroute. Data is safe because partitions are replicated to multiple brokers.',
  },
  {
    icon: '🚪',
    title: 'A consumer crashes',
    body: 'Its partitions get reassigned to surviving consumers in the same group. The new owner picks up exactly where the dead consumer left off, using the committed offset.',
  },
  {
    icon: '🌐',
    title: 'A network blip',
    body: 'Producers retry automatically with backoff. Idempotent producers prevent duplicate messages. Consumers may briefly fall behind but catch up once the network stabilises.',
  },
  {
    icon: '🐌',
    title: 'A consumer falls behind',
    body: 'Messages stay safely in Kafka (default 7 days). The consumer can catch up at its own pace — Kafka doesn\'t throw data away just because someone is slow.',
  },
];

const INTERVIEW_QUESTIONS = [
  {
    q: 'What is Kafka and why would I use it instead of a regular database or message queue?',
    a: 'Kafka is a distributed log — an append-only sequence of messages stored on disk and replicated across many servers. Unlike a database, it\'s optimised for high write/read throughput and replay; unlike a traditional queue (RabbitMQ, SQS), messages aren\'t deleted after one consumer reads them. Many independent consumers can read the same data, at their own pace, including replaying historical events. Use Kafka when you need: high throughput (millions of events/sec), durable retention (days/weeks), multiple independent readers, or replay for analytics/ML/audit.',
  },
  {
    q: 'How does Kafka guarantee message ordering?',
    a: 'Within a partition, messages are strictly ordered by offset — first written, first read. Across partitions, no ordering guarantee. So if you need strict order for a customer\'s events, use the customer ID as the message key. Kafka hashes the key and always sends the same key to the same partition, so all events for that customer flow through one ordered queue. The trade-off: a hot key (one VIP customer) can become a bottleneck since one partition = one consumer.',
  },
  {
    q: 'What\'s the difference between a partition and a consumer group?',
    a: 'A partition is a physical split of a topic — it lets you parallelise storage and reads. A consumer group is a logical team of consumer instances that share the work on a topic. Kafka assigns each partition to exactly one consumer in the group at a time. So if you have 6 partitions and 3 consumers in the group, each consumer reads from 2 partitions. With 6 consumers, each reads 1. With 7 consumers, one sits idle. Partitions limit your max parallelism.',
  },
  {
    q: 'What are exactly-once semantics, and how does Kafka achieve them?',
    a: 'Exactly-once means each message is processed once, regardless of retries or failures. Kafka achieves this through three things: (1) idempotent producers — duplicate sends are deduplicated by sequence numbers; (2) transactions — a producer can write to multiple partitions atomically; (3) read-process-write loops where the consumer\'s offset commit is part of the same transaction as its output writes. Important: exactly-once only works within Kafka. If your consumer writes to an external system (DB, email), you\'re back to at-least-once unless that system also supports idempotent writes.',
  },
  {
    q: 'What happens when a consumer can\'t keep up with the producer?',
    a: 'The "consumer lag" grows — the gap between latest produced offset and latest committed consumer offset. Kafka itself is fine; messages stay on disk for the retention period (typically 7 days). The risk is: if lag exceeds retention, old messages get deleted before the consumer reads them. Mitigations: (a) add more partitions and consumers to scale horizontally, (b) increase retention, (c) optimise the consumer (batch reads, parallel processing), (d) offload heavy work to a downstream queue.',
  },
  {
    q: 'When should I NOT use Kafka?',
    a: 'Kafka is overkill for low-volume request/response (use HTTP), small task queues (use Redis/SQS/RabbitMQ), or when you need complex routing with priorities and per-message TTL (RabbitMQ is better). It also has operational cost — running a Kafka cluster needs expertise. For under ~10k messages/second with simple needs, a managed queue is usually enough. Reach for Kafka when you have high throughput, multiple independent consumers, replay needs, or are building event-driven architectures at scale.',
  },
  {
    q: 'Explain the role of ZooKeeper and KRaft.',
    a: 'Historically, Kafka used ZooKeeper for cluster metadata: which brokers exist, which partitions live where, who is the leader. ZooKeeper added operational complexity (running a separate cluster), and was a single source of consistency bottlenecks. Starting with Kafka 2.8 and stabilising in 3.x, KRaft (Kafka Raft) replaces ZooKeeper with an internal Raft-based metadata quorum inside Kafka itself. New deployments should use KRaft mode. From a developer\'s perspective, nothing changes — APIs are the same. From an operator\'s perspective, one less moving part.',
  },
];

const METRICS = [
  { name: 'Throughput per broker', value: '500k–1M msg/s', notes: 'Depends heavily on message size and replication factor.' },
  { name: 'End-to-end latency', value: '5–50 ms', notes: 'Producer → broker → consumer round-trip in healthy clusters.' },
  { name: 'Retention', value: 'hours to forever', notes: 'Default 7 days; many teams keep critical streams indefinitely.' },
  { name: 'Replication factor', value: '3 (typical)', notes: 'Survives loss of 2 brokers without data loss.' },
  { name: 'Max partitions per cluster', value: '~200k (KRaft) / ~5k (ZK)', notes: 'KRaft greatly raises the ceiling.' },
  { name: 'Message size', value: '1 KB default, up to 1 MB', notes: 'Larger payloads should be stored externally (S3) and referenced.' },
];

export default function KafkaPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-7 mb-10 bg-gradient-to-br from-brand-500/10 via-purple-500/5 to-transparent border-brand-500/20"
      >
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gray-800 flex items-center justify-center text-4xl flex-shrink-0">
            🦅
          </div>
          <div className="flex-1">
            <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
              Distributed Systems · Beginner-Friendly
            </span>
            <h1 className="text-3xl font-bold text-white mt-1 mb-2">Apache Kafka</h1>
            <p className="text-gray-400 leading-relaxed">
              The plumbing behind LinkedIn, Netflix, Uber, and thousands of other companies. By the end of
              this page, you'll know what Kafka is, why it exists, and how the pieces fit together — even if
              you've never touched it before.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="space-y-12">
        {/* 1. What is Kafka? */}
        <Section num={1} icon="📖" title="What is Kafka?" delay={0.05}>
          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              <strong className="text-white">Apache Kafka is a system for moving data between applications.</strong>{' '}
              That's the one-line answer. The longer version: it's a high-throughput, durable log that lets
              one application write events and many other applications read them — at their own pace,
              independently, and without losing data even if servers crash.
            </p>
            <p>
              Imagine you're at a busy newspaper. Reporters write articles all day; the paper gets printed;
              copies are delivered to subscribers, libraries, and archives. Kafka plays the role of the
              printing press <em>and</em> the distribution system. Reporters (producers) hand in articles
              (messages); Kafka stores every issue safely; subscribers (consumers) read at their own
              pace — some daily, some weekly, some catching up on last month's editions.
            </p>
            <div className="rounded-2xl p-4 bg-yellow-500/5 border border-yellow-500/20">
              <p className="text-sm text-gray-200">
                <strong className="text-yellow-400">Plain-English version:</strong> Kafka is a smart bulletin
                board where apps can pin notes for other apps to read — durable, ordered, fast, and survives
                hardware failures.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { label: 'Created by', value: 'LinkedIn (2011)' },
                { label: 'Open-sourced', value: 'Apache project' },
                { label: 'Used at scale', value: '80% of Fortune 100' },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-gray-900/40 border border-gray-800 p-3">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide">{s.label}</div>
                  <div className="text-sm text-white font-semibold mt-0.5">{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* 2. Why Kafka Needed? */}
        <Section num={2} icon="❓" title="Why Kafka Needed?" delay={0.08}>
          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              In a small app, one service calls another directly: order service calls billing, billing calls
              email. Simple. But once you have <strong className="text-white">100 services</strong> and they
              all need to share data, direct calls become a tangled spaghetti — every change ripples through
              the whole system, one slow service drags everyone down, and replaying past events is nearly
              impossible.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
                <h4 className="text-red-400 font-semibold text-sm mb-2">😰 Without Kafka</h4>
                <ul className="space-y-1.5 text-xs text-gray-300">
                  <li>• Every service knows about every other service</li>
                  <li>• A slow service blocks everyone calling it</li>
                  <li>• Adding a new consumer means changing the producer</li>
                  <li>• Past events are lost — no way to replay</li>
                  <li>• One outage cascades through the system</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-4">
                <h4 className="text-green-400 font-semibold text-sm mb-2">😌 With Kafka</h4>
                <ul className="space-y-1.5 text-xs text-gray-300">
                  <li>• Producers don't know who reads</li>
                  <li>• Consumers don't know who produces</li>
                  <li>• Slow consumer? It catches up later — no one waits</li>
                  <li>• Add a new consumer any time, no producer changes</li>
                  <li>• Replay any event from the last N days</li>
                </ul>
              </div>
            </div>
          </div>
        </Section>

        {/* 3. Core Components */}
        <Section num={3} icon="🧩" title="Core Components" delay={0.1}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {COMPONENTS.map((c) => (
              <div key={c.name} className="card p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-xl flex-shrink-0">
                  {c.icon}
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm">{c.name}</h4>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* 4. Architecture Visualization */}
        <Section num={4} icon="🏛️" title="Architecture Visualization" delay={0.12}>
          <p className="text-sm text-gray-400 mb-4 leading-relaxed">
            Watch real messages flowing through a tiny Kafka cluster. Producers on the left send messages;
            the broker stores them in partitions; consumers on the right read them.
          </p>
          <KafkaArchitecture />
        </Section>

        {/* 5. Real-Time Animation */}
        <Section num={5} icon="🎬" title="Real-Time Animation: A Message's Journey" delay={0.14}>
          <p className="text-sm text-gray-400 mb-4 leading-relaxed">
            Click <strong className="text-brand-400">▶ Auto</strong> or step through manually to follow one
            message from your app all the way to the consumer.
          </p>
          <StepAnimation visualization={lifecycleViz} steps={lifecycleSteps} />
        </Section>

        {/* 6. Producer & Consumer Flow */}
        <Section num={6} icon="🔀" title="Producer & Consumer Flow" delay={0.16}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-5">
              <h4 className="text-blue-400 font-semibold text-sm mb-3 flex items-center gap-2">
                <span className="text-lg">✍️</span>
                Producer Side
              </h4>
              <ol className="space-y-2.5 text-xs text-gray-300 leading-relaxed">
                {[
                  'Build a message — usually a JSON or Avro object with a key and value.',
                  'Pick a topic to send it to (e.g. "orders", "user_events").',
                  'The producer client serializes the message and connects to a broker.',
                  'Broker decides which partition (using the key, or round-robin if no key).',
                  'Producer waits for an acknowledgement (or fires and forgets, depending on settings).',
                ].map((step, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="card p-5">
              <h4 className="text-green-400 font-semibold text-sm mb-3 flex items-center gap-2">
                <span className="text-lg">📖</span>
                Consumer Side
              </h4>
              <ol className="space-y-2.5 text-xs text-gray-300 leading-relaxed">
                {[
                  'Subscribe to one or more topics.',
                  'Join a consumer group — Kafka assigns specific partitions to this consumer.',
                  'Poll for messages — the broker returns batches starting from the consumer\'s last offset.',
                  'Process each message in your app code.',
                  'Commit the new offset, telling Kafka "I successfully processed up to here."',
                ].map((step, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Section>

        {/* 7. Partitioning */}
        <Section num={7} icon="📂" title="Partitioning" delay={0.18}>
          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              A topic is split into <strong className="text-white">partitions</strong> — independent ordered
              logs that can be read and written in parallel. Partitions are how Kafka scales:{' '}
              <strong className="text-white">more partitions = more parallelism</strong>.
            </p>
            <p>
              When you send a message with a <em>key</em>, Kafka hashes the key and uses{' '}
              <code className="text-pink-300 font-mono text-xs bg-gray-900 px-1.5 py-0.5 rounded">hash(key) % numPartitions</code>{' '}
              to pick a partition. Same key → same partition → ordering preserved for that key. No key →
              round-robin (good for balanced load, no ordering).
            </p>
            <PartitioningDemo />
          </div>
        </Section>

        {/* 8. Replication */}
        <Section num={8} icon="🛡️" title="Replication" delay={0.2}>
          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              Each partition has <strong className="text-white">N copies (replicas)</strong> spread across
              different brokers. One replica is the <strong className="text-red-400">leader</strong> — it
              handles all reads and writes. The others are <strong className="text-green-400">followers</strong>{' '}
              — they continuously copy the leader's log, ready to take over if it dies.
            </p>
            <p>
              Try killing the leader below — Kafka detects the failure and promotes a follower to leader
              within seconds. Producers automatically reroute to the new leader.
            </p>
            <ReplicationDemo />
          </div>
        </Section>

        {/* 9. Consumer Groups */}
        <Section num={9} icon="👥" title="Consumer Groups" delay={0.22}>
          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              A <strong className="text-white">consumer group</strong> is a team of consumer instances that
              divide a topic's partitions among themselves. Each partition goes to exactly one consumer in
              the group — no duplicate processing within the group.
            </p>
            <p>
              Add or remove consumers below to watch Kafka's <strong className="text-white">rebalance</strong>{' '}
              in action. Notice the limit: more consumers than partitions = wasted consumers (idle).
            </p>
            <ConsumerGroupDemo />
          </div>
        </Section>

        {/* 10. Offset Management */}
        <Section num={10} icon="🔢" title="Offset Management" delay={0.24}>
          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              Every message in a partition has a sequential <strong className="text-white">offset</strong>{' '}
              — 0, 1, 2, 3, … forever. Each consumer keeps a bookmark: <em>"I've read up to offset 47."</em>{' '}
              That bookmark is called the <strong className="text-white">committed offset</strong>, and it's
              stored in Kafka itself (in a special topic called <code className="text-pink-300 font-mono text-xs bg-gray-900 px-1.5 py-0.5 rounded">__consumer_offsets</code>).
            </p>
            <OffsetVisual />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div className="card p-4">
                <h4 className="text-white font-semibold text-sm mb-1.5">⚙️ Auto-commit</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Kafka commits the offset every few seconds automatically. Easy, but you might lose work if
                  the consumer crashes mid-batch (messages get reprocessed).
                </p>
              </div>
              <div className="card p-4">
                <h4 className="text-white font-semibold text-sm mb-1.5">✋ Manual commit</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  You commit explicitly after successfully processing each message (or batch). More work,
                  but precise control over at-least-once / exactly-once semantics.
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* 11. Failure Handling */}
        <Section num={11} icon="🛟" title="Failure Handling" delay={0.26}>
          <p className="text-sm text-gray-400 mb-4 leading-relaxed">
            Kafka is built assuming things will fail. Here's what happens — and what you don't have to do
            yourself.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FAILURES.map((f) => (
              <div key={f.title} className="card p-4">
                <h4 className="text-white font-semibold text-sm mb-1.5 flex items-center gap-2">
                  <span className="text-lg">{f.icon}</span>
                  {f.title}
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* 12. Real Industry Use Cases */}
        <Section num={12} icon="🏢" title="Real Industry Use Cases" delay={0.28}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {USE_CASES.map((u) => (
              <div key={u.company} className="card p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xl">{u.icon}</span>
                  <h4 className="text-white font-semibold text-sm">{u.company}</h4>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{u.description}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* 13. Interactive Console */}
        <Section num={13} icon="💻" title="Interactive Console" delay={0.3}>
          <p className="text-sm text-gray-400 mb-4 leading-relaxed">
            A simulated Kafka client (no real broker — purely in-browser). Run the snippet to see producers
            and consumers exchange messages, then experiment with the API.
          </p>
          <InteractiveCode
            description="Send a few messages, then add a consumer and watch what happens."
            starter={`// A simple in-browser Kafka simulation.
// (Real KafkaJS is async; this is simplified for learning.)

class Topic {
  constructor(name, numPartitions = 3) {
    this.name = name;
    this.partitions = Array.from({ length: numPartitions }, () => []);
  }
  hash(key) {
    let h = 0;
    for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return h;
  }
  send(key, value) {
    const p = this.hash(key) % this.partitions.length;
    const offset = this.partitions[p].length;
    this.partitions[p].push({ key, value, offset });
    console.log('→ wrote ' + key + '=' + value + ' to partition ' + p + ' @ offset ' + offset);
    return { partition: p, offset };
  }
  read(partition, fromOffset = 0) {
    return this.partitions[partition].slice(fromOffset);
  }
}

const orders = new Topic('orders', 3);

// Producer side — same key always lands in same partition
orders.send('user_42', 'placed order #1001');
orders.send('user_42', 'updated order #1001');
orders.send('user_99', 'placed order #1002');
orders.send('user_42', 'cancelled order #1001');
orders.send('user_99', 'paid order #1002');

console.log('\\n--- Consumer reads partition 0 ---');
for (const m of orders.read(0)) console.log('  offset', m.offset, ':', m.key, '→', m.value);

console.log('\\n--- Consumer reads partition 1 ---');
for (const m of orders.read(1)) console.log('  offset', m.offset, ':', m.key, '→', m.value);

console.log('\\n--- Consumer reads partition 2 ---');
for (const m of orders.read(2)) console.log('  offset', m.offset, ':', m.key, '→', m.value);

// Notice: all events for user_42 ended up in the same partition,
// in the order they were written. That's how Kafka guarantees ordering per key.
`}
          />
        </Section>

        {/* 14. Interview Questions */}
        <Section num={14} icon="🎤" title="Interview Questions" delay={0.32}>
          <div className="space-y-2">
            {INTERVIEW_QUESTIONS.map((qa, i) => (
              <details key={i} className="card p-4 group">
                <summary className="cursor-pointer list-none flex items-start gap-3">
                  <span className="text-brand-400 text-sm font-semibold mt-0.5">Q{i + 1}.</span>
                  <span className="text-gray-200 leading-relaxed flex-1">{qa.q}</span>
                  <span className="text-gray-500 group-open:rotate-180 transition-transform text-xs ml-2">
                    ▾
                  </span>
                </summary>
                <div className="mt-3 pt-3 border-t border-gray-800 flex items-start gap-3">
                  <span className="text-green-400 text-sm font-semibold mt-0.5">A.</span>
                  <p className="text-gray-300 text-sm leading-relaxed flex-1">{qa.a}</p>
                </div>
              </details>
            ))}
          </div>
        </Section>

        {/* 15. Performance Metrics */}
        <Section num={15} icon="📊" title="Performance Metrics" delay={0.34}>
          <p className="text-sm text-gray-400 mb-4 leading-relaxed">
            Rough numbers for a healthy production cluster. Real numbers vary wildly by hardware, message
            size, replication factor, and tuning — these are typical orders of magnitude.
          </p>
          <div className="rounded-2xl overflow-hidden border border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-900/60">
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wide">
                  <th className="px-4 py-2.5 font-medium">Metric</th>
                  <th className="px-4 py-2.5 font-medium">Typical Value</th>
                  <th className="px-4 py-2.5 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {METRICS.map((m) => (
                  <tr key={m.name} className="hover:bg-gray-900/30 transition-colors">
                    <td className="px-4 py-2.5 text-gray-200 font-medium">{m.name}</td>
                    <td className="px-4 py-2.5 font-mono text-brand-400 text-xs">{m.value}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{m.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* ───────────────  Advanced Topics divider  ─────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.36 }}
          className="relative py-6"
        >
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-dashed border-gray-800" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-gray-950 px-4 text-xs uppercase tracking-[0.25em] text-gray-500 font-semibold">
              Advanced Topics
            </span>
          </div>
        </motion.div>

        {/* 16. Producer Acknowledgments & Durability */}
        <Section num={16} icon="📬" title="Producer Acknowledgments & Durability" delay={0.38}>
          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              When a producer sends a message, how long should it wait before believing the message is
              "saved"? Kafka exposes one knob — <code className="font-mono text-pink-300 bg-gray-900 px-1.5 py-0.5 rounded text-xs">acks</code>{' '}
              — that controls the entire durability/latency trade-off.
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-3">
                <code className="font-mono text-red-400 font-bold w-20 flex-shrink-0">acks=0</code>
                <span><strong className="text-white">Fire and forget.</strong> Producer doesn\'t wait for any acknowledgment. Fastest, but if the broker dies before persisting, the message is gone forever.</span>
              </li>
              <li className="flex gap-3">
                <code className="font-mono text-yellow-400 font-bold w-20 flex-shrink-0">acks=1</code>
                <span><strong className="text-white">Leader confirms.</strong> Producer waits until the partition leader has written to its local log. If the leader crashes <em>after</em> ack but before replicating, the message is lost.</span>
              </li>
              <li className="flex gap-3">
                <code className="font-mono text-green-400 font-bold w-20 flex-shrink-0">acks=all</code>
                <span><strong className="text-white">Quorum confirms.</strong> Producer waits until all in-sync replicas (ISR) have written. Combined with <code className="font-mono text-pink-300 bg-gray-900 px-1 rounded text-xs">min.insync.replicas≥2</code>, this is the standard for "we cannot lose this data".</span>
              </li>
            </ul>
            <AcksDemo />
          </div>
        </Section>

        {/* 17. Exactly-Once Semantics */}
        <Section num={17} icon="✨" title="Exactly-Once Semantics (EOS)" delay={0.4}>
          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              "Process every message exactly once, no duplicates, no losses." Sounds obvious; in distributed
              systems it\'s genuinely hard. Kafka achieves it with <strong className="text-white">three layered
              mechanisms</strong>:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="card p-4">
                <h4 className="text-white font-semibold text-sm mb-1.5 flex items-center gap-1.5">
                  <span>1️⃣</span> Idempotent Producer
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Each producer gets a unique ID; each message gets a sequence number. The broker rejects
                  duplicates if a retry resends the same sequence — no more "did my retry create a duplicate?"
                  worry. Enable with{' '}
                  <code className="font-mono text-pink-300 bg-gray-900 px-1 rounded text-[10px]">enable.idempotence=true</code>.
                </p>
              </div>
              <div className="card p-4">
                <h4 className="text-white font-semibold text-sm mb-1.5 flex items-center gap-1.5">
                  <span>2️⃣</span> Transactions
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  A producer can write to multiple topics/partitions atomically:{' '}
                  <code className="font-mono text-pink-300 bg-gray-900 px-1 rounded text-[10px]">beginTransaction → send(...) → commitTransaction()</code>.
                  Either all writes become visible or none do.
                </p>
              </div>
              <div className="card p-4">
                <h4 className="text-white font-semibold text-sm mb-1.5 flex items-center gap-1.5">
                  <span>3️⃣</span> Read-Process-Write
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Consumer commits its offset <em>inside</em> the same transaction as its output writes.
                  Result: either the work is done <em>and</em> the offset advances, or neither — no
                  partial progress.
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-3">
              <p className="text-xs text-gray-300 leading-relaxed">
                <strong className="text-red-400">Reality check:</strong> EOS only holds <em>within Kafka</em>.
                The moment your consumer writes to an external system (Postgres, Elasticsearch, an email
                provider), you\'re back to <em>at-least-once</em> unless that target also supports idempotent
                writes. The pragmatic pattern: design downstream consumers to be idempotent regardless.
              </p>
            </div>
          </div>
        </Section>

        {/* 18. Log Compaction */}
        <Section num={18} icon="🧹" title="Log Compaction" delay={0.42}>
          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              Kafka has <strong className="text-white">two retention models</strong>. The default is{' '}
              <em>delete</em>: drop messages after N days regardless of content. The other is{' '}
              <em>compact</em>: keep the latest value <strong className="text-white">per key</strong> forever.
            </p>
            <p>
              Compacted topics are perfect for "current state" data: user profiles, account balances,
              feature flags, configuration. New writes overwrite older ones (logically); a special{' '}
              <strong className="text-white">tombstone</strong> (a message with{' '}
              <code className="font-mono text-pink-300 bg-gray-900 px-1.5 py-0.5 rounded text-xs">value=null</code>)
              flags a key as deleted.
            </p>
            <CompactionDemo />
            <p className="text-xs text-gray-500">
              Configure on a topic with{' '}
              <code className="font-mono text-pink-300 bg-gray-900 px-1.5 py-0.5 rounded text-[11px]">cleanup.policy=compact</code>{' '}
              (or{' '}
              <code className="font-mono text-pink-300 bg-gray-900 px-1.5 py-0.5 rounded text-[11px]">compact,delete</code>{' '}
              for both — keep latest-per-key, but drop entries older than N days).
            </p>
          </div>
        </Section>

        {/* 19. Kafka Streams */}
        <Section num={19} icon="🌊" title="Kafka Streams" delay={0.44}>
          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              <strong className="text-white">Kafka Streams</strong> is a Java/Scala library that turns Kafka
              topics into a stream-processing platform — without running a separate cluster. It\'s just a
              library you add to your app: it reads from topics, transforms data, writes to topics.
            </p>
            <p>
              Think of it as <strong className="text-white">SQL for streams</strong>: filter, map, join,
              group-by, window. Internally Kafka Streams uses local RocksDB stores and Kafka itself for
              fault tolerance — if your app crashes, state is recovered from a "changelog" topic.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: '🔁', name: 'Stateless ops', desc: 'map, filter, flatMap — no memory, scales linearly.' },
                { icon: '🧠', name: 'Stateful ops', desc: 'aggregate, count, reduce — backed by RocksDB + changelog topic.' },
                { icon: '🪟', name: 'Windowing', desc: 'tumbling, hopping, sliding, session — count events per minute, etc.' },
              ].map((c) => (
                <div key={c.name} className="card p-3">
                  <h4 className="text-white font-semibold text-sm flex items-center gap-1.5 mb-1">
                    <span>{c.icon}</span>{c.name}
                  </h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed">{c.desc}</p>
                </div>
              ))}
            </div>
            <InteractiveCode
              description="A simulated Kafka Streams DSL — count words per minute over a stream."
              starter={`// Pseudo-Kafka-Streams (real API is Java; this is the JS shape).
// Topology: input → split words → group by word → count over 1-min windows → output

const builder = {
  stream(topic) {
    return new Stream(topic);
  }
};

class Stream {
  constructor(name, parent = null) { this.name = name; this.parent = parent; this.transforms = []; }
  flatMapValues(fn) { this.transforms.push({ type: 'flatMapValues', fn }); return this; }
  groupByKey()      { this.transforms.push({ type: 'groupByKey' });      return this; }
  count()           { this.transforms.push({ type: 'count' });           return this; }
  to(topic) {
    console.log('🌊 Topology built:');
    console.log('  source: ' + this.name);
    this.transforms.forEach(t => console.log('  → ' + t.type + (t.fn ? ' (custom fn)' : '')));
    console.log('  sink: ' + topic);
  }
}

const stream = builder.stream('text-input');

stream
  .flatMapValues(text => text.toLowerCase().split(/\\s+/).filter(Boolean))
  .groupByKey()
  .count()
  .to('word-counts');

// In a real cluster, this app reads "text-input", emits one count event per (word, window),
// and writes them to "word-counts". State is stored in RocksDB locally and replicated via
// a changelog topic — so if the app crashes, another instance picks up exactly where it left off.
`}
            />
          </div>
        </Section>

        {/* 20. Kafka Connect */}
        <Section num={20} icon="🔌" title="Kafka Connect" delay={0.46}>
          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              <strong className="text-white">Kafka Connect</strong> solves a boring but ubiquitous problem:
              moving data <em>into</em> and <em>out of</em> Kafka without writing custom code. It\'s a
              framework with hundreds of pre-built <strong className="text-white">connectors</strong>{' '}
              maintained by Confluent and the community.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="card p-4">
                <h4 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                  <span>📥</span> Source Connectors <span className="text-gray-500 text-xs">(External → Kafka)</span>
                </h4>
                <ul className="text-xs text-gray-400 space-y-1.5">
                  <li>• <strong className="text-gray-300">Debezium</strong> — CDC from MySQL, Postgres, MongoDB, SQL Server</li>
                  <li>• <strong className="text-gray-300">JDBC Source</strong> — poll any SQL database periodically</li>
                  <li>• <strong className="text-gray-300">FileStream</strong> — tail a log file into Kafka</li>
                  <li>• <strong className="text-gray-300">Salesforce, Twitter</strong> — SaaS APIs as streams</li>
                </ul>
              </div>
              <div className="card p-4">
                <h4 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                  <span>📤</span> Sink Connectors <span className="text-gray-500 text-xs">(Kafka → External)</span>
                </h4>
                <ul className="text-xs text-gray-400 space-y-1.5">
                  <li>• <strong className="text-gray-300">JDBC Sink</strong> — Kafka events into any SQL database</li>
                  <li>• <strong className="text-gray-300">Elasticsearch</strong> — index events for search</li>
                  <li>• <strong className="text-gray-300">S3 / GCS</strong> — archive to object storage in Parquet/JSON</li>
                  <li>• <strong className="text-gray-300">Snowflake, BigQuery</strong> — analytics warehouses</li>
                </ul>
              </div>
            </div>
            <p>
              You configure a connector with JSON; Kafka Connect handles parallelism, fault tolerance, and
              offset tracking. No custom code, no babysitting.
            </p>
            <div className="rounded-xl bg-gray-950 border border-gray-800 p-3 font-mono text-[11px] leading-relaxed">
              <div className="text-gray-500 mb-1">// Postgres → Kafka (Debezium CDC) — typical config</div>
              <pre className="text-gray-200 whitespace-pre-wrap">{`{
  "name": "orders-cdc",
  "config": {
    "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
    "database.hostname": "db.internal",
    "database.dbname": "shop",
    "database.user": "kafka_cdc",
    "table.include.list": "public.orders,public.payments",
    "topic.prefix": "shop",
    "plugin.name": "pgoutput"
  }
}`}</pre>
            </div>
          </div>
        </Section>

        {/* 21. Schema Registry */}
        <Section num={21} icon="📐" title="Schema Registry" delay={0.48}>
          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              Producers and consumers don\'t share code; one team\'s "string" might be another team\'s
              "JSON object". Without a contract, schemas drift. <strong className="text-white">Schema Registry</strong>{' '}
              is a service (typically Confluent\'s, but alternatives like Apicurio exist) that stores schemas
              centrally and enforces compatibility rules.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="card p-3">
                <h4 className="text-white font-semibold text-sm mb-1">Avro</h4>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Most common. Compact binary format, evolution rules, code generation.
                </p>
              </div>
              <div className="card p-3">
                <h4 className="text-white font-semibold text-sm mb-1">Protobuf</h4>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Familiar to gRPC users. Slightly larger, faster decode in some languages.
                </p>
              </div>
              <div className="card p-3">
                <h4 className="text-white font-semibold text-sm mb-1">JSON Schema</h4>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Human-readable. Larger payloads, but easier debugging and broad tooling.
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-gray-950 border border-gray-800 p-3 font-mono text-[11px] leading-relaxed">
              <div className="text-gray-500 mb-1">// Avro schema for the "orders" topic</div>
              <pre className="text-gray-200 whitespace-pre-wrap">{`{
  "type": "record",
  "name": "Order",
  "namespace": "com.shop.events",
  "fields": [
    { "name": "id",        "type": "string" },
    { "name": "customerId","type": "string" },
    { "name": "amount",    "type": "double" },
    { "name": "currency",  "type": "string", "default": "USD" },
    { "name": "createdAt", "type": "long",   "logicalType": "timestamp-millis" }
  ]
}`}</pre>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-2">Compatibility modes</h4>
              <ul className="text-xs text-gray-400 space-y-1.5 ml-4 list-disc">
                <li><strong className="text-gray-300">BACKWARD</strong> — new schema can read old data. Add optional fields, never remove required ones. Default.</li>
                <li><strong className="text-gray-300">FORWARD</strong> — old schema can read new data. Useful when consumers update first.</li>
                <li><strong className="text-gray-300">FULL</strong> — both directions. Strictest; safest.</li>
                <li><strong className="text-gray-300">NONE</strong> — no enforcement. Don\'t.</li>
              </ul>
            </div>
          </div>
        </Section>

        {/* 22. Security */}
        <Section num={22} icon="🔐" title="Security: Encryption, Auth, ACLs" delay={0.5}>
          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              By default Kafka has <em>no security</em> — useful for development, dangerous for production.
              The three layers you actually want are <strong className="text-white">encryption,
              authentication, and authorization</strong>.
            </p>
            <div className="space-y-3">
              <div className="card p-4">
                <h4 className="text-white font-semibold text-sm flex items-center gap-2 mb-2">
                  <span>🔒</span> Encryption (TLS / SSL)
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed mb-2">
                  Encrypt traffic between clients and brokers, and between brokers themselves. Without this,
                  anyone on the network sees every message in plain text.
                </p>
                <code className="block font-mono text-[11px] text-pink-300 bg-gray-900 px-2 py-1 rounded">
                  security.protocol=SSL
                </code>
              </div>
              <div className="card p-4">
                <h4 className="text-white font-semibold text-sm flex items-center gap-2 mb-2">
                  <span>🪪</span> Authentication (SASL)
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed mb-2">
                  Verify <em>who</em> is connecting. Common SASL mechanisms:
                </p>
                <ul className="text-xs text-gray-400 space-y-1 ml-4 list-disc">
                  <li><strong className="text-gray-300">SASL/PLAIN</strong> — username + password (always over TLS)</li>
                  <li><strong className="text-gray-300">SASL/SCRAM</strong> — challenge-response, password-based but safer than PLAIN</li>
                  <li><strong className="text-gray-300">SASL/GSSAPI</strong> — Kerberos, common in enterprise</li>
                  <li><strong className="text-gray-300">SASL/OAUTHBEARER</strong> — OAuth tokens, increasingly common in cloud-native setups</li>
                  <li><strong className="text-gray-300">mTLS</strong> — mutual TLS, client certificates as identity</li>
                </ul>
              </div>
              <div className="card p-4">
                <h4 className="text-white font-semibold text-sm flex items-center gap-2 mb-2">
                  <span>🛡️</span> Authorization (ACLs)
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed mb-2">
                  Once authenticated, what is the user allowed to do? ACLs grant per-resource permissions:
                  read/write/create on specific topics or groups.
                </p>
                <code className="block font-mono text-[11px] text-pink-300 bg-gray-900 px-2 py-1 rounded whitespace-pre-wrap">
                  kafka-acls --add --allow-principal User:billing-svc \{'\n'}
                  {'  '}--operation Write --topic payments
                </code>
              </div>
            </div>
            <div className="rounded-xl bg-yellow-500/5 border border-yellow-500/20 p-3">
              <p className="text-xs text-gray-300 leading-relaxed">
                <strong className="text-yellow-400">Common mistake:</strong> running TLS but with{' '}
                <code className="font-mono text-pink-300 bg-gray-900 px-1 rounded">ssl.endpoint.identification.algorithm=</code>{' '}
                (empty), which disables hostname verification — then a man-in-the-middle attack can present
                any cert and the client trusts it. Always verify hostnames.
              </p>
            </div>
          </div>
        </Section>

        {/* 23. Cross-Cluster Replication */}
        <Section num={23} icon="🌍" title="Cross-Cluster Replication & DR" delay={0.52}>
          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              For disaster recovery, multi-region deployments, or migration to a new cluster, you replicate
              data between Kafka clusters. The standard tool is{' '}
              <strong className="text-white">MirrorMaker 2 (MM2)</strong>, built on Kafka Connect.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="card p-3">
                <h4 className="text-white font-semibold text-sm mb-1">Active / Passive</h4>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  One primary cluster handles all traffic; a secondary mirrors it for DR. Failover is manual
                  or scripted.
                </p>
              </div>
              <div className="card p-3">
                <h4 className="text-white font-semibold text-sm mb-1">Active / Active</h4>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Two clusters in different regions both accept writes, mirror each other. Higher availability,
                  more complex (loops to avoid, ordering trade-offs).
                </p>
              </div>
              <div className="card p-3">
                <h4 className="text-white font-semibold text-sm mb-1">Aggregate / Fan-in</h4>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  N regional clusters mirror up to one global cluster for reporting and analytics across
                  regions.
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-blue-500/5 border border-blue-500/20 p-3">
              <p className="text-xs text-gray-300 leading-relaxed">
                <strong className="text-blue-400">Watch out:</strong> MM2 mirrors topic data, not consumer
                offsets directly — translating offsets between clusters is non-trivial because partition
                count, leadership, and exact byte positions can differ. Use{' '}
                <code className="font-mono text-pink-300 bg-gray-900 px-1 rounded">RemoteClusterUtils.translateOffsets</code>{' '}
                or accept some replay on failover. Many shops also evaluate{' '}
                <strong className="text-white">Confluent Cluster Linking</strong> as a more byte-faithful
                alternative.
              </p>
            </div>
            <p>
              For genuinely global low-latency needs, look at <strong className="text-white">stretched
              clusters</strong> (one Kafka cluster across availability zones — but not regions, latency too
              high) or <strong className="text-white">tiered storage</strong> (cheap object-storage backup
              of older segments, often paired with replication).
            </p>
          </div>
        </Section>

        {/* 24. Performance Tuning */}
        <Section num={24} icon="🎚️" title="Performance Tuning: The Knobs That Matter" delay={0.54}>
          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              Out of the box, Kafka is fast. With tuning, it\'s <em>very</em> fast. Below are the configs
              that move the needle 10× — not the long tail of micro-optimisations.
            </p>
            <div>
              <h4 className="text-white font-semibold text-sm mb-2">Producer side</h4>
              <div className="rounded-2xl overflow-hidden border border-gray-800">
                <table className="w-full text-xs">
                  <thead className="bg-gray-900/60">
                    <tr className="text-left text-[10px] text-gray-400 uppercase tracking-wide">
                      <th className="px-3 py-2 font-medium">Config</th>
                      <th className="px-3 py-2 font-medium">What it does</th>
                      <th className="px-3 py-2 font-medium">Tip</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    <ConfigRow name="batch.size"     desc="Bytes accumulated per partition before sending."        tip="Bigger = better throughput; default 16KB is small for high-volume." />
                    <ConfigRow name="linger.ms"      desc="Max time to wait for a batch to fill before sending."   tip="Set 5–50ms for batching; tail latency suffers if higher." />
                    <ConfigRow name="compression.type" desc="lz4 (fast), zstd (smaller), gzip (slow)."            tip="lz4 for speed, zstd for storage. Always compress." />
                    <ConfigRow name="enable.idempotence" desc="Dedupe retries automatically."                     tip="Always true. No reason not to." />
                    <ConfigRow name="acks"           desc="Durability vs latency."                                 tip="acks=all in production with min.insync.replicas≥2." />
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-2">Consumer side</h4>
              <div className="rounded-2xl overflow-hidden border border-gray-800">
                <table className="w-full text-xs">
                  <thead className="bg-gray-900/60">
                    <tr className="text-left text-[10px] text-gray-400 uppercase tracking-wide">
                      <th className="px-3 py-2 font-medium">Config</th>
                      <th className="px-3 py-2 font-medium">What it does</th>
                      <th className="px-3 py-2 font-medium">Tip</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    <ConfigRow name="fetch.min.bytes"  desc="Minimum bytes broker waits for before responding."   tip="Increase for throughput; decrease for low latency." />
                    <ConfigRow name="max.poll.records" desc="Max messages returned per poll() call."              tip="Tune so process loop fits in max.poll.interval.ms." />
                    <ConfigRow name="max.poll.interval.ms" desc="Time between polls before consumer is kicked out." tip="Set higher than your worst-case batch processing time." />
                    <ConfigRow name="session.timeout.ms" desc="How long without heartbeat = consumer dead."        tip="10s is fine; lower = faster failover, higher = fewer false alarms." />
                    <ConfigRow name="auto.offset.reset" desc="Where to start when no committed offset exists."     tip="latest for live data; earliest for replay/backfill jobs." />
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-2">Topic / broker side</h4>
              <div className="rounded-2xl overflow-hidden border border-gray-800">
                <table className="w-full text-xs">
                  <thead className="bg-gray-900/60">
                    <tr className="text-left text-[10px] text-gray-400 uppercase tracking-wide">
                      <th className="px-3 py-2 font-medium">Config</th>
                      <th className="px-3 py-2 font-medium">What it does</th>
                      <th className="px-3 py-2 font-medium">Tip</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    <ConfigRow name="num.partitions"        desc="Parallelism ceiling for the topic."          tip="Easier to over-provision than to grow later (rebalance = pain)." />
                    <ConfigRow name="replication.factor"    desc="Number of copies per partition."             tip="3 in production. 2 only for non-critical or dev." />
                    <ConfigRow name="min.insync.replicas"   desc="Minimum ISR for acks=all to succeed."         tip="Set to 2 with RF=3. Under that, producer errors out — safer than silent loss." />
                    <ConfigRow name="retention.ms"          desc="How long to keep messages."                  tip="Default 7 days. Audit, debug, and replay needs often want 30+." />
                    <ConfigRow name="segment.bytes"         desc="Size of each log segment file."              tip="Bigger = fewer files but slower compaction. 1GB default is sane." />
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Section>

        {/* Case Study CTA — placed right before the alternatives table so readers
            see the worked example before "what other tools exist" */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <Link
            to="/case-study/uber-kafka"
            className="block group rounded-2xl p-6 bg-gradient-to-br from-brand-500/15 via-purple-500/10 to-transparent border border-brand-500/30 hover:border-brand-500/60 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gray-900/60 flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-110 transition-transform">
                🚕
              </div>
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-[0.2em] text-brand-400 font-semibold mb-1">
                  Case Study
                </div>
                <h3 className="text-white font-bold text-lg mb-1">
                  See it all in action: Designing Uber with Kafka
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Every concept on this page applied to a real product end-to-end — geohashing, live
                  tracking, surge pricing, exactly-once payments, fan-out analytics. Then design food
                  delivery yourself.
                </p>
              </div>
              <span className="text-brand-400 group-hover:translate-x-1 transition-transform text-xl flex-shrink-0">
                →
              </span>
            </div>
          </Link>
        </motion.div>

        {/* 25. Kafka vs Alternatives */}
        <Section num={25} icon="⚔️" title="Kafka vs Alternatives" delay={0.56}>
          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              Kafka isn\'t always the right tool. Here\'s how the major messaging systems compare on the
              dimensions that usually matter.
            </p>
            <div className="rounded-2xl overflow-hidden border border-gray-800">
              <table className="w-full text-xs">
                <thead className="bg-gray-900/60">
                  <tr className="text-left text-[10px] text-gray-400 uppercase tracking-wide">
                    <th className="px-3 py-2 font-medium">System</th>
                    <th className="px-3 py-2 font-medium">Best for</th>
                    <th className="px-3 py-2 font-medium">Throughput</th>
                    <th className="px-3 py-2 font-medium">Replay</th>
                    <th className="px-3 py-2 font-medium">Hosted?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  <AltRow name="Apache Kafka"   best="High-throughput logs, replay, multi-consumer fan-out"  tput="🟢🟢🟢🟢" replay="✅ days–forever" hosted="Self / MSK / Confluent / Aiven" />
                  <AltRow name="Apache Pulsar"  best="Multi-tenant, geo-replication out of the box"          tput="🟢🟢🟢🟢" replay="✅ tiered storage native" hosted="Self / StreamNative" />
                  <AltRow name="Amazon Kinesis" best="AWS-native, fully managed, simpler ops"                tput="🟢🟢🟢"   replay="✅ up to 365 days" hosted="AWS only" />
                  <AltRow name="GCP Pub/Sub"    best="Auto-scaling, no partition planning, GCP-native"       tput="🟢🟢🟢🟢" replay="✅ via snapshots" hosted="GCP only" />
                  <AltRow name="RabbitMQ"       best="Complex routing, priorities, RPC, per-msg TTL"         tput="🟢🟢"     replay="❌ messages deleted on ack" hosted="Self / CloudAMQP" />
                  <AltRow name="Amazon SQS"     best="Simple task queue, fully managed, per-msg dedup"       tput="🟢🟢"     replay="❌ + 14-day retention" hosted="AWS only" />
                  <AltRow name="Redis Streams"  best="Simple streams when you already run Redis"             tput="🟢🟢🟢"   replay="✅ up to memory limit" hosted="Self / Redis Cloud" />
                  <AltRow name="NATS / JetStream" best="Edge / IoT, low latency, lightweight"                tput="🟢🟢🟢"   replay="✅ JetStream optional" hosted="Self / Synadia" />
                </tbody>
              </table>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div className="card p-4">
                <h4 className="text-green-400 font-semibold text-sm mb-1.5">✅ Reach for Kafka when</h4>
                <ul className="text-xs text-gray-300 space-y-1">
                  <li>• Throughput &gt; ~50k msg/s sustained</li>
                  <li>• Multiple independent consumers reading the same data</li>
                  <li>• You need replay for analytics / ML / audit</li>
                  <li>• Event-driven architecture across many services</li>
                  <li>• Stream processing with Kafka Streams or Flink</li>
                </ul>
              </div>
              <div className="card p-4">
                <h4 className="text-yellow-400 font-semibold text-sm mb-1.5">🤔 Pick something else when</h4>
                <ul className="text-xs text-gray-300 space-y-1">
                  <li>• Low volume (&lt; 10k msg/s) — managed queue is enough</li>
                  <li>• Need per-message priorities → RabbitMQ</li>
                  <li>• Need RPC-style request/response → HTTP or gRPC</li>
                  <li>• Tight ops budget, no Kafka skills → Kinesis / Pub/Sub</li>
                  <li>• Per-message TTL or scheduled delivery → SQS / RabbitMQ</li>
                </ul>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

function ConfigRow({ name, desc, tip }: { name: string; desc: string; tip: string }) {
  return (
    <tr className="hover:bg-gray-900/30 transition-colors">
      <td className="px-3 py-2 font-mono text-pink-300 text-[11px] whitespace-nowrap">{name}</td>
      <td className="px-3 py-2 text-gray-300">{desc}</td>
      <td className="px-3 py-2 text-gray-500">{tip}</td>
    </tr>
  );
}

function AltRow({
  name,
  best,
  tput,
  replay,
  hosted,
}: {
  name: string;
  best: string;
  tput: string;
  replay: string;
  hosted: string;
}) {
  return (
    <tr className="hover:bg-gray-900/30 transition-colors">
      <td className="px-3 py-2 text-white font-semibold whitespace-nowrap">{name}</td>
      <td className="px-3 py-2 text-gray-300">{best}</td>
      <td className="px-3 py-2 whitespace-nowrap">{tput}</td>
      <td className="px-3 py-2 text-gray-300 whitespace-nowrap">{replay}</td>
      <td className="px-3 py-2 text-gray-400 text-[11px]">{hosted}</td>
    </tr>
  );
}

// Inline component for section 10 — visualises offset as a bookmark on a row of messages.
function OffsetVisual() {
  const messages = ['m0', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8'];
  const committedOffset = 5; // consumer has processed up to m4, committed offset 5

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3 text-xs">
        <span className="text-gray-400">
          <span className="text-blue-400">Partition log</span> (oldest → newest)
        </span>
        <span className="text-gray-500">
          Committed offset: <span className="text-green-400 font-mono font-bold">{committedOffset}</span>
        </span>
      </div>
      <div className="flex gap-1 overflow-x-auto pb-2">
        {messages.map((msg, i) => {
          const isProcessed = i < committedOffset;
          const isCurrent = i === committedOffset;
          return (
            <div key={i} className="flex flex-col items-center min-w-[52px]">
              <div className="text-[9px] text-gray-600 font-mono">{i}</div>
              <div
                className={`w-full px-2 py-2 rounded-lg text-center text-[11px] font-mono font-medium border ${
                  isProcessed
                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                    : isCurrent
                    ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-300 ring-2 ring-yellow-500/30'
                    : 'bg-gray-900 border-gray-800 text-gray-400'
                }`}
              >
                {msg}
              </div>
              {isCurrent && (
                <motion.div
                  initial={{ y: -4 }}
                  animate={{ y: 0 }}
                  className="text-[9px] text-yellow-400 mt-1 font-bold"
                >
                  ↑ next
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-2 text-[10px] text-gray-500">
        <span><span className="inline-block w-2 h-2 rounded-sm bg-green-500/40 mr-1" />processed</span>
        <span><span className="inline-block w-2 h-2 rounded-sm bg-yellow-500/40 mr-1" />next to read</span>
        <span><span className="inline-block w-2 h-2 rounded-sm bg-gray-700 mr-1" />unread</span>
      </div>
    </div>
  );
}
