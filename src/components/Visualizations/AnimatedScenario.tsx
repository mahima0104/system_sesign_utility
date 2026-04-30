import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Request {
  id: number;
  server: number;
  label: string;
}

const SERVERS = ['Server A', 'Server B', 'Server C'];

const serverColors = ['#2563eb', '#7c3aed', '#059669'];

export default function LoadBalancerScenario() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [nextServer, setNextServer] = useState(0);
  const [requestCount, setRequestCount] = useState(0);
  const [serverLoads, setServerLoads] = useState([0, 0, 0]);

  const sendRequest = () => {
    const id = requestCount + 1;
    const server = nextServer % 3;
    const req: Request = { id, server, label: `Req #${id}` };

    setRequests((prev) => [...prev.slice(-8), req]);
    setNextServer((n) => n + 1);
    setRequestCount(id);
    setServerLoads((prev) => {
      const next = [...prev];
      next[server] = Math.min(next[server] + 20, 100);
      setTimeout(() => {
        setServerLoads((cur) => {
          const decay = [...cur];
          decay[server] = Math.max(decay[server] - 20, 0);
          return decay;
        });
      }, 1500);
      return next;
    });
  };

  const reset = () => {
    setRequests([]);
    setNextServer(0);
    setRequestCount(0);
    setServerLoads([0, 0, 0]);
  };

  return (
    <div className="bg-gray-950 rounded-2xl border border-gray-800 p-6 select-none">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white font-semibold">☕ Coffee Shop: Load Balancing</h3>
          <p className="text-gray-400 text-sm mt-0.5">
            Each request is a customer order — the load balancer sends them to the next free barista.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={reset} className="btn-secondary text-sm py-1.5 px-3">Reset</button>
          <button onClick={sendRequest} className="btn-primary text-sm py-1.5 px-4">
            Send Request
          </button>
        </div>
      </div>

      {/* Diagram */}
      <div className="relative flex items-center justify-between gap-4">
        {/* Client */}
        <div className="flex flex-col items-center gap-2 min-w-[80px]">
          <div className="w-14 h-14 rounded-full bg-gray-800 border-2 border-gray-600 flex items-center justify-center text-2xl">
            👤
          </div>
          <span className="text-gray-400 text-xs font-medium">Client</span>
        </div>

        {/* Animated requests */}
        <div className="relative flex-1 h-16 flex items-center">
          <div className="absolute inset-x-0 h-0.5 bg-gray-800" />
          <AnimatePresence>
            {requests.slice(-3).map((req) => (
              <motion.div
                key={req.id}
                className="absolute left-0 top-1/2 -translate-y-1/2"
                initial={{ x: 0, opacity: 1 }}
                animate={{ x: '100%', opacity: 0 }}
                transition={{ duration: 0.7, ease: 'easeInOut' }}
              >
                <div
                  className="text-xs font-semibold px-2 py-1 rounded-lg text-white shadow"
                  style={{ background: serverColors[req.server] }}
                >
                  {req.label}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Load balancer */}
        <div className="flex flex-col items-center gap-2 min-w-[90px]">
          <div className="w-14 h-14 rounded-xl bg-brand-900 border-2 border-brand-500 flex items-center justify-center text-xl">
            ⚖️
          </div>
          <span className="text-gray-400 text-xs font-medium text-center">Load<br/>Balancer</span>
        </div>

        {/* Arrow */}
        <div className="relative flex-1 h-16 flex items-center">
          <div className="absolute inset-x-0 h-0.5 bg-gray-800" />
        </div>

        {/* Servers */}
        <div className="flex flex-col gap-3">
          {SERVERS.map((name, i) => (
            <div key={name} className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <motion.div
                  className="w-12 h-12 rounded-xl border-2 flex items-center justify-center text-lg"
                  style={{ borderColor: serverColors[i] }}
                  animate={{
                    scale: requests.some((r) => r.server === i) && requests.at(-1)?.server === i ? [1, 1.12, 1] : 1,
                    boxShadow: serverLoads[i] > 0 ? `0 0 16px ${serverColors[i]}66` : 'none',
                  }}
                  transition={{ duration: 0.3 }}
                >
                  🖥️
                </motion.div>
                <span className="text-xs text-gray-400">{name}</span>
              </div>
              {/* Load bar */}
              <div className="w-20">
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: serverColors[i] }}
                    animate={{ width: `${serverLoads[i]}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <span className="text-xs text-gray-500">{serverLoads[i]}% load</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        {SERVERS.map((name, i) => {
          const count = requests.filter((r) => r.server === i).length;
          return (
            <div key={name} className="bg-gray-900 rounded-xl p-3 text-center border border-gray-800">
              <div className="text-xl font-bold text-white">{count}</div>
              <div className="text-xs text-gray-400 mt-0.5">{name}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
