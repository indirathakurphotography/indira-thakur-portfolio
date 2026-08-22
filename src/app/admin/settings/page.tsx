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
  HiCheck,
  HiPlus,
  HiTrash,
  HiUsers,
  HiLockClosed,
  HiPencilSquare,
  HiNoSymbol,
  HiCheckBadge,
  HiEye,
  HiEyeSlash,
  HiBuildingOffice2,
} from 'react-icons/hi2';
import MediaUploader from '@/components/admin/MediaUploader';
import { invalidateSiteConfigCache } from '@/hooks/useSiteConfig';

interface AdminUser {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: 'admin' | 'editor';
  isActive: boolean;
  isBlocked?: boolean;
  status?: 'active' | 'disabled' | 'blocked';
  lastLogin?: string;
  createdAt?: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'brand' | 'users' | 'security' | 'system'>('brand');

  // Database status
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [clearingCache, setClearingCache] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Brand config
  const [siteConfig, setSiteConfig] = useState<any>({});
  const brand = siteConfig.brand || {};
  const brandLogoValue =
    typeof brand.logoUrl === 'string'
      ? brand.logoUrl
      : typeof brand.logo === 'string'
      ? brand.logo
      : brand.logo?.url || '';
  const [loadingBrand, setLoadingBrand] = useState(true);
  const [savingBrand, setSavingBrand] = useState(false);
  const [brandError, setBrandError] = useState<string | null>(null);
  const [brandSuccess, setBrandSuccess] = useState<string | null>(null);

  // User accounts
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [userSuccess, setUserSuccess] = useState<string | null>(null);

  // Create User Modal/Form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'editor'>('admin');
  const [creatingUser, setCreatingUser] = useState(false);

  // Edit / Reset Password Modal state
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'editor'>('admin');
  const [editStatus, setEditStatus] = useState<'active' | 'disabled' | 'blocked'>('active');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [savingEditUser, setSavingEditUser] = useState(false);

  // Change Own Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

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

