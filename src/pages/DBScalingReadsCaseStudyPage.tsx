import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Database Scaling — Reads Case Study  "Flipkart Product Catalog"
 *
 * One real enterprise scenario (Flipkart's product search & catalog) walks
 * through every Database Scaling — Reads subtopic with animated demos:
 *
 *  1. Database Indexing        — why 50 M product rows need indexes
 *  2. Query Optimization       — EXPLAIN ANALYZE, anti-patterns, keyset pagination
 *  3. Read Replicas            — splitting read traffic from writes
 *  4. Connection Pooling       — PgBouncer saving the DB from 10 K connections
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
    indigo: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-200',
    orange: 'border-orange-500/30 bg-orange-500/10 text-orange-200',
  };
  return (
    <div className={`rounded-lg border px-3 py-2 ${t[tone] ?? t.gray}`}>
      <div className="text-[10px] uppercase tracking-wider opacity-60">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

// ─── 1. Indexing Demo ─────────────────────────────────────────────────────────

const INDEX_SCENARIOS = [
  {
    label: 'No index',
    icon: '🐢',
    query: 'SELECT * FROM products WHERE category = \'Electronics\'',
    plan: 'Seq Scan on products (50 M rows)',
    rows: '50,000,000',
    time: '28,400 ms',
    tone: 'red' as const,
    explain: 'Database reads every single row. Like searching every shelf in a 10-story warehouse for red shoes.',
  },
  {
    label: 'Single index',
    icon: '⚡',
    query: 'SELECT * FROM products WHERE category = \'Electronics\'',
    plan: 'Index Scan on idx_category (50 M rows)',
    rows: '1,240,000',
    time: '180 ms',
    tone: 'yellow' as const,
    explain: 'Jumps to Electronics section only — 40× faster. But still touches 1.2 M rows.',
  },
  {
    label: 'Composite index',
    icon: '🚀',
    query: 'SELECT id, name, price FROM products WHERE category=\'Electronics\' AND in_stock=true',
    plan: 'Index Only Scan on idx_cat_stock_price',
    rows: '34,200',
    time: '4 ms',
    tone: 'green' as const,
    explain: 'Covering index answers entirely from the index — never touches the main table. 7,100× faster than no index.',
  },
];

function IndexingDemo() {
  const [active, setActive] = useState(0);
  const s = INDEX_SCENARIOS[active];
  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {INDEX_SCENARIOS.map((sc, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              active === i
                ? 'bg-indigo-500/20 border-indigo-400 text-indigo-200'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
            }`}
          >
            {sc.icon} {sc.label}
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
          {/* Query */}
          <div className="rounded-lg bg-gray-950 border border-gray-700 px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">SQL Query</p>
            <p className="font-mono text-xs text-cyan-300 leading-relaxed">{s.query}</p>
          </div>

          {/* EXPLAIN output */}
          <div className="rounded-lg bg-gray-950 border border-gray-700 px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">EXPLAIN ANALYZE</p>
            <p className="font-mono text-xs text-yellow-200">{s.plan}</p>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Pill label="Rows examined" value={s.rows} tone={s.tone} />
            <Pill label="Execution time" value={s.time} tone={s.tone} />
            <Pill label="Strategy" value={s.label} tone="indigo" />
          </div>

          <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-3 py-2.5">
            <p className="text-xs text-indigo-100 leading-relaxed">💡 {s.explain}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Visual bar comparison */}
      <div className="space-y-1.5 pt-2">
        <p className="text-[10px] uppercase tracking-wider text-gray-500">Query time comparison</p>
        {INDEX_SCENARIOS.map((sc, i) => {
          const widths = ['100%', '0.63%', '0.014%'];
          const colors = ['bg-red-500', 'bg-yellow-400', 'bg-emerald-400'];
          return (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-gray-400 w-28 shrink-0">{sc.label}</span>
              <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: widths[i] }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  className={`h-full rounded-full ${colors[i]}`}
                />
              </div>
              <span className="text-xs font-mono text-gray-300 w-24 text-right shrink-0">{sc.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 2. Query Optimization Demo ───────────────────────────────────────────────

const QUERY_PATTERNS = [
  {
    label: 'Anti-pattern: OFFSET',
    bad: true,
    sql: 'SELECT * FROM products ORDER BY id LIMIT 20 OFFSET 5000000',
    issue: 'OFFSET 5 M: database reads 5,000,020 rows, discards 5,000,000. Gets slower every page.',
    time: '12,400 ms',
    fix: 'Use keyset pagination — jump directly via index on the last seen id.',
  },
  {
    label: 'Fixed: Keyset Pagination',
    bad: false,
    sql: 'SELECT * FROM products WHERE id > 5000000 ORDER BY id LIMIT 20',
    issue: 'Index jump: database reads exactly 20 rows regardless of page number.',
    time: '3 ms',
    fix: 'Always O(log n). Scales to page 10,000 at the same speed as page 1.',
  },
  {
    label: 'Anti-pattern: Function in WHERE',
    bad: true,
    sql: "SELECT * FROM products WHERE LOWER(name) = 'iphone 15'",
    issue: 'LOWER() wraps the column — index on name is completely bypassed. Full scan every time.',
    time: '9,200 ms',
    fix: 'Create an expression index: CREATE INDEX ON products (LOWER(name)).',
  },
  {
    label: 'Fixed: Expression Index',
    bad: false,
    sql: "SELECT * FROM products WHERE name_lower = 'iphone 15'",
    issue: 'Pre-computed lowercase column with index. Exact match via B+ Tree.',
    time: '1 ms',
    fix: 'Store normalised forms as computed columns or use expression indexes.',
  },
];

function QueryOptDemo() {
  const [active, setActive] = useState(0);
  const p = QUERY_PATTERNS[active];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {QUERY_PATTERNS.map((pat, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`px-3 py-2 rounded-lg text-xs font-medium border text-left transition-colors ${
              active === i
                ? pat.bad
                  ? 'bg-red-500/15 border-red-400/50 text-red-200'
                  : 'bg-emerald-500/15 border-emerald-400/50 text-emerald-200'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
            }`}
          >
            {pat.bad ? '🚨' : '✅'} {pat.label}
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
          <div className="rounded-lg bg-gray-950 border border-gray-700 px-4 py-3">
            <p className="font-mono text-xs text-cyan-300 leading-relaxed">{p.sql}</p>
          </div>
          <div className={`rounded-lg border px-3 py-2.5 text-xs leading-relaxed ${
            p.bad
              ? 'border-red-500/30 bg-red-500/5 text-red-200'
              : 'border-emerald-500/30 bg-emerald-500/5 text-emerald-200'
          }`}>
            {p.bad ? '⚠️' : '✅'} {p.issue}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Pill label="Execution time" value={p.time} tone={p.bad ? 'red' : 'green'} />
            <Pill label="Status" value={p.bad ? 'Slow — fix needed' : 'Optimised'} tone={p.bad ? 'red' : 'green'} />
          </div>
          <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-3 py-2.5">
            <p className="text-xs text-indigo-100">📝 {p.fix}</p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── 3. Read Replicas Demo ────────────────────────────────────────────────────

type ServerState = 'primary' | 'replica1' | 'replica2' | 'replica3';
const SERVER_LABELS: Record<ServerState, string> = {
  primary: 'Primary DB',
  replica1: 'Replica — Mumbai',
  replica2: 'Replica — Delhi',
  replica3: 'Replica — Bangalore',
};

function ReplicaDemo() {
  const [requests, setRequests] = useState<{ id: number; type: 'write' | 'read'; target: ServerState; done: boolean }[]>([]);
  const [running, setRunning] = useState(true);
  const [lag, setLag] = useState(false);
  const counter = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      const isWrite = Math.random() < 0.2; // 80% reads, 20% writes
      const replicas: ServerState[] = ['replica1', 'replica2', 'replica3'];
      const target: ServerState = isWrite
        ? 'primary'
        : replicas[Math.floor(Math.random() * replicas.length)];
      const id = ++counter.current;
      setRequests((r) => [...r.slice(-14), { id, type: isWrite ? 'write' : 'read', target, done: false }]);
      setTimeout(() => setRequests((r) => r.map((x) => x.id === id ? { ...x, done: true } : x)), 500);
    }, 450);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running]);

  const servers: { key: ServerState; icon: string; color: string }[] = [
    { key: 'primary',  icon: '👑', color: 'border-yellow-500/40 bg-yellow-500/5' },
    { key: 'replica1', icon: '📖', color: 'border-indigo-500/40 bg-indigo-500/5' },
    { key: 'replica2', icon: '📖', color: 'border-indigo-500/40 bg-indigo-500/5' },
    { key: 'replica3', icon: '📖', color: 'border-indigo-500/40 bg-indigo-500/5' },
  ];

  const activeReqs = requests.filter((r) => !r.done);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setRunning((r) => !r)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
            running ? 'bg-yellow-500/15 border-yellow-400 text-yellow-200' : 'bg-emerald-500/15 border-emerald-400 text-emerald-200'
          }`}
        >
          {running ? '⏸ Pause' : '▶ Play'}
        </button>
        <button
          onClick={() => setLag((l) => !l)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
            lag ? 'bg-red-500/15 border-red-400 text-red-200' : 'bg-gray-800 border-gray-700 text-gray-400'
          }`}
        >
          {lag ? '⚠️ Lag visible' : 'Simulate replication lag'}
        </button>
        <span className="text-xs text-gray-500">Writes → Primary only &nbsp;·&nbsp; Reads → Replicas</span>
      </div>

      {/* Server grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {servers.map((srv) => {
          const hits = activeReqs.filter((r) => r.target === srv.key);
          return (
            <div key={srv.key} className={`rounded-xl border p-3 ${srv.color} relative`}>
              <p className="text-lg text-center mb-1">{srv.icon}</p>
              <p className="text-[10px] text-center text-gray-300 font-semibold">{SERVER_LABELS[srv.key]}</p>
              {srv.key === 'primary' && (
                <p className="text-[9px] text-center text-yellow-400 mt-0.5">Reads + Writes</p>
              )}
              {srv.key !== 'primary' && (
                <p className="text-[9px] text-center text-indigo-300 mt-0.5">Read only</p>
              )}
              {lag && srv.key !== 'primary' && (
                <p className="text-[9px] text-center text-red-400 mt-0.5">~120ms lag</p>
              )}
              {/* Active request dots */}
              <div className="flex flex-wrap justify-center gap-1 mt-2 min-h-[16px]">
                <AnimatePresence>
                  {hits.map((r) => (
                    <motion.span
                      key={r.id}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className={`w-2 h-2 rounded-full ${r.type === 'write' ? 'bg-yellow-400' : 'bg-indigo-400'}`}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      {/* Request log */}
      <div className="rounded-lg bg-gray-950 border border-gray-700 p-3 h-28 overflow-y-auto space-y-1 font-mono text-[11px]">
        <AnimatePresence initial={false}>
          {[...requests].reverse().slice(0, 20).map((r) => (
            <motion.p
              key={r.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className={r.type === 'write' ? 'text-yellow-300' : 'text-indigo-300'}
            >
              [{r.type.toUpperCase()}] → {SERVER_LABELS[r.target]} {r.done ? '✓' : '…'}
            </motion.p>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex gap-3 text-xs text-gray-400 flex-wrap">
        <span><span className="inline-block w-2 h-2 rounded-full bg-yellow-400 mr-1" />Write → Primary</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-indigo-400 mr-1" />Read → Replica</span>
      </div>
    </div>
  );
}

// ─── 4. Connection Pooling Demo ───────────────────────────────────────────────

function ConnectionPoolDemo() {
  const [mode, setMode] = useState<'no-pool' | 'pool' | 'pgbouncer'>('no-pool');
  const [tick, setTick] = useState(0);
  const [running, setRunning] = useState(true);
  const runRef = useRef(running);
  runRef.current = running;

  useEffect(() => {
    const t = setInterval(() => { if (runRef.current) setTick((n) => n + 1); }, 800);
    return () => clearInterval(t);
  }, []);

  const configs = {
    'no-pool': {
      label: 'No pooling',
      appConns: 200,
      dbConns: 200,
      overhead: '50 ms per request',
      status: 'danger',
      desc: '200 app servers × 1 connection each = 200 direct DB connections. Each request opens and closes a connection — 50 ms wasted on handshake alone.',
    },
    pool: {
      label: 'App-level pool (HikariCP)',
      appConns: 200,
      dbConns: 40,
      overhead: '< 1 ms per request',
      status: 'warning',
      desc: 'Each of 20 app servers holds a pool of 2 connections = 40 DB connections. Connections are reused. But adding more servers multiplies DB connections linearly.',
    },
    pgbouncer: {
      label: 'PgBouncer (external pool)',
      appConns: 5000,
      dbConns: 20,
      overhead: '< 0.1 ms per request',
      status: 'success',
      desc: '5,000 app connections (including Lambda functions) share just 20 real DB connections via PgBouncer. DB sees only 20. App sees unlimited capacity.',
    },
  };

  const cfg = configs[mode];
  const active = (tick % 5) < 3;

  const dbConnWidth = Math.min(100, (cfg.dbConns / 200) * 100);
  const dbConnColor = cfg.dbConns > 150 ? 'bg-red-500' : cfg.dbConns > 60 ? 'bg-yellow-400' : 'bg-emerald-400';

  return (
    <div className="space-y-4">
      {/* Mode selector */}
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(configs) as Array<keyof typeof configs>).map((k) => (
          <button
            key={k}
            onClick={() => setMode(k)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              mode === k
                ? 'bg-indigo-500/20 border-indigo-400 text-indigo-200'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
            }`}
          >
            {configs[k].label}
          </button>
        ))}
      </div>

      <button
        onClick={() => setRunning((r) => !r)}
        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
          running ? 'bg-yellow-500/15 border-yellow-400 text-yellow-200' : 'bg-emerald-500/15 border-emerald-400 text-emerald-200'
        }`}
      >
        {running ? '⏸ Pause' : '▶ Play'}
      </button>

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="space-y-3"
        >
          {/* Architecture diagram */}
          <div className="rounded-xl bg-gray-950 border border-gray-700 p-4">
            <div className="flex items-center justify-center gap-3 flex-wrap text-center">
              {/* App */}
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2">
                <p className="text-lg">🖥️</p>
                <p className="text-[10px] text-blue-200 font-semibold">App / Lambda</p>
                <p className="text-[10px] text-blue-300">{cfg.appConns.toLocaleString()} connections</p>
              </div>

              {/* Arrow */}
              <motion.div
                animate={{ x: active ? [0, 4, 0] : 0 }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="text-gray-500 text-lg"
              >→</motion.div>

              {/* PgBouncer (conditional) */}
              {mode === 'pgbouncer' && (
                <>
                  <div className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2">
                    <p className="text-lg">🔀</p>
                    <p className="text-[10px] text-violet-200 font-semibold">PgBouncer</p>
                    <p className="text-[10px] text-violet-300">multiplexes</p>
                  </div>
                  <motion.div
                    animate={{ x: active ? [0, 4, 0] : 0 }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="text-gray-500 text-lg"
                  >→</motion.div>
                </>
              )}

              {/* DB */}
              <div className={`rounded-lg border px-3 py-2 ${
                cfg.dbConns > 150 ? 'border-red-500/40 bg-red-500/10' :
                cfg.dbConns > 60  ? 'border-yellow-500/40 bg-yellow-500/10' :
                                    'border-emerald-500/40 bg-emerald-500/10'
              }`}>
                <p className="text-lg">🗄️</p>
                <p className={`text-[10px] font-semibold ${
                  cfg.dbConns > 150 ? 'text-red-200' : cfg.dbConns > 60 ? 'text-yellow-200' : 'text-emerald-200'
                }`}>PostgreSQL</p>
                <p className={`text-[10px] ${cfg.dbConns > 150 ? 'text-red-300' : cfg.dbConns > 60 ? 'text-yellow-300' : 'text-emerald-300'}`}>
                  {cfg.dbConns} real conns
                </p>
              </div>
            </div>
          </div>

          {/* DB connection gauge */}
          <div>
            <div className="flex justify-between text-[10px] text-gray-500 mb-1">
              <span>DB connections used</span>
              <span>{cfg.dbConns} / 200 (max_connections)</span>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                animate={{ width: `${dbConnWidth}%` }}
                transition={{ duration: 0.5 }}
                className={`h-full rounded-full ${dbConnColor}`}
              />
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-2">
            <Pill label="App connections" value={cfg.appConns.toLocaleString()} tone="blue" />
            <Pill label="Real DB connections" value={String(cfg.dbConns)} tone={cfg.dbConns > 150 ? 'red' : cfg.dbConns > 60 ? 'yellow' : 'green'} />
            <Pill label="Connection overhead" value={cfg.overhead} tone={cfg.status === 'danger' ? 'red' : cfg.status === 'warning' ? 'yellow' : 'green'} />
          </div>

          <p className="text-xs text-gray-300 leading-relaxed bg-gray-900 rounded-lg px-3 py-2.5 border border-gray-700">
            {cfg.desc}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Exercise ─────────────────────────────────────────────────────────────────

const QUESTIONS = [
  {
    q: 'Flipkart\'s product search for "Samsung TV" takes 12 seconds on a 50 M row table. The first thing you check is:',
    options: [
      { text: 'Add more RAM to the database server', correct: false, explanation: 'Vertical scaling helps but doesn\'t fix a missing index. The query will still scan 50 M rows — just faster RAM doesn\'t change the access pattern.' },
      { text: 'Run EXPLAIN ANALYZE and look for Seq Scan on the products table', correct: true, explanation: 'Correct! EXPLAIN ANALYZE shows you exactly what the database is doing. A "Seq Scan" on 50 M rows confirms a missing index — fix that first before anything else.' },
      { text: 'Switch to a NoSQL database', correct: false, explanation: 'Migration is months of work and doesn\'t guarantee improvement. A missing index on any database causes full scans.' },
      { text: 'Add a read replica', correct: false, explanation: 'A replica copies the same slow query to another server. The bottleneck is the missing index, not read throughput — fix the root cause first.' },
    ],
  },
  {
    q: 'A customer browses page 5,000 of search results. The query uses OFFSET 99,980 LIMIT 20 and takes 45 seconds. What is the correct fix?',
    options: [
      { text: 'Increase the database connection pool size', correct: false, explanation: 'Connection count doesn\'t affect OFFSET performance. OFFSET is a data-scanning problem — more connections just means more slow scans in parallel.' },
      { text: 'Switch to keyset pagination: WHERE id > :last_seen_id ORDER BY id LIMIT 20', correct: true, explanation: 'Correct! Keyset pagination uses the index to jump directly to the next page. O(log n) regardless of page depth. No more scanning 99,980 rows to discard them.' },
      { text: 'Cache all 5,000 pages in Redis', correct: false, explanation: 'Caching helps for popular queries but search results are usually unique (different filters, user context). And you\'d still need to generate page 5,000 the first time.' },
      { text: 'Add an index on every column in the SELECT', correct: false, explanation: 'The problem is OFFSET, not a missing index. An index exists — OFFSET forces the DB to read and discard rows even when using an index.' },
    ],
  },
  {
    q: 'You add 3 read replicas to Flipkart\'s product catalog DB. A customer updates their wishlist and immediately refreshes — they don\'t see the change. Why?',
    options: [
      { text: 'The replica has crashed and is not serving requests', correct: false, explanation: 'If the replica crashed, no reads would work — not just the user\'s own write. The behavior described (others can read fine) points to a different cause.' },
      { text: 'Replication lag — the replica hasn\'t received the write yet', correct: true, explanation: 'Correct! Async replication means replicas are milliseconds to seconds behind the primary. The wishlist write went to primary; the read came back from a replica that hasn\'t applied it yet. Fix: read-your-own-writes pattern — route the user\'s next read to primary for a short window after their write.' },
      { text: 'The index is missing on the wishlist table', correct: false, explanation: 'A missing index causes slow queries, not missing data. The data is there — it just hasn\'t reached the replica yet.' },
      { text: 'The connection pool is full', correct: false, explanation: 'A full pool would cause an error (connection timeout), not stale data. The user is successfully getting a response — just stale.' },
    ],
  },
  {
    q: 'Flipkart deploys 500 Lambda functions for product image processing. Each function opens a new PostgreSQL connection. What happens and how do you fix it?',
    options: [
      { text: 'Nothing — PostgreSQL handles unlimited connections', correct: false, explanation: 'PostgreSQL has a hard limit (default: 100 connections). 500 Lambda functions × 1 connection = 400 connection refused errors. The DB crashes under the load.' },
      { text: '500 connections exceed PostgreSQL\'s limit → use RDS Proxy to pool them into ~20 real connections', correct: true, explanation: 'Correct! RDS Proxy (or PgBouncer) sits between Lambda and PostgreSQL. 500 Lambda connections arrive at the proxy; the proxy maintains 20 warm connections to PostgreSQL. Lambda sees unlimited capacity; PostgreSQL sees only 20 connections.' },
      { text: 'Increase max_connections to 10,000 in PostgreSQL config', correct: false, explanation: 'Each connection uses ~10 MB RAM. 10,000 connections = 100 GB just for connections, before any data. PostgreSQL would run out of memory and crash.' },
      { text: 'Use a single global PostgreSQL connection shared across all Lambdas', correct: false, explanation: 'Shared global state across Lambda invocations is dangerous — Lambda instances are separate processes. Concurrent writes through one connection cause serialization and race conditions.' },
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
          Four real scenarios from Flipkart's engineering challenges. Choose the best answer, then reveal the explanation.
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
                if (isChosen && !isRevealed) cls = 'border-indigo-400 bg-indigo-500/15 text-indigo-100';
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
                className="text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
          className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-5 py-4 text-center"
        >
          <p className="text-2xl font-bold text-white">{score} / {QUESTIONS.length}</p>
          <p className="text-sm text-indigo-200 mt-1">
            {score === QUESTIONS.length ? '🏆 Perfect! You\'ve nailed database read scaling.' :
             score >= 3 ? '🎯 Strong performance — ready for senior DB interviews.' :
             score >= 2 ? '📚 Good start — review the explanations and revisit the modules.' :
             '💪 Keep going — these patterns click with practice.'}
          </p>
        </motion.div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DBScalingReadsCaseStudyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">

      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/modules" className="text-xs text-gray-500 hover:text-gray-300 mb-4 inline-block">
          ← Back to Modules
        </Link>

        {/* Company badge */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-2xl shadow-lg shadow-indigo-500/20">
            🛒
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-indigo-400 font-semibold">Enterprise Case Study · Database Scaling Reads</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Flipkart Product Catalog</h1>
          </div>
        </div>

        <p className="text-gray-300 leading-relaxed text-sm sm:text-base mb-5">
          Flipkart serves <strong className="text-white">300 million customers</strong> across India.
          Their product catalog holds <strong className="text-white">500 million SKUs</strong> — everything from iPhones
          to dal packets. On Big Billion Day, the catalog receives <strong className="text-white">5 million search queries per minute</strong>.
          Every millisecond of latency costs real rupees. This is how their engineering team tackled read scaling — using every technique in this module.
        </p>

        {/* Scale metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <Pill label="Products" value="500 M SKUs" tone="indigo" />
          <Pill label="Peak QPS" value="5 M / min" tone="indigo" />
          <Pill label="Uptime SLA" value="99.99 %" tone="green" />
          <Pill label="Search latency" value="< 80 ms p99" tone="green" />
        </div>

        {/* Chapter map */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-3">What you'll learn in this case study</p>
          <div className="grid sm:grid-cols-2 gap-2 text-xs text-gray-300">
            {[
              ['📑', '1. Indexing', 'How Flipkart made a 28-second query run in 4 ms'],
              ['🏎️', '2. Query Optimization', 'OFFSET vs keyset pagination at 500 M rows'],
              ['📖', '3. Read Replicas', 'Routing 5 M QPS across a primary + 3 regional replicas'],
              ['🏊', '4. Connection Pooling', 'How PgBouncer saved the DB from 5,000 Lambda connections'],
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

      {/* Section 1 — Indexing */}
      <SectionShell
        index={1} icon="📑" title="Database Indexing"
        color="border-indigo-500/40 bg-indigo-500/10"
        scenario={`Flipkart's products table has 50 million rows. A product listing query for "Electronics, in stock, price < ₹10,000" was taking 28 seconds. The on-call engineer had one hour to fix it before Big Billion Day. The culprit: no index on category. The fix: a carefully chosen composite index.`}
        takeaway="Always run EXPLAIN ANALYZE before touching anything. A Seq Scan on a table with millions of rows is almost always a missing index. Composite covering indexes can make a query 7,000× faster by answering it entirely from the index — never reading the table."
      >
        <IndexingDemo />
      </SectionShell>

      {/* Section 2 — Query Optimization */}
      <SectionShell
        index={2} icon="🏎️" title="Query Optimization"
        color="border-blue-500/40 bg-blue-500/10"
        scenario={`Flipkart's search results are paginated. A user on page 500 generates: SELECT * FROM products OFFSET 9,980 LIMIT 20. At 50 M rows, deep pages take 45 seconds. The same day, a case-insensitive brand name search — WHERE LOWER(name) = 'samsung' — bypasses the index entirely. Both are textbook anti-patterns.`}
        takeaway="Two rules for every query at scale: (1) Never use OFFSET on large tables — use keyset pagination with the index. (2) Never wrap indexed columns in functions — the index is bypassed. These two changes alone eliminated Flipkart's worst-performing queries."
      >
        <QueryOptDemo />
      </SectionShell>

      {/* Section 3 — Read Replicas */}
      <SectionShell
        index={3} icon="📖" title="Read Replicas"
        color="border-cyan-500/40 bg-cyan-500/10"
        scenario={`Even with perfect indexes, a single PostgreSQL primary can't sustain 5 million catalog reads per minute on Big Billion Day. Flipkart's solution: one primary for writes + 3 regional read replicas (Mumbai, Delhi, Bangalore). Reads route to the nearest replica — writes always go to primary. Watch the traffic distribution live.`}
        takeaway="Read replicas multiply your read throughput linearly — 3 replicas ≈ 3× read capacity. The critical engineering challenge is replication lag: a customer's own writes may not appear on the replica immediately. Solve with the read-your-own-writes pattern — route the user's reads to primary for 5 seconds after their write."
      >
        <ReplicaDemo />
      </SectionShell>

      {/* Section 4 — Connection Pooling */}
      <SectionShell
        index={4} icon="🏊" title="Connection Pooling"
        color="border-violet-500/40 bg-violet-500/10"
        scenario={`Flipkart's image resizing pipeline uses 500 AWS Lambda functions. During a sale, all 500 spin up simultaneously and each opens a new PostgreSQL connection. PostgreSQL's default max_connections is 100. Result: 400 "connection refused" errors. The catalog goes dark. This is the serverless connection crisis — and PgBouncer is the cure.`}
        takeaway="Never open a new DB connection per Lambda invocation. PostgreSQL has hard connection limits (~100–500 default). 500 Lambdas = instant crash. The fix: RDS Proxy or PgBouncer as an external pool. 5,000 app connections share 20 real DB connections — the database sees only 20, everyone else sees instant availability."
      >
        <ConnectionPoolDemo />
      </SectionShell>

      {/* Exercise */}
      <ExerciseSection />

      {/* Architecture summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-blue-500/5 p-6"
      >
        <h3 className="text-lg font-bold text-white mb-3">🏗️ Flipkart's Final Read Architecture</h3>
        <div className="grid sm:grid-cols-2 gap-3 text-xs text-gray-300 leading-relaxed">
          {[
            ['📑 Indexing layer', 'Composite covering indexes on (category, in_stock, price). Index-only scans for product listings. Expression indexes for case-insensitive searches.'],
            ['🏎️ Query layer', 'All pagination converted to keyset. EXPLAIN ANALYZE runs in CI — any Seq Scan on a table > 1M rows fails the build.'],
            ['📖 Replica layer', 'Primary in Mumbai + read replicas in Delhi and Bangalore. ProxySQL routes reads to nearest replica. Read-your-own-writes enforced via sticky routing for 5 s post-write.'],
            ['🏊 Connection layer', 'PgBouncer in transaction mode. 5,000 Lambda connections → 20 real DB connections. Connection overhead: 0.05 ms vs 50 ms without pooling.'],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-3">
              <p className="font-semibold text-indigo-200 mb-1">{title}</p>
              <p className="text-gray-400">{desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/modules" className="text-xs text-indigo-300 hover:text-indigo-200">← All Modules</Link>
          <Link to="/case-study/swiggy-writes" className="text-xs text-violet-300 hover:text-violet-200">Next: Swiggy Write Scaling →</Link>
        </div>
      </motion.div>
    </div>
  );
}
