import React, { useState } from 'react';
import { Scissors, Activity, BarChart, Check, X } from 'lucide-react';

interface HarvestData {
  pheno_score?: string;
  yield_estimate?: string;
  canopy_evaluation?: string;
  strain_baseline_comparison?: string;
  status?: string;
}

export function HarvestYieldForecastCard({ data, onApprove }: { data: HarvestData, onApprove?: () => void }) {
  const [approved, setApproved] = useState(false);
  const [discarded, setDiscarded] = useState(false);

  if (discarded) return null;

  const scoreColor = 
    data.pheno_score === 'S' || data.pheno_score === 'S-Tier' ? 'text-yellow-400 border-yellow-400/50 bg-yellow-400/10' :
    data.pheno_score === 'A' ? 'text-emerald-400 border-emerald-400/50 bg-emerald-400/10' :
    data.pheno_score === 'B' ? 'text-blue-400 border-blue-400/50 bg-blue-400/10' :
    'text-zinc-400 border-zinc-400/50 bg-zinc-400/10';

  return (
    <div className="bg-[#09090b] border border-[#27272a] p-4 font-mono text-xs text-zinc-300 w-full rounded">
      <div className="flex items-center justify-between border-b border-[#27272a] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Scissors className="w-4 h-4 text-amber-500" />
          <span className="uppercase tracking-widest font-bold">Harvest & Yield Forecast</span>
        </div>
        <span className={`text-zinc-500 text-[10px] uppercase font-bold px-2 py-1 border ${approved ? 'border-amber-500/30 text-amber-400' : 'border-[#27272a]'}`}>
          {approved ? 'COMMITTED' : (data.status || 'PENDING APPROVAL')}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className={`col-span-1 border p-4 flex flex-col items-center justify-center ${scoreColor}`}>
           <span className="text-[10px] uppercase tracking-widest opacity-70 mb-2">Pheno-Score</span>
           <div className="text-4xl font-bold">{data.pheno_score || '--'}</div>
        </div>
        
        <div className="col-span-2 border border-[#27272a] p-4 flex flex-col justify-center bg-[#111]">
           <span className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Est. Dry Yield</span>
           <div className="text-2xl text-zinc-100 font-bold mb-1">{data.yield_estimate || '--'}</div>
           <div className="text-xs text-zinc-400 border-t border-[#27272a] pt-2 mt-2">
             <span className="text-amber-500/70 mr-2">Δ Baseline:</span>
             {data.strain_baseline_comparison || 'N/A'}
           </div>
        </div>
      </div>

      <div className="border border-[#27272a] bg-[#09090b] p-3 mb-6">
        <div className="flex items-center gap-2 text-zinc-500 uppercase tracking-widest text-[9px] mb-2 border-b border-[#27272a] pb-2">
           <Activity className="w-3 h-3" /> Historical Canopy Evaluation
        </div>
        <div className="text-zinc-300 leading-relaxed">
           {data.canopy_evaluation || 'Insufficient longitudinal data to perform accurate architectural breakdown.'}
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
            className="flex items-center gap-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 px-4 py-2 uppercase tracking-widest text-[10px] transition-colors rounded"
          >
            <Check className="w-3 h-3" />
            Commit to Ledger
          </button>
        </div>
      )}
    </div>
  );
}
