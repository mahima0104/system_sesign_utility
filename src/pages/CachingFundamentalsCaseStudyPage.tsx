import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

function Metric({ label, value, tone = 'lime' }: { label: string; value: string; tone?: 'lime' | 'emerald' | 'amber' | 'rose' }) {
  const tones = {
    lime: 'border-lime-500/30 bg-lime-500/10 text-lime-100',
    emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
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

function TopicBlock({
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
        <div className="shrink-0 w-12 h-12 rounded-2xl border border-lime-500/40 bg-lime-500/10 flex items-center justify-center text-2xl">
          {icon}
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Caching fundamental {index}</p>
          <h2 className="text-xl sm:text-2xl font-bold text-white">{title}</h2>
          <p className="mt-1.5 text-sm text-gray-400 leading-relaxed">{scenario}</p>
        </div>
      </div>
      <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 sm:p-5 mb-4">{children}</div>
      <div className="rounded-xl border border-lime-500/20 bg-lime-500/5 px-4 py-3">
        <p className="text-[11px] uppercase tracking-wider text-lime-300 font-semibold mb-1">Interview takeaway</p>
        <p className="text-sm text-gray-200 leading-relaxed">{takeaway}</p>
      </div>
    </motion.section>
  );
}

export default function CachingFundamentalsCaseStudyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/modules" className="text-xs text-gray-500 hover:text-gray-300 mb-4 inline-block">
          ← Back to Modules
        </Link>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-lime-500 to-emerald-600 flex items-center justify-center text-2xl shadow-lg shadow-lime-500/20">
            🛍️
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-lime-400 font-semibold">Enterprise Case Study · Caching Fundamentals</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">FlashCart Product Page Caching</h1>
          </div>
        </div>
        <p className="text-gray-300 leading-relaxed text-sm sm:text-base mb-5">
          FlashCart runs a festival sale where one product page can receive millions of views in minutes. The database
          has the truth, but users need product details, prices, inventory badges, reviews, and recommendations in under
          100 ms. This case study shows how a real team chooses caching patterns without making stale data dangerous.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Metric label="Peak reads" value="1.8 M / min" />
          <Metric label="DB query" value="48 ms" tone="amber" />
          <Metric label="Redis hit" value="1.5 ms" tone="emerald" />
          <Metric label="Target p95" value="< 100 ms" tone="rose" />
        </div>
      </motion.div>

      <TopicBlock
        index={1}
        icon="📚"
        title="What Is Caching?"
        scenario="FlashCart first identifies data that is expensive to compute and safe to reuse briefly: product title, images, ratings summary, seller badge, and delivery promise."
        takeaway="Cache data that is read often, expensive to fetch, and acceptable to serve slightly stale. Avoid caching data where stale answers create financial or trust problems."
      >
        <div className="grid sm:grid-cols-3 gap-3 text-xs">
          {[
            ['Cache', 'Product page JSON in Redis', 'Fast reusable answer'],
            ['Source of truth', 'PostgreSQL product tables', 'Correct durable state'],
            ['TTL', '60 seconds for product details', 'Limits stale data window'],
          ].map(([label, value, note]) => (
            <div key={label} className="rounded-lg border border-gray-700 bg-gray-950/60 p-3">
              <p className="text-lime-300 font-semibold">{label}</p>
              <p className="text-white mt-1">{value}</p>
              <p className="text-gray-500 mt-1 leading-relaxed">{note}</p>
            </div>
          ))}
        </div>
      </TopicBlock>

      <TopicBlock
        index={2}
        icon="🔀"
        title="Cache-Aside Pattern"
        scenario="The product service checks Redis first. On a miss, it reads PostgreSQL, builds the product page object, stores it in Redis, and returns the response."
        takeaway="Cache-aside is simple and common because the application controls cache behavior. The trade-off is that every service must handle miss, fill, TTL, and invalidation carefully."
      >
        <div className="space-y-2 text-sm text-gray-300">
          {['GET product:42 from Redis', 'If miss, SELECT product data from PostgreSQL', 'Set product:42 with TTL=60s', 'Return response and make the next request a cache hit'].map((step, i) => (
            <div key={step} className="flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-950/60 p-3">
              <span className="w-6 h-6 rounded-full bg-lime-500/10 border border-lime-500/30 text-lime-200 text-xs font-bold flex items-center justify-center">{i + 1}</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </TopicBlock>

      <TopicBlock
        index={3}
        icon="↔️"
        title="Read-Through vs Write-Through"
        scenario="FlashCart uses read-through for reference data through a cache library, but write-through for seller profile updates so the cache and database update together."
        takeaway="Read-through hides cache population behind a cache layer. Write-through improves consistency by updating cache and database together, but adds write latency."
      >
        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
            <p className="text-sm font-bold text-blue-200">Read-through</p>
            <p className="mt-2 text-gray-300 leading-relaxed">App asks cache for seller profile. Cache fetches from database automatically on miss.</p>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className="text-sm font-bold text-emerald-200">Write-through</p>
            <p className="mt-2 text-gray-300 leading-relaxed">Seller update writes database and cache before returning success, keeping reads fresh.</p>
          </div>
        </div>
      </TopicBlock>

      <TopicBlock
        index={4}
        icon="✍️"
        title="Write-Behind Cache"
        scenario="FlashCart does not use write-behind for payments or inventory. It does use it for product view counters, batching thousands of increments before persisting analytics."
        takeaway="Write-behind is excellent for high-volume, loss-tolerant writes like counters or telemetry. It is risky for critical state because the cache temporarily holds data not yet durable."
      >
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-gray-300 leading-relaxed">
          Product view count increments hit Redis instantly. A background worker flushes aggregated counts to analytics storage every 30 seconds. If the worker fails, a few seconds of counters can be replayed or tolerated.
        </div>
      </TopicBlock>

      <TopicBlock
        index={5}
        icon="🗺️"
        title="Caching Strategies and Eviction"
        scenario="During the sale, memory is limited. FlashCart prioritizes hot product pages, removes cold keys, and keeps short TTLs for data that changes often."
        takeaway="A caching strategy is incomplete without eviction. Match eviction to access pattern: LRU for recency, LFU for popularity, TTL for freshness, and write-around for data unlikely to be read soon."
      >
        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          {[
            ['LRU', 'Product pages viewed recently stay hot.'],
            ['LFU', 'Viral products survive brief quiet periods.'],
            ['TTL', 'Price and availability expire quickly.'],
            ['Write-around', 'Bulk catalog imports skip cache until users actually read them.'],
          ].map(([name, text]) => (
            <div key={name} className="rounded-lg border border-gray-700 bg-gray-950/60 p-3">
              <p className="font-bold text-lime-200">{name}</p>
              <p className="mt-1 text-gray-400 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </TopicBlock>

      <div className="rounded-2xl border border-lime-500/20 bg-gradient-to-br from-lime-500/10 to-emerald-500/5 p-5">
        <h3 className="text-lg font-bold text-white mb-2">Final Architecture Decision</h3>
        <p className="text-sm text-gray-300 leading-relaxed">
          FlashCart uses cache-aside for product pages, write-through for seller/profile updates, write-behind for
          analytics counters, TTLs for freshness, and LRU/LFU eviction for memory pressure. The database remains the
          source of truth; cache is a speed layer with explicit failure boundaries.
        </p>
      </div>
    </div>
  );
}
