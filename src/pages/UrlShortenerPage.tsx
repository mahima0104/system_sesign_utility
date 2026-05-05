import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

// ─────────────────────────────────────────────────────────────────────────────
// Sound effects — Web Audio API, no external files needed
// ─────────────────────────────────────────────────────────────────────────────
function useSounds(on: boolean) {
  const acRef = useRef<AudioContext | null>(null);

  function getAC(): AudioContext | null {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!acRef.current) acRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      return acRef.current;
    } catch { return null; }
  }

  function ping() {
    if (!on) return;
    const ac = getAC(); if (!ac) return;
    try {
      const o = ac.createOscillator(), g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      o.frequency.value = 880; o.type = 'sine';
      g.gain.setValueAtTime(0.07, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.28);
      o.start(); o.stop(ac.currentTime + 0.28);
    } catch { /**/ }
  }

  function chime() {
    if (!on) return;
    const ac = getAC(); if (!ac) return;
    try {
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.connect(g); g.connect(ac.destination);
        o.frequency.value = freq;
        const t = ac.currentTime + i * 0.11;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.07, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
        o.start(t); o.stop(t + 0.32);
      });
    } catch { /**/ }
  }

  return { ping, chime };
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared primitives
// ─────────────────────────────────────────────────────────────────────────────
function CodeBlock({ code, language = 'java' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-950 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900/60">
        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">{language}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
          className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
        >
          {copied ? '✓ copied' : 'copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-gray-300 font-mono whitespace-pre">{code}</pre>
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}>{label}</span>;
}

function InterviewerBubble({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm shadow-lg">
        🎙️
      </div>
      <div className="flex-1 rounded-2xl rounded-tl-none border border-indigo-500/30 bg-indigo-500/10 px-4 py-3">
        <p className="text-[10px] uppercase tracking-wider text-indigo-400 font-semibold mb-1.5">Interviewer</p>
        <p className="text-gray-200 text-sm leading-relaxed font-medium italic">"{text}"</p>
      </div>
    </div>
  );
}

function CandidateBubble({ steps }: { steps: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-sm shadow-lg">
        🧑‍💻
      </div>
      <div className="flex-1">
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between gap-3 rounded-2xl rounded-tl-none border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-left hover:bg-emerald-500/15 transition-colors"
        >
          <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">
            Candidate Thought Process {open ? '▲' : '▼ (tap to reveal)'}
          </span>
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden"
            >
              <div className="mt-1 rounded-xl border border-gray-800 bg-gray-900/60 p-4 space-y-2">
                {steps.map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-2.5"
                  >
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-gray-300 leading-relaxed">{s}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function IdealAnswer({ points }: { points: { label: string; text: string }[] }) {
  return (
    <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 space-y-3">
      <p className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">✅ Ideal Response Points</p>
      {points.map((pt, i) => (
        <div key={i} className="flex items-start gap-3">
          <span className="flex-shrink-0 mt-0.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-400 uppercase whitespace-nowrap">
            {pt.label}
          </span>
          <p className="text-sm text-gray-300 leading-relaxed">{pt.text}</p>
        </div>
      ))}
    </div>
  );
}

function InterviewTip({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
      <span className="text-yellow-400 text-base flex-shrink-0 mt-0.5">💡</span>
      <p className="text-sm text-yellow-200 leading-relaxed">{text}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Q2 — Capacity Estimator (interactive)
// ─────────────────────────────────────────────────────────────────────────────
function CapacityEstimator() {
  const [dau, setDau] = useState(100);
  const [rwRatio, setRwRatio] = useState(100);
  const [urlLen, setUrlLen] = useState(100);
  const [years, setYears] = useState(5);

  const writeQps = Math.round((dau * 1_000_000) / 86_400);
  const readQps = writeQps * rwRatio;
  const storagePerYear = Math.round((writeQps * 86_400 * 365 * (urlLen + 50)) / 1_073_741_824 * 10) / 10;
  const totalStorageGB = Math.round(storagePerYear * years * 10) / 10;
  const cacheBytes = readQps * urlLen * 0.002; // 0.2% hot URLs cached
  const cacheMB = Math.round(cacheBytes / 1_048_576 * 10) / 10;

  const rows = [
    { label: 'Write QPS', value: writeQps.toLocaleString(), unit: 'ops/s', note: 'New URLs/sec', color: 'text-orange-300' },
    { label: 'Read QPS', value: readQps.toLocaleString(), unit: 'ops/s', note: 'Redirects/sec', color: 'text-cyan-300' },
    { label: 'Storage/year', value: storagePerYear.toString(), unit: 'GB', note: 'URL + metadata', color: 'text-emerald-300' },
    { label: `Total (${years}y)`, value: totalStorageGB.toString(), unit: 'GB', note: 'Full DB size', color: 'text-violet-300' },
    { label: 'Redis RAM', value: cacheMB < 1000 ? cacheMB + ' MB' : Math.round(cacheMB / 1024 * 10) / 10 + ' GB', unit: '', note: 'Top 0.2% URLs', color: 'text-pink-300' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        {([
          { label: 'DAU (millions)', value: dau, set: setDau, min: 1, max: 500, step: 1 },
          { label: 'Read : Write ratio', value: rwRatio, set: setRwRatio, min: 10, max: 1000, step: 10 },
          { label: 'Avg URL length (bytes)', value: urlLen, set: setUrlLen, min: 50, max: 500, step: 10 },
          { label: 'Data retention (years)', value: years, set: setYears, min: 1, max: 10, step: 1 },
        ] as const).map(({ label, value, set, min, max, step }) => (
          <div key={label} className="space-y-1.5">
            <div className="flex justify-between">
              <label className="text-xs text-gray-400">{label}</label>
              <span className="text-xs font-bold text-white">{value.toLocaleString()}</span>
            </div>
            <input
              type="range" min={min} max={max} step={step} value={value}
              onChange={e => (set as (n: number) => void)(Number(e.target.value))}
              className="w-full h-1.5 rounded-full accent-cyan-400 bg-gray-800 cursor-pointer"
            />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {rows.map(row => (
          <motion.div key={row.label} layout className="rounded-xl border border-gray-800 bg-gray-900/60 p-3 text-center">
            <p className="text-[9px] uppercase tracking-wide text-gray-500 mb-1">{row.label}</p>
            <p className={`text-base font-bold ${row.color}`}>{row.value}</p>
            <p className="text-[9px] text-gray-600">{row.unit} {row.note}</p>
          </motion.div>
        ))}
      </div>
      <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3.5 text-sm text-yellow-200 leading-relaxed">
        <strong className="text-yellow-300">Say this out loud:</strong>{' '}
        "With {dau}M DAU, I'm seeing ~{writeQps.toLocaleString()} writes/sec and ~{readQps.toLocaleString()} reads/sec.
        Storage grows {storagePerYear}GB/year, so {totalStorageGB}GB over {years} years — easily fits on PostgreSQL.
        Redis cache for the hot {0.2}% of URLs needs only ~{cacheMB < 1000 ? cacheMB + 'MB' : Math.round(cacheMB / 1024 * 10) / 10 + 'GB'} of RAM."
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Q3 — Animated Architecture Diagram
// ─────────────────────────────────────────────────────────────────────────────
type FlowId = 'write' | 'readHit' | 'readMiss';

const FLOWS: Record<FlowId, { label: string; color: string; path: string[]; desc: string }> = {
  write: {
    label: '✍️ Create Short URL',
    color: 'border-orange-400/60 bg-orange-400/10 text-orange-300',
    path: ['client', 'lb', 'app', 'db', 'redis', 'kafka'],
    desc: 'POST /api/v1/shorten → App generates Base62 code → saves to DB → warms Redis cache → returns short URL',
  },
  readHit: {
    label: '⚡ Redirect — CDN HIT',
    color: 'border-emerald-400/60 bg-emerald-400/10 text-emerald-300',
    path: ['client', 'cdn'],
    desc: 'Browser hits CDN edge cache → 301 redirect served in <1 ms, zero origin traffic. 80%+ of redirects exit here.',
  },
  readMiss: {
    label: '🔄 Redirect — Cache MISS',
    color: 'border-cyan-400/60 bg-cyan-400/10 text-cyan-300',
    path: ['client', 'cdn', 'lb', 'app', 'redis', 'kafka'],
    desc: 'CDN miss → Redis hit (sub-ms) → 301 redirect, Kafka click event fired async. Redis re-populates CDN TTL.',
  },
};

const ARCH_NODES: { id: string; label: string; icon: string; desc: string; cls: string }[] = [
  { id: 'client', label: 'Client Browser', icon: '👤', desc: 'GET /abc123', cls: 'border-pink-500/40 bg-pink-500/10 text-pink-200' },
  { id: 'cdn', label: 'CDN Edge', icon: '⚡', desc: 'Cache: 1hr TTL', cls: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-200' },
  { id: 'lb', label: 'Load Balancer', icon: '⚖️', desc: 'Round-robin / L7', cls: 'border-blue-500/40 bg-blue-500/10 text-blue-200' },
  { id: 'app', label: 'App Server ×3', icon: '🖥️', desc: 'Stateless pods', cls: 'border-violet-500/40 bg-violet-500/10 text-violet-200' },
  { id: 'redis', label: 'Redis Cache', icon: '📦', desc: '24h TTL per URL', cls: 'border-orange-500/40 bg-orange-500/10 text-orange-200' },
  { id: 'db', label: 'PostgreSQL', icon: '🗄️', desc: 'Primary + replicas', cls: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200' },
  { id: 'kafka', label: 'Kafka', icon: '📨', desc: 'url.clicks topic', cls: 'border-amber-500/40 bg-amber-500/10 text-amber-200' },
];

function ArchDiagram() {
  const [flow, setFlow] = useState<FlowId>('readHit');
  const [step, setStep] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startFlow(f: FlowId) {
    setFlow(f); setStep(-1);
    if (timerRef.current) clearInterval(timerRef.current);
    let i = 0;
    const path = FLOWS[f].path;
    timerRef.current = setInterval(() => {
      setStep(i);
      i++;
      if (i >= path.length) { clearInterval(timerRef.current!); timerRef.current = null; }
    }, 600);
  }

  useEffect(() => { startFlow('readHit'); return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, []);

  const activeFlow = FLOWS[flow];
  const activeNodes = new Set(step >= 0 ? activeFlow.path.slice(0, step + 1) : []);
  const currentNode = step >= 0 ? activeFlow.path[step] : null;

  return (
    <div className="space-y-4">
      {/* Flow selector */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(FLOWS) as FlowId[]).map(f => (
          <button
            key={f}
            onClick={() => startFlow(f)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              flow === f ? FLOWS[f].color : 'border-gray-700 bg-gray-900 text-gray-400 hover:text-gray-200'
            }`}
          >
            {FLOWS[f].label}
          </button>
        ))}
        <button
          onClick={() => startFlow(flow)}
          className="px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-900 text-xs text-gray-400 hover:text-gray-200"
        >
          ↺ Replay
        </button>
      </div>

      {/* Nodes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {ARCH_NODES.map(node => {
          const isActive = activeNodes.has(node.id);
          const isCurrent = currentNode === node.id;
          return (
            <motion.div
              key={node.id}
              animate={isCurrent ? { scale: [1, 1.05, 1], y: [0, -3, 0] } : {}}
              transition={{ duration: 0.4 }}
              className={`relative rounded-xl border p-3 text-center transition-all duration-300 ${
                isCurrent
                  ? `${node.cls} shadow-lg ring-1 ring-white/20`
                  : isActive
                    ? `${node.cls} opacity-80`
                    : 'border-gray-800 bg-gray-900/40 text-gray-600 opacity-40'
              }`}
            >
              {isCurrent && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 1 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  className="absolute inset-0 rounded-xl bg-white/10"
                />
              )}
              <div className="text-xl mb-1">{node.icon}</div>
              <p className="text-xs font-semibold leading-tight">{node.label}</p>
              <p className="text-[9px] opacity-70 mt-0.5">{node.desc}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Flow description */}
      <AnimatePresence mode="wait">
        <motion.div
          key={flow}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-3"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-gray-300">Flow path:</span>
            <span className="text-xs text-gray-500">{activeFlow.path.join(' → ')}</span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">{activeFlow.desc}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Q4 — Base62 Step Visualizer
// ─────────────────────────────────────────────────────────────────────────────
const CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function Base62Stepper() {
  const [inputId, setInputId] = useState(12345678);
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [running, setRunning] = useState(false);

  type Step = { current: number; quotient: number; remainder: number; char: string };

  function computeSteps(id: number): Step[] {
    const steps: Step[] = [];
    let cur = id;
    while (cur > 0) {
      const rem = cur % 62;
      steps.push({ current: cur, quotient: Math.floor(cur / 62), remainder: rem, char: CHARSET[rem] });
      cur = Math.floor(cur / 62);
    }
    return steps;
  }

  const steps = computeSteps(inputId);
  const result = steps.map(s => s.char).reverse().join('');

  async function runAnimation() {
    setRunning(true);
    setVisibleSteps(0);
    for (let i = 1; i <= steps.length + 1; i++) {
      await new Promise(r => setTimeout(r, 520));
      setVisibleSteps(i);
    }
    setRunning(false);
  }

  const presets = [
    { label: 'Row #1', id: 1 },
    { label: 'Row #100', id: 100 },
    { label: 'Row #1M', id: 1_000_000 },
    { label: 'Row #12345678', id: 12345678 },
    { label: 'Row #999999999', id: 999_999_999 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-gray-400">Try a DB row ID:</span>
        {presets.map(p => (
          <button
            key={p.id}
            onClick={() => { setInputId(p.id); setVisibleSteps(0); }}
            className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
              inputId === p.id
                ? 'border-brand-400/60 bg-brand-500/15 text-brand-300'
                : 'border-gray-700 bg-gray-900 text-gray-400 hover:text-gray-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 rounded-xl border border-gray-800 bg-gray-900 px-4 py-2">
          <span className="text-xs text-gray-500 mr-2">DB auto-increment ID:</span>
          <span className="text-lg font-bold text-white font-mono">{inputId.toLocaleString()}</span>
        </div>
        <button
          onClick={runAnimation}
          disabled={running}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-cyan-500 text-white text-sm font-semibold disabled:opacity-50 transition-all hover:from-brand-400 hover:to-cyan-400"
        >
          {running ? 'Encoding…' : '▶ Encode'}
        </button>
      </div>

      {/* Step table */}
      {visibleSteps > 0 && (
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-1.5 text-[10px] uppercase tracking-wide text-gray-500 font-semibold px-1">
            <span>Current ÷ 62</span><span>Quotient</span><span>Remainder</span><span>Character</span>
          </div>
          {steps.slice(0, visibleSteps).map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-4 gap-1.5"
            >
              <div className="rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 font-mono text-sm text-gray-300">{s.current.toLocaleString()}</div>
              <div className="rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 font-mono text-sm text-gray-400">{s.quotient.toLocaleString()}</div>
              <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2 font-mono text-sm text-orange-300 font-bold">{s.remainder}</div>
              <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 font-mono text-sm text-cyan-300 font-bold text-center">{s.char}</div>
            </motion.div>
          ))}
          {visibleSteps > steps.length && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 flex items-center gap-4"
            >
              <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wide">Result (reversed chars)</span>
              <span className="font-mono text-2xl font-bold text-emerald-300 tracking-widest">{result}</span>
              <span className="text-xs text-gray-500">→ https://shr.ly/<strong className="text-emerald-400">{result}</strong></span>
            </motion.div>
          )}
        </div>
      )}

      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-3.5 space-y-1.5">
        <p className="text-xs font-semibold text-gray-300">Why Base62 instead of MD5 hash?</p>
        <div className="grid sm:grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-2.5">
            <p className="font-semibold text-red-300 mb-1">✗ MD5 Hash approach</p>
            <p className="text-gray-400 leading-relaxed">MD5("https://foo.com") → take first 7 chars. Risk of collision: two URLs produce same prefix. Need retry loop. Not deterministic.</p>
          </div>
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5">
            <p className="font-semibold text-emerald-300 mb-1">✓ Counter + Base62 approach</p>
            <p className="text-gray-400 leading-relaxed">DB auto-increment ID is always unique. Base62(ID) is always unique. Zero collisions. 7 chars = 62⁷ ≈ 3.5 trillion URLs.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Q5 — Cache effectiveness demo
// ─────────────────────────────────────────────────────────────────────────────
function CacheEffectivenessDemo() {
  const [hitRate, setHitRate] = useState(90);
  const totalRps = 50000;
  const cacheHits = Math.round(totalRps * hitRate / 100);
  const dbHits = totalRps - cacheHits;
  const dbCapacity = 5000;
  const overloaded = dbHits > dbCapacity;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <label className="text-gray-400">Redis cache hit rate</label>
          <span className={`font-bold ${hitRate >= 80 ? 'text-emerald-400' : hitRate >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>{hitRate}%</span>
        </div>
        <input
          type="range" min={0} max={100} step={5} value={hitRate}
          onChange={e => setHitRate(Number(e.target.value))}
          className="w-full h-2 rounded-full accent-cyan-400 bg-gray-800 cursor-pointer"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <motion.div layout className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-center">
          <p className="text-[10px] uppercase text-emerald-500 tracking-wide mb-1">Redis Serves</p>
          <p className="text-2xl font-black text-emerald-300">{cacheHits.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-0.5">req/sec → sub-ms</p>
        </motion.div>
        <motion.div layout className={`rounded-xl border p-3.5 text-center ${overloaded ? 'border-red-500/40 bg-red-500/10' : 'border-gray-700 bg-gray-900/50'}`}>
          <p className="text-[10px] uppercase text-gray-500 tracking-wide mb-1">DB Must Handle</p>
          <p className={`text-2xl font-black ${overloaded ? 'text-red-400' : 'text-gray-200'}`}>{dbHits.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-0.5">req/sec {overloaded ? '⚠ over DB capacity!' : `(capacity: ${dbCapacity.toLocaleString()})`}</p>
        </motion.div>
      </div>

      {/* Visual bar */}
      <div className="space-y-1.5">
        <div className="flex rounded-full overflow-hidden h-4 bg-gray-800">
          <motion.div
            layout
            className="bg-gradient-to-r from-emerald-500 to-cyan-500"
            style={{ width: `${hitRate}%` }}
          />
          <motion.div
            layout
            className={`${overloaded ? 'bg-red-500/70' : 'bg-gray-600'}`}
            style={{ width: `${100 - hitRate}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-gray-500">
          <span className="text-emerald-400">{hitRate}% from Redis (fast)</span>
          <span className={overloaded ? 'text-red-400' : ''}>{100 - hitRate}% to DB</span>
        </div>
      </div>

      <AnimatePresence>
        {overloaded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 leading-relaxed"
          >
            ⚠️ <strong>Database overload!</strong> At {100 - hitRate}% miss rate ({dbHits.toLocaleString()} req/s), the DB can't keep up.
            Mitigation: add read replicas, increase Redis TTL, pre-warm cache for top URLs, consider CDN edge caching.
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-xs text-gray-500 leading-relaxed p-3 rounded-xl border border-gray-800 bg-gray-900/40">
        <strong className="text-gray-300">Real-world insight:</strong> bit.ly and TinyURL see 80-90%+ cache hit rates in production.
        Popular URLs (top 20%) account for 80%+ of traffic (Pareto principle). Caching the top 1% of URLs reduces DB load by ~60-70%.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Java code blocks
// ─────────────────────────────────────────────────────────────────────────────
const javaEntityCode = `// Step 1: URL Entity — auto-increment ID is the key to collision-free shortening
@Entity
@Table(name = "urls", indexes = {
    @Index(name = "idx_short_code", columnList = "short_code"),
    @Index(name = "idx_long_url_hash", columnList = "long_url_hash")
})
@Getter @Setter @NoArgsConstructor
public class UrlEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;               // ← Base62(this ID) = short code

    @Column(name = "short_code", unique = true, length = 10)
    private String shortCode;      // e.g. "aB3xY9" — set AFTER first insert

    @Column(name = "long_url", nullable = false, length = 2048)
    private String longUrl;

    @Column(name = "long_url_hash", length = 64)
    private String longUrlHash;    // SHA-256 of longUrl — for fast duplicate check

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "expires_at")
    private Instant expiresAt;     // null = never expires

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "click_count")
    private long clickCount = 0;
}

@Repository
public interface UrlRepository extends JpaRepository<UrlEntity, Long> {
    Optional<UrlEntity> findByShortCode(String shortCode);
    // Hash-based lookup is O(1) — avoids full-text scan on 2KB URL columns
    Optional<UrlEntity> findByLongUrlHash(String hash);
}`;

const javaEncoderCode = `// Base62 encoder/decoder — zero-collision URL ID generation
// Alphabet: 0-9 (10) + A-Z (26) + a-z (26) = 62 characters
// 7 chars → 62^7 = 3,521,614,606,208 unique codes (~3.5 trillion)
@Component
public class Base62Encoder {

    static final String CHARSET =
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    private static final int BASE = 62;

    /**
     * Encode a positive DB row ID to a compact Base62 string.
     *
     * Example walkthrough for id = 12345678:
     *   12345678 % 62 =  32  → CHARSET[32]  = 'W'   ← rightmost digit
     *     199123 % 62 =  41  → CHARSET[41]  = 'f'
     *       3211 % 62 =  49  → CHARSET[49]  = 'n'
     *         51 % 62 =  51  → CHARSET[51]  = 'p'   ← leftmost digit
     *   Collected right-to-left → reverse → "pnfW"
     */
    public String encode(long id) {
        if (id <= 0) throw new IllegalArgumentException("ID must be positive, got: " + id);
        StringBuilder sb = new StringBuilder();
        while (id > 0) {
            sb.append(CHARSET.charAt((int)(id % BASE)));
            id /= BASE;
        }
        return sb.reverse().toString();
    }

    /** Decode a Base62 string back to its numeric DB ID. */
    public long decode(String code) {
        if (code == null || code.isBlank())
            throw new IllegalArgumentException("Code cannot be empty");
        long id = 0;
        for (char c : code.toCharArray()) {
            int index = CHARSET.indexOf(c);
            if (index == -1) throw new IllegalArgumentException("Invalid Base62 char: " + c);
            id = id * BASE + index;
        }
        return id;
    }
}

/* Why NOT use MD5/SHA hash?
 *   MD5("https://example.com") = "d8e8fca2dc0f896..." — take first 7 chars: "d8e8fca"
 *   PROBLEM: Two different URLs can produce the same first 7 chars (COLLISION).
 *   Resolution requires a retry loop → non-deterministic → complex.
 *
 * Counter-based has ZERO collisions because:
 *   Every DB row has a unique auto-increment ID.
 *   Base62(uniqueID) is always unique. No retry needed. Simple and fast.
 */`;

const javaServiceCode = `// URL Shortener Service — create short URLs and resolve redirects
@Service
@Slf4j
@RequiredArgsConstructor
public class UrlShortenerService {

    private final UrlRepository             urlRepo;
    private final Base62Encoder             encoder;
    private final StringRedisTemplate       redis;
    private final ApplicationEventPublisher events;

    private static final String   BASE_DOMAIN  = "https://shr.ly/";
    private static final Duration CACHE_TTL    = Duration.ofHours(24);
    private static final String   KEY_PREFIX   = "url:";

    // ─── Shorten a long URL ──────────────────────────────────────────────────
    @Transactional
    public String shorten(ShortenRequest req, Long userId) {
        String hash = sha256(req.getLongUrl());

        // Idempotency: same long URL → same short URL (no duplicates in DB)
        return urlRepo.findByLongUrlHash(hash)
                      .map(u -> BASE_DOMAIN + u.getShortCode())
                      .orElseGet(() -> createNew(req, userId, hash));
    }

    private String createNew(ShortenRequest req, Long userId, String hash) {
        // Step 1: persist to get the auto-increment primary key
        UrlEntity url = new UrlEntity();
        url.setLongUrl(req.getLongUrl());
        url.setLongUrlHash(hash);
        url.setUserId(userId);
        url.setExpiresAt(req.getExpiresAt());
        url = urlRepo.save(url);            // DB assigns id = e.g. 12345678

        // Step 2: encode the ID → short code (guaranteed unique, no collision)
        String code = encoder.encode(url.getId());   // 12345678 → "pnfW"
        url.setShortCode(code);
        urlRepo.save(url);                  // second save stores the code

        // Step 3: warm Redis immediately so first redirect is fast
        redis.opsForValue().set(KEY_PREFIX + code, req.getLongUrl(), CACHE_TTL);

        log.info("Created {} → {}{}", req.getLongUrl(), BASE_DOMAIN, code);
        return BASE_DOMAIN + code;
    }

    // ─── Resolve short code → long URL ───────────────────────────────────────
    public String resolve(String shortCode, ClickMetadata meta) {
        // L1: Redis cache — handles ~99% of redirect traffic at sub-ms latency
        String cached = redis.opsForValue().get(KEY_PREFIX + shortCode);
        if (cached != null) {
            fireClickEventAsync(shortCode, meta);
            return cached;
        }

        // L2: Database (cold path — first hit after cache eviction)
        UrlEntity url = urlRepo.findByShortCode(shortCode)
            .orElseThrow(() -> new UrlNotFoundException(shortCode));

        if (url.getExpiresAt() != null && url.getExpiresAt().isBefore(Instant.now())) {
            throw new UrlExpiredException(shortCode);
        }

        // Backfill Redis to prevent thundering herd on next request
        redis.opsForValue().set(KEY_PREFIX + shortCode, url.getLongUrl(), CACHE_TTL);
        fireClickEventAsync(shortCode, meta);
        return url.getLongUrl();
    }

    @Async  // Never block the HTTP response waiting for Kafka
    void fireClickEventAsync(String code, ClickMetadata meta) {
        events.publishEvent(
            new ClickEvent(code, meta.getUserAgent(), meta.getIpAddress(), Instant.now()));
    }

    private String sha256(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(input.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) { throw new RuntimeException(e); }
    }
}`;

const javaControllerCode = `// REST Controller — thin adapter, zero business logic
@RestController
@RequiredArgsConstructor
@Slf4j
public class UrlController {

    private final UrlShortenerService urlService;
    private final RateLimiterService  rateLimiter;

    // ── POST /api/v1/shorten ─────────────────────────────────────────────────
    // Authenticated. Body: { "longUrl": "https://...", "expiresAt": "2026-12-31" }
    // Response: { "shortUrl": "https://shr.ly/pnfW" }
    @PostMapping("/api/v1/shorten")
    public ResponseEntity<ShortenResponse> shorten(
            @Valid @RequestBody ShortenRequest req,
            @AuthenticationPrincipal AppUser user) {

        rateLimiter.checkOrThrow("shorten", user.getId(), 100);  // 100 req/min
        String shortUrl = urlService.shorten(req, user.getId());
        return ResponseEntity.ok(new ShortenResponse(shortUrl));
    }

    // ── GET /{shortCode} ─────────────────────────────────────────────────────
    // Public. HTTP 301 (permanent) so CDN and browsers cache the redirect.
    // Regex: 4–10 alphanumeric chars only — prevents path traversal attacks.
    @GetMapping("/{shortCode:[a-zA-Z0-9]{4,10}}")
    public ResponseEntity<Void> redirect(
            @PathVariable String shortCode,
            HttpServletRequest httpReq) {

        ClickMetadata meta = ClickMetadata.from(httpReq);
        String longUrl = urlService.resolve(shortCode, meta);

        return ResponseEntity
            .status(HttpStatus.MOVED_PERMANENTLY)
            .header(HttpHeaders.LOCATION, longUrl)
            // Cache-Control tells CDN to store this for 1 hour
            .header(HttpHeaders.CACHE_CONTROL, "public, max-age=3600")
            .build();
    }

    // ── Error handlers ───────────────────────────────────────────────────────
    @ExceptionHandler(UrlNotFoundException.class)
    public ResponseEntity<ErrorResponse> notFound(UrlNotFoundException ex) {
        return ResponseEntity.status(404)
            .body(new ErrorResponse("URL_NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(UrlExpiredException.class)
    public ResponseEntity<ErrorResponse> expired(UrlExpiredException ex) {
        return ResponseEntity.status(410)  // 410 Gone — more accurate than 404
            .body(new ErrorResponse("URL_EXPIRED", ex.getMessage()));
    }

    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<ErrorResponse> rateLimit() {
        return ResponseEntity.status(429)
            .header("Retry-After", "60")
            .body(new ErrorResponse("RATE_LIMITED", "Max 100 shortens/min"));
    }
}`;

const javaRateLimiterCode = `// Sliding-window rate limiter — Redis atomic INCR, works across all pods
@Service
@RequiredArgsConstructor
public class RateLimiterService {

    private final StringRedisTemplate redis;

    /**
     * Allows up to {limit} requests per 60-second window per {clientId}.
     *
     * Key structure: "rl:{operation}:{clientId}:{epochMinute}"
     *   e.g.  "rl:shorten:user-42:28623" (epoch minute since 1970)
     *
     * Why this works across multiple App Server pods:
     *   All pods share the SAME Redis instance.
     *   Redis INCR is atomic — no double-counting under concurrency.
     *   Window auto-expires via 2-minute TTL (prevents stale key leaks).
     */
    public void checkOrThrow(String operation, String clientId, int limit) {
        long epochMinute = System.currentTimeMillis() / 60_000L;
        String key = String.format("rl:%s:%s:%d", operation, clientId, epochMinute);

        Long count = redis.opsForValue().increment(key);
        if (count == null) throw new ServiceException("Redis unavailable");

        // Set TTL on first increment so key auto-expires (avoids memory leak)
        if (count == 1L) redis.expire(key, Duration.ofMinutes(2));

        if (count > limit) {
            log.warn("Rate limit exceeded: {} for {} (count={})", operation, clientId, count);
            throw new RateLimitExceededException(
                String.format("%s: limit %d/min exceeded", operation, limit));
        }
    }
}

// ─── Async Kafka analytics — click events without blocking redirects ──────────
@Component
@RequiredArgsConstructor
@Slf4j
public class ClickEventHandler implements ApplicationListener<ClickEvent> {

    private final KafkaTemplate<String, ClickEvent> kafka;
    private static final String TOPIC = "url.clicks";

    @Async  // Spring's @Async runs this in a thread pool, not the HTTP thread
    @Override
    public void onApplicationEvent(@NonNull ClickEvent event) {
        kafka.send(TOPIC, event.getShortCode(), event)
             .whenComplete((result, ex) -> {
                 if (ex != null) log.error("Failed to publish click event", ex);
             });
        // Consumer group "analytics-service" reads this topic and writes
        // to ClickHouse/InfluxDB for real-time dashboards and reports.
    }
}`;

// ─────────────────────────────────────────────────────────────────────────────
// Interview question data
// ─────────────────────────────────────────────────────────────────────────────
const QUESTIONS = [
  {
    id: 1,
    stage: 'Requirements',
    time: '5 min',
    accent: 'border-pink-500/40',
    dot: 'bg-pink-400',
    badge: 'bg-pink-500/10 border-pink-500/30 text-pink-300',
    interviewer: 'Design a URL shortener service like bit.ly. Where would you start?',
    thinking: [
      "Don't jump to architecture. Asking clarifying questions shows seniority — it proves I think about problems before coding.",
      'I need to separate functional requirements (what it does) from non-functional (how well it does it).',
      'Ask about scale, custom aliases, link expiry, analytics, and auth to know which components are in scope.',
    ],
    idealAnswer: [
      { label: 'Clarify scale', text: '"How many URLs per day? How many redirects? 100M DAU or 10M?" — This drives the entire architecture.' },
      { label: 'Functional', text: 'Given a long URL, generate a short code (7 chars). Short URL redirects to long URL. Optional: custom aliases, expiry, click analytics.' },
      { label: 'Non-functional', text: '99.99% availability (redirects must never go down). Redirect latency <10 ms p99. Shortening latency <100 ms. Eventual consistency OK for analytics.' },
      { label: 'Out of scope', text: 'User accounts, dashboards, team sharing — for v1. Say it explicitly to stay focused.' },
    ],
    tip: 'Interviewers at Google/Meta say the biggest red flag is a candidate who starts drawing boxes before asking a single question. Spend 3–4 minutes here — it buys goodwill for the rest of the interview.',
  },
  {
    id: 2,
    stage: 'Estimation',
    time: '8 min',
    accent: 'border-orange-500/40',
    dot: 'bg-orange-400',
    badge: 'bg-orange-500/10 border-orange-500/30 text-orange-300',
    interviewer: 'Assume 100M daily active users. Walk me through your capacity estimates.',
    thinking: [
      "State my assumptions out loud: 100M DAU, each user shortens ~1 URL/day, and reads (redirects) are 100× more frequent than writes.",
      'Always estimate writes first, then derive reads. Then calculate storage, then memory.',
      "Round numbers aggressively. Precision is wrong — you don't know exact figures. Show the approach, not the exact answer.",
    ],
    idealAnswer: [
      { label: 'Write QPS', text: '100M URLs/day ÷ 86,400 sec ≈ 1,160 writes/sec. Round to ~1K writes/sec.' },
      { label: 'Read QPS', text: 'At 100:1 read/write ratio → ~100K reads/sec (redirects). This is the dominant traffic.' },
      { label: 'Storage', text: '~100 bytes per URL + 50 bytes metadata = 150 bytes × 1K/sec × 86,400 × 365 = ~4.7TB/year. 5 years = ~23TB. Easily fits on PostgreSQL.' },
      { label: 'Cache', text: 'Top 0.2% hot URLs need ~100MB in Redis. Very small — all fits in memory. This is why caching is so effective here.' },
    ],
    tip: "Estimation impresses because it shows systems thinking. Say: \"I'm making assumptions — 100:1 read/write is typical for URL shorteners.\" Then adjust if the interviewer pushes back. The math doesn't need to be perfect.",
  },
  {
    id: 3,
    stage: 'Architecture',
    time: '15 min',
    accent: 'border-blue-500/40',
    dot: 'bg-blue-400',
    badge: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
    interviewer: 'Draw the high-level architecture. Walk me through how you\'d handle 100K redirects/sec.',
    thinking: [
      'Read-heavy system (100K:1K). Optimize the read (redirect) path first — that is 99% of traffic.',
      'CDN + Redis cache = the redirect path barely touches the database under normal load.',
      'Write path can be slower (200ms acceptable). Read path must be <10ms.',
      'Keep app servers stateless so I can scale horizontally.',
    ],
    idealAnswer: [
      { label: 'Write path', text: 'Client → Load Balancer → App Server → PostgreSQL (auto-increment ID) → Redis cache warm. App also publishes click events to Kafka for analytics.' },
      { label: 'Read path', text: 'Client → CDN Edge (cache HIT: 301 redirect in <1ms, zero origin) → LB → App → Redis cache (HIT: <5ms) → PostgreSQL read replica (MISS: rare, backfill Redis).' },
      { label: 'CDN config', text: 'Cache-Control: public, max-age=3600 header on redirect. CDN serves 80%+ of traffic at the edge — massive cost and latency win.' },
      { label: 'Kafka', text: 'Redirect handler publishes ClickEvent to Kafka asynchronously. Analytics consumers (separate service) read and write to ClickHouse/InfluxDB — redirect latency never affected.' },
    ],
    tip: 'Always say "I separated the read and write paths because reads are 100× more frequent. CDN + Redis means the database almost never gets hit during a redirect." This shows you think in terms of data flow and bottlenecks.',
  },
  {
    id: 4,
    stage: 'Core Algorithm',
    time: '10 min',
    accent: 'border-yellow-500/40',
    dot: 'bg-yellow-400',
    badge: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
    interviewer: 'How does the shortening algorithm work? What are the trade-offs between hash-based and counter-based approaches?',
    thinking: [
      "There are exactly two main approaches: hash (MD5/SHA, take prefix) and counter (auto-increment ID → Base62). I need to explain both and justify which I'd choose.",
      "Hash approach sounds clever but has a real problem: collisions. Two URLs can produce the same 7-char prefix, requiring a retry loop.",
      "Counter approach is simpler, deterministic, and collision-free. The only concern is that IDs are sequential — someone could crawl by incrementing. Mitigated by starting at a random offset or shuffling the charset.",
    ],
    idealAnswer: [
      { label: 'Hash approach', text: 'MD5(longUrl) → take first 7 chars. Simple, but collisions are possible (~0.001% chance). Requires a retry loop on collision. Not suitable at scale.' },
      { label: 'Counter (preferred)', text: 'DB auto-increment ID → Base62 encode. ID is unique by definition. 7 chars = 62⁷ ≈ 3.5 trillion codes. No collision, no retry. O(1) time.' },
      { label: 'Base62 alphabet', text: '"0-9A-Za-z" — avoids ambiguous characters (no 0/O confusion), URL-safe (no + or / unlike Base64). 62 chars per position.' },
      { label: 'Distributed ID gen', text: 'For multi-region: use Snowflake ID or a Redis INCRBY to generate globally unique IDs without DB coordination. Then Base62-encode the Snowflake ID.' },
    ],
    tip: 'This question separates the top 10% of candidates. Most people say "hash it" and stop there. The correct answer is counter + Base62 with a brief mention of the hash trade-off. Bonus: mention Snowflake IDs for global scale.',
  },
  {
    id: 5,
    stage: 'Scaling & Edge Cases',
    time: '7 min',
    accent: 'border-emerald-500/40',
    dot: 'bg-emerald-400',
    badge: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    interviewer: 'How would you handle a 10× traffic spike? What about expiration, analytics, and abuse prevention?',
    thinking: [
      'Traffic spikes → horizontal scaling of stateless app servers + CDN absorbs most of it. Redis is the buffer between users and DB.',
      'Expiry: store expiresAt in DB, check on resolve. Expired URLs return 410 Gone, not 404.',
      'Analytics must be async — never block the redirect for a write to analytics DB.',
      'Abuse: rate limiting per IP and per user via Redis sliding window. Phishing URL scanning via a background job.',
    ],
    idealAnswer: [
      { label: 'Traffic spike', text: 'CDN absorbs the spike for popular URLs. App servers autoscale (stateless, Kubernetes HPA). Redis handles 100K+ ops/sec natively. DB sees almost zero extra load due to cache hit rate.' },
      { label: 'Expiration', text: 'Store expiresAt column in DB. On resolve, check: if expiresAt < now → return HTTP 410 Gone. Background job weekly: delete rows where expired AND last_accessed > 30 days to reclaim storage.' },
      { label: 'Analytics', text: 'Redirect fires a Kafka message (async, <1ms overhead). Analytics consumer writes to ClickHouse with country/device/referrer. Dashboard queries are on a separate read-optimized store — never touches the redirect path.' },
      { label: 'Abuse prevention', text: 'Rate limit: 100 shortens/min per user (Redis INCR). URL scanning: background job checks new URLs against Google Safe Browsing API. Custom domains: validate domain ownership via DNS TXT record.' },
    ],
    tip: '"10× spike" is an invitation to talk about horizontal scaling + caching. The key insight: because app servers are stateless and Redis is the bottleneck, you can handle 10× by adding app server pods. CDN means most spikes never reach your origin.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Quick reference data
// ─────────────────────────────────────────────────────────────────────────────
const timePlan = [
  { phase: 'Requirements', time: '5 min', focus: 'Ask 3-4 clarifying questions. Define functional + non-functional. Call out scope explicitly.' },
  { phase: 'Estimation', time: '8 min', focus: 'Write QPS, Read QPS, Storage/year, Cache RAM. Round numbers. State assumptions aloud.' },
  { phase: 'High-Level Design', time: '15 min', focus: 'Draw write path + read path separately. Introduce CDN, Redis, Kafka from the start.' },
  { phase: 'Deep Dive', time: '10 min', focus: 'Base62 encoding, collision analysis, database schema, Redis key structure.' },
  { phase: 'Scale & Edge Cases', time: '7 min', focus: 'Spikes, expiry, analytics async, rate limiting, abuse.' },
];

const keyNumbers = [
  { label: '62⁷', value: '3.5 trillion URLs', note: '7-char Base62 code capacity' },
  { label: '100:1', value: 'Read/write ratio', note: 'Redirects far exceed shortening ops' },
  { label: '<5 ms', value: 'Redis redirect', note: 'Cache hit latency target' },
  { label: '<1 ms', value: 'CDN redirect', note: 'Edge cache hit — zero origin' },
  { label: '80%+', value: 'CDN hit rate', note: 'Popular URLs served at edge' },
  { label: '301 vs 302', value: '301 = cached', note: '302 forces origin on every request' },
];

const dos = [
  'Ask at least 3 clarifying questions before drawing anything',
  'Separate write path and read path explicitly in the diagram',
  'Justify every component — "I added Redis because reads are 100× writes"',
  'Mention CDN caching for the redirect (most candidates forget this)',
  'Explain WHY counter+Base62 beats MD5 hashing (collision-free)',
  'Say "I\'d keep app servers stateless so I can scale horizontally"',
];

const donts = [
  'Don\'t start coding immediately — requirements come first',
  'Don\'t say "hash the URL" without addressing collisions',
  'Don\'t put analytics write in the redirect hot path (blocks response)',
  'Don\'t confuse 301 (permanent, cached) and 302 (temporary, not cached)',
  'Don\'t forget expiry edge cases — return 410 Gone, not 404',
  'Don\'t ignore rate limiting — it\'s expected at senior level',
];

// ─────────────────────────────────────────────────────────────────────────────
// Code tabs
// ─────────────────────────────────────────────────────────────────────────────
const codeTabs = [
  { id: 'entity', label: 'Entity & DB', code: javaEntityCode },
  { id: 'encoder', label: 'Base62 Encoder', code: javaEncoderCode },
  { id: 'service', label: 'URL Service', code: javaServiceCode },
  { id: 'controller', label: 'REST Controller', code: javaControllerCode },
  { id: 'ratelimit', label: 'Rate Limiter', code: javaRateLimiterCode },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function UrlShortenerPage() {
  const [tab, setTab] = useState<'mock' | 'code' | 'ref'>('mock');
  const [activeQ, setActiveQ] = useState(1);
  const [soundOn, setSoundOn] = useState(false);
  const [codeTab, setCodeTab] = useState('entity');
  const { ping, chime } = useSounds(soundOn);

  function goTo(q: number) {
    setActiveQ(q);
    ping();
    if (q === QUESTIONS.length) chime();
  }

  const q = QUESTIONS[activeQ - 1];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-gray-800 bg-gray-950 overflow-hidden"
      >
        <div className="px-6 sm:px-8 py-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge label="🏢 FAANG / MAANG Level" color="bg-violet-500/10 border border-violet-500/30 text-violet-300" />
            <Badge label="⏱ 45 min mock interview" color="bg-yellow-500/10 border border-yellow-500/20 text-yellow-300" />
            <Badge label="5+ years exp" color="bg-blue-500/10 border border-blue-500/20 text-blue-300" />
            <button
              onClick={() => setSoundOn(o => !o)}
              className={`ml-auto px-3 py-1 rounded-full border text-xs font-medium transition-colors ${soundOn ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-gray-700 bg-gray-900 text-gray-400 hover:text-gray-200'}`}
            >
              {soundOn ? '🔊 Sound On' : '🔇 Sound Off'}
            </button>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
            Design a URL Shortener
            <span className="block text-2xl sm:text-3xl bg-gradient-to-r from-pink-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent mt-1">
              Full Mock Interview — bit.ly at FAANG Scale
            </span>
          </h1>
          <p className="text-gray-400 text-base leading-relaxed max-w-3xl mb-5">
            A complete end-to-end mock system design interview for a URL shortener — exactly as asked at Google, Meta, Amazon, and Flipkart.
            Follow the 5-question flow from requirements to scaling. Each question shows you what to think, what to say, and why it impresses the interviewer.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link to="/" className="px-4 py-2 rounded-xl border border-gray-700 text-sm text-gray-400 hover:text-gray-200 hover:border-gray-600 transition-colors">
              ← Home
            </Link>
            <button
              onClick={() => { setTab('mock'); setActiveQ(1); ping(); }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-violet-500 text-white text-sm font-semibold hover:from-pink-400 hover:to-violet-400 transition-all"
            >
              Start Mock Interview →
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-800 border-t border-gray-800">
          {[
            { label: 'Interview questions', value: '5' },
            { label: 'Java code files', value: '5' },
            { label: 'Visual demos', value: '4' },
            { label: 'Estimated prep time', value: '45 min' },
          ].map(s => (
            <div key={s.label} className="px-5 py-3 text-center">
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Interview stage timeline ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="rounded-2xl border border-gray-800 bg-gray-950/60 p-5"
      >
        <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-4">45-minute interview breakdown</p>
        <div className="flex flex-col sm:flex-row gap-2">
          {QUESTIONS.map((qt, i) => (
            <button
              key={qt.id}
              onClick={() => { setTab('mock'); goTo(qt.id); }}
              className={`flex-1 rounded-xl border px-3 py-2.5 text-left transition-all hover:brightness-110 ${
                activeQ === qt.id && tab === 'mock'
                  ? qt.badge
                  : 'border-gray-800 bg-gray-900/50 text-gray-400'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black text-white ${qt.dot}`}>
                  {i + 1}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wide">{qt.time}</span>
              </div>
              <p className="text-xs font-semibold leading-snug">{qt.stage}</p>
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Main tabs ─────────────────────────────────────────────────────── */}
      <div className="flex gap-1 border border-gray-800 rounded-xl p-1 bg-gray-900 overflow-x-auto">
        {([
          { id: 'mock', label: '🎯 Mock Interview' },
          { id: 'code', label: '💻 Java Code' },
          { id: 'ref', label: '📋 Quick Reference' },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); ping(); }}
            className={`flex-shrink-0 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-brand-500 text-white shadow' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >

          {/* ══════════════════════ MOCK INTERVIEW TAB ══════════════════════ */}
          {tab === 'mock' && (
            <div className="grid lg:grid-cols-[220px_1fr] gap-6">

              {/* Question navigator */}
              <div className="space-y-2">
                {QUESTIONS.map(qItem => (
                  <button
                    key={qItem.id}
                    onClick={() => goTo(qItem.id)}
                    className={`w-full flex items-start gap-3 rounded-xl border px-3 py-3 text-left transition-all ${
                      activeQ === qItem.id ? qItem.badge : 'border-gray-800 bg-gray-900/40 text-gray-500 hover:text-gray-300 hover:bg-gray-900/70'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black text-white ${qItem.dot} mt-0.5`}>
                      {qItem.id}
                    </span>
                    <div>
                      <p className="text-xs font-semibold leading-snug">{qItem.stage}</p>
                      <p className="text-[10px] opacity-60 mt-0.5">{qItem.time}</p>
                    </div>
                  </button>
                ))}

                {/* Progress note */}
                <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-3 mt-4">
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    Work through each question as if you're in a real interview. Reveal the answer only after you've thought about it yourself.
                  </p>
                </div>
              </div>

              {/* Question content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeQ}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-5"
                >
                  {/* Question header */}
                  <div className={`rounded-2xl border ${q.accent} bg-gray-950/80 p-5`}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-white ${q.dot}`}>
                        {q.id}
                      </span>
                      <div>
                        <p className="text-white font-bold">{q.stage}</p>
                        <p className="text-xs text-gray-500">Expected time: {q.time}</p>
                      </div>
                    </div>
                    <InterviewerBubble text={q.interviewer} />
                  </div>

                  {/* Thinking + Ideal Answer */}
                  <CandidateBubble steps={q.thinking} />
                  <IdealAnswer points={q.idealAnswer} />

                  {/* Per-question visual component */}
                  <div className="rounded-2xl border border-gray-800 bg-gray-950/60 p-5">
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-4">
                      {q.id === 1 ? '📋 Requirements Checklist' :
                       q.id === 2 ? '🔢 Interactive Capacity Calculator' :
                       q.id === 3 ? '🏗️ Animated System Architecture' :
                       q.id === 4 ? '⚙️ Base62 Step-by-Step Encoder' :
                       '📊 Cache Effectiveness Simulator'}
                    </p>
                    {q.id === 1 && (
                      <div className="space-y-3">
                        {[
                          { category: 'Scale', questions: ['How many URLs shortened per day?', 'How many redirects per day?', 'Expected DAU?'] },
                          { category: 'Features', questions: ['Custom aliases needed?', 'URL expiration?', 'Click analytics?', 'User accounts?'] },
                          { category: 'Non-functional', questions: ['Latency target for redirects?', 'Availability SLA (99.9% vs 99.99%)?', 'Data retention period?'] },
                        ].map(({ category, questions }) => (
                          <div key={category}>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{category}</p>
                            <div className="space-y-1.5">
                              {questions.map(q => (
                                <motion.div
                                  key={q}
                                  initial={{ opacity: 0, x: -8 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className="flex items-center gap-2.5 rounded-lg border border-gray-800 bg-gray-900/50 px-3 py-2"
                                >
                                  <span className="text-emerald-400 text-xs">✓</span>
                                  <span className="text-sm text-gray-300">{q}</span>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {q.id === 2 && <CapacityEstimator />}
                    {q.id === 3 && <ArchDiagram />}
                    {q.id === 4 && <Base62Stepper />}
                    {q.id === 5 && <CacheEffectivenessDemo />}
                  </div>

                  <InterviewTip text={q.tip} />

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => activeQ > 1 && goTo(activeQ - 1)}
                      disabled={activeQ === 1}
                      className="px-4 py-2 rounded-xl border border-gray-700 text-sm text-gray-400 hover:text-gray-200 hover:border-gray-600 transition-colors disabled:opacity-30"
                    >
                      ← Previous
                    </button>
                    <span className="text-xs text-gray-600">Question {activeQ} of {QUESTIONS.length}</span>
                    {activeQ < QUESTIONS.length ? (
                      <button
                        onClick={() => goTo(activeQ + 1)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-cyan-500 text-white text-sm font-semibold hover:from-brand-400 hover:to-cyan-400 transition-all"
                      >
                        Next Question →
                      </button>
                    ) : (
                      <button
                        onClick={() => { setTab('code'); chime(); }}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold hover:from-emerald-400 hover:to-teal-400 transition-all"
                      >
                        View Java Code →
                      </button>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* ══════════════════════ JAVA CODE TAB ══════════════════════════ */}
          {tab === 'code' && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-4 flex gap-2 flex-wrap">
                {codeTabs.map(ct => (
                  <button
                    key={ct.id}
                    onClick={() => setCodeTab(ct.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                      codeTab === ct.id
                        ? 'border-brand-400/50 bg-brand-500/15 text-brand-300'
                        : 'border-gray-700 bg-gray-900 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {ct.label}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={codeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  <CodeBlock code={codeTabs.find(c => c.id === codeTab)?.code ?? ''} />
                </motion.div>
              </AnimatePresence>

              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                <p className="text-sm font-semibold text-cyan-300 mb-2">💡 Implementation notes for the interview</p>
                <ul className="space-y-1.5 text-sm text-gray-300">
                  {[
                    'You don\'t need to write all this code in the interview — know the key classes and their responsibilities.',
                    'Interviewers ask you to code the Base62 encoder most often — practice that function.',
                    'Know the 2-save pattern (save to get ID → encode → save again) and be ready to explain it.',
                    'Mention @Async on the Kafka publish to show you\'re keeping the redirect path fast.',
                    'The rate limiter\'s Redis INCR + TTL pattern comes up in many FAANG interviews.',
                  ].map((pt, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-cyan-400 text-xs mt-1">→</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* ══════════════════════ QUICK REFERENCE TAB ════════════════════ */}
          {tab === 'ref' && (
            <div className="space-y-6">

              {/* Time plan */}
              <div className="rounded-2xl border border-gray-800 bg-gray-950/60 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-800">
                  <p className="text-sm font-bold text-white">⏱ 45-Minute Time Management Plan</p>
                </div>
                <div className="divide-y divide-gray-800">
                  {timePlan.map((row, i) => (
                    <div key={i} className="grid grid-cols-[100px_80px_1fr] gap-4 px-5 py-3.5 items-start">
                      <p className="text-sm font-semibold text-white">{row.phase}</p>
                      <p className="text-sm font-bold text-brand-300">{row.time}</p>
                      <p className="text-sm text-gray-400 leading-relaxed">{row.focus}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key numbers */}
              <div>
                <p className="text-sm font-bold text-white mb-3">🔢 Numbers Every Candidate Must Know</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {keyNumbers.map((n, i) => (
                    <div key={i} className="rounded-xl border border-gray-800 bg-gray-900/60 p-3.5">
                      <p className="text-lg font-black text-brand-300 font-mono">{n.label}</p>
                      <p className="text-sm font-semibold text-white mt-0.5">{n.value}</p>
                      <p className="text-xs text-gray-500 mt-1">{n.note}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dos and don'ts */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2.5">
                  <p className="text-sm font-bold text-emerald-300 mb-3">✅ Do These</p>
                  {dos.map((d, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="text-emerald-400 text-sm flex-shrink-0 mt-0.5">✓</span>
                      <p className="text-sm text-gray-300 leading-snug">{d}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 space-y-2.5">
                  <p className="text-sm font-bold text-red-300 mb-3">✗ Avoid These</p>
                  {donts.map((d, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="text-red-400 text-sm flex-shrink-0 mt-0.5">✗</span>
                      <p className="text-sm text-gray-300 leading-snug">{d}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Common design questions quick-fire */}
              <div className="rounded-2xl border border-gray-800 bg-gray-950/60 p-5 space-y-3">
                <p className="text-sm font-bold text-white mb-1">⚡ Quick-Fire — Answers to Follow-Up Questions</p>
                {[
                  { q: 'Why 301 and not 302?', a: '301 is permanent — browsers and CDNs cache it, reducing origin load by 80%+. Use 302 only for A/B testing or analytics that must go through origin every time.' },
                  { q: 'How do you prevent users from creating URLs for malicious sites?', a: 'Background job calls Google Safe Browsing API on new URLs. Flag or remove malicious entries. Rate limiting also reduces automated abuse.' },
                  { q: 'How do you handle custom aliases ("shr.ly/my-brand")?', a: 'Store user_alias column in DB with unique constraint. On create: if alias provided, use it as short_code directly; skip Base62 encoding. Validate alias format (3-20 alphanumeric chars).' },
                  { q: 'What if the DB goes down during a write?', a: '@Transactional rolls back both saves atomically. Client gets a 500 error and retries. No partial state left in DB. Redis is only warmed after successful DB commit.' },
                  { q: 'How do you scale to multiple data centers?', a: 'Use Snowflake IDs (includes datacenter bits) instead of DB auto-increment to avoid ID conflicts across regions. Read from nearest replica. Write to regional primary with async replication.' },
                ].map(({ q: fq, a }, i) => (
                  <div key={i} className="rounded-xl border border-gray-800 bg-gray-900/50 p-3.5">
                    <p className="text-sm font-semibold text-gray-200 mb-1.5">Q: {fq}</p>
                    <p className="text-sm text-gray-400 leading-relaxed">{a}</p>
                  </div>
                ))}
              </div>

            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
