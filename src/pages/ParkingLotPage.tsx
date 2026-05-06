import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Web Speech voices ──────────────────────────────────────────────────────
function useInterviewVoices() {
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const interviewerRef = useRef<SpeechSynthesisVoice | null>(null);
  const candidateRef = useRef<SpeechSynthesisVoice | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [speaking, setSpeaking] = useState<'interviewer' | 'candidate' | null>(null);

  const loadVoices = useCallback(() => {
    const all = window.speechSynthesis.getVoices();
    if (!all.length) return;
    voicesRef.current = all;

    function pick(namePrefs: string[], langCodes: string[]) {
      for (const n of namePrefs) {
        const v = all.find(v => v.name.toLowerCase().includes(n.toLowerCase()));
        if (v) return v;
      }
      for (const lc of langCodes) {
        const v = all.find(v => v.lang === lc);
        if (v) return v;
      }
      return all.find(v => v.lang.startsWith('en')) ?? null;
    }

    interviewerRef.current = pick(
      ['Daniel', 'Google UK English Male', 'Microsoft David', 'Alex'],
      ['en-GB', 'en-US']
    );
    candidateRef.current = pick(
      ['Rishi', 'Neerja', 'Veena', 'Microsoft Heera', 'Microsoft Ravi', 'Lekha'],
      ['en-IN', 'en-GB']
    );
  }, []);

  useEffect(() => {
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, [loadVoices]);

  function makeUtterance(text: string, role: 'interviewer' | 'candidate') {
    const u = new SpeechSynthesisUtterance(text);
    if (role === 'interviewer') {
      u.voice = interviewerRef.current;
      u.pitch = 0.78; u.rate = 0.80; u.volume = 1.0;
    } else {
      u.voice = candidateRef.current;
      u.pitch = 1.05; u.rate = 0.80; u.volume = 0.88;
    }
    u.onstart = () => setSpeaking(role);
    u.onend = () => setSpeaking(null);
    u.onerror = () => setSpeaking(null);
    return u;
  }

  function speakAs(text: string, role: 'interviewer' | 'candidate') {
    if (!enabled) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(makeUtterance(text, role));
  }

  function stop() {
    window.speechSynthesis.cancel();
    setSpeaking(null);
  }

  function toggle() {
    if (enabled) { stop(); setEnabled(false); return; }
    setEnabled(true);
    setTimeout(() => {
      const u1 = makeUtterance("Welcome to your parking lot system design interview. Let's get started.", 'interviewer');
      const u2 = makeUtterance("Thank you. I am ready.", 'candidate');
      u1.onend = () => { setSpeaking(null); setTimeout(() => window.speechSynthesis.speak(u2), 400); };
      window.speechSynthesis.speak(u1);
    }, 120);
  }

  return { enabled, speaking, speakAs, stop, toggle };
}

// ─── Shared UI atoms ─────────────────────────────────────────────────────────
function SpeakingWave() {
  return (
    <span className="inline-flex items-end gap-[3px] h-4">
      {[0.4, 0.7, 1, 0.7, 0.4].map((h, i) => (
        <motion.span key={i} className="w-[3px] rounded-full bg-current"
          animate={{ scaleY: [h, 1, h] }}
          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.1 }}
          style={{ height: '100%', transformOrigin: 'bottom' }} />
      ))}
    </span>
  );
}

