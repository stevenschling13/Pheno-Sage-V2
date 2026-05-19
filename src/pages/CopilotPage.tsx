import React from 'react';
import { CopilotTerminal } from '../components/copilot/TerminalCopilot';
import { motion } from 'motion/react';
import { Cpu } from 'lucide-react';

export default function CopilotPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-brand-surface border border-brand-border text-zinc-300">
          <Cpu className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold uppercase tracking-widest text-zinc-100">Predictive Ledger</h1>
          <p className="text-xs text-zinc-500 font-mono tracking-wider mt-1">Cross-referencing longitudinal vectors</p>
        </div>
      </div>
      
      <div className="flex-1 bg-brand-bg relative overflow-hidden">
        <CopilotTerminal />
      </div>
    </div>
  );
}
