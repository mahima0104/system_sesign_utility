import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PARTITION_COUNT = 6;
const CONSUMER_COLOURS = ['#60a5fa', '#a78bfa', '#34d399', '#f472b6', '#facc15', '#fb923c', '#22d3ee', '#f87171'];

/**
 * Round-robin assignment, mirroring Kafka's "RangeAssignor" simplified:
 * consumer i gets partitions [i, i + N, i + 2N, ...].
 * Real Kafka has more sophisticated strategies but the principle is identical.
 */
function assignPartitions(partitionCount: number, consumerCount: number): number[] {
  const result = Array<number>(partitionCount).fill(-1);
  if (consumerCount === 0) return result;
  for (let p = 0; p < partitionCount; p++) {
    result[p] = p % consumerCount;
  }
  return result;
}

export default function ConsumerGroupDemo() {
  const [consumerCount, setConsumerCount] = useState(2);

  const assignment = useMemo(
    () => assignPartitions(PARTITION_COUNT, consumerCount),
    [consumerCount]
  );

  // Per-consumer partition lists (for the bottom panel)
  const perConsumer = useMemo(() => {
    const map: number[][] = Array.from({ length: consumerCount }, () => []);
    assignment.forEach((c, p) => {
      if (c >= 0) map[c].push(p);
    });
    return map;
  }, [assignment, consumerCount]);

  const idleConsumers = Math.max(0, consumerCount - PARTITION_COUNT);

  return (
    <div className="card p-5 space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-sm text-gray-300">
          <strong className="text-white">Consumer Group:</strong> <span className="font-mono text-brand-400">order-processors</span>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={() => setConsumerCount(Math.max(0, consumerCount - 1))}
            disabled={consumerCount === 0}
            className="w-8 h-8 rounded-lg bg-gray-900 text-gray-400 hover:bg-gray-800 disabled:opacity-30 transition-colors text-lg font-bold"
            aria-label="Remove consumer"
          >
            −
          </button>
          <span className="font-mono text-sm text-white px-3 min-w-[3rem] text-center">
            {consumerCount}
          </span>
          <button
            onClick={() => setConsumerCount(Math.min(8, consumerCount + 1))}
            disabled={consumerCount === 8}
            className="w-8 h-8 rounded-lg bg-gray-900 text-gray-400 hover:bg-gray-800 disabled:opacity-30 transition-colors text-lg font-bold"
            aria-label="Add consumer"
          >
            +
          </button>
        </div>
      </div>

      {/* Partitions row */}
      <div>
        <div className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">
          Topic: orders ({PARTITION_COUNT} partitions)
        </div>
        <div className="grid grid-cols-6 gap-2">
          {assignment.map((consumerIdx, partitionIdx) => {
            const colour = consumerIdx >= 0 ? CONSUMER_COLOURS[consumerIdx % CONSUMER_COLOURS.length] : null;
            return (
              <motion.div
                key={partitionIdx}
                layout
                animate={{
                  borderColor: colour ?? '#374151',
                  backgroundColor: colour ? colour + '15' : '#11182755',
                }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                className="aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-1"
              >
                <span
                  className="text-[10px] font-mono font-medium"
                  style={{ color: colour ?? '#6b7280' }}
                >
                  P{partitionIdx}
                </span>
                {consumerIdx >= 0 ? (
                  <motion.span
                    key={consumerIdx}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-xs font-bold"
                    style={{ color: colour ?? undefined }}
                  >
                    C{consumerIdx + 1}
                  </motion.span>
                ) : (
                  <span className="text-[10px] text-gray-600">unassigned</span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Consumers row */}
      <div>
        <div className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">
          Consumers
        </div>
        <div className="flex flex-wrap gap-2 min-h-[80px]">
          <AnimatePresence>
            {perConsumer.map((partitions, i) => {
              const colour = CONSUMER_COLOURS[i % CONSUMER_COLOURS.length];
              const isIdle = partitions.length === 0;
              return (
                <motion.div
                  key={i}
                  layout
                  initial={{ opacity: 0, scale: 0.8, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -12 }}
                  className="flex-1 min-w-[140px] rounded-xl border-2 p-3"
                  style={{
                    borderColor: colour,
                    backgroundColor: colour + (isIdle ? '08' : '15'),
                    opacity: isIdle ? 0.55 : 1,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold" style={{ color: colour }}>
                      C{i + 1}
                    </span>
                    {isIdle && (
                      <span className="text-[10px] text-gray-500 italic">idle</span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-400 mb-1">reads from:</div>
                  <div className="flex flex-wrap gap-1">
                    {partitions.length > 0 ? (
                      partitions.map((p) => (
                        <span
                          key={p}
                          className="px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold"
                          style={{ backgroundColor: colour + '33', color: colour }}
                        >
                          P{p}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-gray-600">— no partitions —</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {consumerCount === 0 && (
            <div className="flex-1 text-center py-4 text-sm text-gray-500 italic">
              No consumers — messages pile up unread.
            </div>
          )}
        </div>
      </div>

      {/* Insight */}
      <div className="rounded-xl bg-purple-500/5 border border-purple-500/20 p-3">
        <p className="text-xs text-gray-300 leading-relaxed">
          {consumerCount === 0 && (
            <>
              <strong className="text-purple-400">No consumers:</strong> messages still get written to
              partitions (and stay there safely), but nobody is reading. Add a consumer to start processing.
            </>
          )}
          {consumerCount > 0 && consumerCount < PARTITION_COUNT && (
            <>
              <strong className="text-purple-400">Sharing the work:</strong> {consumerCount} consumer
              {consumerCount > 1 ? 's' : ''} split {PARTITION_COUNT} partitions between
              {consumerCount === 1 ? ' itself' : ' themselves'}. Adding more = faster processing — until
              you reach {PARTITION_COUNT} consumers.
            </>
          )}
          {consumerCount === PARTITION_COUNT && (
            <>
              <strong className="text-purple-400">Sweet spot:</strong> one consumer per partition — maximum
              parallelism for this topic. Adding more won't help.
            </>
          )}
          {consumerCount > PARTITION_COUNT && (
            <>
              <strong className="text-yellow-400">Diminishing returns:</strong> {idleConsumers} consumer
              {idleConsumers > 1 ? 's are' : ' is'} idle. Kafka can\'t give a partition to two
              consumers in the same group, so extra consumers just sit waiting. Increase the partition
              count to scale further.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
