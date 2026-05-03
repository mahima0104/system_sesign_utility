import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PatternStep, PatternVisualization } from '../../types';

interface Props {
  visualization: PatternVisualization;
  steps: PatternStep[];
}

export default function StepAnimation({ visualization, steps }: Props) {
  const [stepIdx, setStepIdx] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);

  const step = steps[stepIdx];
  const highlights = new Set(step?.highlight ?? []);

  useEffect(() => {
    if (!autoPlay) return;
    const id = setInterval(() => {
      setStepIdx((i) => {
        if (i >= steps.length - 1) {
          setAutoPlay(false);
          return i;
        }
        return i + 1;
      });
    }, 2200);
    return () => clearInterval(id);
  }, [autoPlay, steps.length]);

  const next = () => {
    setAutoPlay(false);
    setStepIdx((i) => Math.min(i + 1, steps.length - 1));
  };
  const prev = () => {
    setAutoPlay(false);
    setStepIdx((i) => Math.max(i - 1, 0));
  };
  const reset = () => {
    setAutoPlay(false);
    setStepIdx(0);
  };

  return (
    <div className="space-y-4">
      {/* Diagram */}
      <div className="card p-5">
        <div className="relative w-full aspect-[2/1] bg-gray-950 rounded-xl border border-gray-800 overflow-hidden">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
            {/* Relations (lines first so they sit beneath nodes) */}
            {visualization.relations.map((rel, i) => {
              const from = visualization.entities.find((e) => e.id === rel.from);
              const to = visualization.entities.find((e) => e.id === rel.to);
              if (!from || !to) return null;
              const active = highlights.has(rel.from) && highlights.has(rel.to);
              return (
                <g key={i}>
                  <motion.line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={active ? '#60a5fa' : '#374151'}
                    strokeWidth={active ? 0.5 : 0.3}
                    strokeDasharray={active ? '0' : '1,1'}
                    initial={false}
                    animate={{
                      stroke: active ? '#60a5fa' : '#374151',
                      strokeWidth: active ? 0.5 : 0.3,
                    }}
                    transition={{ duration: 0.4 }}
                    vectorEffect="non-scaling-stroke"
                  />
                  {rel.label && active && (
                    <motion.text
                      x={(from.x + to.x) / 2}
                      y={(from.y + to.y) / 2 - 1.5}
                      textAnchor="middle"
                      className="fill-brand-400"
                      style={{ fontSize: '2.4px' }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {rel.label}
                    </motion.text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Entities (positioned absolutely as percentages so labels render in HTML, not SVG text) */}
          {visualization.entities.map((entity) => {
            const active = highlights.has(entity.id);
            return (
              <motion.div
                key={entity.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{ left: `${entity.x}%`, top: `${entity.y}%` }}
                animate={{
                  scale: active ? 1.08 : 1,
                }}
                transition={{ type: 'spring', stiffness: 250, damping: 20 }}
              >
                <motion.div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl border-2 transition-colors"
                  animate={{
                    backgroundColor: active ? entity.color ?? '#2563eb' : '#1f2937',
                    borderColor: active ? entity.color ?? '#2563eb' : '#374151',
                    boxShadow: active
                      ? `0 0 24px ${entity.color ?? '#2563eb'}66`
                      : '0 0 0 rgba(0,0,0,0)',
                  }}
                >
                  {entity.icon ?? '⬛'}
                </motion.div>
                <span
                  className={`mt-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md transition-colors ${
                    active ? 'text-white bg-gray-800' : 'text-gray-400'
                  }`}
                >
                  {entity.label}
                </span>
              </motion.div>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-3 text-center italic">
          {visualization.caption}
        </p>
      </div>

      {/* Step description */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-mono">
              Step {stepIdx + 1} / {steps.length}
            </span>
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setAutoPlay(false);
                    setStepIdx(i);
                  }}
                  className={`h-1.5 rounded-full transition-all ${
                    i === stepIdx ? 'w-6 bg-brand-500' : 'w-1.5 bg-gray-700 hover:bg-gray-600'
                  }`}
                  aria-label={`Jump to step ${i + 1}`}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setAutoPlay((p) => !p)}
              className="text-xs px-3 py-1 rounded-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 transition-colors"
            >
              {autoPlay ? '⏸ Pause' : '▶ Auto'}
            </button>
            <button
              onClick={reset}
              className="text-xs px-2 py-1 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
            >
              ⟳
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={stepIdx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <h4 className="text-white font-semibold mb-1.5">{step.title}</h4>
            <p className="text-sm text-gray-300 leading-relaxed">{step.description}</p>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-800">
          <button
            onClick={prev}
            disabled={stepIdx === 0}
            className="text-xs px-3 py-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            ← Previous
          </button>
          <button
            onClick={next}
            disabled={stepIdx === steps.length - 1}
            className="text-xs px-3 py-1.5 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-500 disabled:opacity-40 disabled:hover:bg-brand-600 transition-colors"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
