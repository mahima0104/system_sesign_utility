import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

function SystemCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <h3 className="text-sm font-bold text-white">{title}</h3>
      </div>
      <p className="text-xs text-gray-400 leading-relaxed">{body}</p>
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
        <div className="shrink-0 w-12 h-12 rounded-2xl border border-teal-500/40 bg-teal-500/10 flex items-center justify-center text-2xl">
          {icon}
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Distributed caching {index}</p>
          <h2 className="text-xl sm:text-2xl font-bold text-white">{title}</h2>
          <p className="mt-1.5 text-sm text-gray-400 leading-relaxed">{scenario}</p>
        </div>
      </div>
      <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 sm:p-5 mb-4">{children}</div>
      <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 px-4 py-3">
        <p className="text-[11px] uppercase tracking-wider text-teal-300 font-semibold mb-1">Interview takeaway</p>
        <p className="text-sm text-gray-200 leading-relaxed">{takeaway}</p>
      </div>
    </motion.section>
  );
}

export default function DistributedCachingCaseStudyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/modules" className="text-xs text-gray-500 hover:text-gray-300 mb-4 inline-block">
          ← Back to Modules
        </Link>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-2xl shadow-lg shadow-teal-500/20">
            🎬
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-teal-400 font-semibold">Enterprise Case Study · Distributed Caching</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">StreamNow Global Cache Platform</h1>
          </div>
        </div>
        <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
          StreamNow launches a new season of a popular show across India, Europe, and North America. Millions of users
          open the app at the same minute. The system needs posters, home-page rows, subtitles, video manifests, and
          personalization metadata close to users without melting the origin services.
        </p>
      </motion.div>

      <TopicBlock
        index={1}
        icon="🌍"
        title="CDN"
        scenario="Video segments, posters, subtitles, and JavaScript bundles are served from edge locations near users instead of one central origin."
        takeaway="Use a CDN for static or cacheable edge content. It reduces latency, absorbs traffic spikes, and protects origin bandwidth."
      >
        <div className="grid sm:grid-cols-3 gap-3">
          <SystemCard icon="🇮🇳" title="Mumbai edge" body="Serves Indian viewers with low round-trip time and cached HLS segments." />
          <SystemCard icon="🇩🇪" title="Frankfurt edge" body="Caches European posters, subtitles, and app assets during release night." />
          <SystemCard icon="🇺🇸" title="Virginia origin" body="Stores canonical media objects and only receives misses or purge refreshes." />
        </div>
      </TopicBlock>

      <TopicBlock
        index={2}
        icon="🕸️"
        title="Distributed Cache Architecture"
        scenario="Application APIs use regional Redis clusters for home-page rows, account state, playback entitlements, and recommendation snapshots."
        takeaway="Distributed cache needs sharding, replication, failover, and hot-key detection. A cache cluster is a production system, not just a fast map."
      >
        <div className="space-y-2 text-sm text-gray-300">
          {[
            'Consistent hashing spreads keys across Redis shards.',
            'Replica nodes serve reads when primaries fail.',
            'Regional clusters keep user-facing latency below 20 ms.',
            'Hot keys like show:season-finale are replicated or locally cached.',
          ].map((step) => (
            <div key={step} className="rounded-lg border border-gray-800 bg-gray-950/60 p-3">{step}</div>
          ))}
        </div>
      </TopicBlock>

      <TopicBlock
        index={3}
        icon="🔄"
        title="Cache Invalidation"
        scenario="A content moderator removes a trailer, a subtitle file is corrected, and a show title changes. StreamNow must remove stale copies from CDN and Redis quickly."
        takeaway="Invalidation is a correctness workflow. Use versioned keys, event-driven purge messages, short TTLs for risky data, and audit logs for critical purges."
      >
        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          <SystemCard icon="🏷️" title="Versioned keys" body="poster:show-42:v18 makes new content visible without waiting for old keys to expire." />
          <SystemCard icon="📣" title="Purge events" body="Content update publishes an invalidation event consumed by CDN and Redis purge workers." />
          <SystemCard icon="⏱️" title="Short TTL" body="Entitlements and regional availability expire quickly because stale access can violate contracts." />
          <SystemCard icon="🧾" title="Audit trail" body="Every purge records who changed content, when it happened, and which regions were affected." />
        </div>
      </TopicBlock>

      <TopicBlock
        index={4}
        icon="⚡"
        title="Cache Stampede"
        scenario="At midnight, the finale page cache expires globally. Without protection, millions of users miss cache at once and every API instance recomputes the same home-page row."
        takeaway="Prevent stampedes with per-key locking, early refresh, jittered TTLs, stale-while-revalidate, and background refresh workers."
      >
        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          {[
            ['Jittered TTL', 'Keys expire across a time window, not all at midnight.'],
            ['Single-flight lock', 'Only one request rebuilds a missing hot key.'],
            ['Stale-while-revalidate', 'Users receive slightly stale content while refresh runs.'],
            ['Background refresh', 'Workers refresh hot keys before users hit expiry.'],
          ].map(([name, text]) => (
            <div key={name} className="rounded-lg border border-teal-500/20 bg-teal-500/5 p-3">
              <p className="font-bold text-teal-200">{name}</p>
              <p className="mt-1 text-gray-400 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </TopicBlock>

      <TopicBlock
        index={5}
        icon="🔥"
        title="Cache Warming"
        scenario="Before launch, StreamNow preloads season artwork, top rows, subtitles, manifests, and recommendation fallbacks into edge and regional caches."
        takeaway="Cache warming is deployment planning. Warm predictable hot data before traffic arrives, then monitor hit rate and origin load during rollout."
      >
        <div className="space-y-3 text-sm text-gray-300">
          {['T-24h: preload posters and trailers to CDN edges', 'T-1h: warm home-page rows for expected regions', 'T-5m: refresh entitlement and availability caches', 'Launch: monitor hit rate, origin QPS, and hot-key alerts'].map((step) => (
            <div key={step} className="rounded-lg border border-gray-800 bg-gray-950/60 p-3">{step}</div>
          ))}
        </div>
      </TopicBlock>

      <div className="rounded-2xl border border-teal-500/20 bg-gradient-to-br from-teal-500/10 to-cyan-500/5 p-5">
        <h3 className="text-lg font-bold text-white mb-2">Final Architecture Decision</h3>
        <p className="text-sm text-gray-300 leading-relaxed">
          StreamNow uses CDN edges for static/media objects, regional Redis clusters for API responses, event-driven
          invalidation for content changes, stampede protection for hot keys, and scheduled warming before releases.
          The goal is not just faster reads; it is controlled load, predictable freshness, and graceful behavior during spikes.
        </p>
      </div>
    </div>
  );
}
