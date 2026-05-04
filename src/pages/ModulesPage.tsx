import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getModulesBySection, SECTION_ORDER } from '../data/modules';
import { useProgressStore } from '../store/useProgressStore';
import ProgressBar from '../components/Common/ProgressBar';
import DifficultyBadge from '../components/Common/DifficultyBadge';
import LessonTypeIcon from '../components/Common/LessonTypeIcon';
import type { Difficulty, Module } from '../types';

// ─── Database Scaling sub-category definitions ────────────────────────────────
const DB_SCALING_SUBCATEGORIES: {
  key: string;
  label: string;
  icon: string;
  accent: string;
  badgeColor: string;
  ids: string[];
}[] = [
  {
    key: 'reads',
    label: 'Scaling Reads',
    icon: '📖',
    accent: 'border-indigo-500/40 bg-indigo-500/5',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    ids: ['indexing', 'query-optimization', 'read-replicas', 'connection-pooling'],
  },
  {
    key: 'writes',
    label: 'Scaling Writes',
    icon: '✍️',
    accent: 'border-violet-500/40 bg-violet-500/5',
    badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    ids: ['vertical-partitioning', 'sharding', 'database-compression'],
  },
];

// ─── Database learning path sub-category definitions ─────────────────────────
const DATABASE_SUBCATEGORIES: {
  key: string;
  label: string;
  description: string;
  icon: string;
  accent: string;
  badgeColor: string;
  ids: string[];
}[] = [
  {
    key: 'fundamentals',
    label: 'Database Fundamentals',
    description: 'Start here: database types, SQL vs NoSQL choices, and ACID guarantees.',
    icon: '🧱',
    accent: 'border-emerald-500/40 bg-emerald-500/5',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    ids: ['databases', 'database-types', 'sql-vs-nosql', 'acid-transactions'],
  },
  {
    key: 'in-depth',
    label: 'Database In Depth',
    description: 'Go deeper into relational, document, key-value, graph, vector, and specialized databases.',
    icon: '🔬',
    accent: 'border-cyan-500/40 bg-cyan-500/5',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    ids: [
      'relational-databases',
      'document-databases',
      'key-value-stores',
      'wide-column-databases',
      'graph-databases',
      'time-series-databases',
      'full-text-search-engines',
      'vector-databases',
    ],
  },
];

// ─── Caching learning path sub-category definitions ──────────────────────────
const CACHING_SUBCATEGORIES: {
  key: string;
  label: string;
  description: string;
  icon: string;
  accent: string;
  badgeColor: string;
  ids: string[];
}[] = [
  {
    key: 'fundamentals',
    label: 'Caching Fundamentals',
    description: 'Start here: what caching is, common caching patterns, strategies, and eviction policies.',
    icon: '📚',
    accent: 'border-lime-500/40 bg-lime-500/5',
    badgeColor: 'bg-lime-500/20 text-lime-300 border-lime-500/30',
    ids: [
      'caching',
      'what-is-caching',
      'cache-aside-pattern',
      'read-through-vs-write-through-cache',
      'write-behind-cache',
      'caching-strategies',
      'cache-eviction-policies',
    ],
  },
  {
    key: 'distributed',
    label: 'Distributed Caching',
    description: 'Scale caching across regions and services with CDN, distributed cache, invalidation, stampede control, and warming.',
    icon: '🌍',
    accent: 'border-teal-500/40 bg-teal-500/5',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    ids: [
      'content-delivery-network-cdn',
      'distributed-caching',
      'cache-invalidation',
      'cache-stampede',
      'cache-warming',
    ],
  },
];

// ─── Communication learning path sub-category definitions ────────────────────
const COMMUNICATION_SUBCATEGORIES: {
  key: string;
  label: string;
  description: string;
  icon: string;
  accent: string;
  badgeColor: string;
  ids: string[];
}[] = [
  {
    key: 'real-time',
    label: 'Real-Time Communication',
    description: 'Learn browser and service patterns for live updates: long polling, webhooks, SSE, WebSockets, and WebRTC.',
    icon: '📡',
    accent: 'border-pink-500/40 bg-pink-500/5',
    badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    ids: ['long-polling', 'webhooks', 'server-sent-events', 'websockets', 'webrtc'],
  },
  {
    key: 'async',
    label: 'Asynchronous Communication',
    description: 'Decouple services with async design, queues, pub/sub, CDC, delivery guarantees, and dead letter queues.',
    icon: '📬',
    accent: 'border-orange-500/40 bg-orange-500/5',
    badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    ids: [
      'sync-vs-async-communication',
      'message-queues',
      'pub-sub',
      'change-data-capture-cdc',
      'delivery-semantics',
      'dead-letter-queues',
    ],
  },
];

