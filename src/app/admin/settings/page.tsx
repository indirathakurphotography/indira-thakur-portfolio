'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  HiCircleStack, 
  HiArrowPath, 
  HiShieldCheck, 
  HiCheckCircle, 
  HiXCircle,
  HiKey,
  HiSwatch,
  HiCheck
} from 'react-icons/hi2';
import MediaUploader from '@/components/admin/MediaUploader';
import { invalidateSiteConfigCache } from '@/hooks/useSiteConfig';

export default function SettingsPage() {
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [clearingCache, setClearingCache] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [siteConfig, setSiteConfig] = useState<any>({});
  const [loadingBrand, setLoadingBrand] = useState(true);
  const [savingBrand, setSavingBrand] = useState(false);
  const [brandError, setBrandError] = useState<string | null>(null);
  const [brandSuccess, setBrandSuccess] = useState<string | null>(null);

  const checkDatabase = async () => {
    setDbStatus('checking');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
      const res = await fetch('/api/dashboard', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setCounts(data);
        setDbStatus('connected');
      } else {
        setDbStatus('disconnected');
      }
    } catch {
      setDbStatus('disconnected');
    }
  };

  const fetchBrandConfig = useCallback(async () => {
    try {
      setLoadingBrand(true);
      setBrandError(null);
      const res = await fetch('/api/site-config', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setSiteConfig(data || {});
      }
    } catch (err: any) {
      setBrandError(err?.message || 'Failed to fetch brand configuration');
    } finally {
      setLoadingBrand(false);
    }
  }, []);

  useEffect(() => {
    checkDatabase();
    fetchBrandConfig();
  }, [fetchBrandConfig]);

  const brand = siteConfig.brand || {};

  const handleBrandChange = (field: string, value: any) => {
    setSiteConfig((prev: any) => ({
      ...prev,
      brand: {
        ...(prev.brand || {}),
        [field]: value,
      },
    }));
  };

  const handleSocialChange = (network: string, value: string) => {
    setSiteConfig((prev: any) => ({
      ...prev,
      brand: {
        ...(prev.brand || {}),
        socials: {
          ...(prev.brand?.socials || {}),
          [network]: value,
        },
      },
    }));
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingBrand(true);
      setBrandError(null);
      setBrandSuccess(null);

      const token = localStorage.getItem('admin_token') || localStorage.getItem('auth_token');

      const res = await fetch('/api/site-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(siteConfig),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update brand settings');
      }

      const updated = await res.json();
      if (updated) setSiteConfig(updated);

      invalidateSiteConfigCache();
      setBrandSuccess('Global brand, location, and identity settings saved to MongoDB successfully!');
    } catch (err: any) {
      setBrandError(err?.message || 'Error saving brand settings');
    } finally {
      setSavingBrand(false);
    }
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      const res = await fetch('/api/dashboard', { method: 'GET', headers: { 'Cache-Control': 'no-cache' } });
      if (res.ok) {
        setStatusMessage('System cache invalidated successfully.');
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch {
      setStatusMessage('Cache refresh failed.');
    } finally {
      setClearingCache(false);
    }
  };

  const handleGlobalRevoke = async () => {
    if (!confirm('Invalidate ALL admin tokens globally? You will be signed out.')) return;
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch('/api/auth/access-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'revoke_all' }),
      });
      if (res.ok) {
        localStorage.removeItem('admin_token');
        window.location.href = '/admin/login';
      }
    } catch {
      alert('Revocation failed.');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-[#E7DDD2]/60 shadow-2xs">
        <h1 className="font-serif text-2xl md:text-3xl font-medium text-[#2B2625]">
          Global Brand Identity & System Settings
        </h1>
        <p className="text-xs text-[#7C706D] mt-1">
          Manage website logo, contact information, business location (Tilak Nagar, Chembur, Mumbai), social links, database health, and security controls.
        </p>
      </div>

      {statusMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center gap-2">
          <HiCheckCircle className="w-5 h-5 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Global Brand Identity Form */}
      <div className="bg-white p-6 rounded-xl border border-[#E7DDD2] shadow-2xs space-y-6">
        <h2 className="font-serif text-lg font-medium text-[#2B2625] border-b border-[#E7DDD2] pb-3 flex items-center gap-2">
          <HiSwatch className="w-5 h-5 text-[#C39E96]" />
          Global Brand & Identity Config
        </h2>

        {brandError && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {brandError}
          </div>
        )}

        {brandSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center gap-2">
            <HiCheck className="w-5 h-5 text-emerald-600" />
            <span>{brandSuccess}</span>
          </div>
        )}

        {loadingBrand ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#C39E96] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSaveBrand} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={brand.name || 'Indira Thakur Photography'}
                  onChange={(e) => handleBrandChange('name', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                  Tagline / Subheading
                </label>
                <input
                  type="text"
                  value={brand.tagline || 'Fine Art Newborn & Maternity Studio'}
                  onChange={(e) => handleBrandChange('tagline', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                  Primary Contact Email
                </label>
                <input
                  type="email"
                  value={brand.contactEmail || brand.email || 'photography@indirathakur.com'}
                  onChange={(e) => handleBrandChange('contactEmail', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                  Primary Contact Phone
                </label>
                <input
                  type="text"
                  value={brand.contactPhone || brand.phone || '+91 9819620484'}
                  onChange={(e) => handleBrandChange('contactPhone', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                  Official Business Studio Location
                </label>
                <input
                  type="text"
                  value={brand.location || 'Tilak Nagar, Chembur, Mumbai, Maharashtra, India'}
                  onChange={(e) => handleBrandChange('location', e.target.value)}
                  placeholder="Tilak Nagar, Chembur, Mumbai, Maharashtra, India"
                  className="w-full px-3.5 py-2.5 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                />
              </div>
            </div>

            {/* Brand Logo Upload */}
            <div className="pt-2 border-t border-[#E7DDD2]">
              <MediaUploader
                label="Global Website Logo Asset"
                description="Upload, drag & drop, or specify URL for high-resolution brand logo."
                value={brand.logoUrl || brand.logo || ''}
                onChange={(url) => handleBrandChange('logoUrl', url)}
                aspectRatio="aspect-square"
                folder="brand-assets"
              />
            </div>

            {/* Social Links */}
            <div className="pt-4 border-t border-[#E7DDD2] space-y-4">
              <h3 className="text-sm font-semibold text-[#2B2625]">Social Media Profiles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#7C706D] mb-1">Instagram URL</label>
                  <input
                    type="url"
                    value={brand.socials?.instagram || ''}
                    onChange={(e) => handleSocialChange('instagram', e.target.value)}
                    placeholder="https://instagram.com/indirathakurphotography"
                    className="w-full px-3 py-2 border border-[#E7DDD2] rounded-lg text-xs text-[#2B2625]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#7C706D] mb-1">Facebook URL</label>
                  <input
                    type="url"
                    value={brand.socials?.facebook || ''}
                    onChange={(e) => handleSocialChange('facebook', e.target.value)}
                    placeholder="https://facebook.com/indirathakurphotography"
                    className="w-full px-3 py-2 border border-[#E7DDD2] rounded-lg text-xs text-[#2B2625]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#7C706D] mb-1">YouTube / Film Channel URL</label>
                  <input
                    type="url"
                    value={brand.socials?.youtube || ''}
                    onChange={(e) => handleSocialChange('youtube', e.target.value)}
                    placeholder="https://youtube.com/@indirathakur"
                    className="w-full px-3 py-2 border border-[#E7DDD2] rounded-lg text-xs text-[#2B2625]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#7C706D] mb-1">WhatsApp Direct Link / Number</label>
                  <input
                    type="text"
                    value={brand.socials?.whatsapp || ''}
                    onChange={(e) => handleSocialChange('whatsapp', e.target.value)}
                    placeholder="https://wa.me/919819620484"
                    className="w-full px-3 py-2 border border-[#E7DDD2] rounded-lg text-xs text-[#2B2625]"
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={savingBrand}
                className="px-6 py-2.5 bg-[#2B2625] text-white rounded-lg text-sm font-medium uppercase tracking-wider hover:bg-[#3D3735] transition-colors disabled:opacity-50 shadow-xs"
              >
                {savingBrand ? 'Saving Brand Config...' : 'Save Brand Settings'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Database Health Card */}
      <div className="bg-white p-6 rounded-xl border border-[#E7DDD2]/60 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E7DDD2]/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FAF6F3] flex items-center justify-center text-[#2B2625]">
              <HiCircleStack className="w-5 h-5 text-[#C39E96]" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-medium text-[#2B2625]">MongoDB Database Health</h2>
              <p className="text-xs text-[#7C706D]">Primary Data Store: MongoDB Atlas Production Cluster</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {dbStatus === 'checking' ? (
              <span className="px-3 py-1 bg-amber-50 text-amber-800 text-xs font-mono rounded-full animate-pulse">Checking...</span>
            ) : dbStatus === 'connected' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono rounded-full">
                <HiCheckCircle className="w-4 h-4 text-emerald-600" /> Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-800 border border-rose-200 text-xs font-mono rounded-full">
                <HiXCircle className="w-4 h-4 text-rose-600" /> Disconnected / Local Fallback
              </span>
            )}

            <button
              onClick={checkDatabase}
              className="p-2 text-[#7C706D] hover:text-[#2B2625] hover:bg-[#FAF6F3] rounded-lg transition-all"
              title="Re-check database status"
            >
              <HiArrowPath className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="p-3 bg-[#FAF6F3]/60 rounded-lg border border-[#E7DDD2]/40 text-center">
            <span className="block font-mono text-xl font-bold text-[#2B2625]">{counts.totalImages || 0}</span>
            <span className="text-[10px] uppercase font-mono text-[#7C706D]">Gallery Items</span>
          </div>
          <div className="p-3 bg-[#FAF6F3]/60 rounded-lg border border-[#E7DDD2]/40 text-center">
            <span className="block font-mono text-xl font-bold text-[#2B2625]">{counts.totalServices || 0}</span>
            <span className="text-[10px] uppercase font-mono text-[#7C706D]">Services</span>
          </div>
          <div className="p-3 bg-[#FAF6F3]/60 rounded-lg border border-[#E7DDD2]/40 text-center">
            <span className="block font-mono text-xl font-bold text-[#2B2625]">{counts.totalFilms || 0}</span>
            <span className="text-[10px] uppercase font-mono text-[#7C706D]">Films</span>
          </div>
          <div className="p-3 bg-[#FAF6F3]/60 rounded-lg border border-[#E7DDD2]/40 text-center">
            <span className="block font-mono text-xl font-bold text-[#2B2625]">{counts.totalBookings || 0}</span>
            <span className="text-[10px] uppercase font-mono text-[#7C706D]">Bookings</span>
          </div>
        </div>
      </div>

      {/* Security & Maintenance Tools */}
      <div className="bg-white p-6 rounded-xl border border-[#E7DDD2]/60 shadow-2xs space-y-4">
        <h2 className="font-serif text-lg font-medium text-[#2B2625]">System Actions & Security</h2>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-[#FAF6F3]/60 rounded-xl border border-[#E7DDD2]/40">
          <div>
            <span className="font-medium text-xs text-[#2B2625] block">Invalidate Dashboard Cache</span>
            <span className="text-[11px] text-[#7C706D]">Force immediate refresh of database statistics and counts.</span>
          </div>
          <button
            onClick={handleClearCache}
            disabled={clearingCache}
            className="px-4 py-2 bg-white border border-[#E7DDD2] text-[#2B2625] text-xs font-medium hover:border-[#2B2625] rounded-lg transition-all shadow-xs flex-shrink-0"
          >
            {clearingCache ? 'Refreshing...' : 'Clear System Cache'}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-rose-50/50 rounded-xl border border-rose-200/60">
          <div>
            <span className="font-medium text-xs text-rose-900 block flex items-center gap-1.5">
              <HiShieldCheck className="w-4 h-4 text-rose-700" />
              Global Session Revocation
            </span>
            <span className="text-[11px] text-rose-700">Increments global auth generation server-side, revoking all existing admin tokens immediately.</span>
          </div>
          <button
            onClick={handleGlobalRevoke}
            className="px-4 py-2 bg-rose-700 text-white text-xs font-medium hover:bg-rose-800 rounded-lg transition-all shadow-xs flex items-center gap-1.5 flex-shrink-0"
          >
            <HiKey className="w-4 h-4" /> Revoke All Sessions
          </button>
        </div>
      </div>
    </div>
  );
}
