import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Activity, 
  Thermometer, 
  Droplets,
  Wind,
  Leaf,
  Database,
  Target,
  Loader2,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { getPlantById, getPlantMedia } from '../services/firestoreService';
import { analyzePlantMedia } from '../services/analysisService';
import { Plant, MediaAsset } from '../types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

// Mock Telemetry Data for Phase 7
const MOCK_TELEMETRY = Array.from({ length: 14 }).map((_, i) => ({
  date: `T-${13 - i}`,
  vpd: 0.8 + Math.random() * 0.6,
  moisture: 40 + Math.random() * 20,
  ec: 1.2 + Math.random() * 0.4
}));

export default function PlantDetailPage() {
  const { growId, plantId } = useParams<{ growId: string, plantId: string }>();
  const { user } = useAuth();
  const [plant, setPlant] = useState<Plant | null>(null);
  const [media, setMedia] = useState<Array<MediaAsset & { url?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number, total: number } | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisSuccess, setAnalysisSuccess] = useState(false);

  const handleTriggerAnalysis = async () => {
    if (!plant || !user || media.length === 0) return;
    
    // Find the latest image
    const latestImageAsset = media.find(m => m.mediaType === 'image');
    if (!latestImageAsset) {
      setAnalysisError("NO VISUAL ASSET FOUND IN INDEX.");
      return;
    }

    try {
      setIsAnalyzing(true);
      setAnalysisError(null);
      setAnalysisSuccess(false);

      await analyzePlantMedia(
        user.uid,
        plant.growId,
        plant.id,
        latestImageAsset.id,
        latestImageAsset.storagePath,
        latestImageAsset.mediaType
      );
      
      setAnalysisSuccess(true);
      setTimeout(() => setAnalysisSuccess(false), 3000);
    } catch (e: any) {
      console.error(e);
      setAnalysisError(e.message || "ANALYSIS PIPELINE FAILURE.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBatchAnalysis = async () => {
    if (!plant || !user || media.length === 0) return;
    
    const imageAssets = media.filter(m => m.mediaType === 'image');
    if (imageAssets.length === 0) {
      setAnalysisError("NO VISUAL ASSETS FOUND IN INDEX.");
      return;
    }

    try {
      setIsBatchAnalyzing(true);
      setAnalysisError(null);
      setAnalysisSuccess(false);
      setBatchProgress({ current: 0, total: imageAssets.length });

      // Run sequentially to avoid rate limits / overwhelming the model
      for (let i = 0; i < imageAssets.length; i++) {
        const asset = imageAssets[i];
        await analyzePlantMedia(
          user.uid,
          plant.growId,
          plant.id,
          asset.id,
          asset.storagePath,
          asset.mediaType
        );
        setBatchProgress({ current: i + 1, total: imageAssets.length });
      }
      
      setAnalysisSuccess(true);
      setTimeout(() => setAnalysisSuccess(false), 3000);
    } catch (e: any) {
      console.error(e);
      setAnalysisError(e.message || "BATCH ANALYSIS PIPELINE FAILURE.");
    } finally {
      setIsBatchAnalyzing(false);
      setTimeout(() => setBatchProgress(null), 3000);
    }
  };

  useEffect(() => {
    async function fetchData() {
      if (!plantId || !growId) return;
      try {
        setLoading(true);
        const [p, m] = await Promise.all([
          getPlantById(plantId),
          getPlantMedia(plantId)
        ]);
        
        let hydratedMedia: Array<MediaAsset & { url?: string }> = [];
        if (m && m.length > 0) {
          const { getMediaBlobUrl } = await import('../services/mediaService');
          hydratedMedia = await Promise.all(m.map(async (asset: MediaAsset) => {
            try {
              if (asset.mediaType === 'image' || asset.mediaType === 'video') {
                const url = await getMediaBlobUrl(asset.storagePath);
                return { ...asset, url };
              }
              return asset;
            } catch (e) {
              console.warn(`Failed URL hydrate ${asset.id}`, e);
              return asset;
            }
          }));
        }

        setPlant(p || null);
        setMedia(hydratedMedia);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [plantId, growId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Activity className="w-5 h-5 text-status-optimal animate-pulse" />
      </div>
    );
  }

  if (!plant) {
    return <div className="p-4 text-status-error font-mono">ASSET_NOT_FOUND</div>;
  }

  return (
    <div className="space-y-6 pb-24">
      <nav className="flex items-center justify-between border-b border-brand-border pb-4">
        <Link 
          to={`/grows/${growId}`} 
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors data-label"
        >
          <ArrowLeft className="w-3 h-3" /> System Uplink
        </Link>
        <span className="text-[10px] font-mono text-status-optimal bg-status-optimal/10 border border-status-optimal/30 px-2 py-1 uppercase tracking-widest">
          Phase.7 // Telemetry View
        </span>
      </nav>

      <div className="border border-brand-border bg-brand-surface p-6 font-mono text-zinc-100 flex justify-between items-end">
        <div>
           <div className="flex items-center gap-2 mb-2">
             <Leaf className="w-4 h-4 text-status-optimal" />
             <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Plant Asset Record</span>
           </div>
           <h1 className="text-2xl uppercase tracking-tighter">{plant.name}</h1>
           <p className="data-label mt-1">Cultivar: {plant.strain}</p>
        </div>
        <div className="text-right">
           <div className="text-[10px] uppercase text-zinc-500 tracking-widest mb-1">Asset ID</div>
           <div className="text-xs text-zinc-400">{plant.id.split('-')[0]}</div>
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 items-start">
        <div className="order-2 lg:order-1 lg:col-span-2 space-y-6 w-full">
          <div className="border border-brand-border bg-brand-surface/20">
             <div className="flex items-center justify-between border-b border-brand-border bg-brand-bg p-3">
               <div className="flex items-center gap-2">
                 <Activity className="w-4 h-4 text-zinc-500" />
                 <span className="data-label text-zinc-300">Longitudinal Array (14D)</span>
               </div>
               <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest font-mono">
                 <button className="px-2 py-1 bg-brand-surface border border-brand-border text-zinc-300 hover:text-status-optimal transition-colors">[ VPD ]</button>
                 <button className="px-2 py-1 bg-brand-bg border border-brand-border text-zinc-500 hover:text-zinc-300 transition-colors">[ EC ]</button>
                 <button className="px-2 py-1 bg-brand-bg border border-brand-border text-zinc-500 hover:text-zinc-300 transition-colors">[ H2O ]</button>
               </div>
             </div>
             
             {/* Chart Overlay Metrics */}
             <div className="grid grid-cols-4 gap-px bg-brand-border border-b border-brand-border">
               <div className="bg-[#050505] p-2 flex flex-col justify-center">
                 <div className="text-[8px] text-zinc-500 uppercase tracking-widest">Target Trend</div>
                 <div className="text-xs text-status-optimal font-bold font-mono">1.20 - 1.40</div>
               </div>
               <div className="bg-[#050505] p-2 flex flex-col justify-center">
                 <div className="text-[8px] text-zinc-500 uppercase tracking-widest">7D Avg</div>
                 <div className="text-xs text-zinc-200 font-bold font-mono">1.25</div>
               </div>
               <div className="bg-[#050505] p-2 flex flex-col justify-center">
                 <div className="text-[8px] text-zinc-500 uppercase tracking-widest">Variance</div>
                 <div className="text-xs text-status-warning font-bold font-mono">+0.15</div>
               </div>
               <div className="bg-[#050505] p-2 flex flex-col justify-center">
                 <div className="text-[8px] text-zinc-500 uppercase tracking-widest">Array Status</div>
                 <div className="text-xs text-status-optimal font-bold font-mono">STABLE</div>
               </div>
             </div>

             <div className="p-4 bg-brand-bg h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MOCK_TELEMETRY} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="date" stroke="#52525b" fontSize={10} tickMargin={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="#52525b" fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip 
                      isAnimationActive={false}
                      contentStyle={{ backgroundColor: '#09090b', borderColor: '#52525b', borderRadius: '0', fontSize: '10px', textTransform: 'uppercase', padding: '8px', color: '#a1a1aa' }}
                      itemStyle={{ color: '#10b981', padding: '0', margin: '0' }}
                      cursor={{ stroke: '#52525b', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Area type="stepAfter" dataKey="vpd" stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.1} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
             
             {/* Analysis Trigger Bar */}
             <div className="border-t border-brand-border p-3 bg-[#050505] flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <button
                     onClick={handleTriggerAnalysis}
                     disabled={isAnalyzing || isBatchAnalyzing || !media.find(m => m.mediaType === 'image')}
                     className="text-[10px] font-mono border border-status-optimal text-status-optimal hover:bg-status-optimal hover:text-brand-bg px-3 py-1.5 uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                   >
                     {isAnalyzing ? (
                       <><Loader2 className="w-3 h-3 animate-spin" /> EXECUTING...</>
                     ) : (
                       '[ Trigger Analysis ]'
                     )}
                   </button>
                   <button
                     onClick={handleBatchAnalysis}
                     disabled={isAnalyzing || isBatchAnalyzing || !media.find(m => m.mediaType === 'image')}
                     className="text-[10px] font-mono border border-zinc-600 text-zinc-300 hover:bg-zinc-800 hover:text-white px-3 py-1.5 uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hidden sm:flex"
                   >
                     {isBatchAnalyzing ? (
                       <><Loader2 className="w-3 h-3 animate-spin" /> BATCH ({batchProgress?.current}/{batchProgress?.total})</>
                     ) : (
                       '[ Run Batch Analysis ]'
                     )}
                   </button>
                   {analysisError && (
                     <div className="flex items-center gap-1.5 text-[9px] text-status-error uppercase tracking-widest">
                       <AlertTriangle className="w-3 h-3" /> {analysisError}
                     </div>
                   )}
                   {analysisSuccess && (
                     <div className="flex items-center gap-1.5 text-[9px] text-status-optimal uppercase tracking-widest blink">
                       <CheckCircle2 className="w-3 h-3" /> DISPATCH SUCCESS
                     </div>
                   )}
                </div>
                <div className="text-[9px] uppercase text-zinc-600 tracking-widest hidden md:block">Diagnostic Pipeline Control</div>
             </div>
          </div>

          <div className="border border-brand-border bg-brand-surface/20">
             <div className="flex items-center gap-2 border-b border-brand-border bg-brand-bg p-3">
               <Database className="w-4 h-4 text-zinc-500" />
               <span className="data-label text-zinc-300">Phase.4 Visual Cache History</span>
             </div>
             <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 bg-brand-bg">
                {media.filter(m => m.mediaType === 'image').length === 0 ? (
                  <div className="col-span-full py-8 text-center text-[10px] font-mono text-zinc-500 uppercase tracking-widest border border-dashed border-zinc-800">
                     Null Image Vector
                  </div>
                ) : (
                  media.filter(m => m.mediaType === 'image').map(item => (
                    <div key={item.id} className="aspect-square bg-zinc-900 border border-brand-border relative overflow-hidden group">
                       {item.url ? (
                          <img src={item.url} alt="Plant" className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all opacity-70 group-hover:opacity-100" referrerPolicy="no-referrer" />
                       ) : (
                          <div className="w-full h-full flex items-center justify-center border border-dashed border-zinc-800 text-zinc-700">
                             <Loader2 className="w-4 h-4 animate-spin" />
                          </div>
                       )}
                       <div className="absolute top-1 right-1 bg-black/60 px-1 py-0.5 text-[8px] text-zinc-300 uppercase tracking-widest border border-zinc-700/50 backdrop-blur-md">
                          {item.createdAt ? (
                             (item.createdAt as any)?.seconds 
                                ? new Date((item.createdAt as any).seconds * 1000).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })
                                : new Date(item.createdAt as any).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })
                          ) : ''}
                       </div>
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>

        <div className="order-1 lg:order-2 lg:col-span-1 space-y-6 lg:sticky lg:top-6 h-fit w-full">
          <div className="border border-brand-border bg-brand-bg flex flex-col font-mono text-[10px] uppercase tracking-widest text-zinc-400 shadow-md">
             <div className="flex items-center justify-between p-3 border-b border-brand-border bg-brand-surface/50">
               <div className="flex items-center gap-2 text-zinc-300 font-bold">
                 <Activity className="w-3.5 h-3.5 text-status-optimal" />
                 Live Telemetry Array
               </div>
               <div className="text-[8px] text-status-optimal blink border border-status-optimal/30 bg-status-optimal/10 px-1.5 py-0.5">
                 ONLINE
               </div>
             </div>
             
             <div className="grid grid-cols-2 gap-px bg-brand-border">
                <div className="bg-[#050505] p-3 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-[8px] text-zinc-600 mb-0.5">
                    <Wind className="w-2.5 h-2.5" /> VPD <span className="text-status-optimal">(kpa)</span>
                  </div>
                  <span className="text-lg font-bold font-mono text-zinc-200">1.25</span>
                </div>
                <div className="bg-[#050505] p-3 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-[8px] text-zinc-600 mb-0.5">
                    <Thermometer className="w-2.5 h-2.5" /> EC <span className="text-status-optimal">(mS/cm)</span>
                  </div>
                  <span className="text-lg font-bold font-mono text-zinc-200">1.40</span>
                </div>
                <div className="bg-[#050505] p-3 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-[8px] text-zinc-600 mb-0.5">
                    <Droplets className="w-2.5 h-2.5" /> Substrate <span className="text-status-optimal">(%)</span>
                  </div>
                  <span className="text-lg font-bold font-mono text-zinc-200">48.2</span>
                </div>
                <div className="bg-[#050505] p-3 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-[8px] text-zinc-600 mb-0.5">
                    <Activity className="w-2.5 h-2.5" /> State
                  </div>
                  <span className="text-lg font-bold font-mono text-status-optimal">NOMINAL</span>
                </div>
             </div>
          </div>

          <div className="border border-brand-border p-4 bg-brand-surface shadow-md">
            <h3 className="data-label border-b border-brand-border pb-2 mb-3 !text-zinc-300">Diagnostic Pipeline</h3>
            <div className="space-y-2">
               <div className="bg-brand-bg border border-zinc-800 p-3 flex gap-3 text-xs font-mono items-center">
                  <div className="w-1.5 h-1.5 bg-status-optimal rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  <div className="text-zinc-400">Canopy Volume</div>
                  <div className="ml-auto text-zinc-100">Nominal</div>
               </div>
               <div className="bg-brand-bg border border-zinc-800 p-3 flex gap-3 text-xs font-mono items-center">
                  <div className="w-1.5 h-1.5 bg-status-optimal rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  <div className="text-zinc-400">Nutrient Burn</div>
                  <div className="ml-auto text-zinc-100">None</div>
               </div>
               <div className="bg-status-warning/10 border border-status-warning/20 p-3 flex gap-3 text-xs font-mono items-center">
                  <div className="w-1.5 h-1.5 bg-status-warning rounded-full shadow-[0_0_8px_rgba(234,179,8,0.5)] animate-pulse"></div>
                  <div className="text-status-warning">VPD Stress</div>
                  <div className="ml-auto font-bold text-status-warning">Mild</div>
               </div>
            </div>
          </div>
          
          <div className="border border-brand-border p-4 bg-brand-bg text-[10px] font-mono text-zinc-400 leading-relaxed uppercase tracking-widest">
            <Target className="w-4 h-4 mb-2 text-zinc-600" />
            Phase 7 integrates automated hardware telemetry with longitudinal visual arrays to predict cultivation drift before critical mass.
          </div>
        </div>
      </div>
    </div>
  );
}
