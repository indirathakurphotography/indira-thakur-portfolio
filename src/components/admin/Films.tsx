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
  HiPlay,
  HiArrowUpTray,
  HiStar
} from 'react-icons/hi2';
import { uploadDirectToSupabase } from '@/lib/upload';

interface FilmItem {
  _id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  publicId?: string;
  category: string;
  duration?: string;
  featured: boolean;
  order: number;
  createdAt?: string;
}

export function FilmsCMS() {
  const [films, setFilms] = useState<FilmItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingFilm, setEditingFilm] = useState<FilmItem | null>(null);

  // Form Metadata State (NO manual URL fields!)
  const [formData, setFormData] = useState({
    title: '',
    category: 'Films',
    description: '',
    duration: '',
    featured: false,
    order: 0,
    videoUrl: '',
    thumbnailUrl: '',
    publicId: '',
  });

  // Video Uploader State
  const [isVideoDragOver, setIsVideoDragOver] = useState(false);
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [videoUploadStatus, setVideoUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [videoUploadError, setVideoUploadError] = useState<string | null>(null);
  const [uploadedVideoName, setUploadedVideoName] = useState<string>('');

  // Thumbnail Uploader State
  const [isThumbDragOver, setIsThumbDragOver] = useState(false);
  const [isThumbUploading, setIsThumbUploading] = useState(false);
  const [thumbUploadProgress, setThumbUploadProgress] = useState(0);
  const [thumbUploadStatus, setThumbUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [thumbUploadError, setThumbUploadError] = useState<string | null>(null);

  // Refs for file inputs
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const thumbInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch films list
  const fetchFilms = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/films');
      if (!response.ok) throw new Error('Failed to fetch films');
      const data = await response.json();
      setFilms(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred fetching films');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFilms();
  }, [fetchFilms]);

  // Lock body scroll when form modal is open
  useEffect(() => {
    if (showForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showForm]);

  // Extract duration from video file or video URL
  const extractVideoDuration = (fileOrUrl: File | string): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      const srcUrl = typeof fileOrUrl === 'string' ? fileOrUrl : URL.createObjectURL(fileOrUrl);
      video.src = srcUrl;

      video.onloadedmetadata = () => {
        const secs = video.duration || 0;
        const mins = Math.floor(secs / 60);
        const remSecs = Math.floor(secs % 60);
        if (typeof fileOrUrl !== 'string') URL.revokeObjectURL(srcUrl);
        resolve(`${mins}:${remSecs < 10 ? '0' : ''}${remSecs}`);
      };

      video.onerror = () => {
        if (typeof fileOrUrl !== 'string') URL.revokeObjectURL(srcUrl);
        resolve('');
      };
    });
  };

  // 1. FILM VIDEO UPLOAD HANDLER (Drag & Drop / Upload from Computer, MP4/MOV/WebM, 200MB)
  const handleVideoFile = async (file: File) => {
    const isValidFormat =
      file.type.startsWith('video/') ||
      /\.(mp4|mov|webm)$/i.test(file.name);

    if (!isValidFormat) {
      setVideoUploadError('Invalid video format. Please upload MP4, MOV, or WebM files.');
      setVideoUploadStatus('error');
      return;
    }

    const maxSizeBytes = 200 * 1024 * 1024; // 200 MB
    if (file.size > maxSizeBytes) {
      setVideoUploadError(`Video file exceeds 200 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB selected).`);
      setVideoUploadStatus('error');
      return;
    }

    setIsVideoUploading(true);
    setVideoUploadStatus('uploading');
    setVideoUploadProgress(5);
    setVideoUploadError(null);
    setUploadedVideoName(file.name);

    try {
      // Auto-extract duration
      let durationStr = '';
      try {
        durationStr = await extractVideoDuration(file);
      } catch (e) {
        console.warn('Duration extraction skipped:', e);
      }

      const res = await uploadDirectToSupabase(file, 'films/videos', (pct) => {
        setVideoUploadProgress(pct);
      });

      setFormData((prev) => ({
        ...prev,
        videoUrl: res.url,
        publicId: res.publicId || '',
        duration: durationStr || prev.duration,
      }));

      setVideoUploadProgress(100);
      setVideoUploadStatus('success');
    } catch (err) {
      setVideoUploadStatus('error');
      setVideoUploadError(err instanceof Error ? err.message : 'Video upload failed');
    } finally {
      setIsVideoUploading(false);
    }
  };

  // 2. THUMBNAIL POSTER UPLOAD HANDLER (Drag & Drop / Upload from Computer, JPG/PNG/WebP, 50MB)
  const handleThumbFile = async (file: File) => {
    const isValidFormat =
      file.type.startsWith('image/') ||
      /\.(jpg|jpeg|png|webp)$/i.test(file.name);

    if (!isValidFormat) {
      setThumbUploadError('Invalid image format. Please upload JPG, PNG, or WebP images.');
      setThumbUploadStatus('error');
      return;
    }

    const maxSizeBytes = 50 * 1024 * 1024; // 50 MB
    if (file.size > maxSizeBytes) {
      setThumbUploadError(`Image file exceeds 50 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB selected).`);
      setThumbUploadStatus('error');
      return;
    }

    setIsThumbUploading(true);
    setThumbUploadStatus('uploading');
    setThumbUploadProgress(10);
    setThumbUploadError(null);

    try {
      const res = await uploadDirectToSupabase(file, 'films/thumbnails', (pct) => {
        setThumbUploadProgress(pct);
      });

      setFormData((prev) => ({
        ...prev,
        thumbnailUrl: res.url,
      }));

      setThumbUploadProgress(100);
      setThumbUploadStatus('success');
    } catch (err) {
      setThumbUploadStatus('error');
      setThumbUploadError(err instanceof Error ? err.message : 'Thumbnail upload failed');
    } finally {
      setIsThumbUploading(false);
    }
  };

  // Drag & drop handlers for Video
  const handleVideoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsVideoDragOver(true);
  };

  const handleVideoDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsVideoDragOver(false);
  };

  const handleVideoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsVideoDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleVideoFile(e.dataTransfer.files[0]);
    }
  };

  // Drag & drop handlers for Thumbnail
  const handleThumbDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsThumbDragOver(true);
  };

  const handleThumbDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsThumbDragOver(false);
  };

  const handleThumbDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsThumbDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleThumbFile(e.dataTransfer.files[0]);
    }
  };

  // Submit / Publish Film
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError('Film Title is required.');
      return;
    }

    if (!formData.videoUrl) {
      setError('Film video upload is required. Please upload a video file.');
      return;
    }

    try {
      const isEdit = Boolean(editingFilm);
      const url = isEdit ? `/api/films?id=${editingFilm!._id}` : '/api/films';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          featured: Boolean(formData.featured),
          order: Number(formData.order) || 0,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save film');
      }

      await fetchFilms();
      setShowForm(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save film');
    }
  };

  const handleEdit = (film: FilmItem) => {
    setEditingFilm(film);
    setFormData({
      title: film.title || '',
      category: film.category || 'Films',
      description: film.description || '',
      duration: film.duration || '',
      featured: film.featured || false,
      order: film.order || 0,
      videoUrl: film.videoUrl || '',
      thumbnailUrl: film.thumbnailUrl || '',
      publicId: film.publicId || '',
    });
    setVideoUploadStatus(film.videoUrl ? 'success' : 'idle');
    setUploadedVideoName(film.videoUrl ? 'Uploaded Film Video' : '');
    setThumbUploadStatus(film.thumbnailUrl ? 'success' : 'idle');
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this film? This action cannot be undone.')) return;
    try {
      const response = await fetch(`/api/films?id=${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete film');
      await fetchFilms();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete film');
    }
  };

  const resetForm = () => {
    setEditingFilm(null);
    setFormData({
      title: '',
      category: 'Films',
      description: '',
      duration: '',
      featured: false,
      order: 0,
      videoUrl: '',
      thumbnailUrl: '',
      publicId: '',
    });
    setVideoUploadStatus('idle');
    setVideoUploadProgress(0);
    setVideoUploadError(null);
    setUploadedVideoName('');
    setThumbUploadStatus('idle');
    setThumbUploadProgress(0);
    setThumbUploadError(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-8 h-8 border-2 border-[#D4AF7F]/30 border-t-[#D4AF7F] rounded-full animate-spin" />
        <p className="font-sans text-sm text-warm-gray/60">Loading Cinema & Films CMS...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase bg-[#D4AF7F]/15 text-[#8C6D46] border border-[#D4AF7F]/30 font-semibold">
              Cinema & Motion Gallery
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-rich-black font-medium">
            Films & Cinema CMS
          </h1>
          <p className="font-sans text-sm text-warm-gray/70 mt-1">
            Manage high-definition cinematic storytelling films, maternity reels, and documentary highlights
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="px-5 py-3 bg-[#1F1B1A] text-white font-sans text-xs tracking-wider uppercase flex items-center justify-center gap-2 hover:bg-charcoal transition-all rounded shadow-md group"
        >
          <HiPlus className="w-4 h-4 text-[#D4AF7F] group-hover:scale-110 transition-transform" />
          <span>Add New Film</span>
        </button>
      </div>

      {/* Global Error Banner */}
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

      {/* Add / Edit Form Modal Dialog */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-[#151211]/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 md:p-8 animate-fadeIn">
          <div className="bg-[#FAF6F3] border border-[#E7DDD2] rounded-2xl max-w-[850px] w-full max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden border-t-[#D4AF7F] border-t-2">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 sm:px-8 py-4 sm:py-5 border-b border-[#E7DDD2] bg-[#FAF6F3] sticky top-0 z-20 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1F1B1A] text-[#D4AF7F] flex items-center justify-center shadow-sm shrink-0">
                  <HiFilm className="w-5 h-5" />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono tracking-widest uppercase bg-[#D4AF7F]/15 text-[#8C6D46] border border-[#D4AF7F]/30 font-semibold">
                    Direct Upload CMS
                  </span>
                  <h2 className="font-serif text-lg sm:text-2xl text-rich-black font-medium leading-snug">
                    {editingFilm ? 'Edit Film Details' : 'Publish New Cinema Film'}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="p-2 text-warm-gray/60 hover:text-rich-black hover:bg-[#E7DDD2]/50 rounded-full transition-all"
                aria-label="Close form"
              >
                <HiXMark className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6 [scrollbar-width:thin] [scrollbar-color:#D4AF7F_transparent]">
              <form id="film-cms-form" onSubmit={handleSubmit} className="space-y-6">
                
                {/* 1. FILM VIDEO UPLOADER SECTION */}
                <div className="bg-white border border-[#E7DDD2] rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
                  <div>
                    <h3 className="font-serif text-base sm:text-lg text-rich-black flex items-center gap-2 font-medium">
                      <HiFilm className="w-5 h-5 text-[#D4AF7F]" />
                      Film Video File *
                    </h3>
                    <p className="font-sans text-xs text-warm-gray/70 mt-0.5">
                      Upload raw high-definition video (MP4, MOV, or WebM up to 200 MB)
                    </p>
                  </div>

                  {/* Video Drag & Drop Zone */}
                  <div
                    onDragOver={handleVideoDragOver}
                    onDragLeave={handleVideoDragLeave}
                    onDrop={handleVideoDrop}
                    onClick={() => videoInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[180px] ${
                      isVideoDragOver
                        ? 'border-[#D4AF7F] bg-[#D4AF7F]/10 scale-[1.005]'
                        : videoUploadStatus === 'success'
                        ? 'border-emerald-400 bg-emerald-50/40'
                        : 'border-[#E7DDD2] hover:border-[#D4AF7F] bg-[#FAF6F3]/60 hover:bg-[#FAF6F3]'
                    }`}
                  >
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleVideoFile(file);
                      }}
                      className="hidden"
                    />

                    {videoUploadStatus === 'idle' && !formData.videoUrl && (
                      <>
                        <div className="w-12 h-12 rounded-full bg-[#1F1B1A] text-[#D4AF7F] flex items-center justify-center mb-3 shadow-md">
                          <HiArrowUpTray className="w-6 h-6" />
                        </div>
                        <p className="font-serif text-base text-rich-black font-medium">
                          Drag & Drop Film Video Here
                        </p>
                        <p className="font-sans text-xs text-warm-gray/70 mt-1">
                          or <span className="text-[#8C6D46] font-semibold underline">Upload from Computer</span>
                        </p>
                        <p className="font-mono text-[10px] text-warm-gray/50 mt-2 uppercase tracking-wider">
                          MP4, MOV, WEBM • MAXIMUM 200 MB
                        </p>
                      </>
                    )}

                    {videoUploadStatus === 'uploading' && (
                      <div className="w-full max-w-md mx-auto space-y-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between text-xs font-sans">
                          <span className="text-rich-black font-medium flex items-center gap-2">
                            <HiArrowPath className="w-4 h-4 text-[#D4AF7F] animate-spin" />
                            Uploading {uploadedVideoName || 'video'}...
                          </span>
                          <span className="font-mono text-[#8C6D46] font-semibold">{videoUploadProgress}%</span>
                        </div>
                        <div className="w-full h-2 bg-[#E7DDD2] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#D4AF7F] to-[#8C6D46] transition-all duration-300 rounded-full"
                            style={{ width: `${videoUploadProgress}%` }}
                          />
                        </div>
                        <p className="font-sans text-[11px] text-warm-gray/60">
                          Directly uploading file to storage...
                        </p>
                      </div>
                    )}

                    {(videoUploadStatus === 'success' || formData.videoUrl) && !isVideoUploading && (
                      <div className="w-full flex flex-col items-center justify-center text-emerald-800 space-y-2">
                        <HiCheckCircle className="w-10 h-10 text-emerald-600" />
                        <p className="font-serif text-base font-medium text-rich-black">Film Video Uploaded & Ready</p>
                        <div className="flex items-center gap-3 text-xs" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => videoInputRef.current?.click()}
                            className="px-3 py-1 bg-[#1F1B1A] text-white rounded text-[11px] uppercase tracking-wider hover:bg-charcoal transition-colors font-medium"
                          >
                            Replace Video
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({ ...prev, videoUrl: '' }));
                              setVideoUploadStatus('idle');
                              setUploadedVideoName('');
                            }}
                            className="px-3 py-1 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded text-[11px] uppercase tracking-wider transition-colors font-medium"
                          >
                            Remove Video
                          </button>
                        </div>
                      </div>
                    )}

                    {videoUploadStatus === 'error' && (
                      <div className="flex flex-col items-center justify-center text-rose-600 space-y-2" onClick={(e) => e.stopPropagation()}>
                        <HiExclamationCircle className="w-10 h-10 text-rose-500" />
                        <p className="font-serif text-base font-medium">Video Upload Failed</p>
                        <p className="font-sans text-xs text-rose-700 max-w-md">{videoUploadError}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setVideoUploadStatus('idle');
                            videoInputRef.current?.click();
                          }}
                          className="px-4 py-1.5 bg-rose-600 text-white rounded text-xs uppercase tracking-wider hover:bg-rose-700 transition-colors mt-1"
                        >
                          Try Again
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. THUMBNAIL POSTER UPLOADER SECTION WITH PREVIEW */}
                <div className="bg-white border border-[#E7DDD2] rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
                  <div>
                    <h3 className="font-serif text-base sm:text-lg text-rich-black flex items-center gap-2 font-medium">
                      <HiPhoto className="w-5 h-5 text-[#D4AF7F]" />
                      Thumbnail Poster Image
                    </h3>
                    <p className="font-sans text-xs text-warm-gray/70 mt-0.5">
                      Upload poster image (JPG, PNG, or WebP up to 50 MB)
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-center">
                    {/* Drag & Drop Zone */}
                    <div className="sm:col-span-2">
                      <div
                        onDragOver={handleThumbDragOver}
                        onDragLeave={handleThumbDragLeave}
                        onDrop={handleThumbDrop}
                        onClick={() => thumbInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[140px] ${
                          isThumbDragOver
                            ? 'border-[#D4AF7F] bg-[#D4AF7F]/10'
                            : thumbUploadStatus === 'success' || formData.thumbnailUrl
                            ? 'border-emerald-300 bg-emerald-50/20'
                            : 'border-[#E7DDD2] hover:border-[#D4AF7F] bg-[#FAF6F3]/60 hover:bg-[#FAF6F3]'
                        }`}
                      >
                        <input
                          ref={thumbInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleThumbFile(file);
                          }}
                          className="hidden"
                        />

                        {isThumbUploading ? (
                          <div className="space-y-2 w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between text-xs font-sans">
                              <span className="text-rich-black">Uploading poster...</span>
                              <span className="font-mono text-[#8C6D46]">{thumbUploadProgress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-[#E7DDD2] rounded-full overflow-hidden">
                              <div className="h-full bg-[#D4AF7F] transition-all duration-300" style={{ width: `${thumbUploadProgress}%` }} />
                            </div>
                          </div>
                        ) : formData.thumbnailUrl ? (
                          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                            <p className="font-serif text-sm font-medium text-emerald-800 flex items-center justify-center gap-1">
                              <HiCheckCircle className="w-4 h-4 text-emerald-600" /> Poster Uploaded
                            </p>
                            <div className="flex items-center justify-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => thumbInputRef.current?.click()}
                                className="px-3 py-1 bg-[#1F1B1A] text-white text-[11px] uppercase tracking-wider rounded hover:bg-charcoal"
                              >
                                Replace
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData((prev) => ({ ...prev, thumbnailUrl: '' }));
                                  setThumbUploadStatus('idle');
                                }}
                                className="px-3 py-1 border border-rose-300 text-rose-700 hover:bg-rose-50 text-[11px] uppercase tracking-wider rounded"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <HiPhoto className="w-8 h-8 text-[#D4AF7F] mb-1" />
                            <p className="font-serif text-sm text-rich-black font-medium">
                              Drag & Drop Poster Image Here
                            </p>
                            <p className="font-sans text-[11px] text-warm-gray/70 mt-0.5">
                              or <span className="text-[#8C6D46] font-semibold underline">Upload from Computer</span>
                            </p>
                            <p className="font-mono text-[9px] text-warm-gray/50 mt-1 uppercase">
                              JPG, PNG, WEBP • MAX 50 MB
                            </p>
                          </>
                        )}
                      </div>

                      {thumbUploadError && (
                        <p className="text-xs text-rose-600 mt-1.5">{thumbUploadError}</p>
                      )}
                    </div>

                    {/* Image Preview Window */}
                    <div className="relative aspect-video bg-[#1F1B1A] rounded-xl overflow-hidden border border-[#E7DDD2] flex items-center justify-center shadow-inner">
                      {formData.thumbnailUrl ? (
                        <>
                          <img
                            src={formData.thumbnailUrl}
                            alt="Poster Preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2 bg-black/70 text-white font-mono text-[9px] px-2 py-0.5 rounded uppercase">
                            Preview
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-3 text-white/40">
                          <HiPhoto className="w-8 h-8 mx-auto mb-1" />
                          <span className="font-sans text-[10px] uppercase tracking-wider">No Poster Set</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. FILM METADATA FIELDS */}
                <div className="bg-white border border-[#E7DDD2] rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
                  <h3 className="font-serif text-base sm:text-lg text-rich-black border-b border-[#E7DDD2] pb-2 font-medium">
                    Film Information & Narrative
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-sans text-[10px] tracking-wider uppercase text-warm-gray/80 mb-1 font-semibold">
                        Film Title *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g. Whispers of the Dawn"
                        className="w-full px-3.5 py-2.5 bg-white border border-[#E7DDD2] text-rich-black font-sans text-xs rounded-lg focus:outline-none focus:border-[#D4AF7F]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-sans text-[10px] tracking-wider uppercase text-warm-gray/80 mb-1 font-semibold">
                        Category
                      </label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="e.g. Newborn Story, Maternity, Fine Art Film"
                        className="w-full px-3.5 py-2.5 bg-white border border-[#E7DDD2] text-rich-black font-sans text-xs rounded-lg focus:outline-none focus:border-[#D4AF7F]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-sans text-[10px] tracking-wider uppercase text-warm-gray/80 mb-1 font-semibold">
                        Duration (e.g., 2:30)
                      </label>
                      <input
                        type="text"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        placeholder="2:30"
                        className="w-full px-3.5 py-2.5 bg-white border border-[#E7DDD2] text-rich-black font-sans text-xs rounded-lg focus:outline-none focus:border-[#D4AF7F]"
                      />
                    </div>

                    <div className="flex items-center gap-6 pt-5">
                      <label className="flex items-center gap-2 font-sans text-xs text-rich-black cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.featured}
                          onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                          className="rounded text-[#D4AF7F] focus:ring-[#D4AF7F] w-4 h-4"
                        />
                        <span className="font-medium">Featured Film</span>
                      </label>

                      <div className="flex items-center gap-2">
                        <span className="font-sans text-[10px] text-warm-gray uppercase tracking-wider font-semibold">Order:</span>
                        <input
                          type="number"
                          value={formData.order}
                          onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                          className="w-20 px-2.5 py-1.5 border border-[#E7DDD2] rounded text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-sans text-[10px] tracking-wider uppercase text-warm-gray/80 mb-1 font-semibold">
                      Description / Story Narrative
                    </label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief editorial summary of this short film..."
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E7DDD2] text-rich-black font-sans text-xs rounded-lg focus:outline-none focus:border-[#D4AF7F]"
                    />
                  </div>
                </div>

                {/* Form Footer Bar */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E7DDD2]">
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
                    className="px-6 py-2.5 bg-[#1F1B1A] text-[#FAF6F3] border border-[#D4AF7F]/50 font-sans text-xs tracking-wider uppercase hover:bg-charcoal transition-all rounded-xl shadow-md font-medium flex items-center gap-2"
                  >
                    <HiCheckCircle className="w-4 h-4 text-[#D4AF7F]" />
                    <span>{editingFilm ? 'Update Film' : 'Publish Film'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Films Gallery List Grid */}
      {films.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-72 text-center bg-[#FAF6F3] border border-[#E7DDD2] rounded-2xl p-8">
          <HiFilm className="w-16 h-16 text-warm-gray/30 mb-3" />
          <h3 className="font-serif text-xl text-warm-gray/70">No Films Published</h3>
          <p className="font-sans text-xs text-warm-gray/50 mt-1 max-w-sm">
            Click "Add New Film" above to upload your first cinematic film.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {films.map((film) => (
            <div
              key={film._id}
              className="bg-white border border-[#E7DDD2] rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all group flex flex-col"
            >
              <div className="relative aspect-video bg-[#1F1B1A] overflow-hidden">
                {film.thumbnailUrl ? (
                  <img
                    src={film.thumbnailUrl}
                    alt={film.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white/40">
                    <HiFilm className="w-10 h-10 mb-1" />
                    <span className="font-sans text-[10px] uppercase tracking-wider">Cinematic Film</span>
                  </div>
                )}

                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-white/90 text-rich-black flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <HiPlay className="w-6 h-6 ml-0.5 text-[#D4AF7F]" />
                  </div>
                </div>

                {film.duration && (
                  <span className="absolute bottom-2 right-2 bg-black/80 text-white font-mono text-[10px] px-2 py-0.5 rounded">
                    {film.duration}
                  </span>
                )}

                {film.featured && (
                  <span className="absolute top-2 left-2 bg-[#D4AF7F] text-white font-sans text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                    <HiStar className="w-3 h-3 fill-current" /> Featured
                  </span>
                )}
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[9px] uppercase tracking-wider text-[#8C6D46] block mb-0.5 font-semibold">
                        {film.category || 'Films'}
                      </span>
                      <h3 className="font-serif text-lg font-medium text-rich-black line-clamp-1">
                        {film.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleEdit(film)}
                        className="p-1.5 rounded hover:bg-[#FAF6F3] text-warm-gray/70 hover:text-rich-black transition-colors"
                        title="Edit Film"
                      >
                        <HiPencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(film._id)}
                        className="p-1.5 rounded hover:bg-rose-50 text-warm-gray/70 hover:text-rose-600 transition-colors"
                        title="Delete Film"
                      >
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {film.description && (
                    <p className="font-sans text-xs text-warm-gray/70 mt-2 line-clamp-2 leading-relaxed">
                      {film.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-[#E7DDD2] flex items-center justify-between font-mono text-[10px] text-warm-gray/60">
                  <span>Order: {film.order}</span>
                  <span className="truncate max-w-[180px]">{film.videoUrl}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
