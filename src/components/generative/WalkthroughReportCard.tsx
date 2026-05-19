import React, { useState } from 'react';
import { Video, AlertTriangle, Check, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface WalkthroughData {
  summary: string;
  anomalies?: string[];
  plants_identified?: number;
  actions_required?: string[];
  analysisResults?: {
    overallHealthScore?: number;
    findings?: {
      category?: string;
      severity?: string;
      confidence?: number;
      title?: string;
      recommendation?: string;
    }[];
  };
}

export function WalkthroughReportCard({ data, mediaUrl, onApprove }: { data: WalkthroughData, mediaUrl?: string, onApprove?: () => void }) {
  const [approved, setApproved] = useState(false);


  return (
    <div className="bg-[#09090b] border border-[#27272a] p-4 font-mono text-xs text-zinc-300 w-full rounded">
       <div className="flex items-center justify-between border-b border-[#27272a] pb-3 mb-4">
         <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-emerald-500" />
            <span className="uppercase tracking-widest font-bold">Botanist Walkthrough Report</span>
         </div>
         <span className="text-zinc-500 text-[10px]">VER: 2.1.0</span>
       </div>
       
       <div className="mb-4">
          <p className="text-zinc-400 mb-2">// SUMMARY</p>
          <div className="bg-[#09090b] p-3 border border-[#27272a] text-zinc-200">
             {data.summary || 'No summary available.'}
          </div>
       </div>

       {mediaUrl && (
         <div className="mb-4">
           <p className="text-zinc-500 uppercase tracking-widest text-[9px] mb-2">// CAPTURED KEYFRAME</p>
           <div className="border border-[#27272a] p-1 bg-[#111]">
             {mediaUrl.startsWith('data:video') ? (
                <video src={mediaUrl} className="w-full h-32 object-cover grayscale opacity-80" />
             ) : (
                <img src={mediaUrl} className="w-full h-32 object-cover grayscale opacity-80" alt="Walkthrough frame" />
             )}
           </div>
         </div>
       )}
       
       <div className="grid grid-cols-2 gap-4 mb-4">
         <div className="border border-[#27272a] flex flex-col items-center justify-center py-4">
            <p className="text-zinc-500 uppercase tracking-widest text-[9px] mb-2">Plants Identified</p>
            <div className="text-xl text-emerald-400 font-bold">{data.plants_identified ?? 0}</div>
         </div>
         <div className="border border-[#27272a] flex flex-col items-center justify-center py-4">
            <p className="text-zinc-500 uppercase tracking-widest text-[9px] mb-2">Anomalies Detected</p>
            <div className={`text-xl font-bold ${data.anomalies && data.anomalies.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
               {data.anomalies ? data.anomalies.length : 0}
            </div>
         </div>
       </div>

       {data.anomalies && data.anomalies.length > 0 && (
         <div className="mb-4">
            <p className="text-zinc-400 mb-2">// DETECTED ANOMALIES</p>
            <div className="space-y-2">
               {data.anomalies.map((anom, i) => (
                  <div key={i} className="flex flex-col gap-1 bg-[#1a0f0f] border border-red-900/30 p-2 text-red-200/80">
                     <div className="flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                        <span>{anom}</span>
                     </div>
                  </div>
               ))}
            </div>
         </div>
       )}

       {data.actions_required && data.actions_required.length > 0 && (
          <div className="mb-4">
             <p className="text-zinc-400 mb-2">// REQUIRED ACTIONS</p>
             <div className="space-y-2">
               {data.actions_required.map((act, i) => (
                  <div key={i} className="flex items-center justify-between bg-zinc-900 border border-[#27272a] p-2 hover:bg-zinc-800 transition-colors">
                     <span className="text-zinc-300">{act}</span>
                     <button className="text-[9px] uppercase tracking-widest text-zinc-500 hover:text-emerald-400 transition-colors px-2 py-1">
                       [ QUEUE ]
                     </button>
                  </div>
               ))}
             </div>
          </div>
       )}

       {data.analysisResults && (
          <div className="mb-4">
             <p className="text-zinc-500 uppercase tracking-widest text-[9px] mb-2">// DETAILED AI ANALYSIS</p>
             <div className="border border-[#27272a] bg-[#111] p-3 mb-2 flex items-center justify-between">
                <span className="text-zinc-400 uppercase tracking-widest text-[10px]">Overall Health Score</span>
                <span className={`text-xl font-bold ${
                  (data.analysisResults.overallHealthScore || 0) > 85 ? 'text-emerald-400' : 
                  (data.analysisResults.overallHealthScore || 0) > 65 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {data.analysisResults.overallHealthScore || '--'}
                </span>
             </div>
             
             {data.analysisResults.findings && data.analysisResults.findings.length > 0 && (
               <div className="space-y-2">
                 {data.analysisResults.findings.map((finding, idx) => (
                   <div key={idx} className="bg-[#09090b] border border-[#27272a] p-3">
                     <div className="flex items-center justify-between mb-2">
                       <span className="text-zinc-300 font-bold">{finding.title}</span>
                       <span className={`text-[9px] uppercase tracking-widest px-2 py-0.5 border ${
                         finding.severity?.toLowerCase() === 'high' ? 'border-red-500/30 text-red-400' :
                         finding.severity?.toLowerCase() === 'medium' ? 'border-yellow-500/30 text-yellow-400' :
                         'border-emerald-500/30 text-emerald-400'
                       }`}>
                         {finding.severity || 'Unknown'} SEV
                       </span>
                     </div>
                     <div className="flex items-center gap-2 text-zinc-500 text-[10px] uppercase tracking-widest mb-2 border-b border-[#27272a] pb-2">
                       <span>{finding.category || 'General'}</span>
                       <span>•</span>
                       <span>{(finding.confidence ? finding.confidence * 100 : 0).toFixed(0)}% CONFIDENCE</span>
                     </div>
                     {finding.recommendation && (
                       <div className="text-zinc-400 text-xs mt-2">
                         <span className="text-amber-500/70 mr-1">RCD:</span>
                         {finding.recommendation}
                       </div>
                     )}
                   </div>
                 ))}
               </div>
             )}
          </div>
       )}
       
       <div className="flex justify-end pt-2 border-t border-[#27272a]">
          {!approved ? (
            <button 
               onClick={() => {
                 setApproved(true);
                 if (onApprove) onApprove();
               }}
               className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 px-4 py-2 uppercase tracking-widest text-[10px] transition-colors rounded">
               <Check className="w-3 h-3" />
               Acknowledge Report
            </button>
          ) : (
             <span className="text-emerald-500 text-[10px] uppercase tracking-widest font-bold">REPORT ACKNOWLEDGED</span>
          )}
       </div>
    </div>
  );
}
