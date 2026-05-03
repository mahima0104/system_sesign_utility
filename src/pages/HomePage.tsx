import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { modules } from '../data/modules';
import { getTop30Totals } from '../data/top30Concepts';
import { useProgressStore } from '../store/useProgressStore';
import ProgressBar from '../components/Common/ProgressBar';

const top30Totals = getTop30Totals();

const learningAreas = [
  {
    title: 'Core System Design',
    description: 'Scalability, availability, reliability, CAP, consistency, caching, databases, and load balancing.',
    icon: '🧠',
    accent: 'from-pink-500 to-fuchsia-400',
    to: '/modules',
  },
  {
    title: 'Top 30 Interview Concepts',
    description: 'A focused checklist with 6 tracks, confidence bars, subtopics, and revision memos.',
    icon: '✨',
    accent: 'from-cyan-400 to-emerald-400',
    to: '/module/top-30-system-design-concepts',
  },
  {
    title: 'Design Patterns',
    description: 'Creational, structural, and behavioral patterns explained with examples and visuals.',
    icon: '🏛️',
    accent: 'from-violet-400 to-blue-400',
    to: '/patterns',
  },
  {
    title: 'Real-World Case Studies',
    description: 'Kafka and Uber-style event architecture walkthroughs for production system thinking.',
    icon: '🚀',
    accent: 'from-yellow-300 to-orange-400',
    to: '/kafka',
  },
];

const systemNodes = [
  { label: 'Client', detail: 'Browser / Mobile App', icon: '👤', color: 'border-pink-400/50 bg-pink-500/10 text-pink-100' },
  { label: 'DNS Resolution', detail: 'Find the server address', icon: '🌐', color: 'border-cyan-400/50 bg-cyan-500/10 text-cyan-100' },
  { label: 'CDN', detail: 'Static content cache', icon: '⚡', color: 'border-yellow-300/50 bg-yellow-500/10 text-yellow-100' },
  { label: 'Load Balancer', detail: 'Reverse proxy', icon: '⚖️', color: 'border-blue-400/50 bg-blue-500/10 text-blue-100' },
  { label: 'API Gateway', detail: 'Auth, routing, limits', icon: '🚪', color: 'border-violet-400/50 bg-violet-500/10 text-violet-100' },
  { label: 'App Servers', detail: 'Business logic', icon: '🖥️', color: 'border-fuchsia-400/50 bg-fuchsia-500/10 text-fuchsia-100' },
  { label: 'Cache Layer', detail: 'Fast repeated reads', icon: '📦', color: 'border-orange-300/50 bg-orange-500/10 text-orange-100' },
  { label: 'Database', detail: 'Source of truth', icon: '🗄️', color: 'border-emerald-400/50 bg-emerald-500/10 text-emerald-100' },
];

