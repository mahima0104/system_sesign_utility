import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

function StoreCard({ icon, title, useCase, reason }: { icon: string; title: string; useCase: string; reason: string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <h3 className="text-sm font-bold text-white">{title}</h3>
      </div>
      <p className="text-xs font-semibold text-cyan-300">{useCase}</p>
      <p className="mt-2 text-xs text-gray-400 leading-relaxed">{reason}</p>
    </div>
  );
}

export default function DatabaseInDepthCaseStudyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/modules" className="text-xs text-gray-500 hover:text-gray-300 mb-4 inline-block">
          ← Back to Modules
        </Link>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-2xl shadow-lg shadow-cyan-500/20">
            🛒
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-cyan-400 font-semibold">Enterprise Case Study · Database In Depth</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">ShopSphere Enterprise Commerce Platform</h1>
          </div>
        </div>
        <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
          ShopSphere runs marketplace, payments, catalog, recommendations, fraud checks, and customer support across
          80 countries. The team does not ask “which database is best?” They ask “which database matches this data model,
          query pattern, and failure mode?”
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-2 gap-3">
        <StoreCard
          icon="📊"
          title="Relational Database"
          useCase="Orders, payments, inventory reservations"
          reason="Transactions, joins, constraints, and clear schema make relational storage the safest place for business-critical workflows."
        />
        <StoreCard
          icon="📄"
          title="Document Database"
          useCase="Product catalog and seller onboarding"
          reason="Product attributes vary wildly by category. A shoe, phone, and sofa should not force hundreds of nullable SQL columns."
        />
        <StoreCard
          icon="🔑"
          title="Key-Value Store"
          useCase="Cart, sessions, feature flags, rate limits"
          reason="The app often knows the exact key and needs a response in milliseconds. TTL support also cleans temporary state automatically."
        />
        <StoreCard
          icon="🕸️"
          title="Graph Database"
          useCase="Fraud rings and recommendation relationships"
          reason="Graph queries naturally express “accounts sharing devices, cards, addresses, or merchants within three hops.”"
        />
        <StoreCard
          icon="🤖"
          title="Vector Database"
          useCase="Semantic product search and support knowledge retrieval"
          reason="Embeddings let users search by meaning, not exact keywords. “Quiet laptop for college” can match lightweight notebooks with long battery life."
        />
        <StoreCard
          icon="🔍"
          title="Search Engine"
          useCase="Full-text product search and autocomplete"
          reason="Ranking, tokenization, typo tolerance, filters, and relevance scoring belong in a search index rather than raw SQL LIKE queries."
        />
      </div>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="rounded-2xl border border-gray-800 bg-gray-950/60 p-5 sm:p-7"
      >
        <h2 className="text-xl font-bold text-white mb-4">How One Checkout Request Uses Multiple Stores</h2>
        <div className="space-y-3 text-sm">
          {[
            ['1', 'Redis reads cart items and validates rate limits before checkout begins.'],
            ['2', 'Document catalog fetches product attributes, seller metadata, and delivery constraints.'],
            ['3', 'Relational database creates order, payment intent, and inventory reservation in one transaction.'],
            ['4', 'Graph database checks whether buyer, device, card, and seller connect to known fraud clusters.'],
            ['5', 'Vector database powers “similar products” if the payment fails or an item goes out of stock.'],
          ].map(([step, text]) => (
            <div key={step} className="flex gap-3 rounded-lg border border-gray-800 bg-gray-900/60 p-3">
              <span className="w-6 h-6 rounded-full border border-cyan-500/40 bg-cyan-500/10 text-cyan-200 text-xs font-bold flex items-center justify-center shrink-0">
                {step}
              </span>
              <p className="text-gray-300 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </motion.section>

      <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-violet-500/5 p-5">
        <h3 className="text-lg font-bold text-white mb-2">Senior Engineer Rule</h3>
        <p className="text-sm text-gray-300 leading-relaxed">
          Do not choose a database by popularity. Choose it by data shape, query pattern, consistency need, scale path,
          and operational burden. In enterprise systems, the best architecture is often polyglot persistence with clear
          ownership boundaries between stores.
        </p>
      </div>
    </div>
  );
}
