import { motion } from 'framer-motion';

interface Props {
  value: number; // 0-100
  label?: string;
  color?: 'brand' | 'success' | 'warning';
  showPercent?: boolean;
  size?: 'sm' | 'md';
}

const colorMap = {
  brand:   'bg-brand-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
};

export default function ProgressBar({
  value,
  label,
  color = 'brand',
  showPercent = true,
  size = 'md',
}: Props) {
  const h = size === 'sm' ? 'h-1.5' : 'h-2.5';
  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex items-center justify-between mb-1.5 text-sm">
          {label && <span className="text-gray-400">{label}</span>}
          {showPercent && <span className="text-gray-300 font-medium">{value}%</span>}
        </div>
      )}
      <div className={`w-full ${h} bg-gray-800 rounded-full overflow-hidden`}>
        <motion.div
          className={`${h} ${colorMap[color]} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
