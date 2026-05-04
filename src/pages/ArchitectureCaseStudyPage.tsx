import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Architectural Patterns Case Study — "StreamCart"
 *
 * StreamCart = live-video e-commerce (think Meesho Live / Amazon Live).
 * One product walks through every Architectural Pattern subtopic:
 *
 *  1. Client-Server Architecture   — how your phone talks to the backend
 *  2. Monolith → Microservices     — how StreamCart evolved under load
 *  3. Event-Driven Architecture    — the "Buy Now" fan-out during a live stream
 *  4. CORS                         — why the browser blocks the first API call
 *  5. Serverless Architecture      — thumbnail processing & scheduled reports
 *  6. The Full Picture             — everything wired together, end-to-end
 *
 *  Ends with a 5-question interview-level exercise.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Shared UI helpers
// ─────────────────────────────────────────────────────────────────────────────

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
          <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Pattern {index}</p>
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
    purple: 'border-violet-500/30 bg-violet-500/10 text-violet-200',
    orange: 'border-orange-500/30 bg-orange-500/10 text-orange-200',
  };
  return (
    <div className={`rounded-lg border px-3 py-2 ${t[tone] ?? t.gray}`}>
      <div className="text-[10px] uppercase tracking-wider opacity-60">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

function Toggle({ options, value, onChange }: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-gray-700 bg-gray-900 p-0.5 text-xs">
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
            value === o.value ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-gray-200'
          }`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Client-Server Architecture — animated request flow
// ─────────────────────────────────────────────────────────────────────────────

const REQUEST_FLOWS = {
  browse: {
    label: '🛍️ Browse Products',
    steps: [
      { id: 'phone',  icon: '📱', label: 'Your Phone',      detail: 'GET /products',          color: 'border-pink-500/40 bg-pink-500/10' },
      { id: 'cdn',    icon: '⚡', label: 'CDN Edge Node',   detail: 'Static assets cached',   color: 'border-yellow-500/40 bg-yellow-500/10' },
      { id: 'lb',     icon: '⚖️', label: 'Load Balancer',   detail: 'Routes to App Server',   color: 'border-blue-500/40 bg-blue-500/10' },
      { id: 'api',    icon: '🖥️', label: 'API Server',      detail: 'Reads Redis cache first', color: 'border-violet-500/40 bg-violet-500/10' },
      { id: 'cache',  icon: '📦', label: 'Redis Cache',     detail: 'Cache HIT → returns list',color: 'border-orange-500/40 bg-orange-500/10' },
    ],
    response: '200ms — served from cache',
    color: 'green',
  },
  buy: {
    label: '💳 Place Order',
    steps: [
      { id: 'phone',  icon: '📱', label: 'Your Phone',      detail: 'POST /orders',           color: 'border-pink-500/40 bg-pink-500/10' },
      { id: 'lb',     icon: '⚖️', label: 'Load Balancer',   detail: 'Routes to Order Service', color: 'border-blue-500/40 bg-blue-500/10' },
      { id: 'api',    icon: '🛒', label: 'Order Service',   detail: 'Validates & creates order', color: 'border-violet-500/40 bg-violet-500/10' },
      { id: 'db',     icon: '🗄️', label: 'Database',        detail: 'INSERT orders row',      color: 'border-emerald-500/40 bg-emerald-500/10' },
      { id: 'kafka',  icon: '📨', label: 'Kafka',           detail: 'Publishes ORDER_PLACED', color: 'border-red-500/40 bg-red-500/10' },
    ],
    response: '350ms — order confirmed',
    color: 'blue',
  },
  live: {
    label: '📺 Watch Live Stream',
    steps: [
      { id: 'phone',  icon: '📱', label: 'Your Phone',      detail: 'WebSocket /live/stream-42', color: 'border-pink-500/40 bg-pink-500/10' },
      { id: 'cdn',    icon: '⚡', label: 'Video CDN',       detail: 'HLS stream edge cache',  color: 'border-yellow-500/40 bg-yellow-500/10' },
      { id: 'origin', icon: '🎥', label: 'Video Origin',    detail: 'Transcodes to 360/720p', color: 'border-violet-500/40 bg-violet-500/10' },
      { id: 'ws',     icon: '🔌', label: 'WebSocket Server', detail: 'Live chat & reactions', color: 'border-cyan-500/40 bg-cyan-500/10' },
    ],
    response: '< 3s latency — live stream',
    color: 'yellow',
  },
};

type FlowKey = keyof typeof REQUEST_FLOWS;

function ClientServerDemo() {
  const [flow, setFlow] = useState<FlowKey>('browse');
  const [step, setStep] = useState(-1);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  function play(f: FlowKey) {
    clearTimeout(timerRef.current);
    setFlow(f);
    setStep(-1);
    setDone(false);
    const steps = REQUEST_FLOWS[f].steps;
    steps.forEach((_, i) => {
      timerRef.current = setTimeout(() => {
        setStep(i);
        if (i === steps.length - 1) setTimeout(() => setDone(true), 400);
      }, i * 500);
    });
  }

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const f = REQUEST_FLOWS[flow];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {(Object.keys(REQUEST_FLOWS) as FlowKey[]).map((k) => (
          <button key={k} onClick={() => play(k)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              flow === k ? 'border-brand-400 bg-brand-500/20 text-brand-200' : 'border-gray-700 bg-gray-900 text-gray-400 hover:text-gray-200'
            }`}>
            {REQUEST_FLOWS[k].label}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        {f.steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <motion.div
              animate={step >= i ? { opacity: 1, x: 0 } : { opacity: 0.25, x: -6 }}
              transition={{ duration: 0.3 }}
              className={`flex-1 rounded-lg border px-3 py-2 flex items-center gap-2 ${step >= i ? s.color : 'border-gray-800 bg-gray-900/30'}`}
            >
              <span className="text-xl">{s.icon}</span>
              <div>
                <div className="text-sm font-semibold text-white">{s.label}</div>
                <div className="text-xs text-gray-400">{s.detail}</div>
              </div>
              {step >= i && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="ml-auto text-[10px] text-emerald-400">✓</motion.span>
              )}
            </motion.div>
            {i < f.steps.length - 1 && (
              <motion.div animate={{ opacity: step >= i ? 1 : 0.2 }}
                className="text-cyan-400 text-lg font-bold">↓</motion.div>
            )}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {done && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
              f.color === 'green' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200' :
              f.color === 'blue' ? 'border-blue-500/40 bg-blue-500/10 text-blue-200' :
              'border-yellow-500/40 bg-yellow-500/10 text-yellow-200'
            }`}>
            ✅ {f.response}
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-xs text-gray-500 leading-relaxed mt-3">
        Click each action to trace the exact path through StreamCart's infrastructure. Notice how "Buy" goes deeper (DB + Kafka) while "Browse" is served from cache.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Monolith → Microservices evolution timeline
// ─────────────────────────────────────────────────────────────────────────────

const TIMELINE = [
  {
    year: 'Day 1',
    label: 'The Monolith',
    icon: '🧱',
    users: '0 → 10K users',
    arch: 'Single Django app: product catalogue, orders, payments, user auth, video all in one codebase. 1 Postgres DB. 1 EC2 server.',
    good: 'Fast to build, easy to debug, simple deployment',
    bad: 'Nothing yet — this is the right choice',
    deploy: '5 min',
    color: 'border-emerald-500/40 bg-emerald-500/10',
  },
  {
    year: 'Year 1',
    label: 'First cracks',
    icon: '🔥',
    users: '10K → 200K users',
    arch: 'Videos are CPU-heavy and slow down the checkout. A bug in the recommendation engine brings down payments. Deploy of any feature requires testing ALL features.',
    good: 'Still manageable, 2 engineers',
    bad: 'Long deploys, shared DB is a bottleneck, one team\'s bug = everyone\'s outage',
    deploy: '45 min',
    color: 'border-yellow-500/40 bg-yellow-500/10',
  },
  {
    year: 'Year 2',
    label: 'Extract Video Service',
    icon: '✂️',
    users: '200K → 1M users',
    arch: 'Video transcoding split into its own service on GPU instances. Communicates via events (Kafka). Rest of the app is still a monolith — but video no longer kills it.',
    good: 'Video scales independently, no more shared CPU spikes',
    bad: 'Now maintaining 2 codebases, need Kafka knowledge',
    deploy: '20 min (monolith) / 5 min (video)',
    color: 'border-blue-500/40 bg-blue-500/10',
  },
  {
    year: 'Year 3',
    label: 'Full Microservices',
    icon: '🍽️',
    users: '1M → 10M users',
    arch: 'Order Service · Product Service · User Service · Payment Service · Video Service · Notification Service. Each owns its DB. Communicate via REST + Kafka.',
    good: 'Each team deploys independently, services scale to their own load',
    bad: 'Distributed tracing, service mesh, 6 DBs, network latency',
    deploy: '2-3 min per service',
    color: 'border-violet-500/40 bg-violet-500/10',
  },
];

function MonolithEvolutionDemo() {
  const [stage, setStage] = useState(0);
  const t = TIMELINE[stage];

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {TIMELINE.map((s, i) => (
          <button key={i} onClick={() => setStage(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              stage === i ? 'border-brand-400 bg-brand-500/20 text-brand-200' : 'border-gray-700 bg-gray-900 text-gray-400 hover:text-gray-200'
            }`}>
            {s.icon} {s.year}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={stage}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          className={`rounded-xl border p-4 ${t.color}`}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{t.icon}</span>
            <div>
              <h3 className="text-white font-bold text-base">{t.label}</h3>
              <p className="text-xs text-gray-400">{t.users}</p>
            </div>
            <div className="ml-auto text-right">
              <div className="text-[10px] text-gray-500">Deploy time</div>
              <div className="text-sm font-mono text-white">{t.deploy}</div>
            </div>
          </div>

          <p className="text-sm text-gray-200 leading-relaxed mb-3">{t.arch}</p>

          <div className="grid sm:grid-cols-2 gap-2">
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs">
              <div className="text-emerald-300 font-semibold mb-1">✅ What works</div>
              <p className="text-gray-300 leading-relaxed">{t.good}</p>
            </div>
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-xs">
              <div className="text-red-300 font-semibold mb-1">⚠️ Pain points</div>
              <p className="text-gray-300 leading-relaxed">{t.bad}</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <p className="text-xs text-gray-500 mt-3 leading-relaxed">
        The #1 interview insight: <strong className="text-gray-300">start with a monolith.</strong> Microservices add complexity that kills small teams. Split only when a specific pain point (CPU, deploy, team autonomy) justifies the cost.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Event-Driven Architecture — live stream Buy Now fan-out
