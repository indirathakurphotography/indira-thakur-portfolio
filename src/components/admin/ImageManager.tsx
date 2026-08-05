'use client';

import { useState, useRef, useCallback } from 'react';
import { HiPhoto, HiXMark, HiArrowDownTray, HiCheckCircle, HiExclamationCircle, HiClipboardDocument } from 'react-icons/hi2';
import { formatBytes } from '@/lib/compressImage';
import { uploadImageDirect } from '@/lib/uploadHelper';
import { toast } from '@/lib/toast';
import { IMAGE_SPECS, validateImageFile } from '@/lib/imageValidation';

interface SiteImage {
  url: string;
  alt: string;
  caption?: string;
}

interface ImageManagerProps {
  label: string;
  description?: string;
  helperText?: string;
  sectionIndicator?: string;
  value: SiteImage;
  onChange: (image: SiteImage) => void;
  aspect?: string;
  folder?: string;
  required?: boolean;
  imageType?: 'hero' | 'logo' | 'favicon' | 'gallery' | 'general';
}

interface UploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
  warning: string | null;
  success: boolean;
  fileName: string;
  fileSize: number;
  fileType: string;
  previewUrl: string | null;
  uploadingText?: string;
}

export default function ImageManager({
  label,
  description,
  helperText,
  sectionIndicator,
  value,
  onChange,
  aspect = 'aspect-[4/3]',
  folder = 'site',
  imageType = 'general',
}: ImageManagerProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
    warning: null,
    success: false,
    fileName: '',
    fileSize: 0,
    fileType: '',
    previewUrl: null,
  });
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const clearUploadState = useCallback(() => {
    setUploadState({
      uploading: false,
      progress: 0,
      error: null,
      warning: null,
      success: false,
      fileName: '',
      fileSize: 0,
      fileType: '',
      previewUrl: null,
    });
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setUploadState(prev => ({ ...prev, error: validation.error! }));
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (imageType === 'hero') {
      const img = new window.Image();
      const objectUrl = URL.createObjectURL(file);
      await new Promise<void>((resolve) => {
        img.onload = () => {
          const ratio = img.width / img.height;
          if (ratio >= 0.75 && ratio <= 1.5) {
            setUploadState(prev => ({ ...prev, warning: 'This image appears to be a logo or square image. Hero backgrounds work best with landscape photographs.' }));
          }
          URL.revokeObjectURL(objectUrl);
          resolve();
        };
        img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(); };
        img.src = objectUrl;
      });
    }

    const sizeWarning = file.size < 100 * 1024 ? 'This image may be low quality.' : null;

    const localPreview = URL.createObjectURL(file);

    setUploadState({
      uploading: true,
      progress: 0,
      error: null,
      warning: sizeWarning,
      success: false,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      previewUrl: localPreview,
      uploadingText: 'Uploading...',
    });

    try {
      const result = await uploadImageDirect(
        file,
        folder,
        (progress) => {
          setUploadState(prev => ({ ...prev, progress }));
        },
      );

      URL.revokeObjectURL(localPreview);

      setUploadState(prev => ({
        ...prev,
        uploading: false,
        progress: 100,
        success: true,
        warning: null,
        previewUrl: null,
        uploadingText: `Uploaded ${formatFileSize(file.size)}`,
      }));

      onChange({
        url: result.url,
        alt: value.alt || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        caption: value.caption || '',
      });

      setTimeout(() => {
        setUploadState(prev => ({ ...prev, success: false }));
      }, 3000);

    } catch (err: any) {
      if (err.name === 'AbortError') {
        setUploadState(prev => ({
          ...prev,
          uploading: false,
          progress: 0,
          error: 'Upload was cancelled',
          warning: null,
          previewUrl: null,
        }));
        URL.revokeObjectURL(localPreview);
        return;
      }

      const errorMessage = err.message || 'Upload failed. Please check your connection and try again.';

      setUploadState(prev => ({
        ...prev,
        uploading: false,
        progress: 0,
        error: errorMessage,
        warning: null,
        previewUrl: localPreview,
      }));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [folder, value.alt, value.caption, onChange, imageType]);

  const handleUrlSubmit = useCallback(() => {
    if (!urlInput.trim()) return;

    try {
      new URL(urlInput.trim());
    } catch {
      setUploadState(prev => ({ ...prev, error: 'Please enter a valid URL' }));
      return;
    }

    setUploadState(prev => ({ ...prev, error: null, success: false }));

    onChange({
      url: urlInput.trim(),
      alt: value.alt || '',
      caption: value.caption || '',
    });

    setUrlInput('');
    setShowUrlInput(false);

    setUploadState(prev => ({ ...prev, success: true }));
    setTimeout(() => {
      setUploadState(prev => ({ ...prev, success: false }));
    }, 3000);
  }, [urlInput, value.alt, value.caption, onChange]);

  const handleRemove = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    clearUploadState();
    onChange({ url: '', alt: '', caption: '' });
  }, [clearUploadState, onChange]);

  const handleCopyUrl = useCallback(() => {
    if (!value.url) return;
    navigator.clipboard.writeText(value.url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [value.url]);

  const hasImage = value.url && value.url.trim() !== '';
  const hasPreview = uploadState.previewUrl && uploadState.uploading;

  return (
    <div className="space-y-2">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          {sectionIndicator && (
            <span className="inline-flex items-center px-2 py-0.5 bg-magenta/10 text-magenta font-mono text-[9px] uppercase tracking-wider rounded">
              {sectionIndicator}
            </span>
          )}
          <label className="block font-sans text-xs font-medium tracking-wider uppercase text-warm-gray/70">
            {label}
          </label>
        </div>
        {description && (
          <p className="font-sans text-[11px] text-warm-gray/40 mb-2">{description}</p>
        )}
        {helperText && (
          <p className="font-sans text-[10px] text-warm-gray/30 italic mb-2">{helperText}</p>
        )}
      </div>

      {/* Upload Area */}
      <div
        role="button"
        tabIndex={0}
        className={`border-2 border-dashed rounded-lg ${aspect} flex items-center justify-center transition-all cursor-pointer relative overflow-hidden group ${
          uploadState.error
            ? 'border-red-300 bg-red-50/30'
            : uploadState.success
            ? 'border-green-300 bg-green-50/30'
            : hasImage
            ? 'border-cream/60 hover:border-magenta/30'
            : 'border-cream/60 hover:border-magenta/30 bg-ivory/30'
        }`}
        onClick={() => !uploadState.uploading && fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !uploadState.uploading) {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={IMAGE_SPECS[imageType]?.accept || 'image/jpeg,image/png,image/webp'}
          onChange={handleFileSelect}
          className="hidden"
        />

        {uploadState.uploading ? (
          <div className="text-center p-4 z-10">
            {hasPreview && (
              <img
                src={uploadState.previewUrl!}
                alt="Uploading preview"
                className="w-16 h-16 object-cover rounded mx-auto mb-3 opacity-50"
              />
            )}
            <div className="w-10 h-10 border-2 border-magenta/30 border-t-magenta rounded-full animate-spin mx-auto mb-3" />
            <p className="font-sans text-xs text-warm-gray/60 mb-1">{uploadState.uploadingText || 'Uploading...'}</p>
            <div className="w-32 h-1.5 bg-cream rounded-full mx-auto overflow-hidden">
              <div
                className="h-full bg-magenta transition-all duration-300 rounded-full"
                style={{ width: `${uploadState.progress}%` }}
              />
            </div>
            <p className="font-mono text-[10px] text-warm-gray/40 mt-1">{uploadState.progress}%</p>
          </div>
        ) : hasImage ? (
          <>
            <img
              src={value.url}
              alt={value.alt || label}
              className="w-full h-full object-contain absolute inset-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-rich-black/0 group-hover:bg-rich-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="text-center text-white">
                <HiPhoto className="w-8 h-8 mx-auto mb-1" />
                <p className="font-sans text-xs">Click to replace</p>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center p-4 z-10">
            <HiPhoto className="w-10 h-10 text-warm-gray/20 mx-auto mb-2" />
            <p className="font-sans text-xs text-warm-gray/50">Click to upload an image</p>
            <div className="mt-2 space-y-0.5">
              {IMAGE_SPECS[imageType] && (
                <>
                  <p className="font-sans text-[10px] text-warm-gray/30">
                    Recommended: {IMAGE_SPECS[imageType].recommendedResolution}
                  </p>
                  <p className="font-sans text-[10px] text-warm-gray/30">
                    Aspect Ratio: {IMAGE_SPECS[imageType].aspectRatio}
                  </p>
                  <p className="font-sans text-[10px] text-warm-gray/30">
                    Max {IMAGE_SPECS[imageType].maxSizeMB} MB · JPG, PNG, WebP
                  </p>
                </>
              )}
              {!IMAGE_SPECS[imageType] && (
                <p className="font-sans text-[10px] text-warm-gray/30">
                  Max 50 MB · JPG, PNG, WebP
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* File Info */}
      {uploadState.fileName && !uploadState.uploading && (
        <div className="flex items-center gap-3 px-3 py-2 bg-ivory/50 rounded border border-cream/40">
          <div className="flex-1 min-w-0">
            <p className="font-sans text-[11px] text-warm-gray/60 truncate">{uploadState.fileName}</p>
            <p className="font-mono text-[10px] text-warm-gray/40">
              {formatFileSize(uploadState.fileSize)} · {uploadState.fileType.split('/')[1]?.toUpperCase()}
            </p>
          </div>
          {uploadState.success && (
            <HiCheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
          )}
        </div>
      )}

      {/* Error */}
      {uploadState.error && (
        <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded">
          <HiExclamationCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-sans text-[11px] text-red-600">{uploadState.error}</p>
          </div>
          <button
            type="button"
            onClick={clearUploadState}
            className="text-red-400 hover:text-red-600 flex-shrink-0"
          >
            <HiXMark className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Warning */}
      {uploadState.warning && !uploadState.error && (
        <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded">
          <HiExclamationCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-sans text-[11px] text-amber-600">{uploadState.warning}</p>
          </div>
          <button
            type="button"
            onClick={() => setUploadState(prev => ({ ...prev, warning: null }))}
            className="text-amber-400 hover:text-amber-600 flex-shrink-0"
          >
            <HiXMark className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Success */}
      {uploadState.success && !uploadState.uploading && (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded">
          <HiCheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
          <p className="font-sans text-[11px] text-green-600">Image uploaded successfully</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {hasImage && (
          <>
            <button
              type="button"
              onClick={handleCopyUrl}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] border border-cream/60 text-warm-gray/60 font-sans text-[11px] hover:bg-cream/50 transition-all rounded"
            >
              <HiClipboardDocument className="w-3 h-3" />
              {copied ? 'Copied!' : 'Copy URL'}
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] border border-cream/60 text-warm-gray/60 font-sans text-[11px] hover:bg-cream/50 transition-all rounded"
            >
              <HiArrowDownTray className="w-3 h-3" />
              Replace
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] border border-cream/60 text-warm-gray/60 font-sans text-[11px] hover:bg-cream/50 transition-all rounded"
        >
          {showUrlInput ? 'Hide URL input' : 'Use image URL'}
        </button>
        {hasImage && (
          <button
            type="button"
            onClick={handleRemove}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] border border-red-200 text-red-500 font-sans text-[11px] hover:bg-red-50 transition-all rounded"
          >
            <HiXMark className="w-3 h-3" />
            Remove
          </button>
        )}
      </div>

      {/* URL Input */}
      {showUrlInput && (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste an image URL (https://...)"
            className="flex-1 px-3 py-2 bg-white border border-cream/60 text-rich-black font-sans text-xs rounded focus:outline-none focus:border-magenta/40"
            onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
          />
          <button
            type="button"
            onClick={handleUrlSubmit}
            disabled={!urlInput.trim()}
            className="px-4 py-2 min-h-[44px] bg-rich-black text-white font-sans text-[11px] uppercase tracking-wider rounded hover:bg-charcoal transition-colors disabled:opacity-30"
          >
            Add
          </button>
        </div>
      )}

      {/* Image Metadata Fields */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block font-sans text-[10px] text-warm-gray/50 uppercase tracking-wider mb-1">
            Image Description
          </label>
          <input
            type="text"
            value={value.alt || ''}
            onChange={(e) => onChange({ ...value, alt: e.target.value })}
            placeholder="Describe this image for SEO"
            className="w-full px-3 py-1.5 bg-white border border-cream/60 text-rich-black font-sans text-xs rounded focus:outline-none focus:border-magenta/40"
          />
          <p className="font-sans text-[9px] text-warm-gray/30 mt-0.5">Helps with search engines and accessibility</p>
        </div>
        <div>
          <label className="block font-sans text-[10px] text-warm-gray/50 uppercase tracking-wider mb-1">
            Image Caption (Optional)
          </label>
          <input
            type="text"
            value={value.caption || ''}
            onChange={(e) => onChange({ ...value, caption: e.target.value })}
            placeholder="Text shown below the image"
            className="w-full px-3 py-1.5 bg-white border border-cream/60 text-rich-black font-sans text-xs rounded focus:outline-none focus:border-magenta/40"
          />
          <p className="font-sans text-[9px] text-warm-gray/30 mt-0.5">Optional text displayed with the image</p>
        </div>
      </div>

      {/* Current Image URL Display */}
      {hasImage && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-cream/30 rounded border border-cream/40">
          <span className="font-mono text-[9px] text-warm-gray/30 truncate flex-1">{value.url}</span>
        </div>
      )}
    </div>
  );
}
