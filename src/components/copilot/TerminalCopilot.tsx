import React, { useState, useRef, useEffect } from 'react';
import { Terminal, ShieldAlert, CheckCircle2, ChevronRight, Activity, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiPost, ApiError } from '../../lib/apiClient';

export interface LedgerEntry {
  id: string;
  timestamp: Date;
  input: string;
  response: {
    type: 'CRITICAL_CORRECTION' | 'LEDGER_ENTRY' | 'PREDICTIVE_INSIGHT';
    title: string;
    message: string;
    metrics_impact: string[];
  } | null;
  status: 'pending' | 'complete' | 'error';
  error?: string;
}

type CopilotResponse = NonNullable<LedgerEntry['response']>;

// Mock history data to send to the copilot so it has context for pushback.
// In a real app this would be pulled from Firestore (environment sensors & grow logs)
const MOCK_HISTORY = [
  { date: 'T-14', vpd: 1.1, humidity: 62, temp: 78, notes: 'Optimal vegetative growth' },
  { date: 'T-7', vpd: 1.3, humidity: 55, temp: 79, notes: 'Transition to flower' },
  {
    date: 'T-3',
    vpd: 1.5,
    humidity: 50,
    temp: 81,
    notes: 'Slight stress observed, increased transpiration',
  },
  {
    date: 'T-1',
    vpd: 1.6,
    humidity: 48,
    temp: 82,
    notes: 'Microclimate spiking, risk of abiotic stress',
  },
];

export function CopilotTerminal() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [entries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;

    const newEntry: LedgerEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
      input: inputValue,
      response: null,
      status: 'pending',
    };

    setEntries((prev) => [...prev, newEntry]);
    setInputValue('');
    setIsProcessing(true);

    try {
      const data = await apiPost<CopilotResponse>('/api/copilot', {
        input: newEntry.input,
        history: MOCK_HISTORY,
      });

      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === newEntry.id ? { ...entry, status: 'complete', response: data } : entry,
        ),
      );
    } catch (err: any) {
      const message =
        err instanceof ApiError ? err.message : (err?.message ?? 'Failed to process request');
      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === newEntry.id ? { ...entry, status: 'error', error: message } : entry,
        ),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full border border-brand-border bg-brand-bg font-mono text-[10px] uppercase tracking-widest relative">
      <div className="flex items-center justify-between p-2 lg:p-3 border-b border-brand-border bg-brand-surface sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-zinc-500" />
          <span className="font-bold text-zinc-300">Phase.6 // Predictive Ledger</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-status-optimal animate-pulse"></span>
          <span className="text-zinc-500 text-[9px]">Sys_Online</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-4 min-h-[300px] max-h-[500px]">
        <div className="border border-brand-border bg-brand-surface/30 p-3 text-zinc-500">
          <span className="text-status-optimal block mb-1">
            LOG INIT: {new Date().toISOString()}
          </span>
          <span className="block">Longitudinal Context Loaded: 14-Day Vector</span>
          <span className="block mt-2">Awaiting operator manual override or predictive query.</span>
          <span className="block text-zinc-600 mt-1">
            Try: "Increase temp to 85F and raise humidity to 60%"
          </span>
        </div>

        <AnimatePresence initial={false}>
          {entries.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-2"
            >
              {/* User Input Block */}
              <div className="flex gap-2 text-zinc-300 bg-brand-surface/10 p-2 border border-brand-border/50">
                <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                <span className="font-bold">&gt; {entry.input}</span>
              </div>

              {/* Copilot Response Block */}
              {entry.status === 'pending' && (
                <div className="flex items-center gap-2 text-status-warning p-2 border border-brand-border/30 bg-status-warning/5">
                  <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                  <span className="text-[9px] blink">Cross-referencing longitudinal arrays...</span>
                </div>
              )}

              {entry.status === 'error' && (
                <div className="text-status-error p-2 border border-status-error/30 bg-status-error/10">
                  ERR_SYS: {entry.error}
                </div>
              )}

              {entry.status === 'complete' && entry.response && (
                <div
                  className={`p-3 border ${
                    entry.response.type === 'CRITICAL_CORRECTION'
                      ? 'border-status-error bg-status-error/10'
                      : 'border-status-optimal/50 bg-status-optimal/5'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-zinc-800">
                    {entry.response.type === 'CRITICAL_CORRECTION' ? (
                      <ShieldAlert className="w-4 h-4 text-status-error shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-status-optimal shrink-0" />
                    )}

                    <span
                      className={`font-bold ${entry.response.type === 'CRITICAL_CORRECTION' ? 'text-status-error' : 'text-status-optimal'}`}
                    >
                      {entry.response.title}
                    </span>
                  </div>

                  <p
                    className={`normal-case tracking-normal mb-3 leading-relaxed ${
                      entry.response.type === 'CRITICAL_CORRECTION'
                        ? 'text-status-error/90'
                        : 'text-zinc-300'
                    }`}
                  >
                    {entry.response.message}
                  </p>

                  {entry.response.metrics_impact && entry.response.metrics_impact.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[9px] text-zinc-500 block mb-1 border-b border-zinc-800 pb-1">
                        Delta Impact Forecast:
                      </span>
                      {entry.response.metrics_impact.map((metric, i) => (
                        <div key={i} className="flex items-center gap-2 text-zinc-400">
                          <Activity className="w-3 h-3 text-zinc-600" />
                          <span>{metric}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      <div className="p-2 border-t border-brand-border bg-brand-surface">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="[ ENTER DIRECTIVE ]"
            className="flex-1 bg-brand-bg border border-brand-border px-3 py-2 text-zinc-200 outline-none focus:border-status-optimal transition-colors placeholder:text-zinc-700 font-bold"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={isProcessing || !inputValue.trim()}
            className="border border-brand-border bg-brand-bg px-4 py-2 hover:bg-zinc-800 hover:text-zinc-300 text-zinc-500 font-bold transition-colors disabled:opacity-50"
          >
            EXEC
          </button>
        </form>
      </div>
    </div>
  );
}
