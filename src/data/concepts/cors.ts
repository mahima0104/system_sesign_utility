import type { ConceptDeepDive } from '../../types';

export const cors: ConceptDeepDive = {
  moduleId: 'cors',
  tagline: 'Why your browser refuses to fetch data from another website — and exactly how to fix it',

  introduction: {
    layman:
      'Have you ever seen the error: "Access to fetch at \'https://api.example.com\' from origin \'https://myapp.com\' has been blocked by CORS policy"? ' +
      'That is the browser protecting you. By default, a webpage can only talk to the same server it came from. ' +
      'CORS (Cross-Origin Resource Sharing) is the official way for a server to say: "It\'s OK — I trust requests from that other website."',
    analogy:
      'Imagine a corporate office building with a strict visitor policy. If you work there, you can enter any floor freely (same origin). ' +
      'But if you are visiting from another company, the security guard (the browser) stops you at the door. ' +
      'The only way in is if the host company has added you to the approved visitor list (the CORS headers). ' +
      'The security guard does not hate you — they are protecting the building\'s residents from uninvited guests.',
    whyMatters:
      'CORS errors are the #1 most Googled web development error. Every frontend developer hits it within their first week. ' +
      'More importantly, understanding WHY it exists (browser security, preventing malicious sites from reading your bank data) makes you a better engineer. ' +
      'In interviews, CORS questions test whether you understand HTTP, browsers, and security fundamentals — not just "how do I fix it."',
  },

  subTopics: [
    {
      title: 'What is an "Origin"?',
      icon: '🌍',
      layman:
        'An origin is three things combined: the protocol (http vs https), the domain (myapp.com), and the port (3000, 8080, 443). ' +
        'All three must match for the browser to consider two URLs the same origin. Change any one and it\'s a different origin.',
      technical:
        'Origin = scheme + host + port. Two URLs share an origin only if all three components match exactly. ' +
        'https://myapp.com and http://myapp.com are different (protocol). ' +
        'https://myapp.com and https://api.myapp.com are different (subdomain = different host). ' +
        'https://myapp.com and https://myapp.com:3000 are different (port).',
      example:
        'Your React app runs on http://localhost:3000. Your API runs on http://localhost:8080. ' +
        'Different port → different origin → browser blocks the fetch call. ' +
        'This is the most common dev environment CORS error.',
    },
    {
      title: 'The Same-Origin Policy — why blocking exists',
      icon: '🛡️',
      layman:
        'Browsers enforce a rule: a page from website A cannot read the response from website B unless B explicitly allows it. ' +
        'Without this rule, a malicious website could silently fetch your bank account data using your logged-in cookies and send it to the attacker.',
      technical:
        'The Same-Origin Policy (SOP) prevents JavaScript on one origin from reading responses from another origin. ' +
        'It does NOT block sending requests — it blocks reading the response. ' +
        'This matters: a CSRF attack can still send a request (e.g. transfer money), but cannot read the response (e.g. your balance). ' +
        'SOP + CSRF tokens together close both attack vectors.',
      example:
        'You are logged into netbanking.hdfc.com. You visit evil.com. ' +
        'evil.com\'s JS runs: fetch("https://netbanking.hdfc.com/balance"). ' +
        'Without SOP, it reads your balance. With SOP, the browser blocks the response — evil.com gets nothing.',
      whenToUse: 'Always understand: the browser enforces SOP, not the server. Disabling it on the server does not help if the browser blocks it.',
    },
    {
      title: 'CORS Headers — the approved visitor list',
      icon: '📋',
      layman:
        'CORS headers are the server\'s way of telling the browser: "I trust requests from this origin, using these methods and headers." ' +
        'The server adds these to its response, and the browser reads them before letting the JavaScript see the data.',
      technical:
        'Key response headers:\n' +
        'Access-Control-Allow-Origin: https://myapp.com  (or * for public APIs)\n' +
        'Access-Control-Allow-Methods: GET, POST, PUT, DELETE\n' +
        'Access-Control-Allow-Headers: Content-Type, Authorization\n' +
        'Access-Control-Allow-Credentials: true  (needed if sending cookies)\n' +
        'Access-Control-Max-Age: 86400  (cache preflight for 24h)\n\n' +
        'Note: You cannot use Access-Control-Allow-Origin: * AND Allow-Credentials: true together — browsers reject this combination.',
      example:
        'Your React app at https://quickeats.com fetches https://api.quickeats.com/orders. ' +
        'The API adds: Access-Control-Allow-Origin: https://quickeats.com. ' +
        'Browser sees this and says "OK, allowed" — JavaScript gets the response.',
    },
    {
      title: 'The Preflight Request — calling ahead',
      icon: '✈️',
      layman:
        'Before sending a "complex" request (with custom headers or non-GET/POST methods), the browser sends a quick check first: ' +
        '"Hey server, can I send a DELETE request with an Authorization header from this origin?" ' +
        'This check is called a preflight. If the server says yes, the real request goes through.',
      technical:
        'The browser automatically sends an OPTIONS request for any non-simple request (non-GET/HEAD/POST, or POST with non-standard Content-Type, or any custom header like Authorization). ' +
        'The server must respond to OPTIONS with appropriate CORS headers. ' +
        'If the preflight fails (missing headers, wrong origin), the real request never fires. ' +
        'Preflights add a round trip — cache them with Access-Control-Max-Age to avoid the overhead on every request.',
      example:
        'POST https://api.quickeats.com/orders with Content-Type: application/json triggers a preflight. ' +
        'Browser sends: OPTIONS /orders  Origin: https://quickeats.com  Access-Control-Request-Method: POST  Access-Control-Request-Headers: Content-Type. ' +
        'Server replies: 200 OK  Access-Control-Allow-Origin: https://quickeats.com  Access-Control-Allow-Methods: POST. ' +
        'Browser then sends the actual POST.',
      whenToUse: 'Simple requests (GET, POST with form data, no custom headers) skip the preflight. Everything else triggers it.',
    },
    {
      title: 'How to fix CORS errors — the 3-step guide',
      icon: '🔧',
      layman:
        'CORS is ALWAYS fixed on the server, never in the browser or frontend code. ' +
        'The fix is to add the right headers to your server\'s responses. Here is exactly how.',
      technical:
        'Step 1 — Identify the blocked origin from the browser error message.\n' +
        'Step 2 — Add CORS middleware on your server:\n' +
        '  Node/Express: npm i cors  → app.use(cors({ origin: "https://myapp.com" }))\n' +
        '  Django: pip install django-cors-headers  → CORS_ALLOWED_ORIGINS = ["https://myapp.com"]\n' +
        '  Spring Boot: @CrossOrigin(origins = "https://myapp.com") on the controller\n' +
        'Step 3 — If using cookies/auth, also set: credentials: true in the CORS config AND credentials: "include" in your fetch call.\n\n' +
        'Anti-pattern: never use Access-Control-Allow-Origin: * in production for authenticated endpoints — it allows ANY website to read the response.',
      example:
        'Error: "blocked by CORS policy: No \'Access-Control-Allow-Origin\' header."\n' +
        'Fix in Express: const cors = require("cors"); app.use(cors({ origin: "http://localhost:3000" }));\n' +
        'Reload page → CORS error gone.',
    },
  ],

  comparison: {
    caption: 'CORS vs CSRF — two different threats, often confused',
    columns: ['Dimension', 'CORS', 'CSRF'],
    rows: [
      ['What it prevents', 'Malicious site reading your data', 'Malicious site sending requests on your behalf'],
      ['Who enforces it',  'Browser (blocks response reads)', 'Server (validates CSRF token)'],
      ['Attack vector',    'Cross-origin response reading',  'Cross-origin state-changing requests'],
      ['Fix',              'Server adds CORS headers',       'Server requires CSRF token in requests'],
      ['Example',          'evil.com reads your bank balance', 'evil.com transfers money using your session'],
    ],
  },

  realWorldExamples: [
    {
      company: 'GitHub API',
      icon: '🐙',
      description:
        'GitHub\'s public API uses Access-Control-Allow-Origin: * for unauthenticated endpoints — any website can read public repo data. ' +
        'Authenticated endpoints require specific origins and credentials.',
    },
    {
      company: 'Stripe',
      icon: '💳',
      description:
        'Stripe\'s payment widget (stripe.js) runs in an iframe from stripe.com. CORS and iframe sandboxing together ensure your site cannot read card details — only Stripe\'s own JS can.',
    },
    {
      company: 'Every React + Express app',
      icon: '⚛️',
      description:
        'The most common setup: React on localhost:3000, API on localhost:8080. ' +
        'Fix: app.use(cors({ origin: "http://localhost:3000" })) on the Express server. ' +
        'In production, replace with your actual frontend domain.',
    },
  ],

  interviewQuestions: [
    {
      question: 'What is CORS and why does it exist?',
      answer:
        'CORS (Cross-Origin Resource Sharing) is a browser security mechanism that restricts how JavaScript on one origin can access resources from another. It exists because of the Same-Origin Policy — without it, malicious websites could read sensitive data from other sites using the user\'s cookies and session. CORS headers let servers explicitly allow trusted origins.',
    },
    {
      question: 'What is a preflight request?',
      answer:
        'A preflight is an automatic HTTP OPTIONS request the browser sends before a "complex" cross-origin request (non-simple methods like DELETE/PUT, or custom headers like Authorization). It asks the server: "Can I send this request from this origin?" If the server responds with the right CORS headers, the actual request proceeds. This adds a round trip — cache it with Access-Control-Max-Age.',
    },
    {
      question: 'What is the difference between CORS and CSRF?',
      answer:
        'CORS prevents cross-origin response reading — a malicious site cannot read your bank balance. CSRF prevents cross-origin state changes — a malicious site sending a request using your session. They protect against different attacks: CORS is enforced by the browser on responses; CSRF is defended by the server via tokens on requests.',
    },
    {
      question: 'Can you fix a CORS error from the frontend?',
      answer:
        'No — CORS is always fixed on the server. The browser enforces it and only relaxes when the server sends the right Access-Control-Allow-Origin header. Frontend workarounds (like a development proxy) only mask the problem in dev and do not work in production.',
    },
  ],

  commonMistakes: [
    'Trying to fix CORS from the frontend — it must be fixed on the server',
    'Using Access-Control-Allow-Origin: * with Access-Control-Allow-Credentials: true — browsers reject this combination',
    'Forgetting to handle OPTIONS preflight requests — the real request will never fire',
    'Setting CORS on only some routes — the preflight hits the OPTIONS route separately',
    'Confusing CORS with authentication — CORS is about which origins can read responses, not about whether users are logged in',
  ],
};
