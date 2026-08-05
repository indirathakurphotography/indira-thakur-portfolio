"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { HiPlus, HiTrash, HiPencil, HiEye, HiArrowDownTray, HiDocumentText, HiPhoto, HiFilm, HiMusicalNote, HiArrowPath, HiXMark } from 'react-icons/hi2';
import { uploadImageDirect } from '@/lib/uploadHelper';

export interface FileItem {
  _id?: string;
  id: string;
  url: string;
  publicId: string;
  filename: string;
  originalName: string;
  size: number;
  type: string;
  folder: string;
  createdAt: string;
  updatedAt?: string;
}

type FileCategory = 'images' | 'videos' | 'documents' | 'audio' | 'archives' | 'other';

interface FileManagerProps {
  folder?: string;
  onSelect?: (file: FileItem) => void;
  allowedTypes?: string[];
  multiple?: boolean;
}

const getFileCategory = (type: string): FileCategory => {
  if (type.startsWith('image/')) return 'images';
  if (type.startsWith('video/')) return 'videos';
  if (type.startsWith('audio/')) return 'audio';
  if (type === 'application/pdf') return 'documents';
  if (type.includes('word') || type.includes('document')) return 'documents';
  if (type.includes('powerpoint') || type.includes('presentation')) return 'documents';
  if (type.includes('excel') || type.includes('spreadsheet')) return 'documents';
  if (type.includes('zip') || type.includes('compressed')) return 'archives';
  return 'other';
};

