import type { Difficulty } from '../../types';

interface Props { difficulty: Difficulty; }

const config: Record<Difficulty, { label: string; className: string }> = {
  beginner:     { label: 'Beginner',     className: 'bg-success-500/15 text-success-400 border border-success-500/30' },
  intermediate: { label: 'Intermediate', className: 'bg-warning-500/15 text-warning-400 border border-warning-500/30' },
  advanced:     { label: 'Advanced',     className: 'bg-danger-500/15  text-danger-400  border border-danger-500/30'  },
};

export default function DifficultyBadge({ difficulty }: Props) {
  const { label, className } = config[difficulty];
  return (
    <span className={`badge text-xs font-semibold ${className}`}>{label}</span>
  );
}
