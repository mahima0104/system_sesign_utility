import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LogEntry {
  offset: number;
  key: string;
  value: string | null; // null = tombstone
  color: string;
}

const KEY_COLOURS: Record<string, string> = {
  user_42: '#60a5fa',
  user_99: '#a78bfa',
  user_17: '#34d399',
  user_56: '#f472b6',
};

const INITIAL_LOG: LogEntry[] = [
  { offset: 0, key: 'user_42', value: 'name=Ada',          color: KEY_COLOURS.user_42 },
  { offset: 1, key: 'user_99', value: 'name=Linus',        color: KEY_COLOURS.user_99 },
  { offset: 2, key: 'user_42', value: 'name=Ada,city=NYC', color: KEY_COLOURS.user_42 },
  { offset: 3, key: 'user_17', value: 'name=Grace',        color: KEY_COLOURS.user_17 },
  { offset: 4, key: 'user_99', value: 'name=Linus,city=Helsinki', color: KEY_COLOURS.user_99 },
  { offset: 5, key: 'user_42', value: 'name=Ada,city=NYC,role=eng', color: KEY_COLOURS.user_42 },
  { offset: 6, key: 'user_56', value: 'name=Tim',          color: KEY_COLOURS.user_56 },
  { offset: 7, key: 'user_17', value: null /* tombstone */, color: KEY_COLOURS.user_17 },
  { offset: 8, key: 'user_99', value: 'name=Linus,city=Helsinki,role=kernel', color: KEY_COLOURS.user_99 },
];

/**
 * Compact a log: keep only the LAST entry per key. Tombstones (null values)
 * delete the key from the compacted view entirely — that's how compacted topics
 * support "deletion" semantics.
 */
function compact(log: LogEntry[]): LogEntry[] {
  const lastByKey = new Map<string, LogEntry>();
  for (const e of log) lastByKey.set(e.key, e);
  return Array.from(lastByKey.values()).filter((e) => e.value !== null);
}

export default function CompactionDemo() {
  const [compacted, setCompacted] = useState(false);

  const view = compacted ? compact(INITIAL_LOG) : INITIAL_LOG;

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-sm">Log Compaction in Action</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Keeps only the latest value per key. Tombstones (<span className="text-red-400">value=null</span>) delete the key.
          </p>
        </div>
        <button
          onClick={() => setCompacted((c) => !c)}
          className="text-xs px-3 py-1.5 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-500 transition-colors"
        >
          {compacted ? '⟳ Show full log' : '🧹 Compact'}
        </button>
      </div>

      {/* Log entries */}
      <div className="rounded-xl bg-gray-950 border border-gray-800 p-3">
        <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-2 font-medium">
          Partition log {compacted && '(after compaction)'}
        </div>
        <div className="space-y-1.5">
          <AnimatePresence mode="popLayout">
            {view.map((entry) => {
              const isTombstone = entry.value === null;
              return (
                <motion.div
                  key={entry.offset}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex items-center gap-2.5"
                >
                  <span className="text-[10px] font-mono text-gray-600 w-8 text-right flex-shrink-0">
                    {entry.offset}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded font-mono text-[11px] font-semibold w-20 text-center flex-shrink-0"
                    style={{
                      backgroundColor: entry.color + '22',
                      color: entry.color,
                      border: `1px solid ${entry.color}55`,
                    }}
                  >
                    {entry.key}
                  </span>
                  {isTombstone ? (
                    <span className="text-[11px] font-mono text-red-400 italic">
                      🪦 tombstone (delete marker)
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-gray-300 truncate">
                      {entry.value}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-gray-900/40 border border-gray-800 px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">Before</div>
          <div className="text-white font-bold text-lg">{INITIAL_LOG.length} entries</div>
        </div>
        <div className="rounded-lg bg-green-500/5 border border-green-500/20 px-3 py-2 text-center">
          <div className="text-green-400 text-[10px]">After compaction</div>
          <div className="text-white font-bold text-lg">{compact(INITIAL_LOG).length} entries</div>
        </div>
      </div>

      <div className="rounded-xl bg-blue-500/5 border border-blue-500/20 p-3">
        <p className="text-xs text-gray-300 leading-relaxed">
          <strong className="text-blue-400">Why compaction matters:</strong> for a topic that holds the
          "current state" of something (user profiles, account balances, config), you don\'t want every
          historical change forever — you want the <em>latest</em> value per key. Compaction reclaims space
          while preserving the most recent record. Tombstones (null values) flag a key as deleted; after a
          delay (<code className="font-mono text-pink-300 bg-gray-900 px-1 rounded">delete.retention.ms</code>),
          even the tombstone is removed.
        </p>
      </div>
    </div>
  );
}
