import { motion } from 'framer-motion';
import Top30ConceptPlanner from '../components/Learning/Top30ConceptPlanner';
import { getTop30Totals } from '../data/top30Concepts';
import { useProgressStore } from '../store/useProgressStore';

export default function InterviewPrepPage() {
  const totals = getTop30Totals();
  const conceptProgress = useProgressStore((s) => s.conceptProgress);

  // Quick stats for the hero strip.
  const entries = Object.values(conceptProgress ?? {});
  const trackedConcepts = entries.filter(
    (c) => c.completedSubTopics.length > 0 || c.confidence > 0 || c.memo.trim().length > 0
  ).length;
  const confident = entries.filter((c) => c.confidence >= 4).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-500/10 px-3 py-1 text-xs font-medium text-pink-200">
          🗂️ Interview prep workspace
        </div>
        <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold text-white">
          30-Concept Interview Planner
        </h1>
        <p className="mt-2 text-gray-400 leading-relaxed max-w-3xl">
          A workspace, not a lesson. Open each concept, check off subtopics as you cover them, set
          your confidence (1–5), and keep a one-line revision memo you'd want to glance at the night
          before the interview. Pair this with the lessons in <span className="text-cyan-300">Modules</span> —
          this page tracks <em>where you are</em>, not <em>what to read</em>.
        </p>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Stat label="Concepts" value={String(totals.concepts)} icon="✨" />
          <Stat label="Subtopics" value={String(totals.subTopics)} icon="🧩" />
          <Stat label="Tracked" value={`${trackedConcepts} / ${totals.concepts}`} icon="✅" />
          <Stat label="Confident (4★+)" value={`${confident}`} icon="💪" />
        </div>
      </motion.div>

      <Top30ConceptPlanner />
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/70 p-3">
      <div className="flex items-center justify-between">
        <span className="text-lg">{icon}</span>
        <span className="text-lg font-bold text-white">{value}</span>
      </div>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{label}</p>
    </div>
  );
}
