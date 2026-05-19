import React, { useState } from 'react';
import { Dna, GitMerge, Check, X, Leaf, Target } from 'lucide-react';
import { motion } from 'motion/react';

interface LineageData {
  mother_id?: string;
  mother_traits?: string[];
  clone_count?: number;
  clone_reason?: string;
  lineage_generation?: string;
}

export function PhenotypeLineageCard({ data, onApprove }: { data: LineageData, onApprove?: () => void }) {
  const [approved, setApproved] = useState(false);
  const [discarded, setDiscarded] = useState(false);

  if (discarded) return null;

  return (
    <div className="bg-[#09090b] border border-[#27272a] p-4 font-mono text-xs text-zinc-300 w-full rounded">
      <div className="flex items-center justify-between border-b border-[#27272a] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Dna className="w-4 h-4 text-purple-500" />
          <span className="uppercase tracking-widest font-bold">Lineage Architecture</span>
        </div>
        <span className={`text-zinc-500 text-[10px] uppercase font-bold px-2 py-1 border ${approved ? 'border-purple-500/30 text-purple-400' : 'border-[#27272a]'}`}>
          {approved ? 'LOGGED' : 'PENDING APPROVAL'}
        </span>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        {/* Mother Plant Section */}
        <div className="border border-[#27272a] p-3 bg-[#111]">
          <div className="text-zinc-500 uppercase tracking-widest text-[9px] mb-3 flex items-center justify-between">
            <span>[ MOTHER SOURCE ]</span>
            <span>GEN: {data.lineage_generation || 'F1'}</span>
          </div>
          <div className="flex justify-between items-center mb-3">
             <div className="flex items-center gap-2 text-zinc-100 font-bold">
               <Leaf className="w-4 h-4 text-emerald-500" />
               {data.mother_id || 'UNKNOWN_MOTHER'}
             </div>
             <div className="text-xs text-zinc-400">
               {data.clone_reason || 'Propagating desirable traits'}
             </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
             {(data.mother_traits || ['Dense Canopy', 'High Terpene', 'Fast Rooting']).map((trait, i) => (
               <div key={i} className="text-[10px] bg-[#1a1a1a] border border-[#27272a] px-2 py-1 text-center text-purple-300 truncate">
                 {trait}
               </div>
             ))}
          </div>
        </div>

        {/* Evolutionary Tree / Offspring */}
        <div className="flex items-center justify-center -my-2 relative z-10">
          <div className="bg-[#09090b] px-2 text-zinc-600">
             <GitMerge className="w-4 h-4 rotate-180" />
          </div>
        </div>

        <div className="border border-purple-500/30 p-3 bg-purple-500/5">
          <div className="text-purple-500/70 uppercase tracking-widest text-[9px] mb-3">
            [ CLONE OFFSPRING ]
          </div>
          <div className="flex items-center justify-between">
            <div className="text-2xl text-purple-400 font-bold">
               {data.clone_count || 0} <span className="text-sm font-normal text-purple-500/50">CUTS TAKEN</span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(data.clone_count || 4, 12) }).map((_, i) => (
                 <div key={i} className="w-2 h-6 bg-purple-500/20 border border-purple-500/40" />
              ))}
              {(data.clone_count || 0) > 12 && <div className="text-[9px] text-zinc-500 ml-1 mt-auto">...</div>}
            </div>
          </div>
        </div>
      </div>

      {!approved && (
        <div className="flex justify-end gap-2 pt-2 border-t border-[#27272a]">
          <button 
            onClick={() => setDiscarded(true)}
            className="flex items-center gap-2 text-zinc-500 hover:text-red-400 border border-[#27272a] hover:border-red-500/30 px-3 py-2 uppercase tracking-widest text-[10px] transition-colors rounded"
          >
            <X className="w-3 h-3" />
            Discard
          </button>
          <button 
            onClick={() => {
               setApproved(true);
               if (onApprove) onApprove();
            }}
            className="flex items-center gap-2 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/30 px-4 py-2 uppercase tracking-widest text-[10px] transition-colors rounded"
          >
            <Check className="w-3 h-3" />
            Append to Lineage
          </button>
        </div>
      )}
    </div>
  );
}
