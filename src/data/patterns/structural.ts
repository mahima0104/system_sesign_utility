import type { DesignPattern } from '../../types';

export const structuralPatterns: DesignPattern[] = [
  // ─── Adapter ──────────────────────────────────────────────────────────────────
  {
    id: 'adapter',
    name: 'Adapter',
    category: 'Structural',
    icon: '🔌',
    difficulty: 'beginner',
    tagline: 'Make incompatible interfaces work together',

    definition:
      'Converts the interface of a class into another interface clients expect. Adapter lets classes work together that couldn\'t otherwise because of incompatible interfaces.',

    problem:
      'Your application code expects a certain interface — the one your domain layer or framework defines. The third-party library or legacy system you need to integrate exposes a different shape. You can\'t change either side, but they need to communicate.',

    whyNeeded:
      'An Adapter wraps the incompatible class and translates calls between the two interfaces. The rest of your code stays clean — it talks to the Adapter through the expected interface and never sees the legacy one. Swap the Adapter when the underlying library changes; the rest doesn\'t move.',

    realLifeAnalogy:
      'A power plug adapter for international travel. Your laptop charger expects a US two-pin plug; the wall has a UK three-pin socket. The adapter translates the physical interface — neither device changes.',

    visualization: {
      caption: 'Adapter wraps the Adaptee and exposes the expected Target interface.',
      entities: [
        { id: 'client', label: 'Client', x: 12, y: 50, icon: '👤', color: '#6b7280' },
        { id: 'target', label: 'Target', x: 38, y: 50, icon: '🎯', color: '#2563eb' },
        { id: 'adapter', label: 'Adapter', x: 65, y: 50, icon: '🔌', color: '#7c3aed' },
        { id: 'adaptee', label: 'Adaptee', x: 90, y: 50, icon: '⚙️', color: '#059669' },
      ],
      relations: [
        { from: 'client', to: 'target', label: 'expects' },
        { from: 'target', to: 'adapter', label: 'implements' },
        { from: 'adapter', to: 'adaptee', label: 'translates calls' },
      ],
    },

    animationSteps: [
      { title: 'Client expects Target interface', description: 'Domain code calls target.fetchUser() — a clean, ergonomic shape that the rest of the app builds against.', highlight: ['client', 'target'] },
      { title: 'Adaptee speaks a different language', description: 'A third-party SDK exposes legacy_api.getUserById_v1(rawId) instead. Different name, different parameter format, different return shape.', highlight: ['adaptee'] },
      { title: 'Adapter sits in the middle', description: 'Adapter implements Target. Inside, it translates: parses the id, calls the legacy method, maps the response back to Target\'s contract.', highlight: ['adapter', 'adaptee'] },
      { title: 'Client never sees the legacy world', description: 'Result: domain code stays clean. Replace the SDK or upgrade legacy → only Adapter changes.', highlight: ['client', 'target', 'adapter'] },
    ],

    codeExample: {
      language: 'javascript',
      description: 'Adapt a legacy XML-style payment API to a modern JSON-style interface used by the rest of the app.',
      starter: `// What the rest of the app uses (Target interface)
class PaymentProcessor {
  pay({ userId, amount, currency }) { throw new Error('abstract'); }
}

// The third-party legacy SDK we can't change (Adaptee)
class LegacyXmlPaymentSdk {
  submitTransaction(xmlString) {
    // pretend we parsed and processed XML
    console.log('LegacySDK received:', xmlString);
    return '<response><status>OK</status><txnId>abc-123</txnId></response>';
  }
}

// Bridge between the two
class LegacyPaymentAdapter extends PaymentProcessor {
  constructor(legacy) {
    super();
    this.legacy = legacy;
  }
  pay({ userId, amount, currency }) {
    const xml = '<txn><user>' + userId + '</user><amount cur="' + currency + '">' + amount + '</amount></txn>';
    const response = this.legacy.submitTransaction(xml);
    const txnId = response.match(/<txnId>(.+)<\\/txnId>/)?.[1];
    return { ok: response.includes('<status>OK</status>'), txnId };
  }
}

// App code only knows about PaymentProcessor — clean!
const processor = new LegacyPaymentAdapter(new LegacyXmlPaymentSdk());
const result = processor.pay({ userId: 42, amount: 99.95, currency: 'USD' });
console.log('Result:', result);
`,
    },

    industryUseCases: [
      { company: 'Java Arrays.asList()', description: 'Adapts a primitive T[] array to a List<T> interface — same data, different view that fits the Collections framework.' },
      { company: 'java.io.InputStreamReader', description: 'Adapts a byte InputStream to a character Reader — translates between two fundamentally different stream APIs.' },
      { company: 'Spring HandlerAdapter', description: 'Spring MVC routes web requests to Controllers, @RestControllers, or HttpRequestHandlers — all via different HandlerAdapter implementations behind a uniform interface.' },
      { company: 'AWS SDK v1 → v2 wrappers', description: 'Many teams wrap AWS SDK v1 clients to look like v2 (or vice versa) so they can migrate gradually without a big-bang rewrite.' },
    ],

    interviewQuestion: {
      question: 'How is Adapter different from Decorator and Facade — they all wrap something?',
      answer: 'Three different intents, same shape. Adapter changes the interface — make A look like B so existing code can use it. Decorator preserves the interface — wrap A to add behaviour while still looking like A. Facade introduces a new simpler interface to a whole subsystem — hide complexity. The class structure can look identical (a wrapper holding the wrapped); the difference is intent. If interviewers push on "but they all delegate", emphasise: Adapter solves an incompatibility; Decorator solves feature combinatorics; Facade solves complexity exposure.',
    },

    commonMistakes: [
      'Using Adapter where you control both sides — refactor the interfaces directly instead.',
      'Letting the Adapter leak Adaptee details (raw error types, internal IDs) so callers end up coupled to legacy anyway.',
      'Building two-way adapters that get confused about which interface is canonical — pick a direction.',
      'Adapting too granularly — wrapping every method even when most pass through unchanged.',
      'Reaching for Adapter when Facade is the right tool (you\'re simplifying, not translating between equal-power interfaces).',
    ],
  },

  // ─── Bridge ───────────────────────────────────────────────────────────────────
  {
    id: 'bridge',
    name: 'Bridge',
    category: 'Structural',
    icon: '🌉',
    difficulty: 'advanced',
    tagline: 'Decouple abstraction from implementation',

    definition:
      'Decouples an abstraction from its implementation so that the two can vary independently.',

    problem:
      'You have an abstraction that varies along TWO independent dimensions — shapes (Circle, Square) × renderers (SVG, Canvas, WebGL). Subclassing for every combination gives you SVGCircle, CanvasCircle, WebGLCircle, SVGSquare... Adding a new dimension explodes: N × M classes.',

    whyNeeded:
      'Bridge splits the hierarchy in two: the abstraction (Shape) holds a reference to an implementor (Renderer) and delegates implementation-specific work. Now adding a Triangle is one class; adding a PostScript renderer is one class. Total: N + M instead of N × M. Both hierarchies evolve independently.',

    realLifeAnalogy:
      'A universal TV remote works with a TV, a DVD player, or an AC unit. The remote (abstraction) has volume / channel / power buttons. The device (implementation) varies — but the remote talks through a common protocol. Same remote, different devices, no rewiring.',

    visualization: {
      caption: 'Abstraction holds an Implementor reference; both hierarchies vary.',
      entities: [
        { id: 'a1', label: 'Circle', x: 18, y: 25, icon: '⭕', color: '#2563eb' },
        { id: 'a2', label: 'Square', x: 18, y: 75, icon: '⬛', color: '#2563eb' },
        { id: 'abs', label: 'Shape', x: 38, y: 50, icon: '🔷', color: '#2563eb' },
        { id: 'impl', label: 'Renderer', x: 65, y: 50, icon: '🌉', color: '#7c3aed' },
        { id: 'i1', label: 'SVG', x: 90, y: 25, icon: '🖼️', color: '#7c3aed' },
        { id: 'i2', label: 'Canvas', x: 90, y: 75, icon: '🎨', color: '#7c3aed' },
      ],
      relations: [
        { from: 'a1', to: 'abs' },
        { from: 'a2', to: 'abs' },
        { from: 'abs', to: 'impl', label: 'has-a' },
        { from: 'impl', to: 'i1' },
        { from: 'impl', to: 'i2' },
      ],
    },

    animationSteps: [
      { title: 'Abstraction holds an Implementor', description: 'A Shape is constructed with a Renderer. The link is composition, not inheritance — they\'re separate hierarchies bridged at runtime.', highlight: ['abs', 'impl'] },
      { title: 'Client calls abstract operation', description: 'shape.draw() — the abstraction does its own high-level work (positioning, sizing, transform).', highlight: ['a1', 'abs'] },
      { title: 'Abstraction delegates to Implementor', description: 'For low-level rendering, the Shape calls renderer.drawCircle(x, y, r). The implementor draws using its native API.', highlight: ['abs', 'impl', 'i1'] },
      { title: 'Swap either side independently', description: 'Switch the renderer to Canvas at runtime — same Shape code, different output. Add a new Square shape — works with every renderer.', highlight: ['a2', 'i2'] },
    ],

    codeExample: {
      language: 'javascript',
      description: 'Shapes (abstraction) drawing through different Renderers (implementor). Add a renderer or a shape — they don\'t multiply.',
      starter: `// Implementor hierarchy
class Renderer {
  drawCircle(x, y, r) { throw new Error('abstract'); }
  drawSquare(x, y, side) { throw new Error('abstract'); }
}

class SvgRenderer extends Renderer {
  drawCircle(x, y, r) { return '<svg circle cx=' + x + ' cy=' + y + ' r=' + r + ' />'; }
  drawSquare(x, y, s) { return '<svg rect x=' + x + ' y=' + y + ' w=' + s + ' h=' + s + ' />'; }
}

class CanvasRenderer extends Renderer {
  drawCircle(x, y, r) { return 'ctx.arc(' + x + ', ' + y + ', ' + r + ')'; }
  drawSquare(x, y, s) { return 'ctx.rect(' + x + ', ' + y + ', ' + s + ', ' + s + ')'; }
}

// Abstraction hierarchy
class Shape {
  constructor(renderer) { this.renderer = renderer; }
  draw() { throw new Error('abstract'); }
}

class Circle extends Shape {
  constructor(renderer, x, y, r) { super(renderer); Object.assign(this, { x, y, r }); }
  draw() { return this.renderer.drawCircle(this.x, this.y, this.r); }
}

class Square extends Shape {
  constructor(renderer, x, y, side) { super(renderer); Object.assign(this, { x, y, side }); }
  draw() { return this.renderer.drawSquare(this.x, this.y, this.side); }
}

// Mix and match — same shape works with any renderer.
const svg = new SvgRenderer();
const canvas = new CanvasRenderer();

console.log(new Circle(svg, 50, 50, 10).draw());
console.log(new Circle(canvas, 50, 50, 10).draw());
console.log(new Square(svg, 0, 0, 20).draw());
console.log(new Square(canvas, 0, 0, 20).draw());
`,
    },

    industryUseCases: [
      { company: 'JDBC Driver architecture', description: 'java.sql.Connection (abstraction) is bridged to driver-specific implementations — MySQL, Postgres, Oracle. Add a new DB or a new connection feature without touching the other axis.' },
      { company: 'AWT/Swing native peers', description: 'Each Java widget has a peer that bridges to native OS controls — your Button code is the abstraction; the OS-specific peer is the implementor.' },
      { company: 'SLF4J logging facade', description: 'SLF4J\'s Logger is the abstraction; bridges to Log4j, java.util.logging, Logback — applications don\'t change when you swap the backend.' },
      { company: 'Cross-platform device drivers', description: 'OS kernels expose a generic device API (read/write/ioctl) bridged to vendor-specific driver code per hardware family.' },
    ],

    interviewQuestion: {
      question: 'Bridge versus Strategy versus Adapter — they all use composition over inheritance. What\'s the tell-tale difference?',
      answer: 'All three compose a wrapped object, but the intent differs. Adapter is retrofitting incompatible interfaces post-hoc — you discovered the problem after the fact. Strategy swaps an algorithm at runtime, often with no underlying hierarchy on either side. Bridge is designed up front to keep TWO parallel hierarchies independent so you can grow each axis without combinatorial explosion. Adapter solves a problem you have; Bridge prevents one. If you find yourself with N×M subclasses or anticipating that, reach for Bridge.',
    },

    commonMistakes: [
      'Confusing Bridge with simple delegation — Bridge specifically separates two HIERARCHIES that vary independently.',
      'Coupling the abstraction to a specific implementor (`new SvgRenderer()` baked into Shape) — defeats the pattern.',
      'Using Bridge when you have only one implementation today — wait until you actually need polymorphism.',
      'Letting the Implementor interface bleed details from one specific implementor (e.g., Canvas-specific methods on Renderer).',
      'Mixing Strategy intent (algorithm choice) with Bridge intent (impl variant) — they\'re structurally similar but communicate different design decisions.',
    ],
  },

  // ─── Composite ────────────────────────────────────────────────────────────────
  {
    id: 'composite',
    name: 'Composite',
    category: 'Structural',
    icon: '🌲',
    difficulty: 'intermediate',
    tagline: 'Treat trees and leaves uniformly',

    definition:
      'Composes objects into tree structures to represent part-whole hierarchies. Composite lets clients treat individual objects and compositions uniformly.',

    problem:
      'You have a tree of objects where some nodes are leaves and others contain children. Clients have to constantly check `if (isLeaf) doX else recurseIntoChildren`. This pollutes every traversal with type checks and makes adding new operations painful.',

    whyNeeded:
      'Composite defines a common interface (Component) for both leaves and composites. A Folder can hold Files OR other Folders, all referenced as Components. Operations like getSize() are recursive but uniform — call getSize() on any Component without caring whether it\'s a leaf or a tree.',

    realLifeAnalogy:
      'A file system. A File has a size; a Folder\'s size is the sum of its contents — files, sub-folders, or both. Whether you ask a File or a Folder for its size, the answer comes back the same way.',

    visualization: {
      caption: 'Leaf and Composite share the Component interface.',
      entities: [
        { id: 'comp', label: 'Component', x: 50, y: 18, icon: '🔷', color: '#2563eb' },
        { id: 'leaf', label: 'Leaf', x: 22, y: 60, icon: '📄', color: '#7c3aed' },
        { id: 'composite', label: 'Composite', x: 78, y: 60, icon: '📁', color: '#7c3aed' },
        { id: 'l1', label: 'File 1', x: 60, y: 92, icon: '📄', color: '#059669' },
        { id: 'l2', label: 'File 2', x: 80, y: 92, icon: '📄', color: '#059669' },
        { id: 'sub', label: 'Subfolder', x: 95, y: 92, icon: '📁', color: '#059669' },
      ],
      relations: [
        { from: 'leaf', to: 'comp' },
        { from: 'composite', to: 'comp' },
        { from: 'composite', to: 'l1' },
        { from: 'composite', to: 'l2' },
        { from: 'composite', to: 'sub' },
      ],
    },

    animationSteps: [
      { title: 'Define the common Component interface', description: 'Both Leaf and Composite implement the same operations (e.g., getSize, render). Clients see only this abstract type.', highlight: ['comp', 'leaf', 'composite'] },
      { title: 'Build the tree', description: 'Composites hold Components — which can be Leaves or other Composites. Trees can nest arbitrarily deep.', highlight: ['composite', 'l1', 'l2', 'sub'] },
      { title: 'Operations recurse naturally', description: 'Call composite.getSize() — internally it loops over its children, calls getSize() on each (whether Leaf or Composite), and sums.', highlight: ['composite', 'l1', 'l2', 'sub'] },
      { title: 'Add new node types without breaking traversals', description: 'Add a SymbolicLink that implements Component — every existing tool (size calculator, search, render) works with it.', highlight: ['leaf', 'composite'] },
    ],

    codeExample: {
      language: 'javascript',
      description: 'A file system tree. Files are leaves, folders are composites — both expose getSize() through the same interface.',
      starter: `// Common interface
class FsNode {
  constructor(name) { this.name = name; }
  getSize() { throw new Error('abstract'); }
  render(indent = '') { throw new Error('abstract'); }
}

// Leaf
class File extends FsNode {
  constructor(name, size) { super(name); this.size = size; }
  getSize() { return this.size; }
  render(indent = '') { return indent + '📄 ' + this.name + ' (' + this.size + 'B)'; }
}

// Composite
class Folder extends FsNode {
  constructor(name, children = []) { super(name); this.children = children; }
  add(node) { this.children.push(node); return this; }
  getSize() { return this.children.reduce((sum, c) => sum + c.getSize(), 0); }
  render(indent = '') {
    const head = indent + '📁 ' + this.name + ' (' + this.getSize() + 'B)';
    const body = this.children.map(c => c.render(indent + '  ')).join('\\n');
    return head + (body ? '\\n' + body : '');
  }
}

const root = new Folder('project', [
  new File('README.md', 1200),
  new Folder('src', [
    new File('index.js', 4500),
    new File('utils.js', 800),
    new Folder('components', [ new File('Button.jsx', 1100) ]),
  ]),
  new File('package.json', 600),
]);

console.log(root.render());
console.log('\\nTotal size:', root.getSize(), 'bytes');
`,
    },

    industryUseCases: [
      { company: 'DOM trees in browsers', description: 'Element and Text both extend Node; methods like cloneNode, contains, and querySelector traverse the tree uniformly without type-checking each visited node.' },
      { company: 'React component trees', description: 'Host components (div, span) and composite components (Profile, Sidebar) implement the same render contract — reconciler walks the tree polymorphically.' },
      { company: 'File systems (POSIX VFS)', description: 'Linux\'s Virtual File System treats files, directories, devices, and sockets uniformly through inode operations — every kernel tool benefits.' },
      { company: 'GUI widget hierarchies', description: 'Swing, JavaFX, Qt, GTK: containers (Panel, Window) hold widgets (Button, Label) that all implement paint/resize/handleEvent.' },
    ],

    interviewQuestion: {
      question: 'How does Composite enable open/closed for new node types? Give a concrete example.',
      answer: 'New node types implement the same Component interface — existing traversals work without modification because they call only interface methods. Concrete example: a file system that already supports File and Folder. You want to add SymbolicLink. Implement Component (provide getSize, render). Plug it into the tree wherever appropriate. Every existing tool — size calculator, recursive search, tree renderer, backup utility — works with SymbolicLink for free, with no edits to those tools. The cost: anyone using the Component interface might assume any node has children; SymbolicLink may need to lie politely (return empty array) or throw a documented exception. The pattern is open for extension (new types) and closed for modification (no traversal edits).',
    },

    commonMistakes: [
      'Forcing leaf-specific methods (add, remove children) into the Component interface — Leaf must throw or no-op, leaking abstraction.',
      'Tightly coupling parent and child references creating bidirectional cycles that complicate clone, equality, and serialization.',
      'Not handling empty composites — many ops assume at least one child and crash on `[]`.',
      'Recursing through huge trees synchronously — measure! For large trees, prefer iterative traversal or yield generators.',
      'Reaching for Composite when a flat list with type tags would suffice — pattern adds ceremony.',
    ],
  },

  // ─── Decorator ────────────────────────────────────────────────────────────────
  {
    id: 'decorator',
    name: 'Decorator',
    category: 'Structural',
    icon: '🎁',
    difficulty: 'intermediate',
    tagline: 'Add responsibilities at runtime by wrapping',

    definition:
      'Attaches additional responsibilities to an object dynamically. Decorators provide a flexible alternative to subclassing for extending functionality.',

    problem:
      'You want to add behaviours to objects (logging, caching, validation, formatting) but creating subclasses for every combination explodes. With 5 features and 3 base classes, you\'d need 5 × 2³ = 40 subclasses for all combos. Some combinations are never used.',

    whyNeeded:
      'Decorators wrap an object with another that has the SAME interface but adds behaviour. Stack decorators to combine features at runtime. Want logging + caching + retry on a service? Wrap it three times: new Retry(new Cache(new Log(service))). Combinations form at instantiation, not class definition.',

    realLifeAnalogy:
      'Ordering coffee with add-ons. Base coffee → add milk → add sugar → add whipped cream. Each add-on wraps the previous; the final drink has all features; the base coffee class never changed.',

    visualization: {
      caption: 'Decorators wrap a Component, all sharing the same interface.',
      entities: [
        { id: 'iface', label: 'Component', x: 50, y: 15, icon: '🔷', color: '#2563eb' },
        { id: 'base', label: 'Base', x: 18, y: 60, icon: '☕', color: '#7c3aed' },
        { id: 'd1', label: 'MilkDeco', x: 50, y: 60, icon: '🥛', color: '#059669' },
        { id: 'd2', label: 'SugarDeco', x: 82, y: 60, icon: '🍬', color: '#059669' },
      ],
      relations: [
        { from: 'base', to: 'iface' },
        { from: 'd1', to: 'iface' },
        { from: 'd2', to: 'iface' },
        { from: 'd1', to: 'base', label: 'wraps' },
        { from: 'd2', to: 'd1', label: 'wraps' },
      ],
    },

    animationSteps: [
      { title: 'Start with a bare Component', description: 'A plain Coffee object — costs $2, returns "espresso". No decorations yet.', highlight: ['base'] },
      { title: 'Wrap with Decorator A', description: 'Wrap with MilkDecorator. milk.cost() returns base.cost() + 0.5. milk.describe() appends "+ milk".', highlight: ['base', 'd1'] },
      { title: 'Wrap again with Decorator B', description: 'Wrap the milk-decorated coffee with SugarDecorator. Each wrapper is itself a Component, so wrapping nests freely.', highlight: ['d1', 'd2'] },
      { title: 'Calls flow through the chain', description: 'sugar.cost() → milk.cost() → base.cost(), summing along the way. Order of wrapping matters — change it, get different behaviour.', highlight: ['iface', 'base', 'd1', 'd2'] },
    ],

    codeExample: {
      language: 'javascript',
      description: 'Coffee with milk, sugar, and whip decorators. Each decorator implements the same interface and wraps another instance.',
      starter: `// Component interface (just by convention in JS)
class Beverage {
  cost() { throw new Error('abstract'); }
  describe() { throw new Error('abstract'); }
}

class Espresso extends Beverage {
  cost() { return 2.0; }
  describe() { return 'espresso'; }
}

// Base decorator — wraps any Beverage
class BeverageDecorator extends Beverage {
  constructor(inner) { super(); this.inner = inner; }
}

class Milk extends BeverageDecorator {
  cost() { return this.inner.cost() + 0.5; }
  describe() { return this.inner.describe() + ' + milk'; }
}

class Sugar extends BeverageDecorator {
  cost() { return this.inner.cost() + 0.2; }
  describe() { return this.inner.describe() + ' + sugar'; }
}

class Whip extends BeverageDecorator {
  cost() { return this.inner.cost() + 0.7; }
  describe() { return this.inner.describe() + ' + whip'; }
}

// Stack decorations at runtime
const order = new Whip(new Sugar(new Milk(new Espresso())));
console.log(order.describe(), '→ $' + order.cost().toFixed(2));

const simple = new Milk(new Espresso());
console.log(simple.describe(), '→ $' + simple.cost().toFixed(2));
`,
    },

    industryUseCases: [
      { company: 'Java I/O Streams', description: 'BufferedReader(InputStreamReader(FileInputStream(...))) — each layer adds buffering, character decoding, or compression. Same Reader interface throughout.' },
      { company: 'Python @decorator syntax', description: 'Functions wrapped with @cache, @retry, @timed compose cross-cutting concerns. Each decorator is itself a function returning a wrapped function — direct use of the pattern.' },
      { company: 'Express.js middleware', description: 'app.use(logger).use(auth).use(json).use(routes) — each middleware wraps the next handler. Add caching or rate limiting by inserting one more wrapper.' },
      { company: 'React Higher-Order Components', description: 'withRouter, withTranslation, connect — HOCs wrap a component to inject props or behaviour without modifying the wrapped component\'s code.' },
    ],

    interviewQuestion: {
      question: 'When does Decorator beat inheritance, and when does it actively make code worse?',
      answer: 'Decorator beats inheritance when feature combinations are open-ended or unknown at compile time — you can\'t enumerate every (Espresso × Milk × Sugar × Whip) subclass without explosion. Decorator also wins when you need to add behaviour to a class you don\'t own. It hurts when only 2-3 fixed combinations exist (just subclass), when wrapping order matters but isn\'t documented (compress-then-encrypt vs encrypt-then-compress give different results), or when callers need to introspect the wrapped class — wrappers hide the underlying type. Debugging deeply-decorated chains is also painful: stack traces show 6 layers of `inner.method()` calls.',
    },

    commonMistakes: [
      'Decorating with classes that have a DIFFERENT interface than the wrapped object — that\'s actually Adapter, not Decorator.',
      'Not preserving the type — `withFoo(component)` returns `any`, breaking type inference for everything downstream.',
      'Order-dependent decorators without documentation — stack them wrong and behaviour silently changes.',
      'Excessive decoration causing 10-deep call stacks and slow debugging.',
      'State-mutating decorators that conflict when stacked — each layer assumes it\'s the only one writing.',
    ],
  },

  // ─── Facade ───────────────────────────────────────────────────────────────────
  {
    id: 'facade',
    name: 'Facade',
    category: 'Structural',
    icon: '🏛️',
    difficulty: 'beginner',
    tagline: 'A simple front for a complex subsystem',

    definition:
      'Provides a unified interface to a set of interfaces in a subsystem. Facade defines a higher-level interface that makes the subsystem easier to use.',

    problem:
      'A subsystem has dozens of classes that clients have to coordinate — initialise A, configure B, call C in the right order with the right args, handle D\'s errors, clean up E. Every caller duplicates this orchestration; one mistake anywhere breaks the chain.',

    whyNeeded:
      'A Facade is a single class wrapping the subsystem with a small, task-oriented API. Clients call one method (orderPizza, startMovie, sendEmail) and the Facade orchestrates internally. Subsystem complexity is hidden; clients become trivial; advanced users can still drop into the subsystem when needed.',

    realLifeAnalogy:
      'A hotel concierge. You don\'t call the kitchen, the laundry, the spa, and the limousine company yourself. You call the concierge: "I want dinner at 8 and a ride to the airport at 7am." They orchestrate the subsystem behind the scenes.',

    visualization: {
      caption: 'Facade fronts a complex subsystem with a simple API.',
      entities: [
        { id: 'client', label: 'Client', x: 12, y: 50, icon: '👤', color: '#6b7280' },
        { id: 'facade', label: 'Facade', x: 38, y: 50, icon: '🏛️', color: '#2563eb' },
        { id: 's1', label: 'Sub A', x: 75, y: 18, icon: '⚙️', color: '#7c3aed' },
        { id: 's2', label: 'Sub B', x: 80, y: 50, icon: '⚙️', color: '#7c3aed' },
        { id: 's3', label: 'Sub C', x: 75, y: 82, icon: '⚙️', color: '#7c3aed' },
      ],
      relations: [
        { from: 'client', to: 'facade', label: 'simple call' },
        { from: 'facade', to: 's1' },
        { from: 'facade', to: 's2' },
        { from: 'facade', to: 's3' },
      ],
    },

    animationSteps: [
      { title: 'Subsystem has many moving parts', description: 'Projector, screen, speakers, lights, streaming service — each with its own API and ordering rules. Calling them directly is a chore.', highlight: ['s1', 's2', 's3'] },
      { title: 'Client wants a high-level task', description: 'theatre.startMovie(\'Inception\') — that\'s all the client should need to say.', highlight: ['client', 'facade'] },
      { title: 'Facade orchestrates internally', description: 'Lights dim, screen drops, projector powers up, speakers initialise, stream starts — all in the right order, with retries and rollback.', highlight: ['facade', 's1', 's2', 's3'] },
      { title: 'Errors handled in one place', description: 'If the projector fails, the Facade rolls back: turn lights up, raise screen. The client gets a single clean error.', highlight: ['facade'] },
    ],

    codeExample: {
      language: 'javascript',
      description: 'A home-theatre subsystem with five components. The Facade reduces "watch a movie" to one call.',
      starter: `// Subsystem (would normally be many classes / SDKs)
const projector = { on()  { console.log('🎥 projector on'); }, off() { console.log('🎥 projector off'); } };
const screen    = { drop() { console.log('🖼 screen down'); }, raise() { console.log('🖼 screen up'); } };
const speakers  = { setVolume(v) { console.log('🔊 volume =', v); } };
const lights    = { dim(p)  { console.log('💡 lights at', p + '%'); } };
const streamer  = { play(title) { console.log('▶ playing', title); }, stop() { console.log('⏹ stopped'); } };

// Facade
class HomeTheatre {
  watch(title) {
    console.log('— starting movie —');
    lights.dim(20);
    screen.drop();
    projector.on();
    speakers.setVolume(7);
    streamer.play(title);
  }
  end() {
    console.log('— ending movie —');
    streamer.stop();
    projector.off();
    screen.raise();
    lights.dim(100);
  }
}

const theatre = new HomeTheatre();
theatre.watch('Inception');
console.log();
theatre.end();
`,
    },

    industryUseCases: [
      { company: 'jQuery', description: '$(\'#btn\').css(...).show().on(\'click\', ...) hides a tangle of native DOM APIs (querySelector, classList, addEventListener, getComputedStyle) behind a chainable facade.' },
      { company: 'Spring Boot AutoConfiguration', description: 'A few @SpringBootApplication annotations replace XML configuration of dozens of beans. The annotation IS the facade — internally it wires the entire stack.' },
      { company: 'AWS SDK clients', description: 'S3Client.upload() handles multipart upload, retry, signing, and content-type detection through one call. Power users still get the low-level multipart API when needed.' },
      { company: 'Compiler frontends', description: 'javac wraps lexer + parser + type checker + bytecode generator into a single command. Each piece is independently usable by tools like IDEs.' },
    ],

    interviewQuestion: {
      question: 'When does a Facade become an anti-pattern, and how do you avoid that?',
      answer: 'A Facade goes wrong when it accumulates business logic and turns into a god object — every change requires editing it, it knows everything about everything, and dependencies inside the facade fan out to every subsystem class. Symptoms: a Facade with 100+ methods, deeply nested logic, and tests that mock half the application. To avoid this: keep the Facade thin — pure orchestration, no domain logic. Split into multiple smaller facades by concern (PaymentFacade, ShippingFacade) once one grows too large. Allow advanced clients to bypass the Facade and call the subsystem directly — over-abstracting forces work-arounds.',
    },

    commonMistakes: [
      'Letting the Facade leak subsystem details (raw error types, internal IDs) — clients end up coupled anyway.',
      'Putting business logic inside the Facade — it should orchestrate, not implement.',
      'Building a Facade where a simple helper function would do; Facade is for genuinely complex subsystems.',
      'Forbidding direct subsystem access — power users need an escape hatch for cases the Facade doesn\'t cover.',
      'A Facade with too many methods that have nothing to do with each other — split into multiple cohesive facades.',
    ],
  },

  // ─── Flyweight ────────────────────────────────────────────────────────────────
  {
    id: 'flyweight',
    name: 'Flyweight',
    category: 'Structural',
    icon: '🪶',
    difficulty: 'advanced',
    tagline: 'Share fine-grained objects to save memory',

    definition:
      'Uses sharing to support large numbers of fine-grained objects efficiently. A flyweight is a shared object that can be used in multiple contexts simultaneously, but its intrinsic state is shared.',

    problem:
      'Naive implementations create millions of nearly-identical objects. A text editor with 100k characters, each a Character with font/color/style, blows up memory. Same for game worlds with thousands of trees, particle systems, or chess engines that copy positions during search.',

    whyNeeded:
      'Flyweight separates intrinsic state (shared, immutable) from extrinsic state (unique, contextual). Intrinsic state goes into a small pool of flyweight objects shared across all "instances". Extrinsic state is passed in from outside (e.g., position) at use time. Memory drops dramatically — often by orders of magnitude.',

    realLifeAnalogy:
      'Chess pieces in a chess engine. Instead of 32 unique objects, you have 12 flyweight types (white/black × king/queen/rook/bishop/knight/pawn). The board grid stores positions; each cell points to a shared flyweight piece. Same piece type → same memory.',

    visualization: {
      caption: 'Many contexts share a small pool of intrinsic-state flyweights.',
      entities: [
        { id: 'fac', label: 'Factory', x: 18, y: 50, icon: '🏭', color: '#2563eb' },
        { id: 'pool', label: 'Pool', x: 50, y: 50, icon: '🪶', color: '#7c3aed' },
        { id: 'c1', label: 'Tree @(10,40)', x: 85, y: 22, icon: '🌳', color: '#059669' },
        { id: 'c2', label: 'Tree @(50,80)', x: 85, y: 50, icon: '🌳', color: '#059669' },
        { id: 'c3', label: 'Tree @(90,15)', x: 85, y: 78, icon: '🌳', color: '#059669' },
      ],
      relations: [
        { from: 'fac', to: 'pool', label: 'caches' },
        { from: 'c1', to: 'pool', label: 'shares' },
        { from: 'c2', to: 'pool', label: 'shares' },
        { from: 'c3', to: 'pool', label: 'shares' },
      ],
    },

    animationSteps: [
      { title: 'Identify intrinsic vs extrinsic state', description: 'Intrinsic (shared): tree species, sprite, mesh, behaviour rules. Extrinsic (unique): position, age, health.', highlight: ['pool'] },
      { title: 'Factory caches flyweights', description: 'Client asks factory for a Pine. Factory checks the pool — first request creates and caches; subsequent requests return the cached instance.', highlight: ['fac', 'pool'] },
      { title: 'Many contexts reference the same flyweight', description: '10,000 trees in the world — but only 5 unique flyweights. Each tree is a tiny record (position + flyweight pointer).', highlight: ['pool', 'c1', 'c2', 'c3'] },
      { title: 'Operations pass extrinsic state', description: 'flyweight.draw(position) — flyweight uses its shared mesh + the per-call position to render. Memory stays low; throughput stays high.', highlight: ['c1', 'c2', 'c3'] },
    ],

    codeExample: {
      language: 'javascript',
      description: '10,000 trees rendered with only a handful of TreeType flyweights.',
      starter: `// Intrinsic state — shared
class TreeType {
  constructor(name, color, texture) {
    this.name = name; this.color = color; this.texture = texture;
  }
  draw(x, y) {
    return this.name + '(' + this.color + ')@(' + x + ',' + y + ')';
  }
}

// Flyweight factory — caches by composite key
class TreeFactory {
  static cache = new Map();
  static get(name, color, texture) {
    const key = name + '|' + color + '|' + texture;
    if (!TreeFactory.cache.has(key)) {
      TreeFactory.cache.set(key, new TreeType(name, color, texture));
    }
    return TreeFactory.cache.get(key);
  }
  static size() { return TreeFactory.cache.size; }
}

// Extrinsic state — unique per context
class Tree {
  constructor(x, y, type) { this.x = x; this.y = y; this.type = type; }
  draw() { return this.type.draw(this.x, this.y); }
}

// Build a forest
const forest = [];
for (let i = 0; i < 10000; i++) {
  const species = i % 2 === 0 ? 'pine' : 'oak';
  const colour  = i % 3 === 0 ? 'green' : 'darkgreen';
  forest.push(new Tree(Math.random() * 100, Math.random() * 100,
                       TreeFactory.get(species, colour, '<<heavy texture>>')));
}

console.log('Trees:', forest.length);
console.log('Unique flyweights:', TreeFactory.size());
console.log('Sample:', forest[0].draw());
`,
    },

    industryUseCases: [
      { company: 'Java Integer cache', description: 'Integer.valueOf reuses cached instances for -128..127 — avoids creating millions of redundant boxed integers. JVMs internally apply the same to other autoboxed types.' },
      { company: 'JavaScript string interning', description: 'Engines (V8, JSC) share memory for identical string literals. Two `"hello"` literals in different files point to the same underlying buffer.' },
      { company: 'Game engines', description: 'Unity/Unreal share meshes, textures, and materials across thousands of instances; each particle / NPC / tree carries only position and per-instance state.' },
      { company: 'Browser glyph rendering', description: 'Each character glyph is rendered into a cache once, reused as a texture for every occurrence on the page. Otherwise rendering a long article would be impossibly slow.' },
    ],

    interviewQuestion: {
      question: 'When does Flyweight backfire? How do you decide whether the optimisation is worth it?',
      answer: 'Flyweight backfires when (a) intrinsic state is rarely shared — every object is genuinely unique, so the pool has as many entries as instances, no savings; (b) extrinsic state is large or expensive to compute — you save memory but spend it again in CPU passing extrinsic state on every call; (c) instance count is small (< a few thousand) — memory savings are negligible relative to the added complexity. Decision: profile first. Measure object count, average instance size, and what fraction of state could be shared. If you have N instances of size S where shared portion is K%, expected savings ≈ N×S×K. If that\'s under tens of MB or you have under 10k instances, skip the pattern.',
    },

    commonMistakes: [
      'Making flyweights mutable — breaks sharing, since one client mutating leaks to all.',
      'Forgetting that extrinsic state must be passed every call — turns hot loops into parameter hell.',
      'Over-applying when instance counts are < 10k and memory isn\'t actually constrained.',
      'Confusing Flyweight (shared) with Singleton (single instance) — they look similar but have different intent.',
      'Not measuring before/after memory — assuming savings without proof, then carrying complexity that didn\'t pay off.',
    ],
  },

  // ─── Proxy ────────────────────────────────────────────────────────────────────
  {
    id: 'proxy',
    name: 'Proxy',
    category: 'Structural',
    icon: '🪞',
    difficulty: 'intermediate',
    tagline: 'Control access through a stand-in',

    definition:
      'Provides a surrogate or placeholder for another object to control access to it.',

    problem:
      'Sometimes you need to add behaviour — lazy loading, access control, caching, logging, remote invocation — to an existing object without changing it or its callers. The callers should believe they\'re talking to the real subject.',

    whyNeeded:
      'A Proxy implements the SAME interface as the real subject but adds behaviour in front of (or instead of) forwarding calls. It can lazy-instantiate the real subject, check permissions, cache results, log calls, or transparently call a remote service. Callers never know the difference.',

    realLifeAnalogy:
      'A credit card is a proxy for your bank account. It has a "pay $X" interface — same as cash from the merchant\'s perspective — but it adds fraud checks, credit limits, transaction logging, and rewards transparently.',

    visualization: {
      caption: 'Proxy stands between Client and RealSubject, controlling access.',
      entities: [
        { id: 'client', label: 'Client', x: 12, y: 50, icon: '👤', color: '#6b7280' },
        { id: 'proxy', label: 'Proxy', x: 45, y: 50, icon: '🪞', color: '#2563eb' },
        { id: 'real', label: 'RealSubject', x: 82, y: 50, icon: '💎', color: '#7c3aed' },
      ],
      relations: [
        { from: 'client', to: 'proxy', label: 'request()' },
        { from: 'proxy', to: 'real', label: 'forwards (if allowed)' },
      ],
    },

    animationSteps: [
      { title: 'Client calls Proxy thinking it\'s the real thing', description: 'Same interface, same method names. The proxy is a drop-in replacement.', highlight: ['client', 'proxy'] },
      { title: 'Proxy runs guard logic first', description: 'Auth check, cache lookup, rate limit, logging — whatever cross-cutting concern this proxy adds.', highlight: ['proxy'] },
      { title: 'Proxy forwards to RealSubject if allowed', description: 'On a cache miss / valid permissions / first call, the proxy delegates to the real object — possibly creating it lazily.', highlight: ['proxy', 'real'] },
      { title: 'Result returned (perhaps transformed)', description: 'Proxy may transform the response — cache it, sanitize errors, redact fields — before returning to the client.', highlight: ['client', 'proxy', 'real'] },
    ],

    codeExample: {
      language: 'javascript',
      description: 'A lazy-loading image proxy. The expensive load only happens on first display, and is cached afterwards.',
      starter: `// Real subject — heavy to construct
class HighResImage {
  constructor(filename) {
    console.log('💎 Loading', filename, '(this is expensive)');
    // pretend: read file, decode, allocate GPU memory
    this.filename = filename;
    this.pixels = '<<10MB of pixel data>>';
  }
  display(x, y) {
    return 'drawing ' + this.filename + ' at (' + x + ',' + y + ')';
  }
}

// Proxy — same interface, lazy + cached
class ImageProxy {
  constructor(filename) {
    this.filename = filename;
    this.real = null;
  }
  display(x, y) {
    if (!this.real) this.real = new HighResImage(this.filename);
    return this.real.display(x, y);
  }
}

// 10 images, none loaded yet
const gallery = ['cat.jpg', 'dog.jpg', 'bird.jpg'].map(n => new ImageProxy(n));

console.log('Gallery built — no loading yet');
console.log(gallery[0].display(0, 0));    // first display → load
console.log(gallery[0].display(50, 50));  // already loaded → instant
console.log(gallery[1].display(0, 100));  // dog now loads on demand
`,
    },

    industryUseCases: [
      { company: 'Hibernate lazy loading', description: 'When you fetch a User entity, related collections (orders, addresses) are returned as proxy objects. They hit the DB only on first access — saves bandwidth and latency.' },
      { company: 'JavaScript Proxy object', description: 'new Proxy(target, handler) intercepts property access, assignment, and method calls — used by Vue\'s reactivity, MobX, and Immer.' },
      { company: 'gRPC / RPC client stubs', description: 'Generated client code is a proxy — same methods as the server interface, but each call serialises arguments and sends them over the network.' },
      { company: 'Spring AOP', description: 'Spring wraps beans in proxies to add @Transactional, @Cacheable, @Async behaviour without touching the bean class itself.' },
    ],

    interviewQuestion: {
      question: 'How does Proxy differ from Decorator? They look identical structurally.',
      answer: 'Both wrap an object that has the same interface. The structural pattern is identical. The difference is INTENT and consequently usage. Decorator\'s intent is to ADD behaviour — and they\'re typically stacked (logging + caching + retry). Proxy\'s intent is to CONTROL ACCESS — and they\'re usually one layer (authorization, lazy loading, remote forwarding). In practice the line is fuzzy: Spring AOP "decorators" are technically proxies. The name you give it is a communication choice — say "proxy" when readers should think "what does this control / restrict / defer?", say "decorator" when readers should think "what extra capability is added?".',
    },

    commonMistakes: [
      'Implementing a different interface than the real subject — clients see different methods, defeating the transparent-substitution promise.',
      'Hiding network errors or null cases inside lazy-loading proxies — debugging becomes painful.',
      'Caching proxies without an invalidation strategy — stale data problems creep in.',
      'Layering too many proxies (auth proxy → cache proxy → logging proxy → real) makes call stacks hard to read.',
      'Reaching for Proxy when Decorator\'s intent fits better (or vice versa) — confuses future readers about why the wrapper exists.',
    ],
  },
];
