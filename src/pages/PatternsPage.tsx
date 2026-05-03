import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  patterns,
  getPatternsByCategory,
  PATTERN_CATEGORY_ORDER,
  PATTERN_CATEGORY_DESCRIPTIONS,
} from '../data/patterns';
import DifficultyBadge from '../components/Common/DifficultyBadge';

const CATEGORY_ICONS: Record<string, string> = {
  Creational: '🏗️',
  Structural: '🧱',
  Behavioral: '🔄',
};

export default function PatternsPage() {
  const grouped = getPatternsByCategory();
  const visibleCategories = PATTERN_CATEGORY_ORDER.filter((c) => grouped[c]?.length);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Design Patterns</h1>
        <p className="text-gray-400 max-w-2xl">
          {patterns.length} patterns across {visibleCategories.length} categories. Each pattern includes a
          definition, the problem it solves, a real-life analogy, an interactive animation, runnable code, and
          interview prep.
        </p>
      </motion.div>

      <div className="space-y-12">
        {visibleCategories.map((category, categoryIdx) => {
          const categoryPatterns = grouped[category] ?? [];
          return (
            <motion.section
              key={category}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIdx * 0.08 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{CATEGORY_ICONS[category]}</span>
                <h2 className="text-xl font-bold text-white">{category}</h2>
                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                  {categoryPatterns.length} pattern{categoryPatterns.length !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-4 max-w-2xl">
                {PATTERN_CATEGORY_DESCRIPTIONS[category]}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categoryPatterns.map((pattern, i) => (
                  <motion.div
                    key={pattern.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: categoryIdx * 0.08 + i * 0.05 }}
                  >
                    <Link
                      to={`/patterns/${pattern.id}`}
                      className="card-hover p-5 block h-full group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gray-800 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                          {pattern.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="text-white font-bold text-lg">{pattern.name}</h3>
                            <DifficultyBadge difficulty={pattern.difficulty} />
                          </div>
                          <p className="text-brand-400 text-xs font-medium mb-1.5">
                            {pattern.tagline}
                          </p>
                          <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">
                            {pattern.definition}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          );
        })}
      </div>

      {/* Footer note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 p-5 rounded-2xl border border-dashed border-gray-800 text-center"
      >
        <p className="text-sm text-gray-500">
          More patterns coming soon — Factory, Strategy, Decorator, Adapter and the rest of the GoF catalogue.
        </p>
      </motion.div>
    </div>
  );
}
