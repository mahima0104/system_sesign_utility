import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

function Flow({ steps, tone = 'yellow' }: { steps: string[]; tone?: 'yellow' | 'pink' }) {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const activeClass = tone === 'yellow'
    ? 'border-yellow-400 bg-yellow-500/20 text-yellow-100'
    : 'border-pink-400 bg-pink-500/20 text-pink-100';
  const dotClass = tone === 'yellow' ? 'bg-yellow-400' : 'bg-pink-400';

  useEffect(() => {
    if (!playing) return undefined;
    const id = window.setInterval(() => setActive((i) => (i + 1) % steps.length), 1200);
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
          className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-700 bg-gray-950 text-gray-300 transition-colors hover:border-yellow-400 hover:text-yellow-200"
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
              active === i ? activeClass : 'border-gray-700 bg-gray-950/60 text-gray-400'
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
            className={`h-1.5 flex-1 rounded-full transition-colors ${active === i ? dotClass : 'bg-gray-800 hover:bg-gray-700'}`}
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
        <div className="shrink-0 w-12 h-12 rounded-2xl border border-yellow-500/40 bg-yellow-500/10 flex items-center justify-center text-2xl">{icon}</div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">{title}</h2>
          <p className="mt-1.5 text-sm text-gray-400 leading-relaxed">{scenario}</p>
        </div>
      </div>
      <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 sm:p-5 mb-4">{children}</div>
      <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
        <p className="text-[11px] uppercase tracking-wider text-yellow-300 font-semibold mb-1">Interview takeaway</p>
        <p className="text-sm text-gray-200 leading-relaxed">{takeaway}</p>
      </div>
    </motion.section>
  );
}

function CodeBlock({ title, code, tone = 'yellow' }: { title: string; code: string; tone?: 'yellow' | 'red' | 'green' }) {
  const titleTone = tone === 'red' ? 'text-red-300' : tone === 'green' ? 'text-emerald-300' : 'text-yellow-300';

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-950 overflow-hidden">
      <div className={`px-4 py-2 border-b border-gray-800 text-[10px] uppercase tracking-wider font-semibold ${titleTone}`}>
        {title}
      </div>
      <pre className="p-4 overflow-x-auto text-xs leading-relaxed text-gray-300">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function APIDesignCaseStudyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/modules" className="text-xs text-gray-500 hover:text-gray-300 mb-4 inline-block">← Back to Modules</Link>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center text-2xl shadow-lg shadow-yellow-500/20">🏦</div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-yellow-400 font-semibold">Enterprise Case Study · API Design</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">PayBank Money Movement APIs</h1>
          </div>
        </div>
        <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
          PayBank exposes account, transfer, card, statement, and merchant APIs to mobile apps, web dashboards, and
          corporate partners. The design challenge is making APIs easy for developers while protecting correctness for money.
        </p>
      </motion.div>

      <Topic
        icon="🔌"
        title="What Is an API?"
        scenario="The mobile app should not talk directly to databases or payment processors. It calls stable PayBank APIs that hide internal complexity."
        takeaway="Explain APIs as contracts between systems: request shape, response shape, behavior, errors, and versioning."
      >
        <Flow steps={['Mobile app', 'POST /v1/transfers', 'Transfer API', 'Ledger service', 'JSON response']} />
      </Topic>

      <Topic
        icon="🔁"
        title="Idempotency"
        scenario="A customer taps Pay, the network drops, and the mobile app retries. PayBank must not debit twice."
        takeaway="Payment and transfer APIs should require idempotency keys. Store the first result and return it for safe retries."
      >
        <div className="space-y-4">
          <Flow steps={['Client sends key', 'API checks key store', 'First request creates transfer', 'Retry uses same key', 'Same result returned']} />
          <div className="grid sm:grid-cols-2 gap-3">
            <CodeBlock
              title="Request contract"
              code={`POST /v1/transfers
Idempotency-Key: tr_2026_05_04_abc
Content-Type: application/json

{
  "sourceAccountId": "acc_101",
  "destinationAccountId": "acc_909",
  "amount": "2500.00",
  "currency": "INR",
  "note": "Rent"
}`}
            />
            <CodeBlock
              title="Retry response"
              tone="green"
              code={`HTTP/1.1 201 Created

{
  "transferId": "txn_77821",
  "status": "completed",
  "idempotencyKey": "tr_2026_05_04_abc",
  "createdAt": "2026-05-04T08:10:00Z"
}`}
            />
          </div>
        </div>
      </Topic>

      <Topic
        icon="🧾"
        title="Data Formats"
        scenario="External partners prefer JSON over HTTPS, while internal risk services need compact typed payloads for high-throughput calls."
        takeaway="Choose JSON for public developer experience, Protobuf/gRPC for internal high-performance contracts, and define schema evolution rules early."
      >
        <div className="grid sm:grid-cols-3 gap-3 text-xs">
          {[
            ['JSON', 'Public REST APIs', 'Readable, universal, easy to debug.'],
            ['GraphQL JSON', 'Mobile dashboard', 'Client asks for exactly the fields it needs.'],
            ['Protobuf', 'Internal risk scoring', 'Typed, compact, fast for service-to-service calls.'],
          ].map(([name, use, why]) => (
            <div key={name} className="rounded-lg border border-gray-700 bg-gray-950/60 p-3">
              <p className="font-bold text-yellow-200">{name}</p>
              <p className="mt-1 text-white">{use}</p>
              <p className="mt-1 text-gray-500 leading-relaxed">{why}</p>
            </div>
          ))}
        </div>
      </Topic>

      <Topic
        icon="📐"
        title="REST, API Styles, and GraphQL"
        scenario="PayBank uses REST for stable resources, GraphQL for customer dashboard aggregation, and gRPC for internal low-latency service calls."
        takeaway="No one API style wins everywhere. Match style to consumer needs: REST for resources, GraphQL for flexible reads, gRPC for internal performance, webhooks for callbacks."
      >
        <div className="space-y-4">
          <Flow steps={['REST transfer', 'GraphQL dashboard', 'gRPC risk check', 'Webhook callback', 'Partner notified']} tone="pink" />
          <div className="rounded-xl border border-gray-800 overflow-hidden overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-950 text-gray-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-3 py-2 text-left">Need</th>
                  <th className="px-3 py-2 text-left">Chosen style</th>
                  <th className="px-3 py-2 text-left">Why</th>
                  <th className="px-3 py-2 text-left">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-gray-300">
                {[
                  ['Create transfer', 'REST', 'Stable resource contract and HTTP semantics', 'Must handle idempotency and errors'],
                  ['Mobile dashboard', 'GraphQL', 'One screen pulls many data shapes', 'Query cost and field-level auth'],
                  ['Risk scoring', 'gRPC', 'Low-latency typed internal call', 'Deadlines and protobuf compatibility'],
                  ['Settlement update', 'Webhook', 'Partner gets notified without polling', 'Retries, signatures, duplicate events'],
                ].map((row) => (
                  <tr key={row[0]} className="hover:bg-gray-900/40">
                    {row.map((cell, i) => (
                      <td key={cell} className={`px-3 py-2 align-top ${i === 1 ? 'text-yellow-200 font-semibold' : ''}`}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Topic>

      <Topic
        icon="🧯"
        title="Failure Contracts and Versioning"
        scenario="A senior API design is not only the happy path. PayBank also designs how failures look and how contracts evolve without breaking old mobile apps."
        takeaway="Show interviewers both success and failure contracts. Great APIs are predictable when things go wrong."
      >
        <div className="grid sm:grid-cols-2 gap-3">
          <CodeBlock
            title="Business error"
            tone="red"
            code={`HTTP/1.1 409 Conflict

{
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "message": "Balance is too low for this transfer.",
    "requestId": "req_9h3k",
    "retryable": false
  }
}`}
          />
          <CodeBlock
            title="Idempotency conflict"
            tone="red"
            code={`HTTP/1.1 409 Conflict

{
  "error": {
    "code": "IDEMPOTENCY_CONFLICT",
    "message": "This key was already used with a different request body.",
    "requestId": "req_2ab7"
  }
}`}
          />
          <div className="sm:col-span-2 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
            <p className="text-sm font-bold text-yellow-200 mb-2">Version migration example</p>
            <p className="text-xs text-gray-300 leading-relaxed">
              `/v1/transfers` accepts a simple destination account id. `/v2/transfers` adds beneficiary type,
              fraud challenge status, and richer failure reasons. PayBank keeps v1 alive for older app versions,
              publishes a deprecation date, and monitors traffic before retiring it.
            </p>
          </div>
        </div>
      </Topic>

      <div className="rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-amber-500/5 p-5">
        <h3 className="text-lg font-bold text-white mb-2">Final API Design</h3>
        <p className="text-sm text-gray-300 leading-relaxed">
          PayBank publishes REST APIs for transfers and accounts, GraphQL for customer dashboards, gRPC for internal
          risk and ledger calls, JSON for partners, Protobuf internally, and idempotency keys on every money-moving write.
        </p>
      </div>
    </div>
  );
}
