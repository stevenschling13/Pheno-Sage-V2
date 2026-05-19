import { db } from '../lib/firebase';
import { collection, serverTimestamp, doc, writeBatch } from 'firebase/firestore';
import { getMediaBlob } from './mediaService';
import { apiPost, ApiError } from '../lib/apiClient';

interface AnalysisFinding {
  category?: string;
  severity?: string;
  confidence?: number;
  title?: string;
  recommendation?: string;
}

interface AnalysisResult {
  isFallback: boolean;
  fallbackReason?: string;
  overallHealthScore: number;
  confidenceScore: number;
  estimatedStage: string;
  stageConfidence: number;
  imageQuality: string;
  visualObservations: string[];
  diagnosticHypotheses: string[];
  findings: AnalysisFinding[];
  recommendations: string[];
  suggestedTasks: string[];
  safetyCaveats: string;
}

export async function analyzePlantMedia(
  userId: string,
  growId: string,
  plantId: string,
  mediaAssetId: string,
  storagePath: string,
  mediaType: string,
) {
  const blob = await getMediaBlob(storagePath);

  const base64data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const b64 = reader.result?.toString().split(',')[1];
      if (b64) resolve(b64);
      else
        reject(
          new Error(
            'Failed to convert media for analysis. The file might be corrupted or too large.',
          ),
        );
    };
    reader.onerror = () =>
      reject(new Error('Browser error while reading the media file. Please try again.'));
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60_000);

  let analysisResult: AnalysisResult;
  try {
    analysisResult = await apiPost<AnalysisResult>(
      '/api/analyze-plant',
      { mediaBase64: base64data, mimeType: blob.type, isVideo: mediaType === 'video' },
      controller.signal,
    );
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error('Analysis request timed out. Please try again.');
    }
    if (error instanceof ApiError) throw new Error(error.message);
    throw new Error(`Network issue while requesting AI analysis: ${error.message}`);
  } finally {
    clearTimeout(timeoutId);
  }

  // 4. Save results to Firestore
  const batch = writeBatch(db);
  const analysisRef = doc(collection(db, 'plant_analyses'));

  const findings: AnalysisFinding[] = analysisResult.findings ?? [];
  const { findings: _omit, ...rest } = analysisResult;
  const analysisData = {
    ...rest,
    userId,
    growId,
    plantId,
    mediaAssetId,
    mediaType,
    analyzedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    archived: false,
  };

  batch.set(analysisRef, analysisData);

  for (const finding of findings) {
    const findingRef = doc(collection(db, 'plant_findings'));
    batch.set(findingRef, {
      ...finding,
      analysisId: analysisRef.id,
      userId,
      growId,
      plantId,
      createdAt: serverTimestamp(),
      status: 'active',
    });
  }

  await batch.commit();

  return { id: analysisRef.id, ...analysisData, findings };
}
