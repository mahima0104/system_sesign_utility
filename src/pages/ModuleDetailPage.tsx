import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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


// ── Design Process stepper ────────────────────────────────────────────────────

const DESIGN_STEPS = [
  {
    icon: '🎯',
    title: 'Clarify requirements',
    simple: 'Before building anything, ask questions. Who uses it? How many? How fast must it be?',
    analogy: 'Like an architect asking the client: "How many floors? Parking? Budget?" before drawing a single line.',
    example: 'Interviewer says "Design WhatsApp." You ask: "How many users? Text only or media? Global or one country?"',
    tip: 'Spend the first 3–5 minutes ONLY asking questions. Never start designing in silence.',
  },
  {
    icon: '🔢',
    title: 'Estimate scale',
    simple: 'Write rough numbers on paper. How many requests per second? How much storage per day?',
    analogy: 'Like a chef calculating: "300 guests × 3 courses = 900 plates. I need 5 chefs."',
    example: '100M users × 1 message/day = 1,150 messages/sec. Each 1 KB → 100 GB storage/day.',
    tip: 'Interviewers want to see you reason with numbers, not guess. Be wrong confidently, then adjust.',
  },
  {
    icon: '✏️',
    title: 'Design the high-level architecture',
    simple: 'Draw the big boxes: client, server, database, cache. Show how data flows between them.',
    analogy: 'Like drawing a floor plan — rooms first, furniture later.',
    example: 'Client → Load Balancer → App Servers → Cache (Redis) → Database (Postgres)',
    tip: 'Start with a 4-box diagram. Resist jumping to microservices on slide one.',
  },
  {
    icon: '🗄️',
    title: 'Design the data model',
    simple: 'What do you store? Users? Messages? Posts? What are the relationships between them?',
    analogy: 'Like deciding what goes in each room of a house before buying furniture.',
    example: 'User(id, name, phone), Message(id, sender_id, receiver_id, body, ts), Conversation(id, participants[])',
    tip: 'SQL for structured relational data, NoSQL for huge scale or flexible schema. Justify your choice.',
  },
  {
    icon: '🔌',
    title: 'Design the APIs',
    simple: 'Define the endpoints clients will call. What goes in, what comes out.',
    analogy: 'Like writing a restaurant menu — what can customers order and what will they get?',
    example: 'POST /messages  {to, body} → 201.  GET /messages/{id} → {body, ts, seen}',
    tip: 'Keep APIs simple and versioned (v1/). Show you think about auth (Bearer token).',
  },
  {
    icon: '⚠️',
    title: 'Identify bottlenecks & trade-offs',
    simple: 'Where will the system break first? What did you sacrifice to make something else faster?',
    analogy: 'Like a highway planner asking: "Where will traffic jam at rush hour?"',
    example: '"The single DB will be the bottleneck at 10K RPS — I would add a read replica and Redis cache."',
    tip: 'This is what separates senior candidates. Proactively say what is wrong with your own design.',
  },
  {
    icon: '📈',
    title: 'Scale & harden',
    simple: 'Now make it handle 10× the load. Add redundancy so it does not crash.',
    analogy: 'Like adding more checkout lanes at a supermarket before the holiday rush.',
    example: 'Add horizontal scaling for app servers, shard the DB by user_id, use a CDN for media.',
    tip: 'Do not over-engineer from the start. Scale in layers — prove you know when to add complexity.',
  },
];

function DesignProcessStepper() {
  const [active, setActive] = useState(0);
  const step = DESIGN_STEPS[active];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="mb-10"
    >
      <h2 className="section-heading mb-2">🗺️ The 7-Step Design Process</h2>
      <p className="text-gray-400 text-sm mb-5">
        Every system design interview follows the same playbook. Click each step to see the simple explanation, a real-world analogy, and an example.
      </p>

      {/* Step pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        {DESIGN_STEPS.map((s, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              active === i
                ? 'border-brand-400 bg-brand-500/20 text-brand-200'
                : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600 hover:text-gray-200'
            }`}
          >
            <span>{s.icon}</span>
            <span className="hidden sm:inline">{i + 1}.</span> {s.title}
          </button>
        ))}
      </div>

      {/* Active step card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl border border-gray-800 bg-gray-900/60 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-800 bg-gray-900">
            <span className="text-3xl">{step.icon}</span>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                Step {active + 1} of {DESIGN_STEPS.length}
              </p>
              <h3 className="text-lg font-bold text-white">{step.title}</h3>
            </div>
            <div className="ml-auto flex gap-1">
              <button
                disabled={active === 0}
                onClick={() => setActive((a) => a - 1)}
                className="w-8 h-8 rounded-lg border border-gray-700 bg-gray-800 text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-sm"
              >
                ←
              </button>
              <button
                disabled={active === DESIGN_STEPS.length - 1}
                onClick={() => setActive((a) => a + 1)}
                className="w-8 h-8 rounded-lg border border-gray-700 bg-gray-800 text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-sm"
              >
                →
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 grid sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-brand-500/20 bg-brand-500/5 p-4">
              <p className="text-[10px] uppercase tracking-wider text-brand-400 font-semibold mb-2">📖 In plain English</p>
              <p className="text-sm text-gray-200 leading-relaxed">{step.simple}</p>
            </div>
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
              <p className="text-[10px] uppercase tracking-wider text-yellow-400 font-semibold mb-2">💡 Real-world analogy</p>
              <p className="text-sm text-gray-200 leading-relaxed italic">{step.analogy}</p>
            </div>
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
              <p className="text-[10px] uppercase tracking-wider text-cyan-400 font-semibold mb-2">✏️ Example</p>
              <p className="text-sm text-gray-200 leading-relaxed font-mono text-xs">{step.example}</p>
            </div>
          </div>

          {/* Interview tip */}
          <div className="px-5 pb-5">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold mb-1">🎯 Interview tip</p>
              <p className="text-sm text-gray-200">{step.tip}</p>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 pb-4">
            {DESIGN_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`rounded-full transition-all ${
                  i === active ? 'w-5 h-2 bg-brand-400' : 'w-2 h-2 bg-gray-700 hover:bg-gray-600'
                }`}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

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

      {/* ── What is System Design — Design Process stepper ─────────────────── */}
      {mod.id === 'what-is-system-design' && <DesignProcessStepper />}

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
