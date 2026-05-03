import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getModule } from '../data/modules';
import { getConceptDeepDive } from '../data/concepts';
import { useProgressStore } from '../store/useProgressStore';
import { loadBalancingQuiz, cachingQuiz } from '../data/quizzes';
import ProgressBar from '../components/Common/ProgressBar';
import DifficultyBadge from '../components/Common/DifficultyBadge';
import LessonTypeIcon from '../components/Common/LessonTypeIcon';
import ConceptDeepDiveView from '../components/Common/ConceptDeepDiveView';
import MermaidDiagram from '../components/Visualizations/MermaidDiagram';
import ArchitectureDiagram from '../components/Visualizations/ArchitectureDiagram';
import AnimatedScenario from '../components/Visualizations/AnimatedScenario';
import QuizCard from '../components/Learning/QuizCard';
import Top30ConceptPlanner from '../components/Learning/Top30ConceptPlanner';
import type { Node, Edge } from 'reactflow';

// ── ReactFlow data for Load Balancing ──────────────────────────────────────────
const lbNodes: Node[] = [
  { id: 'client', type: 'service', position: { x: 50,  y: 160 }, data: { label: 'Client',          icon: '👤', color: '#6b7280' } },
  { id: 'lb',     type: 'service', position: { x: 250, y: 160 }, data: { label: 'Load Balancer',    icon: '⚖️', color: '#2563eb' } },
  { id: 'srv1',   type: 'service', position: { x: 480, y: 60  }, data: { label: 'Server A',         icon: '🖥️', sublabel: 'Instance 1', color: '#7c3aed' } },
  { id: 'srv2',   type: 'service', position: { x: 480, y: 160 }, data: { label: 'Server B',         icon: '🖥️', sublabel: 'Instance 2', color: '#7c3aed' } },
  { id: 'srv3',   type: 'service', position: { x: 480, y: 260 }, data: { label: 'Server C',         icon: '🖥️', sublabel: 'Instance 3', color: '#7c3aed' } },
  { id: 'db',     type: 'service', position: { x: 700, y: 160 }, data: { label: 'Database',         icon: '🗄️', color: '#059669' } },
];
const lbEdges: Edge[] = [
  { id: 'e1', source: 'client', target: 'lb',   animated: true,  label: 'Request' },
  { id: 'e2', source: 'lb',     target: 'srv1',  animated: true },
  { id: 'e3', source: 'lb',     target: 'srv2',  animated: true },
  { id: 'e4', source: 'lb',     target: 'srv3',  animated: true },
  { id: 'e5', source: 'srv1',   target: 'db' },
  { id: 'e6', source: 'srv2',   target: 'db' },
  { id: 'e7', source: 'srv3',   target: 'db' },
];

// ── Mermaid diagrams ──────────────────────────────────────────────────────────
const lbMermaid = `
flowchart LR
  C[👤 Client] --> LB[⚖️ Load Balancer]
  LB -->|Round Robin| S1[🖥️ Server A]
  LB -->|Round Robin| S2[🖥️ Server B]
  LB -->|Round Robin| S3[🖥️ Server C]
  S1 --> DB[(🗄️ Database)]
  S2 --> DB
  S3 --> DB
`.trim();

const cacheMermaid = `
sequenceDiagram
  actor User
  participant Cache
  participant DB as Database
  User->>Cache: GET user:42
  alt Cache Hit
    Cache-->>User: ✅ Return cached data (fast!)
  else Cache Miss
    Cache->>DB: Query user:42
    DB-->>Cache: Return data
    Cache-->>User: Return data (+ store in cache)
  end
`.trim();


