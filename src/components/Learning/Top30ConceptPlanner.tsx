import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getTop30Totals, top30ConceptGroups, type Top30Concept, type Top30ConceptGroup } from '../../data/top30Concepts';
import { useProgressStore } from '../../store/useProgressStore';
import ProgressBar from '../Common/ProgressBar';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getGroupProgress(
  group: Top30ConceptGroup,
  getConceptProgress: (conceptId: string, subTopics: string[]) => number
) {
  if (!group.concepts.length) return 0;
  const done = group.concepts.reduce((sum, c) => sum + getConceptProgress(c.id, c.subTopics), 0);
  return Math.round(done / group.concepts.length);
}

function groupOf(concept: Top30Concept) {
  return top30ConceptGroups.find((g) => g.concepts.some((c) => c.id === concept.id));
}

// ─────────────────────────────────────────────────────────────────────────────
// ConceptPlannerRow — single concept accordion row
// ─────────────────────────────────────────────────────────────────────────────

function ConceptPlannerRow({
  concept,
  index,
  isOpen,
  onToggle,
  showGroupBadge = false,
}: {
  concept: Top30Concept;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  showGroupBadge?: boolean;
}) {
  const {
    conceptProgress,
    toggleConceptSubTopic,
    setConceptConfidence,
    setConceptMemo,
    getConceptProgress,
  } = useProgressStore();

  const saved = conceptProgress[concept.id];
  const completed = saved?.completedSubTopics ?? [];
  const confidence = saved?.confidence ?? 0;
  const memo = saved?.memo ?? '';
  const progress = getConceptProgress(concept.id, concept.subTopics);
  const group = showGroupBadge ? groupOf(concept) : null;

  return (
    <div
      className={`overflow-hidden rounded-xl border transition-all ${
        isOpen
          ? 'border-pink-500/60 bg-pink-500/[0.06] shadow-lg shadow-pink-500/10'
          : 'border-gray-800 bg-gray-900/75 hover:border-cyan-400/40'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-4 transition-colors hover:bg-white/[0.03]"
        aria-expanded={isOpen}
      >
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span
              className={`mt-0.5 w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                isOpen ? 'bg-pink-500 text-white shadow-md shadow-pink-500/30' : 'bg-gray-800 text-cyan-300'
              }`}
            >
              {isOpen ? '✦' : String(index).padStart(2, '0')}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-white font-semibold">{concept.title}</h3>
                {group && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-gray-700 bg-gray-800 text-gray-400">
                    {group.icon} {group.title}
                  </span>
                )}
                <span className="text-[11px] text-pink-200 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-full">
                  ⏱ {concept.estimatedMinutes} min
                </span>
                {progress === 100 && (
                  <span className="text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    ✓ ready
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mt-1">{concept.interviewFocus}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:w-[380px] flex-shrink-0">
            <div className="rounded-lg border border-gray-800 bg-gray-950/60 p-3">
              <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1.5">
                <span>🔥 Confidence</span>
                <span className="text-pink-300">{confidence}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-400 to-yellow-300 transition-all"
                  style={{ width: `${confidence}%` }}
                />
              </div>
            </div>
            <div className="rounded-lg border border-gray-800 bg-gray-950/60 p-3">
              <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1.5">
                <span>✅ Progress</span>
                <span className="text-cyan-300">{progress}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-pink-500/20 p-4 bg-gray-950/50">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-pink-300 mb-3">
                🧩 Check subtopics
              </p>
              <div className="space-y-2">
                {concept.subTopics.map((subTopic) => {
                  const done = completed.includes(subTopic);
                  return (
                    <label
                      key={subTopic}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors ${
                        done
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                          : 'border-gray-800 bg-gray-900/80 text-gray-300 hover:border-pink-400/40'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={done}
                        onChange={() => toggleConceptSubTopic(concept.id, subTopic)}
                        className="w-4 h-4 accent-pink-500"
                      />
                      <span className={done ? 'line-through decoration-emerald-300/60' : ''}>{subTopic}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-gray-800 bg-gray-900/70 p-4">
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor={`${concept.id}-confidence`}
                    className="text-xs font-semibold uppercase tracking-wide text-pink-300"
                  >
                    💪 Interview confidence
                  </label>
                  <span className="text-xs text-gray-300">{confidence}% ready</span>
                </div>
                <input
                  id={`${concept.id}-confidence`}
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={confidence}
                  onChange={(e) => setConceptConfidence(concept.id, Number(e.target.value))}
                  className="w-full accent-pink-500"
                />
              </div>

              <div>
                <label
                  htmlFor={`${concept.id}-memo`}
                  className="text-xs font-semibold uppercase tracking-wide text-pink-300 block mb-2"
                >
                  📝 Quick memo
                </label>
                <textarea
                  id={`${concept.id}-memo`}
                  value={memo}
                  onChange={(e) => setConceptMemo(concept.id, e.target.value)}
                  placeholder="Write your doubt, interview answer, example, or revision note..."
                  rows={4}
                  className="w-full resize-y rounded-xl border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
                />
              </div>

              {concept.moduleId && (
                <Link
                  to={`/module/${concept.moduleId}`}
                  className="inline-flex rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-200 hover:border-cyan-300 hover:text-white transition-colors"
                >
                  🚀 Open full lesson
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// View mode types
// ─────────────────────────────────────────────────────────────────────────────

type ViewMode = 'tracks' | 'weakest5' | 'shuffle3';

// ─────────────────────────────────────────────────────────────────────────────
// Main planner
// ─────────────────────────────────────────────────────────────────────────────

export default function Top30ConceptPlanner() {
  const [activeGroupId, setActiveGroupId] = useState(top30ConceptGroups[0].id);
  const [expandedConceptId, setExpandedConceptId] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('tracks');
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [search, setSearch] = useState('');

  const { getConceptProgress, conceptProgress } = useProgressStore();
  const totals = getTop30Totals();

  const activeGroup = top30ConceptGroups.find((g) => g.id === activeGroupId) ?? top30ConceptGroups[0];
  const overallProgress = Math.round(
    top30ConceptGroups.reduce((sum, g) => sum + getGroupProgress(g, getConceptProgress), 0) /
      top30ConceptGroups.length
  );
  const activeGroupProgress = getGroupProgress(activeGroup, getConceptProgress);

  // All concepts flat list with confidence attached
  const allConcepts = useMemo(
    () => top30ConceptGroups.flatMap((g) => g.concepts),
    []
  );

  // Weakest 5: sort by confidence ascending, pick top 5
  const weakest5 = useMemo(() => {
    return [...allConcepts]
      .sort((a, b) => {
        const ca = conceptProgress[a.id]?.confidence ?? 0;
        const cb = conceptProgress[b.id]?.confidence ?? 0;
        return ca - cb;
      })
      .slice(0, 5);
  }, [allConcepts, conceptProgress]);

  // Shuffle 3: deterministic-by-seed so re-shuffle gives different set
  const shuffle3 = useMemo(() => {
    const seeded = [...allConcepts].sort((a, b) => {
      const ha = simpleHash(a.id + shuffleSeed);
      const hb = simpleHash(b.id + shuffleSeed);
      return ha - hb;
    });
    return seeded.slice(0, 3);
  }, [allConcepts, shuffleSeed]);

  // Track-mode search filter
  const filteredConcepts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeGroup.concepts;
    return activeGroup.concepts.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.interviewFocus.toLowerCase().includes(q) ||
        c.subTopics.some((s) => s.toLowerCase().includes(q))
    );
  }, [activeGroup.concepts, search]);

  function toggleConcept(id: string) {
    setExpandedConceptId((cur) => (cur === id ? '' : id));
  }

  // Derive what to render
  const renderConcepts =
    viewMode === 'weakest5'
      ? weakest5
      : viewMode === 'shuffle3'
      ? shuffle3
      : filteredConcepts;

  const showGroupBadge = viewMode === 'weakest5' || viewMode === 'shuffle3';

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="mb-10"
    >
      <div className="relative overflow-hidden rounded-2xl border border-pink-500/30 bg-gray-950 p-5 sm:p-6 shadow-2xl shadow-pink-500/10">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-pink-500 via-cyan-400 to-emerald-400" />

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row lg:items-end gap-5 mb-6">
          <div className="flex-1">
            <p className="text-pink-300 text-sm font-semibold mb-2">✨ Interview readiness board</p>
            <h2 className="text-2xl font-bold text-white mb-2">Learn the 30 concepts in 6 clean tracks</h2>
            <p className="text-gray-400 leading-relaxed max-w-3xl">
              Open a topic, check off subtopics, set your confidence, and keep tiny revision notes beside each concept.
            </p>
          </div>
          <div className="lg:w-80 rounded-xl border border-pink-500/20 bg-pink-500/10 p-4">
            <ProgressBar
              value={overallProgress}
              label={`${totals.concepts} concepts · ${totals.subTopics} subtopics`}
              color={overallProgress === 100 ? 'success' : 'brand'}
            />
          </div>
        </div>

        {/* ── Mode switcher ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 mb-4 p-3 rounded-xl border border-gray-800 bg-gray-900/50">
          <span className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mr-1 hidden sm:inline">
            View
          </span>

          <button
            onClick={() => { setViewMode('tracks'); setExpandedConceptId(''); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              viewMode === 'tracks'
                ? 'border-pink-400 bg-pink-500/20 text-pink-200'
                : 'border-gray-700 bg-gray-900 text-gray-400 hover:text-gray-200'
            }`}
          >
            📚 All tracks
          </button>

          <button
            onClick={() => { setViewMode('weakest5'); setExpandedConceptId(''); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              viewMode === 'weakest5'
                ? 'border-red-400 bg-red-500/20 text-red-200'
                : 'border-gray-700 bg-gray-900 text-gray-400 hover:text-gray-200'
            }`}
          >
            🎯 Weakest 5
          </button>

          <button
            onClick={() => {
              setViewMode('shuffle3');
              setShuffleSeed((s) => s + 1);
              setExpandedConceptId('');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              viewMode === 'shuffle3'
                ? 'border-yellow-400 bg-yellow-500/20 text-yellow-200'
                : 'border-gray-700 bg-gray-900 text-gray-400 hover:text-gray-200'
            }`}
          >
            🎲 Shuffle 3
          </button>

          {viewMode === 'shuffle3' && (
            <button
              onClick={() => { setShuffleSeed((s) => s + 1); setExpandedConceptId(''); }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20 transition-colors"
            >
              ↺ New 3
            </button>
          )}

          {/* Search — only useful in track mode */}
          {viewMode === 'tracks' && (
            <div className="relative ml-auto">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs">🔎</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search concepts…"
                className="pl-7 pr-7 py-1.5 rounded-lg bg-gray-950 border border-gray-700 focus:border-pink-500 focus:outline-none text-xs text-gray-100 placeholder:text-gray-600 w-44"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-200 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Mode banners ──────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {viewMode === 'weakest5' && (
            <motion.div
              key="weakest5-banner"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 flex flex-wrap items-center justify-between gap-2"
            >
              <div>
                <p className="text-sm font-semibold text-red-200">🎯 Weakest 5 — ranked by lowest confidence</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Raise the slider on each after you revise it to move it out of this list.
                </p>
              </div>
              <button
                onClick={() => { setViewMode('tracks'); setExpandedConceptId(''); }}
                className="text-xs text-gray-400 hover:text-gray-200 border border-gray-700 px-3 py-1.5 rounded-lg"
              >
                ← Back to tracks
              </button>
            </motion.div>
          )}

          {viewMode === 'shuffle3' && (
            <motion.div
              key="shuffle3-banner"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mb-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 flex flex-wrap items-center justify-between gap-2"
            >
              <div>
                <p className="text-sm font-semibold text-yellow-200">🎲 Mock-interview shuffle — 3 random concepts</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Open each, spend ~5 min explaining it aloud, then check your subtopics. Click "New 3" to rotate.
                </p>
              </div>
              <button
                onClick={() => { setViewMode('tracks'); setExpandedConceptId(''); }}
                className="text-xs text-gray-400 hover:text-gray-200 border border-gray-700 px-3 py-1.5 rounded-lg"
              >
                ← Back to tracks
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Track tabs (only in track mode) ──────────────────────────────── */}
        {viewMode === 'tracks' && (
          <>
            <div
              className="grid sm:grid-cols-2 lg:grid-cols-6 gap-2 mb-6"
              role="tablist"
              aria-label="Top 30 concept groups"
            >
              {top30ConceptGroups.map((group) => {
                const isActive = group.id === activeGroup.id;
                const progress = getGroupProgress(group, getConceptProgress);
                return (
                  <button
                    key={group.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => {
                      setActiveGroupId(group.id);
                      setExpandedConceptId('');
                      setSearch('');
                    }}
                    className={`rounded-xl border px-3 py-3 text-left transition-all ${
                      isActive
                        ? 'border-pink-400 bg-pink-500/15 text-white shadow-lg shadow-pink-500/10'
                        : 'border-gray-800 bg-gray-900/70 text-gray-400 hover:border-cyan-400/50 hover:text-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{group.icon}</span>
                      <span className="text-sm font-semibold">{group.title}</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-pink-500 to-cyan-400 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-gray-500 mt-1">{progress}% complete</div>
                  </button>
                );
              })}
            </div>

            <div className="mb-5 flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-gray-800 bg-gray-900/60 p-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>{activeGroup.icon}</span>
                  {activeGroup.title}
                </h3>
                <p className="text-sm text-gray-400 mt-1">{activeGroup.description}</p>
              </div>
              <div className="sm:w-60">
                <ProgressBar
                  value={activeGroupProgress}
                  size="sm"
                  label="Track progress"
                  color={activeGroupProgress === 100 ? 'success' : 'brand'}
                />
              </div>
            </div>
          </>
        )}

        {/* ── Concept list ──────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {renderConcepts.length === 0 && (
            <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-8 text-center">
              <p className="text-gray-400">No concepts match "<span className="text-gray-200">{search}</span>"</p>
              <button onClick={() => setSearch('')} className="mt-2 text-xs text-cyan-300 hover:text-cyan-200">
                Clear search
              </button>
            </div>
          )}
          {renderConcepts.map((concept, idx) => (
            <ConceptPlannerRow
              key={concept.id}
              concept={concept}
              index={idx + 1}
              isOpen={expandedConceptId === concept.id}
              onToggle={() => toggleConcept(concept.id)}
              showGroupBadge={showGroupBadge}
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function simpleHash(str: string | number): number {
  const s = String(str);
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}
