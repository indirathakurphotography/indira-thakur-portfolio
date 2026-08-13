'use client';

import { useState, useRef, useEffect, DragEvent, ChangeEvent } from 'react';
import { 
  HiArrowUpTray, 
  HiLink, 
  HiTrash, 
  HiClipboardDocument, 
  HiCheck, 
  HiArrowPath, 
  HiExclamationCircle,
  HiPhoto
} from 'react-icons/hi2';
import { uploadImageDirect } from '@/lib/uploadHelper';

interface MediaUploaderProps {
  value: string;
  onChange: (url: string, publicId?: string) => void;
  label?: string;
  description?: string;
  aspectRatio?: string; // e.g. "aspect-video", "aspect-[4/3]", "aspect-[16/9]"
  accept?: string;
  maxSizeMb?: number;
  folder?: string;
}

export default function MediaUploader({
  value,
  onChange,
  label = 'Media Asset',
  description = 'Upload a high-quality image (JPG, PNG, WEBP) or provide an external image URL.',
  aspectRatio = 'aspect-[4/3]',
  accept = 'image/jpeg,image/png,image/webp,image/gif,image/avif',
  maxSizeMb = 10,
  folder = 'admin-uploads',
}: MediaUploaderProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>('Uploading...');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isImgLoading, setIsImgLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset image load state whenever value changes
  useEffect(() => {
    setImgError(false);
    setIsImgLoading(true);
  }, [value]);

  const handleUploadFile = async (file: File) => {
    setError(null);
    if (!file) return;

    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`File size exceeds the ${maxSizeMb}MB limit.`);
      return;
    }

    if (accept.includes('image') && !file.type.startsWith('image/')) {
      setError('Invalid file type. Please upload a valid image (JPG, PNG, WEBP).');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(10);
      setUploadStatus('Preparing file...');

      const result = await uploadImageDirect(file, folder, (progress, statusMsg) => {
        setUploadProgress(progress);
        if (statusMsg) setUploadStatus(statusMsg);
      });

      const finalUrl = result.url || '';
      if (!finalUrl) {
        throw new Error('Upload succeeded but no valid image URL was generated.');
      }

      setImgError(false);
      setIsImgLoading(true);
      onChange(finalUrl, result.publicId || '');
    } catch (err: any) {
      console.error('[MediaUploader Error]', err);
      setError(err?.message || 'Error uploading image. Please check your network connection.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadStatus('');
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUploadFile(e.target.files[0]);
    }
  };

  const handleApplyUrl = () => {
    setError(null);
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setError('Please enter a valid image URL.');
      return;
    }
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/')) {
      setError('Image URL must start with http:// or https://');
      return;
    }
    setImgError(false);
    setIsImgLoading(true);
    onChange(trimmed);
  };

  const handleUrlInputChange = (val: string) => {
    setUrlInput(val);
    setError(null);
    const trimmed = val.trim();
    // Live update preview if valid full URL is typed or pasted
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
      setImgError(false);
      setIsImgLoading(true);
      onChange(trimmed);
    }
  };

  const handleCopyUrl = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemove = () => {
    setImgError(false);
    setUrlInput('');
    onChange('');
  };

  return (
    <div className="space-y-3">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block font-sans text-xs font-semibold uppercase tracking-wider text-[#2B2625]">
            {label}
          </label>
          {value && (
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Media Configured
            </span>
          )}
        </div>
      )}

      {description && (
        <p className="text-xs text-[#7C706D]">{description}</p>
      )}

      {/* Existing Image Preview */}
      {value ? (
        <div className="bg-[#FAF6F3] border border-[#E7DDD2] rounded-xl p-4 space-y-3">
          <div className={`relative ${aspectRatio} w-full max-w-md mx-auto rounded-lg overflow-hidden border border-[#E7DDD2] bg-[#1C1817] shadow-inner flex items-center justify-center`}>
            {isImgLoading && !imgError && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#1C1817]/80 text-[#C39E96] space-y-2">
                <HiArrowPath className="w-6 h-6 animate-spin" />
                <span className="text-[11px] font-mono tracking-wider text-[#A89F91]">Loading Preview...</span>
              </div>
            )}

            {!imgError ? (
              <img
                src={value}
                alt="Media Preview"
                referrerPolicy="no-referrer"
                onLoad={() => setIsImgLoading(false)}
                onError={() => {
                  setIsImgLoading(false);
                  setImgError(true);
                }}
                className={`w-full h-full object-cover transition-opacity duration-300 ${isImgLoading ? 'opacity-0' : 'opacity-100'}`}
              />
            ) : (
              <div className="p-4 text-center space-y-2 text-amber-200 max-w-xs">
                <HiExclamationCircle className="w-7 h-7 mx-auto text-amber-400 shrink-0" />
                <p className="text-xs font-medium text-white">Image Preview Unavailable</p>
                <p className="text-[11px] text-[#A89F91] break-all line-clamp-2" title={value}>{value}</p>
                <button
                  type="button"
                  onClick={() => {
                    setImgError(false);
                    setIsImgLoading(true);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md text-[11px] hover:bg-amber-500/30 transition-colors mt-1"
                >
                  <HiArrowPath className="w-3.5 h-3.5" /> Retry Load
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#E7DDD2]/80">
            <span className="text-xs text-[#7C706D] font-mono truncate max-w-[200px] sm:max-w-[300px]" title={value}>
              {value}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyUrl}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-white border border-[#E7DDD2] text-[#2B2625] hover:bg-[#FAF6F3] transition-colors"
                title="Copy Image URL"
              >
                {copied ? <HiCheck className="w-3.5 h-3.5 text-emerald-600" /> : <HiClipboardDocument className="w-3.5 h-3.5 text-[#7C706D]" />}
                {copied ? 'Copied' : 'Copy URL'}
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-[#C39E96] text-white hover:bg-[#B28B83] transition-colors font-medium shadow-2xs"
              >
                <HiArrowPath className="w-3.5 h-3.5" /> Replace
              </button>

              <button
                type="button"
                onClick={handleRemove}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors font-medium"
              >
                <HiTrash className="w-3.5 h-3.5 text-rose-600" /> Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Upload / URL Input Container */
        <div className="bg-white border border-[#E7DDD2] rounded-xl p-4 space-y-4">
          <div className="flex items-center border-b border-[#E7DDD2] pb-2 space-x-4">
            <button
              type="button"
              onClick={() => { setActiveTab('upload'); setError(null); }}
              className={`text-xs font-semibold pb-2 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'border-[#C39E96] text-[#2B2625]'
                  : 'border-transparent text-[#7C706D] hover:text-[#2B2625]'
              }`}
            >
              <HiArrowUpTray className="w-4 h-4" /> Upload File (Drag & Drop)
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('url'); setError(null); }}
              className={`text-xs font-semibold pb-2 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'url'
                  ? 'border-[#C39E96] text-[#2B2625]'
                  : 'border-transparent text-[#7C706D] hover:text-[#2B2625]'
              }`}
            >
              <HiLink className="w-4 h-4" /> Use Image URL
            </button>
          </div>

          {activeTab === 'upload' ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-[#C39E96] bg-[#FAF6F3] scale-[0.99]'
                  : 'border-[#E7DDD2] bg-[#FAF6F3]/50 hover:bg-[#FAF6F3] hover:border-[#C39E96]/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleFileChange}
                className="hidden"
              />

              {uploading ? (
                <div className="space-y-3 py-2">
                  <HiArrowPath className="w-8 h-8 mx-auto text-[#C39E96] animate-spin" />
                  <p className="text-xs font-medium text-[#2B2625]">{uploadStatus || 'Uploading image to storage...'}</p>
                  <div className="w-48 h-1.5 bg-[#E7DDD2] rounded-full mx-auto overflow-hidden">
                    <div 
                      className="h-full bg-[#C39E96] transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-full bg-white border border-[#E7DDD2] flex items-center justify-center mx-auto text-[#C39E96] shadow-2xs">
                    <HiPhoto className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#2B2625]">
                      <span className="text-[#C39E96] underline underline-offset-2 font-semibold">Click to upload</span> or drag and drop image file
                    </p>
                    <p className="text-[11px] text-[#7C706D] mt-0.5">
                      JPG, PNG, WEBP up to {maxSizeMb}MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#7C706D] mb-1">
                  Hosted Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => handleUrlInputChange(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 px-3 py-2 text-xs border border-[#E7DDD2] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#C39E96] bg-white text-[#2B2625]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyUrl}
                    className="px-4 py-2 bg-[#C39E96] text-white text-xs font-medium rounded-lg hover:bg-[#B28B83] transition-colors shadow-2xs shrink-0"
                  >
                    Apply URL
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <HiExclamationCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {/* Hidden fallback file input if replace button triggered */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
