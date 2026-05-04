import type { ConceptDeepDive } from '../../types';

export const contentDeliveryNetworkCdn: ConceptDeepDive = {
  moduleId: 'content-delivery-network-cdn',
  tagline: 'A globally-distributed cache that puts content milliseconds away from every user',

  introduction: {
    layman:
      'A Content Delivery Network (CDN) is a network of servers spread across the world that store copies of your website\'s static files (images, videos, CSS, JS, HTML). When a user requests a file, the CDN serves it from a nearby server instead of forcing the request to travel halfway around the planet to your origin. The result is dramatically faster page loads, lower bandwidth costs, and a more reliable experience.',
    analogy:
      'Imagine a global pizza chain. The recipe (origin) is at headquarters in Italy. But every neighborhood has a local franchise (CDN edge) that uses the same recipe to make pizza on the spot. When you order, you do not wait for a pizza to fly from Italy — you get one made down the street. The local store occasionally checks in with HQ to update the menu, but day-to-day operations happen close to the customer.',
    whyMatters:
      'CDNs absorb 60–95% of traffic for most large websites. Without one, a user in Singapore loading a US-hosted site adds ~200ms of round-trip latency per request — and a typical page makes 50+ requests, compounding to multi-second slowdowns. CDNs are non-negotiable for any global product. Senior engineers must understand the cache-control headers, invalidation strategies, edge compute capabilities, and security features of modern CDNs.',
  },

  subTopics: [
    {
      title: 'How a CDN Works — Edge, Origin, and Routing',
      icon: '🌍',
      layman:
        'A CDN consists of hundreds of "edge" data centers (Points of Presence, or PoPs) scattered around the world. Your origin server holds the master copy. When a user requests a file, the CDN routes them to the nearest PoP. If that PoP has a cached copy, it serves it directly (a "cache hit"); if not, it fetches from origin once, caches, then serves.',
      technical:
        'DNS-based routing or Anycast IP routing directs the user to the geographically nearest PoP. Anycast: the same IP is announced from many edges; BGP picks the network-shortest path. DNS-based: GeoDNS resolves a domain like static.example.com to a PoP-specific IP based on the resolver\'s location. Inside the PoP, an edge server (Varnish, custom NGINX) checks its local cache. Cache miss path: edge fetches from origin (or from a regional/parent cache layer first — "tiered caching" reduces origin load further), stores it locally with the configured TTL, returns to user. Subsequent requests within TTL are served from the edge in ~10ms instead of ~150ms.',
      example:
        'When you load github.com from Mumbai: DNS resolves to a Cloudflare PoP in Mumbai. CSS/JS/images come from that PoP\'s cache (~5ms). HTML comes from GitHub\'s origin via the same Cloudflare PoP (~50ms with TLS terminated at edge). Without Cloudflare, every request would cross the Pacific — adding ~200ms each.',
      whenToUse:
        'Always for static assets (CSS, JS, images, video). Increasingly for dynamic but cacheable content (API responses with short TTLs). For purely-personalized dynamic responses, CDNs still help via SSL termination and edge compute.',
    },
    {
      title: 'Cache-Control Headers — Telling the CDN What to Do',
      icon: '🏷️',
      layman:
        'The CDN does not guess what to cache or for how long. Your origin server sends HTTP headers (Cache-Control, ETag, Expires) on each response, and the CDN follows those instructions. Setting them correctly is the most common knob you turn when working with CDNs.',
      technical:
        'Cache-Control is the workhorse: max-age=86400 (cache for 24h), s-maxage=86400 (CDN-only TTL, overrides max-age for shared caches), public/private (whether intermediate caches can store), no-store (do not cache), no-cache (cache, but revalidate on each use), must-revalidate (do not serve stale on revalidation failure). Stale-while-revalidate: serve stale up to N seconds while fetching fresh in background — huge user-experience win. ETag and Last-Modified enable conditional GET (304 Not Modified responses), saving bandwidth even on misses. Vary header: tells CDN which request headers create distinct cache entries (e.g., Vary: Accept-Encoding for gzip vs uncompressed). Misconfigured Vary causes massive cache fragmentation. Origin must set headers correctly; CDN config can override.',
      example:
        'Cloudflare default: respects Cache-Control. If you set Cache-Control: public, max-age=3600 on your CSS files, Cloudflare caches them at the edge for 1 hour. For dynamic API responses, Cache-Control: public, s-maxage=60, stale-while-revalidate=300 lets CDN serve cached for 60s and stale-but-refreshing for 5 more minutes — origin sees 1 request per 60s per PoP per URL.',
    },
    {
      title: 'Cache Invalidation (Purging) — Updating Edge Content',
      icon: '🧹',
      layman:
        'When you change a file at origin, every PoP\'s cache still has the old version until its TTL expires. To force an immediate update, you "purge" the cache. Most CDNs offer purge by URL, by tag, or full purge — each with different speed and cost tradeoffs.',
      technical:
        'Purge methods: (1) URL purge — invalidate specific URLs; fastest, common API call, often free. (2) Tag-based purge — origin tags responses with metadata (Cache-Tag header), purge by tag invalidates all responses with that tag (e.g., purge "product-42" invalidates the product page, search results, and category lists in one call). (3) Full purge — wipes everything; expensive, slow, cause origin stampede. Best practice: use cache-busting URLs instead of purging — append a hash or version (style.abc123.css) so each deploy makes new URLs; the old ones simply age out. Avoids the entire purge problem. For HTML and dynamic content where URLs cannot change, use short TTLs + stale-while-revalidate.',
      example:
        'Vercel and Netlify use cache-busting filenames for assets (each build produces hashed filenames). HTML pages are short-TTL (30 seconds) with stale-while-revalidate. After deploy, new HTML propagates within seconds; old asset URLs expire naturally.',
    },
    {
      title: 'Use Cases — What CDNs Cache Well',
      icon: '📦',
      layman:
        'Anything that is the same for many users and rarely changes belongs on a CDN: static assets, video segments, API responses with identical data per region, signed downloads. Personalized data (your inbox, your timeline) usually does not, but tricks like edge personalization can still help.',
      technical:
        '(1) Static assets — CSS/JS/images/fonts: cache for months with hash-based URLs. (2) Video — HLS/DASH segments: 6–10 second clips, perfectly cacheable; CDNs handle 99% of streaming bandwidth. (3) Software downloads — large binaries; CDN drops origin bandwidth costs by 100×. (4) HTML for marketing / blog pages: short TTL, stale-while-revalidate. (5) API responses for read-mostly endpoints (geo-IP, exchange rates): short TTLs, Vary on auth/region. (6) Edge compute (Cloudflare Workers, Vercel Edge, AWS Lambda@Edge): personalize at the edge, cache the rest. Bad fits without edge compute: per-user dashboards, real-time data, anything cookie-keyed by default.',
      example:
        'Netflix offloads 95%+ of video traffic to its own private CDN (Open Connect) — colocated edge caches inside ISPs themselves. ISP-side caching means subscriber video traffic never even leaves the ISP, saving billions in transit costs.',
    },
    {
      title: 'CDN Beyond Caching — DDoS, TLS, Edge Compute',
      icon: '🛡️',
      layman:
        'Modern CDNs do far more than cache files. They terminate TLS at the edge (faster handshakes), absorb DDoS attacks (filtering bad traffic before it reaches origin), and run code at the edge to personalize, A/B test, or rewrite responses without touching origin.',
      technical:
        '(1) TLS termination at edge — TCP+TLS handshake completes at the nearest PoP (~10ms RTT) instead of origin (~150ms). HTTP/2 / HTTP/3 multiplexing further reduces handshakes. (2) DDoS protection — CDNs absorb volumetric attacks (terabits/sec) by their sheer capacity; rate limit per IP/path; challenge suspicious traffic with JS or CAPTCHA. (3) Edge compute — Cloudflare Workers (V8 isolates), Vercel Edge (V8), AWS Lambda@Edge (Node/Python), Fastly Compute (WebAssembly). Sub-50ms cold starts. Use cases: A/B tests, header rewriting, auth at edge, geo-routing, image transformations, edge-side includes. (4) WAF (web application firewall) — rule-based filtering of malicious requests. (5) Bot management — distinguish humans from scrapers / scalpers.',
      example:
        'Cloudflare handles >50M HTTP requests/sec at peak. They mitigated a 71M req/sec DDoS in 2023 — the largest publicly disclosed attack — primarily by absorbing it across their global edge. No single origin server could survive that traffic.',
    },
    {
      title: 'Tiered Caching & Origin Shielding',
      icon: '🏰',
      layman:
        'Without help, every PoP that gets a miss has to fetch from your origin. With 250 PoPs, a single origin update can produce 250 origin requests for the same file. Tiered caching adds a regional or central layer between PoPs and origin, so origin sees 1–3 requests instead of 250.',
      technical:
        'Architecture: edge PoPs → regional parent caches (3–10 worldwide) → origin. On a PoP miss, request goes to the parent. If parent has it, fill PoP from parent (fast, no origin hit). If parent misses, parent fetches from origin once, fills, then fans out to PoPs. Origin shield: a single configured "shield" PoP for all origin traffic — guarantees origin sees at most 1 concurrent request per cacheable URL even across the whole network. Cloudflare Tiered Cache, Fastly Origin Shield, AWS CloudFront Origin Shield all implement variants.',
      example:
        'A breaking-news site posts a story. Without tiered caching: 250 PoPs miss simultaneously, 250 requests hit origin within milliseconds — DB melts. With tiered cache + origin shield: 1 request reaches origin, 1 cache fill propagates to the regional layer, then naturally to PoPs. Origin sees 100% predictable load regardless of viral traffic.',
    },
    {
      title: 'CDN Providers & Selection',
      icon: '🏢',
      layman:
        'The big CDN players are Cloudflare, Fastly, Akamai, CloudFront (AWS), and Google Cloud CDN. They differ in PoP coverage, edge compute capability, pricing model, and ease of integration. Smaller specialty providers (Bunny, KeyCDN) compete on price for video/static workloads.',
      technical:
        'Cloudflare: ~310 PoPs, generous free tier, V8 Workers, focus on security + ease of use. Fastly: ~80 powerful PoPs, instant purge (sub-second global), VCL configurability, WebAssembly edge compute (Compute@Edge). Akamai: largest network historically, deepest enterprise feature set, complex pricing. CloudFront: integrates tightly with AWS (S3, ALB, Lambda@Edge), pay-as-you-go. Google Cloud CDN: integrates with GCP load balancers, fewer PoPs but high quality. Selection criteria: PoP coverage in your user geography, integration with your stack, edge compute requirements, purge speed (Fastly excels), security features, pricing model.',
      example:
        'GitHub uses Fastly (instant purge — important when releasing security advisories that must update globally in seconds). Discord uses Cloudflare (security + cost). Netflix runs its own (Open Connect, private CDN inside ISPs). Stripe uses CloudFront + Cloudflare in different regions for redundancy.',
    },
  ],

  comparison: {
    caption: 'Major CDN providers compared.',
    columns: ['Aspect', 'Cloudflare', 'Fastly', 'CloudFront', 'Akamai'],
    rows: [
      ['PoPs', '~310', '~80', '~600', '~4000'],
      ['Free tier', '✅ Generous', '⚠️ Trial only', '⚠️ AWS free tier', '❌'],
      ['Edge compute', 'Workers (V8)', 'Compute@Edge (WASM)', 'Lambda@Edge', 'EdgeWorkers'],
      ['Instant purge', '~30s global', '~150ms global', '~1–60s', 'Variable'],
      ['Best at', 'Security + ease', 'Configurability', 'AWS integration', 'Enterprise scale'],
      ['Pricing model', 'Per-plan + bandwidth', 'Per-request + bandwidth', 'Per-request + bandwidth', 'Negotiated'],
    ],
  },

  realWorldExamples: [
    {
      company: 'Cloudflare',
      icon: '☁️',
      description:
        'Cloudflare\'s global edge network handles ~50M HTTP requests per second at peak across ~310 PoPs. They popularized free CDN service and pioneered V8-based edge compute (Workers). Their public dashboards regularly demonstrate the largest DDoS mitigations on record (71M req/sec in 2023).',
    },
    {
      company: 'Netflix Open Connect',
      icon: '🎬',
      description:
        'Netflix runs its own private CDN, embedding caching servers (Open Connect Appliances) inside ISP networks. >95% of Netflix bytes are served from these in-ISP caches; user video traffic never leaves the ISP\'s network, saving massive transit costs and improving latency. A canonical example of a vertically-integrated CDN.',
    },
    {
      company: 'GitHub (Fastly)',
      icon: '🐙',
      description:
        'GitHub uses Fastly as its primary CDN. Fastly\'s instant purge is a key feature: when a security advisory is published, GitHub can globally purge cached pages in milliseconds. The same applies to released artifacts — package downloads route through Fastly with high cache hit rates.',
    },
    {
      company: 'Cloudinary / Imgix (Image CDNs)',
      icon: '🖼️',
      description:
        'Specialty CDNs that combine edge caching with on-the-fly image transformation: resize, crop, format-convert, optimize. Origin holds one master image; the CDN URL specifies the transformation; the result is cached at the edge. Used by e-commerce sites worldwide to avoid hosting hundreds of pre-rendered image variants.',
    },
  ],

  interviewQuestions: [
    {
      question: 'How does a CDN actually serve content to a user?',
      answer:
        'User\'s DNS query (or Anycast IP) routes them to the nearest PoP. The PoP\'s edge server checks its local cache. On hit, it returns the file in ~10ms. On miss, it fetches from a regional parent cache or directly from origin, stores in local cache with the response\'s Cache-Control TTL, then returns to user. Subsequent users hitting the same PoP get the cached copy. The result: most requests never reach origin; latency drops 5–20×.',
    },
    {
      question: 'How do you control what the CDN caches and for how long?',
      answer:
        'Primarily via HTTP response headers from origin: Cache-Control: max-age (browser TTL), s-maxage (CDN TTL, overrides max-age for shared caches), stale-while-revalidate (serve stale while refreshing in background), no-store / no-cache, public / private. ETag + Last-Modified enable conditional GET (304 Not Modified). The Vary header creates separate cache entries by request header (e.g., Vary: Accept-Encoding for gzip variants). CDN dashboards / config files can override origin headers but should be used sparingly to avoid divergence.',
    },
    {
      question: 'You deployed a new version of style.css but users are still seeing the old one. Why?',
      answer:
        'The CDN and browsers have the old version cached for the duration of its TTL. Two fixes: (1) Purge the URL via the CDN API — wipes all PoPs and forces a re-fetch. (2) Better — use cache-busting URLs: serve style.abc123.css where abc123 is a content hash; deploys produce new URLs (style.def456.css), and the old URLs naturally age out. The hash approach avoids purging entirely and is the standard for modern build tools (Webpack, Vite, esbuild). For HTML, set a short TTL (30s) with stale-while-revalidate.',
    },
    {
      question: 'How does a CDN protect against DDoS and origin overload?',
      answer:
        'Three layers: (1) Capacity — CDN edge networks have terabits/sec of total bandwidth, absorbing volumetric attacks no origin could handle. (2) Filtering — rate limits per IP/path, JS challenges, CAPTCHA, WAF rules block malicious patterns at edge before reaching origin. (3) Tiered caching + origin shielding — even legitimate traffic spikes are absorbed: 250 PoP misses become 1 origin request via the shield. Combined, a properly-configured CDN keeps origin within normal load even under 100× traffic surges or active DDoS attacks.',
    },
    {
      question: 'What kinds of content should NOT be served via a CDN cache?',
      answer:
        '(1) Personalized content (your inbox, your dashboard) — different per user, low cache reuse. (2) Highly-dynamic data (live stock prices, real-time feeds) — staleness is unacceptable; might still benefit from CDN for TLS termination, just not caching. (3) Sensitive data without proper access controls — CDNs are shared infrastructure; medical records or financial data need encryption and strict cache scoping. (4) Strict-consistency reads — bank balances, write-then-read flows. Edge compute (Workers, Lambda@Edge) bridges some of these gaps by personalizing at the PoP without forcing origin round trips.',
    },
  ],

  commonMistakes: [
    'Forgetting to set Cache-Control headers — CDN may use minimal default TTLs, hit rate suffers.',
    'Setting Cache-Control: no-cache thinking it means "do not cache" — it actually means "cache but revalidate." Use no-store to forbid caching.',
    'Misusing Vary headers — Vary: User-Agent fragments the cache by every browser variant, killing hit rate.',
    'Purging the entire CDN on every deploy — causes a stampede of origin requests as PoPs all refill at once.',
    'No origin shielding — 250 PoPs hit origin simultaneously when content updates, melting the database.',
    'Caching authenticated responses by accident — leaking one user\'s data to others. Always set Cache-Control: private for personalized content.',
    'Ignoring CDN logs — losing visibility into what fraction of traffic origin actually sees.',
  ],
};
