import React, { useState } from 'react';
import { Camera, Check, X, Target, Loader2 } from 'lucide-react';

interface OcrData {
  temperature?: number;
  humidity?: number;
  target_temperature?: number;
  target_humidity?: number;
  device_type?: string;
  status?: string;
}

export function OcrCaptureCard({ data, mediaUrl, onApprove }: { data: OcrData, mediaUrl?: string, onApprove?: () => void }) {
  const [approved, setApproved] = useState(false);
  const [discarded, setDiscarded] = useState(false);

  if (discarded) return null;

  return (
    <div className="bg-[#09090b] border border-[#27272a] p-4 font-mono text-xs text-zinc-300 w-full rounded">
       <div className="flex items-center justify-between border-b border-[#27272a] pb-3 mb-4">
         <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-blue-400" />
            <span className="uppercase tracking-widest font-bold">Physical Telemetry OCR</span>
         </div>
         <span className={`text-zinc-500 text-[10px] uppercase font-bold px-2 py-1 border ${approved ? 'border-emerald-500/30 text-emerald-400' : 'border-[#27272a]'}`}>
            {approved ? 'LOGGED' : (data.status || 'PENDING APPROVAL')}
         </span>
       </div>
       
       <div className="flex gap-4 mb-6">
          {mediaUrl && (
             <div className="w-1/3 border border-[#27272a] p-1 bg-[#1a1a1a] flex items-center justify-center">
                <img src={mediaUrl} className="w-full h-auto object-cover grayscale opacity-90 mix-blend-screen" alt="Sensor crop" />
             </div>
          )}
          <div className={`grid grid-cols-2 gap-4 ${mediaUrl ? 'w-2/3' : 'w-full'}`}>
             <div className="border border-[#27272a] p-3 flex flex-col justify-center items-center py-6 relative overflow-hidden">
                <span className="text-zinc-500 uppercase tracking-widest text-[9px] mb-2 z-10">Extracted Temp</span>
                <div className="text-3xl text-zinc-100 font-bold z-10">{data.temperature ?? '--'}°</div>
                {data.target_temperature && (
                  <div className="mt-2 text-[10px] text-zinc-500 z-10">
                    TARGET: <span className="text-blue-400">{data.target_temperature}°</span>
                    <span className="ml-2 text-zinc-600">
                      (Δ {(data.temperature && data.target_temperature) ? (data.temperature - data.target_temperature).toFixed(1) : '--'}°)
                    </span>
                  </div>
                )}
             </div>
             <div className="border border-[#27272a] p-3 flex flex-col justify-center items-center py-6 relative overflow-hidden">
                <span className="text-zinc-500 uppercase tracking-widest text-[9px] mb-2 z-10">Extracted RH</span>
                <div className="text-3xl text-zinc-100 font-bold z-10">{data.humidity ?? '--'}%</div>
                {data.target_humidity && (
                  <div className="mt-2 text-[10px] text-zinc-500 z-10">
                    TARGET: <span className="text-blue-400">{data.target_humidity}%</span>
                    <span className="ml-2 text-zinc-600">
                      (Δ {(data.humidity && data.target_humidity) ? (data.humidity - data.target_humidity).toFixed(1) : '--'}%)
                    </span>
                  </div>
                )}
             </div>
          </div>
       </div>

       <div className="flex items-center justify-between bg-[#1a1a1a] p-2 border border-[#27272a] mb-6">
          <div className="flex items-center gap-2 text-zinc-400 uppercase tracking-widest text-[9px]">
             <Target className="w-3 h-3 text-zinc-500" />
             <span>Device Type: {data.device_type || 'Unknown Digital Sensor'}</span>
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
               className="flex items-center gap-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 px-4 py-2 uppercase tracking-widest text-[10px] transition-colors rounded"
            >
               <Check className="w-3 h-3" />
               Approve & Log
            </button>
         </div>
       )}
    </div>
  );
}
