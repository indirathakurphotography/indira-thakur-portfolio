"use client";

import { useState, useEffect, useCallback } from 'react';
import { HiPlus, HiTrash, HiPencil, HiPhoto, HiArrowDownTray, HiLink, HiXMark, HiDocumentText, HiArrowPath } from 'react-icons/hi2';
import { uploadImageDirect } from '@/lib/uploadHelper';

interface Service {
  _id: string;
  title: string;
  slug: string;
  description: string;
  heroImage: string;
  publicId: string;
  benefits: string[];
  gallery: string[];
  price: string;
  cta: string;
  featured: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

export function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeUploadField, setActiveUploadField] = useState<'heroImage' | 'gallery' | null>(null);
  const [galleryUploadIndex, setGalleryUploadIndex] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    slug: '',
    description: '',
    heroImage: '',
    publicId: '',
    benefits: [''],
    gallery: [''],
    price: '',
    cta: 'Book Now',
    featured: false,
    order: 0,
    uploadMethod: 'url' as 'url' | 'upload',
  });

  const fetchServices = useCallback(async () => {
    try {
      const response = await fetch('/api/services');
      if (!response.ok) throw new Error('Failed to fetch services');
      const data = await response.json();
      setServices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleImageUpload = async (file: File): Promise<{ url: string; publicId: string }> => {
    const data = await uploadImageDirect(file, 'services');
    return { url: data.url, publicId: data.publicId };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.slug) {
      setError('Title and slug are required');
      return;
    }

    try {
      const url = editingService
        ? `/api/services?id=${editingService._id}`
        : '/api/services';
      const method = editingService ? 'PUT' : 'POST';

      const submitData = {
        ...formData,
        order: parseInt(String(formData.order)) || 0,
        featured: Boolean(formData.featured),
        benefits: formData.benefits.filter(b => b.trim()),
        gallery: formData.gallery.filter(g => g.trim()),
      };

      if (editingService) {
        submitData.id = editingService._id;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) throw new Error('Failed to save service');

      await fetchServices();
      setShowForm(false);
      setEditingService(null);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'heroImage' | 'gallery', index?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError('File size must be less than 100MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setActiveUploadField(field);
    if (field === 'gallery') setGalleryUploadIndex(index!);

    try {
      const result = await handleImageUpload(file);
      if (field === 'heroImage') {
        setFormData(prev => ({ ...prev, heroImage: result.url, publicId: result.publicId }));
      } else if (field === 'gallery' && index !== undefined) {
        setFormData(prev => ({
          ...prev,
          gallery: prev.gallery.map((g, i) => i === index ? result.url : g),
        }));
      }
      setUploadProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setTimeout(() => {
        setUploadProgress(0);
        setActiveUploadField(null);
        setGalleryUploadIndex(null);
      }, 1000);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      id: service._id,
      title: service.title || '',
      slug: service.slug || '',
      description: service.description || '',
      heroImage: service.heroImage || '',
      publicId: service.publicId || '',
      benefits: service.benefits?.length ? [...service.benefits] : [''],
      gallery: service.gallery?.length ? [...service.gallery] : [''],
      price: service.price || '',
      cta: service.cta || 'Book Now',
      featured: service.featured || false,
      order: service.order || 0,
      uploadMethod: 'url',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string, publicId: string, galleryImages: string[]) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const response = await fetch(`/api/services?id=${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete service');

      // Delete images from storage
      if (publicId) {
        await fetch(`/api/upload?publicId=${publicId}&isImage=true`, { method: 'DELETE' });
      }
      for (const img of galleryImages) {
        if (img) {
          // Extract publicId from URL if needed
        }
      }

      await fetchServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      title: '',
      slug: '',
      description: '',
      heroImage: '',
      publicId: '',
      benefits: [''],
      gallery: [''],
      price: '',
      cta: 'Book Now',
      featured: false,
      order: 0,
      uploadMethod: 'url',
    });
    setEditingService(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    resetForm();
  };

  const addBenefit = () => {
    setFormData(prev => ({ ...prev, benefits: [...prev.benefits, ''] }));
  };

  const removeBenefit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index),
    }));
  };

  const updateBenefit = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.map((b, i) => i === index ? value : b),
    }));
  };

  const addGalleryItem = () => {
    setFormData(prev => ({ ...prev, gallery: [...prev.gallery, ''] }));
  };

  const removeGalleryItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index),
    }));
  };

  const updateGalleryItem = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      gallery: prev.gallery.map((g, i) => i === index ? value : g),
    }));
  };

  if (loading) return <div className="flex items-center justify-center h-64">Loading services...</div>;
  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">{error}</div>;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="font-serif text-2xl md:text-3xl text-rich-black">Services Management</h2>
          <p className="font-sans text-sm text-warm-gray/60 mt-1">Manage your photography services and pricing</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-5 py-3 bg-rich-black text-white font-sans text-xs tracking-wider uppercase hover:bg-charcoal transition-all"
        >
          <HiPlus className="w-4 h-4" />
          Add Service
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
        <div className="bg-white border border-cream/50 rounded-lg p-6 mb-6 max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="service-form-title">
          <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-4 border-b border-cream z-10">
            <h3 id="service-form-title" className="font-serif text-xl text-rich-black">
              {editingService ? 'Edit Service' : 'Add New Service'}
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
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="font-serif text-lg text-rich-black border-b border-cream pb-2">Basic Information</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-sans text-xs tracking-wider uppercase text-warm-gray/60 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        title: e.target.value,
                        slug: generateSlug(e.target.value) || formData.slug,
                      });
                    }}
                    className="w-full px-4 py-3 bg-white border border-cream/60 text-rich-black placeholder:text-warm-gray/40 font-sans text-sm transition-all focus:outline-none focus:border-magenta/40"
                    required
                  />
                </div>
                <div>
                  <label className="block font-sans text-xs tracking-wider uppercase text-warm-gray/60 mb-2">
                    Slug (URL)
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-cream/60 text-rich-black placeholder:text-warm-gray/40 font-sans text-sm transition-all focus:outline-none focus:border-magenta/40"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-sans text-xs tracking-wider uppercase text-warm-gray/60 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-cream/60 text-rich-black placeholder:text-warm-gray/40 font-sans text-sm transition-all focus:outline-none focus:border-magenta/40 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-sans text-xs tracking-wider uppercase text-warm-gray/60 mb-2">
                    Price
                  </label>
                  <input
                    type="text"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-cream/60 text-rich-black placeholder:text-warm-gray/40 font-sans text-sm transition-all focus:outline-none focus:border-magenta/40"
                    placeholder="e.g., Starting at $299"
                  />
                </div>
                <div>
                  <label className="block font-sans text-xs tracking-wider uppercase text-warm-gray/60 mb-2">
                    CTA Text
                  </label>
                  <input
                    type="text"
                    value={formData.cta}
                    onChange={(e) => setFormData({ ...formData, cta: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-cream/60 text-rich-black placeholder:text-warm-gray/40 font-sans text-sm transition-all focus:outline-none focus:border-magenta/40"
                    placeholder="Book Now"
                  />
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
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="h-4 w-4 text-magenta focus:ring-magenta/50 border-cream/60 rounded"
                />
                <label htmlFor="featured" className="ml-2 font-sans text-sm text-warm-gray/70">
                  Featured Service
                </label>
              </div>
            </div>

            {/* Hero Image */}
            <div className="space-y-4 border-t border-cream pt-6">
              <h4 className="font-serif text-lg text-rich-black border-b border-cream pb-2">Hero Image</h4>
              
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
                    Hero Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.heroImage}
                    onChange={(e) => setFormData({ ...formData, heroImage: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-cream/60 text-rich-black placeholder:text-warm-gray/40 font-sans text-sm transition-all focus:outline-none focus:border-magenta/40"
                    placeholder="https://example.com/hero-image.jpg"
                  />
                </div>
              )}

              {formData.uploadMethod === 'upload' && (
                <div>
                  <label className="block font-sans text-xs tracking-wider uppercase text-warm-gray/60 mb-2">
                    Select Hero Image
                  </label>
                  <div
                    className="border-2 border-dashed border-cream/60 rounded-lg p-8 text-center hover:border-magenta/40 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('service-hero-upload')?.click()}
                  >
                    <input
                      id="service-hero-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'heroImage')}
                      className="hidden"
                    />
                    <HiPhoto className="w-12 h-12 mx-auto text-warm-gray/40 mb-3" />
                    <p className="font-sans text-sm text-warm-gray/60">Click or drag to upload</p>
                    <p className="font-sans text-xs text-warm-gray/40 mt-1">JPG, PNG, WebP &middot; Max 50 MB</p>
                  </div>
                  {formData.heroImage && (
                    <div className="mt-4 p-3 bg-ivory rounded-lg flex items-center justify-between">
                      <img src={formData.heroImage} alt="Preview" className="w-16 h-16 object-cover rounded" />
                      <div className="ml-4 flex-1">
                        <p className="font-sans text-sm text-rich-black">Hero image selected</p>
                        <p className="font-sans text-xs text-warm-gray/60 truncate max-w-md">{formData.heroImage}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Benefits */}
            <div className="space-y-4 border-t border-cream pt-6">
              <div className="flex items-center justify-between">
                <h4 className="font-serif text-lg text-rich-black">Benefits</h4>
                <button
                  type="button"
                  onClick={addBenefit}
                  className="text-sm text-magenta hover:text-raspberry font-medium"
                >
                  + Add Benefit
                </button>
              </div>
              {formData.benefits.map((benefit, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={benefit}
                    onChange={(e) => updateBenefit(index, e.target.value)}
                    className="flex-1 px-4 py-3 bg-white border border-cream/60 text-rich-black placeholder:text-warm-gray/40 font-sans text-sm transition-all focus:outline-none focus:border-magenta/40"
                    placeholder="Benefit description"
                  />
                  <button
                    type="button"
                    onClick={() => removeBenefit(index)}
                    className="px-4 py-3 text-red-500 hover:text-red-700 font-sans text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {/* Gallery Images */}
            <div className="space-y-4 border-t border-cream pt-6">
              <div className="flex items-center justify-between">
                <h4 className="font-serif text-lg text-rich-black">Gallery Images</h4>
                <button
                  type="button"
                  onClick={addGalleryItem}
                  className="text-sm text-magenta hover:text-raspberry font-medium"
                >
                  + Add Gallery Image
                </button>
              </div>
              {formData.gallery.map((galleryItem, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1 flex gap-2">
                    <div className="flex-1 flex gap-2">
                      <div className="flex-1 flex gap-2">
                        <div className="flex-1">
                          {galleryItem && (
                            <img 
                              src={galleryItem} 
                              alt="Preview" 
                              className="w-16 h-16 object-cover rounded border border-cream"
                            />
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, uploadMethod: 'upload' }))}
                            className="px-3 py-2 text-sm text-magenta hover:text-raspberry border border-magenta/30 rounded"
                          >
                            Upload
                          </button>
                        </div>
                      </div>
                      <input
                        type="url"
                        value={galleryItem}
                        onChange={(e) => updateGalleryItem(index, e.target.value)}
                        className="flex-1 px-4 py-3 bg-white border border-cream/60 text-rich-black placeholder:text-warm-gray/40 font-sans text-sm transition-all focus:outline-none focus:border-magenta/40"
                        placeholder="Image URL"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeGalleryItem(index)}
                    className="px-4 py-3 text-red-500 hover:text-red-700 font-sans text-sm self-start"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {/* Actions */}
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
                {editingService ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Services Grid */}
      <div className="flex-1 overflow-y-auto">
        {services.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <HiDocumentText className="w-16 h-16 text-warm-gray/30 mb-4" />
            <p className="font-serif text-xl text-warm-gray/60">No services yet</p>
            <p className="font-sans text-sm text-warm-gray/40 mt-1">Click "Add Service" to create your first service</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <div
                key={service._id}
                className="group bg-white border border-cream/50 rounded-lg overflow-hidden hover:shadow-lg transition-all"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-cream/50">
                  <img
                    src={service.heroImage || '/placeholder.svg'}
                    alt={service.title}
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-rich-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
                    <button
                      onClick={() => handleEdit(service)}
                      className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-cream transition-colors"
                      aria-label="Edit"
                    >
                      <HiPencil className="w-5 h-5 text-rich-black" />
                    </button>
                    <button
                      onClick={() => handleDelete(service._id, service.publicId, service.gallery || [])}
                      className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-rose-50 transition-colors"
                      aria-label="Delete"
                    >
                      <HiTrash className="w-5 h-5 text-rose-500" />
                    </button>
                  </div>
                  {service.featured && (
                    <span className="absolute top-2 left-2 px-2 py-1 bg-magenta/90 text-white font-sans text-[10px] tracking-wider uppercase rounded">
                      Featured
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-serif text-base text-rich-black truncate">{service.title}</h3>
                  <p className="font-sans text-sm text-magenta/60 mt-1">{service.price}</p>
                  <p className="font-sans text-xs text-warm-gray/50 mt-2">Slug: /services/{service.slug}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <span className="px-2 py-0.5 bg-cream text-warm-gray rounded">Order: {service.order}</span>
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