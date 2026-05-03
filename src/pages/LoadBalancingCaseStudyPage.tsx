import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Load Balancing Case Study — "QuickEats"
 *
 * One product (a food-delivery app on Friday-night dinner rush) walked through
 * every Load Balancing subtopic with interactive visuals + an exercise section.
 *
 * Subtopics covered (mapped to existing modules):
 *  1. Why we need a load balancer            (load-balancing)
 *  2. Layer 4 vs Layer 7                     (load-balancers deep dive)
 *  3. The 5 algorithms playground            (load-balancing-algorithms)
 *  4. Health checks & failover               (load-balancers deep dive)
 *  5. Sticky sessions / session persistence  (load-balancers deep dive)
 *  6. DNS load balancing                     (dns-load-balancing)
 *  7. Anycast routing                        (anycast-routing)
 */

// ─────────────────────────────────────────────────────────────────────────────
// Shared shells (kept in-file for portability)
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

function MetricPill({ label, value, tone = 'gray' }: { label: string; value: string; tone?: string }) {
  const tones: Record<string, string> = {
    gray: 'border-gray-700 bg-gray-800/60 text-gray-200',
    green: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    red: 'border-red-500/30 bg-red-500/10 text-red-200',
    blue: 'border-blue-500/30 bg-blue-500/10 text-blue-200',
    yellow: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-200',
    purple: 'border-violet-500/30 bg-violet-500/10 text-violet-200',
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
            value === o.value ? 'bg-brand-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Why we need a load balancer — Friday-night surge
// ─────────────────────────────────────────────────────────────────────────────

function WhyLBDemo() {
  const [withLB, setWithLB] = useState(true);
  const [running, setRunning] = useState(true);
  const [orders, setOrders] = useState<{ id: number; server: number }[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      idRef.current += 1;
      const id = idRef.current;
      const server = withLB ? id % 3 : 0;
      setOrders((cur) => [...cur.slice(-9), { id, server }]);
    }, 600);
    return () => clearInterval(t);
  }, [withLB, running]);

  const counts = [0, 0, 0];
  for (const o of orders) counts[o.server]++;
  const overload = !withLB && counts[0] >= 6;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>Setup</span>
          <Toggle
            value={withLB ? 'lb' : 'nolb'}
            onChange={(v) => {
              setWithLB(v === 'lb');
              setOrders([]);
            }}
            options={[
              { value: 'nolb', label: '✗ No load balancer' },
              { value: 'lb', label: '✓ With load balancer' },
            ]}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRunning((r) => !r)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
              running
                ? 'border-yellow-500/40 bg-yellow-500/15 text-yellow-200 hover:bg-yellow-500/25'
                : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25'
            }`}
          >
            {running ? '⏸ Pause' : '▶ Play'}
          </button>
          <button
            onClick={() => {
              setOrders([]);
              idRef.current = 0;
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-700 bg-gray-900 text-gray-300 hover:text-white"
          >
            ↺ Reset
          </button>
          <span className="text-xs text-gray-500 hidden sm:inline">🍕 1 order / 0.6s</span>
        </div>
      </div>

      <div className="grid grid-cols-[80px_60px_1fr] items-center gap-3">
        <div className="space-y-2">
          <AnimatePresence>
            {orders.slice(-4).map((o) => (
              <motion.div
                key={o.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="px-2 py-1 rounded-md bg-yellow-500/15 border border-yellow-500/30 text-yellow-200 text-xs text-center"
              >
                🧾 #{o.id}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="text-center">
          {withLB ? (
            <div className="rounded-xl border border-blue-500/40 bg-blue-500/15 p-2 text-2xl">⚖️</div>
          ) : (
            <span className="text-2xl text-cyan-300">→</span>
          )}
          <div className="text-[10px] text-gray-500 mt-1">{withLB ? 'LB' : 'direct'}</div>
        </div>

        <div className="space-y-2">
          {[0, 1, 2].map((s) => {
            const visible = withLB || s === 0;
            const count = counts[s];
            const isOver = !withLB && s === 0 && count >= 6;
            return (
              <div
                key={s}
                className={`rounded-lg border px-3 py-2 flex items-center justify-between transition-opacity ${
                  !visible
                    ? 'border-gray-800 bg-gray-900/30 opacity-30'
                    : isOver
                    ? 'border-red-500/50 bg-red-500/10 text-red-200 animate-pulse'
                    : 'border-emerald-500/30 bg-emerald-500/5 text-emerald-200'
                }`}
              >
                <span className="text-sm font-medium">🍳 Kitchen {String.fromCharCode(65 + s)}</span>
                <span className="text-xs">
                  {visible ? (isOver ? `OVERLOAD · ${count}` : `${count} orders`) : 'idle'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div
        className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
          overload
            ? 'border-red-500/40 bg-red-500/10 text-red-200'
            : 'border-emerald-500/30 bg-emerald-500/5 text-emerald-200'
        }`}
      >
        {overload
          ? '🚨 Kitchen A is buried in tickets while B and C sit idle. Customers see "delivery delayed" errors.'
          : withLB
          ? '✅ Orders spread across 3 kitchens — no single kitchen saturates.'
          : '⏳ All orders pile up on Kitchen A. Watch what happens after a few seconds…'}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. L4 vs L7
