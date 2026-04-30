import type { Lesson } from '../../types';

const icons: Record<Lesson['type'], { icon: string; label: string; className: string }> = {
  concept:   { icon: '📖', label: 'Concept',   className: 'bg-blue-500/10 text-blue-400'   },
  demo:      { icon: '🎮', label: 'Demo',      className: 'bg-purple-500/10 text-purple-400' },
  quiz:      { icon: '🧠', label: 'Quiz',      className: 'bg-yellow-500/10 text-yellow-400' },
  challenge: { icon: '🏆', label: 'Challenge', className: 'bg-orange-500/10 text-orange-400' },
};

export default function LessonTypeIcon({ type }: { type: Lesson['type'] }) {
  const { icon, label, className } = icons[type];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md ${className}`}>
      {icon} {label}
    </span>
  );
}
