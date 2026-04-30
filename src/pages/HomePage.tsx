import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { modules } from '../data/modules';
import { useProgressStore } from '../store/useProgressStore';
import ProgressBar from '../components/Common/ProgressBar';
import DifficultyBadge from '../components/Common/DifficultyBadge';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.4 } }),
};

export default function HomePage() {
  const { getModuleProgress, totalXp, completedLessons } = useProgressStore();

  const stats = [
    { label: 'XP Earned', value: totalXp, icon: '⚡' },
    { label: 'Lessons Done', value: completedLessons.length, icon: '✅' },
    { label: 'Modules', value: modules.length, icon: '📦' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-14"
      >
        <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/30 text-brand-300 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          🎓 Visual System Design Learning
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold text-white mb-5 tracking-tight leading-none">
          Learn System Design<br />
          <span className="text-brand-400">Visually</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Interactive diagrams, real-world analogies, and hands-on demos. No jargon — just clear,
          visual explanations anyone can understand.
        </p>
        <div className="flex flex-wrap gap-3 justify-center mt-8">
          <Link to="/modules" className="btn-primary text-base px-7 py-3">
            Start Learning →
          </Link>
          <Link to="/modules" className="btn-secondary text-base px-7 py-3">
            Browse Modules
          </Link>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-3 gap-4 mb-12 max-w-lg mx-auto"
      >
        {stats.map(({ label, value, icon }) => (
          <div key={label} className="card p-4 text-center">
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </motion.div>

      {/* Module grid */}
      <div>
        <h2 className="section-heading mb-6">Learning Modules</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-5">
          {modules.map((mod, i) => {
            const progress = getModuleProgress(mod.lessons.map((l) => l.id));
            return (
              <motion.div
                key={mod.id}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
              >
                <Link to={`/module/${mod.id}`} className="card-hover p-6 flex flex-col gap-4 block group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                        {mod.icon}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-lg leading-tight">{mod.title}</h3>
                        <p className="text-gray-500 text-sm">{mod.subtitle}</p>
                      </div>
                    </div>
                    <DifficultyBadge difficulty={mod.difficulty} />
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">{mod.description}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {mod.tags.map((tag) => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-md bg-gray-800 text-gray-400 border border-gray-700">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="border-t border-gray-800 pt-4 flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <ProgressBar value={progress} size="sm" showPercent={false} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 flex-shrink-0">
                      <span>⏱ {mod.estimatedTime}min</span>
                      <span>{mod.lessons.length} lessons</span>
                      <span className="text-brand-400 font-medium">{progress > 0 ? `${progress}%` : 'Start →'}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Analogy callout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-12 card p-8 text-center"
      >
        <div className="text-4xl mb-3">🌍</div>
        <h3 className="text-xl font-bold text-white mb-2">Learning Through Analogies</h3>
        <p className="text-gray-400 max-w-xl mx-auto text-sm leading-relaxed">
          Every concept is explained through a real-world analogy first — coffee shops, libraries, highways.
          Once the mental model clicks, the technical details follow naturally.
        </p>
      </motion.div>
    </div>
  );
}
