import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

function InfraFlow({ steps }: { steps: string[] }) {
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
        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Step {active + 1} / {steps.length}</span>
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
            animate={{ scale: active === i ? 1.04 : 1, opacity: active === i ? 1 : 0.58 }}
            className={`rounded-xl border px-3 py-3 text-center text-xs font-semibold ${
              active === i ? 'border-orange-400 bg-orange-500/20 text-orange-100' : 'border-gray-700 bg-gray-950/60 text-gray-400'
            }`}
          >
            {step}
          </motion.div>
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
            className={`h-1.5 flex-1 rounded-full transition-colors ${active === i ? 'bg-orange-400' : 'bg-gray-800 hover:bg-gray-700'}`}
          />
        ))}
      </div>
    </div>
  );
}

function Topic({ icon, title, scenario, takeaway, children }: { icon: string; title: string; scenario: string; takeaway: string; children: ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      className="rounded-2xl border border-gray-800 bg-gray-950/60 p-5 sm:p-7"
    >
      <div className="flex items-start gap-4 mb-5">
        <div className="shrink-0 w-12 h-12 rounded-2xl border border-orange-500/40 bg-orange-500/10 flex items-center justify-center text-2xl">{icon}</div>
        <div>
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

function ResponseExample() {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-950 overflow-hidden">
      <div className="px-4 py-2 border-b border-gray-800 text-[10px] uppercase tracking-wider font-semibold text-orange-300">
        429 response contract
      </div>
      <pre className="p-4 overflow-x-auto text-xs leading-relaxed text-gray-300">
        <code>{`HTTP/1.1 429 Too Many Requests
Retry-After: 20
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0

{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Transfer API limit exceeded. Retry after 20 seconds.",
    "requestId": "req_edge_551"
  }
}`}</code>
      </pre>
    </div>
  );
}

export default function APIInfrastructureCaseStudyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/modules" className="text-xs text-gray-500 hover:text-gray-300 mb-4 inline-block">← Back to Modules</Link>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-2xl shadow-lg shadow-orange-500/20">🚪</div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-orange-400 font-semibold">Enterprise Case Study · API Infrastructure</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">PayBank API Edge Platform</h1>
          </div>
        </div>
        <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
          PayBank serves mobile customers, internal dashboards, merchants, and fintech partners. Every request enters
          through an API edge layer that routes, limits, logs, and protects services before traffic reaches the bank core.
        </p>
      </motion.div>

      <Topic
        icon="🚪"
        title="API Gateway"
        scenario="The gateway is the front door. It terminates TLS, checks auth metadata, routes to services, applies quotas, and adds trace IDs."
        takeaway="An API gateway centralizes cross-cutting concerns: routing, authentication hooks, rate limits, observability, request shaping, and version migration."
      >
        <div className="space-y-4">
          <InfraFlow steps={['Client request', 'TLS + gateway', 'Auth + route', 'Transfer service', 'Trace + response']} />
          <div className="grid sm:grid-cols-4 gap-2 text-xs">
            {[
              ['Routing', '/v1/transfers → Transfer API'],
              ['Auth hook', 'Verify JWT and scopes'],
              ['Observability', 'Attach request id and trace id'],
              ['Policy', 'Apply tenant quota and API version rules'],
            ].map(([title, text]) => (
              <div key={title} className="rounded-lg border border-gray-700 bg-gray-950/60 p-3">
                <p className="font-bold text-orange-200">{title}</p>
                <p className="mt-1 text-gray-400 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </Topic>

      <Topic
        icon="🚦"
        title="Rate Limiting"
        scenario="A buggy partner integration retries 10,000 times per minute. Without rate limits, the bank API slows down for everyone."
        takeaway="Rate limiting protects shared systems. Use per-user, per-client, per-IP, and endpoint-specific limits with clear 429 responses."
      >
        <div className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-3 text-xs">
            {[
              ['Retail mobile', '300 reads/min, 30 transfers/min', 'Token bucket allows normal bursts after login.'],
              ['Merchant API', '1,000 reads/min, 120 refunds/min', 'Sliding window keeps partner traffic smooth.'],
              ['Fintech partner', 'Contract-specific quotas', 'Endpoint-level limits protect money movement.'],
            ].map(([name, quota, text]) => (
              <div key={name} className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3">
                <p className="font-bold text-orange-200">{name}</p>
                <p className="mt-1 text-white">{quota}</p>
                <p className="mt-1 text-gray-400 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
          <ResponseExample />
        </div>
      </Topic>

      <Topic
        icon="🧯"
        title="Failure Mode: Rate Limit Store Down"
        scenario="Distributed rate limiting usually depends on Redis or a gateway-managed counter store. PayBank decides fail behavior by risk level."
        takeaway="Senior designs include dependency failure behavior. Fail closed for dangerous writes, fail open or degrade for safe reads."
      >
        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          {[
            ['Transfer API', 'Fail closed', 'If the quota store is unavailable, reject high-risk money-moving requests with a clear temporary error.'],
            ['Account balance read', 'Fail open with local fallback', 'Allow limited local reads so customers can still view basic information.'],
            ['Partner bulk export', 'Fail closed', 'Batch partners can retry later without affecting retail customers.'],
            ['Health/status API', 'Bypass limit', 'Keep operational health checks working for monitoring and failover.'],
          ].map(([api, policy, reason]) => (
            <div key={api} className="rounded-lg border border-gray-700 bg-gray-950/60 p-3">
              <p className="font-bold text-white">{api}</p>
              <p className="mt-1 text-orange-200">{policy}</p>
              <p className="mt-1 text-gray-400 leading-relaxed">{reason}</p>
            </div>
          ))}
        </div>
      </Topic>

      <div className="rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-amber-500/5 p-5">
        <h3 className="text-lg font-bold text-white mb-2">Final Infrastructure Design</h3>
        <p className="text-sm text-gray-300 leading-relaxed">
          PayBank puts an API gateway in front of all services, enforces client and endpoint limits, emits traces,
          routes versions safely, and returns clear error contracts when clients exceed quota or call retired APIs.
        </p>
      </div>
    </div>
  );
}
