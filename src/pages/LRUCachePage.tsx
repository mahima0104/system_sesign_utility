import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Web Speech voices ──────────────────────────────────────────────────────
function useInterviewVoices() {
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const interviewerRef = useRef<SpeechSynthesisVoice | null>(null);
  const candidateRef = useRef<SpeechSynthesisVoice | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [speaking, setSpeaking] = useState<'interviewer' | 'candidate' | null>(null);

  const loadVoices = useCallback(() => {
    const all = window.speechSynthesis.getVoices();
    if (!all.length) return;
    voicesRef.current = all;

    function pick(namePrefs: string[], langCodes: string[]) {
      for (const n of namePrefs) {
        const v = all.find(v => v.name.toLowerCase().includes(n.toLowerCase()));
        if (v) return v;
      }
      for (const lc of langCodes) {
        const v = all.find(v => v.lang === lc);
        if (v) return v;
      }
      return all.find(v => v.lang.startsWith('en')) ?? null;
    }

    interviewerRef.current = pick(
      ['Daniel', 'Google UK English Male', 'Microsoft David', 'Alex'],
      ['en-GB', 'en-US']
    );
    candidateRef.current = pick(
      ['Rishi', 'Neerja', 'Veena', 'Microsoft Heera', 'Microsoft Ravi', 'Lekha'],
      ['en-IN', 'en-GB']
    );
  }, []);

  useEffect(() => {
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, [loadVoices]);

  function makeUtterance(text: string, role: 'interviewer' | 'candidate') {
    const u = new SpeechSynthesisUtterance(text);
    if (role === 'interviewer') {
      u.voice = interviewerRef.current;
      u.pitch = 0.78; u.rate = 0.80; u.volume = 1.0;
    } else {
      u.voice = candidateRef.current;
      u.pitch = 1.05; u.rate = 0.80; u.volume = 0.88;
    }
    u.onstart = () => setSpeaking(role);
    u.onend = () => setSpeaking(null);
    u.onerror = () => setSpeaking(null);
    return u;
  }

  function speakAs(text: string, role: 'interviewer' | 'candidate') {
    if (!enabled) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(makeUtterance(text, role));
  }

  function stop() {
    window.speechSynthesis.cancel();
    setSpeaking(null);
  }

  function toggle() {
    if (enabled) { stop(); setEnabled(false); return; }
    setEnabled(true);
    setTimeout(() => {
      const u1 = makeUtterance("Welcome to your LRU Cache system design interview. I am your interviewer today.", 'interviewer');
      const u2 = makeUtterance("Thank you. I am excited and ready to begin.", 'candidate');
      u1.onend = () => { setSpeaking(null); setTimeout(() => window.speechSynthesis.speak(u2), 400); };
      window.speechSynthesis.speak(u1);
    }, 120);
  }

  return { enabled, speaking, speakAs, stop, toggle };
}

// ─── Shared UI atoms ─────────────────────────────────────────────────────────
function SpeakingWave() {
  return (
    <span className="inline-flex items-end gap-[3px] h-4">
      {[0.4, 0.7, 1, 0.7, 0.4].map((h, i) => (
        <motion.span key={i} className="w-[3px] rounded-full bg-current"
          animate={{ scaleY: [h, 1, h] }}
          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.1 }}
          style={{ height: '100%', transformOrigin: 'bottom' }} />
      ))}
    </span>
  );
}

