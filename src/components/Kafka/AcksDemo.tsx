import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type AckMode = 0 | 1 | 'all';

interface RunState {
  startedAt: number;
  ackedAt: number | null;
  leaderHas: boolean;
  followersHave: boolean;
}

const MODES: { value: AckMode; label: string; sub: string; latencyMs: number; durability: string }[] = [
  {
    value: 0,
    label: 'acks=0',
    sub: 'fire and forget',
    latencyMs: 60,
    durability: 'lowest',
  },
  {
    value: 1,
    label: 'acks=1',
    sub: 'leader only',
    latencyMs: 220,
    durability: 'medium',
  },
  {
    value: 'all',
    label: 'acks=all',
    sub: 'wait for in-sync replicas',
    latencyMs: 480,
    durability: 'highest',
  },
];

export default function AcksDemo() {
  const [running, setRunning] = useState<Record<string, RunState | null>>({
    '0': null,
    '1': null,
    all: null,
  });

  const trigger = (mode: AckMode) => {
    const key = String(mode);
    const config = MODES.find((m) => m.value === mode)!;
    const startedAt = performance.now();

    setRunning((prev) => ({
      ...prev,
      [key]: { startedAt, ackedAt: null, leaderHas: false, followersHave: false },
    }));

    // Leader receives the message at ~30% of total latency
    setTimeout(() => {
      setRunning((prev) => ({
        ...prev,
        [key]: { ...(prev[key] as RunState), leaderHas: true },
      }));
    }, config.latencyMs * 0.3);

    // For acks=all, followers ack at ~70% of total latency
    if (mode === 'all') {
      setTimeout(() => {
        setRunning((prev) => ({
          ...prev,
          [key]: { ...(prev[key] as RunState), followersHave: true },
        }));
      }, config.latencyMs * 0.7);
    }

    // Producer ACKed
    setTimeout(() => {
      setRunning((prev) => ({
        ...prev,
        [key]: { ...(prev[key] as RunState), ackedAt: performance.now() },
      }));
    }, config.latencyMs);
  };

  const triggerAll = () => {
    MODES.forEach((m) => trigger(m.value));
  };

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-sm">Producer Acknowledgments</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Tap a card to fire one message. The number is the time the producer waits before considering it
            "sent".
          </p>
        </div>
        <button
          onClick={triggerAll}
          className="text-xs px-3 py-1.5 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-500 transition-colors"
        >
          ▶ Race all three
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {MODES.map((m) => {
          const state = running[String(m.value)];
          const elapsed =
            state && state.ackedAt
              ? Math.round(state.ackedAt - state.startedAt)
              : state
              ? Math.round(performance.now() - state.startedAt)
              : 0;
          const isRunning = !!(state && !state.ackedAt);
          const isAcked = !!state?.ackedAt;
          const colour = m.value === 0 ? '#f87171' : m.value === 1 ? '#fbbf24' : '#34d399';

          return (
            <button
              key={m.label}
              onClick={() => trigger(m.value)}
              className="card p-4 text-left hover:bg-gray-900/40 transition-colors disabled:opacity-50"
              disabled={isRunning}
            >
              <div className="flex items-center justify-between mb-2">
                <code
                  className="text-base font-mono font-bold"
                  style={{ color: colour }}
                >
                  {m.label}
                </code>
                <span className="text-[10px] text-gray-500">{m.sub}</span>
              </div>

              {/* Animated flow */}
              <div className="relative h-10 bg-gray-950 rounded-lg border border-gray-800 mb-3 overflow-hidden">
                {/* Producer dot */}
                <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-400" />
                {/* Leader dot */}
                <div
                  className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full transition-colors"
                  style={{
                    backgroundColor: state?.leaderHas ? '#ef4444' : '#374151',
                  }}
                />
                {/* Follower dots (only for acks=all) */}
                {m.value === 'all' && (
                  <>
                    <div
                      className="absolute right-3 top-1.5 w-1.5 h-1.5 rounded-full transition-colors"
                      style={{ backgroundColor: state?.followersHave ? '#34d399' : '#374151' }}
                    />
                    <div
                      className="absolute right-3 bottom-1.5 w-1.5 h-1.5 rounded-full transition-colors"
                      style={{ backgroundColor: state?.followersHave ? '#34d399' : '#374151' }}
                    />
                  </>
                )}

                {/* Message animation */}
                <AnimatePresence>
                  {isRunning && (
                    <motion.div
                      key={state.startedAt}
                      initial={{ left: '4%' }}
                      animate={{
                        left: m.value === 'all' ? '88%' : '50%',
                      }}
                      transition={{ duration: m.latencyMs / 1000, ease: 'easeInOut' }}
                      className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: colour, boxShadow: `0 0 6px ${colour}` }}
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* Stats */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between text-gray-400">
                  <span>Latency</span>
                  <span
                    className={`font-mono font-bold ${isAcked ? 'text-white' : 'text-gray-600'}`}
                  >
                    {state ? `${elapsed}ms` : `~${m.latencyMs}ms`}
                  </span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Durability</span>
                  <span className="font-medium" style={{ color: colour }}>
                    {m.durability}
                  </span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Data loss if leader dies?</span>
                  <span className="font-medium">
                    {m.value === 0 ? (
                      <span className="text-red-400">always</span>
                    ) : m.value === 1 ? (
                      <span className="text-yellow-400">possible</span>
                    ) : (
                      <span className="text-green-400">never*</span>
                    )}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl bg-yellow-500/5 border border-yellow-500/20 p-3">
        <p className="text-xs text-gray-300 leading-relaxed">
          <strong className="text-yellow-400">The trade-off:</strong> stronger durability costs latency. Most
          production systems use <code className="font-mono text-pink-300 bg-gray-900 px-1 rounded">acks=all</code>{' '}
          combined with <code className="font-mono text-pink-300 bg-gray-900 px-1 rounded">min.insync.replicas=2</code>{' '}
          — the producer waits for at least 2 replicas to confirm, so the loss of any single broker (even the
          leader) doesn\'t lose data.
          {' '}<span className="text-gray-500">* assuming min.insync.replicas ≥ 2 and replication factor ≥ 3.</span>
        </p>
      </div>
    </div>
  );
}
