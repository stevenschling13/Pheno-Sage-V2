import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { MediaAsset } from '../../types';
import { analyzePlantMedia } from '../../services/analysisService';
import { Brain, FileImage, Loader2, Play, ChevronDown, ChevronUp, ExternalLink, Activity } from 'lucide-react';
import { getMediaBlobUrl } from '../../services/mediaService';
import { Link } from 'react-router-dom';

interface RecentMediaAnalysisWidgetProps {
  userId: string;
}

const AnalysisItem: React.FC<{ analysis: any }> = ({ analysis }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-brand-border bg-brand-surface/40 flex flex-col font-mono">
      <div 
        className="flex justify-between items-center cursor-pointer group p-3 border-b border-transparent hover:border-brand-border transition-colors hover:bg-brand-surface"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 bg-blue-500 animate-pulse"></div>
          <span className="text-[11px] uppercase text-blue-400 tracking-wider">HS: {analysis.overallHealthScore}/100</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] uppercase tracking-widest text-zinc-500">
            {analysis.createdAt ? new Date(analysis.createdAt.seconds * 1000).toLocaleDateString() : 'T:0'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-3 h-3 text-zinc-600 group-hover:text-zinc-300" />
          ) : (
            <ChevronDown className="w-3 h-3 text-zinc-600 group-hover:text-zinc-300" />
          )}
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-3 bg-brand-bg/50 space-y-4 border-t border-brand-border font-sans">
          {analysis.isFallback ? (
            <p className="text-[11px] text-zinc-400 italic">Fallback: {analysis.fallbackReason}</p>
          ) : (
            <>
              <div>
                <span className="data-label mb-2 block">Diagnostic Output</span>
                <ul className="space-y-1.5">
                  {analysis.diagnosticHypotheses?.slice(0, 2).map((hypothesis: string, idx: number) => (
                    <li key={idx} className="text-[11px] text-zinc-300 flex items-start gap-2">
                       <span className="text-blue-500/50 block mt-0.5 flex-shrink-0">&gt;</span>
                       <span className="break-words line-clamp-3">{hypothesis}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {analysis.visualObservations && analysis.visualObservations.length > 0 && (
                <div>
                  <span className="data-label mb-2 block mt-4">Visual Arrays</span>
                  <ul className="space-y-1.5">
                    {analysis.visualObservations?.map((obs: string, idx: number) => (
                      <li key={idx} className="text-[11px] text-zinc-300 flex items-start gap-2">
                        <span className="text-blue-500/50 block mt-0.5 flex-shrink-0">&gt;</span>
                        <span className="break-words line-clamp-2">{obs}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {analysis.growId && analysis.plantId && analysis.mediaAssetId && (
            <div className="pt-3 border-t border-zinc-800/50 mt-4">
              <Link 
                to={`/grows/${analysis.growId}/plants/${analysis.plantId}?asset=${analysis.mediaAssetId}`}
                className="inline-flex items-center gap-2 text-[10px] uppercase font-mono tracking-widest text-status-optimal hover:text-emerald-400 transition-colors"
                title="View Source Artifact"
              >
                <ExternalLink className="w-3 h-3" />
                <span>[ Load Source ]</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const RecentMediaAnalysisWidget: React.FC<RecentMediaAnalysisWidgetProps> = ({ userId }) => {
  const [recentAssets, setRecentAssets] = useState<(MediaAsset & { url?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [failedAsset, setFailedAsset] = useState<MediaAsset | null>(null);

  useEffect(() => {
    fetchRecentAssets();
    fetchRecentAnalyses();
  }, [userId]);

  const fetchRecentAssets = async () => {
    try {
      setLoadError(null);
      const q = query(
        collection(db, 'media_assets'),
        where('ownerId', '==', userId),
        where('uploadStatus', '==', 'uploaded'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const snapshot = await getDocs(q);
      const assets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MediaAsset));
      
      const assetsWithUrls = await Promise.all(assets.map(async (asset) => {
        try {
          if (asset.mediaType === 'image') {
            const url = await getMediaBlobUrl(asset.storagePath);
            return { ...asset, url };
          }
          return asset;
        } catch (e) {
          console.warn(`Failed to generate URL for asset ${asset.id}`, e);
          return asset;
        }
      }));
      setRecentAssets(assetsWithUrls);
    } catch (e) {
      console.error('Failed to fetch recent assets', e);
      setLoadError('Unable to load recent media uploads.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentAnalyses = async () => {
    try {
      setLoadError(null);
      const q = query(
        collection(db, 'plant_analyses'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(3)
      );
      const snapshot = await getDocs(q);
      setRecentAnalyses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) {
      console.error('Failed to fetch recent analyses', e);
      setLoadError('Unable to load recent analyses at this time. Please check your connection.');
    }
  };

  const handleAnalyze = async (asset: MediaAsset) => {
    if (analyzingId) return;
    setAnalyzingId(asset.id);
    setAnalysisError(null);
    setFailedAsset(null);
    try {
      await analyzePlantMedia(userId, asset.growId, asset.plantId, asset.id, asset.storagePath, asset.mediaType);
      await fetchRecentAnalyses();
    } catch (e: any) {
      console.error(e);
      let errorMessage = 'An unexpected error occurred during analysis.';
      const rawError = e.message?.toLowerCase() || '';

      if (rawError.includes('unauthorized') || rawError.includes('permission')) {
        errorMessage = 'Auth rejected for this media trace.';
      } else if (rawError.includes('network') || rawError.includes('fetch failed')) {
        errorMessage = 'Network connection failed.';
      } else if (rawError.includes('timeout') || rawError.includes('timed out') || rawError.includes('abort')) {
        errorMessage = 'AI module timeout. Size threshold exceeded.';
      } else if (e.message) {
        errorMessage = `ERR: ${e.message}`;
      }

      setAnalysisError(errorMessage);
      setFailedAsset(asset);
    } finally {
      setAnalyzingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex p-4">
        <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="border border-brand-border bg-brand-surface/20 flex flex-col p-4 gap-6">
      <div className="flex items-center gap-2 border-b border-brand-border pb-2">
        <Activity className="w-4 h-4 text-blue-500" />
        <span className="data-label !text-zinc-300">Analysis Modules</span>
      </div>

      <div className="space-y-3">
        <h3 className="data-label">Pending Artifacts</h3>
        
        {analysisError && (
          <div className="p-3 bg-status-error/10 border border-status-error text-status-error text-[10px] uppercase font-mono tracking-wider">
            <span className="block mb-1 font-bold">ERR_ANALYSIS</span>
            <p className="mb-2">{analysisError}</p>
            {failedAsset && (
               <button 
                 onClick={() => handleAnalyze(failedAsset)} 
                 className="px-2 py-1 bg-status-error text-brand-bg font-bold opacity-80 hover:opacity-100 transition-opacity"
               >
                 [ Retry Compile ]
               </button>
            )}
          </div>
        )}

        {loadError && (
          <div className="p-2 border border-zinc-700 text-zinc-500 text-[10px] font-mono uppercase">
            {loadError}
          </div>
        )}

        {!loadError && recentAssets.length === 0 && (
          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Null return. No pending media.</p>
        )}
        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {recentAssets.map(asset => (
            <div key={asset.id} className="min-w-[100px] max-w-[100px] border border-brand-border bg-brand-bg flex-shrink-0 group relative cursor-pointer">
              <div className="aspect-square bg-zinc-900 relative p-1">
                {asset.mediaType === 'image' && asset.url ? (
                  <img src={asset.url} alt="" className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all opacity-80 group-hover:opacity-100" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-zinc-700 border border-dashed border-zinc-800">
                    {asset.mediaType === 'video' ? <Play className="w-4 h-4" /> : <FileImage className="w-4 h-4" />}
                  </div>
                )}
                {analyzingId === asset.id && (
                  <div className="absolute inset-0 bg-brand-bg/80 backdrop-blur-sm flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                  </div>
                )}
                {!analyzingId && (
                  <div className="absolute inset-0 bg-brand-bg/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <button
                      onClick={() => handleAnalyze(asset)}
                      className="text-[10px] uppercase font-mono tracking-wider font-bold bg-blue-500 text-brand-bg px-2 py-1 hover:bg-blue-400 transition-colors"
                    >
                      Process
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="data-label">Analysis Logs</h3>
        {recentAnalyses.length === 0 && (
          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">No previous runs.</p>
        )}
        <div className="space-y-2">
           {recentAnalyses.map((analysis) => (
             <AnalysisItem key={analysis.id} analysis={analysis} />
           ))}
        </div>
      </div>
    </div>
  );
};