export default function ModuleDetailPage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const mod = getModule(moduleId ?? '');
  const { getModuleProgress, completeLesson, saveQuizScore, isLessonComplete } = useProgressStore();

  if (!mod) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold text-white mb-3">Module not found</h2>
        <Link to="/modules" className="btn-primary">Back to Modules</Link>
      </div>
    );
  }

  const progress = getModuleProgress(mod.lessons.map((l) => l.id));
  const deepDive = getConceptDeepDive(mod.id);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/modules" className="hover:text-gray-300 transition-colors">Modules</Link>
        <span>/</span>
        <span className="text-gray-300">{mod.title}</span>
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-8 mb-8">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gray-800 flex items-center justify-center text-4xl flex-shrink-0">
            {mod.icon}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{mod.title}</h1>
              <DifficultyBadge difficulty={mod.difficulty} />
            </div>
            <p className="text-brand-400 font-medium mb-3">{mod.subtitle}</p>
            <p className="text-gray-400 leading-relaxed">{mod.description}</p>
            <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
              <span>⏱ {mod.estimatedTime} min</span>
              <span>📝 {mod.lessons.length} lessons</span>
              <span>⚡ {mod.lessons.length * 10} XP</span>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <ProgressBar value={progress} label="Module Progress" />
        </div>
      </motion.div>

      {/* Analogy callout */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-brand-500/5 border border-brand-500/20 rounded-2xl p-6 mb-8"
      >
        <div className="flex gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <p className="text-brand-300 font-semibold mb-1">Real-World Analogy</p>
            <p className="text-gray-300 text-sm leading-relaxed">{mod.realWorldAnalogy}</p>
          </div>
        </div>
      </motion.div>

      {/* Concept deep-dive — rendered for modules that have rich content authored. */}
      {deepDive && (
        <div className="mb-10">
          <ConceptDeepDiveView concept={deepDive} />
        </div>
      )}

      {mod.id === 'top-30-system-design-concepts' && <Top30ConceptPlanner />}

      {/* Interactive content for load-balancing module */}
      {mod.id === 'load-balancing' && (
        <div className="space-y-8 mb-8">
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            <h2 className="section-heading mb-4">☕ Interactive Demo: Round Robin</h2>
            <AnimatedScenario />
          </motion.section>

          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <h2 className="section-heading mb-4">🏗️ Architecture Diagram</h2>
            <ArchitectureDiagram initialNodes={lbNodes} initialEdges={lbEdges} height={360} readonly />
          </motion.section>

          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
            <h2 className="section-heading mb-4">📊 Flow Diagram</h2>
            <div className="card p-4">
              <MermaidDiagram chart={lbMermaid} caption="Round Robin Load Balancing — traffic cycles evenly across all servers" />
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <h2 className="section-heading mb-4">🧠 Knowledge Check</h2>
            <QuizCard
              questions={loadBalancingQuiz}
              quizId="lb-quiz-1"
              onComplete={(score) => {
                saveQuizScore('lb-quiz-1', score);
                completeLesson('lb-quiz-1', 20);
              }}
            />
          </motion.section>
        </div>
      )}

      {/* Caching module */}
      {mod.id === 'caching' && (
        <div className="space-y-8 mb-8">
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            <h2 className="section-heading mb-4">📊 Cache Hit vs Miss Flow</h2>
            <div className="card p-4">
              <MermaidDiagram chart={cacheMermaid} caption="Cache hit returns data instantly; cache miss falls back to the database" />
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <h2 className="section-heading mb-4">🧠 Knowledge Check</h2>
            <QuizCard
              questions={cachingQuiz}
              quizId="cache-quiz-1"
              onComplete={(score) => {
                saveQuizScore('cache-quiz-1', score);
                completeLesson('cache-quiz-1', 20);
              }}
            />
          </motion.section>
        </div>
      )}

      {/* Lessons list */}
      <div>
        <h2 className="section-heading mb-4">Lessons</h2>
        <div className="space-y-3">
          {mod.lessons.map((lesson, i) => {
            const done = isLessonComplete(lesson.id);
            return (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }}
                className="card p-4 flex items-center gap-4 group"
              >
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${done ? 'border-success-500 bg-success-500/10 text-success-400' : 'border-gray-700 text-gray-600'}`}>
                  {done ? '✓' : <span className="text-sm font-bold">{i + 1}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="text-white font-medium">{lesson.title}</span>
                    <LessonTypeIcon type={lesson.type} />
                  </div>
                  <p className="text-gray-500 text-sm">{lesson.description}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-gray-500">⏱ {lesson.duration}min</span>
                  <button
                    onClick={() => completeLesson(lesson.id)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${done ? 'bg-success-500/10 text-success-400' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}
                  >
                    {done ? '✓ Done' : 'Mark done'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
