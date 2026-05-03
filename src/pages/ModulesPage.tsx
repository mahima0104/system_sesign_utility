import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getModulesBySection, SECTION_ORDER } from '../data/modules';
import { useProgressStore } from '../store/useProgressStore';
import ProgressBar from '../components/Common/ProgressBar';
import DifficultyBadge from '../components/Common/DifficultyBadge';
import LessonTypeIcon from '../components/Common/LessonTypeIcon';

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

export default function ModulesPage() {
  const { getModuleProgress } = useProgressStore();
  const sectionMap = getModulesBySection();

  const sections = SECTION_ORDER.filter((s) => sectionMap[s]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">All Modules</h1>
        <p className="text-gray-400">
          {Object.values(sectionMap).flat().length} topics across {sections.length} sections — choose any topic and start building your system design intuition.
        </p>
      </motion.div>

      <div className="space-y-12">
        {sections.map((sectionName, sectionIdx) => {
          const sectionModules = sectionMap[sectionName] ?? [];
          return (
            <motion.div
              key={sectionName}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIdx * 0.05 }}
            >
              {/* Section header */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{SECTION_ICONS[sectionName] ?? '📘'}</span>
                <h2 className="text-xl font-bold text-white">{sectionName}</h2>
                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                  {sectionModules.length} topic{sectionModules.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex flex-col gap-4 pl-1">
                {sectionModules.map((mod, i) => {
                  const progress = getModuleProgress(mod.lessons.map((l) => l.id));
                  return (
                    <motion.div
                      key={mod.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: sectionIdx * 0.05 + i * 0.04 }}
                    >
                      <Link to={`/module/${mod.id}`} className="card-hover p-5 block group">
                        <div className="flex flex-col sm:flex-row gap-4">
                          {/* Icon */}
                          <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                            {mod.icon}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="text-white font-bold text-lg">{mod.title}</h3>
                              <DifficultyBadge difficulty={mod.difficulty} />
                            </div>
                            <p className="text-brand-400 text-xs font-medium mb-1">{mod.subtitle}</p>
                            <p className="text-gray-400 text-sm leading-relaxed mb-3 line-clamp-2">{mod.description}</p>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {mod.tags.slice(0, 4).map((tag) => (
                                <span key={tag} className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>

                            {/* Lesson type icons */}
                            <div className="flex flex-wrap gap-2 mb-3">
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
                                <span>📝 {mod.lessons.length} lesson{mod.lessons.length !== 1 ? 's' : ''}</span>
                                {progress > 0 && (
                                  <span className="text-brand-400 font-medium">{progress}% done</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
