import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Database Scaling — Writes Case Study  "Swiggy Order System"
 *
 * One real enterprise scenario (Swiggy's order & delivery platform) walks
 * through every Database Scaling — Writes subtopic with animated demos:
 *
 *  1. Vertical & Horizontal Partitioning  — splitting the 4-billion-row orders table
 *  2. Database Sharding                   — distributing writes across city-based shards
 *  3. Database Compression                — reducing 80 TB of order history to 9 TB
 *
 * Ends with a 4-question interview exercise.
 */

// ─── Shared shells ────────────────────────────────────────────────────────────

function SectionShell({
  index, icon, title, scenario, children, takeaway, color,
}: {
  index: number; icon: string; title: string; scenario: string;
  children: React.ReactNode; takeaway: string; color: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-gray-800 bg-gray-950/60 p-5 sm:p-7"
    >
      <div className="flex items-start gap-4 mb-5">
        <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border ${color}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Subtopic {index}</p>
          <h2 className="text-xl sm:text-2xl font-bold text-white">{title}</h2>
          <p className="mt-1.5 text-sm text-gray-400 leading-relaxed">{scenario}</p>
        </div>
      </div>
      <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 sm:p-5 mb-4">{children}</div>
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
        <p className="text-[11px] uppercase tracking-wider text-emerald-300 font-semibold mb-1">🎯 Interview takeaway</p>
        <p className="text-sm text-gray-200 leading-relaxed">{takeaway}</p>
      </div>
    </motion.section>
  );
}

function Pill({ label, value, tone = 'gray' }: { label: string; value: string; tone?: string }) {
  const t: Record<string, string> = {
    gray:   'border-gray-700 bg-gray-800/60 text-gray-200',
    green:  'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    red:    'border-red-500/30 bg-red-500/10 text-red-200',
    blue:   'border-blue-500/30 bg-blue-500/10 text-blue-200',
    yellow: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-200',
    violet: 'border-violet-500/30 bg-violet-500/10 text-violet-200',
    orange: 'border-orange-500/30 bg-orange-500/10 text-orange-200',
  };
  return (
    <div className={`rounded-lg border px-3 py-2 ${t[tone] ?? t.gray}`}>
      <div className="text-[10px] uppercase tracking-wider opacity-60">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

// ─── 1. Partitioning Demo ─────────────────────────────────────────────────────

const PARTITION_MODES = [
  {
    key: 'none',
    label: 'No partitioning',
    icon: '🐢',
    tableSize: '4 B rows, single file',
    queryTarget: 'Entire 4 B row table',
    queryTime: '92,000 ms',
    deleteTime: 'DELETE 800 M rows → 14 hrs',
    tone: 'red' as const,
    desc: 'One giant orders table. A monthly statement query scans all 4 billion rows. Deleting old data takes 14 hours and locks the table.',
  },
  {
    key: 'vertical',
    label: 'Vertical partitioning',
    icon: '↕️',
    tableSize: 'orders_core (50 B) + orders_detail (2 KB each)',
    queryTarget: 'orders_core only — 10× smaller rows',
    queryTime: '9,200 ms',
    deleteTime: 'Unchanged — rows still scattered',
    tone: 'yellow' as const,
    desc: 'Split wide table: orders_core (id, city, amount, status, created_at) vs orders_detail (instructions, feedback, coordinates). Dashboard query hits orders_core — 10× fewer bytes per row.',
  },
  {
    key: 'horizontal',
    label: 'Horizontal partitioning',
    icon: '↔️',
    tableSize: 'Monthly partitions, ~100 M rows each',
    queryTarget: 'orders_2024_03 — one partition (100 M rows)',
    queryTime: '1,800 ms',
    deleteTime: 'DROP TABLE orders_2022_01 → 80 ms',
    tone: 'yellow' as const,
    desc: 'Partition by created_at month. March 2024 statement only scans orders_2024_03. Dropping 2-year-old data: DROP partition = instant vs 14-hour DELETE.',
  },
  {
    key: 'both',
    label: 'Vertical + Horizontal',
    icon: '🚀',
    tableSize: 'Thin monthly partitions on core columns',
    queryTarget: 'orders_core_2024_03 — 100 M rows, tiny rows',
    queryTime: '180 ms',
    deleteTime: 'DROP TABLE → 80 ms',
    tone: 'green' as const,
    desc: 'Best of both: thin rows (vertical split) inside monthly partitions (horizontal). Monthly statement: 180 ms. Old data cleanup: instant. This is the production setup.',
  },
];

function PartitioningDemo() {
  const [active, setActive] = useState(0);
  const mode = PARTITION_MODES[active];

  const timeMs = [92000, 9200, 1800, 180];
  const maxTime = 92000;

  return (
    <div className="space-y-4">
      {/* Mode buttons */}
      <div className="flex flex-wrap gap-2">
        {PARTITION_MODES.map((m, i) => (
          <button
            key={m.key}
            onClick={() => setActive(i)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              active === i
                ? 'bg-violet-500/20 border-violet-400 text-violet-200'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
            }`}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Pill label="Table structure" value={mode.tableSize} tone={mode.tone} />
            <Pill label="Query touches" value={mode.queryTarget} tone={mode.tone} />
            <Pill label="Statement query" value={mode.queryTime} tone={mode.tone} />
            <Pill label="Delete old data" value={mode.deleteTime} tone={mode.tone} />
          </div>

          <p className="text-xs text-gray-300 leading-relaxed bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5">
            {mode.desc}
          </p>

          {/* Partition visualisation */}
          {active >= 2 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Partition layout (orders table, by month)</p>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
                {['Jan \'22', 'Feb \'22', 'Mar \'22', '...', 'Jan \'24', 'Feb \'24', 'Mar \'24', 'Apr \'24'].map((label, i) => (
                  <div
                    key={i}
                    className={`rounded px-1 py-2 text-center text-[9px] font-mono border transition-colors ${
                      label === 'Mar \'24'
                        ? 'border-violet-400 bg-violet-500/20 text-violet-200'
                        : label.includes('\'22')
                        ? 'border-red-500/20 bg-red-500/5 text-red-400 opacity-50'
                        : 'border-gray-700 bg-gray-800 text-gray-500'
                    }`}
                  >
                    {label}
                    {label === 'Mar \'24' && <p className="text-[8px] text-violet-300 mt-0.5">← query</p>}
                    {label.includes('\'22') && <p className="text-[8px] text-red-400 mt-0.5">← drop</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Speed comparison bars */}
      <div className="space-y-1.5 pt-2">
        <p className="text-[10px] uppercase tracking-wider text-gray-500">Monthly statement query time</p>
        {PARTITION_MODES.map((m, i) => (
          <div key={m.key} className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-36 shrink-0">{m.icon} {m.label}</span>
            <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(timeMs[i] / maxTime) * 100}%` }}
                transition={{ duration: 0.7, delay: i * 0.1 }}
                className={`h-full rounded-full ${
                  i === 0 ? 'bg-red-500' : i === 3 ? 'bg-emerald-400' : 'bg-yellow-400'
                }`}
              />
            </div>
            <span className="text-xs font-mono text-gray-300 w-20 text-right shrink-0">{m.queryTime}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 2. Sharding Demo ─────────────────────────────────────────────────────────

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad'];
const CITY_COLORS = ['bg-indigo-500', 'bg-violet-500', 'bg-pink-500', 'bg-cyan-500', 'bg-orange-500', 'bg-emerald-500', 'bg-yellow-500', 'bg-blue-500'];

type ShardMode = 'no-shard' | 'city-shard' | 'hash-shard';

function ShardingDemo() {
  const [mode, setMode] = useState<ShardMode>('no-shard');
  const [orders, setOrders] = useState<{ id: number; city: string; shard: number; x: number }[]>([]);
  const [running, setRunning] = useState(true);
  const counter = useRef(0);
  const runRef = useRef(running);
  runRef.current = running;

  useEffect(() => {
    const t = setInterval(() => {
      if (!runRef.current) return;
      const cityIdx = Math.floor(Math.random() * CITIES.length);
      const city = CITIES[cityIdx];
      let shard = 0;
      if (mode === 'city-shard') shard = cityIdx % 4;
      else if (mode === 'hash-shard') shard = (counter.current * 2654435761) % 4;
      const id = ++counter.current;
      setOrders((o) => [...o.slice(-40), { id, city, shard, x: Math.random() * 80 + 10 }]);
    }, 300);
    return () => clearInterval(t);
  }, [mode, running]);

  const shardLabels = ['Shard 0', 'Shard 1', 'Shard 2', 'Shard 3'];

  // Count per shard
  const shardCounts = [0, 1, 2, 3].map((s) => orders.filter((o) => o.shard === s).length);
  const maxCount = Math.max(...shardCounts, 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {([
          ['no-shard', '🐢 No sharding'],
          ['city-shard', '🏙️ City-based sharding'],
          ['hash-shard', '🔀 Hash-based sharding'],
        ] as [ShardMode, string][]).map(([k, label]) => (
          <button
            key={k}
            onClick={() => { setMode(k); setOrders([]); }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              mode === k
                ? 'bg-violet-500/20 border-violet-400 text-violet-200'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
            }`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => setRunning((r) => !r)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
            running ? 'bg-yellow-500/15 border-yellow-400 text-yellow-200' : 'bg-emerald-500/15 border-emerald-400 text-emerald-200'
          }`}
        >
          {running ? '⏸ Pause' : '▶ Play'}
        </button>
      </div>

      {mode === 'no-shard' && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-200">
          ⚠️ All 4 billion orders write to a single database. During dinner rush (6–9 PM), writes queue up. One slow query blocks everyone. Single machine = single point of failure.
        </div>
      )}
      {mode === 'city-shard' && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-3 py-2 text-xs text-yellow-200">
          🏙️ Each city routes to a shard: Mumbai → Shard 0, Delhi → Shard 1, etc. Great for city-level queries. Risk: Mumbai has 5× more orders than Ahmedabad → hot shard.
        </div>
      )}
      {mode === 'hash-shard' && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-200">
          🔀 hash(order_id) % 4 → evenly distributed across all shards regardless of city. Cross-city queries (e.g. "all orders in Mumbai") now require querying all 4 shards (scatter-gather).
        </div>
      )}

      {/* Shard load bars */}
      {mode !== 'no-shard' && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-gray-500">Write load per shard (last 40 orders)</p>
          {shardLabels.map((label, si) => (
            <div key={si} className="flex items-center gap-3">
              <span className="text-xs text-gray-400 w-16 shrink-0">{label}</span>
              <div className="flex-1 bg-gray-800 rounded-full h-3 overflow-hidden">
                <motion.div
                  animate={{ width: `${(shardCounts[si] / maxCount) * 100}%` }}
                  transition={{ duration: 0.3 }}
                  className={`h-full rounded-full ${
                    mode === 'city-shard' && shardCounts[si] === maxCount ? 'bg-yellow-400' : 'bg-violet-500'
                  }`}
                />
              </div>
              <span className="text-xs font-mono text-gray-300 w-8 text-right shrink-0">{shardCounts[si]}</span>
            </div>
          ))}
        </div>
      )}

      {/* Live order stream */}
      <div className="rounded-lg bg-gray-950 border border-gray-700 p-3 h-24 overflow-y-auto font-mono text-[11px] space-y-0.5">
        <AnimatePresence initial={false}>
          {[...orders].reverse().slice(0, 15).map((o) => (
            <motion.div
              key={o.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-2 items-center"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${CITY_COLORS[CITIES.indexOf(o.city)]}`} />
              <span className="text-gray-400">Order #{o.id}</span>
              <span className="text-violet-300">{o.city}</span>
              {mode !== 'no-shard' && (
                <span className="text-gray-500">→ Shard {o.shard}</span>
              )}
              {mode === 'no-shard' && (
                <span className="text-red-400">→ single DB 🐢</span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── 3. Compression Demo ──────────────────────────────────────────────────────

const COMPRESSION_TIERS = [
  {
    label: 'No compression',
    icon: '📦',
    rawSize: '80 TB',
    compressedSize: '80 TB',
    ratio: '1×',
    cost: '₹8,00,000 / month',
    queryTime: '8 min (seq scan)',
    tone: 'red' as const,
    desc: 'All 4 billion orders stored as full PostgreSQL rows. Every column for every order, uncompressed. Storage bill: ₹8 lakh/month.',
  },
  {
    label: 'LZ4 block compression',
    icon: '⚡',
    rawSize: '80 TB',
    compressedSize: '28 TB',
    ratio: '2.8×',
    cost: '₹2,80,000 / month',
    queryTime: '3 min',
    tone: 'yellow' as const,
    desc: 'PostgreSQL page-level LZ4 compression on recent orders (< 90 days). Fast to compress/decompress — minimal write overhead. Good for hot data.',
  },
  {
    label: 'TimescaleDB chunks (warm)',
    icon: '🗜️',
    rawSize: '80 TB',
    compressedSize: '8 TB',
    ratio: '10×',
    cost: '₹80,000 / month',
    queryTime: '45 sec (on compressed chunks)',
    tone: 'yellow' as const,
    desc: 'Orders older than 90 days moved to TimescaleDB compressed chunks: delta-delta encoding on timestamps, RLE on status column (95% "delivered"), dictionary on city. 10× compression.',
  },
  {
    label: 'Parquet on S3 (cold)',
    icon: '🏔️',
    rawSize: '80 TB',
    compressedSize: '9 TB total',
    ratio: '12× avg',
    cost: '₹90,000 / month (all tiers)',
    queryTime: '< 1 sec (Athena on cold)',
    tone: 'green' as const,
    desc: 'Full tiered setup: hot PostgreSQL (LZ4) + warm TimescaleDB compressed chunks + cold Parquet+Zstd on S3. Queries via Athena for analytics. Total: ₹90K/month vs ₹8L. 88% savings.',
  },
];

function CompressionDemo() {
  const [active, setActive] = useState(0);
  const tier = COMPRESSION_TIERS[active];

  const sizes = [80, 28, 8, 9];
  const costs = [800000, 280000, 80000, 90000];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {COMPRESSION_TIERS.map((t, i) => (
          <button
            key={t.label}
            onClick={() => setActive(i)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              active === i
                ? 'bg-violet-500/20 border-violet-400 text-violet-200'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Pill label="Raw size" value={tier.rawSize} tone="gray" />
            <Pill label="Stored size" value={tier.compressedSize} tone={tier.tone} />
            <Pill label="Ratio" value={tier.ratio} tone={tier.tone} />
            <Pill label="Monthly cost" value={tier.cost} tone={tier.tone} />
          </div>
          <p className="text-xs text-gray-300 leading-relaxed bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5">
            {tier.desc}
          </p>

          {/* Encoding breakdown for TimescaleDB tier */}
          {active === 2 && (
            <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2.5 space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-violet-300 font-semibold">How 10× is achieved on order data</p>
              {[
                ['created_at column', 'Delta-delta encoding: timestamps differ by ~30 s → store deltas (4 bytes vs 8 bytes) + LZ4'],
                ['status column', 'Run-Length Encoding: 95% rows are "delivered" → {delivered × 3.8B} = ~4 bytes total'],
                ['city column', 'Dictionary encoding: {0: Mumbai, 1: Delhi…} → 8 cities → 1 byte each vs 9 bytes avg'],
                ['amount column', 'Delta encoding: prices cluster around ₹200–800 → store deltas, not absolute values'],
              ].map(([col, enc]) => (
                <div key={col} className="flex gap-2 text-xs">
                  <span className="text-violet-300 shrink-0 w-28">{col}</span>
                  <span className="text-gray-400">{enc}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Storage + cost comparison */}
      <div className="space-y-2 pt-1">
        <p className="text-[10px] uppercase tracking-wider text-gray-500">Storage used (TB)</p>
        {COMPRESSION_TIERS.map((t, i) => (
          <div key={t.label} className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-36 shrink-0">{t.icon} {t.label}</span>
            <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(sizes[i] / 80) * 100}%` }}
                transition={{ duration: 0.7, delay: i * 0.1 }}
                className={`h-full rounded-full ${i === 0 ? 'bg-red-500' : i === 3 ? 'bg-emerald-400' : 'bg-yellow-400'}`}
              />
            </div>
            <span className="text-xs font-mono text-gray-300 w-12 text-right shrink-0">{sizes[i]} TB</span>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-wider text-gray-500">Monthly storage cost (₹)</p>
        {COMPRESSION_TIERS.map((t, i) => (
          <div key={t.label} className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-36 shrink-0">{t.icon} {t.label}</span>
            <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(costs[i] / 800000) * 100}%` }}
                transition={{ duration: 0.7, delay: i * 0.1 }}
                className={`h-full rounded-full ${i === 0 ? 'bg-red-500' : i === 3 ? 'bg-emerald-400' : 'bg-yellow-400'}`}
              />
            </div>
            <span className="text-xs font-mono text-gray-300 w-20 text-right shrink-0">
              ₹{(costs[i] / 100000).toFixed(1)}L
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Exercise ─────────────────────────────────────────────────────────────────

const QUESTIONS = [
  {
    q: "Swiggy's orders table has 4 billion rows and monthly partner reports run in 92 seconds. The engineering manager wants it under 2 seconds without adding new machines. What's your first step?",
    options: [
      { text: 'Add an index on created_at and re-run the query', correct: false, explanation: 'An index on a 4 billion row table helps for point lookups, but a monthly range scan still reads hundreds of millions of rows. The table structure itself is the problem.' },
      { text: 'Partition the table by month — reports instantly scope to one partition via pruning', correct: true, explanation: 'Correct! Monthly range partitioning means the monthly report query only scans orders_2024_03 (~100 M rows) instead of all 4 billion. Partition pruning is automatic — same SQL, same machine, dramatically smaller scan.' },
      { text: 'Move the table to a faster SSD storage class', correct: false, explanation: 'Faster storage reduces I/O latency but doesn\'t change how many rows are scanned. A 92-second full table scan on faster SSDs might become 60 seconds — still far too slow.' },
      { text: 'Rewrite the report to use aggregated Redis counters', correct: false, explanation: 'Redis counters are great for real-time metrics but partner reports need detailed line-item data. You can\'t retroactively aggregate years of complex order data into Redis counters.' },
    ],
  },
  {
    q: "Swiggy expands to 500 cities. All orders write to a single PostgreSQL primary. During Friday dinner rush (6–9 PM), write latency spikes to 8 seconds. What's the right architectural fix?",
    options: [
      { text: 'Add 10 read replicas', correct: false, explanation: 'Read replicas only scale reads. All writes still go to the single primary. During dinner rush the bottleneck is write throughput — adding replicas has zero effect on write latency.' },
      { text: 'Shard the orders table by city_id — each shard handles one group of cities', correct: true, explanation: 'Correct! Sharding distributes writes across multiple primary databases. City-based sharding works well because most queries are city-scoped (restaurant availability, driver routing) — they naturally stay within one shard. Write throughput scales linearly with number of shards.' },
      { text: 'Enable connection pooling with PgBouncer', correct: false, explanation: 'PgBouncer reduces connection overhead (helpful!) but doesn\'t increase write throughput. The bottleneck is the single-primary write capacity — not connection count.' },
      { text: 'Partition the orders table by created_at', correct: false, explanation: 'Partitioning organises data within one server — it doesn\'t distribute write load. The single primary still handles all writes; partitioning just makes it easier to query and archive.' },
    ],
  },
  {
    q: "Swiggy's DBA reports the orders table is 80 TB and growing 2 TB/month. Cloud storage costs ₹8 lakh/month. 95% of queries only access the last 90 days. What's the most impactful immediate action?",
    options: [
      { text: 'Buy cheaper on-premise storage hardware', correct: false, explanation: 'On-premise hardware takes months to procure, install, and configure. It also shifts cost from OpEx to CapEx without solving the data organisation problem. Cloud tiering achieves the same savings in days.' },
      { text: 'Compress recent data with LZ4 and move orders older than 90 days to compressed Parquet on S3', correct: true, explanation: 'Correct! 95% of queries access only the last 90 days — the remaining 90% of data is cold. Moving cold orders to Parquet+Zstd on S3 ($0.023/GB vs $0.10/GB on SSD) cuts the bill by ~80%. Queries against cold data go via Athena, which is fast enough for batch reports.' },
      { text: 'Delete all orders older than 1 year', correct: false, explanation: 'Deleting customer order history violates data retention regulations and destroys valuable analytics data. Companies keep years of order data for compliance, ML training, and business analytics.' },
      { text: 'Increase the PostgreSQL shared_buffers to cache more data in RAM', correct: false, explanation: 'Shared buffers help with hot data but 80 TB of orders cannot fit in RAM regardless. The cold data (90% of the table) costs money whether it\'s cached or not — tiered storage solves the cost problem.' },
    ],
  },
  {
    q: 'You shard Swiggy orders by city_id (4 shards). A new feature needs: "Show all orders in Maharashtra" (covers Mumbai, Pune, Nashik — each on different shards). How do you handle this query?',
    options: [
      { text: 'This is impossible with sharding — migrate back to a single database', correct: false, explanation: 'Cross-shard queries are complex but absolutely solvable. Every major sharded system handles them. Migrating back loses all the write scaling you gained.' },
      { text: 'Use scatter-gather: query all relevant shards in parallel, merge results in the application layer', correct: true, explanation: 'Correct! Scatter-gather is the standard pattern for cross-shard queries. Fan out the query to shards 0 (Mumbai), 1 (Pune), 2 (Nashik) in parallel, collect results, merge and sort in application code. For analytics, offload to a separate OLAP database (BigQuery/Redshift) that receives a copy of all shards via CDC.' },
      { text: 'Add a global index table mapping city to shard, query each shard sequentially', correct: false, explanation: 'The global index idea is good but sequential shard queries are slow — 3 network round trips instead of 1. Parallel scatter-gather is much faster. Sequential is only needed if the result from shard N determines which shard to query next.' },
      { text: 'Change the shard key to state_id instead of city_id', correct: false, explanation: 'Changing the shard key requires migrating all data — billions of rows moving between shards. And state_id might create hot shards (Maharashtra has far more orders than smaller states). Scatter-gather is the correct pattern for cross-shard aggregation without resharding.' },
    ],
  },
];

function ExerciseSection() {
  const [answers, setAnswers] = useState<(number | null)[]>(QUESTIONS.map(() => null));
  const [revealed, setRevealed] = useState<boolean[]>(QUESTIONS.map(() => false));
  const score = answers.filter((a, i) => a !== null && QUESTIONS[i].options[a!]?.correct).length;

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-950/60 p-5 sm:p-7 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">🎓 Interview Exercise</h2>
        <p className="text-gray-400 text-sm mt-1">
          Four real scenarios from Swiggy's engineering war room. Each tests your write-scaling judgment.
        </p>
      </div>

      {QUESTIONS.map((q, qi) => {
        const chosen = answers[qi];
        const isRevealed = revealed[qi];
        return (
          <div key={qi} className="space-y-3">
            <p className="text-sm font-semibold text-white leading-relaxed">
              Q{qi + 1}. {q.q}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                const isChosen = chosen === oi;
                const isCorrect = opt.correct;
                let cls = 'border-gray-700 bg-gray-900/60 text-gray-300 hover:border-gray-600';
                if (isChosen && !isRevealed) cls = 'border-violet-400 bg-violet-500/15 text-violet-100';
                if (isRevealed && isCorrect) cls = 'border-emerald-400 bg-emerald-500/15 text-emerald-100';
                if (isRevealed && isChosen && !isCorrect) cls = 'border-red-400 bg-red-500/15 text-red-100';
                return (
                  <button
                    key={oi}
                    onClick={() => !isRevealed && setAnswers((a) => { const n = [...a]; n[qi] = oi; return n; })}
                    className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-colors ${cls}`}
                  >
                    {opt.text}
                  </button>
                );
              })}
            </div>
            {isRevealed && chosen !== null && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-lg border px-4 py-3 text-xs leading-relaxed ${
                  QUESTIONS[qi].options[chosen]?.correct
                    ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-200'
                    : 'border-red-500/30 bg-red-500/5 text-red-200'
                }`}
              >
                {QUESTIONS[qi].options[chosen]?.explanation}
              </motion.div>
            )}
            {!isRevealed && (
              <button
                onClick={() => setRevealed((r) => { const n = [...r]; n[qi] = true; return n; })}
                disabled={chosen === null}
                className="text-xs text-violet-400 hover:text-violet-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Reveal explanation →
              </button>
            )}
          </div>
        );
      })}

      {revealed.every(Boolean) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-5 py-4 text-center"
        >
          <p className="text-2xl font-bold text-white">{score} / {QUESTIONS.length}</p>
          <p className="text-sm text-violet-200 mt-1">
            {score === QUESTIONS.length ? '🏆 Perfect! You\'re ready to design write-scalable databases.' :
             score >= 3 ? '🎯 Strong — you understand the core write scaling patterns.' :
             score >= 2 ? '📚 Getting there — re-read the explanations and revisit the demos.' :
             '💪 These patterns take time — try the demos again, then retake.'}
          </p>
        </motion.div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DBScalingWritesCaseStudyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">

      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/modules" className="text-xs text-gray-500 hover:text-gray-300 mb-4 inline-block">
          ← Back to Modules
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-600 flex items-center justify-center text-2xl shadow-lg shadow-violet-500/20">
            🛵
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-violet-400 font-semibold">Enterprise Case Study · Database Scaling Writes</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Swiggy Order System</h1>
          </div>
        </div>

        <p className="text-gray-300 leading-relaxed text-sm sm:text-base mb-5">
          Swiggy processes <strong className="text-white">3 million orders per day</strong> across
          500+ Indian cities. Their orders database has accumulated <strong className="text-white">4 billion rows
          and 80 TB of data</strong>. On Friday evenings, write throughput spikes 10×. Monthly partner settlement
          reports used to take 92 seconds. Storage costs hit <strong className="text-white">₹8 lakh per month</strong>.
          This is how Swiggy's platform team tackled write scaling — using every technique in this module.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <Pill label="Orders / day" value="3 M" tone="violet" />
          <Pill label="Total rows" value="4 B" tone="violet" />
          <Pill label="Data size" value="80 TB raw" tone="violet" />
          <Pill label="Cities served" value="500+" tone="green" />
        </div>

        {/* Chapter map */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-3">What you'll learn in this case study</p>
          <div className="grid sm:grid-cols-3 gap-2 text-xs text-gray-300">
            {[
              ['🗂️', '1. Partitioning', 'Monthly reports from 92 s → 180 ms, data cleanup from 14 hrs → 80 ms'],
              ['🔀', '2. Sharding', 'Distributing 3 M writes/day across city-based shards'],
              ['🗜️', '3. Compression', '80 TB → 9 TB, ₹8 lakh → ₹90 K/month storage bill'],
            ].map(([icon, title, desc]) => (
              <div key={title} className="flex gap-2.5 items-start">
                <span className="text-base mt-0.5 shrink-0">{icon}</span>
                <div>
                  <p className="font-semibold text-white">{title}</p>
                  <p className="text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Section 1 — Partitioning */}
      <SectionShell
        index={1} icon="🗂️" title="Vertical & Horizontal Partitioning"
        color="border-violet-500/40 bg-violet-500/10"
        scenario="Swiggy's orders table is one massive file: id, city, restaurant, driver, customer, amount, status, created_at, delivery_address, instructions, feedback, coordinates — all in one row. Partner reports query this table daily. With 4 billion rows and no partitioning, a monthly report scans everything. The engineering team applied partitioning in two dimensions."
        takeaway="Vertical partitioning removes columns from the hot query path — thinner rows fit more in buffer cache. Horizontal partitioning by time enables partition pruning — a monthly query scans 1 partition not 4 billion rows. Combined: 92 seconds → 180 ms on the same hardware. And old data cleanup goes from a 14-hour DELETE to an 80-millisecond DROP partition."
      >
        <PartitioningDemo />
      </SectionShell>

      {/* Section 2 — Sharding */}
      <SectionShell
        index={2} icon="🔀" title="Database Sharding"
        color="border-pink-500/40 bg-pink-500/10"
        scenario="Swiggy's 500 cities generate wildly different order volumes. Mumbai alone accounts for 25% of all orders. During Friday dinner rush, a single PostgreSQL primary receives 50,000 writes per minute. CPU hits 95%, write latency spikes to 8 seconds, and drivers' real-time location updates start failing. One database can't absorb this — it's time to shard."
        takeaway="Shard when writes are the bottleneck and one machine genuinely cannot keep up. City-based sharding works because most queries are city-scoped — they stay within one shard. The trade-off: cross-city queries (Maharashtra-wide reports) require scatter-gather across multiple shards. Solve with a separate analytics database (BigQuery) that receives a full copy via CDC, purpose-built for cross-shard aggregation."
      >
        <ShardingDemo />
      </SectionShell>

      {/* Section 3 — Compression */}
      <SectionShell
        index={3} icon="🗜️" title="Database Compression"
        color="border-orange-500/40 bg-orange-500/10"
        scenario="Swiggy's orders table is 80 TB and growing 2 TB/month. Cloud storage costs ₹8 lakh/month. Yet 95% of all queries only access the last 90 days of data. The remaining 90% of the table — years of historical orders — sits on expensive NVMe SSDs doing nothing. The solution: tiered compression that matches storage cost to access frequency."
        takeaway="Compression is not just about saving space — it's about cache efficiency. Compressed data fits more easily in RAM, which means more queries answered from memory instead of slow disk. The order status column ('delivered' for 95% of rows) compresses from 9 bytes to effectively 0 with RLE. Tiered storage (hot → warm → cold) is the production pattern: pay NVMe prices only for the 10% of data that's actually queried."
      >
        <CompressionDemo />
      </SectionShell>

      {/* Exercise */}
      <ExerciseSection />

      {/* Architecture summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-pink-500/5 p-6"
      >
        <h3 className="text-lg font-bold text-white mb-3">🏗️ Swiggy's Final Write Architecture</h3>
        <div className="grid sm:grid-cols-3 gap-3 text-xs text-gray-300 leading-relaxed">
          {[
            ['🗂️ Partitioning layer', 'Vertical split: orders_core (thin, hot) + orders_detail (wide, cold). Horizontal: monthly PostgreSQL partitions. pg_partman automates monthly creation and 2-year retention DROP.'],
            ['🔀 Sharding layer', '4 city-based PostgreSQL shards (Metro / Tier-1 / Tier-2 / Tier-3). Vitess for query routing and online schema changes. Cross-shard analytics via CDC → BigQuery.'],
            ['🗜️ Compression layer', 'Hot (< 90 days): PostgreSQL LZ4 block compression. Warm (90 days – 2 years): TimescaleDB compressed chunks (10× ratio). Cold (> 2 years): Parquet + Zstd on S3, queried via Athena. Total cost: ₹90 K vs ₹8 L.'],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-lg bg-violet-500/10 border border-violet-500/20 p-3">
              <p className="font-semibold text-violet-200 mb-1">{title}</p>
              <p className="text-gray-400">{desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/case-study/flipkart-reads" className="text-xs text-indigo-300 hover:text-indigo-200">← Flipkart Read Scaling</Link>
          <Link to="/modules" className="text-xs text-gray-400 hover:text-gray-200">All Modules →</Link>
        </div>
      </motion.div>
    </div>
  );
}
