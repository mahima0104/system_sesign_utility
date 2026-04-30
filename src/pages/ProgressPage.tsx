import { motion } from 'framer-motion';
import { modules } from '../data/modules';
import { useProgressStore } from '../store/useProgressStore';
import ProgressBar from '../components/Common/ProgressBar';
import { Link } from 'react-router-dom';

export default function ProgressPage() {
  const { totalXp, completedLessons, quizScores, getModuleProgress, reset } = useProgressStore();

  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const overallPct = totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0;
  const avgQuizScore = Object.values(quizScores).length
    ? Math.round(Object.values(quizScores).reduce((a, b) => a + b, 0) / Object.values(quizScores).length)
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white mb-1">Your Progress</h1>
        <p className="text-gray-400 mb-8">Keep going — every lesson builds your system design intuition.</p>
      </motion.div>

      {/* Top stats */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10"
      >
        {[
          { label: 'Total XP',        value: `${totalXp}`,          icon: '⚡', color: 'text-yellow-400' },
          { label: 'Lessons Done',    value: `${completedLessons.length}/${totalLessons}`, icon: '✅', color: 'text-green-400' },
          { label: 'Avg Quiz Score',  value: avgQuizScore !== null ? `${avgQuizScore}%` : '—', icon: '🧠', color: 'text-blue-400' },
          { label: 'Completion',      value: `${overallPct}%`,       icon: '🎯', color: 'text-purple-400' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="card p-5 text-center">
            <div className="text-3xl mb-2">{icon}</div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </motion.div>

      {/* Overall progress */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="card p-6 mb-8"
      >
        <h2 className="text-white font-semibold mb-4">Overall Completion</h2>
        <ProgressBar value={overallPct} label={`${completedLessons.length} of ${totalLessons} lessons complete`} color="success" />
      </motion.div>

      {/* Module breakdown */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="card p-6 mb-8"
      >
        <h2 className="text-white font-semibold mb-5">Module Breakdown</h2>
        <div className="space-y-5">
          {modules.map((mod) => {
            const pct = getModuleProgress(mod.lessons.map((l) => l.id));
            return (
              <div key={mod.id}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">{mod.icon}</span>
                  <span className="text-gray-300 font-medium flex-1">{mod.title}</span>
                  <Link to={`/module/${mod.id}`} className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                    {pct === 0 ? 'Start →' : pct === 100 ? '✓ Complete' : 'Continue →'}
                  </Link>
                </div>
                <ProgressBar value={pct} size="sm" color={pct === 100 ? 'success' : 'brand'} />
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Quiz scores */}
      {Object.keys(quizScores).length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="card p-6 mb-8"
        >
          <h2 className="text-white font-semibold mb-4">Quiz Scores</h2>
          <div className="space-y-2">
            {Object.entries(quizScores).map(([id, score]) => (
              <div key={id} className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{id}</span>
                <span className={`font-semibold ${score >= 80 ? 'text-success-400' : score >= 50 ? 'text-warning-400' : 'text-danger-400'}`}>
                  {score}%
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Reset */}
      <div className="text-center">
        <button
          onClick={() => { if (window.confirm('Reset all progress?')) reset(); }}
          className="btn-ghost text-sm text-gray-600 hover:text-red-400"
        >
          Reset all progress
        </button>
      </div>
    </div>
  );
}
