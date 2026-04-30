import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { modules } from '../data/modules';
import { useProgressStore } from '../store/useProgressStore';
import ProgressBar from '../components/Common/ProgressBar';
import DifficultyBadge from '../components/Common/DifficultyBadge';
import LessonTypeIcon from '../components/Common/LessonTypeIcon';

export default function ModulesPage() {
  const { getModuleProgress } = useProgressStore();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">All Modules</h1>
        <p className="text-gray-400">Choose a topic and start building your system design intuition.</p>
      </motion.div>

      <div className="flex flex-col gap-5">
        {modules.map((mod, i) => {
          const progress = getModuleProgress(mod.lessons.map((l) => l.id));
          return (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Link to={`/module/${mod.id}`} className="card-hover p-6 block group">
                <div className="flex flex-col sm:flex-row gap-5">
                  {/* Icon */}
                  <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-110 transition-transform">
                    {mod.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h2 className="text-white font-bold text-xl">{mod.title}</h2>
                      <DifficultyBadge difficulty={mod.difficulty} />
                    </div>
                    <p className="text-brand-400 text-sm font-medium mb-2">{mod.subtitle}</p>
                    <p className="text-gray-400 text-sm leading-relaxed mb-3">{mod.description}</p>

                    {/* Lesson types */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {mod.lessons.map((lesson) => (
                        <LessonTypeIcon key={lesson.id} type={lesson.type} />
                      ))}
                    </div>

                    {/* Progress + meta */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 max-w-xs">
                        <ProgressBar value={progress} size="sm" showPercent={false} />
                      </div>
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span>⏱ {mod.estimatedTime} min</span>
                        <span>📝 {mod.lessons.length} lessons</span>
                        <span className="text-brand-400 font-medium">{progress}% done</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
