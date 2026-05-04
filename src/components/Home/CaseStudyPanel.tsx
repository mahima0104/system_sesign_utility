import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const caseStudies = [
  {
    id: 'uber-kafka',
    title: 'Uber × Kafka Event Architecture',
    description: 'Real-time trip events, surge pricing, and driver dispatch over a Kafka pipeline.',
    icon: '🚖',
    category: 'Event Streaming',
    accent: 'from-yellow-400 to-orange-400',
    to: '/case-study/uber-kafka',
    difficulty: 'Advanced',
  },
  {
    id: 'paybank',
    title: 'PayBank — UPI Banking System',
    description: 'ACID transactions, idempotency, fault tolerance, and ledger design for a digital bank.',
    icon: '🏦',
    category: 'Financial Systems',
    accent: 'from-emerald-400 to-cyan-400',
    to: '/case-study/paybank',
    difficulty: 'Advanced',
  },
  {
    id: 'quickeats',
    title: 'QuickEats — Load Balancing',
    description: 'L4 vs L7, the 5 algorithms, sticky sessions, and health checks on a Friday-night food surge.',
    icon: '🍕',
    category: 'Networking',
    accent: 'from-orange-300 to-yellow-300',
    to: '/case-study/quickeats',
    difficulty: 'Intermediate',
  },
  {
    id: 'streamcart',
    title: 'StreamCart — Architecture Patterns',
    description: 'Monolith → microservices, event-driven fan-out, CORS, and serverless in one platform.',
    icon: '🎬',
    category: 'Architecture',
    accent: 'from-purple-400 to-pink-400',
    to: '/case-study/streamcart',
    difficulty: 'Intermediate',
  },
  {
    id: 'database-fundamentals',
    title: 'Database Fundamentals',
    description: 'SQL vs NoSQL trade-offs, ACID, indexing, and schema design applied end-to-end.',
    icon: '🗄️',
    category: 'Databases',
    accent: 'from-blue-400 to-indigo-400',
    to: '/case-study/database-fundamentals',
    difficulty: 'Beginner',
  },
  {
    id: 'database-in-depth',
    title: 'Database Deep Dive',
    description: 'Sharding strategies, replication lag, distributed transactions, and CAP in practice.',
    icon: '🔬',
    category: 'Databases',
    accent: 'from-violet-400 to-blue-400',
    to: '/case-study/database-in-depth',
    difficulty: 'Advanced',
  },
  {
    id: 'caching-fundamentals',
    title: 'Caching Fundamentals',
    description: 'Cache-aside, read-through, TTLs, eviction policies, and stampede prevention.',
    icon: '⚡',
    category: 'Caching',
    accent: 'from-yellow-300 to-green-400',
    to: '/case-study/caching-fundamentals',
    difficulty: 'Intermediate',
  },
  {
    id: 'distributed-caching',
    title: 'Distributed Caching',
    description: 'Redis Cluster, consistent hashing, hot-key sharding, and multi-region cache strategies.',
    icon: '🕸️',
    category: 'Caching',
    accent: 'from-red-400 to-orange-400',
    to: '/case-study/distributed-caching',
    difficulty: 'Advanced',
  },
  {
    id: 'realtime-communication',
    title: 'Real-Time Communication',
    description: 'WebSockets, SSE, long polling, and WebRTC for a live messaging & streaming platform.',
    icon: '📡',
    category: 'Communication',
    accent: 'from-cyan-400 to-blue-400',
    to: '/case-study/realtime-communication',
    difficulty: 'Intermediate',
  },
  {
    id: 'asynchronous-communication',
    title: 'Async Communication',
    description: 'Message queues, pub/sub fan-out, dead-letter queues, and delivery semantics.',
    icon: '📨',
    category: 'Communication',
    accent: 'from-fuchsia-400 to-pink-400',
    to: '/case-study/asynchronous-communication',
    difficulty: 'Intermediate',
  },
  {
    id: 'api-design',
    title: 'API Design Principles',
    description: 'REST vs GraphQL, versioning, pagination, idempotency, and OpenAPI spec patterns.',
    icon: '📐',
    category: 'API',
    accent: 'from-teal-400 to-emerald-400',
    to: '/case-study/api-design',
    difficulty: 'Intermediate',
  },
  {
    id: 'api-infrastructure',
    title: 'API Infrastructure',
    description: 'API gateways, rate limiting, circuit breakers, service mesh, and observability.',
    icon: '🏗️',
    category: 'API',
    accent: 'from-slate-400 to-blue-400',
    to: '/case-study/api-infrastructure',
    difficulty: 'Advanced',
  },
  {
    id: 'api-security',
    title: 'API Security',
    description: 'OAuth 2.0, JWT, mTLS, CORS, OWASP API Top 10, and zero-trust patterns.',
    icon: '🔐',
    category: 'Security',
    accent: 'from-red-500 to-rose-400',
    to: '/case-study/api-security',
    difficulty: 'Advanced',
  },
  {
    id: 'flipkart-reads',
    title: 'Flipkart — Scaling DB Reads',
    description: 'Read replicas, CQRS, connection pooling, and query optimization under peak traffic.',
    icon: '📈',
    category: 'DB Scaling',
    accent: 'from-amber-400 to-yellow-300',
    to: '/case-study/flipkart-reads',
    difficulty: 'Advanced',
  },
  {
    id: 'swiggy-writes',
    title: 'Swiggy — Scaling DB Writes',
    description: 'Sharding, write-behind caching, event sourcing, and CQRS for high-write workloads.',
    icon: '🛵',
    category: 'DB Scaling',
    accent: 'from-orange-500 to-red-400',
    to: '/case-study/swiggy-writes',
    difficulty: 'Advanced',
  },
  {
    id: 'kafka',
    title: 'Kafka Deep Dive',
    description: 'Topics, partitions, consumers, brokers, retention, and exactly-once semantics.',
    icon: '🌊',
    category: 'Event Streaming',
    accent: 'from-blue-500 to-cyan-400',
    to: '/kafka',
    difficulty: 'Advanced',
  },
];

