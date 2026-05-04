import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

function Metric({ label, value, tone = 'emerald' }: { label: string; value: string; tone?: 'emerald' | 'cyan' | 'amber' | 'rose' }) {
  const tones = {
    emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
    cyan: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100',
    amber: 'border-amber-500/30 bg-amber-500/10 text-amber-100',
    rose: 'border-rose-500/30 bg-rose-500/10 text-rose-100',
  };

  return (
    <div className={`rounded-lg border px-3 py-2 ${tones[tone]}`}>
      <p className="text-[10px] uppercase tracking-wider opacity-70">{label}</p>
      <p className="text-sm font-bold">{value}</p>
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
        <div className="shrink-0 w-12 h-12 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 flex items-center justify-center text-2xl">
          {icon}
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Fundamental {index}</p>
          <h2 className="text-xl sm:text-2xl font-bold text-white">{title}</h2>
          <p className="mt-1.5 text-sm text-gray-400 leading-relaxed">{scenario}</p>
        </div>
      </div>
      <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 sm:p-5 mb-4">{children}</div>
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
        <p className="text-[11px] uppercase tracking-wider text-emerald-300 font-semibold mb-1">Interview takeaway</p>
        <p className="text-sm text-gray-200 leading-relaxed">{takeaway}</p>
      </div>
    </motion.section>
  );
}

export default function DatabaseFundamentalsCaseStudyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/modules" className="text-xs text-gray-500 hover:text-gray-300 mb-4 inline-block">
          ← Back to Modules
        </Link>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/20">
            🏦
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">Enterprise Case Study · Database Fundamentals</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">PayBank Core Banking Platform</h1>
          </div>
        </div>
        <p className="text-gray-300 leading-relaxed text-sm sm:text-base mb-5">
          PayBank is launching a UPI-style digital banking product for savings accounts, transfers, merchant payments,
          notification history, and fraud signals. One product touches multiple database decisions: which database type,
          where SQL is safer than NoSQL, and why ACID is non-negotiable for money movement.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Metric label="Users" value="40 M" />
          <Metric label="Peak traffic" value="120 K TPS" tone="cyan" />
          <Metric label="Ledger SLA" value="Zero loss" tone="amber" />
          <Metric label="Audit retention" value="7 years" tone="rose" />
        </div>
      </motion.div>

      <TopicSection
        index={1}
        icon="🗺️"
        title="Database Types"
        scenario="A real enterprise system is rarely one database. PayBank uses the right storage model for each workflow instead of forcing every feature into one table design."
        takeaway="In interviews, start from access patterns: transactions, lookup speed, relationships, search, analytics, or similarity. Database type follows the workload."
      >
        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          {[
            ['Accounts ledger', 'Relational DB', 'Balances, transfers, and audit records need strict constraints and transactions.'],
            ['Session cache', 'Key-value store', 'Login sessions and OTP attempts need fast lookup by key with TTL.'],
            ['KYC profile', 'Document DB', 'Customer profile fields evolve by region, document type, and compliance rules.'],
            ['Fraud network', 'Graph DB', 'Find linked devices, merchants, and accounts across many-hop relationships.'],
          ].map(([name, db, why]) => (
            <div key={name} className="rounded-lg border border-gray-700 bg-gray-950/60 p-3">
              <p className="font-semibold text-white">{name}</p>
              <p className="text-emerald-300 mt-1">{db}</p>
              <p className="text-gray-500 mt-1 leading-relaxed">{why}</p>
            </div>
          ))}
        </div>
      </TopicSection>

      <TopicSection
        index={2}
        icon="⚖️"
        title="SQL vs NoSQL"
        scenario="PayBank chooses SQL for the ledger because correctness beats flexibility. It chooses NoSQL for notification timelines because the schema changes often and reads are user-scoped."
        takeaway="SQL is usually the default for structured, relational, high-integrity data. NoSQL wins when the shape is flexible, the access pattern is simple, or horizontal scale matters more than joins."
      >
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
            <p className="text-sm font-bold text-blue-200">SQL for money movement</p>
            <ul className="mt-3 space-y-2 text-xs text-gray-300">
              <li>Foreign keys link account, transaction, merchant, and settlement tables.</li>
              <li>Unique constraints prevent duplicate transfer ids.</li>
              <li>Transactions debit one account and credit another together.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
            <p className="text-sm font-bold text-cyan-200">NoSQL for activity feed</p>
            <ul className="mt-3 space-y-2 text-xs text-gray-300">
              <li>Each user notification document can have different metadata.</li>
              <li>Reads fetch one user timeline without joins.</li>
              <li>Old notifications expire or archive without touching ledger data.</li>
            </ul>
          </div>
        </div>
      </TopicSection>

      <TopicSection
        index={3}
        icon="🧪"
        title="ACID Properties"
        scenario="A transfer is the simplest place to see ACID. Debit succeeds, credit fails, server crashes, retry happens, and still the bank must never create or lose money."
        takeaway="For financial systems, explain ACID in failure modes: all-or-nothing writes, valid balances, isolated concurrent transfers, and committed data surviving crashes."
      >
        <div className="grid sm:grid-cols-4 gap-2 text-xs">
          {[
            ['Atomicity', 'Debit and credit both happen, or neither happens.'],
            ['Consistency', 'Balance cannot go below allowed limits and ledger totals must match.'],
            ['Isolation', 'Two transfers from the same account cannot both spend the same balance.'],
            ['Durability', 'Once success is returned, crash recovery must preserve the transfer.'],
          ].map(([name, text]) => (
            <div key={name} className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
              <p className="font-bold text-emerald-200">{name}</p>
              <p className="mt-1 text-gray-400 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </TopicSection>

      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 p-5">
        <h3 className="text-lg font-bold text-white mb-2">Final Architecture Decision</h3>
        <p className="text-sm text-gray-300 leading-relaxed">
          PayBank uses PostgreSQL for accounts and ledger, Redis for sessions and rate limits, MongoDB-style documents
          for KYC and notifications, and a graph database for fraud relationships. The key lesson: enterprise database
          design is a portfolio of storage choices, with ACID protecting the flows where correctness is the product.
        </p>
      </div>
    </div>
  );
}
