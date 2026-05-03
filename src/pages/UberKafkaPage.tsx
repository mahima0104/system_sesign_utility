import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import StepAnimation from '../components/Common/StepAnimation';
import GeohashingDemo from '../components/CaseStudies/GeohashingDemo';
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

// Step animation for the ride lifecycle
const lifecycleViz: PatternVisualization = {
  caption: 'A ride from "find me a car" to "payment confirmed".',
  entities: [
    { id: 'rider', label: 'Rider App', x: 8, y: 28, icon: '📱', color: '#60a5fa' },
    { id: 'driver', label: 'Driver App', x: 8, y: 72, icon: '🚗', color: '#34d399' },
    { id: 'kafka', label: 'Kafka', x: 38, y: 50, icon: '🦅', color: '#a78bfa' },
    { id: 'match', label: 'Matching', x: 65, y: 22, icon: '🤝', color: '#facc15' },
    { id: 'pricing', label: 'Pricing', x: 65, y: 50, icon: '💰', color: '#fb923c' },
    { id: 'pay', label: 'Payments', x: 65, y: 78, icon: '💳', color: '#ef4444' },
    { id: 'analytics', label: 'Analytics', x: 92, y: 50, icon: '📊', color: '#22d3ee' },
  ],
  relations: [
    { from: 'rider', to: 'kafka', label: 'rider.requests' },
    { from: 'driver', to: 'kafka', label: 'driver.locations' },
    { from: 'kafka', to: 'match' },
    { from: 'kafka', to: 'pricing' },
    { from: 'kafka', to: 'pay' },
    { from: 'kafka', to: 'analytics' },
    { from: 'match', to: 'kafka', label: 'ride.assignments' },
    { from: 'pay', to: 'kafka', label: 'payments' },
  ],
};

const lifecycleSteps: PatternStep[] = [
  {
    title: '1. Drivers stream their location continuously',
    description:
      'Every active driver app sends GPS coordinates every 4 seconds to the driver.locations topic. Partitioned by driver_id so every driver\'s pings stay in order. With 1M active drivers, that\'s ~250k messages/second — Kafka handles this comfortably.',
    highlight: ['driver', 'kafka'],
  },
  {
    title: '2. Rider taps "Find a ride"',
    description:
      'The rider app publishes one event to rider.requests with pickup location, destination, and ride type. Partitioned by H3 cell of pickup location, so all requests in the same neighbourhood land on the same matching consumer.',
    highlight: ['rider', 'kafka'],
  },
  {
    title: '3. Matching service consumes both topics',
    description:
      'A Kafka Streams app reads driver.locations and rider.requests in parallel. For each request, it picks the closest available driver in the same H3 cell — ordered, deterministic, fast.',
    highlight: ['kafka', 'match'],
  },
  {
    title: '4. Pricing computes surge per cell',
    description:
      'Another Kafka Streams app aggregates requests:drivers ratio per cell over a 60-second window, writes the multiplier to pricing.surge. Compacted topic — only the latest value per cell matters.',
    highlight: ['kafka', 'pricing'],
  },
  {
    title: '5. Match published, both apps notified',
    description:
      'Matching service writes ride.assignments. Rider app and driver app each have consumers subscribed — both get notified within ~50ms of the match.',
    highlight: ['match', 'kafka', 'rider', 'driver'],
  },
  {
    title: '6. Trip events flow as the ride happens',
    description:
      'Started, en-route, arrived, completed — each is an event on ride.events partitioned by ride_id, so all events for one ride stay ordered on the same partition.',
    highlight: ['driver', 'kafka', 'rider'],
  },
  {
    title: '7. Trip ends → payment service processes',
    description:
      'Payment consumer reads ride.events, charges the card via Stripe (idempotent), writes to payments topic. All inside a Kafka transaction — exactly-once: charge OR offset commit, never partial.',
    highlight: ['kafka', 'pay'],
  },
  {
    title: '8. Analytics fans out to everyone',
    description:
      'The same topics are consumed by ML training jobs, real-time dashboards, fraud detection, and Kafka Connect → Snowflake for the data warehouse. Every team subscribes independently — no producer changes needed.',
    highlight: ['kafka', 'analytics'],
  },
];