// ─── API Fundamentals learning path sub-category definitions ─────────────────
const API_SUBCATEGORIES: {
  key: string;
  label: string;
  description: string;
  icon: string;
  accent: string;
  badgeColor: string;
  ids: string[];
}[] = [
  {
    key: 'design',
    label: 'API Design',
    description: 'Start with API basics, idempotency, data formats, REST design, architectural styles, GraphQL, and gRPC.',
    icon: '📐',
    accent: 'border-yellow-500/40 bg-yellow-500/5',
    badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    ids: [
      'what-is-an-api',
      'idempotency',
      'data-formats',
      'rest-api-design',
      'api-architectural-styles',
      'graphql',
      'grpc',
    ],
  },
  {
    key: 'infrastructure',
    label: 'API Infrastructure',
    description: 'Protect and route production APIs with rate limiting and API gateways.',
    icon: '🚪',
    accent: 'border-orange-500/40 bg-orange-500/5',
    badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    ids: ['rate-limiting', 'api-gateways'],
  },
  {
    key: 'security',
    label: 'API Security',
    description: 'Secure API access with authentication, authorization, sessions, tokens, JWT, SSO, and OAuth 2.0.',
    icon: '🔐',
    accent: 'border-red-500/40 bg-red-500/5',
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30',
    ids: ['authentication-authorization', 'session-vs-token-auth', 'jwt', 'sso', 'oauth-oauth2'],
  },
];

const SECTION_ICONS: Record<string, string> = {
  'Introduction': '🏁',
  'Core Concepts': '🧠',
  'Load Balancing': '⚖️',
  'API Fundamentals': '🔌',
  'Communication Patterns': '📡',
  'Caching': '⚡',
  'Databases': '🗄️',
  'Database Scaling': '📊',
  'Architectural Patterns': '🏛️',
};

const DIFFICULTIES: (Difficulty | 'all')[] = ['all', 'beginner', 'intermediate', 'advanced'];

// ─────────────────────────────────────────────────────────────────────────────
// Module card with collapsible subtopic dropdown
// ─────────────────────────────────────────────────────────────────────────────

