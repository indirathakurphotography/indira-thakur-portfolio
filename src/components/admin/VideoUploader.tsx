'use client';

import React, { useState, useRef, useEffect, DragEvent, ChangeEvent } from 'react';
import {
  HiArrowUpTray,
  HiLink,
  HiTrash,
  HiClipboardDocument,
  HiCheck,
  HiArrowPath,
  HiExclamationCircle,
  HiFilm,
  HiCheckCircle,
  HiPlay,
} from 'react-icons/hi2';
import { uploadVideoDirect } from '@/lib/uploadHelper';
import { validateVideoFile } from '@/lib/imageValidation';
import { MAX_VIDEO_UPLOAD_SIZE_MB, VIDEO_ACCEPT_STRING } from '@/lib/uploadConstants';
import { formatBytes } from '@/lib/compressImage';
import { formatVideoEmbedUrl, isDirectVideoUrl, extractGoogleDriveFileId } from '@/lib/videoUrlHelper';

interface VideoUploaderProps {
  value: string;
  onChange: (url: string, metadata?: { fileSize?: number; duration?: string; publicId?: string; filename?: string }) => void;
  label?: string;
  description?: string;
  maxSizeMb?: number;
  initialFileSize?: number;
  initialFileName?: string;
}

export default function VideoUploader({
  value,
  onChange,
  label = 'Upload Video *',
  description = 'Upload a high-quality video testimonial file (MP4, WebM, MOV, M4V) up to 200MB, or import from Google Drive.',
  maxSizeMb = MAX_VIDEO_UPLOAD_SIZE_MB,
  initialFileSize = 0,
  initialFileName = '',
}: VideoUploaderProps) {
  const safeValue = typeof value === 'string' ? value.trim() : '';

  const [activeTab, setActiveTab] = useState<'upload' | 'drive' | 'url'>('upload');
  const [driveUrlInput, setDriveUrlInput] = useState('');
  const [directUrlInput, setDirectUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>('Uploading video...');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [fileName, setFileName] = useState<string>(initialFileName);
  const [fileSize, setFileSize] = useState<number>(initialFileSize);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initial metadata if value exists
  useEffect(() => {
    if (initialFileName) setFileName(initialFileName);
    if (initialFileSize) setFileSize(initialFileSize);
  }, [initialFileName, initialFileSize]);

  const handleUploadFile = async (file: File) => {
    setError(null);
    if (!file) return;

    // Validate using video-specific validation (Strictly Video MIME / Extensions)
    const validation = validateVideoFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file type. Please upload a valid video file (MP4, WebM, MOV, M4V).');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(10);
      setUploadStatus('Preparing video upload...');
      setFileName(file.name);
      setFileSize(file.size);

      const result = await uploadVideoDirect(file, 'videos/testimonials', (progress, statusMsg) => {
        setUploadProgress(progress);
        if (statusMsg) setUploadStatus(statusMsg);
      });

      const finalUrl = result.url || '';
      if (!finalUrl) {
        throw new Error('Video upload completed but no valid video URL was returned.');
      }

      onChange(finalUrl, {
        fileSize: result.fileSize || file.size,
        duration: result.duration,
        publicId: result.publicId,
        filename: file.name,
      });
    } catch (err: any) {
      console.error('[VideoUploader Error]', err);
      setError(err?.message || 'Error uploading video. Please check your connection and try again.');
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

  const handleApplyDriveLink = () => {
    setError(null);
    const trimmed = driveUrlInput.trim();
    if (!trimmed) {
      setError('Please enter a Google Drive video link.');
      return;
    }

    const driveId = extractGoogleDriveFileId(trimmed);
    if (!driveId) {
      setError('Could not recognize a valid Google Drive file ID from this URL.');
      return;
    }

    const previewUrl = `https://drive.google.com/file/d/${driveId}/preview`;
    setFileName(`Google Drive Video (${driveId.substring(0, 10)}...)`);
    onChange(previewUrl, { filename: `gdrive-${driveId}.mp4` });
  };

  const handleApplyDirectUrl = () => {
    setError(null);
    const trimmed = directUrlInput.trim();
    if (!trimmed) {
      setError('Please enter a valid video URL.');
      return;
    }

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/')) {
      setError('Video URL must start with http:// or https://');
      return;
    }

    const name = trimmed.split('/').pop()?.split('?')[0] || 'remote-video.mp4';
    setFileName(name);
    onChange(trimmed, { filename: name });
  };

  const handleCopyUrl = () => {
    if (!safeValue) return;
    navigator.clipboard.writeText(safeValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemove = () => {
    setDriveUrlInput('');
    setDirectUrlInput('');
    setFileName('');
    setFileSize(0);
    onChange('');
  };

  const isDirectVideo = isDirectVideoUrl(safeValue);
  const isDriveLink = Boolean(extractGoogleDriveFileId(safeValue));

  return (
    <div className="space-y-3">
      {/* Label and Status */}
      <div className="flex items-center justify-between">
        <label className="block font-sans text-xs font-semibold uppercase tracking-wider text-[#2B2625]">
          {label}
        </label>
        {safeValue && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            <HiCheckCircle className="w-3.5 h-3.5" />
            Video Configured
          </span>
        )}
      </div>

      {description && <p className="text-xs text-[#7C706D]">{description}</p>}

      {/* Selected Video Player & Details */}
      {safeValue ? (
        <div className="bg-[#FAF6F3] border border-[#E7DDD2] rounded-xl p-4 space-y-3">
          <div className="relative aspect-video w-full max-w-lg mx-auto rounded-lg overflow-hidden border border-[#E7DDD2] bg-black shadow-inner flex items-center justify-center">
            {isDirectVideo ? (
              <video
                src={safeValue}
                controls
                className="w-full h-full object-contain"
                preload="metadata"
              >
                Your browser does not support the video element.
              </video>
            ) : isDriveLink ? (
              <iframe
                src={formatVideoEmbedUrl(safeValue)}
                title="Google Drive Video Preview"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            ) : (
              <iframe
                src={formatVideoEmbedUrl(safeValue)}
                title="Video Testimonial Preview"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            )}
          </div>

          {/* Video Metadata & Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E7DDD2]">
            <div className="flex flex-col gap-0.5 overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#2B2625] truncate max-w-[240px]">
                  {fileName || safeValue.split('/').pop()?.split('?')[0] || 'Uploaded Video'}
                </span>
                {fileSize > 0 && (
                  <span className="text-[10px] font-mono bg-[#E7DDD2]/70 text-[#2B2625] px-1.5 py-0.5 rounded">
                    {formatBytes(fileSize)}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-mono text-[#7C706D] truncate max-w-[280px]" title={safeValue}>
                {safeValue}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyUrl}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-white border border-[#E7DDD2] text-[#2B2625] hover:bg-[#FAF6F3] transition-colors"
                title="Copy Video URL"
              >
                {copied ? <HiCheck className="w-3.5 h-3.5 text-emerald-600" /> : <HiClipboardDocument className="w-3.5 h-3.5 text-[#7C706D]" />}
                {copied ? 'Copied' : 'Copy URL'}
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-[#2B2625] text-white hover:bg-[#3D3534] transition-colors font-medium shadow-2xs"
              >
                <HiArrowPath className="w-3.5 h-3.5 text-[#C39E96]" /> Replace Video
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
        /* Video Upload Area */
        <div className="bg-white border border-[#E7DDD2] rounded-xl p-4 space-y-4">
          {/* Tabs */}
          <div className="flex flex-wrap items-center border-b border-[#E7DDD2] gap-2 sm:gap-4 pb-2">
            <button
              type="button"
              onClick={() => { setActiveTab('upload'); setError(null); }}
              className={`text-xs font-semibold pb-2 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'upload'
                  ? 'border-[#C39E96] text-[#2B2625]'
                  : 'border-transparent text-[#7C706D] hover:text-[#2B2625]'
              }`}
            >
              <HiArrowUpTray className="w-4 h-4 text-[#C39E96]" /> Upload Video (Drag & Drop)
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('drive'); setError(null); }}
              className={`text-xs font-semibold pb-2 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'drive'
                  ? 'border-[#C39E96] text-[#2B2625]'
                  : 'border-transparent text-[#7C706D] hover:text-[#2B2625]'
              }`}
            >
              <HiFilm className="w-4 h-4 text-blue-600" /> Google Drive Video Link
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('url'); setError(null); }}
              className={`text-xs font-semibold pb-2 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'url'
                  ? 'border-[#C39E96] text-[#2B2625]'
                  : 'border-transparent text-[#7C706D] hover:text-[#2B2625]'
              }`}
            >
              <HiLink className="w-4 h-4 text-amber-600" /> Direct Video URL
            </button>
          </div>

          {/* Tab 1: Upload Video File */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
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
                  accept={VIDEO_ACCEPT_STRING}
                  onChange={handleFileChange}
                  className="hidden"
                />

                {uploading ? (
                  <div className="space-y-3 py-3">
                    <HiArrowPath className="w-8 h-8 mx-auto text-[#C39E96] animate-spin" />
                    <p className="text-xs font-medium text-[#2B2625]">{uploadStatus || 'Uploading video to storage...'}</p>
                    <div className="w-56 h-2 bg-[#E7DDD2] rounded-full mx-auto overflow-hidden">
                      <div
                        className="h-full bg-[#C39E96] transition-all duration-300 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-[11px] font-mono text-[#7C706D]">{uploadProgress}% complete</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-full bg-white border border-[#E7DDD2] flex items-center justify-center mx-auto text-[#C39E96] shadow-2xs">
                      <HiFilm className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#2B2625]">
                        Drag and drop your video file here, or
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2B2625] text-white text-xs font-medium hover:bg-[#3D3534] transition-colors shadow-xs cursor-pointer"
                      >
                        <HiArrowUpTray className="w-3.5 h-3.5 text-[#C39E96]" /> Browse Computer
                      </button>
                      <p className="text-[11px] text-[#7C706D] mt-2 font-sans">
                        Supported formats: <strong className="text-[#2B2625]">MP4, WebM, MOV, M4V</strong> (Max file size: <strong className="text-[#2B2625]">{maxSizeMb} MB</strong>)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Google Drive Video Link */}
          {activeTab === 'drive' && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-950 space-y-1">
                <p className="font-semibold flex items-center gap-1.5 text-blue-900">
                  <HiFilm className="w-4 h-4 text-blue-600" />
                  Paste any Google Drive Video Sharing Link
                </p>
                <p className="text-[11px] text-blue-800">
                  Example: <code className="bg-white/90 px-1 py-0.5 rounded border border-blue-200">https://drive.google.com/file/d/FILE_ID/view</code>
                </p>
                <p className="text-[11px] text-blue-700/90 pt-0.5">
                  &bull; Make sure the video file share permission is set to &ldquo;Anyone with the link can view&rdquo;.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#2B2625] mb-1">
                  Google Drive Video Link or File ID
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={driveUrlInput}
                    onChange={(e) => {
                      setDriveUrlInput(e.target.value);
                      setError(null);
                    }}
                    placeholder="https://drive.google.com/file/d/1a2b3c4d5e.../view"
                    className="flex-1 px-3 py-2 text-xs border border-[#E7DDD2] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#C39E96] bg-[#FAF6F3] focus:bg-white text-[#2B2625]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyDriveLink}
                    className="px-4 py-2 bg-[#2B2625] text-white text-xs font-medium rounded-lg hover:bg-[#3D3534] transition-colors shadow-2xs shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <HiCheck className="w-3.5 h-3.5 text-[#C39E96]" /> Load Drive Video
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Direct Video URL */}
          {activeTab === 'url' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#2B2625] mb-1">
                  Direct Video URL (.mp4, .webm, .mov, or Storage link)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={directUrlInput}
                    onChange={(e) => {
                      setDirectUrlInput(e.target.value);
                      setError(null);
                    }}
                    placeholder="https://storage.supabase.co/.../video.mp4"
                    className="flex-1 px-3 py-2 text-xs border border-[#E7DDD2] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#C39E96] bg-[#FAF6F3] focus:bg-white text-[#2B2625]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyDirectUrl}
                    className="px-4 py-2 bg-[#2B2625] text-white text-xs font-medium rounded-lg hover:bg-[#3D3534] transition-colors shadow-2xs shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <HiCheck className="w-3.5 h-3.5 text-[#C39E96]" /> Apply URL
                  </button>
                </div>
                <p className="text-[11px] text-[#7C706D] mt-1">
                  Paste a direct link to an MP4, WebM, MOV, or hosted video file.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <HiExclamationCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-rose-600 hover:text-rose-900 font-bold px-1"
              >
                &times;
              </button>
            </div>
          )}
        </div>
      )}

      {/* Hidden file input for Replace */}
      <input
        ref={fileInputRef}
        type="file"
        accept={VIDEO_ACCEPT_STRING}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
