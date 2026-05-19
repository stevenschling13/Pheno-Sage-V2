import React, { useState } from 'react';
import { BookOpen, FileText, Download, Printer } from 'lucide-react';

interface ExportData {
  preview_title?: string;
  run_id?: string;
  date_range?: string;
  total_entries?: number;
  strains_included?: string[];
}

export function LedgerExportCard({ data, onGenerate }: { data: ExportData, onGenerate: () => void }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    setExporting(true);
    // Simulate generation delay, then trigger actual print/export logic
    setTimeout(() => {
      setExporting(false);
      onGenerate();
    }, 1200);
  };

  return (
    <div className="bg-[#09090b] border border-[#27272a] p-4 font-mono text-xs text-zinc-300 w-full rounded">
      <div className="flex items-center justify-between border-b border-[#27272a] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-500" />
          <span className="uppercase tracking-widest font-bold">Compiler Agent // Ledger Export</span>
        </div>
      </div>

      <div className="border border-[#27272a] bg-[#111] p-4 flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-3 border-b border-[#27272a] pb-3">
           <FileText className="w-8 h-8 text-emerald-400/50" />
           <div>
              <div className="text-zinc-100 font-bold uppercase tracking-widest text-sm">{data.preview_title || 'GROW RUN JOURNAL'}</div>
              <div className="text-zinc-500 text-[10px] mt-1 uppercase">ID: {data.run_id || 'UNKNOWN_RUN'}</div>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div>
              <span className="text-zinc-500 uppercase tracking-widest text-[9px] block mb-1">Date Range</span>
              <span className="text-zinc-300">{data.date_range || '--/--/---- to --/--/----'}</span>
           </div>
           <div>
              <span className="text-zinc-500 uppercase tracking-widest text-[9px] block mb-1">Total Entries</span>
              <span className="text-zinc-300">{data.total_entries || 0} LOGGED EVENTS</span>
           </div>
           <div className="col-span-2">
              <span className="text-zinc-500 uppercase tracking-widest text-[9px] block mb-1">Strains Included</span>
              <div className="flex flex-wrap gap-2 mt-1">
                 {(data.strains_included || []).map((strain, i) => (
                    <span key={i} className="text-[10px] bg-[#1a1a1a] border border-[#27272a] px-2 py-1 text-emerald-300">
                       {strain}
                    </span>
                 ))}
                 {(!data.strains_included || data.strains_included.length === 0) && (
                    <span className="text-[10px] text-zinc-500">No strains specified</span>
                 )}
              </div>
           </div>
        </div>
      </div>

      <div className="flex justify-end pt-2 border-t border-[#27272a]">
        <button 
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 px-4 py-2 uppercase tracking-widest text-[10px] transition-colors rounded disabled:opacity-50"
        >
          {exporting ? (
             <span className="animate-pulse flex items-center gap-2">
                Compiling...
             </span>
          ) : (
             <>
                <Printer className="w-3 h-3" />
                Generate PDF Journal
             </>
          )}
        </button>
      </div>
    </div>
  );
}
