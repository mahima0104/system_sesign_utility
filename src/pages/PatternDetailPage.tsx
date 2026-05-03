import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getPattern } from '../data/patterns';
import DifficultyBadge from '../components/Common/DifficultyBadge';
import StepAnimation from '../components/Common/StepAnimation';
import InteractiveCode from '../components/Patterns/InteractiveCode';

interface SectionProps {
  icon: string;
  title: string;
  children: React.ReactNode;
  delay?: number;
}

function Section({ icon, title, children, delay = 0 }: SectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="space-y-3"
    >
      <h2 className="flex items-center gap-2 text-lg font-bold text-white">
        <span className="text-xl">{icon}</span>
        {title}
      </h2>
      <div>{children}</div>
    </motion.section>
  );
}

export default function PatternDetailPage() {
  const { patternId } = useParams<{ patternId: string }>();
  const pattern = getPattern(patternId ?? '');

  if (!pattern) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold text-white mb-3">Pattern not found</h2>
        <Link to="/patterns" className="btn-primary">
          Back to Patterns
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/patterns" className="hover:text-gray-300 transition-colors">
          Patterns
        </Link>
        <span>/</span>
        <span className="text-gray-300">{pattern.category}</span>
        <span>/</span>
        <span className="text-white">{pattern.name}</span>
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-7 mb-8"
      >
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gray-800 flex items-center justify-center text-4xl flex-shrink-0">
            {pattern.icon}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                {pattern.category} Pattern
              </span>
              <DifficultyBadge difficulty={pattern.difficulty} />
            </div>
            <h1 className="text-3xl font-bold text-white mb-1.5">{pattern.name}</h1>
            <p className="text-brand-400 font-medium">{pattern.tagline}</p>
          </div>
        </div>
      </motion.div>

      {/* Sections */}
      <div className="space-y-10">
        {/* 1. Definition */}
        <Section icon="📖" title="Definition" delay={0.05}>
          <div className="card p-5 bg-gradient-to-br from-brand-500/5 to-transparent border-brand-500/20">
            <p className="text-gray-200 leading-relaxed text-base">{pattern.definition}</p>
          </div>
        </Section>

        {/* 2. Problem */}
        <Section icon="❓" title="The Problem" delay={0.08}>
          <p className="text-gray-300 leading-relaxed">{pattern.problem}</p>
        </Section>

        {/* 3. Why Needed */}
        <Section icon="💡" title="Why We Need It" delay={0.1}>
          <p className="text-gray-300 leading-relaxed">{pattern.whyNeeded}</p>
        </Section>

        {/* 4. Real-Life Analogy */}
        <Section icon="🌍" title="Real-Life Analogy" delay={0.12}>
          <div className="rounded-2xl p-5 bg-yellow-500/5 border border-yellow-500/20">
            <p className="text-gray-200 leading-relaxed italic">{pattern.realLifeAnalogy}</p>
          </div>
        </Section>

        {/* 5 & 6. Visualization + Step-by-Step Animation */}
        <Section icon="🎬" title="Visualization & Step-by-Step Animation" delay={0.14}>
          <p className="text-sm text-gray-400 mb-4">
            Click <strong className="text-brand-400">▶ Auto</strong> or step through manually to see how the
            pattern unfolds.
          </p>
          <StepAnimation
            visualization={pattern.visualization}
            steps={pattern.animationSteps}
          />
        </Section>

        {/* 7. Code Example — Interactive Console */}
        <Section icon="💻" title="Interactive Code Example" delay={0.16}>
          <InteractiveCode
            starter={pattern.codeExample.starter}
            description={pattern.codeExample.description}
          />
        </Section>

        {/* 8. Industry Use Cases */}
        <Section icon="🏢" title="Real Industry Use Cases" delay={0.18}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pattern.industryUseCases.map((uc, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.04 }}
                className="card p-4"
              >
                <h4 className="text-white font-semibold text-sm mb-1.5">{uc.company}</h4>
                <p className="text-xs text-gray-400 leading-relaxed">{uc.description}</p>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* 9. Interview Question */}
        <Section icon="🎤" title="Interview Question" delay={0.22}>
          <details className="card p-5 group">
            <summary className="cursor-pointer list-none flex items-start gap-3">
              <span className="text-brand-400 text-sm font-semibold mt-0.5">Q:</span>
              <span className="text-gray-200 leading-relaxed flex-1">
                {pattern.interviewQuestion.question}
              </span>
              <span className="text-gray-500 group-open:rotate-180 transition-transform text-xs ml-2">
                ▾
              </span>
            </summary>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mt-4 pt-4 border-t border-gray-800 flex items-start gap-3"
            >
              <span className="text-green-400 text-sm font-semibold mt-0.5">A:</span>
              <p className="text-gray-300 text-sm leading-relaxed flex-1">
                {pattern.interviewQuestion.answer}
              </p>
            </motion.div>
          </details>
        </Section>

        {/* 10. Common Mistakes */}
        <Section icon="⚠️" title="Common Mistakes" delay={0.24}>
          <ul className="space-y-2">
            {pattern.commonMistakes.map((mistake, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.26 + i * 0.04 }}
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
      </div>

      {/* Bottom nav */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-12 pt-6 border-t border-gray-800 flex justify-between items-center"
      >
        <Link
          to="/patterns"
          className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
        >
          ← Back to all patterns
        </Link>
      </motion.div>
    </div>
  );
}