const TOPICS = [
  {
    name: 'driver.locations',
    purpose: 'GPS pings every 4s from every driver',
    partitionBy: 'driver_id',
    retention: '1 hour',
    rf: '3',
    cleanup: 'delete',
    acks: '1',
    notes: 'High volume. Stale data is useless, so short retention.',
  },
  {
    name: 'rider.requests',
    purpose: 'New ride requests',
    partitionBy: 'h3_cell',
    retention: '7 days',
    rf: '3',
    cleanup: 'delete',
    acks: 'all',
    notes: 'Co-locates requests with same-cell drivers for fast matching.',
  },
  {
    name: 'ride.assignments',
    purpose: 'Driver-rider match decisions',
    partitionBy: 'ride_id',
    retention: '7 days',
    rf: '3',
    cleanup: 'delete',
    acks: 'all',
    notes: 'Audit trail of every match for ML training.',
  },
  {
    name: 'ride.events',
    purpose: 'Started, en-route, arrived, completed',
    partitionBy: 'ride_id',
    retention: '30 days',
    rf: '3',
    cleanup: 'delete',
    acks: 'all',
    notes: 'Strict ordering per ride — partition key matters.',
  },
  {
    name: 'pricing.surge',
    purpose: 'Latest surge multiplier per cell',
    partitionBy: 'h3_cell',
    retention: 'compact',
    rf: '3',
    cleanup: 'compact',
    acks: 'all',
    notes: 'Only the latest multiplier per cell matters — compact!',
  },
  {
    name: 'driver.profiles',
    purpose: 'Latest driver state (active, offline, banned)',
    partitionBy: 'driver_id',
    retention: 'forever',
    rf: '3',
    cleanup: 'compact',
    acks: 'all',
    notes: 'Source of truth for driver state. Compaction = always queryable.',
  },
  {
    name: 'payments',
    purpose: 'Charges, refunds, payouts',
    partitionBy: 'ride_id',
    retention: '7 years',
    rf: '5',
    cleanup: 'delete',
    acks: 'all',
    notes: 'Higher RF + transactions. Money rules.',
  },
  {
    name: 'notifications',
    purpose: 'Email, SMS, push notifications',
    partitionBy: 'user_id',
    retention: '3 days',
    rf: '3',
    cleanup: 'delete',
    acks: '1',
    notes: 'Best-effort delivery. Lost notification ≠ catastrophe.',
  },
];

const CONCEPT_RECAP = [
  { concept: 'Topics', kafkaSection: 3, where: '8 topics catalogued — each with a clear purpose and partition strategy.' },
  { concept: 'Partitioning', kafkaSection: 7, where: 'driver_id for ordered driver pings, H3 cell for geographic locality, ride_id for per-ride ordering.' },
  { concept: 'Replication', kafkaSection: 8, where: 'RF=3 for most topics, RF=5 for payments — survives 2- and 4-broker failures.' },
  { concept: 'Consumer Groups', kafkaSection: 9, where: 'Matching service, pricing service, payments — each is its own consumer group, scales horizontally.' },
  { concept: 'Offset Management', kafkaSection: 10, where: 'Manual commit in payment service to avoid double-charging on retries.' },
  { concept: 'Failure Handling', kafkaSection: 11, where: 'Stripe outage → DLQ + retry; broker crash → ISR failover (transparent).' },
  { concept: 'Producer Acks', kafkaSection: 16, where: 'acks=all for payments and ride.events; acks=1 for high-volume location pings.' },
  { concept: 'Exactly-Once', kafkaSection: 17, where: 'Payment service uses transactions: charge + write payments + commit offset — atomic.' },
  { concept: 'Log Compaction', kafkaSection: 18, where: 'driver.profiles and pricing.surge — only the latest value per key matters.' },
  { concept: 'Kafka Streams', kafkaSection: 19, where: 'Real-time matching service and surge-pricing aggregation per H3 cell.' },
  { concept: 'Kafka Connect', kafkaSection: 20, where: 'Sink connectors → Snowflake (analytics) and Elasticsearch (trip search).' },
  { concept: 'Schema Registry', kafkaSection: 21, where: 'Avro schemas for every topic; BACKWARD compatibility enforced.' },
  { concept: 'Cross-Cluster Replication', kafkaSection: 23, where: 'MirrorMaker 2 to a DR region; payments topic also active-active for legal residency.' },
];

