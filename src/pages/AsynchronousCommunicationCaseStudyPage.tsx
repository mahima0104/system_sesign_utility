import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

function PipelineAnimation({ steps }: { steps: string[] }) {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return undefined;
    const id = window.setInterval(() => setActive((i) => (i + 1) % steps.length), 1100);
    return () => window.clearInterval(id);
  }, [playing, steps.length]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
          Step {active + 1} / {steps.length}
        </span>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? 'Pause animation' : 'Play animation'}
          className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-700 bg-gray-950 text-gray-300 transition-colors hover:border-orange-400 hover:text-orange-200"
        >
          <span aria-hidden>{playing ? 'Ⅱ' : '▶'}</span>
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-5">
        {steps.map((step, i) => (
          <motion.div
            key={step}
            animate={{ y: active === i ? -3 : 0, opacity: active === i ? 1 : 0.58 }}
            className={`rounded-xl border px-3 py-3 text-center text-xs font-semibold ${
              active === i
                ? 'border-orange-400 bg-orange-500/20 text-orange-100'
                : 'border-gray-700 bg-gray-950/60 text-gray-400'
            }`}
          >
            {step}
          </motion.div>
        ))}
      </div>
      <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
        <motion.div
          animate={{ width: `${((active + 1) / steps.length) * 100}%` }}
          transition={{ duration: 0.45 }}
          className="h-full bg-orange-400"
        />
      </div>
      <div className="flex gap-1.5">
        {steps.map((step, i) => (
          <button
            key={step}
            type="button"
            onClick={() => {
              setActive(i);
              setPlaying(false);
            }}
            aria-label={`Go to step ${i + 1}`}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              active === i ? 'bg-orange-400' : 'bg-gray-800 hover:bg-gray-700'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function TopicSection({
  index,
  icon,
  title,
  scenario,
  children,
  takeaway,
}: {
  index: number;
  icon: string;
  title: string;
  scenario: string;
  children: ReactNode;
  takeaway: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      className="rounded-2xl border border-gray-800 bg-gray-950/60 p-5 sm:p-7"
    >
      <div className="flex items-start gap-4 mb-5">
        <div className="shrink-0 w-12 h-12 rounded-2xl border border-orange-500/40 bg-orange-500/10 flex items-center justify-center text-2xl">
          {icon}
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Async pattern {index}</p>
          <h2 className="text-xl sm:text-2xl font-bold text-white">{title}</h2>
          <p className="mt-1.5 text-sm text-gray-400 leading-relaxed">{scenario}</p>
        </div>
      </div>
      <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 sm:p-5 mb-4">{children}</div>
      <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3">
        <p className="text-[11px] uppercase tracking-wider text-orange-300 font-semibold mb-1">Interview takeaway</p>
        <p className="text-sm text-gray-200 leading-relaxed">{takeaway}</p>
      </div>
    </motion.section>
  );
}

export default function AsynchronousCommunicationCaseStudyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/modules" className="text-xs text-gray-500 hover:text-gray-300 mb-4 inline-block">
          ← Back to Modules
        </Link>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-2xl shadow-lg shadow-orange-500/20">
            🚚
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-orange-400 font-semibold">Enterprise Case Study · Asynchronous Communication</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">OrderFlow Commerce Pipeline</h1>
          </div>
        </div>
        <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
          OrderFlow processes checkout, payment, inventory reservation, invoices, shipping, loyalty points, analytics,
          and customer notifications. The user should not wait for all of that work. Async communication keeps checkout
          fast while downstream systems process reliably.
        </p>
      </motion.div>

      <TopicSection
        index={1}
        icon="⏳"
        title="Sync vs Async"
        scenario="Checkout uses synchronous calls only for decisions the user must know immediately: payment authorization and inventory reservation. Everything else moves async."
        takeaway="Use sync for user-facing decisions that must complete now. Use async for slow, retryable, fan-out, or non-critical work."
      >
        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
            <p className="text-sm font-bold text-blue-200">Synchronous path</p>
            <p className="mt-2 text-gray-300 leading-relaxed">Authorize payment, reserve stock, return order confirmation.</p>
          </div>
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
            <p className="text-sm font-bold text-orange-200">Asynchronous path</p>
            <p className="mt-2 text-gray-300 leading-relaxed">Send invoice, notify seller, update analytics, award loyalty points.</p>
          </div>
        </div>
      </TopicSection>

      <TopicSection
        index={2}
        icon="📬"
        title="Message Queues"
        scenario="Invoice generation sometimes takes 4 seconds. Instead of making checkout wait, OrderFlow pushes an invoice job to a queue."
        takeaway="Queues decouple producers and consumers. They absorb bursts, allow retries, and let workers process at their own speed."
      >
        <PipelineAnimation steps={['Order API', 'Invoice queue', 'Worker pool', 'PDF service', 'Email sent']} />
      </TopicSection>

      <TopicSection
        index={3}
        icon="📻"
        title="Publish-Subscribe"
        scenario="One order-placed event must reach shipping, loyalty, fraud monitoring, recommendations, and analytics independently."
        takeaway="Use pub/sub when multiple subscribers need the same event. Publishers should not know who listens."
      >
        <PipelineAnimation steps={['Order placed', 'Topic: orders', 'Shipping', 'Loyalty', 'Analytics']} />
      </TopicSection>

      <TopicSection
        index={4}
        icon="🔔"
        title="Change Data Capture"
        scenario="The order database is the source of truth. CDC streams every committed change into Kafka so search, warehouse, and support systems stay updated."
        takeaway="CDC avoids fragile dual-writes. Commit to the database once, then stream changes from the database log to downstream consumers."
      >
        <PipelineAnimation steps={['Postgres commit', 'WAL/binlog', 'Debezium', 'Kafka topic', 'Search + BI']} />
      </TopicSection>

      <TopicSection
        index={5}
        icon="📮"
        title="Delivery Semantics"
        scenario="A loyalty-points event can be retried, but it must not award points twice. OrderFlow uses at-least-once delivery plus idempotent consumers."
        takeaway="Exactly-once is expensive and often misunderstood. In real systems, at-least-once plus idempotency keys is the practical default."
      >
        <div className="grid sm:grid-cols-3 gap-3 text-xs">
          {[
            ['At-most-once', 'Fast, but messages can disappear.'],
            ['At-least-once', 'Reliable, but duplicates can happen.'],
            ['Exactly-once effect', 'Use idempotency and dedupe tables.'],
          ].map(([name, text]) => (
            <div key={name} className="rounded-lg border border-gray-700 bg-gray-950/60 p-3">
              <p className="font-bold text-orange-200">{name}</p>
              <p className="mt-1 text-gray-400 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </TopicSection>

      <TopicSection
        index={6}
        icon="📪"
        title="Dead Letter Queues"
        scenario="Some shipping messages fail because the address is invalid. Retrying forever blocks the queue, so OrderFlow moves poison messages to a DLQ for triage."
        takeaway="A DLQ protects the healthy flow. Pair it with alerts, replay tooling, error classification, and dashboards so failures are visible and recoverable."
      >
        <PipelineAnimation steps={['Message fails', 'Retry with backoff', 'Max retries hit', 'Move to DLQ', 'Ops fixes + replays']} />
      </TopicSection>

      <div className="rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-amber-500/5 p-5">
        <h3 className="text-lg font-bold text-white mb-2">Final Architecture Decision</h3>
        <p className="text-sm text-gray-300 leading-relaxed">
          OrderFlow keeps checkout synchronous only for payment and inventory, then uses queues for work distribution,
          pub/sub for fan-out, CDC for database-driven propagation, idempotent consumers for reliable retries, and DLQs
          for poison-message recovery. The result is fast user response without losing operational correctness.
        </p>
      </div>
    </div>
  );
}