// ─────────────────────────────────────────────────────────────────────────────

function L4vsL7Demo() {
  const [layer, setLayer] = useState<'L4' | 'L7'>('L7');
  const [order, setOrder] = useState<'veg' | 'nonveg' | 'live'>('veg');

  const route =
    layer === 'L4'
      ? { server: 'Random kitchen (any)', why: 'L4 only sees IP+port; the LB cannot read what is inside the request.' }
      : order === 'veg'
      ? { server: 'Veg-cluster (Kitchen V1)', why: 'L7 reads the URL `/orders/veg` and routes it to the veg kitchens.' }
      : order === 'nonveg'
      ? { server: 'Non-veg-cluster (Kitchen N1)', why: 'L7 reads `/orders/non-veg` and routes accordingly.' }
      : { server: 'Live-stream cluster (CDN-edge)', why: 'L7 sees `/live/...` and routes to the streaming-optimised tier.' };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <Toggle
          value={layer}
          onChange={(v) => setLayer(v as 'L4' | 'L7')}
          options={[
            { value: 'L4', label: 'L4 (transport)' },
            { value: 'L7', label: 'L7 (application)' },
          ]}
        />
        <div className="text-xs text-gray-400 flex items-center gap-2">
          <span>Order type</span>
          <Toggle
            value={order}
            onChange={(v) => setOrder(v as 'veg' | 'nonveg' | 'live')}
            options={[
              { value: 'veg', label: '🥗 Veg' },
              { value: 'nonveg', label: '🍗 Non-veg' },
              { value: 'live', label: '📺 Live cricket' },
            ]}
          />
        </div>
      </div>

      <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
        <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Incoming HTTP request</div>
        <pre className="text-xs font-mono text-gray-300 leading-relaxed overflow-x-auto">
{`POST /orders/${order === 'live' ? 'live/match-42' : order === 'veg' ? 'veg' : 'non-veg'} HTTP/1.1
Host: api.quickeats.app
Content-Type: application/json
{ "user": "alice", "items": [...] }`}
        </pre>

        <div className="mt-3 grid sm:grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="rounded-lg border border-gray-700 bg-gray-900 p-3 text-xs text-gray-300">
            <div className="font-semibold text-white mb-1">LB inspects:</div>
            {layer === 'L4' ? (
              <ul className="space-y-0.5 list-disc pl-4">
                <li>Source IP, port</li>
                <li>Destination IP, port</li>
                <li className="opacity-50 line-through">URL / headers / body</li>
              </ul>
            ) : (
              <ul className="space-y-0.5 list-disc pl-4">
                <li>Source IP, port</li>
                <li>URL path & method</li>
                <li>Headers, cookies, body</li>
              </ul>
            )}
          </div>
          <span className="text-2xl text-cyan-300 text-center">→</span>
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs">
            <div className="font-semibold text-emerald-200 mb-1">Routed to:</div>
            <div className="text-gray-100">{route.server}</div>
            <div className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">{route.why}</div>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-2 mt-3 text-xs">
        <MetricPill label="L4 strength" value="Fast, cheap, protocol-agnostic" tone="blue" />
        <MetricPill label="L7 strength" value="Smart routing by URL/header/cookie" tone="purple" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. The 5 algorithms playground
// ─────────────────────────────────────────────────────────────────────────────

type Algo = 'rr' | 'wrr' | 'lc' | 'lrt' | 'iphash';
const algoMeta: Record<Algo, { name: string; explain: string }> = {
  rr:     { name: 'Round Robin',           explain: 'Cycles through servers in order — simple, fair when servers are identical.' },
  wrr:    { name: 'Weighted Round Robin',  explain: 'Bigger servers get more orders per cycle (here Kitchen A is 4×, B and C are 2× and 1×).' },
  lc:     { name: 'Least Connections',     explain: 'Always picks the kitchen with the fewest in-flight orders right now.' },
  lrt:    { name: 'Least Response Time',   explain: 'Picks the kitchen that has been responding fastest — adapts to slow nodes.' },
  iphash: { name: 'IP Hash',               explain: 'Same customer (IP) always lands on the same kitchen — useful for sticky caches.' },
};

const customers = [
  { id: 'C1', ip: 11 },
  { id: 'C2', ip: 22 },
  { id: 'C3', ip: 33 },
  { id: 'C4', ip: 44 },
  { id: 'C5', ip: 55 },
  { id: 'C6', ip: 66 },
  { id: 'C7', ip: 77 },
  { id: 'C8', ip: 88 },
];

function pickServer(algo: Algo, idx: number, ip: number, state: { conn: number[]; resp: number[] }): number {
  switch (algo) {
    case 'rr':
      return idx % 3;
    case 'wrr': {
      // Pattern A,A,A,A,B,B,C across 7 weights — keep it simple via repeating cycle
      const cycle = [0, 0, 0, 0, 1, 1, 2];
      return cycle[idx % cycle.length];
    }
    case 'lc': {
      let min = 0;
      for (let i = 1; i < 3; i++) if (state.conn[i] < state.conn[min]) min = i;
      return min;
    }
    case 'lrt': {
      let min = 0;
      for (let i = 1; i < 3; i++) if (state.resp[i] < state.resp[min]) min = i;
      return min;
    }
    case 'iphash':
      return ip % 3;
  }
}

function AlgorithmsDemo() {
  const [algo, setAlgo] = useState<Algo>('rr');
  const [step, setStep] = useState(0);

  const result = useMemo(() => {
    // Simulate response times: A is slowest (1.4s), B medium (0.9s), C fastest (0.5s).
    const baseResp = [1.4, 0.9, 0.5];
    const conn = [0, 0, 0];
    const resp = [...baseResp];
    const routed: { customer: string; server: number }[] = [];
    for (let i = 0; i < step; i++) {
      const c = customers[i];
      const s = pickServer(algo, i, c.ip, { conn, resp });
      routed.push({ customer: c.id, server: s });
      conn[s] += 1;
      // tweak response slightly each request (simulate adaptive)
      resp[s] = baseResp[s] + conn[s] * 0.05;
    }
    return { routed, conn, resp };
  }, [algo, step]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {(Object.keys(algoMeta) as Algo[]).map((a) => (
            <button
              key={a}
              onClick={() => {
                setAlgo(a);
                setStep(0);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                algo === a
                  ? 'border-brand-400 bg-brand-500/20 text-brand-200'
                  : 'border-gray-700 bg-gray-900 text-gray-400 hover:text-gray-200'
              }`}
            >
              {algoMeta[a].name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStep((s) => Math.min(customers.length, s + 1))}
            className="px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 text-white text-xs font-semibold"
          >
            ▶ Next customer
          </button>
          <button
            onClick={() => setStep(0)}
            className="px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-900 text-gray-300 text-xs"
          >
            Reset
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-400 leading-relaxed mb-3">{algoMeta[algo].explain}</p>

      <div className="grid sm:grid-cols-[1fr_1.4fr] gap-4">
        {/* Customer queue */}
        <div className="rounded-lg border border-gray-800 bg-gray-950 p-3">
          <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Customers</div>
          <div className="grid grid-cols-4 gap-1.5">
            {customers.map((c, i) => {
              const routed = result.routed[i];
              const colors = ['border-pink-500/50 bg-pink-500/10 text-pink-200', 'border-blue-500/50 bg-blue-500/10 text-blue-200', 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200'];
              return (
                <div
                  key={c.id}
                  className={`rounded-md border px-1.5 py-1 text-center text-xs font-mono ${
                    routed ? colors[routed.server] : 'border-gray-700 bg-gray-900 text-gray-500'
                  }`}
                >
                  {c.id}
                  <div className="text-[9px] opacity-70">.{c.ip}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 text-[10px] text-gray-500">
            Pinks → Kitchen A · Blues → B · Greens → C
          </div>
        </div>

        {/* Servers */}
        <div className="space-y-2">
          {[0, 1, 2].map((s) => {
            const cap = s === 0 ? '4 vCPU (big)' : s === 1 ? '2 vCPU' : '2 vCPU (newest)';
            const recv = result.routed.filter((r) => r.server === s).map((r) => r.customer);
            const colors = ['border-pink-500/40 bg-pink-500/5', 'border-blue-500/40 bg-blue-500/5', 'border-emerald-500/40 bg-emerald-500/5'];
            return (
              <div key={s} className={`rounded-lg border p-3 ${colors[s]}`}>
                <div className="flex items-center justify-between text-sm">
                  <div className="text-white font-semibold">🍳 Kitchen {String.fromCharCode(65 + s)}</div>
                  <div className="text-[10px] text-gray-400">{cap}</div>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-[10px]">
                  <div>
                    <div className="text-gray-500">Connections</div>
                    <div className="text-gray-100 font-semibold">{result.conn[s]}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Avg resp</div>
                    <div className="text-gray-100 font-semibold">{result.resp[s].toFixed(2)}s</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Got</div>
                    <div className="text-gray-100 font-mono">{recv.join(', ') || '—'}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed mt-3">
        Click <em>Next customer</em> repeatedly — switch algorithms to see how the same 8 customers get
        distributed differently. Notice how <strong>Least Connections</strong> always picks the idlest kitchen,
        while <strong>IP Hash</strong> sends the same customer to the same kitchen every time.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Health checks & failover
// ─────────────────────────────────────────────────────────────────────────────

function HealthCheckDemo() {
  const [enabled, setEnabled] = useState(true);
  const [running, setRunning] = useState(true);
  const [tick, setTick] = useState(0);
  const broken = 1; // Kitchen B is broken
  // After N missed pings, LB marks broken kitchen out. Without health checks, never.
  const detected = enabled && tick >= 3;

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setTick((x) => x + 1), 900);
    return () => clearInterval(t);
  }, [running]);

  // Determine where the next order routes
  const nextOrderTarget = detected ? tick % 2 === 0 ? 0 : 2 : tick % 3;
  const fails = !enabled || !detected ? Math.floor(tick / 3) : 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <Toggle
          value={enabled ? 'on' : 'off'}
          onChange={(v) => {
            setEnabled(v === 'on');
            setTick(0);
          }}
          options={[
            { value: 'off', label: '✗ No health checks' },
            { value: 'on', label: '✓ Health checks ON' },
          ]}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRunning((r) => !r)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
              running
                ? 'border-yellow-500/40 bg-yellow-500/15 text-yellow-200 hover:bg-yellow-500/25'
                : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25'
            }`}
          >
            {running ? '⏸ Pause' : '▶ Play'}
          </button>
          <button
            onClick={() => setTick(0)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-700 bg-gray-900 text-gray-300 hover:text-white"
          >
            ↺ Reset
          </button>
          <span className="text-xs text-gray-500 hidden sm:inline">Heartbeat 0.9s</span>
        </div>
      </div>

      <div className="space-y-2">
        {[0, 1, 2].map((s) => {
          const isBroken = s === broken;
          const out = isBroken && detected;
          return (
            <div
              key={s}
              className={`rounded-lg border px-3 py-2 flex items-center gap-3 ${
                out
                  ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-200'
                  : isBroken
                  ? 'border-red-500/40 bg-red-500/10 text-red-200'
                  : 'border-emerald-500/30 bg-emerald-500/5 text-emerald-200'
              }`}
            >
              <span>🍳</span>
              <span className="font-semibold text-sm">Kitchen {String.fromCharCode(65 + s)}</span>
              <span className="text-xs ml-auto flex items-center gap-2">
                {enabled && (
                  <motion.span
                    key={tick + '-' + s}
                    initial={{ opacity: 1, scale: 1 }}
                    animate={{ opacity: 0, scale: 1.6 }}
                    transition={{ duration: 0.6 }}
                    className="text-cyan-300"
                  >
                    ❤
                  </motion.span>
                )}
                {out
                  ? 'MARKED OUT — no more orders sent'
                  : isBroken
                  ? 'BROKEN (kitchen power outage)'
                  : 'healthy'}
                {nextOrderTarget === s && !out && (
                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-brand-500/30 text-brand-200">next →</span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      <div
        className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
          fails > 0
            ? 'border-red-500/40 bg-red-500/10 text-red-200'
            : 'border-emerald-500/30 bg-emerald-500/5 text-emerald-200'
        }`}
      >
        {fails > 0
          ? `🚨 ${fails} customer order${fails !== 1 ? 's' : ''} failed because the LB kept routing to the dead kitchen.`
          : enabled
          ? `✅ LB pings each kitchen every 0.9s. After 3 misses, Kitchen B was removed from rotation automatically.`
          : 'No health checks → LB has no idea Kitchen B is dead.'}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Sticky sessions (session persistence)
// ─────────────────────────────────────────────────────────────────────────────

function StickyDemo() {
  const [sticky, setSticky] = useState(true);
  const [actions, setActions] = useState<{ label: string; server: number; cart: string[] }[]>([]);

  function step(action: 'add-pizza' | 'add-coke' | 'view') {
    setActions((cur) => {
      // Where does this request land?
      const idx = cur.length;
      const server = sticky ? 0 : idx % 3;
      // Server-local cart
      const lastOnSameServer = [...cur].reverse().find((a) => a.server === server);
      const baseCart = lastOnSameServer ? lastOnSameServer.cart : [];
      let cart = [...baseCart];
      if (action === 'add-pizza') cart = [...cart, '🍕'];
      if (action === 'add-coke') cart = [...cart, '🥤'];
      const label = action === 'view' ? 'View cart' : action === 'add-pizza' ? 'Add 🍕' : 'Add 🥤';
      return [...cur, { label, server, cart }];
    });
  }

  function reset() {
    setActions([]);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <Toggle
          value={sticky ? 'on' : 'off'}
          onChange={(v) => {
            setSticky(v === 'on');
            reset();
          }}
          options={[
            { value: 'off', label: '✗ No stickiness' },
            { value: 'on', label: '✓ Sticky sessions' },
          ]}
        />
        <div className="flex items-center gap-1.5">
          <button onClick={() => step('add-pizza')} className="px-3 py-1.5 rounded-lg bg-yellow-500/20 border border-yellow-500/40 text-yellow-200 text-xs font-medium">
            Add 🍕
          </button>
          <button onClick={() => step('add-coke')} className="px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-medium">
            Add 🥤
          </button>
          <button onClick={() => step('view')} className="px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 text-xs font-medium">
            View cart
          </button>
          <button onClick={reset} className="px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-900 text-gray-300 text-xs">
            Reset
          </button>
        </div>
      </div>

      <div className="space-y-1.5 font-mono text-xs min-h-[120px]">
        {actions.length === 0 && (
          <p className="text-gray-500 italic font-sans">
            Click <em>Add 🍕</em>, <em>Add 🥤</em>, then <em>View cart</em>. With stickiness OFF, watch your cart "lose"
            items between requests because each one hits a different server.
          </p>
        )}
        {actions.map((a, i) => {
          const expectedItems = i + 1; // crude, but enough to highlight the problem
          const lost = !sticky && a.label === 'View cart' && a.cart.length < expectedItems - 1;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className={`px-3 py-1.5 rounded-md border flex items-center justify-between ${
                lost
                  ? 'border-red-500/40 bg-red-500/10 text-red-200'
                  : 'border-gray-700 bg-gray-900 text-gray-200'
              }`}
            >
              <span>
                <span className="opacity-60 mr-2">{String(i + 1).padStart(2, '0')}</span>
                {a.label} → Server {String.fromCharCode(65 + a.server)}
              </span>
              <span className="opacity-90">cart: [{a.cart.join(' ') || 'empty'}]</span>
            </motion.div>
          );
        })}
      </div>

      <p className="text-xs text-gray-500 leading-relaxed mt-3">
        Sticky sessions keep one user pinned to one server (via cookie or IP-hash) so server-local state — like a cart in
        memory — survives. The cleaner long-term fix is to push session state out to Redis so any server can serve any request.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. DNS Load Balancing
// ─────────────────────────────────────────────────────────────────────────────

function DNSDemo() {
  const cities = [
    { name: 'Mumbai',    user: { x: 30, y: 60 }, dc: 'MUM-DC',  ip: '13.232.10.5' },
    { name: 'Delhi',     user: { x: 35, y: 25 }, dc: 'DEL-DC',  ip: '52.202.40.9' },
    { name: 'Bangalore', user: { x: 50, y: 78 }, dc: 'BLR-DC',  ip: '3.6.144.21' },
    { name: 'Singapore', user: { x: 80, y: 70 }, dc: 'SG-DC',   ip: '13.250.5.88' },
  ];
  const [selected, setSelected] = useState(0);
  const dcs = [
    { id: 'MUM-DC', x: 30, y: 55 },
    { id: 'DEL-DC', x: 38, y: 22 },
    { id: 'BLR-DC', x: 50, y: 75 },
    { id: 'SG-DC',  x: 82, y: 68 },
  ];
  const c = cities[selected];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="text-xs text-gray-400">Pick a user location:</div>
        <div className="flex flex-wrap gap-1.5">
          {cities.map((city, i) => (
            <button
              key={city.name}
              onClick={() => setSelected(i)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                selected === i ? 'border-brand-400 bg-brand-500/20 text-brand-200' : 'border-gray-700 bg-gray-900 text-gray-400 hover:text-gray-200'
              }`}
            >
              {city.name}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-gray-800 bg-gray-950 p-3">
        <svg viewBox="0 0 100 100" className="w-full h-56">
          <rect x="0" y="0" width="100" height="100" fill="#0b1220" />
          {/* Land masses (rough blob) */}
          <path d="M10,30 Q35,5 60,15 T90,40 Q95,70 75,85 T20,85 Q5,60 10,30Z" fill="#0f172a" stroke="#1f2937" strokeWidth="0.4" />
          {/* DCs */}
          {dcs.map((d) => (
            <g key={d.id}>
              <circle cx={d.x} cy={d.y} r="2.6" fill="#2563eb" stroke="#60a5fa" strokeWidth="0.3" />
              <text x={d.x} y={d.y - 3.5} fontSize="2.4" fill="#93c5fd" textAnchor="middle">{d.id}</text>
            </g>
          ))}
          {/* User */}
          <motion.circle
            key={c.name}
            cx={c.user.x}
            cy={c.user.y}
            r="1.8"
            fill="#f472b6"
            initial={{ scale: 0 }}
            animate={{ scale: [0.8, 1.4, 1] }}
            transition={{ duration: 0.5 }}
          />
          <text x={c.user.x} y={c.user.y + 5} fontSize="2.4" fill="#fbcfe8" textAnchor="middle">{c.name}</text>
          {/* Line to chosen DC */}
          {(() => {
            const dc = dcs.find((d) => d.id === c.dc)!;
            return (
              <motion.line
                key={c.name + '-line'}
                x1={c.user.x}
                y1={c.user.y}
                x2={dc.x}
                y2={dc.y}
                stroke="#34d399"
                strokeWidth="0.5"
                strokeDasharray="2 1.4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6 }}
              />
            );
          })()}
        </svg>
      </div>

      <div className="mt-3 rounded-lg border border-gray-800 bg-gray-950 p-3 font-mono text-xs text-gray-300">
        <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">DNS query</div>
        $ dig api.quickeats.app   <span className="text-gray-500">@ {c.name} resolver</span>
        <div className="mt-1 text-emerald-300">→ {c.ip}   <span className="text-gray-500">(geo-routed to {c.dc})</span></div>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed mt-3">
        With DNS-based load balancing, the same hostname returns <em>different IPs</em> based on the user's geographic
        resolver — sending each user to the closest datacenter. Caveat: DNS responses are cached (TTL), so failovers
        propagate slowly. That's why production usually combines DNS LB with a regional L7 LB underneath.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Anycast routing
// ─────────────────────────────────────────────────────────────────────────────

function AnycastDemo() {
  const [model, setModel] = useState<'unicast' | 'broadcast' | 'multicast' | 'anycast'>('anycast');
  const subs = ['Mumbai', 'Delhi', 'London', 'NewYork'];
  const explain: Record<string, string> = {
    unicast:  'One IP → exactly one machine. The traditional model.',
    broadcast:'One packet → ALL machines on the network (spammy, LAN-only).',
    multicast:'One packet → a SUBSCRIBED GROUP of machines.',
    anycast:  'One IP advertised from many locations → routed to the NEAREST one.',
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <Toggle
          value={model}
          onChange={(v) => setModel(v as typeof model)}
          options={[
            { value: 'unicast',  label: 'Unicast' },
            { value: 'broadcast',label: 'Broadcast' },
            { value: 'multicast',label: 'Multicast' },
            { value: 'anycast',  label: 'Anycast' },
          ]}
        />
        <span className="text-xs text-gray-500">Same destination IP from all 4 hubs</span>
      </div>

      <div className="rounded-lg border border-gray-800 bg-gray-950 p-4 grid grid-cols-[80px_60px_1fr] items-center gap-3">
        <div className="text-center">
          <div className="text-3xl">📞</div>
          <div className="text-xs text-gray-400 mt-1">User in Mumbai</div>
        </div>
        <div className="text-center text-2xl text-cyan-300">→</div>
        <div className="space-y-1.5">
          {subs.map((s, i) => {
            let active = false;
            if (model === 'unicast') active = i === 2; // arbitrary single
            if (model === 'broadcast') active = true;
            if (model === 'multicast') active = i === 0 || i === 1;
            if (model === 'anycast') active = i === 0; // nearest = Mumbai
            const label =
              model === 'anycast' && i === 0 ? 'NEAREST — wins' :
              model === 'unicast' && active ? 'fixed destination' :
              model === 'broadcast' ? 'receives' :
              model === 'multicast' && active ? 'subscribed' : '—';
            return (
              <div key={s} className={`rounded-lg border px-3 py-1.5 flex items-center justify-between text-xs ${
                active ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200' : 'border-gray-800 bg-gray-900 text-gray-500'
              }`}>
                <span>🏢 Hub {s}</span>
                <span>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-gray-300 leading-relaxed mt-3">{explain[model]}</p>
      <p className="text-xs text-gray-500 leading-relaxed mt-2">
        For QuickEats' "1860-EATS" support number, anycast is the obvious win — one number, calls auto-route to the
        nearest dispatch. Cloudflare, Google's 8.8.8.8, and root DNS use anycast for the same reason.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Exercise / challenge
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
      'Customers complain that their cart goes empty between page reloads. Sessions are stored in app-server memory. Pick the QUICKEST fix.',
    options: [
      { id: 'a', text: 'Switch from L7 to L4 load balancing', correct: false, why: 'Layer choice has nothing to do with where session state lives.' },
      { id: 'b', text: 'Enable sticky sessions on the load balancer', correct: true, why: '✅ Pins each user to one server so the in-memory cart survives. Long-term, move sessions to Redis.' },
      { id: 'c', text: 'Add more app servers', correct: false, why: 'Adding servers makes the problem WORSE — more chances of landing on a different server.' },
    ],
  },
  {
    id: 'q2',
    prompt:
      'The cluster has 1 large server (8 vCPU) and 2 small ones (2 vCPU each). All run the same code. Which algorithm best matches their capacity?',
    options: [
      { id: 'a', text: 'Round Robin', correct: false, why: 'Treats every server equally, so the small ones get crushed.' },
      { id: 'b', text: 'IP Hash', correct: false, why: 'Deterministic pinning, but ignores capacity.' },
      { id: 'c', text: 'Weighted Round Robin', correct: true, why: '✅ Assign weights proportional to capacity so the big server takes ~4× the load of a small one.' },
    ],
  },
  {
    id: 'q3',
    prompt:
      'You launch a new endpoint /live/match-* that needs a separate streaming-optimised cluster. The current LB only sees TCP packets. What do you need?',
    options: [
      { id: 'a', text: 'Switch the LB from L4 to L7 so it can route by URL path', correct: true, why: '✅ Only L7 can read the HTTP path and apply path-based routing rules.' },
      { id: 'b', text: 'Add an extra round-robin entry', correct: false, why: 'Round-robin can\'t differentiate URLs.' },
      { id: 'c', text: 'Use DNS load balancing', correct: false, why: 'DNS routes by hostname, not by URL path.' },
    ],
  },
  {
    id: 'q4',
    prompt:
      'A primary kitchen server crashes during dinner rush. Customers keep getting "order failed" for ~3 minutes. What was missing?',
    options: [
      { id: 'a', text: 'Sticky sessions', correct: false, why: 'Sticky sessions would actually have made this worse — pinned users couldn\'t move off the dead server.' },
      { id: 'b', text: 'Active health checks with auto-removal', correct: true, why: '✅ Heartbeat probes detect failure within seconds and stop sending new orders to the dead node.' },
      { id: 'c', text: 'A faster algorithm', correct: false, why: 'Algorithm doesn\'t help if the LB doesn\'t know a server is dead.' },
    ],
  },
  {
    id: 'q5',
    prompt:
      'You want users in 30 countries to hit the closest datacenter automatically. Two options on the table: GeoDNS or Anycast. Both work — which is more responsive to a regional outage?',
    options: [
      { id: 'a', text: 'GeoDNS — failover in milliseconds', correct: false, why: 'GeoDNS failover is slow (TTL caching). Often minutes before clients move.' },
      { id: 'b', text: 'Anycast — BGP withdrawal moves traffic in seconds', correct: true, why: '✅ When an anycast site withdraws its BGP advertisement, the network re-converges in seconds, no DNS cache to wait on.' },
      { id: 'c', text: 'Identical — both rely on DNS', correct: false, why: 'Anycast operates at the IP/BGP layer, not DNS.' },
    ],
  },
];

function ChallengeSection() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const correct = challenge.filter((q) => q.options.find((o) => o.id === answers[q.id])?.correct).length;
  const allAnswered = Object.keys(answers).length === challenge.length;

  return (
    <section className="rounded-2xl border border-pink-500/30 bg-gradient-to-br from-pink-500/10 via-fuchsia-500/5 to-transparent p-5 sm:p-7">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">🎓</span>
        <h2 className="text-xl sm:text-2xl font-bold text-white">Now you try — fix QuickEats during a Friday rush</h2>
      </div>
      <p className="text-sm text-gray-300 leading-relaxed mb-5">
        Five real on-call situations from a food-delivery company. Pick the option you'd defend in an interview, then read why.
      </p>

      <div className="space-y-5">
        {challenge.map((q, i) => (
          <div key={q.id} className="rounded-xl border border-gray-800 bg-gray-950/70 p-4">
            <p className="text-sm font-semibold text-white mb-3">Q{i + 1}. {q.prompt}</p>
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
          {correct === challenge.length
            ? 'Every answer defended — interviewer-ready on load balancing.'
            : 'Re-read the explanations — they\'re the language interviewers actually want.'}
        </motion.div>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function LoadBalancingCaseStudyPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-gray-800 bg-gradient-to-br from-orange-500/10 via-yellow-500/5 to-transparent p-6 sm:p-8 mb-8"
      >
        <Link to="/modules" className="text-xs text-gray-400 hover:text-gray-200">← Back to modules</Link>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-200">
          🍕 Real-world case study · Load Balancing
        </div>
        <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold text-white">
          Building <span className="bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 bg-clip-text text-transparent">QuickEats</span>
        </h1>
        <p className="mt-2 text-gray-400 leading-relaxed max-w-3xl">
          Friday, 8 PM. A million people open the app at once. We'll walk through every Load Balancing subtopic — Why
          LB · L4 vs L7 · the 5 algorithms · health checks · sticky sessions · DNS LB · Anycast — using one product
          you actually use. Each step has a hands-on demo. End with a 5-question on-call exercise.
        </p>
        <div className="mt-4 grid sm:grid-cols-4 gap-2 text-xs">
          <MetricPill label="Subtopics" value="7 / 7" tone="green" />
          <MetricPill label="Interactive demos" value="7" tone="blue" />
          <MetricPill label="Difficulty" value="Beginner → Pro" tone="yellow" />
          <MetricPill label="Time" value="~22 min" tone="gray" />
        </div>
      </motion.div>

      <div className="space-y-5">
        <SectionShell
          index={1}
          icon="⚖️"
          color="border-blue-500/40 bg-blue-500/10"
          title="Why we even need a load balancer"
          scenario="Friday-night surge: orders pour in faster than one kitchen can cook. Toggle the LB on/off and watch what happens."
          takeaway="A load balancer is the front door that turns N independent servers into one logical 'cluster' — needed to scale, to keep the system up when one box dies, and to deploy without downtime."
        >
          <WhyLBDemo />
        </SectionShell>

        <SectionShell
          index={2}
          icon="🧱"
          color="border-purple-500/40 bg-purple-500/10"
          title="Layer 4 vs Layer 7"
          scenario="L4 routes by IP/port (cheap, fast, blind to content). L7 reads the HTTP request and routes by URL, headers, or cookies."
          takeaway="L4 = transport-layer routing, used for raw TCP/UDP and pure throughput. L7 = application-layer routing, used when you need URL- or header-based rules (path-based routing, A/B tests, canary deploys)."
        >
          <L4vsL7Demo />
        </SectionShell>

        <SectionShell
          index={3}
          icon="🔢"
          color="border-pink-500/40 bg-pink-500/10"
          title="The 5 distribution algorithms — playground"
          scenario="Three kitchens (one bigger, two newer), eight customers. Pick an algorithm and click 'Next customer' to see exactly how each one routes."
          takeaway="Round Robin = simple & fair. Weighted RR = match capacity differences. Least Connections = adapts to live load. Least Response Time = adapts to slow nodes. IP Hash = sticky-by-design, great for caches."
        >
          <AlgorithmsDemo />
        </SectionShell>

        <SectionShell
          index={4}
          icon="❤️"
          color="border-emerald-500/40 bg-emerald-500/10"
          title="Health checks & failover"
          scenario="Kitchen B's power just tripped. Without health checks, the LB keeps routing orders into the void. Toggle them on and watch B get pulled out of rotation."
          takeaway="Active health checks (heartbeat HTTP/TCP probes) plus a 'healthy threshold' are non-negotiable. Without them, your LB is a confident liar — happily sending users to dead servers."
        >
          <HealthCheckDemo />
        </SectionShell>

        <SectionShell
          index={5}
          icon="📌"
          color="border-yellow-500/40 bg-yellow-500/10"
          title="Sticky sessions — when state lives on the server"
          scenario="A customer adds a pizza, a coke, then taps 'View cart'. With session state in server memory and no stickiness, the cart appears empty after a redirect. Try it."
          takeaway="Stickiness is a band-aid. Right answer in interviews: 'I'd enable sticky sessions short-term, then move session state to Redis so any server can serve any request — that lets us scale, deploy, and fail over freely.'"
        >
          <StickyDemo />
        </SectionShell>

        <SectionShell
          index={6}
          icon="🌐"
          color="border-cyan-500/40 bg-cyan-500/10"
          title="DNS load balancing — choose a region before the connection starts"
          scenario="A user in Bangalore opens api.quickeats.app. The DNS resolver returns the IP of the closest datacenter — Mumbai user → Mumbai DC, Singapore user → SG DC."
          takeaway="DNS LB is the cheapest way to do global geo-routing. The catch: clients cache DNS records (TTL), so failover takes minutes — production combines DNS LB for region selection with an L7 LB inside each region."
        >
          <DNSDemo />
        </SectionShell>

        <SectionShell
          index={7}
          icon="🗺️"
          color="border-violet-500/40 bg-violet-500/10"
          title="Anycast — same IP, nearest hop"
          scenario="QuickEats' support number 1860-EATS rings the nearest call centre, not a single global office. Same idea, but with IP packets and BGP routing."
          takeaway="Anycast advertises one IP from many locations and lets BGP route each user to the nearest one. Failover is seconds (BGP withdrawal), not minutes (DNS TTL). Used by Cloudflare, Google DNS (8.8.8.8), and the DNS root servers."
        >
          <AnycastDemo />
        </SectionShell>
      </div>

      <div className="mt-10">
        <ChallengeSection />
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        Want to revisit any subtopic in detail?{' '}
        <Link to="/modules" className="text-cyan-300 hover:text-cyan-200">Back to all modules →</Link>
      </div>
    </div>
  );
}
