import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { QuizQuestion } from '../../types';

interface Props {
  questions: QuizQuestion[];
  quizId: string;
  onComplete?: (score: number) => void;
}

export default function QuizCard({ questions, quizId: _quizId, onComplete }: Props) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null));
  const [finished, setFinished] = useState(false);

  const q = questions[current];
  const answered = selected !== null;
  const correct = selected === q.correctIndex;

  const score = answers.reduce<number>(
    (acc, ans, i) => (ans === questions[i].correctIndex ? acc + 1 : acc),
    0
  );
  const pct = Math.round((score / questions.length) * 100);

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    const next = [...answers];
    next[current] = idx;
    setAnswers(next);
  };

  const handleNext = () => {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      setSelected(null);
    } else {
      setFinished(true);
      onComplete?.(pct);
    }
  };

  if (finished) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center"
      >
        <div className="text-5xl mb-4">{pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '📖'}</div>
        <h3 className="text-2xl font-bold text-white mb-2">
          {pct >= 80 ? 'Excellent!' : pct >= 50 ? 'Good work!' : 'Keep learning!'}
        </h3>
        <p className="text-gray-400 mb-6">
          You scored <span className="text-brand-400 font-semibold">{score}/{questions.length}</span> ({pct}%)
        </p>
        <div className="w-full bg-gray-800 rounded-full h-3 mb-6">
          <motion.div
            className="h-3 rounded-full bg-brand-500"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <button
          onClick={() => { setCurrent(0); setSelected(null); setAnswers(Array(questions.length).fill(null)); setFinished(false); }}
          className="btn-secondary"
        >
          Retry Quiz
        </button>
      </motion.div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-400">Question {current + 1} of {questions.length}</span>
        <div className="flex gap-1.5">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-6 rounded-full transition-colors ${
                i < current ? 'bg-brand-500' : i === current ? 'bg-brand-400' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          <p className="text-white font-semibold text-lg mb-5 leading-relaxed">{q.question}</p>

          <div className="space-y-3">
            {q.options.map((opt, i) => {
              let style = 'border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800';
              if (answered) {
                if (i === q.correctIndex)        style = 'border-success-500 bg-success-500/10 text-success-300';
                else if (i === selected)         style = 'border-danger-500 bg-danger-500/10 text-danger-300';
                else                             style = 'border-gray-700 bg-gray-800/30 opacity-50';
              }
              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  disabled={answered}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all duration-150 flex items-center gap-3 ${style}`}
                >
                  <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {answered && i === q.correctIndex ? '✓' : answered && i === selected && !correct ? '✗' : String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          <AnimatePresence>
            {answered && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`mt-4 p-4 rounded-xl text-sm ${correct ? 'bg-success-500/10 border border-success-500/30 text-success-300' : 'bg-red-500/10 border border-red-500/30 text-red-300'}`}
              >
                <span className="font-semibold">{correct ? '✓ Correct! ' : '✗ Not quite. '}</span>
                {q.explanation}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      {answered && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleNext}
          className="btn-primary mt-5 w-full"
        >
          {current < questions.length - 1 ? 'Next Question →' : 'See Results →'}
        </motion.button>
      )}
    </div>
  );
}