function AnimatedLearningMap() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-950 p-5 sm:p-6">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-pink-500 via-cyan-400 to-emerald-400" />
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(#1f2937_1px,transparent_1px),linear-gradient(90deg,#1f2937_1px,transparent_1px)] [background-size:42px_42px]" />

      <div className="relative z-10 mb-8 max-w-md rounded-xl border border-gray-800 bg-gray-900/80 p-3.5">
        <p className="text-sm font-semibold text-pink-200">How a request moves through a system</p>
        <p className="mt-1 text-xs leading-relaxed text-gray-500">Small visual hints make big ideas easier to remember.</p>
      </div>

      <div className="relative z-10 mx-auto flex max-w-md flex-col gap-1.5">
        {systemNodes.map((item, index) => (
          <div key={item.label}>
            <motion.div
              className={`flex min-h-[58px] items-center gap-3 rounded-xl border px-3 py-2.5 shadow-xl shadow-black/30 ${item.color}`}
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: index * 0.3 }}
            >
              <div className="text-xl leading-none">{item.icon}</div>
              <div>
                <div className="text-sm font-semibold">{item.label}</div>
                <div className="mt-0.5 text-[11px] leading-snug opacity-75">{item.detail}</div>
              </div>
            </motion.div>
            {index < systemNodes.length - 1 && (
              <motion.div
                className="mx-auto flex h-4 items-center justify-center text-lg font-bold text-cyan-300 drop-shadow-[0_0_12px_rgba(34,211,238,0.65)]"
                animate={{ opacity: [0.45, 1, 0.45] }}
                transition={{ duration: 1.6, repeat: Infinity, delay: index * 0.2 }}
              >
                ↓
              </motion.div>
            )}
          </div>
        ))}
      </div>

      <div className="relative z-10 mt-8 rounded-xl border border-pink-500/20 bg-pink-500/10 p-4">
        <p className="text-sm font-semibold text-pink-200">Visual first, theory second</p>
        <p className="mt-1 text-xs leading-relaxed text-gray-400">
          Follow the flow, understand the role of each component, then learn the interview trade-offs.
        </p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { totalXp, completedLessons } = useProgressStore();

  const totalLessons = modules.reduce((sum, mod) => sum + mod.lessons.length, 0);
  const completion = totalLessons ? Math.round((completedLessons.length / totalLessons) * 100) : 0;

  const stats = [
    { label: 'System Design Modules', value: modules.length, icon: '📦' },
    { label: 'Top Concepts', value: top30Totals.concepts, icon: '✨' },
    { label: 'Lessons Complete', value: completedLessons.length, icon: '✅' },
    { label: 'XP Earned', value: totalXp, icon: '⚡' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <section className="grid lg:grid-cols-[0.78fr_1.22fr] gap-8 items-center mb-10">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-500/10 px-4 py-1.5 text-sm font-medium text-pink-200 mb-5">
            🎓 Visual learning for system design interviews
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight mb-5">
            Learn System Design
            <span className="block bg-gradient-to-r from-pink-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
              Visually
            </span>
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed max-w-2xl">
            Interactive diagrams, real-world analogies, and hands-on demos. No jargon — just clear,
            visual explanations anyone can understand.
          </p>

          <div className="mt-7 inline-flex flex-wrap gap-3 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-2.5 shadow-lg shadow-cyan-500/10">
            <Link
              to="/module/top-30-system-design-concepts"
              className="rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-4 py-2 text-sm font-semibold text-gray-950 shadow-md shadow-cyan-500/30 transition-all hover:from-emerald-300 hover:to-cyan-300"
            >
              Start Top 30 →
            </Link>
            <Link
              to="/modules"
              className="rounded-xl border border-blue-300/40 bg-blue-400/10 px-4 py-2 text-sm font-semibold text-blue-100 shadow-sm shadow-blue-500/10 transition-colors hover:border-blue-200 hover:bg-blue-400/15"
            >
              Explore Curriculum
            </Link>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15, duration: 0.45 }}>
          <AnimatedLearningMap />
        </motion.div>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
      >
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-800 bg-gray-900/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-2xl">{stat.icon}</span>
              <span className="text-2xl font-bold text-white">{stat.value}</span>
            </div>
            <p className="mt-2 text-xs font-medium uppercase tracking-wide text-gray-500">{stat.label}</p>
          </div>
        ))}
      </motion.section>

      <section className="grid lg:grid-cols-[0.5fr_1.5fr] gap-5 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-gray-800 bg-gray-900/70 p-4"
        >
          <p className="text-cyan-300 text-xs font-semibold mb-1.5">📈 Your learning snapshot</p>
          <h2 className="text-lg font-bold text-white mb-2">Progress stays visible</h2>
          <p className="text-xs text-gray-400 leading-relaxed mb-4">
            Lessons, concept checklists, confidence levels, quiz scores, and memos stay organized.
          </p>
          <ProgressBar value={completion} label={`${completedLessons.length} of ${totalLessons} lessons complete`} color={completion === 100 ? 'success' : 'brand'} />
          <Link to="/progress" className="mt-4 inline-flex text-xs font-medium text-cyan-300 hover:text-cyan-200 transition-colors">
            View progress dashboard →
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="grid sm:grid-cols-2 gap-3"
        >
          {learningAreas.map((area) => (
            <Link key={area.title} to={area.to} className="group rounded-xl border border-gray-800 bg-gray-900/70 p-4 transition-all hover:border-pink-400/50 hover:bg-gray-900">
              <div className={`mb-3 h-1 w-16 rounded-full bg-gradient-to-r ${area.accent}`} />
              <div className="flex items-start gap-2.5">
                <span className="text-xl">{area.icon}</span>
                <div>
                  <h3 className="text-sm font-semibold text-white group-hover:text-pink-200 transition-colors">{area.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-gray-400">{area.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </motion.div>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl border border-pink-500/20 bg-pink-500/10 p-6 sm:p-7"
      >
        <div className="grid md:grid-cols-[1fr_auto] gap-5 md:items-center">
          <div>
            <p className="text-pink-200 text-sm font-semibold mb-2">💡 Learning Through Analogies</p>
            <h2 className="text-2xl font-bold text-white mb-2">Once the mental model clicks, the technical details follow naturally.</h2>
            <p className="text-gray-300 leading-relaxed">
              We explain ideas with simple examples first, then connect them to architecture diagrams, trade-offs, interview questions, and real production systems.
            </p>
          </div>
          <Link to="/modules" className="btn-primary whitespace-nowrap">
            Continue Learning →
          </Link>
        </div>
      </motion.section>
    </div>
  );
}
