import { motion } from 'framer-motion';
import type { ConceptDeepDive } from '../../types';

interface Props {
  concept: ConceptDeepDive;
}

interface SectionProps {
  num: number;
  icon: string;
  title: string;
  children: React.ReactNode;
  delay?: number;
}

function Section({ num, icon, title, children, delay = 0 }: SectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-mono text-gray-600 font-medium">
          {String(num).padStart(2, '0')}
        </span>
        <h2 className="flex items-center gap-2 text-xl font-bold text-white">
          <span>{icon}</span>
          {title}
        </h2>
      </div>
      <div className="pl-6">{children}</div>
    </motion.section>
  );
}

export default function ConceptDeepDiveView({ concept }: Props) {
  return (
    <div className="space-y-12 mt-2">
      {/* 1. Introduction (layman + analogy + why it matters) */}
      <Section num={1} icon="📖" title="Introduction" delay={0.05}>
        <div className="space-y-3">
          <div className="card p-5 bg-gradient-to-br from-brand-500/5 to-transparent border-brand-500/20">
            <h4 className="text-brand-400 text-xs font-semibold uppercase tracking-wide mb-2">
              In Plain English
            </h4>
            <p className="text-gray-200 leading-relaxed">{concept.introduction.layman}</p>
          </div>
          <div className="rounded-2xl p-5 bg-yellow-500/5 border border-yellow-500/20">
            <h4 className="text-yellow-400 text-xs font-semibold uppercase tracking-wide mb-2">
              Real-Life Analogy
            </h4>
            <p className="text-gray-200 leading-relaxed italic">{concept.introduction.analogy}</p>
          </div>
          <div className="rounded-2xl p-5 bg-purple-500/5 border border-purple-500/20">
            <h4 className="text-purple-400 text-xs font-semibold uppercase tracking-wide mb-2">
              Why It Matters
            </h4>
            <p className="text-gray-200 leading-relaxed">{concept.introduction.whyMatters}</p>
          </div>
        </div>
      </Section>

      {/* 2. Sub-topics */}
      <Section num={2} icon="🧩" title={`Sub-Topics (${concept.subTopics.length})`} delay={0.08}>
        <div className="space-y-4">
          {concept.subTopics.map((sub, i) => (
            <motion.div
              key={sub.title}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.02 }}
              className="card p-5"
            >
              <h3 className="text-white font-bold text-base mb-3 flex items-center gap-2">
                <span className="text-xl">{sub.icon}</span>
                <span>{sub.title}</span>
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-blue-400 font-semibold mb-1">
                    Plain English
                  </div>
                  <p className="text-gray-300 leading-relaxed">{sub.layman}</p>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-purple-400 font-semibold mb-1">
                    Technical Detail
                  </div>
                  <p className="text-gray-400 leading-relaxed">{sub.technical}</p>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-green-400 font-semibold mb-1">
                    Real-World Example
                  </div>
                  <p className="text-gray-300 leading-relaxed italic">{sub.example}</p>
                </div>
                {sub.whenToUse && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-yellow-400 font-semibold mb-1">
                      When To Use
                    </div>
                    <p className="text-gray-300 leading-relaxed">{sub.whenToUse}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* 3. Comparison table (optional) */}
      {concept.comparison && (
        <Section num={3} icon="⚖️" title="Quick Comparison" delay={0.12}>
          {concept.comparison.caption && (
            <p className="text-sm text-gray-400 mb-3">{concept.comparison.caption}</p>
          )}
          <div className="rounded-2xl overflow-hidden border border-gray-800 overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-900/60">
                <tr className="text-left text-[10px] text-gray-400 uppercase tracking-wide">
                  {concept.comparison.columns.map((col) => (
                    <th key={col} className="px-3 py-2 font-medium">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {concept.comparison.rows.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-900/30 transition-colors">
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className={
                          j === 0
                            ? 'px-3 py-2 text-white font-medium align-top whitespace-nowrap'
                            : 'px-3 py-2 text-gray-300 align-top'
                        }
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* 4. Real-world examples */}
      <Section num={concept.comparison ? 4 : 3} icon="🏢" title="Real-World Examples" delay={0.16}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {concept.realWorldExamples.map((ex) => (
            <div key={ex.company} className="card p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xl">{ex.icon}</span>
                <h4 className="text-white font-semibold text-sm">{ex.company}</h4>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{ex.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 5. Interview questions */}
      <Section
        num={concept.comparison ? 5 : 4}
        icon="🎤"
        title="Interview Questions"
        delay={0.2}
      >
        <p className="text-sm text-gray-400 mb-4 leading-relaxed">
          Practice answering these out loud — they\'re calibrated to what you\'d face in a real
          system-design interview.
        </p>
        <div className="space-y-2">
          {concept.interviewQuestions.map((qa, i) => (
            <details key={i} className="card p-4 group">
              <summary className="cursor-pointer list-none flex items-start gap-3">
                <span className="text-brand-400 text-sm font-semibold mt-0.5 flex-shrink-0">
                  Q{i + 1}.
                </span>
                <span className="text-gray-200 leading-relaxed flex-1">{qa.question}</span>
                <span className="text-gray-500 group-open:rotate-180 transition-transform text-xs ml-2 flex-shrink-0">
                  ▾
                </span>
              </summary>
              <div className="mt-3 pt-3 border-t border-gray-800 flex items-start gap-3">
                <span className="text-green-400 text-sm font-semibold mt-0.5 flex-shrink-0">A.</span>
                <p className="text-gray-300 text-sm leading-relaxed flex-1">{qa.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </Section>

      {/* 6. Common mistakes */}
      <Section
        num={concept.comparison ? 6 : 5}
        icon="⚠️"
        title="Common Mistakes"
        delay={0.24}
      >
        <ul className="space-y-2">
          {concept.commonMistakes.map((mistake, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.26 + i * 0.03 }}
              className="card p-3.5 flex items-start gap-3 border-red-500/20"
            >
              <span className="w-6 h-6 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              <p className="text-sm text-gray-300 leading-relaxed">{mistake}</p>
            </motion.li>
          ))}
        </ul>
      </Section>

      {/* 7. Reference metrics (optional) */}
      {concept.metrics && concept.metrics.length > 0 && (
        <Section
          num={concept.comparison ? 7 : 6}
          icon="📊"
          title="Reference Metrics"
          delay={0.28}
        >
          <div className="rounded-2xl overflow-hidden border border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-900/60">
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wide">
                  <th className="px-4 py-2.5 font-medium">Metric</th>
                  <th className="px-4 py-2.5 font-medium">Value</th>
                  <th className="px-4 py-2.5 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {concept.metrics.map((m) => (
                  <tr key={m.name} className="hover:bg-gray-900/30 transition-colors">
                    <td className="px-4 py-2.5 text-gray-200 font-medium">{m.name}</td>
                    <td className="px-4 py-2.5 font-mono text-brand-400 text-xs">{m.value}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{m.notes ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </div>
  );
}
