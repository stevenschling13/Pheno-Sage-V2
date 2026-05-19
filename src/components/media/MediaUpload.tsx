import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, Video as VideoIcon, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { uploadPlantMedia } from '../../services/mediaService';
import { ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES } from '../../types';

interface MediaUploadProps {
  userId: string;
  growId: string;
  plantId: string;
  onUploadComplete?: () => void;
}

interface UploadErrorState {
  title: string;
  message: string;
  details?: string;
}

export const MediaUpload: React.FC<MediaUploadProps> = ({ userId, growId, plantId, onUploadComplete }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<UploadErrorState | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Cleanup generated object URLs
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);
  
  const processUpload = async (file: File) => {
    setError(null);
    setIsUploading(true);
    setProgress(0);
    setIsSuccess(false);
    
    try {
      await uploadPlantMedia(userId, growId, plantId, file, (p) => {
        setProgress(Math.round(p));
      });
      setIsSuccess(true);
      setTimeout(() => {
        handleClear();
        if (onUploadComplete) onUploadComplete();
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred during upload.';
      let title = 'Upload Failed';
      let details = errorMessage;

      if (errorMessage.includes('exceeds 20MB')) {
        title = 'Image Too Large';
        details = 'Images must be smaller than 20MB. Please resize or compress your image and try again.';
      } else if (errorMessage.includes('exceeds 200MB')) {
        title = 'Video Too Large';
        details = 'Videos must be smaller than 200MB. Please compress your video or select a shorter clip.';
      } else if (errorMessage.toLowerCase().includes('unsupported') || errorMessage.toLowerCase().includes('invalid file')) {
        title = 'Invalid File Format';
        details = `We only support JPG, PNG, WEBP for images and MP4, WEBM for videos.`;
      } else if (errorMessage.includes('storage/unauthorized') || errorMessage.includes('permission-denied')) {
        title = 'Permission Denied';
        details = 'You do not have permission to upload media to this plant. Only the grow owner can add media.';
      } else if (errorMessage.includes('storage/canceled')) {
        title = 'Upload Canceled';
        details = 'The upload process was canceled. If you did not cancel it, please check your connection and retry.';
      } else if (errorMessage.includes('storage/retry-limit-exceeded') || errorMessage.includes('Server Connection Error') || errorMessage.includes('network')) {
        title = 'Network Error';
        details = 'Could not connect to the server due to a poor network connection. Please check your internet connection and try again.';
      } else if (errorMessage.includes('Upload failed:')) {
        title = 'File Transfer Error';
        details = 'There was a technical problem transferring the file to storage. Please try again.';
      }

      setError({ title, message: errorMessage, details });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Clear previous state
    handleClear();
    
    // Validate file type and size immediately
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      setError({ 
        title: 'Invalid File Format', 
        message: `Unsupported file type: ${file.type || 'unknown'}`, 
        details: 'We only support JPG, PNG, WEBP for images and MP4, WEBM for videos.' 
      });
      return;
    }

    if (isImage && file.size > 20 * 1024 * 1024) {
      setError({ 
        title: 'Image Too Large', 
        message: `File size exceeds 20MB limit.`, 
        details: 'Images must be smaller than 20MB. Please resize or compress your image and try again.' 
      });
      return;
    }

    if (isVideo && file.size > 200 * 1024 * 1024) {
      setError({ 
        title: 'Video Too Large', 
        message: `File size exceeds 200MB limit.`, 
        details: 'Videos must be smaller than 200MB. Please compress your video or select a shorter clip.' 
      });
      return;
    }

    setPendingFile(file);
    setIsSuccess(false);
    
    // Generate preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    // Auto-start upload as per previous behavior, but we can also just let them confirm.
    // The prompt says "display a thumbnail preview of the selected image or video before upload, and show upload status more prominently."
    // Let's hold the upload until they confirm, so they can see the preview *before* upload.
  };
  
  const handleConfirmUpload = () => {
    if (pendingFile) {
      processUpload(pendingFile);
    }
  };

  const handleRetry = () => {
    if (pendingFile) {
      processUpload(pendingFile);
    }
  };

  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setError(null);
    setPendingFile(null);
    setPreviewUrl(null);
    setProgress(0);
    setIsSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-brand-green" />
          Plant Media
        </h3>
        
        {!pendingFile && (
          <button
            onClick={handleButtonClick}
            disabled={isUploading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-green hover:bg-brand-green-hover text-brand-black text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            Select Media
          </button>
        )}
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={[...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].join(',')}
        className="hidden"
      />

      {/* Preview & Status Area */}
      {pendingFile && previewUrl && (
        <div className="mt-4 rounded-lg overflow-hidden border border-brand-border bg-black/20">
          <div className="relative aspect-video bg-black/40 flex items-center justify-center">
            {pendingFile.type.startsWith('image/') ? (
              <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
            ) : (
              <video src={previewUrl} className="max-w-full max-h-full object-contain" controls={!isUploading} />
            )}
            
            {/* Upload Overlay */}
            {(isUploading || isSuccess) && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6">
                {isUploading ? (
                  <div className="w-full max-w-xs text-center">
                    <Loader2 className="w-8 h-8 text-brand-green animate-spin mx-auto mb-4" />
                    <div className="text-white font-medium mb-2">Uploading {progress}%</div>
                    <div className="h-2 w-full bg-brand-black rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-brand-green transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                ) : isSuccess ? (
                  <div className="text-center">
                    <CheckCircle2 className="w-10 h-10 text-brand-green mx-auto mb-2" />
                    <div className="text-white font-medium">Upload Complete</div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
          
          <div className="p-3 bg-brand-black/40 border-t border-brand-border flex items-center justify-between">
            <div className="flex-1 min-w-0 mr-4">
              <p className="text-sm text-white font-medium truncate" title={pendingFile.name}>
                {pendingFile.name}
              </p>
              <p className="text-xs text-brand-muted">
                {(pendingFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            
            {!isUploading && !isSuccess && !error && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClear}
                  className="px-3 py-1.5 text-xs font-medium text-brand-muted hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmUpload}
                  className="px-3 py-1.5 text-xs font-medium bg-brand-green text-brand-black rounded-lg hover:bg-brand-green-hover transition-colors"
                >
                  Upload Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {error && pendingFile && (
        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 text-red-500 font-semibold">
              <AlertCircle className="w-4 h-4" />
              <span>{error.title}</span>
            </div>
            <button onClick={handleClear} className="text-red-400 hover:text-red-300 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="text-red-400/90 mb-3 bg-black/20 p-2 rounded text-xs border border-red-500/10">
            <p className="font-medium mb-1">{error.details}</p>
            {error.message && error.message !== error.details && (
              <p className="text-[10px] text-red-400/60 font-mono mt-1 break-words leading-tight">{error.message}</p>
            )}
            <div className="mt-2 text-[10px] flex items-center gap-1 opacity-80">
              <span className="font-medium">File:</span> 
              <span className="truncate max-w-[120px]" title={pendingFile.name}>{pendingFile.name}</span>
              <span>({(pendingFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
            </div>
          </div>
          
          <button 
            onClick={handleRetry} 
            className="flex items-center gap-1.5 text-xs font-medium bg-red-500/20 text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-500/30 transition-colors w-full justify-center"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Upload
          </button>
        </div>
      )}

      {error && !pendingFile && (
        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex flex-col gap-2">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-red-500">{error.title}</p>
                <p className="text-xs mt-0.5 opacity-90">{error.details || error.message}</p>
              </div>
            </div>
            <button onClick={handleClear} className="text-red-400 hover:text-red-300 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
