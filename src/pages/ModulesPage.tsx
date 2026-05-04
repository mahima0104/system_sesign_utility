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
  icon,
  accent,
  badgeColor,
  modules,
  expandedModuleIds,
  defaultOpen,
}: {
  label: string;
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
              )}

              {name === 'Database Scaling' ? (
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