  const fetchUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      setUserError(null);
      const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
      const res = await fetch('/api/auth/users', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        const err = await res.json().catch(() => ({}));
        setUserError(err.error || 'Failed to fetch admin users');
      }
    } catch (err: any) {
      setUserError(err?.message || 'Network error fetching users');
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    checkDatabase();
    fetchBrandConfig();
    fetchUsers();
  }, [fetchBrandConfig, fetchUsers]);

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
    setSiteConfig((prev: any) => {
      const currentBrand = prev.brand || {};
      const currentSocials = currentBrand.socials || {};
      const updatedSocials = {
        ...currentSocials,
        [network]: value,
      };
      return {
        ...prev,
        brand: {
          ...currentBrand,
          socials: updatedSocials,
          [`${network}Url`]: value,
        },
      };
    });
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingBrand(true);
      setBrandError(null);
      setBrandSuccess(null);

      const token = localStorage.getItem('admin_token') || localStorage.getItem('auth_token');
      const socials = siteConfig.brand?.socials || {};
      const payload = {
        ...siteConfig,
        brand: {
          ...(siteConfig.brand || {}),
          socials: {
            instagram: socials.instagram || siteConfig.brand?.instagramUrl || '',
            whatsapp: socials.whatsapp || siteConfig.brand?.whatsappUrl || '',
            youtube: socials.youtube || siteConfig.brand?.youtubeUrl || '',
            facebook: socials.facebook || siteConfig.brand?.facebookUrl || '',
            linkedin: socials.linkedin || siteConfig.brand?.linkedinUrl || '',
            twitter: socials.twitter || socials.x || siteConfig.brand?.twitterUrl || '',
            pinterest: socials.pinterest || siteConfig.brand?.pinterestUrl || '',
          },
          instagramUrl: socials.instagram || siteConfig.brand?.instagramUrl || '',
          whatsappUrl: socials.whatsapp || siteConfig.brand?.whatsappUrl || '',
          youtubeUrl: socials.youtube || siteConfig.brand?.youtubeUrl || '',
          facebookUrl: socials.facebook || siteConfig.brand?.facebookUrl || '',
          linkedinUrl: socials.linkedin || siteConfig.brand?.linkedinUrl || '',
          twitterUrl: socials.twitter || socials.x || siteConfig.brand?.twitterUrl || '',
          pinterestUrl: socials.pinterest || siteConfig.brand?.pinterestUrl || '',
        },
      };

      const res = await fetch('/api/site-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update brand settings');
      }

      const updated = await res.json();
      if (updated) setSiteConfig(updated);

      invalidateSiteConfigCache();
      setBrandSuccess('Brand, location, and social links saved successfully!');
    } catch (err: any) {
      setBrandError(err?.message || 'Error saving brand settings');
    } finally {
      setSavingBrand(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword) {
      setUserError('Name, email, and password are required');
      return;
    }
    if (newUserPassword.length < 12) {
      setUserError('Password must be at least 12 characters');
      return;
    }

    try {
      setCreatingUser(true);
      setUserError(null);
      setUserSuccess(null);
      const token = localStorage.getItem('admin_token');

      const res = await fetch('/api/auth/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          name: newUserName.trim(),
          email: newUserEmail.trim(),
          password: newUserPassword,
          role: newUserRole,
          status: 'active',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user account');
      }

      setUserSuccess(`Administrator account for ${newUserName} created successfully.`);
      setShowCreateModal(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      fetchUsers();
    } catch (err: any) {
      setUserError(err?.message || 'Error creating user');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleOpenEditUser = (user: AdminUser) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditRole(user.role);
    const resolvedStatus = user.status || (user.isBlocked ? 'blocked' : user.isActive !== false ? 'active' : 'disabled');
    setEditStatus(resolvedStatus);
    setEditNewPassword('');
    setUserError(null);
    setUserSuccess(null);
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setSavingEditUser(true);
      setUserError(null);
      setUserSuccess(null);
      const token = localStorage.getItem('admin_token');

      const payload: any = {
        id: editingUser._id || editingUser.id,
        name: editName.trim(),
        role: editRole,
        status: editStatus,
        isActive: editStatus === 'active',
        isBlocked: editStatus === 'blocked',
      };

      if (editNewPassword.trim().length > 0) {
        if (editNewPassword.trim().length < 12) {
          throw new Error('New password must be at least 12 characters long');
        }
        payload.password = editNewPassword.trim();
      }

      const res = await fetch('/api/auth/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update user account');
      }

      setUserSuccess(`User account for ${editName} updated successfully.`);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      setUserError(err?.message || 'Error updating user');
    } finally {
      setSavingEditUser(false);
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (!confirm(`Are you sure you want to permanently delete the account for ${user.name} (${user.email})?`)) {
      return;
    }

    try {
      setUserError(null);
      setUserSuccess(null);
      const token = localStorage.getItem('admin_token');

      const res = await fetch('/api/auth/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ id: user._id || user.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      setUserSuccess(`User ${user.name} deleted successfully.`);
      fetchUsers();
    } catch (err: any) {
      setUserError(err?.message || 'Error deleting user');
    }
  };

  const handleChangeOwnPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    if (newPassword.length < 12) {
      setPasswordError('New password must be at least 12 characters long.');
      return;
    }

    try {
      setChangingPassword(true);
      setPasswordError(null);
      setPasswordSuccess(null);
      const token = localStorage.getItem('admin_token');

      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setPasswordSuccess('Your password has been changed successfully. Please log in with your new password.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        localStorage.removeItem('admin_token');
        window.location.href = '/admin/login';
      }, 2000);
    } catch (err: any) {
      setPasswordError(err?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
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
    if (!confirm('Invalidate ALL active administrator sessions globally? You will be signed out.')) return;
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
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-[#E7DDD2]/60 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-medium text-[#2B2625]">
            Admin Settings & System Control
          </h1>
          <p className="text-xs text-[#7C706D] mt-1">
            Manage administrative user accounts, passwords, studio profile, brand identity, and database health.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="inline-flex p-1 bg-[#FAF6F3] rounded-lg border border-[#E7DDD2]/70 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('brand')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'brand' ? 'bg-[#2B2625] text-white shadow-2xs' : 'text-[#7C706D] hover:text-[#2B2625]'
            }`}
          >
            Brand & Profile
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'users' ? 'bg-[#2B2625] text-white shadow-2xs' : 'text-[#7C706D] hover:text-[#2B2625]'
            }`}
          >
            Admin Accounts
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'security' ? 'bg-[#2B2625] text-white shadow-2xs' : 'text-[#7C706D] hover:text-[#2B2625]'
            }`}
          >
            Password & Security
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'system' ? 'bg-[#2B2625] text-white shadow-2xs' : 'text-[#7C706D] hover:text-[#2B2625]'
            }`}
          >
            Database & System
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center gap-2">
          <HiCheckCircle className="w-5 h-5 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* TAB 1: BRAND IDENTITY & STUDIO PROFILE */}
      {activeTab === 'brand' && (
        <div className="bg-white p-6 rounded-xl border border-[#E7DDD2] shadow-2xs space-y-6">
          <div className="border-b border-[#E7DDD2] pb-3 flex items-center justify-between">
            <h2 className="font-serif text-lg font-medium text-[#2B2625] flex items-center gap-2">
              <HiBuildingOffice2 className="w-5 h-5 text-[#C39E96]" />
              Studio Profile & Brand Configuration
            </h2>
          </div>

          {brandError && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{brandError}</div>
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
                    Studio Name
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
                    Primary Contact / Inquiry Email
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
                    value={brand.contactPhone || brand.phone || '+916281332271'}
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
                  description="Upload or specify URL for the high-resolution brand logo."
                  value={brandLogoValue}
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
                      value={brand.socials?.instagram || brand.instagramUrl || ''}
                      onChange={(e) => handleSocialChange('instagram', e.target.value)}
                      placeholder="https://instagram.com/indirathakurphotography"
                      className="w-full px-3 py-2 border border-[#E7DDD2] rounded-lg text-xs text-[#2B2625]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#7C706D] mb-1">WhatsApp Direct Link</label>
                    <input
                      type="text"
                      value={brand.socials?.whatsapp || brand.whatsappUrl || ''}
                      onChange={(e) => handleSocialChange('whatsapp', e.target.value)}
                      placeholder="https://wa.me/916281332271"
                      className="w-full px-3 py-2 border border-[#E7DDD2] rounded-lg text-xs text-[#2B2625]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#7C706D] mb-1">YouTube Channel URL</label>
                    <input
                      type="url"
                      value={brand.socials?.youtube || brand.youtubeUrl || ''}
                      onChange={(e) => handleSocialChange('youtube', e.target.value)}
                      placeholder="https://youtube.com/@indirathakur"
                      className="w-full px-3 py-2 border border-[#E7DDD2] rounded-lg text-xs text-[#2B2625]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#7C706D] mb-1">Facebook URL</label>
                    <input
                      type="url"
                      value={brand.socials?.facebook || brand.facebookUrl || ''}
                      onChange={(e) => handleSocialChange('facebook', e.target.value)}
                      placeholder="https://facebook.com/indirathakurphotography"
                      className="w-full px-3 py-2 border border-[#E7DDD2] rounded-lg text-xs text-[#2B2625]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#7C706D] mb-1">LinkedIn URL</label>
                    <input
                      type="url"
                      value={brand.socials?.linkedin || brand.linkedinUrl || ''}
                      onChange={(e) => handleSocialChange('linkedin', e.target.value)}
                      placeholder="https://linkedin.com/in/indirathakur"
                      className="w-full px-3 py-2 border border-[#E7DDD2] rounded-lg text-xs text-[#2B2625]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#7C706D] mb-1">Pinterest URL</label>
                    <input
                      type="url"
                      value={brand.socials?.pinterest || brand.pinterestUrl || ''}
                      onChange={(e) => handleSocialChange('pinterest', e.target.value)}
                      placeholder="https://pinterest.com/indirathakurphotography"
                      className="w-full px-3 py-2 border border-[#E7DDD2] rounded-lg text-xs text-[#2B2625]"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Discovery & Location Keywords */}
              <div className="space-y-3 pt-4 border-t border-[#E7DDD2]/60">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#7C706D]">
                      Footer Discovery & Location Keywords
                    </h3>
                    <p className="text-[11px] text-[#7C706D]">
                      Search terms displayed in footer for local Mumbai SEO discovery.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const current = Array.isArray(siteConfig.footer?.keywords)
                        ? [...siteConfig.footer.keywords]
                        : ['Newborn Photographer Mumbai', 'Maternity Shoot Chembur', 'Tilak Nagar Studio', 'Family Portraits'];
                      current.push('Fine Art Photography');
                      setSiteConfig((prev: any) => ({
                        ...prev,
                        footer: {
                          ...(prev.footer || {}),
                          keywords: current,
                        },
                      }));
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#FAF6F3] border border-[#E7DDD2] text-[#2B2625] text-xs font-medium rounded-md hover:bg-white"
                  >
                    <HiPlus className="w-3.5 h-3.5 text-[#C39E96]" />
                    Add Keyword
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2">
                  {(Array.isArray(siteConfig.footer?.keywords)
                    ? siteConfig.footer.keywords
                    : ['Newborn Photographer Mumbai', 'Maternity Shoot Chembur', 'Tilak Nagar Studio', 'Family Portraits']
                  ).map((kw: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-[#FAF6F3]/60 border border-[#E7DDD2] rounded-lg">
                      <input
                        type="text"
                        value={kw}
                        onChange={(e) => {
                          const list = Array.isArray(siteConfig.footer?.keywords)
                            ? [...siteConfig.footer.keywords]
                            : ['Newborn Photographer Mumbai', 'Maternity Shoot Chembur', 'Tilak Nagar Studio', 'Family Portraits'];
                          list[idx] = e.target.value;
                          setSiteConfig((prev: any) => ({
                            ...prev,
                            footer: {
                              ...(prev.footer || {}),
                              keywords: list,
                            },
                          }));
                        }}
                        className="flex-1 px-2 py-1 bg-white border border-[#E7DDD2] rounded text-xs text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const list = (Array.isArray(siteConfig.footer?.keywords)
                            ? siteConfig.footer.keywords
                            : ['Newborn Photographer Mumbai', 'Maternity Shoot Chembur', 'Tilak Nagar Studio', 'Family Portraits']
                          ).filter((_: any, i: number) => i !== idx);
                          setSiteConfig((prev: any) => ({
                            ...prev,
                            footer: {
                              ...(prev.footer || {}),
                              keywords: list,
                            },
                          }));
                        }}
                        className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                        title="Delete Keyword"
                      >
                        <HiTrash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={savingBrand}
                  className="px-6 py-2.5 bg-[#2B2625] text-white rounded-lg text-sm font-medium uppercase tracking-wider hover:bg-[#3D3735] transition-colors disabled:opacity-50 shadow-xs"
                >
                  {savingBrand ? 'Saving Studio Config...' : 'Save Studio Profile'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* TAB 2: ADMIN USER ACCOUNTS */}
      {activeTab === 'users' && (
        <div className="bg-white p-6 rounded-xl border border-[#E7DDD2] shadow-2xs space-y-6">
          <div className="border-b border-[#E7DDD2] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="font-serif text-lg font-medium text-[#2B2625] flex items-center gap-2">
                <HiUsers className="w-5 h-5 text-[#C39E96]" />
                Admin User Accounts & Roles
              </h2>
              <p className="text-xs text-[#7C706D] mt-0.5">
                Manage administrators and editors with access to Indira Thakur Photography CMS.
              </p>
            </div>
            <button
              onClick={() => {
                setShowCreateModal(true);
                setUserError(null);
                setUserSuccess(null);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2B2625] text-white text-xs font-medium rounded-lg hover:bg-[#3D3735] transition-colors shadow-2xs"
            >
              <HiPlus className="w-4 h-4 text-[#C39E96]" />
              Add Administrator
            </button>
          </div>

          {userError && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{userError}</div>
          )}

          {userSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center gap-2">
              <HiCheck className="w-5 h-5 text-emerald-600" />
              <span>{userSuccess}</span>
            </div>
          )}

          {loadingUsers ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-[#C39E96] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E7DDD2] bg-[#FAF6F3]/80 text-[#7C706D] uppercase font-mono tracking-wider">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Last Activity</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7DDD2]/60">
                  {users.map((u) => {
                    const status = u.status || (u.isBlocked ? 'blocked' : u.isActive !== false ? 'active' : 'disabled');
                    return (
                      <tr key={u._id || u.id} className="hover:bg-[#FAF6F3]/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-medium text-sm text-[#2B2625]">{u.name}</div>
                          <div className="text-[11px] font-mono text-[#7C706D]">{u.email}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold ${
                              u.role === 'admin' ? 'bg-purple-50 text-purple-800 border border-purple-200' : 'bg-blue-50 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {status === 'active' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                              <HiCheckBadge className="w-4 h-4 text-emerald-600" /> Active
                            </span>
                          ) : status === 'blocked' ? (
                            <span className="inline-flex items-center gap-1 text-rose-700 font-medium">
                              <HiNoSymbol className="w-4 h-4 text-rose-600" /> Blocked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                              <HiXCircle className="w-4 h-4 text-amber-600" /> Disabled
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-[#7C706D] font-mono text-[11px]">
                          {u.lastLogin ? new Date(u.lastLogin).toLocaleString('en-IN') : 'Never'}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEditUser(u)}
                            className="p-1.5 text-[#2B2625] hover:bg-white hover:border-[#E7DDD2] border border-transparent rounded-md transition-all"
                            title="Edit User & Permissions"
                          >
                            <HiPencilSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-all"
                            title="Delete User"
                          >
                            <HiTrash className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: OWN PASSWORD & SECURITY SETTINGS */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Change Current Administrator Password */}
          <div className="bg-white p-6 rounded-xl border border-[#E7DDD2] shadow-2xs space-y-6">
            <div className="border-b border-[#E7DDD2] pb-3">
              <h2 className="font-serif text-lg font-medium text-[#2B2625] flex items-center gap-2">
                <HiLockClosed className="w-5 h-5 text-[#C39E96]" />
                Change Current Administrator Password
              </h2>
              <p className="text-xs text-[#7C706D] mt-0.5">
                Passwords must be at least 12 characters. Updating your password automatically revokes previous login tokens.
              </p>
            </div>

            {passwordError && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{passwordError}</div>
            )}

            {passwordSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center gap-2">
                <HiCheck className="w-5 h-5 text-emerald-600" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangeOwnPassword} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] pr-10 focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-3 top-2.5 text-[#7C706D] hover:text-[#2B2625]"
                  >
                    {showCurrentPw ? <HiEyeSlash className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                  New Secure Password (min 12 characters)
                </label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={12}
                    className="w-full px-3.5 py-2.5 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] pr-10 focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-2.5 text-[#7C706D] hover:text-[#2B2625]"
                  >
                    {showNewPw ? <HiEyeSlash className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="px-6 py-2.5 bg-[#2B2625] text-white rounded-lg text-sm font-medium uppercase tracking-wider hover:bg-[#3D3735] transition-colors disabled:opacity-50 shadow-xs"
                >
                  {changingPassword ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>

          {/* Session Revocation */}
          <div className="bg-white p-6 rounded-xl border border-[#E7DDD2] shadow-2xs space-y-4">
            <h2 className="font-serif text-lg font-medium text-[#2B2625] flex items-center gap-2">
              <HiShieldCheck className="w-5 h-5 text-rose-600" />
              Global Admin Session Revocation
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-rose-50/50 rounded-xl border border-rose-200/60">
              <div>
                <span className="font-medium text-xs text-rose-900 block">Invalidate All Sessions</span>
                <span className="text-[11px] text-rose-700">
                  Instantly revokes all active JWT tokens across all administrative accounts on MongoDB.
                </span>
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
      )}

      {/* TAB 4: DATABASE & SYSTEM HEALTH */}
      {activeTab === 'system' && (
        <div className="space-y-6">
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
                  <span className="px-3 py-1 bg-amber-50 text-amber-800 text-xs font-mono rounded-full animate-pulse">
                    Checking...
                  </span>
                ) : dbStatus === 'connected' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono rounded-full">
                    <HiCheckCircle className="w-4 h-4 text-emerald-600" /> Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-800 border border-rose-200 text-xs font-mono rounded-full">
                    <HiXCircle className="w-4 h-4 text-rose-600" /> Disconnected
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
                <span className="block font-mono text-xl font-bold text-[#2B2625]">{counts.totalContacts || 0}</span>
                <span className="text-[10px] uppercase font-mono text-[#7C706D]">Messages</span>
              </div>
            </div>
          </div>

          {/* Maintenance Tools */}
          <div className="bg-white p-6 rounded-xl border border-[#E7DDD2]/60 shadow-2xs space-y-4">
            <h2 className="font-serif text-lg font-medium text-[#2B2625]">Cache & Index Maintenance</h2>
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
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-[#1C1817]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 border border-[#E7DDD2] shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#E7DDD2] pb-3">
              <h3 className="font-serif text-lg font-medium text-[#2B2625]">Add New Admin Account</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-[#7C706D] hover:text-[#2B2625] text-lg font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Associate Curator"
                  className="w-full px-3.5 py-2 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="admin@indirathakur.com"
                  className="w-full px-3.5 py-2 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                  Initial Password (min 12 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={12}
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                  Account Role
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full px-3.5 py-2 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                >
                  <option value="admin">Admin (Full Access & CMS Management)</option>
                  <option value="editor">Editor (Content Management)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E7DDD2]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-[#E7DDD2] text-[#7C706D] text-xs font-medium rounded-lg hover:bg-[#FAF6F3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="px-5 py-2 bg-[#2B2625] text-white text-xs font-medium rounded-lg hover:bg-[#3D3735] disabled:opacity-50"
                >
                  {creatingUser ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-[#1C1817]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 border border-[#E7DDD2] shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#E7DDD2] pb-3">
              <div>
                <h3 className="font-serif text-lg font-medium text-[#2B2625]">Edit Account</h3>
                <p className="text-xs font-mono text-[#7C706D]">{editingUser.email}</p>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-[#7C706D] hover:text-[#2B2625] text-lg font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                  Role
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as any)}
                  className="w-full px-3.5 py-2 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625]"
                >
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                  Account Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625]"
                >
                  <option value="active">Active</option>
                  <option value="disabled">Disabled (Cannot Log In)</option>
                  <option value="blocked">Blocked (Access Shielded)</option>
                </select>
              </div>

              <div className="pt-2 border-t border-[#E7DDD2]">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                  Reset Password (Leave blank to keep current)
                </label>
                <input
                  type="password"
                  value={editNewPassword}
                  onChange={(e) => setEditNewPassword(e.target.value)}
                  placeholder="Enter min 12 characters to reset"
                  className="w-full px-3.5 py-2 border border-[#E7DDD2] rounded-lg text-sm text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E7DDD2]">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-[#E7DDD2] text-[#7C706D] text-xs font-medium rounded-lg hover:bg-[#FAF6F3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEditUser}
                  className="px-5 py-2 bg-[#2B2625] text-white text-xs font-medium rounded-lg hover:bg-[#3D3735] disabled:opacity-50"
                >
                  {savingEditUser ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
