import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

function SecurityFlow({ steps }: { steps: string[] }) {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);

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
          className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-700 bg-gray-950 text-gray-300 transition-colors hover:border-red-400 hover:text-red-200"
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
              active === i ? 'border-red-400 bg-red-500/20 text-red-100' : 'border-gray-700 bg-gray-950/60 text-gray-400'
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
            className={`h-1.5 flex-1 rounded-full transition-colors ${active === i ? 'bg-red-400' : 'bg-gray-800 hover:bg-gray-700'}`}
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
        <div className="shrink-0 w-12 h-12 rounded-2xl border border-red-500/40 bg-red-500/10 flex items-center justify-center text-2xl">{icon}</div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">{title}</h2>
          <p className="mt-1.5 text-sm text-gray-400 leading-relaxed">{scenario}</p>
        </div>
      </div>
      <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 sm:p-5 mb-4">{children}</div>
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
        <p className="text-[11px] uppercase tracking-wider text-red-300 font-semibold mb-1">Interview takeaway</p>
        <p className="text-sm text-gray-200 leading-relaxed">{takeaway}</p>
      </div>
    </motion.section>
  );
}

export default function APISecurityCaseStudyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/modules" className="text-xs text-gray-500 hover:text-gray-300 mb-4 inline-block">← Back to Modules</Link>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-2xl shadow-lg shadow-red-500/20">🔐</div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-red-400 font-semibold">Enterprise Case Study · API Security</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">PayBank Identity and Access Layer</h1>
          </div>
        </div>
        <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
          PayBank supports retail customers, employees, corporate admins, and fintech partners. Security has to answer
          two questions every time: who is calling, and what are they allowed to do?
        </p>
      </motion.div>

      <Topic
        icon="🪪"
        title="Authentication vs Authorization"
        scenario="A customer proves identity with password and OTP. The API then checks whether that customer can view this specific account."
        takeaway="Authentication verifies identity. Authorization checks permission. Keep those two ideas separate in your design explanation."
      >
        <SecurityFlow steps={['Login + OTP', 'Identity verified', 'JWT issued', 'API checks scope', 'Account allowed']} />
      </Topic>

      <Topic
        icon="🎫"
        title="Session vs Token Authentication"
        scenario="Internal admin portals use server-side sessions for tighter revocation. Mobile APIs use short-lived access tokens plus refresh tokens."
        takeaway="Sessions are stateful and easy to revoke centrally. Tokens scale well across services but need expiration, rotation, and revocation strategy."
      >
        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
            <p className="text-sm font-bold text-blue-200">Session based</p>
            <p className="mt-2 text-gray-300 leading-relaxed">Admin browser keeps a session cookie; server stores session state and can revoke instantly.</p>
          </div>
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <p className="text-sm font-bold text-red-200">Token based</p>
            <p className="mt-2 text-gray-300 leading-relaxed">Mobile app sends bearer token; services verify signature without central session lookup.</p>
          </div>
        </div>
      </Topic>

      <Topic
        icon="🔑"
        title="JWT, SSO, and OAuth 2.0"
        scenario="Employees use corporate SSO, partners connect through OAuth consent, and internal services verify JWT claims at the gateway."
        takeaway="JWT is a token format. OAuth 2.0 is delegated authorization. SSO is one-login access across apps, often built on SAML or OpenID Connect."
      >
        <SecurityFlow steps={['User opens app', 'SSO/OAuth redirect', 'Identity provider', 'JWT/access token', 'Gateway verifies']} />
      </Topic>

      <div className="rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/10 to-rose-500/5 p-5">
        <h3 className="text-lg font-bold text-white mb-2">Final Security Design</h3>
        <p className="text-sm text-gray-300 leading-relaxed">
          PayBank separates authentication from authorization, uses sessions for high-control employee apps, JWT-based
          tokens for mobile and APIs, SSO for employees, OAuth 2.0 for partner delegation, and gateway-level token
          verification before requests reach money-moving services.
        </p>
      </div>
    </div>
  );
}
