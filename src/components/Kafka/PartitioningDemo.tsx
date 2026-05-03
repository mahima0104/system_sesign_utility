import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Simple deterministic 32-bit hash (FNV-1a) — readable enough to teach the idea.
function hashKey(key: string): number {
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0; // force unsigned 32-bit
}

interface DroppedMessage {
  id: number;
  key: string;
  partition: number;
  hash: number;
  color: string;
}

const PALETTE = ['#60a5fa', '#a78bfa', '#f472b6', '#facc15', '#34d399', '#fb923c'];

export default function PartitioningDemo() {
  const [partitionCount, setPartitionCount] = useState(4);
  const [key, setKey] = useState('user_42');
  const [history, setHistory] = useState<DroppedMessage[]>([]);
  const [counter, setCounter] = useState(0);

  const { hash, partition } = useMemo(() => {
    const h = hashKey(key);
    return { hash: h, partition: h % partitionCount };
  }, [key, partitionCount]);

  const send = () => {
    const msg: DroppedMessage = {
      id: counter,
      key,
      partition,
      hash,
      color: PALETTE[counter % PALETTE.length],
    };
    setHistory((h) => [...h, msg].slice(-12));
    setCounter((c) => c + 1);
  };

  // Group messages by partition for the visual
  const byPartition = Array.from({ length: partitionCount }, (_, i) =>
    history.filter((m) => m.partition === i)
  );

  return (
    <div className="card p-5 space-y-5">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1">
          <label className="block text-xs text-gray-400 font-medium mb-1.5">Message Key</label>
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-brand-500"
            placeholder="e.g. user_42"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 font-medium mb-1.5">Partitions</label>
          <div className="flex items-center gap-1">
            {[2, 3, 4, 6].map((n) => (
              <button
                key={n}
                onClick={() => setPartitionCount(n)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  partitionCount === n
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={send}
          className="px-4 py-2 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-500 transition-colors text-sm"
        >
          Send →
        </button>
      </div>

      {/* The math */}
      <div className="rounded-xl bg-gray-950 border border-gray-800 p-4 font-mono text-xs space-y-1.5">
        <div className="text-gray-500">// Kafka picks a partition like this:</div>
        <div className="text-gray-300">
          <span className="text-purple-400">hash</span>(<span className="text-yellow-300">"{key}"</span>){' '}
          <span className="text-gray-500">=</span>{' '}
          <span className="text-blue-300">{hash}</span>
        </div>
        <div className="text-gray-300">
          <span className="text-blue-300">{hash}</span>{' '}
          <span className="text-gray-500">%</span>{' '}
          <span className="text-pink-300">{partitionCount}</span>{' '}
          <span className="text-gray-500">=</span>{' '}
          <motion.span
            key={partition}
            initial={{ scale: 0.8, color: '#34d399' }}
            animate={{ scale: 1, color: '#facc15' }}
            transition={{ duration: 0.3 }}
            className="font-bold"
          >
            partition {partition}
          </motion.span>
        </div>
      </div>

      {/* Partition bins */}
      <div>
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${partitionCount}, minmax(0, 1fr))` }}>
          {byPartition.map((msgs, i) => {
            const willLand = partition === i;
            return (
              <motion.div
                key={i}
                animate={{
                  borderColor: willLand ? '#facc15' : '#374151',
                  boxShadow: willLand ? '0 0 18px rgba(250, 204, 21, 0.15)' : '0 0 0 rgba(0,0,0,0)',
                }}
                className="rounded-xl bg-gray-950 border-2 p-3 min-h-[140px]"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-purple-300 font-semibold">
                    Partition {i}
                  </span>
                  <span className="text-[10px] text-gray-600">{msgs.length} msg</span>
                </div>
                <div className="space-y-1">
                  <AnimatePresence>
                    {msgs.map((m) => (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: -8, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="px-2 py-1 rounded text-[11px] font-mono truncate"
                        style={{
                          backgroundColor: m.color + '22',
                          color: m.color,
                          border: `1px solid ${m.color}55`,
                        }}
                      >
                        {m.key}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {msgs.length === 0 && (
                    <p className="text-[11px] text-gray-700 italic mt-3 text-center">empty</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Hint */}
      <div className="rounded-xl bg-blue-500/5 border border-blue-500/20 p-3">
        <p className="text-xs text-gray-300">
          <strong className="text-blue-400">Try this:</strong> Send a few messages with the same key
          (e.g. <span className="font-mono text-yellow-300">user_42</span>) — they all land in the same
          partition. Now change the key to <span className="font-mono text-yellow-300">user_99</span> —
          it usually picks a different one. <strong className="text-white">Same key → same partition</strong>{' '}
          is how Kafka guarantees ordering for related events.
        </p>
      </div>

      {history.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={() => setHistory([])}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Clear history
          </button>
        </div>
      )}
    </div>
  );
}
