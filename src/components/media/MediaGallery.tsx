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
  const date = asset.createdAt?.toDate ? asset.createdAt.toDate().toLocaleDateString(undefined, { month: '2-digit', day: '2-digit', year: '2-digit' }) : 'T:0';

  return (
    <div className="relative group border border-brand-border bg-brand-surface font-mono overflow-hidden">
      {asset.uploadStatus === 'failed' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-status-error/10 border border-status-error text-status-error font-bold p-2 text-center uppercase tracking-widest text-[9px] backdrop-blur-sm z-10">
          <AlertCircle className="w-4 h-4 mb-1" />
          <span>Upload Failed</span>
        </div>
      )}
      
      {asset.uploadStatus === 'uploading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-brand-bg/80 border border-status-optimal backdrop-blur-sm z-10">
          <Loader2 className="w-5 h-5 text-status-optimal animate-spin mb-2" />
          <span className="text-[9px] text-zinc-400 uppercase tracking-widest">Uplink Active</span>
        </div>
      )}

      {asset.uploadStatus === 'uploaded' && asset.mediaType === 'image' && (
        <div className="aspect-square bg-zinc-900 relative">
          {loading ? (
             <div className="absolute inset-0 flex items-center justify-center">
               <Loader2 className="w-4 h-4 text-zinc-600 animate-spin" />
             </div>
          ) : url ? (
            <img src={url} alt={asset.fileName} className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 opacity-80 group-hover:opacity-100 transition-all duration-300" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-700">
              <ImageIcon className="w-6 h-6" />
            </div>
          )}
        </div>
      )}

      {asset.uploadStatus === 'uploaded' && asset.mediaType === 'video' && (
        <div className="aspect-square bg-zinc-900 flex flex-col items-center justify-center text-zinc-600 p-4 text-center relative border border-dashed border-zinc-800 m-1">
          <Play className="w-6 h-6 mb-2 opacity-50" />
          <span className="text-[9px] truncate w-full px-2 lowercase">{asset.fileName}</span>
        </div>
      )}
      
      {/* Overlay with info and actions */}
      <div className="absolute inset-x-0 bottom-0 p-2 bg-brand-bg/80 backdrop-blur-sm flex items-end justify-between opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
         <div>
           <p className="text-[9px] text-status-optimal uppercase tracking-widest">{asset.mediaType}</p>
           <p className="text-[10px] text-zinc-300 data-value mt-0.5">{date} | {sizeMb}M</p>
         </div>
         <button 
           onClick={() => onArchive(asset.id)}
           className="w-5 h-5 bg-brand-surface border border-brand-border flex items-center justify-center hover:bg-status-error hover:text-brand-bg hover:border-status-error text-zinc-400 transition-colors"
           title="Archive Media"
         >
           <Trash2 className="w-3 h-3" />
         </button>
      </div>
      
      {/* Type badge on top left */}
      <div className="absolute top-1 left-1 px-1 py-0.5 text-[9px] bg-brand-bg/80 text-zinc-300 border border-brand-border flex items-center gap-1 uppercase tracking-widest">
        {asset.mediaType === 'video' ? <VideoIcon className="w-2.5 h-2.5" /> : <ImageIcon className="w-2.5 h-2.5" />}
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
      setError(err.message || "Archive instruction failed.");
    }
  };

  if (loading) {
    return (
      <div className="py-8 flex justify-center">
        <Loader2 className="w-5 h-5 text-status-optimal animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-2 border border-status-error bg-status-error/10 text-status-error text-[10px] uppercase font-mono tracking-widest">
          ERR: {error}
        </div>
      )}
      {assets.length === 0 ? (
        <div className="py-8 text-center bg-brand-bg border border-brand-border border-dashed font-mono">
          <ImageIcon className="w-6 h-6 mx-auto mb-2 text-zinc-700" />
          <p className="data-label text-zinc-400">Empty Media Array</p>
          <p className="text-[10px] text-zinc-600 mt-1">Provide visual input stream.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-4">
          {assets.map(asset => (
            <MediaItem key={asset.id} asset={asset} onArchive={handleArchive} />
          ))}
        </div>
      )}
    </div>
  );
};