function ModuleCard({
  mod,
  index,
  defaultOpen,
}: {
  mod: Module;
  index: number;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const { getModuleProgress, isLessonComplete } = useProgressStore();
  const progress = getModuleProgress(mod.lessons.map((l) => l.id));
  const completedCount = mod.lessons.filter((l) => isLessonComplete(l.id)).length;
  const inProgress = progress > 0 && progress < 100;
  const done = progress === 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`rounded-xl border bg-gray-900/60 transition-colors ${
        done
          ? 'border-emerald-500/40 hover:border-emerald-400/60'
          : inProgress
          ? 'border-brand-500/40 hover:border-brand-400/60'
          : 'border-gray-800 hover:border-gray-700'
      }`}
    >
      {/* Card header — clickable to expand */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left p-4 sm:p-5 group"
        aria-expanded={open}
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 transition-transform group-hover:scale-110 ${
              done ? 'bg-emerald-500/15' : inProgress ? 'bg-brand-500/15' : 'bg-gray-800'
            }`}
          >
            {mod.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-white font-bold text-base sm:text-lg">{mod.title}</h3>
              <DifficultyBadge difficulty={mod.difficulty} />
              {done && (
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ✓ done
                </span>
              )}
              {inProgress && (
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  in progress
                </span>
              )}
            </div>
            <p className="text-brand-400 text-xs font-medium mb-1.5">{mod.subtitle}</p>
            <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">{mod.description}</p>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span>⏱ {mod.estimatedTime} min</span>
              <span>📝 {mod.lessons.length} subtopic{mod.lessons.length !== 1 ? 's' : ''}</span>
              <span className={done ? 'text-emerald-300' : inProgress ? 'text-brand-300' : ''}>
                {completedCount} / {mod.lessons.length} complete
              </span>
            </div>

            <div className="mt-2 max-w-md">
              <ProgressBar
                value={progress}
                size="sm"
                showPercent={false}
                color={done ? 'success' : 'brand'}
              />
            </div>
          </div>

          {/* Chevron */}
          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 w-7 h-7 rounded-full border border-gray-700 bg-gray-900 flex items-center justify-center text-gray-300 group-hover:border-brand-400 group-hover:text-brand-300"
            aria-hidden
          >
            ▾
          </motion.div>
        </div>
      </button>

      {/* Expanded subtopic list */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-gray-800"
          >
            <div className="p-4 sm:p-5 space-y-2">
              {mod.realWorldAnalogy && (
                <div className="rounded-lg border border-pink-500/20 bg-pink-500/5 p-3 mb-3">
                  <p className="text-[10px] uppercase tracking-wider text-pink-300 font-semibold mb-1">
                    💡 Real-world analogy
                  </p>
                  <p className="text-xs text-gray-300 leading-relaxed">{mod.realWorldAnalogy}</p>
                </div>
              )}

              {mod.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {mod.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">
                Subtopics
              </p>
              <ol className="space-y-1.5">
                {mod.lessons.map((lesson, li) => {
                  const lessonDone = isLessonComplete(lesson.id);
                  return (
                    <li key={lesson.id}>
                      <Link
                        to={`/module/${mod.id}#${lesson.id}`}
                        className={`group flex items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                          lessonDone
                            ? 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-400/50'
                            : 'border-gray-800 bg-gray-900/40 hover:border-brand-400 hover:bg-gray-900'
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-mono ${
                            lessonDone
                              ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                              : 'border-gray-700 text-gray-500 group-hover:border-brand-400 group-hover:text-brand-300'
                          }`}
                        >
                          {lessonDone ? '✓' : li + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-sm font-medium ${
                                lessonDone ? 'text-emerald-100' : 'text-gray-200 group-hover:text-white'
                              }`}
                            >
                              {lesson.title}
                            </span>
                            <LessonTypeIcon type={lesson.type} />
                          </div>
                          <p className="mt-0.5 text-xs text-gray-500 leading-relaxed line-clamp-1">
                            {lesson.description}
                          </p>
                        </div>
                        <span className="flex-shrink-0 text-xs text-gray-500 self-center">
                          {lesson.duration}m
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>

              <div className="pt-3 mt-3 border-t border-gray-800 flex flex-wrap items-center gap-2">
                <Link
                  to={`/module/${mod.id}`}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 text-white text-sm font-semibold transition-colors"
                >
                  {inProgress ? 'Continue learning' : done ? 'Revisit module' : 'Start module'}
                  <span aria-hidden>→</span>
                </Link>
                {progress > 0 && (
                  <span className="text-xs text-gray-500">{progress}% completed</span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-category group (used inside Database Scaling)
// ─────────────────────────────────────────────────────────────────────────────

function SubCategoryGroup({
  label,
  description,
  icon,
  accent,
  badgeColor,
  modules,
  expandedModuleIds,
  defaultOpen,
}: {
  label: string;
  description?: string;
  icon: string;
  accent: string;
  badgeColor: string;
  modules: Module[];
  expandedModuleIds: Set<string>;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const { getModuleProgress } = useProgressStore();
  const doneCount = modules.filter(
    (m) => getModuleProgress(m.lessons.map((l) => l.id)) === 100
  ).length;
  const pct = modules.length ? Math.round((doneCount / modules.length) * 100) : 0;

  return (
    <div className={`rounded-xl border ${accent} overflow-hidden`}>
      {/* Sub-category header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors group"
        aria-expanded={open}
      >
        <span className="text-lg">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-sm font-bold text-white">{label}</span>
            <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeColor}`}>
              {modules.length} module{modules.length !== 1 ? 's' : ''}
            </span>
            {doneCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                {doneCount}/{modules.length} done
              </span>
            )}
          </div>
          {description && (
            <p className="mt-1 text-xs text-gray-400 leading-relaxed">{description}</p>
          )}
          <div className="mt-1.5 max-w-xs">
            <ProgressBar value={pct} size="sm" showPercent={false} color={pct === 100 ? 'success' : 'brand'} />
          </div>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.18 }}
          className="flex-shrink-0 w-6 h-6 rounded-full border border-gray-700 bg-gray-900 flex items-center justify-center text-gray-400 text-xs group-hover:border-gray-600"
          aria-hidden
        >
          ▾
        </motion.span>
      </button>

      {/* Module list */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-white/5"
          >
            <div className="px-3 pb-3 pt-2 space-y-2">
              {modules.map((mod, i) => (
                <ModuleCard
                  key={mod.id}
                  mod={mod}
                  index={i}
                  defaultOpen={expandedModuleIds.has(mod.id)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section accordion
// ─────────────────────────────────────────────────────────────────────────────

function Section({
  name,
  modules,
  open,
  onToggle,
  expandedModuleIds,
}: {
  name: string;
  modules: Module[];
  open: boolean;
  onToggle: () => void;
  expandedModuleIds: Set<string>;
}) {
  const { getModuleProgress } = useProgressStore();
  const sectionDone = modules.filter(
    (m) => getModuleProgress(m.lessons.map((l) => l.id)) === 100
  ).length;
  const sectionPct = modules.length
    ? Math.round((sectionDone / modules.length) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-gray-800 bg-gray-950/40 overflow-hidden"
    >
      <button
        onClick={onToggle}
        className="w-full text-left px-4 sm:px-5 py-4 flex items-center gap-3 hover:bg-gray-900/40 transition-colors"
        aria-expanded={open}
      >
        <span className="text-2xl">{SECTION_ICONS[name] ?? '📘'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-white">{name}</h2>
            <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">
              {modules.length} topic{modules.length !== 1 ? 's' : ''}
            </span>
            {sectionDone > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                {sectionDone}/{modules.length} done
              </span>
            )}
          </div>
          <div className="mt-2 max-w-md">
            <ProgressBar value={sectionPct} size="sm" showPercent={false} color={sectionPct === 100 ? 'success' : 'brand'} />
          </div>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 w-7 h-7 rounded-full border border-gray-700 bg-gray-900 flex items-center justify-center text-gray-300"
          aria-hidden
        >
          ▾
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-3 sm:px-5 pb-5 pt-1 space-y-3">
              {name === 'Core Concepts' && (
                <Link
                  to="/case-study/paybank"
                  className="block rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 via-brand-500/5 to-transparent p-4 hover:border-cyan-400/60 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">🏦</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-white font-bold">Case Study: Build PayBank (UPI-style bank)</h3>
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-500/30">
                          Interactive
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                        See all 8 Core Concepts applied to one real product, with interactive visualizations + a practice challenge to crack interview questions.
                      </p>
                      <div className="mt-2 text-xs font-medium text-cyan-300">Open case study →</div>
                    </div>
                  </div>
                </Link>
              )}

              {name === 'Architectural Patterns' && (
                <Link
                  to="/case-study/streamcart"
                  className="block rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent p-4 hover:border-purple-400/60 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">🎬</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-white font-bold">Case Study: StreamCart (live-video e-commerce)</h3>
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-500/30">
                          Interactive
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                        Client-server, monolith evolution, event-driven fan-out, CORS, serverless pipelines — all six patterns in one real enterprise architecture. Includes an interview exercise.
                      </p>
                      <div className="mt-2 text-xs font-medium text-purple-300">Open case study →</div>
                    </div>
                  </div>
                </Link>
              )}

              {name === 'API Fundamentals' && (
                <div className="space-y-3">
                  <div className="grid lg:grid-cols-3 gap-3">
                    <Link
                      to="/case-study/api-design"
                      className="block rounded-xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-transparent p-4 hover:border-yellow-400/60 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">🏦</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-white font-bold">Case Study: PayBank API design</h3>
                            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-200 border border-yellow-500/30">
                              Design
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                            Banking API contracts using REST, GraphQL, data formats, styles, and idempotency.
                          </p>
                          <div className="mt-2 text-xs font-medium text-yellow-300">Open case study →</div>
                        </div>
                      </div>
                    </Link>
                    <Link
                      to="/case-study/api-infrastructure"
                      className="block rounded-xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent p-4 hover:border-orange-400/60 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">🚪</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-white font-bold">Case Study: PayBank API edge</h3>
                            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-200 border border-orange-500/30">
                              Infrastructure
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                            Gateway routing and rate limiting protecting enterprise banking APIs.
                          </p>
                          <div className="mt-2 text-xs font-medium text-orange-300">Open case study →</div>
                        </div>
                      </div>
                    </Link>
                    <Link
                      to="/case-study/api-security"
                      className="block rounded-xl border border-red-500/30 bg-gradient-to-br from-red-500/10 via-rose-500/5 to-transparent p-4 hover:border-red-400/60 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">🔐</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-white font-bold">Case Study: PayBank identity layer</h3>
                            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/20 text-red-200 border border-red-500/30">
                              Security
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                            Authentication, authorization, sessions, JWT, SSO, and OAuth in one corporate login flow.
                          </p>
                          <div className="mt-2 text-xs font-medium text-red-300">Open case study →</div>
                        </div>
                      </div>
                    </Link>
                  </div>

                  <div className="rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-3">
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <span className="text-lg">📐</span>
                        <div>
                          <p className="font-semibold text-yellow-300 text-xs uppercase tracking-wider">API Design</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">What is API · Idempotency · Data formats · REST · Styles · GraphQL</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <span className="text-lg">🚪</span>
                        <div>
                          <p className="font-semibold text-orange-300 text-xs uppercase tracking-wider">API Infrastructure</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">Rate limiting · API gateway</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <span className="text-lg">🔐</span>
                        <div>
                          <p className="font-semibold text-red-300 text-xs uppercase tracking-wider">API Security</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">Authn vs authz · Sessions · JWT · SSO · OAuth 2.0</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {name === 'Communication Patterns' && (
                <div className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Link
                      to="/case-study/realtime-communication"
                      className="block rounded-xl border border-pink-500/30 bg-gradient-to-br from-pink-500/10 via-rose-500/5 to-transparent p-4 hover:border-pink-400/60 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">💬</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-white font-bold">Case Study: CollabDesk live workspace</h3>
                            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-200 border border-pink-500/30">
                              Real-time
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                            Enterprise collaboration app using long polling, webhooks, SSE, WebSockets, and WebRTC with animated flows.
                          </p>
                          <div className="mt-2 text-xs font-medium text-pink-300">Open case study →</div>
                        </div>
                      </div>
                    </Link>
                    <Link
                      to="/case-study/asynchronous-communication"
                      className="block rounded-xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent p-4 hover:border-orange-400/60 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">🚚</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-white font-bold">Case Study: OrderFlow async commerce</h3>
                            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-200 border border-orange-500/30">
                              Async
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                            Enterprise order pipeline using sync vs async, queues, pub/sub, CDC, delivery guarantees, and DLQs.
                          </p>
                          <div className="mt-2 text-xs font-medium text-orange-300">Open case study →</div>
                        </div>
                      </div>
                    </Link>
                  </div>

                  <div className="rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <span className="text-lg">📡</span>
                        <div>
                          <p className="font-semibold text-pink-300 text-xs uppercase tracking-wider">Real-Time Communication</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">Long polling · Webhooks · Server events · WebSocket · WebRTC</p>
                        </div>
                      </div>
                      <div className="hidden sm:block w-px h-8 bg-gray-700" />
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <span className="text-lg">📬</span>
                        <div>
                          <p className="font-semibold text-orange-300 text-xs uppercase tracking-wider">Asynchronous Communication</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">Sync vs async · Message queues · Pub/Sub · CDC · Dead letter queues</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {name === 'Load Balancing' && (
                <Link
                  to="/case-study/quickeats"
                  className="block rounded-xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-yellow-500/5 to-transparent p-4 hover:border-orange-400/60 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">🍕</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-white font-bold">Case Study: QuickEats (food-delivery rush)</h3>
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-200 border border-orange-500/30">
                          Interactive
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                        Every Load Balancing subtopic — L4 vs L7, the 5 algorithms, health checks, sticky sessions, DNS LB, anycast — applied to a Friday-night surge. Includes an on-call exercise.
                      </p>
                      <div className="mt-2 text-xs font-medium text-orange-300">Open case study →</div>
                    </div>
                  </div>
                </Link>
              )}

              {name === 'Database Scaling' && (
                <div className="space-y-3">
                  <div className="rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-3 flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="text-lg">📖</span>
                      <div>
                        <p className="font-semibold text-indigo-300 text-xs uppercase tracking-wider">Scaling Reads</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">Indexing · Query optimisation · Read replicas · Connection pooling</p>
                      </div>
                    </div>
                    <div className="hidden sm:block w-px h-8 bg-gray-700" />
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="text-lg">✍️</span>
                      <div>
                        <p className="font-semibold text-violet-300 text-xs uppercase tracking-wider">Scaling Writes</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">Partitioning · Sharding · Compression</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Link
                      to="/case-study/flipkart-reads"
                      className="block rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-blue-500/5 to-transparent p-4 hover:border-indigo-400/60 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">🛍️</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-white font-bold">Case Study: Flipkart Read Scaling</h3>
                            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-500/30">
                              Reads
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                            500M SKUs, 5M QPS — indexing, query optimisation, read replicas &amp; connection pooling in one enterprise flow.
                          </p>
                          <div className="mt-2 text-xs font-medium text-indigo-300">Open case study →</div>
                        </div>
                      </div>
                    </Link>
                    <Link
                      to="/case-study/swiggy-writes"
                      className="block rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent p-4 hover:border-violet-400/60 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">🛵</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-white font-bold">Case Study: Swiggy Write Scaling</h3>
                            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-200 border border-violet-500/30">
                              Writes
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                            3M orders/day, 80TB — partitioning, sharding &amp; compression powering Swiggy's order system at scale.
                          </p>
                          <div className="mt-2 text-xs font-medium text-violet-300">Open case study →</div>
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              )}

              {name === 'Databases' && (
                <div className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Link
                      to="/case-study/database-fundamentals"
                      className="block rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-cyan-500/5 to-transparent p-4 hover:border-emerald-400/60 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">🏦</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-white font-bold">Case Study: PayBank database foundation</h3>
                            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-500/30">
                              Fundamentals
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                            Enterprise banking flow covering database types, SQL vs NoSQL, and ACID decisions.
                          </p>
                          <div className="mt-2 text-xs font-medium text-emerald-300">Open case study →</div>
                        </div>
                      </div>
                    </Link>
                    <Link
                      to="/case-study/database-in-depth"
                      className="block rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 via-violet-500/5 to-transparent p-4 hover:border-cyan-400/60 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">🛒</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-white font-bold">Case Study: ShopSphere polyglot persistence</h3>
                            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-500/30">
                              In depth
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                            Enterprise commerce architecture using relational, document, key-value, graph, vector, and search stores.
                          </p>
                          <div className="mt-2 text-xs font-medium text-cyan-300">Open case study →</div>
                        </div>
                      </div>
                    </Link>
                  </div>

                  <div className="rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <span className="text-lg">🧱</span>
                        <div>
                          <p className="font-semibold text-emerald-300 text-xs uppercase tracking-wider">Fundamentals</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">Types · SQL vs NoSQL · ACID properties</p>
                        </div>
                      </div>
                      <div className="hidden sm:block w-px h-8 bg-gray-700" />
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <span className="text-lg">🔬</span>
                        <div>
                          <p className="font-semibold text-cyan-300 text-xs uppercase tracking-wider">In Depth</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">Relational · Document · Key-value · Graph · Vector · Specialized</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {name === 'Caching' && (
                <div className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Link
                      to="/case-study/caching-fundamentals"
                      className="block rounded-xl border border-lime-500/30 bg-gradient-to-br from-lime-500/10 via-emerald-500/5 to-transparent p-4 hover:border-lime-400/60 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">🛍️</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-white font-bold">Case Study: FlashCart product page caching</h3>
                            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-lime-500/20 text-lime-200 border border-lime-500/30">
                              Fundamentals
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                            Enterprise flash-sale flow using cache-aside, read/write-through, write-behind, strategies, and eviction choices.
                          </p>
                          <div className="mt-2 text-xs font-medium text-lime-300">Open case study →</div>
                        </div>
                      </div>
                    </Link>
                    <Link
                      to="/case-study/distributed-caching"
                      className="block rounded-xl border border-teal-500/30 bg-gradient-to-br from-teal-500/10 via-cyan-500/5 to-transparent p-4 hover:border-teal-400/60 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">🎬</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-white font-bold">Case Study: StreamNow global cache platform</h3>
                            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-200 border border-teal-500/30">
                              Distributed
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                            Enterprise media architecture covering CDN, distributed cache, invalidation, stampede prevention, and warming.
                          </p>
                          <div className="mt-2 text-xs font-medium text-teal-300">Open case study →</div>
                        </div>
                      </div>
                    </Link>
                  </div>

                  <div className="rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <span className="text-lg">📚</span>
                        <div>
                          <p className="font-semibold text-lime-300 text-xs uppercase tracking-wider">Fundamentals</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">What is caching · Cache-aside · Read/write-through · Write-behind · Strategies · Eviction</p>
                        </div>
                      </div>
                      <div className="hidden sm:block w-px h-8 bg-gray-700" />
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <span className="text-lg">🌍</span>
                        <div>
                          <p className="font-semibold text-teal-300 text-xs uppercase tracking-wider">Distributed Caching</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">CDN · Distributed architecture · Invalidation · Stampede · Warming</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {name === 'API Fundamentals' ? (
                API_SUBCATEGORIES.map((sub) => {
                  const subMods = sub.ids
                    .map((id) => modules.find((m) => m.id === id))
                    .filter(Boolean) as Module[];
                  if (subMods.length === 0) return null;
                  return (
                    <SubCategoryGroup
                      key={sub.key}
                      label={sub.label}
                      description={sub.description}
                      icon={sub.icon}
                      accent={sub.accent}
                      badgeColor={sub.badgeColor}
                      modules={subMods}
                      expandedModuleIds={expandedModuleIds}
                      defaultOpen={true}
                    />
                  );
                })
              ) : name === 'Communication Patterns' ? (
                COMMUNICATION_SUBCATEGORIES.map((sub) => {
                  const subMods = sub.ids
                    .map((id) => modules.find((m) => m.id === id))
                    .filter(Boolean) as Module[];
                  if (subMods.length === 0) return null;
                  return (
                    <SubCategoryGroup
                      key={sub.key}
                      label={sub.label}
                      description={sub.description}
                      icon={sub.icon}
                      accent={sub.accent}
                      badgeColor={sub.badgeColor}
                      modules={subMods}
                      expandedModuleIds={expandedModuleIds}
                      defaultOpen={true}
                    />
                  );
                })
              ) : name === 'Caching' ? (
                CACHING_SUBCATEGORIES.map((sub) => {
                  const subMods = sub.ids
                    .map((id) => modules.find((m) => m.id === id))
                    .filter(Boolean) as Module[];
                  if (subMods.length === 0) return null;
                  return (
                    <SubCategoryGroup
                      key={sub.key}
                      label={sub.label}
                      description={sub.description}
                      icon={sub.icon}
                      accent={sub.accent}
                      badgeColor={sub.badgeColor}
                      modules={subMods}
                      expandedModuleIds={expandedModuleIds}
                      defaultOpen={true}
                    />
                  );
                })
              ) : name === 'Databases' ? (
                DATABASE_SUBCATEGORIES.map((sub) => {
                  const subMods = sub.ids
                    .map((id) => modules.find((m) => m.id === id))
                    .filter(Boolean) as Module[];
                  if (subMods.length === 0) return null;
                  return (
                    <SubCategoryGroup
                      key={sub.key}
                      label={sub.label}
                      description={sub.description}
                      icon={sub.icon}
                      accent={sub.accent}
                      badgeColor={sub.badgeColor}
                      modules={subMods}
                      expandedModuleIds={expandedModuleIds}
                      defaultOpen={true}
                    />
                  );
                })
              ) : name === 'Database Scaling' ? (
                // Render sub-categories for Database Scaling
                DB_SCALING_SUBCATEGORIES.map((sub) => {
                  const subMods = sub.ids
                    .map((id) => modules.find((m) => m.id === id))
                    .filter(Boolean) as Module[];
                  if (subMods.length === 0) return null;
                  return (
                    <SubCategoryGroup
                      key={sub.key}
                      label={sub.label}
                      description={undefined}
                      icon={sub.icon}
                      accent={sub.accent}
                      badgeColor={sub.badgeColor}
                      modules={subMods}
                      expandedModuleIds={expandedModuleIds}
                      defaultOpen={true}
                    />
                  );
                })
              ) : (
                modules.map((mod, i) => (
                  <ModuleCard
                    key={mod.id}
                    mod={mod}
                    index={i}
                    defaultOpen={expandedModuleIds.has(mod.id)}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function ModulesPage() {
  const sectionMap = getModulesBySection();
  const sections = SECTION_ORDER.filter((s) => sectionMap[s]);

  const [query, setQuery] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty | 'all'>('all');
  const [openSections, setOpenSections] = useState<Set<string>>(() => new Set(sections));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out: Record<string, Module[]> = {};
    let total = 0;
    for (const s of sections) {
      const mods = (sectionMap[s] ?? []).filter((m) => {
        if (difficulty !== 'all' && m.difficulty !== difficulty) return false;
        if (!q) return true;
        return (
          m.title.toLowerCase().includes(q) ||
          m.subtitle.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.tags.some((t) => t.toLowerCase().includes(q)) ||
          m.lessons.some((l) => l.title.toLowerCase().includes(q))
        );
      });
      if (mods.length) {
        out[s] = mods;
        total += mods.length;
      }
    }
    return { bySection: out, total };
  }, [sectionMap, sections, query, difficulty]);

  // When the user is searching, expand any section that has matches and
  // also expand the matched modules' subtopics so the match is visible.
  const expandedModuleIds = useMemo(() => {
    if (!query.trim()) return new Set<string>();
    const ids = new Set<string>();
    for (const s of Object.keys(filtered.bySection)) {
      for (const m of filtered.bySection[s]) ids.add(m.id);
    }
    return ids;
  }, [query, filtered]);

  const visibleSections = Object.keys(filtered.bySection);
  const effectiveOpen = query.trim()
    ? new Set(visibleSections)
    : openSections;

  function toggleSection(name: string) {
    setOpenSections((s) => {
      const next = new Set(s);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function expandAll() {
    setOpenSections(new Set(sections));
  }
  function collapseAll() {
    setOpenSections(new Set());
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">All Modules</h1>
        <p className="text-gray-400">
          {Object.values(sectionMap).flat().length} topics across {sections.length} sections — choose any topic and start building your system design intuition.
        </p>
      </motion.div>

      {/* Toolbar: search + difficulty + expand controls */}
      <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 mb-6 bg-gray-950/80 backdrop-blur border-y border-gray-800">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" aria-hidden>
              🔎
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search modules, subtopics, or tags…"
              className="w-full pl-9 pr-9 py-2.5 rounded-lg bg-gray-900 border border-gray-800 focus:border-brand-400 focus:outline-none text-sm text-gray-100 placeholder:text-gray-500"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-200 px-1.5"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Difficulty filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors ${
                  difficulty === d
                    ? 'border-brand-400 bg-brand-500/20 text-brand-200'
                    : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600 hover:text-gray-200'
                }`}
              >
                {d === 'all' ? 'All levels' : d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>

          {/* Expand controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={expandAll}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-600 hover:text-white whitespace-nowrap"
            >
              Expand all
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-600 hover:text-white whitespace-nowrap"
            >
              Collapse all
            </button>
          </div>
        </div>

        {(query || difficulty !== 'all') && (
          <p className="mt-2 text-xs text-gray-500">
            {filtered.total} match{filtered.total !== 1 ? 'es' : ''}
            {query && <> for "<span className="text-gray-300">{query}</span>"</>}
            {difficulty !== 'all' && <> · {difficulty}</>}
          </p>
        )}
      </div>

      {/* Sections */}
      {filtered.total === 0 ? (
        <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-10 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-gray-300 font-semibold">No modules match your filters.</p>
          <p className="text-gray-500 text-sm mt-1">Try a different keyword or clear the difficulty filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleSections.map((sectionName) => (
            <Section
              key={sectionName}
              name={sectionName}
              modules={filtered.bySection[sectionName]}
              open={effectiveOpen.has(sectionName)}
              onToggle={() => toggleSection(sectionName)}
              expandedModuleIds={expandedModuleIds}
            />
          ))}
        </div>
      )}
    </div>
  );
}
