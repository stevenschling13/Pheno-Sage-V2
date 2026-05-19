import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, Video as VideoIcon, RefreshCw, AlertCircle, CheckCircle2, Sparkles, AlertTriangle } from 'lucide-react';
import { uploadPlantMedia } from '../../services/mediaService';
import { analyzePlantMedia } from '../../services/analysisService';
import { ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES, MediaAsset } from '../../types';

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
  const [uploadedAsset, setUploadedAsset] = useState<MediaAsset | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisSuccess, setAnalysisSuccess] = useState(false);
  
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
    setUploadedAsset(null);
    setAnalysisError(null);
    setAnalysisSuccess(false);
    
    try {
      const asset = await uploadPlantMedia(userId, growId, plantId, file, (p) => {
        setProgress(Math.round(p));
      });
      setIsSuccess(true);
      setUploadedAsset(asset);
      if (onUploadComplete) onUploadComplete();
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
    setUploadedAsset(null);
    setIsAnalyzing(false);
    setAnalysisError(null);
    setAnalysisSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    if (!uploadedAsset) return;
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisSuccess(false);

    try {
      const analysisResult: any = await analyzePlantMedia(userId, uploadedAsset.growId, uploadedAsset.plantId, uploadedAsset.id, uploadedAsset.storagePath, uploadedAsset.mediaType);
      if (analysisResult.isFallback) {
        setAnalysisError(analysisResult.fallbackReason || 'The media quality was too poor to analyze. Please upload a clear, well-lit image.');
      } else {
        setAnalysisSuccess(true);
      }
    } catch (error: any) {
      console.error(error);
      const errString = error?.message || '';
      let errorMessage = 'An unexpected error occurred during analysis.';
      
      if (errString.includes('Permission denied') || errString.toLowerCase().includes('unauthorized')) {
        errorMessage = 'You do not have permission to analyze this media or access it.';
      } else if (errString.includes('Network issue') || errString.includes('Network error') || errString.toLowerCase().includes('fetch failed')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (errString.includes('timed out') || errString.includes('timeout')) {
        errorMessage = 'The AI analysis took too long and timed out. This often happens with very large images or videos. Please try again.';
      } else if (errString.includes('Failed to convert') || errString.includes('Browser error') || errString.includes('Server returned')) {
        errorMessage = `Media Error: ${errString}`;
      } else if (errString) {
        errorMessage = `Analysis failed: ${errString}. Please try again.`;
      }
      setAnalysisError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="border border-brand-border bg-brand-surface/50 font-mono">
      <div className="flex items-center justify-between p-3 border-b border-brand-border bg-brand-bg">
        <h3 className="data-label text-zinc-300 flex items-center gap-2">
          <ImageIcon className="w-3.5 h-3.5 text-zinc-500" />
          Data Input Stream
        </h3>
        
        {!pendingFile && (
          <button
            onClick={handleButtonClick}
            disabled={isUploading}
            className="flex items-center gap-2 px-3 py-1 bg-brand-bg hover:bg-brand-surface border border-brand-border text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 text-[10px] uppercase tracking-widest font-bold transition-all disabled:opacity-50"
          >
            <Upload className="w-3 h-3" />
            [ Mount Media ]
          </button>
        )}
      </div>
      
      <div className="p-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={[...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].join(',')}
          className="hidden"
        />

        {/* Preview & Status Area */}
        {pendingFile && previewUrl && (
          <div className="border border-brand-border bg-brand-bg relative overflow-hidden">
            <div className="relative aspect-video bg-zinc-900 flex items-center justify-center">
              {pendingFile.type.startsWith('image/') ? (
                <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain filter grayscale" />
              ) : (
                <video src={previewUrl} className="max-w-full max-h-full object-contain filter grayscale" controls={!isUploading} />
              )}
              
              {isSuccess && !analysisSuccess && !isAnalyzing && (
                <div className="absolute top-2 right-2 bg-blue-500/10 border border-blue-500 text-blue-400 px-2 py-1 flex items-center gap-1.5 text-[9px] uppercase font-bold tracking-widest z-20 animate-pulse backdrop-blur-sm">
                  <Sparkles className="w-3 h-3 flex-shrink-0" />
                  AI Ready
                </div>
              )}
              {analysisSuccess && (
                <div className="absolute top-2 right-2 bg-status-optimal/10 border border-status-optimal text-status-optimal px-2 py-1 flex items-center gap-1.5 text-[9px] uppercase font-bold tracking-widest z-20 backdrop-blur-sm">
                  <CheckCircle2 className="w-3 h-3" />
                  Analyzed
                </div>
              )}

              {/* Upload Overlay */}
              {isUploading && (
                <div className="absolute inset-0 bg-brand-bg/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-10">
                  <div className="w-full max-w-xs text-center">
                    <Loader2 className="w-6 h-6 text-status-optimal animate-spin mx-auto mb-4" />
                    <div className="data-label text-zinc-300 mb-2">Tx_Progress: {progress}%</div>
                    <div className="h-1 w-full bg-zinc-900 border border-zinc-800 overflow-hidden relative">
                      <div 
                        className="h-full bg-status-optimal transition-all duration-300 absolute left-0 top-0"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Analysis UI Overlay */}
              {isSuccess && (
                <div className="absolute inset-x-0 bottom-0 bg-brand-bg/90 backdrop-blur-md border-t border-brand-border p-4 flex flex-col items-center z-10 translate-y-0">
                  <div className="w-full">
                    <button
                      onClick={handleAnalyze}
                      disabled={isUploading || isAnalyzing || analysisSuccess}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-blue-500/10 border border-blue-500/50 hover:bg-blue-500 hover:text-brand-bg text-blue-400 font-bold text-[10px] uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Processing...
                        </>
                      ) : analysisSuccess ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          Diagnostic Complete
                        </>
                      ) : (
                        <>
                          {analysisError ? <RefreshCw className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                          {analysisError ? 'Retry Diagnostic' : 'Execute AI Diagnostic'}
                        </>
                      )}
                    </button>
                    {analysisError && (
                      <div className="mt-2 text-[9px] flex items-start text-status-error bg-status-error/10 p-2 border border-status-error/30 tracking-widest">
                        <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5 mr-1.5" />
                        <span className="text-left leading-tight">{analysisError}</span>
                      </div>
                    )}
                    <button
                      onClick={handleClear}
                      className="w-full mt-2 py-2 text-zinc-500 hover:text-zinc-300 text-[9px] uppercase font-bold tracking-widest transition-colors"
                    >
                      {analysisSuccess ? '[ CLOSE TERMINAL ]' : '[ DISMISS ]'}
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-3 bg-brand-surface border-t border-brand-border flex items-center justify-between">
              <div className="flex-1 min-w-0 mr-4">
                <p className="text-[11px] text-zinc-200 mt-0.5 truncate uppercase tracking-widest" title={pendingFile.name}>
                  {pendingFile.name}
                </p>
                <p className="data-value text-[10px] text-zinc-500">
                  {(pendingFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              
              {!isUploading && !isSuccess && !error && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClear}
                    className="px-3 py-1.5 text-[9px] uppercase tracking-widest font-bold text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    Abort
                  </button>
                  <button
                    onClick={handleConfirmUpload}
                    className="px-3 py-1.5 text-[9px] uppercase tracking-widest font-bold bg-status-optimal text-brand-bg hover:bg-emerald-400 transition-colors"
                  >
                    Initiate Tx
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {error && pendingFile && (
          <div className="mt-4 p-3 bg-status-error/10 border border-status-error text-[10px] uppercase tracking-wider font-mono">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 text-status-error font-bold">
                <AlertCircle className="w-4 h-4" />
                <span>{error.title}</span>
              </div>
              <button onClick={handleClear} className="text-status-error/70 hover:text-status-error transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="text-status-error/90 mb-3 bg-brand-bg p-2 border border-status-error/20">
              <p className="mb-1 leading-relaxed">{error.details}</p>
              {error.message && error.message !== error.details && (
                <p className="text-[9px] text-status-error/60 mt-1 break-words">{error.message}</p>
              )}
              <div className="mt-2 text-[9px] flex flex-wrap items-center gap-x-2 gap-y-1 opacity-80 border-t border-status-error/20 pt-2">
                <span className="font-bold">File:</span> 
                <span className="truncate max-w-[150px] lowercase" title={pendingFile.name}>{pendingFile.name}</span>
                <span className="px-1.5 py-0.5 bg-status-error/10 border border-status-error/20">{pendingFile.type || 'unknown'}</span>
                <span>{(pendingFile.size / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
            </div>
            
            <button 
              onClick={handleRetry} 
              className="flex items-center gap-1.5 font-bold bg-status-error/20 hover:bg-status-error/30 text-status-error px-3 py-2 transition-colors w-full justify-center"
            >
              <RefreshCw className="w-3 h-3" />
              Retry Tx
            </button>
          </div>
        )}

        {error && !pendingFile && (
          <div className="mt-4 p-3 bg-status-error/10 border border-status-error text-[10px] font-mono tracking-wider uppercase flex flex-col gap-2">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-status-error" />
                <div>
                  <p className="font-bold text-status-error">{error.title}</p>
                  <p className="mt-1 opacity-90 text-status-error/80 leading-relaxed">{error.details || error.message}</p>
                </div>
              </div>
              <button onClick={handleClear} className="text-status-error/70 hover:text-status-error transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
