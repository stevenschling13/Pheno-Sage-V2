import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, writeBatch } from 'firebase/firestore';
import { getMediaBlobUrl } from './mediaService';

export async function analyzePlantMedia(userId: string, growId: string, plantId: string, mediaAssetId: string, storagePath: string, mediaType: string) {
  // 1. Download media blob
  const url = await getMediaBlobUrl(storagePath);
  let blob: Blob;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error(`Permission denied (${response.status}) when fetching the media for analysis.`);
      }
      throw new Error(`Server returned ${response.status} when fetching the image/video.`);
    }
    blob = await response.blob();
  } catch (error: any) {
    if (error.message.includes('Permission denied') || error.message.includes('Server returned')) {
      throw error;
    }
    throw new Error(`Network error while downloading the media for analysis. Please check your internet connection. Details: ${error.message}`);
  }
  
  // 2. Convert blob to base64
  const base64data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const b64 = reader.result?.toString().split(',')[1];
      if (b64) resolve(b64);
      else reject(new Error("Failed to convert media for analysis. The file might be corrupted or too large."));
    };
    reader.onerror = () => reject(new Error("Browser error while reading the media file. Please try again."));
  });

  // 3. Send to Server API
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

  let response;
  try {
    response = await fetch('/api/analyze-plant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mediaBase64: base64data,
        mimeType: blob.type,
        isVideo: mediaType === 'video'
      }),
      signal: controller.signal
    });
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Analysis request timed out. The request took too long to complete. Please try again.');
    }
    throw new Error(`Network issue while requesting AI analysis: ${error.message}`);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to analyze plant');
  }

  const analysisResult = await response.json();

  // 4. Save results to Firestore
  const batch = writeBatch(db);
  const analysisRef = doc(collection(db, 'plant_analyses'));
  
  const analysisData = {
    ...analysisResult,
    userId,
    growId,
    plantId,
    mediaAssetId,
    mediaType,
    analyzedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    archived: false,
    // Extracting findings into a separate collection as per spec, but storing summary here
  };

  const findings = analysisResult.findings || [];
  delete analysisData.findings; // remove from main doc to normalize
  
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