// ─────────────────────────────────────────────────────────────────────────────

const CONSUMERS = [
  { id: 'inv',   icon: '📦', label: 'Inventory Service',  action: 'Decrements stock by 1',      delay: 0,   color: 'border-blue-500/40 bg-blue-500/10' },
  { id: 'pay',   icon: '💳', label: 'Payment Service',    action: 'Charges card & sends receipt', delay: 200, color: 'border-green-500/40 bg-green-500/10' },
  { id: 'ship',  icon: '🚚', label: 'Warehouse Service',  action: 'Creates pick-list for courier', delay: 400, color: 'border-yellow-500/40 bg-yellow-500/10' },
  { id: 'notif', icon: '🔔', label: 'Notification Svc',   action: 'Sends WhatsApp + email',      delay: 600, color: 'border-pink-500/40 bg-pink-500/10' },
  { id: 'anal',  icon: '📊', label: 'Analytics Service',  action: 'Updates live GMV counter',    delay: 800, color: 'border-violet-500/40 bg-violet-500/10' },
];

function EventDrivenDemo() {
  const [fired, setFired] = useState(false);
  const [visible, setVisible] = useState<Set<string>>(new Set());
  const [orders, setOrders] = useState(0);
  const running = useRef(false);

  async function fire() {
    if (running.current) return;
    running.current = true;
    setFired(true);
    setVisible(new Set());
    setOrders((n) => n + 1);
    for (const c of CONSUMERS) {
      await new Promise((r) => setTimeout(r, c.delay + 300));
      setVisible((v) => new Set([...v, c.id]));
    }
    running.current = false;
  }

  function reset() {
    setFired(false);
    setVisible(new Set());
    setOrders(0);
    running.current = false;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="text-sm text-gray-400">
          <span className="text-white font-semibold">Live stream:</span> 50,000 viewers watching.
          One person taps <em>Buy Now</em>. Watch all 5 services react in parallel.
        </div>
        <div className="flex gap-2">
          <button onClick={fire} disabled={running.current}
            className="px-4 py-1.5 rounded-lg bg-red-500 hover:bg-red-400 text-white text-sm font-semibold disabled:opacity-50">
            🛒 Buy Now!
          </button>
          <button onClick={reset}
            className="px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-900 text-gray-300 text-xs">
            ↺ Reset
          </button>
        </div>
      </div>

      {/* Producer → Kafka → Consumers */}
      <div className="space-y-3">
        {/* Kafka event */}
        <AnimatePresence>
          {fired && (
            <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
              className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">📨</span>
                <div>
                  <div className="text-sm font-semibold text-red-200">Kafka topic: order.placed</div>
                  <div className="font-mono text-[10px] text-gray-400">
                    {`{ orderId:"SC-${1000 + orders}", userId:"U99", item:"iPhone15-Pro", amount:₹134999, ts:now }`}
                  </div>
                </div>
                {orders > 1 && <span className="ml-auto text-xs text-red-200">{orders} events published</span>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Consumers */}
        <div className="grid sm:grid-cols-2 gap-2">
          {CONSUMERS.map((c) => (
            <motion.div key={c.id}
              animate={visible.has(c.id) ? { opacity: 1, scale: 1 } : { opacity: 0.3, scale: 0.97 }}
              transition={{ duration: 0.25 }}
              className={`rounded-lg border px-3 py-2 ${visible.has(c.id) ? c.color : 'border-gray-800 bg-gray-900/40'}`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{c.icon}</span>
                <div>
                  <div className="text-xs font-semibold text-white">{c.label}</div>
                  <div className="text-[11px] text-gray-400">{c.action}</div>
                </div>
                {visible.has(c.id) && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto text-emerald-400 text-sm">✓</motion.span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Pill label="Pattern" value="Pub/Sub Fan-out" tone="purple" />
        <Pill label="Broker" value="Apache Kafka" tone="red" />
        <Pill label="Consumers" value="5 (independent)" tone="green" />
      </div>

      <p className="text-xs text-gray-500 mt-3 leading-relaxed">
        If the Notification Service is slow, the other 4 still run at full speed. This is the core power of EDA — failures are isolated, and scale is independent per service.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. CORS — the blocked API call explained step by step
// ─────────────────────────────────────────────────────────────────────────────

function CORSDemo() {
  const [corsEnabled, setCorsEnabled] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'preflight' | 'preflight-ok' | 'preflight-fail' | 'request' | 'done' | 'blocked'>('idle');

  async function simulate() {
    setPhase('preflight');
    await new Promise((r) => setTimeout(r, 800));
    if (corsEnabled) {
      setPhase('preflight-ok');
      await new Promise((r) => setTimeout(r, 600));
      setPhase('request');
      await new Promise((r) => setTimeout(r, 700));
      setPhase('done');
    } else {
      setPhase('preflight-fail');
      await new Promise((r) => setTimeout(r, 500));
      setPhase('blocked');
    }
  }

  const phaseLog: Record<string, { text: string; color: string }[]> = {
    idle:         [],
    preflight:    [{ text: 'Browser → OPTIONS /api/products  Origin: https://web.streamcart.com', color: 'text-cyan-300' }],
    'preflight-ok':  [
      { text: 'Browser → OPTIONS /api/products  Origin: https://web.streamcart.com', color: 'text-cyan-300' },
      { text: 'Server ← 200 OK  Access-Control-Allow-Origin: https://web.streamcart.com', color: 'text-emerald-300' },
      { text: 'Browser: ✓ Origin allowed — sending real request', color: 'text-emerald-300' },
    ],
    'preflight-fail': [
      { text: 'Browser → OPTIONS /api/products  Origin: https://web.streamcart.com', color: 'text-cyan-300' },
      { text: 'Server ← 200 OK  (no CORS headers in response)', color: 'text-red-400' },
      { text: 'Browser: ✗ No Access-Control-Allow-Origin header — BLOCKED!', color: 'text-red-400' },
    ],
    request:      [
      { text: 'Browser → OPTIONS ✓ → GET /api/products', color: 'text-cyan-300' },
      { text: 'Server ← 200 OK  [product list JSON]  Access-Control-Allow-Origin: https://web.streamcart.com', color: 'text-emerald-300' },
    ],
    done:         [
      { text: '✅ JavaScript receives the response — products rendered on page', color: 'text-emerald-300' },
    ],
    blocked:      [
      { text: '🚨 Console: Access to fetch at https://api.streamcart.com from origin https://web.streamcart.com has been blocked by CORS policy: No Access-Control-Allow-Origin header.', color: 'text-red-400' },
    ],
  };

  const logs = (phaseLog[phase] ?? []);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>Server CORS config</span>
          <Toggle
            value={corsEnabled ? 'on' : 'off'}
            onChange={(v) => { setCorsEnabled(v === 'on'); setPhase('idle'); }}
            options={[
              { value: 'off', label: '✗ No CORS headers' },
              { value: 'on',  label: '✓ CORS configured' },
            ]}
          />
        </div>
        <button onClick={simulate}
          className="px-4 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 text-white text-sm font-semibold">
          ▶ Fetch products
        </button>
      </div>

      {/* Two-column: browser vs server */}
      <div className="grid sm:grid-cols-2 gap-3 mb-4 text-xs">
        <div className="rounded-lg border border-pink-500/30 bg-pink-500/5 p-3">
          <div className="text-pink-300 font-semibold mb-2">📱 web.streamcart.com (React App)</div>
          <div className="font-mono text-gray-300 leading-relaxed">
            fetch(<span className="text-yellow-300">"https://api.streamcart.com/products"</span>, {'{'}<br/>
            &nbsp; credentials: <span className="text-green-300">"include"</span><br/>
            {'}'})
          </div>
        </div>
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3">
          <div className="text-blue-300 font-semibold mb-2">🖥️ api.streamcart.com (Express)</div>
          {corsEnabled ? (
            <div className="font-mono text-gray-300 leading-relaxed">
              app.use(cors({'{'}<br/>
              &nbsp; origin: <span className="text-green-300">"https://web.streamcart.com"</span>,<br/>
              &nbsp; credentials: <span className="text-green-300">true</span><br/>
              {'}'}))
            </div>
          ) : (
            <div className="font-mono text-red-300 leading-relaxed">
              <span className="line-through opacity-60">app.use(cors(...))</span><br/>
              <span className="text-xs">{/* No CORS middleware */}</span>
              // ← CORS not configured
            </div>
          )}
        </div>
      </div>

      {/* Log output */}
      <div className="rounded-lg border border-gray-800 bg-gray-950 p-3 min-h-[80px] font-mono text-xs space-y-1.5">
        {logs.length === 0 && <span className="text-gray-600">Click "Fetch products" to see the browser flow…</span>}
        {logs.map((l, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            className={`leading-relaxed ${l.color}`}>{l.text}</motion.div>
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-3 leading-relaxed">
        The browser automatically sends a preflight <strong className="text-gray-300">OPTIONS</strong> request before any cross-origin POST/PUT/DELETE or request with custom headers. CORS is always fixed on the server — never from the frontend.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Serverless Architecture — thumbnail pipeline + cold start
// ─────────────────────────────────────────────────────────────────────────────

function ServerlessDemo() {
  const [mode, setMode] = useState<'thumbnail' | 'report'>('thumbnail');
  const [phase, setPhase] = useState<'idle' | 'trigger' | 'cold' | 'warm' | 'exec' | 'done'>('idle');
  const [isCold, setIsCold] = useState(true);

  async function runPipeline() {
    setPhase('trigger');
    await new Promise((r) => setTimeout(r, 500));
    if (isCold) {
      setPhase('cold');
      await new Promise((r) => setTimeout(r, 1200));
    } else {
      setPhase('warm');
      await new Promise((r) => setTimeout(r, 300));
    }
    setPhase('exec');
    await new Promise((r) => setTimeout(r, mode === 'thumbnail' ? 900 : 1400));
    setPhase('done');
    setIsCold(false);
  }

  function reset() { setPhase('idle'); }

  const steps = {
    thumbnail: [
      { p: 'trigger', label: '📸 Seller uploads product photo → S3',       detail: 'S3 fires "ObjectCreated" event' },
      { p: 'cold',    label: '🥶 Lambda cold start (first invocation)',     detail: 'Container spin-up: ~800ms' },
      { p: 'warm',    label: '♨️ Lambda warm (already running)',            detail: 'Reused container: ~50ms' },
      { p: 'exec',    label: '⚙️ Lambda executes: resize to 5 formats',    detail: '320×320, 640×640, 1200×1200, WebP, thumbnail' },
      { p: 'done',    label: '✅ 5 images saved to S3 → CloudFront CDN',   detail: 'Cost: ~₹0.0001 per photo' },
    ],
    report: [
      { p: 'trigger', label: '⏰ CloudWatch cron: every night at 2 AM',    detail: 'Scheduled Lambda trigger' },
      { p: 'cold',    label: '🥶 Lambda cold start',                        detail: 'Container spin-up: ~600ms' },
      { p: 'warm',    label: '♨️ Lambda warm',                             detail: 'Already running: ~40ms' },
      { p: 'exec',    label: '📊 Aggregates 24h sales from DynamoDB',      detail: 'Generates PDF, emails to management' },
      { p: 'done',    label: '✅ Report emailed. Lambda shuts down.',       detail: 'Cost: ~₹0.002 per run. EC2 equivalent: ₹1,500/month' },
    ],
  };

  const activeSteps = steps[mode];
  const currentPhaseIdx = ['idle','trigger', isCold ? 'cold' : 'warm', 'exec','done'].indexOf(phase);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Toggle value={mode} onChange={(v) => { setMode(v as 'thumbnail' | 'report'); reset(); setIsCold(true); }}
            options={[
              { value: 'thumbnail', label: '📸 Product thumbnail' },
              { value: 'report',    label: '📊 Nightly sales report' },
            ]}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
            <input type="checkbox" checked={isCold} onChange={(e) => setIsCold(e.target.checked)} className="accent-brand-500" />
            Cold start
          </label>
          <button onClick={runPipeline} disabled={phase !== 'idle'}
            className="px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 text-white text-xs font-semibold disabled:opacity-50">
            ▶ Trigger Lambda
          </button>
          <button onClick={() => { reset(); setIsCold(true); }}
            className="px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-900 text-gray-300 text-xs">
            ↺
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {activeSteps.map((s, i) => {
          const isActive = currentPhaseIdx >= i + 1;
          const isCurrent = (phase === s.p) || (phase === 'warm' && s.p === 'cold') || (phase === 'cold' && s.p === 'warm');
          const skip = (!isCold && s.p === 'cold') || (isCold && s.p === 'warm');
          if (skip) return null;
          return (
            <motion.div key={s.p}
              animate={{ opacity: isActive ? 1 : 0.3 }}
              className={`rounded-lg border px-3 py-2 flex items-start gap-2 ${
                isCurrent && phase !== 'done' ? 'border-brand-400 bg-brand-500/10 animate-pulse' :
                isActive ? 'border-emerald-500/30 bg-emerald-500/5' :
                'border-gray-800 bg-gray-900/30'
              }`}>
              <div className="flex-1">
                <div className="text-sm text-white font-medium">{s.label}</div>
                <div className="text-xs text-gray-400">{s.detail}</div>
              </div>
              {isActive && <span className="text-emerald-400 mt-0.5">✓</span>}
            </motion.div>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Pill label="Trigger" value={mode === 'thumbnail' ? 'S3 Event' : 'Cron Schedule'} tone="purple" />
        <Pill label="Runtime" value={isCold ? 'Cold (~800ms)' : 'Warm (~50ms)'} tone={isCold ? 'red' : 'green'} />
        <Pill label="Cost vs EC2" value="~99% cheaper" tone="green" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Full Architecture — everything connected
// ─────────────────────────────────────────────────────────────────────────────

const ARCH_LAYERS = [
  {
    label: 'Client Layer',
    items: [
      { icon: '📱', name: 'Mobile App (React Native)' },
      { icon: '💻', name: 'Web App (React) — web.streamcart.com' },
      { icon: '📺', name: 'Smart TV App' },
    ],
    color: 'border-pink-500/30 bg-pink-500/5',
  },
  {
    label: 'Edge / Network',
    items: [
      { icon: '🌐', name: 'AWS Route53 (DNS)' },
      { icon: '⚡', name: 'CloudFront CDN (static + video)' },
      { icon: '⚖️', name: 'Application Load Balancer' },
    ],
    color: 'border-yellow-500/30 bg-yellow-500/5',
  },
  {
    label: 'Microservices',
    items: [
      { icon: '🔑', name: 'Auth Service (JWT + OAuth)' },
      { icon: '🛍️', name: 'Product Service' },
      { icon: '🛒', name: 'Order Service' },
      { icon: '💳', name: 'Payment Service (Razorpay)' },
      { icon: '🎥', name: 'Video Service (HLS streaming)' },
      { icon: '🔔', name: 'Notification Service' },
    ],
    color: 'border-blue-500/30 bg-blue-500/5',
  },
  {
    label: 'Event Bus',
    items: [
      { icon: '📨', name: 'Apache Kafka (order.placed, item.sold)' },
      { icon: '📬', name: 'AWS SQS (email/SMS queue)' },
    ],
    color: 'border-red-500/30 bg-red-500/5',
  },
  {
    label: 'Serverless Functions',
    items: [
      { icon: '⚡', name: 'Lambda: Image resize (S3 trigger)' },
      { icon: '⚡', name: 'Lambda: Nightly sales report (cron)' },
      { icon: '⚡', name: 'Lambda: Fraud detection (Kafka trigger)' },
    ],
    color: 'border-orange-500/30 bg-orange-500/5',
  },
  {
    label: 'Data Layer',
    items: [
      { icon: '🗄️', name: 'Aurora Postgres (orders, users)' },
      { icon: '🗄️', name: 'DynamoDB (product catalogue)' },
      { icon: '📦', name: 'Redis (sessions, cache, rate limits)' },
      { icon: '🪣', name: 'S3 (images, videos, reports)' },
    ],
    color: 'border-emerald-500/30 bg-emerald-500/5',
  },
];

function FullArchDemo() {
  const [highlight, setHighlight] = useState<number | null>(null);

  return (
    <div>
      <p className="text-sm text-gray-400 mb-4">
        Click any layer to understand its role. A typical "Add to Cart during live stream" request touches <strong className="text-white">every layer in sequence.</strong>
      </p>
      <div className="space-y-2">
        {ARCH_LAYERS.map((layer, i) => (
          <div key={i}>
            <button onClick={() => setHighlight(highlight === i ? null : i)}
              className={`w-full rounded-xl border px-4 py-3 text-left transition-all ${
                highlight === i ? `${layer.color} scale-[1.01]` : 'border-gray-800 bg-gray-900/40 hover:border-gray-700'
              }`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">{layer.label}</span>
                <span className="text-gray-500 text-xs">{highlight === i ? '▲' : '▼'}</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {layer.items.map((item) => (
                  <span key={item.name} className="text-xs text-gray-300 flex items-center gap-1">
                    <span>{item.icon}</span> {item.name}
                  </span>
                ))}
              </div>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Exercise
// ─────────────────────────────────────────────────────────────────────────────

const QUESTIONS = [
  {
    id: 'q1',
    prompt: 'A senior engineer says "let\'s build StreamCart as microservices from day one." You have 3 engineers and 0 users. What do you say?',
    options: [
      { id: 'a', text: 'Agree — microservices are the industry standard', correct: false,
        why: 'Microservices add operational complexity (distributed tracing, service mesh, 6 DBs) that kills small teams. Start simple.' },
      { id: 'b', text: 'Disagree — start with a well-structured monolith. Extract services when a specific pain point appears.', correct: true,
        why: '✅ This is the industry consensus. Instagram, Shopify, and Stack Overflow all started as monoliths. Microservices are a solution to an org/scale problem, not a starting point.' },
      { id: 'c', text: 'Start with serverless functions for everything', correct: false,
        why: 'Serverless is great for specific event-driven tasks but poor for core transactional APIs requiring low latency and stateful connections.' },
    ],
  },
  {
    id: 'q2',
    prompt: 'During a live stream sale, 80,000 people buy simultaneously. The Notification Service crashes. What happens to the Order and Payment Services?',
    options: [
      { id: 'a', text: 'They crash too — the services are coupled', correct: false,
        why: 'With direct REST calls yes. But with Event-Driven Architecture, each service consumes from Kafka independently.' },
      { id: 'b', text: 'They continue normally — Notification failure is isolated. Messages queue in Kafka until Notification recovers.', correct: true,
        why: '✅ This is the core resilience benefit of EDA. Kafka retains the events; the Notification Service replays them when it restarts.' },
      { id: 'c', text: 'Orders are rolled back since notifications could not be sent', correct: false,
        why: 'Notifications are non-critical side effects. Orders must not be rolled back just because a notification fails.' },
    ],
  },
  {
    id: 'q3',
    prompt: 'Your React frontend at web.streamcart.com gets "CORS policy: No Access-Control-Allow-Origin header" when calling api.streamcart.com. A junior dev says "let\'s fix it with a proxy in the frontend." Is this the right fix?',
    options: [
      { id: 'a', text: 'Yes — a dev proxy in Create React App fixes it permanently', correct: false,
        why: 'A dev proxy only works in localhost development. In production, the browser still enforces CORS against the real domain.' },
      { id: 'b', text: 'No — CORS must be fixed on the server by adding the Access-Control-Allow-Origin header', correct: true,
        why: '✅ CORS is enforced by the browser reading server response headers. The fix is always server-side: app.use(cors({ origin: "https://web.streamcart.com" })).' },
      { id: 'c', text: 'Switch from fetch to XMLHttpRequest — it ignores CORS', correct: false,
        why: 'XMLHttpRequest is also subject to the same-origin policy. CORS applies to all browser HTTP requests.' },
    ],
  },
  {
    id: 'q4',
    prompt: 'StreamCart\'s thumbnail Lambda runs 10,000 times/day at 500ms each, using 512MB memory. The first request of the day always takes 1.2 seconds. How do you fix the latency spike?',
    options: [
      { id: 'a', text: 'Increase Lambda memory to 2GB', correct: false,
        why: 'More memory speeds up execution but does not eliminate the cold start — that is container provisioning time.' },
      { id: 'b', text: 'Enable Provisioned Concurrency to keep N instances always warm', correct: true,
        why: '✅ Provisioned Concurrency pre-initialises Lambda containers so they are ready before the first request. Cost: ~$0.015/GB-hour always-on — worth it for user-facing endpoints.' },
      { id: 'c', text: 'Switch to a monolith so there are no cold starts', correct: false,
        why: 'Switching architecture to fix a cold start is disproportionate. And a monolith handling image resizing would compete for CPU with your API requests.' },
    ],
  },
  {
    id: 'q5',
    prompt: 'The interviewer asks: "Walk me through what happens when a user on StreamCart clicks Buy Now during a live stream." What is the ideal answer structure?',
    options: [
      { id: 'a', text: 'Explain the frontend code and React state management', correct: false,
        why: 'System design interviews focus on infrastructure, not frontend code implementation.' },
      { id: 'b', text: 'Client → Load Balancer → Order Service → DB write + Kafka event → consumers (Payment, Inventory, Notifications) react in parallel', correct: true,
        why: '✅ Walk the request through every layer: edge, service, database, then the async fan-out. Mention trade-offs: eventual consistency in notifications, idempotency key to prevent double-charge.' },
      { id: 'c', text: 'Describe the REST API contract and HTTP status codes', correct: false,
        why: 'API design is one component but the interviewer wants to see you reason about the full distributed flow.' },
    ],
  },
];

function ExerciseSection() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const correct = QUESTIONS.filter((q) => q.options.find((o) => o.id === answers[q.id])?.correct).length;
  const allDone = Object.keys(answers).length === QUESTIONS.length;

  return (
    <section className="rounded-2xl border border-pink-500/30 bg-gradient-to-br from-pink-500/10 via-fuchsia-500/5 to-transparent p-5 sm:p-7">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">🎓</span>
        <h2 className="text-xl sm:text-2xl font-bold text-white">Interview-level exercise — you're the lead architect</h2>
      </div>
      <p className="text-sm text-gray-300 leading-relaxed mb-5">
        Five questions an interviewer at a product company would ask about StreamCart's architecture. Pick your answer, then see exactly why it works — or doesn't.
      </p>

      <div className="space-y-5">
        {QUESTIONS.map((q, i) => (
          <div key={q.id} className="rounded-xl border border-gray-800 bg-gray-950/70 p-4">
            <p className="text-sm font-semibold text-white mb-3">Q{i + 1}. {q.prompt}</p>
            <div className="space-y-2">
              {q.options.map((o) => {
                const picked = answers[q.id] === o.id;
                const show = !!answers[q.id];
                return (
                  <button key={o.id}
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: o.id }))}
                    className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition-colors ${
                      !show ? 'border-gray-700 bg-gray-900 hover:border-brand-400 text-gray-200' :
                      picked && o.correct ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-100' :
                      picked && !o.correct ? 'border-red-500/50 bg-red-500/10 text-red-100' :
                      o.correct ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-200' :
                      'border-gray-800 bg-gray-900/40 text-gray-500'
                    }`}>
                    <span className="font-mono mr-2 opacity-60">{o.id.toUpperCase()}.</span>
                    {o.text}
                    {show && (picked || o.correct) && (
                      <div className="mt-1.5 text-xs leading-relaxed opacity-90">{o.why}</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {allDone && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="mt-5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-sm text-cyan-100">
          🏆 <strong>Score: {correct}/{QUESTIONS.length}.</strong>{' '}
          {correct === QUESTIONS.length
            ? 'All correct — you can walk through any architectural trade-off in an interview.'
            : 'Read the explanations carefully — knowing WHY an answer is wrong matters more than the answer itself.'}
        </motion.div>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function ArchitectureCaseStudyPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-gray-800 bg-gradient-to-br from-violet-500/10 via-blue-500/5 to-transparent p-6 sm:p-8 mb-8">
        <Link to="/modules" className="text-xs text-gray-400 hover:text-gray-200">← Back to modules</Link>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200">
          🎥 Real-world case study · Architectural Patterns
        </div>
        <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold text-white">
          Building{' '}
          <span className="bg-gradient-to-r from-violet-300 via-pink-300 to-orange-300 bg-clip-text text-transparent">
            StreamCart
          </span>
        </h1>
        <p className="mt-2 text-gray-400 leading-relaxed max-w-3xl">
          StreamCart is a live-video e-commerce platform — think Meesho Live or Amazon Live. One product,
          six architectural patterns. Every sub-topic explained with the real design decision
          that drove it — at a scale of 10 million users and 50,000 concurrent live-stream viewers.
          End with 5 interview-level questions.
        </p>
        <div className="mt-4 grid sm:grid-cols-4 gap-2 text-xs">
          <Pill label="Patterns covered" value="6 / 6"         tone="green" />
          <Pill label="Interactive demos" value="6"            tone="blue" />
          <Pill label="Scale"             value="10M users"    tone="purple" />
          <Pill label="Time"              value="~25 min"      tone="gray" />
        </div>
      </motion.div>

      {/* Company story strip */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-xl border border-gray-800 bg-gray-900/60 px-5 py-4 mb-6 flex flex-wrap gap-4 items-center">
        <div className="text-2xl">🏢</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">The StreamCart story</p>
          <p className="text-xs text-gray-400 leading-relaxed">
            2021: 3 engineers, 1 Django app, 0 users. 2024: 10M users, 120 engineers, ₹500Cr GMV.
            This page traces every architectural decision they made as they grew — and why each one was the right call at that stage.
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <Pill label="GMV" value="₹500 Cr/yr" tone="green" />
          <Pill label="Peak" value="50K concurrent" tone="orange" />
        </div>
      </motion.div>

      <div className="space-y-5">
        <SectionShell index={1} icon="🌐" color="border-pink-500/40 bg-pink-500/10"
          title="Client-Server Architecture — tracing a single request"
          scenario="Every interaction on StreamCart starts with a client request. But 'client → server' hides a journey through 4–6 components. Click each user action to trace the exact path."
          takeaway="In interviews, always trace requests end-to-end: client → DNS → CDN → Load Balancer → Service → Cache → DB → response. This shows you understand how real systems are layered, not just the happy-path API call.">
          <ClientServerDemo />
        </SectionShell>

        <SectionShell index={2} icon="🧱" color="border-yellow-500/40 bg-yellow-500/10"
          title="Monolith → Microservices — the evolution under load"
          scenario="StreamCart did not start with microservices. They started with a Django monolith — the right choice for 3 engineers. Watch how each growth milestone forced architectural change."
          takeaway="The correct interview answer is never 'microservices from day one.' Always say: start with a structured monolith, identify the specific pain point (CPU, deploy time, team independence), and extract only the service that solves that pain.">
          <MonolithEvolutionDemo />
        </SectionShell>

        <SectionShell index={3} icon="🔔" color="border-red-500/40 bg-red-500/10"
          title="Event-Driven Architecture — the live stream Buy Now fan-out"
          scenario="80,000 viewers. One item. Everyone taps Buy at once. A direct REST call to 5 services in sequence would take seconds and create tight coupling. EDA solves both. Click Buy Now and watch."
          takeaway="When one action must trigger multiple independent reactions, use events not direct calls. Describe Kafka as 'a durable ordered log that any consumer can read at their own pace.' Mention idempotency keys and Dead Letter Queues for robustness.">
          <EventDrivenDemo />
        </SectionShell>

        <SectionShell index={4} icon="🔐" color="border-cyan-500/40 bg-cyan-500/10"
          title="CORS — why the browser blocks StreamCart's first API call"
          scenario="StreamCart's React app lives on web.streamcart.com. The API is on api.streamcart.com. Different subdomain = different origin = browser blocks it. Toggle CORS on/off and watch the preflight flow."
          takeaway="CORS is a browser security mechanism, not a server bug. It is always fixed server-side by adding Access-Control-Allow-Origin headers. Explain the preflight: browser sends OPTIONS first, then only proceeds if the server approves the origin.">
          <CORSDemo />
        </SectionShell>

        <SectionShell index={5} icon="⚡" color="border-orange-500/40 bg-orange-500/10"
          title="Serverless Architecture — thumbnail processing & nightly reports"
          scenario="Not every workload needs a 24/7 server. Image resizing happens only when sellers upload photos. Reports run once nightly. Lambda is perfect — pay only when it runs. Simulate both pipelines and see cold starts."
          takeaway="Describe serverless trade-offs clearly: auto-scaling and zero idle cost vs cold starts and 15-min execution limit. For user-facing endpoints needing low latency: Provisioned Concurrency. For batch jobs, cron tasks, and event-triggered processing: standard Lambda is ideal.">
          <ServerlessDemo />
        </SectionShell>

        <SectionShell index={6} icon="🏗️" color="border-violet-500/40 bg-violet-500/10"
          title="The full picture — all patterns wired together"
          scenario="Every pattern we covered has its place in StreamCart's production architecture. Click each layer to understand its role and how it connects to the layers above and below."
          takeaway="In a system design interview, always draw this layered diagram. Start from the client and go down: edge → services → event bus → async compute → data. This structure shows architectural thinking, not just feature-level thinking.">
          <FullArchDemo />
        </SectionShell>
      </div>

      <div className="mt-10">
        <ExerciseSection />
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        Covered every architectural pattern?{' '}
        <Link to="/modules" className="text-cyan-300 hover:text-cyan-200">Explore all modules →</Link>
      </div>
    </div>
  );
}
