"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  HiPlus,
  HiTrash,
  HiPencil,
  HiXMark,
  HiPhoto,
  HiFilm,
  HiCloudArrowUp,
  HiArrowPath,
  HiCheckCircle,
  HiExclamationCircle,
  HiStar,
  HiPlay,
  HiChevronDown,
  HiChevronUp,
  HiFolderPlus,
  HiArrowUpTray,
  HiLink
} from 'react-icons/hi2';
import { MAX_VIDEO_UPLOAD_SIZE_MB } from '@/lib/uploadConstants';
import { uploadImageDirect } from '@/lib/uploadHelper';
import { uploadFile as uploadDirectToSupabase } from '@/lib/supabase-storage';
import { formatVideoEmbedUrl, getVideoThumbnail } from '@/lib/videoUrlHelper';
import { authFetch } from '@/lib/authClient';

interface VideoTestimonialItem {
  _id: string;
  clientName: string;
  title: string;
  role: string;
  quote: string;
  videoUrl: string;
  thumbnailUrl: string;
  publicId?: string;
  duration?: string;
  fileSize?: number;
  uploadSource: 'device' | 'google-drive' | 'url';
  rating: number;
  featured: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export function VideoTestimonials() {
  const [items, setItems] = useState<VideoTestimonialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<VideoTestimonialItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    clientName: '',
    title: '',
    role: '',
    quote: '',
    videoUrl: '',
    thumbnailUrl: '',
    publicId: '',
    duration: '',
    fileSize: 0,
    uploadSource: 'device' as 'device' | 'google-drive' | 'url',
    rating: 5,
    featured: false,
    order: 0,
  });

  // Video Upload State
  const [activeTab, setActiveTab] = useState<'device' | 'google-drive'>('device');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  // Expandable External URL Section State
  const [showExternalUrlSection, setShowExternalUrlSection] = useState(false);
  const [externalUrlInput, setExternalUrlInput] = useState('');

  // Google Drive Modal / Input State
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [driveFileId, setDriveFileId] = useState('');
  const [driveAccessToken, setDriveAccessToken] = useState('');

  // Thumbnail Generation State
  const [isGeneratingThumb, setIsGeneratingThumb] = useState(false);
  const [thumbUploadProgress, setThumbUploadProgress] = useState(0);

  // Hidden video element for thumbnail frame extraction
  const hiddenVideoRef = useRef<HTMLVideoElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const thumbInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch list of video testimonials
  const fetchVideoTestimonials = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authFetch('/api/video-testimonials');
      if (!response.ok) throw new Error('Failed to load video testimonials');
      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching video testimonials');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideoTestimonials();
  }, [fetchVideoTestimonials]);

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (showForm || showDriveModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showForm, showDriveModal]);

  // Format file size nicely
  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    const kb = bytes / 1024;
    return `${kb.toFixed(0)} KB`;
  };

  // Extract Thumbnail & Duration automatically from video File or Blob
  const extractVideoFrameAndDuration = (videoFileOrUrl: File | string): Promise<{ thumbnailUrl: string; durationStr: string; thumbBlob: Blob }> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      let durationStr = '';

      const srcUrl = typeof videoFileOrUrl === 'string' ? videoFileOrUrl : URL.createObjectURL(videoFileOrUrl);
      video.src = srcUrl;

      const cleanup = () => {
        if (typeof videoFileOrUrl !== 'string') {
          URL.revokeObjectURL(srcUrl);
        }
      };

      video.onloadedmetadata = () => {
        const durationSec = video.duration || 0;
        const mins = Math.floor(durationSec / 60);
        const secs = Math.floor(durationSec % 60);
        durationStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

        // Seek to 0.5s or 10% of duration to get a valid frame
        video.currentTime = Math.min(0.5, durationSec * 0.1 || 0.1);
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 1280;
          canvas.height = video.videoHeight || 720;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            cleanup();
            reject(new Error('Canvas 2D context unavailable'));
            return;
          }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          canvas.toBlob(
            (blob) => {
              cleanup();
              if (blob) {
                const previewUrl = URL.createObjectURL(blob);
                resolve({ thumbnailUrl: previewUrl, durationStr, thumbBlob: blob });
              } else {
                reject(new Error('Failed to generate video frame blob'));
              }
            },
            'image/jpeg',
            0.88
          );
        } catch (err) {
          cleanup();
          reject(err);
        }
      };

      video.onerror = (e) => {
        cleanup();
        reject(new Error('Video playback error during frame extraction'));
      };
    });
  };

  // Upload video file directly from Device
  const handleDeviceVideoUpload = async (file: File) => {
    // Check file type
    const isValidType =
      file.type.startsWith('video/') ||
      file.name.endsWith('.mp4') ||
      file.name.endsWith('.mov') ||
      file.name.endsWith('.webm');

    if (!isValidType) {
      setUploadError('Invalid video format. Please upload MP4, MOV, or WebM video files.');
      setUploadStatus('error');
      return;
    }

    // Check size limit (500MB)
    if (file.size > 500 * 1024 * 1024) {
      setUploadError(`Video file exceeds maximum limit of 500MB (${(file.size / (1024 * 1024)).toFixed(1)} MB selected).`);
      setUploadStatus('error');
      return;
    }

    setIsUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(10);
    setUploadError(null);
    setUploadedFileName(file.name);

    try {
      // 1. Auto-extract duration & thumbnail preview
      let autoDuration = '';
      let extractedBlob: Blob | null = null;
      try {
        const frameData = await extractVideoFrameAndDuration(file);
        autoDuration = frameData.durationStr;
        extractedBlob = frameData.thumbBlob;
      } catch (e) {
        console.warn('Auto frame extraction skipped:', e);
      }

      setUploadProgress(35);

      // 2. Upload video file directly to Supabase Storage (bypassing Vercel payload limits)
      const result = await uploadDirectToSupabase(file, 'videos/testimonials', (pct) => {
        const totalPct = Math.round(35 + (pct / 100) * 55);
        setUploadProgress(Math.min(totalPct, 95));
      });

      setUploadProgress(95);

      // 3. Upload auto-extracted thumbnail if available & user hasn't set one yet
      let finalThumbUrl = formData.thumbnailUrl;
      if (!finalThumbUrl && extractedBlob) {
        try {
          const thumbFile = new File([extractedBlob], `thumb-${Date.now()}.jpg`, { type: 'image/jpeg' });
          const thumbRes = await uploadImageDirect(thumbFile, 'videos/thumbnails');
          finalThumbUrl = thumbRes.url;
        } catch (tErr) {
          console.warn('Thumbnail upload warning:', tErr);
        }
      }

      setFormData((prev) => ({
        ...prev,
        videoUrl: result.url,
        publicId: result.publicId || '',
        fileSize: file.size,
        duration: autoDuration || prev.duration,
        thumbnailUrl: finalThumbUrl || prev.thumbnailUrl,
        uploadSource: 'device',
      }));

      setUploadProgress(100);
      setUploadStatus('success');
    } catch (err) {
      setUploadStatus('error');
      setUploadError(err instanceof Error ? err.message : 'Video upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Upload video from Google Drive via backend stream / File ID
  const handleGoogleDriveImport = async () => {
    if (!driveFileId) {
      setUploadError('Please enter a valid Google Drive File ID or sharing link.');
      return;
    }

    // Extract File ID if full URL pasted
    let fileId = driveFileId.trim();
    const match = fileId.match(/\/d\/([a-zA-Z0-9_-]+)/) || fileId.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      fileId = match[1];
    }

    setIsUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(15);
    setUploadError(null);

    try {
      const res = await authFetch('/api/upload/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'google-drive',
          fileId,
          accessToken: driveAccessToken || undefined,
        }),
      });

      setUploadProgress(60);

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to import Google Drive video');

      setUploadProgress(90);

      // Auto-extract duration & frame if possible from uploaded video URL
      let autoDuration = '';
      try {
        const frameData = await extractVideoFrameAndDuration(data.videoUrl);
        autoDuration = frameData.durationStr;
        if (!formData.thumbnailUrl && frameData.thumbBlob) {
          const thumbFile = new File([frameData.thumbBlob], `thumb-drive-${Date.now()}.jpg`, { type: 'image/jpeg' });
          const thumbRes = await uploadImageDirect(thumbFile, 'videos/thumbnails');
          setFormData((prev) => ({ ...prev, thumbnailUrl: thumbRes.url }));
        }
      } catch (frameErr) {
        console.warn('Frame extraction from drive URL skipped:', frameErr);
      }

      setFormData((prev) => ({
        ...prev,
        videoUrl: data.videoUrl,
        publicId: data.publicId || '',
        fileSize: data.fileSize || 0,
        duration: autoDuration || prev.duration,
        uploadSource: 'google-drive',
      }));

      setUploadProgress(100);
      setUploadStatus('success');
      setShowDriveModal(false);
      setDriveFileId('');
    } catch (err) {
      setUploadStatus('error');
      setUploadError(err instanceof Error ? err.message : 'Google Drive import failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Open Google Drive Picker or custom drive input
  const openGooglePicker = () => {
    // Check if gapi picker is available
    if (typeof window !== 'undefined' && (window as any).gapi) {
      try {
        (window as any).gapi.load('picker', {
          callback: () => {
            setShowDriveModal(true);
          },
        });
        return;
      } catch {
        setShowDriveModal(true);
      }
    }
    setShowDriveModal(true);
  };

  // External Video URL Submission
  const handleExternalUrlSubmit = () => {
    if (!externalUrlInput) return;
    if (!externalUrlInput.toLowerCase().includes('.mp4') && !externalUrlInput.startsWith('http')) {
      setUploadError('External Video URL must be a valid direct .mp4 video link.');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      videoUrl: externalUrlInput,
      uploadSource: 'url',
    }));

    setUploadStatus('success');
    setUploadedFileName(externalUrlInput.split('/').pop() || 'External MP4 Video');
  };

  // Auto-generate Thumbnail from current video URL
  const handleAutoGenerateThumbnail = async () => {
    if (!formData.videoUrl) {
      setError('Please upload or set a video URL first before generating a thumbnail.');
      return;
    }

    setIsGeneratingThumb(true);
    setThumbUploadProgress(20);

    try {
      const frameData = await extractVideoFrameAndDuration(formData.videoUrl);
      setThumbUploadProgress(60);

      const thumbFile = new File([frameData.thumbBlob], `generated-thumb-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const uploadRes = await uploadImageDirect(thumbFile, 'videos/thumbnails', (pct) => {
        setThumbUploadProgress(60 + Math.round(pct * 0.35));
      });

      setFormData((prev) => ({
        ...prev,
        thumbnailUrl: uploadRes.url,
        duration: frameData.durationStr || prev.duration,
      }));

      setThumbUploadProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate thumbnail frame');
    } finally {
      setIsGeneratingThumb(false);
      setTimeout(() => setThumbUploadProgress(0), 1000);
    }
  };

  // Single file input change handler
  const handleVideoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleDeviceVideoUpload(file);
  };

  // Thumbnail file upload handler
  const handleThumbFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file for the thumbnail (JPG, PNG, WebP).');
      return;
    }

    setIsGeneratingThumb(true);
    try {
      const res = await uploadImageDirect(file, 'videos/thumbnails');
      setFormData((prev) => ({ ...prev, thumbnailUrl: res.url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Thumbnail upload failed');
    } finally {
      setIsGeneratingThumb(false);
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleDeviceVideoUpload(files[0]);
    }
  };

  // Save / Publish Flow
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clientName) {
      setError('Client Name is required.');
      return;
    }

    if (!formData.videoUrl) {
      setError('Video upload is required. Please upload a video from Device or Google Drive.');
      return;
    }

    try {
      const isEdit = Boolean(editingItem);
      const url = isEdit ? `/api/video-testimonials?id=${editingItem!._id}` : '/api/video-testimonials';
      const method = isEdit ? 'PUT' : 'POST';

      const formattedVideoUrl = formatVideoEmbedUrl(formData.videoUrl);
      const resolvedThumb = getVideoThumbnail(formData.videoUrl, formData.thumbnailUrl);

      const response = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          videoUrl: formattedVideoUrl,
          thumbnailUrl: resolvedThumb,
          rating: parseInt(String(formData.rating)) || 5,
          featured: Boolean(formData.featured),
          order: parseInt(String(formData.order)) || 0,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to save video testimonial');
      }

      await fetchVideoTestimonials();
      setShowForm(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish video testimonial');
    }
  };

  // Edit action
  const handleEdit = (item: VideoTestimonialItem) => {
    setEditingItem(item);
    setFormData({
      id: item._id,
      clientName: item.clientName || '',
      title: item.title || '',
      role: item.role || '',
      quote: item.quote || '',
      videoUrl: item.videoUrl || '',
      thumbnailUrl: item.thumbnailUrl || '',
      publicId: item.publicId || '',
      duration: item.duration || '',
      fileSize: item.fileSize || 0,
      uploadSource: item.uploadSource || 'device',
      rating: item.rating || 5,
      featured: item.featured || false,
      order: item.order || 0,
    });
    setUploadStatus(item.videoUrl ? 'success' : 'idle');
    setUploadedFileName(item.videoUrl ? 'Hosted Video File' : '');
    setShowForm(true);
  };

  // Delete action
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video testimonial? This action cannot be undone.')) return;

    try {
      const response = await authFetch(`/api/video-testimonials?id=${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete video testimonial');
      await fetchVideoTestimonials();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    }
  };

  // Reset Form
  const resetForm = () => {
    setFormData({
      id: '',
      clientName: '',
      title: '',
      role: '',
      quote: '',
      videoUrl: '',
      thumbnailUrl: '',
      publicId: '',
      duration: '',
      fileSize: 0,
      uploadSource: 'device',
      rating: 5,
      featured: false,
      order: 0,
    });
    setEditingItem(null);
    setUploadStatus('idle');
    setUploadProgress(0);
    setUploadError(null);
    setUploadedFileName('');
    setExternalUrlInput('');
    setShowExternalUrlSection(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-8 h-8 border-2 border-magenta/30 border-t-magenta rounded-full animate-spin" />
        <p className="font-sans text-sm text-warm-gray/60">Loading video testimonials...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase bg-magenta/10 text-magenta border border-magenta/20">
              Luxury Media Hub
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-medium text-rich-black">
            Video Testimonials
          </h1>
          <p className="font-sans text-sm text-warm-gray/70 mt-1">
            Manage high-definition client video reviews, short reels, and documentary storytelling
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="px-5 py-3 bg-rich-black text-white font-sans text-xs tracking-wider uppercase flex items-center justify-center gap-2 hover:bg-charcoal transition-all rounded shadow-md group"
        >
          <HiPlus className="w-4 h-4 text-magenta group-hover:scale-110 transition-transform" />
          <span>Add Video Testimonial</span>
        </button>
      </div>

      {/* General Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between text-rose-700 text-sm">
          <div className="flex items-center gap-2">
            <HiExclamationCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-xs underline hover:no-underline font-medium">
            Dismiss
          </button>
        </div>
      )}

      {/* Add / Edit Form Modal Dialog Overlay */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-[#151211]/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 md:p-8 animate-fadeIn">
          {/* Modal Container */}
          <div className="bg-[#FAF6F3] border border-[#E7DDD2] rounded-2xl max-w-[850px] w-full max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden my-auto border-t-[#D4AF7F] border-t-2">
            
            {/* 1. FIXED HEADER */}
            <div className="flex items-center justify-between px-6 sm:px-8 py-4 sm:py-5 border-b border-[#E7DDD2] bg-[#FAF6F3] sticky top-0 z-20 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1F1B1A] text-[#D4AF7F] flex items-center justify-center shadow-sm shrink-0">
                  <HiFilm className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono tracking-widest uppercase bg-[#D4AF7F]/15 text-[#8C6D46] border border-[#D4AF7F]/30 font-semibold">
                      CMS Media Studio
                    </span>
                  </div>
                  <h2 className="font-serif text-lg sm:text-2xl text-rich-black font-medium leading-snug">
                    {editingItem ? 'Edit Video Testimonial' : 'Publish New Video Testimonial'}
                  </h2>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="p-2 text-warm-gray/60 hover:text-rich-black hover:bg-[#E7DDD2]/50 rounded-full transition-all hover:rotate-90 duration-300"
                aria-label="Close form"
              >
                <HiXMark className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* 2. SCROLLABLE BODY (INTERNAL SCROLL ONLY) */}
            <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-8 [scrollbar-width:thin] [scrollbar-color:#D4AF7F_transparent]">
              <form id="video-testimonial-form" onSubmit={handleSubmit} className="space-y-8">
                
                {/* SECTION 1: VIDEO UPLOADER */}
                <div className="bg-white border border-[#E7DDD2] rounded-xl p-5 sm:p-6 space-y-5 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-serif text-base sm:text-lg text-rich-black flex items-center gap-2 font-medium">
                        <HiFilm className="w-5 h-5 text-[#D4AF7F]" />
                        Video Content Source
                      </h3>
                      <p className="font-sans text-xs text-warm-gray/70 mt-0.5">
                        Upload raw MP4, MOV, or WebM footage (up to {MAX_VIDEO_UPLOAD_SIZE_MB}MB)
                      </p>
                    </div>

                    {/* PREMIUM SEGMENTED CONTROL */}
                    <div className="relative inline-flex items-center p-1 bg-[#F4EFEA] border border-[#E7DDD2] rounded-xl self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setActiveTab('device')}
                        className={`relative px-3.5 py-1.5 rounded-lg font-sans text-[11px] font-medium tracking-wider uppercase transition-all duration-300 flex items-center gap-2 ${
                          activeTab === 'device'
                            ? 'bg-[#1F1B1A] text-white shadow-sm border border-[#1F1B1A]'
                            : 'text-warm-gray/70 hover:text-rich-black'
                        }`}
                      >
                        <HiCloudArrowUp className={`w-4 h-4 ${activeTab === 'device' ? 'text-[#D4AF7F]' : 'text-warm-gray/60'}`} />
                        <span>From Device</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('google-drive')}
                        className={`relative px-3.5 py-1.5 rounded-lg font-sans text-[11px] font-medium tracking-wider uppercase transition-all duration-300 flex items-center gap-2 ${
                          activeTab === 'google-drive'
                            ? 'bg-[#1F1B1A] text-white shadow-sm border border-[#1F1B1A]'
                            : 'text-warm-gray/70 hover:text-rich-black'
                        }`}
                      >
                        <HiFolderPlus className={`w-4 h-4 ${activeTab === 'google-drive' ? 'text-[#4285F4]' : 'text-warm-gray/60'}`} />
                        <span>Google Drive</span>
                      </button>
                    </div>
                  </div>

                  {/* Tab 1: Upload from Device */}
                  {activeTab === 'device' && (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => videoInputRef.current?.click()}
                      className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[200px] ${
                        isDragOver
                          ? 'border-[#D4AF7F] bg-[#D4AF7F]/10 scale-[1.005]'
                          : uploadStatus === 'success'
                          ? 'border-emerald-400 bg-emerald-50/40'
                          : 'border-[#E7DDD2] hover:border-[#D4AF7F] bg-[#FAF6F3]/60 hover:bg-[#FAF6F3]'
                      }`}
                    >
                      <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
                        onChange={handleVideoInputChange}
                        className="hidden"
                      />

                      {uploadStatus === 'idle' && (
                        <>
                          <div className="w-14 h-14 rounded-full bg-[#1F1B1A] text-[#D4AF7F] flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform">
                            <HiArrowUpTray className="w-7 h-7" />
                          </div>
                          <p className="font-serif text-base text-rich-black font-medium">
                            Drag & Drop Video File Here
                          </p>
                          <p className="font-sans text-xs text-warm-gray/70 mt-1">
                            or <span className="text-[#8C6D46] font-semibold underline">click to select from computer</span>
                          </p>
                          <p className="font-mono text-[10px] text-warm-gray/50 mt-2 uppercase tracking-wider">
                            MP4, MOV, WEBM • MAX {MAX_VIDEO_UPLOAD_SIZE_MB}MB
                          </p>
                        </>
                      )}

                      {uploadStatus === 'uploading' && (
                        <div className="w-full max-w-md mx-auto space-y-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-between text-xs font-sans">
                            <span className="text-rich-black font-medium flex items-center gap-2">
                              <HiArrowPath className="w-4 h-4 text-[#D4AF7F] animate-spin" />
                              Uploading {uploadedFileName || 'video'}...
                            </span>
                            <span className="font-mono text-[#8C6D46] font-semibold">{uploadProgress}%</span>
                          </div>
                          <div className="w-full h-2 bg-[#E7DDD2] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#D4AF7F] to-[#8C6D46] transition-all duration-300 rounded-full"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                          <p className="font-sans text-[11px] text-warm-gray/60">
                            Streaming file directly to cloud storage...
                          </p>
                        </div>
                      )}

                      {uploadStatus === 'success' && (
                        <div className="flex flex-col items-center justify-center text-emerald-800 space-y-2">
                          <HiCheckCircle className="w-10 h-10 text-emerald-600 animate-bounce" />
                          <p className="font-serif text-base font-medium text-rich-black">Video Ready & Transcoded</p>
                          <p className="font-mono text-xs text-warm-gray/70 truncate max-w-md">
                            {formData.videoUrl}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs">
                            {formData.duration && (
                              <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-mono text-[11px]">
                                Duration: {formData.duration}
                              </span>
                            )}
                            {formData.fileSize > 0 && (
                              <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-mono text-[11px]">
                                Size: {formatFileSize(formData.fileSize)}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              videoInputRef.current?.click();
                            }}
                            className="mt-2 text-xs text-[#8C6D46] underline hover:no-underline font-medium"
                          >
                            Replace video file
                          </button>
                        </div>
                      )}

                      {uploadStatus === 'error' && (
                        <div className="flex flex-col items-center justify-center text-rose-600 space-y-2" onClick={(e) => e.stopPropagation()}>
                          <HiExclamationCircle className="w-10 h-10 text-rose-500" />
                          <p className="font-serif text-base font-medium">Upload Failed</p>
                          <p className="font-sans text-xs text-rose-700 max-w-md">{uploadError}</p>
                          <button
                            type="button"
                            onClick={() => {
                              setUploadStatus('idle');
                              videoInputRef.current?.click();
                            }}
                            className="px-4 py-1.5 bg-rose-600 text-white rounded-lg text-xs uppercase tracking-wider hover:bg-rose-700 transition-colors mt-2"
                          >
                            Try Again
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 2: Upload from Google Drive */}
                  {activeTab === 'google-drive' && (
                    <div className="border border-[#E7DDD2] rounded-xl p-6 bg-[#FAF6F3]/50 text-center space-y-4">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto shadow-xs">
                        <HiFolderPlus className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className="font-serif text-base text-rich-black font-medium">Google Drive Integration</h4>
                        <p className="font-sans text-xs text-warm-gray/70 max-w-md mx-auto mt-1 leading-relaxed">
                          Connect your Google Drive account to import video assets directly into your studio media library.
                        </p>
                      </div>

                      <div className="max-w-xs mx-auto pt-1">
                        <button
                          type="button"
                          onClick={openGooglePicker}
                          className="w-full py-2.5 px-5 bg-[#1F1B1A] text-white font-sans text-xs tracking-wider uppercase font-medium hover:bg-charcoal transition-all rounded-lg shadow flex items-center justify-center gap-2 border border-[#D4AF7F]/40"
                        >
                          <HiFolderPlus className="w-4 h-4 text-[#4285F4]" />
                          <span>Select Drive Video</span>
                        </button>
                      </div>

                      {formData.videoUrl && formData.uploadSource === 'google-drive' && (
                        <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-left text-xs text-emerald-800 flex items-center justify-between">
                          <div className="flex items-center gap-2 truncate">
                            <HiCheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span className="truncate font-mono text-[11px]">{formData.videoUrl}</span>
                          </div>
                          <span className="font-mono text-[9px] bg-emerald-100 px-2 py-0.5 rounded uppercase font-semibold">Drive Synced</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* External URL Accordion */}
                  <div className="border-t border-[#E7DDD2] pt-3">
                    <button
                      type="button"
                      onClick={() => setShowExternalUrlSection(!showExternalUrlSection)}
                      className="flex items-center gap-2 font-sans text-xs text-warm-gray/80 hover:text-rich-black transition-colors"
                    >
                      <HiLink className="w-4 h-4 text-[#D4AF7F]" />
                      <span>Direct Video Link (Optional)</span>
                      {showExternalUrlSection ? <HiChevronUp className="w-3.5 h-3.5" /> : <HiChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {showExternalUrlSection && (
                      <div className="mt-3 p-4 bg-[#FAF6F3] border border-[#E7DDD2] rounded-xl space-y-2.5 animate-fadeIn">
                        <label className="block font-sans text-[11px] text-warm-gray/70">
                          Direct MP4 / CDN URL (e.g. https://cdn.example.com/client-review.mp4)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={externalUrlInput}
                            onChange={(e) => setExternalUrlInput(e.target.value)}
                            placeholder="https://cdn.example.com/video.mp4"
                            className="flex-1 px-3.5 py-2 bg-white border border-[#E7DDD2] text-rich-black font-sans text-xs rounded-lg focus:outline-none focus:border-[#D4AF7F]"
                          />
                          <button
                            type="button"
                            onClick={handleExternalUrlSubmit}
                            className="px-4 py-2 bg-[#1F1B1A] text-white text-xs uppercase tracking-wider rounded-lg hover:bg-charcoal transition-colors font-medium"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* SECTION 2: THUMBNAIL POSTER */}
                <div className="bg-white border border-[#E7DDD2] rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-serif text-base sm:text-lg text-rich-black flex items-center gap-2 font-medium">
                        <HiPhoto className="w-5 h-5 text-[#D4AF7F]" />
                        Thumbnail Frame & Poster
                      </h3>
                      <p className="font-sans text-xs text-warm-gray/70">
                        Auto-capture video cover frame or upload custom image
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAutoGenerateThumbnail}
                      disabled={isGeneratingThumb || !formData.videoUrl}
                      className="px-3.5 py-1.5 bg-[#D4AF7F]/15 border border-[#D4AF7F]/40 text-[#8C6D46] font-sans text-[11px] tracking-wider uppercase rounded-lg hover:bg-[#D4AF7F] hover:text-white transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed font-medium self-start sm:self-auto"
                    >
                      <HiFilm className="w-3.5 h-3.5" />
                      <span>{isGeneratingThumb ? 'Generating...' : 'Auto Frame Capture'}</span>
                    </button>
                  </div>

                  {thumbUploadProgress > 0 && (
                    <div className="w-full bg-[#E7DDD2] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#D4AF7F] h-full transition-all duration-300" style={{ width: `${thumbUploadProgress}%` }} />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-center">
                    <div className="sm:col-span-2 space-y-2.5">
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={formData.thumbnailUrl}
                          onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                          placeholder="https://example.com/thumbnail.jpg"
                          className="flex-1 px-3.5 py-2 bg-white border border-[#E7DDD2] text-rich-black font-sans text-xs rounded-lg focus:outline-none focus:border-[#D4AF7F]"
                        />
                        <button
                          type="button"
                          onClick={() => thumbInputRef.current?.click()}
                          className="px-3.5 py-2 bg-[#F4EFEA] hover:bg-[#E7DDD2]/60 border border-[#E7DDD2] text-rich-black font-sans text-[11px] tracking-wider uppercase rounded-lg flex items-center gap-1.5 font-medium shrink-0"
                        >
                          <HiPhoto className="w-3.5 h-3.5 text-warm-gray" />
                          <span>Upload</span>
                        </button>
                        <input
                          ref={thumbInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleThumbFileUpload}
                          className="hidden"
                        />
                      </div>
                      <p className="font-sans text-[10px] text-warm-gray/60">
                        16:9 widescreen or 1:1 square ratio recommended (JPG, PNG, WebP)
                      </p>
                    </div>

                    <div className="relative aspect-video bg-[#1F1B1A] rounded-xl overflow-hidden border border-[#E7DDD2] flex items-center justify-center shadow-inner">
                      {formData.thumbnailUrl ? (
                        <img
                          src={formData.thumbnailUrl}
                          alt="Video Poster Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-3 text-white/40">
                          <HiPhoto className="w-7 h-7 mx-auto mb-1" />
                          <span className="font-sans text-[9px] uppercase tracking-wider">No Poster Set</span>
                        </div>
                      )}
                      {formData.duration && (
                        <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white font-mono text-[9px] px-1.5 py-0.5 rounded backdrop-blur-xs">
                          {formData.duration}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* SECTION 3: CLIENT & REVIEW METADATA */}
                <div className="bg-white border border-[#E7DDD2] rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
                  <h3 className="font-serif text-base sm:text-lg text-rich-black border-b border-[#E7DDD2] pb-2 font-medium">
                    Client & Review Details
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-sans text-[10px] tracking-wider uppercase text-warm-gray/80 mb-1 font-semibold">
                        Client Name *
                      </label>
                      <input
                        type="text"
                        value={formData.clientName}
                        onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                        placeholder="e.g. Priya & Vikram Mehta"
                        className="w-full px-3.5 py-2 bg-white border border-[#E7DDD2] text-rich-black font-sans text-xs rounded-lg focus:outline-none focus:border-[#D4AF7F]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-sans text-[10px] tracking-wider uppercase text-warm-gray/80 mb-1 font-semibold">
                        Headline / Title
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g. Royal Maternity Storytelling Experience"
                        className="w-full px-3.5 py-2 bg-white border border-[#E7DDD2] text-rich-black font-sans text-xs rounded-lg focus:outline-none focus:border-[#D4AF7F]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-sans text-[10px] tracking-wider uppercase text-warm-gray/80 mb-1 font-semibold">
                        Session Type / Role
                      </label>
                      <input
                        type="text"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        placeholder="e.g. Newborn Photography Client"
                        className="w-full px-3.5 py-2 bg-white border border-[#E7DDD2] text-rich-black font-sans text-xs rounded-lg focus:outline-none focus:border-[#D4AF7F]"
                      />
                    </div>

                    <div>
                      <label className="block font-sans text-[10px] tracking-wider uppercase text-warm-gray/80 mb-1 font-semibold">
                        Rating
                      </label>
                      <select
                        value={formData.rating}
                        onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                        className="w-full px-3.5 py-2 bg-white border border-[#E7DDD2] text-rich-black font-sans text-xs rounded-lg focus:outline-none focus:border-[#D4AF7F]"
                      >
                        <option value={5}>5 Stars ★★★★★</option>
                        <option value={4}>4 Stars ★★★★☆</option>
                        <option value={3}>3 Stars ★★★☆☆</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-sans text-[10px] tracking-wider uppercase text-warm-gray/80 mb-1 font-semibold">
                      Testimonial Narrative / Quote
                    </label>
                    <textarea
                      rows={3}
                      value={formData.quote}
                      onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                      placeholder="Share what the client expressed during their experience..."
                      className="w-full px-3.5 py-2 bg-white border border-[#E7DDD2] text-rich-black font-sans text-xs rounded-lg focus:outline-none focus:border-[#D4AF7F] resize-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#E7DDD2]/60">
                    <label className="flex items-center gap-2 text-xs text-rich-black cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={formData.featured}
                        onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                        className="rounded text-[#D4AF7F] focus:ring-[#D4AF7F] h-4 w-4"
                      />
                      <span>Feature on Homepage Portfolio</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-sans uppercase text-warm-gray font-medium">Display Order:</span>
                      <input
                        type="number"
                        value={formData.order}
                        onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                        className="w-16 px-2.5 py-1 border border-[#E7DDD2] rounded-lg text-xs font-mono text-center"
                      />
                    </div>
                  </div>
                </div>

              </form>
            </div>

            {/* 3. FIXED FOOTER WITH STICKY BUTTONS */}
            <div className="flex items-center justify-between px-6 sm:px-8 py-4 bg-[#FAF6F3] border-t border-[#E7DDD2] sticky bottom-0 z-20 shrink-0">
              <span className="font-sans text-xs text-warm-gray/70 hidden sm:inline-flex items-center gap-1.5">
                {formData.videoUrl ? (
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <HiCheckCircle className="w-4 h-4 text-emerald-600" /> Video attached
                  </span>
                ) : (
                  <span className="text-amber-700 font-medium">
                    • Video upload required before publishing
                  </span>
                )}
              </span>

              <div className="flex items-center gap-3 ml-auto">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="px-5 py-2.5 border border-[#E7DDD2] text-warm-gray/80 font-sans text-xs tracking-wider uppercase hover:bg-[#E7DDD2]/50 transition-all rounded-xl font-medium"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  form="video-testimonial-form"
                  className="px-6 py-2.5 bg-[#1F1B1A] text-[#FAF6F3] border border-[#D4AF7F]/50 font-sans text-xs tracking-wider uppercase hover:bg-charcoal transition-all rounded-xl shadow-md font-medium flex items-center gap-2 hover:scale-[1.01] active:scale-[0.98]"
                >
                  <HiCheckCircle className="w-4 h-4 text-[#D4AF7F]" />
                  <span>{editingItem ? 'Update Video' : 'Publish Video'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* GOOGLE DRIVE IMPORT MODAL */}
      {showDriveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-cream">
              <div className="flex items-center gap-2">
                <HiFolderPlus className="w-5 h-5 text-blue-600" />
                <h3 className="font-serif text-lg text-rich-black">Import Google Drive Video</h3>
              </div>
              <button onClick={() => setShowDriveModal(false)} className="text-warm-gray/60 hover:text-rich-black">
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            <p className="font-sans text-xs text-warm-gray/70">
              Paste the Google Drive sharing link or File ID below. The file will be imported and hosted in production storage.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block font-sans text-xs uppercase tracking-wider text-warm-gray mb-1">
                  Google Drive File ID or Sharing Link
                </label>
                <input
                  type="text"
                  value={driveFileId}
                  onChange={(e) => setDriveFileId(e.target.value)}
                  placeholder="https://drive.google.com/file/d/1ABCXYZ.../view"
                  className="w-full px-4 py-2.5 bg-white border border-cream rounded text-sm focus:outline-none focus:border-blue-500 font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDriveModal(false)}
                className="px-4 py-2 border border-cream text-xs uppercase tracking-wider text-warm-gray hover:bg-cream rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGoogleDriveImport}
                disabled={!driveFileId || isUploading}
                className="px-5 py-2 bg-blue-600 text-white text-xs uppercase tracking-wider hover:bg-blue-700 transition-colors rounded disabled:opacity-50"
              >
                {isUploading ? 'Importing...' : 'Import Video'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ITEMS LIST GRID */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-center bg-ivory/20 border border-cream/50 rounded-xl p-8">
            <HiFilm className="w-16 h-16 text-warm-gray/30 mb-3" />
            <h3 className="font-serif text-xl text-warm-gray/70">No Video Testimonials Published</h3>
            <p className="font-sans text-xs text-warm-gray/50 mt-1 max-w-sm">
              Click "Add Video Testimonial" above to upload your first client video review.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div
                key={item._id}
                className="bg-white border border-cream/60 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col"
              >
                {/* Video / Poster Frame */}
                <div className="relative aspect-video bg-charcoal overflow-hidden">
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.clientName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/40">
                      <HiPlay className="w-12 h-12 mb-1" />
                      <span className="font-sans text-[10px] uppercase tracking-wider">Video Testimonial</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-white/90 text-rich-black flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <HiPlay className="w-6 h-6 ml-0.5 text-magenta" />
                    </div>
                  </div>

                  {item.duration && (
                    <span className="absolute bottom-2 right-2 bg-black/80 text-white font-mono text-[10px] px-2 py-0.5 rounded">
                      {item.duration}
                    </span>
                  )}

                  {item.uploadSource && (
                    <span className="absolute top-2 left-2 bg-rich-black/80 text-white font-sans text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border border-white/20">
                      {item.uploadSource}
                    </span>
                  )}
                </div>

                {/* Content info */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-serif text-lg font-medium text-rich-black line-clamp-1">
                          {item.clientName}
                        </h3>
                        {item.role && (
                          <p className="font-sans text-xs text-warm-gray/60 uppercase tracking-wider">
                            {item.role}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-1">
                        {Array.from({ length: item.rating || 5 }).map((_, i) => (
                          <HiStar key={i} className="w-3.5 h-3.5 text-magenta fill-current" />
                        ))}
                      </div>
                    </div>

                    {item.title && (
                      <p className="font-serif italic text-xs text-magenta/80 mt-1 line-clamp-1">
                        "{item.title}"
                      </p>
                    )}

                    {item.quote && (
                      <p className="font-sans text-xs text-warm-gray/70 mt-2 line-clamp-2 leading-relaxed">
                        {item.quote}
                      </p>
                    )}
                  </div>

                  {/* Footer Bar */}
                  <div className="flex items-center justify-between pt-3 border-t border-cream text-xs text-warm-gray/60">
                    <span className="font-mono text-[10px]">Order: {item.order}</span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1.5 rounded hover:bg-cream text-warm-gray/70 hover:text-rich-black transition-colors"
                        title="Edit"
                      >
                        <HiPencil className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(item._id)}
                        className="p-1.5 rounded hover:bg-rose-50 text-warm-gray/70 hover:text-rose-600 transition-colors"
                        title="Delete"
                      >
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
