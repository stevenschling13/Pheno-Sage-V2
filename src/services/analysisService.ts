import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, writeBatch } from 'firebase/firestore';
import { getMediaBlobUrl } from './mediaService';

export async function analyzePlantMedia(userId: string, growId: string, plantId: string, mediaAssetId: string, storagePath: string, mediaType: string) {
  // 1. Download media blob
  const url = await getMediaBlobUrl(storagePath);
  const blob = await fetch(url).then(r => r.blob());
  
  // 2. Convert blob to base64
  const base64data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64data = reader.result?.toString().split(',')[1];
      if (base64data) resolve(base64data);
      else reject(new Error("Failed to convert reading to base64"));
    };
    reader.onerror = reject;
  });

  // 3. Send to Server API
  const response = await fetch('/api/analyze-plant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mediaBase64: base64data,
      mimeType: blob.type,
      isVideo: mediaType === 'video'
    })
  });

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
  
  return analysisRef.id;
}
