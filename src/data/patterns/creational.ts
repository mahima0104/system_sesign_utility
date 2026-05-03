import type { DesignPattern } from '../../types';

export const creationalPatterns: DesignPattern[] = [
  // ─── Singleton ────────────────────────────────────────────────────────────────
  {
    id: 'singleton',
    name: 'Singleton',
    category: 'Creational',
    icon: '☝️',
    difficulty: 'beginner',
    tagline: 'One instance to rule them all',

    definition:
      'The Singleton Pattern ensures that a class has only one instance and provides a global point of access to it.',

    problem:
      'In some scenarios, multiple instances of a class can cause inconsistent behaviour, wasted resources, or conflicting state. Two database connection pools could exhaust connections; two configuration loaders could disagree on settings. We need a way to guarantee that only one instance ever exists, no matter how many times we ask for it.',

    whyNeeded:
      'Singletons are useful when an object represents a shared resource (logger, config, cache, connection pool, thread pool) where having more than one would be wasteful or incorrect. The pattern centralises lifecycle management and gives the rest of the codebase a single, predictable handle to that resource.',

    realLifeAnalogy:
      'Think of a country\'s president. There is exactly one president at a time, and any citizen who needs to interact with "the office of the president" goes through that same person — not a new one each time.',

    visualization: {
      caption: 'Multiple callers — one shared instance.',
      entities: [
        { id: 'c1', label: 'Caller A', x: 10, y: 25, icon: '👤', color: '#6b7280' },
        { id: 'c2', label: 'Caller B', x: 10, y: 55, icon: '👤', color: '#6b7280' },
        { id: 'c3', label: 'Caller C', x: 10, y: 85, icon: '👤', color: '#6b7280' },
        { id: 'gi', label: 'getInstance()', x: 45, y: 55, icon: '🔑', color: '#2563eb' },
        { id: 's', label: 'Singleton', x: 80, y: 55, icon: '☝️', color: '#7c3aed' },
      ],
      relations: [
        { from: 'c1', to: 'gi' },
        { from: 'c2', to: 'gi' },
        { from: 'c3', to: 'gi' },
        { from: 'gi', to: 's', label: 'returns same instance' },
      ],
    },

    animationSteps: [
      { title: 'First call: instance is null', description: 'Caller A invokes getInstance(). The class checks its private static field — there is no instance yet, so it creates one and stores it.', highlight: ['c1', 'gi'] },
      { title: 'Instance is cached', description: 'The newly created Singleton object is now held in a private static field inside the class — accessible only through getInstance().', highlight: ['gi', 's'] },
      { title: 'Second call: returns existing instance', description: 'Caller B asks for an instance. The check now finds the existing one and returns it without creating anything new.', highlight: ['c2', 'gi', 's'] },
      { title: 'All callers share the same object', description: 'Every caller — A, B, C — receives the same object reference. Mutating state through one handle is visible to every other caller.', highlight: ['c1', 'c2', 'c3', 's'] },
    ],

    codeExample: {
      language: 'javascript',
      description: 'A classic Singleton implemented with a private static field. Run the snippet to verify both handles point to the same object.',
      starter: `class Logger {
  static #instance = null;

  constructor() {
    if (Logger.#instance) {
      throw new Error('Use Logger.getInstance() instead of new');
    }
  }

  static getInstance() {
    if (!Logger.#instance) {
      Logger.#instance = Object.create(Logger.prototype);
      Logger.#instance.logs = [];
    }
    return Logger.#instance;
  }

  log(message) {
    this.logs.push(message);
    console.log('[' + this.logs.length + '] ' + message);
  }

  count() {
    return this.logs.length;
  }
}

const a = Logger.getInstance();
const b = Logger.getInstance();

a.log('user signed in');
b.log('payment succeeded');

console.log('a === b ?', a === b);
console.log('a.count():', a.count(), '  b.count():', b.count());
`,
    },

    industryUseCases: [
      { company: 'Database Connection Pools', description: 'JDBC connection pools (HikariCP, c3p0) are typically singletons — creating a second pool would double resource consumption and race for the same physical connections.' },
      { company: 'Logging Frameworks', description: 'Log4j, SLF4J, Winston, and Python\'s logging module use singleton root loggers so all log output funnels into one consistent destination.' },
      { company: 'Application Configuration', description: 'Spring\'s ApplicationContext and Django\'s settings module behave as singletons — the entire app reads from one source of truth, avoiding configuration drift.' },
      { company: 'OS-Level Resources', description: 'Print spoolers, file system handles, and hardware drivers commonly expose singleton interfaces because the underlying physical resource is itself a single shared entity.' },
    ],

    interviewQuestion: {
      question: 'How do you make a Singleton thread-safe in a multi-threaded environment, and what are the trade-offs of each approach?',
      answer: 'Three classic approaches: (1) Eager initialisation — create the instance at class load. Simplest but you pay the cost even if the instance is never used. (2) Synchronised getInstance() — lock on every access. Safe but slow because every call acquires the lock. (3) Double-checked locking with a volatile field — only synchronise when the instance is null. Fast on subsequent calls; the volatile keyword prevents reordered writes from leaking a half-constructed object. In modern Java, the cleanest approach is the "Initialization-on-Demand Holder" idiom — uses a private static inner class so the JVM guarantees lazy, thread-safe initialisation without explicit locking.',
    },

    commonMistakes: [
      'Returning a new instance from getInstance() under race conditions because the null-check and assignment are not atomic.',
      'Making the singleton stateful and globally mutable — this turns it into a hidden global variable and makes unit testing painful.',
      'Forgetting that singletons are usually unique per ClassLoader / per process — in a clustered or serverless environment you may have N "singletons" running, one per node.',
      'Using a singleton when dependency injection would do the same job more cleanly. DI gives you the same single-instance semantics without coupling consumers to a getInstance() call.',
      'Allowing serialization to bypass the singleton guarantee. Override readResolve() (Java) or implement __reduce__ correctly (Python) to return the existing instance.',
    ],
  },

  // ─── Factory Method ───────────────────────────────────────────────────────────
  {
    id: 'factory-method',
    name: 'Factory Method',
    category: 'Creational',
    icon: '🏭',
    difficulty: 'beginner',
    tagline: 'Defer instantiation to subclasses',

    definition:
      'Defines an interface for creating an object, but lets subclasses decide which class to instantiate. Factory Method lets a class defer instantiation to subclasses.',

    problem:
      'Code that calls `new ConcreteClass()` directly couples the caller to that specific implementation. When you need to support multiple variants — different document formats, shipping providers, UI themes — the if/else for instantiation grows everywhere and becomes painful to extend without modifying existing code.',

    whyNeeded:
      'Factory Method centralises object creation in one method that subclasses override. The rest of the codebase calls a single create() without caring which concrete class comes back. Adding a new variant means writing a new factory subclass — not editing every caller. Open for extension, closed for modification.',

    realLifeAnalogy:
      'A logistics company has a deliver() flow that always works the same way, but the vehicle differs by region. RoadLogistics returns a Truck; SeaLogistics returns a Ship. The flow class doesn\'t care — it just calls createTransport().',

    visualization: {
      caption: 'A creator subclass picks the concrete product.',
      entities: [
        { id: 'client', label: 'Client', x: 10, y: 50, icon: '👤', color: '#6b7280' },
        { id: 'creator', label: 'Creator', x: 38, y: 50, icon: '🏭', color: '#2563eb' },
        { id: 'cca', label: 'CreatorA', x: 65, y: 25, icon: '🏭', color: '#7c3aed' },
        { id: 'ccb', label: 'CreatorB', x: 65, y: 75, icon: '🏭', color: '#7c3aed' },
        { id: 'pa', label: 'ProductA', x: 90, y: 25, icon: '📦', color: '#059669' },
        { id: 'pb', label: 'ProductB', x: 90, y: 75, icon: '📦', color: '#059669' },
      ],
      relations: [
        { from: 'client', to: 'creator', label: 'create()' },
        { from: 'creator', to: 'cca' },
        { from: 'creator', to: 'ccb' },
        { from: 'cca', to: 'pa', label: 'returns' },
        { from: 'ccb', to: 'pb', label: 'returns' },
      ],
    },

    animationSteps: [
      { title: 'Client wants a Product', description: 'The client only knows it needs a Product (the abstract interface). It doesn\'t know — and shouldn\'t care — which concrete class will be returned.', highlight: ['client', 'creator'] },
      { title: 'Creator delegates to a subclass', description: 'The Creator\'s factoryMethod() is overridden by ConcreteCreatorA, which returns a ProductA. Selection happens in one place — the subclass.', highlight: ['creator', 'cca'] },
      { title: 'ConcreteCreator returns a concrete Product', description: 'CreatorA returns a fresh ProductA instance. The client receives it through the abstract Product reference.', highlight: ['cca', 'pa'] },
      { title: 'Swap the creator → swap the product family', description: 'Instantiate CreatorB instead and the same client code now gets ProductB. Adding ProductC requires only a new CreatorC subclass.', highlight: ['ccb', 'pb'] },
    ],

    codeExample: {
      language: 'javascript',
      description: 'A document factory that produces different document types depending on the concrete factory.',
      starter: `// Abstract Product
class Document {
  open() { throw new Error('not implemented'); }
}

class PDFDocument extends Document {
  open() { console.log('📄 PDF opened in viewer'); }
}

class WordDocument extends Document {
  open() { console.log('📝 Word opened in editor'); }
}

// Abstract Creator with factoryMethod()
class Application {
  createDocument() { throw new Error('subclass must override'); }
  newDocument() {
    const doc = this.createDocument();
    console.log('Application: created a', doc.constructor.name);
    doc.open();
    return doc;
  }
}

class PDFApp extends Application {
  createDocument() { return new PDFDocument(); }
}

class WordApp extends Application {
  createDocument() { return new WordDocument(); }
}

// Same client code — different concrete creators
[new PDFApp(), new WordApp()].forEach(app => app.newDocument());
`,
    },

    industryUseCases: [
      { company: 'Java Calendar API', description: 'Calendar.getInstance() returns a localized calendar — Gregorian for most users, Buddhist or Japanese imperial for specific locales. Same client API, different concrete subclass.' },
      { company: 'JDBC DriverManager', description: 'DriverManager.getConnection(url) selects the right Driver implementation based on the URL prefix and returns a Connection — the caller never references MySQLConnection or PostgresConnection by name.' },
      { company: 'React.createElement', description: 'Each call returns a Component (functional or class) — the React reconciler then dispatches based on the concrete type. Custom components plug in without touching React internals.' },
      { company: 'Spring BeanFactory', description: 'Spring\'s BeanFactory.getBean(name) returns a fully-configured bean. Concrete creation logic lives in @Bean methods or scanned classes — callers see only the abstract type.' },
    ],

    interviewQuestion: {
      question: 'How is Factory Method different from Abstract Factory? When would you reach for one over the other?',
      answer: 'Factory Method produces ONE product type — variation comes from subclassing the creator. Abstract Factory produces a FAMILY of related products through one interface that has multiple factory methods. If your code needs a single interchangeable object (a parser, a connection, a button), use Factory Method. If you need a coordinated set (button + checkbox + menu in matching theme), use Abstract Factory. Abstract Factory is essentially Factory Method ×N where N products must stay compatible. Many real codebases blur the line — start with Factory Method, escalate to Abstract Factory only when invariants between products demand it.',
    },

    commonMistakes: [
      'Adding a Factory Method when you have only one product type — overkill that adds indirection without benefit.',
      'Making the factory method static — defeats the whole point, since you can no longer override it in subclasses.',
      'Returning concrete types from the factory method instead of the abstract product type, which leaks implementation details to clients.',
      'Mixing creation logic with business logic in the same method (the creator should orchestrate; the product does the work).',
      'Using `new ConcreteClass()` in client code instead of going through the factory — silently bypasses the abstraction.',
    ],
  },

  // ─── Abstract Factory ─────────────────────────────────────────────────────────
  {
    id: 'abstract-factory',
    name: 'Abstract Factory',
    category: 'Creational',
    icon: '🏗️',
    difficulty: 'intermediate',
    tagline: 'Create families of related objects',

    definition:
      'Provides an interface for creating families of related or dependent objects without specifying their concrete classes.',

    problem:
      'Your app creates groups of related objects that must be compatible — a Mac button paired with a Mac checkbox, a dark-theme card paired with a dark-theme input. Letting clients instantiate each piece independently means they can mix incompatible variants. You need a way to enforce family coherence at construction time.',

    whyNeeded:
      'Abstract Factory groups related factory methods into one factory class per family. The client picks one factory and uses it for everything; all objects produced are guaranteed to belong to the same family. Switching themes/platforms means swapping the entire factory — not refactoring callers.',

    realLifeAnalogy:
      'IKEA furniture collections. The Malm collection has a matching bed, dresser, and nightstand. You don\'t mix Malm with Hemnes — you commit to one factory (collection) and it produces a coherent set.',

    visualization: {
      caption: 'One factory per family — guaranteed compatible products.',
      entities: [
        { id: 'client', label: 'Client', x: 12, y: 50, icon: '👤', color: '#6b7280' },
        { id: 'af', label: 'AbstractFactory', x: 38, y: 50, icon: '🏗️', color: '#2563eb' },
        { id: 'fa', label: 'MacFactory', x: 65, y: 25, icon: '🍎', color: '#7c3aed' },
        { id: 'fb', label: 'WinFactory', x: 65, y: 75, icon: '🪟', color: '#7c3aed' },
        { id: 'pa', label: 'Mac UI', x: 90, y: 25, icon: '🎨', color: '#059669' },
        { id: 'pb', label: 'Win UI', x: 90, y: 75, icon: '🎨', color: '#059669' },
      ],
      relations: [
        { from: 'client', to: 'af' },
        { from: 'af', to: 'fa' },
        { from: 'af', to: 'fb' },
        { from: 'fa', to: 'pa', label: 'matching set' },
        { from: 'fb', to: 'pb', label: 'matching set' },
      ],
    },

    animationSteps: [
      { title: 'Client picks a factory at runtime', description: 'Based on OS detection, theme preference, or feature flag, the client gets MacFactory or WindowsFactory — not the products directly.', highlight: ['client', 'af'] },
      { title: 'Factory creates Button #1 of the family', description: 'factory.createButton() returns a MacButton. The client uses it via the abstract Button interface — completely unaware of the concrete class.', highlight: ['fa', 'pa'] },
      { title: 'Same factory creates Checkbox of the SAME family', description: 'factory.createCheckbox() returns a MacCheckbox — guaranteed to look and behave consistently with the MacButton.', highlight: ['fa', 'pa'] },
      { title: 'Switching factories swaps the whole family', description: 'Instantiate WindowsFactory instead — every UI piece is now Windows-styled. Existing client code is untouched.', highlight: ['fb', 'pb'] },
    ],

    codeExample: {
      language: 'javascript',
      description: 'A GUI factory that produces matching button + checkbox families.',
      starter: `// Abstract products
class Button { render() { throw new Error('abstract'); } }
class Checkbox { render() { throw new Error('abstract'); } }

// Mac family
class MacButton extends Button { render() { return '🍎 [Mac Button]'; } }
class MacCheckbox extends Checkbox { render() { return '🍎 [Mac ☑ Checkbox]'; } }

// Windows family
class WinButton extends Button { render() { return '🪟 [Win Button]'; } }
class WinCheckbox extends Checkbox { render() { return '🪟 [Win ☑ Checkbox]'; } }

// Abstract factory
class GUIFactory {
  createButton()   { throw new Error('abstract'); }
  createCheckbox() { throw new Error('abstract'); }
}

class MacFactory extends GUIFactory {
  createButton()   { return new MacButton(); }
  createCheckbox() { return new MacCheckbox(); }
}

class WinFactory extends GUIFactory {
  createButton()   { return new WinButton(); }
  createCheckbox() { return new WinCheckbox(); }
}

// Client uses the factory polymorphically
function renderUI(factory) {
  const btn = factory.createButton();
  const cb  = factory.createCheckbox();
  console.log(btn.render(), cb.render());
}

const isMac = navigator?.platform?.includes('Mac') ?? true;
renderUI(isMac ? new MacFactory() : new WinFactory());
renderUI(new WinFactory());  // try the other family
`,
    },

    industryUseCases: [
      { company: 'javax.xml.parsers', description: 'DocumentBuilderFactory produces a DocumentBuilder; the same factory ensures parsers, transformers, and validators are from the same XML implementation (Xerces, Saxon, etc.).' },
      { company: 'JDBC Connection / Statement / ResultSet', description: 'A Connection acts as an abstract factory: it produces Statements that produce ResultSets, all guaranteed compatible with the underlying database driver.' },
      { company: 'AWT Toolkit', description: 'Toolkit.getDefaultToolkit() returns a platform-specific factory that creates Frames, Buttons, and Menus rendered by native peers — the family stays consistent.' },
      { company: 'Material UI Theme Provider', description: 'A ThemeProvider in MUI / Chakra / Ant Design configures the entire component tree to produce matching variants (light/dark, density, brand colours) without per-component overrides.' },
    ],

    interviewQuestion: {
      question: 'How would you use Abstract Factory to support a "dark mode" toggle across an entire UI library?',
      answer: 'Define an abstract ThemeFactory with createButton, createInput, createCard, createDialog, etc. Implement LightThemeFactory and DarkThemeFactory — each returns components styled for that theme. The app stores the active factory in context (React Context, dependency-injection container). Components call factory.createX() instead of `new X()` directly. Toggling dark mode swaps the context\'s factory; every newly-rendered component picks up the new theme automatically. The benefit: theme cohesion is guaranteed — you can\'t accidentally render a light button next to a dark card. Adding a third theme is one new factory class.',
    },

    commonMistakes: [
      'Reaching for Abstract Factory when Factory Method (single product) would do the job — over-engineered.',
      'Hard-coding which concrete factory to use (`new MacFactory()` in client code) defeats the abstraction.',
      'Putting unrelated products into one factory — cohesion drops, the family becomes incoherent.',
      'Not anticipating the cost: adding a new product type requires updating EVERY existing factory subclass.',
      'Confusing Abstract Factory (groups of products) with Factory Method (single product) — they\'re different scales of the same idea.',
    ],
  },

  // ─── Builder ──────────────────────────────────────────────────────────────────
  {
    id: 'builder',
    name: 'Builder',
    category: 'Creational',
    icon: '🧱',
    difficulty: 'beginner',
    tagline: 'Construct complex objects step by step',

    definition:
      'Separates the construction of a complex object from its representation, allowing the same construction process to create different representations.',

    problem:
      'When constructing an object requires many parameters — required, optional, mutually exclusive, with validation — constructors become unwieldy. A constructor with 12 parameters where 8 are optional leads to "telescoping constructors" or constructors with many `null` placeholders. Readers can\'t tell which arg is which.',

    whyNeeded:
      'Builder provides a fluent step-by-step API for constructing the object. Each step is named and self-documenting. Required vs optional fields are explicit. Validation happens in build(). The same builder can produce different representations by varying the build process.',

    realLifeAnalogy:
      'Subway sandwich. You don\'t shout sandwich(true, false, true, true, false, false) at the artist. You walk through stations: bread → meat → cheese → veggies → sauces. Each step is explicit, optional, and the order is enforced.',

    visualization: {
      caption: 'Director walks the Builder through steps; final product emerges.',
      entities: [
        { id: 'client', label: 'Client', x: 12, y: 50, icon: '👤', color: '#6b7280' },
        { id: 'dir', label: 'Director', x: 35, y: 50, icon: '🧑‍🍳', color: '#2563eb' },
        { id: 'builder', label: 'Builder', x: 60, y: 50, icon: '🧱', color: '#7c3aed' },
        { id: 'p1', label: 'Part 1', x: 85, y: 20, icon: '🥖', color: '#059669' },
        { id: 'p2', label: 'Part 2', x: 85, y: 50, icon: '🥬', color: '#059669' },
        { id: 'p3', label: 'Part 3', x: 85, y: 80, icon: '🧀', color: '#059669' },
      ],
      relations: [
        { from: 'client', to: 'dir' },
        { from: 'dir', to: 'builder', label: 'orchestrates' },
        { from: 'builder', to: 'p1', label: 'addPart1()' },
        { from: 'builder', to: 'p2', label: 'addPart2()' },
        { from: 'builder', to: 'p3', label: 'addPart3()' },
      ],
    },

    animationSteps: [
      { title: 'Create a fresh Builder', description: 'The client (or a director) instantiates a builder. The builder holds the in-progress object internally; the client can\'t inspect it.', highlight: ['client', 'builder'] },
      { title: 'Call fluent steps in order', description: 'builder.setBread(\'wheat\').addMeat(\'turkey\').addCheese(\'swiss\'). Each method returns the builder, enabling a readable chain. Order can be enforced or free.', highlight: ['builder', 'p1', 'p2'] },
      { title: 'Validation + build', description: 'builder.build() checks required fields, applies defaults, validates invariants, and returns the immutable Product. The builder can be discarded or reused.', highlight: ['builder', 'p1', 'p2', 'p3'] },
      { title: 'Reuse for variants', description: 'Re-run the chain with one different step — get a new product instance. The construction process is replayable; the result varies.', highlight: ['p1', 'p2', 'p3'] },
    ],

    codeExample: {
      language: 'javascript',
      description: 'A fluent builder for HTTP requests. Notice how optional fields stay optional and the final shape is immutable.',
      starter: `class HttpRequest {
  constructor(opts) {
    Object.assign(this, opts);
    Object.freeze(this);
  }
}

class HttpRequestBuilder {
  constructor(url) {
    this.opts = { url, method: 'GET', headers: {}, body: null, timeoutMs: 30000 };
  }
  method(m)             { this.opts.method = m; return this; }
  header(name, value)   { this.opts.headers[name] = value; return this; }
  body(data)            { this.opts.body = data; return this; }
  timeout(ms)           { this.opts.timeoutMs = ms; return this; }
  build() {
    if (!this.opts.url) throw new Error('url is required');
    if (this.opts.body && this.opts.method === 'GET') {
      throw new Error('GET requests cannot have a body');
    }
    return new HttpRequest(this.opts);
  }
}

// Usage — readable, optional fields are explicit, validation in build()
const req = new HttpRequestBuilder('https://api.example.com/users')
  .method('POST')
  .header('Content-Type', 'application/json')
  .header('Authorization', 'Bearer xyz')
  .body(JSON.stringify({ name: 'Ada' }))
  .timeout(5000)
  .build();

console.log(req);
console.log('frozen?', Object.isFrozen(req));
`,
    },

    industryUseCases: [
      { company: 'Java StringBuilder', description: 'append() returns this, allowing chains: sb.append("a").append("b").toString(). Each step is cheap; toString() materializes the final string.' },
      { company: 'Lombok @Builder', description: 'Java\'s Lombok auto-generates a builder for any class — a single annotation replaces dozens of lines of boilerplate fluent setters.' },
      { company: 'SQL query builders', description: 'jOOQ, Knex.js, SQLAlchemy: select(\'*\').from(\'users\').where(...).orderBy(...).build() — each step adds to an internal AST that compiles to SQL.' },
      { company: 'Spring SpringApplicationBuilder', description: 'Used to configure complex Spring contexts step by step: parent contexts, profiles, beans, listeners — far cleaner than a 20-arg constructor.' },
    ],

    interviewQuestion: {
      question: 'Builder vs Factory — when would you choose Builder, and what\'s the role of an optional Director?',
      answer: 'Factory answers "which class do I instantiate?" — variant selection. Builder answers "how do I assemble this single object step by step?" — parameter management. Reach for Builder when you have many parameters, especially optional ones, or need validation logic across the set. The Director (optional) encapsulates a known build sequence: e.g., StandardPizzaDirector that always calls thinCrust() then tomatoSauce() then mozzarella(). Useful when the same recipe appears in multiple places — but for one-off constructions, the client itself acts as the director and you can omit the Director class entirely.',
    },

    commonMistakes: [
      'Using Builder for objects with 2-3 simple parameters — adds ceremony without benefit.',
      'Returning `void` from builder methods instead of `this` — breaks the fluent chain.',
      'Allowing build() to mutate the builder so subsequent builds reuse stale state — call build() and you should get a fresh, independent product.',
      'Not validating required fields in build() — leaves you with half-formed objects that crash later, far from the source.',
      'Mixing Builder with Factory in the same class — split the concerns; Builder configures one object, Factory chooses the type.',
    ],
  },

  // ─── Prototype ────────────────────────────────────────────────────────────────
  {
    id: 'prototype',
    name: 'Prototype',
    category: 'Creational',
    icon: '🧬',
    difficulty: 'intermediate',
    tagline: 'Clone existing objects instead of building from scratch',

    definition:
      'Specifies the kinds of objects to create using a prototypical instance, and creates new objects by copying this prototype.',

    problem:
      'Sometimes creating an object from scratch is expensive: it requires a database read, a network call, or complex computation. When you need many similar objects, recomputing each from scratch wastes resources. Other times, the easiest way to express "create an object just like that one" is to clone a model.',

    whyNeeded:
      'Prototype lets you cheaply spawn new objects by copying an existing instance. The class itself owns the clone() method, so callers don\'t need to know its concrete type — clone() is polymorphic. Useful for game enemies, document templates, and configuration variants.',

    realLifeAnalogy:
      'Photocopying a document instead of typing it from scratch. The original is the prototype; each copy can be modified independently without affecting the original or other copies.',

    visualization: {
      caption: 'Clone existing objects to bypass expensive construction.',
      entities: [
        { id: 'client', label: 'Client', x: 15, y: 50, icon: '👤', color: '#6b7280' },
        { id: 'proto', label: 'Prototype', x: 50, y: 50, icon: '🧬', color: '#2563eb' },
        { id: 'c1', label: 'Clone 1', x: 85, y: 25, icon: '🐉', color: '#7c3aed' },
        { id: 'c2', label: 'Clone 2', x: 85, y: 50, icon: '🐉', color: '#7c3aed' },
        { id: 'c3', label: 'Clone 3', x: 85, y: 75, icon: '🐉', color: '#7c3aed' },
      ],
      relations: [
        { from: 'client', to: 'proto', label: 'clone()' },
        { from: 'proto', to: 'c1' },
        { from: 'proto', to: 'c2' },
        { from: 'proto', to: 'c3' },
      ],
    },

    animationSteps: [
      { title: 'Build the prototype once (expensive)', description: 'Create the initial object — perhaps loading from disk, querying a DB, or running a calculation. This setup happens exactly once.', highlight: ['proto'] },
      { title: 'Clone for each new instance (cheap)', description: 'When the client needs another similar object, it calls prototype.clone() — a fast in-memory copy that skips reconstruction.', highlight: ['client', 'proto', 'c1'] },
      { title: 'Mutate clones independently', description: 'Each clone is a distinct object — modify position, name, level. Mutations don\'t leak back to the prototype or other clones (when implemented correctly).', highlight: ['c1', 'c2'] },
      { title: 'Spawn many — performance scales', description: 'Render thousands of trees, particles, or enemies by cloning a handful of prototypes — orders of magnitude cheaper than constructing each.', highlight: ['c1', 'c2', 'c3'] },
    ],

    codeExample: {
      language: 'javascript',
      description: 'Cloning game enemies. The prototype has expensive base data; each clone tweaks position and health.',
      starter: `class GameEnemy {
  constructor({ type, baseHp, sprite, ai }) {
    this.type = type;
    this.baseHp = baseHp;
    this.sprite = sprite;       // imagine: heavy texture
    this.ai = ai;               // imagine: complex behaviour tree
    this.hp = baseHp;
    this.position = { x: 0, y: 0 };
  }
  clone() {
    // Deep copy mutable state; share immutable assets.
    const copy = Object.create(GameEnemy.prototype);
    copy.type = this.type;
    copy.baseHp = this.baseHp;
    copy.sprite = this.sprite;          // shared (read-only asset)
    copy.ai = this.ai;                  // shared
    copy.hp = this.hp;
    copy.position = { ...this.position }; // unique per clone
    return copy;
  }
}

// Set up prototype once
const goblin = new GameEnemy({
  type: 'goblin', baseHp: 50, sprite: '<<heavy>>', ai: '<<complex>>'
});

// Spawn 5 — each is independent
const horde = Array.from({ length: 5 }, (_, i) => {
  const e = goblin.clone();
  e.position = { x: i * 30, y: 0 };
  return e;
});

horde[0].hp = 5;  // wound this one
console.log(horde.map(g => g.type + '@' + g.position.x + ' hp=' + g.hp));
console.log('original prototype hp:', goblin.hp);
`,
    },

    industryUseCases: [
      { company: 'JavaScript Object.create / structuredClone', description: 'JavaScript\'s prototypal inheritance IS the prototype pattern. Object.create(proto) is direct prototype cloning; structuredClone deep-copies arbitrary structures.' },
      { company: 'Java Object.clone()', description: 'Implementing Cloneable enables the JVM\'s native bitwise clone — used heavily in collections, GUI components, and game frameworks like LibGDX.' },
      { company: 'Game development', description: 'Engines like Unity and Unreal use prefab cloning extensively — a single prefab is the prototype; thousands of instances are cheap clones with per-instance position and state.' },
      { company: 'Document templates', description: 'Word processors, IDEs, and design tools clone a template document instead of regenerating one — preserving styles, headers, and complex layouts.' },
    ],

    interviewQuestion: {
      question: 'What\'s the difference between shallow and deep cloning, and what are the failure modes of each?',
      answer: 'Shallow clone copies field values — primitives are duplicated, but references point to the SAME nested objects. Mutating the clone\'s nested object also mutates the original\'s. Fast and memory-efficient but dangerous for mutable state. Deep clone recursively copies everything — clone is fully independent. Slower and more memory; can\'t handle circular references without tracking visited objects; loses non-data fields like functions, Symbol keys, prototype chains. Common pitfalls: JSON.parse(JSON.stringify(x)) loses Date, Map, Set, RegExp, undefined, functions. Modern answer: structuredClone() handles most cases natively. For mixed needs, expose explicit clone() that the class controls — share immutable parts, deep-copy mutable parts.',
    },

    commonMistakes: [
      'Shallow cloning when nested mutable state is shared between original and copy — leads to spooky action at a distance.',
      'Using JSON.parse(JSON.stringify(x)) for cloning — loses Date objects, regexes, Maps, Sets, undefined fields, and functions.',
      'Cloning circular references without tracking — infinite recursion crashes the runtime.',
      'Forgetting to clone the prototype chain — clone has no methods because its __proto__ wasn\'t copied.',
      'Reaching for Prototype when a Builder or Factory would be more explicit and easier to reason about.',
    ],
  },
];