const FOOD_DELIVERY_HINTS = [
  {
    q: 'What topics would you need?',
    a: 'At minimum: customer.orders (new orders), restaurant.events (accepted, preparing, ready), driver.locations (live GPS), driver.assignments (matched to order), order.events (full lifecycle), payments, notifications, and review.events. Many shops also have promotions, fraud.signals, and inventory updates.',
  },
  {
    q: 'How would you partition each topic?',
    a: 'customer.orders → by restaurant_id (so all orders for one restaurant land on the same consumer, giving the restaurant\'s screen ordered events). driver.locations → by driver_id (ordered per driver). order.events → by order_id (ordered lifecycle per order). payments → by order_id (atomicity). driver.assignments → by H3 cell of restaurant or by driver_id depending on whether you matchmake per-area or per-driver.',
  },
  {
    q: 'Where would you use exactly-once semantics?',
    a: 'Anywhere money moves: payments (charge + record), refunds, driver payouts. Also for tip processing if it triggers a separate charge. Use idempotent producers + transactions wrapping the consumer\'s read + DB write + offset commit.',
  },
  {
    q: 'Where would log compaction make sense?',
    a: 'restaurant.profiles (latest state: open/closed, current menu, current prep-time estimate), driver.profiles (active/offline status), promotions (latest active promo per code), inventory (latest stock per item). Anything that\'s "latest state per key" rather than "history of events".',
  },
  {
    q: 'What would Kafka Streams compute in real time?',
    a: 'Demand surge (orders per cell per minute), restaurant ETA forecasts (from prep-time history + current load), fraud detection (multiple orders to same address in 5 minutes), driver utilisation per area (idle drivers vs active), real-time dashboards.',
  },
  {
    q: 'Where would Kafka Connect be useful?',
    a: 'Sink connectors: → Snowflake/BigQuery for analytics, → Elasticsearch for restaurant/dish search, → S3 for ML training data archives. Source connectors: ← Postgres CDC of restaurant/menu changes (Debezium), ← Stripe webhooks via HTTP source.',
  },
  {
    q: 'Where would things go wrong, and how would you protect against it?',
    a: 'Restaurant offline mid-order → DLQ + auto-retry, then manual reassignment. Driver crashes → assignment topic re-consumed by another driver-matching instance. Payment provider down → DLQ + alert; reconcile with idempotent retries. Region outage → MirrorMaker 2 replica + DNS failover. Schema drift → Schema Registry with BACKWARD compatibility prevents bad rollouts.',
  },
];

