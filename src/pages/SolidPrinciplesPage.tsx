import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${color}`}>
      {label}
    </span>
  );
}

function CodeBlock({ code, language = 'typescript' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  return (
    <div className="relative group rounded-xl border border-gray-800 bg-gray-950 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900/60">
        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">{language}</span>
        <button
          onClick={copy}
          className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors font-medium"
        >
          {copied ? '✓ copied' : 'copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-gray-300 font-mono whitespace-pre">
        {code}
      </pre>
    </div>
  );
}

function InterviewCard({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
      <button
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-800/40 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="text-sm text-gray-200 font-medium leading-snug">{question}</span>
        <span className="text-gray-500 text-lg flex-shrink-0">{open ? '−' : '+'}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 text-sm text-gray-400 leading-relaxed border-t border-gray-800">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MistakeCard({ bad, good, why }: { bad: string; good: string; why: string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <span className="text-red-400 text-sm mt-0.5">✗</span>
        <p className="text-sm text-red-300 leading-snug font-medium">{bad}</p>
      </div>
      <div className="flex items-start gap-2">
        <span className="text-emerald-400 text-sm mt-0.5">✓</span>
        <p className="text-sm text-emerald-300 leading-snug font-medium">{good}</p>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed pl-4 border-l border-gray-700">{why}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section shell
// ─────────────────────────────────────────────────────────────────────────────

function PrincipleShell({
  letter,
  title,
  subtitle,
  tagline,
  accent,
  children,
}: {
  letter: string;
  title: string;
  subtitle: string;
  tagline: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-gray-800 bg-gray-950/70 overflow-hidden"
    >
      {/* Header */}
      <div className={`px-6 py-5 border-b border-gray-800 bg-gradient-to-r ${accent}/10`}>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl font-black text-white border ${accent} bg-gray-900 flex-shrink-0`}>
            {letter}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-xl font-bold text-white">{title}</h2>
            </div>
            <p className="text-brand-400 text-sm font-medium">{subtitle}</p>
            <p className="text-gray-400 text-xs mt-1 leading-snug max-w-2xl">{tagline}</p>
          </div>
        </div>
      </div>
      {/* Body */}
      <div className="p-5 sm:p-6 space-y-6">{children}</div>
    </motion.section>
  );
}

