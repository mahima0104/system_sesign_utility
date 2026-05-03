import type { DesignPattern } from '../../types';

export const behavioralPatterns: DesignPattern[] = [
  // ─── Observer ─────────────────────────────────────────────────────────────────
  {
    id: 'observer',
    name: 'Observer',
    category: 'Behavioral',
    icon: '👁️',
    difficulty: 'intermediate',
    tagline: 'Notify many objects when one changes',

    definition:
      'Defines a one-to-many dependency between objects so that when one object (the Subject) changes state, all of its dependents (the Observers) are automatically notified and updated.',

    problem:
      'When state in one object changes, several other objects need to react — refresh a UI, invalidate a cache, send a notification, write an audit log. Hard-coding these reactions inside the source object couples it to every consumer and breaks the Open/Closed Principle: every new reaction means modifying the source.',

    whyNeeded:
      'The Observer pattern lets the Subject focus on its own state while observers subscribe and unsubscribe independently. Adding a new reaction means writing a new observer — zero changes to the subject. The pattern enables event-driven architectures, reactive UIs, and pub/sub messaging.',

    realLifeAnalogy:
      'A YouTube channel. The channel doesn\'t know or care who its subscribers are. When it posts a new video, every subscriber gets notified. New subscribers can join, old ones can leave, and the channel\'s job stays the same: post videos.',

    visualization: {
      caption: 'One Subject — many Observers, all notified on change.',
      entities: [
        { id: 'subj', label: 'Subject', x: 25, y: 50, icon: '📡', color: '#2563eb' },
        { id: 'o1', label: 'Email Observer', x: 75, y: 18, icon: '📧', color: '#7c3aed' },
        { id: 'o2', label: 'SMS Observer', x: 80, y: 50, icon: '📱', color: '#7c3aed' },
        { id: 'o3', label: 'Logger Observer', x: 75, y: 82, icon: '📝', color: '#7c3aed' },
      ],
      relations: [
        { from: 'subj', to: 'o1', label: 'notify()' },
        { from: 'subj', to: 'o2', label: 'notify()' },
        { from: 'subj', to: 'o3', label: 'notify()' },
      ],
    },

    animationSteps: [
      { title: 'Observers subscribe', description: 'Each observer registers itself with the Subject by calling subscribe(). The Subject stores them in a list — but doesn\'t know what each observer will do.', highlight: ['subj', 'o1', 'o2', 'o3'] },
      { title: 'Subject\'s state changes', description: 'A user signs up, a sensor reading exceeds a threshold, a stock price ticks. The Subject updates its internal state.', highlight: ['subj'] },
      { title: 'Subject notifies all observers', description: 'After updating, the Subject loops through its observer list and calls update() on each, passing the new state.', highlight: ['subj', 'o1', 'o2', 'o3'] },
      { title: 'Each observer reacts independently', description: 'Email sends mail, SMS texts a phone, Logger writes a line. Adding a fourth observer tomorrow needs zero changes to the Subject.', highlight: ['o1', 'o2', 'o3'] },
    ],

    codeExample: {
      language: 'javascript',
      description: 'A minimal Subject + Observer implementation. Try changing the price and watch each observer react. Then add your own observer.',
      starter: `class StockTicker {
  constructor(symbol) {
    this.symbol = symbol;
    this.price = 0;
    this.observers = [];
  }
  subscribe(o)   { this.observers.push(o); }
  unsubscribe(o) { this.observers = this.observers.filter(x => x !== o); }
  setPrice(price) {
    const old = this.price;
    this.price = price;
    this.observers.forEach(o => o.update(this.symbol, old, price));
  }
}

const emailAlert = {
  update: (sym, oldP, newP) => console.log('📧 Email: ' + sym + ' moved ' + oldP + ' → ' + newP),
};
const trader = {
  update: (sym, oldP, newP) => {
    if (newP > oldP * 1.05) console.log('🤖 Trader: BUY signal on ' + sym);
    else if (newP < oldP * 0.95) console.log('🤖 Trader: SELL signal on ' + sym);
  }
};
const logger = {
  update: (sym, oldP, newP) => console.log('[log] ' + sym + ' ' + oldP + ' -> ' + newP),
};

const aapl = new StockTicker('AAPL');
aapl.subscribe(emailAlert);
aapl.subscribe(trader);
aapl.subscribe(logger);

aapl.setPrice(150);
aapl.setPrice(160);   // +6.6% → BUY
aapl.setPrice(140);   // -12.5% → SELL
`,
    },

    industryUseCases: [
      { company: 'React & Vue reactivity', description: 'Components subscribe to state stores (Redux, Vuex, Zustand) and re-render whenever the relevant slice changes — without the store knowing about any specific component.' },
      { company: 'Apache Kafka & RabbitMQ', description: 'Pub/sub messaging is Observer at scale. Producers publish to topics; consumers subscribe — the broker decouples both sides.' },
      { company: 'AWS SNS / Google Cloud Pub-Sub', description: 'Cloud notification services fan out events to email, SMS, Lambda functions, and queues — each subscriber added/removed independently.' },
      { company: 'Browser event listeners', description: 'addEventListener("click", handler) is Observer in disguise. The DOM element is the Subject; each handler is an Observer notified on every click.' },
    ],

    interviewQuestion: {
      question: 'What are the failure modes of a synchronous in-process Observer pattern, and how would you mitigate them?',
      answer: 'Three big issues. (1) Slow observers block the Subject — a 2-second observer freezes every other observer and the caller. Mitigate by dispatching notifications asynchronously (Promise.allSettled, an event loop, a task queue, or a message broker). (2) Exceptions in one observer can prevent others from being notified. Wrap each update() call in a try/catch so a single buggy observer doesn\'t silence the rest. (3) Memory leaks — observers that forget to unsubscribe stay attached forever, keeping otherwise-unreachable objects alive (the "lapsed listener" problem). Mitigate with weak references (WeakRef in JS, WeakReference in Java, weakref in Python) or an explicit lifecycle hook (e.g. React\'s useEffect cleanup).',
    },

    commonMistakes: [
      'Forgetting to unsubscribe — observers leak memory and keep firing on stale state. Especially common in single-page apps where components mount/unmount frequently.',
      'Mutating the observer list while iterating during notify(). If an observer unsubscribes itself in its own update(), the loop skips the next observer or throws. Iterate over a copy.',
      'Letting observers run synchronously when they do I/O (HTTP, disk, DB). One slow observer blocks every other observer and the caller that triggered the change.',
      'Throwing inside an observer\'s update() and letting it propagate to the Subject — this skips all subsequent observers. Always isolate failures.',
      'Using Observer when Pub/Sub through a message broker would be more appropriate. Observer is in-process and synchronous by default; for cross-process or distributed notifications, reach for Kafka/RabbitMQ/SNS.',
    ],
  },

  // ─── Strategy ─────────────────────────────────────────────────────────────────
  {
    id: 'strategy',
    name: 'Strategy',
    category: 'Behavioral',
    icon: '🎯',
    difficulty: 'beginner',
    tagline: 'Swap algorithms at runtime',

    definition:
      'Defines a family of algorithms, encapsulates each one, and makes them interchangeable. Strategy lets the algorithm vary independently from clients that use it.',

    problem:
      'Code with conditional logic over algorithm types — `if (sortType === \'quick\') quickSort() else if (sortType === \'merge\') mergeSort()` — gets brittle. Adding a new algorithm requires editing this hot path, and the class doing the conditional becomes a god object.',

    whyNeeded:
      'Strategy extracts each algorithm into its own class with a shared interface. The context holds a Strategy reference; swap the strategy at runtime to change behaviour. New algorithms are new Strategy classes — context doesn\'t change. Open for extension, closed for modification.',

    realLifeAnalogy:
      'Choosing a route in Google Maps. Same start and destination, but you pick driving, walking, cycling, or transit — each is a different algorithm giving you a route. Maps doesn\'t care which one you picked; it just runs the chosen strategy.',

    visualization: {
      caption: 'Context delegates to a swappable Strategy.',
      entities: [
        { id: 'ctx', label: 'Context', x: 22, y: 50, icon: '🎯', color: '#2563eb' },
        { id: 'iface', label: 'Strategy', x: 50, y: 50, icon: '🔷', color: '#2563eb' },
        { id: 's1', label: 'Quick Sort', x: 85, y: 22, icon: '⚡', color: '#7c3aed' },
        { id: 's2', label: 'Merge Sort', x: 88, y: 50, icon: '🔀', color: '#7c3aed' },
        { id: 's3', label: 'Bubble Sort', x: 85, y: 78, icon: '🫧', color: '#7c3aed' },
      ],
      relations: [
        { from: 'ctx', to: 'iface', label: 'has-a' },
        { from: 's1', to: 'iface' },
        { from: 's2', to: 'iface' },
        { from: 's3', to: 'iface' },
      ],
    },

    animationSteps: [
      { title: 'Context configured with a Strategy', description: 'At construction or via setStrategy(), the context receives a Strategy instance — perhaps based on dataset size or user preference.', highlight: ['ctx', 'iface'] },
      { title: 'Client calls execute() on the context', description: 'The context doesn\'t implement the algorithm itself — it just dispatches to the Strategy.', highlight: ['ctx'] },
      { title: 'Strategy runs its algorithm', description: 'The Strategy does the work — Quick Sort partitions and recurses; Bubble Sort iterates and swaps. Same input, same output contract — different mechanics.', highlight: ['iface', 's1'] },
      { title: 'Swap to change behaviour', description: 'Set a different strategy → next execute() call uses the new algorithm. No edits to the context, no edits to other strategies.', highlight: ['s2', 's3'] },
    ],

    codeExample: {
      language: 'javascript',
      description: 'A Sorter that swaps between three sort strategies. The data and result contract stay identical.',
      starter: `// Strategy interface (by convention)
const QuickSort  = { name: 'Quick',  sort: (arr) => [...arr].sort((a, b) => a - b) };
const BubbleSort = {
  name: 'Bubble',
  sort: (arr) => {
    const a = [...arr];
    for (let i = 0; i < a.length; i++)
      for (let j = 0; j < a.length - i - 1; j++)
        if (a[j] > a[j + 1]) [a[j], a[j + 1]] = [a[j + 1], a[j]];
    return a;
  }
};
const MergeSort = {
  name: 'Merge',
  sort: (arr) => {
    if (arr.length < 2) return arr;
    const mid = arr.length >> 1;
    const left = MergeSort.sort(arr.slice(0, mid));
    const right = MergeSort.sort(arr.slice(mid));
    const out = [];
    let i = 0, j = 0;
    while (i < left.length && j < right.length)
      out.push(left[i] <= right[j] ? left[i++] : right[j++]);
    return out.concat(left.slice(i), right.slice(j));
  }
};

class Sorter {
  constructor(strategy) { this.strategy = strategy; }
  setStrategy(s) { this.strategy = s; }
  sort(data) {
    console.log('Using ' + this.strategy.name + ' Sort');
    return this.strategy.sort(data);
  }
}

const data = [5, 2, 8, 1, 9, 3];
const sorter = new Sorter(QuickSort);
console.log(sorter.sort(data));

sorter.setStrategy(BubbleSort);
console.log(sorter.sort(data));

sorter.setStrategy(MergeSort);
console.log(sorter.sort(data));
`,
    },

    industryUseCases: [
      { company: 'Java Comparator', description: 'Collections.sort(list, comparator) takes a Strategy. Swap comparators to sort by name, age, or any custom criterion without touching the list.' },
      { company: 'Spring Security AuthenticationProvider', description: 'Multiple auth strategies plug in (form login, OAuth, LDAP, SAML). Spring picks the matching provider for each request type.' },
      { company: 'AWS SDK retry policies', description: 'RetryPolicy strategies — exponential backoff, jittered, fixed-delay — configurable per client without touching call sites.' },
      { company: 'Payment processing', description: 'Stripe / Adyen / Braintree as swappable PaymentStrategy implementations. Switching providers means swapping the strategy, not rewriting checkout flows.' },
    ],

    interviewQuestion: {
      question: 'Strategy vs Template Method — both let subclasses customise behaviour. Which should you reach for first?',
      answer: 'Both customise behaviour, but they differ on inheritance vs composition and runtime vs compile-time choice. Template Method uses inheritance — the parent class defines a skeleton that calls hook methods which subclasses override. Strategy uses composition — the context holds a Strategy reference that can be swapped at runtime. Strategy wins by default in modern code: composition over inheritance, easier to test (inject a mock strategy), and runtime swapping enables A/B tests, feature flags, and per-tenant overrides. Reach for Template Method when the algorithm flow is genuinely shared and the variation points are minor — and you don\'t need to change behaviour after construction.',
    },

    commonMistakes: [
      'Creating a strategy interface for every two-line behaviour — over-engineering. A function pointer or lambda often suffices.',
      'Strategies that need access to context internals — leaking state breaks the abstraction.',
      'Forgetting to make the context\'s strategy field swappable — set once at construction defeats half the value.',
      'Strategies with side effects on each other or shared mutable state — should be stateless or own their state cleanly.',
      'Stuffing strategy selection into the context (`if (size > 100) useMergeSort else useBubbleSort`) — that defeats the abstraction. Let callers pick.',
    ],
  },

  // ─── Command ──────────────────────────────────────────────────────────────────
  {
    id: 'command',
    name: 'Command',
    category: 'Behavioral',
    icon: '🎮',
    difficulty: 'intermediate',
    tagline: 'Encapsulate requests as objects',

    definition:
      'Encapsulates a request as an object, letting you parameterize clients with different requests, queue or log requests, and support undoable operations.',

    problem:
      'Tight coupling between the invoker (a UI button) and the receiver (business logic). The button knows exactly what to call. To support undo, queueing, logging, or macros, you\'d teach the button about all of those concerns — or duplicate them across every invoker.',

    whyNeeded:
      'Wrap each operation in a Command object with execute() (and optionally undo()). The invoker holds a Command and calls execute() — it doesn\'t know what the command does. This decouples invoker from receiver and enables queues, logs, undo stacks, and macros for free.',

    realLifeAnalogy:
      'Restaurant order tickets. The waiter (invoker) takes your order, writes it on a ticket (command), and hands it to the kitchen (receiver). The waiter doesn\'t cook; the ticket can be queued, logged, voided, or replayed.',

    visualization: {
      caption: 'Invoker triggers a Command which calls a Receiver.',
      entities: [
        { id: 'client', label: 'Client', x: 12, y: 50, icon: '👤', color: '#6b7280' },
        { id: 'invoker', label: 'Invoker', x: 35, y: 50, icon: '🎮', color: '#2563eb' },
        { id: 'cmd', label: 'Command', x: 60, y: 50, icon: '📜', color: '#7c3aed' },
        { id: 'recv', label: 'Receiver', x: 88, y: 50, icon: '⚙️', color: '#059669' },
      ],
      relations: [
        { from: 'client', to: 'invoker', label: 'configures' },
        { from: 'invoker', to: 'cmd', label: 'execute()' },
        { from: 'cmd', to: 'recv', label: 'action()' },
      ],
    },

    animationSteps: [
      { title: 'Client constructs a Command', description: 'The Command is bound to a Receiver and any parameters needed (text to insert, file to delete). It\'s a self-contained record of intent.', highlight: ['client', 'cmd'] },
      { title: 'Invoker stores or queues the Command', description: 'The button, menu, or scheduler holds Command references. It can dispatch immediately, queue for later, or push onto an undo stack.', highlight: ['invoker', 'cmd'] },
      { title: 'execute() triggers the Receiver', description: 'When fired, the Command calls receiver.action() with the bound parameters. The receiver does the actual work — Command just orchestrates.', highlight: ['cmd', 'recv'] },
      { title: 'undo() reverses the operation', description: 'Commands that store before-state can implement undo() — pop from history, call undo(), and the system rewinds. Foundation of redo, replay, and audit logs.', highlight: ['invoker', 'cmd'] },
    ],

    codeExample: {
      language: 'javascript',
      description: 'A text editor with insert/delete commands and a multi-level undo stack.',
      starter: `class TextEditor {
  constructor() { this.text = ''; }
}

// Commands capture both forward and reverse operations
class InsertCommand {
  constructor(editor, str, position = editor.text.length) {
    this.editor = editor; this.str = str; this.position = position;
  }
  execute() {
    const t = this.editor.text;
    this.editor.text = t.slice(0, this.position) + this.str + t.slice(this.position);
  }
  undo() {
    const t = this.editor.text;
    this.editor.text = t.slice(0, this.position) + t.slice(this.position + this.str.length);
  }
}

class DeleteRangeCommand {
  constructor(editor, from, count) {
    this.editor = editor; this.from = from; this.count = count;
    this.deleted = '';
  }
  execute() {
    this.deleted = this.editor.text.slice(this.from, this.from + this.count);
    const t = this.editor.text;
    this.editor.text = t.slice(0, this.from) + t.slice(this.from + this.count);
  }
  undo() {
    const t = this.editor.text;
    this.editor.text = t.slice(0, this.from) + this.deleted + t.slice(this.from);
  }
}

class CommandHistory {
  constructor() { this.stack = []; }
  run(cmd) { cmd.execute(); this.stack.push(cmd); }
  undo()   { const c = this.stack.pop(); if (c) c.undo(); }
}

const ed = new TextEditor();
const hist = new CommandHistory();

hist.run(new InsertCommand(ed, 'hello'));
hist.run(new InsertCommand(ed, ' world'));
hist.run(new DeleteRangeCommand(ed, 0, 6));
console.log('after edits:', JSON.stringify(ed.text));

hist.undo();
console.log('after 1 undo:', JSON.stringify(ed.text));
hist.undo();
console.log('after 2 undos:', JSON.stringify(ed.text));
hist.undo();
console.log('after 3 undos:', JSON.stringify(ed.text));
`,
    },

    industryUseCases: [
      { company: 'GUI undo/redo stacks', description: 'Photoshop, Word, IDEs — every user action is a Command pushed onto an undo stack, popped onto a redo stack on undo.' },
      { company: 'Redux actions', description: 'Each dispatched action is a Command — a plain object describing intent. Reducers play them; middleware can log, replay, or time-travel-debug.' },
      { company: 'Job/task queues', description: 'Sidekiq, Celery, AWS SQS — each message in the queue is a serialised Command waiting to be executed by a worker.' },
      { company: 'Database transaction logs', description: 'Write-ahead logs (WAL) record every operation as a Command for crash recovery and replication — replay the log on restart to restore state.' },
    ],

    interviewQuestion: {
      question: 'How would you implement multi-level undo + redo with Command, and what operations are hard or impossible to undo?',
      answer: 'Each Command stores enough state to reverse itself in undo(). The Invoker maintains two stacks: an undo stack (every execute() pushes) and a redo stack. undo() pops from undo, calls undo(), and pushes onto redo. redo() does the inverse. New commands clear the redo stack (otherwise you create branches). Hard cases: (1) Non-deterministic operations — if you used Math.random or a timestamp, recording the result lets you replay deterministically. (2) External side effects — emails sent, payments processed, deletes that purged data — generally NOT undoable. Use compensating actions instead (refund, recall). (3) Memory: every keystroke as a command can grow undo stacks to gigabytes; cap history or store deltas instead of full state.',
    },

    commonMistakes: [
      'Not capturing enough state in the Command to undo (e.g., forgetting to remember the old value before overwriting).',
      'Mutable shared state — undoing one command corrupts another\'s saved snapshot.',
      'Trying to undo non-deterministic / external side effects (DB writes, emails sent) — use compensating actions instead.',
      'Conflating Command (a serialisable object) with a function — you lose the ability to log, queue, or persist the request.',
      'Unbounded undo stacks — every keystroke as a command can grow to GBs. Cap history length or use deltas.',
    ],
  },

  // ─── Chain of Responsibility ──────────────────────────────────────────────────
  {
    id: 'chain-of-responsibility',
    name: 'Chain of Responsibility',
    category: 'Behavioral',
    icon: '⛓️',
    difficulty: 'intermediate',
    tagline: 'Pass requests along a chain of handlers',

    definition:
      'Avoids coupling the sender of a request to its receiver by giving more than one object a chance to handle it. Chains the receivers and passes the request along until one handles it.',

    problem:
      'Multiple objects might be interested in handling a request, and the sender shouldn\'t decide which. Hard-coding `try handler A, then B, then C` couples the sender to all of them and blocks adding new handlers without editing the sender.',

    whyNeeded:
      'Each handler holds a reference to the next handler. A handler decides whether to process the request (and stop), pass it along, or both. Adding/reordering handlers means changing the chain — not the sender. The request flows until some handler chooses to handle it.',

    realLifeAnalogy:
      'Customer service escalation. A frontline rep tries to help; if they can\'t, they escalate to supervisor; then manager; then VP. Each level only knows about the next — and you can insert/remove levels without rewriting the company.',

    visualization: {
      caption: 'Request flows along the chain until handled.',
      entities: [
        { id: 'client', label: 'Client', x: 8, y: 50, icon: '👤', color: '#6b7280' },
        { id: 'h1', label: 'Auth', x: 30, y: 50, icon: '🔒', color: '#2563eb' },
        { id: 'h2', label: 'RateLimit', x: 55, y: 50, icon: '🚦', color: '#7c3aed' },
        { id: 'h3', label: 'Cache', x: 78, y: 50, icon: '⚡', color: '#059669' },
        { id: 'h4', label: 'Handler', x: 95, y: 50, icon: '⚙️', color: '#dc2626' },
      ],
      relations: [
        { from: 'client', to: 'h1' },
        { from: 'h1', to: 'h2', label: 'next' },
        { from: 'h2', to: 'h3', label: 'next' },
        { from: 'h3', to: 'h4', label: 'next' },
      ],
    },

    animationSteps: [
      { title: 'Request enters the first handler', description: 'Client sends to the head of the chain. It doesn\'t know how many handlers exist or which will respond.', highlight: ['client', 'h1'] },
      { title: 'Each handler decides: handle, forward, or both', description: 'Auth checks token → fail closes the chain; pass forwards. RateLimit may shortcut or forward. Each handler is autonomous.', highlight: ['h1', 'h2'] },
      { title: 'Cache may shortcut the response', description: 'A handler can answer on its own (cache hit) without forwarding — the chain stops there with a result.', highlight: ['h2', 'h3'] },
      { title: 'Final handler does the real work', description: 'If nothing shortcuts, the request reaches the terminal handler — the actual business logic. Response flows back through (potentially modified by) each handler.', highlight: ['h3', 'h4'] },
    ],

    codeExample: {
      language: 'javascript',
      description: 'A logger chain — each handler decides whether the message passes its threshold, then forwards.',
      starter: `class Logger {
  constructor(level) { this.level = level; this.next = null; }
  setNext(n) { this.next = n; return n; }
  log(level, message) {
    if (this.shouldHandle(level)) this.write(level, message);
    if (this.next) this.next.log(level, message);
  }
  shouldHandle(level) { return level >= this.level; }
  write(level, message) { console.log(this.label(level), message); }
  label(level) { return ['', '[INFO]', '[WARN]', '[ERROR]'][level]; }
}

class ConsoleLogger extends Logger {
  write(level, message) { console.log('🖥 console ' + this.label(level), message); }
}
class FileLogger extends Logger {
  write(level, message) { console.log('📄 file ' + this.label(level), message); }
}
class EmailLogger extends Logger {
  write(level, message) { console.log('📧 email ' + this.label(level), message); }
}

// Chain: console (INFO) → file (WARN) → email (ERROR)
const console_ = new ConsoleLogger(1);
const file = new FileLogger(2);
const email = new EmailLogger(3);
console_.setNext(file).setNext(email);

console_.log(1, 'app started');
console_.log(2, 'low disk space');
console_.log(3, 'database unreachable');
`,
    },

    industryUseCases: [
      { company: 'Java Servlet Filters', description: 'Each filter (auth, compression, encoding) decides whether to handle the request itself, modify it, and call doFilter() to forward — classic chain.' },
      { company: 'Express.js middleware', description: 'app.use(logger).use(auth).use(json).use(routes) — each middleware calls next() to forward, or sends a response to shortcut.' },
      { company: 'DOM event bubbling', description: 'A click event traverses up the parent chain — each ancestor can handle, stopPropagation, or let it continue.' },
      { company: 'Exception handling', description: 'Uncaught exceptions traverse stack frames; each frame can catch + handle or let the exception bubble. Pure chain of responsibility.' },
    ],

    interviewQuestion: {
      question: 'What happens if no handler in the chain accepts the request, and how do you decide chain ordering?',
      answer: 'Three options for unhandled requests: (1) Silently drop — fine for logging chains where missing a low-priority log is OK. (2) Default fallback handler at the end of the chain — return 404, log "unknown command", or apply a sensible default. (3) Re-throw / re-emit so a higher-level chain can try. Always include a default catch-all in production chains to prevent silent failures. Ordering rules: most specific first (specific URL handlers before generic), security/validation first (auth before business logic), expensive checks last (cache hits before DB queries). Document the contract — readers shouldn\'t have to trace the entire chain to predict behaviour.',
    },

    commonMistakes: [
      'Forgetting to call next() / forward to successor — request silently drops with no error message.',
      'Calling next() AND handling — leads to double-processing unless that\'s explicitly the design.',
      'Sharing mutable state across handlers — one handler corrupts another\'s view of the request.',
      'No fallback handler at the end — request fails silently or with a confusing default error.',
      'Long, slow chains — a 30-handler chain can add real latency. Measure end-to-end timing.',
    ],
  },

  // ─── Iterator ─────────────────────────────────────────────────────────────────
  {
    id: 'iterator',
    name: 'Iterator',
    category: 'Behavioral',
    icon: '➡️',
    difficulty: 'beginner',
    tagline: 'Traverse a collection without exposing its internals',

    definition:
      'Provides a way to access the elements of an aggregate object sequentially without exposing its underlying representation.',

    problem:
      'Different collection types (array, linked list, hash map, tree) have different internal structures. Code that traverses each must know the internals — coupling your traversal logic to the collection\'s implementation. Replacing an array with a tree means rewriting every loop.',

    whyNeeded:
      'Iterator separates iteration logic into a separate object with a uniform interface (hasNext / next). Clients iterate without knowing whether they\'re traversing a tree, a linked list, or a stream. The collection can change its internals freely without breaking clients.',

    realLifeAnalogy:
      'TV remote channel up / channel down. You don\'t need to know whether the TV uses cable, satellite, or streaming internally — same buttons, same iteration interface, different backing systems.',

    visualization: {
      caption: 'Iterator walks through a Collection on the client\'s behalf.',
      entities: [
        { id: 'client', label: 'Client', x: 12, y: 50, icon: '👤', color: '#6b7280' },
        { id: 'iter', label: 'Iterator', x: 40, y: 50, icon: '➡️', color: '#2563eb' },
        { id: 'col', label: 'Collection', x: 70, y: 50, icon: '📚', color: '#7c3aed' },
        { id: 'el', label: 'Elements', x: 95, y: 50, icon: '🔢', color: '#059669' },
      ],
      relations: [
        { from: 'client', to: 'iter', label: 'next()' },
        { from: 'iter', to: 'col', label: 'walks' },
        { from: 'col', to: 'el', label: 'holds' },
      ],
    },

    animationSteps: [
      { title: 'Client asks Collection for an Iterator', description: 'collection.iterator() returns a fresh iterator pointing at the first element. The collection retains its structure; the iterator carries the cursor.', highlight: ['client', 'col', 'iter'] },
      { title: 'Iterator advances through elements', description: 'Client loops: while (it.hasNext()) it.next(). Iterator hides whether the underlying structure is an array, a tree, or a network stream.', highlight: ['iter', 'col'] },
      { title: 'Two iterators can walk concurrently', description: 'Each iterator has its own cursor — multiple iterators can traverse the same collection in parallel without interfering.', highlight: ['iter'] },
      { title: 'Underlying structure can change', description: 'Replace the array with a balanced tree behind the same Collection interface — clients don\'t notice. Iteration order may differ; the contract holds.', highlight: ['col', 'el'] },
    ],

    codeExample: {
      language: 'javascript',
      description: 'A custom skip-iterator that yields every Nth element. Plugs into for...of via Symbol.iterator.',
      starter: `class SkipList {
  constructor(items, step = 2) { this.items = items; this.step = step; }
  [Symbol.iterator]() {
    let i = 0;
    const items = this.items;
    const step = this.step;
    return {
      next() {
        if (i >= items.length) return { value: undefined, done: true };
        const value = items[i];
        i += step;
        return { value, done: false };
      }
    };
  }
}

const list = new SkipList(['a', 'b', 'c', 'd', 'e', 'f', 'g'], 2);

// Native for..of works because we implement Symbol.iterator
for (const item of list) console.log('every 2nd:', item);

// Spread also works
console.log('all visited:', [...list]);

// Skip every 3rd
for (const item of new SkipList(['a','b','c','d','e','f','g'], 3))
  console.log('every 3rd:', item);
`,
    },

    industryUseCases: [
      { company: 'JavaScript for...of', description: 'The Symbol.iterator protocol IS the Iterator pattern — every iterable (Array, Map, Set, generators) implements it.' },
      { company: 'Java Iterable<T>', description: 'List, Set, Map.entrySet() all return iterators that work with the enhanced for loop. Switching from ArrayList to LinkedList doesn\'t break callers.' },
      { company: 'Python __iter__ / __next__', description: 'Python\'s iteration protocol — generators, list comprehensions, for loops all consume iterators. Custom iterators just implement two dunder methods.' },
      { company: 'Database cursors', description: 'Server-side cursors in PostgreSQL, MongoDB, JDBC ResultSet — iterate over millions of rows without loading them all into memory.' },
    ],

    interviewQuestion: {
      question: 'External versus internal iterators — what\'s the difference and when is each preferred?',
      answer: 'External iterator: the client controls advancement (`while (it.hasNext()) ...`). Gives the caller flexibility — break, skip, save position, iterate two collections in lockstep. Familiar pattern in C++, Java, Python. Internal iterator: the collection controls — you give it a callback (`list.forEach(fn)`). Simpler call site, but limited control flow — no break, harder to interleave with other iterators. Modern languages provide both: JavaScript has both for-of (external) and forEach (internal). Functional languages lean internal (map/filter/reduce). Reach for external when you need fine control over flow; reach for internal when expressing transformations declaratively.',
    },

    commonMistakes: [
      'Iterators that mutate the underlying collection during iteration — most languages throw ConcurrentModificationException or skip elements silently.',
      'Forgetting that some iterators are single-pass (file streams, generators) — restarting requires creating a new iterator.',
      'Storing references to iterators across event loops or threads — they often hold internal state that doesn\'t survive context switches.',
      'Not honouring fail-fast vs fail-safe contracts — does iteration error out on concurrent modification, or just skip? Document and test.',
      'Implementing infinite iterators without size hints — naïve `for (const x of infinite)` loops forever.',
    ],
  },

  // ─── Mediator ─────────────────────────────────────────────────────────────────
  {
    id: 'mediator',
    name: 'Mediator',
    category: 'Behavioral',
    icon: '🗼',
    difficulty: 'intermediate',
    tagline: 'Centralise complex communications',

    definition:
      'Defines an object that encapsulates how a set of objects interact. Mediator promotes loose coupling by keeping objects from referring to each other explicitly.',

    problem:
      'When N objects communicate directly, you have up to N×(N−1)/2 connections. Each object knows about all others. Adding a new object requires updating every existing one. The class graph becomes a hairball.',

    whyNeeded:
      'Mediator centralises communication. Each object talks only to the Mediator; the Mediator decides who else to notify. N objects → N connections (one to mediator each). Adding a new object only needs wiring to the mediator — no other object changes.',

    realLifeAnalogy:
      'Air traffic control. Planes don\'t talk directly to each other. They all talk to the tower (mediator). The tower knows all positions and tells each plane what to do. Without a tower, every plane needs radar and protocols for every other plane — chaos.',

    visualization: {
      caption: 'All colleagues talk through a central Mediator.',
      entities: [
        { id: 'mediator', label: 'Mediator', x: 50, y: 50, icon: '🗼', color: '#2563eb' },
        { id: 'a', label: 'Colleague A', x: 18, y: 22, icon: '✈️', color: '#7c3aed' },
        { id: 'b', label: 'Colleague B', x: 82, y: 22, icon: '✈️', color: '#7c3aed' },
        { id: 'c', label: 'Colleague C', x: 18, y: 78, icon: '✈️', color: '#7c3aed' },
        { id: 'd', label: 'Colleague D', x: 82, y: 78, icon: '✈️', color: '#7c3aed' },
      ],
      relations: [
        { from: 'a', to: 'mediator' },
        { from: 'b', to: 'mediator' },
        { from: 'c', to: 'mediator' },
        { from: 'd', to: 'mediator' },
      ],
    },

    animationSteps: [
      { title: 'Colleagues register with the Mediator', description: 'Each colleague holds a reference to the Mediator only — never to other colleagues. The Mediator builds its registry.', highlight: ['mediator', 'a', 'b', 'c', 'd'] },
      { title: 'Colleague A wants to communicate', description: 'A doesn\'t call B or C directly. A calls mediator.send(message, from: A) and lets the mediator decide.', highlight: ['a', 'mediator'] },
      { title: 'Mediator routes the message', description: 'Based on the message type and sender, the mediator notifies relevant colleagues — perhaps B and D, but not C.', highlight: ['mediator', 'b', 'd'] },
      { title: 'Add a new colleague — wire to mediator only', description: 'New colleague E joins. Wire E to the mediator and update the mediator\'s routing rules. No other colleague changes.', highlight: ['mediator'] },
    ],

    codeExample: {
      language: 'javascript',
      description: 'A chat room where users send to each other through the room — never directly.',
      starter: `class ChatRoom {
  constructor() { this.users = new Map(); }
  register(user) { user.room = this; this.users.set(user.name, user); }
  send(from, message, to = null) {
    if (to) {
      const target = this.users.get(to);
      if (target) target.receive(from, message);
    } else {
      // broadcast — to all except sender
      for (const [name, user] of this.users)
        if (name !== from) user.receive(from, message);
    }
  }
}

class User {
  constructor(name) { this.name = name; this.room = null; }
  send(message, to = null) {
    console.log(this.name + ' → ' + (to ?? 'all') + ': ' + message);
    this.room.send(this.name, message, to);
  }
  receive(from, message) {
    console.log('  ' + this.name + ' received from ' + from + ': "' + message + '"');
  }
}

const room = new ChatRoom();
const alice = new User('Alice');
const bob   = new User('Bob');
const carol = new User('Carol');
[alice, bob, carol].forEach(u => room.register(u));

alice.send('hi everyone');         // broadcast
bob.send('hey Alice', 'Alice');    // direct
carol.send('🎉 ship it!');         // broadcast
`,
    },

    industryUseCases: [
      { company: 'Air traffic control systems', description: 'The literal mediator. Towers coordinate landings, departures, and routing — planes never talk peer-to-peer.' },
      { company: 'GUI dialog boxes', description: 'A dialog mediates between its controls — clicking a checkbox enables/disables fields, clicking submit validates everything. Controls don\'t reference each other.' },
      { company: 'Redux / Zustand stores', description: 'Components dispatch actions to the store; the store mediates updates and notifies subscribers. Components never call each other directly.' },
      { company: 'Apache Kafka brokers', description: 'Producers and consumers don\'t know each other. The broker mediates — routes messages by topic, manages offsets, replicates across nodes.' },
    ],

    interviewQuestion: {
      question: 'When does Mediator turn into a god object, and how do you prevent it?',
      answer: 'A Mediator becomes a god object when it accumulates too much business logic — every change requires editing the mediator, it has hundreds of methods, and tests need to mock half the application. Symptoms: mediator file grows past ~1000 lines, mediator has fields for every other object, refactoring the mediator breaks unrelated tests. Prevention: keep the mediator pure orchestration — routing only. Push decisions back into colleagues when they belong there. Split into multiple smaller mediators by concern (UIMediator vs AuthMediator vs NetworkMediator) once one grows past a threshold (e.g., 10 colleagues). Use facades or events between mediators rather than letting them know about each other. Conceptually: a mediator is a router, not a brain.',
    },

    commonMistakes: [
      'Mediator becomes a god object accumulating business logic that should live in colleagues.',
      'Bypassing the mediator by passing direct references between colleagues — undermines the entire abstraction.',
      'Mediator that holds business logic of components (should orchestrate routing, not implement domain rules).',
      'Not handling the mediator\'s own failures — single point of coupling, single point of failure.',
      'Confusing Mediator with Observer — Mediator is bidirectional N-to-N; Observer is unidirectional 1-to-many.',
    ],
  },

  // ─── Memento ──────────────────────────────────────────────────────────────────
  {
    id: 'memento',
    name: 'Memento',
    category: 'Behavioral',
    icon: '💾',
    difficulty: 'intermediate',
    tagline: 'Capture and restore state without breaking encapsulation',

    definition:
      'Without violating encapsulation, captures and externalises an object\'s internal state so that the object can be restored to this state later.',

    problem:
      'You need to support undo, snapshots, or save/load. The naïve way is to expose internal state through getters/setters and let an external class store/restore it — but that breaks encapsulation. The other extreme is implementing undo logic inside the object, polluting it with concerns that aren\'t its job.',

    whyNeeded:
      'Memento defines three roles: Originator (the thing being saved), Memento (immutable snapshot), Caretaker (stores mementos). Originator creates Mementos and accepts them back to restore. Caretaker holds them but never inspects them — encapsulation preserved.',

    realLifeAnalogy:
      'Save points in a video game. The game (Originator) creates a save file (Memento). The save manager (Caretaker) stores it. When you load, you hand the save back to the game and it restores its state. The save manager never reads the contents.',

    visualization: {
      caption: 'Originator creates Mementos; Caretaker stores them.',
      entities: [
        { id: 'orig', label: 'Originator', x: 18, y: 50, icon: '🧠', color: '#2563eb' },
        { id: 'm1', label: 'Memento 1', x: 50, y: 25, icon: '💾', color: '#7c3aed' },
        { id: 'm2', label: 'Memento 2', x: 50, y: 50, icon: '💾', color: '#7c3aed' },
        { id: 'm3', label: 'Memento 3', x: 50, y: 75, icon: '💾', color: '#7c3aed' },
        { id: 'care', label: 'Caretaker', x: 85, y: 50, icon: '📦', color: '#059669' },
      ],
      relations: [
        { from: 'orig', to: 'm1', label: 'save()' },
        { from: 'orig', to: 'm2' },
        { from: 'orig', to: 'm3' },
        { from: 'care', to: 'm1', label: 'stores' },
        { from: 'care', to: 'm2' },
        { from: 'care', to: 'm3' },
      ],
    },

    animationSteps: [
      { title: 'Originator state changes', description: 'The user types text, moves a piece, draws a line. The originator\'s internal state evolves through the session.', highlight: ['orig'] },
      { title: 'Caretaker calls save()', description: 'At each interesting checkpoint, originator.save() returns an opaque Memento — a frozen snapshot of state. The caretaker stores it.', highlight: ['orig', 'm1', 'care'] },
      { title: 'History grows', description: 'Multiple mementos accumulate — each represents a past state. The caretaker decides retention policy: keep all, keep last N, keep diffs.', highlight: ['m1', 'm2', 'm3', 'care'] },
      { title: 'Restore on demand', description: 'User hits undo. Caretaker pops a memento and calls originator.restore(memento). The originator unpacks state from the (which only it knows how to read) memento.', highlight: ['orig', 'm2'] },
    ],

    codeExample: {
      language: 'javascript',
      description: 'A drawing canvas with save points. Caretaker stores mementos; originator restores from any of them.',
      starter: `// Memento — opaque to outsiders
class CanvasMemento {
  // Caretaker should treat this as opaque
  constructor(state) { this._state = state; }
}

// Originator
class Canvas {
  constructor() { this.shapes = []; this.color = 'black'; }
  draw(shape)    { this.shapes.push({ shape, color: this.color }); }
  setColor(c)    { this.color = c; }
  save()         { return new CanvasMemento(JSON.stringify({ shapes: this.shapes, color: this.color })); }
  restore(m)     {
    const { shapes, color } = JSON.parse(m._state);
    this.shapes = shapes;
    this.color = color;
  }
  show() { return 'shapes=[' + this.shapes.map(s => s.color + ':' + s.shape).join(', ') + '] color=' + this.color; }
}

// Caretaker
class History {
  constructor() { this.stack = []; }
  push(memento) { this.stack.push(memento); }
  pop()         { return this.stack.pop(); }
}

const canvas = new Canvas();
const history = new History();

canvas.draw('circle');                history.push(canvas.save());
canvas.setColor('red');
canvas.draw('square');                history.push(canvas.save());
canvas.draw('triangle');

console.log('current:', canvas.show());

canvas.restore(history.pop());
console.log('after undo 1:', canvas.show());

canvas.restore(history.pop());
console.log('after undo 2:', canvas.show());
`,
    },

    industryUseCases: [
      { company: 'Git commits', description: 'Each commit is a memento of the working tree. Branches and reflog are caretakers; checkout restores the originator (working directory) to any saved state.' },
      { company: 'IDE undo/redo', description: 'IntelliJ, VS Code, Eclipse store editor state mementos. Undo pops the stack and restores; redo replays. Often combined with Command for action-level granularity.' },
      { company: 'Database snapshots', description: 'PostgreSQL\'s pg_basebackup, MongoDB\'s mongodump — point-in-time copies of state for backup and disaster recovery.' },
      { company: 'Browser back button', description: 'Each navigation creates a history entry — a memento of the page state. Back/forward restores; the URL is one piece, but scroll position and form data are also captured.' },
    ],

    interviewQuestion: {
      question: 'How do you keep memento history bounded in memory? What are the trade-offs of each strategy?',
      answer: 'Three core tactics. (1) Cap history at N entries — drop the oldest when full. Simple, predictable memory; downside is you lose deep history. Common in IDEs and editors. (2) Diff-based mementos — store delta from previous, not full state. Saves memory dramatically for small edits; downside: undo becomes slower (replay deltas), and you must keep a base snapshot. Used by Git (loose objects), document editors. (3) Compress / serialise mementos — gzip JSON snapshots. Saves space without changing API; downside is CPU cost on save and restore. Real-world editors combine: full snapshot every K edits, deltas in between (like a video keyframe + frame deltas). Decision factors: typical edit size, undo depth needed, performance budget for save/restore.',
    },

    commonMistakes: [
      'Mutable mementos — caretaker or another consumer modifies the snapshot, corrupting future restore.',
      'Storing every keystroke as a memento — memory explodes. Coalesce or sample.',
      'Exposing memento internals (now you\'ve broken encapsulation, and changing originator state breaks all stored mementos).',
      'Restoring into a different originator instance than the one that created the memento — contract is per-originator.',
      'Confusing Memento (state snapshot) with Command (operation log) — they\'re complementary; many editors use both.',
    ],
  },

  // ─── State ────────────────────────────────────────────────────────────────────
  {
    id: 'state',
    name: 'State',
    category: 'Behavioral',
    icon: '🚦',
    difficulty: 'intermediate',
    tagline: 'Behaviour changes with internal state',

    definition:
      'Allows an object to alter its behaviour when its internal state changes. The object will appear to change its class.',

    problem:
      'An object behaves differently based on a state attribute. Code is full of `if (state === \'connected\') ... else if (state === \'listening\') ...` scattered across methods. Adding a new state requires editing every method. Bugs hide in missed cases.',

    whyNeeded:
      'State extracts each state into its own class implementing a common interface. The context holds a State reference and delegates to it. Changing state means swapping the State object. Adding a new state is one new class — no edits to existing methods.',

    realLifeAnalogy:
      'A phone in different modes. In normal mode, calls ring. In airplane mode, calls fail silently. In do-not-disturb, calls go straight to voicemail. Same press-the-button hardware, different behaviour. The phone\'s state decides what each button does.',

    visualization: {
      caption: 'Context delegates to its current State; states transition the context.',
      entities: [
        { id: 'ctx', label: 'Context', x: 22, y: 50, icon: '📞', color: '#2563eb' },
        { id: 'iface', label: 'State', x: 50, y: 50, icon: '🔷', color: '#2563eb' },
        { id: 's1', label: 'Idle', x: 80, y: 18, icon: '😴', color: '#7c3aed' },
        { id: 's2', label: 'Ringing', x: 88, y: 50, icon: '🔔', color: '#7c3aed' },
        { id: 's3', label: 'OnCall', x: 80, y: 82, icon: '📞', color: '#7c3aed' },
      ],
      relations: [
        { from: 'ctx', to: 'iface', label: 'currentState' },
        { from: 's1', to: 'iface' },
        { from: 's2', to: 'iface' },
        { from: 's3', to: 'iface' },
      ],
    },

    animationSteps: [
      { title: 'Context starts in initial State', description: 'The context begins in IdleState. All event methods (call, hangUp, dial) delegate to the current state object.', highlight: ['ctx', 's1'] },
      { title: 'Event triggers state behaviour', description: 'Client calls context.incomingCall(). Context delegates to currentState.incomingCall(this). Idle decides: transition to Ringing.', highlight: ['ctx', 's1', 's2'] },
      { title: 'State transitions the Context', description: 'IdleState calls context.setState(new RingingState()). The context is now in a new state — same methods, different behaviour.', highlight: ['ctx', 's2'] },
      { title: 'Same methods, different responses', description: 'context.incomingCall() in RingingState behaves differently — busy signal. Same method name, different polymorphic dispatch.', highlight: ['s2', 's3'] },
    ],

    codeExample: {
      language: 'javascript',
      description: 'A vending machine modelled as a state machine. Each state knows valid transitions.',
      starter: `class VendingMachine {
  constructor() {
    this.state = new IdleState(this);
    this.balance = 0;
  }
  setState(s) { this.state = s; }
  insertCoin(v) { this.state.insertCoin(v); }
  selectItem()  { this.state.selectItem(); }
  dispense()    { this.state.dispense(); }
}

class IdleState {
  constructor(m) { this.m = m; }
  insertCoin(v) {
    this.m.balance += v;
    console.log('💰 inserted ' + v + ', balance=' + this.m.balance);
    this.m.setState(new HasMoneyState(this.m));
  }
  selectItem() { console.log('❌ insert money first'); }
  dispense()   { console.log('❌ insert money first'); }
}

class HasMoneyState {
  constructor(m) { this.m = m; }
  insertCoin(v) { this.m.balance += v; console.log('💰 added, balance=' + this.m.balance); }
  selectItem()  {
    if (this.m.balance >= 100) {
      console.log('✅ item selected');
      this.m.setState(new DispensingState(this.m));
    } else {
      console.log('❌ need at least 100, have ' + this.m.balance);
    }
  }
  dispense() { console.log('❌ select item first'); }
}

class DispensingState {
  constructor(m) { this.m = m; }
  insertCoin() { console.log('⏳ wait, dispensing'); }
  selectItem() { console.log('⏳ wait, dispensing'); }
  dispense()   {
    this.m.balance -= 100;
    console.log('🥤 dispensed! change=' + this.m.balance);
    this.m.balance = 0;
    this.m.setState(new IdleState(this.m));
  }
}

const m = new VendingMachine();
m.selectItem();        // can't yet
m.insertCoin(50);
m.selectItem();        // not enough
m.insertCoin(75);
m.selectItem();
m.dispense();
m.dispense();          // back to idle, can't dispense
`,
    },

    industryUseCases: [
      { company: 'Workflow engines', description: 'Camunda, Temporal, Step Functions — order/PR/approval flows transition through states (pending, approved, completed, rejected) with explicit per-state behaviour.' },
      { company: 'Game character states', description: 'NPCs and players cycle through Idle, Walking, Running, Attacking, Dying — each state handles input differently and renders different animations.' },
      { company: 'TCP/IP protocol', description: 'Classic state machine — CLOSED → LISTEN → SYN-SENT → ESTABLISHED → FIN-WAIT → ... — every state defines what packets/events are valid.' },
      { company: 'UI components', description: 'React/Vue components with loading, success, error, empty states — each renders different markup and exposes different actions.' },
    ],

    interviewQuestion: {
      question: 'State versus Strategy — both swap behaviour. What\'s the deciding test?',
      answer: 'Strategy is chosen externally and stays fixed for the duration of use — clients pick the algorithm and apply it. State is chosen internally and transitions during the lifecycle of the same context — the object\'s state changes based on its own logic and incoming events. Decision test: does the variation change while the object is in use? If yes, State. If you decide once at the start (configuration), Strategy. Another tell: State objects often KNOW about each other (transitions: Idle → Ringing → OnCall), encoding a state machine. Strategy objects are typically isolated — they don\'t coordinate. Real systems mix both: a Strategy might internally use a State machine.',
    },

    commonMistakes: [
      'Letting context check the state\'s class with instanceof or string comparison (defeats polymorphism).',
      'States that have access to context internals beyond what they need — coupling leaks.',
      'Forgetting to handle invalid transitions (e.g., dispense() while idle) — should be explicit no-op or error.',
      'States with too much shared logic — extract a common base or use composition.',
      'Confusing the State pattern with FSM libraries — State is the OOP pattern; libraries (XState) are tooling that often implement it.',
    ],
  },

  // ─── Template Method ──────────────────────────────────────────────────────────
  {
    id: 'template-method',
    name: 'Template Method',
    category: 'Behavioral',
    icon: '📋',
    difficulty: 'beginner',
    tagline: 'Define an algorithm skeleton; subclasses fill in the gaps',

    definition:
      'Defines the skeleton of an algorithm in an operation, deferring some steps to subclasses. Template Method lets subclasses redefine certain steps without changing the algorithm\'s structure.',

    problem:
      'Multiple classes have a similar processing flow but differ in specific steps. Copy-pasting the flow into each subclass duplicates code; if the flow changes, you must update every subclass and risk inconsistency.',

    whyNeeded:
      'Template Method declares the flow in a non-overridable method on the parent class. The flow calls hook methods (steps) that subclasses override. Common steps live in the parent; variant steps live in subclasses. Changing the flow means editing one place.',

    realLifeAnalogy:
      'Recipe template for baking. The skeleton: mix dry → mix wet → combine → bake at 350°F for 30 min. Specific recipes (chocolate cake, banana bread) override the ingredients but follow the same flow.',

    visualization: {
      caption: 'Template orchestrates the algorithm; concrete classes fill in steps.',
      entities: [
        { id: 'tmpl', label: 'Template', x: 25, y: 50, icon: '📋', color: '#2563eb' },
        { id: 'step1', label: 'step1()', x: 60, y: 18, icon: '1️⃣', color: '#7c3aed' },
        { id: 'step2', label: 'hook()', x: 65, y: 50, icon: '🪝', color: '#7c3aed' },
        { id: 'step3', label: 'step3()', x: 60, y: 82, icon: '3️⃣', color: '#7c3aed' },
        { id: 'sub', label: 'Subclass', x: 92, y: 50, icon: '🧩', color: '#059669' },
      ],
      relations: [
        { from: 'tmpl', to: 'step1' },
        { from: 'tmpl', to: 'step2' },
        { from: 'tmpl', to: 'step3' },
        { from: 'sub', to: 'step2', label: 'overrides' },
      ],
    },

    animationSteps: [
      { title: 'Parent class defines the flow', description: 'A non-overridable templateMethod() lays out the sequence: step1() → hook() → step2() → cleanup(). This is the algorithm.', highlight: ['tmpl'] },
      { title: 'Common steps live in the parent', description: 'step1, step2, cleanup are shared — every subclass uses the same implementation. Hook() is where variation happens.', highlight: ['tmpl', 'step1', 'step3'] },
      { title: 'Subclass overrides the hook', description: 'ConcreteSubclass overrides hook() with its specific behaviour. The flow doesn\'t change; the variation point does.', highlight: ['step2', 'sub'] },
      { title: 'Same flow, different output', description: 'Calling templateMethod() on different subclasses runs the same skeleton but with each subclass\'s hook implementations.', highlight: ['tmpl', 'sub'] },
    ],

    codeExample: {
      language: 'javascript',
      description: 'A report generator with format-specific subclasses. The flow is shared; only formatting varies.',
      starter: `class ReportGenerator {
  // Template method — defines the skeleton (don't override in subclasses)
  generate(data) {
    const prepared = this.prepareData(data);
    const formatted = this.format(prepared);
    const decorated = this.addHeader(formatted);
    this.deliver(decorated);
    return decorated;
  }

  // Common step
  prepareData(data) {
    return data.filter(d => d.value != null);
  }

  // Common step
  addHeader(body) {
    return '=== Report ' + new Date().toISOString().slice(0,10) + ' ===\\n' + body;
  }

  // Hook — subclasses MUST override
  format(data) { throw new Error('subclass must override format()'); }

  // Hook — optional override (default impl)
  deliver(content) { console.log(content); }
}

class CsvReport extends ReportGenerator {
  format(data) {
    return data.map(d => d.name + ',' + d.value).join('\\n');
  }
}

class JsonReport extends ReportGenerator {
  format(data) { return JSON.stringify(data, null, 2); }
}

class HtmlReport extends ReportGenerator {
  format(data) {
    return '<table>' + data.map(d => '<tr><td>' + d.name + '</td><td>' + d.value + '</td></tr>').join('') + '</table>';
  }
}

const data = [{ name: 'sales', value: 1200 }, { name: 'users', value: null }, { name: 'revenue', value: 45000 }];
new CsvReport().generate(data);
console.log();
new JsonReport().generate(data);
console.log();
new HtmlReport().generate(data);
`,
    },

    industryUseCases: [
      { company: 'Spring JdbcTemplate', description: 'execute(...) is the template — handles connection acquisition, transaction management, exception translation, cleanup. You provide RowMapper and statement-creator hooks.' },
      { company: 'Java Servlet service()', description: 'HttpServlet.service() is a template method — dispatches to doGet, doPost, doPut, etc. Subclasses override only the methods they need.' },
      { company: 'Django generic views', description: 'CreateView, UpdateView, ListView define the request lifecycle as a template — get_queryset, form_valid, get_context_data are hooks.' },
      { company: 'React class component lifecycle', description: 'render is the only method you must implement; componentDidMount, componentDidUpdate, componentWillUnmount are optional hooks. The framework owns the flow.' },
    ],

    interviewQuestion: {
      question: 'When does Template Method become problematic, and when would you choose Strategy instead?',
      answer: 'Template Method becomes problematic when subclass authors override hooks in ways that violate parent invariants (the Liskov Substitution Principle), when there are too many hooks (subclass authors can\'t tell which to override), or when hooks interact subtly through shared state. The bigger structural concern: inheritance-based extension is rigid — you can\'t change behaviour at runtime, can\'t mix multiple variations, and you\'re locked into the parent\'s class hierarchy. Strategy avoids all of this by composition. Default to Strategy in modern code; reach for Template Method when the algorithm flow is stable, the variations are well-bounded, and the inheritance relationship is genuinely "is-a". Frameworks (Servlets, Django views) use Template Method because users SHOULD be locked into the framework\'s flow.',
    },

    commonMistakes: [
      'Making the template method overridable — defeats the pattern, since the flow can now diverge.',
      'Too many hook methods — subclass authors can\'t tell which to override, defaults silently apply.',
      'Hooks called in unexpected order — document the call sequence prominently.',
      'Subclass overrides break parent invariants (LSP violation) — runtime errors appear far from the source.',
      'Using inheritance when composition (Strategy) would be cleaner — especially when behaviour might change at runtime.',
    ],
  },

  // ─── Visitor ──────────────────────────────────────────────────────────────────
  {
    id: 'visitor',
    name: 'Visitor',
    category: 'Behavioral',
    icon: '🚶',
    difficulty: 'advanced',
    tagline: 'Add operations without changing the data classes',

    definition:
      'Represents an operation to be performed on the elements of an object structure. Visitor lets you define a new operation without changing the classes of the elements on which it operates.',

    problem:
      'You have a stable hierarchy of objects (AST nodes, file system entries, GUI widgets). You want to add operations (typecheck, pretty-print, optimise) without modifying the hierarchy. Putting all operations into the hierarchy violates Single Responsibility and breaks Open/Closed.',

    whyNeeded:
      'Visitor moves operations into separate Visitor classes. Each element exposes accept(visitor); the visitor has visitX/visitY methods for each element type. Adding an operation = new Visitor class. The element hierarchy stays clean and unchanged.',

    realLifeAnalogy:
      'A tax inspector visits different buildings — residential, commercial, industrial — and applies different rules to each. The buildings don\'t change. Tomorrow a fire-safety inspector visits the same buildings with completely different rules.',

    visualization: {
      caption: 'Visitor walks the structure; each element accepts the visitor.',
      entities: [
        { id: 'el', label: 'Element', x: 30, y: 50, icon: '🔷', color: '#2563eb' },
        { id: 'a', label: 'NodeA', x: 12, y: 22, icon: '🔵', color: '#7c3aed' },
        { id: 'b', label: 'NodeB', x: 12, y: 78, icon: '🟢', color: '#7c3aed' },
        { id: 'v', label: 'Visitor', x: 75, y: 50, icon: '🚶', color: '#059669' },
        { id: 'va', label: 'visitA()', x: 95, y: 22, icon: '👁', color: '#dc2626' },
        { id: 'vb', label: 'visitB()', x: 95, y: 78, icon: '👁', color: '#dc2626' },
      ],
      relations: [
        { from: 'a', to: 'el' },
        { from: 'b', to: 'el' },
        { from: 'el', to: 'v', label: 'accept(v)' },
        { from: 'v', to: 'va' },
        { from: 'v', to: 'vb' },
      ],
    },

    animationSteps: [
      { title: 'Build the element structure', description: 'AST, file tree, scene graph — a hierarchy of node types. The structure is stable; we won\'t modify these classes.', highlight: ['el', 'a', 'b'] },
      { title: 'Construct a Visitor', description: 'A PrettyPrintVisitor implements visitNumberLiteral, visitBinaryExpr, visitFunctionCall — one method per node type.', highlight: ['v', 'va', 'vb'] },
      { title: 'Walk: each element accepts the visitor', description: 'root.accept(visitor). The element calls visitor.visitItself(this) — double dispatch. The visitor\'s correct method runs.', highlight: ['el', 'v'] },
      { title: 'Add new operation = new Visitor', description: 'Tomorrow add a TypeCheckVisitor. Same elements, completely different operation. Element classes never change.', highlight: ['v', 'va', 'vb'] },
    ],

    codeExample: {
      language: 'javascript',
      description: 'AST nodes accept a PrettyPrint and an Evaluate visitor. Same tree, two different operations.',
      starter: `// Element hierarchy
class NumberLit { constructor(v) { this.v = v; } accept(visitor) { return visitor.visitNumber(this); } }
class Add       { constructor(l, r) { this.l = l; this.r = r; } accept(visitor) { return visitor.visitAdd(this); } }
class Mul       { constructor(l, r) { this.l = l; this.r = r; } accept(visitor) { return visitor.visitMul(this); } }

// Visitors — operations live here, not on the elements
class PrettyPrint {
  visitNumber(n) { return String(n.v); }
  visitAdd(a)    { return '(' + a.l.accept(this) + ' + ' + a.r.accept(this) + ')'; }
  visitMul(m)    { return '(' + m.l.accept(this) + ' * ' + m.r.accept(this) + ')'; }
}

class Evaluate {
  visitNumber(n) { return n.v; }
  visitAdd(a)    { return a.l.accept(this) + a.r.accept(this); }
  visitMul(m)    { return m.l.accept(this) * m.r.accept(this); }
}

// Build (3 + 4) * (5 + 2)
const ast = new Mul(new Add(new NumberLit(3), new NumberLit(4)),
                    new Add(new NumberLit(5), new NumberLit(2)));

const printer = new PrettyPrint();
const evaluator = new Evaluate();

console.log('expression:', ast.accept(printer));
console.log('result    :', ast.accept(evaluator));

// Add a NEW operation without touching NumberLit/Add/Mul
class Depth {
  visitNumber()  { return 1; }
  visitAdd(a)    { return 1 + Math.max(a.l.accept(this), a.r.accept(this)); }
  visitMul(m)    { return 1 + Math.max(m.l.accept(this), m.r.accept(this)); }
}
console.log('depth     :', ast.accept(new Depth()));
`,
    },

    industryUseCases: [
      { company: 'Compiler AST traversal', description: 'TypeScript, Babel, GCC traverse syntax trees with visitors — type checkers, linters, code generators, formatters all share the same AST.' },
      { company: 'XML/JSON processing', description: 'XSLT processors and JSON walkers apply different visitors for transformation, validation, indexing — without changing the document structure.' },
      { company: 'File system tools', description: '`du`, backup tools, virus scanners walk the same file tree with different visitor logic — calculate sizes, copy files, scan for signatures.' },
      { company: 'Static analysis', description: 'ESLint, SonarQube, semgrep apply rule-set visitors over an AST. Adding a new lint rule = new visitor — source code structure stays canonical.' },
    ],

    interviewQuestion: {
      question: 'What is double dispatch, and why does Visitor need it? How is it implemented in single-dispatch languages?',
      answer: 'Single dispatch: the method called depends on the runtime type of the receiver only. Most languages (Java, JS, Python) work this way. Double dispatch: the method depends on the runtime types of TWO objects — receiver AND argument. Visitor needs double dispatch because the operation depends on both the element type (AST node kind) AND the visitor type (which operation). Single-dispatch languages simulate it via the accept method. The element\'s accept(v) does the first dispatch (chooses which element\'s accept method runs based on element type). Inside accept, it calls v.visitSpecific(this) — second dispatch (chooses which visitor method based on visitor type). This two-step indirection is the price of single dispatch. Languages like Common Lisp (CLOS multimethods) or Julia have native multiple dispatch and don\'t need accept().',
    },

    commonMistakes: [
      'Adding a new element type and forgetting to add visitX to every existing visitor — only some operations work on the new node.',
      'Visitors that need access to context they don\'t have (parent pointers, surrounding scope) — leads to messy state passing.',
      'Using Visitor when a simple polymorphic method on the element would suffice — over-engineering.',
      'Cyclic dependencies between Element and Visitor classes — compile-time pain.',
      'Stateful visitors that fail when used concurrently — make visitors immutable or document re-entrancy.',
    ],
  },

  // ─── Interpreter ──────────────────────────────────────────────────────────────
  {
    id: 'interpreter',
    name: 'Interpreter',
    category: 'Behavioral',
    icon: '🔤',
    difficulty: 'advanced',
    tagline: 'Build a small evaluator for a domain language',

    definition:
      'Given a language, defines a representation for its grammar along with an interpreter that uses the representation to interpret sentences in the language.',

    problem:
      'You need to evaluate small embedded expressions — a search query DSL, a configuration language, a math expression. Hardcoding the evaluator is fine for trivial cases, but as the grammar grows you end up with a tangled if/else over expression strings.',

    whyNeeded:
      'Interpreter represents grammar rules as classes (each rule = one class). Each class has an interpret() method that recursively interprets sub-expressions. The structure of the grammar is mirrored in the class hierarchy — adding a new rule is a new class.',

    realLifeAnalogy:
      'Translating a sentence by parsing it into noun + verb + object phrases, recursively breaking those down, and interpreting each part. The grammar tree mirrors the sentence structure.',

    visualization: {
      caption: 'Composite expression tree — each node interprets itself.',
      entities: [
        { id: 'root', label: 'AndExpr', x: 50, y: 22, icon: '∧', color: '#2563eb' },
        { id: 'l', label: 'a > 5', x: 22, y: 60, icon: '🔢', color: '#7c3aed' },
        { id: 'r', label: 'OrExpr', x: 75, y: 50, icon: '∨', color: '#7c3aed' },
        { id: 'rl', label: 'b == 0', x: 60, y: 88, icon: '🔢', color: '#059669' },
        { id: 'rr', label: 'c < 10', x: 92, y: 88, icon: '🔢', color: '#059669' },
      ],
      relations: [
        { from: 'root', to: 'l' },
        { from: 'root', to: 'r' },
        { from: 'r', to: 'rl' },
        { from: 'r', to: 'rr' },
      ],
    },

    animationSteps: [
      { title: 'Define grammar as classes', description: 'Each grammar rule becomes a class — Number, Variable, And, Or, Not, GreaterThan. Composite rules hold child expressions.', highlight: ['root', 'l', 'r'] },
      { title: 'Parse input into an AST', description: 'A parser turns "a > 5 AND (b == 0 OR c < 10)" into a tree of expression objects matching the grammar.', highlight: ['root', 'l', 'r'] },
      { title: 'interpret() recurses', description: 'Call ast.interpret(context). Composite expressions evaluate children and combine; terminal expressions read from context. Recursion mirrors grammar nesting.', highlight: ['l', 'rl', 'rr'] },
      { title: 'Add a new rule by adding a class', description: 'Add Xor as a new Expression class with its own interpret(). Existing expressions don\'t know or care.', highlight: ['root'] },
    ],

    codeExample: {
      language: 'javascript',
      description: 'A boolean expression evaluator over a context. Try changing the values to see different results.',
      starter: `// Terminal expressions
class Variable {
  constructor(name) { this.name = name; }
  interpret(ctx) { return Boolean(ctx[this.name]); }
}
class Constant {
  constructor(value) { this.value = value; }
  interpret() { return this.value; }
}

// Non-terminal expressions
class And {
  constructor(l, r) { this.l = l; this.r = r; }
  interpret(ctx) { return this.l.interpret(ctx) && this.r.interpret(ctx); }
}
class Or {
  constructor(l, r) { this.l = l; this.r = r; }
  interpret(ctx) { return this.l.interpret(ctx) || this.r.interpret(ctx); }
}
class Not {
  constructor(e) { this.e = e; }
  interpret(ctx) { return !this.e.interpret(ctx); }
}

// Build "(isAdmin OR isOwner) AND NOT isLocked"
const expr = new And(
  new Or(new Variable('isAdmin'), new Variable('isOwner')),
  new Not(new Variable('isLocked'))
);

const cases = [
  { isAdmin: false, isOwner: true,  isLocked: false },
  { isAdmin: false, isOwner: false, isLocked: false },
  { isAdmin: true,  isOwner: false, isLocked: true  },
];
for (const c of cases) {
  console.log(JSON.stringify(c), '→', expr.interpret(c));
}
`,
    },

    industryUseCases: [
      { company: 'SQL parsers', description: 'SQLite\'s VDBE and PostgreSQL\'s planner build expression trees from parsed SQL and interpret them — even with subsequent compilation, the AST shape is interpreter-pattern.' },
      { company: 'Regex engines', description: 'Compiled regex is a tree of expression nodes (concat, alternation, repeat) interpreted against the input string.' },
      { company: 'Configuration DSLs', description: 'HCL (Terraform), JSONata, JsonLogic, CEL — small expression languages with grammar represented as ASTs and interpreted at runtime.' },
      { company: 'Rule engines', description: 'Drools, Camunda DMN, business rule platforms parse rules into expression trees and evaluate them against facts on each transaction.' },
    ],

    interviewQuestion: {
      question: 'When should you NOT use Interpreter, and what alternatives exist?',
      answer: 'Avoid Interpreter when: (a) the grammar is large — interpreter pattern doesn\'t scale beyond ~20 grammar rules; the class explosion becomes unwieldy. Use a parser generator (ANTLR, Tree-sitter) and a more efficient AST + visitor approach. (b) Performance matters — naive tree-walking interpreters are slow; for hot paths, compile to bytecode (LLVM, JVM, custom VM). (c) An off-the-shelf engine exists — don\'t reinvent regex, JSONPath, JMESPath, OPA Rego. (d) The "language" is really just function calls — sometimes a simple lambda is clearer than a grammar. The pattern shines for small DSLs with simple grammars: validation rules, search filters, configuration expressions — places where you want to express logic declaratively but need control over evaluation context and security.',
    },

    commonMistakes: [
      'Using Interpreter for grammars with hundreds of rules — class explosion and maintenance pain.',
      'Stuffing all grammar logic into one giant class instead of one per rule — defeats the pattern.',
      'Stateful contexts that interpret() mutates unpredictably — makes evaluation order matter.',
      'Mixing parsing with interpreting in the same code — separate the two phases for testability.',
      'Reinventing a domain when an established library exists (regex, JSONPath, CEL) — buy, don\'t build.',
    ],
  },
];
