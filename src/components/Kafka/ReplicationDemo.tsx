import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Role = 'leader' | 'follower' | 'down';

interface Broker {
  id: number;
  role: Role;
  messages: string[];
}

const INITIAL: Broker[] = [
  { id: 1, role: 'leader', messages: ['m1', 'm2', 'm3'] },
  { id: 2, role: 'follower', messages: ['m1', 'm2', 'm3'] },
  { id: 3, role: 'follower', messages: ['m1', 'm2', 'm3'] },
];

export default function ReplicationDemo() {
  const [brokers, setBrokers] = useState<Broker[]>(INITIAL);
  const [event, setEvent] = useState<string>('All brokers healthy. The leader handles writes; followers stay in sync.');
  const [msgCounter, setMsgCounter] = useState(4);

  const sendMessage = () => {
    const leader = brokers.find((b) => b.role === 'leader');
    if (!leader) return;
    const newMsg = 'm' + msgCounter;
    setMsgCounter((c) => c + 1);
    setBrokers((prev) =>
      prev.map((b) =>
        b.role === 'down' ? b : { ...b, messages: [...b.messages, newMsg] }
      )
    );
    setEvent(`Producer wrote ${newMsg} → leader stored it → followers replicated it.`);
  };

  const killLeader = () => {
    const leader = brokers.find((b) => b.role === 'leader');
    if (!leader) return;
    setBrokers((prev) => {
      // Mark leader as down
      const updated = prev.map((b) =>
        b.id === leader.id ? { ...b, role: 'down' as Role } : b
      );
      // Promote first available follower to leader
      const newLeaderIdx = updated.findIndex((b) => b.role === 'follower');
      if (newLeaderIdx >= 0) updated[newLeaderIdx] = { ...updated[newLeaderIdx], role: 'leader' };
      return updated;
    });
    setEvent(
      `💥 Broker ${leader.id} crashed! Kafka detected the failure and promoted a follower to leader. Producers automatically reroute to the new leader.`
    );
  };

  const reviveAll = () => {
    setBrokers(INITIAL);
    setMsgCounter(4);
    setEvent('All brokers restored. The leader handles writes; followers stay in sync.');
  };

  const liveBrokers = brokers.filter((b) => b.role !== 'down').length;

  return (
    <div className="card p-5 space-y-5">
      {/* Brokers row */}
      <div className="grid grid-cols-3 gap-3">
        <AnimatePresence>
          {brokers.map((broker) => {
            const isDown = broker.role === 'down';
            const isLeader = broker.role === 'leader';
            const colour = isDown ? '#6b7280' : isLeader ? '#ef4444' : '#34d399';

            return (
              <motion.div
                key={broker.id}
                layout
                animate={{
                  borderColor: colour,
                  opacity: isDown ? 0.45 : 1,
                  filter: isDown ? 'grayscale(80%)' : 'none',
                }}
                transition={{ duration: 0.4 }}
                className="rounded-2xl border-2 p-4 bg-gray-950"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-semibold text-sm">Broker {broker.id}</span>
                  <motion.span
                    key={broker.role}
                    initial={{ scale: 0.6 }}
                    animate={{ scale: 1 }}
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: colour + '20', color: colour, border: `1px solid ${colour}66` }}
                  >
                    {broker.role === 'leader' ? '👑 Leader' : isDown ? '💀 Down' : 'Follower'}
                  </motion.span>
                </div>
                <div className="text-[10px] text-gray-500 mb-1.5">log:</div>
                <div className="flex flex-wrap gap-1 min-h-[28px]">
                  {!isDown ? (
                    broker.messages.map((m) => (
                      <motion.span
                        key={m}
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold"
                        style={{ backgroundColor: colour + '20', color: colour, border: `1px solid ${colour}66` }}
                      >
                        {m}
                      </motion.span>
                    ))
                  ) : (
                    <span className="text-[11px] text-gray-600 italic">unreachable</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Event narrator */}
      <motion.div
        key={event}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-gray-800 bg-gray-950 px-4 py-3"
      >
        <p className="text-sm text-gray-300 leading-relaxed">{event}</p>
        <p className="text-xs text-gray-500 mt-2">
          <strong className="text-gray-400">Live brokers:</strong> {liveBrokers} / {brokers.length}
          {liveBrokers === 0 && (
            <span className="text-red-400 ml-2">— total cluster failure!</span>
          )}
        </p>
      </motion.div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={sendMessage}
          disabled={!brokers.some((b) => b.role === 'leader')}
          className="text-xs px-3 py-1.5 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-500 disabled:opacity-40 disabled:hover:bg-brand-600 transition-colors"
        >
          📨 Send message
        </button>
        <button
          onClick={killLeader}
          disabled={!brokers.some((b) => b.role === 'leader') || liveBrokers <= 1}
          className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-500 disabled:opacity-40 disabled:hover:bg-red-600 transition-colors"
        >
          💥 Kill leader
        </button>
        <button
          onClick={reviveAll}
          className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors ml-auto"
        >
          ⟳ Restore cluster
        </button>
      </div>

      <div className="rounded-xl bg-green-500/5 border border-green-500/20 p-3">
        <p className="text-xs text-gray-300 leading-relaxed">
          <strong className="text-green-400">Why this matters:</strong> with replication factor 3, your data
          survives the loss of <strong className="text-white">two</strong> brokers. The cluster keeps serving
          reads and writes seamlessly — only the few seconds of leader-election are visible to producers as a
          retryable error.
        </p>
      </div>
    </div>
  );
}