export default function UberKafkaPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/kafka" className="hover:text-gray-300 transition-colors">
          Kafka
        </Link>
        <span>/</span>
        <span className="text-gray-300">Case Study</span>
        <span>/</span>
        <span className="text-white">Designing Uber</span>
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-7 mb-10 bg-gradient-to-br from-brand-500/10 via-purple-500/5 to-transparent border-brand-500/20"
      >
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gray-800 flex items-center justify-center text-4xl flex-shrink-0">
            🚕
          </div>
          <div className="flex-1">
            <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
              Case Study · Real-World System Design
            </span>
            <h1 className="text-3xl font-bold text-white mt-1 mb-2">Designing Uber with Kafka</h1>
            <p className="text-gray-400 leading-relaxed">
              Every Kafka concept from the previous page, shown in one real product. By the end, you'll see
              exactly where partitioning, exactly-once, compaction, Streams, and Connect each earn their
              keep. Then you'll design food delivery yourself.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="space-y-12">
        {/* 1. The 30-second pitch */}
        <Section num={1} icon="🎯" title="The 30-Second Pitch" delay={0.05}>
          <div className="space-y-3 text-gray-300 leading-relaxed">
            <p>
              When you tap <strong className="text-white">"Find a ride"</strong>, your single tap kicks off
              dozens of services: matching, pricing, ETA, payments, fraud, notifications, analytics. Without
              Kafka, those services would all be calling each other over HTTP — every change would ripple
              everywhere, one slow service would block the rest, and replaying anything for ML training would
              be impossible.
            </p>
            <p>
              With Kafka, each service does <strong className="text-white">one job</strong> and publishes
              events to topics. Everyone else subscribes to what they care about. Add a new feature tomorrow?
              Subscribe to an existing topic — no producer changes. Need to rebuild a model from last month's
              data? Replay the topic. That's the magic.
            </p>
            <div className="grid grid-cols-3 gap-3 mt-2">
              {[
                { label: 'Drivers worldwide', value: '~5M' },
                { label: 'Trips per day', value: '~25M' },
                { label: 'Kafka msgs/sec', value: '>1M' },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-gray-900/40 border border-gray-800 p-3">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide">{s.label}</div>
                  <div className="text-base text-white font-semibold mt-0.5 font-mono">{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* 2. The Topic Catalog */}
        <Section num={2} icon="📚" title="The Topic Catalog" delay={0.08}>
          <p className="text-sm text-gray-400 mb-4 leading-relaxed">
            The first design question for any Kafka system: <strong className="text-white">what topics
            do I need?</strong> Below are the eight core topics for a simplified Uber. Notice how the
            partition key, retention, and acks are chosen <em>per topic</em> based on what that data is for.
          </p>
          <div className="rounded-2xl overflow-hidden border border-gray-800 overflow-x-auto">
            <table className="w-full text-xs min-w-[720px]">
              <thead className="bg-gray-900/60">
                <tr className="text-left text-[10px] text-gray-400 uppercase tracking-wide">
                  <th className="px-3 py-2 font-medium">Topic</th>
                  <th className="px-3 py-2 font-medium">Partition by</th>
                  <th className="px-3 py-2 font-medium">Retention</th>
                  <th className="px-3 py-2 font-medium">RF</th>
                  <th className="px-3 py-2 font-medium">Cleanup</th>
                  <th className="px-3 py-2 font-medium">Acks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {TOPICS.map((t) => (
                  <tr key={t.name} className="hover:bg-gray-900/30 transition-colors">
                    <td className="px-3 py-2 font-mono text-pink-300 align-top whitespace-nowrap">{t.name}</td>
                    <td className="px-3 py-2 font-mono text-blue-300 align-top whitespace-nowrap">{t.partitionBy}</td>
                    <td className="px-3 py-2 text-gray-300 align-top whitespace-nowrap">{t.retention}</td>
                    <td className="px-3 py-2 text-gray-300 align-top">{t.rf}</td>
                    <td className="px-3 py-2 text-gray-300 align-top whitespace-nowrap">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          t.cleanup === 'compact'
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        {t.cleanup}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono align-top whitespace-nowrap">
                      <span
                        className={
                          t.acks === 'all'
                            ? 'text-green-400'
                            : t.acks === '1'
                            ? 'text-yellow-400'
                            : 'text-red-400'
                        }
                      >
                        {t.acks}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <details className="mt-3 text-xs text-gray-400">
            <summary className="cursor-pointer hover:text-gray-200 transition-colors">
              ▸ See the design notes for each topic
            </summary>
            <div className="mt-3 space-y-2 pl-4 border-l-2 border-gray-800">
              {TOPICS.map((t) => (
                <div key={t.name}>
                  <code className="font-mono text-pink-300">{t.name}</code> —{' '}
                  <span className="text-gray-300">{t.purpose}.</span>{' '}
                  <span className="text-gray-500">{t.notes}</span>
                </div>
              ))}
            </div>
          </details>
        </Section>

        {/* 3. The Ride Lifecycle Animation */}
        <Section num={3} icon="🎬" title="The Ride Lifecycle" delay={0.1}>
          <p className="text-sm text-gray-400 mb-4 leading-relaxed">
            One ride, eight Kafka steps. Click <strong className="text-brand-400">▶ Auto</strong> to watch
            the whole flow, or step through manually.
          </p>
          <StepAnimation visualization={lifecycleViz} steps={lifecycleSteps} />
        </Section>

        {/* 4. Geohashing & Driver Matching */}
        <Section num={4} icon="🗺️" title="Geohashing & Driver Matching" delay={0.12}>
          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              How does Uber match a rider with a nearby driver out of millions? They divide the world into{' '}
              <strong className="text-white">hexagonal cells</strong> using a system called{' '}
              <strong className="text-white">H3</strong> (Uber\'s open-source geohashing library). Each cell
              has a fixed ID. Drivers and rider requests are tagged with the cell they\'re in.
            </p>
            <p>
              The clever bit: the topics{' '}
              <code className="font-mono text-pink-300 bg-gray-900 px-1.5 py-0.5 rounded text-xs">driver.locations</code>{' '}
              and{' '}
              <code className="font-mono text-pink-300 bg-gray-900 px-1.5 py-0.5 rounded text-xs">rider.requests</code>{' '}
              are partitioned by H3 cell. So a single matching consumer sees all events for one cell, in
              order, with no global locking. Every cell\'s matching runs in parallel.
            </p>
            <GeohashingDemo />
            <div className="rounded-xl bg-purple-500/5 border border-purple-500/20 p-3">
              <p className="text-xs text-gray-300 leading-relaxed">
                <strong className="text-purple-400">Concept used:</strong> Partitioning by composite/derived
                key. The choice of key (h3_cell vs driver_id vs ride_id) is the most important design
                decision in any Kafka system. Get it right and everything scales; get it wrong and you have
                hot partitions or out-of-order events.
              </p>
            </div>
          </div>
        </Section>

        {/* 5. Live Location Tracking */}
        <Section num={5} icon="📍" title="Live Location Tracking" delay={0.14}>
          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              Each active driver app sends a GPS ping <strong className="text-white">every 4 seconds</strong>.
              That\'s ~250k messages per second globally. Every ping has the driver\'s ID, lat/long, speed,
              heading, current H3 cell, and a timestamp.
            </p>
            <div className="rounded-xl bg-gray-950 border border-gray-800 p-3 font-mono text-[11px] leading-relaxed">
              <div className="text-gray-500 mb-1">// Topic: driver.locations · partition by driver_id · acks=1</div>
              <pre className="text-gray-200 whitespace-pre-wrap">{`{
  "driver_id": "drv_8a2f9c",
  "lat": 37.7749,
  "lng": -122.4194,
  "speed_mps": 12.3,
  "heading_deg": 218,
  "h3_cell": "8928308280fffff",
  "ts": "2026-05-02T14:32:18.142Z"
}`}</pre>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="card p-3">
                <h4 className="text-white font-semibold text-sm mb-1">Why partition by driver_id?</h4>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  All pings from one driver land in the same partition → strict ordering → no out-of-order
                  GPS jumps when consumers compute distance traveled.
                </p>
              </div>
              <div className="card p-3">
                <h4 className="text-white font-semibold text-sm mb-1">Why acks=1 (not all)?</h4>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Losing one ping is fine — another arrives in 4 seconds. Speed matters more than
                  durability. acks=all would double the latency.
                </p>
              </div>
              <div className="card p-3">
                <h4 className="text-white font-semibold text-sm mb-1">Why short retention?</h4>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Old GPS pings have no value after the ride. Keep 1 hour for replay during incidents,
                  archive useful aggregates to the warehouse via Connect.
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* 6. Surge Pricing with Kafka Streams */}
        <Section num={6} icon="💰" title="Surge Pricing with Kafka Streams" delay={0.16}>
          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              Surge pricing is real-time per-cell math: <em>"how many requests per available driver right
              now?"</em>. A Kafka Streams app reads both{' '}
              <code className="font-mono text-pink-300 bg-gray-900 px-1.5 py-0.5 rounded text-xs">rider.requests</code>{' '}
              and{' '}
              <code className="font-mono text-pink-300 bg-gray-900 px-1.5 py-0.5 rounded text-xs">driver.locations</code>,
              groups by H3 cell, computes the ratio over a 60-second sliding window, and writes the
              multiplier to{' '}
              <code className="font-mono text-pink-300 bg-gray-900 px-1.5 py-0.5 rounded text-xs">pricing.surge</code>.
            </p>
            <div className="rounded-xl bg-gray-950 border border-gray-800 p-3 font-mono text-[11px] leading-relaxed">
              <div className="text-gray-500 mb-1">// Pseudo-Streams DSL — surge multiplier per cell</div>
              <pre className="text-gray-200 whitespace-pre-wrap">{`const requests = builder.stream('rider.requests');
const drivers  = builder.stream('driver.locations');

const requestsPerCell = requests
  .groupBy((_, r) => r.h3_cell)
  .windowedBy(SlidingWindows.of(60_000))
  .count();

const driversPerCell = drivers
  .groupBy((_, d) => d.h3_cell)
  .windowedBy(SlidingWindows.of(60_000))
  .count();

requestsPerCell
  .join(driversPerCell, (req, drv) => surgeMultiplier(req, drv))
  .toStream()
  .to('pricing.surge');   // compacted topic — only the latest per cell matters`}</pre>
            </div>
            <div className="rounded-xl bg-orange-500/5 border border-orange-500/20 p-3">
              <p className="text-xs text-gray-300 leading-relaxed">
                <strong className="text-orange-400">Concepts used:</strong> Streams (windowing, group-by,
                join), partitioning by h3_cell, and{' '}
                <strong className="text-white">log compaction</strong> on the output topic — the rider app
                only needs <em>the latest</em> surge for the cell, not the historical sequence.
              </p>
            </div>
          </div>
        </Section>

        {/* 7. Payment with Exactly-Once */}
        <Section num={7} icon="💳" title="Payment with Exactly-Once" delay={0.18}>
          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              Payments are the most critical path. <strong className="text-red-400">A double charge ruins a
              customer</strong>; a missed charge ruins your unit economics. The payment service uses
              Kafka transactions to make the charge + write + offset commit{' '}
              <strong className="text-white">atomic</strong>.
            </p>
            <div className="rounded-xl bg-gray-950 border border-gray-800 p-3 font-mono text-[11px] leading-relaxed">
              <div className="text-gray-500 mb-1">// Payment consumer with exactly-once semantics</div>
              <pre className="text-gray-200 whitespace-pre-wrap">{`const producer = createProducer({
  enableIdempotence: true,
  transactionalId: 'payment-svc-v1',
});

await producer.initTransactions();

for (const event of consumer.poll('ride.events')) {
  if (event.type !== 'completed') continue;

  await producer.beginTransaction();
  try {
    // Idempotent: Stripe deduplicates on (idempotencyKey)
    const charge = await stripe.charges.create(
      { amount: event.fareCents, customer: event.riderId },
      { idempotencyKey: event.rideId }
    );

    await producer.send({
      topic: 'payments',
      key: event.rideId,
      value: { rideId: event.rideId, chargeId: charge.id, amount: event.fareCents }
    });

    // Commit consumer offset INSIDE the transaction
    await producer.sendOffsets({
      offsets: { [event.partition]: event.offset + 1 },
      consumerGroupId: 'payment-svc',
    });

    await producer.commitTransaction();
  } catch (err) {
    await producer.abortTransaction();   // nothing was published; offset stays put
    throw err;                            // retried on next poll
  }
}`}</pre>
            </div>
            <p>
              If the service crashes mid-transaction, neither the message nor the offset commit becomes
              visible. The next instance picks up the same{' '}
              <code className="font-mono text-pink-300 bg-gray-900 px-1.5 py-0.5 rounded text-xs">ride.completed</code>{' '}
              event — and Stripe\'s idempotency key prevents the second charge attempt from going through
              twice.
            </p>
          </div>
        </Section>

        {/* 8. Analytics Fan-Out */}
        <Section num={8} icon="📊" title="Analytics Fan-Out via Kafka Connect" delay={0.2}>
          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              The same{' '}
              <code className="font-mono text-pink-300 bg-gray-900 px-1.5 py-0.5 rounded text-xs">ride.events</code>{' '}
              topic that drives matching also feeds the data warehouse, ML training, fraud detection, and
              real-time dashboards. <strong className="text-white">No producer changes needed</strong> for
              new consumers — that\'s the killer feature of Kafka.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="card p-4">
                <h4 className="text-white font-semibold text-sm mb-2">📥 Source Connectors</h4>
                <ul className="text-xs text-gray-400 space-y-1.5">
                  <li>• <strong className="text-gray-300">Postgres CDC</strong> (Debezium) — driver onboarding tables → driver.profiles topic</li>
                  <li>• <strong className="text-gray-300">Stripe webhooks</strong> → payment.events topic</li>
                </ul>
              </div>
              <div className="card p-4">
                <h4 className="text-white font-semibold text-sm mb-2">📤 Sink Connectors</h4>
                <ul className="text-xs text-gray-400 space-y-1.5">
                  <li>• <strong className="text-gray-300">Snowflake</strong> — every event archived for analytics + ML</li>
                  <li>• <strong className="text-gray-300">Elasticsearch</strong> — trip search, driver lookup, fraud rules</li>
                  <li>• <strong className="text-gray-300">S3 (Parquet)</strong> — long-term archive for compliance</li>
                  <li>• <strong className="text-gray-300">Druid / Pinot</strong> — sub-second OLAP dashboards</li>
                </ul>
              </div>
            </div>
          </div>
        </Section>

        {/* 9. Failure Scenarios */}
        <Section num={9} icon="🛟" title="Failure Scenarios" delay={0.22}>
          <p className="text-sm text-gray-400 mb-4 leading-relaxed">
            Things break in real systems. Here\'s how this design holds up under realistic failures.
          </p>
          <div className="space-y-3">
            {[
              {
                icon: '💥',
                title: 'A Kafka broker crashes mid-trip',
                body:
                  'Each partition has 3 replicas (5 for payments). One broker down = no data loss. Producers retry briefly while the new leader is elected (~2s); riders may see a "reconnecting…" spinner but no events are lost.',
              },
              {
                icon: '🔌',
                title: 'The Stripe API is down',
                body:
                  'Payment service catches the error, aborts its transaction, and retries with exponential backoff. After N retries the event lands in payments.dlq for manual reconciliation; ops gets paged. The rider sees "we\'ll retry your payment shortly" — no double charge, no lost ride.',
              },
              {
                icon: '🌐',
                title: 'A whole AWS region goes down',
                body:
                  'MirrorMaker 2 has been replicating every topic to a DR region. DNS fails over rider/driver traffic to the DR cluster. Some in-flight rides may need replay (driver tap "I completed this" again) but no money is lost.',
              },
              {
                icon: '🐌',
                title: 'A consumer group falls behind',
                body:
                  'Lag alarms fire (lag > 60s for 5 minutes). The team scales out the consumer group — Kafka rebalances partitions across the new instances automatically. Catch-up is smooth because data is on disk for hours.',
              },
              {
                icon: '🤖',
                title: 'A bad deploy starts producing garbage',
                body:
                  'Schema Registry rejects messages that violate the Avro contract. Because compatibility is BACKWARD, the bad producer simply fails — no garbage gets onto the topic. Rolling back the deploy resolves it; consumers never had to see broken data.',
              },
            ].map((f) => (
              <div key={f.title} className="card p-4 flex gap-3">
                <span className="text-2xl flex-shrink-0">{f.icon}</span>
                <div>
                  <h4 className="text-white font-semibold text-sm mb-1">{f.title}</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* 10. The Aha Recap */}
        <Section num={10} icon="✨" title="Every Kafka Concept, Mapped" delay={0.24}>
          <p className="text-sm text-gray-400 mb-4 leading-relaxed">
            Where each concept from the main Kafka guide showed up in this design.
          </p>
          <div className="rounded-2xl overflow-hidden border border-gray-800">
            <table className="w-full text-xs">
              <thead className="bg-gray-900/60">
                <tr className="text-left text-[10px] text-gray-400 uppercase tracking-wide">
                  <th className="px-3 py-2 font-medium">Kafka Concept</th>
                  <th className="px-3 py-2 font-medium">Where it shows up at Uber</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {CONCEPT_RECAP.map((r) => (
                  <tr key={r.concept} className="hover:bg-gray-900/30 transition-colors">
                    <td className="px-3 py-2 align-top whitespace-nowrap">
                      <Link
                        to={`/kafka#${r.kafkaSection}`}
                        className="text-brand-400 hover:text-brand-300 font-semibold"
                      >
                        {r.concept}
                      </Link>
                      <div className="text-[10px] text-gray-600 mt-0.5">§ {r.kafkaSection}</div>
                    </td>
                    <td className="px-3 py-2 text-gray-300 leading-relaxed">{r.where}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* 11. Your Turn */}
        <Section num={11} icon="🧑‍🍳" title="Your Turn: Design Food Delivery" delay={0.26}>
          <div className="space-y-4 text-gray-300 leading-relaxed">
            <div className="rounded-2xl p-5 border-2 border-dashed border-brand-500/40 bg-brand-500/5">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="text-xl">🎯</span>
                The exercise
              </h3>
              <p className="text-sm text-gray-200 leading-relaxed mb-3">
                Design a food-delivery app — Swiggy / DoorDash / Uber Eats — using Kafka end-to-end.
                The core flow: customer picks a restaurant → places an order → restaurant accepts and
                prepares → driver picks up → delivers → customer rates.
              </p>
              <p className="text-sm text-gray-200 leading-relaxed mb-3">
                <strong className="text-white">Sketch your design</strong> on paper or in a doc by answering
                the questions below. Then expand each hint to compare with one reasonable answer. There\'s
                no single right answer — but there are good and bad trade-offs, and the hints highlight what
                most production systems converge on.
              </p>
              <div className="text-xs text-gray-400">
                💡 Tip: list every event that happens, then group them into topics, then decide partition
                key, retention, RF, and acks per topic — exactly like the catalogue in §2.
              </div>
            </div>

            <div className="space-y-2">
              {FOOD_DELIVERY_HINTS.map((h, i) => (
                <details key={i} className="card p-4 group">
                  <summary className="cursor-pointer list-none flex items-start gap-3">
                    <span className="text-brand-400 text-sm font-semibold mt-0.5 flex-shrink-0">
                      Q{i + 1}.
                    </span>
                    <span className="text-gray-200 leading-relaxed flex-1">{h.q}</span>
                    <span className="text-gray-500 group-open:rotate-180 transition-transform text-xs ml-2 flex-shrink-0">
                      ▾
                    </span>
                  </summary>
                  <div className="mt-3 pt-3 border-t border-gray-800 flex items-start gap-3">
                    <span className="text-green-400 text-sm font-semibold mt-0.5 flex-shrink-0">💡</span>
                    <p className="text-gray-300 text-sm leading-relaxed flex-1">{h.a}</p>
                  </div>
                </details>
              ))}
            </div>

            <div className="rounded-2xl p-5 bg-green-500/5 border border-green-500/20">
              <h4 className="text-green-400 font-semibold text-sm mb-2 flex items-center gap-2">
                <span>🏁</span>
                Once you\'ve answered all seven
              </h4>
              <p className="text-sm text-gray-200 leading-relaxed">
                You\'ll have a working <strong className="text-white">topic catalogue</strong>, a clear{' '}
                <strong className="text-white">partition strategy</strong>, the right{' '}
                <strong className="text-white">durability settings</strong>, plans for{' '}
                <strong className="text-white">real-time computation</strong> and{' '}
                <strong className="text-white">downstream integration</strong>, and named{' '}
                <strong className="text-white">failure modes</strong> with mitigations. That\'s a complete
                production-grade design — the same skeleton you\'d ship at a real company.
              </p>
            </div>

            <div className="text-center mt-6">
              <Link
                to="/kafka"
                className="inline-flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors"
              >
                ← Back to the Kafka guide
              </Link>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