const getFileIcon = (category: FileCategory, type: string) => {
  switch (category) {
    case 'images': return <HiPhoto className="w-8 h-8 text-green-500" />;
    case 'videos': return <HiFilm className="w-8 h-8 text-purple-500" />;
    case 'audio': return <HiMusicalNote className="w-8 h-8 text-orange-500" />;
    case 'documents': return <HiDocumentText className="w-8 h-8 text-blue-500" />;
    case 'archives': return <HiDocumentText className="w-8 h-8 text-gray-500" />;
    default: return <HiDocumentText className="w-8 h-8 text-gray-400" />;
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const canPreview = (type: string): boolean => {
  return type.startsWith('image/') || type.startsWith('video/') || type === 'application/pdf';
};

const getPreviewContent = (file: FileItem) => {
  const category = getFileCategory(file.type);
  if (category === 'images') {
    return <img src={file.url} alt={file.originalName} className="max-w-full max-h-full object-contain" />;
  }
  if (category === 'videos') {
    return (
      <video src={file.url} controls className="max-w-full max-h-full" />
    );
  }
  if (file.type === 'application/pdf') {
    return (
      <iframe 
        src={file.url} 
        className="w-full h-full border-0" 
        title={file.originalName}
      />
    );
  }
  return null;
};

export function FileManager({
  folder = 'uploads',
  onSelect,
  allowedTypes,
  multiple = false,
}: FileManagerProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [filter, setFilter] = useState<FileCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'date' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ folder });
      const response = await fetch(`/api/files?${params}`);
      if (!response.ok) throw new Error('Failed to fetch files');
      const data = await response.json();
      setFiles(data.files || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [folder]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const result = await uploadImageDirect(file, folder);
      fetchFiles();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const handleMultipleUpload = async (files: FileList) => {
    for (const file of Array.from(files)) {
      if (allowedTypes && !allowedTypes.some(t => file.type.match(t))) {
        setError(`File type ${file.type} not allowed`);
        continue;
      }
      try {
        await handleUpload(file);
      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err);
      }
    }
  };

  const handleDelete = async (file: FileItem) => {
    if (!confirm(`Delete "${file.originalName}"?`)) return;

    try {
      const isImage = file.type.startsWith('image/');
      const params = new URLSearchParams({
        url: file.url,
        publicId: file.publicId,
        isImage: isImage.toString(),
      });
      
      const response = await fetch(`/api/upload?${params}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed');
      
      fetchFiles();
      if (selectedFile?.id === file.id) {
        setSelectedFile(null);
        setShowPreview(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleReplace = async (file: FileItem, newFile: File) => {
    try {
      await handleDelete(file);
      const result = await handleUpload(newFile);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Replace failed');
      throw err;
    }
  };

  const handleDownload = async (file: FileItem) => {
    try {
      const response = await fetch(file.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      // Use setTimeout to allow click to process, then safely remove
      setTimeout(() => {
        if (a.parentNode) document.body.removeChild(a);
      }, 0);
    } catch (err) {
      setError('Download failed');
    }
  };

  const handleSelect = (file: FileItem) => {
    setSelectedFile(file);
    if (onSelect) onSelect(file);
    setShowPreview(true);
  };

  const filteredFiles = files
    .filter(file => {
      if (filter !== 'all' && getFileCategory(file.type) !== filter) return false;
      if (search) {
        const searchLower = search.toLowerCase();
        return (
          file.originalName.toLowerCase().includes(searchLower) ||
          file.type.toLowerCase().includes(searchLower)
        );
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.originalName.localeCompare(b.originalName);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const categories: { key: FileCategory | 'all'; label: string; count: number }[] = [
    { key: 'all', label: 'All Files', count: files.length },
    { key: 'images', label: 'Images', count: files.filter(f => getFileCategory(f.type) === 'images').length },
    { key: 'videos', label: 'Videos', count: files.filter(f => getFileCategory(f.type) === 'videos').length },
    { key: 'documents', label: 'Documents', count: files.filter(f => getFileCategory(f.type) === 'documents').length },
    { key: 'audio', label: 'Audio', count: files.filter(f => getFileCategory(f.type) === 'audio').length },
    { key: 'archives', label: 'Archives', count: files.filter(f => getFileCategory(f.type) === 'archives').length },
    { key: 'other', label: 'Other', count: files.filter(f => getFileCategory(f.type) === 'other').length },
  ];

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleMultipleUpload(files);
    }
    e.target.value = '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rich-black"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-b border-cream/50">
        <div>
          <h2 className="font-serif text-xl text-rich-black">File Manager</h2>
          <p className="font-sans text-sm text-warm-gray/60">{files.length} files in {folder}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={triggerFileInput}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-rich-black text-white font-sans text-sm hover:bg-charcoal transition-colors disabled:opacity-50"
          >
            <HiPlus className="w-4 h-4" />
            Upload
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple={multiple}
            onChange={handleFileInputChange}
            className="hidden"
            accept={allowedTypes?.join(',')}
          />
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex items-center justify-between">
          <span className="text-red-700 text-sm font-sans">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <HiXMark className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="p-4 border-b border-cream/50 space-y-4">
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setFilter(cat.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-sans transition-all ${
                filter === cat.key
                  ? 'bg-rich-black text-white'
                  : 'bg-cream text-warm-gray hover:bg-beige'
              }`}
            >
              {cat.label} <span className="ml-1 text-xs opacity-75">({cat.count})</span>
            </button>
          ))}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <HiPencil className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray/40" />
            <input
              type="text"
              placeholder="Search files..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-cream/50 rounded-lg text-sm font-sans focus:outline-none focus:border-magenta/60"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-2 border border-cream/50 rounded-lg text-sm font-sans focus:outline-none focus:border-magenta/60"
            >
              <option value="date">Date</option>
              <option value="name">Name</option>
              <option value="size">Size</option>
              <option value="type">Type</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 border border-cream/50 rounded-lg hover:bg-cream transition-colors"
              title={sortOrder === 'asc' ? 'Descending' : 'Ascending'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* File Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-warm-gray/50">
            <HiDocumentText className="w-16 h-16 mb-4 opacity-25" />
            <p className="font-sans">No files found</p>
            <p className="text-sm">Upload your first file or adjust filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredFiles.map(file => {
              const category = getFileCategory(file.type);
              const isSelected = selectedFile?.id === file.id;
              const previewable = canPreview(file.type);

              return (
                <div
                  key={file.id}
                  className={`relative group bg-white border rounded-lg overflow-hidden transition-all ${
                    isSelected 
                      ? 'border-2 border-magenta/60 shadow-lg' 
                      : 'border-cream/50 hover:border-magenta/30 hover:shadow-md'
                  }`}
                  onClick={() => handleSelect(file)}
                >
                  <div className="aspect-square relative bg-gray-50 flex items-center justify-center overflow-hidden">
                    {previewable && category === 'images' ? (
                      <img
                        src={file.url}
                        alt={file.originalName}
                        className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-4 text-center">
                        {getFileIcon(category, file.type)}
                        <span className="mt-2 text-xs font-sans text-warm-gray/60 truncate max-w-full">
                          {file.originalName}
                        </span>
                      </div>
                    )}

                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-magenta/60/20 flex items-center justify-center">
                        <div className="w-8 h-8 bg-magenta/60 rounded-full flex items-center justify-center">
                          <HiXMark className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}

                    {/* Action buttons on hover */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {previewable && (
                        <button
                          onClick={e => { e.stopPropagation(); handleSelect(file); }}
                          className="p-1.5 bg-white/90 rounded hover:bg-white shadow-lg"
                          title="Preview"
                        >
                          <HiEye className="w-4 h-4 text-rich-black" />
                        </button>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); handleDownload(file); }}
                        className="p-1.5 bg-white/90 rounded hover:bg-white shadow-lg"
                        title="Download"
                      >
                        <HiArrowDownTray className="w-4 h-4 text-rich-black" />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(file); }}
                        className="p-1.5 bg-white/90 rounded hover:bg-white shadow-lg text-red-500"
                        title="Delete"
                      >
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </div>

                    {/* File type badge */}
                    <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-rich-black/80 text-white text-xs font-sans rounded">
                      {category}
                    </div>
                  </div>

                  <div className="p-3 min-h-[60px]">
                    <p className="font-sans text-sm font-medium text-rich-black truncate" title={file.originalName}>
                      {file.originalName}
                    </p>
                    <div className="flex items-center justify-between mt-1 text-xs text-warm-gray/60 font-sans">
                      <span>{formatFileSize(file.size)}</span>
                      <span>{formatDate(file.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && selectedFile && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-rich-black/80 backdrop-blur-sm p-4"
          onClick={() => setShowPreview(false)}
        >
          <div 
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-cream/50">
              <h3 className="font-serif text-lg text-rich-black truncate pr-4">{selectedFile.originalName}</h3>
              <div className="flex items-center gap-2">
                <span className="font-sans text-xs text-warm-gray/60">{formatFileSize(selectedFile.size)}</span>
                <button
                  onClick={() => handleDownload(selectedFile)}
                  className="p-2 hover:bg-cream rounded-lg transition-colors"
                  title="Download"
                >
                  <HiArrowDownTray className="w-5 h-5 text-rich-black" />
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-cream rounded-lg transition-colors"
                  title="Close"
                >
                  <HiXMark className="w-5 h-5 text-rich-black" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-gray-50 min-h-[300px]">
              {getPreviewContent(selectedFile) || (
                <div className="text-center">
                  {getFileIcon(getFileCategory(selectedFile.type), selectedFile.type)}
                  <p className="mt-4 font-sans text-warm-gray/60">Preview not available for this file type</p>
                  <button
                    onClick={() => handleDownload(selectedFile)}
                    className="mt-4 px-4 py-2 bg-rich-black text-white font-sans text-sm rounded-lg hover:bg-charcoal transition-colors"
                  >
                    Download to View
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-cream/50 bg-cream/50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-sans">
                <div>
                  <p className="text-warm-gray/60">Type</p>
                  <p className="text-rich-black">{selectedFile.type}</p>
                </div>
                <div>
                  <p className="text-warm-gray/60">Size</p>
                  <p className="text-rich-black">{formatFileSize(selectedFile.size)}</p>
                </div>
                <div>
                  <p className="text-warm-gray/60">Uploaded</p>
                  <p className="text-rich-black">{formatDate(selectedFile.createdAt)}</p>
                </div>
                <div>
                  <p className="text-warm-gray/60">Folder</p>
                  <p className="text-rich-black truncate">{selectedFile.folder}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress Modal */}
      {uploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-rich-black/80 backdrop-blur-sm">
          <div className="bg-white rounded-lg p-6 w-full max-w-md text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rich-black mx-auto mb-4"></div>
            <p className="font-sans text-warm-gray">Uploading files...</p>
          </div>
        </div>
      )}
    </div>
  );
}