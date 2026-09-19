'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  HiXMark,
  HiArrowPath,
  HiCheckCircle,
  HiExclamationCircle,
  HiPhoto,
  HiFolder,
  HiCloudArrowUp,
  HiArrowTopRightOnSquare,
  HiLockClosed,
  HiShieldCheck,
  HiCheck,
} from 'react-icons/hi2';
import {
  googleSignIn,
  getAccessToken,
  getCurrentUser,
  initAuth,
  logout,
} from '@/lib/googleAuth';
import {
  CANONICAL_CATEGORIES,
  DEFAULT_DRIVE_FOLDERS,
  DriveAuditSummary,
  DriveAuditFileResult,
} from '@/lib/googleDriveService';

interface GoogleDriveImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

export default function GoogleDriveImportModal({
  isOpen,
  onClose,
  onImportComplete,
}: GoogleDriveImportModalProps) {
  // Auth state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Folder configuration state
  const [folders, setFolders] = useState(DEFAULT_DRIVE_FOLDERS);
  const [customFolderInput, setCustomFolderInput] = useState('');

  // Audit state
  const [auditing, setAuditing] = useState(false);
  const [auditSummary, setAuditSummary] = useState<DriveAuditSummary | null>(null);
  const [auditResults, setAuditResults] = useState<DriveAuditFileResult[]>([]);
  const [categoryOverrides, setCategoryOverrides] = useState<Record<string, string>>({});
  const [filterTab, setFilterTab] = useState<'all' | 'missing' | 'existing'>('missing');

  // Import state
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    importedCount: number;
    skippedCount: number;
    finalCategoryCounts: Record<string, number>;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAuthToken(token);
      },
      () => {
        setCurrentUser(null);
        setAuthToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setAuthToken(res.accessToken);
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setAuthError(err?.message || 'Google Sign-in failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setCurrentUser(null);
    setAuthToken(null);
  };

  const getAdminAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (typeof window !== 'undefined') {
      const rawToken =
        localStorage.getItem('admin_token') ||
        localStorage.getItem('auth_token') ||
        localStorage.getItem('token') ||
        localStorage.getItem('adminToken') ||
        sessionStorage.getItem('admin_token') ||
        sessionStorage.getItem('auth_token');
      if (rawToken) {
        headers['Authorization'] = `Bearer ${rawToken.replace(/^["']|["']$/g, '').trim()}`;
      }
    }
    return headers;
  };

  const runAudit = useCallback(async () => {
    setAuditing(true);
    setErrorMessage(null);
    setImportResult(null);

    try {
      const token = authToken || (await getAccessToken());
      const res = await fetch('/api/admin/drive-import', {
        method: 'POST',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({
          folderUrls: folders.map((f) => f.url),
          accessToken: token || undefined,
          dryRun: true,
          customCategoryOverrides: categoryOverrides,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to complete audit comparison');
      }

      const data = await res.json();
      setAuditSummary(data.summary);
      setAuditResults(data.results || []);
    } catch (err: any) {
      console.error('Audit comparison error:', err);
      setErrorMessage(err.message || 'Audit failed');
    } finally {
      setAuditing(false);
    }
  }, [authToken, folders, categoryOverrides]);

  const runImport = async () => {
    if (!auditSummary || auditSummary.missingCount === 0) return;
    setImporting(true);
    setErrorMessage(null);

    try {
      const token = authToken || (await getAccessToken());
      const res = await fetch('/api/admin/drive-import', {
        method: 'POST',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({
          folderUrls: folders.map((f) => f.url),
          accessToken: token || undefined,
          dryRun: false,
          customCategoryOverrides: categoryOverrides,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Import failed');
      }

      const data = await res.json();
      setImportResult({
        success: true,
        importedCount: data.importedCount,
        skippedCount: data.skippedCount,
        finalCategoryCounts: data.finalCategoryCounts || {},
      });

      if (onImportComplete) {
        onImportComplete();
      }
    } catch (err: any) {
      console.error('Import error:', err);
      setErrorMessage(err.message || 'Failed to import images');
    } finally {
      setImporting(false);
    }
  };

  const handleAddFolder = () => {
    if (!customFolderInput.trim()) return;
    setFolders((prev) => [
      ...prev,
      {
        name: `Custom Folder ${prev.length + 1}`,
        folderId: customFolderInput.trim(),
        url: customFolderInput.trim(),
        defaultCategory: 'portrait',
      },
    ]);
    setCustomFolderInput('');
  };

  if (!isOpen) return null;

  const filteredResults = auditResults.filter((r) => {
    if (filterTab === 'missing') return r.status === 'missing';
    if (filterTab === 'existing') return r.status === 'already_exists';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-[#E7DDD2] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7DDD2] bg-[#FAF6F3]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white border border-[#E7DDD2] flex items-center justify-center text-[#C39E96] shadow-2xs">
              <HiFolder className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold text-[#2B2625]">
                Google Drive Automated Importer & Audit
              </h2>
              <p className="text-xs text-[#7C706D] font-sans">
                Compare Drive folders against live gallery records and R2 storage to upload only missing photos.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#7C706D] hover:text-[#2B2625] hover:bg-white rounded-lg transition-colors"
          >
            <HiXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Google Account Connection */}
          <div className="bg-[#FAF6F3] p-4 rounded-xl border border-[#E7DDD2] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-[#2B2625] font-semibold">
                  Google Drive Access
                </span>
                {currentUser ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <HiShieldCheck className="w-3.5 h-3.5" />
                    Connected as {currentUser.email}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                    <HiLockClosed className="w-3.5 h-3.5" />
                    Public Scraper Mode Active
                  </span>
                )}
              </div>
              <p className="text-xs text-[#7C706D]">
                {currentUser
                  ? 'Authenticated with read-only Google Drive access to browse private client archives.'
                  : 'Public folders are audited directly. Sign in with Google to access private client folders.'}
              </p>
            </div>

            <div>
              {currentUser ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-3 py-1.5 text-xs font-mono text-rose-700 hover:text-rose-900 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  Disconnect
                </button>
              ) : (
                /* Official Sign in with Google Button per SKILL.md */
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={authLoading}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 rounded-lg text-xs font-medium shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                  <span>{authLoading ? 'Connecting...' : 'Sign in with Google'}</span>
                </button>
              )}
            </div>
          </div>

          {authError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
              <HiExclamationCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{authError}</span>
            </div>
          )}

          {/* Section 2: Configured Source Folders */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-[#2B2625] font-semibold">
                Target Google Drive Folders ({folders.length})
              </span>
              <button
                type="button"
                onClick={runAudit}
                disabled={auditing || importing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2B2625] hover:bg-[#1C1817] text-white text-xs font-medium uppercase tracking-wider transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <HiArrowPath className={`w-3.5 h-3.5 ${auditing ? 'animate-spin' : ''}`} />
                <span>{auditing ? 'Auditing & Comparing...' : 'Run Audit & Deduplication'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {folders.map((f, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white rounded-lg border border-[#E7DDD2] flex items-center justify-between text-xs hover:border-[#C39E96] transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-md bg-[#FAF6F3] border border-[#E7DDD2] flex items-center justify-center text-[#C39E96] shrink-0">
                      <HiPhoto className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <p className="font-medium text-[#2B2625] truncate">{f.name}</p>
                      <p className="text-[10px] font-mono text-[#7C706D] truncate">
                        ID: {f.folderId}
                      </p>
                    </div>
                  </div>
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-[#7C706D] hover:text-[#2B2625] rounded transition-colors shrink-0"
                    title="Open in Google Drive"
                  >
                    <HiArrowTopRightOnSquare className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Error message */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
              <HiExclamationCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 3: Audit Summary Banner */}
          {auditSummary && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-[#FAF6F3] rounded-xl border border-[#E7DDD2]">
                  <p className="text-[11px] font-mono uppercase text-[#7C706D]">Drive Files Checked</p>
                  <p className="text-xl font-serif font-bold text-[#2B2625] mt-0.5">
                    {auditSummary.totalFilesChecked}
                  </p>
                </div>
                <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200/80">
                  <p className="text-[11px] font-mono uppercase text-emerald-700">Already in Gallery (Skip)</p>
                  <p className="text-xl font-serif font-bold text-emerald-800 mt-0.5">
                    {auditSummary.existingCount}
                  </p>
                </div>
                <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200/80">
                  <p className="text-[11px] font-mono uppercase text-amber-700">Missing from Site (Import)</p>
                  <p className="text-xl font-serif font-bold text-amber-800 mt-0.5">
                    {auditSummary.missingCount}
                  </p>
                </div>
                <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
                  <p className="text-[11px] font-mono uppercase text-neutral-600">Conflicts / Duplicates</p>
                  <p className="text-xl font-serif font-bold text-neutral-800 mt-0.5">
                    {auditSummary.conflictCount}
                  </p>
                </div>
              </div>

              {/* Proposed Canonical Category Counts */}
              <div className="p-4 bg-white rounded-xl border border-[#E7DDD2] space-y-2">
                <span className="text-xs font-mono uppercase tracking-wider text-[#2B2625] font-semibold">
                  Missing Files Canonical Category Breakdown:
                </span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {Object.entries(auditSummary.categoryProposals).map(([cat, count]) => (
                    <span
                      key={cat}
                      className="px-2.5 py-1 rounded-full text-xs font-mono bg-[#FAF6F3] border border-[#E7DDD2] text-[#2B2625]"
                    >
                      <strong>{cat}</strong>: +{count}
                    </span>
                  ))}
                </div>
              </div>

              {/* Import Action Bar */}
              {auditSummary.missingCount > 0 && !importResult && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-amber-900">
                      Ready to import {auditSummary.missingCount} missing photograph(s)
                    </p>
                    <p className="text-[11px] text-amber-700">
                      Existing {auditSummary.existingCount} images will be safely skipped. No duplicate records will be created.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={runImport}
                    disabled={importing}
                    className="px-5 py-2.5 rounded-lg bg-[#2B2625] hover:bg-[#1C1817] text-white text-xs font-medium uppercase tracking-wider transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                  >
                    <HiCloudArrowUp className="w-4 h-4 text-[#C39E96]" />
                    <span>{importing ? 'Importing Photos...' : `Upload & Import Missing (${auditSummary.missingCount})`}</span>
                  </button>
                </div>
              )}

              {/* Import Success Banner */}
              {importResult && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2 text-emerald-900 font-semibold text-sm">
                    <HiCheckCircle className="w-5 h-5 text-emerald-600" />
                    <span>Import Completed Successfully!</span>
                  </div>
                  <p className="text-xs text-emerald-800">
                    Uploaded <strong>{importResult.importedCount}</strong> new image(s) to gallery records and skipped{' '}
                    <strong>{importResult.skippedCount}</strong> existing duplicate(s).
                  </p>
                  <div className="pt-2 border-t border-emerald-200/60">
                    <span className="text-xs font-mono uppercase text-emerald-900 font-semibold block mb-1">
                      Updated Category Totals:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(importResult.finalCategoryCounts).map(([cat, total]) => (
                        <span
                          key={cat}
                          className="px-2 py-0.5 rounded text-xs font-mono bg-white border border-emerald-200 text-emerald-900"
                        >
                          {cat}: {total}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Detailed File Inspector Table */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFilterTab('missing')}
                      className={`px-3 py-1 rounded-full text-xs font-mono transition-colors ${
                        filterTab === 'missing'
                          ? 'bg-[#2B2625] text-white'
                          : 'bg-[#FAF6F3] text-[#7C706D] hover:text-[#2B2625]'
                      }`}
                    >
                      Missing ({auditSummary.missingCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterTab('existing')}
                      className={`px-3 py-1 rounded-full text-xs font-mono transition-colors ${
                        filterTab === 'existing'
                          ? 'bg-[#2B2625] text-white'
                          : 'bg-[#FAF6F3] text-[#7C706D] hover:text-[#2B2625]'
                      }`}
                    >
                      Already in Gallery ({auditSummary.existingCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterTab('all')}
                      className={`px-3 py-1 rounded-full text-xs font-mono transition-colors ${
                        filterTab === 'all'
                          ? 'bg-[#2B2625] text-white'
                          : 'bg-[#FAF6F3] text-[#7C706D] hover:text-[#2B2625]'
                      }`}
                    >
                      All ({auditResults.length})
                    </button>
                  </div>
                  <span className="text-[11px] font-mono text-[#7C706D]">
                    Showing {filteredResults.length} files
                  </span>
                </div>

                <div className="border border-[#E7DDD2] rounded-xl overflow-hidden divide-y divide-[#E7DDD2] max-h-80 overflow-y-auto">
                  {filteredResults.map((item, idx) => (
                    <div
                      key={item.driveFileId || idx}
                      className="p-3 bg-white hover:bg-[#FAF6F3] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Thumbnail */}
                        <div className="w-10 h-10 rounded-lg bg-neutral-100 border border-[#E7DDD2] overflow-hidden shrink-0">
                          <img
                            src={item.directUrl}
                            alt={item.fileName}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[#2B2625] truncate">{item.fileName}</p>
                          <p className="text-[10px] font-mono text-[#7C706D]">
                            Folder: {item.folderName || 'Drive Folder'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.status === 'already_exists' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <HiCheck className="w-3.5 h-3.5" />
                            Already in Gallery ({item.canonicalCategoryLabel})
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-100 text-amber-800">
                              Missing
                            </span>
                            <select
                              value={categoryOverrides[item.driveFileId] || item.canonicalCategory}
                              onChange={(e) =>
                                setCategoryOverrides((prev) => ({
                                  ...prev,
                                  [item.driveFileId]: e.target.value,
                                }))
                              }
                              className="px-2 py-1 text-xs bg-[#FAF6F3] border border-[#E7DDD2] rounded text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                            >
                              {CANONICAL_CATEGORIES.map((cat) => (
                                <option key={cat.key} value={cat.key}>
                                  {cat.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E7DDD2] bg-[#FAF6F3] flex items-center justify-between text-xs text-[#7C706D]">
          <span>Indira Thakur Photography Media Engine</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#2B2625] hover:bg-[#1C1817] text-white text-xs font-medium uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
