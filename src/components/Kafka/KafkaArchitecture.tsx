import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FlyingMessage {
  id: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
}

const PRODUCERS = [
  { id: 'p1', label: 'Web App', icon: '🌐', x: 8, y: 22 },
  { id: 'p2', label: 'Mobile API', icon: '📱', x: 8, y: 50 },
  { id: 'p3', label: 'Sensor', icon: '📡', x: 8, y: 78 },
];

const PARTITIONS = [
  { id: 'pa0', label: 'P0', x: 50, y: 22 },
  { id: 'pa1', label: 'P1', x: 50, y: 50 },
  { id: 'pa2', label: 'P2', x: 50, y: 78 },
];

const CONSUMERS = [
  { id: 'c1', label: 'Analytics', icon: '📊', x: 92, y: 22 },
  { id: 'c2', label: 'Email', icon: '📧', x: 92, y: 50 },
  { id: 'c3', label: 'Warehouse', icon: '🏬', x: 92, y: 78 },
];

const PRODUCER_COLOURS = ['#60a5fa', '#a78bfa', '#34d399'];

export default function KafkaArchitecture() {
  const [running, setRunning] = useState(true);
  const [messages, setMessages] = useState<FlyingMessage[]>([]);
  const [counter, setCounter] = useState(0);

  // Producers emit messages on a timer
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const producerIdx = Math.floor(Math.random() * PRODUCERS.length);
      const partitionIdx = Math.floor(Math.random() * PARTITIONS.length);
      const producer = PRODUCERS[producerIdx];
      const partition = PARTITIONS[partitionIdx];
      const newMsg: FlyingMessage = {
        id: counter,
        fromX: producer.x,
        fromY: producer.y,
        toX: partition.x,
        toY: partition.y,
        color: PRODUCER_COLOURS[producerIdx],
      };
      setMessages((prev) => [...prev.slice(-12), newMsg]);
      setCounter((c) => c + 1);

      // After 1.4s, send the message from partition to a consumer
      setTimeout(() => {
        const consumerIdx = Math.floor(Math.random() * CONSUMERS.length);
        const consumer = CONSUMERS[consumerIdx];
        setMessages((prev) => [
          ...prev.slice(-12),
          {
            id: newMsg.id + 100000,
            fromX: partition.x,
            fromY: partition.y,
            toX: consumer.x,
            toY: consumer.y,
            color: newMsg.color,
          },
        ]);
      }, 1400);
    }, 700);
    return () => clearInterval(id);
  }, [running, counter]);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold">Live Kafka Architecture</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Producers send messages → broker stores in partitions → consumers read
          </p>
        </div>
        <button
          onClick={() => setRunning((r) => !r)}
          className="text-xs px-3 py-1.5 rounded-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 transition-colors"
        >
          {running ? '⏸ Pause' : '▶ Play'}
        </button>
      </div>

      <div className="relative w-full aspect-[2.2/1] bg-gray-950 rounded-xl border border-gray-800 overflow-hidden">
        {/* Broker cluster visual — a soft ring around the partitions */}
        <div
          className="absolute rounded-3xl border border-dashed border-brand-500/30 bg-brand-500/5"
          style={{ left: '34%', top: '8%', width: '32%', height: '84%' }}
        >
          <span className="absolute -top-2.5 left-3 px-2 text-[10px] font-medium text-brand-400 bg-gray-950 uppercase tracking-wide">
            Kafka Broker · Topic: orders
          </span>
        </div>

        {/* Producers */}
        {PRODUCERS.map((p) => (
          <Node key={p.id} {...p} role="producer" />
        ))}

        {/* Partitions */}
        {PARTITIONS.map((p) => (
          <Partition key={p.id} {...p} />
        ))}

        {/* Consumers */}
        {CONSUMERS.map((c) => (
          <Node key={c.id} {...c} role="consumer" />
        ))}

        {/* Flying messages */}
        <AnimatePresence>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              className="absolute w-2.5 h-2.5 rounded-full pointer-events-none"
              style={{
                backgroundColor: m.color,
                boxShadow: `0 0 8px ${m.color}`,
              }}
              initial={{ left: `${m.fromX}%`, top: `${m.fromY}%`, opacity: 0, scale: 0.5 }}
              animate={{ left: `${m.toX}%`, top: `${m.toY}%`, opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
            />
          ))}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4 text-[11px]">
        <Legend swatch="#60a5fa" label="Producers" sub="apps that send data" />
        <Legend swatch="#a78bfa" label="Partitions" sub="where data is stored" />
        <Legend swatch="#34d399" label="Consumers" sub="apps that read data" />
      </div>
    </div>
  );
}

function Node({
  label,
  icon,
  x,
  y,
  role,
}: {
  label: string;
  icon?: string;
  x: number;
  y: number;
  role: 'producer' | 'consumer';
}) {
  const colour = role === 'producer' ? '#60a5fa' : '#34d399';
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg border-2"
        style={{ backgroundColor: '#1f2937', borderColor: colour, boxShadow: `0 0 12px ${colour}33` }}
      >
        {icon}
      </div>
      <span className="mt-1 text-[10px] text-gray-300 whitespace-nowrap">{label}</span>
    </div>
  );
}

function Partition({ label, x, y }: { label: string; x: number; y: number }) {
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div className="px-3 h-9 min-w-[64px] rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-500/40 text-purple-300 text-xs font-mono font-semibold">
        {label}
      </div>
      <span className="mt-1 text-[9px] text-gray-500">partition</span>
    </div>
  );
}

function Legend({ swatch, label, sub }: { swatch: string; label: string; sub: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900/40 border border-gray-800">
      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: swatch }} />
      <div>
        <div className="text-gray-200 font-medium">{label}</div>
        <div className="text-gray-500 text-[10px]">{sub}</div>
      </div>
    </div>
  );
}
