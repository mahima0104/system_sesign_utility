import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProgressStore } from '../../store/useProgressStore';

const XpBadge = () => {
  const xp = useProgressStore((s) => s.totalXp);
  return (
    <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-3 py-1">
      <span className="text-yellow-400 text-sm font-bold">⚡</span>
      <span className="text-yellow-300 text-sm font-semibold">{xp} XP</span>
    </div>
  );
};

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/modules', label: 'Modules' },
  { to: '/interview-prep', label: 'Interview Prep' },
  { to: '/patterns', label: 'Patterns' },
  { to: '/kafka', label: 'Kafka' },
  { to: '/progress', label: 'Progress' },
];

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-sm group-hover:bg-brand-500 transition-colors">
            SD
          </div>
          <span className="font-semibold text-white hidden sm:block">
            System<span className="text-brand-400">Design</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {navLinks.map(({ to, label }) => {
            const active = pathname === to || (to !== '/' && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  active ? 'text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-gray-800 rounded-lg"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className="relative z-10">{label}</span>
              </Link>
            );
          })}
        </nav>

        <XpBadge />
      </div>
    </header>
  );
}