function Badge({ children, color = 'gray' }: { children: React.ReactNode; color?: string }) {
  const map: Record<string, string> = {
    gray: 'bg-gray-800 text-gray-300 border-gray-700',
    blue: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    green: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    pink: 'bg-pink-500/10 text-pink-300 border-pink-500/30',
    yellow: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${map[color] ?? map.gray}`}>
      {children}
    </span>
  );
}

function CodeBlock({ code, language = 'java' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative rounded-xl overflow-hidden border border-gray-700">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-xs text-gray-400 font-mono">{language}</span>
        <button onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
          className="text-xs text-gray-500 hover:text-gray-200 transition-colors">
          {copied ? '✓ copied' : 'copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm text-gray-200 bg-gray-900 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function InterviewTip({ text }: { text: string }) {
  return (
    <div className="flex gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
      <span className="text-yellow-400 text-base mt-0.5">💡</span>
      <p className="text-sm text-yellow-200 leading-relaxed">{text}</p>
    </div>
  );
}

function InterviewerBubble({ text, isSpeaking, onSpeak, onStop, voiceEnabled }: {
  text: string; isSpeaking: boolean;
  onSpeak: () => void; onStop: () => void; voiceEnabled: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/30">
        I
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-semibold text-blue-300">Interviewer</span>
          {isSpeaking && <span className="text-blue-400"><SpeakingWave /></span>}
        </div>
        <div className="rounded-2xl rounded-tl-sm bg-blue-500/10 border border-blue-500/20 px-4 py-3">
          <p className="text-sm text-gray-200 leading-relaxed">{text}</p>
        </div>
        {voiceEnabled && (
          <div className="mt-2 flex gap-2">
            <button onClick={isSpeaking ? onStop : onSpeak}
              className="text-xs text-blue-400 hover:text-blue-200 transition-colors flex items-center gap-1.5 border border-blue-500/30 rounded-full px-3 py-1">
              {isSpeaking ? '⏹ Stop' : '▶ Listen'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CandidateBubble({ steps, isSpeaking, voiceEnabled }: {
  steps: string[]; isSpeaking: boolean; voiceEnabled: boolean;
}) {
  const [revealed, setRevealed] = useState(0);
  useEffect(() => { setRevealed(0); }, [steps]);
  function next() { setRevealed(r => Math.min(r + 1, steps.length)); }

  return (
    <div className="flex gap-3 flex-row-reverse">
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-emerald-500/30">
        C
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1.5 justify-end">
          {isSpeaking && voiceEnabled && <span className="text-emerald-400"><SpeakingWave /></span>}
          <span className="text-xs font-semibold text-emerald-300">You (Candidate)</span>
        </div>
        <div className="space-y-2">
          <AnimatePresence>
            {steps.slice(0, revealed).map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="rounded-2xl rounded-tr-sm bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
                <p className="text-sm text-gray-200 leading-relaxed">{step}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        {revealed < steps.length ? (
          <button onClick={next}
            className="mt-3 text-xs font-medium text-emerald-300 hover:text-emerald-100 border border-emerald-500/30 rounded-full px-4 py-1.5 transition-colors">
            {revealed === 0 ? '💬 Start thinking aloud…' : '→ Continue…'}
          </button>
        ) : (
          <p className="mt-2 text-xs text-gray-500 italic">All thinking steps revealed</p>
        )}
      </div>
    </div>
  );
}

function IdealAnswer({ text, voiceEnabled, onSpeak, onStop, isSpeaking }: {
  text: string; voiceEnabled: boolean;
  onSpeak: () => void; onStop: () => void; isSpeaking: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-pink-500/20 bg-pink-500/5 overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left">
        <span className="text-sm font-semibold text-pink-300">📋 Ideal Answer Summary</span>
        <span className="text-pink-400 text-xs">{open ? '▲ collapse' : '▼ reveal'}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-2">
              <p className="text-sm text-gray-300 leading-relaxed">{text}</p>
              {voiceEnabled && (
                <button onClick={isSpeaking ? onStop : onSpeak}
                  className="text-xs text-pink-400 hover:text-pink-200 border border-pink-500/30 rounded-full px-3 py-1 flex items-center gap-1.5 transition-colors">
                  {isSpeaking ? '⏹ Stop' : '▶ Hear Answer'}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── LRU Visualizer ──────────────────────────────────────────────────────────
interface CacheNode { key: number; value: string; }

const PRESETS = [
  { label: 'Add pages 1–3', ops: [{ op: 'put', key: 1, value: 'Home' }, { op: 'put', key: 2, value: 'Products' }, { op: 'put', key: 3, value: 'Cart' }] },
  { label: 'Access key 1', ops: [{ op: 'get', key: 1 }] },
  { label: 'Add key 4 (evict LRU)', ops: [{ op: 'put', key: 4, value: 'Checkout' }] },
];

function LRUVisualizer() {
  const CAPACITY = 3;
  const [nodes, setNodes] = useState<CacheNode[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [highlighted, setHighlighted] = useState<number | null>(null);
  const [evicted, setEvicted] = useState<number | null>(null);
  const [getKey, setGetKey] = useState('');
  const [putKey, setPutKey] = useState('');
  const [putVal, setPutVal] = useState('');

  function addLog(msg: string) { setLog(l => [msg, ...l].slice(0, 8)); }

  function doGet(key: number) {
    setHighlighted(key);
    const idx = nodes.findIndex(n => n.key === key);
    if (idx === -1) { addLog(`GET ${key} → MISS (not in cache)`); setTimeout(() => setHighlighted(null), 1200); return; }
    const node = nodes[idx];
    addLog(`GET ${key} → HIT "${node.value}" (moved to MRU)`);
    setNodes(prev => [node, ...prev.filter(n => n.key !== key)]);
    setTimeout(() => setHighlighted(null), 1200);
  }

  function doPut(key: number, value: string) {
    setNodes(prev => {
      const exists = prev.findIndex(n => n.key === key) !== -1;
      const filtered = prev.filter(n => n.key !== key);
      if (!exists && filtered.length >= CAPACITY) {
        const lru = filtered[filtered.length - 1];
        setEvicted(lru.key);
        addLog(`PUT ${key}="${value}" → evicted LRU key=${lru.key}`);
        setTimeout(() => setEvicted(null), 1200);
        return [{ key, value }, ...filtered.slice(0, CAPACITY - 1)];
      }
      addLog(exists ? `PUT ${key}="${value}" → updated (moved to MRU)` : `PUT ${key}="${value}" → inserted`);
      return [{ key, value }, ...filtered];
    });
    setHighlighted(key);
    setTimeout(() => setHighlighted(null), 1200);
  }

  function runPreset(ops: { op: string; key: number; value?: string }[]) {
    ops.forEach((op, i) => setTimeout(() => {
      if (op.op === 'get') doGet(op.key);
      else doPut(op.key, op.value ?? '');
    }, i * 600));
  }

  return (
    <div className="space-y-5">
      {/* DLL visualization */}
      <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
        <p className="text-xs font-semibold text-gray-400 mb-4">Doubly Linked List (HEAD = MRU, TAIL = LRU) — capacity: {CAPACITY}</p>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {/* HEAD sentinel */}
          <div className="flex-shrink-0 flex flex-col items-center gap-1">
            <div className="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-center min-w-[64px]">
              <p className="text-[10px] text-gray-500">sentinel</p>
              <p className="text-xs font-bold text-gray-400">HEAD</p>
            </div>
          </div>

          {nodes.length === 0 && (
            <p className="text-xs text-gray-600 mx-4">— empty —</p>
          )}

          <AnimatePresence mode="popLayout">
            {nodes.map((node, idx) => (
              <motion.div key={node.key} layout
                initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
                className="flex-shrink-0 flex items-center gap-1">
                <span className="text-gray-600 text-sm">↔</span>
                <motion.div
                  animate={highlighted === node.key ? { borderColor: '#34d399', backgroundColor: 'rgba(52,211,153,0.12)' } :
                    evicted === node.key ? { borderColor: '#f87171', backgroundColor: 'rgba(248,113,113,0.12)' } :
                    { borderColor: idx === 0 ? '#818cf8' : '#374151' }}
                  className="rounded-xl border-2 px-3 py-2.5 text-center min-w-[72px] transition-all">
                  <p className="text-[10px] text-gray-500">{idx === 0 ? 'MRU' : idx === nodes.length - 1 ? 'LRU' : `pos ${idx + 1}`}</p>
                  <p className="text-sm font-bold text-white">key={node.key}</p>
                  <p className="text-[11px] text-gray-400">"{node.value}"</p>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* TAIL sentinel */}
          <span className="text-gray-600 text-sm flex-shrink-0">{nodes.length > 0 ? '↔' : ''}</span>
          <div className="flex-shrink-0 flex flex-col items-center gap-1">
            <div className="rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-center min-w-[64px]">
              <p className="text-[10px] text-gray-500">sentinel</p>
              <p className="text-xs font-bold text-gray-400">TAIL</p>
            </div>
          </div>
        </div>

        {/* HashMap */}
        <div className="mt-4 pt-4 border-t border-gray-800">
          <p className="text-xs font-semibold text-gray-500 mb-2">HashMap (key → node pointer)</p>
          <div className="flex flex-wrap gap-2">
            {nodes.length === 0 && <span className="text-xs text-gray-600">{ }{}</span>}
            {nodes.map(n => (
              <span key={n.key}
                className="text-xs font-mono bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-300">
                {n.key} → Node("{n.value}")
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-700 bg-gray-900/60 p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-400">GET operation</p>
          <div className="flex gap-2">
            <input value={getKey} onChange={e => setGetKey(e.target.value)} placeholder="key (number)"
              className="flex-1 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500" />
            <button onClick={() => { doGet(Number(getKey)); setGetKey(''); }}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors">
              GET
            </button>
          </div>
        </div>
        <div className="rounded-xl border border-gray-700 bg-gray-900/60 p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-400">PUT operation</p>
          <div className="flex gap-2">
            <input value={putKey} onChange={e => setPutKey(e.target.value)} placeholder="key"
              className="w-16 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500" />
            <input value={putVal} onChange={e => setPutVal(e.target.value)} placeholder="value"
              className="flex-1 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500" />
            <button onClick={() => { doPut(Number(putKey), putVal); setPutKey(''); setPutVal(''); }}
              className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 transition-colors">
              PUT
            </button>
          </div>
        </div>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(p => (
          <button key={p.label} onClick={() => runPreset(p.ops)}
            className="text-xs border border-gray-700 bg-gray-800 text-gray-300 rounded-full px-3 py-1.5 hover:border-gray-500 hover:text-white transition-colors">
            {p.label}
          </button>
        ))}
        <button onClick={() => { setNodes([]); setLog([]); }}
          className="text-xs border border-red-500/30 bg-red-500/5 text-red-400 rounded-full px-3 py-1.5 hover:border-red-400 transition-colors">
          Reset
        </button>
      </div>

      {/* Log */}
      {log.length > 0 && (
        <div className="rounded-xl border border-gray-700 bg-gray-900/60 p-4">
          <p className="text-xs font-semibold text-gray-500 mb-2">Operation log</p>
          <div className="space-y-1">
            {log.map((l, i) => (
              <p key={i} className={`text-xs font-mono ${i === 0 ? 'text-emerald-300' : 'text-gray-500'}`}>{l}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Complexity table ─────────────────────────────────────────────────────────
function ComplexityTable() {
  const rows = [
    { struct: 'Array / LinkedList only', get: 'O(n)', put: 'O(n)', why: 'Must scan linearly to find a key' },
    { struct: 'HashMap only', get: 'O(1)', put: 'O(1)', why: 'No ordering — cannot track LRU position' },
    { struct: 'Doubly Linked List only', get: 'O(n)', put: 'O(1) tail evict', why: 'No O(1) key lookup' },
    { struct: 'HashMap + DLL ✓', get: 'O(1)', put: 'O(1)', why: 'Map gives O(1) lookup; DLL gives O(1) move-to-front & evict' },
  ];
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700 bg-gray-800/60">
            <th className="text-left px-4 py-3 text-gray-400 font-semibold">Data Structure</th>
            <th className="text-center px-4 py-3 text-gray-400 font-semibold">GET</th>
            <th className="text-center px-4 py-3 text-gray-400 font-semibold">PUT</th>
            <th className="text-left px-4 py-3 text-gray-400 font-semibold">Why</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={`border-b border-gray-800 ${i === rows.length - 1 ? 'bg-emerald-500/5' : ''}`}>
              <td className={`px-4 py-3 font-medium ${i === rows.length - 1 ? 'text-emerald-300' : 'text-gray-300'}`}>{r.struct}</td>
              <td className={`px-4 py-3 text-center font-mono font-bold ${r.get === 'O(1)' ? 'text-emerald-400' : 'text-red-400'}`}>{r.get}</td>
              <td className={`px-4 py-3 text-center font-mono font-bold ${r.put.startsWith('O(1)') ? 'text-emerald-400' : 'text-red-400'}`}>{r.put}</td>
              <td className="px-4 py-3 text-gray-400 text-xs">{r.why}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Thread-safety demo ───────────────────────────────────────────────────────
function ThreadSafetyDemo() {
  const scenarios = [
    { title: 'Unsynchronized reads', risk: 'high', desc: 'Two threads call get() simultaneously — one may read a half-updated node pointer after the other thread moved it.' },
    { title: 'Unsynchronized writes', risk: 'high', desc: 'Two threads call put() and both think their key is the LRU — node removal races, leading to memory corruption or NPE.' },
    { title: 'synchronized method', risk: 'medium', desc: 'All operations serialized — safe, but only one thread runs at a time. Read-heavy workloads suffer from lock contention.' },
    { title: 'ReentrantReadWriteLock', risk: 'low', desc: 'Multiple concurrent readers (readLock). Single writer (writeLock). Dramatically better throughput for read-heavy caches.' },
    { title: 'ConcurrentHashMap + ConcurrentLinkedDeque', risk: 'low', desc: 'Lock-free reads on map side, but approximate LRU ordering. Used in Caffeine / Guava — best-effort eviction, not strict LRU.' },
  ];
  const color = { high: 'text-red-400 border-red-500/30 bg-red-500/5', medium: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5', low: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5' };
  return (
    <div className="space-y-3">
      {scenarios.map((s, i) => (
        <div key={i} className={`rounded-xl border px-4 py-3 ${color[s.risk as keyof typeof color]}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold">{s.title}</span>
            <Badge color={s.risk === 'high' ? 'pink' : s.risk === 'medium' ? 'yellow' : 'green'}>
              {s.risk} risk
            </Badge>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">{s.desc}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Use-case grid ────────────────────────────────────────────────────────────
function UseCaseGrid() {
  const cases = [
    { icon: '🌐', title: 'Browser Cache', desc: 'Tabs, back-navigation, DNS lookups' },
    { icon: '🖥️', title: 'OS Page Cache', desc: 'Keeps hot memory pages in RAM' },
    { icon: '📦', title: 'CDN Edge', desc: 'Serves assets from nearest PoP' },
    { icon: '🗄️', title: 'DB Query Cache', desc: 'MySQL query cache, Redis hot keys' },
    { icon: '📱', title: 'Mobile Apps', desc: 'Image thumbnail cache, API response cache' },
    { icon: '🎬', title: 'Video Streaming', desc: 'Netflix segment cache per user session' },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {cases.map(c => (
        <div key={c.title} className="rounded-xl border border-gray-700 bg-gray-900/60 p-3">
          <span className="text-xl">{c.icon}</span>
          <p className="text-sm font-semibold text-white mt-1.5">{c.title}</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-snug">{c.desc}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Java code constants ──────────────────────────────────────────────────────
const javaSimple = `// Simplest production-ready LRU using LinkedHashMap
public class LRUCache<K, V> extends LinkedHashMap<K, V> {
    private final int capacity;

    public LRUCache(int capacity) {
        super(capacity, 0.75f, true); // accessOrder = true
        this.capacity = capacity;
    }

    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > capacity;
    }

    // Usage
    public static void main(String[] args) {
        LRUCache<Integer, String> cache = new LRUCache<>(3);
        cache.put(1, "Home");
        cache.put(2, "Products");
        cache.put(3, "Cart");
        cache.get(1);           // 1 is now MRU
        cache.put(4, "Order"); // evicts 2 (LRU)
    }
}`;

const javaCustom = `// Custom HashMap + Doubly Linked List — O(1) get and put
public class LRUCache {
    private final int capacity;
    private final Map<Integer, Node> map = new HashMap<>();
    private final Node head = new Node(0, 0); // sentinel
    private final Node tail = new Node(0, 0); // sentinel

    public LRUCache(int capacity) {
        this.capacity = capacity;
        head.next = tail;
        tail.prev = head;
    }

    public int get(int key) {
        if (!map.containsKey(key)) return -1;
        Node node = map.get(key);
        moveToFront(node);
        return node.value;
    }

    public void put(int key, int value) {
        if (map.containsKey(key)) {
            Node node = map.get(key);
            node.value = value;
            moveToFront(node);
        } else {
            if (map.size() == capacity) evictLRU();
            Node node = new Node(key, value);
            map.put(key, node);
            addToFront(node);
        }
    }

    private void moveToFront(Node node) {
        removeNode(node);
        addToFront(node);
    }

    private void addToFront(Node node) {
        node.next = head.next;
        node.prev = head;
        head.next.prev = node;
        head.next = node;
    }

    private void removeNode(Node node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }

    private void evictLRU() {
        Node lru = tail.prev; // node just before TAIL sentinel
        removeNode(lru);
        map.remove(lru.key);
    }

    private static class Node {
        int key, value;
        Node prev, next;
        Node(int k, int v) { key = k; value = v; }
    }
}`;

const javaThreadSafe = `// Thread-safe LRU with ReentrantReadWriteLock
public class ThreadSafeLRUCache {
    private final int capacity;
    private final Map<Integer, Node> map = new HashMap<>();
    private final Node head = new Node(0, 0);
    private final Node tail = new Node(0, 0);
    private final ReadWriteLock lock = new ReentrantReadWriteLock();
    private final Lock readLock  = lock.readLock();
    private final Lock writeLock = lock.writeLock();

    public ThreadSafeLRUCache(int capacity) {
        this.capacity = capacity;
        head.next = tail; tail.prev = head;
    }

    public int get(int key) {
        writeLock.lock(); // write because we move node to front
        try {
            if (!map.containsKey(key)) return -1;
            Node node = map.get(key);
            moveToFront(node);
            return node.value;
        } finally { writeLock.unlock(); }
    }

    public void put(int key, int value) {
        writeLock.lock();
        try {
            if (map.containsKey(key)) {
                Node node = map.get(key);
                node.value = value;
                moveToFront(node);
            } else {
                if (map.size() == capacity) evictLRU();
                Node node = new Node(key, value);
                map.put(key, node);
                addToFront(node);
            }
        } finally { writeLock.unlock(); }
    }

    // moveToFront, addToFront, removeNode, evictLRU — same as custom impl
    // ...

    private static class Node {
        int key, value; Node prev, next;
        Node(int k, int v) { key = k; value = v; }
    }
}`;

const javaDistributed = `// Distributed LRU via Redis — 10M user scale
@Service
public class DistributedLRUCache {
    private final StringRedisTemplate redis;
    private static final long CAPACITY = 100_000;
    private static final String HASH_KEY = "lru:cache";
    private static final String ZSET_KEY = "lru:score";

    public DistributedLRUCache(StringRedisTemplate redis) {
        this.redis = redis;
    }

    // O(log N) — Redis ZSET provides ordered LRU eviction
    public String get(String key) {
        String value = redis.opsForHash().get(HASH_KEY, key).toString();
        if (value != null) {
            // Update recency score to current timestamp
            redis.opsForZSet().add(ZSET_KEY, key, System.currentTimeMillis());
        }
        return value;
    }

    public void put(String key, String value) {
        long currentSize = redis.opsForHash().size(HASH_KEY);
        if (currentSize >= CAPACITY) evictLRU();

        redis.opsForHash().put(HASH_KEY, key, value);
        redis.opsForZSet().add(ZSET_KEY, key, System.currentTimeMillis());
    }

    private void evictLRU() {
        // ZRANGEBYSCORE gets the least-recently-used key
        Set<String> lruKeys = redis.opsForZSet().range(ZSET_KEY, 0, 0);
        if (lruKeys != null && !lruKeys.isEmpty()) {
            String lruKey = lruKeys.iterator().next();
            redis.opsForHash().delete(HASH_KEY, lruKey);
            redis.opsForZSet().remove(ZSET_KEY, lruKey);
        }
    }
}

// Redis config for automatic LRU eviction (simpler alternative):
// maxmemory 4gb
// maxmemory-policy allkeys-lru   ← evicts LRU key globally when full
// maxmemory-samples 10           ← number of random keys to sample (higher = more accurate)`;

const javaMonitored = `// Production LRU with hit/miss/eviction metrics
@Component
public class MonitoredLRUCache {
    private final LRUCache cache;
    private final AtomicLong hits = new AtomicLong();
    private final AtomicLong misses = new AtomicLong();
    private final AtomicLong evictions = new AtomicLong();
    private final MeterRegistry registry;

    public MonitoredLRUCache(int capacity, MeterRegistry registry) {
        this.cache = new LRUCache(capacity);
        this.registry = registry;
        registerMetrics();
    }

    public int get(int key) {
        int result = cache.get(key);
        if (result == -1) misses.incrementAndGet();
        else hits.incrementAndGet();
        return result;
    }

    public void put(int key, int value) {
        if (cache.size() == cache.capacity()) evictions.incrementAndGet();
        cache.put(key, value);
    }

    private void registerMetrics() {
        Gauge.builder("lru.hit_rate", this, m -> {
            long total = m.hits.get() + m.misses.get();
            return total == 0 ? 0 : (double) m.hits.get() / total;
        }).register(registry);

        Gauge.builder("lru.evictions_total", evictions, AtomicLong::get)
             .register(registry);

        Gauge.builder("lru.cache_size", cache, LRUCache::size)
             .register(registry);
    }

    public CacheStats stats() {
        long h = hits.get(), m = misses.get();
        double hitRate = (h + m) == 0 ? 0 : (double) h / (h + m);
        return new CacheStats(h, m, evictions.get(), hitRate);
    }

    public record CacheStats(long hits, long misses, long evictions, double hitRate) {}
}`;

// ─── Interview questions ──────────────────────────────────────────────────────
const QUESTIONS = [
  {
    id: 1,
    time: '5 min',
    tag: 'Concept',
    color: 'blue',
    interviewer: "Let's start simple. What is an LRU cache? Can you explain it in plain English and give me two or three real-world systems where you'd use it?",
    thinking: [
      "Okay. LRU stands for Least Recently Used — it's an eviction policy that removes the item that was accessed the longest time ago when the cache is full.",
      "Think of it like your phone's recent apps: when you open too many, the least used one gets killed. The most recently used ones stay alive.",
      "Real systems: browser history cache, Redis with allkeys-lru policy, OS page cache, CDN edge nodes, CPU L1/L2 cache.",
      "Key insight: LRU is great for temporal locality — if you accessed something recently, you're likely to access it again soon.",
    ],
    idealAnswer: "LRU cache evicts the least recently accessed entry when capacity is reached. It exploits temporal locality — recently accessed data is likely needed again. Real uses: browser DNS cache, Redis hot-key cache (allkeys-lru), OS page replacement, and CDN edge routing. The default Java implementation using LinkedHashMap(capacity, 0.75, true) with removeEldestEntry takes about 8 lines.",
    tip: "Start with the analogy — interviewers love when you humanize the concept before going technical.",
    visual: 'usecases',
  },
  {
    id: 2,
    time: '10 min',
    tag: 'Design',
    color: 'violet',
    interviewer: "Great. Now, how would you design a data structure that gives you O(1) time complexity for both get and put? Walk me through the trade-offs of different approaches before landing on your answer.",
    thinking: [
      "First pass: array. If I store items in an array by recency, put is O(1) but get is O(n) linear scan. Not good.",
      "Second pass: HashMap only. O(1) lookup, but HashMap has no inherent ordering — I can't tell which key was accessed last.",
      "Third pass: Doubly Linked List. I can move a node to front in O(1) if I have a pointer to it, and evict tail in O(1). But lookup is O(n) without a map.",
      "Insight: combine both. HashMap stores key → node reference. DLL maintains access order. get() = map lookup O(1) + DLL move-to-front O(1). put() = map insert O(1) + DLL insert-at-front O(1). Eviction = remove DLL tail O(1) + map delete O(1). All O(1).",
      "Sentinel nodes: use dummy HEAD and TAIL nodes so we never have null checks at the boundaries. Makes the code cleaner.",
    ],
    idealAnswer: "HashMap alone lacks order; DLL alone lacks O(1) lookup. Combining them gives O(1) for all operations. HashMap stores key→Node pointers. Doubly Linked List (not singly — we need prev pointer for O(1) removal) tracks recency from HEAD (MRU) to TAIL (LRU). Sentinel HEAD and TAIL nodes eliminate boundary null checks. This is exactly how Java's LinkedHashMap works internally.",
    tip: "Interviewers want to see you reason through wrong approaches before the right one — don't jump straight to the answer.",
    visual: 'complexity',
  },
  {
    id: 3,
    time: '15 min',
    tag: 'Code',
    color: 'emerald',
    interviewer: "Good design. Now code it. I want a clean Java implementation of get() and put(). Take your time, think out loud, and use the visualizer to verify your logic.",
    thinking: [
      "I'll define a private Node class with key, value, prev, next fields.",
      "Constructor: initialize capacity, create sentinel HEAD and TAIL, link them: head.next = tail, tail.prev = head.",
      "get(key): if key not in map return -1. Otherwise get the node, call moveToFront(node), return node.value.",
      "put(key, value): if key exists, update value and moveToFront. If new and at capacity, call evictLRU first. Then create node, put in map, addToFront.",
      "addToFront: new node goes between HEAD and HEAD.next. Four pointer updates.",
      "removeNode: node.prev.next = node.next; node.next.prev = node.prev. Two pointer updates.",
      "evictLRU: lru = tail.prev (node just before TAIL sentinel). removeNode(lru). map.remove(lru.key).",
    ],
    idealAnswer: "The Node class holds key (needed for eviction to know what to remove from map), value, prev, next. Sentinel HEAD and TAIL mean addToFront and removeNode never touch null. get() does map lookup + moveToFront = O(1). put() handles two cases: existing key (update + promote) and new key (evict if full, then insert). All pointer manipulations are O(1). Common bugs: forgetting to store key in Node (then evictLRU can't remove from map), and using singly linked list (can't remove in O(1)).",
    tip: "Talk through pointer updates verbally. Most candidates lose points here from silent coding — interviewers want to follow your thinking.",
    visual: 'visualizer',
  },
  {
    id: 4,
    time: '10 min',
    tag: 'Concurrency',
    color: 'yellow',
    interviewer: "Your implementation works for single-threaded use. What happens if multiple threads call get() and put() concurrently? How would you make it production-safe?",
    thinking: [
      "Problem 1: Two threads call put() simultaneously. Both see size < capacity. Both insert. Now size > capacity without eviction. Race condition.",
      "Problem 2: Thread A is inside moveToFront — it removed the node from DLL but hasn't re-inserted it yet. Thread B calls get() on the same key — it finds a dangling node with broken pointers. NPE.",
      "Simplest fix: add synchronized to get() and put(). Safe but serialized — kills throughput on read-heavy caches.",
      "Better: ReentrantReadWriteLock. readLock for get() if we don't update order (approximate LRU), writeLock for put(). But if get() must update recency, we need writeLock for it too.",
      "Best for high throughput: Caffeine library uses a lock-free ring buffer to batch position updates, giving near-zero coordination overhead. Used in Spring's default cache, Hibernate L2 cache.",
    ],
    idealAnswer: "Naive HashMap+DLL has multiple race conditions: concurrent inserts exceeding capacity, torn reads on pointer updates. synchronized method is simple but creates a serialization bottleneck. ReentrantReadWriteLock allows concurrent reads (if you relax strict LRU ordering) but single writer for puts and evictions. For production at scale, use Caffeine (W-TinyLFU algorithm, lock-free reads, batch writes via striped ring buffer) — it's the default in Spring Boot 3 and achieves ~10x throughput vs synchronized.",
    tip: "Mentioning Caffeine shows you know production caching libraries — interviewers at FAANG expect this.",
    visual: 'threadsafety',
  },
  {
    id: 5,
    time: '5 min',
    tag: 'Scale',
    color: 'pink',
    interviewer: "Final question. How would you scale this to 10 million users? What changes when the cache no longer fits on a single machine?",
    thinking: [
      "Single machine: a 10M user LRU with 100 bytes per entry = 1GB RAM — might still fit. But then it's a single point of failure.",
      "Distributed option 1: Redis with maxmemory-policy allkeys-lru. Redis handles eviction automatically. Clients use consistent hashing to shard across Redis nodes.",
      "Distributed option 2: Use a ZSET to track recency scores (timestamp). ZADD on access, ZRANGE to get LRU key for manual eviction. More control, but O(log N) per operation instead of O(1).",
      "Read-through vs cache-aside: read-through has the cache itself load from DB on miss (simpler client). Cache-aside has the app load from DB and populate cache (more control).",
      "Cache warming: on startup, preload hot keys from DB analytics. Prevents thundering herd on cold start.",
      "What LRU loses at scale: strict global ordering is impossible across nodes. Each shard has its own LRU. That's usually fine — local LRU per shard is good enough.",
    ],
    idealAnswer: "At 10M users, partition the cache across N Redis nodes using consistent hashing (so adding a node doesn't invalidate the entire cache). Configure maxmemory-policy allkeys-lru on each Redis node for automatic eviction. Use read-through caching so the cache itself handles DB fallback — reduces thundering herd. Add a TTL (e.g. 1 hour) as a safety net even with LRU. Monitor hit rate per shard — if one shard shows low hit rate, rebalance. Accept that global LRU ordering is approximated — local LRU per shard is sufficient in practice.",
    tip: "Consistent hashing, TTL as defense-in-depth, and hit rate monitoring are the three things FAANG interviewers listen for in this question.",
    visual: 'code',
  },
];

// ─── Main page ────────────────────────────────────────────────────────────────
const CODE_TABS = [
  { id: 'simple', label: 'LinkedHashMap', code: javaSimple },
  { id: 'custom', label: 'Custom DLL', code: javaCustom },
  { id: 'thread', label: 'Thread-Safe', code: javaThreadSafe },
  { id: 'distributed', label: 'Distributed', code: javaDistributed },
  { id: 'monitored', label: 'Monitored', code: javaMonitored },
];

export default function LRUCachePage() {
  const [activeQ, setActiveQ] = useState(1);
  const [tab, setTab] = useState<'interview' | 'code'>('interview');
  const [codeTab, setCodeTab] = useState('simple');
  const voice = useInterviewVoices();
  const [speakingTarget, setSpeakingTarget] = useState<string | null>(null);

  const q = QUESTIONS[activeQ - 1];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (voice.enabled && tab === 'interview') {
      voice.stop();
      setSpeakingTarget(null);
      setTimeout(() => {
        setSpeakingTarget(`q${activeQ}-interviewer`);
        voice.speakAs(q.interviewer, 'interviewer');
      }, 300);
    }
  }, [activeQ, tab]);

  function handleSpeak(target: string, text: string, role: 'interviewer' | 'candidate') {
    if (speakingTarget === target) { voice.stop(); setSpeakingTarget(null); return; }
    setSpeakingTarget(target);
    voice.speakAs(text, role);
    const check = setInterval(() => {
      if (!window.speechSynthesis.speaking) { setSpeakingTarget(null); clearInterval(check); }
    }, 300);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge color="pink">Mock Interview</Badge>
              <Badge color="yellow">45 min</Badge>
              <Badge color="blue">Senior SDE / FAANG</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
              Design an LRU Cache
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xl">
              O(1) get and put, thread safety, distributed scale. 5 progressive questions from concept to 10M-user production.
            </p>
          </div>
          <button
            onClick={voice.toggle}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
              voice.enabled
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15'
                : 'border-gray-700 bg-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            {voice.enabled ? (voice.speaking ? <SpeakingWave /> : '🔊') : '🔇'}
            <span>{voice.enabled ? 'Voice On' : 'Voice Off'}</span>
          </button>
        </div>
      </div>

      {/* Stage timeline */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {QUESTIONS.map((qt) => (
          <button
            key={qt.id}
            onClick={() => { setActiveQ(qt.id); setTab('interview'); }}
            className={`flex-shrink-0 rounded-xl border px-4 py-2.5 text-left transition-all ${
              activeQ === qt.id
                ? 'border-brand-500/50 bg-brand-500/10 text-white'
                : 'border-gray-700 bg-gray-900/60 text-gray-400 hover:border-gray-600 hover:text-gray-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-bold opacity-60">Q{qt.id}</span>
              <Badge color={qt.color as 'blue' | 'green' | 'pink' | 'yellow'}>{qt.tag}</Badge>
            </div>
            <p className="text-xs font-medium leading-snug max-w-[120px] truncate">{qt.time}</p>
          </button>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex overflow-x-auto rounded-xl border border-gray-700 bg-gray-900/60 p-1 gap-1">
        {(['interview', 'code'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`flex-shrink-0 rounded-lg px-5 py-2 text-sm font-medium transition-colors capitalize ${
            tab === t ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'
          }`}>{t === 'interview' ? '🎙 Interview' : '☕ Java Code'}</button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'interview' ? (
          <motion.div key={`interview-${activeQ}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
            {/* Interviewer */}
            <InterviewerBubble
              text={q.interviewer}
              isSpeaking={speakingTarget === `q${activeQ}-interviewer` && !!voice.speaking}
              onSpeak={() => handleSpeak(`q${activeQ}-interviewer`, q.interviewer, 'interviewer')}
              onStop={() => { voice.stop(); setSpeakingTarget(null); }}
              voiceEnabled={voice.enabled}
            />

            {/* Candidate thinking */}
            <CandidateBubble
              steps={q.thinking}
              isSpeaking={speakingTarget?.startsWith(`q${activeQ}-step`) && !!voice.speaking}
              voiceEnabled={voice.enabled}
            />

            {/* Visual aid */}
            {q.visual === 'usecases' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-gray-700 bg-gray-900/60 p-5 space-y-3">
                <p className="text-xs font-semibold text-gray-400">Where LRU is used in production</p>
                <UseCaseGrid />
              </motion.div>
            )}
            {q.visual === 'complexity' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-gray-700 bg-gray-900/60 p-5 space-y-3">
                <p className="text-xs font-semibold text-gray-400">Why HashMap + DLL = O(1) for both operations</p>
                <ComplexityTable />
              </motion.div>
            )}
            {q.visual === 'visualizer' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-gray-700 bg-gray-900/60 p-5 space-y-4">
                <p className="text-xs font-semibold text-gray-400">Interactive LRU visualizer — try GET and PUT below</p>
                <LRUVisualizer />
              </motion.div>
            )}
            {q.visual === 'threadsafety' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-gray-700 bg-gray-900/60 p-5 space-y-3">
                <p className="text-xs font-semibold text-gray-400">Thread-safety approaches — risks and trade-offs</p>
                <ThreadSafetyDemo />
              </motion.div>
            )}
            {q.visual === 'code' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-gray-700 bg-gray-900/60 p-5 space-y-3">
                <p className="text-xs font-semibold text-gray-400">Redis distributed LRU config</p>
                <CodeBlock code={`# Redis redis.conf
maxmemory 4gb
maxmemory-policy allkeys-lru
maxmemory-samples 10        # higher = more accurate, more CPU

# Consistent hash sharding (Spring Boot application.yaml)
spring:
  data:
    redis:
      cluster:
        nodes:
          - redis-1:6379
          - redis-2:6379
          - redis-3:6379
      lettuce:
        pool:
          max-active: 16`} language="yaml" />
              </motion.div>
            )}

            {/* Ideal answer */}
            <IdealAnswer
              text={q.idealAnswer}
              voiceEnabled={voice.enabled}
              isSpeaking={speakingTarget === `q${activeQ}-ideal` && !!voice.speaking}
              onSpeak={() => handleSpeak(`q${activeQ}-ideal`, q.idealAnswer, 'candidate')}
              onStop={() => { voice.stop(); setSpeakingTarget(null); }}
            />

            {/* Tip */}
            <InterviewTip text={q.tip} />

            {/* Navigation */}
            <div className="flex justify-between pt-2">
              <button onClick={() => { setActiveQ(q => Math.max(1, q - 1)); setTab('interview'); }}
                disabled={activeQ === 1}
                className="text-sm text-gray-400 hover:text-gray-200 disabled:opacity-30 border border-gray-700 rounded-lg px-4 py-2 transition-colors">
                ← Previous
              </button>
              <button onClick={() => { setActiveQ(q => Math.min(QUESTIONS.length, q + 1)); setTab('interview'); }}
                disabled={activeQ === QUESTIONS.length}
                className="text-sm text-white bg-brand-600 hover:bg-brand-500 border border-brand-500/50 rounded-lg px-4 py-2 transition-colors disabled:opacity-30">
                Next Question →
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="code" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Code tab selector */}
            <div className="flex overflow-x-auto gap-1 rounded-xl border border-gray-700 bg-gray-900/60 p-1">
              {CODE_TABS.map(ct => (
                <button key={ct.id} onClick={() => setCodeTab(ct.id)}
                  className={`flex-shrink-0 rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
                    codeTab === ct.id ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'
                  }`}>{ct.label}</button>
              ))}
            </div>

            {/* Description */}
            <div className="text-xs text-gray-500 px-1">
              {codeTab === 'simple' && 'Quickest production-ready solution — 10 lines using LinkedHashMap with access order. Ships first, optimize later.'}
              {codeTab === 'custom' && 'Full custom implementation with HashMap + Doubly Linked List + sentinel nodes. This is what interviewers expect you to code on a whiteboard.'}
              {codeTab === 'thread' && 'Thread-safe version using ReentrantReadWriteLock. Read-heavy workloads can take readLock; writes take writeLock.'}
              {codeTab === 'distributed' && 'Redis-backed distributed LRU with ZSET for manual eviction or automatic allkeys-lru policy. Scales to any number of nodes.'}
              {codeTab === 'monitored' && 'Production-grade with Micrometer metrics — hit rate, evictions, size exposed to Prometheus/Grafana.'}
            </div>

            <CodeBlock code={CODE_TABS.find(ct => ct.id === codeTab)?.code ?? ''} language="java" />

            {/* Complexity summary */}
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { label: 'get()', complexity: 'O(1)', detail: 'HashMap lookup + DLL move' },
                { label: 'put()', complexity: 'O(1)', detail: 'HashMap insert + DLL prepend' },
                { label: 'evict()', complexity: 'O(1)', detail: 'DLL tail removal + map delete' },
              ].map(r => (
                <div key={r.label} className="rounded-xl border border-gray-700 bg-gray-900/60 p-4 text-center">
                  <p className="text-xs text-gray-500 font-mono mb-1">{r.label}</p>
                  <p className="text-2xl font-extrabold text-emerald-400 mb-1">{r.complexity}</p>
                  <p className="text-xs text-gray-500">{r.detail}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
        <p className="text-xs text-gray-500 text-center">
          LRU Cache · HashMap + DLL · O(1) all operations · Thread-safe with ReentrantReadWriteLock · Redis allkeys-lru at scale
        </p>
      </div>
    </div>
  );
}
