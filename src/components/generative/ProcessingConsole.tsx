import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Terminal } from 'lucide-react';

const genericLogs = [
  '[SYS] Media payload ingested. Initializing Multi-Agent analysis pipeline...',
  '[SYS] Routing to appropriate agent (Botanist/Environment)...',
  '[SYS] Extracting visual/textual features...',
  '[SYS] Cross-referencing findings with longitudinal vectors...',
  '[AGENTS] Constructing component trigger...',
  '[SYS] Finalizing generative UI response...',
];

export function ProcessingConsole() {
  const [logs, setLogs] = useState<string[]>([]);
  const [dots, setDots] = useState('');

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < genericLogs.length) {
        setLogs((prev) => [...prev, genericLogs[index]]);
        index++;
      }
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);
    return () => clearInterval(dotInterval);
  }, []);

  return (
    <div className="w-full bg-[#09090b] border border-[#27272a] rounded p-4 font-mono text-xs text-zinc-400">
      <div className="flex items-center gap-2 mb-3 text-zinc-500 border-b border-[#27272a] pb-2">
        <Terminal className="w-4 h-4 text-emerald-500" />
        <span className="uppercase tracking-widest text-[10px] text-emerald-500">
          System Processing
        </span>
      </div>
      <div className="space-y-1">
        {logs.map((log, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`
              ${log.includes('[SYS]') ? 'text-zinc-500' : ''}
              ${log.includes('[AGENTS]') ? 'text-sky-400' : ''}
            `}
          >
            {log}
          </motion.div>
        ))}
        <motion.div
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-emerald-500 mt-2"
        >
          {logs.length === 0 ? 'Evaluating payload' : 'Awaiting orchestrator response'}
          {dots}
        </motion.div>
      </div>
    </div>
  );
}
