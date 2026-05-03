import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const COLS = 6;
const ROWS = 4;
const NUM_CELLS = COLS * ROWS;
const NUM_PARTITIONS = 8;

interface Cell {
  id: number;
  drivers: number;
  requests: number;
}

// Hash a cell ID to a partition (mirrors what Kafka does).
function partitionFor(cellId: number): number {
  let h = 2166136261;
  const s = 'h3_' + cellId;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % NUM_PARTITIONS;
}

function surgeFor(drivers: number, requests: number): number {
  if (requests === 0) return 1.0;
  if (drivers === 0) return 3.0;
  const ratio = requests / drivers;
  return Math.min(3.0, Math.max(1.0, +(0.8 + ratio * 1.2).toFixed(1)));
}

function surgeColor(surge: number): string {
  if (surge >= 2.5) return '#ef4444';
  if (surge >= 2.0) return '#fb923c';
  if (surge >= 1.5) return '#facc15';
  if (surge >= 1.2) return '#84cc16';
  return '#34d399';
}

export default function GeohashingDemo() {
  const [cells, setCells] = useState<Cell[]>(() =>
    Array.from({ length: NUM_CELLS }, (_, i) => ({
      id: i,
      drivers: Math.floor(Math.random() * 5),
      requests: Math.floor(Math.random() * 4),
    }))
  );
  const [running, setRunning] = useState(true);
  const [selected, setSelected] = useState<number | null>(7);

  // Tick: drivers and requests randomly fluctuate
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setCells((prev) =>
        prev.map((c) => {
          const driverDelta = Math.floor(Math.random() * 3) - 1;
          const requestDelta = Math.random() < 0.4 ? Math.floor(Math.random() * 3) - 1 : 0;
          return {
            ...c,
            drivers: Math.max(0, Math.min(8, c.drivers + driverDelta)),
            requests: Math.max(0, Math.min(8, c.requests + requestDelta)),
          };
        })
      );
    }, 1100);
    return () => clearInterval(id);
  }, [running]);

  const selectedCell = selected != null ? cells[selected] : null;
  const selectedSurge = selectedCell ? surgeFor(selectedCell.drivers, selectedCell.requests) : 1.0;

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-white font-semibold text-sm">Geohashed City Grid (H3 Cells)</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Each cell is partitioned independently. Drivers and rider requests are tracked per cell;
            surge price is computed per cell. Click a cell to inspect.
          </p>
        </div>
        <button
          onClick={() => setRunning((r) => !r)}
          className="text-xs px-3 py-1.5 rounded-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 transition-colors"
        >
          {running ? '⏸ Pause' : '▶ Resume'}
        </button>
      </div>

      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
        {cells.map((cell) => {
          const surge = surgeFor(cell.drivers, cell.requests);
          const color = surgeColor(surge);
          const isSelected = selected === cell.id;
          return (
            <button
              key={cell.id}
              onClick={() => setSelected(cell.id)}
              className="relative aspect-square rounded-lg overflow-hidden border-2 transition-all"
              style={{
                borderColor: isSelected ? color : 'rgba(55, 65, 81, 0.6)',
                backgroundColor: color + (isSelected ? '25' : '10'),
                boxShadow: isSelected ? `0 0 12px ${color}55` : 'none',
              }}
            >
              {/* H3 cell label */}
              <div className="absolute top-0.5 left-1 text-[8px] font-mono text-gray-500">
                h3_{cell.id}
              </div>

              {/* Surge multiplier */}
              <motion.div
                key={surge}
                initial={{ scale: 0.85 }}
                animate={{ scale: 1 }}
                className="absolute top-0.5 right-1 text-[10px] font-bold font-mono"
                style={{ color }}
              >
                {surge.toFixed(1)}x
              </motion.div>

              {/* Drivers (green) and requests (orange) dots */}
              <div className="absolute bottom-1 left-1 right-1 flex flex-wrap gap-0.5 items-end">
                {Array.from({ length: cell.drivers }).map((_, i) => (
                  <motion.span
                    key={'d' + i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-1.5 h-1.5 rounded-full bg-green-400"
                  />
                ))}
                {Array.from({ length: cell.requests }).map((_, i) => (
                  <motion.span
                    key={'r' + i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-1.5 h-1.5 rounded-full bg-orange-400"
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Inspect panel */}
      <AnimatePresence mode="wait">
        {selectedCell && (
          <motion.div
            key={selected}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-gray-950 border border-gray-800 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white text-sm font-semibold">
                Cell{' '}
                <span className="font-mono text-brand-400">h3_{selectedCell.id}</span>
              </h4>
              <span
                className="text-sm font-mono font-bold"
                style={{ color: surgeColor(selectedSurge) }}
              >
                {selectedSurge.toFixed(1)}× surge
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <Stat label="Drivers" value={selectedCell.drivers} color="text-green-400" />
              <Stat label="Requests" value={selectedCell.requests} color="text-orange-400" />
              <Stat
                label="Ratio"
                value={
                  selectedCell.drivers === 0
                    ? '∞'
                    : (selectedCell.requests / selectedCell.drivers).toFixed(2)
                }
                color="text-gray-200"
              />
            </div>

            <div className="rounded-lg bg-gray-900/60 border border-gray-800 p-3 font-mono text-[11px] leading-relaxed">
              <div className="text-gray-500">// Kafka decides which partition handles this cell</div>
              <div className="text-gray-300">
                <span className="text-purple-400">hash</span>(<span className="text-yellow-300">"h3_{selectedCell.id}"</span>){' '}
                <span className="text-gray-500">%</span>{' '}
                <span className="text-pink-300">{NUM_PARTITIONS}</span>{' '}
                <span className="text-gray-500">=</span>{' '}
                <span className="text-blue-300 font-bold">partition {partitionFor(selectedCell.id)}</span>
              </div>
              <div className="text-gray-500 mt-1">
                // Same cell → same partition → same matching-service consumer → ordered events
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rounded-xl bg-blue-500/5 border border-blue-500/20 p-3">
        <p className="text-xs text-gray-300 leading-relaxed">
          <strong className="text-blue-400">Why this works at Uber-scale:</strong> a city has thousands of
          H3 cells. By partitioning <code className="font-mono text-pink-300 bg-gray-900 px-1 rounded">driver.locations</code>{' '}
          and <code className="font-mono text-pink-300 bg-gray-900 px-1 rounded">rider.requests</code> by{' '}
          <strong className="text-white">cell ID</strong>, each cell&apos;s matching logic runs on one
          consumer instance — fully parallel across cells, ordered within a cell.{' '}
          <strong className="text-white">No locking, no global coordination.</strong>
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="rounded-lg bg-gray-900/40 border border-gray-800 px-3 py-2 text-center">
      <div className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</div>
      <div className={`text-lg font-bold font-mono ${color}`}>{value}</div>
    </div>
  );
}
