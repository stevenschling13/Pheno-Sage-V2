import React, { useEffect, useState } from 'react';
import { MediaAsset } from '../../types';
import { subscribePlantMedia, getMediaBlobUrl, archiveMediaAsset } from '../../services/mediaService';
import { Play, Image as ImageIcon, Video as VideoIcon, Trash2, Loader2, AlertCircle } from 'lucide-react';

interface MediaGalleryProps {
  userId: string;
  plantId: string;
}

const MediaItem: React.FC<{ asset: MediaAsset; onArchive: (id: string) => void }> = ({ asset, onArchive }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let objectUrl = '';
    if (asset.uploadStatus === 'uploaded' && asset.mediaType === 'image') {
      getMediaBlobUrl(asset.storagePath)
        .then(downloadUrl => {
          if (active) {
            objectUrl = downloadUrl;
            setUrl(objectUrl);
            setLoading(false);
          } else {
             URL.revokeObjectURL(downloadUrl);
          }
        })
        .catch(err => {
          console.error("Failed to get url for", asset.id, err);
          if (active) setLoading(false);
        });
    } else {
      setLoading(false);
    }
    return () => { 
      active = false; 
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [asset]);

  const sizeMb = (asset.sizeBytes / (1024 * 1024)).toFixed(1);
  const date = asset.createdAt?.toDate ? asset.createdAt.toDate().toLocaleDateString() : 'Just now';

  return (
    <div className="relative group overflow-hidden rounded-lg border border-brand-border bg-brand-surface group">
      {asset.uploadStatus === 'failed' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/20 text-red-400 font-semibold p-2 text-center">
          <AlertCircle className="w-5 h-5 mb-1" />
          <span className="text-xs">Upload Failed</span>
        </div>
      )}
      
      {asset.uploadStatus === 'uploading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50">
          <Loader2 className="w-6 h-6 text-brand-green animate-spin mb-2" />
          <span className="text-xs text-brand-muted">Uploading...</span>
        </div>
      )}

      {asset.uploadStatus === 'uploaded' && asset.mediaType === 'image' && (
        <div className="aspect-square bg-slate-900 relative">
          {loading ? (
             <div className="absolute inset-0 flex items-center justify-center">
               <Loader2 className="w-5 h-5 text-brand-muted animate-spin" />
             </div>
          ) : url ? (
            <img src={url} alt={asset.fileName} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500">
              <ImageIcon className="w-8 h-8" />
            </div>
          )}
        </div>
      )}

      {asset.uploadStatus === 'uploaded' && asset.mediaType === 'video' && (
        <div className="aspect-square bg-slate-900 flex flex-col items-center justify-center text-slate-400 p-4 text-center relative">
          <Play className="w-10 h-10 mb-2 opacity-50" />
          <span className="text-xs truncate w-full px-2" title={asset.fileName}>{asset.fileName}</span>
        </div>
      )}
      
      {/* Overlay with info and actions */}
      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 to-transparent flex items-end justify-between opacity-0 group-hover:opacity-100 transition-opacity">
         <div>
           <p className="text-[10px] text-brand-muted uppercase font-bold tracking-wider">{asset.mediaType}</p>
           <p className="text-xs text-white">{date} • {sizeMb}MB</p>
         </div>
         <button 
           onClick={() => onArchive(asset.id)}
           className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center hover:bg-red-500/80 hover:text-white text-slate-300 transition-colors"
           title="Archive Media"
         >
           <Trash2 className="w-3.5 h-3.5" />
         </button>
      </div>
      
      {/* Type badge on top left */}
      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] bg-black/60 text-white backdrop-blur flex items-center gap-1">
        {asset.mediaType === 'video' ? <VideoIcon className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
      </div>
    </div>
  );
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({ userId, plantId }) => {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribePlantMedia(userId, plantId, (fetchedAssets) => {
      setAssets(fetchedAssets);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userId, plantId]);

  const handleArchive = async (id: string) => {
    try {
      setError(null);
      await archiveMediaAsset(id);
    } catch(err: any) {
      console.error("Failed to archive:", err);
      setError(err.message || "Failed to archive media.");
    }
  };

  if (loading) {
    return (
      <div className="py-8 flex justify-center">
        <Loader2 className="w-6 h-6 text-brand-green animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}
      {assets.length === 0 ? (
        <div className="py-8 text-center text-brand-muted bg-brand-surface/30 rounded-xl border border-brand-border border-dashed">
          <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
          <p className="font-medium text-slate-300">No media yet</p>
          <p className="text-sm">Upload images or videos of this plant.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6">
          {assets.map(asset => (
            <MediaItem key={asset.id} asset={asset} onArchive={handleArchive} />
          ))}
        </div>
      )}
    </div>
  );
};
