import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Banking Case Study — "PayBank"
 * A single product walkthrough that shows how every Core Concept
 * shows up when you build a real digital bank / UPI-style payments app.
 *
 * Each section: real banking scenario → interactive visual → interview takeaway.
 * Ends with a practice challenge the learner can reason through themselves.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Shared layout helpers
// ─────────────────────────────────────────────────────────────────────────────

function SectionShell({
  index,
  icon,
  title,
  scenario,
  children,
  takeaway,
  color,
}: {
  index: number;
  icon: string;
  title: string;
  scenario: string;
  children: React.ReactNode;
  takeaway: string;
  color: string;
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
        <div
          className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border ${color}`}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
            Concept {index}
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-white">{title}</h2>
          <p className="mt-1.5 text-sm text-gray-400 leading-relaxed">{scenario}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 sm:p-5 mb-4">
        {children}
      </div>

      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
        <p className="text-[11px] uppercase tracking-wider text-emerald-300 font-semibold mb-1">
          🎯 Interview takeaway
        </p>
        <p className="text-sm text-gray-200 leading-relaxed">{takeaway}</p>
      </div>
    </motion.section>
  );
}

function MetricPill({ label, value, tone = 'gray' }: { label: string; value: string; tone?: string }) {
  const tones: Record<string, string> = {
    gray: 'border-gray-700 bg-gray-800/60 text-gray-200',
    green: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    red: 'border-red-500/30 bg-red-500/10 text-red-200',
    blue: 'border-blue-500/30 bg-blue-500/10 text-blue-200',
    yellow: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-200',
  };
  return (
    <div className={`rounded-lg border px-3 py-2 ${tones[tone] ?? tones.gray}`}>
      <div className="text-[10px] uppercase tracking-wider opacity-70">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

function Toggle({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-gray-700 bg-gray-900 p-0.5 text-xs">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
            value === o.value
              ? 'bg-brand-500 text-white shadow-sm'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Scalability — Diwali traffic spike
// ─────────────────────────────────────────────────────────────────────────────

function ScalabilityDemo() {
  const [mode, setMode] = useState<'vertical' | 'horizontal'>('horizontal');
  const [load, setLoad] = useState(40); // % traffic load

  // Vertical: one giant server, capacity 70%. Above that → drops.
  // Horizontal: N servers added as load grows.
  const verticalCapacity = 70;
  const verticalDrops = Math.max(0, load - verticalCapacity);
  const horizontalServers = Math.max(1, Math.ceil(load / 25));
  const horizontalDrops = 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>Strategy</span>
          <Toggle
            value={mode}
            onChange={(v) => setMode(v as 'vertical' | 'horizontal')}
            options={[
              { value: 'vertical', label: '⬆️ Vertical (scale up)' },
              { value: 'horizontal', label: '➡️ Horizontal (scale out)' },
            ]}
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">Diwali traffic</span>
          <input
            type="range"
            min={10}
            max={100}
            value={load}
            onChange={(e) => setLoad(Number(e.target.value))}
            className="accent-brand-500"
          />
          <span className="text-xs text-brand-300 font-mono w-10">{load}%</span>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-800 bg-gray-950 p-4 min-h-[180px] flex flex-col items-center justify-center">
          {mode === 'vertical' ? (
            <motion.div
              key="big-server"
              initial={{ scale: 0.85 }}
              animate={{ scale: 1 + load / 400 }}
              className="text-center"
            >
              <div className="text-6xl mb-2">🖥️</div>
              <div className="text-xs text-gray-400">1 large server · 64 vCPU</div>
              <div className="mt-3 w-40 h-2 rounded-full bg-gray-800 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    load > verticalCapacity ? 'bg-red-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, load)}%` }}
                />
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-wrap gap-2 justify-center max-w-xs">
              <AnimatePresence>
                {Array.from({ length: horizontalServers }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    className="w-14 h-14 rounded-lg border border-blue-500/30 bg-blue-500/10 flex items-center justify-center text-2xl"
                  >
                    🖥️
                  </motion.div>
                ))}
              </AnimatePresence>
              <div className="w-full text-xs text-gray-400 text-center mt-2">
                {horizontalServers} app servers behind load balancer
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-300 leading-relaxed">
            <strong className="text-white">PayBank scenario:</strong> On Diwali, UPI
            transfers spike 5×. Your single server can serve 70% of normal
            load — beyond that, payments start <span className="text-red-300">failing</span>.
          </p>
          <div className="grid grid-cols-3 gap-2 pt-1">
            <MetricPill label="Servers" value={mode === 'vertical' ? '1' : `${horizontalServers}`} tone="blue" />
            <MetricPill
              label="Failed txns"
              value={`${mode === 'vertical' ? verticalDrops : horizontalDrops}%`}
              tone={
                (mode === 'vertical' ? verticalDrops : horizontalDrops) > 0 ? 'red' : 'green'
              }
            />
            <MetricPill
              label="Cost"
              value={mode === 'vertical' ? '$$$$' : '$ × N'}
              tone="yellow"
            />
          </div>
          <p className="text-xs text-gray-500 leading-relaxed pt-1">
            Vertical hits a hardware ceiling and is a SPOF. Horizontal grows with
            traffic and survives single-node failure — the standard for banks.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Availability — the nines
