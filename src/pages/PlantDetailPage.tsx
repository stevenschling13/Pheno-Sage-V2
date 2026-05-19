import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Activity, Target } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getPlantById, getPlantMedia } from '../services/firestoreService';
import { getMediaBlobUrl } from '../services/mediaService';
import { analyzePlantMedia } from '../services/analysisService';
import { Plant, MediaAsset } from '../types';

import { PlantHeader } from '../components/plants/PlantHeader';
import { PlantTelemetryPanel, type TelemetryPoint } from '../components/plants/PlantTelemetryPanel';
import { MediaHistoryGrid } from '../components/plants/MediaHistoryGrid';
import { LiveTelemetryPanel } from '../components/plants/LiveTelemetryPanel';
import { DiagnosticPipelinePanel } from '../components/plants/DiagnosticPipelinePanel';

const MOCK_TELEMETRY: TelemetryPoint[] = Array.from({ length: 14 }).map((_, i) => ({
  date: `T-${13 - i}`,
  vpd: 0.8 + Math.random() * 0.6,
  moisture: 40 + Math.random() * 20,
  ec: 1.2 + Math.random() * 0.4,
}));

type HydratedMedia = MediaAsset & { url?: string };

async function hydrate(assets: MediaAsset[]): Promise<HydratedMedia[]> {
  return Promise.all(
    assets.map(async (asset) => {
      if (asset.mediaType !== 'image' && asset.mediaType !== 'video') return asset;
      try {
        const url = await getMediaBlobUrl(asset.storagePath);
        return { ...asset, url };
      } catch (e) {
        console.warn(`Failed URL hydrate ${asset.id}`, e);
        return asset;
      }
    }),
  );
}

export default function PlantDetailPage() {
  const { growId, plantId } = useParams<{ growId: string; plantId: string }>();
  const { user } = useAuth();

  const [plant, setPlant] = useState<Plant | null>(null);
  const [media, setMedia] = useState<HydratedMedia[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(
    null,
  );
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisSuccess, setAnalysisSuccess] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!plantId || !growId || !user) return;
      try {
        setLoading(true);
        const [p, m] = await Promise.all([getPlantById(plantId), getPlantMedia(user.uid, plantId)]);
        setPlant(p ?? null);
        setMedia(m && m.length > 0 ? await hydrate(m) : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [plantId, growId, user]);

  const handleTriggerAnalysis = useCallback(async () => {
    if (!plant || !user || media.length === 0) return;
    const latest = media.find((m) => m.mediaType === 'image');
    if (!latest) {
      setAnalysisError('NO VISUAL ASSET FOUND IN INDEX.');
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
        latest.id,
        latest.storagePath,
        latest.mediaType,
      );
      setAnalysisSuccess(true);
      setTimeout(() => setAnalysisSuccess(false), 3000);
    } catch (e: any) {
      console.error(e);
      setAnalysisError(e.message || 'ANALYSIS PIPELINE FAILURE.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [plant, user, media]);

  const handleBatchAnalysis = useCallback(async () => {
    if (!plant || !user || media.length === 0) return;
    const images = media.filter((m) => m.mediaType === 'image');
    if (images.length === 0) {
      setAnalysisError('NO VISUAL ASSETS FOUND IN INDEX.');
      return;
    }
    try {
      setIsBatchAnalyzing(true);
      setAnalysisError(null);
      setAnalysisSuccess(false);
      setBatchProgress({ current: 0, total: images.length });

      // Sequential to avoid rate limits / overwhelming the model
      for (let i = 0; i < images.length; i++) {
        const asset = images[i];
        await analyzePlantMedia(
          user.uid,
          plant.growId,
          plant.id,
          asset.id,
          asset.storagePath,
          asset.mediaType,
        );
        setBatchProgress({ current: i + 1, total: images.length });
      }

      setAnalysisSuccess(true);
      setTimeout(() => setAnalysisSuccess(false), 3000);
    } catch (e: any) {
      console.error(e);
      setAnalysisError(e.message || 'BATCH ANALYSIS PIPELINE FAILURE.');
    } finally {
      setIsBatchAnalyzing(false);
      setTimeout(() => setBatchProgress(null), 3000);
    }
  }, [plant, user, media]);

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

  const hasImage = media.some((m) => m.mediaType === 'image');

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

      <PlantHeader plant={plant} />

      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 items-start">
        <div className="order-2 lg:order-1 lg:col-span-2 space-y-6 w-full">
          <PlantTelemetryPanel
            data={MOCK_TELEMETRY}
            hasImage={hasImage}
            isAnalyzing={isAnalyzing}
            isBatchAnalyzing={isBatchAnalyzing}
            batchProgress={batchProgress}
            analysisError={analysisError}
            analysisSuccess={analysisSuccess}
            onTriggerAnalysis={handleTriggerAnalysis}
            onBatchAnalysis={handleBatchAnalysis}
          />
          <MediaHistoryGrid media={media} />
        </div>

        <div className="order-1 lg:order-2 lg:col-span-1 space-y-6 lg:sticky lg:top-6 h-fit w-full">
          <LiveTelemetryPanel />
          <DiagnosticPipelinePanel />
          <div className="border border-brand-border p-4 bg-brand-bg text-[10px] font-mono text-zinc-400 leading-relaxed uppercase tracking-widest">
            <Target className="w-4 h-4 mb-2 text-zinc-600" />
            Phase 7 integrates automated hardware telemetry with longitudinal visual arrays to
            predict cultivation drift before critical mass.
          </div>
        </div>
      </div>
    </div>
  );
}