function Badge({ children, color = 'gray' }: { children: React.ReactNode; color?: string }) {
  const map: Record<string, string> = {
    gray: 'bg-gray-800 text-gray-300 border-gray-700',
    blue: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    green: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    pink: 'bg-pink-500/10 text-pink-300 border-pink-500/30',
    yellow: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
    violet: 'bg-violet-500/10 text-violet-300 border-violet-500/30',
    orange: 'bg-orange-500/10 text-orange-300 border-orange-500/30',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${map[color] ?? map.gray}`}>
      {children}
    </span>
  );
}

function CodeBlock({ code, language = 'java' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative rounded-xl overflow-hidden border border-gray-700">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-xs text-gray-400 font-mono">{language}</span>
        <button onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
          className="text-xs text-gray-500 hover:text-gray-200 transition-colors">
          {copied ? '✓ copied' : 'copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm text-gray-200 bg-gray-900 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function InterviewTip({ text }: { text: string }) {
  return (
    <div className="flex gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
      <span className="text-yellow-400 text-base mt-0.5">💡</span>
      <p className="text-sm text-yellow-200 leading-relaxed">{text}</p>
    </div>
  );
}

function InterviewerBubble({ text, isSpeaking, onSpeak, onStop, voiceEnabled }: {
  text: string; isSpeaking: boolean;
  onSpeak: () => void; onStop: () => void; voiceEnabled: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/30">I</div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-semibold text-blue-300">Interviewer</span>
          {isSpeaking && <span className="text-blue-400"><SpeakingWave /></span>}
        </div>
        <div className="rounded-2xl rounded-tl-sm bg-blue-500/10 border border-blue-500/20 px-4 py-3">
          <p className="text-sm text-gray-200 leading-relaxed">{text}</p>
        </div>
        {voiceEnabled && (
          <div className="mt-2">
            <button onClick={isSpeaking ? onStop : onSpeak}
              className="text-xs text-blue-400 hover:text-blue-200 transition-colors flex items-center gap-1.5 border border-blue-500/30 rounded-full px-3 py-1">
              {isSpeaking ? '⏹ Stop' : '▶ Listen'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CandidateBubble({ steps, isSpeaking, voiceEnabled }: {
  steps: string[]; isSpeaking: boolean; voiceEnabled: boolean;
}) {
  const [revealed, setRevealed] = useState(0);
  useEffect(() => { setRevealed(0); }, [steps]);

  return (
    <div className="flex gap-3 flex-row-reverse">
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-emerald-500/30">C</div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1.5 justify-end">
          {isSpeaking && voiceEnabled && <span className="text-emerald-400"><SpeakingWave /></span>}
          <span className="text-xs font-semibold text-emerald-300">You (Candidate)</span>
        </div>
        <div className="space-y-2">
          <AnimatePresence>
            {steps.slice(0, revealed).map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="rounded-2xl rounded-tr-sm bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
                <p className="text-sm text-gray-200 leading-relaxed">{step}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        {revealed < steps.length ? (
          <button onClick={() => setRevealed(r => Math.min(r + 1, steps.length))}
            className="mt-3 text-xs font-medium text-emerald-300 hover:text-emerald-100 border border-emerald-500/30 rounded-full px-4 py-1.5 transition-colors">
            {revealed === 0 ? '💬 Start thinking aloud…' : '→ Continue…'}
          </button>
        ) : (
          <p className="mt-2 text-xs text-gray-500 italic">All thinking steps revealed</p>
        )}
      </div>
    </div>
  );
}

function IdealAnswer({ text, voiceEnabled, onSpeak, onStop, isSpeaking }: {
  text: string; voiceEnabled: boolean;
  onSpeak: () => void; onStop: () => void; isSpeaking: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-pink-500/20 bg-pink-500/5 overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left">
        <span className="text-sm font-semibold text-pink-300">📋 Ideal Answer Summary</span>
        <span className="text-pink-400 text-xs">{open ? '▲ collapse' : '▼ reveal'}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-2">
              <p className="text-sm text-gray-300 leading-relaxed">{text}</p>
              {voiceEnabled && (
                <button onClick={isSpeaking ? onStop : onSpeak}
                  className="text-xs text-pink-400 hover:text-pink-200 border border-pink-500/30 rounded-full px-3 py-1 flex items-center gap-1.5 transition-colors">
                  {isSpeaking ? '⏹ Stop' : '▶ Hear Answer'}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Parking Lot Visualizer ──────────────────────────────────────────────────
type SpotType = 'MOTORCYCLE' | 'COMPACT' | 'LARGE' | 'HANDICAPPED';
type SpotStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';

interface ParkingSpot {
  id: string;
  floor: number;
  row: number;
  col: number;
  type: SpotType;
  status: SpotStatus;
  vehicle?: string;
  ticketId?: string;
  entryTime?: number;
}

interface ParkingTicket {
  id: string;
  spotId: string;
  vehicle: string;
  entryTime: number;
  exitTime?: number;
  fee?: number;
}

const RATE_PER_HOUR = 2; // $ per hour

function generateSpots(): ParkingSpot[] {
  const spots: ParkingSpot[] = [];
  const layout: SpotType[][] = [
    ['HANDICAPPED', 'HANDICAPPED', 'LARGE', 'LARGE', 'LARGE', 'COMPACT', 'COMPACT', 'COMPACT'],
    ['MOTORCYCLE', 'MOTORCYCLE', 'COMPACT', 'COMPACT', 'COMPACT', 'COMPACT', 'LARGE', 'LARGE'],
    ['COMPACT', 'COMPACT', 'COMPACT', 'COMPACT', 'LARGE', 'LARGE', 'LARGE', 'COMPACT'],
  ];
  for (let floor = 0; floor < 2; floor++) {
    layout.forEach((row, r) => {
      row.forEach((type, c) => {
        spots.push({ id: `F${floor + 1}-${r + 1}-${c + 1}`, floor, row: r, col: c, type, status: 'AVAILABLE' });
      });
    });
  }
  return spots;
}

const TYPE_COLOR: Record<SpotType, string> = {
  HANDICAPPED: 'border-blue-400/60 bg-blue-500/15 text-blue-300',
  LARGE: 'border-orange-400/60 bg-orange-500/15 text-orange-300',
  COMPACT: 'border-violet-400/60 bg-violet-500/15 text-violet-300',
  MOTORCYCLE: 'border-pink-400/60 bg-pink-500/15 text-pink-300',
};
const TYPE_ICON: Record<SpotType, string> = {
  HANDICAPPED: '♿', LARGE: '🚐', COMPACT: '🚗', MOTORCYCLE: '🏍️',
};

function ParkingLotVisualizer() {
  const [spots, setSpots] = useState<ParkingSpot[]>(generateSpots);
  const [tickets, setTickets] = useState<ParkingTicket[]>([]);
  const [activeFloor, setActiveFloor] = useState(0);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [paidTicket, setPaidTicket] = useState<ParkingTicket | null>(null);

  function addLog(msg: string) { setLog(l => [msg, ...l].slice(0, 6)); }

  function parkVehicle() {
    if (!selectedSpot || !vehiclePlate.trim()) return;
    const ticketId = `TKT-${Date.now().toString(36).toUpperCase()}`;
    const entryTime = Date.now();
    setSpots(prev => prev.map(s => s.id === selectedSpot.id
      ? { ...s, status: 'OCCUPIED', vehicle: vehiclePlate.trim().toUpperCase(), ticketId, entryTime }
      : s));
    const t: ParkingTicket = { id: ticketId, spotId: selectedSpot.id, vehicle: vehiclePlate.trim().toUpperCase(), entryTime };
    setTickets(prev => [t, ...prev]);
    addLog(`🚗 ${vehiclePlate.toUpperCase()} → ${selectedSpot.id} [${selectedSpot.type}] | Ticket: ${ticketId}`);
    setSelectedSpot(null);
    setVehiclePlate('');
  }

  function exitVehicle(spot: ParkingSpot) {
    if (spot.status !== 'OCCUPIED' || !spot.ticketId) return;
    const exitTime = Date.now();
    const duration = Math.max(1, Math.round((exitTime - (spot.entryTime ?? exitTime)) / 60000));
    const fee = parseFloat(((duration / 60) * RATE_PER_HOUR).toFixed(2));
    const ticket = tickets.find(t => t.id === spot.ticketId);
    if (ticket) {
      const paid = { ...ticket, exitTime, fee };
      setPaidTicket(paid);
      setTickets(prev => prev.map(t => t.id === ticket.id ? paid : t));
    }
    addLog(`💰 ${spot.vehicle} exited ${spot.id} | Duration: ${duration}m | Fee: $${fee}`);
    setSpots(prev => prev.map(s => s.id === spot.id
      ? { ...s, status: 'AVAILABLE', vehicle: undefined, ticketId: undefined, entryTime: undefined }
      : s));
  }

  const floorSpots = spots.filter(s => s.floor === activeFloor);
  const rows = [...new Set(floorSpots.map(s => s.row))].sort();
  const available = spots.filter(s => s.status === 'AVAILABLE').length;
  const occupied = spots.filter(s => s.status === 'OCCUPIED').length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', val: spots.length, color: 'text-gray-300' },
          { label: 'Available', val: available, color: 'text-emerald-400' },
          { label: 'Occupied', val: occupied, color: 'text-red-400' },
          { label: 'Floors', val: 2, color: 'text-blue-400' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-gray-700 bg-gray-900/60 p-3 text-center">
            <p className={`text-xl font-extrabold ${s.color}`}>{s.val}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(TYPE_ICON) as SpotType[]).map(t => (
          <span key={t} className={`text-xs border rounded-full px-2.5 py-1 ${TYPE_COLOR[t]}`}>
            {TYPE_ICON[t]} {t}
          </span>
        ))}
        <span className="text-xs border border-red-500/40 bg-red-500/10 text-red-300 rounded-full px-2.5 py-1">🔴 OCCUPIED</span>
      </div>

      {/* Floor selector */}
      <div className="flex gap-2">
        {[0, 1].map(f => (
          <button key={f} onClick={() => setActiveFloor(f)}
            className={`rounded-lg px-4 py-2 text-sm font-medium border transition-colors ${
              activeFloor === f ? 'border-brand-500/50 bg-brand-500/10 text-white' : 'border-gray-700 text-gray-400 hover:text-gray-200'
            }`}>
            Floor {f + 1}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="rounded-xl border border-gray-700 bg-gray-900 p-4 overflow-x-auto">
        <div className="space-y-2 min-w-[480px]">
          {rows.map(row => (
            <div key={row} className="flex gap-2">
              {floorSpots.filter(s => s.row === row).sort((a, b) => a.col - b.col).map(spot => {
                const occupied = spot.status === 'OCCUPIED';
                const selected = selectedSpot?.id === spot.id;
                return (
                  <motion.button
                    key={spot.id}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (occupied) { exitVehicle(spot); return; }
                      setSelectedSpot(selected ? null : spot);
                    }}
                    className={`flex-1 min-w-[52px] rounded-lg border-2 p-2 text-center transition-all ${
                      occupied
                        ? 'border-red-500/60 bg-red-500/15 cursor-pointer'
                        : selected
                        ? 'border-emerald-400 bg-emerald-500/20 ring-2 ring-emerald-400/30'
                        : TYPE_COLOR[spot.type] + ' hover:opacity-90'
                    }`}
                  >
                    <div className="text-base leading-none">
                      {occupied ? '🔴' : TYPE_ICON[spot.type]}
                    </div>
                    <div className="text-[9px] mt-1 font-mono opacity-70">{spot.id.split('-').slice(1).join('-')}</div>
                    {occupied && <div className="text-[8px] text-red-300 truncate mt-0.5">{spot.vehicle}</div>}
                  </motion.button>
                );
              })}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-3">Click an empty spot to select → enter plate → Park. Click red spot to exit.</p>
      </div>

      {/* Park action */}
      {selectedSpot && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
          <p className="text-sm font-semibold text-emerald-300">
            Park at {selectedSpot.id} — {TYPE_ICON[selectedSpot.type]} {selectedSpot.type}
          </p>
          <div className="flex gap-2">
            <input value={vehiclePlate} onChange={e => setVehiclePlate(e.target.value)}
              placeholder="Vehicle plate (e.g. MH12AB1234)"
              className="flex-1 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500" />
            <button onClick={parkVehicle}
              className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 transition-colors">
              Park 🚗
            </button>
          </div>
        </motion.div>
      )}

      {/* Receipt */}
      <AnimatePresence>
        {paidTicket && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-yellow-300">🧾 Parking Receipt</p>
              <button onClick={() => setPaidTicket(null)} className="text-xs text-gray-500 hover:text-gray-300">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-400">
              <span>Ticket</span><span className="font-mono text-gray-200">{paidTicket.id}</span>
              <span>Vehicle</span><span className="font-mono text-gray-200">{paidTicket.vehicle}</span>
              <span>Spot</span><span className="font-mono text-gray-200">{paidTicket.spotId}</span>
              <span>Entry</span><span className="text-gray-200">{new Date(paidTicket.entryTime).toLocaleTimeString()}</span>
              <span>Exit</span><span className="text-gray-200">{paidTicket.exitTime ? new Date(paidTicket.exitTime).toLocaleTimeString() : '-'}</span>
              <span className="text-yellow-300 font-semibold">Fee</span>
              <span className="text-yellow-300 font-bold text-sm">${paidTicket.fee}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Log */}
      {log.length > 0 && (
        <div className="rounded-xl border border-gray-700 bg-gray-900/60 p-4">
          <p className="text-xs font-semibold text-gray-500 mb-2">Activity log</p>
          {log.map((l, i) => (
            <p key={i} className={`text-xs font-mono ${i === 0 ? 'text-emerald-300' : 'text-gray-600'}`}>{l}</p>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Requirements grid ────────────────────────────────────────────────────────
function RequirementsGrid() {
  const functional = [
    'Multiple floors, each with rows of spots',
    'Spot types: Motorcycle, Compact, Large, Handicapped',
    'Vehicle types matched to appropriate spots',
    'Entry gate issues a ticket with timestamp',
    'Exit gate calculates fee (hourly rate)',
    'Display panel shows available spots per floor',
    'Spot reservation (optional extension)',
  ];
  const nonFunctional = [
    'High availability — parking should never be blocked',
    'Real-time spot count updates across entry gates',
    'Handle 1000+ entries/exits per hour during peak',
    'Prevent double-booking under concurrent traffic',
    'Fee calculation should be auditable and logged',
    'Support for multiple payment methods',
  ];
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
        <p className="text-xs font-bold text-blue-300 mb-3">✅ Functional Requirements</p>
        <ul className="space-y-1.5">
          {functional.map((f, i) => (
            <li key={i} className="flex gap-2 text-xs text-gray-300"><span className="text-blue-400 mt-0.5">•</span>{f}</li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
        <p className="text-xs font-bold text-violet-300 mb-3">⚡ Non-Functional Requirements</p>
        <ul className="space-y-1.5">
          {nonFunctional.map((f, i) => (
            <li key={i} className="flex gap-2 text-xs text-gray-300"><span className="text-violet-400 mt-0.5">•</span>{f}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Class diagram ────────────────────────────────────────────────────────────
function ClassDiagram() {
  const classes = [
    {
      name: 'ParkingLot', color: 'border-pink-500/40 bg-pink-500/5',
      fields: ['id: String', 'name: String', 'address: String', 'floors: List<Floor>'],
      methods: ['getAvailableSpots(VehicleType): List<ParkingSpot>', 'assignSpot(Vehicle): ParkingTicket', 'processPayment(ticket): Receipt'],
    },
    {
      name: 'Floor', color: 'border-blue-500/40 bg-blue-500/5',
      fields: ['floorNumber: int', 'spots: List<ParkingSpot>', 'displayBoard: DisplayBoard'],
      methods: ['getAvailableCount(SpotType): int', 'findNearestAvailable(SpotType): Optional<ParkingSpot>'],
    },
    {
      name: 'ParkingSpot', color: 'border-violet-500/40 bg-violet-500/5',
      fields: ['spotId: String', 'type: SpotType', 'status: SpotStatus', 'vehicle: Vehicle'],
      methods: ['isAvailable(): boolean', 'assignVehicle(v): void', 'vacate(): void'],
    },
    {
      name: 'Vehicle', color: 'border-emerald-500/40 bg-emerald-500/5',
      fields: ['licensePlate: String', 'type: VehicleType', 'color: String'],
      methods: [],
    },
    {
      name: 'ParkingTicket', color: 'border-yellow-500/40 bg-yellow-500/5',
      fields: ['ticketId: String', 'spot: ParkingSpot', 'vehicle: Vehicle', 'entryTime: Instant', 'exitTime: Instant'],
      methods: ['calculateFee(): BigDecimal', 'getDuration(): Duration'],
    },
    {
      name: 'SpotAssignmentStrategy', color: 'border-orange-500/40 bg-orange-500/5',
      fields: ['«interface»'],
      methods: ['assign(floors, vehicle): Optional<ParkingSpot>'],
    },
  ];
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {classes.map(cls => (
        <div key={cls.name} className={`rounded-xl border p-3 ${cls.color}`}>
          <p className="text-sm font-bold text-white mb-2">{cls.name}</p>
          {cls.fields.length > 0 && (
            <div className="border-t border-gray-700 pt-2 mb-2 space-y-0.5">
              {cls.fields.map(f => (
                <p key={f} className="text-[11px] font-mono text-gray-400">{f}</p>
              ))}
            </div>
          )}
          {cls.methods.length > 0 && (
            <div className="border-t border-gray-700 pt-2 space-y-0.5">
              {cls.methods.map(m => (
                <p key={m} className="text-[11px] font-mono text-gray-500">{m}</p>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Concurrency scenarios ────────────────────────────────────────────────────
function ConcurrencyScenarios() {
  const scenarios = [
    {
      title: 'Race on spot assignment',
      risk: 'high',
      problem: 'Two cars arrive simultaneously. Both threads see spot S1 as AVAILABLE. Both assign to S1. Double-booking.',
      solution: 'Lock spot with optimistic locking (version field) or pessimistic lock (SELECT FOR UPDATE in SQL). Only one thread wins; other retries.',
    },
    {
      title: 'Display board stale count',
      risk: 'medium',
      problem: 'Spot count in DisplayBoard is cached. Thread A parks and decrements; Thread B reads stale count and shows wrong availability.',
      solution: 'Use AtomicInteger for in-memory counts. For multi-server: publish spot-change events via Redis Pub/Sub or Kafka.',
    },
    {
      title: 'Payment processed twice',
      risk: 'high',
      problem: 'Network retry causes fee payment to be sent twice. Car is charged double.',
      solution: 'Idempotency key per ticket. Payment service checks if ticketId was already paid before processing.',
    },
    {
      title: 'Gate synchronization',
      risk: 'low',
      problem: 'Multiple entry gates run on separate threads. Each gate needs consistent spot availability.',
      solution: 'Single SpotManager service with ReentrantLock per floor, or distributed lock via Redis SETNX with TTL.',
    },
  ];
  const color = { high: 'border-red-500/30 bg-red-500/5', medium: 'border-yellow-500/30 bg-yellow-500/5', low: 'border-emerald-500/30 bg-emerald-500/5' };
  return (
    <div className="space-y-3">
      {scenarios.map((s, i) => (
        <div key={i} className={`rounded-xl border p-4 ${color[s.risk as keyof typeof color]}`}>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <p className="text-sm font-semibold text-white">{s.title}</p>
            <Badge color={s.risk === 'high' ? 'pink' : s.risk === 'medium' ? 'yellow' : 'green'}>{s.risk} risk</Badge>
          </div>
          <p className="text-xs text-gray-400 mb-1.5"><span className="text-red-400 font-medium">Problem:</span> {s.problem}</p>
          <p className="text-xs text-gray-400"><span className="text-emerald-400 font-medium">Solution:</span> {s.solution}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Java code constants ──────────────────────────────────────────────────────
const javaEnums = `// Enums — define the types upfront; interviewers love clear modeling
public enum VehicleType { MOTORCYCLE, COMPACT, LARGE }
public enum SpotType    { MOTORCYCLE, COMPACT, LARGE, HANDICAPPED }
public enum SpotStatus  { AVAILABLE, OCCUPIED, RESERVED }
public enum PaymentStatus { PENDING, PAID, FAILED }

// SpotType → compatible VehicleTypes mapping
public enum SpotType {
    MOTORCYCLE(EnumSet.of(VehicleType.MOTORCYCLE)),
    COMPACT   (EnumSet.of(VehicleType.MOTORCYCLE, VehicleType.COMPACT)),
    LARGE     (EnumSet.of(VehicleType.MOTORCYCLE, VehicleType.COMPACT, VehicleType.LARGE)),
    HANDICAPPED(EnumSet.of(VehicleType.COMPACT, VehicleType.LARGE));

    private final EnumSet<VehicleType> compatible;
    SpotType(EnumSet<VehicleType> compatible) { this.compatible = compatible; }
    public boolean canFit(VehicleType v) { return compatible.contains(v); }
}`;

const javaCore = `// Core OOP model
@Getter
public class Vehicle {
    private final String licensePlate;
    private final VehicleType type;

    public Vehicle(String plate, VehicleType type) {
        this.licensePlate = plate.toUpperCase();
        this.type = type;
    }
}

@Getter
public class ParkingSpot {
    private final String spotId;
    private final SpotType type;
    private SpotStatus status = SpotStatus.AVAILABLE;
    private Vehicle occupiedBy;

    public boolean canFit(Vehicle v) {
        return status == SpotStatus.AVAILABLE && type.canFit(v.getType());
    }

    public synchronized void assign(Vehicle v) {
        if (!canFit(v)) throw new IllegalStateException("Spot unavailable: " + spotId);
        this.occupiedBy = v;
        this.status = SpotStatus.OCCUPIED;
    }

    public synchronized void vacate() {
        this.occupiedBy = null;
        this.status = SpotStatus.AVAILABLE;
    }
}

@Getter
public class Floor {
    private final int floorNumber;
    private final List<ParkingSpot> spots;
    private final Map<SpotType, AtomicInteger> available = new EnumMap<>(SpotType.class);

    public Floor(int floorNumber, List<ParkingSpot> spots) {
        this.floorNumber = floorNumber;
        this.spots = spots;
        for (SpotType t : SpotType.values()) {
            available.put(t, new AtomicInteger(
                (int) spots.stream().filter(s -> s.getType() == t).count()
            ));
        }
    }

    public Optional<ParkingSpot> findAvailable(Vehicle v) {
        return spots.stream().filter(s -> s.canFit(v)).findFirst();
    }
}

@Getter
public class ParkingTicket {
    private final String ticketId = UUID.randomUUID().toString();
    private final Vehicle vehicle;
    private final ParkingSpot spot;
    private final Instant entryTime = Instant.now();
    private Instant exitTime;

    public ParkingTicket(Vehicle vehicle, ParkingSpot spot) {
        this.vehicle = vehicle;
        this.spot = spot;
    }

    public BigDecimal calculateFee(BigDecimal ratePerHour) {
        long minutes = Duration.between(entryTime, Instant.now()).toMinutes();
        BigDecimal hours = BigDecimal.valueOf(Math.max(1, minutes)).divide(BigDecimal.valueOf(60), 2, RoundingMode.CEILING);
        return ratePerHour.multiply(hours).setScale(2, RoundingMode.HALF_UP);
    }
}`;

const javaStrategy = `// Strategy Pattern — swappable spot assignment algorithms
public interface SpotAssignmentStrategy {
    Optional<ParkingSpot> assign(List<Floor> floors, Vehicle vehicle);
}

// Nearest-first: prefer ground floor, then ascending
@Component("nearest")
public class NearestFirstStrategy implements SpotAssignmentStrategy {
    @Override
    public Optional<ParkingSpot> assign(List<Floor> floors, Vehicle vehicle) {
        return floors.stream()
            .sorted(Comparator.comparingInt(Floor::getFloorNumber))
            .flatMap(f -> f.getSpots().stream())
            .filter(s -> s.canFit(vehicle))
            .findFirst();
    }
}

// Distribute load — spread vehicles evenly across floors
@Component("distributed")
public class DistributedLoadStrategy implements SpotAssignmentStrategy {
    @Override
    public Optional<ParkingSpot> assign(List<Floor> floors, Vehicle vehicle) {
        return floors.stream()
            .max(Comparator.comparingLong(f ->
                f.getSpots().stream().filter(s -> s.canFit(vehicle)).count()))
            .flatMap(f -> f.findAvailable(vehicle));
    }
}

// Main ParkingLot wires it all together
@Service
public class ParkingLot {
    private final List<Floor> floors;
    private final SpotAssignmentStrategy strategy;
    private final Map<String, ParkingTicket> activeTickets = new ConcurrentHashMap<>();
    private final ReentrantLock assignmentLock = new ReentrantLock();

    public ParkingTicket park(Vehicle vehicle) {
        assignmentLock.lock();
        try {
            ParkingSpot spot = strategy.assign(floors, vehicle)
                .orElseThrow(() -> new ParkingFullException("No available spot for " + vehicle.getType()));
            spot.assign(vehicle);
            ParkingTicket ticket = new ParkingTicket(vehicle, spot);
            activeTickets.put(ticket.getTicketId(), ticket);
            return ticket;
        } finally {
            assignmentLock.unlock();
        }
    }

    public Receipt exit(String ticketId, BigDecimal ratePerHour) {
        ParkingTicket ticket = activeTickets.remove(ticketId);
        if (ticket == null) throw new IllegalArgumentException("Invalid ticket: " + ticketId);
        ticket.getSpot().vacate();
        BigDecimal fee = ticket.calculateFee(ratePerHour);
        return new Receipt(ticket, fee);
    }
}`;

const javaConcurrent = `// Thread-safe parking with per-floor locks (finer granularity)
@Service
public class ConcurrentParkingLot {
    private final List<Floor> floors;
    private final SpotAssignmentStrategy strategy;
    private final ConcurrentHashMap<String, ParkingTicket> activeTickets = new ConcurrentHashMap<>();

    // One lock per floor — avoids single global lock bottleneck
    private final Map<Integer, ReentrantLock> floorLocks;

    public ConcurrentParkingLot(List<Floor> floors, SpotAssignmentStrategy strategy) {
        this.floors = floors;
        this.strategy = strategy;
        this.floorLocks = floors.stream().collect(Collectors.toMap(
            Floor::getFloorNumber,
            f -> new ReentrantLock()
        ));
    }

    public ParkingTicket park(Vehicle vehicle) {
        // Try each floor in order, locking only the chosen floor
        for (Floor floor : floors) {
            ReentrantLock lock = floorLocks.get(floor.getFloorNumber());
            lock.lock();
            try {
                Optional<ParkingSpot> spot = floor.findAvailable(vehicle);
                if (spot.isPresent()) {
                    spot.get().assign(vehicle);
                    ParkingTicket ticket = new ParkingTicket(vehicle, spot.get());
                    activeTickets.put(ticket.getTicketId(), ticket);
                    return ticket;
                }
            } finally {
                lock.unlock();
            }
        }
        throw new ParkingFullException("No spot available for " + vehicle.getType());
    }

    public Receipt exit(String ticketId) {
        ParkingTicket ticket = Optional.ofNullable(activeTickets.remove(ticketId))
            .orElseThrow(() -> new TicketNotFoundException(ticketId));

        int floorNum = ticket.getSpot().getFloorNumber();
        ReentrantLock lock = floorLocks.get(floorNum);
        lock.lock();
        try {
            ticket.getSpot().vacate();
        } finally {
            lock.unlock();
        }

        BigDecimal fee = ticket.calculateFee(BigDecimal.valueOf(2.0));
        return new Receipt(ticket, fee);
    }
}`;

const javaDistributed = `// Distributed parking lot — 1000 lots across a city
// Each lot is an independent service. Central coordinator finds nearest available.

// 1. Spot availability published to Redis via events
@Component
public class SpotEventPublisher {
    private final RedisTemplate<String, String> redis;

    public void spotOccupied(String lotId, String spotId) {
        redis.opsForHash().delete("lot:" + lotId + ":available", spotId);
        redis.convertAndSend("parking:events", lotId + ":OCCUPIED:" + spotId);
    }

    public void spotVacated(String lotId, String spotId) {
        redis.opsForHash().put("lot:" + lotId + ":available", spotId, "1");
        redis.convertAndSend("parking:events", lotId + ":VACATED:" + spotId);
    }
}

// 2. Central API gateway — finds nearest lot with available spot
@RestController
@RequestMapping("/api/parking")
public class ParkingGateway {
    private final RedisTemplate<String, String> redis;
    private final GeoOperations<String, String> geo;

    // Geospatial: store lot location in Redis GEO
    // GEOADD parking:lots 72.8777 19.0760 "lot-mumbai-1"
    // GEORADIUS parking:lots 72.87 19.07 5 km ASC
    public List<String> findNearbyLots(double lat, double lng, int radiusKm) {
        return geo.radius("parking:lots",
            new Circle(new Point(lng, lat), new Distance(radiusKm, Metrics.KILOMETERS)),
            RedisGeoCommands.GeoRadiusCommandArgs.newGeoRadiusArgs().sortAscending()
        ).getContent().stream().map(r -> r.getContent().getName()).collect(toList());
    }

    @PostMapping("/find")
    public ResponseEntity<ParkingRecommendation> findSpot(
            @RequestBody FindSpotRequest req) {
        return findNearbyLots(req.lat(), req.lng(), 5).stream()
            .filter(lotId -> hasAvailableSpot(lotId, req.vehicleType()))
            .findFirst()
            .map(lotId -> ResponseEntity.ok(new ParkingRecommendation(lotId, getAddress(lotId))))
            .orElse(ResponseEntity.noContent().build());
    }

    private boolean hasAvailableSpot(String lotId, VehicleType type) {
        Long count = redis.opsForHash().size("lot:" + lotId + ":available");
        return count != null && count > 0;
    }
}`;

// ─── Questions ────────────────────────────────────────────────────────────────
const QUESTIONS = [
  {
    id: 1, time: '5 min', tag: 'Requirements', color: 'blue',
    interviewer: "Let's design a parking lot system. Before jumping into code, walk me through the functional and non-functional requirements. What are the key entities in this system?",
    thinking: [
      "I'll start by clarifying scope. Is this a single lot or a city-wide system? I'll assume a multi-floor single lot first, with extensibility to multiple lots.",
      "Functional: vehicles enter and get a ticket, are assigned a spot, pay on exit. Spot types: Motorcycle, Compact, Large, Handicapped. Display shows available counts per floor.",
      "Non-functional: no double-booking even with concurrent entries, real-time spot updates, high availability (parking gate should never crash).",
      "Key entities: ParkingLot, Floor, ParkingSpot, Vehicle, ParkingTicket, Receipt, DisplayBoard. I'll also need enums: VehicleType, SpotType, SpotStatus.",
      "The critical design question is how to match vehicle types to spot types — a motorcycle can park in a compact spot, but not vice versa. I'll model this as a compatibility mapping in the SpotType enum.",
    ],
    idealAnswer: "Clarify single vs multi-lot. Core entities: ParkingLot → Floor → ParkingSpot (with SpotType enum), Vehicle (with VehicleType), ParkingTicket (issued on entry), Receipt (on exit with fee). Functional requirements: assign smallest available spot that fits the vehicle, display real-time counts, calculate hourly fee. Non-functional: concurrent-safe assignment, high availability. Good candidates also ask: reserved spots? Monthly passes? EV charging? Valet mode?",
    tip: "Spend 2 minutes on requirements before any code. Interviewers dock points for jumping straight into implementation.",
    visual: 'requirements',
  },
  {
    id: 2, time: '10 min', tag: 'OOP Design', color: 'violet',
    interviewer: "Good. Now design the class structure. Draw the UML — tell me each class, its fields, key methods, and how they relate. I want to see clean OOP, not just a God class.",
    thinking: [
      "I'll avoid the God class anti-pattern. ParkingLot delegates to Floor which delegates to ParkingSpot — single responsibility at each level.",
      "ParkingSpot holds its own type, status, and assigned vehicle. It exposes canFit(vehicle) and assign/vacate — each spot manages its own state.",
      "Floor holds a list of spots and an AtomicInteger per SpotType for O(1) availability count (no need to scan all spots for a display board).",
      "ParkingTicket is issued on entry with vehicle + spot + entryTime. It has a calculateFee(ratePerHour) method — fee logic belongs to the ticket, not the lot.",
      "SpotAssignmentStrategy is an interface. I can swap in NearestFirst, DistributedLoad, or HandicappedPriority without changing ParkingLot. This is the Strategy pattern.",
      "ParkingLot is the facade — it has park(vehicle) and exit(ticketId) as the two main operations.",
    ],
    idealAnswer: "Six classes: ParkingLot (facade), Floor (manages rows of spots + availability counter), ParkingSpot (own state machine: AVAILABLE→OCCUPIED→AVAILABLE), Vehicle (plate + type), ParkingTicket (entry receipt with fee calculation), SpotAssignmentStrategy (interface). Design patterns: Strategy (assignment algorithm), Facade (ParkingLot hides floor complexity), State (spot status transitions). Key insight: store key in ParkingSpot's Vehicle field to avoid re-scanning on exit.",
    tip: "Name your design patterns out loud — Strategy, Facade, State. It immediately signals senior-level thinking.",
    visual: 'classdiagram',
  },
  {
    id: 3, time: '15 min', tag: 'Code', color: 'emerald',
    interviewer: "Let's code. I want to see the core park() and exit() methods with the spot assignment logic. Use the visualizer to test your logic as you go.",
    thinking: [
      "park(vehicle): delegate to SpotAssignmentStrategy to find a spot, call spot.assign(vehicle), create a ParkingTicket, store in ConcurrentHashMap, return ticket.",
      "exit(ticketId): look up ticket from map, call spot.vacate(), calculate fee via ticket.calculateFee(rate), return Receipt.",
      "SpotType.canFit(vehicle): encapsulate compatibility in the enum — a LARGE spot can fit MOTORCYCLE, COMPACT, and LARGE vehicles. HANDICAPPED spot fits COMPACT and LARGE.",
      "Floor.findAvailable(vehicle): stream spots, filter by s.canFit(vehicle), return findFirst(). Simple, readable.",
      "ParkingTicket.calculateFee: compute Duration.between(entryTime, now()), ceiling to nearest hour, multiply by rate. Use BigDecimal for money — never float.",
      "I'll use a try-finally around the assignment lock to ensure the lock is always released even if an exception is thrown.",
    ],
    idealAnswer: "park() takes a vehicle, uses the strategy to find a spot (stream + filter + findFirst), atomically assigns, creates ticket, stores in ConcurrentHashMap. exit() removes ticket from map, vacates spot, calculates fee. Key correctness points: use BigDecimal for fee (not double), lock around spot assignment to prevent race conditions, throw domain exceptions (ParkingFullException, TicketNotFoundException) rather than returning nulls. Duration.between() for time, ceiling division for rounding up.",
    tip: "Using BigDecimal for money instead of double is a small detail that immediately signals production experience.",
    visual: 'visualizer',
  },
  {
    id: 4, time: '10 min', tag: 'Concurrency', color: 'yellow',
    interviewer: "Two cars arrive at the same time. Both threads read that spot S1 is available and try to assign. How do you prevent the double-booking? Walk me through all the race conditions in this system.",
    thinking: [
      "Race 1: Two threads call park() simultaneously, both call floor.findAvailable() and get the same spot, both call spot.assign() — one wins, the other corrupts state. Fix: lock before findAvailable+assign as an atomic operation.",
      "Race 2: DisplayBoard shows stale count. Thread A parks and decrements the AtomicInteger; Thread B already read the count before decrement and shows wrong number. Fix: AtomicInteger decrementAndGet() is atomic, so this is safe in-process. For multi-server, push events via Redis Pub/Sub.",
      "Race 3: Payment duplicate. Client retries due to timeout; payment is processed twice. Fix: idempotency key (ticketId) — check if already paid before charging.",
      "I'll use per-floor ReentrantLocks instead of one global lock. This allows concurrent entries to different floors without serializing on a single mutex.",
      "For spot.assign() itself: mark it synchronized as a defense-in-depth, but the real protection is the floor-level lock.",
    ],
    idealAnswer: "Three race conditions: (1) concurrent spot assignment — lock per floor around findAvailable+assign; (2) stale display count — AtomicInteger for in-process, Redis Pub/Sub for multi-server; (3) duplicate payment — idempotency key per ticket. Per-floor locks (not global) give much better throughput — unrelated floors proceed in parallel. spot.assign() is also synchronized as defense-in-depth. ConcurrentHashMap for ticketId→ticket storage. Mention optimistic locking as an alternative (version field) if using a database.",
    tip: "Per-floor locks instead of a single global lock shows you think about throughput, not just correctness.",
    visual: 'concurrency',
  },
  {
    id: 5, time: '5 min', tag: 'Scale', color: 'pink',
    interviewer: "Good. Now scale this to a city-wide system — 1000 parking lots across Mumbai. Users open an app and want to find the nearest available parking. How does the architecture change?",
    thinking: [
      "Each lot becomes an independent microservice. No shared in-memory state between lots.",
      "For finding nearest lot: store lot GPS coordinates in Redis GEO (GEOADD). On request, use GEORADIUS to find lots within X km, sorted by distance.",
      "Availability sync: each lot publishes spot-change events to Kafka. A central aggregation service consumes and updates Redis hashes with available spot counts per lot.",
      "API Gateway receives find-spot request with lat/lng: query GEO → get nearby lots → filter by availability → return top 3 recommendations.",
      "Database per lot for tickets and payments — no cross-lot joins needed. Each lot's DB is small enough for a single Postgres instance.",
      "For real-time availability on the app: WebSocket connection to a gateway that subscribes to Kafka spot-change events and pushes updates to connected clients.",
    ],
    idealAnswer: "Each lot is an independent service with its own database. Redis GEO stores lot coordinates for geospatial nearest-lot queries (GEORADIUS). Availability is published as Kafka events (spot occupied/vacated) → aggregation service → Redis hash per lot. Mobile app connects via WebSocket to get real-time spot availability updates. API Gateway orchestrates: GEO lookup → filter available → book. Handle payment via a central Payment Service with idempotency keys. Monitoring: Prometheus metrics per lot (occupancy rate, average dwell time, peak hours).",
    tip: "Redis GEO commands (GEOADD, GEORADIUS) are a killer detail for location-based systems — very few candidates mention them.",
    visual: 'code',
  },
];

// ─── Code tabs ────────────────────────────────────────────────────────────────
const CODE_TABS = [
  { id: 'enums', label: 'Enums & Types', code: javaEnums },
  { id: 'core', label: 'Core OOP', code: javaCore },
  { id: 'strategy', label: 'Strategy + Lot', code: javaStrategy },
  { id: 'concurrent', label: 'Thread-Safe', code: javaConcurrent },
  { id: 'distributed', label: 'City-Wide Scale', code: javaDistributed },
];

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ParkingLotPage() {
  const [activeQ, setActiveQ] = useState(1);
  const [tab, setTab] = useState<'interview' | 'code'>('interview');
  const [codeTab, setCodeTab] = useState('enums');
  const voice = useInterviewVoices();
  const [speakingTarget, setSpeakingTarget] = useState<string | null>(null);

  const q = QUESTIONS[activeQ - 1];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (voice.enabled && tab === 'interview') {
      voice.stop();
      setSpeakingTarget(null);
      setTimeout(() => {
        setSpeakingTarget(`q${activeQ}-interviewer`);
        voice.speakAs(q.interviewer, 'interviewer');
      }, 300);
    }
  }, [activeQ, tab]);

  function handleSpeak(target: string, text: string, role: 'interviewer' | 'candidate') {
    if (speakingTarget === target) { voice.stop(); setSpeakingTarget(null); return; }
    setSpeakingTarget(target);
    voice.speakAs(text, role);
    const check = setInterval(() => {
      if (!window.speechSynthesis.speaking) { setSpeakingTarget(null); clearInterval(check); }
    }, 300);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge color="pink">Mock Interview</Badge>
              <Badge color="yellow">45 min</Badge>
              <Badge color="blue">Senior SDE / FAANG</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
              Design a Parking Lot
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xl">
              OOP design, Strategy pattern, concurrency, city-wide scale. 5 progressive questions from requirements to 1000-lot distributed system.
            </p>
          </div>
          <button
            onClick={voice.toggle}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
              voice.enabled
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15'
                : 'border-gray-700 bg-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            {voice.enabled ? (voice.speaking ? <SpeakingWave /> : '🔊') : '🔇'}
            <span>{voice.enabled ? 'Voice On' : 'Voice Off'}</span>
          </button>
        </div>
      </div>

      {/* Stage timeline */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {QUESTIONS.map((qt) => (
          <button key={qt.id} onClick={() => { setActiveQ(qt.id); setTab('interview'); }}
            className={`flex-shrink-0 rounded-xl border px-4 py-2.5 text-left transition-all ${
              activeQ === qt.id
                ? 'border-brand-500/50 bg-brand-500/10 text-white'
                : 'border-gray-700 bg-gray-900/60 text-gray-400 hover:border-gray-600 hover:text-gray-200'
            }`}>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-bold opacity-60">Q{qt.id}</span>
              <Badge color={qt.color as 'blue' | 'green' | 'pink' | 'yellow' | 'violet'}>{qt.tag}</Badge>
            </div>
            <p className="text-xs font-medium leading-snug">{qt.time}</p>
          </button>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex overflow-x-auto rounded-xl border border-gray-700 bg-gray-900/60 p-1 gap-1">
        {(['interview', 'code'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-shrink-0 rounded-lg px-5 py-2 text-sm font-medium transition-colors capitalize ${
              tab === t ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}>
            {t === 'interview' ? '🎙 Interview' : '☕ Java Code'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'interview' ? (
          <motion.div key={`interview-${activeQ}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
            <InterviewerBubble
              text={q.interviewer}
              isSpeaking={speakingTarget === `q${activeQ}-interviewer` && !!voice.speaking}
              onSpeak={() => handleSpeak(`q${activeQ}-interviewer`, q.interviewer, 'interviewer')}
              onStop={() => { voice.stop(); setSpeakingTarget(null); }}
              voiceEnabled={voice.enabled}
            />

            <CandidateBubble
              steps={q.thinking}
              isSpeaking={speakingTarget?.startsWith(`q${activeQ}-step`) && !!voice.speaking}
              voiceEnabled={voice.enabled}
            />

            {/* Visual aids */}
            {q.visual === 'requirements' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-gray-700 bg-gray-900/60 p-5 space-y-3">
                <p className="text-xs font-semibold text-gray-400">Requirements checklist</p>
                <RequirementsGrid />
              </motion.div>
            )}
            {q.visual === 'classdiagram' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-gray-700 bg-gray-900/60 p-5 space-y-3">
                <p className="text-xs font-semibold text-gray-400">UML-style class diagram</p>
                <ClassDiagram />
              </motion.div>
            )}
            {q.visual === 'visualizer' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-gray-700 bg-gray-900/60 p-5 space-y-4">
                <p className="text-xs font-semibold text-gray-400">Interactive parking lot — park and exit vehicles</p>
                <ParkingLotVisualizer />
              </motion.div>
            )}
            {q.visual === 'concurrency' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-gray-700 bg-gray-900/60 p-5 space-y-3">
                <p className="text-xs font-semibold text-gray-400">Concurrency race conditions and fixes</p>
                <ConcurrencyScenarios />
              </motion.div>
            )}
            {q.visual === 'code' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-gray-700 bg-gray-900/60 p-5 space-y-3">
                <p className="text-xs font-semibold text-gray-400">City-wide architecture at a glance</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { icon: '🗺️', title: 'Redis GEO', desc: 'GEORADIUS to find nearest lots within X km, sorted by distance' },
                    { icon: '📡', title: 'Kafka Events', desc: 'spot:occupied / spot:vacated events fan out to aggregation + app' },
                    { icon: '⚡', title: 'WebSocket', desc: 'Real-time availability pushed to mobile app on spot change' },
                    { icon: '🔑', title: 'Idempotency', desc: 'ticketId as payment idempotency key prevents double charge on retry' },
                    { icon: '🗄️', title: 'DB per Lot', desc: 'Each lot owns its Postgres — no cross-lot joins, easy horizontal scale' },
                    { icon: '📊', title: 'Metrics', desc: 'Occupancy rate, dwell time, peak hours per lot via Prometheus/Grafana' },
                  ].map(c => (
                    <div key={c.title} className="rounded-xl border border-gray-700 bg-gray-900 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{c.icon}</span>
                        <p className="text-sm font-semibold text-white">{c.title}</p>
                      </div>
                      <p className="text-xs text-gray-500">{c.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            <IdealAnswer
              text={q.idealAnswer}
              voiceEnabled={voice.enabled}
              isSpeaking={speakingTarget === `q${activeQ}-ideal` && !!voice.speaking}
              onSpeak={() => handleSpeak(`q${activeQ}-ideal`, q.idealAnswer, 'candidate')}
              onStop={() => { voice.stop(); setSpeakingTarget(null); }}
            />

            <InterviewTip text={q.tip} />

            <div className="flex justify-between pt-2">
              <button onClick={() => { setActiveQ(q => Math.max(1, q - 1)); setTab('interview'); }}
                disabled={activeQ === 1}
                className="text-sm text-gray-400 hover:text-gray-200 disabled:opacity-30 border border-gray-700 rounded-lg px-4 py-2 transition-colors">
                ← Previous
              </button>
              <button onClick={() => { setActiveQ(q => Math.min(QUESTIONS.length, q + 1)); setTab('interview'); }}
                disabled={activeQ === QUESTIONS.length}
                className="text-sm text-white bg-brand-600 hover:bg-brand-500 border border-brand-500/50 rounded-lg px-4 py-2 transition-colors disabled:opacity-30">
                Next Question →
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="code" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="flex overflow-x-auto gap-1 rounded-xl border border-gray-700 bg-gray-900/60 p-1">
              {CODE_TABS.map(ct => (
                <button key={ct.id} onClick={() => setCodeTab(ct.id)}
                  className={`flex-shrink-0 rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
                    codeTab === ct.id ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'
                  }`}>{ct.label}</button>
              ))}
            </div>

            <div className="text-xs text-gray-500 px-1">
              {codeTab === 'enums' && 'Define VehicleType, SpotType, SpotStatus enums first. The canFit() compatibility method in SpotType is a key insight.'}
              {codeTab === 'core' && 'Core entities: Vehicle, ParkingSpot (self-managing state), Floor (with AtomicInteger counts), ParkingTicket with calculateFee() using BigDecimal.'}
              {codeTab === 'strategy' && 'Strategy pattern for spot assignment — NearestFirst vs DistributedLoad. ParkingLot orchestrates with a single ReentrantLock around find+assign.'}
              {codeTab === 'concurrent' && 'Per-floor locks instead of global lock. Different floors can be assigned concurrently, dramatically improving throughput at busy lots.'}
              {codeTab === 'distributed' && 'City-wide scale: Redis GEO for nearest lot lookup, Kafka for spot-change events, each lot as independent microservice with its own DB.'}
            </div>

            <CodeBlock code={CODE_TABS.find(ct => ct.id === codeTab)?.code ?? ''} language="java" />

            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { label: 'park()', complexity: 'O(S)', detail: 'S = spots per floor, linear scan' },
                { label: 'exit(ticketId)', complexity: 'O(1)', detail: 'ConcurrentHashMap lookup' },
                { label: 'findNearest()', complexity: 'O(log N)', detail: 'Redis GEO GEORADIUS' },
              ].map(r => (
                <div key={r.label} className="rounded-xl border border-gray-700 bg-gray-900/60 p-4 text-center">
                  <p className="text-xs text-gray-500 font-mono mb-1">{r.label}</p>
                  <p className="text-xl font-extrabold text-emerald-400 mb-1">{r.complexity}</p>
                  <p className="text-xs text-gray-500">{r.detail}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
        <p className="text-xs text-gray-500 text-center">
          Parking Lot · OOP Design · Strategy Pattern · Per-floor locks · Redis GEO · Kafka events · City-wide scale
        </p>
      </div>
    </div>
  );
}