// ─────────────────────────────────────────────────────────────────────────────

function AvailabilityDemo() {
  const [nines, setNines] = useState(3);
  const downtimePerYear: Record<number, string> = {
    2: '3 days 15 hours',
    3: '8 hours 45 min',
    4: '52 minutes',
    5: '5 min 15 sec',
  };
  const uptime = (1 - Math.pow(10, -nines)) * 100;

  return (
    <div className="grid sm:grid-cols-2 gap-5 items-center">
      <div className="text-center">
        <div className="relative w-40 h-40 mx-auto">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#1f2937" strokeWidth="10" />
            <motion.circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={nines >= 4 ? '#34d399' : nines === 3 ? '#facc15' : '#f87171'}
              strokeWidth="10"
              strokeDasharray={`${(uptime / 100) * 264} 264`}
              animate={{ strokeDasharray: `${(uptime / 100) * 264} 264` }}
              transition={{ duration: 0.4 }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-white">{uptime.toFixed(nines)}%</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">uptime</div>
          </div>
        </div>
        <div className="mt-3 inline-flex rounded-lg border border-gray-700 bg-gray-900 p-0.5 text-xs">
          {[2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setNines(n)}
              className={`px-3 py-1.5 rounded-md font-medium ${
                nines === n ? 'bg-brand-500 text-white' : 'text-gray-400'
              }`}
            >
              {n} nines
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-gray-300 leading-relaxed">
          <strong className="text-white">PayBank SLA:</strong> RBI expects payment
          systems to be near 24×7. Each extra "9" is exponentially harder and
          costlier.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <MetricPill label="Downtime / yr" value={downtimePerYear[nines]} tone="yellow" />
          <MetricPill
            label="Suitable for"
            value={
              nines === 2 ? 'Internal tools' : nines === 3 ? 'Web app' : nines === 4 ? 'Banking app' : 'Core ledger'
            }
            tone="blue"
          />
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          To reach 4 nines you need redundant load balancers, multi-AZ databases,
          health-checked failover, and rollback-safe deploys. There's no single
          trick — availability is the sum of every component's availability.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Reliability — money transfer with retries + idempotency
// ─────────────────────────────────────────────────────────────────────────────

type TxnStep = { id: number; label: string; status: 'pending' | 'ok' | 'fail' | 'retry' };

function ReliabilityDemo() {
  const [idempotent, setIdempotent] = useState(true);
  const [steps, setSteps] = useState<TxnStep[]>([]);
  const [running, setRunning] = useState(false);
  const [doubleDebit, setDoubleDebit] = useState(false);

  async function run() {
    setRunning(true);
    setDoubleDebit(false);
    const seq: TxnStep[] = [
      { id: 1, label: 'POST /transfer  ₹500  (key: txn_42)', status: 'pending' },
      { id: 2, label: 'Debit Alice   −₹500', status: 'pending' },
      { id: 3, label: 'Network blip ✗  ACK lost', status: 'pending' },
      { id: 4, label: 'Client retries POST /transfer (key: txn_42)', status: 'pending' },
      {
        id: 5,
        label: idempotent
          ? 'Server sees same key → returns prior result, NO double-debit'
          : 'No idempotency key → debits Alice AGAIN  −₹500',
        status: 'pending',
      },
      { id: 6, label: 'Credit Bob   +₹500', status: 'pending' },
    ];
    for (let i = 0; i < seq.length; i++) {
      await new Promise((r) => setTimeout(r, 700));
      seq[i].status = i === 2 ? 'fail' : i === 3 ? 'retry' : 'ok';
      setSteps([...seq]);
    }
    if (!idempotent) setDoubleDebit(true);
    setRunning(false);
  }

  useEffect(() => {
    setSteps([]);
    setDoubleDebit(false);
  }, [idempotent]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>Idempotency key</span>
          <Toggle
            value={idempotent ? 'on' : 'off'}
            onChange={(v) => setIdempotent(v === 'on')}
            options={[
              { value: 'on', label: '✓ ON (safe)' },
              { value: 'off', label: '✗ OFF (unsafe)' },
            ]}
          />
        </div>
        <button
          onClick={run}
          disabled={running}
          className="px-4 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 text-white text-sm font-medium disabled:opacity-50"
        >
          {running ? 'Transferring…' : '▶ Run transfer'}
        </button>
      </div>

      <div className="space-y-1.5 font-mono text-xs min-h-[180px]">
        {steps.length === 0 && (
          <p className="text-gray-500 italic font-sans">
            Click <em>Run transfer</em> to simulate Alice paying Bob ₹500. We'll
            inject a network failure mid-flight to test the retry path.
          </p>
        )}
        {steps.map((s) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className={`px-3 py-1.5 rounded-md border ${
              s.status === 'fail'
                ? 'border-red-500/40 bg-red-500/10 text-red-200'
                : s.status === 'retry'
                ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-200'
                : s.status === 'ok'
                ? 'border-gray-700 bg-gray-900 text-gray-200'
                : 'border-gray-800 bg-gray-900/40 text-gray-500'
            }`}
          >
            <span className="opacity-60 mr-2">{String(s.id).padStart(2, '0')}</span>
            {s.label}
          </motion.div>
        ))}
        {doubleDebit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-sans text-red-200"
          >
            🚨 Alice was charged ₹1000 instead of ₹500. This is the #1 reason
            payment APIs require idempotency keys.
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. SPOF — kill the database
// ─────────────────────────────────────────────────────────────────────────────

function SPOFDemo() {
  const [redundant, setRedundant] = useState(false);
  const [killed, setKilled] = useState(false);

  const dbWorking = !killed || redundant;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <Toggle
          value={redundant ? 'yes' : 'no'}
          onChange={(v) => {
            setRedundant(v === 'yes');
            setKilled(false);
          }}
          options={[
            { value: 'no', label: 'Single DB' },
            { value: 'yes', label: 'Primary + Replica' },
          ]}
        />
        <button
          onClick={() => setKilled((k) => !k)}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium ${
            killed
              ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
              : 'bg-red-500 hover:bg-red-400 text-white'
          }`}
        >
          {killed ? '🩹 Restore primary' : '💥 Kill primary DB'}
        </button>
      </div>

      <div className="grid grid-cols-[80px_40px_1fr] items-center gap-3 text-sm">
        <div className="text-center">
          <div className="text-3xl">📱</div>
          <div className="text-xs text-gray-400 mt-1">User</div>
        </div>
        <motion.div
          animate={{ opacity: dbWorking ? [0.4, 1, 0.4] : 0.2 }}
          transition={{ duration: 1, repeat: Infinity }}
          className="text-center text-2xl text-cyan-300"
        >
          →
        </motion.div>
        <div className="space-y-2">
          <div
            className={`rounded-lg border px-3 py-2 flex items-center gap-2 ${
              killed
                ? 'border-red-500/40 bg-red-500/10 line-through text-red-300'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
            }`}
          >
            <span>🗄️</span>
            <span className="font-medium">Primary DB</span>
            <span className="ml-auto text-xs">
              {killed ? 'OFFLINE' : 'serving reads + writes'}
            </span>
          </div>
          {redundant && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-lg border px-3 py-2 flex items-center gap-2 ${
                killed
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                  : 'border-gray-700 bg-gray-900 text-gray-300'
              }`}
            >
              <span>🗄️</span>
              <span className="font-medium">Replica DB</span>
              <span className="ml-auto text-xs">
                {killed ? '⚡ promoted to primary' : 'streaming replication'}
              </span>
            </motion.div>
          )}
        </div>
      </div>

      <div
        className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
          dbWorking
            ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-200'
            : 'border-red-500/40 bg-red-500/10 text-red-200'
        }`}
      >
        {dbWorking
          ? '✅ PayBank balance check returns instantly. Payments work.'
          : '🚨 Every balance lookup, transfer, and login is failing. The single DB is the SPOF.'}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Latency vs Throughput vs Bandwidth
// ─────────────────────────────────────────────────────────────────────────────

function LatencyThroughputDemo() {
  const [users, setUsers] = useState(5000);
  // Simple model: each request 2KB, server handles ~3000 TPS, latency rises with queueing.
  const tps = Math.min(users, 3000);
  const queueing = users > 3000 ? (users - 3000) * 0.05 : 0;
  const latency = 80 + queueing; // ms
  const bandwidth = (tps * 2) / 1024; // MB/s

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs text-gray-500">Concurrent UPI users</span>
        <input
          type="range"
          min={500}
          max={10000}
          step={500}
          value={users}
          onChange={(e) => setUsers(Number(e.target.value))}
          className="flex-1 accent-brand-500"
        />
        <span className="text-xs text-brand-300 font-mono w-16 text-right">
          {users.toLocaleString()}
        </span>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="rounded-lg border border-gray-800 bg-gray-950 p-3">
          <div className="text-[10px] uppercase tracking-wider text-gray-500">Latency (p50)</div>
          <div className={`mt-1 text-2xl font-bold ${latency > 200 ? 'text-red-300' : 'text-emerald-300'}`}>
            {latency.toFixed(0)} ms
          </div>
          <div className="text-[11px] text-gray-500 mt-1">Time for one /transfer call</div>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-950 p-3">
          <div className="text-[10px] uppercase tracking-wider text-gray-500">Throughput</div>
          <div className="mt-1 text-2xl font-bold text-cyan-300">{tps.toLocaleString()} TPS</div>
          <div className="text-[11px] text-gray-500 mt-1">Transfers completed per second</div>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-950 p-3">
          <div className="text-[10px] uppercase tracking-wider text-gray-500">Bandwidth</div>
          <div className="mt-1 text-2xl font-bold text-violet-300">{bandwidth.toFixed(1)} MB/s</div>
          <div className="text-[11px] text-gray-500 mt-1">Network pipe utilization</div>
        </div>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed mt-4">
        At 3000 TPS the server saturates — adding more users <em>doesn't</em>{' '}
        raise throughput, it raises latency (requests queue up). This is why
        banks measure all three and add capacity before saturation, not after.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Consistent Hashing — sharding accounts
// ─────────────────────────────────────────────────────────────────────────────

function ConsistentHashingDemo() {
  const [nodes, setNodes] = useState([0, 1, 2, 3]); // node ids
  const accounts = useMemo(
    () =>
      ['ALICE', 'BOB', 'CHARLIE', 'DEEPA', 'EMMA', 'FAIZ', 'GITA', 'HARI', 'ISHA', 'JOHN'].map(
        (name) => {
          let h = 0;
          for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
          return { name, angle: h % 360 };
        }
      ),
    []
  );
  const nodeAngles = nodes.map((n) => ({ id: n, angle: (n * 360) / 8 + 22 }));

  function ownerOf(angle: number) {
    const sorted = [...nodeAngles].sort((a, b) => a.angle - b.angle);
    for (const n of sorted) if (n.angle >= angle) return n.id;
    return sorted[0].id;
  }

  return (
    <div className="grid sm:grid-cols-[260px_1fr] gap-5 items-center">
      <div className="relative w-[240px] h-[240px] mx-auto">
        <svg viewBox="-130 -130 260 260" className="w-full h-full">
          <circle r="100" fill="none" stroke="#374151" strokeWidth="2" strokeDasharray="3 4" />
          {nodeAngles.map((n) => {
            const rad = (n.angle * Math.PI) / 180;
            const x = Math.sin(rad) * 100;
            const y = -Math.cos(rad) * 100;
            return (
              <g key={n.id}>
                <circle cx={x} cy={y} r="14" fill="#2563eb" stroke="#60a5fa" strokeWidth="2" />
                <text x={x} y={y + 4} textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">
                  N{n.id}
                </text>
              </g>
            );
          })}
          {accounts.map((a) => {
            const rad = (a.angle * Math.PI) / 180;
            const x = Math.sin(rad) * 78;
            const y = -Math.cos(rad) * 78;
            const owner = ownerOf(a.angle);
            const color = ['#f472b6', '#34d399', '#fbbf24', '#a78bfa', '#fb7185'][owner % 5];
            return (
              <motion.g key={a.name} animate={{ x: 0, y: 0 }}>
                <circle cx={x} cy={y} r="6" fill={color} />
                <text x={x} y={y - 9} textAnchor="middle" fontSize="7" fill="#d1d5db">
                  {a.name}
                </text>
              </motion.g>
            );
          })}
        </svg>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-gray-300 leading-relaxed">
          <strong className="text-white">PayBank scenario:</strong> 10M accounts
          can't fit on one DB. Each account is hashed onto a ring; the next
          clockwise node owns it. Add or remove a shard and only{' '}
          <em>nearby</em> accounts move — not all of them.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => nodes.length < 6 && setNodes([...nodes, Math.max(...nodes) + 1])}
            className="px-3 py-1.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 text-xs font-medium hover:bg-emerald-500/30"
          >
            + Add shard
          </button>
          <button
            onClick={() => nodes.length > 2 && setNodes(nodes.slice(0, -1))}
            className="px-3 py-1.5 rounded-md bg-red-500/20 border border-red-500/30 text-red-200 text-xs font-medium hover:bg-red-500/30"
          >
            − Remove shard
          </button>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          With plain modulo-hashing, adding a shard would re-map nearly every
          account — a nightmare for a live bank. Consistent hashing is what
          DynamoDB, Cassandra, and Discord use under the hood.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. CAP Theorem — datacenter partition
// ─────────────────────────────────────────────────────────────────────────────

function CAPDemo() {
  const [partition, setPartition] = useState(false);
  const [mode, setMode] = useState<'CP' | 'AP'>('CP');

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <Toggle
          value={mode}
          onChange={(v) => setMode(v as 'CP' | 'AP')}
          options={[
            { value: 'CP', label: 'CP — refuse on partition' },
            { value: 'AP', label: 'AP — keep accepting' },
          ]}
        />
        <button
          onClick={() => setPartition((p) => !p)}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium ${
            partition ? 'bg-emerald-500 text-white' : 'bg-yellow-500 text-gray-900'
          }`}
        >
          {partition ? '🩹 Heal network' : '⚡ Cut network'}
        </button>
      </div>

      <div className="grid grid-cols-[1fr_60px_1fr] items-center gap-3">
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-center">
          <div className="text-2xl">🏦</div>
          <div className="text-xs text-blue-200 font-semibold mt-1">Mumbai DC</div>
          <div className="text-[10px] text-gray-400 mt-1">Alice balance: ₹1000</div>
        </div>
        <div className="text-center">
          <motion.div
            animate={{ opacity: partition ? 0.2 : [0.4, 1, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className={`text-2xl ${partition ? 'text-red-400 line-through' : 'text-cyan-300'}`}
          >
            {partition ? '⛔' : '⇄'}
          </motion.div>
          <div className="text-[10px] text-gray-500 mt-1">replication</div>
        </div>
        <div className="rounded-lg border border-violet-500/30 bg-violet-500/10 p-3 text-center">
          <div className="text-2xl">🏦</div>
          <div className="text-xs text-violet-200 font-semibold mt-1">Bangalore DC</div>
          <div className="text-[10px] text-gray-400 mt-1">Alice balance: ₹1000</div>
        </div>
      </div>

      <div
        className={`mt-4 rounded-lg border px-3 py-3 text-sm ${
          !partition
            ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-200'
            : mode === 'CP'
            ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-200'
            : 'border-orange-500/30 bg-orange-500/10 text-orange-200'
        }`}
      >
        {!partition && '✅ Network healthy. Both DCs synchronously agree on every transfer.'}
        {partition && mode === 'CP' && (
          <>
            🛑 <strong>Consistency chosen:</strong> Bangalore DC refuses writes
            until partition heals. No double-spend possible — but customers there
            see "service unavailable". (Used by core ledgers, HBase, MongoDB
            primary.)
          </>
        )}
        {partition && mode === 'AP' && (
          <>
            ⚠️ <strong>Availability chosen:</strong> Both DCs keep accepting
            writes. Alice could spend ₹1000 in <em>both</em> DCs → balance goes
            to −₹1000 after merge. Reconciliation needed. (Used by carts,
            DynamoDB, Cassandra.)
          </>
        )}
      </div>

      <p className="text-xs text-gray-500 leading-relaxed mt-3">
        In a partition you must pick one. Real banks pick CP for the ledger
        (correctness wins) and AP for non-critical paths like notifications or
        marketing feeds.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Consistency Models — read-your-writes after deposit
// ─────────────────────────────────────────────────────────────────────────────

function ConsistencyDemo() {
  const [model, setModel] = useState<'strong' | 'eventual'>('strong');
  const [balance, setBalance] = useState(500);
  const [reads, setReads] = useState<{ replica: string; value: number }[]>([]);
  const [running, setRunning] = useState(false);

  async function deposit() {
    setRunning(true);
    setReads([]);
    const newBal = balance + 500;
    setBalance(newBal);

    if (model === 'strong') {
      for (const r of ['Replica-A', 'Replica-B', 'Replica-C']) {
        await new Promise((res) => setTimeout(res, 350));
        setReads((p) => [...p, { replica: r, value: newBal }]);
      }
    } else {
      // Eventual: replicas catch up at different times
      const stale = balance;
      setReads([
        { replica: 'Replica-A', value: newBal },
        { replica: 'Replica-B', value: stale },
        { replica: 'Replica-C', value: stale },
      ]);
      await new Promise((res) => setTimeout(res, 800));
      setReads([
        { replica: 'Replica-A', value: newBal },
        { replica: 'Replica-B', value: newBal },
        { replica: 'Replica-C', value: stale },
      ]);
      await new Promise((res) => setTimeout(res, 800));
      setReads([
        { replica: 'Replica-A', value: newBal },
        { replica: 'Replica-B', value: newBal },
        { replica: 'Replica-C', value: newBal },
      ]);
    }
    setRunning(false);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <Toggle
          value={model}
          onChange={(v) => {
            setModel(v as 'strong' | 'eventual');
            setReads([]);
            setBalance(500);
          }}
          options={[
            { value: 'strong', label: 'Strong consistency' },
            { value: 'eventual', label: 'Eventual consistency' },
          ]}
        />
        <button
          onClick={deposit}
          disabled={running}
          className="px-4 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 text-white text-sm font-medium disabled:opacity-50"
        >
          💰 Deposit ₹500
        </button>
      </div>

      <div className="grid sm:grid-cols-3 gap-2">
        {['Replica-A', 'Replica-B', 'Replica-C'].map((r) => {
          const found = reads.find((x) => x.replica === r);
          const value = found ? found.value : balance - (running || reads.length ? 0 : 0);
          const stale = found && found.value !== balance;
          return (
            <div
              key={r}
              className={`rounded-lg border p-3 ${
                stale
                  ? 'border-yellow-500/40 bg-yellow-500/10'
                  : found
                  ? 'border-emerald-500/30 bg-emerald-500/10'
                  : 'border-gray-700 bg-gray-900'
              }`}
            >
              <div className="text-[10px] uppercase tracking-wider text-gray-400">{r}</div>
              <motion.div
                key={value}
                initial={{ scale: 0.9, opacity: 0.6 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`text-xl font-bold mt-1 ${stale ? 'text-yellow-200' : 'text-white'}`}
              >
                ₹{(found ? found.value : balance).toLocaleString()}
              </motion.div>
              <div className="text-[10px] text-gray-500 mt-1">
                {stale ? 'stale read' : found ? 'up-to-date' : 'idle'}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-500 leading-relaxed mt-3">
        Show your account balance after a deposit: <strong className="text-gray-300">strong</strong>{' '}
        means every replica returns the new ₹{balance} immediately (slower, requires quorum).
        <strong className="text-gray-300"> Eventual</strong> is faster but a stale replica may
        briefly show the old balance — unacceptable for a ledger, fine for "recent payees".
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Practice challenge
// ─────────────────────────────────────────────────────────────────────────────

type ChallengeQ = {
  id: string;
  prompt: string;
  options: { id: string; text: string; correct: boolean; why: string }[];
};

const challenge: ChallengeQ[] = [
  {
    id: 'q1',
    prompt:
      'Diwali traffic is forecasted at 20× normal. Your single 64-vCPU server already runs at 60%. What do you do first?',
    options: [
      { id: 'a', text: 'Upgrade to a 128-vCPU server (vertical scale)', correct: false, why: 'Buys time but doubles SPOF risk and hits a hardware ceiling at 20×.' },
      { id: 'b', text: 'Add a load balancer + 8 stateless app servers (horizontal scale)', correct: true, why: '✅ Horizontal scaling matches the elastic load and removes the single-server SPOF.' },
      { id: 'c', text: 'Rewrite the service in Rust', correct: false, why: 'A 2× speedup won\'t cover a 20× spike, and rewrites take months.' },
    ],
  },
  {
    id: 'q2',
    prompt:
      'A user taps "Pay" twice because the screen looked frozen. How do you guarantee they are charged exactly once?',
    options: [
      { id: 'a', text: 'Disable the button after first tap on the client', correct: false, why: 'Helps UX but the network can still retry — the server must be authoritative.' },
      { id: 'b', text: 'Require an idempotency key on the API and de-dupe server-side', correct: true, why: '✅ The server stores the result against the key and returns the same response for retries.' },
      { id: 'c', text: 'Wrap the debit in a database transaction', correct: false, why: 'A transaction makes ONE debit atomic, but doesn\'t prevent TWO separate requests.' },
    ],
  },
  {
    id: 'q3',
    prompt:
      'Mumbai and Bangalore datacenters lose their inter-DC link. For the core ledger (account balances), which side of CAP should PayBank pick?',
    options: [
      { id: 'a', text: 'AP — keep both DCs writable so users aren\'t blocked', correct: false, why: 'Could let Alice spend the same ₹1000 twice — unacceptable for a ledger.' },
      { id: 'b', text: 'CP — refuse writes on the minority side until the link heals', correct: true, why: '✅ For money, correctness > availability. Reads can still be served from the local cache; writes pause briefly.' },
      { id: 'c', text: 'CA — there\'s no partition in modern clouds', correct: false, why: 'Partitions WILL happen. CA isn\'t a real choice in distributed systems.' },
    ],
  },
];

function ChallengeSection() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const correct = challenge.filter((q) => {
    const opt = q.options.find((o) => o.id === answers[q.id]);
    return opt?.correct;
  }).length;
  const allAnswered = Object.keys(answers).length === challenge.length;

  return (
    <section className="rounded-2xl border border-pink-500/30 bg-gradient-to-br from-pink-500/10 via-fuchsia-500/5 to-transparent p-5 sm:p-7">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">🎓</span>
        <h2 className="text-xl sm:text-2xl font-bold text-white">Now you try — design a UPI surge</h2>
      </div>
      <p className="text-sm text-gray-300 leading-relaxed mb-5">
        You're the PayBank tech lead. Diwali is in 3 weeks. Reason through these
        three trade-offs the way you would in a real interview — pick the
        option you'd defend, then check why.
      </p>

      <div className="space-y-5">
        {challenge.map((q, i) => (
          <div key={q.id} className="rounded-xl border border-gray-800 bg-gray-950/70 p-4">
            <p className="text-sm font-semibold text-white mb-3">
              Q{i + 1}. {q.prompt}
            </p>
            <div className="space-y-2">
              {q.options.map((o) => {
                const picked = answers[q.id] === o.id;
                const showResult = !!answers[q.id];
                return (
                  <button
                    key={o.id}
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: o.id }))}
                    className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition-colors ${
                      !showResult
                        ? 'border-gray-700 bg-gray-900 hover:border-brand-400 text-gray-200'
                        : picked && o.correct
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-100'
                        : picked && !o.correct
                        ? 'border-red-500/50 bg-red-500/10 text-red-100'
                        : o.correct
                        ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-200'
                        : 'border-gray-800 bg-gray-900/40 text-gray-500'
                    }`}
                  >
                    <span className="font-mono mr-2 opacity-60">{o.id.toUpperCase()}.</span>
                    {o.text}
                    {showResult && (picked || o.correct) && (
                      <div className="mt-1.5 text-xs leading-relaxed opacity-90">{o.why}</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {allAnswered && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-sm text-cyan-100"
        >
          🏆 <strong>Score: {correct} / {challenge.length}</strong>.{' '}
          {correct === 3
            ? 'You can defend every choice — interviewer-ready.'
            : 'Re-read the explanations above; the why matters more than the answer.'}
        </motion.div>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function BankingCaseStudyPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-gray-800 bg-gradient-to-br from-brand-500/10 via-cyan-500/5 to-transparent p-6 sm:p-8 mb-8"
      >
        <Link to="/modules" className="text-xs text-gray-400 hover:text-gray-200">
          ← Back to modules
        </Link>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-200">
          🏦 Real-world case study · Core Concepts
        </div>
        <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold text-white">
          Building <span className="bg-gradient-to-r from-pink-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">PayBank</span>
        </h1>
        <p className="mt-2 text-gray-400 leading-relaxed max-w-3xl">
          One product. Eight Core Concepts. We'll walk through how Scalability,
          Availability, Reliability, SPOF, Latency/Throughput, Consistent
          Hashing, CAP, and Consistency Models <em>each</em> shape the design of
          a UPI-style digital bank — the way an interviewer expects you to
          weave them together. Each step has an interactive demo. End with a
          challenge to design your own.
        </p>
        <div className="mt-4 grid sm:grid-cols-4 gap-2 text-xs">
          <MetricPill label="Concepts covered" value="8 / 8" tone="green" />
          <MetricPill label="Interactive demos" value="8" tone="blue" />
          <MetricPill label="Difficulty" value="Beginner → Pro" tone="yellow" />
          <MetricPill label="Time" value="~20 min" tone="gray" />
        </div>
      </motion.div>

      <div className="space-y-5">
        <SectionShell
          index={1}
          icon="📈"
          color="border-blue-500/40 bg-blue-500/10"
          title="Scalability — surviving Diwali"
          scenario="During festival sales, UPI traffic spikes 5–20×. PayBank can scale up (bigger box) or scale out (more boxes). Drag the load slider and watch how each strategy handles the surge."
          takeaway="Banks scale horizontally for the user-facing tier so they can grow elastically and absorb single-node failures. Vertical scaling is reserved for hard-to-shard components (e.g. the primary ledger DB)."
        >
          <ScalabilityDemo />
        </SectionShell>

        <SectionShell
          index={2}
          icon="⏱️"
          color="border-emerald-500/40 bg-emerald-500/10"
          title="Availability — the cost of an extra nine"
          scenario="Regulators expect payment apps to be effectively always-on. Each extra '9' (99.9% → 99.99%) cuts allowed downtime by 10× — but multiplies cost and engineering effort."
          takeaway="Frame availability as 'downtime budget per year'. To beat 4 nines you need redundant LBs, multi-AZ DBs, automated failover, canary deploys, and rollback plans — there is no single magic component."
        >
          <AvailabilityDemo />
        </SectionShell>

        <SectionShell
          index={3}
          icon="🛡️"
          color="border-cyan-500/40 bg-cyan-500/10"
          title="Reliability — exactly-once money movement"
          scenario="Networks blip. Phones lose signal mid-tap. Without an idempotency key, an innocent retry can debit a customer twice. Run the simulation with and without."
          takeaway="In payments, reliability ≠ availability. The system must do the right thing under failure. Idempotency keys, two-phase commits, and saga compensations are how real banks guarantee 'at-most-once' financial effect."
        >
          <ReliabilityDemo />
        </SectionShell>

        <SectionShell
          index={4}
          icon="⚠️"
          color="border-red-500/40 bg-red-500/10"
          title="Single Point of Failure — kill the database"
          scenario="A single primary DB is the most common SPOF in early architectures. Click 'Kill primary' to see what happens; toggle 'Primary + Replica' and try again."
          takeaway="Walk every component asking 'what if this dies?' For each yes, add a replica + automated failover. SPOFs hide in unglamorous places: DNS, the LB, the deploy script, even one engineer."
        >
          <SPOFDemo />
        </SectionShell>

        <SectionShell
          index={5}
          icon="⚡"
          color="border-yellow-500/40 bg-yellow-500/10"
          title="Latency vs Throughput vs Bandwidth"
          scenario="These three are constantly confused in interviews. Drag the slider — see how throughput plateaus while latency shoots up once the server saturates."
          takeaway="Latency = time for ONE request. Throughput = requests per second. Bandwidth = pipe size. They trade off: queueing pushes latency up long before throughput drops. Always plan capacity from p99 latency, not average."
        >
          <LatencyThroughputDemo />
        </SectionShell>

        <SectionShell
          index={6}
          icon="🔄"
          color="border-purple-500/40 bg-purple-500/10"
          title="Consistent Hashing — sharding 10M accounts"
          scenario="Accounts can't all live on one DB. Hash them onto a ring; each node owns the arc clockwise to it. Add or remove a shard and only nearby keys move."
          takeaway="With plain modulo-N hashing, adding ONE shard re-maps ~all keys — a live-bank disaster. Consistent hashing limits movement to ~1/N of keys, which is why DynamoDB, Cassandra, and Riak all use it."
        >
          <ConsistentHashingDemo />
        </SectionShell>

        <SectionShell
          index={7}
          icon="⚖️"
          color="border-orange-500/40 bg-orange-500/10"
          title="CAP Theorem — what to do during a partition"
          scenario="PayBank runs in Mumbai and Bangalore. The inter-DC link drops. You CAN'T have both Consistency and Availability — pick one. Try CP vs AP and cut the network."
          takeaway="During a partition, banks pick CP for the ledger (correctness wins, brief downtime is acceptable) and AP for non-critical features (notifications, recommendations). Always say 'CAP only matters during a partition'."
        >
          <CAPDemo />
        </SectionShell>

        <SectionShell
          index={8}
          icon="🔒"
          color="border-pink-500/40 bg-pink-500/10"
          title="Consistency Models — read-your-writes"
          scenario="After Alice deposits ₹500, can she see ₹1000 instantly on every replica? Strong consistency says yes (slower). Eventual lets some replicas show ₹500 briefly (faster, scales further)."
          takeaway="Match the model to the data. The ledger needs strong (linearizable) consistency. 'Recent contacts', notifications, and analytics can be eventual — and that's how you scale reads cheaply."
        >
          <ConsistencyDemo />
        </SectionShell>
      </div>

      <div className="mt-10">
        <ChallengeSection />
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        Ready for the next one? <Link to="/modules" className="text-cyan-300 hover:text-cyan-200">Explore more modules →</Link>
      </div>
    </div>
  );
}
