"use client";

import { useState, useEffect, useCallback } from 'react';
import { HiPlus, HiTrash, HiPencil, HiStar, HiArrowDownTray, HiLink, HiXMark, HiPhoto } from 'react-icons/hi2';
import { uploadImageDirect } from '@/lib/uploadHelper';

interface Testimonial {
  _id: string;
  name: string;
  role: string;
  image: string;
  publicId: string;
  content: string;
  rating: number;
  featured: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    role: '',
    image: '',
    publicId: '',
    content: '',
    rating: 5,
    featured: false,
    order: 0,
    uploadMethod: 'url' as 'url' | 'upload',
  });

  const fetchTestimonials = useCallback(async () => {
    try {
      const response = await fetch('/api/testimonials');
      if (!response.ok) throw new Error('Failed to fetch testimonials');
      const data = await response.json();
      setTestimonials(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  const handleImageUpload = async (file: File): Promise<{ url: string; publicId: string }> => {
    const data = await uploadImageDirect(file, 'testimonials');
    return { url: data.url, publicId: data.publicId };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.content) {
      setError('Name and content are required');
      return;
    }

    try {
      const url = editingTestimonial
        ? `/api/testimonials?id=${editingTestimonial._id}`
        : '/api/testimonials';
      const method = editingTestimonial ? 'PUT' : 'POST';

      const submitData = {
        ...formData,
        rating: parseInt(String(formData.rating)) || 5,
        featured: Boolean(formData.featured),
        order: parseInt(String(formData.order)) || 0,
      };

      if (editingTestimonial) {
        submitData.id = editingTestimonial._id;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) throw new Error('Failed to save testimonial');

      await fetchTestimonials();
      setShowForm(false);
      setEditingTestimonial(null);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError('File size must be less than 20MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const result = await handleImageUpload(file);
      setFormData(prev => ({ ...prev, image: result.url, publicId: result.publicId }));
      setUploadProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleEdit = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setFormData({
      id: testimonial._id,
      name: testimonial.name || '',
      role: testimonial.role || '',
      image: testimonial.image || '',
      publicId: testimonial.publicId || '',
      content: testimonial.content || '',
      rating: testimonial.rating || 5,
      featured: testimonial.featured || false,
      order: testimonial.order || 0,
      uploadMethod: 'url',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string, publicId: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;

    try {
      const response = await fetch(`/api/testimonials?id=${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete testimonial');

      if (publicId) {
        await fetch(`/api/upload?publicId=${publicId}&isImage=true`, { method: 'DELETE' });
      }

      await fetchTestimonials();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      role: '',
      image: '',
      publicId: '',
      content: '',
      rating: 5,
      featured: false,
      order: 0,
      uploadMethod: 'url',
    });
    setEditingTestimonial(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    resetForm();
  };

  if (loading) return <div className="flex items-center justify-center h-64">Loading testimonials...</div>;
  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">{error}</div>;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="font-serif text-2xl md:text-3xl text-rich-black">Testimonial Management</h2>
          <p className="font-sans text-sm text-warm-gray/60 mt-1">Manage client testimonials and reviews</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-5 py-3 bg-rich-black text-white font-sans text-xs tracking-wider uppercase hover:bg-charcoal transition-all"
        >
          <HiPlus className="w-4 h-4" />
          Add Testimonial
        </button>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="mb-4 p-4 bg-ivory border border-cream rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-sans text-sm text-rich-black">Uploading image...</span>
            <span className="font-mono text-sm text-magenta">{uploadProgress}%</span>
          </div>
          <div className="w-full h-2 bg-cream rounded-full overflow-hidden">
            <div 
              className="h-full bg-magenta transition-all duration-300" 
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white border border-cream/50 rounded-lg p-6 mb-6 max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="testimonial-form-title">
          <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-4 border-b border-cream z-10">
            <h3 id="testimonial-form-title" className="font-serif text-xl text-rich-black">
              {editingTestimonial ? 'Edit Testimonial' : 'Add New Testimonial'}
            </h3>
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-cream rounded-lg transition-colors"
              aria-label="Close form"
            >
              <HiXMark className="w-5 h-5 text-warm-gray" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-serif text-lg text-rich-black border-b border-cream pb-2">Client Information</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-sans text-xs tracking-wider uppercase text-warm-gray/60 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-cream/60 text-rich-black placeholder:text-warm-gray/40 font-sans text-sm transition-all focus:outline-none focus:border-magenta/40"
                    required
                  />
                </div>
                <div>
                  <label className="block font-sans text-xs tracking-wider uppercase text-warm-gray/60 mb-2">
                    Role / Session Type
                  </label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-cream/60 text-rich-black placeholder:text-warm-gray/40 font-sans text-sm transition-all focus:outline-none focus:border-magenta/40"
                    placeholder="e.g., Newborn Session"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-sans text-xs tracking-wider uppercase text-warm-gray/60 mb-2">
                    Rating (1-5)
                  </label>
                  <select
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-white border border-cream/60 text-rich-black font-sans text-sm transition-all focus:outline-none focus:border-magenta/40 appearance-none bg-white"
                  >
                    <option value={5}>5 - Excellent</option>
                    <option value={4}>4 - Very Good</option>
                    <option value={3}>3 - Good</option>
                    <option value={2}>2 - Fair</option>
                    <option value={1}>1 - Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block font-sans text-xs tracking-wider uppercase text-warm-gray/60 mb-2">
                    Order
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-white border border-cream/60 text-rich-black placeholder:text-warm-gray/40 font-sans text-sm transition-all focus:outline-none focus:border-magenta/40"
                    min="0"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="h-4 w-4 text-magenta focus:ring-magenta/50 border-cream/60 rounded"
                    />
                    <span className="ml-2 font-sans text-sm text-warm-gray/70">Featured</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t border-cream pt-6">
              <h4 className="font-serif text-lg text-rich-black border-b border-cream pb-2">Testimonial Content</h4>
              <div>
                <label className="block font-sans text-xs tracking-wider uppercase text-warm-gray/60 mb-2">
                  Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-white border border-cream/60 text-rich-black placeholder:text-warm-gray/40 font-sans text-sm transition-all focus:outline-none focus:border-magenta/40 resize-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-4 border-t border-cream pt-6">
              <h4 className="font-serif text-lg text-rich-black border-b border-cream pb-2">Client Photo</h4>
              
              <div className="flex gap-4 border-b border-cream">
                {['url', 'upload'].map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, uploadMethod: method as 'url' | 'upload' }))}
                    className={`py-2 px-4 font-sans text-sm font-medium transition-colors ${
                      formData.uploadMethod === method
                        ? 'text-magenta border-b-2 border-magenta'
                        : 'text-warm-gray/60 hover:text-rich-black'
                    }`}
                  >
                    {method === 'url' ? 'Image URL' : 'Upload from Computer'}
                  </button>
                ))}
              </div>

              {formData.uploadMethod === 'url' && (
                <div>
                  <label className="block font-sans text-xs tracking-wider uppercase text-warm-gray/60 mb-2">
                    Photo URL
                  </label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-cream/60 text-rich-black placeholder:text-warm-gray/40 font-sans text-sm transition-all focus:outline-none focus:border-magenta/40"
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
              )}

              {formData.uploadMethod === 'upload' && (
                <div>
                  <label className="block font-sans text-xs tracking-wider uppercase text-warm-gray/60 mb-2">
                    Select Photo
                  </label>
                  <div
                    className="border-2 border-dashed border-cream/60 rounded-lg p-8 text-center hover:border-magenta/40 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('testimonial-photo-upload')?.click()}
                  >
                    <input
                      id="testimonial-photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <HiPhoto className="w-12 h-12 mx-auto text-warm-gray/40 mb-3" />
                    <p className="font-sans text-sm text-warm-gray/60">Click or drag to upload</p>
                    <p className="font-sans text-xs text-warm-gray/40 mt-1">JPG, PNG, WebP up to 20MB</p>
                  </div>
                  {formData.image && (
                    <div className="mt-4 p-3 bg-ivory rounded-lg flex items-center justify-between">
                      <img src={formData.image} alt="Preview" className="w-16 h-16 object-cover rounded" />
                      <div className="ml-4 flex-1">
                        <p className="font-sans text-sm text-rich-black">Photo selected</p>
                        <p className="font-sans text-xs text-warm-gray/60 truncate max-w-md">{formData.image}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-cream sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={handleCancel}
                className="px-5 py-3 border border-cream/60 text-warm-gray/70 font-sans text-xs tracking-wider uppercase hover:bg-cream transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-3 bg-rich-black text-white font-sans text-xs tracking-wider uppercase hover:bg-charcoal transition-all"
              >
                {editingTestimonial ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Testimonials List */}
      <div className="flex-1 overflow-y-auto">
        {testimonials.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <HiStar className="w-16 h-16 text-warm-gray/30 mb-4" />
            <p className="font-serif text-xl text-warm-gray/60">No testimonials yet</p>
            <p className="font-sans text-sm text-warm-gray/40 mt-1">Click "Add Testimonial" to create your first testimonial</p>
          </div>
        ) : (
          <div className="space-y-4">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial._id}
                className="bg-white border border-cream/50 rounded-lg p-6 flex flex-col sm:flex-row sm:items-start justify-between group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-serif text-lg text-rich-black">{testimonial.name}</h3>
                    {testimonial.featured && <HiStar className="w-4 h-4 text-magenta/60 flex-shrink-0" />}
                  </div>
                  <p className="font-sans text-xs text-warm-gray/60 uppercase tracking-wider mb-2">{testimonial.role}</p>
                  <p className="font-sans text-sm text-warm-gray/70 line-clamp-3">{testimonial.content}</p>
                  <div className="flex gap-1 mt-2">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <span key={i} className="text-magenta/60 text-xs">★</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-warm-gray/50">
                    <span>Order: {testimonial.order}</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 opacity-0 group-hover:opacity-100 transition-opacity mt-4 sm:mt-0 sm:ml-4">
                  <button
                    onClick={() => handleEdit(testimonial)}
                    className="p-2 rounded-lg hover:bg-cream text-warm-gray/60 hover:text-rich-black transition-all"
                    aria-label="Edit"
                  >
                    <HiPencil className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(testimonial._id, testimonial.publicId)}
                    className="p-2 rounded-lg hover:bg-magenta/5 text-warm-gray/60 hover:text-magenta transition-all"
                    aria-label="Delete"
                  >
                    <HiTrash className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}