function ThreeColLayout({ left, center, right }: { left: React.ReactNode; center?: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className={`grid gap-4 ${center ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
      <div>{left}</div>
      {center && <div>{center}</div>}
      <div>{right}</div>
    </div>
  );
}

function Pill({ label, tone }: { label: string; tone: 'green' | 'red' | 'blue' | 'yellow' | 'purple' }) {
  const t = {
    green: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    red: 'border-red-500/30 bg-red-500/10 text-red-300',
    blue: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    yellow: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
    purple: 'border-violet-500/30 bg-violet-500/10 text-violet-300',
  }[tone];
  return <span className={`inline-block rounded-lg border px-2.5 py-1 text-xs font-semibold ${t}`}>{label}</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// S — Single Responsibility
// ─────────────────────────────────────────────────────────────────────────────

const srpBad = `// ❌ BAD — OrderService does 5 different jobs
class OrderService {
  createOrder(data: OrderData) {
    // validate input
    if (!data.userId || !data.items.length) throw new Error('Invalid');

    // save to database
    const order = db.orders.insert({ ...data, status: 'pending' });

    // send confirmation email
    emailClient.send({
      to: data.userEmail,
      subject: 'Order Confirmed',
      body: \`Your order #\${order.id} is confirmed.\`,
    });

    // publish event to Kafka
    kafka.produce('order.created', { orderId: order.id });

    // calculate and store analytics
    analytics.track('order_created', { value: data.total });

    return order;
  }
}
// One change to emailing breaks the whole OrderService.
// Unit testing requires mocking DB + email + Kafka + analytics.`;

const srpGood = `// ✅ GOOD — Each class has one reason to change
class OrderValidator {
  validate(data: OrderData): void {
    if (!data.userId || !data.items.length)
      throw new ValidationError('Invalid order data');
  }
}

class OrderRepository {
  save(data: OrderData): Order {
    return db.orders.insert({ ...data, status: 'pending' });
  }
}

class OrderNotifier {
  notifyCreated(order: Order, email: string): void {
    emailClient.send({ to: email, subject: 'Order Confirmed', ... });
  }
}

class OrderEventPublisher {
  publish(order: Order): void {
    kafka.produce('order.created', { orderId: order.id });
  }
}

// Orchestrator (thin — just coordinates)
class OrderService {
  constructor(
    private validator: OrderValidator,
    private repo: OrderRepository,
    private notifier: OrderNotifier,
    private publisher: OrderEventPublisher,
  ) {}

  createOrder(data: OrderData, userEmail: string): Order {
    this.validator.validate(data);
    const order = this.repo.save(data);
    this.notifier.notifyCreated(order, userEmail);
    this.publisher.publish(order);
    return order;
  }
}
// Each class tested in isolation. EmailService change → ONLY OrderNotifier changes.`;

function SRPDemo() {
  const [view, setView] = useState<'bad' | 'good'>('bad');
  const services = [
    { name: 'OrderValidator', icon: '✅', desc: 'Validates input', tone: 'green' as const },
    { name: 'OrderRepository', icon: '🗄️', desc: 'Saves to DB', tone: 'blue' as const },
    { name: 'OrderNotifier', icon: '📧', desc: 'Sends emails', tone: 'yellow' as const },
    { name: 'OrderEventPublisher', icon: '📡', desc: 'Publishes events', tone: 'purple' as const },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['bad', 'good'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              view === v
                ? v === 'bad'
                  ? 'bg-red-500/20 border-red-500/40 text-red-300'
                  : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-gray-900 border-gray-700 text-gray-400 hover:text-gray-200'
            }`}
          >
            {v === 'bad' ? '✗ Violation' : '✓ Applied'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {view === 'bad' ? (
            <div>
              <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-center">
                  <p className="text-red-300 font-bold">OrderService</p>
                  <p className="text-red-400/70 text-xs mt-1">Validates · Saves · Emails · Kafka · Analytics</p>
                  <p className="text-red-400 text-xs mt-2 font-medium">⚠ 5 reasons to change</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center">Any change to email logic, analytics, or DB schema changes this one class. Testing requires mocking 4 external systems.</p>
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap gap-2 justify-center mb-3">
                {services.map((s) => (
                  <div key={s.name} className="rounded-xl border border-gray-700 bg-gray-900 px-4 py-2.5 text-center min-w-[130px]">
                    <div className="text-xl mb-1">{s.icon}</div>
                    <p className="text-white text-xs font-semibold">{s.name}</p>
                    <p className="text-gray-500 text-[10px] mt-0.5">{s.desc}</p>
                    <Pill label="1 reason to change" tone={s.tone} />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 text-center">Each class has one job. Change email template → only <code className="text-brand-400">OrderNotifier</code> changes. Test each in isolation with a single mock.</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// O — Open/Closed
// ─────────────────────────────────────────────────────────────────────────────

const ocpBad = `// ❌ BAD — Adding a new payment method means editing existing code
class PaymentProcessor {
  process(order: Order, method: string): void {
    if (method === 'credit_card') {
      stripeClient.charge(order.total, order.cardToken);
    } else if (method === 'upi') {
      razorpay.initiateUPI(order.total, order.upiId);
    } else if (method === 'wallet') {
      paytm.deductWallet(order.userId, order.total);
    }
    // Adding PayPal means modifying this class.
    // Every addition risks breaking existing payment paths.
    // This file becomes a "mega-switch" over time.
  }
}`;

const ocpGood = `// ✅ GOOD — Open for extension, closed for modification
interface PaymentStrategy {
  process(order: Order): Promise<PaymentResult>;
  supports(method: string): boolean;
}

class StripeStrategy implements PaymentStrategy {
  supports(method: string) { return method === 'credit_card'; }
  async process(order: Order) {
    return stripeClient.charge(order.total, order.cardToken);
  }
}

class UPIStrategy implements PaymentStrategy {
  supports(method: string) { return method === 'upi'; }
  async process(order: Order) {
    return razorpay.initiateUPI(order.total, order.upiId);
  }
}

// Adding PayPal: create new class, register it — existing code untouched
class PayPalStrategy implements PaymentStrategy {
  supports(method: string) { return method === 'paypal'; }
  async process(order: Order) {
    return paypalClient.execute(order.total, order.paypalToken);
  }
}

class PaymentProcessor {
  constructor(private strategies: PaymentStrategy[]) {}

  async process(order: Order, method: string): Promise<PaymentResult> {
    const strategy = this.strategies.find(s => s.supports(method));
    if (!strategy) throw new Error(\`Unsupported payment method: \${method}\`);
    return strategy.process(order);
  }
}`;

const ocpMethods = ['credit_card', 'upi', 'wallet', 'paypal', 'crypto'];

function OCPDemo() {
  const [enabled, setEnabled] = useState(['credit_card', 'upi']);
  const [selected, setSelected] = useState('credit_card');

  function toggle(m: string) {
    setEnabled((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  }

  const icons: Record<string, string> = {
    credit_card: '💳', upi: '📱', wallet: '👛', paypal: '🅿️', crypto: '₿',
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Registered payment strategies (plug in new ones without editing PaymentProcessor)</p>
        <div className="flex flex-wrap gap-2">
          {ocpMethods.map((m) => (
            <button
              key={m}
              onClick={() => toggle(m)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                enabled.includes(m)
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                  : 'border-gray-700 bg-gray-900 text-gray-500'
              }`}
            >
              {icons[m]} {m.replace('_', ' ')}
              {enabled.includes(m) ? ' ✓' : ' +'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Customer checkout — select payment method</p>
        <div className="flex flex-wrap gap-2">
          {enabled.map((m) => (
            <button
              key={m}
              onClick={() => setSelected(m)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                selected === m
                  ? 'border-brand-400/60 bg-brand-500/15 text-brand-300'
                  : 'border-gray-700 bg-gray-900 text-gray-400 hover:text-gray-200'
              }`}
            >
              {icons[m]} {m.replace('_', ' ')}
            </button>
          ))}
        </div>
        {selected && (
          <motion.div
            key={selected}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5"
          >
            <p className="text-sm text-emerald-300">
              {icons[selected]} Routing to <code className="font-mono text-emerald-200">{selected.replace('_', '')}Strategy.process(order)</code>
            </p>
            <p className="text-xs text-gray-500 mt-1">PaymentProcessor never changed — new strategy just registered.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// L — Liskov Substitution
// ─────────────────────────────────────────────────────────────────────────────

const lspBad = `// ❌ BAD — Square violates Rectangle's contract
class Rectangle {
  constructor(protected width: number, protected height: number) {}
  setWidth(w: number)  { this.width = w; }
  setHeight(h: number) { this.height = h; }
  area(): number { return this.width * this.height; }
}

class Square extends Rectangle {
  // Square MUST keep width === height — overrides parent contract
  setWidth(w: number)  { this.width = w;  this.height = w; }
  setHeight(h: number) { this.width = h;  this.height = h; }
}

// Client code — breaks with Square substituted for Rectangle
function resize(r: Rectangle): void {
  r.setWidth(5);
  r.setHeight(10);
  console.log(r.area()); // Expects 50. Gets 100 with Square!
}`;

const lspGood = `// ✅ GOOD — Separate abstractions, no broken substitution
interface Shape {
  area(): number;
}

class Rectangle implements Shape {
  constructor(private width: number, private height: number) {}
  area() { return this.width * this.height; }
}

class Square implements Shape {
  constructor(private side: number) {}
  area() { return this.side * this.side; }
}

// Real-world: NotificationService example
abstract class NotificationChannel {
  abstract send(message: string, recipient: string): Promise<void>;
  abstract supportsRichText(): boolean;
}

class EmailChannel extends NotificationChannel {
  async send(msg: string, to: string) { await sendEmail(to, msg); }
  supportsRichText() { return true; }
}

class SMSChannel extends NotificationChannel {
  async send(msg: string, to: string) { await sendSMS(to, msg.slice(0, 160)); }
  supportsRichText() { return false; }  // honest about limitations
}

class PushChannel extends NotificationChannel {
  async send(msg: string, to: string) { await pushNotification(to, msg); }
  supportsRichText() { return true; }
}

// Any NotificationChannel can be substituted without surprising the caller
async function notify(channel: NotificationChannel, msg: string, to: string) {
  const text = channel.supportsRichText() ? msg : stripHtml(msg);
  await channel.send(text, to);
}`;

const lspChannels = [
  { name: 'EmailChannel', icon: '📧', richText: true, maxLen: null, color: 'blue' },
  { name: 'SMSChannel', icon: '📱', richText: false, maxLen: 160, color: 'yellow' },
  { name: 'PushChannel', icon: '🔔', richText: true, maxLen: 100, color: 'purple' },
  { name: 'SlackChannel', icon: '💬', richText: true, maxLen: null, color: 'green' },
];

function LSPDemo() {
  const [active, setActive] = useState(0);
  const ch = lspChannels[active];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {lspChannels.map((c, i) => (
          <button
            key={c.name}
            onClick={() => setActive(i)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              active === i
                ? 'border-brand-400/60 bg-brand-500/15 text-brand-300'
                : 'border-gray-700 bg-gray-900 text-gray-400 hover:text-gray-200'
            }`}
          >
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.18 }}
          className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 space-y-3"
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">{ch.icon}</span>
            <div>
              <p className="text-white font-semibold text-sm">{ch.name}</p>
              <p className="text-gray-500 text-xs">extends <code className="text-brand-400">NotificationChannel</code></p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-gray-800 bg-gray-950 p-3">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">supportsRichText()</p>
              <p className={`text-sm font-bold ${ch.richText ? 'text-emerald-400' : 'text-red-400'}`}>
                {ch.richText ? 'true — HTML/markdown allowed' : 'false — plain text only'}
              </p>
            </div>
            <div className="rounded-lg border border-gray-800 bg-gray-950 p-3">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Max length</p>
              <p className="text-sm font-bold text-gray-200">{ch.maxLen ? `${ch.maxLen} chars` : 'No limit'}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            The <code className="text-brand-400">notify()</code> function works with any channel without knowing its type.
            Each channel is <strong className="text-gray-300">honest</strong> about its capabilities — no surprises, no exceptions thrown for legal operations.
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// I — Interface Segregation
// ─────────────────────────────────────────────────────────────────────────────

const ispBad = `// ❌ BAD — Fat interface forces unrelated implementations
interface Worker {
  work(): void;
  eat(): void;
  sleep(): void;
  attendMeeting(): void;
  submitTimesheet(): void;
}

// RobotWorker is forced to implement human-only methods
class RobotWorker implements Worker {
  work() { /* actual work */ }
  eat()  { throw new Error("Robots don't eat!"); }   // ← forced stub
  sleep(){ throw new Error("Robots don't sleep!"); }  // ← forced stub
  attendMeeting() { /* OK */ }
  submitTimesheet() { /* OK */ }
}

// Real-world equivalent — a fat StorageService interface
interface StorageService {
  upload(file: Buffer): Promise<string>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  generatePresignedUrl(key: string, expiry: number): Promise<string>;
  replicateToRegion(key: string, region: string): Promise<void>;
  runVirusScan(key: string): Promise<boolean>;
  generateThumbnail(key: string): Promise<string>;
}
// InMemoryStorageService (for tests) must implement ALL 7 methods.`;

const ispGood = `// ✅ GOOD — Segregated interfaces, implement only what you need
interface Uploadable {
  upload(file: Buffer): Promise<string>;
}

interface Downloadable {
  download(key: string): Promise<Buffer>;
}

interface Deletable {
  delete(key: string): Promise<void>;
}

interface PresignedUrlable {
  generatePresignedUrl(key: string, expiry: number): Promise<string>;
}

// S3StorageService — full-featured: implements all
class S3StorageService implements Uploadable, Downloadable, Deletable, PresignedUrlable {
  async upload(file: Buffer) { return s3.putObject(file); }
  async download(key: string) { return s3.getObject(key); }
  async delete(key: string) { await s3.deleteObject(key); }
  async generatePresignedUrl(key: string, expiry: number) {
    return s3.getSignedUrl({ Key: key, Expires: expiry });
  }
}

// InMemoryStorageService — for tests: only what tests need
class InMemoryStorageService implements Uploadable, Downloadable {
  private store = new Map<string, Buffer>();
  async upload(file: Buffer) {
    const key = crypto.randomUUID();
    this.store.set(key, file);
    return key;
  }
  async download(key: string) { return this.store.get(key)!; }
}

// ReadOnlyStorageService — public CDN access, no write/delete
class CDNStorageService implements Downloadable, PresignedUrlable {
  async download(key: string) { return cdnClient.fetch(key); }
  async generatePresignedUrl(key: string, expiry: number) { return cdn.sign(key, expiry); }
}`;

const ispServices = [
  {
    name: 'S3StorageService',
    icon: '☁️',
    implements: ['Uploadable', 'Downloadable', 'Deletable', 'PresignedUrlable'],
    use: 'Production file storage',
    color: 'blue',
  },
  {
    name: 'InMemoryStorageService',
    icon: '🧪',
    implements: ['Uploadable', 'Downloadable'],
    use: 'Unit tests — fast, no AWS needed',
    color: 'green',
  },
  {
    name: 'CDNStorageService',
    icon: '🌐',
    implements: ['Downloadable', 'PresignedUrlable'],
    use: 'Read-only public CDN access',
    color: 'yellow',
  },
];

const allInterfaces = ['Uploadable', 'Downloadable', 'Deletable', 'PresignedUrlable'];

function ISPDemo() {
  const [active, setActive] = useState(0);
  const svc = ispServices[active];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {ispServices.map((s, i) => (
          <button
            key={s.name}
            onClick={() => setActive(i)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              active === i
                ? 'border-brand-400/60 bg-brand-500/15 text-brand-300'
                : 'border-gray-700 bg-gray-900 text-gray-400'
            }`}
          >
            {s.icon} {s.name}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="space-y-3"
        >
          <p className="text-xs text-gray-400 leading-relaxed">
            <span className="text-white font-semibold">{svc.icon} {svc.name}</span> — {svc.use}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {allInterfaces.map((iface) => {
              const has = svc.implements.includes(iface);
              return (
                <div
                  key={iface}
                  className={`rounded-lg border p-2.5 text-center text-xs font-medium transition-colors ${
                    has
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      : 'border-gray-800 bg-gray-900/40 text-gray-600 line-through'
                  }`}
                >
                  {has ? '✓' : '—'} {iface}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            {svc.name} only implements the interfaces it actually uses.
            No <code className="text-red-400">throw new Error("Not implemented")</code> stubs.
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// D — Dependency Inversion
// ─────────────────────────────────────────────────────────────────────────────

const dipBad = `// ❌ BAD — High-level module directly depends on low-level module
class UserService {
  // Hard dependency on MySQL — cannot swap for Postgres or test without a DB
  private db = new MySQLConnection('mysql://prod-host:3306/users');
  private email = new SendGridClient(process.env.SENDGRID_KEY!);
  private logger = new WinstonLogger({ level: 'info' });

  async registerUser(email: string, password: string): Promise<User> {
    this.logger.info(\`Registering \${email}\`);
    const user = await this.db.query(
      'INSERT INTO users (email, hash) VALUES (?, ?)',
      [email, bcrypt.hashSync(password, 10)]
    );
    await this.email.send({ to: email, subject: 'Welcome!' });
    return user;
  }
}
// To test: you MUST have a running MySQL + SendGrid + a logger.
// To swap MySQL for PostgreSQL: edit UserService (violates OCP too).`;

const dipGood = `// ✅ GOOD — Depend on abstractions, not concretions
interface UserRepository {
  save(email: string, passwordHash: string): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
}

interface EmailService {
  sendWelcome(email: string): Promise<void>;
}

interface Logger {
  info(message: string): void;
  error(message: string, err?: unknown): void;
}

// High-level module — depends on abstractions only
class UserService {
  constructor(
    private repo: UserRepository,    // injected
    private email: EmailService,     // injected
    private logger: Logger,          // injected
  ) {}

  async registerUser(emailAddr: string, password: string): Promise<User> {
    this.logger.info(\`Registering \${emailAddr}\`);
    const hash = await bcrypt.hash(password, 10);
    const user = await this.repo.save(emailAddr, hash);
    await this.email.sendWelcome(emailAddr);
    return user;
  }
}

// Production wiring (IoC container / main.ts)
const userService = new UserService(
  new PostgreSQLUserRepository(pgPool),
  new SendGridEmailService(sgKey),
  new WinstonLogger(),
);

// Test wiring — no real DB, no real email
const testService = new UserService(
  new InMemoryUserRepository(),
  new MockEmailService(),
  new ConsoleLogger(),
);`;

const dipEnvs = [
  {
    label: 'Production',
    icon: '🏭',
    repo: 'PostgreSQLUserRepository',
    email: 'SendGridEmailService',
    logger: 'WinstonLogger',
  },
  {
    label: 'Staging',
    icon: '🧪',
    repo: 'PostgreSQLUserRepository',
    email: 'LogOnlyEmailService',
    logger: 'WinstonLogger',
  },
  {
    label: 'Unit Tests',
    icon: '⚡',
    repo: 'InMemoryUserRepository',
    email: 'MockEmailService',
    logger: 'ConsoleLogger',
  },
];

function DIPDemo() {
  const [env, setEnv] = useState(0);
  const e = dipEnvs[env];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {dipEnvs.map((d, i) => (
          <button
            key={d.label}
            onClick={() => setEnv(i)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              env === i
                ? 'border-brand-400/60 bg-brand-500/15 text-brand-300'
                : 'border-gray-700 bg-gray-900 text-gray-400'
            }`}
          >
            {d.icon} {d.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={env}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 space-y-3"
        >
          <p className="text-xs font-semibold text-gray-300 uppercase tracking-wide">{e.icon} {e.label} wiring</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'UserRepository', value: e.repo, color: 'blue' as const },
              { label: 'EmailService', value: e.email, color: 'yellow' as const },
              { label: 'Logger', value: e.logger, color: 'green' as const },
            ].map((d) => (
              <div key={d.label} className="rounded-lg border border-gray-800 bg-gray-950 p-2.5">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">{d.label}</p>
                <Pill label={d.value} tone={d.color} />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            <code className="text-brand-400">UserService</code> code is identical across all environments.
            Only the concrete implementations change — wired at startup.
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Enterprise Case Study — E-Commerce Platform
// ─────────────────────────────────────────────────────────────────────────────

const principles = [
  { letter: 'S', name: 'SRP', full: 'Single Responsibility', color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/30 text-pink-300' },
  { letter: 'O', name: 'OCP', full: 'Open/Closed', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30 text-orange-300' },
  { letter: 'L', name: 'LSP', full: 'Liskov Substitution', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300' },
  { letter: 'I', name: 'ISP', full: 'Interface Segregation', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' },
  { letter: 'D', name: 'DIP', full: 'Dependency Inversion', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30 text-blue-300' },
];

const caseStudySteps = [
  {
    principle: 'S',
    component: 'OrderService',
    scenario: 'Order placement — each concern isolated',
    detail: 'OrderValidator, OrderRepository, OrderNotifier, InventoryService are separate classes. When the team changes the email template, only OrderNotifier is touched — zero risk to order saving or inventory logic.',
    metrics: [
      { label: 'Avg PR size', value: '~80 lines' },
      { label: 'Classes impacted per change', value: '1–2' },
      { label: 'Unit test setup', value: '1 mock each' },
    ],
  },
  {
    principle: 'O',
    component: 'PaymentProcessor',
    scenario: 'New payment method added with zero existing code changes',
    detail: 'When business asked for BNPL (Buy Now Pay Later) integration, the engineer created BNPLStrategy implementing PaymentStrategy and registered it. Zero changes to PaymentProcessor, existing Stripe/UPI paths untouched, no regression risk.',
    metrics: [
      { label: 'Files changed to add BNPL', value: '1 new file' },
      { label: 'Regression risk', value: 'Zero' },
      { label: 'Existing tests broken', value: 'Zero' },
    ],
  },
  {
    principle: 'L',
    component: 'NotificationChannel',
    scenario: 'WhatsApp channel added as drop-in replacement',
    detail: 'WhatsAppChannel extends NotificationChannel with supportsRichText()=true and a 4096-char limit. All notification-sending code works transparently. No code checked "instanceof WhatsAppChannel" — it just called the abstract interface.',
    metrics: [
      { label: 'Callers that needed updating', value: '0' },
      { label: 'Unexpected exceptions', value: 'None' },
      { label: 'Channel-specific if/else blocks', value: '0' },
    ],
  },
  {
    principle: 'I',
    component: 'StorageService',
    scenario: 'Test environment uses lightweight in-memory storage',
    detail: 'CI pipeline runs 10× faster because InMemoryStorageService only implements Uploadable and Downloadable — no virus scan, no thumbnail generation, no S3 credentials required. The test never calls methods it does not need.',
    metrics: [
      { label: 'CI test time (before)', value: '4 min 20s' },
      { label: 'CI test time (after ISP)', value: '38s' },
      { label: 'Methods forced on test impl', value: '0' },
    ],
  },
  {
    principle: 'D',
    component: 'UserService',
    scenario: 'MySQL → PostgreSQL migration with zero UserService changes',
    detail: 'The team migrated the user database from MySQL to PostgreSQL. They wrote PostgreSQLUserRepository, updated the IoC wiring in main.ts, and deployed. UserService was not touched. The entire migration was one new file + one config change.',
    metrics: [
      { label: 'Files changed in UserService', value: '0' },
      { label: 'Migration time', value: '2 days' },
      { label: 'Tests rewritten', value: '0' },
    ],
  },
];

function CaseStudyTimeline() {
  const [step, setStep] = useState(0);
  const s = caseStudySteps[step];
  const p = principles.find((p) => p.letter === s.principle)!;

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-950/70 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800 bg-gray-900/60">
        <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">Enterprise scenario walkthrough — FlipMart E-Commerce Platform</p>
        <div className="flex flex-wrap gap-1.5">
          {caseStudySteps.map((cs, i) => {
            const pr = principles.find((p) => p.letter === cs.principle)!;
            return (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                  step === i
                    ? `${pr.bg}`
                    : 'border-gray-700 bg-gray-900 text-gray-500 hover:text-gray-300'
                }`}
              >
                <span className={pr.color}>{pr.letter}</span>
                <span className="hidden sm:inline">— {cs.component}</span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.22 }}
          className="p-5 space-y-4"
        >
          <div className="flex items-center gap-3">
            <span className={`text-3xl font-black ${p.color}`}>{p.letter}</span>
            <div>
              <p className="text-white font-bold text-base">{p.full} Principle</p>
              <p className="text-gray-400 text-xs">{s.component} · {s.scenario}</p>
            </div>
          </div>

          <p className="text-sm text-gray-300 leading-relaxed">{s.detail}</p>

          <div className="grid grid-cols-3 gap-2">
            {s.metrics.map((m) => (
              <div key={m.label} className="rounded-lg border border-gray-800 bg-gray-900 p-3">
                <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">{m.label}</p>
                <p className="text-sm font-bold text-white">{m.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Interview Q&A data
// ─────────────────────────────────────────────────────────────────────────────

const interviewQAs = [
  {
    question: 'Explain SOLID with a real system design example — not textbook shapes.',
    answer:
      'Use an e-commerce order service. S: OrderService only orchestrates — OrderValidator, OrderRepository, OrderNotifier are separate classes, each with one reason to change. O: PaymentProcessor accepts a PaymentStrategy list — adding PayPal means a new class, not editing existing code. L: Any NotificationChannel (Email, SMS, WhatsApp) can be substituted; each honestly reports supportsRichText() so the caller never gets surprised. I: S3StorageService implements all storage interfaces; InMemoryStorageService for tests only implements Uploadable and Downloadable — no forced stubs. D: UserService depends on UserRepository interface, not MySQLConnection — swap the DB by changing the IoC wiring in one place.',
  },
  {
    question: 'How do you enforce SOLID in a large team? What tooling do you use?',
    answer:
      'Three layers: (1) Architecture fitness functions — ArchUnit (Java) or custom eslint rules reject imports that cross layer boundaries (e.g., a Controller directly instantiating a Repository). (2) PR review checklist — SRP: does this class have more than one reason to change? DIP: does this class instantiate its dependencies or receive them? (3) Abstractions-first design — in Sprint 0, define interfaces before implementations. When two engineers implement different sides (UserRepository interface + PostgreSQLUserRepository impl), DIP is naturally enforced. Metrics to track: average number of classes changed per PR (SRP proxy), average mocks per unit test (DIP proxy).',
  },
  {
    question: 'What is the difference between ISP and SRP? They sound similar.',
    answer:
      'SRP is about classes — a class should have only one reason to change. It governs cohesion of responsibilities. ISP is about interfaces — a client should not be forced to depend on methods it does not use. It governs the granularity of contracts. A class can satisfy SRP perfectly while violating ISP if it implements a fat interface containing methods some clients never call. Concrete example: UserService has one job (SRP satisfied), but if it depends on a StorageService interface that forces it to know about virus scanning and thumbnails that it never uses — that violates ISP. Fix: split StorageService into Uploadable + Downloadable + VirusScannable — UserService only depends on Uploadable.',
  },
  {
    question: 'Does SOLID apply to microservices? Or is it just for classes?',
    answer:
      'SOLID maps directly to microservices: S → each service owns one bounded context (Orders service, Payments service, Notifications service). O → services expose stable APIs; adding a feature means extending the API with new endpoints, not changing existing ones. L → if ServiceB calls ServiceA\'s /calculate endpoint, any new implementation of ServiceA must return the same contract — same fields, same error codes. I → service APIs should expose only the capabilities a given client needs (consider API gateways or BFF — Backend for Frontend — patterns to tailor APIs per consumer). D → services depend on message contracts or API schemas (abstractions), not on each other\'s deployment details. The Event-Driven pattern is DIP at the service level: OrderService publishes to Kafka, NotificationService subscribes — neither knows about the other directly.',
  },
  {
    question: 'Give a scenario where following SOLID blindly is wrong.',
    answer:
      'SOLID principles are optimisations for changeability and testability, not absolute laws. Three real situations: (1) SRP over-extraction: splitting a 50-line class into 8 single-purpose classes for a simple CRUD service adds navigation complexity with no benefit. Rule of thumb: wait until a class actually has two distinct reasons to change before splitting. (2) OCP with premature abstractions: creating a PaymentStrategy interface when you only have Stripe and will never have another method adds a pointless indirection layer. Abstract only when you have two or more concrete cases. (3) DIP in scripts and CLIs: a one-off data migration script does not benefit from injected repositories. The cost of the abstraction exceeds the gain. SOLID is a toolbox for managing complexity — apply it where complexity exists.',
  },
  {
    question: 'Walk me through how you would refactor a "God class" in production.',
    answer:
      'A God class (one class doing everything) is an SRP violation at the extreme. Refactoring it safely: (1) Write characterisation tests first — capture current behaviour without understanding it, so you know when you break something. (2) Identify responsibility clusters — group methods by the data they operate on. Five groups of methods = five candidate classes. (3) Extract one class at a time — move one cluster, delegate from the original, all tests still pass. (4) Invert dependencies — once extracted, inject the new class via constructor (DIP). (5) Delete the delegation once all callers use the new class. (6) Repeat. At no point does the old class "know" about the new architecture — it degrades gracefully. This is the "Strangler Fig" pattern applied at the class level.',
  },
];

const commonMistakes = [
  {
    bad: 'Creating a class per method (over-applying SRP)',
    good: 'Split only when a class has two genuinely distinct reasons to change',
    why: 'SRP is about reasons to change, not line count. 200 cohesive lines in one class is better than 10 scattered micro-classes with circular dependencies.',
  },
  {
    bad: 'Abstracting before you have two implementations (OCP)',
    good: 'Write the concrete case first; extract the interface when the second case arrives',
    why: '"Fool me once, fool me twice" — wait for the second concrete case before investing in the abstraction. Premature abstractions often have the wrong shape.',
  },
  {
    bad: 'Throwing NotImplementedException / UnsupportedOperationException from overridden methods (LSP)',
    good: 'If a subtype cannot honour the parent\'s contract, it should not inherit from it',
    why: 'This is the most common LSP violation in the wild. If ReadOnlyList extends List but throws on add(), callers expecting a List will crash — use composition or a narrower interface instead.',
  },
  {
    bad: 'One mega-interface for every possible operation (ISP violation)',
    good: 'Define one interface per client need; compose them for full implementations',
    why: 'Fat interfaces force all implementers to know about unrelated concerns. This is especially painful in tests: mocking a 10-method interface to test one method requires 9 no-op stubs.',
  },
  {
    bad: 'Using new() to instantiate dependencies inside classes (DIP violation)',
    good: 'Receive all dependencies via constructor injection',
    why: 'new StripeClient() inside UserService locks UserService to Stripe forever. Constructor injection is the simplest, most testable DIP implementation — no framework needed.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function SolidPrinciplesPage() {
  const [activeTab, setActiveTab] = useState<'learn' | 'interview' | 'mistakes'>('learn');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10">

      {/* ── Hero ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-gray-800 bg-gray-950 overflow-hidden"
      >
        <div className="absolute-inset-0 pointer-events-none" />
        <div className="px-6 sm:px-8 py-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge label="Object-Oriented Design" color="bg-brand-500/20 text-brand-300 border border-brand-500/30" />
            <Badge label="Intermediate → Senior" color="bg-yellow-500/10 text-yellow-300 border border-yellow-500/20" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
            SOLID Principles
          </h1>
          <p className="text-gray-400 text-base leading-relaxed max-w-2xl mb-5">
            Five design principles that make software maintainable, extensible, and testable at scale.
            Coined by Robert C. Martin ("Uncle Bob"), SOLID is the foundation of every well-designed enterprise codebase —
            and a mandatory topic in senior engineering interviews at every top company.
          </p>

          {/* Principle pills */}
          <div className="flex flex-wrap gap-2">
            {principles.map((p) => (
              <div key={p.letter} className={`rounded-xl border px-4 py-2 text-xs font-semibold ${p.bg}`}>
                <span className="font-black text-base mr-1.5">{p.letter}</span>{p.full}
              </div>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-800 border-t border-gray-800">
          {[
            { label: 'Principles', value: '5' },
            { label: 'Code examples', value: '10+' },
            { label: 'Interview Q&As', value: '6' },
            { label: 'Real company cases', value: '5' },
          ].map((s) => (
            <div key={s.label} className="px-5 py-3 text-center">
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Why SOLID matters ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="rounded-2xl border border-brand-500/20 bg-brand-500/5 p-5 sm:p-6"
      >
        <div className="flex gap-3">
          <span className="text-2xl flex-shrink-0">💡</span>
          <div>
            <p className="text-brand-300 font-semibold mb-2">Why every senior engineer must know SOLID</p>
            <p className="text-gray-300 text-sm leading-relaxed">
              SOLID is not about writing clever code — it is about writing code that a team of 20 engineers can maintain over 5 years without it turning into an unmaintainable mess.
              Systems that violate SOLID become "Big Balls of Mud": every change risks breaking unrelated features, tests are impossible to write, and onboarding new engineers takes months.
              When an interviewer asks "how do you design a payment system?", SOLID is the lens through which senior engineers decompose the problem —
              they think about boundaries of responsibility, how to extend without breaking, and how to make the system testable in isolation.
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Tab nav ── */}
      <div className="flex gap-1 border border-gray-800 rounded-xl p-1 bg-gray-900 w-fit">
        {(['learn', 'interview', 'mistakes'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === t
                ? 'bg-brand-500 text-white shadow'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {t === 'learn' ? '📖 Learn' : t === 'interview' ? '🎯 Interview Q&A' : '⚠️ Common Mistakes'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >

          {/* ════════════════════════ LEARN TAB ════════════════════════ */}
          {activeTab === 'learn' && (
            <div className="space-y-8">

              {/* S — SRP */}
              <PrincipleShell
                letter="S"
                title="Single Responsibility Principle"
                subtitle="A class should have one, and only one, reason to change."
                tagline="Every module or class should be responsible for a single part of the program's functionality. If a class does too many things, changes to one responsibility risk breaking the others."
                accent="border-pink-500/40 from-pink-500"
              >
                <ThreeColLayout
                  left={
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Plain English</p>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        A kitchen chef should cook — not also manage invoices, seat customers, and fix the plumbing.
                        When the plumber needs to change, you do not want to retrain the chef.
                      </p>
                      <div className="pt-2 space-y-1.5">
                        <Pill label="Cohesion ↑" tone="green" />
                        <Pill label="Coupling ↓" tone="blue" />
                        <Pill label="Testability ↑" tone="purple" />
                      </div>
                    </div>
                  }
                  right={
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Enterprise signal</p>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        If your PR regularly touches more than 3 files to change one feature, your classes likely violate SRP.
                        At Amazon, the "two-pizza team" rule is SRP at the service level — one team, one service, one responsibility.
                      </p>
                    </div>
                  }
                />

                <SRPDemo />

                <div className="grid sm:grid-cols-2 gap-4">
                  <CodeBlock code={srpBad} />
                  <CodeBlock code={srpGood} />
                </div>
              </PrincipleShell>

              {/* O — OCP */}
              <PrincipleShell
                letter="O"
                title="Open/Closed Principle"
                subtitle="Open for extension, closed for modification."
                tagline="You should be able to add new behaviour to a system without editing existing, tested code. Achieve this through abstractions (interfaces, abstract classes) and the Strategy or Plugin patterns."
                accent="border-orange-500/40 from-orange-500"
              >
                <ThreeColLayout
                  left={
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Plain English</p>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        A power strip is open for extension (add new devices) but closed for modification (you do not rewire the strip to add a new plug).
                        Adding PayPal to your checkout should not risk breaking Stripe.
                      </p>
                      <div className="pt-2 space-y-1.5">
                        <Pill label="Strategy Pattern" tone="blue" />
                        <Pill label="Plugin Architecture" tone="purple" />
                        <Pill label="Zero regression risk" tone="green" />
                      </div>
                    </div>
                  }
                  right={
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Enterprise signal</p>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        Stripe, PayPal, Square — every payment SDK is a PaymentStrategy. Flyweight registries, plugin architectures (VS Code extensions, IntelliJ plugins), and feature flags all express OCP at different levels.
                      </p>
                    </div>
                  }
                />

                <OCPDemo />

                <div className="grid sm:grid-cols-2 gap-4">
                  <CodeBlock code={ocpBad} />
                  <CodeBlock code={ocpGood} />
                </div>
              </PrincipleShell>

              {/* L — LSP */}
              <PrincipleShell
                letter="L"
                title="Liskov Substitution Principle"
                subtitle="Subtypes must be substitutable for their base types without altering correctness."
                tagline="If S is a subtype of T, then objects of type T in a program may be replaced with objects of type S without changing any desirable properties of the program. In practice: no subclass should throw unexpected exceptions or weaken postconditions."
                accent="border-yellow-500/40 from-yellow-500"
              >
                <ThreeColLayout
                  left={
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Plain English</p>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        If you order "a vehicle" and receive a bicycle when you expected a car, that violates your contract.
                        A subclass should never surprise its caller — it honours every promise the parent made.
                      </p>
                      <div className="pt-2 space-y-1.5">
                        <Pill label="Design by Contract" tone="yellow" />
                        <Pill label="Behavioural subtyping" tone="blue" />
                      </div>
                    </div>
                  }
                  right={
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Enterprise signal</p>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        The classic LSP violation: overriding a method with <code className="text-red-400 text-xs">throw new UnsupportedOperationException()</code>.
                        In microservices, LSP governs API versioning — v2 must be substitutable for v1 for existing clients.
                      </p>
                    </div>
                  }
                />

                <LSPDemo />

                <div className="grid sm:grid-cols-2 gap-4">
                  <CodeBlock code={lspBad} />
                  <CodeBlock code={lspGood} />
                </div>
              </PrincipleShell>

              {/* I — ISP */}
              <PrincipleShell
                letter="I"
                title="Interface Segregation Principle"
                subtitle="No client should be forced to depend on methods it does not use."
                tagline="Fat interfaces create unnecessary couplings. Split large interfaces into smaller, role-specific ones so that implementing classes only need to know about the methods relevant to them."
                accent="border-emerald-500/40 from-emerald-500"
              >
                <ThreeColLayout
                  left={
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Plain English</p>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        A TV remote with 80 buttons — most of which you never use — is a fat interface.
                        An Apple TV remote with 6 buttons is a segregated interface for your actual use case.
                      </p>
                      <div className="pt-2 space-y-1.5">
                        <Pill label="Role interfaces" tone="green" />
                        <Pill label="Faster test setup" tone="blue" />
                        <Pill label="Explicit contracts" tone="purple" />
                      </div>
                    </div>
                  }
                  right={
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Enterprise signal</p>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        ISP is why BFF (Backend for Frontend) exists — mobile clients need a different API surface than desktop or third-party clients.
                        GraphQL's field selection is ISP applied to APIs: clients request exactly what they need.
                      </p>
                    </div>
                  }
                />

                <ISPDemo />

                <div className="grid sm:grid-cols-2 gap-4">
                  <CodeBlock code={ispBad} />
                  <CodeBlock code={ispGood} />
                </div>
              </PrincipleShell>

              {/* D — DIP */}
              <PrincipleShell
                letter="D"
                title="Dependency Inversion Principle"
                subtitle="Depend on abstractions, not concretions. High-level modules should not depend on low-level modules."
                tagline="High-level policy code (business logic) should not import low-level implementation details (databases, HTTP clients, file systems). Both should depend on abstractions. This is the enabler of testability, swappable infrastructure, and clean architecture."
                accent="border-blue-500/40 from-blue-500"
              >
                <ThreeColLayout
                  left={
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Plain English</p>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        Your TV remote does not care whether the batteries are Duracell or Energizer — it depends on the "battery" abstraction, not a specific brand.
                        Your OrderService should not care whether it talks to MySQL or PostgreSQL.
                      </p>
                      <div className="pt-2 space-y-1.5">
                        <Pill label="Constructor injection" tone="blue" />
                        <Pill label="IoC containers" tone="purple" />
                        <Pill label="Hexagonal architecture" tone="green" />
                      </div>
                    </div>
                  }
                  right={
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Enterprise signal</p>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        DIP is the foundational principle behind every DI framework: Spring (Java), Angular DI, NestJS, .NET DI.
                        Hexagonal Architecture (Ports & Adapters) is DIP applied at the system level — the core domain depends only on port interfaces, adapters implement them.
                      </p>
                    </div>
                  }
                />

                <DIPDemo />

                <div className="grid sm:grid-cols-2 gap-4">
                  <CodeBlock code={dipBad} />
                  <CodeBlock code={dipGood} />
                </div>
              </PrincipleShell>

              {/* Enterprise Case Study */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Enterprise Case Study</h2>
                  <p className="text-gray-400 text-sm">How FlipMart's engineering team applied all five principles across their order management platform.</p>
                </div>
                <CaseStudyTimeline />
              </div>

              {/* Architecture diagram — SOLID in a layered system */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-2xl border border-gray-800 bg-gray-950/60 p-5 sm:p-6"
              >
                <h2 className="text-lg font-bold text-white mb-1">SOLID in a Layered Architecture</h2>
                <p className="text-gray-400 text-sm mb-5">How the five principles map to the layers of a production system.</p>
                <div className="space-y-2">
                  {[
                    { layer: 'Presentation / Controller', solid: 'S — thin controllers delegate to services', color: 'border-pink-500/30 bg-pink-500/5' },
                    { layer: 'Application / Use Case', solid: 'S + D — orchestrates, depends on abstractions', color: 'border-orange-500/30 bg-orange-500/5' },
                    { layer: 'Domain / Business Logic', solid: 'O + L — extensible via strategies, honest contracts', color: 'border-yellow-500/30 bg-yellow-500/5' },
                    { layer: 'Interface / Ports', solid: 'I — segregated per client need', color: 'border-emerald-500/30 bg-emerald-500/5' },
                    { layer: 'Infrastructure / Adapters', solid: 'D — implements port interfaces, swappable', color: 'border-blue-500/30 bg-blue-500/5' },
                  ].map((row, i) => (
                    <motion.div
                      key={row.layer}
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.07 }}
                      className={`flex items-center gap-4 rounded-xl border px-4 py-3 ${row.color}`}
                    >
                      <div className="w-6 h-6 rounded-full border border-gray-700 bg-gray-900 flex items-center justify-center text-xs font-bold text-gray-400 flex-shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">{row.layer}</p>
                        <p className="text-xs text-gray-400">{row.solid}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-4 leading-relaxed">
                  This is Hexagonal Architecture (Ports & Adapters) in practice.
                  The domain layer never imports infrastructure — it depends on interfaces. Infrastructure implements those interfaces.
                  SOLID makes this possible: DIP defines the direction, ISP keeps ports minimal, OCP lets you add adapters without touching the domain.
                </p>
              </motion.div>
            </div>
          )}

          {/* ════════════════════════ INTERVIEW TAB ════════════════════════ */}
          {activeTab === 'interview' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5">
                <div className="flex gap-3">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <p className="text-yellow-300 font-semibold mb-1">What interviewers are really testing</p>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      When interviewers ask about SOLID, they are not checking if you can recite definitions.
                      They want to see if you can apply these principles to a real design under constraints — and if you know when <em>not</em> to apply them.
                      Answer with concrete examples from systems you know (or from this page), not from textbook shapes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {interviewQAs.map((qa) => (
                  <InterviewCard key={qa.question} {...qa} />
                ))}
              </div>

              {/* Quick-reference cheat sheet */}
              <div className="rounded-2xl border border-gray-800 bg-gray-950/60 p-5 space-y-4">
                <h3 className="text-base font-bold text-white">Interview cheat sheet — one sentence per principle</h3>
                <div className="space-y-2">
                  {[
                    { p: 'S', sentence: '"A class should have one, and only one, reason to change — meaning it owns one responsibility."', color: 'text-pink-400' },
                    { p: 'O', sentence: '"Add new behaviour by extending, not by editing existing tested code — use strategies and interfaces."', color: 'text-orange-400' },
                    { p: 'L', sentence: '"Every subclass must be substitutable for its parent without surprising the caller."', color: 'text-yellow-400' },
                    { p: 'I', sentence: '"Split fat interfaces into role-specific contracts so no class is forced to implement methods it never calls."', color: 'text-emerald-400' },
                    { p: 'D', sentence: '"Business logic should depend on abstractions (interfaces), not concretions (MySQL, Stripe, S3)."', color: 'text-blue-400' },
                  ].map((row) => (
                    <div key={row.p} className="flex items-start gap-3 rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-3">
                      <span className={`text-xl font-black flex-shrink-0 ${row.color}`}>{row.p}</span>
                      <p className="text-sm text-gray-300 leading-relaxed italic">{row.sentence}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Design challenge */}
              <div className="rounded-2xl border border-brand-500/20 bg-brand-500/5 p-5 space-y-4">
                <div className="flex gap-3">
                  <span className="text-2xl">✏️</span>
                  <div>
                    <p className="text-brand-300 font-bold mb-1">Practice challenge — design this in an interview</p>
                    <p className="text-gray-300 text-sm font-semibold mb-3">
                      "Design a notification service that can send alerts via Email, SMS, Push, and WhatsApp.
                      In the future it may also support Slack and in-app notifications."
                    </p>
                    <div className="space-y-2 text-sm text-gray-400">
                      <p><span className="text-pink-400 font-bold">S:</span> NotificationService only orchestrates. Rendering, delivery, and logging are separate classes.</p>
                      <p><span className="text-orange-400 font-bold">O:</span> Adding Slack = new SlackChannel class. NotificationService code never changes.</p>
                      <p><span className="text-yellow-400 font-bold">L:</span> Every channel implements <code className="text-brand-400 text-xs">NotificationChannel</code> honestly — no channel throws on send().</p>
                      <p><span className="text-emerald-400 font-bold">I:</span> <code className="text-brand-400 text-xs">Sendable</code>, <code className="text-brand-400 text-xs">Schedulable</code>, <code className="text-brand-400 text-xs">Trackable</code> — not one mega-interface.</p>
                      <p><span className="text-blue-400 font-bold">D:</span> NotificationService injects a <code className="text-brand-400 text-xs">NotificationChannel[]</code> — never constructs Twilio or SendGrid directly.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════ MISTAKES TAB ════════════════════════ */}
          {activeTab === 'mistakes' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
                <div className="flex gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="text-red-300 font-semibold mb-1">The most common SOLID mistakes in production codebases</p>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      These are real patterns found in codebases at companies of all sizes. Recognising them — and knowing how to refactor them — is what makes a senior engineer.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {commonMistakes.map((m) => (
                  <MistakeCard key={m.bad} {...m} />
                ))}
              </div>

              {/* Code smells table */}
              <div className="rounded-2xl border border-gray-800 bg-gray-950/60 p-5 space-y-4">
                <h3 className="text-base font-bold text-white">Code smell → violated principle mapping</h3>
                <div className="space-y-2">
                  {[
                    { smell: 'Class with 500+ lines and 20+ methods', principle: 'SRP', fix: 'Split by responsibility cluster' },
                    { smell: 'Giant if/else or switch on type/method string', principle: 'OCP', fix: 'Strategy or Command pattern' },
                    { smell: 'throw new UnsupportedOperationException() in an override', principle: 'LSP', fix: 'Use composition or narrower interface' },
                    { smell: 'Mocking 8 methods to test 1 method', principle: 'ISP', fix: 'Split the fat interface' },
                    { smell: 'new StripeClient() inside business logic', principle: 'DIP', fix: 'Constructor injection' },
                    { smell: 'Test class needing real database/email/Kafka', principle: 'DIP + ISP', fix: 'In-memory implementations via interfaces' },
                    { smell: 'Subclass that works only for some inputs of parent', principle: 'LSP', fix: 'Strengthen invariant or use separate type' },
                    { smell: 'Service that validates, saves, emails, logs, and audits', principle: 'SRP', fix: 'Extract each concern to dedicated class' },
                  ].map((row) => (
                    <div key={row.smell} className="grid grid-cols-12 gap-3 rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-3 items-start">
                      <div className="col-span-5">
                        <p className="text-xs text-red-300 leading-snug">⚠ {row.smell}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/20 text-orange-300 text-[10px] font-bold">{row.principle}</span>
                      </div>
                      <div className="col-span-5">
                        <p className="text-xs text-emerald-300 leading-snug">✓ {row.fix}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
