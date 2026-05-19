import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Send, Loader2 } from 'lucide-react';
import MorningBriefing from '../components/generative/MorningBriefing';
import GrowSetupCard from '../components/generative/GrowSetupCard';
import { ProcessingConsole } from '../components/generative/ProcessingConsole';
import { WalkthroughReportCard } from '../components/generative/WalkthroughReportCard';
import { OcrCaptureCard } from '../components/generative/OcrCaptureCard';
import { PhenotypeLineageCard } from '../components/generative/PhenotypeLineageCard';
import { HarvestYieldForecastCard } from '../components/generative/HarvestYieldForecastCard';
import { LedgerExportCard } from '../components/generative/LedgerExportCard';
import { PrintableGrowJournal } from '../components/print/PrintableGrowJournal';
import { createGrow, createPlant } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';
import { apiPost, ApiError } from '../lib/apiClient';

type FeedItem = {
  id: string;
  role: 'user' | 'agent';
  content?: string;
  componentType?: 'MORNING_BRIEFING' | 'GROW_SETUP' | 'WALKTHROUGH_REPORT' | 'OCR_CAPTURE' | 'PHENOTYPE_LINEAGE' | 'HARVEST_FORECAST' | 'LEDGER_EXPORT';
  data?: any;
  mediaUrl?: string;
};

