import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  starter: string;
  description?: string;
}

interface ConsoleEntry {
  kind: 'log' | 'error' | 'warn';
  message: string;
}

/**
 * Run user-provided JS in the browser. Output is captured by replacing
 * `console.log/error/warn` with shims that push into our entries array.
 *
 * Note: this is NOT a security sandbox. The intent is purely educational —
 * students paste their own snippets. A real production playground would use
 * a Web Worker or iframe with strict CSP.
 */
function runCode(source: string): ConsoleEntry[] {
  const entries: ConsoleEntry[] = [];
  const stringify = (v: unknown): string => {
    if (typeof v === 'string') return v;
    if (typeof v === 'function') return v.toString();
    if (v instanceof Error) return v.name + ': ' + v.message;
    try {
      return JSON.stringify(v, (_k, val) => (typeof val === 'function' ? '[Function]' : val), 2);
    } catch {
      return String(v);
    }
  };

  const fakeConsole = {
    log: (...args: unknown[]) =>
      entries.push({ kind: 'log', message: args.map(stringify).join(' ') }),
    warn: (...args: unknown[]) =>
      entries.push({ kind: 'warn', message: args.map(stringify).join(' ') }),
    error: (...args: unknown[]) =>
      entries.push({ kind: 'error', message: args.map(stringify).join(' ') }),
  };

  try {
    // Build a function with `console` shadowed to our shim. Strict mode catches more bugs.
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
    const fn = new Function('console', '"use strict";\n' + source);
    fn(fakeConsole);
  } catch (err) {
    const message = err instanceof Error ? err.name + ': ' + err.message : String(err);
    entries.push({ kind: 'error', message });
  }

  return entries;
}

export default function InteractiveCode({ starter, description }: Props) {
  const [code, setCode] = useState(starter);
  const [output, setOutput] = useState<ConsoleEntry[]>([]);
  const [hasRun, setHasRun] = useState(false);

  const handleRun = () => {
    setOutput(runCode(code));
    setHasRun(true);
  };
  const handleReset = () => {
    setCode(starter);
    setOutput([]);
    setHasRun(false);
  };

  return (
    <div className="space-y-3">
      {description && (
        <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
      )}

      {/* Editor */}
      <div className="rounded-2xl overflow-hidden border border-gray-800">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
            <span className="text-xs text-gray-500 ml-2 font-mono">main.js</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="text-xs px-3 py-1 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
            >
              ⟳ Reset
            </button>
            <button
              onClick={handleRun}
              className="text-xs px-3 py-1 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-500 transition-colors"
            >
              ▶ Run
            </button>
          </div>
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          className="w-full bg-gray-950 text-gray-200 font-mono text-[13px] leading-relaxed p-4 resize-y min-h-[260px] focus:outline-none"
          style={{ tabSize: 2 }}
          onKeyDown={(e) => {
            // Tab inserts two spaces instead of changing focus.
            if (e.key === 'Tab') {
              e.preventDefault();
              const target = e.currentTarget;
              const start = target.selectionStart;
              const end = target.selectionEnd;
              const next = code.slice(0, start) + '  ' + code.slice(end);
              setCode(next);
              requestAnimationFrame(() => {
                target.selectionStart = target.selectionEnd = start + 2;
              });
            }
          }}
        />
      </div>

      {/* Output */}
      <div className="rounded-2xl overflow-hidden border border-gray-800">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">Console</span>
            {hasRun && (
              <span className="text-[10px] text-gray-500">
                {output.length} {output.length === 1 ? 'line' : 'lines'}
              </span>
            )}
          </div>
          {hasRun && (
            <button
              onClick={() => setOutput([])}
              className="text-xs px-2 py-0.5 rounded text-gray-500 hover:text-gray-300 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        <div className="bg-gray-950 p-4 min-h-[120px] font-mono text-[12.5px] leading-relaxed">
          {!hasRun && (
            <p className="text-gray-600 italic">
              Press <span className="text-brand-400 not-italic">▶ Run</span> to execute the code.
            </p>
          )}
          {hasRun && output.length === 0 && (
            <p className="text-gray-600 italic">No output.</p>
          )}
          <AnimatePresence initial={false}>
            {output.map((entry, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`whitespace-pre-wrap break-all ${
                  entry.kind === 'error'
                    ? 'text-red-400'
                    : entry.kind === 'warn'
                    ? 'text-yellow-400'
                    : 'text-gray-200'
                }`}
              >
                {entry.kind === 'error' && '✗  '}
                {entry.kind === 'warn' && '⚠  '}
                {entry.message}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
