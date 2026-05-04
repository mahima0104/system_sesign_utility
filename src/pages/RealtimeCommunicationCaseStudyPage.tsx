import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

function FlowAnimation({ steps, color = 'pink' }: { steps: string[]; color?: 'pink' | 'cyan' }) {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const tone = color === 'pink' ? 'border-pink-400 bg-pink-500/20 text-pink-100' : 'border-cyan-400 bg-cyan-500/20 text-cyan-100';
  const buttonTone = color === 'pink' ? 'hover:border-pink-400 hover:text-pink-200' : 'hover:border-cyan-400 hover:text-cyan-200';

  useEffect(() => {
    if (!playing) return undefined;
    const id = window.setInterval(() => setActive((i) => (i + 1) % steps.length), 1200);
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
          className={`inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-700 bg-gray-950 text-gray-300 transition-colors ${buttonTone}`}
        >
          <span aria-hidden>{playing ? 'Ⅱ' : '▶'}</span>
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] items-center">
        {steps.map((step, i) => (
          <div key={step} className="contents">
            <motion.div
              animate={{ scale: active === i ? 1.04 : 1, opacity: active === i ? 1 : 0.62 }}
              className={`rounded-xl border px-3 py-3 text-center text-xs font-semibold transition-colors ${
                active === i ? tone : 'border-gray-700 bg-gray-950/60 text-gray-400'
              }`}
            >
              {step}
            </motion.div>
            {i < steps.length - 1 && (
              <motion.div
                animate={{ opacity: active === i ? 1 : 0.35, x: active === i ? 2 : 0 }}
                className="hidden sm:block text-gray-500"
              >
                →
              </motion.div>
            )}
          </div>
        ))}
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
              active === i ? (color === 'pink' ? 'bg-pink-400' : 'bg-cyan-400') : 'bg-gray-800 hover:bg-gray-700'
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
        <div className="shrink-0 w-12 h-12 rounded-2xl border border-pink-500/40 bg-pink-500/10 flex items-center justify-center text-2xl">
          {icon}
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Real-time pattern {index}</p>
          <h2 className="text-xl sm:text-2xl font-bold text-white">{title}</h2>
          <p className="mt-1.5 text-sm text-gray-400 leading-relaxed">{scenario}</p>
        </div>
      </div>
      <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 sm:p-5 mb-4">{children}</div>
      <div className="rounded-xl border border-pink-500/20 bg-pink-500/5 px-4 py-3">
        <p className="text-[11px] uppercase tracking-wider text-pink-300 font-semibold mb-1">Interview takeaway</p>
        <p className="text-sm text-gray-200 leading-relaxed">{takeaway}</p>
      </div>
    </motion.section>
  );
}

export default function RealtimeCommunicationCaseStudyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/modules" className="text-xs text-gray-500 hover:text-gray-300 mb-4 inline-block">
          ← Back to Modules
        </Link>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-2xl shadow-lg shadow-pink-500/20">
            💬
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-pink-400 font-semibold">Enterprise Case Study · Real-Time Communication</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">CollabDesk Live Workspace</h1>
          </div>
        </div>
        <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
          CollabDesk is used by 20,000 enterprise teams for shared documents, incident rooms, comments, approvals, and
          live meetings. Different real-time features need different communication patterns: some are one-way, some are
          two-way, some need external callbacks, and media needs peer-to-peer transport.
        </p>
      </motion.div>

      <TopicSection
        index={1}
        icon="📡"
        title="Long Polling"
        scenario="Some enterprise customers sit behind old proxies that block WebSockets. CollabDesk falls back to long polling for notifications."
        takeaway="Long polling is useful when you need near real-time behavior over plain HTTP. It is simpler than WebSockets but costs more repeated requests and connection churn."
      >
        <FlowAnimation steps={['Browser asks for updates', 'Server holds request', 'Comment arrives', 'Server responds', 'Browser reconnects']} />
      </TopicSection>

      <TopicSection
        index={2}
        icon="🪝"
        title="Webhooks"
        scenario="When a contract is approved in CollabDesk, customer systems like Salesforce, Jira, and ServiceNow need to know immediately."
        takeaway="Webhooks are server-to-server callbacks. Design them with signatures, retries, idempotency keys, and delivery logs because the receiver may be slow or down."
      >
        <FlowAnimation steps={['Approval saved', 'Webhook worker signs event', 'Customer endpoint receives', '2xx acknowledged', 'Delivery logged']} color="cyan" />
      </TopicSection>

      <TopicSection
        index={3}
        icon="📢"
        title="Server-Sent Events"
        scenario="Incident dashboards need a steady stream of status updates, but users do not send messages back on that same channel."
        takeaway="SSE is excellent for one-way server push over HTTP: dashboards, progress updates, notifications, and live logs. Use WebSockets when the client must send frequent messages too."
      >
        <FlowAnimation steps={['Dashboard connects', 'Server opens event stream', 'Status event pushed', 'Browser updates UI', 'Auto reconnect on drop']} />
      </TopicSection>

      <TopicSection
        index={4}
        icon="🔗"
        title="WebSocket"
        scenario="Document co-editing needs bidirectional low-latency updates: cursor movement, typing, comments, reactions, and presence."
        takeaway="WebSockets fit frequent two-way messaging. Production design needs connection state, load balancing strategy, heartbeats, backpressure, and graceful reconnect."
      >
        <FlowAnimation steps={['Client opens socket', 'Gateway stores connection', 'User types edit', 'Server broadcasts', 'Peers update instantly']} color="cyan" />
      </TopicSection>

      <TopicSection
        index={5}
        icon="📹"
        title="WebRTC"
        scenario="For screen sharing and video calls, routing every video frame through application servers is too expensive and too slow."
        takeaway="WebRTC is for peer-to-peer media/data channels. You still need signaling, STUN/TURN, ICE negotiation, and TURN fallback when direct paths fail."
      >
        <FlowAnimation steps={['User starts call', 'Signaling exchanges offer', 'ICE finds path', 'Peers stream media', 'TURN relays if needed']} />
      </TopicSection>

      <div className="rounded-2xl border border-pink-500/20 bg-gradient-to-br from-pink-500/10 to-rose-500/5 p-5">
        <h3 className="text-lg font-bold text-white mb-2">Final Architecture Decision</h3>
        <p className="text-sm text-gray-300 leading-relaxed">
          CollabDesk uses long polling as a compatibility fallback, webhooks for external integrations, SSE for one-way
          dashboards, WebSockets for collaborative editing, and WebRTC for media. The senior design move is matching the
          pattern to directionality, latency, browser support, network constraints, and operational cost.
        </p>
      </div>
    </div>
  );
}
