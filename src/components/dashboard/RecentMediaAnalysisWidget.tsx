import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { MediaAsset } from '../../types';
import { analyzePlantMedia } from '../../services/analysisService';
import { Brain, FileImage, Loader2, Play } from 'lucide-react';
import { getMediaBlobUrl } from '../../services/mediaService';

interface RecentMediaAnalysisWidgetProps {
  userId: string;
}

export const RecentMediaAnalysisWidget: React.FC<RecentMediaAnalysisWidgetProps> = ({ userId }) => {
  const [recentAssets, setRecentAssets] = useState<(MediaAsset & { url?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

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
    }
  };

  const handleAnalyze = async (asset: MediaAsset) => {
    if (analyzingId) return;
    setAnalyzingId(asset.id);
    setAnalysisError(null);
    try {
      await analyzePlantMedia(userId, asset.growId, asset.plantId, asset.id, asset.storagePath, asset.mediaType);
      await fetchRecentAnalyses();
    } catch (e: any) {
      console.error(e);
      let errorMessage = 'An unexpected error occurred during analysis. Please try again later.';
      const rawError = e.message?.toLowerCase() || '';

      if (rawError.includes('unauthorized') || rawError.includes('permission')) {
        errorMessage = 'You do not have permission to analyze this media.';
      } else if (rawError.includes('network') || rawError.includes('fetch failed')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (rawError.includes('timeout')) {
        errorMessage = 'The analysis request timed out. Please try again.';
      } else if (e.message) {
        errorMessage = `Analysis failed: ${e.message}. Please try again.`;
      }

      setAnalysisError(errorMessage);
    } finally {
      setAnalyzingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-indigo-400" />
        <h2 className="text-lg font-bold text-white tracking-tight">AI Health Analysis</h2>
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recent Uploads</h3>
        
        {analysisError && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
            <span className="font-semibold block mb-1">Analysis Error</span>
            {analysisError}
          </div>
        )}

        {loadError && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center">
            {loadError}
          </div>
        )}

        {!loadError && recentAssets.length === 0 && (
          <p className="text-xs text-slate-500 italic">No media uploaded yet. Add media to a plant to analyze it.</p>
        )}
        <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
          {recentAssets.map(asset => (
            <div key={asset.id} className="min-w-[120px] max-w-[120px] rounded-xl border border-brand-border bg-brand-surface overflow-hidden flex-shrink-0 group">
              <div className="aspect-square bg-slate-900 relative">
                {asset.mediaType === 'image' && asset.url ? (
                  <img src={asset.url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-slate-500">
                    {asset.mediaType === 'video' ? <Play className="w-6 h-6" /> : <FileImage className="w-6 h-6" />}
                  </div>
                )}
                {analyzingId === asset.id && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                  </div>
                )}
                {!analyzingId && (
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleAnalyze(asset)}
                      className="text-[10px] font-bold bg-indigo-500 text-white px-2 py-1 rounded w-full hover:bg-indigo-400 transition-colors"
                    >
                      ANALYZE
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recent Analyses</h3>
        {recentAnalyses.length === 0 && (
          <p className="text-xs text-slate-500 italic">No analyses yet.</p>
        )}
        {recentAnalyses.map((analysis) => (
          <div key={analysis.id} className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-indigo-400"></div>
                <span className="text-xs font-bold text-indigo-400">Score: {analysis.overallHealthScore}/100</span>
              </div>
              <span className="text-[10px] text-slate-500">
                {analysis.createdAt ? new Date(analysis.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
              </span>
            </div>
            {analysis.isFallback ? (
              <p className="text-xs text-slate-400 italic mb-2">Fallback: {analysis.fallbackReason}</p>
            ) : (
              <>
                <p className="text-xs text-white font-medium mb-1">Diagnosis: {analysis.diagnosticHypotheses?.[0]}</p>
                <div className="space-y-1">
                  {analysis.visualObservations?.slice(0, 2).map((obs: string, idx: number) => (
                    <p key={idx} className="text-[10px] text-slate-400">• {obs}</p>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
