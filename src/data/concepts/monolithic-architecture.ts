import type { ConceptDeepDive } from '../../types';

export const monolithicArchitecture: ConceptDeepDive = {
  moduleId: 'monolithic-architecture',
  tagline: 'A single deployable application where UI, business logic, and data access are built and released together.',
  introduction: {
    layman:
      'A monolith is one application that contains most of the product in one place. You build it, test it, and deploy it as a single unit.',
    analogy:
      'Imagine one big department store. Clothes, electronics, billing, storage, and support are all inside the same building. It is easy to start and navigate, but expansion can become harder as the store grows.',
    whyMatters:
      'Many successful products start as monoliths because they are simple, fast to build, and easy to understand. Interviews often test whether you know when a monolith is enough and when it starts becoming a scaling or team bottleneck.',
  },
  subTopics: [
    {
      title: 'What Is a Monolith?',
      icon: '🧱',
      layman:
        'A monolith keeps the product together instead of splitting every capability into separate services.',
      technical:
        'A monolithic application packages modules such as routing, controllers, business logic, templates, jobs, and data access into one deployable artifact. It may still have clean internal modules, but runtime deployment is unified.',
      example:
        'A Rails, Django, Laravel, Spring Boot, or Express app that contains auth, user profiles, payments, admin screens, and reporting in one codebase is a common monolith.',
      whenToUse:
        'Use a monolith when the product is early, the team is small, requirements are changing quickly, and operational simplicity matters more than independent service scaling.',
    },
    {
      title: 'Internal Layers',
      icon: '📚',
      layman:
        'Even if the app deploys as one unit, the code should still be organized into clear sections.',
      technical:
        'A healthy monolith separates concerns internally: presentation or API layer, business/domain layer, data access layer, background workers, integrations, and shared utilities. This is sometimes called a modular monolith.',
      example:
        'An e-commerce monolith can have separate modules for catalog, cart, checkout, payments, orders, and notifications while still deploying one app.',
      whenToUse:
        'Use clear module boundaries from the beginning so the app stays maintainable and can later be split if needed.',
    },
    {
      title: 'Benefits',
      icon: '✅',
      layman:
        'A monolith is usually the fastest way to build the first useful version of a product.',
      technical:
        'Benefits include simple local development, one deployment pipeline, direct function calls instead of network calls, easier transactions across modules, simpler debugging, and lower infrastructure overhead.',
      example:
        'A startup can ship login, dashboard, billing, and admin flows quickly in one app without managing service discovery, message buses, distributed tracing, or many CI/CD pipelines.',
      whenToUse:
        'Prefer a monolith when the main risk is product discovery, not massive scale or many independent engineering teams.',
    },
    {
      title: 'Limitations',
      icon: '⚠️',
      layman:
        'As the product and team grow, one big app can become slower to change, test, deploy, and scale.',
      technical:
        'Common limitations include large codebase coupling, slow builds, risky deployments, difficulty scaling one hot component independently, shared database contention, and ownership conflicts between teams.',
      example:
        'If search needs 20x more compute than user profile pages, a monolith may force scaling the entire application instead of only the search component.',
      whenToUse:
        'Watch for measurable pain: slow release cycles, frequent cross-team conflicts, scaling one module by scaling everything, or repeated incidents from unrelated code changes.',
    },
    {
      title: 'Scaling a Monolith',
      icon: '📈',
      layman:
        'You do not need microservices immediately. Many monoliths scale very far with the right architecture.',
      technical:
        'Scale a monolith with horizontal replicas, stateless web servers, load balancing, caching, database indexing, read replicas, async workers, job queues, CDN, and careful module boundaries. Extract services only when a boundary is stable and independently valuable.',
      example:
        'A monolithic web app can run behind a load balancer with 20 identical app servers, Redis cache, background workers for emails, and read replicas for analytics-heavy queries.',
      whenToUse:
        'Scale the monolith first when bottlenecks are infrastructure or query related. Split services when team ownership, deployment independence, or isolated scaling clearly pays for the complexity.',
    },
    {
      title: 'Monolith vs Microservices',
      icon: '⚖️',
      layman:
        'A monolith optimizes for simplicity. Microservices optimize for independent ownership and scaling, but cost more to operate.',
      technical:
        'Microservices split capabilities into independently deployable services communicating over APIs or events. They improve autonomy and independent scaling, but introduce distributed systems problems such as network failures, data consistency, observability, deployment coordination, and versioning.',
      example:
        'Payments might be extracted from a monolith once it needs stricter compliance, separate release ownership, isolated scaling, and strong operational controls.',
      whenToUse:
        'Start with a modular monolith unless you already have strong reasons: large teams, independent domains, high scale, compliance boundaries, or clearly different reliability/scaling needs.',
    },
  ],
  comparison: {
    caption: 'A monolith is not automatically bad; it is a trade-off.',
    columns: ['Dimension', 'Monolith', 'Microservices'],
    rows: [
      ['Deployment', 'One application deployed together', 'Many services deployed independently'],
      ['Development speed', 'Fast for small teams and early products', 'Fast only with mature platform and ownership'],
      ['Scaling', 'Scale the whole app or carefully optimize internals', 'Scale individual services independently'],
      ['Debugging', 'Simpler call stack and local reproduction', 'Needs tracing, logs, metrics, and cross-service debugging'],
      ['Data consistency', 'Easier transactions in one database boundary', 'Requires distributed consistency patterns and events'],
      ['Operational cost', 'Lower infrastructure and DevOps overhead', 'Higher operational complexity'],
    ],
  },
  realWorldExamples: [
    {
      company: 'Early-Stage SaaS',
      icon: '🚀',
      description:
        'A small team can build auth, billing, dashboard, notifications, and admin tools in one deployable app to move quickly.',
    },
    {
      company: 'E-Commerce Admin',
      icon: '🛒',
      description:
        'Internal catalog, order, refund, and support screens may live comfortably in one monolith because traffic is controlled.',
    },
    {
      company: 'Content Management System',
      icon: '📝',
      description:
        'Publishing, user roles, media management, templates, and comments are often easier to manage in one application.',
    },
    {
      company: 'Modular Enterprise App',
      icon: '🏢',
      description:
        'Large companies may keep a modular monolith for stable domains while extracting only high-change or high-scale components.',
    },
  ],
  interviewQuestions: [
    {
      question: 'What is monolithic architecture?',
      answer:
        'Monolithic architecture is a design where most application capabilities are packaged and deployed as one unit. The code can still be internally modular, but deployment, release, and runtime scaling are usually tied to the whole application.',
    },
    {
      question: 'Why would you choose a monolith over microservices?',
      answer:
        'I would choose a monolith for early products, small teams, simpler domains, and situations where speed, debugging simplicity, and low operational overhead matter more than independent service scaling. A modular monolith can scale far while preserving clean boundaries.',
    },
    {
      question: 'When should a monolith be split into services?',
      answer:
        'Split when there is clear evidence: one module needs independent scaling, separate reliability requirements, different compliance controls, independent team ownership, or release bottlenecks. The boundary should be stable enough to justify distributed systems complexity.',
    },
    {
      question: 'How do you scale a monolithic application?',
      answer:
        'Make web servers stateless, add a load balancer, run multiple app replicas, use CDN and caching, optimize database indexes, add read replicas, move slow work to background queues, and isolate heavy modules internally before extracting services.',
    },
  ],
  commonMistakes: [
    'Treating “monolith” as a synonym for messy code. A monolith can be clean if it has strong module boundaries and ownership.',
    'Jumping to microservices before the product, domain boundaries, team structure, or scale requirements are clear.',
    'Letting every module access every table and function directly. That creates a big ball of mud and makes future extraction painful.',
    'Scaling the entire app blindly instead of measuring the actual bottleneck: database query, cache miss, CPU-heavy endpoint, or background job queue.',
    'Ignoring deployment discipline. A monolith still needs tests, feature flags, rollback strategy, observability, and careful release practices.',
  ],
};