const categories = ['All', ...Array.from(new Set(caseStudies.map((c) => c.category)))];

const difficultyColor: Record<string, string> = {
  Beginner: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  Intermediate: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  Advanced: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CaseStudyPanel({ isOpen, onClose }: Props) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setSearch('');
      setActiveCategory('All');
    }
  }, [isOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const filtered = caseStudies.filter((c) => {
    const matchCat = activeCategory === 'All' || c.category === activeCategory;
    const q = search.toLowerCase();
    const matchSearch =
      !q || c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Floating Panel */}
          <motion.div
            key="panel"
            ref={panelRef}
            className="fixed inset-x-4 top-[5vh] z-50 mx-auto max-w-4xl max-h-[88vh] flex flex-col rounded-2xl border border-gray-700/80 bg-gray-950/95 shadow-2xl shadow-black/60 ring-1 ring-white/5"
            initial={{ opacity: 0, scale: 0.96, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="flex-shrink-0 border-b border-gray-800 px-5 pt-5 pb-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-lg font-bold text-white">Case Studies</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{caseStudies.length} real-world system deep dives</p>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search case studies…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-gray-700 bg-gray-900 py-2.5 pl-9 pr-4 text-sm text-white placeholder-gray-500 focus:border-cyan-500/60 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category tabs */}
              <div className="mt-3 flex gap-1.5 flex-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                      activeCategory === cat
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                  <span className="text-4xl mb-3">🔍</span>
                  <p className="text-sm">No case studies match "{search}"</p>
                  <button onClick={() => setSearch('')} className="mt-2 text-xs text-cyan-400 hover:underline">
                    Clear search
                  </button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filtered.map((cs, i) => (
                    <motion.div
                      key={cs.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <Link
                        to={cs.to}
                        onClick={onClose}
                        className="group flex flex-col rounded-xl border border-gray-800 bg-gray-900/60 p-4 transition-all hover:border-gray-600 hover:bg-gray-900"
                      >
                        <div className="flex items-start justify-between mb-2.5">
                          <span className="text-2xl leading-none">{cs.icon}</span>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${difficultyColor[cs.difficulty]}`}>
                            {cs.difficulty}
                          </span>
                        </div>
                        <div className={`mb-2 h-0.5 w-10 rounded-full bg-gradient-to-r ${cs.accent}`} />
                        <h3 className="text-sm font-semibold text-white group-hover:text-cyan-200 transition-colors leading-snug mb-1.5">
                          {cs.title}
                        </h3>
                        <p className="text-[11px] leading-relaxed text-gray-400 flex-1">{cs.description}</p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="rounded-md bg-gray-800 px-2 py-0.5 text-[10px] font-medium text-gray-400">
                            {cs.category}
                          </span>
                          <span className="text-[11px] text-gray-500 group-hover:text-cyan-400 transition-colors">Open →</span>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 border-t border-gray-800 px-5 py-3 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {filtered.length} of {caseStudies.length} case studies
              </p>
              <p className="text-xs text-gray-600">Press Esc to close</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