export default function CommandConsole() {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [feed, setFeed] = useState<FeedItem[]>([
    {
      id: 'welcome',
      role: 'agent',
      content: 'System Initialized. Master Orchestrator online. Awaiting commands.',
    },
    {
      id: 'initial-setup-card',
      role: 'agent',
      componentType: 'GROW_SETUP',
      data: {
        strain: 'Blue Dream',
        quantity: 4,
        medium: 'Coco Coir',
        tent_size: '4x4',
        nutrient_line: 'Lotus Nutrients'
      }
    },
    {
      id: 'second-setup-card',
      role: 'agent',
      componentType: 'GROW_SETUP',
      data: {
        strain: 'Granddaddy Purple',
        quantity: 6,
        medium: 'Hydroponic',
        tent_size: '3x3',
        nutrient_line: 'Lotus Nutrients'
      }
    }
  ]);
  
  const feedEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [feed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userEntry = input.trim();
    setInput('');
    setIsProcessing(true);

    const newItemId = Date.now().toString();
    setFeed(prev => [...prev, { id: `u-${newItemId}`, role: 'user', content: userEntry }]);

    try {
      const rawResponse = await apiPost<any>('/api/orchestrator', { input: userEntry });
      const responseText = `[${rawResponse.agent} Agent] Processing request via ${rawResponse.component_type} sequence.`;

          setFeed(prev => [
        ...prev, 
        { 
          id: `a-${newItemId}`, 
          role: 'agent', 
          content: responseText,
          componentType: rawResponse.component_type as any,
          data: rawResponse.component_type === 'GROW_SETUP' ? rawResponse.setup_data : 
                rawResponse.component_type === 'OCR_CAPTURE' ? rawResponse.ocr_data :
                rawResponse.component_type === 'WALKTHROUGH_REPORT' ? rawResponse.walkthrough_data :
                rawResponse.component_type === 'PHENOTYPE_LINEAGE' ? rawResponse.lineage_data :
                rawResponse.component_type === 'HARVEST_FORECAST' ? rawResponse.harvest_data :
                rawResponse.component_type === 'LEDGER_EXPORT' ? rawResponse.export_data :
                rawResponse.briefing_data
        }
      ]);
    } catch (err: any) {
      console.error(err);
      const errorMsg =
        err instanceof ApiError
          ? `API Error: ${err.message}`
          : err instanceof Error
            ? err.message
            : 'ERR_CONNECTION_REFUSED: Failed to communicate with orchestrator.';

      setFeed(prev => [
        ...prev,
        { id: `err-${newItemId}`, role: 'agent', content: errorMsg }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprove = async (actionData: any) => {
    if (actionData?.strain) {
      try {
        if (!user) throw new Error("No user authenticated");
        setFeed(prev => [...prev, { id: `sys-${Date.now()}-1`, role: 'agent', content: 'Processing approval and provisioning databases...' }]);
        
        const grow = await createGrow(user.uid, {
          name: `${actionData.strain} Grow`,
          stage: 'Seedling',
          medium: actionData.medium || 'Unknown',
          startDate: new Date()
        });

        let count = actionData.quantity ? Number(actionData.quantity) : 1;
        if (isNaN(count)) count = 1;

        for (let i = 0; i < count; i++) {
           await createPlant(user.uid, grow.id, {
              name: `${actionData.strain} #${i+1}`,
              strain: actionData.strain
           });
        }

        setFeed(prev => [
         ...prev,
         {
           id: `sys-${Date.now()}-2`,
           role: 'agent',
           content: `Execution Approved. System initialized grow record [${grow.id}] with ${count} entities.`
         }
        ]);

      } catch (err) {
        console.error(err);
        setFeed(prev => [
           ...prev,
           { id: `err-${Date.now()}`, role: 'agent', content: `ERR_DB_WRITE: Failed to provision grow record.` }
        ]);
      }
    } else {
      setFeed(prev => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          role: 'agent',
          content: `Execution Approved. System updating record: ${JSON.stringify(actionData)}`
        }
      ]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (isProcessing) return;

    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
       setFeed(prev => [...prev, { id: `err-${Date.now()}`, role: 'agent', content: 'ERR_UNSUPPORTED_MEDIA: Please upload an image or video.' }]);
       return;
    }

    setIsProcessing(true);
    
    const newItemId = Date.now().toString();

    const reader = new FileReader();
    reader.onload = async (event) => {
       const dataUrl = event.target?.result as string;
       const base64Data = dataUrl.split(',')[1];

       setFeed(prev => [...prev, { id: `u-${newItemId}`, role: 'user', content: `[MEDIA INGEST: ${file.name}]`, mediaUrl: dataUrl }]);
       
       try {
           const rawResponse = await apiPost<any>('/api/orchestrator', {
               mediaBase64: base64Data,
               mimeType: file.type,
           });
           const responseText = `[${rawResponse.agent} Agent] Processing request via ${rawResponse.component_type} sequence.`;

           setFeed(prev => [
             ...prev, 
             { 
               id: `a-${newItemId}`, 
               role: 'agent', 
               content: responseText,
               componentType: rawResponse.component_type as any,
               data: rawResponse.component_type === 'GROW_SETUP' ? rawResponse.setup_data : 
                     rawResponse.component_type === 'OCR_CAPTURE' ? rawResponse.ocr_data :
                     rawResponse.component_type === 'WALKTHROUGH_REPORT' ? rawResponse.walkthrough_data :
                     rawResponse.component_type === 'PHENOTYPE_LINEAGE' ? rawResponse.lineage_data :
                     rawResponse.component_type === 'HARVEST_FORECAST' ? rawResponse.harvest_data :
                     rawResponse.component_type === 'LEDGER_EXPORT' ? rawResponse.export_data :
                     rawResponse.briefing_data,
               mediaUrl: dataUrl
             }
           ]);
       } catch (err: any) {
           setFeed(prev => [...prev, { id: `err-${newItemId}`, role: 'agent', content: err.message || "Failed to process media" }]);
       } finally {
           setIsProcessing(false);
       }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div 
      className={`flex flex-col h-[calc(100vh-8rem)] print:h-auto bg-[#09090b] print:bg-white rounded-none border print:border-none transition-colors overflow-hidden print:overflow-visible font-mono relative ${isDragging ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-zinc-800'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#09090b]/80 backdrop-blur-sm border-2 border-dashed border-emerald-500/50">
          <div className="text-emerald-500 text-lg uppercase tracking-widest font-bold font-mono">
            Drop Media to Initialize Walkthrough / OCR Pipeline
          </div>
        </div>
      )}
      {/* Feed Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 print:hidden">
        {feed.map((item) => (
          <div key={item.id} className={`flex flex-col ${item.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className="flex items-center gap-2 mb-2 text-xs uppercase tracking-wider text-zinc-500 font-mono">
              {item.role === 'user' ? (
                <>User <Terminal className="h-3 w-3" /></>
              ) : (
                <><Terminal className="h-3 w-3" /> System</>
              )}
            </div>
            
            {item.content && (
              <div className={`px-4 py-3 rounded-none max-w-2xl font-mono text-sm leading-relaxed ${
                item.role === 'user' 
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700' 
                  : 'text-zinc-400'
              }`}>
                {item.content}
              </div>
            )}
            
            {item.componentType === 'MORNING_BRIEFING' && item.data && (
              <div className="mt-4 w-full flex justify-start">
                 <MorningBriefing 
                   observations={item.data.observations || []} 
                   pendingApprovals={item.data.pending_approvals || []} 
                   onApprove={(appr) => handleApprove(appr)}
                 />
              </div>
            )}

            {item.componentType === 'GROW_SETUP' && item.data && (
              <div className="mt-4 w-full flex justify-start">
                 <GrowSetupCard 
                   initialData={item.data}
                   onApprove={(data) => handleApprove(data)}
                 />
              </div>
            )}

            {item.componentType === 'WALKTHROUGH_REPORT' && item.data && (
              <div className="mt-4 w-full flex justify-start">
                 <WalkthroughReportCard data={item.data} mediaUrl={item.mediaUrl} onApprove={() => handleApprove({ type: 'WALKTHROUGH_LOG', ...item.data })} />
              </div>
            )}

            {item.componentType === 'OCR_CAPTURE' && item.data && (
              <div className="mt-4 w-full flex justify-start">
                 <OcrCaptureCard data={item.data} mediaUrl={item.mediaUrl} onApprove={() => handleApprove({ type: 'OCR_LOG', ...item.data })} />
              </div>
            )}

            {item.componentType === 'PHENOTYPE_LINEAGE' && item.data && (
              <div className="mt-4 w-full flex justify-start">
                 <PhenotypeLineageCard data={item.data} onApprove={() => handleApprove({ type: 'LINEAGE_APPEND', ...item.data })} />
              </div>
            )}

            {item.componentType === 'HARVEST_FORECAST' && item.data && (
              <div className="mt-4 w-full flex justify-start">
                 <HarvestYieldForecastCard data={item.data} onApprove={() => handleApprove({ type: 'HARVEST_LOG', ...item.data })} />
              </div>
            )}

            {item.componentType === 'LEDGER_EXPORT' && item.data && (
              <div className="mt-4 w-full flex justify-start">
                 <LedgerExportCard data={item.data} onGenerate={() => window.print()} />
              </div>
            )}
          </div>
        ))}
        {isProcessing && (
           <div className="flex flex-col items-start w-full">
              <ProcessingConsole />
           </div>
        )}
        <div ref={feedEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-brand-border bg-brand-surface print:hidden">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <Terminal className="absolute left-4 h-5 w-5 text-zinc-500" />
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isProcessing}
            placeholder="Awaiting command... (e.g. 'Starting 4 Sour Diesel plants in a 4x4 tent with Fox Farm')"
            className="w-full bg-[#09090b] text-zinc-100 border border-zinc-800 rounded-none py-3 pl-12 pr-12 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 font-mono text-sm placeholder:text-zinc-600 transition-all disabled:opacity-50"
            autoFocus
          />
          <button 
            type="submit" 
            disabled={isProcessing || !input.trim()}
            className="absolute right-3 p-1.5 text-zinc-500 hover:text-zinc-300 disabled:opacity-50 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

      <div className="print-container print:block hidden print:relative bg-white text-black pb-8">
         <PrintableGrowJournal />
      </div>
    </div>
  );
}
